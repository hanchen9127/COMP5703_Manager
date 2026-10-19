# SCRUM-118 and SCRUM-107 — rewritten descriptions (2026-10-15)

**Decisions (team, 2026-10-15):** Yi's design in `../msg/SCRUM-118 Expert Gate design and SCRUM-107 questions.md`,
with Hanchen's reply in `../msg/2026-10-15-scrum-118-107-reply-for-Yi.md`:
- The tickets are split by level, two PRs. SCRUM-118 holds the item-level gate, front end included.
  SCRUM-107 holds dispute- and project-level posture work, and no longer depends on SCRUM-118.
- The R2-7 check is added in `mark_authoritative`.
- SCRUM-107 takes option (a): arbitration-ready is treated as met, pinned by tests, and shown as enforced.

**Points:** SCRUM-118 2 → **3**, SCRUM-107 2 → **1**. Both stay in the W10 sprint and both stay Yi's.

Checked against `main` at `c3ac7a8`. Paste each description block as it is: the `{noformat}` wrapper
matches the other tickets.

---

## SCRUM-118

### Summary (unchanged; still fits)

```
Governance: Make the project's governance posture govern canonicalisation
```

### Description

```
{noformat}Related to user story G2

BACKEND AND FRONTEND. W10. Split from SCRUM-107 on 2026-10-01; rewritten 2026-10-15 (team decision, Yi's design): the Expert Gate reuses item reconciliation, and SCRUM-107's confirmation screen and the item's gate state moved here, so this ticket is no longer backend only.

ProjectPolicyDB stores governance_model, expert_gate_required and adjudication_mandatory_on_dispute; resolve_for_task (SCRUM-50) returns them; nothing enforces expert_gate_required yet. Read it through resolve_for_task, never from the tables.

Client answer R2-8, Expert Gate: "Every item requires expert confirmation before it can become canonical, whether or not a dispute occurred" — annotation → review → expert gate → canonical. "The expert should not approve an item that they themselves annotated or reviewed." R2-7: "Under no circumstances can the AI first pass become the canonical answer without being reviewed by humans."

Related issue: 7 (approving or deciding on one's own work).

Design: a gate confirmation is an item reconciliation with one candidate. A reconciliation decision already needs ADJUDICATE, refuses anyone who annotated, reviewed or routed the item (adjudication_conflict_item_ids, administrators included, no override), and is its own record with justification, decider and time. Its three decisions cover the gate: choose_one confirms, return sends the item back, reject_all refuses it.

# Where expert_gate_required is set, an item whose one remaining answer has not been accepted by an independent expert does not canonicalise: it opens an item reconciliation for that answer and waits as reviewed. Cause on main → under the gate: canonical_rule (no expert involved) → held; adjudication_accept (an expert accepted this exact answer in a dispute, the only one left) → canonicalises directly, the expert has confirmed it; reconciliation_choose (an expert chose between several accepted answers) → unchanged. With several accepted answers, reconciliation opens as today, however each was accepted. unresolved items are not gated.
# ItemReconciliationDB gets trigger_type, set when the case opens and never changed: expert_confirmation_required (one answer, held at the gate) or multiple_candidates (today's case), with a CHECK constraint. Added to migrate_db_schema() for SQLite (existing rows read multiple_candidates); development PostgreSQL databases are reset after it (SCRUM-94 rule). open_item_reconciliation accepts one candidate for expert_confirmation_required only and still needs two for multiple_candidates. The list and detail reads return trigger_type.
# The expert decides at the existing reconciliation route, under its ADJUDICATE and independence checks: choose_one → canonicalized, marked authoritative (cause reconciliation_choose, by the expert); return → reopened for a new round; reject_all → unresolved. No expert_confirmed column: whether an answer is expert-confirmed is derived from its dispute record (adjudication_decision == "accept"), so a confirmation never carries into a later round.
# expert_gate_required joins ENFORCED_POLICY_VALUES, so every screen that labels a policy value enforced or recorded follows.
# No item canonicalises on AI output alone, under any posture, checked at the point of canonicalisation: mark_authoritative refuses with 409 an annotation whose author_role is ai_model unless its round has at least one approver (approvers_of) or the cause is a person's decision (adjudication_accept, reconciliation_choose) with actor_id set. Today no path reaches it (both callers already require review, guarded by EV-002, EV-010, EV-081); the check covers the paths added later (SCRUM-124, SCRUM-37).
# Front end: the Reconciliation page shows the case's trigger_type and lays out a one-candidate case as a confirmation (Confirm, Return, Reject) instead of a choice between answers; the item shows that it is waiting at the Expert Gate. Names stay: the Reconciliation tab, the Reconciliation status label (stored reviewed) and every backend name.
# Without expert_gate_required, canonicalisation is unchanged.
# Docs in the same change: an ADR (a reconciliation record now also means a gate confirmation), workflow_states.md (reviewed also means held at the gate), api_surfaces.md, db_schema_blueprint.md.
# Tests, each failing on the old behaviour: an expert-gate item stays uncanonicalised after its approvals and has an open expert_confirmation_required case; its annotator, its reviewer and an administrator who annotated it are each refused the decision; an unrelated expert's choose_one canonicalises it; return reopens it and the new answer is held again; reject_all leaves it unresolved; a reviewer escalation followed by an independent expert's dispute Accept canonicalises with no gate case; two accepted answers open one multiple_candidates case and no gate case follows the choice; mark_authoritative refuses an unapproved AI annotation (called directly); a standard-posture item canonicalises as before; a web test shows a held item and confirms it. One casebook case for the gate.

Collaboration:
- SCRUM-52, 99 (break): the independence helper and reconciliation.
- SCRUM-124 (D3/E3, Dishank, same week): an accepted correction is a new marking path; the R2-7 check must let it through (cause adjudication_accept, by the expert).
- SCRUM-37 (H4, Dishank, PR #66): reads the authoritative marker; no change to SCRUM-37.
- SCRUM-105 (H3, same week): an item held at the gate is not canonical, so the release gate refuses it as unreviewed. Comment on SCRUM-105 about the new reviewed hold.
- SCRUM-98 (F1, Parth, PR #70): edits the same reconciliation files. Agree the merge order; if F1 merges first, its reconciliation events carry trigger_type.
- SCRUM-107 (E5, same week): posture display and arbitration-ready; no dependency either way.
- SCRUM-71 (I2): the gate's casebook case.{noformat}
```

---

## SCRUM-107

### Summary (unchanged; still fits)

```
Dispute: Make the escalation posture configurable and enforced
```

### Description

```
{noformat}Related to user story E5

BACKEND AND FRONTEND. W10. Rewritten 2026-10-15 (team decision): the Expert Gate's confirmation screen and the item's gate state moved to SCRUM-118, and this ticket no longer depends on it. Arbitration-ready is treated as met on main and pinned by tests (option a).

The posture is stored and resolved (governance_model, adjudication_mandatory_on_dispute on ProjectPolicyDB, through resolve_for_task) but adjudication_mandatory_on_dispute is shown as recorded, not enforced. Read it through resolve_for_task, never from the tables.

Client answer R2-8, Arbitration-ready: "if a dispute occurs, it must reach independent adjudication" — "the model needs an explicit rule/field representing that adjudication is mandatory on dispute." "Dual sign-off specifies how ordinary agreement is established; Arbitration-ready specifies what must happen when agreement fails."

Found on main (checked 2026-10-15): every posture already behaves as arbitration-ready. A formal dispute closes only through POST /annotation-disputes/{dispute_id}/decision, which needs ADJUDICATE and passes the independence check. A pending_route disagreement can only be opened into a formal dispute, never dismissed. An ordinary review of an open dispute's subject returns 409, the owner's reopen accepts only canonicalized or unresolved items, and the legacy escalation routes return 410. So the flag guarantees what the platform already does, and must keep doing.

Related issue: 7 (deciding on one's own work).

# Where adjudication_mandatory_on_dispute is set, a disputed item is resolved only by an independent adjudication: pinned by posture-specific guard tests — under arbitration-ready, a review decision on an open dispute's subject is refused, the owner's reopen cannot close a dispute, the legacy escalation routes return 410, and an arbitrator who annotated or reviewed the item is refused. If any of these does not hold, fix it here.
# adjudication_mandatory_on_dispute joins ENFORCED_POLICY_VALUES, so the policy screens show it as enforced. The PR states that it changes no behaviour today, because every posture already requires adjudication, and that any future path closing a dispute without adjudication must refuse under this flag.
# The posture can be chosen when configuring a project, and a task shows the posture it inherits. Verify first what the project create form and the project policy screen (PR #25, #37) already offer, and build only the gap.
# The posture in force is visible on the project and on each item. Whether an item is waiting at the Expert Gate is SCRUM-118's.
# Tests: the guard tests above, each naming its posture; a web test that shows the posture on the project and on an item. One casebook case per posture where none exists yet.

Collaboration:
- SCRUM-99, 103: adjudication and its screens.
- SCRUM-118 (G2, same week): the Expert Gate; no dependency either way.
- SCRUM-108 (H6, same week): the policy screen shows the posture.
- SCRUM-71 (I2): the posture cases.{noformat}
```

---

## Also to change once the tickets are updated

- **Story points on the board:** SCRUM-118 → 3, SCRUM-107 → 1.
- **`story_src.csv` and the tracker:** G2 and E5 follow through `tracking-sync` once the board export has
  the new descriptions and points.
- **`roadmap.md`:** W10 group 8 (SCRUM-118, "2u", "backend") and W11's E5 row ("Builds on SCRUM-118",
  "the expert's confirmation screen") describe the old split. Update them at the next sync.
