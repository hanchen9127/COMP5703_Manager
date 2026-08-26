# HEJ Fix Plan

Technical plan for each issue in `issues.md`. Ordered by the priority list there.

---

## 1. Frontend typecheck blockers

Two independent type errors, both in `apps/hej-web`.

### 1a. `TaskItemTable` signal prop mismatch

`components/task-item-table.tsx:54-64` defines the signal props as a discriminated union that requires `getSignal` whenever `signalLabel` is set:

```ts
type TaskItemTableSignalProps =
  | { signalLabel: string; getSignal: (item: MockTaskItem) => string }
  | { signalLabel?: undefined; getSignal?: undefined }
```

But every call site (`task-workbench.tsx:256`, `task-items-board.tsx:158`, `task-annotation-workspace.tsx:286`) only passes `signalLabel={isAiAssisted ? "Confidence" : undefined}` and relies on the component's existing fallback (`getSignal ? getSignal(item) : item.confidence`, line 197). No caller passes `getSignal`.

**Fix:** drop the union, make both props independently optional:

```ts
type TaskItemTableSignalProps = {
  signalLabel?: string
  getSignal?: (item: MockTaskItem) => string
}
```

No call-site changes needed — the runtime fallback already handles the `getSignal`-absent case correctly; only the type was wrong.

### 1b. Missing `judgementSignal` on `MockTaskItem`

`components/task-item-workspace-sheet.tsx:1496` reads `item.judgementSignal`, a property that doesn't exist on `MockTaskItem` (`lib/domain/task-types.ts:32-61`).

This isn't a missing field — it's referencing the wrong thing. The file already has the correct value computed two ways:
- `getJudgementSignalValue(item)` (`lib/task-format.ts:54-56`) → `item.candidateConfidence ?? item.confidence`
- the local `judgementSignal` const destructured at line 997 from `getJudgementDisplayData(item)`, which calls that same helper.

Line 1498 (`isJudgement ? judgementSignal : item.confidence`) already uses the local variable correctly right next to the broken line.

**Fix:** replace `item.judgementSignal ?? item.confidence` at line 1496 with the local `judgementSignal` variable (or `getJudgementSignalValue(item)` directly) — don't add a new field to `MockTaskItem`, that would just mask the copy-paste error with a wider type.

**Verify:** `npm run typecheck:web` passes clean.

---

## 2. Frontend test failure (`task-item-workspace-sheet.test.tsx`)

`components/task-item-workspace-sheet.tsx:1204-1208` now includes `itemStatus: item.status` in the `AnnotateActionPayload` sent to `runAnnotateAction`:

```ts
const payload: AnnotateActionPayload = {
  taskId: task.id,
  itemId: item.id,
  action,
  itemStatus: item.status,   // added for downstream forceCreatePending logic
  result: ...,
}
```

This is consumed by `shouldForceCreatePendingDraft(payload.itemStatus)` in `lib/api/task-items.ts:234`, and is exercised correctly by `lib/api/task-items.test.ts:114,149`. It's a real, intentional field — the test in `task-item-workspace-sheet.test.tsx:314-323` ("sends raw annotation output when saving a fallback image draft") just wasn't updated when the field was added, so its `toHaveBeenCalledWith(...)` expectation is missing `itemStatus`.

**Fix:** add `itemStatus: fallbackImageItem.status` to the expected payload object in that test. No production code change.

**Verify:** `npm run test --workspace hej-web` passes clean (currently 1 failed / 99 passed).

---

## 3. Backend export-route tests fail to collect

`tests/test_project_exports_route.py:11` imports `_is_task_export_eligible` from `app/api/routes/projects.py`, which doesn't exist — the route (`projects.py:115-126`) currently returns `ProjectExportsService(db=db).list_project_exports(project_id)` unfiltered, with no task-status gating at all. This is a missing feature, not a rename.

The test file fully specifies the expected contract:
- `_is_task_export_eligible(task) -> bool`: `True` iff `task.status == "completed"` (false for `draft`, `ready`, `in_review`, `disputed`).
- `list_project_exports` must fetch tasks via `TaskService(db=db).list_tasks(project_id)`, compute the eligible task-id set, and filter the exports service's results to only those whose `task_id` matches an eligible task — comparing as strings, since task ids and export `task_id` may differ in type (`test_matches_export_task_ids_as_strings`).
- Export `.status` (e.g. `"building"` vs `"ready"`) is **not** part of the eligibility check in these tests — only the task's status gates visibility.

**Fix** (`app/api/routes/projects.py`):

```python
def _is_task_export_eligible(task) -> bool:
    return getattr(task, "status", None) == "completed"


@router.get("/{project_id}/exports", response_model=list[ExportPackageRead])
def list_project_exports(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ExportPackageRead]:
    """List current project export packages, restricted to completed tasks."""
    verify_user_is_active(current_user)
    project_service = ProjectService(db=db)
    project = project_service.get_project(project_id)
    verify_user_project_access(current_user, project, db)

    tasks = TaskService(db=db).list_tasks(project_id)
    eligible_task_ids = {str(task.id) for task in tasks if _is_task_export_eligible(task)}

    exports = ProjectExportsService(db=db).list_project_exports(project_id)
    return [export for export in exports if str(export.task_id) in eligible_task_ids]
```

**Verify:** `uv run pytest tests/test_project_exports_route.py -q` collects and passes; then full `uv run pytest -q`.

---

## 4. Dispute send-back not wired

`components/task-dispute-desk.tsx` has the full UI (decision selector including `"send_back"` at line 227, decision type at line 40) but short-circuits with a placeholder toast at lines 93-96 and 214-219: *"Send back to annotator is not wired yet."*

**Correction from initial triage:** this is frontend-only. The backend already fully implements `send_back` — `app/api/routes/review_actions.py`'s `decide_escalation` (`POST /tasks/{task_id}/task-items/{task_item_id}/escalations/decision`) maps `decision == "send_back"` to `TaskItemStatus.EXPERT_SEND_BACK` (lines 430-432), calls `ensure_expert_send_back_status` (line 447-448), and records the audit entry — confirmed by `test_review_actions.py::EscalationDecisionStatusTests`, which already passes. The frontend even has a ready-made client function for it: `decideTaskItemEscalation(taskId, itemId, body)` in `lib/api/review-actions.ts:157-170`, posting to that exact endpoint with `{decision, note, payload_preview}`. Nothing needs to change on the backend.

**Plan:**
1. In `task-dispute-desk.tsx`, replace the two placeholder blocks (lines 93-96, 214-219) with a real call to `decideTaskItemEscalation(taskId, itemId, { decision: "send_back", ... })` — the same pattern the `finalize` branch immediately above them already uses.
2. Confirm the item's displayed/mapped status after a successful send-back reflects `expert_send_back` (`lib/task-workspace-data.ts:106` already models this status) — check `lib/api/status-mapping.ts`/`status-mapping.test.ts` for whether it needs a UI-facing label mapping added.

**Verify:** manual pass through the dispute desk (send an item back, confirm it reappears in the annotator's queue with status `expert_send_back`/"Sent back") + a new component test for the send-back path in `task-dispute-desk`'s test file (create one if it doesn't exist).

---

## 5. Dataset registration isn't transactional

`TaskService.register_dataset` (`app/services/task_service.py:403-509`) loops over `payload.items` and, for the DB-backed path, calls:
- `self.db_pointer_repo.save(pointer)` per item
- `self.db_item_repo.save_many(task_items)` once
- `self.db_draft_repo.create(...)` per item (optionally after an external `GeminiPreannotator.generate_for_item()` call)
- `TaskHistoryRecorder.record(...)` once at the end

Every one of those repo calls independently calls `_commit_or_rollback(self.db)` (`app/repositories/db_store.py:19-24`, used at ~40+ call sites across `db_store.py`). So each pointer/item/draft is committed to the DB the moment it's created. If the preannotator throws (external AI call) or any later item fails, earlier items/pointers/drafts are already permanently committed — there's no request-level rollback either: `get_db` (`app/core/database.py:46-55`) only does `db.close()` in `finally`, never `db.rollback()`.

**Fix approach — make `register_dataset` a single transaction without touching the ~40 other call sites:**

1. Add an optional `commit: bool = True` parameter to the specific repo methods `register_dataset` calls: `DataPointerRepository.save`/`.create`, `TaskItemRepository.save_many`, `DraftRepository.create` (`db_store.py:825`, `913`, `1073`). When `commit=False`, call `self.db.flush()` instead of `_commit_or_rollback(self.db)` (flush pushes SQL to the DB/assigns PKs without ending the transaction, so `self.db.refresh(...)` still works).
2. In `register_dataset`'s DB branch, pass `commit=False` through every repo call in the loop (pointer save, item save_many, draft create) and through `TaskHistoryRecorder.record` if that also commits internally — check `task_history_recorder.py` and give it the same `commit` toggle if needed.
3. Wrap the whole DB branch in try/except:
   ```python
   try:
       ...existing loop + audit record, all with commit=False...
       self.db.commit()
   except Exception:
       self.db.rollback()
       raise
   ```
4. Leave the in-memory-store branch (`else:`) untouched — it has no transactional concept.

**Verify:** add a test that forces `GeminiPreannotator.generate_for_item` to raise partway through a multi-item payload, then asserts zero `DataPointerDB`/`TaskItemDB`/`DraftDB` rows exist for that task afterward (currently they'd be partially present).

---

## 6. Audit log actor always "user"

`app/services/task_audit_log_query.py:253-259`:

```python
user = users_by_id.get(log.operator_id)
display_name = "System"
actor_kind: str = "user"          # <- always "user", even when there's no operator
if user:
    display_name = (user.name or user.email or f"User {log.operator_id}").strip()
elif log.operator_id:
    display_name = f"User {log.operator_id}"
```

The schema already supports the correct value — `HistoryActorRead.kind: Literal["user", "system"]` (`app/schemas/task_history.py:22`) — and the frontend already branches on it (`task-history-board.tsx:176`, rendering a `ShieldCheck` icon for `"system"`). This is a pure logic bug, no schema or frontend change needed.

**Fix:**

```python
if user:
    display_name = (user.name or user.email or f"User {log.operator_id}").strip()
    actor_kind = "user"
elif log.operator_id:
    display_name = f"User {log.operator_id}"
    actor_kind = "user"
else:
    display_name = "System"
    actor_kind = "system"
```

**Verify:** add a unit test in `test_task_audit_log_query.py` for a log row with `operator_id=None`, asserting `logs[0].actor.kind == "system"`.

---

## 7. Escalation audit entries duplicate their summary

`_summary_for_log` (`task_audit_log_query.py:150-152`) already renders `"Escalation routed to {target}"` for `escalation_routed` events. But `_build_changes` (line 129-145) also emits a `changes` entry for the same `target` key, because `"target"` is in `_USER_VISIBLE_CHANGE_FIELDS` (line 68) and `escalation_routed` is not in `_OPERATIONS_WITHOUT_CHANGES` (line 61, currently only `DATA_INTAKE_OPERATIONS`). Grep confirms `"target"` is set in `new_values` only for `escalation_routed` (no other operation uses it), so removing it from the visible-fields set can't hide a "target" diff anyone else relies on.

**Fix:** remove `"target"` from `_USER_VISIBLE_CHANGE_FIELDS` (line 63-74) in `task_audit_log_query.py`. Since `escalation_routed`'s only meaningful field is `target`, this makes `_build_changes` return `[]` for it — matching the summary line and eliminating the duplicate.

**Verify:** `uv run pytest tests/test_task_audit_log_query.py::test_list_for_task_attaches_external_item_ref_label -q` — this test already asserts `response.logs[0].changes == []` for an `escalation_routed` log and is currently the one failing test in the suite.

---

## 8. Backend `.env` config is silently broken

Two independent bugs compound each other in `apps/hej-api`:

**a. Wrong variable prefix.** `app/core/config.py:19-22`:

```python
model_config = SettingsConfigDict(
    env_prefix="HEJ_",
    case_sensitive=False,
)
```

`Settings` only recognizes `HEJ_*`-prefixed env vars (`HEJ_ENVIRONMENT`, `HEJ_HOST`, `HEJ_PORT`, `HEJ_RELOAD`, `HEJ_API_PREFIX`, `HEJ_API_VERSION`, mapping to the `environment`/`host`/`port`/`reload`/`api_prefix`/`api_version` fields). But `.env.example` uses a stale `DAP_*` prefix:

```
DAP_ENVIRONMENT=development
DAP_HOST=0.0.0.0
DAP_PORT=8000
DAP_RELOAD=true
DAP_API_PREFIX=/api
DAP_API_VERSION=v1
```

None of these match `HEJ_*`, so pydantic-settings ignores every one of them and every field silently falls back to its hardcoded default.

**b. `.env` is never read regardless of prefix.** `SettingsConfigDict` above never sets `env_file`, so even a correctly-prefixed `.env` in the working directory would not be loaded at all — pydantic-settings only reads process environment variables in that configuration, never a dotenv file.

Both bugs matter independently: fixing (a) without (b) still does nothing (no `.env` is ever read); fixing (b) without (a) loads a file whose vars don't match anything.

This is also load-bearing beyond `HEJ_HOST`/`HEJ_PORT`/`HEJ_RELOAD` cosmetics — `main.py:8-13` passes `settings.host`, `settings.port`, `settings.reload` straight into `uvicorn.run(...)`, so the dev server's bind address/port/autoreload are silently un-configurable via `.env` today.

**Fix:**

1. In `app/core/config.py`, add `env_file` (and encoding) to the config dict:
   ```python
   model_config = SettingsConfigDict(
       env_prefix="HEJ_",
       case_sensitive=False,
       env_file=".env",
       env_file_encoding="utf-8",
   )
   ```
2. Rename every variable in `apps/hej-api/.env.example` to the `HEJ_` prefix:
   ```
   HEJ_ENVIRONMENT=development
   HEJ_HOST=0.0.0.0
   HEJ_PORT=8000
   HEJ_RELOAD=true
   HEJ_API_PREFIX=/api
   HEJ_API_VERSION=v1
   ```
3. Check whether any onboarding doc (`README.md`, `docs/fe-be-local-integration-runbook.md`) references the old `DAP_*` names and update those too.

**Verify:** `cp .env.example .env`, change one value (e.g. `HEJ_PORT=8001`), run `uv run python main.py`, confirm the server binds to the overridden port instead of the hardcoded default — or more simply, assert in a test that `Settings(_env_file=".env")` picks up an overridden value from a temp `.env` file.

---

## 9. Vacuous frontend test: image-bbox hydration

`apps/hej-web/components/task-item-workspace-sheet.test.tsx:609-622`, inside `describe("TaskItemWorkspaceSheet structured image bbox payloads")`:

```ts
it("hydrates image bbox annotator from draftPayloadText boxes", () => {
  render(
    <TaskItemWorkspaceSheet
      task={imageTask}
      item={hydratedImageItem}
      activity={[]}
      open={true}
      initialTab="annotate"
      onOpenChange={vi.fn()}
    />,
  )

  expect(screen.getByText("Image annotation workspace")).toBeInTheDocument()
})
```

The name claims to verify that `draftPayloadText`'s `boxes` array gets hydrated into the bbox annotator. The only assertion checks for the text `"Image annotation workspace"` — that's the static tab heading returned by `getMediaWorkspaceLabel(taskType)` whenever `task.taskType === "image"`; it renders regardless of whether hydration ran, ran correctly, or silently discarded the box data. The test passes today and would keep passing if hydration were completely broken.

Its two siblings in the same file don't have this problem and are the model to follow:
- `"hydrates text span annotator from draftPayloadText text_spans"` asserts the hydrated label (`"evidence"`) and note (`"Existing span"`) actually render.
- `"hydrates audio segment annotator from draftPayloadText segments"` asserts multiple hydrated field values via `getByDisplayValue` (`"1.25"`, `"4.5"`, `"claim"`, `"Existing transcript"`, `"Existing segment note"`).

**Fix:** add real assertions for the hydrated box data — at minimum the label (`"vehicle"`, per `hydratedImageItem`'s fixture) and the coordinate/size fields, using `getByDisplayValue` the same way the audio-segment test does.

**Verify:** temporarily break bbox hydration in the component (e.g. skip populating box state from `draftPayloadText`) and confirm the strengthened test now fails — that's the check that it was vacuous before and isn't after.

---

## 10. Misleading mock setup in a backend admin-IAM test

`apps/hej-api/tests/test_admin_iam_service.py::test_org_admin_can_create_user_in_own_org` (~lines 110-115) builds a `query_map` wiring `db.query(...)` stubs for `UserDB`, `OrganizationUserDB`, and `RoleAssignmentDB`, then installs it via `self._set_query_map(...)` before calling `create_user_for_org`.

`create_user_for_org`'s actual implementation never calls `db.query(...)` at all — it only goes through `store.users.get_by_email`, `db.add`, `db.flush`, and `db.commit`. The `query_map` setup is dead code from the test's perspective: it doesn't drive any behavior the assertions depend on, but its presence tells a reader the service does DB `.query()` lookups as part of user creation, which isn't true. This isn't a false-pass risk (removing it wouldn't change the test's outcome), but it's actively misleading to anyone using this test to understand `create_user_for_org`'s real code path.

**Fix:** delete the unused `query_map`/`_set_query_map(...)` setup from this test, leaving only the mocks that `create_user_for_org` actually exercises (`store.users`, `db.add`/`flush`/`commit`).

**Verify:** run `uv run pytest tests/test_admin_iam_service.py -q` after removing the dead setup — it should still pass unchanged, confirming the removed code was never load-bearing.

---

## Suggested execution order & grouping

1. **PR 1 — frontend build health:** items 1 + 2 (typecheck fixes + test expectation update). Small, isolated, unblocks CI immediately.
2. **PR 2 — backend audit log correctness:** items 6 + 7 together (same file, same test file, low risk).
3. **PR 3 — export governance:** item 3 (new helper + filter, backed by the existing test file).
4. **PR 4 — dispute send-back:** item 4 (frontend-only wiring to an existing backend endpoint — smaller than initially scoped).
5. **PR 5 — dataset registration transaction:** item 5 (touches shared repo methods — review carefully, add the regression test described above before merging).
6. **PR 6 — `.env` config fix:** item 8. Trivial, zero risk, can land any time — bundle with PR 1 if convenient.
7. **PR 7 — test-quality fixes:** items 9 + 10. Trivial, zero risk, test-only changes. Item 9 touches the same file as PR 1 (`task-item-workspace-sheet.test.tsx`) so it's a natural fit there; item 10 (`test_admin_iam_service.py`) is unrelated to any other PR — land it standalone or tack it onto whichever PR merges next.
