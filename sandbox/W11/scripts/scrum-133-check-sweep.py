"""Check a SCRUM-133 sweep diff against docs/handover/ticket-map.md.

For each diff hunk, the tickets removed are paired with the PR numbers and story ids added in the same hunk.
Flags:
- a PR added that none of the hunk's removed tickets maps to (and that the removed text didn't already name);
- a removed ticket with merged PRs where the hunk adds none of them and none was already there
  (fine for a story-only rewrite, but each one is listed for reading);
- a story added that none of the hunk's removed tickets serves (fine when the line names its own story; listed);
- a SCRUM-N left on an added line.

Usage: py -I scrum-133-check-sweep.py <worktree> [git diff args...]   e.g.  HEAD -- docs/adr
"""
import re
import subprocess
import sys

sys.stdout.reconfigure(encoding="utf-8")
wt, args = sys.argv[1], sys.argv[2:]

ticket_map = {}
for line in open(f"{wt}/docs/handover/ticket-map.md", encoding="utf-8"):
    cells = [c.strip() for c in line.strip().split("|")[1:-1]]
    if len(cells) == 4 and re.fullmatch(r"SCRUM-\d+", cells[0]):
        ticket_map[cells[0]] = (set(re.findall(r"\b[A-K]\d{1,2}\b", cells[2])), set(map(int, re.findall(r"#(\d+)", cells[3]))))

diff = subprocess.run(["git", "diff", "-U0", "--ignore-cr-at-eol", *args], cwd=wt, capture_output=True, text=True, encoding="utf-8").stdout
hunks, path, cur = [], None, None
for line in diff.splitlines():
    if line.startswith("+++ "):
        path = line[6:]
    elif line.startswith("@@"):
        cur = {"path": path, "at": re.search(r"\+(\d+)", line).group(1), "minus": [], "plus": []}
        hunks.append(cur)
    elif cur and line.startswith("-") and not line.startswith("---"):
        cur["minus"].append(line[1:])
    elif cur and line.startswith("+") and not line.startswith("+++"):
        cur["plus"].append(line[1:])

counts = {"hunks": len(hunks), "tickets_removed": 0}
flags = {"unmapped PR": [], "PR dropped": [], "story not of the ticket": [], "SCRUM left": [], "unknown ticket": []}
for h in hunks:
    minus, plus = "\n".join(h["minus"]), "\n".join(h["plus"])
    where = f'{h["path"]}:{h["at"]}'
    tickets = re.findall(r"SCRUM-\d+", minus)
    counts["tickets_removed"] += len(tickets)
    if re.search(r"SCRUM-\d+", plus):
        flags["SCRUM left"].append(where)
    known = [t for t in tickets if t in ticket_map]
    for t in set(tickets) - set(known):
        flags["unknown ticket"].append(f"{where} {t}")
    map_prs = set().union(*(ticket_map[t][1] for t in known)) if known else set()
    map_stories = set().union(*(ticket_map[t][0] for t in known)) if known else set()
    old_prs = set(map(int, re.findall(r"#(\d+)", minus)))
    new_prs = set(map(int, re.findall(r"#(\d+)", plus))) - old_prs
    old_stories = set(re.findall(r"\b[A-K]\d{1,2}\b", minus))
    new_stories = set(re.findall(r"\b[A-K]\d{1,2}\b", plus)) - old_stories
    for n in sorted(new_prs - map_prs):
        flags["unmapped PR"].append(f"{where} #{n} (removed {sorted(set(tickets))})")
    for t in sorted(set(known)):
        prs = ticket_map[t][1]
        if prs and not (prs & (new_prs | old_prs) or prs & set(map(int, re.findall(r"#(\d+)", plus)))):
            flags["PR dropped"].append(f"{where} {t} -> {sorted(prs)}")
    for s in sorted(new_stories - map_stories):
        if tickets:
            flags["story not of the ticket"].append(f"{where} {s} (removed {sorted(set(tickets))})")

print(counts)
for k, v in flags.items():
    print(f"\n== {k}: {len(v)}")
    print("\n".join(v))
