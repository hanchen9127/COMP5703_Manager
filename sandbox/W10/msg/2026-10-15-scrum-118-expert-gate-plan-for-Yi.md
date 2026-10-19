# SCRUM-118 (G2) — the Expert Gate: a commit-by-commit plan

For Yi, from Hanchen · 2026-10-15 · checked against `main` at `c3ac7a8`

> **Superseded later on 2026-10-15** by Yi's own design (`SCRUM-118 Expert Gate design and SCRUM-107
> questions.md`) and Hanchen's reply (`2026-10-15-scrum-118-107-reply-for-Yi.md`). Where they differ,
> those files stand: `trigger_type` instead of `kind`, no new authoritative cause, and SCRUM-118 is now
> full stack. The R2-7 check of commit 7 below was kept.

You decided to build the gate on the reconciliation screen. This plan turns that decision into commits.
Line numbers are from `main` today and will move. **If you find something this plan misses, add it
in this PR** (see *If you find a gap* at the end); it is a starting point, not a contract.

---

## 1. The design in one page

**The rule (client answer R2-8).** Under `expert_gate_required`, an item does not become canonical
until an independent expert has confirmed the answer that becomes canonical. R2-7 applies under every
posture: no item canonicalises on AI output alone.

**The gate is a one-candidate reconciliation.** When an expert-gate item meets its review
requirements, the platform opens an item reconciliation for it, the same way it already does for
several accepted answers, but with one candidate. The expert decides it on the existing screen and
route:

| Reconciliation decision | Meaning at the gate | Item afterwards |
| --- | --- | --- |
| `choose_one` | Confirm: the expert confirms this answer | `canonicalized`, marked authoritative by the expert |
| `return` | Send back for rework (existing reopen path) | Back to annotation |
| `reject_all` | No acceptable answer | `unresolved` (terminal), as for any reconciliation |

This approach reuses five things that are already in place:
- **Permission:** the route already requires `ADJUDICATE` (`_task_for_adjudicator`, [reconciliations.py](../../../../hej/apps/hej-api/app/api/routes/reconciliations.py)).
- **Independence:** the decision route already refuses anyone in `adjudication_conflict_item_ids`, which covers annotated, reviewed, routed or opened a dispute, with no administrator override.
- **Queue:** `GET /tasks/{id}/item-reconciliations` already lists cases with the same conflict filter, so it serves as the "sibling queue" the ticket asks for.
- **Item status:** a case keeps the item at `reviewed`, which is not terminal and not export-eligible. The task stays incomplete, and the release gate (SCRUM-105) refuses the item. **No new item status is needed.**
- **History:** `item_reconciliation_opened` and `item_reconciled` are already recorded, with who and when.

**What counts as the expert's confirmation.** The rule is about authority, not about passing through a step:

1. An independent expert's **Accept in a dispute on that exact version** (the escalate path) means the
   item never enters the gate: it canonicalises as it does today. We agreed on 2026-10-15 that an
   expert who already accepted the answer has confirmed it. Asking twice would mean the same authority
   confirms the same answer twice.
2. An expert's **`choose_one` in a reconciliation of several answers** is already an independent
   expert decision, so it is not held a second time.
3. Otherwise the item is held in a gate case until rule 1 or rule 2 applies to it.

Return and Reject in a dispute never count as confirmation: the item goes back to annotation or ends
`unresolved`. A Return produces a new version, and that version needs its own review and confirmation.

---

## 2. Before you start (half an hour)

- [ ] Rebase on `main`, then run `init_data.py --reset`. The `kind` column in commit 2 needs the reset as well (SCRUM-94 rule).
- [ ] **F1 (PR #70, Parth) is still open** and edits `item_reconciliation_service.py`, `reconciliations.py`, `review_actions.py` and `annotation_dispute_service.py`, the same files as commits 3–5. Ask Parth when he expects to merge it.
  - If #70 merges first, rebase onto it and include the case's `kind` in its reconciliation events.
  - If you merge first, tell Parth which event fields you added. **Do not ask him to add anything to SCRUM-98** (no new scope on an in-progress ticket); any field the gate needs is SCRUM-118's to add.
- [ ] **SCRUM-124 (Dishank, To Do)** will let an expert accept a reviewer's correction. Its acceptance evidence has to find "the dispute that accepted the correction". Write the confirmation helper in commit 3 so Dishank can extend it rather than duplicate it, and tell him its name.
- [ ] **ADR number:** 015 and 016 are taken by #70 and #73, and #63 adds a second `adr013`. Use **017**, and check again just before you merge.
- [ ] Read [`project_policy_rules.py`](../../../../hej/apps/hej-api/app/services/project_policy_rules.py) `assert_project_policy_editable`: the posture is locked once governed work exists, so a task never changes posture halfway. You do not need to handle that case.

---

## 3. Commits

### Commit 1 — `docs(adr): the Expert Gate is a one-candidate item reconciliation (SCRUM-118)`

`hej/docs/adr/adr017_expert_gate_is_a_one_candidate_reconciliation.md`, using the ADR 011–014 format.

- **Context:** R2-8 (the gate on every item, cross-review defaulting to 0, the expert independent of the work) and R2-7 (no AI-only canonical). Before this change the flag was stored and resolved, and the only code reading it was the task display.
- **Decision:** section 1 above. Cover the three decisions and what each means at the gate, what counts as confirmation, why there is no new item status, and why the authoritative marker gets its own cause (commit 5).
- **Rejected alternatives:**
  - A separate confirmation table and screen: they duplicate reconciliation's permission, independence, queue, history and terminal states.
  - A new `awaiting_expert` item status: it would need web status mapping, export and queue changes, and `reviewed` already says "an expert decision is pending".
  - Requiring confirmation after a dispute Accept: the same authority would act twice.
- **Seams:** SCRUM-107 (the copy of the confirmation screen, the gate shown on the project and the item), SCRUM-105 (the release refusal reason), SCRUM-124 (the evidence helper), F1 (events).

Start with the ADR so the reviewer reads the design before the code.

### Commit 2 — `feat(db): item reconciliations record why they were opened (SCRUM-118)`

[`db_models.py`](../../../../hej/apps/hej-api/app/models/db_models.py) `ItemReconciliationDB`, plus `migrate_db_schema()` in [`database.py`](../../../../hej/apps/hej-api/app/core/database.py).

- New column `kind`: `String(50)`, not null, server default `'multiple_answers'`. Add a check constraint `kind IN ('multiple_answers', 'expert_gate')`.
- In `migrate_db_schema()`, add the column with the default so existing rows read as `multiple_answers`. Follow how `expert_gate_required` was added (around line 212), including the comment about why the default matters.
- Add `kind` to the list and detail read schemas (`ItemReconciliationDetailRead` and the list row). The web can then tell a gate case from a multiple-answer case, which SCRUM-107 needs.
- Tests: a new case defaults to `multiple_answers`; an unknown kind is refused; the migration adds the column to a database created without it, the same way the existing migration tests do.

### Commit 3 — `feat(workflow): hold an expert-gate item until an expert has confirmed its answer (SCRUM-118)`

The aggregate rule. Status is decided in one place, so the gate goes there:
[`review_policy_enforcement.py`](../../../../hej/apps/hej-api/app/services/review_policy_enforcement.py) `item_status_after_accept`.

- New helper, for example `expert_confirmed_annotation_ids(db, annotation_ids) -> set[str]`: the versions that carry a resolved dispute with `adjudicate_decision == "accept"` on **that exact** `subject_annotation_id`. `_acceptance_evidence` in [`item_reconciliation_service.py`](../../../../hej/apps/hej-api/app/services/item_reconciliation_service.py) already runs the same query, so share it rather than write it twice. This is the helper SCRUM-124 extends later.
- `item_status_after_accept` has two places that return `"canonicalized"` for one answer (around lines 440 and 450). In both, when `resolved.expert_gate_required` is set and the single remaining answer is **not** in the helper's result, return `"reviewed"` instead.
- The multi-answer branch (`"reviewed" if len(states) > 1`) does not change. Its reconciliation is already an expert decision.
- **Read the resolved flag only through `resolve_for_task`** (the ticket says so). Never read it from the tables.
- Tests, at service level and each failing on `main`:
  - an expert-gate item with one approved answer → `reviewed`;
  - the same item whose answer an independent expert accepted in a dispute → `canonicalized`;
  - standard and dual sign-off postures → unchanged.

### Commit 4 — `feat(workflow): open a gate case for a held item (SCRUM-118)`

[`item_reconciliation_service.py`](../../../../hej/apps/hej-api/app/services/item_reconciliation_service.py).

- `open_item_reconciliation(..., kind="multiple_answers")`: allow exactly one candidate when `kind == "expert_gate"`, and keep the "at least two" error for `multiple_answers`. Acceptance evidence is frozen exactly as it is today, so the case shows the reviewer approvals the expert is confirming.
- `apply_completed_item_resolution`: when the item is `reviewed` and has one candidate, open the case with `kind="expert_gate"`; with several candidates, use `multiple_answers`. Do not decide the kind from the policy a second time: commit 3 already decided it, and one candidate in `reviewed` can only be a gate case.
- History summary for a gate case: "Platform held the item at the Expert Gate: an expert must confirm its answer", with `new_values` including `kind`.
- **Check the other two callers of `item_status_after_accept`.** They write the status without calling `apply_completed_item_resolution`:
  - `draft_service.py:603`, on submission;
  - `task_item_status_resolution.py:529`, on a resubmission after a Return.

  If either can produce `reviewed` (or `canonicalized`), the item gets a status with no case or no authoritative marker, and it is stuck. Prove with a test that they cannot, or send them through `apply_completed_item_resolution`. The same gap exists today for several answers, so fixing it here is in scope.
- Route tests through `POST /review`:
  - a reviewer Accept under the gate returns `next_ui == "reconciliation"`; the item is `reviewed`; an open `expert_gate` case holds one candidate and its approval evidence; no annotation is authoritative;
  - the task is not complete;
  - the export refuses the item (`is_task_item_export_eligible`).

### Commit 5 — `feat(api): an independent expert confirms, returns or rejects a held item (SCRUM-118)`

[`reconciliations.py`](../../../../hej/apps/hej-api/app/api/routes/reconciliations.py) and `resolve_item_reconciliation`.

- New authoritative cause `EXPERT_GATE_CONFIRM = "expert_gate_confirm"` in [`annotation_versions.py`](../../../../hej/apps/hej-api/app/services/annotation_versions.py), added to `AUTHORITATIVE_CAUSES`. `choose_one` on an `expert_gate` case marks the answer with this cause and `actor_id` set to the expert. The marker then records why the answer is authoritative, and H4's export and F5's timeline can tell a gate confirmation from a choice between answers.
- On a gate case, `selected_annotation_id` may be omitted and defaults to the one candidate. Any other id → 422, as today.
- `return` and `reject_all` work unchanged. Check that `return` goes to the author through `reopen_task_item`. If the expert should be able to send the item to a new annotator with a context cutoff, as an expert Return in a dispute can (decided 2026-10-14), say so in the PR. That is a reasonable addition here but not required.
- The 403 message currently reads "cannot reconcile its candidate annotations". Make it say "confirm" for a gate case.
- Route tests, each failing on `main`:
  - an unrelated expert's `choose_one` → `canonicalized`; the answer is authoritative with cause `expert_gate_confirm`, by that expert;
  - the item's annotator, its reviewer, and an administrator who annotated it each get 403 (no override);
  - `return` → back to annotation, and the new version needs review and confirmation again;
  - `reject_all` → `unresolved`;
  - the case is listed for the unrelated expert and hidden from the reviewer (`GET .../item-reconciliations`).

### Commit 6 — `test(workflow): the escalate path and several answers pass the gate once (SCRUM-118)`

Tests only, unless one exposes a bug. They pin rules 1 and 2 of section 1.

- A reviewer escalates instead of approving → an independent expert Accepts in the dispute → the item is `canonicalized`, cause `adjudication_accept`, and **no gate case is opened**.
- The same item, but the expert Returns → rework → reviewer Accept → a gate case is opened, because the new version has no confirmation.
- An expert-gate task with two annotators: both answers approved → one `multiple_answers` case → the expert's `choose_one` canonicalises the item, and no second gate case follows.
- Two annotators, one answer accepted by the expert in a dispute and the other approved by a reviewer → a reconciliation of the two. Accepting one answer does not confirm the other.

### Commit 7 — `feat(workflow): no item canonicalises on AI output alone, under any posture (SCRUM-118)`

R2-7, enforced at the point of canonicalisation. `mark_authoritative` in
[`annotation_versions.py`](../../../../hej/apps/hej-api/app/services/annotation_versions.py) is the only place that sets `is_authoritative`, so the check goes there.

- When `annotation.author_role == AI_MODEL_ROLE`, require a human decision on **that version**:
  - at least one approver in its round (`approvers_of`, [submission_rules.py](../../../../hej/apps/hej-api/app/services/submission_rules.py)), or
  - a cause that is a person's decision (`adjudication_accept`, `reconciliation_choose`, `expert_gate_confirm`) with `actor_id` set.

  Otherwise refuse with 409: "An AI answer cannot become authoritative until a person has reviewed it".
- The refusal has to stop the item becoming `canonicalized` as well. Check that each caller raises inside the same transaction, so that status and marker roll back together.
- Tests, each failing on `main`. Build the state directly, because the current workflow cannot reach it, and that is the point of the check:
  - an AI-only item with no review, pushed to `canonicalized` through `apply_completed_item_resolution` → 409, nothing marked;
  - an AI first pass approved by a reviewer canonicalises under the standard posture, and is held at the gate under expert gate;
  - an AI-only `choose_one` by an expert is allowed.

### Commit 8 — `docs: the Expert Gate in the workflow and API references (SCRUM-118)`

- [`workflow_states.md`](../../../../hej/docs/design/product/workflow_states.md): `reviewed` now also means "held at the Expert Gate"; add the three gate decisions and the escalate exception. The existing lines 158–159 and 196 describe `reviewed` as multiple answers only.
- [`api_surfaces.md`](../../../../hej/docs/design/backend/api_surfaces.md): the reconciliation list, detail and decision with `kind`, the optional `selected_annotation_id` on a gate case, the new 403 text, and the AI refusal.
- [`db_schema_blueprint.md`](../../../../hej/docs/design/database/db_schema_blueprint.md) and [`domain_model.md`](../../../../hej/docs/design/database/domain_model.md): the `kind` column and the new authoritative cause.
- Change ADR 017 from Proposed to Accepted.

### Commit 9 — `test(evaluation): casebook cases and a seeded project for the Expert Gate (SCRUM-118)`

The ticket asks for "a case for the Expert Gate and one for the AI invariant" (SCRUM-71).

- [`evaluation/cases/`](../../../../hej/apps/hej-api/evaluation/cases): the harness already supports `governance_model`, `policy` and `reconcile` steps. Pick case IDs that do not clash: the cases run to `EV-104`, and #73 may be adding more.
  1. Expert gate: accept → the item is `reviewed` → an unrelated expert reconciles with `choose_one` → `canonicalized`, authoritative by the expert.
  2. Expert gate: escalate → expert Accept → `canonicalized`, with no gate case.
  3. AI invariant: the AI first pass is never final without a person. Check whether `EV-002` or `EV-010` already covers this before adding a case. If one does, add a `[[step]] expect` to it instead.
- Re-run the harness and update `baseline.json` in the same commit.
- Optional but useful for review and the demo: add an Expert Gate project to [`seed_test_projects.py`](../../../../hej/apps/hej-api/seed_test_projects.py) with the v2 preset, and make sure the cast seeded by SCRUM-123 includes an expert who did not work on its items. `ProjectSpec` has no `expert_gate_required` field, so creating it without the preset is refused by validation. Pass `policy_template_ref="project_policy_expert_gate_v2"`.

---

## 4. The ticket's criteria, mapped to commits

| SCRUM-118 criterion | Commit |
| --- | --- |
| Held after its approvals until an expert confirms; the confirmation is its own record, with who and when | 3, 4, 5 (the case row records `decided_by` and `decided_at`, and the marker records its cause) |
| Confirmed through an `ADJUDICATE` action; items awaiting confirmation listed under the independence rule | 5 (the existing route and list) |
| No expert confirms work they annotated or reviewed, administrators included, no override | 5 (the existing `adjudication_conflict_item_ids`, now tested for the gate) |
| No AI-only canonicalisation under any posture, checked at canonicalisation | 7 |
| Without the flag, nothing changes | 3, 4 (posture tests) |
| The listed tests | 3–7, plus 6 for the escalate path the ticket does not mention |
| SCRUM-71: one case each for the gate and the AI invariant | 9 |

The PR description should say that **the escalate path counts as confirmation** (team decision, 2026-10-15), since the ticket does not mention it.

---

## 5. Out of scope, and whose it is

- **The screen's wording** ("Confirm" instead of "Choose", one candidate), the gate shown on the project and on each item, and the web test: SCRUM-107 (yours, next). If the current reconciliation screen **breaks** with one candidate, fix only that here. A screen that just reads oddly is SCRUM-107's.
- **The release refusal reason:** SCRUM-105 (H3, unassigned) refuses a held item as "unreviewed". Its owner may want to call it "awaiting expert confirmation", which is now easy to tell from the case's `kind`. Leave a comment on SCRUM-105 rather than changing it.
- **Arbitration-ready** (`adjudication_mandatory_on_dispute`): SCRUM-107.

---

## 6. If you find a gap

Add it to this PR when it is needed for the gate or the AI invariant to hold, even if this plan does not
mention it. Likely candidates:

- another path that sets `canonicalized` or `is_authoritative` without going through `item_status_after_accept` or `mark_authoritative`. Search for both; the unregistered `decide_escalation` helper in `review_actions.py` is one, so confirm no route reaches it;
- a read model or work queue that assumes a reconciliation has at least two candidates;
- a seed or casebook case that breaks because an expert-gate project now holds its items.

Rules for gaps that touch other people's work:
- **If the gap is in a ticket that is in progress** (F1 #70, H4 #66, H1 #65, F2 #63): do the part the gate needs here, in SCRUM-118, and tell the owner. Do not ask them to add scope.
- **If it is beyond 2u, or changes a decision above:** message me before you build it.
