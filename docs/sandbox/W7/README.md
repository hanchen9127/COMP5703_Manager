# W7 — 14–23 Sep 2026 (ends after the Wednesday client meeting)

**Branch:** `CS57-Hanchen`

W7 keeps the assignments already on the Jira board (`../../specs/roadmap.md` → W7). SCRUM-28 and
SCRUM-26 are assigned to you for this week — SCRUM-28 first, then SCRUM-26.

| Ticket | Story | Plan |
| --- | --- | --- |
| SCRUM-28 — Prevent finalised annotations being overwritten | D5 | `plans/plan-SCRUM-28-26.md`, Commits 1 and 4 — revised from `../W6/plans/plan-SCRUM-25-26-28.md` |
| SCRUM-26 — Make draft submission atomic | D5 | `plans/plan-SCRUM-28-26.md` → *SCRUM-26 (re-planned 2026-09-19)*, Commits 2–5, on `CS57-Hanchen-scrum-26` stacked on PR #19 |

Also this week, as project manager (`../../specs/roadmap.md` → W7):
- Follow up the client questions still open — questions 2 and 6, and follow-ups F1–F5
  (`../../info/client-question.md`). F5 (reopening a finalised item) is the one D5 waits on.
- Triage the open PR queue.

Client answers of 2026-09-15 (`../../info/client-question.md`) change the design SCRUM-25 was built
on. Its defects against those answers are recorded for a follow-up fix commit.

## Files

| File | What it is |
| --- | --- |
| `plans/plan-SCRUM-28-26.md` | Commit-by-commit plan for SCRUM-28 and SCRUM-26 against `origin/main` `5070efd`: refuse new work on finalised items, defer repository commits, atomic submission, docs |
| `plans/defects-SCRUM-25.md` | Where merged SCRUM-25 no longer fits the client's answers (per-author versions, AI as its own author), with proposed follow-up commits |
| `tests/manual-test-SCRUM-28.md` | Two-browser walkthrough for SCRUM-28: finalise an item, then try to save and resubmit from the annotator's stale page and see both refused. Covers what the automated tests cannot — the stale page — and checks the send-back loop still works |
| `tests/manual-test-SCRUM-26.md` | Two-browser walkthrough for SCRUM-26 (PR #23): the submit response carries `annotation_id` and the draft stores the same one; the `draft_submitted` history row appears; a resubmission after Adjust keeps the same annotation; and the finalised refusal is still 409 with unchanged text after Commit 2. The rollback itself is left to the automated tests |
| `commits/commits-SCRUM-28.md` | Commit index for SCRUM-28: the one commit (`1adc707`), what it touched, the baseline and after counts, and the branch step before PR #19 merges |
| `commits/commit-SCRUM-28-1-fix-finalised-item-writes.txt` | The SCRUM-28 commit message, as committed |
| `commits/commits-SCRUM-26.md` | Commit index for SCRUM-26 on `CS57-Hanchen-scrum-26`: baseline 264 / 147, what each commit touched, its evidence, and the commands to commit and push |
| `commits/commit-SCRUM-26-1-refactor-finalised-domain-error.txt` | Message for SCRUM-26 Commit 2: the finalised-item guard raises `TaskItemFinalisedError`, and `DraftService` maps it to 409 |
| `message-michael-finalised-error.md` | Message for Michael, 2026-09-19: the guard is now a domain error; PR #22's `except HTTPException` must catch both until the two PRs are on main |
| `../../reviews/W7/pr-Michael.md` | The descriptions of Michael's PRs #20 (C2 design docs), #21 (SCRUM-1 job tables) and #22 (SCRUM-2 worker), as posted, kept next to their reviews (2026-09-18). #20 and #21 merged 2026-09-18 |
| `jira-bug-task-delete.md` | Decision record for issue 30 (deleting a task or project with items returns 500): no Jira ticket — it is carried by B4/SCRUM-24 and recorded in issues.md and the client-facing backlog. Keeps the root cause and what the fix must decide |
| `message-kanishka-SCRUM-48-questions.md` | Reply to Kanishka's four SCRUM-48 questions (2026-09-19): the count is distinct submitting authors including AI; "taking" is SCRUM-25's draft ownership, recorded as `draft_started` through one helper for Yi to migrate (option A); a proposed per-task queue endpoint shape; the review queue's two exclusions built this week (decided 2026-09-19). Also: `is_item_finished()` does not exist yet |
| `message-dishank-SCRUM-43.md` | Message for Dishank, 2026-09-19: agree the `is_item_finished()` signature with Kanishka today (not yet on any branch); issues 19 and 27; how it relates to the SCRUM-28 guard; SCRUM-43 status and ETA |
| `msg/message-michael-pr22-round2.md` | PR #22 round-2 **Approve** for Michael, 2026-09-21: the six findings and the schema snapshot verified at `37a7fc2`; approved because worker mode is off by default; five follow-ups for SCRUM-3 (untested `lease_owner` fence, `worker_id` read at load time, worker tests not on PostgreSQL, sweep UPDATEs not re-checking expiry, silent subtype-change failure), with no worker mode on PostgreSQL or multiple workers until the PostgreSQL items land; and where "the client resolved both" came from |
| `msg/message-kanishka-pr23-and-s10.md` | Message for Kanishka, 2026-09-20: PR #23 is ready for review (five commits, stacked on #19); the marked place for her SCRUM-48 limit inside the submit transaction and the refusal order she has not yet confirmed; defect S10 from the walkthrough, carried by SCRUM-93 |
| `msg/message-yi-issue-11.md` | Reply to Yi (in Chinese), 2026-09-19: how issue 11 is fixed in SCRUM-26 (PR #23): Commits 2–3 done, 4 in progress; the `draft_submitted` row joins the submission transaction (D1); where F1's submission event hooks in; what is not fixed (S5, `_latest_annotation`) |
| `message-yi-SCRUM-62-taking-events.md` | Message for Yi (in Chinese), 2026-09-19: SCRUM-48 records "taking" through the `record_item_taken` helper, which SCRUM-62 migrates to F1 events; where the submission event hooks in; the schema-change order; the AI-draft takeover wrinkle, and the AI suggestion as a missing F1 event |
| `message-SCRUM-48-client-answer.md` | Message for Kanishka: SCRUM-48 is rescoped — no assignment at all, replaced by role-checked queues, a task-level required-annotators count and a server-side submission limit. Send today; she is mid-ticket |
| `message-michael-c2-review.md` | Reply to Michael: both C2 questions answered (durability not required; Postgres is in scope as SCRUM-94), the review of PRs #20 and #21, and what the client's AI answer does to the SCRUM-1 schema |
| `message-michael-c2-followup.md` | Second reply to Michael: Option B agreed on condition of WAL and busy_timeout for SQLite; CI, a Docker-free setup path and the UtcDateTime note folded into SCRUM-94; SCRUM-94 moved from A3 to C2 |
| `message-michael-correction.md` | Correction to Michael: CI could not yet reach Postgres, because the 10 database tests hard-code in-memory SQLite (and it is 10 files, not 22). SCRUM-94 now converts them onto a shared fixture |
| `message-michael-pr22-review.md` | Paste-ready GitHub review of PR #22 (SCRUM-2 worker), Request changes: retarget to `main`; lease ownership on write, `max_attempts` on reclaim and reclaim errors fixed before merge; AI output as the AI's own submission goes to SCRUM-46 (decided 2026-09-19) |
| `jira-rescope-SCRUM-48-93.md` | Paste-ready Jira rewrites for SCRUM-48 and SCRUM-93 after the 2026-09-17 scope change: both tickets still carry D8's old assignment criteria word for word. Also flags SCRUM-52's "assigned disputes" wording |
| `jira-new-postgres-migration.md` | New Jira ticket for Parth (SCRUM-94): move onto PostgreSQL this week while keeping SQLite working. Rescoped 2026-09-18 — now hangs off C2 and includes CI and a Docker-free setup path. Records the scope conditions, the timing constraint and what it costs — SCRUM-86, and with it Critical issue 7, moves to W8 |

Create `tests/`, `scripts/` and `commits/` here as the week needs them, following the naming
conventions in `../README.md`.
