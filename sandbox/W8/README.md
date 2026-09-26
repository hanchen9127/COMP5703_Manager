# W8 — 24–30 Sep 2026 (ends after the Wednesday client meeting)

**Branch:** `CS57-Hanchen` (topic branch to be created for SCRUM-58/59)

W8 is allocated in `../../specs/roadmap.md` → W8 (2026-09-21). Hanchen's own work this week is the dispute
record: SCRUM-58 (E3) and SCRUM-59 (E4), split out of the SCRUM-36 container and moved forward from W10, so
that the break week's scenario tests can run review → escalation → adjudication → back to the reviewer.

| Ticket | Story | Plan |
| --- | --- | --- |
| SCRUM-58 — An expert adjudication is its own decision | E3 | to be written |
| SCRUM-59 — Resolving a dispute keeps the disagreement | E4 | to be written |

Also this week, as project manager:
- Ask client follow-ups F1, F2 and F5 at the 2026-09-23 meeting. F2 shapes SCRUM-58.
- Enter the W8 allocation on the board (`jira-W8-sprint.md`), then run `tracking-sync`.
- See that SCRUM-86 (Parth) merges in the first two days, before SCRUM-58 changes `decide_escalation`.

## Files

| File | What it is |
| --- | --- |
| `jira/jira-new-J3-invitee-screen.md` | 2026-09-26: SCRUM-115 (2 points, Tim, W8), split from SCRUM-90 at the review of PR #28 — the invitee's pending-invitation screen (SCRUM-90 criterion 4) and a role chosen at invitation (client Q5). Board fields, paste-ready description, and the edit to SCRUM-90. Review: `../../reviews/W8/review-cs57-tim-scrum-90-member-management.md` |
| `jira/jira-scrum-93-queue-inputs.md` | 2026-09-26: full replacement description for SCRUM-93 after PR #35 (3 points after the split; the edit to make on the board is at the top) — queue rows, AI-assisted items, choosing a submission to review, API refusals, rework, `working_count` caveat; S10 kept. Checked against `38e7f4f` |
| `jira/jira-split-scrum-93.md` | 2026-09-26: SCRUM-93 split by code between Kanishka (A, the available-work list, 1.5) and Hanchen (B, the item workspace panel incl. S10, 1.5, new ticket); SCRUM-113 to W9. Board steps and both paste-ready descriptions |
| `jira/jira-new-review-choose-submission.md` | 2026-09-26: new 1-point W9 ticket split from SCRUM-93 when it was re-estimated to 3 — the reviewer chooses which of an item's submissions to review. Board fields and paste-ready description |
| `tests/manual-test-SCRUM-48.md` | 2026-09-26: walkthrough for PR #35 in the running app — independence, the limit, per-submission review, return and reject rework; needs a dev-database reset. Dry-run results and observations for SCRUM-93 inside |
| `scripts/sandbox-SCRUM-48.py` | Helper for that walkthrough: creates an N-annotator item and shows queues, peer visibility and item status through the API, since the web app has no queue screen yet |
| `plans/plan-SCRUM-48-fixes.md` | 2026-09-25: Hanchen fixes Kanishka's PR #33 (SCRUM-48) on a branch stacked on `CS57-KANISHKA`, for Jingwei's re-review — decisions A–E, 11 commits, and messages to Kanishka and the PR. Review: `../../reviews/W8/review-cs57-kanishka-scrum-48-work-queues.md` |
| `jira-W8-descriptions.md` | 2026-09-22: full, paste-ready descriptions for every W8 ticket — SCRUM-93 (with S10), 86 (only the escalation paths remain), 51 (W8 and W9 slices), the new D2 ticket, 27 (no longer blocked), 3, 46 (AI as author), 5, 24 (lifecycle decided); one-line fixes to carry-over SCRUM-48 (`is_task_item_export_eligible`) and SCRUM-90 (invitee screen). Checked against `main` `23e62a9` |
| `jira-scrum-99-r2-1.md` | 2026-09-24: full replacement description for SCRUM-99 (E3) after the client's R2-1 — Accept / Return / Reject, final for the dispute, reason required, no self-adjudication. Checked against `main` `fd273b9` |
| `jira-new-D9-B7-B8.md` | 2026-09-24: paste-ready new tickets for the three stories added from the client's Round 2 — D9 (project owner reopens a finalised item, W9), B7 (JSONL import, one item per record, W11), B8 (task-level `annotation_type`, W11). Checked against `main` `fd273b9` |
| `jira-replace-parent-tickets.md` | 2026-09-22: Jira would not convert subtasks, so the unfinished parents with subtasks — SCRUM-36, 39, 42 and their 11 subtasks — are deleted and replaced by 11 standalone tasks. The order (create first, then delete), paste-ready descriptions, the follow-ups (dead keys in `story_src.csv`, SCRUM-50, docs), and the deleted tickets' original text. Supersedes §0 of `jira-W8-sprint.md` |
| `story-updates-client-qa-R1.md` | 2026-09-22: rewrites of D8, C4, I4, B2 and F2, applied directly to `story_src.csv` the same day, from the client's written answers of 2026-09-21 — AI first pass outside the human count (R1-4), blind-then-reveal moved from C4 to I4 (R1-2), policy versions instead of a freeze (R1-7) |
| `msg/message-client-qa-R1-corrections.md` | 2026-09-22: messages to Kanishka (SCRUM-48/93), Michael (SCRUM-46) and Jingwei (SCRUM-20/50) on the same answers |
| `msg/client-qa-round2.md` | 2026-09-22: draft questions for the client, in `shared/client-qa.md`'s own format, ready to paste into the shared doc for the 2026-09-23 meeting — F5, F2, F1, F3 (priority order), plus Hunter's still-unanswered branch-protection ask carried over from Round 1 |
| `jira-scrum-5-89-swap.md` | 2026-09-22: SCRUM-5 back to Michael (his own request, board already updated), SCRUM-89 (J2) to Tim in its place — board fields and description append to paste in, roadmap changes already made, and an open question for Hanchen on the break-week accounting Michael asked for |
| `jira-W8-sprint.md` | Paste-ready Jira entries for the W8 sprint: owner, sprint and re-estimated points for every ticket; the new D2 ticket; descriptions for SCRUM-58, 59 and the SCRUM-36 container; additions to SCRUM-93 (S10), 46, 5 and 24; carry-over from W7, listed but not counted |

Create `plans/`, `tests/`, `scripts/` and `commits/` here as the week needs them, following the naming
conventions in `../README.md`.
