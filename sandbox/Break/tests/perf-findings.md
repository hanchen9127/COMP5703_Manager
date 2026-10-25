# Perf findings — slow page loads (measured 2026-10-04)

Findings record for the performance investigation (`../plans/plan-perf-investigation.md`, ticket text in
`../jira/jira-perf-investigation.md`). Rename to `perf-findings-SCRUM-<n>.md` once the ticket exists.

**Short answer: no single SQL statement is slow.** The slowest statement type averages 1.9 ms. Pages are
slow because they run thousands of fast statements: a 200-item Annotate page sends 404 requests and runs
6,882 statements. Two fixes, both prototyped and checked to return identical output, bring that page from
**2,969 ms to 58 ms (−98%)**.

## Test bed

| | |
| --- | --- |
| Code | `origin/main` `df7c05a` (after PR #47), detached worktree `../hej-perf`, product code unchanged |
| Database | PostgreSQL 18 in Docker (`hej-perf-pg`, port 55432), database `hej_perf`, restored from one seed snapshot before every configuration |
| Machine | Windows 11, API and DB on the same machine. A statement round trip costs about 0.7–1.3 ms here |
| Data | `init_data.py --reset` plus `../scripts/sandbox-perf-seed.py`: one project, 8 human-first text-span tasks (10, 50, 200 FewNERD items, five of 20). On the 200-item task: 2 annotators submitted on every item, 120 accepts, 40 expert send-backs, 20 of them resubmitted. `audit_logs` 1,084 rows |
| Load | `../scripts/sandbox-perf-load.py` replays the requests `hej-web` sends per page, in the same phases, with at most 6 in flight (Chrome's per-origin limit). Users: `ann1` (annotator) and `alice` (admin). 5 measured reps after 1 warm-up; medians reported |
| Instruments | `../scripts/sandbox-perf-server.py`: SQLAlchemy cursor events and an ASGI wrapper, added at runtime. Per request: time, SQL count, SQL time, writes |
| Prototypes | `../scripts/sandbox-perf-experiments.py`, applied at runtime. `../scripts/sandbox-perf-equivalence.py` compared them with `origin/main`: **identical output** for admin, `ann1` and a fresh annotator (peers' drafts hidden) on all three task sizes |
| Raw data | `perf/matrix/<config>/`, `perf/audit-scale/` (requests.csv, statements.jsonl, pages.csv, explain.txt) |

Re-run: `bash ../scripts/sandbox-perf-matrix.sh '<seed json>' perf/matrix 5` from the worktree's `apps/hej-api`.

## Where the time goes

**Per page (`ann1`, origin/main):**

| Page | 10 items | 50 items | 200 items | Requests @200 | SQL @200 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Items | 112 ms | 354 ms | 1,585 ms | 204 | 3,682 |
| Annotate | 169 ms | 715 ms | 2,969 ms | 404 | 6,882 |
| Review | 179 ms | 677 ms | 2,979 ms | 405 | 6,890 |
| Project (8 tasks) | | | 245 ms | 13 | 454 |

Load time is linear in item count. A run on a separate day of the same baseline gave 2,960 ms for Annotate @200.

**One `GET /task-items/{id}/drafts` call: 13–16 statements, of which one reads drafts.** For `ann1`:
1 user lookup (auth); 4 for the scope check (task_item → task → project → membership); 7 for the
peer-visibility check, which loads task_item, task and project again and checks roles twice; 1 own-answer
lookup; 1 drafts query; 2 lazy loads of draft authors. Median 39 ms per call, 5,000 calls per configuration run.

**One `GET /tasks/{id}/task-items` on the 200-item task with history: 235 statements, 176 ms.** By table:
180 on `drafts`, 22 on `audit_logs`, 22 on `task_item_escalations`, plus one `UPDATE task_items` per call.
`GET /tasks/{id}/setup` runs the same code (240 statements, 183 ms). So each task shell load runs it twice,
and the project page runs it once per task.

**The UPDATE affects 0 rows in steady state.** `updated_at` stayed at the seed time through every run. It still
costs a write statement and a commit on every read.

**Top statements by total time (baseline):** organization membership check 16%, task_items by id 14%, tasks
by id 13%, projects by id 13%, users 11% + 10%, role_assignments 10%, drafts 6%. All of them are primary-key or
small-filter lookups averaging 1.2–1.9 ms. **None is slow on its own.**

## Hypotheses

| # | Verdict | Evidence |
| --- | --- | --- |
| H1 drafts one request per item, twice | **Confirmed — the main cause** | Annotate @200: 404 requests, 6,882 SQL, 2,969 ms. See gains below |
| H2 repair on read | **Confirmed** | 235 statements and 176 ms per task-items call @200 with history, against 6 statements and 11 ms without the repair. A write on every read. Hidden behind H1 today; it becomes the critical path once H1 is fixed |
| H2b `audit_logs` without index | **Confirmed at scale only** | `EXPLAIN ANALYZE`: 0.13 ms at 1k rows, 5.3 ms at 100k, 25.6 ms at 1M (parallel seq scan), 0.12 ms with an index on `(task_id, operation)`. The repair scans it 22 times per call. task-items @200: 185 ms (1k rows), 271 ms (100k), 795 ms (1M), 181 ms (1M, indexed) |
| H3 project page multiplies H2 | **Confirmed** | 245 ms → 109 ms (−55%) without the repair. The path goes through `getTaskSetup`, not `listTaskItems` |
| H4 async auth blocks the event loop | **Rejected for one user** | sync-auth: −20% to +13% across pages, within noise, with no consistent gain. Not measured under several users |
| H5 contention | Not measured | Needs concurrent writers |
| H6 inline AI on activation | Not measured | Not a page load |
| H7 retries / dev compile | Not measured | The replay has no browser or Turbopack |
| H8 CORS preflight per item URL | Not measured | The replay sends no OPTIONS. A browser adds up to 1 preflight per distinct URL (cached 600 s), so real first visits are slower than these numbers. Fixing H1 removes it |

## Measured gains (prototypes, identical output)

Wall time per page, median of 5, `ann1`. Change against origin/main in brackets.

| Page | origin/main | Frontend dedupe only | + batch drafts endpoint | + no repair on read | Auth as sync def |
| --- | ---: | ---: | ---: | ---: | ---: |
| Annotate @10 | 169 | 106 (−37%) | 39 (−77%) | 43 (−75%) | 173 (+2%) |
| Annotate @50 | 715 | 358 (−50%) | 45 (−94%) | 48 (−93%) | 706 (−1%) |
| Annotate @200 | 2,969 | 1,546 (−48%) | 222 (−93%) | **58 (−98%)** | 3,171 (+7%) |
| Items @200 | 1,585 | 1,555 (−2%) | 235 (−85%) | **51 (−97%)** | 1,762 (+11%) |
| Review @200 | 2,979 | 1,558 (−48%) | 233 (−92%) | **68 (−98%)** | 3,166 (+6%) |
| Project, 8 tasks | 245 | 248 | 252 | **104 (−58%)** | 252 |

Admin shows the same pattern (Annotate @200: 2,477 → 55 ms, −98%). Requests @200: 404 → 5. SQL: 6,882 → 36.
"No repair on read" alone, on origin/main's frontend: Items @200 −10%, project page −55%.

- **Frontend dedupe** — Annotate and Review reuse the shell's drafts instead of fetching again. Web only, no API change.
- **Batch drafts** — `GET /tasks/{id}/drafts-batch`: one scope check, one drafts query with authors eager-loaded,
  one own-answer query, the same visibility rule. 9 statements, 22–24 ms for 200 items, against 200 × 39 ms.
- **No repair on read** — the read returns stored statuses. The real fix moves the repairs to the write paths
  that cause them, plus a one-off repair of existing rows. Identical output here because the data is in steady state.

## Expected targets for fix tickets

| Ticket | Target, on this bed | Measured |
| --- | --- | --- |
| Batch drafts read (H1) | Annotate @200 ≤ 300 ms and ≤ 10 requests | 222 ms, 5 requests |
| Stop repairing on read (H2, H3) | task-items @200 with history ≤ 20 ms and 0 writes; project page −50% | 9–11 ms, 0 writes; −55% to −58% |
| Index `audit_logs (task_id, operation)` | Only if repair-on-read stays: task-items @1M audit rows from 795 ms to ≤ 200 ms | 181 ms |
| Frontend dedupe (interim, if the API change waits) | Annotate and Review @200 −45% | −45% to −50% |

Absolute numbers depend on the machine: a native Linux PostgreSQL has cheaper round trips. The ratios hold
because the cost is statement count, not statement speed.

## Result: SCRUM-119 (measured 2026-10-06)

Same bed, same seed, 5 measured reps plus a warm-up. Before: current `origin/main` `9f4ec6c` (after #52, whose
shell also requests the annotate queue). After: the branch at `a7c3cdd`. Raw data in `perf/scrum119/`; runner
`../scripts/sandbox-perf-scrum119.sh`, load modes `main-now` and `scrum119`.

| Page @200 items | Before | After | Requests |
| --- | --- | --- | --- |
| Items (ann1 / admin) | 1,994 / 1,691 ms | 546 / 557 ms | 205 → 6 |
| Annotate (ann1 / admin) | 3,390 / 2,847 ms | 571 / 571 ms | 405 → 7 |
| Review (ann1 / admin) | 3,392 / 2,881 ms | 574 / 586 ms | 406 → 8 |
| Project, 8 tasks | 256 ms | 260 ms | 13 → 13 |

- **The drafts read is done:** one `GET /tasks/{id}/drafts`, 25 ms and 12 statements, where there were 400
  requests of about 47 ms. Requests per page meet the target (at most 10).
- **The original 300 ms target is missed; the target was lowered to 1 s on 2026-10-06, and is met.** The cause is a request added after the plan: #52's
  `GET /tasks/{id}/work-queue/annotate?include_unavailable=true` takes **517 ms** (548 ms measured alone, so not
  contention) and sits on the shell's critical path. Next are `task-items` and `setup`, about 210 ms each, the
  send-back repair (A6 subtask 3). Without the queue request the critical path is about 230 ms, the prototype's.
- **Why the queue is slow:** 475 of its 517 ms is SQL. Six grouped queries with `IN (…200 ids…)` take 40–90 ms
  each as recorded, though the same query runs in about 1 ms in `psql`, so the cost is on the client side of
  each call. Also 80 per-item `drafts` queries (an N+1). Owner: the work queue service (SCRUM-93, SCRUM-117).
- **Equivalence on real data** (`sandbox-perf-equivalence.py --route scrum119`, admin, ann1, ann3 on all three
  tasks): every item's batch list equals its per-item read, and every item is a key. ann3, who answered nothing,
  sees 200 drafts on the 200-item task where admin and ann1 see 620. The one reported difference is the order of
  `GET task-items` between two calls: items imported together share `created_at`, and the list has no tie-break,
  so their order can change between reloads. Not SCRUM-119's; recorded as a limitation in its PR.

## Result: SCRUM-121 (measured 2026-10-24)

**The bed was rebuilt**, because the container and worktree were gone:
- PostgreSQL 18 in a new `hej-perf-pg` (port 55432) and a new `../hej-perf` worktree.
- `init_data.py --reset`, then `../../W11/scripts/sandbox-perf-seed-a6.py`. This is the same shape as before, with
  two changes:
  - a task owner creates the project and tasks (permission model of 2026-10-20);
  - the 200-item task's 40 Returns are a reviewer's `revise`, because the expert escalation routes answer 410 since #48.
- Before: `main` `ffc42abd` (#97). After: the branch at `a4a9cd04`.
- 5 measured reps plus a warm-up. Load modes `a6-main` and `scrum121`, runner `../../W11/scripts/sandbox-perf-scrum121.sh`.
- Raw data in `../../W11/tests/perf/scrum121/`.

| Measure | Before | After | Target |
| --- | --- | --- | --- |
| Project page, 8 tasks (admin) | 118.9 ms, 13 requests | **48.5 ms (−59%)**, 6 requests | ≥ 50% faster ✅ |
| `GET task-items` @200 with history | 59.1 ms, 26 statements, 0 writes | **37.0 ms (−37%)**, 16 statements, 0 writes | 0 writes, cost fixed in items and history ✅ (the 20 ms figure predates D7's reads, below) |
| `GET task-items` @10 / @50 | 22.9 / 25.1 ms, 16 statements | 12.8 / 13.1 ms, 6 statements | — |
| `GET setup` @200 | 54.0 ms, 28 statements | 39.0 ms, 18 statements | — |
| One `task-item-counts` read (replaces 8 setups) | — | 10.0 ms, 3 statements | — |
| Items / Annotate / Review @200 (ann1) | 118 / 141 / 145 ms | 113 / 143 / 138 ms | unchanged: the shell's critical path is elsewhere |

**The read's cost no longer grows with the task's history** (Hanchen, 2026-10-24: 37 ms is good, and not a
limitation):
- The repair is gone, with the 10 statements it ran on every call, on every task size. Before #48 it also scaled
  with the Return history: 235 statements at 200 items on the 2026-10-04 bed.
- The statement count is now fixed: 5–6 on a task without answers, at any size. A task with answers adds 10, from
  `blind_item_statuses` (D7's blind review, `tasks.py:512`), which reads annotations, reviews, policies, settlements
  and disputes in batches, not per item. This is about 20 ms of SQL. The rest is serialising 200 items.
- The 20 ms target was set on 2026-10-04, before D7's reads were on that path.

**Why main wrote nothing either:** the repair writes only on legacy Return evidence (resolved item-level
escalations, `escalation_decided` audits). Only the retired route wrote that evidence, and today's app can't produce
it, as SCRUM-121's probe showed. So the old 235 statements and the write per call were costs of a seed made through
the retired route. The no-write guarantee for that legacy state is pinned by `test_task_item_reads.py`.

## The Dashboard (`/`), measured 2026-10-24 for Jingwei's report

The page is not changed by SCRUM-121. Same bed, `main` `ffc42abd`, new load scenarios `home-admin` and
`home-ann1`. Mode `pre97` replays the page before #97: one setup per task in place of the organisation counts.
11 projects, 28 tasks, 2 organisations (alice). Raw data in `../../W11/tests/perf/home/`.

| | Before #97 | `main` now |
| --- | --- | --- |
| admin (alice, oversees both organisations) | 484 ms, 53 requests | **191 ms (−61%)**, 27 requests |
| ann1 (one organisation, oversees nothing) | 128 ms, 11 requests | **40 ms**, 4 requests |

**What is left on `main`:** four waits in a row:
1. organisations;
2. each organisation's projects;
3. each project's tasks (11 × 23 ms);
4. the organisation counts, then the Canonical Decisions figure, which asks each overseen project's overview counts
   (11 × 32 ms).

Both per-project steps grow with the number of projects, six requests at a time. A database with many more projects
than this bed is slower in proportion, and `next dev` adds compile time on a first visit.

### Result: SCRUM-121 commits 6–7 (measured 2026-10-24)

Same bed at two sizes:
- 11 projects: `/tmp/seed.dump`;
- 51 projects: `/tmp/seed51.dump`, which is the same bed plus `sandbox-perf-seed-a6.py --extra-projects 40`, each
  project with two 20-item tasks in TechStart.

Before: `main` `ffc42abd`, mode `a6-main`. After: the branch at `17281e33`, mode `org-batch`. Runner
`../../W11/scripts/sandbox-perf-home.sh`; raw data in `../../W11/tests/perf/home-scale/`.

| Dashboard | 11 projects, before → after | 51 projects, before → after |
| --- | --- | --- |
| admin (alice, both organisations) | 181 → **70 ms (−61%)**, 27 → 9 requests | 519 → **89 ms (−83%)**, 107 → 9 requests |
| ann1 (TechStart only, no OVERSEE) | 39 → 53 ms (+14 ms), 4 → 4 requests | 230 → **54 ms (−77%)**, 44 → 4 requests |

- **Targets met:**
  - the request count no longer grows with projects (alice 9 at both sizes);
  - at 51 projects the page is 83% faster.
- **One small cost:** ann1 at 11 projects belongs to one organisation with one project, and pays 14 ms more. On
  `main` its three reads after the organisations ran one after another at about 6 ms each. Now they run together, and
  on this bed's single API process each takes about 23 ms. The trade only pays once an organisation has more than a
  couple of projects. A deployment with several workers would cut the contention, but that was not measured.

- One user at a time. Contention (H5) and concurrent users (H4) are not measured.
- An API replay, not a browser: no rendering, CORS preflights or dev compiles. Real first visits are slower.
- Drafts per item are small (2–4). Larger payloads would raise the batch call's cost, not the per-item path's request count.
- The reported page (step 0, ask the reporter) is still unknown. Annotate or Review on a dataset-sized task fits "sometimes slow" best: fast on small hand-made tasks, slow on imported ones.
