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

## Limits

- One user at a time. Contention (H5) and concurrent users (H4) are not measured.
- An API replay, not a browser: no rendering, CORS preflights or dev compiles. Real first visits are slower.
- Drafts per item are small (2–4). Larger payloads would raise the batch call's cost, not the per-item path's request count.
- The reported page (step 0, ask the reporter) is still unknown. Annotate or Review on a dataset-sized task fits "sometimes slow" best: fast on small hand-made tasks, slow on imported ones.
