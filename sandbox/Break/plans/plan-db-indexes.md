# Plan: indexes for when the data grows

2026-10-06. Measured on a scaled copy of the perf database. No ticket yet (see "Where it goes").
Scripts: `../scripts/sandbox-index-scale.sql` (builds the copy), `sandbox-index-bench.sql` and
`sandbox-index-bench.sh` (the queries, `EXPLAIN ANALYZE`, warm run).

## Summary

The schema is not index-free: 55 index and unique declarations over 19 tables, and every foreign key from a
child to its parent (`task_id`, `task_item_id`, `annotation_id`) is already indexed. At about 10 to 1,000
times today's data, two query shapes still scan whole tables and are worth an index now. One more helps a
little and can wait. A dozen indexes only duplicate primary keys. The slowest queries at scale are not index
problems: they return large results, or run once per item.

| Change | Query it serves | At scale, before → after | Priority |
| --- | --- | --- | --- |
| `audit_logs (task_id, created_at)` | history drawer, audit feed, the send-back repair | 16.3 ms → 0.04–0.24 ms (543k rows) | **Now** |
| `role_assignments (user_id, organization_id)` | the permission check, about 3 times per request | 1.84 ms → 0.04 ms (40k rows) | **Now** |
| `task_items (task_id, status)` | work queues on a large task | 2.36 ms → 1.18 ms (20k-item task) | Later |
| Drop the 18 `(id)` indexes that duplicate a primary key | every insert | 90 MB of 305 MB of indexes; each insert writes the key twice | Cleanup |

## What exists today

- **How the schema is made.** `Base.metadata.create_all()` at startup, then `migrate_db_schema()`, which patches
  existing **SQLite** dev databases only. PostgreSQL dev databases are disposable and reset after a model change
  (`database.py:172`). There is no Alembic and no migration for a persistent PostgreSQL deployment yet.
- **`create_all` does not add an index to a table that already exists.** A new index reaches an existing SQLite
  dev database only through `CREATE INDEX IF NOT EXISTS` in `migrate_db_schema()`. There is a precedent:
  `uq_annotations_one_authoritative_per_item` (`database.py:321`).
- **Indexed:** `task_items.task_id`, `drafts.task_item_id`, `annotations.task_item_id`, `reviews.annotation_id` and
  `reviews.task_item_id`, `task_item_escalations.task_id` and `.task_item_id`, `data_pointers.task_id`,
  `tasks.project_id`, `projects.organization_id`, and the AI job tables.
- **Not indexed:** all of `audit_logs` beyond its key; `role_assignments.user_id` and `.organization_id`; the
  `created_by`, `reviewed_by` and `decided_by` user columns.

## How it was measured

- **Data:** `hej_perf` (the A6 measurement's seed) copied as a template. Every task and everything under it was
  copied 500 times with suffixed ids, so referential integrity holds. Then one 20,000-item task and 20,000 users
  with two role rows each were added. Result: 6,514 tasks, 221k items, 458k drafts, 262k annotations, 80k
  reviews, 543k audit rows, 20k users, 40k role rows.
- **Queries:** the shapes the baseline page loads actually ran. The A6 measurement recorded all 242,230
  statements, which fall into 29 shapes. To those I added the task-wide reads that came later (the batched
  drafts read, `item_ids_answered_by`, the task item list with its pointers).
- **Timing:** `EXPLAIN (ANALYZE, BUFFERS)`, second run, PostgreSQL 18 in Docker. Absolute numbers are this
  machine's; the before/after ratio is the finding.

## Results

| # | Query (from the code) | Before | After | Plan after |
| --- | --- | --- | --- | --- |
| q1 | `role_assignments WHERE user_id, organization_id, project_id IS NULL, scope, revoked_at IS NULL` | 1.836 ms, seq scan | **0.036 ms** | index scan |
| q2 | `audit_logs WHERE task_id, operation, resource_type ORDER BY created_at DESC` | 16.258 ms, parallel seq scan | **0.243 ms** | index on `(task_id, created_at)` |
| q3 | `audit_logs WHERE task_id ORDER BY created_at DESC LIMIT 50` | 16.386 ms | **0.041 ms** | index scan backward, no sort |
| q4 | `count(*)` of a task's audit rows | 16.684 ms | **0.145 ms** | index-only scan |
| q5 | `task_items WHERE task_id, status` (20k-item task) | 2.358 ms | 1.182 ms | composite index |
| q6 | a task's items with their data pointers (20k items) | 26.6 ms | unchanged | hash join; returns 20k rows |
| q7 | `annotations WHERE task_item_id, created_by, is_latest` | 0.062 ms | — | already indexed |
| q8 | batched drafts read (20k-item task) | 39.7 ms | unchanged | returns 62,000 drafts, 13% of the table |
| q9 | `item_ids_answered_by` (20k-item task) | 17.5 ms | unchanged | see "To verify" |
| q10 | escalations of a task by status | 0.066 ms | — | already indexed |
| q11 | drafts of one item | 0.068 ms | — | already indexed |

Building the three indexes on the scaled data took 19 ms, 391 ms and 178 ms.

**One audit index serves every audit shape.** The A6 measurement proposed `(task_id, operation)` for the
send-back repair (H2b: task-items at 1M audit rows, 795 ms → 181 ms). `(task_id, created_at)` serves that query
(q2: 67 times faster), and it also serves the history drawer's paging (q3) and its count (q4), which
`(task_id, operation)` would not sort. Use it instead.

## What an index does not fix

- **Primary key lookups repeated per item.** The most expensive shapes in the A6 recording are `users.id`,
  `task_items.id`, `tasks.id` and `projects.id`: 40k, 31k, 32k and 32k calls, each about 1.2 ms, almost all of it
  the round trip. They are already indexed. Fewer queries is the fix: SCRUM-119 and A6's other subtasks.
- **Large results.** A 20,000-item task's drafts are 62,000 rows (q8), and its items with pointers 20,000 rows
  (q6). PostgreSQL rightly scans rather than probe an index for 13% of a table. At that size the fix is paging
  or loading only the visible items. That belongs in its own story when tasks reach thousands of items; the
  client's example is 1,000 recordings.

## To verify before adding

- **`annotations (created_by)` for `item_ids_answered_by` (q9).** The scaled data has four annotators, so one
  annotator's answers are half the table and a scan is right. With dozens of annotators the filter is
  selective, and an index on `(created_by, is_latest)` or `(task_item_id, created_by)` may win. Re-measure with a
  realistic author spread before adding it.
- **The user columns** (`created_by`, `reviewed_by`, `decided_by`). Nothing filters on them alone in the
  recorded shapes. Only "my work" lists across tasks would, and none exists yet.

## How to make the change

1. **Models.** Declare each index in `__table_args__` with an explicit name, for example
   `Index("ix_audit_logs_task_created", "task_id", "created_at")`, so the SQLite step and the tests can name it.
2. **Existing SQLite dev databases.** `CREATE INDEX IF NOT EXISTS …` in `migrate_db_schema()`, next to the
   precedent at `database.py:321`. It is additive and safe to run on every start.
3. **PostgreSQL dev databases** are reset, as for any model change. Note in the PR that a persistent
   deployment would need the same statements (`CONCURRENTLY` there, to avoid locking writes), and that no
   migration tool exists for it yet.
4. **Tests.** A test that `create_all` produces each named index, on both backends. Optionally, a plan guard on
   PostgreSQL: `EXPLAIN` of the audit query on a seeded table must not show `Seq Scan on audit_logs`.
5. **Duplicate key indexes** are a separate cleanup: remove `index=True` from primary key columns across
   `db_models.py`. Existing databases keep the duplicates until reset, which is harmless. It touches many models
   in the busiest file, so do it alone, at a quiet moment, after asking.

## Where it goes

- **Decided 2026-10-06 (Hanchen): the two "now" indexes go into SCRUM-119 as commit 7**
  (`plan-SCRUM-119.md`). The rest below stays as written for the later changes.
- **The roadmap's rule** (`roadmap.md`, "Close collaboration"): when several groups change the schema in one week,
  they agree one migration order on day one and append their steps to `migrate_db_schema()` in that order.
  Indexes are additive and touch no one's columns, but they still append a step, so they take a place in that
  order.
- The `task_items (task_id, status)` index and the duplicate-key cleanup wait for evidence and a quiet week.
