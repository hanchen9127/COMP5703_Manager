# Dual sign-off settles a held disagreement · feature and commit breakdown

**Date:** 19/10 · **Plan:** [plan](2026-10-19-dual-signoff-settlement-plan.md) · **Ticket:** to create (G2 criterion 3) ·
**Branch:** `CS57-Jingwei-scrum-<n>` from `origin/main` now; it merges before #77 and #79 (Jingwei, 19/10) ·
**Merge:** by 27 Oct, at the latest 28 Oct (plan §7) · **Delivery:** one PR (API, web, evaluation, docs)

Each commit: tests first written to fail, revert checks, both databases. The PR description says existing development
databases need `init_data.py --reset`: the new table needs none, but `reconciliation_acceptance_evidence`'s CHECK
constraint changes (plan §4.1).

## 0. Before commit 1

No question to Hunter: ADR 022 records the design (plan §7). The Jira ticket assigned and In
Progress. Baseline: full suite on SQLite, on `origin/main` as it is (#77 and #79 not needed).

## Commit 1 · `feat(api): settle a held disagreement without an adjudicator`

**The core.**
- `DisagreementSettlementDB` (plan §4.1) and `settle_disagreement` in `annotation_dispute_service.py`. It locks the
  disagreement and item rows, then refuses: not `manual_review`; already opened (an escalation's dispute among them,
  D11); already settled; `adjudication_mandatory_on_dispute` in force (D5); the Expert Gate in force (D10); not
  independent (D3); item finalised; task not accepting work.
- `POST /tasks/{task_id}/annotation-disputes/{disagreement_id}/settle`, which needs `APPROVE`. `/open` refuses a
  settled disagreement.
- `SubmissionReviewState.settlement_decision` and `resolved_settlement_decisions`, with each reader of
  `adjudication_decision` sorted (plan §4.3). The item's status is recomputed. `apply_completed_item_resolution` marks
  an accept `settlement_accept`.
- The `disagreement_settled` event, the `review_disagreement_settled` history operation and its copy, and the policy
  version cited.

**Tests.**
- **Prove, under dual sign-off with a split held:**
  - accept settles it, the answer completes on the earlier accept plus the settler's, and the item is `canonicalized`
    with cause `settlement_accept` by the settler;
  - return sends it back to the author;
  - reject leaves it for an independent replacement;
  - the event and the history entry are written.
- **Guards:**
  - arbitration-ready refuses with `409` and the dispute route still works;
  - a project moved to arbitration-ready after the hold refuses;
  - the annotator, either reviewer, a router or opener, a task owner (no `APPROVE`) and a dispute participant are each
    refused;
  - a settled disagreement can't be opened, and an opened one can't be settled;
  - a second settle is refused;
  - Expert Gate: settling is refused with `409`, also for a project moved to the Expert Gate after the hold (D10),
    and `expert_confirmed` still ignores settlements;
  - a reviewer's escalation can't be settled (`409`, D11);
  - a blank reason is refused (`422`).
- **Prove (Standard, D8):** a split in the cross-review sample is held and an independent reviewer settles it.
- **Prove (custom policies, D12):** with no preset, a Standard policy with two approvals and `manual_review`, and a
  dual sign-off policy with `manual_review`, each hold a split that settles. A custom Expert-gated policy refuses.
  The route never reads `policy_template_ref` or `governance_model`; only the policy's values decide.
- **PostgreSQL only:** a settle and an open on two connections, where exactly one wins.

**Revert checks:**
- settle without the flag check;
- without the Expert Gate check;
- settling allowed by posture name (dual sign-off only) in place of the policy values, which the custom Standard
  test must catch;
- without the independence rule;
- with `expert_confirmed` counting settlements;
- a settlement accept not counted as an approval;
- without the row locks.

## Commit 2 · `feat(api): reads, reconciliation and the release gate know a settlement`

- **Case reads:** the lists and the case detail return `resolution` (`settlement` / `adjudication`), with the
  settlement's decision, reason, settler and time. A settled case reads as resolved and leaves the open and held
  counts.
- **The item read:** `tasks.py`'s per-answer decision gains the settlement.
- **Reconciliation evidence:** `reconciliation_acceptance_evidence` gains `disagreement_settlement_id` and a
  `settlement_accept` arm in its CHECK constraint. `item_reconciliation_service` freezes it for a settled candidate,
  and `reconciliations.py` reads it.
- **The pre-release gate:** `release_gate._provenance_gaps` expects each settlement's `disagreement_settled` event.

**Tests:**
- **Prove:**
  - a settled case in the task and project lists and the detail, with its fields and the counts;
  - the item read shows the settlement;
  - two settled answers that differ open a reconciliation with `settlement_accept` evidence for each;
  - a settled item releases.
- **Guard:**
  - the filter's three statuses are unchanged;
  - a settler's reject never becomes a reconciliation candidate;
  - a settlement whose event was removed fails the gate;
  - the evidence constraint refuses `settlement_accept` without a settlement.

## Commit 3 · `feat(api): a dual sign-off preset that holds a split`

`project_policy_dual_signoff_v2` (`manual_review`), titled "Dual sign-off". v1 is retitled "Dual sign-off, automatic
dispute". **Neither is superseded** (D4, revised).

**Tests:** prove (v2 is selectable and stores `manual_review`; a project on v2 holds a split and can settle it); guard
(v1 is still selectable and still opens a dispute on a split; arbitration-ready's validation is unchanged).

## Commit 4 · `feat(web): settle a held disagreement on its case`

- **The case page:** a Settle section on a held case (decision, reason), shown to someone with approval rights, and
  replaced by "this posture requires adjudication" under arbitration-ready and "this posture requires the expert"
  under the Expert Gate. The API's refusal is shown.
- **Lists:** "Settled" in the project and task lists; the Overview's active count leaves it out.
- **History:** the operation's label.
- **Posture text** (`lib/governance-model.ts`): dual sign-off holds a split to settle or dispute; arbitration-ready
  always adjudicates; Standard can settle a sampled split; the Expert Gate always goes to the expert; Escalate always
  opens a dispute.
- **The work panel:** a settled answer shows its settlement.
- **Reconciliation evidence:** `settlement_accept`, "Settled by ...".
- **The create form:** defaults to dual sign-off v2; the fallback preset list gains it.
- **API client:** `settleAnnotationDisagreement` and the case types.

**Tests:** prove (the form sends the decision and reason; a settled case reads "Settled"); guard (hidden without
approval rights; the arbitration-ready note in its place; a refusal shown; the form can't be sent without a reason).

## Commit 5 · `feat(evaluation): settlements in the harness and the casebook`

- **The harness:** a `settle` step (`scenario.py`, `driver.py`).
- **New cases** (EV-125 onward: EV-124 is the highest on every open branch, 19/10):
  - dual sign-off v2, settled by accept;
  - a settled return;
  - arbitration-ready refuses settling and adjudicates instead;
  - a reviewer of the item is refused;
  - Expert Gate: settling is refused, and the split, opened, goes to the expert;
  - Standard: a sampled split settled;
  - a reviewer's escalation can't be settled, and the adjudicator decides it.
- `baseline.json` regenerated.

**Tests:** the cases themselves.

**Moved to #79** (the settlement merges first): `check_roles` (`disagreement_settled` needs `APPROVE`, plus
independence) and `check_provenance` (the settlement's event, and the cause `settlement_accept`), with their tests
(an honest settlement finds nothing; a tampered settler, a reviewer of the item, is found; a deleted settlement
event is found) and a closing `verify` step on the settlement cases. They go in the commit where #79 takes in
`main`.

## Commit 6 · `docs: a held disagreement may be settled, except where adjudication is mandatory (ADR 022)`

- **ADR 022** (020 and 021 are on `main`; 019 is #77's).
- **Docs Sync:** `governance-model.md` §7, `workflow_states.md`, `api_surfaces.md`, `db_schema_blueprint.md`,
  `domain_model.md`, `backend_module_map.md`.
- **The seed README:** project B's settle demo.

## Coordination

- **#79 (SCRUM-74):** merges after this. Taking `main` in, it teaches its checks settlements (above) and keeps both
  sides' steps in `scenario.py` and `driver.py`.
- **#77 (SCRUM-72):** merges after this too; any harness conflict is resolved there, keeping both sides.
- **#85 (SCRUM-106, Yi; it replaced the closed #82):** the timeline's kind list and label for `disagreement_settled`, whichever merges second.
- **#81's text (`governance-model.md` §7) and the posture card:** rewritten in commits 4 and 6.

## Criteria → commit

| Criterion | Commit |
| --- | --- |
| G2.3 Arbitration-ready guarantees unresolved disagreement reaches arbitration, rather than quietly defaulting | 1 (refusal), 5 (case) |
| G2.1 Dual sign-off requires the configured approvals from different reviewers | 1 (a settler's accept is the second, from a different and independent reviewer) |
| G2.2 The Expert Gate prevents completion until an expert has approved | 1 (settling refused under the Expert Gate, D10; a settlement isn't a confirmation either), 5 |
| G2.6 No expert confirms or adjudicates an item they annotated or reviewed (extended to settlers) | 1, 5 |
| G2.4 The posture in force is visible | 4 (the note on the held case) |
