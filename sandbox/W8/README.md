# W8 — 24–30 Sep 2026 (ends after the Wednesday client meeting)

**Branches:** `CS57-Hanchen-scrum-114` (PR #43 → `main`) and `CS57-Hanchen-scrum-113` (PR #44, stacked on #43)

W8 is allocated in `../../specs/roadmap.md` → W8. Hanchen's own work this week is the work panel on D8's queues
(first planned: the dispute record, SCRUM-58/59 — see below):

| Ticket | Story | Plan | State (2026-09-30) |
| --- | --- | --- | --- |
| SCRUM-114 — Item workspace panel: independence, refusals and S10 (1.5) | D8 | `plans/plan-SCRUM-113-114.md` | In Review, PR #43 (5 commits); walkthrough passed |
| SCRUM-113 — Review: choose which submission to review (1) | D8, D4 | `plans/plan-SCRUM-113-114.md` | In Review, PR #44 (5 commits); walkthrough passed |

**Board of 2026-09-28/30:** SCRUM-99 and SCRUM-100 (E3/E4, formerly SCRUM-58/59) went to Yi in the break;
SCRUM-113 moved from the break into W8. Hanchen's break tickets: SCRUM-116, SCRUM-117, SCRUM-38 (F3).

Also this week, as project manager:
- Ask client follow-ups F1, F2 and F5 at the 2026-09-23 meeting. F2 shapes SCRUM-58.
- Enter the W8 allocation on the board (`jira-W8-sprint.md`), then run `tracking-sync`.
- See that SCRUM-86 (Parth) merges in the first two days, before SCRUM-58 changes `decide_escalation`.

## Files

| File | What it is |
| --- | --- |
| `tests/manual-test-SCRUM-113.md` | 2026-09-29: walkthrough for SCRUM-113 on `CS57-Hanchen-scrum-113` — erin chooses between Charlie's and Dana's submissions, returns one and is moved to the other; disputed and no-review-rights (403) states; frank no longer sees Dana's name or answer in the list; the same from `/items`. **Run 2026-09-30: Parts 1–4 pass** (after restarting the web container, whose Turbopack build was stale) |
| `../../reviews/W8/pr-cs57-hanchen-scrum-113-review-chooser.md` | 2026-09-30: PR description for SCRUM-113, **opened as PR #44** (5 commits, base `CS57-Hanchen-scrum-114`; retarget to `main` after #43 merges), reviewers Kanishka and Jingwei |
| `tests/manual-test-SCRUM-114.md` | 2026-09-29: walkthrough for SCRUM-114 on `CS57-Hanchen-scrum-114` — S10 across Save draft, reopen, reload and resubmission; frank (annotator + reviewer) sees an empty editor and no feedback on dana's work while the Review tab still shows it; the 409 limit refusal word for word; the same on `/review` and `/items`; the leave-page warning only after an edit; optional AI refusal. Uses `scripts/sandbox-SCRUM-48.py`. **Run 2026-09-29: Parts 1–6 pass**; found the vanishing "Draft saved." (fixed, commit 5) and the Postgres reset needed since #28 |
| `../../reviews/W8/pr-cs57-hanchen-scrum-114-panel.md` | 2026-09-29: PR description for SCRUM-114 (`CS57-Hanchen-scrum-114` → `main`, 5 commits), reviewers Kanishka and Jingwei. **Opened as PR #43**, 2026-09-29 |
| `plans/plan-SCRUM-113-114.md` | 2026-09-29: commit-by-commit plan for SCRUM-114 (S10, no peer draft in the Annotate tab, the "X is annotating" block removed, 409 refusals) and SCRUM-113 (the panel reads the review queue, chooses a submission through the adjustment read, moves to the next one), as two stacked PRs. Checked against `main` `e367ebd` |
| `jira/jira-scrum-93-after-113-114.md` | 2026-09-30: full replacement description for SCRUM-93 after #43 and #44 — SCRUM-113 in W8 as #44, #33/#35 merged, the review list hands the panel nothing, the list must not name annotators (hydration no longer shows colleagues' drafts), `ApiWorkQueueItem` to move into `work-queues.ts`, `working_count` caveat widened. Paste-ready |
| `jira/jira-break-review-guards.md` | 2026-09-27: from the D8 browser walkthrough and the PR #33 pre-merge comment — two new Mid-semester Break tickets (A: the review action refuses a decision on a submission not awaiting the caller; B: an annotator resubmits only work that is theirs to redo, rule to confirm at the weekly meeting) and an addition to SCRUM-109 (status after a submission), 1 → 1.5 points. Paste-ready |
| `jira/jira-new-J3-invitee-screen.md` | 2026-09-26: SCRUM-115 (2 points, Tim, W8), split from SCRUM-90 at the review of PR #28 — the invitee's pending-invitation screen (SCRUM-90 criterion 4) and a role chosen at invitation (client Q5). Board fields, paste-ready description, and the edit to SCRUM-90. Review: `../../reviews/W8/review-cs57-tim-scrum-90-member-management.md` |
| `jira/jira-scrum-93-queue-inputs.md` | 2026-09-26: full replacement description for SCRUM-93 after PR #35 (3 points after the split; the edit to make on the board is at the top) — queue rows, AI-assisted items, choosing a submission to review, API refusals, rework, `working_count` caveat; S10 kept. Checked against `38e7f4f` |
| `jira/jira-split-scrum-93.md` | 2026-09-26: SCRUM-93 split by code between Kanishka (A, the available-work list, 1.5) and Hanchen (B, the item workspace panel incl. S10, 1.5, new ticket); SCRUM-113 to W9. Board steps and both paste-ready descriptions |
| `jira/jira-new-review-choose-submission.md` | 2026-09-26: new 1-point W9 ticket split from SCRUM-93 when it was re-estimated to 3 — the reviewer chooses which of an item's submissions to review. Board fields and paste-ready description |
| `tests/manual-test-SCRUM-48.md` | 2026-09-27 (updated): walkthrough for D8 on `CS57-KANISHKA` (#35 merged into #33, 2026-09-27) in the running app via Docker Compose — independence, peer reviews hidden, the limit and greyed-out queue rows, per-submission review, return and reject rework, and an optional AI-assisted part (local Ollama). Needs a dev-database reset (done 2026-09-27). Dry-run through the API, all seven parts matched |
| `scripts/sandbox-SCRUM-48.py` | Helper for that walkthrough (run with `py`): creates an N-annotator item, human-first or AI-assisted (`--ai`), and shows queues (with `can_annotate`, `rework`, `submitted_by_you`), peer visibility of answers and reviews, and item status through the API, since the web app has no queue screen yet |
| `plans/plan-SCRUM-48-jingwei-review.md` | 2026-09-27: Jingwei's review of PR #35 checked point by point with scratch tests on `3d4d06d` (all true); commits 16–18 — `submitted_at` (`c92a496`), approvals since the last submission (`5adfe72`), an open escalation keeps an item disputed (`5113d18`) — pushed, reply posted. Point 1 (a rejected AI first pass strands the item) is Yi's issue #38 |
| `plans/plan-SCRUM-48-fixes.md` | 2026-09-25: Hanchen fixes Kanishka's PR #33 (SCRUM-48) on a branch stacked on `CS57-KANISHKA`, for Jingwei's re-review — decisions A–E, 11 commits, and messages to Kanishka and the PR. Review: `../../reviews/W8/review-cs57-kanishka-scrum-48-work-queues.md` |
| `jira-W8-descriptions.md` | 2026-09-22: full, paste-ready descriptions for every W8 ticket — SCRUM-93 (with S10), 86 (only the escalation paths remain), 51 (W8 and W9 slices), the new D2 ticket, 27 (no longer blocked), 3, 46 (AI as author), 5, 24 (lifecycle decided); one-line fixes to carry-over SCRUM-48 (`is_task_item_export_eligible`) and SCRUM-90 (invitee screen). Checked against `main` `23e62a9` |
| `jira-scrum-99-r2-1.md` | 2026-09-24: full replacement description for SCRUM-99 (E3) after the client's R2-1 — Accept / Return / Reject, final for the dispute, reason required, no self-adjudication. Checked against `main` `fd273b9` |
| `jira-scrum-86-fold.md` | 2026-09-30: SCRUM-86 (D1, issue 7) folded into SCRUM-116 (routing, Jingwei) and SCRUM-99 (deciding, Yi) by Hanchen's decision — replacement descriptions for all three; 86 becomes a no-points container closed when both are Done; 99 also maps to D1 |
| `jira-W8-leftover-updates.md` | 2026-09-30: full replacement descriptions for five unfinished W8 tickets, from a live board export — SCRUM-111 (the decisions of PR #42's review), 113 and 114 (what #44 and #43 actually do), 51 and 109 (carried over; per-submission review, the break tickets that share their code). SCRUM-86 waits for Hanchen's call on its overlap with SCRUM-116 and 99 |
| `jira-scrum-110-update.md` | 2026-09-30: full replacement description for SCRUM-110 (D9) before Jingwei starts — reopen only on an active task (PR #41), rounds of work (old submissions superseded, not counted or overwritten), history row instead of F1's event (F1 moved to W11), one reopen function shared with SCRUM-99, frontend after PR #43/#44. Points left to Hanchen. Checked against `main` `e367ebd` |
| `jira-new-D9-B7-B8.md` | 2026-09-24: paste-ready new tickets for the three stories added from the client's Round 2 — D9 (project owner reopens a finalised item, W9), B7 (JSONL import, one item per record, W11), B8 (task-level `annotation_type`, W11). Checked against `main` `fd273b9` |
| `jira-replace-parent-tickets.md` | 2026-09-22: Jira would not convert subtasks, so the unfinished parents with subtasks — SCRUM-36, 39, 42 and their 11 subtasks — are deleted and replaced by 11 standalone tasks. The order (create first, then delete), paste-ready descriptions, the follow-ups (dead keys in `story_src.csv`, SCRUM-50, docs), and the deleted tickets' original text. Supersedes §0 of `jira-W8-sprint.md` |
| `story-updates-client-qa-R1.md` | 2026-09-22: rewrites of D8, C4, I4, B2 and F2, applied directly to `story_src.csv` the same day, from the client's written answers of 2026-09-21 — AI first pass outside the human count (R1-4), blind-then-reveal moved from C4 to I4 (R1-2), policy versions instead of a freeze (R1-7) |
| `msg/questions_from_Yi.md` | 2026-09-28: Yi's 73 dispute and canonicalization questions, answered in Chinese for Yi — 20 answered by the client, 26 settled, 17 internal, 10 to ask the client (approved answers that differ), plus a summary |
| `msg/issue-40-rewrite.md` | 2026-09-28: new title and body for Yi's issue #40, which Hanchen edits directly — only the canonicalization conflict, a constraint until the client answers, unassigned. Checked against `main` `c5b428b` |
| `msg/message-client-qa-R1-corrections.md` | 2026-09-22: messages to Kanishka (SCRUM-48/93), Michael (SCRUM-46) and Jingwei (SCRUM-20/50) on the same answers |
| `msg/client-qa-round2.md` | 2026-09-22: draft questions for the client, in `shared/client-qa.md`'s own format, ready to paste into the shared doc for the 2026-09-23 meeting — F5, F2, F1, F3 (priority order), plus Hunter's still-unanswered branch-protection ask carried over from Round 1 |
| `jira-scrum-5-89-swap.md` | 2026-09-22: SCRUM-5 back to Michael (his own request, board already updated), SCRUM-89 (J2) to Tim in its place — board fields and description append to paste in, roadmap changes already made, and an open question for Hanchen on the break-week accounting Michael asked for |
| `jira-W8-sprint.md` | Paste-ready Jira entries for the W8 sprint: owner, sprint and re-estimated points for every ticket; the new D2 ticket; descriptions for SCRUM-58, 59 and the SCRUM-36 container; additions to SCRUM-93 (S10), 46, 5 and 24; carry-over from W7, listed but not counted |

Create `plans/`, `tests/`, `scripts/` and `commits/` here as the week needs them, following the naming
conventions in `../README.md`.
