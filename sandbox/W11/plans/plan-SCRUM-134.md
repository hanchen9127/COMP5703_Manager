# Plan — SCRUM-134, widened: retire every legacy state

2026-10-25. No story: cleanup after the two-level disputes (#48) and A6 (#98). Board: W11, Jason Wang (Hanchen).
PR #102 (draft), branch `CS57-Hanchen-scrum-134`, worktree `hej-134`. Line numbers below are as of `99db00ea`.

**Why it grew.** Jingwei's review of #102 (2026-10-25) showed that retiring `expert_send_back` left the flow that
produced it. Hanchen decided the same day to retire every legacy state in this PR rather than hand it over as a
ticket. The next team should not find a second, dead way to escalate, review or store a status.

**Working:** one subagent per commit edits the worktree and never stages, commits or pushes. Claude verifies the
commit against this plan, then commits it (no AI trailer). Pushing waits for Hanchen. Each commit's message is a
file in `commits/scrum-134-<n>-<slug>.txt`.

## Decisions (2026-10-25, Hanchen)

| Decision | Why |
| --- | --- |
| **Delete everything the current workflow design does not describe**, for every legacy state, not only `expert_send_back` | The handover should not carry technical debt that reads as a live path |
| **No workflow or story behaviour may change.** Any change a person could see goes to Hanchen first | The cleanup is only safe if it is invisible |
| **No migration.** A database written before #102 is reset (`init_data.py --reset`) | As in commit 6. The probe below shows a fresh seed holds none of the legacy data |
| Commit 6, the review's four points (`c79f3088`), is committed first. The widening starts at commit 7 | Jingwei's points stay traceable to one commit. Commit 7 then deletes the branch point 3 was about |
| **The item-level escalation flow goes as a whole**: the table, its writers, the two 410 routes, `GET /tasks/{id}/escalations` and its detail, the schemas, and every read of the table | One writer is left, `route_escalation`, a helper only tests call. After a reset the table is always empty |
| **The export's `finalization` key goes** | It reads only the legacy escalation, so it is always `null`. Neither the web nor releases read it, and no doc describes it |
| **The `escalation_routed` / `escalation_decided` history wording goes. Task history's `open_escalations` count keeps its name** | Only the legacy writers recorded those audits. `open_escalations` counts open disputes too; only the legacy half goes, so the API and the web keep the field |
| **Also removed:** reviews with no verdict (`legacy_approved_by`), the pre-B4 task status backfill, and the four retired review mutation routes | Each is a state or a route that nothing writes or calls any more |
| **Not touched:** the export's `format=legacy` (still the default format), the `"legacy"` annotation type, the old data-intake history wording, the SQLite schema helper in `database.py`, the review payload's `comment` (the web still sends it) | They are names and formats in use, not legacy states |

## Probe (2026-10-25, fresh SQLite seed of `99db00ea`)

`init_data.py --reset` on an empty database, then counted with a short SQLite script:

| Legacy data | Count |
| --- | --- |
| `task_item_escalations` rows | 0 |
| `escalation_routed` / `escalation_decided` audits | 0 |
| reviews with a NULL verdict | 0 (verdicts: accept, reject, revise, adjust, escalate) |
| review submissions without a `cross_review_samples` row | 0 |
| tasks in `ready`, `in_review` or `disputed` | 0 |
| submitted drafts with no `annotation_id`, or no `created_by` | 0 |

**The writers.** The only `TaskItemEscalationDB(...)` is in `route_escalation` (`review_actions.py:1141`), which
also writes the `escalation_routed` audit. `decide_escalation` writes `escalation_decided` (`:1951`, `:2009`).
No route reaches either. The only `ReviewDB(...)` (`review_actions.py:722`) always sets `verdict`. Every
submission path calls `ensure_submission_sample` (`draft_service.py:795`, `annotation_versions.py:176`, `:268`).

**The live expert Return does not use the legacy evidence.** `may_resubmit`'s guard reads the dispute's
`adjudicate_decision` and `adjudicate_return_target` (`independent_review_service.py:280`) before it consults
`current_expert_return_at`, which reads only escalation rows and `escalation_decided` audits.

## Ground rules

| Rule | Why |
| --- | --- |
| Every commit is green on its own: backend suite on SQLite, casebook `--exact` (87/87, 88 unchanged), and the web checks when the web changes | Each commit can be read and reverted alone |
| A commit removes the tests that exercise what it removes. A test that used the legacy flow **only to set up** a live rule is rebuilt through the live flow (the dispute desk, a review, a settlement), never dropped | Coverage of live rules must not shrink. The commit message lists both groups |
| No live route changes path, request or response shape, except the routes and the export key decided above | No visible change |
| Refusal wording of live paths stays. A refusal that only a legacy row could trigger goes | Same |
| New comments name stories or PRs, not SCRUM numbers | The next team has no Jira |
| If a subagent finds a live path that reaches legacy data, it stops and reports it. That becomes a decision for Hanchen | The no-behaviour-change rule |

## Status (2026-10-25)

| Commit | Hash | State |
| --- | --- | --- |
| 6 — the review's four points | `c79f3088` | pushed |
| 15 — web: unused escalation client | `66a74c6c` | pushed |
| 7 — Return read only from the dispute | `30420c89` | pushed |
| 13 — pre-B4 task status backfill | `e3b1d19d` | pushed |
| 8 — no reads of item escalations | `a3ac50c1` | pushed |
| 14 — retired review mutation routes | `6dcc1efc` | pushed |
| 9 — export without escalations | `0326bff3` | pushed |
| 10 — escalation routes and writers | `12cdb419` | pushed |
| 11 — drop the escalation table | `a66736c1` | pushed |
| 12 — NULL verdicts and missing samples | `1c838ec7` | pushed (2,488 passed, casebook unchanged) |
| 16 — docs | `62844483` | pushed (Hanchen's go-ahead 2026-10-25) |
| 17 — defect 8 Guard (route table) | `18b4a002` | pushed: commit 14 deleted the tests defect 8's coverage note pointed at. Final head: SQLite 2,490 passed, casebook unchanged, web 1,047 |

**PR (2026-10-25):** description rewritten for the widened scope, reply to Jingwei posted asking for a re-review.
Still open: the Jira update (`../jira/jira-scrum-134-widened-2026-10-25.md`) and taking the PR out of draft.

**Re-review (Jingwei, 2026-10-25 11:11, on `18b4a002`): Approved**, with four doc/description fixes before merge.
Decided by Hanchen the same day: fix all four; ADR 011 gets the lock-order note but **no ticket**; fix every
doc-only small point, leave `ensure_submission_sample` at review time unchanged (it only matters for a database
that is reset anyway). Commit 18 (`docs`), then the description and a reply. Push and PR edits wait for Hanchen.
1. `workflow_states.md`: restore the reconciliation Return path to `READY` (`item_reconciliation_service.py:565`,
   ADR 017). Commit 16 dropped it, reading "an expert's Return" as the retired flow.
2. ADR 011: decision 3's lock-then-check is not yet true for `decide_annotation_dispute`.
3. Root README reset paragraph: generic, naming task statuses, NULL-verdict reviews and missing samples too; a
   pointer from `apps/hej-api/README.md`'s disposable-database section.
4. Description: per-route status codes, the `verdict` / `review_verdict` fallbacks, the three `Dispute*Read`
   schemas, the stale-data classes in Refusals and Known limitations, old escalation audit rows render as `system`.
Small points: `backend-governance-guards.md:197`, `:207`; `api_surfaces.md:828`; the Guard test's docstring says it
guards paths; ADR 010's and ADR 013's notes become short `Amended by` lines like the other ADRs.
**Commit 18 `8f20d3a3` pushed** (it also drops the pre-B4 `ready` from the dataset intake guard doc); description
updated and the reply posted. **Merged 2026-10-25 12:02 by Yi** (Approved by Jingwei and Yi), merge commit
`ab457205`, whose tree equals `8f20d3a3`. CI on `main` at `ab457205`: sqlite, postgresql and web all green.

**Found in Yi's review, outside #102 (already on `main` before it), Hanchen to decide:** the History tab's reopen
entry loses `reason`, `cause` and `superseded_annotation_ids`. `_USER_VISIBLE_CHANGE_FIELDS` in
`task_audit_log_query.py` keeps none of them, and `reopen-history-detail.tsx` reads all three from `changes`. So the
entry shows 0 superseded answers with no Show button (Yi saw it), and by the code no reason and the owner's label for
a reconciliation Return. Also, the reopen cause `adjudication_return` has no writer in app code (a dispute Return
does not reopen); only tests write it.
Drafts in the session scratchpad: `pr102-body-v2.md` (description) and `pr102-reply-jingwei-r2.md` (reply).

**Final checks (2026-10-25):** fresh `init_data.py --reset` probe on `1c838ec7` all zeros, the table absent;
PostgreSQL 18 (local container, Sydney sessions) on `1c838ec7`: 2,547 passed, 3 skipped. The "Done when" grep also
finds ADR 013's Context, comparison table and rejected alternative, kept as the decision's history.

**Waiting for Hanchen's go-ahead (do not start before):**
1. **Commit 16, docs**: the list in section 16, including the leftovers found while building 8, 10 and 11
   (`test_project_disputes.py` docstrings at `:4` and `:72` too). From 12: `db_schema_blueprint.md:305`
   ("Finished legacy submissions are not retroactively sampled"), ADR 010 lines 61–63 (NULL verdicts, by dated
   note), and optionally the "legacy" canonicalized answer in
   `test_batch_status_rules_preserve_dual_role_authors_and_legacy_exceptions` (`:1181`).
2. **Final checks**: a fresh `init_data.py --reset` and the probe again (all zeros); the PostgreSQL suite once (the
   table drop is a schema change; locally if a PG is available, otherwise the CI job on demand); the "Done when" greps.
3. **PR**: the new title, the description rewritten from the scratch draft for the widened scope, the reply to
   Jingwei (his four points are in `c79f3088`; point 3's branch went in commit 7), and the push.
4. **Jira**: a text for SCRUM-134's widened summary and description, 3 points suggested.

**Found while building, outside this PR. Decided 2026-10-25 (Hanchen): no ticket, recorded here only** (and in
#102's "Notes for reviewers"):
- `decide_annotation_dispute` checks independence (`adjudication_conflict_item_ids`) before any lock and locks
  only the dispute row in `resolve_annotation_dispute`, not the item, so a review committed while an expert
  decides may go unseen by the check. Not run on PostgreSQL.
- The `annotation_dispute_adjudicated` history entry lists `decision` as a change although its summary already
  states it.

## Commits

### 7. `refactor(api)`: an expert's Return is read only from the dispute's decision

- `task_item_status_resolution.py`: the whole module. `current_expert_return_at`,
  `current_expert_return_at_by_submission`, `_audit_send_back_timestamps`, `_counts_after_reopen`,
  `_latest_reopen_at_by_item`, the legacy draft-chain matching, `_parse_audit_json` and the constants go. If
  nothing else imports the module, delete the file.
- Callers drop the input, which is empty without legacy rows:
  - `independent_review_service.py:331`: the guard's `sent_back` is always False, so the second `may_resubmit` call
    and the time comparison go;
  - `review_policy_enforcement.py:420`–`:431` (`item_status_after_accept`): a held round stays `disputed`, and the
    "`sent_back` → `returned`" branch goes. Its docstring loses "unless genuine expert Return evidence releases them";
  - `task_work_queue_service.py:43`, `:127`: the annotate queue's Return evidence.
- Tests: `test_independent_second_review.py` builds "imported legacy Return evidence" (`:2171`,
  `_two_held_answers_after_legacy_return` `:2242`, the aggregate test `:3465`, the legacy-adjust tests `:2254`).
  Those that test only the legacy Return go. Any that check a live rule are rebuilt through a dispute Return.

### 8. `refactor(api,evaluation)`: holds, gates, queues and independence stop reading item escalations

- `submission_rules.py`: `open_escalation_item_ids` (`:698`) goes, with its ten call sites (`draft_service.py:571`,
  `independent_review_service.py:273`, `:505`, `review_policy_enforcement.py:142`, `:423`,
  `task_work_queue_service.py:133`, `:267`, `annotation_dispute_service.py:591`). The `open_escalation_ids`
  parameter of `blind_submissions_by_item` / `blind_item_statuses` goes with it. Participation stops counting
  `routed_by` (`:163`); the judges stop unioning `legacy_adjudicators` (`:205`).
- `release_gate.py:167`–`:203`: no `open_escalations` hold. Its module docstring (`:13`) loses "an open escalation".
- `task_work_queue_service.py:325`: the adjudication queue reads open disputes only.
- `task_workflow_service.py:84` (`_open_escalations`): counts open disputes only. The field keeps its name.
- `annotation_dispute_service.py:581`, `:592`: the "open legacy escalation" settle refusal and its docstring.
- `review_policy_enforcement.py:138`: the legacy item hold before a review.
- `evaluation/harness/integrity.py` (`:99`, `:139`, `:272`, `:377`, `:441`, `:515`, `:595`): I5's checks stop
  reading escalation rows and `escalation_decided` audits. The casebook result must not change.
- Tests that seed an open or decided escalation to prove one of these holds go, listed in the message. The same
  holds for disputes keep their tests.

### 9. `refactor(api)`: the export takes approvals only from reviews and dispute decisions

- `routes/tasks.py`: the `escalation` parameters of `_authoritative_resolution` and its legacy branches
  (`:1021`–`:1170`), `_escalation_naming`, `_expert_return_targets_candidate`, `_item_release_groups`'
  `latest_escalation`, `_latest_resolved_escalations_by_item`, `_finalization_export_block`, the query at `:1591`,
  and the item's `finalization` key (`:2169`).
- Tests: `test_task_exports.py`'s two `_finalization_export_block` tests; the legacy-escalation cases in
  `test_authoritative_export.py` and `test_export_provenance.py`.

### 10. `refactor(api)`: remove the item escalation routes and what only they wrote

- `routes/review_actions.py`: `route_escalation` and `retired_route_escalation` (`:1068`–`:1170`),
  `decide_escalation` and `retired_decide_escalation` (`:1805`–`:2028`), `_normalize_escalation_decision` and
  `_map_escalation_decision_to_task_item_status` (`:229`–`:250`), `list_escalations` and `get_escalation_detail`
  (`:2030`–end), and the `:1579` refusal.
- `review_policy_enforcement.py`: `assert_may_route_dispute` (`:195`).
- `schemas/review_actions.py`: the `Escalation*` models (`:138`–`:508`).
- `task_audit_log_query.py` (`:63`, `:90`, `:91`, `:176`–`:181`) and `task_history_recorder.py` (`:30`, `:31`): the
  two audit operations' wording and grouping.
- Tests: the route and decision tests, `test_dispute_posture_guards.py:294`, and the history-wording tests.
- `api_surfaces.md`: the escalation routes.
- Carried from 8: `_open_escalation` (`:459`) also feeds `GET .../adjustment` (`:985`), whose `routed_at` and
  `routed_by` are always `null`; the web reads them in `task-item-workspace-sheet.tsx:1702`. **Decided
  2026-10-25 (Hanchen): remove both fields from the API response, the web type (`lib/api/review-actions.ts:76`)
  and the web condition**; the condition's result is unchanged.
  `test_review_decision_refusals.py`'s `_finalise_by_adjudication` builds its finalised item with
  `route_escalation` and `decide_escalation`: rebuild it through a dispute. `test_adjudication_independence.py`'s
  `test_an_expert_return_stores_returned_not_a_second_status` and the PostgreSQL lock test call `decide_escalation`
  for the helper itself.

### 11. `refactor(api)`: drop the task_item_escalations table

- `db_models.py:1166`: `TaskItemEscalationDB` and any relationship to it.
- `database.py` `reset_db()`: `DROP TABLE IF EXISTS task_item_escalations` before `drop_all`, beside the two
  intake tables. Without it, resetting a database written before #102 can fail, because the unmapped table's
  foreign key to `task_items` blocks the drop on SQLite with foreign keys on, and on PostgreSQL.
- A test: reset a database that has the old table, and it succeeds.
- `db_schema_blueprint.md`: the table.

### 12. `refactor(api)`: reviews without a verdict and submissions without a sample are no longer read

- `independent_review_service.py`: `legacy_approved_by` (`:115`, `:123`, `:144`–`:171`) and the "legacy unknown
  deciding status" branch (`_DECIDING_STATUSES`, `:106`). `submission_is_sampled`'s fallback when no sample row
  exists (`:96`–`:103`).
- `submission_rules.py:356`, `:544`, `review_actions.py:739`: their comments about legacy rows.
- **Gate:** first add a Guard test that every submission path writes a sample row: draft submit, inline AI, worker
  AI, reviewer correction excluded. If one path does not, stop: that is a decision for Hanchen.
- Tests that store a NULL verdict go, or set a verdict when the NULL was incidental.

### 13. `refactor(api)`: remove the pre-B4 task status backfill

- `database.py:142`, `:171`: `migrate_legacy_task_statuses` and its call.
- `tests/test_task_lifecycle.py:361`: its test.
- `workflow_states.md:109`–`:112`: the "Legacy compatibility" paragraph.

### 14. `refactor(api)`: remove the retired review mutation routes

- `routes/annotations.py`: `LEGACY_REVIEW_MUTATION_DETAIL`, `_raise_legacy_review_mutation_retired` and the four
  routes (`POST /annotations/{id}/reviews`, `PATCH`/`DELETE /reviews/{id}`, `POST /reviews/{id}/submit`). The
  read routes stay.
- `tests/test_legacy_review_mutations.py`, and `test_adjudication_independence.py:3`'s header.
- `api_surfaces.md`: the routes.

### 15. `refactor(web)`: remove the unused escalation client and item action helpers

Independent of 7–14; it runs in parallel with 7.
- `lib/api/review-actions.ts:398`, `:404`: `listTaskEscalations`, `getTaskEscalationDetail` and their types.
- `lib/api/task-items.ts`: `approveTaskItem`, `rejectTaskItem`, `escalateTaskItem` and `postItemAction`. They post
  to `/task-items/{id}/approve|reject|escalate`, which the API never had. The header's "legacy helpers" sentence
  goes too.
- Their tests.

### 16. `docs`: the design describes one way to escalate

- `workflow_states.md`: `:137` ("may still await manual routing"), `:168` and `:182` describe the item-level
  Return's per-author release. Rewrite them for the dispute Return.
- `api_surfaces.md`, `db_schema_blueprint.md`: whatever 10, 11 and 14 left.
- ADR 013 (four mentions), and a dated note on ADR 010, 011, 013 and 014 that the flow was retired (#102).
- Root README: the reset paragraph also names the dropped table.
- `docs/handover/ticket-map.md`: SCRUM-134's title.
- `apps/hej-api/evaluation/README.md:136`, `:141`: "an old escalation routed" (found while building 8).
- Found while building 10: `api_surfaces.md` ~`:1209` ("A legacy open escalation … still holds the whole
  item") and ~`:1066` ("or escalation" in the export source list); the header comment of
  `apps/hej-web/lib/api/review-actions.ts` ("escalation routing"); `test_project_disputes.py` docstrings that name
  the retired routes.
- `apps/hej-web/app/tasks/[taskId]/dispute/page.tsx:4`: its comment says the desk "lists open escalations from the
  backend"; it reads the annotation disputes (found while building 15).

## Verification by Claude, per commit

1. Read the whole diff against the commit's section, and check that every removed test is in the message's
   "tested only the legacy flow" list.
2. Rerun the commit's test files, then the full backend suite on SQLite (`uv run pytest -q -n auto`) and the casebook
   (`uv run python -m evaluation run --baseline evaluation/baseline.json --exact`); `test:web`, `typecheck:web` and
   `lint:web` when the web changes.
3. `git grep` for the commit's removed names finds nothing outside the ADR notes.
4. Commit with the message file.

**At the end:** a fresh `init_data.py --reset` on SQLite and the probe again, and the PostgreSQL suite once (the
table drop is a schema change). Then the PR title and description, and the Jira text.

## Done when

`git grep` for `TaskItemEscalationDB`, `task_item_escalations`, `route_escalation`, `decide_escalation`,
`escalation_decided`, `escalation_routed`, `current_expert_return_at`, `legacy_approved_by`,
`migrate_legacy_task_statuses` and `LEGACY_REVIEW_MUTATION` finds only ADR notes and the `reset_db` drop. The
backend suite passes on SQLite and PostgreSQL, the casebook passes unchanged, the web checks pass, and the seed
probe is all zeros.

## After the commits

- **PR title:** `refactor(api,web): retire the legacy item escalations and the states they left (SCRUM-134)`.
- **PR description:** rewritten from the scratch draft, with the decisions above.
- **Reply to Jingwei:** the four points are in `c79f3088`; point 3's branch is deleted by commit 7.
- **Jira:** SCRUM-134's summary and description widen; suggested 3 points instead of 1.
