# New W11 ticket — the backend names stories and PRs, not Jira tickets (2026-10-23)

**Created in Jira by Hanchen, 2026-10-24 00:03, as SCRUM-135** (To Do, sprint "W11 Finish and hand over", 1 point;
`Jira.csv` of 00:08; the description matches this draft).

**Split out of SCRUM-133 by Hanchen, 2026-10-23.** SCRUM-133 keeps the map, the casebook and `docs/`; this ticket
takes the API code; `jira-new-scrum-refs-web.md` (SCRUM-136) takes the web. The rules are SCRUM-133's
(`jira-new-replace-scrum-references.md`).

**Why separate.** It is the largest part (771 of 1675), and two open PRs edit its files: #97 touches 14 API files and
`api_surfaces.md`, and #98 touches 10 API files, `api_surfaces.md` and `workflow_states.md`. It waits for both; the
casebook and the rest of `docs/` need not.

**Checked 2026-10-23 on `main` `efb5900`** (counted with `git grep -o`, so two tickets on one line count twice):

| What | References | Files |
| --- | --- | --- |
| `apps/hej-api/app` | 408 | 72 |
| `apps/hej-api/tests` | 329 | 108 |
| `seed_test_projects.py`, `init_data.py`, `seed_governance_projects.py`, `apps/hej-api/README.md` | 21 | 4 |
| `docs/design/backend/api_surfaces.md`, `docs/design/product/workflow_states.md` | 102 | 2 |
| **Total** (58 tickets) | **≈ 873** | **186** |

- **The user-visible strings are here:** `release_gate.py:232` puts "SCRUM-37" in an API refusal, and
  `schemas/review_actions.py:41` puts "SCRUM-32" in a field description that reaches the OpenAPI docs.
- Pydantic class docstrings and route docstrings also reach the OpenAPI docs. They are developer text, so they take
  the story and the PR like any docstring.

---

## Board steps

| Field | Value |
| --- | --- |
| Type | Task |
| Sprint | **W11** |
| Assignee | **Open** |
| Story points | **2** suggested: about 186 files, mechanical, one rule per reference |
| Linked | "is blocked by" SCRUM-133, SCRUM-128 (#97), SCRUM-121 (#98) |

## Summary

```
Handover: Name stories and PRs instead of Jira tickets in the backend
```

## Description

```
{noformat}Not tied to one user story: it makes every story's references readable without our Jira board. Part 2 of 3; SCRUM-133 holds the map and the rules, and the web has its own ticket.

BACKEND + DOCS. W11. Added 2026-10-23 (Hanchen). Start when SCRUM-133 has merged docs/handover/ticket-map.md and #97 and #98 have merged (or closed); count again then. On main at efb5900 this part holds about 873 references in 186 files.

# Scope: apps/hej-api except evaluation/ (app, tests, the seed and init scripts, the API README), and docs/design/backend/api_surfaces.md and docs/design/product/workflow_states.md, which #97 and #98 edit.
# Apply SCRUM-133's rule: SCRUM-N becomes its story and PR, e.g. (H3, #83). Several PRs are each named; a ticket with no PR names its story; a ticket with no story is rewritten to say what it means; where the line already names the story, only the ticket goes. The map gives each ticket's story and PRs.
# Text a user reads names no ticket and no PR: release_gate.py's refusal (SCRUM-37) and the schemas/review_actions.py field description (SCRUM-32) say what they mean without an id. Update any test that matches those strings.
# A ticket found here that the map does not list yet (one added by #97 or #98, for example) gets its row in docs/handover/ticket-map.md in this PR.

Done when `git grep -E 'SCRUM-[0-9]+' -- apps/hej-api ':!apps/hej-api/evaluation' docs/design/backend/api_surfaces.md docs/design/product/workflow_states.md` on main finds nothing; the full backend suite passes on SQLite and PostgreSQL; and the casebook passes unchanged. If it merges last of the three, `git grep -E 'SCRUM-[0-9]+'` on main also finds only docs/handover/ticket-map.md.

Collaboration:
- SCRUM-133 (map and casebook): merges first.
- SCRUM-128 (#97, Jingwei) and SCRUM-121 (#98, Hanchen): merge first; this change then touches their files after them.{noformat}
```
