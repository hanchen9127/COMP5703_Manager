# SCRUM-133 and SCRUM-135 — full descriptions, updated 2026-10-24

Replace each description on the board with the block below (select all, paste). Summaries are unchanged. They
follow the decisions of 2026-10-24 in `../plans/plan-SCRUM-133.md`.

## SCRUM-133

**Summary:** `Handover: Name stories and PRs instead of Jira tickets in docs`

```
{noformat}Not tied to one user story: it makes every story's references readable without our Jira board. Part 1 of 3: this ticket sets the rules and the map; the backend and the web each have their own ticket, which start after this one.

BACKEND (casebook) + DOCS. W11. Added 2026-10-23 (Hanchen), narrowed the same day; scope and rules updated 2026-10-24. PR #100 (draft). On main at 835b9d33 this part held about 720 references in 141 files.

The team that takes over will most likely not get our Jira board, and will keep using the story ids (A1–K4 and on). Replace each Jira ticket with the story and the PR that built it.

# One new file, docs/handover/ticket-map.md: one row per SCRUM ticket ever named in the repository, commit messages and merged PR titles included (102 on 835b9d33): ticket, title, story, PR(s). Its header says the story ids and their criteria (H3.2) are defined in the backlog handed over with the project (user-stories.html and story_src.csv), and that #N means a pull request on USYD-CS-Capstone/hej; main's history also holds arcintelligence PR merges with the same numbers. The other two tickets add any ticket they find that it lacks.
# The rule, for all three tickets: SCRUM-N becomes its story and PR, e.g. (H3, #83). A ticket with several PRs names each (#84, #90). A ticket with several stories names the one its line is about. A ticket with no PR names its story alone; SCRUM-36, 39, 58 and 62, deleted from the board on 2026-09-22, keep the stories the board gave them. A ticket with no story (SCRUM-80, 128) is rewritten to say what it means. Where the line already names the story ("SCRUM-45, J4 criterion 2"), only the ticket goes ("#80, J4 criterion 2"). The informal "Scrum 20" and "Scrum 50" follow the same rule. Text a user reads names no ticket and no PR; developer text (CLI help, harness errors, skip reasons, the baseline note) may use the story id.
# A plan's numbered decision that reads as a story says it is a decision: (I3, #77, D8) becomes (I3, #77, decision D8), or #73's decision D12 where no PR is near.
# Casebook: COVERS accepts a story (H3) and a story criterion (H3.2), A to K, and no longer SCRUM-N. Each covers entry becomes the criterion its case protects, or the story where no single criterion fits. REQUIRED_COVERAGE's SCRUM-85, 116, 117 and 120 become their criteria. Update evaluation/README.md, `evaluation list --coverage` and the evaluation tests with them. baseline.json keeps every verdict; only its note changes.
# The evaluation tests (apps/hej-api/tests/test_evaluation_*.py) are in this ticket, moved from SCRUM-135 on 2026-10-24: they test the casebook, and #98 touches none of them.
# Docs: ADRs, docs/design (except api_surfaces.md and workflow_states.md, which the backend ticket takes), evaluation-findings.md, docs/terminology, docs/implementation, the runbook, the root README and the backend-tests workflow comment follow the rule. ADR files keep their names and numbers. ADR 014 follows after #98 merges, since #98 edits it.

Done when `git grep -E 'SCRUM-[0-9]+' -- apps/hej-api/evaluation 'apps/hej-api/tests/test_evaluation_*.py' docs .github README.md ':!docs/design/backend/api_surfaces.md' ':!docs/design/product/workflow_states.md'` on main finds only docs/handover/ticket-map.md and the refusal test's "SCRUM-120" in test_evaluation_scenario.py, which proves covers refuses a ticket; `python -m evaluation run --baseline evaluation/baseline.json --exact` reports every verdict unchanged; `evaluation list --coverage` lists the same cases as before, with every owed protection covered (two tickets that served one criterion may share a row); and the backend suite passes. If it merges last of the three, `git grep -E 'SCRUM-[0-9]+'` on main also finds only those two.

Collaboration:
- SCRUM-75 (I5, Kanishka): evaluation-findings.md is her record; the sweep changes its references only, in a commit of its own.
- SCRUM-121 (#98, Hanchen): merges first for ADR 014.
- The backend and web tickets: start after this merges.{noformat}
```

## SCRUM-135

**Summary:** `Handover: Name stories and PRs instead of Jira tickets in the backend`

```
{noformat}Not tied to one user story: it makes every story's references readable without our Jira board. Part 2 of 3; SCRUM-133 (#100) holds the map and the rules, and the web has its own ticket.

BACKEND + DOCS. W11. Added 2026-10-23 (Hanchen); scope updated 2026-10-24. Start when SCRUM-133 (#100) and #98 have merged (or closed); count again then. On main at 835b9d33 this part holds about 780 references in 166 files.

# Scope: apps/hej-api except evaluation/ and tests/test_evaluation_*.py, which SCRUM-133 takes (so: app, the other tests, the seed and init scripts, the API README), and docs/design/backend/api_surfaces.md and docs/design/product/workflow_states.md, which #98 edits.
# Apply SCRUM-133's rule, written in the header of docs/handover/ticket-map.md: SCRUM-N becomes its story and PR, e.g. (H3, #83). Several PRs are each named; a ticket with several stories names the one its line is about; a ticket with no PR names its story; a ticket with no story is rewritten to say what it means; where the line already names the story, only the ticket goes. The map gives each ticket's story and PRs. The informal "Scrum 20" in tests/test_project_policy_read_contract.py follows the same rule. A plan's numbered decision beside a story id says "decision Dn".
# Text a user reads names no ticket and no PR: release_gate.py's refusal (SCRUM-37) and the schemas/review_actions.py field description (SCRUM-32) say what they mean without an id. Update any test that matches those strings.
# A ticket found here that the map does not list yet (one added by #98, for example) gets its row in docs/handover/ticket-map.md in this PR.

Done when `git grep -E 'SCRUM-[0-9]+' -- apps/hej-api ':!apps/hej-api/evaluation' ':!apps/hej-api/tests/test_evaluation_*.py' docs/design/backend/api_surfaces.md docs/design/product/workflow_states.md` on main finds nothing; the full backend suite passes on SQLite and PostgreSQL; and the casebook passes unchanged. If it merges last of the three, `git grep -E 'SCRUM-[0-9]+'` on main also finds only docs/handover/ticket-map.md and the refusal test's "SCRUM-120" in apps/hej-api/tests/test_evaluation_scenario.py, which proves covers refuses a ticket.

Collaboration:
- SCRUM-133 (#100, map and casebook): merges first.
- SCRUM-121 (#98, Hanchen): merges first; this change then touches its files after it.{noformat}
```

## SCRUM-136 — one sentence to change

In Done, replace the last sentence with:

```
If it merges last of the three, `git grep -E 'SCRUM-[0-9]+'` on main also finds only docs/handover/ticket-map.md and the refusal test's "SCRUM-120" in apps/hej-api/tests/test_evaluation_scenario.py, which proves covers refuses a ticket.
```
