# Hej delivery records

| File | What it is |
|---|---|
| `handover-dashboard.html` | The handover dashboard: what the team received, what it leaves, every story, ticket and defect, with an **Export** of three Markdown files. Read-only; its data is a snapshot embedded in the page. The GitHub Pages site opens it. |
| `story_src.csv` | The backlog data: all 63 user stories. Hanchen's local, client-facing copy of the backlog, not the team's live record. |
| `user-stories.html` | A redirect to `handover-dashboard.html`, so the old link still works. The backlog page it replaced, with its **Connect CSV** editor, was retired on 2026-10-26 and is in the git history only. |
| `CS-57_Contribution_Tracker.xlsx`, `Jira.csv` | Snapshots of the online tracker and the Jira board. |

**Where status really lives.** The team's live records are the contribution tracker, a shared online
Google Sheet, and the Jira board. `CS-57_Contribution_Tracker.xlsx` and `Jira.csv` in this folder are
snapshots fetched by `tracking-sync download` (or downloaded by hand), possibly behind the live versions.
`Jira.csv` is never edited, only replaced whole by a fresh export. The tracker
download is refreshed by `tracking-sync`: its *Jira Statistics* and *Lists* snapshot tabs are regenerated
from `Jira.csv`, and a row can be appended for a merged PR nobody logged — existing Contribution Log rows
are never changed by `apply`. Hanchen then copies those changes into the online sheet. `story_src.csv` is
updated from the downloads later still, so it lags both. For the team's current status, read the board and
the tracker.

## Who changes what

| What | Changed by |
|---|---|
| `story_src.csv` — `status`, `allocated_to`, `scrum` | The `tracking-sync` skill only (`.claude/skills/tracking-sync/`) — report, confirm, apply. Rules: `../specs/tech-stack.md` → *Tracking data* |
| `story_src.csv` — everything else: `story`, `acceptance_criteria`, `related_issues`, `subtasks`, `defects`, and new stories | Claude, directly in the CSV, at Hanchen's request — never by hand |
| `handover-dashboard.html` | Claude, at Hanchen's request. Its embedded data does not follow `story_src.csv` on its own: rebuild it after the CSV or the board changes |
| Tracker — *Contribution Log* rows | Team members, in the online sheet. `tracking-sync` only appends a row for a merged PR nobody logged, for its member to complete |
| Tracker — *Jira Statistics* snapshot, and *Lists* columns P, Y and Z | `tracking-sync`, from `Jira.csv`; Hanchen copies them into the online sheet |
| `Jira.csv` | Nobody here — it is the board export |

`tracking-sync`'s apply step refuses if `story_src.csv`, the tracker or `Jira.csv` changed after its
report, so finish edits before running a report — or run the report again.

## The CSV

One row per story, fourteen columns:

`id, epic, priority, owner, name, story, acceptance_criteria, related_issues, subtasks, defects, status, allocated_to, scrum, source`

- `acceptance_criteria`, `related_issues` and `subtasks` hold one item per line inside a single quoted cell.
- `acceptance_criteria` and `subtasks` are **ordered lists**, stored as `1. …`, `2. …`. `related_issues` stays unnumbered.
- `status` is blank, `working`, `done` or `dropped`, set by `tracking-sync`. `done` and `dropped` are never downgraded automatically.
- `scrum` is the SCRUM tickets covering the story — several separated by commas, blank where nothing covers it. Set by `tracking-sync`, which adds a ticket whose Jira description links the story and never removes one.
- `source` is `shipped` for the original 59 stories and `added` for the four written later (A6, B7, B8, D9).
- The file is UTF-8 with a BOM, CRLF between rows and LF inside multi-line cells. Excel or Sheets may not keep that format, so do not round-trip it through a spreadsheet.

Subtasks are not ticked here: subtask completion is tracked on the Jira board. Subtasks on the board are not
listed against stories: each inherits its parent task's stories.

## Sharing

`story_src.csv` is not shared for editing. Hanchen manages it locally and presents the backlog to the client
through the handover dashboard; the team works from the Jira board and the online tracker. For readers who
need the records as files, the dashboard's **Export** downloads `CS-57_user_stories.md`,
`CS-57_scrum_tickets.md` and `CS-57_closed_defects.md`.
