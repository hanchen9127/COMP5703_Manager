# New ticket — Performance investigation (slow page loads)

2026-10-03. **Decided by Hanchen:** measure first, investigate only. Fixes become their own tickets,
drafted at the end of this one and placed at the W9 meeting. Plan:
`../plans/plan-perf-investigation.md`.

## Board steps

| Field | Value |
| --- | --- |
| Type | Task (bug investigation) |
| Summary | `Find why some pages load slowly, with measurements` |
| Sprint | Mid-semester Break. Unfinished on 7 Oct → W9 carry-over |
| Points | 1. Break bug and testing work, not counted in roadmap units |
| Assignee | Picked at the break meeting (Wed 7 Oct) |
| Parent / links | None. Fix tickets created from it link back with "is caused by" |

## Description

```
{noformat}
Reported during scenario testing (verbal): one section of the app sometimes takes a long time to load and sometimes does not. Which page, and on what data, is not recorded yet.

Scope: investigate only. Measure, explain, write up. No product code changes in this ticket; every fix becomes its own ticket with a measured target.

Hypotheses from reading origin/main (66b7ff6), to confirm or reject with numbers:
- H1 Drafts are fetched one request per item, twice on Annotate and Review (lib/live-task-workspace.ts, task-annotation-workspace-with-real-data.tsx, task-workbench.tsx). A 200-item JSONL task means ~400 requests per page load.
- H2 GET /tasks/{id}/task-items runs repair passes that UPDATE and commit on every read, scans audit_logs on unindexed columns, and runs its send-back collection twice (task_item_status_resolution.py).
- H3 The project page calls getTaskSetup and listTaskItems once per task to count the backlog (lib/project-data.ts).
- H4 get_current_user is async def but queries the database synchronously, so every request's auth lookup blocks the event loop (core/security.py); /auth/me and login likewise.
- H5 H2's writes on read wait on locks held by real writers (a submitting user, the AI worker), giving intermittent stalls.
- H6 AI pre-annotation defaults to inline: activating an AI-assisted task calls the model per item inside the request (core/config.py).
- H7 Hydration retries 404 and 5xx three times 400 ms apart; in dev, Turbopack compiles a route on its first visit.

Method:
0. Ask the reporter for the page, the task size, first visit or repeat, and what else was running.
1. Separate worktree and PostgreSQL database; seed tasks of 10, 50 and 200 items from the FewNERD JSONL, with review history, and a project with 8 tasks. Mock AI provider.
2. Local-only instruments: per-request timing with SQL count and a writes-on-GET flag; a /health probe for event-loop blocking; HAR per page load.
3. Baseline every main page in dev and prod-like mode, at 10 and 200 items; then scaling, writes on read, contention, activation, and the reporter's own case.

Done when:
- The reported page is identified and explained, or the record says why it could not be reproduced.
- A re-runnable baseline (commit, data sizes, mode) is recorded.
- Each of H1-H7 is confirmed, rejected or explicitly not measured, with numbers; rejected ones stay in the record.
- A fix ticket is drafted for each confirmed cause, each with a measured target, for the W9 meeting.
- No instrument, seed script or .env change reaches a pushed branch.
{noformat}
```

## Fix tickets drafted from the findings

Measured on 2026-10-04: `../tests/perf-findings.md`. The fixes belong to a new story, **A6 — A dataset-sized
task opens without a wait** (P1, added to `shared/story_src.csv` on 2026-10-04 by Hanchen's decision). Each
fix ticket opens `Related to user story A6`, so `tracking-sync` maps it.

| Fix | Hypothesis | Story | Ticket | Sprint | Status |
| --- | --- | --- | --- | --- | --- |
| Batched drafts read | H1 | A6 subtasks 1, 2 | **SCRUM-119** | W9 | On the board 2026-10-04 (Jason Wang, 2 points) |
| Reopened item flipped by the next read | H2 side effect | D9 | **SCRUM-120** | Break → W9 | On the board 2026-10-04 (Jingwei Lin, 1 point) |
| Stop repairing on read | H2 | A6 subtasks 3, 5 | — | W10 or W11 | Deferred (2026-10-04): the bug ticket closes the correctness gap first |
| Project page counts | H3 | A6 subtask 4 | — | W9 | With SCRUM-89 (J2) |

**Chosen 2026-10-04 (Hanchen): H1 plus a narrow bug fix.** H1 alone measured 2,969 → 222 ms on Annotate @200.
Removing the repair entirely is deferred; until it lands, reads still issue an UPDATE (A6 criterion 3 stays open).

**Impact on work in flight**, checked 2026-10-04 on `origin/main` `df7c05a`. Open PRs: #39 (Jingwei, harness) and
#48 (Yi, paused pending the client). Unpushed break work was checked against the files each ticket names.

| H1 touches | Who else is on it | Effect |
| --- | --- | --- |
| `live-task-workspace.ts`, `task-annotation-workspace-with-real-data.tsx`, `task-workbench.tsx` | Nobody since 13 Sep (merges only); no open branch or PR changes them | None expected |
| `GET /task-items/{id}/drafts`, kept unchanged | PR #39's harness calls it (`evaluation/harness/driver.py:327`); the panel's save path calls it (`lib/api/task-items.ts:253`) | None: the route stays as it is |
| `applyApiDraftsToMockItem`, `task-item-workspace-sheet.tsx` (28 changes in 3 weeks) | SCRUM-117 now; SCRUM-32 (D3) and SCRUM-87 (C4) in W9 | Not touched: the batch returns the same `ApiDraft` shape, so nothing downstream changes |
| The visibility rule (`AnnotationService.visible_to_caller`) | SCRUM-87 (C4, W9) may extend it: a human-only item never carries an AI suggestion | One helper serves both routes, so a rule change lands once |
| `api_surfaces.md` | PR #48 also edits it | Text conflict only; whoever merges second resolves it |

| The bug fix touches | Who else is on it | Effect |
| --- | --- | --- |
| `task_item_status_resolution.py`: `collect_expert_send_back_item_ids`, `_latest_send_back_at` | **PR #48 (Yi)** changes the same functions so a `return` decision also counts as a send-back | Real overlap. Tell Yi; whichever merges second applies the reopen cutoff to both decisions. #48 is paused, so the bug fix most likely lands first |

### SCRUM-119 — Performance: Read a task's drafts in one request

| Field | Value |
| --- | --- |
| Type | Task |
| Summary | `Performance: Read a task's drafts in one request` |
| Sprint | W9, placed at the W9 meeting |
| Points | 2 |
| Assignee | Picked at the W9 meeting |
| Links | "is caused by" the perf investigation ticket |

```
{noformat}Related to user story A6

BACKEND AND FRONTEND. W9.

Every task page fetches drafts one request per item, and Annotate and Review fetch them all a second time. Measured on origin/main df7c05a: a 200-item Annotate page sends 404 requests, runs 6,882 SQL statements and takes 2,969 ms. Each GET /task-items/{id}/drafts runs 13-16 statements, of which one reads drafts. No single statement is slow; the count is.

Built to change nothing around it: one new route beside the old one, the same response shape per item, and every component below the task shell untouched.

# GET /tasks/{task_id}/drafts returns every item's drafts in one response, keyed by item id, each list exactly what GET /task-items/{id}/drafts returns for that item: one scope check, one drafts query with authors eager-loaded, one own-answer query.
# Both routes apply the visibility rule through one AnnotationService helper, so an annotator who has not answered an item sees no peer's draft on it from either route, and a later rule change (for example SCRUM-87's) lands once.
# GET /task-items/{id}/drafts is unchanged. The panel's save path and the evaluation harness keep calling it.
# The task shell makes one batched call instead of one per item. The Annotate and Review tabs keep refreshing drafts when opened, now with one batched call, so they show the same fresh data as today. applyApiDraftsToMockItem, the item panel and every component below it are not changed.
# Target, on the same measurement: Annotate, Review and Items on a 200-item task under 300 ms, with no more than 10 API requests. The prototype measured 222 ms and 5 requests without the tabs' refresh; the refresh adds one call of about 25 ms.
# A route test proves the batched read returns exactly what the per-item route returns, for a reviewer, an annotator who answered and one who has not, and runs the same number of statements for 10 and 200 items.
# api_surfaces.md documents the new route (Docs Sync).

Not in scope: the send-back repair on GET task-items (A6 subtask 3), the project page counts (A6 subtask 4), deleting the unused use-hydrated-task-items.ts.

Collaboration:
- SCRUM-87 (C4, W9) may change who sees which drafts: it changes the shared helper, and this route follows.
- SCRUM-32 (D3) and SCRUM-98 (F1), both W9, add what a reviewer sees on an item: build on this read rather than adding another per-item fetch.
- PR #48 (Yi) also edits api_surfaces.md: text conflict only.
{noformat}
```

### SCRUM-120 — Bug: A reopened item is flipped to expert send-back by the next read

| Field | Value |
| --- | --- |
| Type | Task (the board has no Bug type) |
| Summary | `Bug: A reopened item is flipped to expert send-back by the next read` |
| Sprint | Mid-semester Break (a bug found in scenario testing); unfinished on 7 Oct → W9 carry-over |
| Points | 1 |
| Assignee | Suggested Jingwei (wrote the reopen, PR #46); picked at the break meeting |
| Links | "is caused by" the perf investigation ticket; "relates to" PR #48 |

Reproduced 2026-10-04 on `origin/main` `df7c05a` with `../scripts/sandbox-perf-reopen-flip.py`.

```
{noformat}Related to user story D9

BACKEND ONLY. Found by the performance investigation; reproduced on origin/main df7c05a.

Steps (a task needing one annotator):
1. An annotator submits; a reviewer escalates to an expert; the expert sends it back. Status: expert_send_back.
2. The annotator resubmits (annotated); a reviewer accepts (canonicalized).
3. The project owner reopens it with a reason. The response says pending.
4. Any read of GET /tasks/{id}/task-items or /setup. Status: expert_send_back.

Expected: pending, back in the open workflow (D9, client answer R2-3). Actual: the item sits in the expert send-back queue. The change is written by a GET: updated_at moves after item_reopened, and no audit row records it. The adjudication's Return calls the same reopen_task_item, so it is exposed the same way.

Cause: list_task_items_with_send_back_resolution (app/services/task_item_status_resolution.py:307) repairs statuses on every read. collect_expert_send_back_item_ids treats an item as sent back when its latest send-back has no submitted draft after it. The reopen marks the round's drafts superseded, so the resubmission no longer counts and the old send-back applies again.

# A send-back decided before the item's latest reopen (task_item_reopens.reopened_at, either cause) no longer counts, in collect_expert_send_back_item_ids and in _latest_send_back_at, for the escalation rows and the audit rows alike.
# A test following the steps above fails on origin/main and passes after the fix (proves the fix).
# Guards, green both ways: an item sent back after its reopen still shows expert_send_back; an item sent back and never reopened behaves as today.

Not in scope: removing the repair from the read path (A6 subtask 3, deferred to W10 or W11). Reads still issue an UPDATE until then.

Collaboration:
- PR #48 (Yi, paused pending the client) changes the same two functions to count a "return" decision as a send-back. Whichever merges second applies the reopen cutoff to both decisions; tell Yi before starting.
- SCRUM-99 (Yi): the adjudication's Return reopens through reopen_task_item, so its tests should include a read after the Return.
{noformat}
```
