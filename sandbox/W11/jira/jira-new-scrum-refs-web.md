# New W11 ticket — the web names stories and PRs, not Jira tickets (2026-10-23)

**Created in Jira by Hanchen, 2026-10-24 00:04, as SCRUM-136** (To Do, sprint "W11 Finish and hand over", 1 point;
`Jira.csv` of 00:08; the description matches this draft).

**Split out of SCRUM-133 by Hanchen, 2026-10-23.** SCRUM-133 keeps the map, the casebook and `docs/`;
`jira-new-scrum-refs-backend.md` (SCRUM-135) takes the API code; this ticket takes the web. The rules are SCRUM-133's
(`jira-new-replace-scrum-references.md`).

**Why separate.** A web reviewer can check it alone, and only #97 blocks it: #97 edits 48 of the 98 web files that hold
a reference.

**Checked 2026-10-23 on `main` `efb5900`:** 202 references in 98 files, 30 tickets, in `apps/hej-web` and
`packages`. 35 of the lines are Vitest `describe` / `it` / `test` names.

---

## Board steps

| Field | Value |
| --- | --- |
| Type | Task |
| Sprint | **W11** |
| Assignee | **Open** |
| Story points | **1** suggested: about 98 files, mechanical |
| Linked | "is blocked by" SCRUM-133, SCRUM-128 (#97) |

## Summary

```
Handover: Name stories and PRs instead of Jira tickets in the web
```

## Description

```
{noformat}Not tied to one user story: it makes every story's references readable without our Jira board. Part 3 of 3; SCRUM-133 holds the map and the rules, and the backend has its own ticket.

WEB. W11. Added 2026-10-23 (Hanchen). Start when SCRUM-133 has merged docs/handover/ticket-map.md and #97 has merged (or closed); count again then. On main at efb5900 this part holds 202 references in 98 files.

# Scope: apps/hej-web and packages: comments, JSDoc, and test names (Vitest describe / it / test).
# Apply SCRUM-133's rule: SCRUM-N becomes its story and PR, e.g. (H3, #83). Several PRs are each named; a ticket with no PR names its story; a ticket with no story is rewritten to say what it means; where the line already names the story, only the ticket goes. The map gives each ticket's story and PRs.
# Text a user reads names no ticket and no PR. If a rendered string holds one, it says what it means without an id.
# A ticket found here that the map does not list yet (one added by #97, for example) gets its row in docs/handover/ticket-map.md in this PR.

Done when `git grep -E 'SCRUM-[0-9]+' -- apps/hej-web packages` on main finds nothing, and test:web, typecheck:web and lint:web pass. If it merges last of the three, `git grep -E 'SCRUM-[0-9]+'` on main also finds only docs/handover/ticket-map.md.

Collaboration:
- SCRUM-133 (map and casebook): merges first.
- SCRUM-128 (#97, Jingwei): merges first; this change then touches its files after it.{noformat}
```
