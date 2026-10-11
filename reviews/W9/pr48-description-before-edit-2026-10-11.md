## Summary

This PR implements the two-level disagreement workflow defined in Issue #40:

1. **Annotation-level disputes** resolve escalation or reviewer disagreement about one immutable annotation revision.
2. **Item-level candidate reconciliation** selects the authoritative result after multiple current annotations have been accepted through review or adjudication.

The implementation covers SCRUM-99, SCRUM-100, and SCRUM-101, including durable disagreement records, independent expert adjudication, the Dispute workspace, and automatic handoff from completed review to canonicalization or reconciliation.

## Workflow

```text
submit annotation revision
        |
        v
complete its independent review round
        |
        +-- approved -------------------------------+
        |                                           |
        +-- returned/rejected -> annotation rework  |
        |                                           |
        +-- mixed verdicts                          |
        |      +-- manual_review -> pending route   |
        |      +-- open_dispute -> formal dispute   |
        |                                           |
        +-- explicit escalation -> formal dispute   |
                                   |                |
                            accept / return / reject |
                                   |                |
                                   +----------------+
                                                    |
                                                    v
                                first pass and review requirements complete
                                          |                     |
                                          | one candidate       | multiple candidates
                                          v                     v
                                    canonicalized         reconciliation
                                                               |
                                           choose one / return / reject all
```

Review acceptance resolves one submission, not necessarily the whole item. The item reaches final resolution only after its required annotation first pass and all current annotation-level review/dispute work are complete.

## Review Outcome Integration

Independent review rounds are evaluated from the first effective number of distinct reviewer verdicts for the same annotation revision:

- Unanimous approval accepts the revision.
- Unanimous redo verdicts return or reject it through the review workflow.
- Mixed approval and redo verdicts create `ReviewDisagreementDB`.
- Explicit `escalate` stops the ordinary round and opens a formal annotation dispute.

The per-revision cross-review sample freezes the approval requirement and `disagreement_handling` policy used for that round.

For mixed completed rounds:

- `manual_review` leaves a durable `pending_route` case until an authorized user opens it with a justification.
- `open_dispute` creates the formal dispute atomically with the deciding review.

## Annotation-Level Disputes

### Scope

Every `AnnotationDisputeDB` row targets one exact `subject_annotation_id`. The parent item's `disputed` status is a coarse queue marker; the dispute row identifies the actual locked annotation revision.

The supported triggers are:

```text
reviewer_escalation
reviewer_verdict_conflict
```

### Lifecycle

The Dispute workspace presents one continuous three-stage read model:

```text
pending_route -> open -> resolved
```

- `pending_route`: a manual-review `ReviewDisagreementDB` exists without a formal dispute.
- `open`: an `AnnotationDisputeDB` has been created and awaits adjudication.
- `resolved`: the adjudication decision and its provenance have been recorded.

Formal opening locks and revalidates the item and subject revision, enforces one dispute per annotation revision, and links the exact triggering and contextual reviews. Ordinary review writes against the open subject return `409 Conflict`; unrelated annotation revisions retain their own review state.

### Evidence

`DisputeReviewEvidenceDB` freezes all applicable reviews from subject submission through dispute opening. Each link is classified as `trigger` or `context`.

The formal case records:

- Task, item, and exact annotation revision IDs.
- Optional source reviewer-disagreement ID.
- Trigger type and lifecycle status.
- Opening kind, actor, justification, and timestamp.
- Task-definition and resolved-policy snapshots.
- Final decision, adjudicator, justification, and timestamp.

### Decisions

All decisions require justification:

| Decision | Result |
| --- | --- |
| `accept` | Count the subject revision as accepted and continue item completion |
| `return` | Return the subject to its author for a new immutable revision |
| `reject` | Disqualify the subject from the accepted candidate set |

After adjudication, the service recomputes the entire item's aggregate status. Rejecting one annotation does not complete an unfinished first pass. Once the first pass is complete, zero accepted candidates produce `inconclusive`, one produces `canonicalized`, and multiple produce `reviewed` with an open reconciliation case.

## Item-Level Candidate Reconciliation

### Opening rule

`apply_completed_item_resolution()` handles the boundary between annotation-level completion and item-level resolution:

- A single accepted current candidate is marked authoritative directly.
- Multiple accepted current candidates open one `ItemReconciliationDB` case.
- Rejected annotation-dispute subjects are excluded from the candidate set.
- Reviewer corrections remain evidence and cannot become independent candidates.

The workflow does not compare candidate payloads for semantic equality. Multiple independently accepted candidates always require an explicit canonical choice.

### Frozen evidence

Opening a case atomically records:

- One `ReconciliationCandidateDB` link for each current accepted annotation revision.
- `ReconciliationAcceptanceEvidenceDB` links to ordinary review approvals or annotation-dispute Accept decisions.
- Candidate order, platform opening provenance/time, and task-definition snapshot.

Reconciliation is opened by the platform after the completion rules detect multiple accepted candidates. The reviewer or adjudicator who completed the last candidate remains acceptance evidence and is not misidentified as the case opener.

The item enters backend status `reviewed`, displayed as Reconciliation. New annotation, review, and annotation-dispute writes are blocked until the case is resolved.

### Decisions

All decisions require justification:

| Decision | Result |
| --- | --- |
| `choose_one` | Mark the selected existing candidate authoritative and set the item to `canonicalized` |
| `return` | Resolve the case, supersede the candidate round, and reopen the item as `pending` for new annotation and review |
| `reject_all` | Resolve without an authoritative annotation and set the item to `inconclusive` |

At most one annotation can be authoritative for an item.

## Permissions and Independence

- Dispute list/detail: `DISPUTE`.
- Open a pending manual-review disagreement: `DISPUTE`, with required routing justification.
- Final annotation-dispute decision: `ADJUDICATE`.
- Reconciliation list/detail/decision: `ADJUDICATE`.

Effective governed actions are aggregated across an account's role assignments; this PR does not alter the role-to-capability matrix.

Final decisions also enforce item-wide independence. A user who authored an annotation, reviewed the item, or opened one of its disputes cannot adjudicate the annotation dispute or reconcile the item's candidates. There is no role-based override for this conflict rule.

Open dispute and reconciliation lists apply the same conflict rule before presenting work. Pending disputes remain visible for routing, and resolved cases remain visible as read-only provenance.

## Justification Contract

Review decisions, dispute opening, dispute adjudication, and reconciliation decisions accept structured justifications of at most 2,000 characters. This limit is enforced consistently by the frontend inputs, Pydantic request schemas, and database columns. Requests exceeding the limit are rejected before persistence rather than truncated. The deprecated `review_notes` compatibility projection is separately bounded to its `VARCHAR(1000)` column; only that non-authoritative projection may be truncated. Review feedback remains a separate field with a 2,000-character limit.

## API Changes

### Annotation disputes

```http
GET /tasks/{task_id}/annotation-disputes?status={pending_route|open|resolved}
GET /tasks/{task_id}/annotation-disputes/{case_id}
POST /tasks/{task_id}/annotation-disputes/{disagreement_id}/open
POST /tasks/{task_id}/annotation-disputes/{dispute_id}/decision
```

Open payload:

```json
{
  "justification": "Why this held disagreement requires formal adjudication"
}
```

Decision payload:

```json
{
  "decision": "accept | return | reject",
  "justification": "Independent adjudication reasoning"
}
```

### Candidate reconciliation

```http
GET /tasks/{task_id}/item-reconciliations?status={open|resolved}
GET /tasks/{task_id}/item-reconciliations/{reconciliation_id}
POST /tasks/{task_id}/item-reconciliations/{reconciliation_id}/decision
```

Decision payloads:

```json
{
  "decision": "choose_one",
  "selected_annotation_id": "ann_...",
  "justification": "Why this candidate is authoritative"
}
```

```json
{
  "decision": "return | reject_all",
  "justification": "Why the current candidate round cannot be accepted"
}
```

## Database Changes

| Table | Purpose |
| --- | --- |
| `review_disagreements` | Durable result of a completed mixed reviewer round |
| `annotation_disputes` | Formal case for one immutable annotation revision and its adjudication |
| `dispute_review_evidence` | Frozen trigger/context review links for the formal dispute |
| `item_reconciliations` | Item-level canonical selection case across accepted candidates |
| `reconciliation_candidates` | Frozen candidate annotation links and ordering |
| `reconciliation_acceptance_evidence` | Frozen review-approval or dispute-accept evidence for each candidate |

Key invariants include:

- One reviewer disagreement per annotation revision.
- One annotation dispute per subject revision.
- One formal dispute per source disagreement.
- One open reconciliation per item.
- Automatically opened reconciliations use `opened_by_kind = platform` and a null `opened_by`.
- Reconciliation decisions are limited to `choose_one`, `return`, and `reject_all`.
- Active review, dispute, and reconciliation justification columns use the same 2,000-character limit.
- The deprecated `review_notes` compatibility projection remains bounded to its 1,000-character column.
- Unique candidate and evidence links within each reconciliation.
- Exactly one evidence source type per reconciliation acceptance record.

## Frontend

### Dispute workspace

The dispute list supports pending, open, and resolved cases. The detail sheet displays:

- Item information and source preview.
- One fixed subject annotation revision.
- Labels, definitions, output schema, and task context.
- Frozen reviewer verdicts, justifications, feedback, and timestamps.
- Routing provenance, adjudication provenance, and decision controls.

Pending cases expose the formal-open action. Open cases expose `accept`, `return`, and `reject`.

### Reconciliation workspace

The Reconciliation navigation entry sits beside Dispute. Its list follows the review/dispute visual pattern. The detail sheet displays:

- Item information and source preview.
- Candidate tabs containing each annotation payload.
- Candidate author and acceptance evidence.
- Task-definition context.
- `choose_one`, `return`, and `reject_all` controls.

## Provenance, History, and Export

The workflow records separate immutable facts for disagreement detection, formal opening, adjudication, and reconciliation. Audit descriptions use short fixed summaries; complete justifications remain in the structured domain row and `new_values.justification`.

Task history operations include:

```text
annotation_dispute_opened
annotation_dispute_adjudicated
item_reconciled
```

Resolved cases remain available through their list/detail endpoints. Export resolution uses the authoritative annotation for canonicalized items and the latest applicable rejecting reconciliation/dispute decision for inconclusive items, including decision source, actor, reason, and timestamp.

New dispute and reconciliation paths do not write `expert_send_back`. That value remains supported only when reading or repairing historical workflow data; its final schema and compatibility removal are deferred to SCRUM-121/W10.

## Concurrency and Failure Behaviour

- Dispute opening locks and revalidates the item and subject annotation; final decision paths lock and revalidate the case and item.
- Active review, dispute-opening, dispute-adjudication, and reconciliation domain writes commit atomically with their history rows; a history failure rolls back the decision.
- Uniqueness constraints prevent duplicate disputes and duplicate open reconciliation cases.
- A stale review against an open dispute subject returns `409 Conflict`.
- A stale second decision against a resolved dispute or reconciliation returns `409 Conflict`.
- A candidate selected by `choose_one` must belong to the frozen reconciliation case.
- Task lifecycle and authorization checks run before all workflow writes.

## Verification

Coverage includes:

- Manual and automatic dispute opening.
- Explicit reviewer escalation.
- Version-scoped evidence windows.
- Duplicate/concurrent opening refusal.
- Review locking while a dispute is open.
- Accept, Return, and Reject status recomputation.
- First-pass completion after rejected annotations.
- Single-candidate canonicalization.
- Multi-candidate reconciliation opening and frozen evidence.
- Choose-one, Return, and Reject-all outcomes.
- Adjudicator conflict enforcement.
- Dispute and reconciliation list/detail screens.
- Evaluation-harness tracking by item and submission.
- Export resolution provenance.

Verification results:

- Full PostgreSQL backend regression: 1,373 passed, 9 skipped, and 207 subtests passed.
- Focused PostgreSQL history, rollback, and 2,000/2,001-character boundary coverage: 12 passed.
- Focused SQLite coverage for the same cases: 12 passed.
- Full frontend regression: 44 files and 430 tests passed.
- TypeScript type checking: passed.
- Focused frontend ESLint: 0 errors; 3 pre-existing warnings remain.
- Python compilation: passed.
- `git diff --check`: passed.

## Related Work

- SCRUM-99: annotation-level adjudication and durable dispute provenance.
- SCRUM-100: dispute list/detail workspace and review evidence.
- SCRUM-101: disagreement routing and lifecycle integration.
- SCRUM-121/W10: deferred removal of legacy `expert_send_back` compatibility.

## After Merging

This PR deliberately does not add migrations under the SCRUM-94 development-database strategy. The reconciliation schema changes require development databases to be reset after merge. From `apps/hej-api`, run:

```bash
uv run python init_data.py --reset
```

Run the command once for each configured SQLite or PostgreSQL development database that will be used with the merged code.


