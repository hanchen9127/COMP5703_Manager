# Hej Delivery Backlog — CSV edition

Two files, meant to travel together in this folder:

| File | What it is |
|---|---|
| `story_src.csv` | The data. All 59 user stories, plus any the team adds. Open it in Excel or Sheets if you like. |
| `user-stories.html` | The interface — reads and writes the CSV. |

## Using it

1. Open `user-stories.html` in **Chrome or Edge**.
2. Click **Connect CSV** and pick `story_src.csv` from this folder.
3. Edit as normal. Every save is written straight into the CSV.

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
- `acceptance_criteria` and `subtasks` are **ordered lists**, stored as `1. …`, `2. …`. The numbers come from position, not from what you type: add a line in the middle and everything below renumbers itself on save. Whatever ordinals a cell already has are ignored on read, so editing the CSV in Excel can't produce a duplicate or a gap. `related_issues` stays unnumbered.
- `status` is blank, `working`, `done` or `dropped`.
- `scrum` is the SCRUM ticket covering the story — several separated by commas, or blank where nothing covers it yet. Generated from the board rather than maintained by hand: it is refreshed from a Jira export, so an edit here is a stopgap until the next refresh. See below.
- `source` is `shipped` for the original 59, `added` for stories the team writes. That's what lets the page mark them as new and allow deleting them — the original 59 can only be reset, never deleted.

## Subtasks

Every story carries a **Subtasks** section in its detail panel — 270 in all, three to six per story, one per line. They are the work the story breaks into, written against the actual hej codebase: where a story closes one of the 29 defects, its subtasks name that defect and the file and line it lives at.

Edit them like acceptance criteria — one per line, numbered automatically, saved into `story_src.csv`. Changing the wording or the order marks the story *edited*; a renumber on its own does not. **Reset story** puts the default breakdown back. The full-backlog export renders them as a numbered Markdown checklist, so `current_user_stories.md` can be handed over as a work list.

They are deliberately not tickable here. Tracking which subtask is finished belongs on the Jira board — this file is the source the board is built from, not a second place to keep status.

## SCRUM tickets

Each story records the ticket covering it. To change one, open the story and edit the **SCRUM ticket** field in its detail panel — several keys separated by commas. Record new keys there as you create them on the board; **Reset** puts every story back to the mapping built into the page.

Use the **Ticket** filter in the toolbar to narrow the backlog to *On the board*, *No ticket*, or *Oversized*.

Coverage today: **53 of 59 stories carry a ticket, 6 do not — and those six are all stories the team dropped** (A1, A5, K1–K4). Every story still in scope is on the board.

The mapping here is generated from the board (`docs/Jira.csv`, 58 tasks and 15 subtasks under 10 epics). Subtasks are deliberately not listed against stories — each inherits its parent task's stories, so listing both would double-count.

A ticket covering more than two stories is *oversized*: more than one sprint's work. Four are, and the **Oversized** filter finds them:

| Ticket | Stories | State |
|---|---|---|
| SCRUM-36 — Dispute: Basic Functionality | E1, E3, E4, E5, E6 | **Split done** — five subtasks on the board (SCRUM-57 to 61). |
| SCRUM-42 — Release & Export: Basic functionality | H1, H2, H3, H6 | **Split done** — four subtasks on the board (SCRUM-64 to 67). |
| SCRUM-52 — Dispute: Adjudicator queue and authorization | D8, E3, E6, G1 | Not split. Four stories across review, dispute and permissions. |
| SCRUM-49 — Review: Execute accept, adjust, reject and dispute transitions | C5, D3, E1 | Not split. Three stories on the review transition path. |

Recommended splits are in `docs/task.md`, section 2. The two that were oversized when that document was written have since been split on the board; SCRUM-49 and SCRUM-52 are newer and still need it.

Epic I is now on the board in full: `docs/task.md` section 3 proposed eight Evaluation tickets, and all eight exist as SCRUM-68 to SCRUM-75. None of them has an assignee.

The page has no ticket-by-ticket board view — who delivered what against each ticket is tracked in the group's contribution tracker instead, so it isn't kept in two places. `Export` still writes a **Board coverage** table into the Markdown, listing every ticket and the stories against it.

An older `story_src.csv` without the `subtasks` or `scrum` columns still loads — the page fills in the default subtasks and ticket links. Saving writes the new columns.

You can edit the CSV directly in Excel or Sheets; the page picks up the changes next time it loads. Keep the header row and the column names as they are.

## Sharing with the team

The CSV is the thing to share. Everyone edits their own copy — this is still a file, not a server, so two people editing at once will overwrite each other. Either pass it around one at a time, or keep it in version control and merge like any other file.

`Export` also produces `change_log.md` and `current_user_stories.md` for handing to people who just need to read the backlog.
