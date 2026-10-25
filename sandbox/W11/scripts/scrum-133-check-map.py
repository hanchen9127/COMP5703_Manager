"""Check docs/handover/ticket-map.md against the repository and the PR list (SCRUM-133 commit 1).

Usage: py -I scrum-133-check-map.py <worktree> <prs.json from gh pr list --state all --json number,title,state>
"""
import json, re, subprocess, sys
sys.stdout.reconfigure(encoding="utf-8")
wt, prs_path = sys.argv[1], sys.argv[2]
git = lambda *a: subprocess.run(["git", *a], cwd=wt, capture_output=True, text=True, encoding="utf-8").stdout
key = lambda t: int(t.split("-")[1])

want = set(re.findall(r"SCRUM-\d+", git("grep", "-ohE", "SCRUM-[0-9]+", "origin/main")))
want |= set(re.findall(r"SCRUM-\d+", git("log", "origin/main", "--format=%s%n%b")))
want |= {"SCRUM-121", "SCRUM-133", "SCRUM-135", "SCRUM-136"}

prs = {p["number"]: p for p in json.load(open(prs_path, encoding="utf-8"))}
want |= {t for p in prs.values() if p["state"] == "MERGED" for t in re.findall(r"SCRUM-\d+", p["title"])}

rows, problems = {}, []
for n, line in enumerate(open(f"{wt}/docs/handover/ticket-map.md", encoding="utf-8"), 1):
    m = re.match(r"^\|\s*(SCRUM-\d+)\s*\|", line)
    if not m:
        continue
    cells = [c.strip() for c in line.strip().split("|")[1:-1]]
    if len(cells) != 4:
        problems.append(f"line {n}: {len(cells)} cells")
        continue
    t, title, story, pr = cells
    if t in rows:
        problems.append(f"line {n}: {t} twice")
    rows[t] = (title, story, pr, n)

prs = {p["number"]: p for p in json.load(open(prs_path, encoding="utf-8"))}
for t, (title, story, pr, n) in rows.items():
    for s in re.findall(r"[A-Z]\d+", story):
        if not re.fullmatch(r"[A-K]\d{1,2}", s):
            problems.append(f"{t}: odd story {s}")
    for num in map(int, re.findall(r"#(\d+)", pr)):
        p = prs.get(num)
        if not p:
            problems.append(f"{t}: #{num} not in the PR list")
        elif p["state"] != "MERGED" and "(open)" not in pr:
            problems.append(f"{t}: #{num} is {p['state']}")
        elif t not in p["title"]:
            problems.append(f"{t}: #{num}'s title does not name it: {p['title'][:80]}")
    named = sorted(num for num, p in prs.items() if p["state"] == "MERGED" and re.search(rf"{t}\b", p["title"]))
    listed = sorted(map(int, re.findall(r"#(\d+)", pr)))
    if [x for x in named if x not in listed]:
        problems.append(f"{t}: merged PRs naming it but not listed: {[x for x in named if x not in listed]}")

print("rows", len(rows), "expected", len(want))
print("missing:", sorted(want - set(rows), key=key))
print("extra:", sorted(set(rows) - want, key=key))
print("order ok:", list(rows) == sorted(rows, key=key))
print("problems:", len(problems)); print("\n".join(problems))
