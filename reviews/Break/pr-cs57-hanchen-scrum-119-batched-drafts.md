## Summary

SCRUM-119, story A6 (a dataset-sized task opens without a wait). Every task page fetched drafts with one request per item, and the Annotate and Review tabs fetched them all again: a 200-item Annotate page sent 405 requests. Now each page reads every item's drafts with **one** `GET /tasks/{task_id}/drafts`.

On the A6 perf bed (200 items, same seed, current `main` against this branch):

| Page @200 items | `main` (`9f4ec6c`) | This branch | Requests |
| --- | --- | --- | --- |
| Items | 1,994 ms | **546 ms** | 205 → **6** |
| Annotate | 3,390 ms | **571 ms** (5.9×) | 405 → **7** |
| Review | 3,392 ms | **574 ms** (5.9×) | 406 → **8** |

**What this PR contributes:**
- Every task page now takes the same handful of requests, whatever the number of items: 6 to 8, against up to 406.
- The 200-item Annotate and Review pages load 5 to 6 times faster.
- The drafts themselves now come in one 25 ms request, instead of 400 requests of about 47 ms each.
- **The target, under 1 s and at most 10 requests, is met.** It was 300 ms until 2026-10-06, and was lowered after the measurement above.
- Two indexes keep a task's history and the permission check fast as the audit log and role assignments grow.

**Why the pages stay at about 570 ms rather than lower:** the slowest remaining read is the annotate queue the shell gained in #52 (`GET /tasks/{id}/work-queue/annotate?include_unavailable=true`). It takes about 520 ms on its own, and the page waits for it. Without it the pages would take about 230 ms. It belongs to the work queue service and is outside this PR (see "Known limitations").

## Changes by layer

**API**
- `GET /tasks/{task_id}/drafts` (`routes/drafts.py`), response `TaskDraftsRead { task_id, drafts_by_item }`.
  - Every item of the task is a key, with `[]` where the caller may see no draft, so the web can tell "none" from "not loaded".
  - Each list is exactly what `GET /task-items/{id}/drafts` returns for that item: same `DraftRead`, same order (newest first), same independence rule.
  - Two queries, joined on `task_items.task_id`, with authors eager-loaded. It takes 11 statements for 3 items and for 30.
- `AnnotationService`:
  - `role_hides_peers` is the part of `should_hide_other_annotators` that is the same for every item of a task;
  - `visible_drafts_by_item` applies the rule per item, from one query for the items the caller has a current answer on.
  - `visible_to_caller` and `assert_visible_to_caller` are unchanged.
- `AnnotationRepository.item_ids_answered_by`: the batch form of `find_by_item_and_creator`, with the same `is_latest` rule, so an answer from before a reopen doesn't count.
- `GET /task-items/{id}/drafts` is unchanged. The panel's save path and the evaluation harness call it.

**Schema (indexes only)**
- `audit_logs (task_id, created_at)` and `role_assignments (user_id, organization_id)`, declared in the models.
- `migrate_db_schema()` adds both to an existing SQLite dev database with `CREATE INDEX IF NOT EXISTS`, because `create_all` doesn't add indexes to existing tables.
- **PostgreSQL dev databases:** nothing needs them, so a reset is optional.

**Web**
- `lib/api/task-items.ts`: `listDraftsForTask`.
- `lib/live-task-workspace.ts`: the shell reads drafts in the same `Promise.all` as the items, the project and the annotate queue, and applies each item's list with `applyApiDraftsToMockItem` as before.
- `hooks/use-task-drafts-refresh.ts`: the Annotate and Review tabs held the same refresh effect, word for word. It is now one hook, with one request per refresh. The tabs still refresh when opened, so they show the same fresh data as before.

**Docs**
- `api_surfaces.md`: the new route in the read-independence table, and its shape under Task Items.

## Decisions for review

- **A new route beside the old one, not a change to it.** Nothing that calls the per-item route has to move, and every component below the shell is untouched.
- **A keyed map with every item present.** A missing key means "not loaded". The shell and the hook leave such an item as it was rather than treat it as having no drafts. That matters for an item registered between the two parallel reads.
- **The tabs keep refreshing.** Dropping the refresh would have saved one more request, but a draft saved on one tab must still show on the other.
- **The indexes, measured on a copy of the perf data scaled about 500 times** (543k audit rows, 40k role rows, 221k items):
  - a task's history went from 16 ms by parallel scan to 0.04–0.24 ms;
  - the permission check, run about three times per request, went from 1.8 ms to 0.04 ms.

  `(task_id, created_at)` replaces the `(task_id, operation)` the A6 investigation suggested: it serves the send-back repair's lookups too, and the history drawer's paging and count. The schema had no other index gaps on the recorded query shapes. The slowest queries at scale return large results, or run once per item.

## Testing

- `npm run check`: API 884 passed, web 342 passed, typecheck clean, lint 0 errors. The branch adds no warnings: the one in a changed file, the unused `router` in `task-workbench.tsx`, is on `main` too.
- **New API tests** (`test_task_drafts_read.py`):
  - the batch equals the per-item route, item for item, for a reviewer and for two annotators;
  - one of those items was answered before a reopen, and that answer must not count;
  - statement counts for 3 and 30 items;
  - 404 for an unknown task, 403 for another organisation's member and for a removed member, 401 for a token with no user.
- **Index tests** (`test_db_indexes.py`, both backends):
  - the named indexes exist, and each query can use its index;
  - an existing SQLite database gains them, and a second run changes nothing;
  - a table too old for its index is left alone.
- **Web tests:**
  - the shell sends one drafts request and never the per-item one;
  - a failed read keeps the items;
  - an uncovered item is left alone;
  - the hook sends one request per refresh, reads again when the items change, ignores a late response after unmount, and sends nothing for an empty task.
- **Mutation checks:**
  - counting an answer from before a reopen fails the annotator test;
  - showing annotators every draft fails both annotator tests;
  - ignoring the batch in the shell fails two tests;
  - dropping the migration step or the model index fails the index tests.
- **On the perf bed, with real data:** for admin, an annotator who answered everything, and one who answered nothing, on the 10-, 50- and 200-item tasks, every item's batch list equals its per-item read, and every item is a key.
- **Fixed on the way:** `live-task-workspace.test.ts`'s mapping-failure test passed only because the drafts mock returned nothing. An unknown `task_type` never failed the mapping, since the seed task's type is the fallback. It now fails the mapping for real.

## Notes for reviewers

- **Independence is decided per item.** An annotator who has answered one item sees peers' drafts on that item only. The tests cover it, and the `api_surfaces.md` row says so.
- **Schema:** the PR adds two indexes and appends one step to `migrate_db_schema()`, so it takes a place in W9's migration order.
- **SCRUM-32, 87 and 98:** please build on `GET /tasks/{id}/drafts` rather than adding another per-item read.
- **Manual walkthrough:** in two browsers, covering requests per page, independence, fresh data across tabs, and reviewers. I'll post the results here.

## Known limitations

- **The pages wait for the annotate queue.** It decides the most a 200-item page can gain here: about 570 ms, not about 230 ms. On that task it runs six grouped `IN (…200 ids…)` queries at 40–90 ms each, though the same query takes about 1 ms in `psql`, plus 80 per-item drafts queries.
- **`GET task-items` has no tie-break on its order.** Items imported together share `created_at`, so their order can change between reloads. The equivalence run showed it, and it predates this PR.
- **Measured on one machine, one user at a time.** It was an API replay, not a browser, so there's no rendering or dev compile. A first visit in the browser is slower, but the drop in requests holds anywhere.
- **Out of scope, as planned:**
  - the send-back repair on reads (A6 subtask 3, about 210 ms each on `task-items` and `setup`);
  - the project page counts (A6 subtask 4);
  - deleting the unused `use-hydrated-task-items.ts`;
  - the other index work: `task_items (task_id, status)`, and dropping the indexes that duplicate primary keys.
