## Summary

SCRUM-121, story A6 (a dataset-sized task opens without a wait): A6's criteria 3 and 4, which SCRUM-119 (#54) left out, plus the same fix on the pages above the task.

- **Reading a task's items no longer writes.** `GET /tasks/{id}/task-items`, `GET /tasks/{id}/setup` and an item's content used to read the items through a repair. It recomputed every expert send-back status from the item's Return history, wrote any change, and reported the result. It now returns what is stored. The statement count is fixed: it no longer grows with the items or their history.
- **The project page counts its tasks once.** It asked one setup read per task for the item count. It now makes one `task-item-counts` read per organisation, the endpoint #97 added.
- **The Dashboard and Projects pages read per organisation, not per project.** Jingwei reported the Dashboard as slow. #97 had already removed its setup reads. What was left was one tasks read per project, and one overview counts read per overseen project for Canonical Decisions. So the page slowed down in proportion to the number of projects. Each is now one read per organisation.

## Commits

| Commit | What it does |
| --- | --- |
| `f785723` | **The change.** `TaskService.list_task_items` returns the stored statuses. `TaskItemRepository.list_by_task` reads the status column with each row, so a caller holding an older copy of an item still gets what is stored. New `test_task_item_reads.py`; one reopen test rewritten to go through the real writes |
| `8a9fb31` | **Deletion only.** The nine repair functions, their alias and the helpers only they used; the second, redundant status write in `decide_escalation`. `current_expert_send_back_at` keeps the path the replacement guard uses (`predecessor` is now required). The tests of the deleted code go: 15 cases |
| `ccca265` | `api_surfaces.md` and `workflow_states.md` say the reads return stored statuses and the writes set them; the API README's test index |
| `11a285f` | Deletes `use-hydrated-task-items.ts`, unused since #54 |
| `b0d9c30` | Merges `main` (#97) |
| `a4a9cd0` | **Project page.** `getProjectWorkspaceView` reads the organisation's `task-item-counts` beside the project's other reads, and falls back to a task's setup only when the counts fail or don't list it |
| `d615613` | **Overview tasks.** New `GET /organizations/{id}/tasks`: every task in the organisation's projects in one query, with the access `GET /projects/{id}/tasks` checks (membership of the organisation). `getProjectsOverviewData` asks each organisation's projects, tasks and item counts together, and lists tasks per project only if that read fails |
| `17281e3` | **Canonical Decisions.** New `GET /organizations/{id}/item-status-counts`: every project's item status counts in one grouped query, behind OVERSEE as the per-project read is. The per-project read now uses the same query. `loadCanonicalDecisionCount` asks once per overseen organisation and sums only the projects it shows |
| `69c7aca` | **The self-review's fixes.** ADR 014's decision 6 marked as removed; the two new routes in `api_surfaces.md`; the overview groups tasks by project in one pass instead of a filter per project; one Return assertion that could not fail now checks the peer's rework; two docstrings and one test label corrected |

## Decisions for review

- **Deleted, not moved.** The ticket asked for the repair to move into the writes. The writes already set the status they cause: a submission, a review verdict and an annotation dispute's decision all go through `item_status_after_accept`. The history the repair read (resolved item-level Return escalations and their `escalation_decided` audits) is written only by `decide_escalation`, whose route has answered 410 since #48; only tests call it.
- **Proved before deleting.** The repair was first made to fail whenever it would change anything. It never tripped:

  | Run | Result | Reads through the repair | Reads that saw Return evidence |
  | --- | --- | --- | --- |
  | API suite, SQLite | 2525 passed, 63 skipped | 1,459 | 0 |
  | API suite, PostgreSQL 18 | 2585 passed, 3 skipped | 1,465 | 1, already stored as `expert_send_back` |
  | Casebook | 87/87, 1 skipped | 294 | 0 |
  | Fresh seed, then items and setup of all 20 tasks | 0 trips | 40 | 0 |
- **No one-off repair of existing rows.** The ticket's criterion 3 asked for one in `migrate_db_schema()`. #88 already made every development database reset, SQLite included, so it would have nothing to repair. Development databases need no reset for this PR: it changes no schema.
- **The status column, not `populate_existing()`.** The app's sessions run with `autoflush=False`, so `populate_existing()` would discard a caller's unflushed changes to the items it lists. Reading the column with the row gives the stored status and leaves the session alone.
- **Today's expert Return stores `returned`, not `expert_send_back`.** Since #48 the answer goes back to its author, as after a reviewer's return. `test_an_expert_return_and_its_resubmission_show_on_the_next_read` pins it. `expert_send_back` now comes only from legacy item-level evidence; retiring it is a separate ticket, SCRUM-134.
- **`current_expert_send_back_at` requires `predecessor`.** Its item-wide path served only the repair's display. In `test_legacy_adjust_return_without_audit_authorizes_only_current_unconsumed_rework`, the `before_submission` case now grants no Return, which matches the 409 the same test already expected.
- **The organisation reads check what the per-project reads check.** `verify_user_project_access` and `verify_user_can_perform_project_action` look only at the project's organisation. So `GET /organizations/{id}/tasks` (membership) and `GET /organizations/{id}/item-status-counts` (OVERSEE) return exactly what the per-project reads would. Guard tests compare the two, entry by entry.
- **The per-project routes stay.** The project page, Setup and the harness use them. The tasks and item-count reads fall back to the per-project path if they fail, as #97's counts read does. Canonical Decisions keeps SCRUM-128's rule instead: if any read fails it shows no figure, never a partial sum.
- **ADR 014 is amended.** Its decision 6 required the read-side repair and its concurrency tests; the header now says A6 removed them. The two new routes are in `api_surfaces.md` beside `task-item-counts`.

## Testing

- **SQLite:** 2535 passed, 63 skipped at `17281e3`, and again at `69c7aca`.
- **PostgreSQL 18:** 2595 passed, 3 skipped at `17281e3`, run locally the way CI runs it. CI skips this job on pull requests, so it runs again only after the merge.
- **Casebook:** 87/87, 1 skipped, unchanged, at `17281e3`.
- **Web:** 1026 passed (109 files); typecheck clean; lint 0 errors.
- **The new tests fail without the change:**
  - `test_task_item_reads.py`: on `main` the statement count fails (80 against 260), and both no-write tests fail on the `UPDATE`;
  - `test_organization_reads.py`: against a temporary per-project implementation, the statement counts fail (4 against 14 for tasks, 5 against 15 for counts);
  - web: 4 of 5 new project-page cases, the 3 Prove cases of `project-overview-data.test.ts`, and 4 of 6 in `dashboard-canonical-count.test.ts` fail on the old code.
- **The rewritten reopen test** (`test_task_list_does_not_revive_old_return_after_real_owner_reopen`) fails with the `list_by_task` change undone: it lists the stale `expert_send_back` its caller still holds.

**Perf bed** (PostgreSQL 18 in Docker; the API replayed with the web's request pattern, at most 6 in flight; median of 5 runs after a warm-up). Before is `main` `ffc42abd`:

| Page or read | Before | After |
| --- | --- | --- |
| Project page, 8 tasks | 118.9 ms, 13 requests | **48.5 ms (−59%)**, 6 requests |
| `GET task-items`, 200 items with history | 59.1 ms, 26 statements | **37.0 ms (−37%)**, 16 statements, 0 writes |
| `GET task-items`, 10 or 50 items | 23–25 ms, 16 statements | 13 ms, 6 statements |
| Dashboard, admin, 11 projects | 181 ms, 27 requests | **70 ms (−61%)**, 9 requests |
| Dashboard, admin, 51 projects | 519 ms, 107 requests | **89 ms (−83%)**, 9 requests |
| Dashboard, annotator, 51 projects | 230 ms, 44 requests | **54 ms (−77%)**, 4 requests |

- **The task-items read is now fixed in cost.** The repair's 10 statements are gone from every call. On a task with answers, the 10 statements left are D7's blind-review statuses, read in batches rather than per item.
- **The Dashboard's request count no longer grows with projects.** At 11 projects, an annotator whose organisation has a single project pays about 14 ms more (39 → 53 ms). The three reads now run together, and on the bed's single API process they contend. With more than a couple of projects in an organisation, parallel wins.

**Walkthrough** in the running app, on a fresh seed (`init_data.py --reset`):
- **Projects page and Dashboard:** no per-project `/tasks` or `/overview/item-status-counts`, and no `/setup`; one `projects`, `tasks` and `task-item-counts` read per organisation.
- **Canonical Decisions:** alice and kevin both show 10, which equals the per-project counts summed; charlie (annotator) sees no tile and sends no counts read.
- **Project page** (Test: Single review, 4 tasks): one `task-item-counts`, no `/setup`.
- **The seed's staged items** of the first three tasks each show the state their name gives.
- **Return:** a reviewer returns an answer; its author's Annotate queue shows it as Returned with Rework, and the reviewer's feedback in the work panel.
- **Resubmission:** the author resubmits through the panel; the item shows Submitted on three reloads.
- **Reopen:** the owner reopens a finalised item; it shows Not started on three reloads.
- **Nothing written on read:** stored statuses match every read.

## Notes for reviewers

- `test_independent_second_review.py` loses five tests whose subject was the repair racing the writes: overlapping reconciliation, the no-op timestamp, the lock refresh, token handling and multi-item order. With no repair, nothing races. The legacy Return aggregate test keeps its submissions and reads, and now checks that the reads wrote nothing.
- `test_task_item_reopen.py` loses the history-only send-back test. It asked the deleted collector. A reopen marks the round's answers `is_latest=False`, so asking `current_expert_send_back_at_by_submission` instead would pass whatever its cutoff did.
- @Jingwei-Lin: `dashboard-canonical-count.ts` and its two tests (SCRUM-128) now use the organisation read. The rules are unchanged: only overseen projects count, and any failed read gives no figure. The component test's assertions are unchanged too.

## Known limitations

- **Out of scope:**
  - the annotate work queue request (about 520 ms on a 200-item task, #52);
  - the project page's "Your work" card, which asks each task's annotate work queue, twice per task (8 requests for 4 tasks);
  - `decide_escalation` and the item-level escalation records, which only tests use;
  - the legacy evidence branches in `current_expert_send_back_at_by_submission`;
  - the `expert_send_back` status itself, which SCRUM-134 retires.
