# Functional Logic Issues in HEJ

## Scope

This document summarizes the functional-logic issues identified in the current HEJ codebase. The review focuses on the end-to-end data flow from dataset ingestion through annotation, review, escalation, canonicalization, and export.

## Executive Summary

The application provides the main workflow screens and API operations, but several implementation gaps weaken its central provenance guarantee. In particular, annotation history can be overwritten, reviewed results are not consistently promoted to the canonical annotation, AI-generated content is not linked to model provenance, and export eligibility does not verify that the provenance chain is complete. Authorization, lifecycle enforcement, and transaction boundaries also allow invalid or partially completed workflow states.

## Findings

### FL-01: Annotation Versions Are Overwritten

**Severity:** Critical

**Issue Description:** When the same user submits another annotation for an item, the service updates the existing annotation row instead of creating an immutable new version. The version-list query also filters by the annotation primary key, so it cannot return a real version history.

**Impact:** Previous label values and correction steps are lost. The platform cannot reliably explain how a final label evolved, compare revisions, or reconstruct the annotation provenance chain.

**Relevant Code:** `apps/hej-api/app/services/draft_service.py`, `apps/hej-api/app/repositories/db_store.py`

### FL-02: Reviewed Results Are Not Written Back as Canonical Data

**Severity:** Critical

**Issue Description:** Reviewer and expert decisions can change an item's workflow status to `canonicalized`, but the submitted final payload or verdict is stored in review notes or escalation preview data rather than being written to the canonical annotation record. Export continues to read the original annotation data.

**Impact:** The data exported as final may differ from the result approved by the reviewer or expert. Corrections made during adjudication can therefore be omitted from a release.

**Relevant Code:** `apps/hej-api/app/api/routes/review_actions.py`

### FL-03: AI Suggestions Are Not Connected to Model Provenance

**Severity:** Critical

**Issue Description:** Gemini pre-annotation output is saved directly as a user-owned draft. The stored draft does not reference a prediction record, model run, model version, prompt/configuration, or an explicit human acceptance or rejection event. When the AI call fails, fallback data may also be generated and saved without clearly identifying it as fallback content.

**Impact:** It is impossible to distinguish AI-produced content from human-produced content reliably. The platform cannot measure suggestion acceptance, audit model influence, compare model versions, or prove which model output contributed to a released label. Synthetic fallback annotations may also be mistaken for genuine predictions.

**Relevant Code:** `apps/hej-api/app/services/task_service.py`, `apps/hej-api/app/services/gemini_preannotator.py`

### FL-04: Export Does Not Enforce Provenance Completeness

**Severity:** Critical

**Issue Description:** Export eligibility is based mainly on item workflow statuses such as `reviewed` or `canonicalized`. The release path does not require a complete source reference, active guideline version, annotation revision chain, reviewer/adjudicator chain, or AI prediction provenance. A provenance-required setting is exposed but is not used as a blocking validation rule.

**Impact:** A dataset can be completed and exported even when its labels cannot be traced back to their source, guideline, annotator, reviewer, or model suggestion. This directly conflicts with the platform's stated requirement to refuse unverifiable releases.

**Relevant Code:** `apps/hej-api/app/api/routes/tasks.py`, `apps/hej-api/app/services/task_service.py`

### FL-05: Workflow Roles and Separation of Duties Are Not Enforced

**Severity:** Critical

**Issue Description:** Role-verification utilities exist, but the main annotation and review routes do not consistently use them. Organization membership or task access is often sufficient to perform review, escalation, or completion actions. Ownership checks are also missing from some draft and prediction operations.

**Impact:** An annotator may be able to review or approve their own work, unauthorized members may alter workflow records, and prediction resources may be exposed outside their intended scope. This weakens accountability and makes review evidence unreliable.

**Relevant Code:** `apps/hej-api/app/core/permissions.py`, `apps/hej-api/app/api/routes/review_actions.py`, `apps/hej-api/app/api/routes/predictions.py`

### FL-06: Parent-Child Resource Relationships Are Not Validated

**Severity:** Critical

**Issue Description:** Some nested routes authorize access to the parent project or task but do not verify that the child resource actually belongs to that parent. There are also duplicate task-update routes, and the less restrictive route is registered first.

**Impact:** A user may supply an authorized parent ID in the URL while targeting an unrelated task or item ID in the request. This can permit cross-project or cross-organization modification and causes ambiguous routing behavior.

**Relevant Code:** `apps/hej-api/app/api/routes/projects.py`, `apps/hej-api/app/api/routes/tasks.py`

### FL-07: The Task Lifecycle Cannot Be Activated and Is Not Enforced

**Severity:** High

**Issue Description:** New tasks are created in `draft`, but the task update schema does not accept a status change and there is no dedicated activation operation. At the same time, annotation and review endpoints do not consistently require the task to be in the appropriate lifecycle state.

**Impact:** A task may remain in `draft` while annotation, review, and canonicalization proceed. Intake may remain open during production, workflow-phase reporting becomes inaccurate, and invalid state transitions can bypass the intended process.

**Relevant Code:** `apps/hej-api/app/schemas/tasks.py`, `apps/hej-api/app/services/task_workflow_service.py`

### FL-08: Escalation Is a Non-Atomic Two-Step Operation

**Severity:** High

**Issue Description:** The frontend first submits a disputed review decision and then sends a separate request to create or route the escalation. The first backend request commits before the second request succeeds.

**Impact:** If the escalation request fails, the item remains disputed without an open escalation record or assigned expert. This creates an orphaned workflow state that may require manual database repair.

**Relevant Code:** `apps/hej-web/components/tasks/task-item-workspace-sheet.tsx`, `apps/hej-api/app/api/routes/review_actions.py`

### FL-09: Multi-Step Workflow Operations Are Not Transactional

**Severity:** High

**Issue Description:** Repository operations commit independently during workflows that update drafts, annotations, items, pointers, files, and audit history. Uploaded files can also be written before database registration completes, without guaranteed cleanup on failure.

**Impact:** A failure in the middle of an operation can leave partial state, such as a submitted draft without its annotation, an item status inconsistent with its records, an operation without an audit event, or an orphaned uploaded file. Retrying may then create duplicates.

**Relevant Code:** `apps/hej-api/app/services/draft_service.py`, `apps/hej-api/app/repositories/db_store.py`, `apps/hej-api/app/services/audit_log_service.py`, `apps/hej-api/app/api/routes/uploads.py`

### FL-10: Competing Review APIs Have Inconsistent Semantics

**Severity:** High

**Issue Description:** Task review-action endpoints update item workflow status and apply review policy, while generic annotation-review endpoints primarily create or modify review records. The latter do not consistently synchronize item status or policy state and allow review records to be edited or deleted independently.

**Impact:** Approved review records can exist while the item remains in a non-final state, or finalized approvals can later be changed or deleted. Dual-signoff counts and canonicalization state can consequently drift apart.

**Relevant Code:** `apps/hej-api/app/api/routes/review_actions.py`, `apps/hej-api/app/api/routes/annotations.py`, `apps/hej-api/app/services/review_policy_enforcement.py`

### FL-11: Workflow and Export Statistics Are Incomplete

**Severity:** Medium

**Issue Description:** Workflow summaries count only a subset of valid item statuses and omit states such as `returned`, `rejected`, or `expert_send_back`. The export dashboard also constructs package-like records for tasks without fully calculating readiness and provenance metrics.

**Impact:** Dashboard totals, workflow phase, and release readiness can be misleading. Users may believe work is complete or exportable when unresolved items still exist, or may see totals that do not reconcile.

**Relevant Code:** `apps/hej-api/app/services/task_workflow_service.py`, `apps/hej-api/app/services/project_exports_service.py`, `apps/hej-api/app/schemas/exports.py`

### FL-12: Expected Lifecycle Conflicts Are Returned as Server Errors

**Severity:** Medium

**Issue Description:** Dataset registration catches broad exceptions and can convert an intentional lifecycle `HTTPException` into a generic HTTP 500 response.

**Impact:** Users see an application/server failure instead of an actionable workflow conflict. API clients cannot reliably distinguish invalid state transitions from infrastructure failures.

**Relevant Code:** `apps/hej-api/app/api/routes/tasks.py`

## Verification Status

| Check | Result |
| --- | --- |
| Full backend test collection | Blocked because `tests/test_project_exports_route.py` imports a missing `_is_task_export_eligible` function. |
| Backend tests excluding that file | 118 passed and 1 failed; the remaining failure is an audit-log expectation mismatch. |
| Frontend type checking | Failed with four TypeScript contract errors involving `signalLabel` and `judgementSignal`. |
| Frontend tests | 99 passed and 1 failed because a call now includes an additional `itemStatus` field. |

These failures indicate contract drift and reduce confidence that the current automated test suite protects the workflow behavior described above.

## Recommended Remediation Order

1. Make annotation revisions immutable and define one canonical result representation.
2. Connect every AI suggestion to prediction/model provenance and record human disposition events.
3. Implement a strict release gate that validates the complete provenance chain.
4. Enforce roles, ownership, parent-child scope, and separation of duties on every mutation route.
5. Define and enforce an explicit task and item state machine, including task activation.
6. Make review, escalation, annotation submission, audit logging, and upload registration atomic.
7. Consolidate competing review APIs and align dashboard statistics with the state machine.
8. Repair the test and type-check baseline before relying on automated regression coverage.
