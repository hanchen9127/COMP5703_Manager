# HEJ Fix Plan

Technical plan for each issue in `issues.md`, numbered 1–30 to match that file's Impact Table (see its numbering — 1 is highest priority, 29 is lowest). Section **3–4** covers two Impact Table rows (3 and 4) in one write-up, since both are downstream of the same root cause — no single canonical annotation per item — and share one fix. Section **30** was found later, during development, and is appended: its number carries no priority.

---

## 1. A live Gemini API key is hardcoded in committed source

`app/core/config.py:15`:

```python
gemini_api_key: str = "AQ.Ab8RN6IXjWaXAT0iK69qDXAetfh5BdLAxtxegws5b-jTPp2OvA"
```

This is a field *default*, not a placeholder — it is committed to the repository and tracked in git (`git ls-files` confirms), so it is in the history of every clone and every fork. It is also the value that will actually be used at runtime, because of item 23: `Settings` reads no `.env` file, so unless someone exports `HEJ_GEMINI_API_KEY` in the process environment, this baked-in key is what `GeminiPreannotator` authenticates with.

The two bugs reinforce each other: item 23 removes the mechanism by which an operator would supply their own key, and this item supplies a working fallback so nothing visibly fails. The result is that every developer running the app is silently spending against one shared, publicly-committed credential.

**Fix:**
1. Rotate the key at the provider first — it must be treated as compromised regardless of what happens in the repo.
2. Change the default to empty (`gemini_api_key: str = ""`) and have `GeminiPreannotator` treat an empty key as *disabled* — which, per item 20, must mean "produce no draft", not "produce fabricated boxes".
3. Add `HEJ_GEMINI_API_KEY=` to `.env.example` as part of item 23's rename, so the supported way to supply it is documented in the one file developers copy.
4. Purging the key from git history is a separate decision (it requires a force-push and coordination); rotation is what actually closes the exposure.

**Verify:** a test asserting `Settings().gemini_api_key` is empty by default; a grep/secret-scan step in CI so a credential-shaped literal cannot land in `app/` again.

---

## 2. A finalized/canonicalized annotation can be silently overwritten

`app/services/draft_service.py::submit_draft` (line 104) only checks `draft.status != "pending"` — it never checks the parent task item's status. `_create_annotation_from_draft` (lines 146-184) then does `annotations.update(existing_annotation.id, annotation_data=draft.draft_data, ...)` in place whenever the same creator already has an annotation for that item. There is no terminal-state guard anywhere in this path, and the route layer doesn't add one either — `create_draft`/`submit_draft` in `app/api/routes/drafts.py` call only `verify_user_is_active` + `verify_user_task_item_access`, which check org/project *access*, never item *status*. So a new draft can be created and submitted against a `canonicalized` item, silently rewriting its already-approved annotation content with no new review ever happening.

**Fix:**
1. Add an explicit guard — e.g. `assert_task_item_accepts_draft_writes(task_item)` — called from both `create_draft` and `submit_draft`, that raises `409` if the item's status is terminal (`canonicalized`, or whatever the platform's finalized-status set is; reuse the terminal-status set already defined in `task_service.py` if one exists, to keep the "what counts as terminal" definition in one place).
2. Decide (with product/governance input, since this is a workflow-semantics question) how a legitimate correction to a finalized item should happen — e.g. an explicit "reopen" transition that a privileged role must trigger before a new draft is accepted, rather than any draft write silently succeeding.

**Verify:** attempt to submit a draft against a `canonicalized` item and assert the request is rejected (`409`) and the existing annotation's content, version, and the original approving review remain byte-for-byte unchanged.

---

## 3–4. Ambiguous "latest annotation" selection when a task item has multiple annotators

This surfaced while verifying `init_data.py` can be re-run safely — the seed script (`init_step_4_annotations`) creates exactly 2 `AnnotationDB` rows per task item, alternating `created_by` between alice and bob (`creator_ids[ann_num % len(creator_ids)]`), both hardcoded to `version=1` and `is_latest=True`. Verified via direct SQL against a seeded dev DB: all 10 seeded task items end up with 2 rows where `is_latest=1`.

At first this looked like a seed-script bug, but it isn't — it's a faithful reproduction of how the **real** annotation-creation path already behaves, which exposes a genuine design gap in two read paths:

- **The real invariant** (`app/repositories/db_store.py:1042-1050`, `find_by_item_and_creator`): *"Ensure each user has only one annotation for the same item"* — uniqueness is scoped to `(task_item_id, created_by)`, not to `task_item_id` alone. `app/services/draft_service.py::_create_annotation_from_draft` (lines 146-182) follows this correctly: if the creator already has an annotation for the item, it updates it in place; otherwise it creates a new one with `is_latest=True`. So when two different annotators each submit work on the same item, **both** end up with their own `is_latest=True` row — that's intentional, not a bug.
- **The broken consumers**: `app/api/routes/review_actions.py::_latest_annotation(db, task_item_id)` (lines 133-142) filters only by `task_item_id` + `is_latest=True` — no `created_by` — and is used by the review-action endpoint (line 206) and the task-item adjustment read endpoint (`get_task_item_adjustment`, line 311 — surfaces the annotation preview to the dispute desk ahead of a decision, not `decide_escalation` itself) to fetch "the" annotation to act on. Its `.order_by(AnnotationDB.version.desc())` tiebreak is useless in practice because `version` is hardcoded to `1` everywhere an annotation is created (`draft_service.py:177`, and mirrored in the seed script) — it's never incremented. So with two creator-scoped rows tied on `version`, the tiebreak falls back to undefined row order. `draft_service.py`'s own draft-approval annotation lookup (lines 213-216) has the identical bug — same filter, and doesn't even attempt `.order_by()`.

**Real-world impact (row 3):** any task item annotated by more than one person — which is the entire premise of the dual-sign-off review policy this platform documents (`docs/design/database/db_schema_strategy.md`) — hits this. A reviewer calling the review-action or escalation-decision endpoint on such an item can be shown an arbitrary one of the two annotators' submissions, with no signal that it picked "the wrong one."

**Independently confirmed, and worse than review-time confusion — it reaches export (row 4).** `app/api/routes/tasks.py:653-678` builds `latest_annotations_by_item_and_creator`, keyed by `(task_item_id, created_by)` — one export slot per creator, not one per item. The export loop (lines 738-780) iterates that dict filtering only by `item.id`, so if two creators each have their own `is_latest` annotation on the same item, **both get written into that item's exported `"annotations"` array**, with nothing marking either as "the" canonical value. A finalized/canonicalized item can export two (or more) conflicting answers side by side. This means the fix below isn't just a review-UX nicety — it needs to also cover what `tasks.py`'s export serialization treats as canonical, not only what `_latest_annotation()` picks for review.

**Fix — pick one of two directions and make every consumer agree with it:**
1. **If only one active annotation per item is intended** (simpler mental model, matches `_latest_annotation`'s current name/shape): `_create_annotation_from_draft` needs to supersede (flip `is_latest=False` on) any other creator's current annotation for that item when a new one is approved, not just look up its own creator's row. This changes the product semantics of multi-annotator items, so confirm with product/governance docs first — `db_schema_strategy.md` §7.11 ("CanonicalJudgment... version chain for superseded canonical judgments") suggests this is closer to the intended model.
2. **If per-creator concurrent annotations are intended** (matches the repository layer's actual invariant and comment): `_latest_annotation()` and the `draft_service.py` lookup both need a `created_by` argument threaded through from their callers (e.g. the draft/review context should know whose submission is being reviewed) instead of guessing.
3. Either way, stop relying on `version` as a tiebreak while it's hardcoded to `1` — either increment it per new annotation in that scope, or order by `created_at DESC` instead.
4. Update `init_step_4_annotations` in `init_data.py` to match whichever rule is chosen, so seeded dev data doesn't contradict the real invariant.
5. Fix `app/api/routes/tasks.py:653-780`'s export serialization to emit exactly one canonical annotation per item (whichever the chosen rule defines as authoritative), with any other candidates included only as provenance/history, not as equally-weighted `"annotations"` entries.

**Verify:** add a test that creates two annotations for the same task item from two different `created_by` users (mirroring real drafting behavior), then (a) calls the review-action endpoint, asserting the *correct, intended* annotation is the one acted on, and (b) exports the (finalized) item, asserting exactly one canonical annotation is present in the export payload. Both should fail against current code and pass after the fix.

---

## 5. Reviewer corrections are never actually persisted

> **Overtaken in part by the client, 2026-09-15 (question 3).** Each author keeps their own version, so the
> first option in step 1 below — writing the correction into the annotator's `annotation_data` — is ruled
> out. A reviewer's correction is a new version authored by the reviewer, kept beside the annotator's.
> Which version a release carries is still open (follow-up F1). The work is D3, SCRUM-32, in W9.

The frontend (`task-item-workspace-sheet.tsx`, `handleReviewAction`) sends a reviewer's corrected value as `final_payload`/`final_verdict`. The backend handler (`app/api/routes/review_actions.py`, ~lines 229-267) only does `notes_parts.append(f"final_payload={payload.final_payload.strip()[:500]}")` (and the same for `final_verdict`) — folding the correction into `review_notes`, a free-text field on the new `ReviewDB` row. The item's status still transitions to `next_item_status` (e.g. `canonicalized`) a few lines later, but `annotation.annotation_data` — the actual canonical content — is never reassigned. The reviewer's correction is captured only as truncated text in a notes/audit field; the stored and exported value remains the original, un-corrected annotation.

**Fix:**
1. When `payload.final_payload` (or `final_verdict`) is present, write it into the annotation's actual content — either update `annotation.annotation_data` directly (simplest, but loses the "who corrected what" lineage) or, better, create a new annotation version attributed to the reviewer and mark it `is_latest=True` (superseding the original per whichever rule is chosen in items 3–4 — these two fixes should share the same "how do we version/supersede annotations" mechanism).
2. Keep `review_notes` for genuine free-text commentary only; don't rely on it to carry structured payload data. Consider truncation (`[:500]`) is itself a separate small bug once the payload actually needs to be preserved in full elsewhere.

**Verify:** submit a review action with `final_payload` different from the original annotation content; assert the item's read endpoint *and* its export both reflect the reviewer's corrected value, including payloads over 500 characters (the current truncation length) to confirm nothing is silently cut.

---

## 6. Drafts have no ownership enforcement

`app/core/resource_scope.py::verify_user_draft_access` (~lines 49-63) loads the draft and calls `verify_user_task_item_access`, which walks task → project → org scope (`app/core/permissions.py::verify_user_project_access`) — it never compares `draft.created_by` to the calling user. This same function guards `update_draft`, `delete_draft`, and (via `verify_user_task_item_access` directly) `submit_draft` in `app/api/routes/drafts.py`. Any active member with project access can PATCH, DELETE, or submit any other user's pending draft.

**Fix:**
1. In `verify_user_draft_access`, after the existing project/org scope check, add an ownership check: raise `403` unless `draft.created_by == current_user["user_id"]` (or the caller has an explicit reviewer/admin override role, if that's an intended capability — confirm with the role model in item 7 below, since these two fixes should agree on what "elevated" access means).
2. Separately, reviewer *read* access to drafts (needed to review someone else's submission) must stay unaffected by this — this fix should only tighten *write* paths (`update_draft`, `delete_draft`, `submit_draft`), not `get`/`list` draft endpoints.
3. Add a uniqueness rule (or at minimum, an application-level check) enforcing at most one pending draft per `(task_item_id, created_by)`, matching the annotation-layer's own stated invariant in items 3–4.

**Verify:** a two-user test — user 2 attempts to PATCH/DELETE/submit user 1's pending draft and gets `403` in every case; user 1 can still do all three on their own draft.

---

## 7. No role check or self-review guard on review actions

`submit_task_item_review_action` (`app/api/routes/review_actions.py:189-213`) calls only `verify_user_is_active` and `verify_user_task_access` — the latter (`app/core/permissions.py:159-212`) checks org/project tenancy only. A role-check helper already exists and is unused here: `verify_user_has_role(current_user, org_id, required_roles)` (`permissions.py:215-256`). Nothing in the route compares `current_user["user_id"]` to the annotation's/draft's `created_by` either. So any active org member — including the item's own annotator — can approve/reject/finalize their own work.

**Fix:**
1. Call `verify_user_has_role(current_user, task's org_id, required_roles=["reviewer", "admin"])` (or the platform's equivalent role set) at the top of `submit_task_item_review_action`, before any state mutation.
2. Add an explicit self-review guard: raise `403` if `current_user["user_id"] == annotation.created_by` (fetch the annotation being reviewed — same lookup already happening at line 206 — and compare), unless the org's policy explicitly permits self-review (check `OrganizationPolicyDB`/`review_dual_sign_off` semantics — this may already be a policy-configurable flag worth reusing rather than hardcoding).
3. Apply the same two checks to the escalation-decision endpoint (`decide_escalation`, same file) since it has the identical shape.

**Verify:** an `annotator`-only user attempting to review their own annotation gets `403`; a `reviewer`/`admin` user reviewing someone else's work still succeeds; add a dual-sign-off scenario test if that policy flag exists.

---

## 8. A second, legacy review API can bypass and rewrite the official workflow

`app/api/routes/annotations.py` exposes a fully separate API surface — `create_review` (POST `/annotations/{id}/reviews`, ~line 196), `update_review` (PATCH `/reviews/{id}`, ~line 319), `delete_review` (DELETE `/reviews/{id}`, ~line 426) — guarded only by `verify_user_is_active` + a pure tenancy check (`verify_user_annotation_access`/`verify_user_review_access` in `app/core/resource_scope.py:66-92`, which never checks role or ownership). Critically, `update_review` and `delete_review` mutate/delete `ReviewDB` rows directly and **never touch `TaskItemDB.status`** — unlike `review_actions.py`'s flow, which always advances `item.status` alongside a review decision. So any org member can flip an approved review to `rejected`, or delete it outright, while the item's official status (e.g. `canonicalized`) stays exactly as it was. Approval history and actual item state can diverge with no way to detect it from the item's status alone.

**Fix:**
1. Decide whether this route family serves any purpose the main `review_actions.py` flow doesn't — if not, remove `update_review`/`delete_review` entirely (or make them admin-only and read-only-by-default).
2. If some capability here is genuinely needed (e.g. an admin correction path), route it through the same state-transition logic `review_actions.py` uses, so `TaskItemDB.status` is always kept consistent with the latest effective review decision.
3. Model any legitimate review correction as an append-only event (new row), never an in-place edit or hard delete, to preserve the audit trail this platform's own docs (`db_schema_strategy.md`) require for judgment provenance.

**Verify:** attempt to PATCH/DELETE a review via this route as a non-admin and confirm it's rejected; for any retained capability, confirm `TaskItemDB.status` is updated consistently and the change is recorded as a new append-only event rather than an edit/delete of history.

---

## 9. Cross-project write bypass in the task API

`app/api/router.py` mounts `projects.router` (prefix `/projects`) before `tasks.project_tasks_router` (no prefix) — both register `PUT /projects/{project_id}/tasks/{task_id}` at the identical full path. Route matching goes by registration order, so `projects.py`'s handler always wins and `tasks.py`'s `PUT` version is dead code, unreachable. (`tasks.py`'s `project_tasks_router` has no `DELETE` route at all — there's no duplicate/shadowing on delete, just a single unguarded handler; see below.)

The handler that actually runs — `update_task` in `app/api/routes/projects.py` (~lines 176-210) — verifies the caller has access to the *project* in the URL, then calls `task_service.update_task(task_id, ...)` **without ever checking `task.project_id == project_id`**. The shadowed, unreachable version in `tasks.py` (~lines 56-67) actually has the correct check (`if task is None or task.project_id != project_id: raise 404`) — the fix exists in the codebase already for `update_task`, it's just dead code. `delete_task` (`projects.py`, ~lines 214-235) has the exact same missing check, but there's no shadowed `tasks.py` counterpart to port it from — it needs to be added directly.

Separately, task-item PATCH (`update_task_item` in `tasks.py`, ~lines 300-327) fetches the task only to check org/project access, then loads and updates the task item by `item_id` alone — no check that `task_item.task_id == task_id`.

**Net effect:** access to *any* project you belong to is enough to PUT/DELETE a task, or PATCH a task item, that actually belongs to a completely different, inaccessible project/organization — as long as you know or can guess its ID.

**Fix:**
1. Remove the duplicate/shadowed `PUT` route in `projects.py` (or the one in `tasks.py` — pick one canonical `TaskUpdate` implementation) so there's exactly one handler per method+path.
2. Whichever `PUT` implementation survives, port over the `task.project_id != project_id → 404` check that already exists in the dead `tasks.py` version.
3. Add that same `task.project_id != project_id → 404` check directly to `delete_task` in `projects.py` — there's no dead version to port it from, since `tasks.py` never had a `DELETE` route.
4. Add the equivalent `task_item.task_id != task_id → 404` check to `update_task_item`.

**Verify:** with access only to `proj_allowed`, attempt `PUT`/`DELETE` on a task belonging to a different, inaccessible project — expect `404`, not success. Same for a task-item PATCH with a mismatched `task_id`/`item_id` pair. Add a route-introspection test asserting no duplicate method+path registrations exist in `api_router`.

---

## 10. Invalid task-item status gets committed before validation catches it

`TaskItemStatusUpdate` (`app/api/routes/tasks.py:52-53`) declares `status: str` — a plain string, not the real `TaskItemStatus` enum. The only pre-write guard, `assert_task_item_status_update_allowed` (`app/services/task_service.py:89-110`), checks that the task/item aren't already terminal and that the target isn't a workflow-owned status — it never validates that the target is a real enum member at all. `db_item_repo.update(item_id, status=payload.status)` commits immediately. Only afterward, when FastAPI serializes the response against `TaskItemRead` (whose `status` field is a strict `TaskItemStatus` enum, `app/schemas/tasks.py:126`), does validation fail — by which point the invalid string is already permanently in the database.

**Fix:**
1. Change `TaskItemStatusUpdate.status` to `TaskItemStatus` (the real enum) so FastAPI rejects an invalid value at the request-parsing layer, before any service/repository code runs.
2. Add a DB-level check constraint on `task_items.status` as defense in depth, in case any other code path ever writes to this column with an unvalidated string.
3. Ensure `assert_task_item_status_update_allowed` runs (and would reject) before the repository commit, not just before the response is built.

**Verify:** POST an update with `status: "not_a_real_status"` and confirm it's rejected with `422` (or `409` if caught by a domain check) and the database row is unchanged — not just that the HTTP response happens to fail after the row was already written.

---

## 11. Draft submission is non-atomic, and drafts never link to their own annotation

This is listed in `issues.md` ("Draft submission is not one transaction...") but was missing its technical write-up here — adding it now.

Two independent problems in `app/services/draft_service.py::submit_draft` (lines ~96-124):

**a. Non-atomic writes.** The function makes three separate repository calls, each committing independently (`_commit_or_rollback` inside each repo method, per the pattern already noted in items 16 and 2): `self.db_store.drafts.update(...)` (draft status), `self._create_annotation_from_draft(...)` (creates/updates the annotation), then `self._advance_task_item_to_annotated_on_submit(...)` → `self.db_store.task_items.update(...)` (task item status). No wrapping transaction ties these three writes together. A failure between any of them — e.g. the annotation write succeeds but the task-item status update throws — leaves a submitted draft with no corresponding item-status change, or a draft marked submitted with no annotation at all.

**b. `draft.annotation_id` is a dead column.** `DraftDB.annotation_id` (`app/models/db_models.py:255`) is a real FK column with a comment describing its purpose ("based on which annotation this was modified from"), and it's *read* defensively at `draft_service.py:206-207` (`if draft.annotation_id: ...`). But nothing in the codebase ever *writes* to it — `submit_draft` discards `_create_annotation_from_draft`'s return value outright, and grepping the entire `app/` tree for any assignment to this column (`draft.annotation_id =` or `drafts.update(..., annotation_id=...)`) turns up nothing. So that `if draft.annotation_id:` branch is dead code — always `None` in practice, despite the column existing specifically to make this link.

**Why this matters beyond tidiness:** because the draft never records which specific annotation it produced, later steps that need "the annotation this submission created" (e.g. a review action) have no reliable way to look it up directly — they fall back to `_latest_annotation(db, task_item_id)` (`review_actions.py:133-142`), which queries by `task_item_id` alone with no creator scoping and an ineffective `version`-based tiebreak (`version` is hardcoded to `1` everywhere, per items 3–4). With two different annotators each having their own `is_latest=True` row on the same item, this lookup can return the wrong creator's annotation entirely — the same failure mode documented in items 3–4, reached here via the missing link rather than the ambiguous selection rule.

**Fix:**
1. Wrap the three writes in `submit_draft` in one transaction: use `flush()` (not commit) for the intermediate repo calls and a single `self.db.commit()` at the end, with `except: self.db.rollback(); raise` around the whole sequence — same pattern proposed for dataset registration in item 16.
2. After `_create_annotation_from_draft` returns the annotation, actually write its id back: `self.db_store.drafts.update(draft.id, annotation_id=annotation.id)` (as part of the same transaction).
3. Once (2) is in place, any code needing "the annotation this draft produced" should look it up via `draft.annotation_id` directly instead of the ambiguous `_latest_annotation(task_item_id)` fallback — this is a concrete way to close part of items 3–4's ambiguity, at least for the review-after-submit path specifically.

**Verify:** submit a draft, then assert `draft.annotation_id` is populated and points to the annotation actually created/updated by that submission. Inject a failure between the annotation write and the task-item status update (e.g. mock the item-status repo call to raise) and assert no partial state remains — no orphaned "submitted" draft without an annotation, no item stuck out of sync with its draft.

---

## 12. Frontend typecheck blockers

Two independent type errors, both in `apps/hej-web`.

### 12a. `TaskItemTable` signal prop mismatch

`components/task-item-table.tsx:54-64` defines the signal props as a discriminated union that requires `getSignal` whenever `signalLabel` is set:

```ts
type TaskItemTableSignalProps =
  | { signalLabel: string; getSignal: (item: MockTaskItem) => string }
  | { signalLabel?: undefined; getSignal?: undefined }
```

Every call site (`task-workbench.tsx:259`, `task-items-board.tsx:160`, `task-annotation-workspace.tsx:288`) does pass both props — `signalLabel={isAiAssisted ? "Confidence" : undefined}` immediately followed by `getSignal={isAiAssisted ? (item) => getTaskItemSignal(task, item) : undefined}` — but each is its own independently-typed ternary (`string | undefined` and `Function | undefined`). TypeScript can't see that the two ternaries share the same `isAiAssisted` condition, so it can't narrow the pair to either arm of the discriminated union in `TaskItemTableSignalProps` — the call sites are logically correct but structurally don't satisfy the union. The component's runtime fallback (`getSignal ? getSignal(item) : item.confidence`, line 197) never actually needs to handle a "no `getSignal`" case from these callers in practice; the union itself is just stricter than any real call site can satisfy.

**Fix:** drop the union, make both props independently optional:

```ts
type TaskItemTableSignalProps = {
  signalLabel?: string
  getSignal?: (item: MockTaskItem) => string
}
```

No call-site changes needed — the runtime fallback already handles the `getSignal`-absent case correctly; only the type was wrong.

### 12b. Missing `judgementSignal` on `MockTaskItem`

`components/task-item-workspace-sheet.tsx:1496` reads `item.judgementSignal`, a property that doesn't exist on `MockTaskItem` (`lib/domain/task-types.ts:32-61`).

This isn't a missing field — it's referencing the wrong thing. The file already has the correct value computed two ways:
- `getJudgementSignalValue(item)` (`lib/task-format.ts:54-56`) → `item.candidateConfidence ?? item.confidence`
- the local `judgementSignal` const destructured at line 997 from `getJudgementDisplayData(item)`, which calls that same helper.

Line 1498 (`isJudgement ? judgementSignal : item.confidence`) already uses the local variable correctly right next to the broken line.

**Fix:** replace `item.judgementSignal ?? item.confidence` at line 1496 with the local `judgementSignal` variable (or `getJudgementSignalValue(item)` directly) — don't add a new field to `MockTaskItem`, that would just mask the copy-paste error with a wider type.

**Verify:** `npm run typecheck:web` passes clean.

---

## 13. Frontend test failure (`task-item-workspace-sheet.test.tsx`)

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

## 14. Backend export-route tests fail to collect

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

## 15. Dispute send-back not wired

> **Done, then overtaken by the client, 2026-09-15 (question 4).** The send-back below was wired in PR #17
> (E2). The client has since ruled that after adjudication an item goes back to the **reviewer**, and the
> expert may not finalise — so `decide_escalation`'s `finalize` outcome and its send-back to the
> annotator both change under E3 (SCRUM-52's E3 part, W10). Kept here as the record of what E2 did.

`components/task-dispute-desk.tsx` has the full UI (decision selector including `"send_back"` at line 227, decision type at line 40) but short-circuits with a placeholder toast at lines 93-96 and 214-219: *"Send back to annotator is not wired yet."*

**Correction from initial triage:** this is frontend-only. The backend already fully implements `send_back` — `app/api/routes/review_actions.py`'s `decide_escalation` (`POST /tasks/{task_id}/task-items/{task_item_id}/escalations/decision`) maps `decision == "send_back"` to `TaskItemStatus.EXPERT_SEND_BACK` (lines 430-432), calls `ensure_expert_send_back_status` (line 447-448), and records the audit entry — confirmed by `test_review_actions.py::EscalationDecisionStatusTests`, which already passes. The frontend even has a ready-made client function for it: `decideTaskItemEscalation(taskId, itemId, body)` in `lib/api/review-actions.ts:157-170`, posting to that exact endpoint with `{decision, note, payload_preview}`. Nothing needs to change on the backend.

**Plan:**
1. In `task-dispute-desk.tsx`, replace the two placeholder blocks (lines 93-96, 214-219) with a real call to `decideTaskItemEscalation(taskId, itemId, { decision: "send_back", ... })` — the same pattern the `finalize` branch immediately above them already uses.
2. Confirm the item's displayed/mapped status after a successful send-back reflects `expert_send_back` (`lib/task-workspace-data.ts:106` already models this status) — check `lib/api/status-mapping.ts`/`status-mapping.test.ts` for whether it needs a UI-facing label mapping added.

**Verify:** manual pass through the dispute desk (send an item back, confirm it reappears in the annotator's queue with status `expert_send_back`/"Sent back") + a new component test for the send-back path in `task-dispute-desk`'s test file (create one if it doesn't exist).

---

## 16. Dataset registration isn't transactional

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

## 17. Organization invitations are completely broken

Two independent bugs, and together they mean **no invitation can ever be successfully accepted** through the normal flow:

1. **Creation lies about its own result.** `invite_member` (`app/services/admin_service.py:370-401`) creates the `OrganizationUser` row with `status=OrganizationUserStatus.ACTIVE` and `accepted_at=datetime.now(UTC)` set immediately — the comment even says "Admin invite is automatically accepted" — yet the function's returned dict hardcodes `"status": "invited"`. The persisted state and the API response directly contradict each other.
2. **Acceptance reads a claim the token never has.** `create_invitation_token` (`app/core/security.py:81-94`) encodes `{"user_id": ..., "org_id": ..., "type": "invitation", ...}` — there is no `"sub"` claim. A matching `decode_invitation_token` exists and correctly reads `user_id`/`org_id` (lines 97-107) — but `accept_invitation` (`app/api/routes/members.py:~206-209`) doesn't call it. It uses the generic `decode_token` and reads `token_data.get("sub")`, which is always `None` for an invitation token. The subsequent `if token_user_id != user_id: raise 403` check then fires **unconditionally, every time** — every legitimate acceptance attempt gets rejected.

**Fix:**
1. In `invite_member`, either actually create an `invited` (not `active`) membership with no `accepted_at` if that's the intended semantics, or fix the response to honestly report `"active"` — pick whichever matches the intended invite model and make persisted state and API response agree.
2. In `accept_invitation`, switch to the already-existing `decode_invitation_token` instead of the generic `decode_token`, and verify token purpose/user/org/state explicitly (type == "invitation", user/org match, membership still in an acceptable pending state) rather than relying on a `sub` field that was never populated.
3. Make acceptance idempotent (accepting an already-accepted invitation shouldn't error).

**Verify:** route-level tests for valid acceptance, wrong-user acceptance, expired token, revoked invitation, and already-accepted invitation — valid acceptance must actually succeed (this is currently impossible; a passing test here is the real regression check).

---

## 18. `GET /organizations` is registered twice, making "list pending invitations" unreachable

`app/api/router.py:24-25` mounts two routers under the same prefix:

```python
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(members.router, prefix="/organizations", tags=["members"])
```

Both register a bare `GET ""` at that prefix — `organizations.py:86` (`list_organizations`, line 93) and `members.py:31-37` (`list_pending_invitations`, line 38). FastAPI matches in registration order, so `organizations.router` always wins and **`list_pending_invitations` can never be reached by any request**. Confirmed by route introspection over `api_router`: `('GET', '/organizations')` resolves to `app.api.routes.organizations`, with `app.api.routes.members` shadowed. (The same introspection surfaces the item 9 duplicate — these are the only two collisions in the app.)

**Why this is worse than a dead route:** it compounds item 17. Invitations already cannot be *accepted* (broken token contract); with this collision they also cannot be *listed*. There is no working path through the invitation flow at all, and the failure is silent — the endpoint returns `list_organizations`' response shape, so a client calling it gets a `200` with the wrong payload rather than a `404`.

**Fix:**
1. Give `list_pending_invitations` a non-colliding path. It is not an organizations-collection endpoint — it lists the *current user's* pending invitations, so mount it under the existing `invitations.router` (already mounted at `/invitations`, `router.py:26`) as `GET /invitations/pending`, or keep it in `members.py` under an explicit sub-path such as `GET /organizations/invitations/pending`.
2. Do not reorder the `include_router` calls to "fix" it — that would just shadow `list_organizations` instead.
3. Land this together with item 17; neither is independently testable end-to-end, since a user cannot reach an invitation to accept without a working list endpoint.

**Verify:** the route-introspection test proposed in item 9 (no duplicate method+path in `api_router`) must pass — it currently reports two collisions, and this item plus item 9 together bring it to zero. Add a route test asserting `list_pending_invitations` returns the caller's pending invitations rather than an organization list.

---

## 19. Task completion and export readiness use different rules for "done"

`app/services/task_service.py:82-86` defines `FINALIZED_EXPORTABLE_TASK_ITEM_STATUSES = {"approved", "reviewed", "canonicalized"}`, used by `assert_task_completeable` (lines 324-340) — so a task can be marked `completed` when its items are merely `reviewed`, not `canonicalized`. But `app/services/project_exports_service.py` maps `task.status == "completed"` to export status `"ready"` (lines 20-26, `_TASK_STATUS_TO_EXPORT`), while `completed_item_count` (lines 51-59) filters `TaskItemDB.status == "canonicalized"` only. Result: a task completed via all-`reviewed` items produces an export package that reports itself `"ready"` while showing `0/N` completed items — two parts of the same feature disagreeing about what counts as done.

**Fix:**
1. Define one shared predicate (e.g. `is_task_item_export_eligible(status)`) and use it consistently in `assert_task_completeable`, the export package's readiness computation, its item-count computation, and the task-export route.
2. Decide (product question, same territory as item 14's export-eligibility fix) whether `reviewed`-only completion should actually block "ready" export status, or whether the counting logic should include `reviewed` items too — either is defensible, but they must agree.

**Verify:** a test asserting a package can never report `"ready"` with a completed-item count that doesn't match its own eligibility rule; service, route, and (if applicable) UI all reference the same shared predicate rather than duplicating the status list.

---

## 20. AI-assist failures fabricate plausible-looking fake annotations

`app/integrations/gemini_preannotator.py`: when preannotation is disabled (`generate_for_item`'s `if not self.enabled` check, ~line 44-45) or the call errors (broad `except Exception`, ~line 54-55), the fallback (`_empty_result`, ~lines 232-259) doesn't report failure — it hardcodes two fixed bounding boxes with specific coordinates (`{"id": "ai_1", "label": "object", "x": 0.12, "y": 0.12, "width": 0.3, "height": 0.3}` and a second box), identical every time. Separately, `_ensure_min_image_boxes` (~lines 273-293) pads any real-but-short model result up to a minimum box count using those same hardcoded boxes. `task_service.py` (~lines 451-466) stores this straight into a normal `pending` draft, attributed to the operator like any other AI draft — the only difference is a free-text `revision_notes` string ("AI pre-annotation disabled"/"fallback" vs. a real success message), not a structured, queryable provenance flag.

**Fix:**
1. Give preannotation runs an explicit, structured outcome — e.g. a `model_run_status` (`succeeded`/`failed`/`disabled`) field on the draft or a separate run-log row — rather than encoding it only in free text.
2. On failure/disabled/error, do not create a draft with fabricated content at all (unless an explicit demo/test mock mode is requested) — leave the item without an AI draft, or create a draft explicitly marked as having no real model output, so downstream review/export code can distinguish "the model said this" from "the model didn't run."
3. Same treatment for the box-padding path: padding to a minimum count with invented data should either be removed or clearly flagged as synthetic, never presented as model confidence/output.

**Verify:** force `self.enabled = False` and force an exception in the real API call path; assert neither produces a draft indistinguishable from genuine AI output — either no draft is created, or its provenance is explicitly marked as non-model-generated.

---

## 21. Audit log actor always "user"

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

## 22. Escalation audit entries duplicate their summary

`_summary_for_log` (`task_audit_log_query.py:150-152`) already renders `"Escalation routed to {target}"` for `escalation_routed` events. But `_build_changes` (line 129-145) also emits a `changes` entry for the same `target` key, because `"target"` is in `_USER_VISIBLE_CHANGE_FIELDS` (line 68) and `escalation_routed` is not in `_OPERATIONS_WITHOUT_CHANGES` (line 61, currently only `DATA_INTAKE_OPERATIONS`). Grep confirms `"target"` is set in `new_values` only for `escalation_routed` (no other operation uses it), so removing it from the visible-fields set can't hide a "target" diff anyone else relies on.

**Fix:** remove `"target"` from `_USER_VISIBLE_CHANGE_FIELDS` (line 63-74) in `task_audit_log_query.py`. Since `escalation_routed`'s only meaningful field is `target`, this makes `_build_changes` return `[]` for it — matching the summary line and eliminating the duplicate.

**Verify:** `uv run pytest tests/test_task_audit_log_query.py::test_list_for_task_attaches_external_item_ref_label -q` — this test already asserts `response.logs[0].changes == []` for an `escalation_routed` log and is currently the one failing test in the suite.

---

## 23. Backend `.env` config is silently broken

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

## 24. `init_data.py --reset` is broken (two independent bugs)

### 24a. Crashes on Windows (console encoding)

Every `print()` call throughout `init_data.py` uses non-ASCII glyphs (`✓`, `✗`, `❌`, `⚠️`, `✅`, and the `╔═╗╚╝` box-drawing banner). Windows' default console codepage is GBK/CP936, not UTF-8, and stdout isn't reconfigured — so any of these prints raises `UnicodeEncodeError` and kills the process.

Reproduced directly: running the exact command in the README, `uv run python init_data.py --reset`, on a plain Windows terminal (no `PYTHONUTF8`/`PYTHONIOENCODING` set) throws immediately at the "⚠️ RESET MODE" banner. Setting `PYTHONUTF8=1` (or `PYTHONIOENCODING=utf-8`) works around it and the script completes normally — confirming this is purely an output-encoding problem, not application logic.

**Compounding bug:** the top-level `except Exception as e: print(f"\n❌ Initialization failed: {str(e)}")` (main.py-style handler at the bottom of `init_data.py`) *also* prints an emoji. So if anything else fails for an unrelated reason, the error handler itself throws `UnicodeEncodeError` while trying to report it — the original exception is masked and never reaches the console. Same problem exists in the per-user `except Exception as e: print(f"  ✗ Failed to create user ...")` handler in `init_step_1_users_and_organizations`.

**Fix:**
1. At the very top of `init_data.py`'s `main()` (or as the first lines of the module), force UTF-8 output regardless of console codepage:
   ```python
   import sys
   sys.stdout.reconfigure(encoding="utf-8", errors="replace")
   sys.stderr.reconfigure(encoding="utf-8", errors="replace")
   ```
   This is available on Python 3.7+ and fixes every print call in the file in one place — no need to strip the emoji/checkmarks.
2. Double-check the error-handling paths specifically (the two `except Exception as e: print(...)` blocks) now surface the real exception instead of a secondary `UnicodeEncodeError`.

**Verify:** on Windows, open a plain `cmd.exe` (not Windows Terminal with UTF-8 configured), do **not** set `PYTHONUTF8`, and run `uv run python init_data.py --reset` — it should complete with the normal `✅ Initialization Complete!` banner instead of crashing.

### 24b. Fails with a FOREIGN KEY constraint error on a second reset — and corrupts the schema when it does

Reproduced directly, cross-platform (not Windows-specific): seed a fresh database with `init_data.py --reset`, then run `init_data.py --reset` a **second** time against that now-populated database. It fails:

```
sqlalchemy.exc.IntegrityError: (sqlite3.IntegrityError) FOREIGN KEY constraint failed
[SQL: DROP TABLE IF EXISTS data_pointers]
```

Root cause: the reset routine in `main()` does

```python
inspector = inspect(engine)
table_names = inspector.get_table_names()
if table_names:
    with engine.begin() as connection:
        for table_name in table_names:
            connection.execute(text(f"DROP TABLE IF EXISTS {table_name}"))
```

`table_names` comes back in whatever order the inspector returns (alphabetical in practice: `annotations`, `audit_logs`, `data_pointers`, `drafts`, ...) — not in FK-dependency order. `PRAGMA foreign_keys=ON` is set on every connection (`app/core/database.py`'s connect event listener), so dropping `data_pointers` while `task_items` (not yet dropped, and referencing it via FK) still holds rows fails the constraint check.

**This is not a clean failure.** SQLite executes each `DROP TABLE` as its own DDL statement — the surrounding `engine.begin()` block does not make the whole loop atomic. Verified directly: after the failed second reset, querying the database's table list showed **13 of the original 15 tables remaining** — `annotations` and `audit_logs` (the two tables alphabetically before `data_pointers`) were already dropped when the loop hit the error and stopped, while every other table (still holding stale seed data from the first run) was left in place. The database is now in a state that matches neither the old nor the new schema. The only recovery is deleting the `.db` file entirely and starting over — `init_data.py` (with or without `--reset`) cannot repair this state on its own, since any step that queries the now-missing `annotations`/`audit_logs` tables will immediately fail with "no such table."

**Fix:**
1. Don't drop tables in inspector-returned order. Either:
   - Drop them via SQLAlchemy's `Base.metadata.drop_all(bind=engine)` (already used elsewhere in this file, in `reset_db()` in `app/core/database.py`) instead of hand-rolled `DROP TABLE` statements — `drop_all` topologically sorts by FK dependency automatically. The reset branch in `init_data.py`'s `main()` should just call `reset_db()` rather than reimplementing table-dropping with raw SQL.
   - Or, if raw SQL must stay, temporarily disable FK enforcement for the drop loop: `connection.execute(text("PRAGMA foreign_keys=OFF"))` before the loop (SQLite allows this per-connection), then re-enable afterward.
2. Regardless of which fix is chosen, wrap the drop loop so a failure partway through doesn't leave a half-dropped schema — dropping all tables in one `DROP TABLE` per open connection with FK checks off, or using `drop_all`, avoids the ordering problem entirely rather than needing rollback logic.

**Verify:** seed a database with `--reset`, then run `--reset` again immediately (the exact repro above) — it should succeed both times with a clean, fully-recreated schema, and a table-count check after the second reset should show all 15 expected tables present.

---

## 25. Vacuous frontend test: image-bbox hydration

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

## 26. Misleading mock setup in a backend admin-IAM test

`apps/hej-api/tests/test_admin_iam_service.py::test_org_admin_can_create_user_in_own_org` (~lines 110-115) builds a `query_map` wiring `db.query(...)` stubs for `UserDB`, `OrganizationUserDB`, and `RoleAssignmentDB`, then installs it via `self._set_query_map(...)` before calling `create_user_for_org`.

`create_user_for_org`'s actual implementation never calls `db.query(...)` at all — it only goes through `store.users.get_by_email`, `db.add`, `db.flush`, and `db.commit`. The `query_map` setup is dead code from the test's perspective: it doesn't drive any behavior the assertions depend on, but its presence tells a reader the service does DB `.query()` lookups as part of user creation, which isn't true. This isn't a false-pass risk (removing it wouldn't change the test's outcome), but it's actively misleading to anyone using this test to understand `create_user_for_org`'s real code path.

**Fix:** delete the unused `query_map`/`_set_query_map(...)` setup from this test, leaving only the mocks that `create_user_for_org` actually exercises (`store.users`, `db.add`/`flush`/`commit`).

**Verify:** run `uv run pytest tests/test_admin_iam_service.py -q` after removing the dead setup — it should still pass unchanged, confirming the removed code was never load-bearing.

---

## 27. `FINALIZED_EXPORTABLE_TASK_ITEM_STATUSES` contains a status that cannot exist

`task_service.py:82-88` defines:

```python
FINALIZED_EXPORTABLE_TASK_ITEM_STATUSES = {
    "approved",
    "reviewed",
    "canonicalized",
}
```

`TaskItemStatus` (`app/models/domain.py:51-59`) has no `APPROVED` member — the values are `pending`, `annotated`, `returned`, `rejected`, `reviewed`, `disputed`, `expert_send_back`, `canonicalized`. No item can ever hold `"approved"`, so the set behaves as `{"reviewed", "canonicalized"}` and the first entry is dead.

There is no behavioral bug here — `assert_task_completeable` already works as if `"approved"` were absent, so item 19's finding (a task can complete on merely-`reviewed` items) stands unchanged. The cost is comprehension: a reader auditing export eligibility reasonably concludes there is an `approved` state in the workflow, and goes looking for the transition that produces it.

**Fix:** delete `"approved"` from the set as part of item 19's work, when that list is being replaced by a shared `is_task_item_export_eligible(status)` predicate anyway. Whatever that predicate ends up accepting, derive it from `TaskItemStatus` members so a non-existent status cannot be listed again.

**Verify:** assert every member of the eligibility set is a valid `TaskItemStatus` value — a one-line test that would have caught this.

---

## 28. A task can never leave `draft`, so intake never closes and most export states are unreachable

`TaskCreate` (`app/schemas/tasks.py:43-53`) has no `status` field, so every task is created in `draft`. `TaskUpdate` (`61-71`) has no `status` field either, and there is no activation endpoint anywhere in `app/api/routes/`. Grepping every writer of `task.status` in the service layer turns up exactly one: `task_service.py:347`, inside `complete_task`, which sets `"completed"`. **`draft → completed` is the only task-status transition the API can perform.**

Two concrete consequences, both in already-shipped code paths:

- **Dataset intake never closes.** `assert_task_allows_dataset_intake` (`task_service.py:63-68`) permits intake while the task is in `draft` or `ready`. Since a task stays `draft` for its entire working life, new items can be registered into a task at any point — including while its existing items are being reviewed or after some have been canonicalized. The guard exists but can never fire except on an already-`completed` task.
- **Most export states are unreachable.** `_TASK_STATUS_TO_EXPORT` (`project_exports_service.py:20-26`) maps `in_review`, `ready`, and `disputed` to `"building"`. No task can hold any of those values, so every export package is either `"draft"` or `"ready"` — the intermediate state the dashboard is built to show never appears.

This also undercuts item 19's premise: aligning "completion" and "export readiness" is only half the problem if the lifecycle in between has no transitions at all.

**Fix:**
1. Decide the intended task lifecycle explicitly (product question — `TaskStatus` already enumerates `draft`, `ready`, `in_review`, `disputed`, `completed`, so the intent exists in the model but not in the API).
2. Add a dedicated activation transition rather than a free-form `status` field on `TaskUpdate` — e.g. `POST /projects/{project_id}/tasks/{task_id}/activate` alongside the existing `.../complete` (`tasks.py:76`), which is already the established shape for a guarded task transition.
3. Enforce transitions in one place: a `assert_task_status_transition_allowed(current, next)` helper next to the existing `assert_task_completeable`, so `draft → ready → in_review → completed` is validated rather than assignable.
4. Once tasks can actually reach `ready`, re-check `assert_task_allows_dataset_intake` — the `{draft, ready}` set should probably narrow to `{draft}` if `ready` is meant to mean "intake closed."

**Verify:** a lifecycle test walking a task through every intended transition and asserting each illegal jump is rejected; assert dataset intake is refused once a task has left the intake phase; assert an export package can actually report `"building"`.

---

## 29. Lifecycle conflicts in dataset registration are returned as HTTP 500

`register_dataset` (`app/api/routes/tasks.py:264-296`) wraps the whole service call in a blanket handler:

```python
try:
    pointers, task_items = service.register_dataset(...)
    ...
except Exception as e:
    import traceback
    traceback.print_exc()
    raise HTTPException(status_code=500, detail=f"Failed to register dataset: {str(e)}")
```

`HTTPException` is an ordinary `Exception` subclass, so the deliberate `409` raised by `assert_task_allows_dataset_intake` (`task_service.py:65`) is caught and re-raised as a `500`. Reproduced directly against a seeded database: registering items into a `completed` task returns

```
500: Failed to register dataset: 409: Dataset intake is only allowed while the task is in draft or ready status.
```

The correct status code and message are both present — nested inside a server-error envelope. Clients cannot distinguish "you attempted an invalid state transition" from "the server broke", so a retry loop or an alerting rule keyed on `5xx` will treat a normal workflow refusal as an outage.

**Fix:**
1. Re-raise `HTTPException` untouched before the generic handler:
   ```python
   except HTTPException:
       raise
   except Exception as e:
       ...
   ```
2. Replace `traceback.print_exc()` with the application logger — printing to stdout loses the record in any real deployment.
3. Audit the other broad `except Exception` handlers in `app/api/routes/` for the same swallow (`members.py`'s `accept_invitation` has the same shape but does re-raise `HTTPException` first, at lines 220-221 — that is the pattern to copy).

**Verify:** POST dataset registration against a `completed` task and assert the response is `409` with the domain message intact, not `500`. Add the same assertion for any other lifecycle guard reachable through this route.

---

## 30. A task or project that has items can never be deleted

*Found by Michael on 2026-09-17 while designing SCRUM-1's foreign keys; reproduced and traced by Hanchen the
same day against `main` at `17673c8`. Not part of the original audit, so this section is appended rather than
slotted by priority.*

**Symptom.**

`DELETE /projects/{project_id}/tasks/{task_id}` and `DELETE /organizations/{org_id}/projects/{project_id}`
raise `sqlite3.IntegrityError: FOREIGN KEY constraint failed`. Neither route catches it, so the client
receives a `500`. No test covers either path.

**Root cause — two layers.**

**Layer 1: delete ordering, which is what actually fails today.** `TaskDB` declares cascades to
`data_pointers` and to `task_items`, but nothing declares that `task_items.data_pointer_id` depends on
`data_pointers.id` — there is no relationship between those two models. SQLAlchemy therefore picks an
order freely, and it deletes the data pointer first:

```text
DELETE FROM data_pointers WHERE data_pointers.id = ?   params=('dp_1',)
-> FOREIGN KEY constraint failed
```

That is the **first** statement issued, so the failure happens before any annotation work is reached.
This is why deleting a task fails even when its items are untouched, which is broader than a missing
cascade would explain.

**Layer 2: children of `task_items`, which would fail next.** Once the ordering is fixed, deleting a
task item is blocked in turn by rows that reference it with no cascade and no `ondelete`:

| Child of `task_items` | Deleting the item |
| --- | --- |
| `annotations` | ✅ allowed — the relationship declares `cascade="all, delete-orphan"` |
| `drafts` | ❌ `FOREIGN KEY constraint failed` |
| `predictions` | ❌ `FOREIGN KEY constraint failed` |
| `task_item_escalations` | ❌ `FOREIGN KEY constraint failed` |

`reviews` reference both `annotations` and `task_items`, so they follow the same pattern.

**Reproduction.**

Standard library plus the app's own models; no server and no database file. Run from
`apps/hej-api` with `PYTHONPATH=.`:

```python
from datetime import UTC, datetime

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.db_models import Base, DataPointerDB, DraftDB, ProjectDB, TaskDB, TaskItemDB

engine = create_engine(
    "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
)


@event.listens_for(engine, "connect")
def _foreign_keys_on(dbapi_connection, _record):
    # The same pragma app/core/database.py sets.
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


@event.listens_for(engine, "before_cursor_execute")
def _log_deletes(conn, cursor, statement, params, context, executemany):
    if statement.strip().upper().startswith("DELETE"):
        print(f"  {statement.strip().splitlines()[0]}   params={params}")


Base.metadata.create_all(engine)
db = sessionmaker(bind=engine)()
db.add(ProjectDB(id="proj_1", organization_id="1", name="P"))
db.add(
    TaskDB(
        id="task_1",
        project_id="proj_1",
        title="T",
        judgment_question="Q",
        task_type="text",
        annotation_mode="human_first",
        label_schema_ref="default",
    )
)
db.add(DataPointerDB(id="dp_1", task_id="task_1", location_ref="x"))
db.add(
    TaskItemDB(
        id="item_1",
        task_id="task_1",
        data_pointer_id="dp_1",
        external_item_ref="e1",
        status="pending",
    )
)
# Add a draft to see layer 2; the failure below happens with or without it.
db.add(
    DraftDB(
        id="draft_1",
        task_item_id="item_1",
        annotation_type="annotation",
        status="pending",
        draft_data={},
        created_at=datetime.now(UTC),
    )
)
db.commit()

try:
    db.delete(db.query(TaskDB).filter(TaskDB.id == "task_1").first())
    db.commit()
    print("deleted")
except Exception as exc:
    db.rollback()
    print(f"failed: {type(exc).__name__}")
```

Expected output, on `main`:

```text
  DELETE FROM data_pointers WHERE data_pointers.id = ?   params=('dp_1',)
failed: IntegrityError
```

Deleting the project instead of the task fails the same way, because it cascades into the task.

**Fix — the decision comes first.**

Making the delete work is the smaller half. The larger question is **whether a task holding annotation
and review history should be deletable at all**. Cascading erases the provenance the platform exists to
keep, so refusing with a `409` — and offering archival instead — may be the right answer. That choice
belongs with the task lifecycle, story B4 (SCRUM-24), which now owns it: the client answered "anything
reasonable, no hard requirement" on 2026-09-17, so the path is ours to define and write down.

1. **Settle the policy first**, with B4, and record it in `workflow_states.md`: is a task holding
   annotation or review work deletable, or refused?
2. **Fix the ordering regardless of the policy.** Declare the missing relationship so SQLAlchemy knows
   `task_items` depends on `data_pointers` — for example `data_pointer = relationship("DataPointerDB")`
   on `TaskItemDB` with a matching `back_populates` — or give `task_items.data_pointer_id` an explicit
   `ondelete` and let the database order it. Without this, even an untouched task cannot be removed.
3. **If the policy is "deletable":** add `ondelete="CASCADE"` to the `task_item_id` foreign keys on
   `drafts`, `predictions`, `reviews` and `task_item_escalations`, with `passive_deletes=True` on the
   owning relationships, so the database does the work in one statement rather than the ORM loading
   every child.
4. **If the policy is "refused":** count the dependent rows first and raise a `409` naming what blocks
   the delete, and name the archival path a project manager should use instead — even if archival is
   not built yet.
5. **Stop the `500` either way.** Both routes currently let `IntegrityError` escape. This is the same
   failure mode as issue 29: a workflow refusal reported as an outage.

**Verify:** route-level tests for both endpoints — a task whose items carry no work, and a task with a
draft, a prediction and an escalation — asserting the documented outcome and never a `500`. There are no
tests on either route today. The same pair for `DELETE /organizations/{org_id}/projects/{project_id}`,
which cascades into its tasks.

**Severity.** Recorded as Medium in `issues.md`: it breaks a documented endpoint completely and reports
the breakage as a server error, but corrupts no data, bypasses no governance rule, and sits outside the
demo path. It becomes High if the pilot needs task deletion.

---

---

## Suggested execution order & grouping (PR bundles)

Items 2, 3–4, 5, 11 (and, less directly, 19) all revolve around the same unresolved question — **what is the single authoritative record of a finalized judgment, and how does a correction to it get made?** Answer that once (with product/governance input) and several of these fixes become mechanical rather than open-ended.

- **PR A — rotate the credential (item 1):** do this **first in wall-clock time**, ahead of everything below — the rotation step is independent of all code work and the exposure runs until it happens. The code-default change rides along with PR N's `.env` work.
- **PR B — canonical-annotation model decision + fixes (items 2, 3–4, 5, 11; touches 8's data model):** **Blocked on a product/governance decision** — single active annotation vs. per-creator concurrent annotations, and how reviewer corrections are versioned. Do this first among the code work — it's the highest-severity cluster (silent overwrite of finalized data, wrong/duplicate export output, discarded reviewer corrections, non-atomic submission with a dead draft→annotation link) and other fixes below build on its outcome.
- **PR C — draft ownership + self-review guard (items 6, 7):** independent of PR B's data-model question; can proceed in parallel. Closes the two most direct multi-user-abuse gaps (editing others' drafts, self-approval).
- **PR D — legacy review API lockdown (item 8):** do after PR B's canonical-record decision is settled, since this route's fate (remove vs. reroute through the official state-transition path) depends on it.
- **PR E — cross-project write bypass + task-item status validation (items 9, 10):** same file family (`tasks.py`/`projects.py`), independent of the annotation work — can land any time, high value for the risk (near-zero regression surface, closes a real cross-tenant mutation path).
- **PR F — frontend build health (items 12, 13):** small, isolated, unblocks CI immediately.
- **PR G — backend export-route tests (item 14):** new helper + filter, backed by the existing test file.
- **PR H — dispute send-back (item 15):** frontend-only wiring to an existing backend endpoint — smaller than initially scoped.
- **PR I — dataset registration transaction (item 16):** touches shared repo methods — review carefully, add the regression test described above before merging.
- **PR J — organization invitations + route collision (items 17, 18):** invitations currently cannot be accepted *at all* — this blocks onboarding any real second user, so treat as high priority despite being independent of the data-integrity cluster. Land both together; neither is testable end-to-end alone.
- **PR K — export/completion rule alignment (item 19, folding in item 27):** depends conceptually on PR B's canonical-annotation decision (what counts as "done" should agree with what counts as "canonical"). Drop the impossible `"approved"` status (item 27) here, while this status list is being rewritten anyway.
- **PR L — AI-assist failure visibility (item 20):** independent; mostly a matter of not fabricating output on failure.
- **PR M — backend audit log correctness (items 21, 22):** same file, same test file, low risk.
- **PR N — `init_data.py`/`.env` dev-tooling fixes (items 23, 24, both 24a and 24b):** trivial, zero risk, dev-tooling only — land any time.
- **PR O — test-quality fixes (items 25, 26):** trivial, zero risk, test-only changes.
- **PR P — task lifecycle transitions (item 28):** **Blocked on a product decision** (what the intended `draft → ready → in_review → completed` path is and who may trigger each step). Sequence after PR K, since "what counts as done" should be settled before adding the transitions that lead there.
- **PR Q — error-contract fix (item 29):** one-line `except HTTPException: raise` plus a logger change; independent, land any time.
