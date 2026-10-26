# Review — PR #105, `CS57-Hanchen-findings-defect-register` (K1, no ticket: the findings record closes defects 1, 25 and 26, the unmaintained docs move to `docs/archive/`, and the live docs follow the code)

<https://github.com/USYD-CS-Capstone/hej/pull/105> · reviewed 2026-10-26 at `e4fcde2e` (5 commits, 114 files, +1341/−1022) · base `main` at `69517818` · author and reviewer Hanchen Wang

**Self-review, not posted.** Nothing here is on GitHub. "Not raised on the PR" below the rule is for Hanchen only.

Read from GitHub first (read-only `gh`):
- **The PR is a draft**, `OPEN`, `MERGEABLE`, base `main`, head `e4fcde2e`.
- **No comments, no reviews.** One review request, to `DIQI26`.
- **CI at `e4fcde2e`:** `sqlite`, `web` and `postgresql` all skipped, because the PR is a draft. The workflow's path filter does match this PR (it touches `apps/hej-api/**` and `apps/hej-web/**`), so `sqlite` and `web` will run when it is marked ready. I ran the same checks locally (below).
- **The branch is level with `main`.** The merge base is `69517818`, main's tip. Main gained nothing the PR's moves or rewrites could collide with or revert.

Prior context read: `specs/mission.md` (Defects table, K1–K4), `specs/tech-stack.md` (commits, PR title rule of 2026-10-23, Docs Sync), `sandbox/W11/plans/plan-SCRUM-133.md`, `docs/handover/ticket-map.md`, and the format of `review-cs57-hanchen-scrum-121-pr98-self-review.md` and `review-cs57-yi-scrum-132-pr99-model-confidence.md`.

## Verdict: approve with nits

I found no blocker. The risky parts hold up:
- **The move is clean.** 81 of the 83 renames are exactly 100%, no content changed, and nothing in `apps/`, `packages/`, `.github/`, `package.json` or any test reads a moved or deleted file.
- **No link in a live doc is broken.** I checked every relative Markdown link and anchor in all 140 tracked `.md` files, and every `docs/…`, `apps/…` and `packages/…` path named in the live docs.
- **The key is not in the diff.** Nothing in the diff or in any of the five commits carries it.
- **The "checked against main" claim is true where I tested it,** and I tested a lot (list below). The documented counts reproduce exactly: API 2,495 passed / 62 skipped / 188 subtests, web 1,050 passed in 110 files, typecheck clean, lint 0 errors / 38 warnings.

Four things to fix before this leaves draft. None is hard:
1. **The PR title has no story reference.** The 2026-10-23 rule wants `(K1)` in the closing parentheses (finding 1).
2. **`backend_module_map.md:78` gives the wrong test for a judgement task** (finding 2).
3. **`docs/README.md` says `api_surfaces.md` covers "every API resource and route",** while the PR itself lists about 15 route groups it does not cover (finding 3).
4. **§7 of the findings record closes defect 1 on a 401 with no stated reason or control,** and keeps two present-tense "still open" paragraphs under a "closed" heading (finding 4).

## Checked

| Check | Result |
| --- | --- |
| Detached worktree at `e4fcde2e` (scratchpad `pr105`), compared with `origin/main` | `git merge-base` = main's tip; the user's checkout was not touched |
| Renames: `git diff -M --summary` | ✅ 83 renames. 81 at 100%; `integration-contract.md` → `design/backend/integration_contract.md` at 80%; `fe-be-local-integration-runbook.md` → `docs/archive/` at 54%. `HEJ_MVP_AI_INTEGRATION_SUMMARY.md` shows as a delete plus the new `docs/design/backend/ai_integration.md` (38% similar: a rewrite). The 81 match the PR's list: `governance/`, `team-discipline/` (with `archived/` flattened), `implementation/`, `design/processes/`, four `design/product/` docs, two `design/system/` docs, `design/ds/`, `design/archived/`, two terminology docs, `supabase/` and `infrastructure/` |
| Link check (own script, Python `-I`, in the scratchpad): all relative links and anchors in the 114 changed files, then in all 140 tracked `.md` files | ✅ 0 broken outside `docs/archive/`. 4 broken inside it, all in the edited runbook (finding 5). The archived 81 contain no relative Markdown links, so the move broke none |
| Path-style references (`docs/…`, `apps/…`, `packages/…`) in live `.md` files, code comments and tests | ✅ none dangling. Code comments that cite docs name `docs/design/database/ai_batch_job_schema.md` and `docs/design/backend/ai_batch_execution_architecture.md`, both still in place |
| Inbound references to moved files from `apps/`, `packages/`, `.github/`, root config, `package.json`, tests | ✅ none. Docs-only is proven |
| `/Users/hunterxu` anywhere at the head (`git grep`) | ✅ zero. `main`'s `AGENTS.md` had 39 lines, as the PR says |
| `SCRUM-nn` added by the PR | ✅ none. The tree has only `ticket-map.md` and the one casebook test input, as the ticket map says. `docs/README.md:10` writes the generic `SCRUM-N` |
| Chinese text in changed live docs | ✅ none. `db_schema_strategy.md`'s Chinese preamble was translated to English, which the PR doesn't mention |
| Secrets: `AIza`, 35+ character tokens, `git log -p` over the five commits | ✅ none |
| Commit messages | ✅ no AI trailers on any of the five. Headline and body points in finding 6 |
| Full API suite on the head, SQLite (`pytest -q -n auto`, venv from `uv sync --frozen`) | ✅ 2,495 passed, 62 skipped, 188 subtests (1 min 45 s), exactly the README's figure |
| Web: `npm ci`, then `test:web`, `typecheck:web`, `lint:web` | ✅ 110 files / 1,050 tests; 0 errors; 0 errors, 38 warnings. All as the README says |
| Defects 25 and 26 against `e0e642ac` | ✅ see "Verified true" |

Not checked:
- **PostgreSQL.** No code changed and no database was started, so I did not run the PostgreSQL job.
- **The casebook (`python -m evaluation`).** Not run; no code changed.
- **The Docker commands.** I did not run `docker compose`. I checked `compose.yaml` for the service names, the `ai-worker` profile, the volumes and the `HEJ_AI_EXECUTION_MODE` pass-through, and they match the README text.
- **Every sentence of the unchanged parts of the long docs.** `api_surfaces.md` is 1,800 lines and `system_design.md` is about 1,300. I verified every changed hunk (and the surrounding claims they depend on), not every line a hunk left alone.
- **The provider's side of defect 1.** I cannot call the Gemini API with the key and did not try.

## Verified true

You can rely on these. Each was compared with the code at the head.

**Findings record**
- `e0e642ac` is in #2's merge (`5ec4cedd`) and in `main`.
- Defect 25: the test "hydrates image bbox annotator from draftPayloadText boxes" asserts the label and `x`, `y`, `w`, `h` (`task-item-workspace-sheet.test.tsx:2232`–`:2238`).
- Defect 26: `test_org_admin_can_create_user_in_own_org` has no `db.query` stubs and says why (`test_admin_iam_service.py:111`–`:114`); the file has 18 tests, as §6 says.
- The key stays in history, and the text says it "must never be reused".
- Everything else §6, §8 and §12 say about defects 1, 25 and 26 is consistent. I found no other place that still calls them open.

**Routes and capabilities** (a route dump from the running app, 126 routes, against the docs)
- `GET …/overview/item-status-counts`, `…/cross-review-report`, `…/superseded-guideline-items` and `…/superseded-policy-items` check `oversee`, as `api_surfaces.md` now says. This also fixes the stale "project-management permission" sentence that review #98 noted.
- `POST …/activate`, `/pause`, `/resume` and `/complete` check `manage_task` (`routes/tasks.py:206` and `:240`, through `_verify_task_transition_action`). `archive` and `restore` check `manage_project`. `POST /tasks/{id}/releases` and the export check `release`. `POST /tasks/{id}/ai-runs` checks `manage_task`, needs the task `ACTIVE`, and always enqueues (`start_run` is deliberately not gated on the execution mode).
- `return_target` and `return_context_annotation_id` are the request fields; `adjudicate_return_target` and `adjudicate_return_context_annotation_id` are the stored and read-back names (`schemas/review_actions.py:139`–`:140`, `db_models.py:927`–`:928`). `ReleaseRead` carries `gate_warnings` (`schemas/releases.py:25`). `project_policy_dual_signoff_v2` exists (`project_policy_templates.py:80`). `record_release` runs in the release's transaction (`release_service.py:171`).
- The provenance route shows a round's events to its annotator and all of them to `OVERSEE` (`provenance_service.py:220`–`:226`).

**States**
- `TaskItemStatus` is `pending`, `annotated`, `returned`, `rejected`, `reviewed`, `disputed`, `canonicalized`, `unresolved` (`models/domain.py:68`–`:76`), the list `workflow_states.md` gives. `expert_send_back` is gone. Task states are `draft`, `active`, `paused`, `completed`, with the transitions the docs give (`task_service.py:161`–`:168`).
- Activation needs at least one item (409). The export projection is draft → `draft`, active and paused → `building`, completed → `ready`, plus a `released` row per release (`project_exports_service.py:23`–`:26`, `:93`).
- The status PATCH refuses the seven workflow-owned statuses, and export eligibility is `canonicalized` and `unresolved` (`task_service.py:307`–`:327`), as `backend-governance-guards.md` says. Its message text and 403 match `routes/tasks.py:1296`–`:1299`.

**AI at activation**
- `_kick_off_ai_execution` enqueues when `ai_execution_mode == "worker"` and runs inline otherwise (`task_service.py:859`–`:882`). The settings and their defaults match: `HEJ_AI_EXECUTION_MODE` (`inline`), `HEJ_AI_WORKER_POLL_SECONDS` 2, `HEJ_AI_WORKER_LEASE_SECONDS` 300, `HEJ_AI_RETRY_BASE_SECONDS` 30, `HEJ_AI_RETRY_MAX_SECONDS` 600 (`core/config.py:42`–`:49`, prefix `HEJ_`).
- `python -m app.worker`, and the `ai-worker` compose profile with `command: python -m app.worker` (`compose.yaml`), both exist.
- The model catalogue table in `ai_integration.md` matches `ai_capability_catalog.py` row for row, including the corrected image default (`ollama/gemma3`, not `openai/gpt-4.1-mini` as the old summary said). The schema-preset table matches `annotation_types.py`, including that `image_bbox` is offered to judgement tasks only.

**Tables and columns**
- The tables named exist (`provenance_events`, `annotation_disputes`, `dispute_review_evidence`, `review_disagreements`, `disagreement_settlements`, `item_reconciliations`, `releases` with `version`, `manifest_json`, `manifest_sha256`, `ai_batch_jobs`, `ai_item_jobs`, `project_policy_versions`, `task_guideline_versions`). The tables the docs say were not built (`assignments`, `export_packages`, `canonical_judgments`, `dispute_participants`, …) are not in `db_models.py`.
- Provenance triggers refuse update, delete and truncate (`db_models.py:76`–`:112`).

**Pages and tabs**
- The task tabs are Overview, Setup, Items, Annotate (Judge on a judgement task), Review, Dispute, Reconciliation, Finalized, History (`task-workspace-client-shell.tsx:173`–`:200`). The project tabs are Overview, Tasks, Disputes, Exports, Policies (`project-workspace-header.tsx:64`–`:68`). The global nav has Dashboard, Organizations, Projects, Admin.
- `lib/organization-actions.ts` has the nine display actions `workspace_surface_hierarchy.md` lists, and `isEveryAction` really cannot be met by one role (an admin holds five).
- Review labels are Accept / Adjust / Reject / Escalate, with Revise on a judgement task (`task-item-workspace-sheet.tsx:3825`–`:3826`). A created task opens its Setup page (`task-create-form.tsx:850`).

**READMEs**
- The seeded accounts, passwords and roles match `SEED_PEOPLE` (`init_data.py:52`–`:69`). `npm run dev:all`, `dev:web`, `dev:api`, `test`, `test:api`, `test:web`, `typecheck:web`, `lint:web` and `check` exist in `package.json`. Python 3.14 and Node 20+ match `pyproject.toml` and `engines`. `NEXT_PUBLIC_HEJ_API_BASE_URL`, its default, `hej.auth.access_token` and the two storage modes match `lib/api-config.ts` and `lib/auth-storage.ts`. `hooks/`, `lib/domain/`, `test/` and `test:watch` exist.
- The Docker section moved from the API README into the root README whole. The "Integer IDs" text the API README lost is in `db_schema_strategy.md` ("Identity ID allocation (#93)"). The "database written before #102" list moved into the API README. The PostgreSQL setup that left the root README is in the API README.

**"Left for the team" list** (all four are accurate)
- `api_surfaces.md` leaves out about 15 route groups. By my scan, the uncovered paths are the auth and admin-IAM routes, the member-role routes, `PATCH /organizations/{id}/policy`, `GET /policy-bundles`, the predictions routes, task create/update/delete and the four lifecycle POSTs, the three capability catalogues, the `ai-runs` routes, `dataset-registration` and the uploads, `finalized-items`, `data-pointers`, task-item `content`, `workflow-lineage`, and the health and download routes.
- The two comments in `routes/tasks.py` are stale: `:1228`–`:1231` ("Once policies are versioned, each item will also name the version…") and `:1294`–`:1295` ("only reviewed or canonicalized task items are eligible"). The doc now says the opposite of both comments, correctly.
- `.env.example` has none of `HEJ_AI_EXECUTION_MODE`, the worker settings or the retry settings.
- `BATCH_CANCELLED` and `BATCH_FAILED` are defined (`ai_batch_service.py:58`–`:59`) and never assigned. Nothing moves a batch to either, and the new text in `ai_batch_job_schema.md` says so.

## PR title, commits and conventions

| Item | Result |
| --- | --- |
| PR title: `docs: the findings record closes defects 1, 25 and 26, and the docs follow the code` | ⚠️ Type, no scope for a docs-only PR, and a lower-case description all follow the rule. **No refs.** See finding 1 |
| PR body | ✅ Opens "Serves K1 (handover); no ticket", and the ticket map records the same (`ticket-map.md:138`–`:140`) |
| Commit headlines | ⚠️ All five are `docs…`. None names the story; commit 3 is 80 characters, so GitHub cuts it ("…foll…"). See finding 6 |
| Commit bodies | ⚠️ Each reads as what changed; none starts with what was wrong, and none ends with the story reference (`tech-stack.md`, "Commits"). The earlier PRs do the same, so I raise it only as a nit |
| No AI attribution trailers | ✅ none |
| English only, no secrets | ✅ |
| Docs Sync | ✅ `AGENTS.md` now lists live docs and gains the two rules (an architecture decision gets an ADR; adding, moving or retiring a doc updates `docs/README.md`). It dropped the "Milestone scope" row with the archived planning docs |
| Merge style | ✅ five commits, merge-commit policy keeps them. Commit 3 rewrites the runbook that commit 5 archives, so the history shows edits to a file that then leaves |

## Findings, most severe first

No blocking findings. Findings 1 to 4 are should-fix, and they are small.

### 1. Should-fix: the PR title has no story reference

PR title. `tech-stack.md` ("Branches and pull requests", decided 2026-10-23): "**refs:** every story the PR implements, then every ticket, in the closing parentheses." The merge commit keeps the title the PR has when it merges. This PR serves K1 and has no ticket, so the refs are `(K1)`. The 83 merged PRs were renamed to this format on 2026-10-23, and #105 would be the one that isn't.

**Suggested fix:** retitle before marking ready, for example
`docs: close defects 1, 25 and 26 in the findings record, archive the unmaintained docs and bring the live docs up to the code (K1)`.
It stays lower case, with no scope. (The current wording is also a statement rather than what the PR does.)

### 2. Should-fix: `backend_module_map.md` gives the wrong test for a judgement task

`docs/design/backend/backend_module_map.md:78`–`:79`: "a judgement task is a task whose `annotation_type` is `judgement`".

The code says otherwise:
- A judgement task is `task_class == "judgement"` (`models/domain.py:63`–`:65` and the `Task` model at `:114`; `db_models.py:410`; `review_actions.py:618`; the web's `task.taskClass === "judgement"` at `task-workspace-client-shell.tsx:119`).
- `annotation_type` is the surface. On a judgement task it is `judgement` for text and audio, but `image_bbox` for image and `structured_result` for video (`core/annotation_types.py:60`–`:79`, defaults `:106`–`:111`). `ai_integration.md:28`–`:33`, written in the same PR, says this correctly.
- No annotation-class task can take `judgement`, so the stated test never gives a false positive; but it gives a false negative on every judgement task that is not text or audio.

**Failure scenario:** a reader building something on this module map filters judgement tasks by `annotation_type == "judgement"` and misses every image and video judgement task.

**Suggested fix:** "a judgement task is a task whose `task_class` is `judgement`; its `annotation_type` is the surface, which is `judgement` only for text and audio".

### 3. Should-fix: `docs/README.md` says `api_surfaces.md` covers every route, and the PR says it does not

`docs/README.md:55`: "`api_surfaces.md` (every API resource and route)". The PR body and the verified list above agree that about 15 route groups are undocumented there, including the task lifecycle routes (`activate`, `pause`, `resume`, `complete`), `ai-runs`, `predictions`, uploads and all of auth and admin. `apps/hej-api/README.md:38`–`:40` has the same overclaim in a milder form ("describes the resource families and the capability each action needs").

The README now sends a reader to this file as the route reference, which is the exact job the removed "Key endpoints" list used to do. The reader who looks for how to activate a task will not find it there; `workflow_states.md` section 2 has it.

**Suggested fix:** either of these, the first being a one-line change:
- change `docs/README.md:55` to "the resource families and the routes the docs below build on; `GET /docs` on a running API lists every route", and say in the API README that the lifecycle, auth, admin, prediction, upload and AI-run routes are on `/docs` and in `workflow_states.md`;
- or add the missing groups (I can give the route list above as a starting table).

### 4. Should-fix (small): the closure of defect 1 is thinner than the record it replaces, and §7 contradicts its own heading

`docs/evaluation-findings.md:429`–`:469` (§7, heading "closed 2026-10-26").

**a. The evidence is a single run with no stated reason and no control.** §7 had set its own bar: the owner's non-secret confirmation, "who confirmed it, the provider and the date" (`:457`–`:460`). The new paragraph (`:462`–`:469`) records who tested and when, and that every request returned HTTP 401 `UNAUTHENTICATED`. It says outright that it does not show when or by whom the key was revoked, and that is honest. But a reader cannot tell "revoked" from "this request shape is never accepted", because:
- the provider's `reason` or message text is not recorded, and
- there is no positive control (the same three request shapes with a currently valid key returning 200).

`mission.md`'s Defects table (row 1) still bases the closure on a different thing: "treated as revoked at the provider (Hanchen's decision, 2026-10-14)". Two project records now give two bases for the same closure.

**Suggested fix:** add one sentence to `:462`–`:469` with the error's `status`/`reason` (not the key) and a line saying the same requests with a current key returned 200. If you no longer have the control, say so and say the closure rests on the 401 alone. Then update `mission.md` row 1 to point at §7 (local file, not part of this PR).

**b. Present-tense "still open" text under a "closed" heading.**
- `:457`–`:460`, the "#93 follow-up, 2026-10-23" paragraph, still says rotation "remains unconfirmed" and "If confirmation is unavailable by 28 October 2026, retain this as an open I5 (#92) process item". Only the paragraph before it (`:450`) carries the "Finding until 2026-10-26" label.
- `:446`–`:448` still reads "repository evidence cannot verify it", which is true of the repository but now needs "(closed by the provider check below)".

**Suggested fix:** begin the `:457` paragraph with "Superseded on 2026-10-26 by the provider check below:" (or fold it into the `:450` paragraph).

### 5. Nit: the archived runbook has four dead links from the move

`docs/archive/fe-be-local-integration-runbook.md:13`, `:79`, `:153`, `:187`: `../apps/hej-api/README.md#…` and `../README.md#local-login` were right in `docs/` and are wrong one folder down in `docs/archive/` (they resolve to `docs/apps/…` and `docs/README.md`). The archive README says "brought up to date on 2026-10-26 and then moved", and its closing caveat covers links "they had before the move", but this is the one archived file whose edit date is the move date, so a reader will assume it was checked.

Two smaller points on the same file:
- Three behaviours it documented exist only in the archive now: no token → "Your session is not authenticated. Please log in again."; API down → "Live data is temporarily unreachable." with a Retry; and the `uvicorn app.main:app --reload --port 8000` line for a fixed port. The archive README admits the smoke checks were not carried forward, so this is a choice, not an accident. If you want one line to survive, the web README's "Running it" is the place.
- Commit 3 edits this runbook for the new login and worker and commit 5 archives it; the 46% rewrite did no work for a reader of the live docs.

**Suggested fix:** correct the four links with `../../` (or add the runbook to the archive README's "some no longer resolve" sentence by name), and optionally add the two UI states to `apps/hej-web/README.md`.

### 6. Nit: commit headline and body form

- Commit `4c542182`: the headline is 80 characters, so GitHub shows it cut off ("…runbook and API READMEs foll…"). `docs: bring the design docs, terminology and API README up to the code` fits.
- None of the five headlines carries `(K1)`, and no body ends with the reference (`tech-stack.md`, "Commits"). Earlier PRs also omit it; fix it only if you reword commits anyway.

### 7. Nit: `system_design.md` names the wrong environment variable

`docs/design/system/system_design.md:130`: "(`apps/hej-api/mydata/`, or `DATA_DIR`)". The setting is `HEJ_DATA_DIR` (`core/config.py`, `env_prefix="HEJ_"`; `compose.yaml` and the API README both use it).

### 8. Nit: the state-mapping paragraph in `workflow_states.md` leaves out `IN_ARBITRATION`

`docs/design/product/workflow_states.md:137`–`:143` maps every conceptual state to its stored status except `IN_ARBITRATION` (`:121`, `:133`). Line 181 says in passing that an item waiting for the expert in an item reconciliation is `reviewed` ("the diagram's `IN_ARBITRATION`"), and an open annotation dispute is `disputed`. One clause in the mapping paragraph would close it: "`IN_ARBITRATION` is `disputed` while an annotation dispute is open and `reviewed` while an item reconciliation waits for an expert".

### 9. Nit: the archive README doesn't say where the integration contract went

`docs/archive/README.md:19` (the `implementation/` row) lists what the folder held, but the one file that left `implementation/planning/` for a live location (`integration-contract.md` → `docs/design/backend/integration_contract.md`, with an underscore) is not mentioned. `docs/README.md:60` lists it under its new name. Someone arriving from an old link (see "Not raised on the PR") finds the folder gone and no hint. One clause in that row fixes it.

---

## Not raised on the PR

- **`docs/specs/tech-stack.md` goes stale on merge.**
  - Line 9 cites `hej/docs/governance/repo-structure.md`.
  - The Docs Sync table at `:181` names `integration-contract.md`.
  - The "Repository & Documentation Map" at `:193`–`:197` lists `docs/governance/`, `docs/implementation/planning/` and `docs/team-discipline/` as live and omits `docs/archive/`, `docs/README.md`, `docs/handover/` and `docs/adr/`'s new role.
  - Update them in the specs repo after #105 merges, and replace the Docs Sync table with a pointer to `AGENTS.md`, which is now where it lives.
- **`docs/specs/mission.md`, Defects table row 1** gives the 2026-10-14 decision as the basis for "closed". Point it at `evaluation-findings.md` §7 once finding 4 settles.
- **`docs/shared/story_src.csv:38`** (the baseline "What we received" text of the handover story) cites `docs/implementation/planning/integration-contract.md`, which no longer exists at that path. That text is baseline and is never updated, so leave it, but be aware the handover dashboard now links to a moved path. Finding 9's archive-README clause is the cheapest cover.
- **The PR body's "A second agent checked the README restructure … its 13 findings are fixed"** is not a trailer, so it breaks no rule. Drop the sentence if you want the PR to read as the team's own work.
- **Draft CI.** Marking the PR ready runs `sqlite` and `web` only; PostgreSQL never runs on a PR. No code changed, so there is nothing for PostgreSQL to find here.
- **Timing.** Build ends 28 October; this is docs-only and level with `main`, so it can merge as soon as findings 1 to 3 are done. Finding 4 touches the one claim that a reader outside the team would act on (a leaked key), so I would settle it too.
