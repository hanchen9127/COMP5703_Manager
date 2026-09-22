#!/usr/bin/env python3
"""Refresh the snapshot parts of CS-57_Contribution_Tracker.xlsx for tracking-sync.

Rules: docs/specs/tech-stack.md -> "Tracking data" -> "Writing the tracker". Standard library only.

Written, and nothing else:
  Jira Statistics   headline counts, workload by person, waiting and dropped stories, and every row of
                    "Every issue on the board" — regenerated from Jira.csv
  Lists             each story's tickets (P) and board status (Y), and the ticket list (Z)
  Contribution Log  the ticket dropdown range, and appended rows for merged PRs no row logs
  workbook.xml      the Jira Statistics filter range, and recalculation on open

Text is written as inline strings, so the shared-string table is never touched. Every other part is
copied unchanged, and every existing Contribution Log row is checked byte for byte.
"""

from __future__ import annotations

import datetime as dt
import html
import io
import re
import zipfile
from xml.sax.saxutils import escape

ROW = re.compile(r'<row r="(\d+)"[^>]*?(?:/>|>.*?</row>)', re.S)
CELL = re.compile(r'<c r="([A-Z]+)\d+"(?:[^>]*?/>|[^>]*>.*?</c>)', re.S)
STORY_LINK = re.compile(r"related to user stor(?:y|ies)\s+((?:[A-K]\d+\b[\s,&]*(?:and\s+)?)+)", re.I)
STORY_MARK = re.compile(r"(?:\bStor(?:y|ies)\s+|·\s*)\*([A-K]\d+)\*")
SUBTASK = {"Subtask", "Sub-task"}
TABLE_FIRST = 53
LOG_TICKET_ROWS = 200
ALL_WAITING = "Every committed story that is not dropped has at least one ticket on the board."


# ---------------------------------------------------------------- small helpers


def ticket_number(key: str) -> int:
    return int(re.sub(r"\D", "", key) or 0)


def story_refs(text: str) -> set[str]:
    """Story ids a Jira description links: "Related to user story X" or "Story *X*"."""
    text = text or ""
    found = set(STORY_MARK.findall(text))
    for m in STORY_LINK.finditer(text):
        found |= set(re.findall(r"[A-K]\d+", m.group(1)))
    return found


def excel_serial(day: dt.date) -> int:
    return (day - dt.date(1899, 12, 30)).days


def num(value: str) -> str:
    try:
        f = float(value)
    except (TypeError, ValueError):
        return value or ""
    return str(int(f)) if f.is_integer() else str(f)


def split_list(value: str) -> list[str]:
    return [x.strip() for x in (value or "").split(",") if x.strip()]


def col_index(col: str) -> int:
    n = 0
    for ch in col:
        n = n * 26 + ord(ch) - 64
    return n


def style_of(cell_xml: str | None) -> str | None:
    m = re.search(r'\ss="(\d+)"', cell_xml or "")
    return m.group(1) if m else None


def c_text(ref: str, style: str | None, text: str) -> str:
    s = f' s="{style}"' if style else ""
    if not text:
        return f'<c r="{ref}"{s}/>'
    return f'<c r="{ref}"{s} t="inlineStr"><is><t xml:space="preserve">{escape(text)}</t></is></c>'


def c_number(ref: str, style: str | None, value: int) -> str:
    s = f' s="{style}"' if style else ""
    return f'<c r="{ref}"{s}><v>{value}</v></c>'


def c_formula(ref: str, style: str | None, formula: str) -> str:
    s = f' s="{style}"' if style else ""
    return f'<c r="{ref}"{s}><f>{escape(formula)}</f></c>'


def split_row(row_xml: str) -> tuple[str, str, dict[str, str]]:
    m = re.match(r'<row r="(\d+)"([^>]*?)(/>|>)', row_xml)
    body = row_xml[m.end():-len("</row>")] if m.group(3) == ">" else ""
    return m.group(1), m.group(2), {cm.group(1): cm.group(0) for cm in CELL.finditer(body)}


def join_row(rn: str, attrs: str, cells: dict[str, str]) -> str:
    if not cells:
        return f'<row r="{rn}"{attrs}/>'
    return f'<row r="{rn}"{attrs}>' + "".join(cells[c] for c in sorted(cells, key=col_index)) + "</row>"


def row_map(xml: str) -> dict[int, str]:
    return {int(m.group(1)): m.group(0) for m in ROW.finditer(xml)}


def replace_rows(xml: str, new_rows: dict[int, str]) -> str:
    return ROW.sub(lambda m: new_rows.get(int(m.group(1)), m.group(0)), xml)


def sheet_parts(z: zipfile.ZipFile) -> dict[str, str]:
    """Sheet name -> zip path."""
    rels = {}
    for tag in re.findall(r"<Relationship [^>]*>", z.read("xl/_rels/workbook.xml.rels").decode("utf-8")):
        target = re.search(r'Target="([^"]+)"', tag).group(1).lstrip("/")
        rels[re.search(r'Id="([^"]+)"', tag).group(1)] = target if target.startswith("xl/") else "xl/" + target
    parts = {}
    for tag in re.findall(r"<sheet [^>]*>", z.read("xl/workbook.xml").decode("utf-8")):
        name = html.unescape(re.search(r'name="([^"]*)"', tag).group(1))
        parts[name] = rels[re.search(r'r:id="([^"]+)"', tag).group(1)]
    return parts


def in_week(sprint: str, week: str) -> bool:
    """Does this sprint belong to ``week``?

    The board renames sprints as it goes -- "W7" became "W7 Lock down review data" -- so an
    exact match silently counts zero. Match on the leading week token instead
    (tech-stack.md -> Writing the tracker, decided 2026-09-18). The break week's token ``Break``
    matches the board's "Mid-semester Break" sprint (decided 2026-09-19).
    """
    name = (sprint or "").strip()
    if week == "Break":
        return name.lower().endswith("break")
    return bool(week) and (name == week or name.startswith(week + " "))


def current_week(lists: dict[int, dict[str, str]], today: dt.date) -> str:
    serial = excel_serial(today)
    for _, cells in sorted(lists.items()):
        label = cells.get("T", "")
        try:
            start, end = float(cells.get("U", "")), float(cells.get("V", ""))
        except ValueError:
            continue
        if re.fullmatch(r"W\d+|Break", label) and start <= serial <= end:
            return label
    return ""


class Sheet:
    """Row XML for one sheet, plus the cell values read before any change."""

    def __init__(self, xml: str, values: dict[int, dict[str, str]]):
        self.xml, self.values = xml, values
        self.rows, self.new = row_map(xml), {}

    def put(self, rn: int, cells: dict[str, tuple[str, object]], styles: dict | None = None) -> list[str]:
        """Write cells that differ from the current value. Returns the columns written."""
        current = self.values.get(rn, {})
        changed = {}
        for col, (kind, value) in cells.items():
            old = current.get(col, "")
            if kind == "n" and num(old) == str(value):
                continue
            if kind == "t" and old == str(value).strip():
                continue
            changed[col] = (kind, value)
        if not changed:
            return []
        if rn not in self.rows:
            raise ValueError(f"row {rn} is not in the sheet")
        n, attrs, have = split_row(self.new.get(rn) or self.rows[rn])
        for col, (kind, value) in changed.items():
            ref, style = f"{col}{rn}", (styles or {}).get(col) or style_of(have.get(col))
            have[col] = (c_number(ref, style, value) if kind == "n" else
                         c_formula(ref, style, value) if kind == "f" else c_text(ref, style, value))
        self.new[rn] = join_row(n, attrs, have)
        return list(changed)

    def result(self) -> str:
        return replace_rows(self.xml, self.new)


# ---------------------------------------------------------------- build


def build(tracker_path, sheets, jira, stories, ix, names, today: dt.date, appends: list[dict]):
    """Compute the tracker's new parts. Returns ({zip path: bytes}, summary) — only changed parts."""
    with zipfile.ZipFile(tracker_path) as z:
        parts_by_sheet = sheet_parts(z)
        paths = {"js": parts_by_sheet["Jira Statistics"], "li": parts_by_sheet["Lists"],
                 "cl": parts_by_sheet["Contribution Log"], "wb": "xl/workbook.xml"}
        original = {k: z.read(p).decode("utf-8") for k, p in paths.items()}
    js = Sheet(original["js"], sheets["Jira Statistics"])
    li = Sheet(original["li"], sheets["Lists"])
    cl = Sheet(original["cl"], sheets["Contribution Log"])

    ids = list(stories)
    order = {sid: i for i, sid in enumerate(ids)}
    dropped = [sid for sid in ids if stories[sid][ix["status"]] == "dropped"]
    week = current_week(li.values, today)

    # -- the issue table
    csv_map: dict[str, set[str]] = {}
    for sid in ids:
        for t in split_list(stories[sid][ix["scrum"]]):
            csv_map.setdefault(t, set()).add(sid)

    def own(key):
        return story_refs(jira[key].get("description", "")) & set(ids)

    def task_match(key):
        desc, listed = own(key), csv_map.get(key, set())
        return desc | listed, ("description" if desc else "backlog CSV" if listed else "")

    def epic(key, depth=0):
        parent = jira.get(key, {}).get("parent", "")
        if not parent or parent not in jira or depth > 3:
            return ""
        return jira[parent]["summary"] if jira[parent]["type"] == "Epic" else epic(parent, depth + 1)

    table = []
    for key in sorted((k for k, t in jira.items() if t["type"] != "Epic"), key=ticket_number):
        t = jira[key]
        if t["type"] in SUBTASK:
            parent = t.get("parent", "")
            inherited = task_match(parent)[0] if parent in jira else set()
            mine = own(key)
            found = inherited | mine
            how = "both" if inherited and mine else "parent ticket" if inherited else "description" if mine else ""
            summary = "    " + t["summary"]
        else:
            found, how = task_match(key)
            summary = t["summary"]
        table.append({"B": key, "C": t["type"], "D": t["status"], "E": names.norm(t["assignee"]),
                      "F": (t.get("sprint") or "").split(" / ")[-1], "G": epic(key), "H": summary,
                      "I": ", ".join(sorted(found, key=order.get)), "J": how})

    old_table = {c["B"]: (r, c) for r, c in js.values.items()
                 if r >= TABLE_FIRST and c.get("B", "").startswith("SCRUM-")}
    old_last = max((r for r, _ in old_table.values()), default=TABLE_FIRST - 1)
    new_last = TABLE_FIRST + len(table) - 1
    table_styles = {col: style_of(x) for col, x in split_row(js.rows[TABLE_FIRST])[2].items()}
    for i, rec in enumerate(table):
        rn = TABLE_FIRST + i
        cells = {col: ("t", rec[col]) for col in "BCDEFGHIJ"}
        written = js.put(rn, cells, table_styles)
        formula = f"COUNTIF('Contribution Log'!$F$2:$F$596,$B{rn})"
        if written or escape(formula) not in js.rows.get(rn, ""):
            n, attrs, have = split_row(js.new.get(rn) or js.rows[rn])
            have["K"] = c_formula(f"K{rn}", table_styles.get("K"), formula)
            js.new[rn] = join_row(n, attrs, have)
    for rn in range(new_last + 1, old_last + 1):
        js.new[rn] = join_row(str(rn), split_row(js.rows[rn])[1], {})

    changes = []
    for rec in table:
        if rec["B"] not in old_table:
            continue
        old = old_table[rec["B"]][1]
        diffs = [(label, old.get(col, ""), rec[col].strip()) for col, label in
                 (("D", "status"), ("E", "assignee"), ("F", "sprint"), ("I", "stories"))
                 if old.get(col, "") != rec[col].strip()]
        if diffs:
            changes.append((rec["B"], diffs))

    # -- headline counts
    unassigned = [r for r in table if not r["E"]]
    figures = {"WORK ITEMS": len(table), "IN PROGRESS": sum(r["D"] == "In Progress" for r in table),
               "IN REVIEW": sum(r["D"] == "In Review" for r in table), "DONE": sum(r["D"] == "Done" for r in table),
               "UNASSIGNED": len(unassigned)}
    label_row = next((r for r, c in js.values.items() if "WORK ITEMS" in c.values()), None)
    if label_row is None:
        raise ValueError("Jira Statistics: the headline counts were not found")
    headline, labels, values = [], {}, {}
    for col, label in sorted(js.values[label_row].items(), key=lambda kv: col_index(kv[0])):
        if label.startswith("IN SPRINT"):
            shown = f"IN SPRINT {week}".strip()
            labels[col] = ("t", shown)
            value = sum(in_week(r["F"], week) for r in table)
        elif label in figures:
            shown, value = label, figures[label]
        else:
            continue
        old = num(js.values.get(label_row + 1, {}).get(col, ""))
        headline.append((shown if shown == label else f"{label} → {shown}", old, str(value)))
        values[col] = ("n", value)
    js.put(label_row, labels)
    js.put(label_row + 1, values)

    # -- workload by person
    bundle_of = {c["K"]: c.get("X", "") for r, c in li.values.items() if r >= 3 and c.get("K")}
    workload = []
    for rn, row_xml in sorted(js.rows.items()):
        m = re.search(r'<c r="B%d"[^>]*><f>Lists!\$A\$(\d+)</f>' % rn, row_xml)
        if not m:
            continue
        member = names.norm(li.values.get(int(m.group(1)), {}).get("A", ""))
        mine = [r for r in table if r["E"] == member]
        bundles: list[str] = []
        for r in mine:
            for sid in split_list(r["I"]):
                if bundle_of.get(sid) and bundle_of[sid] not in bundles:
                    bundles.append(bundle_of[sid])
        if js.put(rn, {"C": ("n", len(mine)), "D": ("n", sum(r["D"] == "To Do" for r in mine)),
                       "E": ("n", sum(r["D"] == "In Progress" for r in mine)),
                       "F": ("n", sum(r["D"] == "In Review" for r in mine)),
                       "G": ("n", sum(r["D"] == "Done" for r in mine)),
                       "H": ("n", sum(in_week(r["F"], week) for r in mine)),
                       "I": ("t", ", ".join(bundles))}):
            workload.append(member)

    texts = []
    nobody = next((r for r, c in js.values.items() if c.get("B") == "Nobody assigned"), None)
    if nobody:
        owned = {r["G"] for r in table if r["G"] and r["E"]}
        unowned_epics = sorted({r["G"] for r in table if r["G"]} - owned)
        text = f"{len(unassigned)} of {len(table)} issues on the board have no owner"
        if unowned_epics:
            text += " - including every issue in " + ", ".join(unowned_epics)
        if js.put(nobody, {"C": ("n", len(unassigned)), "D": ("t", text + ".")}):
            texts.append("Nobody assigned")
    header = next((r for r, c in js.values.items() if c.get("B") == "Waiting for a ticket"), None)
    if header:
        waiting = [sid for sid in ids if sid not in dropped and not split_list(stories[sid][ix["scrum"]])]
        if js.put(header + 1, {"B": ("t", str(len(waiting)) if waiting else "None"),
                               "C": ("t", ("Committed stories with nothing on the board: " + " ".join(waiting))
                                     if waiting else ALL_WAITING)}):
            texts.append("Waiting for a ticket")
        dropped_row = next((r for r, c in js.values.items() if r > header and c.get("B") == "Dropped"), None)
        if dropped_row and js.put(dropped_row, {"C": ("t", f"{len(dropped)} stories the team dropped, so no ticket "
                                                          f"is expected: " + " ".join(dropped))}):
            texts.append("Dropped")

    js_new = js.result()
    js_new = re.sub(r'<autoFilter ref="\$B\$52:\$K\$\d+"/>', f'<autoFilter ref="$B$52:$K${new_last}"/>', js_new)
    js_new = re.sub(r'sqref="B53:K\d+"', f'sqref="B53:K{new_last}"', js_new)
    js_new = re.sub(r'sqref="I53:I\d+"', f'sqref="I53:I{new_last}"', js_new)

    # -- Lists
    lists_changes = []
    for rn, cells in sorted(li.values.items()):
        sid = cells.get("K", "")
        if rn < 3 or sid not in stories:
            continue
        tickets = split_list(stories[sid][ix["scrum"]])
        statuses = [jira[t]["status"] for t in tickets if t in jira and jira[t]["type"] != "Epic"]
        if sid in dropped:
            status = "Dropped"
        elif not statuses:
            status = "Not on board"
        elif all(s == "Done" for s in statuses):
            status = "Done"
        elif any(s != "To Do" for s in statuses):
            status = "In progress"
        else:
            status = "To Do"
        if li.put(rn, {"P": ("t", ", ".join(tickets)), "Y": ("t", status)}):
            lists_changes.append((sid, cells.get("P", ""), ", ".join(tickets), cells.get("Y", ""), status))
    z_style = style_of(split_row(li.rows[2])[2].get("Z"))
    old_z = [r for r, c in li.values.items() if r >= 2 and c.get("Z", "").startswith("SCRUM-")]
    for i, rec in enumerate(table):
        li.put(2 + i, {"Z": ("t", rec["B"])}, {"Z": z_style})
    for rn in range(2 + len(table), max(old_z, default=1) + 1):
        li.put(rn, {"Z": ("t", "")}, {"Z": z_style})
    li_new = li.result()

    # -- Contribution Log: dropdown range, appended rows
    cl_new = cl.xml
    rng = None
    m = re.search(r'(<dataValidation [^>]*sqref="F2:F\d+"[^>]*><formula1>)(Lists!\$Z\$2:\$Z\$(\d+))(</formula1>)', cl_new)
    if m and int(m.group(3)) < LOG_TICKET_ROWS:
        rng = (m.group(2), f"Lists!$Z$2:$Z${LOG_TICKET_ROWS}")
        cl_new = cl_new[:m.start()] + m.group(1) + rng[1] + m.group(4) + cl_new[m.end():]
    appended = []
    if appends:
        content = [r for r, c in cl.values.items() if r > 1 and any(k in c for k in ("A", "C", "G"))]
        last = max(content)
        styles = {col: style_of(x) for col, x in split_row(cl.rows[last])[2].items()}
        b_template = next((split_row(cl.rows[r])[2]["B"] for r in sorted(cl.rows) if r > last
                           and "<f>" in split_row(cl.rows[r])[2].get("B", "")), None)
        rows_new = {}
        for i, a in enumerate(appends):
            rn = last + 1 + i
            if any(k in cl.values.get(rn, {}) for k in ("A", "C", "G")):
                raise ValueError(f"Contribution Log row {rn} is not empty")
            n, attrs, have = split_row(cl.rows[rn])
            have["A"] = c_number(f"A{rn}", styles.get("A"), a["serial"])
            if "<f>" not in have.get("B", "") and b_template:
                src = re.search(r'r="B(\d+)"', b_template).group(1)
                have["B"] = re.sub(r"\b([AB])%s\b" % src, lambda mm: f"{mm.group(1)}{rn}", b_template)
            if a.get("member"):
                have["C"] = c_text(f"C{rn}", styles.get("C"), a["member"])
            have["G"] = c_number(f"G{rn}", styles.get("G"), a["pr"])
            have["H"] = c_text(f"H{rn}", styles.get("H"), a["link"])
            rows_new[rn] = join_row(n, attrs, have)
            appended.append((rn, a))
        cl_new = replace_rows(cl_new, rows_new)
    check_log(cl.xml, cl_new, {rn for rn, _ in appended}, rng)

    # -- workbook
    wb_new = original["wb"]
    new_text = {"js": js_new, "li": li_new, "cl": cl_new}
    if any(new_text[k] != original[k] for k in new_text):
        wb_new = re.sub(r"('Jira Statistics'!\$B\$52:\$K\$)\d+", lambda mm: f"{mm.group(1)}{new_last}", wb_new)
        if "fullCalcOnLoad" not in wb_new:
            wb_new = re.sub(r"<calcPr(\s[^>]*)?/>", lambda mm: f'<calcPr{mm.group(1) or ""} fullCalcOnLoad="1"/>', wb_new)
    new_text["wb"] = wb_new

    parts = {paths[k]: v.encode("utf-8") for k, v in new_text.items() if v != original[k]}
    summary = {"week": week, "headline": headline, "issues": (len(old_table), len(table)),
               "added": [r["B"] for r in table if r["B"] not in old_table],
               "removed": [k for k in old_table if k not in {r["B"] for r in table}],
               "changes": changes, "workload": workload, "texts": texts, "lists": lists_changes,
               "z": (len(old_z), len(table)), "range": rng, "appended": appended,
               "log_part": paths["cl"], "parts": sorted(parts)}
    return parts, summary


def check_log(old_xml: str, new_xml: str, appended: set[int], rng) -> None:
    """Every existing Contribution Log row is byte-identical; outside the rows only the dropdown moved."""
    old, new = row_map(old_xml), row_map(new_xml)
    if list(old) != list(new):
        raise AssertionError("Contribution Log rows were added, removed or reordered")
    for rn, xml in old.items():
        if rn not in appended and new[rn] != xml:
            raise AssertionError(f"Contribution Log row {rn} changed")
    rest_old, rest_new = ROW.sub("", old_xml), ROW.sub("", new_xml)
    if rng:
        rest_old = rest_old.replace(f"<formula1>{rng[0]}</formula1>", f"<formula1>{rng[1]}</formula1>", 1)
    if rest_old != rest_new:
        raise AssertionError("Contribution Log changed outside its rows and ticket dropdown")


# ---------------------------------------------------------------- write


def write(tracker_path, parts: dict[str, bytes], summary: dict) -> None:
    """Rewrite the workbook with the changed parts, then verify everything else is untouched."""
    raw = tracker_path.read_bytes()
    with zipfile.ZipFile(io.BytesIO(raw)) as src:
        infos = src.infolist()
        original = {i.filename: src.read(i.filename) for i in infos}
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as out:
        for info in infos:
            zi = zipfile.ZipInfo(info.filename, date_time=info.date_time)
            zi.compress_type, zi.external_attr, zi.create_system = (info.compress_type, info.external_attr,
                                                                    info.create_system)
            out.writestr(zi, parts.get(info.filename, original[info.filename]))
    tracker_path.write_bytes(buf.getvalue())

    with zipfile.ZipFile(tracker_path) as after:
        if [i.filename for i in after.infolist()] != [i.filename for i in infos]:
            raise AssertionError("workbook parts were added, removed or reordered")
        for name, data in original.items():
            expected = parts.get(name, data)
            if after.read(name) != expected:
                raise AssertionError(f"{name} does not match what was planned")
        log = summary["log_part"]
        check_log(original[log].decode("utf-8"), after.read(log).decode("utf-8"),
                  {rn for rn, _ in summary["appended"]}, summary["range"])


# ---------------------------------------------------------------- report


def render(summary: dict) -> str:
    if not summary["parts"]:
        return "None — the tracker already matches Jira.csv."
    out = [f"**Jira Statistics** — regenerated from Jira.csv; current week {summary['week'] or 'not found'}.", ""]
    moved = [h for h in summary["headline"] if h[1] != h[2] or "→" in h[0]]
    if moved:
        out += ["| Figure | Current | Proposed |", "| --- | --- | --- |"]
        out += [f"| {label} | {old or '(blank)'} | {new} |" for label, old, new in moved]
        out.append("")
    old_n, new_n = summary["issues"]
    line = f"- Issue table: {old_n} → {new_n} issues"
    if summary["added"]:
        line += f"; added {', '.join(summary['added'])}"
    if summary["removed"]:
        line += f"; removed {', '.join(summary['removed'])}"
    out.append(line + ".")
    if summary["changes"]:
        out.append(f"- Issues whose status, assignee, sprint or stories changed ({len(summary['changes'])}):")
        for key, diffs in summary["changes"]:
            out.append(f"  - {key}: " + "; ".join(f"{label} {old or '-'} → {new or '-'}" for label, old, new in diffs))
    if summary["workload"]:
        out.append(f"- Workload by person updated for: {', '.join(summary['workload'])}.")
    if summary["texts"]:
        out.append(f"- Summary text updated: {', '.join(summary['texts'])}.")
    out.append("")
    if summary["lists"]:
        out += ["**Lists** — story tickets (P) and board status (Y):", "",
                "| Story | Tickets | Board status |", "| --- | --- | --- |"]
        for sid, old_p, new_p, old_y, new_y in summary["lists"]:
            p = new_p if old_p == new_p else f"{old_p or '(blank)'} → {new_p or '(blank)'}"
            y = new_y if old_y == new_y else f"{old_y or '(blank)'} → {new_y}"
            out.append(f"| {sid} | {p} | {y} |")
        out.append("")
    if summary["z"][0] != summary["z"][1]:
        out.append(f"**Lists** — ticket dropdown list (Z): {summary['z'][0]} → {summary['z'][1]} tickets.")
        out.append("")
    out.append("**Contribution Log** — existing rows stay byte-for-byte unchanged.")
    if summary["range"]:
        out.append(f"- Ticket dropdown: `{summary['range'][0]}` → `{summary['range'][1]}`.")
    if summary["appended"]:
        out += ["- Rows appended for merged PRs no row logs — the member completes the rest:", "",
                "| Row | Date merged | Member | PR | Link |", "| --- | --- | --- | --- | --- |"]
        out += [f"| {rn} | {a['date']} | {a['member'] or '(blank — confirm)'} | #{a['pr']} | {a['link']} |"
                for rn, a in summary["appended"]]
    else:
        out.append("- No rows appended.")
    return "\n".join(out)
