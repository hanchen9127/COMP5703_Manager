# Backend Governance Guards

## Abstract

This document summarizes the backend governance guards currently implemented in the HEJ API. The goal of these guards is to reduce unauthorized or out-of-scope state changes, constrain lifecycle transitions, and treat export as a controlled data egress boundary. These checks are intentionally minimal and do not yet implement full RBAC or a complete task-item transition matrix.

## Resource Scope Guards

### Purpose
Ensure that annotation, draft, and review resources are accessed only through the task/project they belong to.

### Files
- `apps/hej-api/app/core/resource_scope.py`
- `apps/hej-api/app/api/routes/annotations.py`
- `apps/hej-api/app/api/routes/drafts.py`
- `apps/hej-api/app/api/routes/reviews.py` (if present in the current branch)

### Protected endpoints
- `GET /task-items/{task_item_id}/annotations`
- `GET /task-items/{task_item_id}/drafts`
- `POST /task-items/{task_item_id}/drafts`
- `GET /drafts/{draft_id}`
- `PATCH /drafts/{draft_id}`
- `DELETE /drafts/{draft_id}`
- `POST /drafts/{draft_id}/submit`
- `POST /drafts/{draft_id}/approve`
- `GET /annotations/{annotation_id}`
- `GET /annotations/{annotation_id}/history`
- `POST /annotations/{annotation_id}/reviews`
- `GET /annotations/{annotation_id}/reviews`
- `GET /reviews/{review_id}`
- `PATCH /reviews/{review_id}`
- `POST /reviews/{review_id}/submit`
- `DELETE /reviews/{review_id}`

### Rule enforced
- Load the resource by ID.
- Resolve ownership through `task_item -> task -> project` where needed.
- Call the existing task/project access checker.

### Error behavior
- Missing resource returns `404 Not Found`.
- Unauthorized scope access follows the existing access helper behavior, typically `403 Forbidden` or `401 Unauthorized` depending on the helper and auth state.

### Governance value
Prevents users from reading or mutating task-adjacent artifacts that do not belong to their accessible project/task scope.

---

## Dataset Intake Lifecycle Guard

### Purpose
Prevent dataset registration/upload from creating new task items after a task has moved beyond intake/setup.

### Files
- `apps/hej-api/app/services/task_service.py`
- `apps/hej-api/app/api/routes/tasks.py`

### Protected endpoints
- `POST /tasks/{task_id}/dataset-registration`
- `POST /tasks/{task_id}/upload-images`
- `POST /tasks/{task_id}/upload-texts`
- `POST /tasks/{task_id}/upload-audio`

### Rule enforced
Dataset intake is allowed only while the task status is:
- `draft`
- `ready`

### Error behavior
- `409 Conflict`
- `Dataset intake is only allowed while the task is in draft or ready status.`

### Governance value
Ensures task setup remains immutable once the task enters execution/review stages.

---

## Draft Lifecycle Guards

### Purpose
Constrain draft operations to the intended draft workflow.

### Files
- `apps/hej-api/app/services/draft_service.py`
- `apps/hej-api/app/api/routes/drafts.py`

### Protected endpoints
- `POST /task-items/{task_item_id}/drafts`
- `GET /task-items/{task_item_id}/drafts`
- `GET /drafts/{draft_id}`
- `PATCH /drafts/{draft_id}`
- `DELETE /drafts/{draft_id}`
- `POST /drafts/{draft_id}/submit`
- `POST /drafts/{draft_id}/approve`

### Rules enforced
- Draft creation initializes drafts in `pending` status.
- Draft updates are allowed only while `pending`.
- Draft deletion is allowed only while `pending`.
- Draft submission is allowed only while `pending` and moves the draft to `submitted`.
- Draft approval is allowed only while `submitted`.

### Error behavior
- Update on non-pending draft: `400 Bad Request`
- Submit on non-pending draft: `400 Bad Request`
- Delete on non-pending draft: `409 Conflict`
- Approve on non-submitted draft: `409 Conflict`
- Missing draft: `404 Not Found`

### Governance value
Prevents accidental or malicious modification of draft history after submission, while preserving a simple two-stage draft lifecycle.

---

## Task Item Status Guards

### Purpose
Prevent the generic task-item status PATCH from directly writing workflow-owned statuses.

### Files
- `apps/hej-api/app/services/task_service.py`
- `apps/hej-api/app/api/routes/tasks.py`

### Protected endpoint
- `PATCH /tasks/{task_id}/task-items/{item_id}`

### Rules enforced
- Reject updates if the parent task status is `completed`.
- Reject updates if the current task item status is `canonicalized`.
- Reject direct writes to workflow-owned item statuses:
  - `annotated`
  - `reviewed`
  - `disputed`
  - `canonicalized`

### Error behavior
- `409 Conflict` for blocked lifecycle transitions.
- `404 Not Found` if the task item does not exist.

### Governance value
Keeps workflow-owned task item states under dedicated workflow control rather than generic mutation endpoints.

### Note
A full task-item transition matrix is not yet implemented.

---

## Export / Data Egress Guard

### Purpose
Treat export as a data egress boundary and restrict export to lifecycle-eligible items only.

### Files
- `apps/hej-api/app/api/routes/tasks.py`
- `apps/hej-api/app/services/review_policy_enforcement.py`
- `apps/hej-api/app/models/db_models.py`

### Protected endpoint
- `GET /tasks/{task_id}/export-annotations`

### Rules enforced
- User must be active and have task/project scope.
- Export eligibility is limited to task items with status:
  - `reviewed`
  - `canonicalized`
- If no such task items exist, export is rejected.
- Existing provenance metadata and policy resolution remain in place.

### Error behavior
- `403 Forbidden`
- `Export blocked: no reviewed or canonicalized task items are available for export.`

### Governance value
Prevents export of pending, annotated-but-unreviewed, or disputed items and reduces the chance of unintended data egress.

---

## Remaining Limitations

- RBAC is not yet implemented.
- A full task-item transition matrix is not yet implemented.
- Dedicated review/escalation routes are not fully present or not fully wired in the current backend snapshot.
- Export eligibility is per-item filtered, but export still emits all annotations associated with exportable items.
- This is a governance-hardening layer, not a complete policy engine.

---

## Suggested Future Work

1. Add RBAC roles and permission strings for task, review, and export actions.
2. Implement a dedicated task-item transition matrix.
3. Add explicit review/escalation mutation routes and wire them to policy enforcement helpers.
4. Consider stricter export filtering if future governance requires only final-state annotations.
5. Add tests for lifecycle edge cases and rejected transitions.
6. Document governance behavior in API reference materials for maintainers and thesis readers.

---

## Summary

The current backend governance guards are intentionally minimal but already enforce three important boundaries:
- scope boundary: only accessible task/project resources can be touched,
- lifecycle boundary: key resources cannot be mutated once they leave their intended phase,
- egress boundary: export only includes lifecycle-eligible items.

These checks provide a practical foundation for stronger governance controls without yet introducing full RBAC or a comprehensive transition system.
