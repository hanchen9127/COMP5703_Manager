# SCRUM-118 Expert Gate design and SCRUM-107 questions

Oct 15, 2026 · @Yi

## Summary

The SCRUM-118 (G2) design is settled: the Expert Gate reuses item reconciliation instead of adding a new record, queue or screen. Working through it showed that the two tickets are split at the wrong line, and that SCRUM-107's arbitration-ready criterion is already met by every posture on `main`.

Three things need your call:

1. **Approve the scope change.** SCRUM-118 becomes item-level and full stack, and is no longer backend only. SCRUM-107 becomes dispute- and project-level, with no dependency on SCRUM-118. They ship as two PRs, and the Jira descriptions are updated to match.
2. **Accept that no new R2-7 check is added.** The AI review rule already holds on every path, and three casebook cases guard it. The SCRUM-118 PR will say so under *Decisions to review*.
3. **Choose how SCRUM-107 treats arbitration-ready**: option (a), (b) or (c) below. Option (b) may need the client.

The design was checked against `main` at `c3ac7a8`.

## SCRUM-118: the Expert Gate reuses item reconciliation

Under `expert_gate_required`, an item whose one remaining answer has not been accepted by an independent expert does not canonicalise. It opens a reconciliation case for that answer instead, and the expert confirms, returns or rejects it there.

&#91;embedded content: Expert Gate flow · one hold, three expert decisions\]

Without `expert_gate_required`, a single accepted answer canonicalises exactly as it does today; only the highlighted gate case is new.

**Why reconciliation.** A reconciliation decision already has everything the client's R2-8 asks of a gate confirmation:

- it needs `ADJUDICATE`;
- it refuses anyone who annotated, reviewed or routed the item, administrators included (`adjudication_conflict_item_ids`);
- it is its own record, with justification, decider and time.

Its three decisions already cover the gate:

| Decision | At the gate it means | Result |
| --- | --- | --- |
| `choose_one` | Confirm the answer | `canonicalized`, cause `reconciliation_choose` |
| `return` | Send the item back | Reopened for a new round |
| `reject_all` | Refuse the answer | `unresolved` |

So an expert can refuse at the gate, which our R2-8 question argued a gate must allow, and the refusal already has a defined path.

**When the gate holds an item.** On `main`, three paths make an item canonical, and each records a cause:

| Cause on `main` | What happened | Under the gate |
| --- | --- | --- |
| `canonical_rule` | The platform canonicalised the only accepted answer; no expert involved | **Held:** opens a gate case |
| `adjudication_accept` | An expert accepted this exact answer in a dispute, and it is the only one left | Canonicalises directly: the expert has confirmed it |
| `reconciliation_choose` | An expert chose between several accepted answers | Unchanged: the choice is the confirmation |

A dispute Accept does not choose between answers. With several accepted answers, reconciliation opens as today, whichever way each was accepted.

**What changes in the model:**

- **`trigger_type` on `ItemReconciliationDB`**, set when the case opens and never changed. Values:
  - `expert_confirmation_required`: one answer, held at the gate;
  - `multiple_candidates`: today's case.

  The name follows `AnnotationDisputeDB.trigger_type`. `opened_by` was not used because it already holds the opener's user id.
- **No `expert_confirmed` column.** Whether an answer is expert-confirmed is derived from its dispute record: `SubmissionReviewState.adjudication_decision == "accept"`. That record already holds the decider and time.
  - A subject has at most one dispute.
  - A resubmission is a new revision with no dispute.
  - A reopen supersedes every current answer.

  So a confirmation never carries into a later round, and nothing has to be reset.
- **A single-candidate case.** `open_item_reconciliation` accepts one candidate for `expert_confirmation_required` only. It still needs at least two for `multiple_candidates`.
- **`expert_gate_required` becomes enforced.** It joins `ENFORCED_POLICY_VALUES`, so every screen that labels a policy value enforced or recorded follows.

**Scope limits:**

- **`unresolved` items are not gated.** On `main`, an item becomes `unresolved` only by an expert's decision: every answer rejected in disputes, or `reject_all`. There is no answer left to confirm.
- **The switch is `expert_gate_required`**, read through `resolve_for_task`. ADR-001 and `validate_project_policy_for_governance` keep it in step with `governance_model = expert_gate`. The superseded `_v1` preset can no longer be selected, so no project is labelled Expert Gate with the flag off.
- **Names stay as they are:** the Reconciliation tab, the `Reconciliation` status label (stored `reviewed`) and every backend name. Renaming was set aside:
  - "Adjudication" already names the dispute queue;
  - "Arbitration" names the dispute view;
  - "Final decision" does not say an expert decides;
  - "Expert decision" does not say what the step is.

  The page and the item show the case's `trigger_type` instead.
- **Documentation in the same PR:** an ADR, because a reconciliation record now also means a gate confirmation, plus `workflow_states.md`, `api_surfaces.md` and `db_schema_blueprint.md`. The new column follows the reset strategy, with no migration.
- **Without the gate, nothing changes.**

SCRUM-105 (H3, release gate) should treat an item held at the gate as not canonical, so it is refused as unreviewed. SCRUM-118 needs nothing from it, but the H3 owner should know about the new `reviewed` hold.

## R2-7: no new runtime check for the AI review rule

SCRUM-118 does not add the R2-7 check in its criterion 4, because no path on `main` can canonicalise an AI answer that no person has reviewed. R2-7 ("Under no circumstances can the AI first pass become the canonical answer without being reviewed by humans") is a separate rule from the Expert Gate: it holds under every posture and never reads `expert_gate_required`.

**Why it already holds.** Only two calls on `main` mark an answer authoritative, both in `item_reconciliation_service.py`:

- **The completion rule.** It needs the required approvals, which are 1–10 by database constraint, and only people review.
- **`choose_one`.** It takes only frozen candidates, each of which has passed review or a dispute.

The other routes are closed too:

- a dispute opens only from a reviewer's escalation or a verdict conflict;
- the legacy escalation writes return 410;
- there is no administrator override.

The rule is guarded at workflow level by three casebook cases tagged to G2 and R2-7 (PR #71):

- EV-002: the AI's first pass waits for a person;
- EV-010: a confidently wrong AI answer is not finalised;
- EV-081: a low-confidence AI answer waits for review.

**What is not done as written:**

- criterion 4's "checked … not only by the current workflow's shape";
- its test "an item with only an AI annotation never canonicalises", failing on the old behaviour.

No such test can fail on `main`, because the old behaviour already never canonicalises an unreviewed AI answer.

**The option set aside:** a roughly ten-line check in `mark_authoritative` with a unit test.

**Condition:** if any change, this PR's gate case included, adds a canonicalisation path that skips human review, this is reopened.

## Proposed scope change: split by level, two PRs

SCRUM-118 should own everything about the item-level gate, front end included. SCRUM-107 should keep only dispute- and project-level posture work, which does not depend on SCRUM-118.

Two things drive this:

- **SCRUM-118 cannot be backend only.** The gate's screen is now the Reconciliation page, and that page has to:
  - show the case's `trigger_type`;
  - take a single-candidate case, where today it lays out several answers as tabs;
  - mark an item that waits at the gate.

  Without these, a merged SCRUM-118 holds items with nothing on screen and fails the Definition of Done.
- **SCRUM-107 depends on SCRUM-118 only through two pieces of its criteria**, and both are really SCRUM-118's front end.

| SCRUM-107 criterion (today) | Level | Proposed home |
| --- | --- | --- |
| 1. Under arbitration-ready, a dispute closes only by independent adjudication | Dispute | SCRUM-107 (see next section) |
| 2. The posture is chosen on the project; a task shows the one it inherits | Project | SCRUM-107; mostly exists already, so verify and build the gap |
| 3. The expert's confirmation screen for the Expert Gate | Item | **SCRUM-118** |
| 4. The posture shown on the project and each item, and whether an item waits at the gate | Project and item | Posture display: SCRUM-107. Waiting at the gate: **SCRUM-118** |

**Delivery:**

- Two branches, `CS57-Yi-scrum-118` and `CS57-Yi-scrum-107`, both cut from `main`, each with its own PR.
- A design question on SCRUM-107 then cannot hold up SCRUM-118, whose design is settled.
- An earlier plan to ship both in one PR was withdrawn for this reason.

**Jira updates:**

- Move criterion 3 and the gate part of criterion 4 from SCRUM-107 to SCRUM-118.
- Remove "BACKEND ONLY" from SCRUM-118.
- Drop SCRUM-107's dependency on SCRUM-118.

I can make these on the board once you agree.

## SCRUM-107: arbitration-ready has nothing distinct to enforce

On `main`, every posture already behaves as arbitration-ready: a dispute closes only through independent adjudication. So SCRUM-107's criterion 1 is met, and the real open question is a product one: what should Standard or Dual sign-off do differently on a dispute?

Checked on `main`:

- **One way out of a formal dispute.** It closes only through `POST /annotation-disputes/{dispute_id}/decision`, which needs `ADJUDICATE` and passes the independence check.
- **No way to drop a `pending_route` disagreement.** It can only be opened into a formal dispute; there is no dismiss, withdraw or reviewer-settles path. So `manual_review` adds a routing step in front of the same arbitration and decides nothing.
- **No other route closes one:**
  - an ordinary review of an open dispute's subject returns 409;
  - the owner's reopen accepts only `canonicalized` or `unresolved` items, so it cannot close a dispute;
  - the legacy escalation routes return 410.

The client's R2-8 defines only arbitration-ready, not how the other postures should differ. `mission.md` (sync of 14 Oct) records the same finding.

**Options for SCRUM-107:**

| Option | What it means | Needs |
| --- | --- | --- |
| **(a) Treat criterion 1 as met** | Pin it with posture-specific guard tests and a casebook case. Add `adjudication_mandatory_on_dispute` to `ENFORCED_POLICY_VALUES`, so the screens show it enforced. State in the PR that the flag changes nothing today, because every posture already requires adjudication. | Your agreement |
| **(b) Give the posture a distinct effect** | For example, force `open_dispute` under arbitration-ready so that no `pending_route` step exists, or give the other postures a lighter path. | A new design: your decision, possibly the client's |
| **(c) Leave the flag recorded** | Keep showing it as recorded, not enforced, and carry the gap as a known limitation. | Your agreement |
