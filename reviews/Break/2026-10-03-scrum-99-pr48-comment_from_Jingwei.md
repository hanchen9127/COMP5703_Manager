Thanks, Yi. This is a careful write-up, and it's right that the dispute should record exactly which annotation version and which reviews caused it. I've reviewed both halves, the design in the description and the prototype code. I'd like to agree the design before you rebase, because the code will change with it.

## Design: four points to settle first

**1. The three outcomes go against the client's R2-1 wording, the SCRUM-99 ticket and #47's contract.**

| Outcome | R2-1 (client, 24/09) | This PR |
| --- | --- | --- |
| Accept | "accept one of the existing judgements as **the resolved answer**" | resolves the annotation's review only; "does not by itself select an authoritative candidate" |
| Return | "return **the item** ... to the normal open workflow for new annotation/review" | returns only the subject annotation |
| Reject | "does not proceed automatically to another review stage", "**Only a Return reopens the item**", "an item may be resolved as genuinely ambiguous/unresolved" | "A Reject must reopen work" |

#47 already builds on the item reading: Accept calls `mark_authoritative(cause=ADJUDICATION_ACCEPT)`, Return clears the marker through `reopen_task_item` (merged with #46), and Reject marks nothing. If you think annotation scope is better, it contradicts the client's explicit wording, so it needs the client's OK on #40, and Hanchen's, before we build it.

**2. I'd keep the outcome per item and make the evidence per annotation.** I think this is the part of your design worth keeping. The dispute records the subject annotation version(s) and the triggering review ids when it opens, as your acceptance criteria say. The desk shows those first, and the review window and #47's immutable versions keep stale reviews out. The expert's decision stays item-level, as R2-1 describes. That answers your concern about unrelated annotations without changing what the outcomes mean.

**3. "Candidate reconciliation" would be a new, unplanned stage.** Under this design, two independent annotations that disagree never become a dispute. R2-8 says the opposite for Dual sign-off: "If those judgements disagree, the item enters dispute." The reconciliation that would replace it is out of scope and has no ticket, and the project ends on 1 November. So disagreeing answers would have nowhere to go before the demo.

**4. The review-side contract changes the review rules, and that needs its own ticket.** It adds `request_minor_revision`, removes `reject` under Arbitration-ready, and adds a "review round complete" signal. That touches #45's `review_refusal` (ADR 007), Parth's SCRUM-51 and SCRUM-109, and project policy. SCRUM-101's Jira definition is simpler: "one accepts while the other returns or rejects". I'd keep SCRUM-99 to the adjudication itself and raise the review contract separately.

**Missing from both the description and the code:** adjudicator independence. R2-8: "An arbitrator should not arbitrate a dispute involving work that they annotated or reviewed themselves." It is a SCRUM-99 criterion, and issue 7 (Critical) closes only when SCRUM-99 is done. `item_author_ids` (any round) and the reviewers of the item give you the set; #45's wording can be reused.

## Code: what carries over whatever the design

The prototype is item-scoped and predates #45, #46 and #47, and it conflicts with `main` now. These will apply to the rewrite too:

1. **Reject leaves the item stuck.** `_map_escalation_decision_to_task_item_status` maps `reject` to `rejected`, which is not terminal, not exportable, not offered in any queue, and blocks task completion forever. An "unresolved" item needs a defined state, export marking and a way out: the owner's reopen.
2. **No item lock.** `decide_escalation` loads the item and the open escalation without `for_update=True`. Two experts deciding at once both get 200, and the second silently overwrites the first while both audit rows remain. Lock, then re-read the escalation. `tests/test_review_lock_postgres.py` has a two-thread pattern.
3. **The evidence endpoint is too open.** `GET /tasks/{id}/escalations/{esc_id}` checks only task access, so any annotator on the task can read every reviewer's verdict, justification and feedback. Gate it on ADJUDICATE, like the queue and the decision.
4. **PostgreSQL limits.**
   - `decision_note` goes into the history `description`, a 255-character column, so a longer reason is a 500 on PostgreSQL. SQLite stores it, so the tests pass.
   - `EscalationDecisionRequest.note` has no `max_length`, but the column is `String(2000)`.

   Put the reason in `new_values` with a short fixed description, as `record_item_reopened` does, and add `Field(max_length=2000)`. Both were review points on #46.
5. **Stale evidence.** The detail attaches every review of an annotation to its current content, with no `submitted_at` window. Your description specifies the window; rebasing on #47 (a new id per resubmission) mostly fixes it.
6. **"Aliases" aren't really accepted.** `finalize` and `send_back` are documented as accepted, but an old client's `send_back` with no note now gets 422, and `finalize` with no `annotation_id` gets 409 or 400. Either keep them working until SCRUM-103 switches the desk, or say they are removed.
7. **Return re-forced after Reject.** The audit-log fallback in `task_item_status_resolution.py` takes the latest `return`/`send_back` even when a later decision superseded it. A returned item that is re-escalated and then rejected gets forced back to `expert_send_back`.

<details>
<summary>Smaller points, and the web desk (which overlaps my SCRUM-103)</summary>

- `task-dispute-desk.tsx`:
  - It loads evidence by `escalation_id` but posts the decision to the item-scoped route, which acts on whichever escalation is open at submit time. If the dispute was resolved and re-routed in between, the decision lands on evidence the expert never saw. Send the escalation id and have the server check it.
  - `openDispute` and `closeDispute` never clear `feedback`, so one dispute's error appears in the next.
  - `submitDecision` calls `closeDispute()` when the request finishes, which closes whichever sheet is open by then and drops its draft.
  - `SubmissionPreview` passes the raw `media_url`, while `SourcePreview` resolves it with `resolveMediaUrl`. Bounding-box overlays break when the URL is relative.
- The legacy rows keep `finalize`/`send_back` with no `resolution_outcome`. A one-time update in `migrate_db_schema()` and one `SEND_BACK_DECISIONS` constant would save every reader from handling both spellings. Export currently emits both vocabularies.
- `task-finalized-desk.tsx:147` still tells users to use "the `finalize` decision".
- `tasks.py:806` uses `getattr(..., None)` on mapped columns only so a `SimpleNamespace` fixture passes. Give the fixture the attributes instead.
- Duplication:
  - `_escalation_resolution_outcome`, `_map_escalation_decision_to_task_item_status` and the `if decision == "return"` branch in `decide_escalation` each encode the same mapping.
  - `resolveMediaUrl` copies the helper in `task-item-workspace-sheet.tsx`.
  - `get_escalation_detail` re-implements `_current_annotations` and repeats the user-label fallback three times.

</details>

## Suggested next step

Agree the design (item outcome, annotation evidence) here or on #40, then rebase on `main` and #47. Keep the PR to SCRUM-99 and SCRUM-100 on the backend, with independence and the lock; SCRUM-101 and the desk follow. Your next ADR is **010**, since #47 takes 009.
