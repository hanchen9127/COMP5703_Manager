# HEJ Fix-Plan Verification Summary

**Scope:** every defect claim in `issues.md` and every technical write-up in `fix-plan.md`, checked against the `hej/` codebase.
**Date:** 2026-08-27
**Method:** static reading of the cited code + independent runtime reproduction (test suites, seeded throwaway SQLite databases, direct route invocation, FastAPI route introspection).
**Codebase changes:** none. All reproduction ran against temp databases via `DATABASE_URL`; `hej_dev.db` and all source files are untouched.

---

## Verdict

**Every defect in `issues.md` is real — 24 of 24 confirmed.** Nothing was overstated in the impact table, and several claims that read as estimates turned out to be exact (the "13 of 15 tables" figure, the "1 failed / 99 passed" frontend count, the "four typecheck errors").

**Every root-cause diagnosis in `fix-plan.md` items 1–23 is correct**, and each proposed fix addresses the actual cause rather than a symptom. Nine minor factual corrections are listed in §3 — all are citation/attribution slips that do not change any diagnosis or invalidate any fix.

**Five defects were missing from both documents** (§4) — four functional bugs plus one low-severity misleading-code issue. One of them, an unreachable `GET /organizations` route, compounds the already-Critical invitation breakage. **All five have since been added** to `issues.md` (impact table + priority order) and `fix-plan.md` (items 24–28 + execution order).

---

## 1. `issues.md` — row-by-row

| # | Claim | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Finalized/canonicalized annotation can be silently overwritten | **TRUE** | `draft_service.py:104` guards only `draft.status`; `_create_annotation_from_draft` (146–184) updates in place; `drafts.py` route guards check org/project scope only |
| 2 | Drafts have no ownership enforcement | **TRUE** | `resource_scope.py:48–62` never compares `draft.created_by`; no `created_by` check anywhere in `drafts.py` or `draft_service.py` |
| 3 | Annotators can approve their own work | **TRUE** | `review_actions.py:193–203` calls only `verify_user_is_active` + `verify_user_task_access` (tenancy-only); `verify_user_has_role` exists at `permissions.py:215` and has **zero** callers |
| 4 | Reviewer corrections aren't saved | **TRUE** | `review_actions.py:234–237` appends `final_payload`/`final_verdict` to `review_notes` truncated at 500 chars; `annotation.annotation_data` is never reassigned |
| 5 | Legacy review API can rewrite approval history | **TRUE** | `annotations.py` `update_review` (319) / `delete_review` (426) mutate `ReviewDB` under a tenancy-only guard and never touch `TaskItemDB.status` |
| 6 | A finalized item can export more than one conflicting answer | **TRUE — reproduced** | Seeded DB, items forced to `canonicalized`, `format=normalized_json`: **5 of 5 items exported 2 annotations each**, both `is_latest=True`, both `version=1`, no canonical marker |
| 7 | Cross-project/cross-org write bypass in the task API | **TRUE** | Route introspection confirms `PUT /projects/{project_id}/tasks/{task_id}` is registered twice; `projects.py` wins, `tasks.py`'s correctly-guarded version is dead. `update_task_item` never checks `task_item.task_id == task_id`. *(See correction C1 on DELETE.)* |
| 8 | Invalid task status values get saved to the database | **TRUE — reproduced** | Called `update_task_item` with `status="not_a_real_status"`: route raised `ValidationError`, and the SQLite row **still reads `not_a_real_status`** |
| 9 | Organization invitations are completely broken | **TRUE** | `admin_service.py:374–377` persists `ACTIVE` + `accepted_at` while returning `"status": "invited"`; `members.py:207–216` decodes with the generic `decode_token` and reads `sub`, a claim `create_invitation_token` never sets → the 403 fires on every attempt |
| 10 | Completion and export readiness disagree on "done" | **TRUE** | `FINALIZED_EXPORTABLE_TASK_ITEM_STATUSES` includes `reviewed`; `project_exports_service.py:59` maps `completed→ready` while `completed_item_count` counts `canonicalized` only |
| 11 | AI failures produce fake annotations | **TRUE** | `gemini_preannotator.py:44–45`/`54–55` route both disabled and error paths to `_empty_result` (232–259), which returns two hardcoded boxes; `_ensure_min_image_boxes` (272–293) pads real results with the same fakes; stored as an ordinary `pending` draft |
| 12 | Draft submission non-atomic; drafts don't link to their annotation | **TRUE** | Three independently-committing repo calls in `submit_draft`; `DraftDB.annotation_id` (`db_models.py:255`) is read at `draft_service.py:206` and **never written anywhere in `app/`** |
| 13 | Frontend fails typecheck | **TRUE — reproduced** | `npm run typecheck:web` → exactly **4 errors**: 3× `signalLabel` union mismatch + `judgementSignal` does not exist on `MockTaskItem` |
| 14 | Frontend test suite has a failing test | **TRUE — reproduced** | `vitest run` → **1 failed / 99 passed**, at `task-item-workspace-sheet.test.tsx:314` |
| 15 | Backend export tests fail to even run | **TRUE — reproduced** | `pytest -q` aborts collection: `ImportError: cannot import name '_is_task_export_eligible'` |
| 16 | Dispute "send back to annotator" isn't implemented | **TRUE** | Placeholder toasts at `task-dispute-desk.tsx:93–96` and `214–219`; backend `decide_escalation` fully implements it (`review_actions.py:430–432`, `447–448`) |
| 17 | Dataset registration isn't transactional | **TRUE** | Every repo call in `register_dataset` goes through `_commit_or_rollback`; `TaskHistoryRecorder.record` → `AuditLogService` also commits (`audit_log_service.py:63`); `get_db` never rolls back |
| 18 | `init_data.py --reset` is broken two ways | **TRUE — both reproduced exactly** | (a) With `PYTHONIOENCODING=gbk`: `UnicodeEncodeError: 'gbk' codec can't encode character '⚠'` at line 923, **and the handler at line 981 then crashes on `❌`**, masking the original error. (b) Second `--reset`: `IntegrityError: FOREIGN KEY constraint failed [SQL: DROP TABLE IF EXISTS data_pointers]`, leaving **exactly 13 of 15 tables** — `annotations` and `audit_logs` gone |
| 19 | Reviewers can get shown the wrong annotator's work | **TRUE — reproduced** | `_latest_annotation` filters `task_item_id` + `is_latest` only; `version` is hardcoded to `1` (`draft_service.py:177`). Seeded DB: **all 10 annotated items have 2 rows with `is_latest=1` and identical `version=1`** — the tiebreak resolves nothing |
| 20 | Audit log always shows "user" as the actor | **TRUE** | `task_audit_log_query.py:253–259`: `actor_kind` initialised to `"user"` and never set to `"system"`; schema (`Literal["user","system"]`) and frontend (`task-history-board.tsx:176`) both already support the correct value |
| 21 | Escalation audit entries duplicate their summary | **TRUE — reproduced** | `pytest` → the suite's single failure is `test_list_for_task_attaches_external_item_ref_label`: `assert [HistoryChangeRead(field='target', ...)] == []` |
| 22 | Backend `.env` config is silently broken | **TRUE — reproduced** | `.env.example` uses `DAP_*`; `Settings` expects `HEJ_*`. With `HEJ_PORT=9111` in a `.env` in cwd: `Settings().port == 8000`; `Settings(_env_file=".env").port == 9111` — proving the file is never read |
| 23 | A frontend test doesn't test what its name claims | **TRUE** | The bbox-hydration test's only assertion is `"Image annotation workspace"`, returned by `getMediaWorkspaceLabel` (line 3194) purely from `taskType === "image"` — independent of hydration |
| 24 | A backend test has misleading setup code | **TRUE** | `test_admin_iam_service.py:110–115` wires `db.query` stubs; `create_user_for_org` never calls `db.query` |

The executive status ("Red"), the release-risk section, and the priority ordering all follow correctly from the confirmed findings.

---

## 2. `fix-plan.md` — item-by-item

All 23 items: **root cause correct, fix appropriate.**

| Item | Diagnosis | Fix soundness |
| --- | --- | --- |
| 1a `TaskItemTable` union | Correct — union at :54–63, runtime fallback at :197 already handles the absent case; no call site passes `getSignal` | Sound. Widening the type is right; no call-site change needed |
| 1b `judgementSignal` | Correct — the local `judgementSignal` const (:997) sits one line below the broken read (:1496) and is used correctly at :1498 | Sound. Correctly rejects "add the field to `MockTaskItem`" as masking a copy-paste error |
| 2 Frontend test drift | Correct — `itemStatus` is a real field consumed by `shouldForceCreatePendingDraft` and covered by `task-items.test.ts:114,149` | Sound. Test-only change is the right call |
| 3 Export-route tests | Correct — helper genuinely absent, route unfiltered | Sound. The proposed implementation satisfies all four tests, including the string-comparison case; `TaskService` is already imported in `projects.py` |
| 4 Dispute send-back | Correct, including the "backend already works" correction | Sound. *(See correction C7 — step 2 is already done.)* |
| 5 Dataset transaction | Correct, including the suspicion that `TaskHistoryRecorder` commits internally (it does) | Sound. `commit=False` + `flush()` on the three specific repo methods avoids touching the other call sites |
| 6 Audit actor | Correct | Sound. Pure logic fix; schema and frontend already support `"system"` |
| 7 Escalation duplicate change | Correct, including the grep result that `"target"` appears in `new_values` only for `escalation_routed` | Sound, and directly turns the suite green |
| 8 `.env` config | Correct — both bugs independently confirmed | Sound. Both halves genuinely required. No docs reference `DAP_*`, so step 3 is a no-op |
| 9 Vacuous hydration test | Correct; the two sibling tests are exactly the model described | Sound, including the "break hydration and confirm it fails" verification |
| 10 Misleading mock | Correct | Sound. *(See correction C8.)* |
| 11a Windows encoding | Correct, including the compounding handler crash | Sound. `sys.stdout.reconfigure` fixes every print in one place |
| 11b FK-on-drop | Correct, including the partial-schema corruption | Sound. `reset_db()` / `Base.metadata.drop_all` topologically sorts and is already available |
| 12 Ambiguous latest annotation | Correct — invariant, both broken consumers, useless `version` tiebreak, and the export reach-through all verified | Sound. Correctly frames it as a design decision, not a mechanical patch |
| 13 Finalized overwrite | Correct | Sound. `TERMINAL_TASK_ITEM_STATUSES` already exists to reuse |
| 14 Draft ownership | Correct | Sound, including keeping reviewer *read* access unaffected |
| 15 Role/self-review guard | Correct — `verify_user_has_role` is dead code; `review_dual_sign_off` is a real, resolved policy flag | Sound |
| 16 Reviewer corrections | Correct | Sound. Correctly ties versioning to item 12's decision |
| 17 Legacy review API | Correct | Sound. Append-only guidance matches `db_schema_strategy.md`'s stated provenance requirement |
| 18 Cross-project bypass | Correct on shadowing and on both missing checks | Sound. *(See correction C1.)* The route-introspection regression test is worth adding — it catches a second duplicate too (§4) |
| 19 Invalid status | Correct | Sound. *(See correction C2 on where validation fires.)* |
| 20 Invitations | Correct on both bugs | Sound, including idempotent acceptance |
| 21 Completion vs export | Correct | Sound. Correctly flags the shared-predicate decision as a product question |
| 22 AI fabrication | Correct | Sound. Structured provenance is the right shape |
| 23 Draft atomicity + dead FK | Correct on both halves | Sound, and correctly identified as the same root cause as item 12 |

The "Suggested execution order & grouping" section is coherent: the PR A cluster (12/13/16/23) genuinely shares one unresolved model question, and the stated dependencies hold.

---

## 3. Corrections needed

None of these change a diagnosis or invalidate a fix. Listed most substantive first.

**C1 — Item 18: there is no duplicate DELETE route.** The plan says both files register `PUT` "(and the DELETE equivalent)". Route introspection finds exactly one duplicate method+path pair for tasks: `PUT /projects/{project_id}/tasks/{task_id}`. `tasks.py` registers no DELETE at all — `project_tasks_router` has only that PUT and `POST .../complete`. The DELETE gap is real (`projects.py`'s `delete_task` has no `task.project_id` check), but it is a plain missing check, not a shadowing problem, and fix step 1 ("remove the duplicate") does not apply to it. Step 2 must be applied to DELETE explicitly.

**C2 — Item 19: validation fires earlier than stated.** The plan says the invalid status is caught "when FastAPI serializes the response against `TaskItemRead`". Reproduction shows the `ValidationError` is raised for the domain model `TaskItem` (`app/models/domain.py`) during the repository's `_to_model` conversion, before response serialization. The load-bearing claim — that the row is committed first — is exactly right, and the fix is unaffected.

**C3 — Item 12: wrong document cited for dual sign-off.** `docs/design/database/db_schema_strategy.md` does not mention dual sign-off. That policy is documented in `docs/design/processes/admin/2-organisation-management.md:92` and `docs/implementation/prs/project-portfolio/project-governance-model.pr.md:69,76`. (Item 17's citation of the same file for append-only provenance *is* correct.)

**C4 — Items 13/14: `submit_draft` uses a different guard than stated.** Both items say `submit_draft` is guarded "via `verify_user_task_item_access` directly". It actually calls `verify_user_draft_access` (`drafts.py:228`). Since that function delegates to `verify_user_task_item_access` and adds no ownership check, both conclusions stand unchanged.

**C5 — Item 5: `_commit_or_rollback` has 36 call sites, not "~40+".** Immaterial to the fix, but the figure is quoted as evidence for not touching them all.

**C6 — Item 7: `"target"` is at line 66, not line 68.** All other line references in that item are exact.

**C7 — Item 4, step 2 is already complete.** The plan asks to check whether `status-mapping.ts` needs an `expert_send_back` label. It already has it (`status-mapping.ts:31,59`), with passing tests at `status-mapping.test.ts:9–16`. Only the two placeholder blocks need replacing.

**C8 — Item 10: the "mocks actually exercised" list is incomplete.** `create_user_for_org` also uses `store.organizations.get` and `db.refresh`, beyond the `store.users` / `db.add` / `flush` / `commit` the plan lists. Deleting only `query_map`/`_set_query_map` is still the correct action.

**C9 — Item 6: while touching that line, tighten the falsy-`operator_id` test.** The proposed fix preserves `elif log.operator_id:`, so an `operator_id` of `0` would still be labelled `"System"`. Inherited rather than introduced, but `is not None` costs nothing here.

---

## 4. Defects the original documents missed — now added

Five findings, not three: the first pass of this summary promoted three to headline status and demoted two to "smaller observations," which understated the count. Four are functional bugs; the fifth (the impossible `"approved"` status) is misleading code with no behavioural impact, and fits the Low tier `issues.md` already uses for exactly that category.

All five are now in both documents — `issues.md` impact table and priority order, `fix-plan.md` items 24–28 with technical write-ups.

| Finding | Severity | Now tracked as |
| --- | --- | --- |
| G1 Duplicate `GET /organizations` hides pending-invitation listing | High | fix-plan item 24 |
| G3 Task can never leave `draft` | High | fix-plan item 25 |
| G2 Dataset-intake `409` returned as `500` | Medium | fix-plan item 26 |
| G4 Live API key committed in `config.py` | Medium | fix-plan item 27 |
| G5 `"approved"` is not a valid `TaskItemStatus` | Low | fix-plan item 28 |


**G1 — `GET /organizations` is registered twice; "list pending invitations" is unreachable.** `organizations.list_organizations` and `members.list_pending_invitations` both resolve to `GET /organizations` (`members.router` is mounted under the `/organizations` prefix with a `GET ""` route). `organizations.router` is included first, so `list_pending_invitations` is dead code and **cannot be called at all**. This compounds the Critical invitation defect: a user cannot list their pending invitations *and* cannot accept one. Item 18's proposed route-introspection test would catch this — it is the second duplicate that test would report.

**G2 — Lifecycle conflicts during dataset registration surface as HTTP 500.** `register_dataset` (`tasks.py:264–296`) wraps the service call in `except Exception` and re-raises everything as a 500 — including the deliberate `HTTPException(409)` from `assert_task_allows_dataset_intake`. Callers cannot distinguish an invalid state transition from an infrastructure failure. **Reproduced:** registering items into a `completed` task returns `500: Failed to register dataset: 409: Dataset intake is only allowed while the task is in draft or ready status.` — the correct code and message, nested inside a server-error envelope. (Matches `external_report2.md` FL-12, which did not make it into `issues.md`.)

**G3 — Tasks can never leave `draft` except by completing.** `TaskUpdate` (`schemas/tasks.py:61–71`) has no `status` field and there is no activation endpoint; the only writer of `task.status` is `complete_task`. Consequences: `assert_task_allows_dataset_intake` (`draft`/`ready`) leaves intake open for a task's entire life, and the `ready`/`in_review`/`disputed` branches of `_TASK_STATUS_TO_EXPORT` are unreachable through the API. (Matches `external_report2.md` FL-07.)

**G4 — A live Gemini API key is a committed field default.** `app/core/config.py:15` hardcodes the key, and `git ls-files` confirms the file is tracked — so it is in every clone and fork. This compounds item 8: because `Settings` reads no `.env` file, the baked-in key is what the app actually authenticates with unless someone exports `HEJ_GEMINI_API_KEY` in the process environment. Rotation is the step that closes the exposure and does not depend on any code change.

**G5 — `FINALIZED_EXPORTABLE_TASK_ITEM_STATUSES` includes `"approved"`, which is not a `TaskItemStatus` member.** The set behaves as `{"reviewed", "canonicalized"}`, so item 21's conclusion is unchanged and there is no behavioural bug — but a reader auditing export eligibility concludes an `approved` state exists and goes looking for the transition that produces it. Remove it while item 21 replaces that list with a shared predicate.

---

## Appendix: reproduction commands

```bash
# Frontend (from hej/)
npm run typecheck:web                     # 4 errors
npm run test --workspace hej-web          # 1 failed / 99 passed

# Backend (from hej/apps/hej-api/)
uv run pytest -q                                               # collection error
uv run pytest -q --ignore=tests/test_project_exports_route.py   # 1 failed / 118 passed

# init_data.py, against a throwaway DB (never the dev DB)
DATABASE_URL="sqlite:///$TMP/t.db" PYTHONUTF8=1 uv run python init_data.py --reset   # ok
DATABASE_URL="sqlite:///$TMP/t.db" PYTHONUTF8=1 uv run python init_data.py --reset   # FK error, 13/15 tables
DATABASE_URL="sqlite:///$TMP/u.db" PYTHONIOENCODING=gbk uv run python init_data.py --reset  # UnicodeEncodeError x2

# Route duplicates
uv run python -c "from app.api.router import api_router; ..."   # 2 duplicate method+path pairs
```

Invalid-status persistence, export duplication, `.env` loading, and the two-annotator seed state were verified with short throwaway scripts run from `apps/hej-api/` against temp databases; none wrote to `hej_dev.db` or modified source.
