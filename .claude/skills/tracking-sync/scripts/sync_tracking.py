#!/usr/bin/env python3
"""tracking-sync — reconcile docs/shared/story_src.csv with the team's tracking records.

Read-only inputs (never written):
  docs/shared/CS-57_Contribution_Tracker.xlsx   Contribution Log, Jira Statistics, Lists
  docs/shared/Jira.csv                          Jira board export
Output (written only by `apply`):
  docs/shared/story_src.csv                     data behind user-stories.html

The update rules are defined in docs/specs/tech-stack.md -> "Tracking data". This script
implements them; if the two ever disagree, the spec wins and this script must change.

Standard library only.

  python sync_tracking.py report [--git] [--fetch] [--plan PATH]
  python sync_tracking.py apply  --plan PATH
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import io
import json
import re
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
import zipfile
from collections import OrderedDict
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except (AttributeError, ValueError):
    pass

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
    missing = [k for k in ("Date merged", "Member", "PR #", "Story ID", "Story complete?") if k not in h]
    if missing:
        sys.exit(f"Contribution Log header changed; missing columns: {missing}")
    log = []
    for r, cells in sorted(log_sheet.items()):
        if r == hdr_row:
            continue
        g = lambda k: cells.get(h.get(k, ""), "")
        log.append({
            "row": r, "date": excel_date(g("Date merged")), "week": g("Week"),
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
    return {"roster": roster, "log": log, "board": board, "epics": epics}


def load_jira(path: Path) -> dict:
    rows = list(csv.reader(io.open(path, encoding="utf-8-sig", newline="")))
    h = rows[0]

    def get(r, name):
        return " / ".join(r[i] for i, c in enumerate(h) if c == name and i < len(r) and r[i])

    return {get(r, "Issue key"): {"type": get(r, "Issue Type"), "status": get(r, "Status"),
                                  "assignee": get(r, "Assignee")} for r in rows[1:] if get(r, "Issue key")}


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


def propose(stories, ix, board, log, names) -> tuple[list[dict], list[str]]:
    """Apply the tech-stack.md update rules. Returns (changes, notices)."""
    changes, notices = [], []
    by_story: dict[str, list[dict]] = {}
    for entry in log:
        if entry["story"]:
            by_story.setdefault(entry["story"], []).append(entry)
    for sid in by_story:
        if sid not in stories and sid != "-":
            notices.append(f"Tracker logs story '{sid}', which is not in story_src.csv.")

    for sid, row in stories.items():
        st, al = row[ix["status"]], row[ix["allocated_to"]]
        tickets = [t.strip() for t in row[ix["scrum"]].split(",") if t.strip()]
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
        new_st = st
        if st in ("done", "dropped"):
            pass  # never downgraded automatically
        elif latest and latest["complete"].startswith("Yes"):
            new_st = "done"
        elif statuses and len(statuses) == len(tickets) and all(s == "Done" for s in statuses):
            new_st = "done"
        elif any(s in ACTIVE for s in statuses) or (latest and latest["complete"].startswith("No")):
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

        for col, old, new in (("status", st, new_st), ("allocated_to", al, new_al)):
            if old != new:
                changes.append({"id": sid, "column": col, "old": old, "new": new})

        if new_st == "done" and statuses and not all(s == "Done" for s in statuses):
            ticket_states = ", ".join(f"{t}={board[t]['status']}" for t in tickets if t in board)
            if latest and latest["complete"].startswith("Yes"):
                notices.append(f"{sid}: complete in the tracker, but board tickets are {ticket_states} "
                               f"— move them to Done.")
            else:
                notices.append(f"{sid}: done in story_src.csv with no tracker entry; board tickets are "
                               f"{ticket_states} — confirm, then move them to Done.")
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


def cmd_report(args) -> None:
    root = find_root()
    shared = root / "docs" / "shared"
    tracker_path, jira_path, csv_path = (shared / "CS-57_Contribution_Tracker.xlsx",
                                         shared / "Jira.csv", shared / "story_src.csv")
    for p in (tracker_path, jira_path, csv_path):
        if not p.is_file():
            sys.exit(f"Missing input: {p}")

    tracker = load_tracker(tracker_path)
    jira = load_jira(jira_path)
    aliases = json.loads((Path(__file__).with_name("aliases.json")).read_text(encoding="utf-8"))
    names = Names(tracker["roster"], aliases)
    raw, rows = load_story_src(csv_path)
    ix = {c: i for i, c in enumerate(rows[0])}
    stories = OrderedDict((r[ix["id"]], r) for r in rows[1:])

    # Board: whichever download is newer; disagreements are reported, not guessed.
    tracker_newer = tracker_path.stat().st_mtime >= jira_path.stat().st_mtime
    primary, secondary = (tracker["board"], jira) if tracker_newer else (jira, tracker["board"])
    board_name = "tracker snapshot" if tracker_newer else "Jira.csv"
    disagreements = []
    for key, a in primary.items():
        b = secondary.get(key)
        if not b or a.get("type") == "Epic":
            continue
        if a["status"] != b["status"] or names.norm(a["assignee"]) != names.norm(b["assignee"]):
            disagreements.append(f"{key}: {board_name} {a['status']}/{names.norm(a['assignee']) or '-'} vs "
                                 f"other {b['status']}/{names.norm(b['assignee']) or '-'}")

    changes, notices = propose(stories, ix, primary, tracker["log"], names)

    print("# tracking-sync report\n")
    print(f"- Tracker: {tracker_path.name} (modified {dt.datetime.fromtimestamp(tracker_path.stat().st_mtime):%Y-%m-%d %H:%M})")
    print(f"- Jira export: {jira_path.name} (modified {dt.datetime.fromtimestamp(jira_path.stat().st_mtime):%Y-%m-%d %H:%M})")
    print(f"- Board source used: **{board_name}** (newer download)")
    print(f"- Logged PR rows: {sum(1 for e in tracker['log'] if e['pr'])}; roster: {', '.join(tracker['roster'])}\n")

    print(f"## Proposed changes to story_src.csv ({len(changes)})\n")
    if changes:
        print("| Story | Column | Current | Proposed |\n| --- | --- | --- | --- |")
        for c in changes:
            print(f"| {c['id']} | {c['column']} | {c['old'] or '(blank)'} | {c['new'] or '(blank)'} |")
    else:
        print("None — story_src.csv already matches the records.")

    print("\n## Record checks\n")
    checks = list(notices)
    for e in tracker["log"]:
        if e["pr"] and not e["reviewer"]:
            checks.append(f"PR #{e['pr']} ({e['story'] or 'no story'}): no reviewer recorded.")
        elif e["pr"] and names.norm(e["reviewer"]) == names.norm(e["member"]):
            checks.append(f"PR #{e['pr']} ({e['story'] or 'no story'}): self-review by {e['member']}.")
    if args.git:
        repo = root / "hej"
        prs = {e["pr"] for e in tracker["log"] if e["pr"]}
        for n, state in pr_merge_state(repo, prs, args.fetch).items():
            if state != "merged":
                stories_for = sorted({e["story"] for e in tracker["log"] if e["pr"] == n and e["story"]})
                checks.append(f"PR #{n} ({', '.join(stories_for) or 'no story'}): logged as merged, git says {state}.")
    for d in disagreements:
        checks.append(f"Board sources disagree — {d}")
    for u in sorted(names.unknown):
        checks.append(f"Unknown name '{u}' — add it to scripts/aliases.json.")
    print("\n".join(f"- {c}" for c in checks) if checks else "None.")

    preview = [list(r) for r in rows]
    pix = {r[ix["id"]]: r for r in preview[1:]}
    for c in changes:
        pix[c["id"]][ix[c["column"]]] = c["new"]
    print("\n## Epic snapshot after these changes (for specs/mission.md)\n")
    print(epic_table(OrderedDict((r[ix["id"]], r) for r in preview[1:]), ix, tracker["epics"]))

    plan = {"generated": dt.datetime.now().isoformat(timespec="seconds"), "csv": str(csv_path),
            "csv_sha256": hashlib.sha256(raw).hexdigest(), "changes": changes}
    Path(args.plan).write_text(json.dumps(plan, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nPlan written to {args.plan}")


def cmd_apply(args) -> None:
    plan = json.loads(Path(args.plan).read_text(encoding="utf-8"))
    csv_path = Path(plan["csv"])
    shared = csv_path.parent
    guarded = [shared / "CS-57_Contribution_Tracker.xlsx", shared / "Jira.csv"]
    before = {p: (p.stat().st_size, p.stat().st_mtime_ns) for p in guarded if p.exists()}

    raw, rows = load_story_src(csv_path)
    if hashlib.sha256(raw).hexdigest() != plan["csv_sha256"]:
        sys.exit("ABORT: story_src.csv changed since the report. Run report again.")
    if not plan["changes"]:
        print("Nothing to apply.")
        return
    ix = {c: i for i, c in enumerate(rows[0])}
    by_id = {r[ix["id"]]: r for r in rows[1:]}
    bad = [c for c in plan["changes"] if by_id[c["id"]][ix[c["column"]]] != c["old"]]
    if bad:
        sys.exit(f"ABORT: current values differ from the plan: {bad}")
    original = [list(r) for r in rows]
    for c in plan["changes"]:
        by_id[c["id"]][ix[c["column"]]] = c["new"]
    write_story_src(csv_path, rows, bom=raw.startswith(b"\xef\xbb\xbf"))

    _, after_rows = load_story_src(csv_path)
    diffs = [(a[0], original[0][j], a[j], b[j]) for a, b in zip(original[1:], after_rows[1:])
             for j in range(len(original[0])) if a[j] != b[j]]
    expected = {(c["id"], c["column"]) for c in plan["changes"]}
    assert after_rows[0] == original[0], "header changed"
    assert len(after_rows) == len(original), "row count changed"
    assert {(d[0], d[1]) for d in diffs} == expected, "unexpected cells changed"
    after = {p: (p.stat().st_size, p.stat().st_mtime_ns) for p in guarded if p.exists()}
    assert before == after, "a read-only input was modified"

    print(f"Applied {len(diffs)} change(s) to {csv_path.name}:")
    for sid, col, old, new in diffs:
        print(f"  {sid:<3} {col:<13} {old or '(blank)'} -> {new or '(blank)'}")
    print("Verified: header and row count unchanged, only planned cells changed, tracker and Jira.csv untouched.")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    rp = sub.add_parser("report", help="read-only: propose changes and list record checks")
    rp.add_argument("--git", action="store_true", help="check that logged PRs are merged into origin/main")
    rp.add_argument("--fetch", action="store_true", help="with --git: fetch PR refs first")
    rp.add_argument("--plan", default=str(DEFAULT_PLAN), help="where to write the plan JSON")
    pp = sub.add_parser("apply", help="write the planned changes to story_src.csv")
    pp.add_argument("--plan", default=str(DEFAULT_PLAN))
    args = ap.parse_args()
    {"report": cmd_report, "apply": cmd_apply}[args.cmd](args)


if __name__ == "__main__":
    main()
