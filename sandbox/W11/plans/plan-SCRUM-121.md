# Plan — SCRUM-121: Reads never write, and the project page counts its tasks once

2026-10-23. Story **A6** (P1), second and last ticket; SCRUM-119 (#54) delivered the first. Board: W11, 1 point,
Jason Wang (Hanchen), In Progress. Ticket text: `../../Break/jira/jira-A6-reads-never-write.md`. Evidence:
`../../Break/tests/perf-findings.md`. A6 has no feature spec; its criteria are in `shared/story_src.csv`.

**Branch:** `CS57-Hanchen-scrum-121` from `origin/main` at `efb5900` (#96 merged). The ticket's precondition,
SCRUM-126 (#88), merged on 2026-10-20. Line numbers below are as of `efb5900`.

**Committing:** Hanchen commits and pushes every commit by hand. Each commit's message is a file in
`commits/scrum-121-<n>-<slug>.txt`, with the files to stage.

## Decisions (2026-10-23, Hanchen)

| Decision | Why |
| --- | --- |
| **Delete the read-time repair, don't move it.** If the probe (step 0) is clean, the repair functions go, together with the tests that only test them | Every write path already sets the status where it changes (below). The repair now only serves rows from before #88, and #88 made every development database reset, SQLite included. Keeping it as a one-off would leave two status rules that can disagree, which is how SCRUM-120's flip happened |
| **Criterion 3 of the ticket (a one-off repair in `migrate_db_schema()`) is dropped** | After the reset, it would have nothing to repair. The PR records this; update the Jira description to match |
| **The project page uses #97's count endpoint** (`GET /organizations/{id}/task-item-counts`): every item of the task | It is the number the page shows today (setup's `item_count`), and the Projects and Organization pages already use it in #97. The ticket's "same rule as SCRUM-89's overview" (export-eligible items) would change the numbers and disagree with those pages |
| **Commit 5 waits for #97** (Jingwei, draft) | #97 adds the endpoint and `loadTaskItemCounts()`, and edits `getProjectWorkspaceView`, the function commit 5 changes. Commits 1 to 4 overlap #97 in one file only, `review_actions.py`, in a different place (#97: finalized items, around `:2247`; here: `:2006`) |
| New code comments name the story (A6) or the PR, not SCRUM-121 | The next team has no Jira (`../jira/jira-new-replace-scrum-references.md`) |

## What the reads do today

`TaskService.list_task_items` (`task_service.py:1037`) calls `list_task_items_with_send_back_resolution`
(`task_item_status_resolution.py:649`) on every call. That function does three things:
1. `reconcile_resubmitted_send_back_items`: an `expert_send_back` item whose authors have resubmitted gets its
   status recomputed and written;
2. `repair_expert_send_back_for_task`: an item whose history says it was returned, but whose status says otherwise,
   is written to `expert_send_back`. The evidence is escalation rows, legacy `adjust` rows stored as `annotated`, and
   `escalation_decided` audit rows alone;
3. `apply_expert_send_back_to_items`: the response reports `expert_send_back` for those items, whatever is stored.

Three routes call `list_task_items`: `GET /tasks/{id}/task-items` (`tasks.py:511`), `GET .../content` (`tasks.py:534`)
and `GET /tasks/{id}/setup` (`task_setup_service.py:84`). The ticket measured 235 statements and 176 ms per
task-items call on a 200-item task with history, against 6 statements and 11 ms without the repair.

**The writes already set the status:**
- an expert Return: `decide_escalation` sets `EXPERT_SEND_BACK` and commits (`review_actions.py:1986`), then
  `ensure_expert_send_back_status` sets it again (`:2006`);
- a resubmission: `submit_draft` → `_advance_task_item_to_annotated_on_submit` → `item_status_after_accept`
  (`draft_service.py:657`), which reads the Return authority and waits for every returned author;
- a dispute decision: `item_status_after_accept` (`annotation_dispute_service.py:542`, `:751`).

Parth's test `test_legacy_return_aggregate_and_reads_wait_for_every_affected_author`
(`test_independent_second_review.py:3465`) shows it: after real submissions the reconcile finds nothing
(`== 0`), and finds 1 only after the test sets the status by hand.

**What stays:** `current_expert_send_back_at_by_submission` (the replacement guard in `item_status_after_accept`,
and the annotate queue in `task_work_queue_service.py:127`). It reads evidence and writes nothing. Its legacy and
audit fallbacks are out of scope.

## Ground rules

| Rule | Why |
| --- | --- |
| No schema change, no reset | Nothing about the stored data changes |
| Routes keep their paths and response shapes | The web, and the harness's `item_status` step (`evaluation/harness/driver.py:267`, `:687`), read task-items |
| The casebook passes unchanged: 87/87, 1 skipped | If a case needed the read-time repair, a write is wrong: fix the write, don't change the case |
| Don't touch `annotation_dispute_service.py`, `draft_service.py` or `review_policy_enforcement.py`, unless the probe finds a write that needs fixing | Other people's hot files |
| `review_actions.py`: only the `ensure_expert_send_back_status` call and its import | #97 edits the same file elsewhere |
| Out of scope | The annotate work queue request (about 520 ms, #52); the legacy fallbacks inside `current_expert_send_back_at_by_submission`; making `GET .../content` read one item instead of the list |

## Step 0. The probe (local, not committed)

Prove that no current write leaves a state the repair would change. In a scratch copy of
`list_task_items_with_send_back_resolution`:
- run `reconcile_resubmitted_send_back_items` and `repair_expert_send_back_for_task` inside
  `db.begin_nested()`, roll the savepoint back, and raise if either returned more than 0;
- raise if `apply_expert_send_back_to_items` would report a status different from the stored one.

Then run:
1. the whole API suite, on SQLite and on PostgreSQL;
2. the casebook (`uv run python -m evaluation run`);
3. `init_data.py --reset`, both seed scripts, then `GET task-items` and `GET setup` for every seeded task, through a
   small script in `../scripts/`. `seed_test_projects.py` builds Return cases (`:716-723`) through the real paths.

**Result, 2026-10-23 on `efb5900`:** the probe never tripped.

| Run | Result | Reads through the probe | Reads that saw any Return evidence |
| --- | --- | --- | --- |
| API suite, SQLite | 2525 passed, 63 skipped, as without the probe | 1,459 | 0 |
| Casebook | 87/87 passed, 1 skipped | 294 | 0 |
| Seed (`init_data.py --reset`, scratch SQLite), then items and setup of all 20 tasks | 0 trips | 40 | 0 |
| API suite, PostgreSQL 18 | 2585 passed, 3 skipped | 1,465 | 1, already stored as `expert_send_back` (`test_independent_second_review.py`), so nothing to change |

Why no read saw any evidence: the repair only recognises resolved `TaskItemEscalationDB` rows and
`escalation_decided` audit rows, and only `decide_escalation` writes either (`review_actions.py:1948`, `:2012`).
That function is no longer a route: `POST .../escalations/decision` answers 410 (`retired_decide_escalation`,
`:1805`), and only tests call it. The seed holds no escalation rows or such audits at all. So nothing in the
app can produce the state the repair fixes; it serves rows from before #48 alone.
`decide_escalation` itself is dead code, but deleting it is out of scope here.

Had a test or case tripped, the rule was:
- **a hand-built state:** the test changes in commit 1 or 2;
- **anything else:** a write path that fails to set the status. That fix becomes its own commit before commit 1,
  `fix(api): <the write> sets the item's status (A6)`, with a test that fails before it. Stop and tell Hanchen first:
  it changes someone else's file.

## Commits

### 1. `perf(api): reading a task's items never writes (A6, SCRUM-121)`

`app/services/task_service.py:1036-1038`: `list_task_items` returns the repository's items; the call and its
import (`:77`) go. Nothing else changes yet, so this commit is the behaviour change alone.

Tests, new file `tests/test_task_item_reads.py`, on a fixture with history: one item returned by an expert, one
item resubmitted after a Return, one item reopened after a Return. Count statements with the
`before_cursor_execute` pattern (`test_task_drafts_read.py`):
- **Proves the change:** `GET task-items` runs the same number of statements for 10 items as for 40, each with
  history (on `main` it grows with the items);
- **Guards:** `GET task-items`, `GET setup` and `GET .../content` issue no `INSERT`, `UPDATE` or `DELETE`, and no
  `FOR UPDATE` (A6 criterion 5);
- **Statuses still right, through the writes alone:**
  - after an expert Return, the next read shows `expert_send_back`;
  - after every returned author resubmits, the next read shows the item's aggregate; after only one of two, still
    `expert_send_back`;
  - a Return decided before the item's latest reopen does not come back on any read (SCRUM-120's cutoff).

Existing tests that relied on the read writing (from the probe): give them the state through the write, or
assert the stored status. `test_task_list_returns_current_status_with_a_strongly_cached_pre_review_item`
(`test_independent_second_review.py:3969`) stays: if it fails because the read now returns a cached ORM status,
the fix is `populate_existing()` in the repository's `list_by_task`, not a second read.

### 2. `refactor(api): remove the send-back repair the reads no longer run (A6, SCRUM-121)`

Deletion only. The suite's count drops by exactly the deleted tests.
- `task_item_status_resolution.py`: delete `list_task_items_with_send_back_resolution`, the alias
  `repair_legacy_expert_send_back_for_task`, `reconcile_resubmitted_send_back_items`,
  `repair_expert_send_back_for_task`, `_update_item_status_if_unchanged`, `apply_expert_send_back_to_items`,
  `ensure_expert_send_back_status`, `_refresh_item_statuses_from_db` and `collect_expert_send_back_item_ids`.
  Then any helper or constant left unused (grep each: `_latest_send_back_at`, `_has_resubmitted_draft_after`,
  `_latest_resolved_escalations`, `_audit_send_back_item_ids`).
- `current_expert_send_back_at` (`:356`): keep only its `predecessor` path, the one the app calls
  (`independent_review_service.py:331`). The item-wide path served the repair's display.
- `review_actions.py`: delete the `ensure_expert_send_back_status` call (`:2005-2006`) and its import (`:108`).
  The decision already set the status at `:1986`.
- The module docstring: it resolves Return evidence; it no longer repairs.

Tests:
- `test_task_item_status_resolution.py`: delete the tests of the deleted functions; the file goes if nothing is left;
- `test_independent_second_review.py` (Parth, SCRUM-109):
  - delete the tests whose subject is the repair racing writers: `:3669`, `:3848`, `:3869`, `:3934`, `:4011`.
    Check each first: an assertion about the outcome of a write, not the repair, moves to commit 1's file;
  - `:3465`: keep the loop; delete the tail that sets the status by hand and calls the reconcile;
  - `:3771` (an old Return is not revived after an owner reopen): keep, through the route, without the
    monkeypatched collector;
  - `:2303`, `:2321`, `:2796` call `current_expert_send_back_at` without a predecessor: assert through
    `current_expert_send_back_at_by_submission` or the annotate queue, which is what they guard;
- `test_task_item_reopen.py:1253`: assert that the audit-only send-back before the reopen grants no Return
  (`current_expert_send_back_at_by_submission`, and the annotate queue), instead of `collect_expert_send_back_item_ids`.

**Before this commit, tell Parth** which of his tests go and why.

### 3. `docs: item status is written where it changes, never on read (A6, SCRUM-121)`

- `docs/design/backend/api_surfaces.md:334-340`: replace the read-side reconciliation paragraph. The reads return
  stored statuses; the Return, resubmission and dispute writes set them.
- `docs/design/product/workflow_states.md:183`: the same, for the read-side Return repairs bullet.

### 4. `refactor(web): delete the unused use-hydrated-task-items hook (A6, SCRUM-121)`

`apps/hej-web/components/use-hydrated-task-items.ts`: nothing imports it (`git grep` on `efb5900`), left over
from SCRUM-119. #97 doesn't touch it. `npm run typecheck:web` and `lint:web` show nothing else referred to it.

### 5. `perf(web): the project page reads every task's item count in one request (A6, SCRUM-121)`

**After #97 merges.** Merge `main` into the branch first, then re-check `project-data.ts`.
- `getProjectWorkspaceView` (`lib/project-data.ts:555` and `:572` on #97's head): one
  `loadTaskItemCounts([organizationId])`, then each task's count from it, falling back to
  `resolveTaskBacklogCount` when the counts fail, as `getProjectsOverviewData` does in #97. Start the counts
  read with the task list, not after it.
- The endpoint returns the whole organisation's tasks; the page takes its own. One request either way.

Tests in `lib/project-data.test.ts`:
- **Proves the change:** for a project with 3 tasks and with 8, one counts request and no `getTaskSetup`;
- if the counts read fails, each task falls back and the page still loads;
- the counts equal setup's `item_count` for the same tasks.

## Validation

1. `npm run check` (API tests, web tests, typecheck, lint), and the API suite on PostgreSQL (CI does both).
2. The casebook: 87/87 and 1 skipped, unchanged.
3. **Perf bed** (`../../Break/scripts/sandbox-perf-*.{py,sh}`). The `hej-perf` worktree is gone, so recreate it at
   `df7c05a` for the baseline and add the branch:
   - `GET task-items` on the 200-item task with history: target at most 20 ms and 0 writes;
   - the project page with 8 tasks (after commit 5): target at least 50% faster than `main`;
   - record before and after in the PR and in `perf-findings.md`.
4. **Manual walkthrough**, two browsers, on a fresh seed:
   - an expert returns an item; the annotator's Annotate queue shows it as rework; the Items tab shows
     `expert_send_back`;
   - the annotator resubmits; reload: the item moves on;
   - the owner reopens a returned item; reload twice: it stays reopened;
   - Network tab on the project page: one counts request, no `/setup` per task (after commit 5).

## PR

- Title: `perf(api,web): reads never write, and the project page counts its tasks once (A6, SCRUM-121)`. Set it
  before merging (`tech-stack.md` → PR title).
- Into `main`, merge commit. The reviewer is not decided in advance.
- Description, per `tech-stack.md`:
  - summary with A6 and SCRUM-121;
  - changes by layer;
  - decisions: deleted rather than moved, and criterion 3 dropped, with the reason; #97's endpoint and its rule;
  - testing: the probe's result, the perf table before and after, the casebook;
  - notes: what is out of scope.
- If #97 is still open when commits 1 to 4 are ready, open the PR as a draft and say commit 5 follows.

## After merge

- Mark SCRUM-121 Done; edit its description to say criterion 3 was dropped. Log the PR in the tracker.
- A6 → `done` through the next tracking-sync: SCRUM-119 and SCRUM-121 together cover criteria 1 to 5.
- Update `roadmap.md` (W11).
