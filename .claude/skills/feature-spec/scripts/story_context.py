#!/usr/bin/env python3
"""Gather everything already written about one backlog story, before writing its feature spec.

    python story_context.py <STORY-ID>          e.g.  python story_context.py D5

Prints, for that story:
  - its row in docs/shared/story_src.csv (story, acceptance criteria, subtasks, related issues,
    defects, status, allocation, SCRUM tickets)
  - the matching defect rows in docs/info/issues.md and their sections in docs/info/fix-plan.md
  - rows in docs/specs/roadmap.md that mention the story
  - existing feature-spec folders for the story under docs/specs/
  - files under docs/sandbox/ and docs/reviews/ that mention the story or its tickets

Read-only. Standard library only.
"""

from __future__ import annotations

import csv
import io
import re
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except (AttributeError, ValueError):
    pass


def find_docs() -> Path:
    """Nearest ancestor's docs/ folder that holds shared/story_src.csv — found by searching upward."""
    for parent in Path(__file__).resolve().parents:
        if (parent / "docs" / "shared" / "story_src.csv").is_file():
            return parent / "docs"
    sys.exit("Could not find docs/shared/story_src.csv above this script.")


def section(title: str) -> None:
    print(f"\n## {title}\n")


def fix_plan_sections(text: str, defects: set[int]) -> list[str]:
    """Sections of fix-plan.md whose heading number (or range, e.g. '3–4') covers a defect."""
    out, current, keep = [], [], False
    for line in text.splitlines():
        m = re.match(r"^## (\d+)(?:[–-](\d+))?[a-z]?\.\s", line)
        if line.startswith("## "):
            if keep:
                out.append("\n".join(current).rstrip())
            current, keep = [line], False
            if m:
                lo, hi = int(m.group(1)), int(m.group(2) or m.group(1))
                keep = any(lo <= d <= hi for d in defects)
        else:
            current.append(line)
    if keep:
        out.append("\n".join(current).rstrip())
    return out


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    sid = sys.argv[1].strip().upper()
    docs = find_docs()

    rows = list(csv.reader(io.open(docs / "shared" / "story_src.csv", encoding="utf-8-sig", newline="")))
    ix = {c: i for i, c in enumerate(rows[0])}
    row = next((r for r in rows[1:] if r[ix["id"]].upper() == sid), None)
    if row is None:
        sys.exit(f"Story {sid} not found in docs/shared/story_src.csv.")
    get = lambda c: row[ix[c]] if c in ix else ""
    tickets = [t.strip() for t in get("scrum").split(",") if t.strip()]
    defects = {int(d) for d in re.findall(r"\d+", get("defects"))}

    print(f"# Context for {sid} — {get('name')}")
    print(f"\n- Epic {get('epic')} · {get('priority')} · owner {get('owner')} · status "
          f"{get('status') or 'not started'} · allocated to {get('allocated_to') or '—'}")
    print(f"- SCRUM tickets: {', '.join(tickets) or '—'} · defects: {', '.join(map(str, sorted(defects))) or '—'}")

    section("Story")
    print(get("story"))
    section("Acceptance criteria")
    print(get("acceptance_criteria"))
    section("Subtasks (line numbers may be stale — verify against origin/main)")
    print(get("subtasks"))
    section("Related issues")
    print(get("related_issues"))

    issues = docs / "info" / "issues.md"
    if defects and issues.is_file():
        section("Defect rows — info/issues.md")
        for line in issues.read_text(encoding="utf-8").splitlines():
            m = re.match(r"^\|\s*(\d+)\s*\|", line)
            if m and int(m.group(1)) in defects:
                print(line)
    fix_plan = docs / "info" / "fix-plan.md"
    if defects and fix_plan.is_file():
        section("Fix recipes — info/fix-plan.md")
        print("\n\n".join(fix_plan_sections(fix_plan.read_text(encoding="utf-8"), defects)) or "None found.")

    pattern = re.compile(r"\b(" + "|".join(map(re.escape, [sid, *tickets])) + r")\b")
    roadmap = docs / "specs" / "roadmap.md"
    if roadmap.is_file():
        section("Roadmap rows — specs/roadmap.md")
        current_week = ""
        for line in roadmap.read_text(encoding="utf-8").splitlines():
            if line.startswith("## "):
                current_week = line[3:].strip()
            # W6 bolds the story id; from W7 it is a plain cell, sometimes "E3, E4" or "E3 + E4"
            elif line.startswith("|") and re.search(rf"(?<![\w-]){re.escape(sid)}(?![\w-])", line):
                print(f"[{current_week}] {line}")

    section("Existing feature specs — specs/")
    specs = sorted(p for p in (docs / "specs").glob(f"*-{sid}-*") if p.is_dir()) + \
        sorted(p for p in (docs / "specs").glob(f"*-{sid.lower()}-*") if p.is_dir())
    print("\n".join(f"- {p.relative_to(docs).as_posix()}" for p in dict.fromkeys(specs)) or "None.")

    section("Mentions in sandbox/ and reviews/")
    hits = []
    for folder in ("sandbox", "reviews"):
        for path in sorted((docs / folder).rglob("*")):
            if path.suffix.lower() not in {".md", ".txt", ".py"} or not path.is_file():
                continue
            found = sorted(set(pattern.findall(path.read_text(encoding="utf-8", errors="replace"))))
            if found or pattern.search(path.name):
                hits.append(f"- {path.relative_to(docs).as_posix()} — mentions {', '.join(found) or 'in file name'}")
    print("\n".join(hits) or "None.")


if __name__ == "__main__":
    main()
