# Hej Delivery Backlog — CSV edition

Two files, meant to travel together in this folder:

| File | What it is |
|---|---|
| `story_src.csv` | The data: all 59 user stories. Hanchen's local, client-facing copy of the backlog — not the team's live record. |
| `user-stories.html` | The interface — presents the CSV to the client and edits story content. |

**Where status really lives.** The team's live records are the contribution tracker, a shared online
Google Sheet, and the Jira board. `CS-57_Contribution_Tracker.xlsx` and `Jira.csv` in this folder are
snapshots Hanchen downloads by hand: read-only, and possibly behind the live versions. `story_src.csv`
is updated from those snapshots later still, so it lags both. For the team's current status, read the
board and the tracker.

## Who changes what

| Columns | Changed by |
|---|---|
| `status`, `allocated_to`, `scrum` | The `tracking-sync` skill only (`.claude/skills/tracking-sync/`) — report, confirm, apply. Rules: `../specs/tech-stack.md` → *Tracking data* |
| Everything else — `story`, `acceptance_criteria`, `related_issues`, `subtasks`, `defects`, and new stories | Hanchen, in `user-stories.html` |

`tracking-sync`'s apply step refuses if `story_src.csv` changed after its report, so finish page edits
before running a report — or run the report again.

## Using it

1. Open `user-stories.html` in **Chrome or Edge**.
2. Click **Connect CSV** and pick `story_src.csv` from this folder.
3. Edit story content. Every save is written straight into the CSV. Leave status, allocation and SCRUM
   tickets to `tracking-sync`.

The button turns green and reads **CSV connected** once it's linked. You'll be asked once to allow editing — that's the browser, not the page, and it's asked again each time you reopen the file.

## Why you have to click Connect

A web page can't reach into your filesystem on its own; if it could, any site you visited could rewrite your files. The browser only grants access to a file **you** hand it through a picker. So one click per session is the cost of the page being able to write at all.

Until you connect, the page still works — it just shows the built-in copy of the 59 stories and can't save. The banner at the top tells you which state you're in, and an **· unsaved** marker appears next to the buttons if you have changes that haven't reached the CSV.

## Firefox and Safari

They don't support writing files from a page. There, **Connect CSV** becomes a download: you get a fresh `story_src.csv` to drop into this folder yourself, replacing the old one. Everything else works the same.

## The CSV

One row per story, fourteen columns:

`id, epic, priority, owner, name, story, acceptance_criteria, related_issues, subtasks, defects, status, allocated_to, scrum, source`

- `acceptance_criteria`, `related_issues` and `subtasks` hold one item per line inside a single quoted cell.
- `acceptance_criteria` and `subtasks` are **ordered lists**, stored as `1. …`, `2. …`. The numbers come from position, not from what you type: add a line in the middle and everything below renumbers itself on save. Whatever ordinals a cell already has are ignored on read, so a duplicate or a gap can't appear. `related_issues` stays unnumbered.
- `status` is blank, `working`, `done` or `dropped`, set by `tracking-sync`. `done` and `dropped` are never downgraded automatically.
- `scrum` is the SCRUM tickets covering the story — several separated by commas, blank where nothing covers it. Set by `tracking-sync` from the Jira snapshot; don't edit it here.
- `source` is `shipped` for the original 59 — every current row — and `added` for stories written later. That's what lets the page mark a story as new and allow deleting it; the original 59 can only be reset, never deleted.
- The file is UTF-8 with a BOM, CRLF between rows and LF inside multi-line cells. Excel or Sheets may not keep that format, so edit through the page rather than a spreadsheet.

## Subtasks

Every story carries a **Subtasks** section in its detail panel — 270 in all, three to six per story, one per line. They are the work the story breaks into, written against the actual hej codebase: where a story closes one of the 29 defects, its subtasks name that defect and the file and line it lives at. Line numbers go stale as the code moves; check them against `origin/main` before relying on one.

Edit them like acceptance criteria — one per line, numbered automatically, saved into `story_src.csv`. Changing the wording or the order marks the story *edited*; a renumber on its own does not. **Reset story** puts the default breakdown back.

They are deliberately not tickable here: subtask completion is tracked on the Jira board.

## SCRUM tickets

Each story records the tickets covering it. `tracking-sync` keeps that field in step with the Jira snapshot. Don't change it in the detail panel or with **Reset**, which restores the mapping built into the page — either would be overwritten at the next sync.

Use the **Ticket** filter in the toolbar to narrow the backlog to *On the board*, *No ticket*, or *Oversized*.

Coverage: **53 of 59 stories carry a ticket.** The six without one are the stories set aside — A1, A5 and K1–K4 (`../specs/mission.md` → *Stories Set Aside*).

The board snapshot, `Jira.csv`, holds 58 tasks and 14 subtasks under 10 epics. Subtasks are not listed against stories: each inherits its parent task's stories, so listing both would double-count.

A ticket covering more than two stories is *oversized*: more than one sprint's work. Four are, and the **Oversized** filter finds them:

| Ticket | Stories | State |
|---|---|---|
| SCRUM-36 — Dispute: Basic Functionality | E1, E3, E4, E5, E6 | **Split** — five subtasks on the board (SCRUM-57 to 61). |
| SCRUM-42 — Release & Export: Basic functionality | H1, H2, H3, H6 | **Split** — four subtasks on the board (SCRUM-64 to 67). |
| SCRUM-52 — Dispute: Adjudicator queue and authorization | D8, E3, E6, G1 | Not split. Four stories across review, dispute and permissions. |
| SCRUM-49 — Review: Execute accept, adjust, reject and dispute transitions | C5, D3, E1 | Not split. Three stories on the review transition path. |

Until SCRUM-49 and SCRUM-52 are split on the board, `../specs/roadmap.md` schedules each of them by story part.

Epic I is on the board in full, as SCRUM-68 to SCRUM-75. In the current snapshot none of them has an assignee.

The page has no ticket-by-ticket board view: who delivered what against each ticket is recorded in the contribution tracker, so it isn't kept in two places. **Export** still writes a **Board coverage** table into the Markdown, listing every ticket and the stories against it.

**Stale text in the page itself:** the board-coverage note says the unticketed stories' descriptions are in `docs/task.md`, section 3. That file is no longer in `docs/`; the six stories are described in `../specs/mission.md` → *Stories Set Aside*.

An older `story_src.csv` without the `subtasks` or `scrum` columns still loads — the page fills in the default subtasks and ticket links. Saving writes the new columns.

## Sharing

`story_src.csv` is not shared for editing. Hanchen manages it locally and presents it to the client through this page; the team works from the Jira board and the online tracker.

For readers who just need the backlog, **Export** downloads `change_log.md` and `current_user_stories.md`.
