#!/usr/bin/env python3
"""tracking-sync — reconcile docs/shared/story_src.csv with the team's tracking records.

Inputs:
  docs/shared/Jira.csv                          Jira board export — read-only, and the board source
  docs/shared/CS-57_Contribution_Tracker.xlsx   Contribution Log, Jira Statistics, Lists
Output (written only by `apply`):
  docs/shared/story_src.csv                     status, allocated_to, scrum
  docs/shared/CS-57_Contribution_Tracker.xlsx   snapshot tabs and appended log rows (tracker_xlsx.py)

The update rules are defined in docs/specs/tech-stack.md -> "Tracking data". This script
implements them; if the two ever disagree, the spec wins and this script must change.

`download` replaces the two snapshots with fresh copies before a report, using the credentials in
docs/.env (tech-stack.md -> "Downloading the snapshots"). It never writes to the board or the sheet.

Standard library only.

  python sync_tracking.py download [--root DIR]
  python sync_tracking.py report   [--git] [--fetch] [--plan PATH] [--root DIR] [--repo DIR]
  python sync_tracking.py apply    [--plan PATH]
"""

from __future__ import annotations

import argparse
import base64
import csv
import datetime as dt
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from collections import OrderedDict
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except (AttributeError, ValueError):
    pass

sys.path.insert(0, str(Path(__file__).resolve().parent))
import tracker_xlsx as tx  # noqa: E402

M = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS = {"m": M}
ACTIVE = {"In Progress", "In Review"}
DEFAULT_PLAN = Path(tempfile.gettempdir()) / "tracking-sync-plan.json"


# ---------------------------------------------------------------- locations


def find_root() -> Path:
    """The capstone folder: the nearest ancestor holding docs/shared/story_src.csv.

    Searched upward rather than by fixed depth, so moving the skill cannot break it.
    """
    for parent in Path(__file__).resolve().parents:
        if (parent / "docs" / "shared" / "story_src.csv").is_file():
            return parent
    sys.exit("Could not find docs/shared/story_src.csv above this script.")


# ---------------------------------------------------------------- readers


def read_xlsx(path: Path) -> dict[str, dict[int, dict[str, str]]]:
    """Every sheet as {row number: {column letter: cell text}}; empty cells omitted."""
    z = zipfile.ZipFile(path)
    shared: list[str] = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS):
            shared.append("".join(t.text or "" for t in si.iter(f"{{{M}}}t")))
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = {r.get("Id"): r.get("Target") for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))}
    sheets: dict[str, dict[int, dict[str, str]]] = {}
    for sh in wb.find("m:sheets", NS):
        target = rels[sh.get(f"{{{R}}}id")].lstrip("/")
        target = target if target.startswith("xl/") else "xl/" + target
        rows: dict[int, dict[str, str]] = {}
        for row in ET.fromstring(z.read(target)).iter(f"{{{M}}}row"):
            cells: dict[str, str] = {}
            for c in row.findall("m:c", NS):
                col = re.match(r"[A-Z]+", c.get("r")).group()
                kind, v, inline = c.get("t"), c.find("m:v", NS), c.find("m:is", NS)
                if kind == "s" and v is not None and v.text is not None:
                    text = shared[int(v.text)]
                elif kind == "inlineStr" and inline is not None:
                    text = "".join(t.text or "" for t in inline.iter(f"{{{M}}}t"))
                elif v is not None and v.text is not None:
                    text = v.text
                else:
                    continue
                text = text.strip()
                if text:
                    cells[col] = text
            if cells:
                rows[int(row.get("r"))] = cells
        sheets[sh.get("name")] = rows
    return sheets


def header_map(row: dict[str, str]) -> dict[str, str]:
    """Header text -> column letter, so a moved column cannot silently shift the data."""
    return {text: col for col, text in row.items()}


def excel_date(value: str) -> str:
    try:
        return (dt.date(1899, 12, 30) + dt.timedelta(days=int(float(value)))).isoformat()
    except (TypeError, ValueError):
        return value or ""


def pr_number(value: str) -> int | None:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def split_names(value: str) -> list[str]:
    return [n.strip() for n in re.split(r"[,\n]", value or "") if n.strip()]


def union(*lists: list[str]) -> list[str]:
    return list(OrderedDict.fromkeys(n for names in lists for n in names))


# ---------------------------------------------------------------- sources


class Names:
    def __init__(self, roster: list[str], aliases: dict[str, str]):
        self.roster = roster
        self.aliases = aliases
        self.unknown: set[str] = set()

    def norm(self, name: str) -> str:
        name = (name or "").strip()
        if not name:
            return ""
        if name in self.roster:
            return name
        if name in self.aliases:
            return self.aliases[name]
        for r in self.roster:
            if r.lower() == name.lower():
                return r
        self.unknown.add(name)
        return name


def load_tracker(path: Path) -> dict:
    sheets = read_xlsx(path)
    for needed in ("Contribution Log", "Jira Statistics", "Lists"):
        if needed not in sheets:
            sys.exit(f"Tracker is missing the '{needed}' tab.")

    lists = sheets["Lists"]
    lcols = header_map(lists[min(lists)])
    roster = [cells[lcols["Members"]] for r, cells in sorted(lists.items())
              if r > min(lists) and lcols.get("Members") in cells]

    log_sheet = sheets["Contribution Log"]
    hdr_row = min(log_sheet)
    h = header_map(log_sheet[hdr_row])
    # The first column was "Date merged" until the online sheet renamed it "Date" (2026-09-21).
    date_key = next((k for k in ("Date", "Date merged") if k in h), None)
    missing = ([] if date_key else ["Date"]) + [
        k for k in ("Member", "PR #", "Story ID", "Story complete?") if k not in h]
    if missing:
        sys.exit(f"Contribution Log header changed; missing columns: {missing}")
    log = []
    for r, cells in sorted(log_sheet.items()):
        if r == hdr_row:
            continue
        g = lambda k: cells.get(h.get(k, ""), "")
        log.append({
            "row": r, "date": excel_date(g(date_key)), "week": g("Week"),
            "member": g("Member"), "reviewer": g("Reviewed by"), "review_ok": g("Review OK?"),
            "pr": pr_number(g("PR #")), "story": g("Story ID"), "ticket": g("SCRUM ticket"),
            "complete": g("Story complete?"),
        })

    stats = sheets["Jira Statistics"]
    board, epics = {}, {}
    table_hdr = next((r for r, cells in sorted(stats.items())
                      if "Issue" in cells.values() and "Backlog story" in cells.values()), None)
    if table_hdr is None:
        sys.exit("Jira Statistics: could not find the 'Every issue on the board' table.")
    th = header_map(stats[table_hdr])
    for r, cells in sorted(stats.items()):
        if r > table_hdr and cells.get(th["Issue"], "").startswith("SCRUM-"):
            g = lambda k: cells.get(th.get(k, ""), "")
            board[g("Issue")] = {"type": g("Type"), "status": g("Status"),
                                 "assignee": g("Assignee"), "story": g("Backlog story")}
    for cells in stats.values():
        for text in cells.values():
            m = re.match(r"^([A-K]) - (.+)$", text)
            if m:
                epics[m.group(1)] = m.group(2)
    return {"roster": roster, "log": log, "board": board, "epics": epics, "sheets": sheets}


def load_jira(path: Path) -> dict:
    rows = list(csv.reader(io.open(path, encoding="utf-8-sig", newline="")))
    h = rows[0]

    def get(r, name):
        return " / ".join(r[i] for i, c in enumerate(h) if c == name and i < len(r) and r[i])

    return {get(r, "Issue key"): {"type": get(r, "Issue Type"), "status": get(r, "Status"),
                                  "assignee": get(r, "Assignee"), "summary": get(r, "Summary"),
                                  "description": get(r, "Description"), "parent": get(r, "Parent key"),
                                  "sprint": get(r, "Sprint")}
            for r in rows[1:] if get(r, "Issue key")}


def load_story_src(path: Path) -> tuple[bytes, list[list[str]]]:
    raw = path.read_bytes()
    return raw, list(csv.reader(io.StringIO(raw.decode("utf-8-sig"), newline="")))


def write_story_src(path: Path, rows: list[list[str]], bom: bool) -> None:
    buf = io.StringIO(newline="")
    csv.writer(buf, lineterminator="\r\n", quoting=csv.QUOTE_MINIMAL).writerows(rows)
    path.write_bytes((b"\xef\xbb\xbf" if bom else b"") + buf.getvalue().encode("utf-8"))


# ---------------------------------------------------------------- git


def git(repo: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True)


def pr_merge_state(repo: Path, prs: set[int], fetch: bool) -> dict[int, str]:
    if fetch:
        git(repo, "fetch", "-q", "origin", "+refs/pull/*/head:refs/remotes/pr/*",
            "+refs/heads/main:refs/remotes/origin/main")
    state = {}
    for n in sorted(prs):
        if git(repo, "rev-parse", "-q", "--verify", f"refs/remotes/pr/{n}").returncode != 0:
            state[n] = "unknown (no local ref — rerun with --fetch)"
        elif git(repo, "merge-base", "--is-ancestor", f"refs/remotes/pr/{n}", "origin/main").returncode == 0:
            state[n] = "merged"
        else:
            state[n] = "NOT merged"
    return state


# ---------------------------------------------------------------- rules

NOT_LISTED = {"Epic"} | tx.SUBTASK
ticket_number = tx.ticket_number


def board_story_links(jira: dict, story_ids: set[str]) -> dict[str, set[str]]:
    """Story -> board tickets whose Jira description names it.

    Subtasks are skipped: they inherit their parent's stories and are not listed.
    """
    links: dict[str, set[str]] = {}
    for key, t in jira.items():
        if t["type"] in NOT_LISTED:
            continue
        for sid in tx.story_refs(t.get("description", "")) & story_ids:
            links.setdefault(sid, set()).add(key)
    return links


def is_pending(entry: dict) -> bool:
    """A row whose Review OK? is blank records a PR opened and awaiting review — not merged."""
    return not (entry.get("review_ok") or "").strip()


def review_passed(entry: dict) -> bool:
    return (entry.get("review_ok") or "").strip().upper() == "OK"


def propose(stories, ix, board, log, names, links=None) -> tuple[list[dict], list[str]]:
    """Apply the tech-stack.md update rules. Returns (changes, notices)."""
    links = links or {}
    changes, notices = [], []
    by_story: dict[str, list[dict]] = {}
    for entry in log:
        if entry["story"]:
            by_story.setdefault(entry["story"], []).append(entry)
    for sid in by_story:
        if sid not in stories and sid != "-":
            notices.append(f"Tracker logs story '{sid}', which is not in story_src.csv.")

    for sid, row in stories.items():
        st, al, old_scrum = row[ix["status"]], row[ix["allocated_to"]], row[ix["scrum"]]
        tickets = [t.strip() for t in old_scrum.split(",") if t.strip()]
        added = links.get(sid, set()) - set(tickets)
        new_scrum = old_scrum
        if added:  # additions only — curated links are never removed automatically
            tickets = sorted(tickets + sorted(added), key=ticket_number)
            new_scrum = (",\n" if "\n" in old_scrum else ", ").join(tickets)
        statuses = [board[t]["status"] for t in tickets if t in board]
        for t in tickets:
            if t not in board:
                notices.append(f"{sid}: ticket {t} is not on the board snapshot.")
        entries = sorted(by_story.get(sid, []), key=lambda e: (e["date"], e["row"]))
        story_entries = [e for e in entries if not e["complete"].startswith("N/A")]
        latest = story_entries[-1] if story_entries else None
        deliverers = union([names.norm(e["member"]) for e in entries if e["member"]])
        assignees = union([names.norm(board[t]["assignee"]) for t in tickets
                           if t in board and board[t]["assignee"]])

        # status
        # A row is logged when its PR is opened; Review OK? stays blank until a reviewer passes it.
        # So a "Yes" counts only once Review OK? is OK — pending means in review, and SELF-REVIEW
        # fails the Definition of Done (tech-stack.md -> Tracking data, recorded 2026-09-18).
        claimed = bool(latest) and latest["complete"].startswith("Yes")
        reviewed = claimed and review_passed(latest)
        new_st = st
        if st in ("done", "dropped"):
            pass  # never downgraded automatically
        elif reviewed:
            new_st = "done"
        elif statuses and len(statuses) == len(tickets) and all(s == "Done" for s in statuses):
            new_st = "done"
        elif (any(s in ACTIVE for s in statuses) or claimed
              or (latest and latest["complete"].startswith("No"))):
            new_st = "working"
        elif tickets and statuses and all(s == "To Do" for s in statuses) and not entries:
            new_st = ""

        # allocation
        existing = [names.norm(n) for n in split_names(al)]
        if new_st == "done":
            names_new = union(existing, deliverers)
        elif new_st == "working":
            names_new = union(assignees, deliverers) or existing
        elif new_st == "":
            names_new = union(existing, assignees)
        else:
            names_new = existing
        new_al = ", ".join(names_new)

        for col, old, new in (("scrum", old_scrum, new_scrum), ("status", st, new_st),
                              ("allocated_to", al, new_al)):
            if old != new:
                changes.append({"id": sid, "column": col, "old": old, "new": new})

        if new_st == "done" and statuses and not all(s == "Done" for s in statuses):
            ticket_states = ", ".join(f"{t}={board[t]['status']}" for t in tickets if t in board)
            if reviewed:
                notices.append(f"{sid}: complete in the tracker, but board tickets are {ticket_states} "
                               f"— move them to Done.")
            else:
                notices.append(f"{sid}: done in story_src.csv with no tracker entry; board tickets are "
                               f"{ticket_states} — confirm, then move them to Done.")
        if claimed and not reviewed:
            why = ("its review is still pending" if is_pending(latest)
                   else f"it is marked {latest['review_ok']}, not OK")
            notices.append(f"{sid}: the tracker's latest row says the story is complete, but {why} — "
                           f"counted as working, not done.")
        for e in entries:
            if e["ticket"] and e["ticket"] not in tickets:
                notices.append(f"{sid}: tracker row {e['row']} names {e['ticket']}, which story_src.csv "
                               f"does not map to this story.")
    return changes, notices


def epic_table(stories, ix, epic_names) -> str:
    groups: "OrderedDict[str, dict[str, list[str]]]" = OrderedDict()
    for sid, row in stories.items():
        g = groups.setdefault(row[ix["epic"]], {"done": [], "working": [], "": [], "dropped": []})
        g.setdefault(row[ix["status"]], []).append(sid)
    lines = ["| Epic | Stories | Complete | In progress | Not started | Discarded |",
             "| --- | --- | --- | --- | --- | --- |"]
    tot = {"all": 0, "done": 0, "working": 0, "": 0, "dropped": 0}
    for epic, g in groups.items():
        n = sum(len(v) for v in g.values())
        cell = lambda k: ", ".join(g[k]) or "—"
        lines.append(f"| {epic} — {epic_names.get(epic, '')} | {n} | {cell('done')} | {cell('working')} | "
                     f"{cell('')} | {cell('dropped')} |")
        tot["all"] += n
        for k in ("done", "working", "", "dropped"):
            tot[k] += len(g[k])
    lines.append(f"| **Total** | **{tot['all']}** | **{tot['done']}** | **{tot['working']}** | "
                 f"**{tot['']}** | **{tot['dropped']}** |")
    return "\n".join(lines)


# ---------------------------------------------------------------- commands


def unlogged_prs(repo: Path, log: list[dict], names: Names) -> tuple[list[dict], list[str]]:
    """PRs merged into origin/main from the team's GitHub owner that no Contribution Log row names."""
    url = git(repo, "remote", "get-url", "origin").stdout.strip()
    m = re.search(r"github\.com[:/]([^/]+)/([^/]+?)(?:\.git)?$", url)
    if not m:
        return [], [f"Could not read the GitHub owner from {repo}'s origin remote; unlogged PRs were not checked."]
    owner, repo_name = m.groups()
    logged = {e["pr"] for e in log if e["pr"]}
    out = git(repo, "log", "--merges", "--first-parent", "origin/main", "--format=%H%x09%cI%x09%s").stdout
    rows, notes = [], []
    for line in out.splitlines():
        fields = line.split("\t", 2)
        if len(fields) < 3:
            continue
        sha, when, subject = fields
        pm = re.match(r"Merge pull request #(\d+) from ([^/\s]+)/", subject)
        if not pm or pm.group(2) != owner or int(pm.group(1)) in logged:
            continue
        n = int(pm.group(1))
        author = git(repo, "log", "-1", "--format=%an", f"{sha}^2").stdout.strip()
        member = names.norm(author)
        if member not in names.roster:
            names.unknown.discard(author)
            notes.append(f"PR #{n}: head-commit author '{author}' is not on the roster — its appended row "
                         f"leaves Member blank.")
            member = ""
        day = dt.date.fromisoformat(when[:10])
        rows.append({"pr": n, "date": day.isoformat(), "serial": tx.excel_serial(day), "member": member,
                     "link": f"https://github.com/{owner}/{repo_name}/pull/{n}"})
    return sorted(rows, key=lambda r: (r["date"], r["pr"])), notes


def input_paths(root: Path) -> tuple[Path, Path, Path]:
    shared = root / "docs" / "shared"
    return shared / "CS-57_Contribution_Tracker.xlsx", shared / "Jira.csv", shared / "story_src.csv"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_all(root: Path) -> dict:
    tracker_path, jira_path, csv_path = input_paths(root)
    for p in (tracker_path, jira_path, csv_path):
        if not p.is_file():
            sys.exit(f"Missing input: {p}")
    tracker = load_tracker(tracker_path)
    aliases = json.loads((Path(__file__).with_name("aliases.json")).read_text(encoding="utf-8"))
    raw, rows = load_story_src(csv_path)
    return {"tracker_path": tracker_path, "jira_path": jira_path, "csv_path": csv_path, "tracker": tracker,
            "jira": load_jira(jira_path), "names": Names(tracker["roster"], aliases), "raw": raw, "rows": rows,
            "ix": {c: i for i, c in enumerate(rows[0])}}


def with_changes(rows: list[list[str]], ix: dict, changes: list[dict]) -> "OrderedDict[str, list[str]]":
    preview = [list(r) for r in rows]
    by_id = {r[ix["id"]]: r for r in preview[1:]}
    for c in changes:
        by_id[c["id"]][ix[c["column"]]] = c["new"]
    return OrderedDict((r[ix["id"]], r) for r in preview[1:])


# -- download -------------------------------------------------------------------------------------

BOM = b"\xef\xbb\xbf"
ENV_KEYS = ("JIRA_URL", "JIRA_EMAIL", "JIRA_API_TOKEN", "TRACKER_URL")
# The columns load_jira reads. The export's header can legitimately change shape — Jira repeats
# "Sprint" once per sprint the busiest issue has been in — so these are checked, not the whole row.
JIRA_COLUMNS = ("Issue key", "Issue Type", "Status", "Assignee", "Summary", "Description", "Parent key", "Sprint")
TRACKER_TABS = {"Start Here", "Contribution Log", "Dashboard", "Jira Statistics", "Lists", "Client Report"}
# The export caps a search at this many issues; reaching it means the file may be truncated.
JIRA_EXPORT_CAP = 1000


def read_env(path: Path) -> dict[str, str]:
    """Parse docs/.env, whose lines are `KEY = value` — spaces round `=` and quotes are allowed."""
    env = {}
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def fetch(url: str, headers: dict[str, str], what: str) -> bytes:
    """GET a URL. Failures name the source and the status only, never the URL: it carries the sheet id."""
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=90) as resp:
            return resp.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"Download failed: {what} returned HTTP {e.code}. Nothing was replaced.")
    except urllib.error.URLError as e:
        sys.exit(f"Download failed: {what} is unreachable ({type(e.reason).__name__}). Nothing was replaced.")


def fetch_jira(env: dict[str, str]) -> bytes:
    """The board's all-fields CSV export — the file the Export button produces.

    Ordered by created DESC, as the board lists issues, and given the byte-order mark a manual
    download carries, so the result is byte-identical to one (verified 2026-09-18).
    """
    host = urllib.parse.urlparse(env["JIRA_URL"]).netloc
    auth = base64.b64encode(f"{env['JIRA_EMAIL']}:{env['JIRA_API_TOKEN']}".encode()).decode()
    jql = urllib.parse.quote("project = SCRUM ORDER BY created DESC")
    url = (f"https://{host}/sr/jira.issueviews:searchrequest-csv-all-fields/temp/SearchRequest.csv"
           f"?jqlQuery={jql}&tempMax={JIRA_EXPORT_CAP}")
    body = fetch(url, {"Authorization": "Basic " + auth, "User-Agent": "cs57-tracking-sync"}, "the Jira export")
    return body if body.startswith(BOM) else BOM + body


def fetch_tracker(env: dict[str, str]) -> bytes:
    """The sheet's xlsx export. The sheet is viewable by link, so no Google credential is needed."""
    match = re.search(r"/spreadsheets/d/([A-Za-z0-9_-]+)", urllib.parse.urlparse(env["TRACKER_URL"]).path)
    if not match:
        sys.exit("docs/.env: TRACKER_URL is not a Google Sheets link. Nothing was replaced.")
    url = f"https://docs.google.com/spreadsheets/d/{match.group(1)}/export?format=xlsx"
    return fetch(url, {"User-Agent": "cs57-tracking-sync"}, "the tracker export")


def check_jira(body: bytes, tmp: Path) -> int:
    """Refuse anything the report could not read. Returns the number of issues."""
    try:
        header = next(csv.reader(io.StringIO(body.decode("utf-8-sig"), newline="")))
    except (UnicodeDecodeError, StopIteration):
        sys.exit("Download failed: the Jira export is not a CSV — probably a sign-in page. Nothing was replaced.")
    missing = [c for c in JIRA_COLUMNS if c not in header]
    if missing:
        sys.exit(f"Download failed: the Jira export lacks {', '.join(missing)}. Nothing was replaced.")
    path = tmp / "Jira.csv"
    path.write_bytes(body)
    issues = load_jira(path)
    if not issues:
        sys.exit("Download failed: the Jira export holds no issues. Nothing was replaced.")
    if len(issues) >= JIRA_EXPORT_CAP:
        sys.exit(f"Download failed: the Jira export reached its {JIRA_EXPORT_CAP}-issue cap and may be "
                 f"truncated. Nothing was replaced.")
    return len(issues)


def check_tracker(body: bytes, tmp: Path) -> None:
    """Refuse anything the report could not read: a sign-in page, or a workbook missing a tab."""
    if body[:2] != b"PK":
        sys.exit("Download failed: the tracker export is not a workbook — the sheet is probably no longer "
                 "viewable by link. Nothing was replaced.")
    tabs = set(re.findall(r'<sheet [^>]*name="([^"]+)"',
                          zipfile.ZipFile(io.BytesIO(body)).read("xl/workbook.xml").decode("utf-8")))
    if TRACKER_TABS - tabs:
        sys.exit(f"Download failed: the tracker export lacks {', '.join(sorted(TRACKER_TABS - tabs))}. "
                 f"Nothing was replaced.")
    path = tmp / "tracker.xlsx"
    path.write_bytes(body)
    load_tracker(path)


def replace(path: Path, body: bytes, backup: Path) -> str:
    if path.is_file() and path.read_bytes() == body:
        return "unchanged"
    if path.is_file():
        shutil.copy2(path, backup / path.name)
    staged = path.with_name(path.name + ".download")
    staged.write_bytes(body)
    try:
        os.replace(staged, path)
    except PermissionError:
        staged.unlink(missing_ok=True)
        sys.exit(f"Could not replace {path.name} — close it in Excel and run download again.")
    return "replaced"


def cmd_download(args) -> None:
    root = Path(args.root).resolve() if args.root else find_root()
    env_path = root / "docs" / ".env"
    if not env_path.is_file():
        sys.exit(f"Missing {env_path} — see tech-stack.md -> Downloading the snapshots.")
    env = read_env(env_path)
    missing = [k for k in ENV_KEYS if not env.get(k)]
    if missing:
        sys.exit(f"docs/.env lacks {', '.join(missing)}. Nothing was downloaded.")
    tracker_path, jira_path, _ = input_paths(root)

    # All or nothing: both are fetched and checked before either replaces the copy in shared/.
    jira, tracker = fetch_jira(env), fetch_tracker(env)
    with tempfile.TemporaryDirectory() as tmp:
        issues = check_jira(jira, Path(tmp))
        check_tracker(tracker, Path(tmp))

    backup = Path(tempfile.mkdtemp(prefix="tracking-sync-previous-"))
    stamp = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    print(f"Downloaded {stamp}:")
    print(f"  {jira_path.name:34} {replace(jira_path, jira, backup):9} {issues} issues, {len(jira)} bytes")
    print(f"  {tracker_path.name:34} {replace(tracker_path, tracker, backup):9} {len(tracker)} bytes")
    if any(backup.iterdir()):
        print(f"Previous copies kept in {backup}")
    else:
        backup.rmdir()
    print("Next: run report.")


def cmd_report(args) -> None:
    root = Path(args.root).resolve() if args.root else find_root()
    ctx = load_all(root)
    tracker, jira, names, rows, ix = ctx["tracker"], ctx["jira"], ctx["names"], ctx["rows"], ctx["ix"]
    tracker_path, jira_path, csv_path = ctx["tracker_path"], ctx["jira_path"], ctx["csv_path"]
    stories = OrderedDict((r[ix["id"]], r) for r in rows[1:])

    # Board: always Jira.csv. The tracker's Jira Statistics tab is a snapshot of it that apply refreshes.
    links = board_story_links(jira, set(stories))
    changes, notices = propose(stories, ix, jira, tracker["log"], names, links)
    mapped = {t.strip() for r in rows[1:] for t in r[ix["scrum"]].split(",") if t.strip()}
    mapped |= {t for ts in links.values() for t in ts}
    for key in sorted(jira, key=ticket_number):
        if jira[key]["type"] not in NOT_LISTED and key not in mapped:
            notices.append(f"{key} ({jira[key]['summary'][:60]}) is on the board but maps to no story.")
    stale = [key for key, a in jira.items() if a["type"] != "Epic" and (
        key not in tracker["board"] or tracker["board"][key]["status"] != a["status"]
        or names.norm(tracker["board"][key]["assignee"]) != names.norm(a["assignee"]))]

    repo = Path(args.repo).resolve() if args.repo else root / "hej"
    appends, append_notes = unlogged_prs(repo, tracker["log"], names) if args.git else ([], [])
    preview = with_changes(rows, ix, changes)
    today = dt.date.today()
    parts, summary = tx.build(tracker_path, tracker["sheets"], jira, preview, ix, names, today, appends)

    stamp = lambda p: f"{dt.datetime.fromtimestamp(p.stat().st_mtime):%Y-%m-%d %H:%M}"
    print("# tracking-sync report\n")
    print(f"- Tracker: {tracker_path.name} (modified {stamp(tracker_path)})")
    print(f"- Jira export: {jira_path.name} (modified {stamp(jira_path)})")
    print("- Board source: **Jira.csv** — always; the tracker's Jira Statistics tab is a snapshot of it")
    print(f"- Logged PR rows: {sum(1 for e in tracker['log'] if e['pr'])}; roster: {', '.join(tracker['roster'])}\n")

    print(f"## Proposed changes to story_src.csv ({len(changes)})\n")
    if changes:
        print("| Story | Column | Current | Proposed |\n| --- | --- | --- | --- |")
        for c in changes:
            print(f"| {c['id']} | {c['column']} | {c['old'] or '(blank)'} | {c['new'] or '(blank)'} |")
    else:
        print("None — story_src.csv already matches the records.")

    print(f"\n## Proposed changes to {tracker_path.name}\n")
    print(tx.render(summary))

    print("\n## Record checks\n")
    checks = list(notices)
    def label(n: int) -> str:
        stories_for = sorted({e["story"] for e in tracker["log"] if e["pr"] == n and e["story"]})
        return f"PR #{n} ({', '.join(stories_for) or 'no story'})"

    pending = sorted({e["pr"] for e in tracker["log"] if e["pr"] and is_pending(e)})
    reviewed = {e["pr"] for e in tracker["log"] if e["pr"] and not is_pending(e)}
    for e in tracker["log"]:
        if not e["pr"] or is_pending(e):
            continue  # a pending row has no reviewer yet by design
        if not e["reviewer"]:
            checks.append(f"{label(e['pr'])}: Review OK? is {e['review_ok']} but no reviewer is recorded.")
        elif names.norm(e["reviewer"]) == names.norm(e["member"]):
            checks.append(f"{label(e['pr'])}: self-review by {e['member']}.")
    if args.git:
        state_of = pr_merge_state(repo, set(pending) | reviewed, args.fetch)
        for n in sorted(reviewed):
            if state_of.get(n) != "merged":
                checks.append(f"{label(n)}: reviewed in the tracker, but git says {state_of.get(n)}.")
        for n in pending:
            if state_of.get(n) == "merged":
                checks.append(f"{label(n)}: merged, but the tracker still shows it awaiting review — "
                              f"record the review.")
    else:
        checks.append("Unlogged merged PRs were not checked — rerun with --git.")
    if pending:
        checks.append("Awaiting review (logged when opened, not yet reviewed): "
                      + ", ".join(label(n) for n in pending) + ".")
    checks += append_notes
    if stale:
        checks.append(f"The tracker's Jira Statistics snapshot differs from Jira.csv on {len(stale)} issue(s) — "
                      f"apply refreshes it.")
    for u in sorted(names.unknown):
        checks.append(f"Unknown name '{u}' — add it to scripts/aliases.json.")
    print("\n".join(f"- {c}" for c in checks) if checks else "None.")

    print("\n## Epic snapshot after these changes (for specs/mission.md)\n")
    print(epic_table(preview, ix, tracker["epics"]))

    plan = {"generated": dt.datetime.now().isoformat(timespec="seconds"), "csv": str(csv_path),
            "csv_sha256": hashlib.sha256(ctx["raw"]).hexdigest(), "changes": changes, "tracker": None}
    if parts:
        plan["tracker"] = {"path": str(tracker_path), "sha256": sha256(tracker_path),
                           "jira_sha256": sha256(jira_path), "today": today.isoformat(), "appends": appends,
                           "parts": {p: hashlib.sha256(b).hexdigest() for p, b in parts.items()}}
    Path(args.plan).write_text(json.dumps(plan, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nPlan written to {args.plan}")


def cmd_apply(args) -> None:
    plan = json.loads(Path(args.plan).read_text(encoding="utf-8"))
    csv_path = Path(plan["csv"])
    root = csv_path.parents[2]
    tracker_path, jira_path, _ = input_paths(root)
    jira_before = (jira_path.stat().st_size, jira_path.stat().st_mtime_ns)
    tplan = plan.get("tracker")

    tracked = {"status", "allocated_to", "scrum"}
    stray = [c for c in plan["changes"] if c["column"] not in tracked]
    if stray:
        sys.exit(f"ABORT: plan touches columns outside {sorted(tracked)}: {stray}")
    if not plan["changes"] and not tplan:
        print("Nothing to apply.")
        return

    ctx = load_all(root)
    raw, rows = ctx["raw"], ctx["rows"]
    if hashlib.sha256(raw).hexdigest() != plan["csv_sha256"]:
        sys.exit("ABORT: story_src.csv changed since the report. Run report again.")
    ix = ctx["ix"]
    by_id = {r[ix["id"]]: r for r in rows[1:]}
    bad = [c for c in plan["changes"] if by_id[c["id"]][ix[c["column"]]] != c["old"]]
    if bad:
        sys.exit(f"ABORT: current values differ from the plan: {bad}")

    # Work out the tracker before writing anything, so a mismatch leaves both files untouched.
    parts, summary = {}, None
    if tplan:
        if sha256(tracker_path) != tplan["sha256"]:
            sys.exit("ABORT: the tracker changed since the report. Run report again.")
        if sha256(jira_path) != tplan["jira_sha256"]:
            sys.exit("ABORT: Jira.csv changed since the report. Run report again.")
        preview = with_changes(rows, ix, plan["changes"])
        parts, summary = tx.build(tracker_path, ctx["tracker"]["sheets"], ctx["jira"], preview, ix, ctx["names"],
                                  dt.date.fromisoformat(tplan["today"]), tplan["appends"])
        if {p: hashlib.sha256(b).hexdigest() for p, b in parts.items()} != tplan["parts"]:
            sys.exit("ABORT: the tracker changes no longer match the report. Run report again.")

    if plan["changes"]:
        original = [list(r) for r in rows]
        for c in plan["changes"]:
            by_id[c["id"]][ix[c["column"]]] = c["new"]
        write_story_src(csv_path, rows, bom=raw.startswith(b"\xef\xbb\xbf"))
        _, after_rows = load_story_src(csv_path)
        diffs = [(a[0], original[0][j], a[j], b[j]) for a, b in zip(original[1:], after_rows[1:])
                 for j in range(len(original[0])) if a[j] != b[j]]
        assert after_rows[0] == original[0], "header changed"
        assert len(after_rows) == len(original), "row count changed"
        assert {(d[0], d[1]) for d in diffs} == {(c["id"], c["column"]) for c in plan["changes"]}, \
            "unexpected cells changed"
        print(f"Applied {len(diffs)} change(s) to {csv_path.name}:")
        for sid, col, old, new in diffs:
            print(f"  {sid:<3} {col:<13} {old or '(blank)'} -> {new or '(blank)'}")

    if parts:
        tx.write(tracker_path, parts, summary)
        print(f"Applied tracker changes to {tracker_path.name}: {', '.join(summary['parts'])}")
        if summary["appended"]:
            print("  Appended log rows: " + ", ".join(f"row {rn} (PR #{a['pr']})" for rn, a in summary["appended"]))
        print("Verified: only the planned workbook parts changed, and every existing Contribution Log row is "
              "byte-for-byte unchanged.")
        print("Next: copy the refreshed Jira Statistics and Lists tabs, and any appended log rows, into the "
              "online tracker.")

    assert (jira_path.stat().st_size, jira_path.stat().st_mtime_ns) == jira_before, "Jira.csv was modified"
    print("Verified: Jira.csv untouched.")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    dp = sub.add_parser("download", help="replace Jira.csv and the tracker with fresh copies (docs/.env)")
    dp.add_argument("--root", help="capstone folder holding docs/ (default: found above this script)")
    rp = sub.add_parser("report", help="read-only: propose changes and list record checks")
    rp.add_argument("--git", action="store_true", help="check logged PRs are merged and find merged PRs not logged")
    rp.add_argument("--fetch", action="store_true", help="with --git: fetch PR refs first")
    rp.add_argument("--plan", default=str(DEFAULT_PLAN), help="where to write the plan JSON")
    rp.add_argument("--root", help="capstone folder holding docs/shared (default: found above this script)")
    rp.add_argument("--repo", help="the hej git repository (default: <root>/hej)")
    pp = sub.add_parser("apply", help="write the planned changes to story_src.csv and the tracker")
    pp.add_argument("--plan", default=str(DEFAULT_PLAN))
    args = ap.parse_args()
    {"download": cmd_download, "report": cmd_report, "apply": cmd_apply}[args.cmd](args)


if __name__ == "__main__":
    main()
