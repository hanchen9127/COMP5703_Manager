# Plan — Performance investigation (slow page loads)

2026-10-03. A teammate reported, by word of mouth during scenario testing, that "one section" sometimes
takes a long time to load and sometimes does not. Which page, which data and which account are not
recorded.

**Decided by Hanchen (2026-10-03):**
- **Measure first.** The slow page is unknown, so the first job is to find it with numbers. Nothing is
  fixed on a guess.
- **Investigate only.** This ticket measures, explains and writes up. Every fix it motivates becomes its
  own ticket for W9/W10 (W9 is already 19.5u, so they are placed at the W9 meeting).
- The plan lives here. The ticket text is in `../jira/jira-perf-investigation.md`. It is not a backlog
  story, so it has no feature spec.

**Sprint and owner.** It is break testing and bug work, which is not counted in roadmap units (roadmap →
Break). The owner is picked at the break meeting (Wed 7 Oct). Whatever is unfinished on 7 Oct becomes
W9 carry-over. Rename this file to `plan-SCRUM-<n>.md` once the ticket exists.

**Output:** `../tests/perf-findings-SCRUM-<n>.md` (measurements and verdicts), plus the fix tickets
appended to `../jira/jira-perf-investigation.md`.

## What the code suggests (read on `origin/main` `66b7ff6`, 2026-10-02; nothing measured yet)

These are hypotheses to confirm or reject, not findings.

| # | Hypothesis | Where | Predicted symptom |
| --- | --- | --- | --- |
| **H1** | **Drafts are fetched one request per item, twice on Annotate and Review.** The task shell fetches drafts for every item. The Annotate and Review pages then fetch them all again for the same items. A 200-item task (one client JSONL file, one item per record since SCRUM-112) means **~400 requests** per load, each doing its own auth lookup and access check | Shell: `hej-web/lib/live-task-workspace.ts:85-98`. Again: `components/task-annotation-workspace-with-real-data.tsx:43`, `components/task-workbench.tsx:95` (Review). Server: `hej-api/app/api/routes/drafts.py:121` | Load time grows with item count: small hand-made tasks are fast, dataset-sized tasks are slow. **The best fit for "sometimes"** |
| **H2** | **`GET /tasks/{id}/task-items` does work proportional to history, and writes.** Every list runs two "repair" passes that may `UPDATE` and `commit` (`reconcile_resubmitted_send_back_items`, `repair_expert_send_back_for_task`). `collect_expert_send_back_item_ids` runs twice per call. It scans `audit_logs` by `task_id` + `operation`, which have **no index**, and queries drafts once per send-back item | `hej-api/app/services/task_item_status_resolution.py:307-317` (also `:58`, `:113`, `:153`, `:190`, `:220`). Table: `app/models/db_models.py:151-165` | Gets slower as a task gathers reviews and escalations. Reached from the task shell and, **once per task**, from the project page |
| **H3** | **The project page multiplies H2.** For every task it calls `getTaskSetup` and `listTaskItems` only to compute a backlog count | `hej-web/lib/project-data.ts:508-527`, `:139-144` | The project page is slow in projects with many tasks |
| **H4** | **The auth dependency blocks the event loop on every request.** `get_current_user` is `async def` but does a synchronous DB lookup, so it runs on the event loop for every route, including the sync ones. `/auth/me` and `login` (bcrypt) are `async def` too. Under H1's ~400 parallel requests, these lookups are serialised | `hej-api/app/core/security.py:253`, `app/api/routes/auth.py:60`, `:118` | The whole API stalls briefly during a heavy page load; a second user's page is slow at the same moment |
| **H5** | **Writes on read collide with real writers.** H2's `UPDATE`s on a GET wait on row locks held by a submitting user or the AI worker | H2 plus `app/worker.py` (polls every 2 s) | Occasional multi-second stalls with no data change. Truly intermittent |
| **H6** | **AI pre-annotation runs inside the request by default.** Activating an AI-assisted task calls the model once per item, sequentially, before responding | `hej-api/app/core/config.py:42` (`ai_execution_mode = "inline"`), `app/services/task_service.py:730-749` | Activation (not a page load) takes item count × model latency. Possibly what was reported as "loading" |
| **H7** | **Retries and dev-mode effects inflate some loads.** Hydration retries 404 and 5xx three times, 400 ms apart. In dev, Turbopack compiles a route on its first visit, and uvicorn runs with `reload=True` | `hej-web/lib/live-hydrate.ts:11-12`, `hooks/use-task-workspace-enrichment.ts:10`. `hej-web/package.json` (`next dev --turbopack`), `config.py:18` | The first visit to each page after a restart is slow and later visits are fast. Partly not a product problem at all |

Side note: `components/use-hydrated-task-items.ts` has no importer. It is dead code with the same pattern.

## Step 0 — Ask the reporter (before anything else)

Which page, roughly how long, which task (how many items, uploaded from which file), which browser,
first visit or repeat, and whether anyone else was using the app or an AI run was going. Message to
send (team chat):

```
@<name> 你之前说有个板块加载有时候很慢——想排查一下，能告诉我几个细节吗？🙏
1. 哪个页面（Annotate / Review / Items / 项目页 / 组织页 / 其他）？
2. 大概慢多久？每次都慢，还是只有第一次打开慢？
3. 那个 task 大概有多少 item？是不是用 JSONL 数据集上传的？
4. 当时有没有别人同时在用，或者 AI 在跑？
如果方便，下次慢的时候按 F12 → Network 截个图给我就更好了～
```

## Test bed

- **Code:** `origin/main`, with the commit recorded in every measurement table. Measure in a worktree
  (`git worktree add ../hej-perf origin/main`), so the instruments never touch a working branch.
- **Database:** a separate PostgreSQL database for this work (for example `hej_perf`, chosen through
  `DATABASE_URL` in the worktree's own `.env`). The shared dev database stays untouched, which avoids
  the cross-branch schema drift. Never print `.env` values.
- **Data:** a seeding script, `../scripts/sandbox-perf-seed.py`, that works through the API like
  `../../tools/seed_test_roles.py`. It creates one organisation and one project with:
  - tasks of **10, 50 and 200 items**, uploaded from
    `dataset/text_dataset/fewnerd/source/fewnerd_text_ner_source_subset.jsonl` (200 records; the
    smaller ones take the first N lines);
  - on the 200-item task, real history for H2: submissions from two annotators, reviews, a few
    returns and expert send-backs;
  - **8 tasks** in the project, for H3.
- **AI:** the mock provider, so model latency stays out of every measurement except H6's.
- **Two server modes**, each measured separately:
  - **dev** (`npm run dev:api` / `dev:web`) is what the team actually uses;
  - **prod-like** (`HEJ_RELOAD=false`; `next build` then `next start` for the web) removes the
    dev-only effects of H7.

## Instruments (local only, never committed)

1. **Request timing log.** A temporary middleware in the worktree's `app/main.py`. It writes one CSV
   line per request with: method, route template, status, total ms, SQL statement count, SQL ms, and
   whether any `INSERT`/`UPDATE` ran. SQL is counted with SQLAlchemy `before_cursor_execute` /
   `after_cursor_execute` events into a per-request context variable. The write flag tests H2/H5
   directly: a GET should never write.
2. **Event-loop probe.** A small script, `../scripts/sandbox-perf-probe.py`, that calls `/health` every
   50 ms while a page loads and logs the latency. If `/health` slows down while Annotate loads, the
   event loop is blocked (H4).
3. **Browser.** Chrome DevTools → Network, with cache disabled. Save a HAR for each page load. From it
   record: number of API requests, time to the last API response, the slowest request, and any
   retried request.
4. **Optional:** `EXPLAIN ANALYZE` on the `audit_logs` query from H2 at 1k / 10k rows.

## Steps

| # | Step | Produces |
| --- | --- | --- |
| 0 | Ask the reporter (above) | The suspect page and conditions |
| 1 | Worktree, `hej_perf` database, seed script, timing middleware, probe | A re-runnable test bed |
| 2 | **Baseline matrix.** Load each main page 5 times in each mode, on the 10- and 200-item tasks: Dashboard, Organizations, Organization, Projects, Project overview, Task Items, Annotate, Review, History, Dispute, Finalized, Admin. Count the first load after a restart separately from the others | Table: page × mode × size → requests, p50, max, slowest request |
| 3 | **Scaling.** Annotate, Review and Items at 10 / 50 / 200 items; the project page at 1 / 4 / 8 tasks | Whether time is linear in items or tasks (H1, H3) |
| 4 | **Writes on read.** Read the timing log for writing GETs. Measure `task-items` before and after the 200-item task gains history | H2 confirmed or rejected; the cost of history |
| 5 | **Contention.** Load Annotate while (a) a second browser submits and reviews, and (b) the AI worker is draining a batch (`HEJ_AI_EXECUTION_MODE=worker`). Run the probe throughout | H4, H5: stalls and their length |
| 6 | **Activation.** Time activating an AI-assisted 50-item task in `inline` mode, with the mock given an artificial 1 s delay, and compare with `worker` mode | H6 |
| 7 | **Reproduce the report.** Replay the reporter's case from step 0 on the test bed. If it does not reproduce, sit with them for 10 minutes with the instruments on | The reported page is explained |
| 8 | **Write up** `perf-findings` and draft the fix tickets (below) | Findings + tickets for the W9 meeting |

## Findings record (`../tests/perf-findings-SCRUM-<n>.md`)

- The test bed: commit, data sizes, mode, machine.
- The baseline matrix, kept re-runnable, so each later fix ticket reports before/after numbers on the
  same bed.
- Each of H1–H7 as **confirmed / rejected / not measured**, with its numbers. Rejected hypotheses stay
  in the record with their evidence (the same discipline I5's findings record asks for).
- What the reporter saw, and which hypothesis explains it.
- Ranked by what a user waits for, not by how easy the fix is.

## Fix tickets to draft (only for confirmed hypotheses; not built in this ticket)

| If confirmed | Candidate fix for the ticket to propose | Watch for |
| --- | --- | --- |
| H1 | One batched read: `GET /tasks/{id}/drafts` (or a draft summary on each `task-items` row), so a page sends one request. Annotate and Review read the shell's data instead of fetching again. Delete `use-hydrated-task-items.ts` | An API shape change: `api_surfaces.md` (Docs Sync). The panel files are being edited by SCRUM-113/114/117 and SCRUM-38 reads versions, so it lands after they merge |
| H2, H5 | Stop repairing on read: move the repairs to the write paths that cause them, plus a one-off repair for existing rows. Add an index on `audit_logs (task_id, operation)` | Changes workflow-state code (D8/E3 owners). Index needs `migrate_db_schema()` on existing databases |
| H3 | Return backlog counts with the task list (or one project-level count endpoint) | SCRUM-89 (J2, W9) reads the same counts: same owner or close collaboration |
| H4 | Make `get_current_user`, `/auth/me`, `login` and the other `async def` routes doing sync DB work plain `def` | Authentication is a stable surface by client rule: written justification at review |
| H6 | Default `ai_execution_mode` to `worker` and document starting the worker, or keep `inline` but cap it | Changes the dev setup for everyone; C2 owner (Michael) |
| H7 | Do not retry 404. Note in `tech-stack.md` that the first dev visit per route compiles | Small |

Each ticket states its measured gain target (for example "Annotate on a 200-item task: from X s to
under Y s, ≤ 10 requests") and re-runs the baseline row it targets.

## Exit check

- The page the teammate reported is identified and explained, or the record says why it could not be
  reproduced.
- The baseline matrix exists, with its commit and data sizes, and can be re-run.
- Every hypothesis H1–H7 is confirmed, rejected or explicitly not measured, with numbers.
- A fix ticket is drafted for every confirmed cause, each with a target, ready for the W9 meeting.
- No instrument, seed script or `.env` change reached a pushed branch.
