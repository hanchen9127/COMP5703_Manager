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

**As built (2026-10-23):**
- `db_store.py` `TaskItemRepository.list_by_task` also reads `TaskItemDB.status` as a column and reports it, in
  place of `_refresh_item_statuses_from_db`. Not `populate_existing()`: the app's sessions run with
  `autoflush=False`, so it would discard a caller's unflushed changes.
- `tests/test_task_item_reads.py`, 4 tests. On `main`: the list runs 80 statements for 10 items with history and
  260 for 40, and both reads write an `UPDATE`; with the change, 5 and 5, and no write. The no-write guard covers
  task-items and setup, the two reads A6 criterion 5 names; content goes through the same `list_task_items`.
- Through today's two-level dispute, an expert's Return stores `returned` (the answer is back with its author),
  not `expert_send_back`. `item_status_after_accept` returns `expert_send_back` only from item-level Return
  evidence, which the retired route alone wrote. Out of scope here.
- `test_independent_second_review.py:3771`, renamed `test_task_list_does_not_revive_old_return_after_real_owner_reopen`:
  sequential, through the real writes; the reader holds its copy of the item from before the new round. It fails
  with the `db_store.py` change undone.
- Suite: SQLite 2529 passed, 63 skipped (2525 + 4); PostgreSQL 18 2589 passed, 3 skipped (2585 + 4).
- Pushed by Hanchen as `f785723`.
- Message: `commits/scrum-121-1-reads-never-write.txt`.

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
  - `:2303`, `:2321`, `:2796` call `current_expert_send_back_at` without a predecessor: assert through
    `current_expert_send_back_at_by_submission` or the annotate queue, which is what they guard;
- `test_task_item_reopen.py:1253`: assert that the audit-only send-back before the reopen grants no Return
  (`current_expert_send_back_at_by_submission`, and the annotate queue), instead of `collect_expert_send_back_item_ids`.

Parth is not told in advance (Hanchen, 2026-10-23).

**As built (2026-10-23):**
- `task_item_status_resolution.py` 662 → about 320 lines. Besides the nine functions and the alias: the helpers
  `_resolved_send_back_decision_filter`, `_latest_resolved_escalations`, `_latest_send_back_at`,
  `_has_resubmitted_draft_after`, `_audit_send_back_item_ids`, the constants `FINALIZED_STATUSES` and
  `UNRESOLVED_STATUS`, and five imports. `current_expert_send_back_at` requires `predecessor`.
- `db_models.py:294`: the audit index comment names the Return evidence lookups, not the repair.
- `test_task_item_reopen.py:1253` (history-only send-back before a reopen) is deleted, not rewritten: a reopen
  marks the round's answers `is_latest=False`, so `current_expert_send_back_at_by_submission` returns nothing
  for them whatever its cutoff, and the assertion would hold vacuously.
- `test_independent_second_review.py:2254`: with `predecessor`, the `before_submission` case grants no Return,
  matching the 409 the same test already expected.
- SQLite 2514 passed, 63 skipped (2529 − 15 deleted cases); PostgreSQL 18 2574 passed, 3 skipped (2589 − 15);
  casebook 87/87, 1 skipped.
- Message: `commits/scrum-121-2-remove-send-back-repair.txt`.

### 3. `docs: item status is written where it changes, never on read (A6, SCRUM-121)`

- `docs/design/backend/api_surfaces.md:334-340`: replace the read-side reconciliation paragraph. The reads return
  stored statuses; the Return, resubmission and dispute writes set them.
- `docs/design/product/workflow_states.md:183`: the same, for the read-side Return repairs bullet.

**As built (2026-10-23):** also the sentence on "Return reconciliation" in the paragraph above it
(`api_surfaces.md:328-330`) and in `workflow_states.md:182`, and `apps/hej-api/README.md:358`, whose test index
named the deleted `test_task_item_status_resolution`. `workflow_states.md:178` (`RETURNED` and `EXPERT_SEND_BACK`)
is left to `../jira/jira-new-retire-expert-send-back.md`. Message: `commits/scrum-121-3-docs-reads-never-write.txt`.

### 4. `refactor(web): delete the unused use-hydrated-task-items hook (A6, SCRUM-121)`

`apps/hej-web/components/use-hydrated-task-items.ts`: nothing imports it (`git grep` on `efb5900`), left over
from SCRUM-119. #97 doesn't touch it. `npm run typecheck:web` and `lint:web` show nothing else referred to it.

**As built (2026-10-23):** nothing imports it, in code or docs. `tsc --noEmit` fails on a stale local
`.next/types/validator.ts` (three pages that no longer exist); with `.next` left out it has 0 errors. lint: 0
errors, 45 warnings, none in the deleted file. test:web 778 passed (78 files). Message:
`commits/scrum-121-4-delete-hydrated-hook.txt`. Commits 2 and 3 were pushed as `8a9fb310` and `ccca265a`.

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

**As built (2026-10-24):**
- `origin/main` (`ffc42abd`, #97) merged into the branch as `b0d9c309`, no conflicts. Not pushed yet.
- `project-data.ts`: the counts read starts beside the project's other reads, chained on `getProject` for the
  organisation id. A local `backlogCountOf` serves both task branches (policies aggregate, and `listTasks` when
  that fails). There is no `readIf`: the endpoint lets any member of the organisation read it.
- **Tests moved to `lib/project-data-loader.test.ts`**, not `project-data.test.ts`: it already mocks every read of
  `getProjectWorkspaceView`. There are 5 new cases:
  - **Prove** (3 and 8 tasks): one counts request, no setup read;
  - **Prove:** the `listTasks` branch uses the same counts;
  - **Guard:** when the counts read fails, each task falls back to its setup;
  - **Prove:** a task the counts don't list falls back alone.

  On the old code all but the failing-counts Guard fail (4 of 5). "Counts equal setup's `item_count`" is the
  backend's contract (the endpoint's docstring, #97), not tested again on the web.
- `lib/project-workspace-disputes.test.ts`: its organisations mock gains `listOrganizationTaskItemCounts`.
- test:web 1018 passed (108 files). tsc is clean outside the stale `.next/types`. lint: 0 errors, 38 warnings.
- Message: `commits/scrum-121-5-project-page-counts-once.txt`.

## Commits 6–7: the Dashboard and Projects page read per organisation, not per project (added 2026-10-24)

**Why.** Jingwei reported that the Dashboard (`/`) loads slowly. Measured on the perf bed
(`../../Break/tests/perf-findings.md` → "The Dashboard"), with 11 projects:
- **#97 already took it from 484 ms to 191 ms** for alice: one item-count read per organisation, not one setup per task.
- **What is left grows with the number of projects.** `getProjectsOverviewData` (`lib/project-data.ts:311`) waits four
  times in a row: organisations, then each organisation's projects, then **each project's tasks** (11 × 23 ms), then
  the organisation counts.
- **The Dashboard then asks each overseen project's overview counts** (`lib/dashboard-canonical-count.ts`, 11 × 32 ms)
  for its Canonical Decisions figure.
- The browser sends six requests at a time, so both per-project steps scale linearly with the number of projects.

**Decided by Hanchen (2026-10-24):** commits 6 and 7 of #98, not a new ticket. Update SCRUM-121's description and
the PR title to say so.

**Ground rules:**
- **Same access as the per-project reads.** `verify_user_project_access` and `verify_user_can_perform_project_action`
  check only the project's organisation (`core/permissions.py:223`, `:556`), so an organisation-level read with the
  same check returns exactly what the per-project reads would.
- **Same shapes:** `TaskRead`, and `item_status_counts` as `ProjectOverviewService` builds it.
- **Same fallback pattern as #97's counts:** if the batched read fails, the page takes the old per-project path.
- **The per-project routes stay.** The project page, Setup and the harness use them.

### 6. `perf(api,web): the overview reads each organisation's tasks in one request (A6, SCRUM-121)`

**API.**
- `GET /organizations/{org_id}/tasks` → `list[TaskRead]`: every task in the organisation's projects, ordered by
  project and then creation.
- Access: `verify_user_org_access`, as `GET /organizations/{org_id}/projects` does. This is what
  `GET /projects/{id}/tasks` checks for each project.
- `TaskRepository.list_by_organization(org_id)` (`db_store.py`, beside `list_by_project` at `:1298`): one query
  joining `ProjectDB` on `organization_id`, mapped with `_to_model`.
- Route beside `task-item-counts` in `routes/organizations.py:342`.

**API tests**, in a new `tests/test_organization_reads.py`:
- **Prove:** the statement count is the same for an organisation with 2 projects and with 12
  (`before_cursor_execute`, as `test_task_item_reads.py`);
- **Guard:** the result equals the union of `GET /projects/{id}/tasks` over the organisation's projects, same fields;
- **Guard:** a user outside the organisation gets 403, as on the projects list.

**Web.**
- `lib/api/tasks.ts`: `listOrganizationTasks(orgId)`.
- `getProjectsOverviewData`: per organisation, start the projects, tasks and `task-item-counts` reads **together**.
  The counts read needs only organisation ids, so it no longer waits for the tasks either. Four waits become two:
  organisations, then one batch per organisation.
- If an organisation's tasks read fails, list that organisation's tasks per project as today.

**Web tests** (`lib/project-data-loader.test.ts`, or a new `project-overview-data.test.ts` if the mocks differ):
- **Prove:** 2 projects and 12 projects in one organisation make the same number of requests, with no `listTasks`;
- **Guard:** a failing organisation tasks read falls back to `listTasks` per project and the page still loads;
- `projectsOverviewSignature` unchanged for the same data.

**As built (2026-10-24):**
- **API:**
  - `TaskRepository.list_by_organization` orders by project, creation and id;
  - the route `list_organization_tasks` (`routes/organizations.py`, before `list_projects`).
- **API tests** (`tests/test_organization_reads.py`, 4):
  - the statement count test fails against a temporary per-project implementation (4 against 14 statements);
  - the other three are Guards.
- **Web:**
  - `listOrganizationTasks` in `lib/api/tasks.ts`;
  - `getProjectsOverviewData` starts `loadTaskItemCounts` first, then per organisation `listProjects` and
    `listOrganizationTasks` together;
  - `inProjectOrder` keeps the per-project order;
  - `listTasksPerProject` is the fallback.
- **Web tests:** a new `lib/project-overview-data.test.ts`, 6 cases. On the old code, the three Prove cases fail: one
  tasks request at 2 and at 12 projects, and the counts asked before the tasks answer.
- **Results:**
  - SQLite 2532 passed, 63 skipped;
  - casebook 87/87, 1 skipped, no regression;
  - test:web 1024 passed (109 files);
  - tsc clean outside `.next/types`;
  - lint 0 errors.
- Message: `commits/scrum-121-6-overview-tasks-per-organisation.txt`.

### 7. `perf(api,web): the Dashboard reads its canonical decisions once per organisation (A6, SCRUM-121)`

**API.**
- `GET /organizations/{org_id}/item-status-counts` → `[{project_id, item_status_counts}]`, every project in the
  organisation, a project with no items all zeros.
- Access: `verify_user_can_perform_governed_action(org_id, OVERSEE)`, which is what the per-project route checks
  (`routes/projects.py:376`).
- `ProjectOverviewService.item_status_counts_by_project(org_id)`: one query grouped by `TaskDB.project_id` and
  `TaskItemDB.status`, keeping the per-project method's 503 on an unexpected stored status. The per-project method
  calls the shared code, so the two can't drift.

**API tests** (same new file):
- **Prove:** fixed statement count for 2 and 12 projects;
- **Guard:** each project's entry equals `GET /projects/{id}/overview/item-status-counts`;
- **Guard:** an annotator, who lacks OVERSEE, gets 403.

**Web.**
- `lib/api/organizations.ts`: `listOrganizationItemStatusCounts(orgId)`.
- `loadCanonicalDecisionCount`:
  - group the readable projects (OVERSEE, unchanged) by `organizationId`;
  - make one request per organisation;
  - sum `canonicalized` over those projects only;
  - still null when any read fails: a partial sum would be wrong (SCRUM-128's rule).
- Jingwei wrote this file (SCRUM-128, merged), so tell him when the PR is ready. This is not a scope change to an
  open ticket of his.

**Web tests** (`lib/dashboard-canonical-count.test.ts`, extend or create):
- **Prove:** 12 overseen projects in 2 organisations make 2 requests;
- **Guard:** a project not overseen is neither asked nor counted;
- **Guard:** one failing organisation read gives null.

**As built (2026-10-24):**
- **API:**
  - `ProjectOverviewService` has one grouped query, `_counts_by_project` (by project and status), which
    `item_status_counts` (per project) and the new `item_status_counts_by_project` (per organisation, every project,
    zeros for none) both use, with the 503 on an unexpected status;
  - the schema `ProjectItemStatusCountsRead`;
  - the route `list_organization_item_status_counts`, behind OVERSEE on the organisation.
- **API tests:** `tests/test_organization_reads.py`, 3 more, 7 in all.
  - The fixture gains a task owner in each organisation, and items with statuses.
  - The statement count test fails against a temporary per-project loop (5 against 15).
- **Web:**
  - `listOrganizationItemStatusCounts` and `ApiProjectItemStatusCounts` in `lib/api/organizations.ts`;
  - `loadCanonicalDecisionCount` reads once per overseen organisation and sums the projects it was given.
- **Web tests:**
  - `dashboard-canonical-count.test.ts` is rewritten onto the organisation read: the 4 old cases plus "twelve projects
    in two organisations, two requests" and "counts only the projects given". On the old code 4 of 6 fail;
  - `dashboard-home-read-path.test.tsx` mocks the organisation read, with its assertions unchanged.
- **Results:**
  - SQLite 2535 passed, 63 skipped;
  - casebook 87/87, 1 skipped, no regression;
  - test:web 1026 passed (109 files);
  - tsc clean outside `.next/types`;
  - lint 0 errors.
- Message: `commits/scrum-121-7-canonical-decisions-per-organisation.txt`.

### Validation for 6–7
- The suites as for 1–5, plus the casebook, unchanged.
- **Perf bed:** add a load mode `org-batch` to `page_home`:
  - per organisation, projects, tasks and counts together, then one item-status-counts read per overseen
    organisation;
  - extend `sandbox-perf-seed-a6.py` with `--extra-projects 40` (each with two 20-item tasks), so the bed shows
    the scaling.
- Measure the Dashboard as admin and ann1 at 11 and at 51 projects, on `main` and the branch:
  - **target:** the request count no longer grows with projects (alice: 9 requests at any size, against 27 and
    107 today);
  - **target:** at least 50% faster at 51 projects.
- **Perf result (2026-10-24, `../../Break/tests/perf-findings.md` → "Result: SCRUM-121 commits 6–7"):**
  - alice 181 → 70 ms at 11 projects, and 519 → 89 ms (−83%) at 51; 9 requests at both sizes ✅;
  - ann1 230 → 54 ms at 51 projects;
  - ann1 at 11 projects (one project in its organisation) is 39 → 53 ms, because three parallel reads contend on
    the bed's single API process.
- **Manual:** the Dashboard's Canonical Decisions and the Projects page show the same figures as on `main` for alice,
  kevin and charlie. The Network tab shows no `/projects/{id}/tasks` or `/overview/item-status-counts` per project.

## Validation

1. `npm run check` (API tests, web tests, typecheck, lint), and the API suite on PostgreSQL (CI does both).
2. The casebook: 87/87 and 1 skipped, unchanged.
3. **Perf bed** (`../../Break/scripts/sandbox-perf-*.{py,sh}`). The `hej-perf` worktree is gone, so recreate it at
   `df7c05a` for the baseline and add the branch:
   - `GET task-items` on the 200-item task with history: target at most 20 ms and 0 writes;
   - the project page with 8 tasks (after commit 5): target at least 50% faster than `main`;
   - record before and after in the PR and in `perf-findings.md`.
   **Result (2026-10-24, bed rebuilt; `../../Break/tests/perf-findings.md` → "Result: SCRUM-121"):**
   - project page 118.9 → 48.5 ms (−59%), 13 → 6 requests ✅;
   - task-items @200 59.1 → 37.0 ms, 26 → 16 statements, 0 writes. **Decided by Hanchen, 2026-10-24:** 37 ms is good,
     and it is not a limitation. The PR states the strength instead: the statement count is fixed, whatever the items
     and their history. What is left is D7's `blind_item_statuses` (10 batched statements, about 20 ms of SQL), which
     came after the 20 ms target was set.
   - The worktree `hej-perf` is left detached at `a4a9cd04`; the container `hej-perf-pg` is stopped with
     `/tmp/seed.dump` inside.
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
- **Opened 2026-10-23 as draft #98** (head `11a285f`, 4 commits), description in
  `../../../reviews/W11/pr-cs57-hanchen-scrum-121-reads-never-write.md`. No reviewer requested. After commit 5:
  update the description's Commits and Testing, add the perf bed's numbers, and mark it ready.

- **2026-10-24:**
  - **Walkthrough done** in Chrome, on the branch at `17281e3` with a fresh seed on the throwaway `hej-perf-pg`
    (API :8000, web :3001). The PR's Testing section records it.
  - The writes went through the API as the real users (bob returns, kevin reopens); dana's resubmission went
    through the work panel.
  - **Found, out of scope:** the project page's "Your work" asks each task's annotate work queue twice.
  - **Description updated on GitHub** for commits 5–7, the perf tables and the walkthrough.
  - **The title is not changed yet**, and the PR is still a draft.

### 8. The self-review's fixes (2026-10-24, `69c7aca`)

A subagent reviewed #98 at `17281e3` (`../../../reviews/W11/review-cs57-hanchen-scrum-121-pr98-self-review.md`). It
found nothing blocking, and confirmed:
- access parity of the organisation reads, on SQLite and PostgreSQL;
- PostgreSQL 2,595 passed.

Commit 8 holds what it raised:
- ADR 014's decision 6 is marked as removed;
- the two new routes are listed in `api_surfaces.md`;
- `inProjectOrder` groups the tasks in one pass. This is nit 7(a), included by Hanchen's decision; 7(b), the two
  fixed queries, stays;
- the Return assertion that could not fail now checks the peer's rework in the queue;
- two docstrings are corrected, and one test label is now Prove.

Hanchen asked for this commit and push. The PR description now carries the SHA and two corrected claims: CI skips
PostgreSQL on pull requests, and Canonical Decisions has no fallback.

## After merge

- Mark SCRUM-121 Done; edit its description to say criterion 3 was dropped. Log the PR in the tracker.
- A6 → `done` through the next tracking-sync: SCRUM-119 and SCRUM-121 together cover criteria 1 to 5.
- Update `roadmap.md` (W11).
