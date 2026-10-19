# Dual sign-off settles a held disagreement · plan

**Date:** 19/10 · **Ticket:** to create in Jira (story G2, criterion 3: "Arbitration-ready guarantees unresolved
disagreement reaches arbitration rather than quietly defaulting"; touches E5) · **Owner:** Jingwei ·
**Breakdown:** [feature and commit breakdown](2026-10-19-dual-signoff-settlement-feature-and-commit-breakdown.md)

## 1. Why

The client's R2-8 answer defines the postures by the authority an item needs:

- **Standard:** one approval; "disputes **may** still be escalated to an expert when needed".
- **Dual sign-off:** "specifies how ordinary agreement is established": two independent approvals; a split enters
  dispute.
- **Arbitration-ready:** "specifies what must happen when agreement fails": a dispute **must** reach independent
  adjudication.

On `main` (at #84) every posture sends a disagreement to an adjudicator. Under `manual_review` a held disagreement
(`pending_route`) can only be opened into a dispute; under `open_dispute` the platform opens one. So
arbitration-ready's guarantee holds everywhere, `adjudication_mandatory_on_dispute` is read by no code, and dual
sign-off and arbitration-ready behave the same (#81 says so: "the flag changes no behaviour").

**Jingwei's model (19/10):** dual sign-off is Standard with two approvals. Under Standard and dual sign-off a held
disagreement may be **settled** by an independent peer, without an adjudicator; under arbitration-ready that is
refused, and under the Expert Gate too, since every item there goes through the expert (D10). Only a split
between two reviewers is ever held; a reviewer's Escalate opens a dispute at once and is never settled (D11). The
difference becomes behaviour, and the flag gets its first reader.

## 2. Decisions (Jingwei, 19/10)

| # | Decision | Chosen |
| --- | --- | --- |
| D1 | Where a settlement is stored | **New append-only table `disagreement_settlements`**, one row per held disagreement |
| D2 | What a settler may decide | **Accept, return (to the author) or reject** (independent replacement), with a required reason; or open the formal dispute instead. No adjudicator-only tools |
| D3 | Who may settle | **An independent reviewer:** holds APPROVE, and didn't annotate, review, route or open a dispute on the item (the rule adjudicators already follow, `adjudication_conflict_item_ids`) |
| D4 | Dual sign-off's preset | **New `project_policy_dual_signoff_v2` with `manual_review`, beside v1, without superseding it** (revised after the impact sweep: superseding v1 would reach the web's create-form default, the seed, EV-003, EV-013 and about 15 test files). The web's create form defaults to v2; v1 stays selectable as dual sign-off with automatic disputes |

Further decisions this plan makes (to confirm in review):

- **D5. The flag is read where it is in force now.** A disagreement held under `manual_review`, whose project later
  moves to arbitration-ready, can no longer be settled: the stricter posture wins, and the dispute route stays open.
- **D6. A settler's accept is a deciding approval.** It completes the answer, as an adjudicator's accept does, so under
  dual sign-off the earlier reviewer's accept plus the settler's make the two agreeing approvals. It is **not** an
  expert confirmation. The Expert Gate refuses settling altogether (D10), and `expert_confirmed` still never reads a
  settlement, as a second line of defence.
- **D7. A settler's return and reject behave like an ordinary review's.** Return goes back to the author for rework;
  reject leaves the answer for an independent replacement, as a unanimous reject round does, not as an
  adjudicator's reject.
- **D8. Standard gets the settle path too** (confirmed by Jingwei, 19/10). Standard holds a split only in its 10%
  cross-review sample, when the two reviewers disagree (`manual_review`). That is the same two-reviewer
  disagreement dual sign-off settles, and the client's Standard says a dispute "may" reach an expert.

Decided by Jingwei, 19/10, after the first review of this plan:

- **D10. Expert-gated never settles.** Every item there must go through the expert, so the settle route refuses
  with `409` while `expert_gate_required` is in force (read at settle time, as D5 reads its flag). A held split is
  opened as a dispute, as today. The case page shows "this posture requires the expert" in place of the Settle
  section.
- **D11. Only a held split between two reviewers can be settled; an escalation cannot.** A reviewer's Escalate
  opens a formal dispute in the same step, under every posture, and stays that way. The evidence is below. The
  settle route accepts only a held `review_disagreements` row, so it refuses an escalation's dispute (`409`,
  already opened), with a guard test. Evidence that Escalate must raise a dispute:
  - **Client R2-4 (24/09)** names the four substantive reviewer actions "accept, reject, modify and escalate to
    dispute";
  - **RQ-005** (`requirements.md`): "disagreements … escalated into structured dispute cases";
  - **ADR 013** (annotation-level disputes), step 2: "An explicit escalation opens immediately. A mixed round
    under `manual_review` is held as `pending_route`". It rejected escalating and routing as two calls because
    they can partly fail;
  - **`workflow_states.md`**: "An explicit reviewer escalation and the `open_dispute` policy enter `OPEN`
    directly"; held (`PENDING_ROUTE`) is only "reviewer disagreement … under `manual_review`";
  - **the 28/09 dispute assessment, G1**: an escalation that was never routed left the item `disputed` forever,
    which is why escalating and opening became one step;
  - **the code and the casebook**: `review_actions.py` opens the dispute on `escalate`; EV-103 and EV-104 (Standard)
    go from escalate straight to the adjudicator; the held list reads only review splits
    (`dispute_case_lists._pending_disagreements`).

  The one nuance, outside this ticket: story E5 wants a posture where disputes "never" reach an expert. If that is
  ever built, it changes where an escalation goes, not whether a peer settles it.
- **D12. The rule reads the policy's values, never its posture or preset name, so custom policies follow it too**
  (Jingwei, 19/10). A split is held when two ordinary verdicts are collected (`review_required_approvals` ≥ 2, or
  the item is in the `cross_review_percentage` sample), they disagree, and `disagreement_handling` is
  `manual_review`. A held split waits for whichever comes first: a dispute participant opens it, or an independent
  reviewer settles it. Settling is refused while `expert_gate_required` (D10) or
  `adjudication_mandatory_on_dispute` (D5) is in force. Save-time validation already ties those flags to their
  postures (`project_policy_rules.validate_project_policy_for_governance`). `expert_gate_required` holds exactly
  under Expert-gated. `adjudication_mandatory_on_dispute` holds exactly under Arbitration-ready and requires
  `open_dispute`, so an arbitration-ready policy never holds a split, and D5 only matters after a posture change.
  A custom policy with one approval and no cross-review never holds a split.

## 3. The workflow after the change

```
review 1 ┐
review 2 ┴→ split (accept vs redo) ─┬─ open_dispute (arbitration-ready; dual sign-off v1) → dispute → adjudicator
                                     └─ manual_review (Standard's sample; dual sign-off v2; Expert-gated) → held
                                           ├─ settle: accept / return / reject, with a reason, by an independent reviewer
                                           │     (refused 409 when adjudication_mandatory_on_dispute or
                                           │      expert_gate_required is in force: D5, D10)
                                           └─ open dispute → adjudicator (unchanged)

reviewer's Escalate (any posture) → dispute opened in the same step → adjudicator (unchanged; never settled, D11)
```

## 4. What changes, layer by layer

### 4.1 Database

New table **`disagreement_settlements`** (D1). `create_all` adds a new table to an existing database by itself:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | String(255) PK | `new_id("settle")` |
| `disagreement_id` | FK `review_disagreements.id`, **unique**, not null | one settlement per held disagreement |
| `task_id`, `task_item_id` | FKs, indexed | for case lists and checks |
| `annotation_id` | FK `annotations.id`, not null | the disagreement's answer (the version reviewed) |
| `decision` | String(20), check `accept / return / reject` | D2 |
| `justification` | String(2000), not null, non-blank | required reason |
| `settled_by` | FK `users.id`, not null | |
| `settled_at` | UtcDateTime, not null | |
| `policy_version` | Integer, nullable | the policy version in force (SCRUM-53), as reviews cite it |

No updates or deletes from any route. `review_disagreements` is unchanged. A held disagreement's state is derived: open
if it has a dispute, settled if it has a settlement, held otherwise. Both can't exist; the routes refuse the second.

**One existing table changes: `reconciliation_acceptance_evidence`.** When accepted answers differ, the reconciliation
freezes why each candidate counts as accepted. Its CHECK constraint allows only `review_approval` (with `review_id`)
and `adjudication_accept` (with `annotation_dispute_id`). A settled answer reaching reconciliation needs
`settlement_accept` evidence, so the table gains a nullable `disagreement_settlement_id` FK, and the constraint gains a
third arm. **This needs a database reset** (`init_data.py --reset`) for existing PostgreSQL development databases, and
for SQLite ones, which can't change a CHECK constraint in place. That's the team's disposable-development policy, as
#63 already required. No other table's CHECK lists change: dispute triggers and statuses, `disagreement_handling`'s
values and reconciliation triggers are untouched, and provenance events have no list in the database.

### 4.2 API

- **`POST /tasks/{task_id}/annotation-disputes/{disagreement_id}/settle`** `{decision, justification}`. Needs
  `APPROVE`, an active task, and the item not finalised. Refusals:
  - `403`: the caller isn't independent of the item (D3);
  - `409`: the disagreement isn't `manual_review`, is already opened into a dispute, or already settled;
  - `409`: the project's policy has `adjudication_mandatory_on_dispute` (arbitration-ready): "a dispute must reach
    independent adjudication; open the dispute instead" (D5);
  - `422`: no reason, or an unknown decision.

  It locks the disagreement and item rows in the order `/open` already uses, so a settle and an open at the same moment
  can't both succeed.
- **`POST …/{disagreement_id}/open`** also refuses a settled disagreement (`409`).
- **Dispute case reads** (`GET /tasks/{id}/annotation-disputes`, the project's list, the case detail): a settled
  disagreement reads as resolved, with how (`settled`), the decision, reason, settler and time. The `status` filter
  keeps its three values, and the case carries `resolution: "settlement" | "adjudication"`.
- **The item read** (`tasks.py`'s per-answer decision, `decision_dispute_by_annotation`, which the work panel shows)
  gains the answer's settlement beside its dispute decision.
- **The reconciliation read** (`reconciliations.py`) lists `settlement_accept` evidence with the settler and time.
- **The archived-project guard (#80)** covers the new route by itself: its path has `task_id`.

### 4.3 Workflow state (the risky part)

`SubmissionReviewState` gains `settlement_decision`, read in the same query batch as `resolved_dispute_decisions`
(`resolved_settlement_decisions`). The answer's effective outcome comes from the adjudication decision if there is
one, else the settlement's, else the review round's. Every reader of `adjudication_decision` is sorted:

| Reader | Settlement counts? |
| --- | --- |
| `review_refusal`: a fully approved answer isn't offered again | **yes** (accept) |
| `item_complete` / `item_status_after_accept`: accept counts as fully approved | **yes** (accept, D6) |
| `expert_confirmed` (Expert Gate) | **no** (D6) |
| adjudication-reject branches (independent replacement after an adjudicator's reject) | **no** (D7) |
| work queue rework (`task_work_queue_service`) | as an ordinary reject (D7) |

`decided_since_submission` includes a settlement; `review_round_outcome` stays `disagreement`, so the agreement
figures (#53's raw rate, #77's kappa) still count the split.

**Reconciliation candidates** (`item_reconciliation_service`): an adjudicator's reject drops an answer from the
candidates. A settler's reject is an ordinary reject (D7), which leaves the item incomplete until the answer is
replaced, so it never reaches reconciliation as a candidate; a guard test pins that. A settler's accept counts as an
accepted candidate, with its evidence (§4.1).

### 4.4 Authoritative answer, export and releases

A settled accept that completes the item marks the answer authoritative with a new cause **`settlement_accept`**, with
`authoritative_by` the settler (beside `canonical_rule`, `adjudication_accept` and `reconciliation_choose`). The
export and releases (#65) copy the cause unchanged, so a release says the item was settled by a peer, not
adjudicated. Export eligibility (`canonicalized` / `unresolved`) is unchanged. Several accepted answers still go to
reconciliation.

- **The release manifest (#84)** counts resolutions as `authoritative` or `ambiguous`, so a settled item counts as
  authoritative and needs nothing new.
- **The pre-release gate (#83, `release_gate.py`)** refuses a release when an item's dispute or reconciliation lacks
  its provenance events (`_provenance_gaps`). A settlement joins that list: a settlement after the item's first event
  must have its `disagreement_settled` event, or the release is refused. A held, unsettled disagreement already leaves
  the item `disputed`, so it fails as unreviewed.

### 4.5 Provenance and history

- **Provenance event `disagreement_settled`** (`EVENT_KINDS`): the settler as actor, on the settlement record and the
  answer, with the decision and reason in its details, as `adjudicated` carries them. It's read like
  `disagreement_held`: dispute readers only, never while a blind round is open.
- **Task history:** `review_disagreement_settled`, category `dispute`, with its copy text, so the history drawer and
  the "decisions only" view show it.
- **SCRUM-53:** the settlement cites the policy version in force.
- **No migration for the event:** `provenance_events` has no database constraint on `event_kind` or `record_type`
  (only `actor_kind` is checked), so the new kind and record type `disagreement_settlement` are code changes:
  `EVENT_KINDS`, and the read rule in `provenance_service.py`. The table's immutability triggers are unchanged.
- **The provenance read** (`GET /task-items/{task_item_id}/provenance`) returns the new event with no route change.
  A settled item's story reads: answer submitted → reviewed twice → `disagreement_held` → `disagreement_settled` →
  (the answer authoritative, cause `settlement_accept`) → `released`.
- **Yi's #85 (SCRUM-106, the item timeline; it replaced the closed #82)** names event kinds in `lib/api/provenance.ts` and labels them in
  `lib/item-timeline.ts`. Whichever merges second adds `disagreement_settled` and its label, such as "Disagreement
  settled by …".

### 4.6 Integrity checks (SCRUM-74, #79)

Settlements have to be taught to #79's checks, or a settled item is reported as an unknown event or cause:
- **`check_roles`:** `disagreement_settled` needs `APPROVE`, plus the independence rule (the settler didn't
  annotate, review, route or open a dispute on the item before settling);
- **`check_provenance`:** each settlement expects its `disagreement_settled` event, and the cause `settlement_accept`
  must point to an accepting settlement on that answer by `authoritative_by`.

**Decided 19/10 (Jingwei): the settlement merges first, so #79 adds this** in the commit that takes `main` in after
the settlement, with its tests (an honest settlement finds nothing; a settler who reviewed the item is found; a
deleted settlement event is found), and gives the settlement cases a closing `verify` step. #79's `releases` check
needs nothing: a settled answer's line carries its cause like any other.

### 4.7 Policy

- **`project_policy_dual_signoff_v2`** (D4): 2 approvals, 100% cross-review, `manual_review`, flags off, titled
  "Dual sign-off" with v1 retitled "Dual sign-off, automatic dispute". Both stay selectable. Tests and cases that
  select v1 keep working; new tests cover v2. The seed is unchanged: its project B already holds a split, project C
  opens disputes.
- No change to `project_policy_rules`: arbitration-ready still requires `open_dispute` and the flag, so a held
  disagreement can only arise under arbitration-ready if the project moved to it after the hold (D5 covers that).

### 4.8 Web

- **Held case** (`dispute-case-detail.tsx`): beside "Open formal dispute", a **Settle** section (accept, return,
  reject, reason). It's hidden for someone without approval rights, and under arbitration-ready, where it shows "this
  posture requires adjudication" instead. A refusal shows the API's reason.
- **Lists** (`project-dispute-table.tsx`, `task-dispute-desk.tsx`): a settled case reads "Settled". The Overview's
  active count (#74) leaves it out, as it does resolved cases.
- **Task history:** the new operation's label.
- **Posture text** (`lib/governance-model.ts`), which the header badge, the task summary and #81's posture card show.
  Dual sign-off's description says "disagreement between them enters dispute"; it becomes "a split is held for an
  independent reviewer to settle, or opened as a dispute". Arbitration-ready's says a split always goes to an
  adjudicator. Standard's mentions settling too.
- **The work panel** (`task-item-workspace-sheet.tsx`): a held item links to "View the held case"; a settled answer
  shows its settlement (who, decision, reason) where an adjudicated one shows the dispute's decision.
- **Reconciliation evidence** (`lib/api/reconciliations.ts`, `reconciliation-case-detail.tsx`): the evidence type gains
  `settlement_accept`, labelled "Settled by ...".
- **The create form** (`project-create-form.tsx`): the default preset becomes dual sign-off v2; the preset list
  (`lib/api/policies.ts`'s fallback) gains it.

### 4.9 Evaluation harness and casebook

- A `settle` step in the harness (`scenario.py`, `driver.py`).
- Cases:
  - dual sign-off v2 split, accept settles, two agreeing approvals, item canonical with `settlement_accept`;
  - settle return, back to the author;
  - arbitration-ready refuses settling, and the dispute route still works;
  - a reviewer of the item can't settle;
  - Expert Gate: settling is refused, and the opened split goes to the expert (D10);
  - Standard: a sampled split is held and settled (D8);
  - an escalation can't be settled (D11).
- `baseline.json` regenerated.

### 4.10 Seed and demo

The seed's project B ("Test: Dual sign-off, manual review") already holds a split: the demo settles it. A v2 preset
project in the seed is optional.

## 5. Issues that could follow, and how each is handled

| Risk | Handling |
| --- | --- |
| A peer's settlement passes the Expert Gate | settling is refused under the Expert Gate (D10); `expert_confirmed` reads only adjudication anyway (§4.3); guard tests |
| A peer settles a reviewer's escalation | the route takes only a held split; an escalation's dispute is already opened, so `409` (D11); a guard test |
| A settled accept leaves a dual sign-off answer one approval short, so it never completes | settlement accept counts as a deciding approval (D6); a prove test |
| A settle and an open, or two settles, at the same moment | the same row locks as `/open`; a PostgreSQL two-connection test |
| The project moves to arbitration-ready while a split is held | the flag is read at settle time (D5); a guard test |
| A rework after a settler's return carries the old settlement | the settlement is bound to the answer version reviewed; the new version starts a new round |
| A reopen (D9) after a settlement | the round is superseded as usual; the settlement stays as history |
| The agreement figures change | `review_round_outcome` keeps `disagreement`; #53/#77 read the first pair |
| Releases and exports meet an unknown cause | `settlement_accept` is documented in `api_surfaces.md`; downstream must accept it |
| #79's checks report settled items | taught in #79 when it takes in `main` after the settlement (§4.6) |
| #85's timeline shows the new event unlabelled | the kind and its label added there, whichever merges second (§4.5) |
| #81's text says a held disagreement "can only be opened" | rewritten in `governance-model.md` §7, `api_surfaces.md`, `workflow_states.md` |
| Archived projects | the guard covers the route by its `task_id` |
| Who finds the held cases | dispute readers already see them in the Disputes tab and the task's desk; no queue in this ticket |
| A settled answer in a reconciliation has no evidence the table accepts | `reconciliation_acceptance_evidence` gains `settlement_accept` (§4.1); a prove test with two settled answers that differ |
| A settled item is released without its settlement event | the pre-release gate checks it (§4.4); a guard test |
| Existing development databases | the evidence table's constraint changes: `init_data.py --reset` (§4.1), said in the PR and to the team |
| The posture text says dual sign-off "enters dispute" | `lib/governance-model.ts` rewritten (§4.8) |
| Retiring v1 breaks the create form, seed and cases | v1 isn't retired (D4) |
| A settler's reject slips into a reconciliation | ordinary-reject rules keep the item incomplete; a guard test |

## 6. Docs (Docs Sync, plus a new ADR)

- **ADR 022** (020 and 021 are on `main`, 019 is #77's): a held disagreement may be settled by a peer except where
  adjudication is mandatory or the Expert Gate applies (D1–D11, the
  alternatives considered).
- **`docs/terminology/governance-model.md` §7:** the postures by what happens on a split.
- **`workflow_states.md`:** held → settled or opened.
- **`api_surfaces.md`:** the route, the case read, the cause.
- **`db_schema_blueprint.md`** and **`domain_model.md`:** the table, and the evidence table's new arm.
- **`backend_module_map.md`:** the disputes domain owns settlement.

## 7. Before building

1. **No question to Hunter** (Jingwei, 19/10): he wants the team to propose its own design and record it in an
   ADR. ADR 022 records D1–D12, the alternatives rejected, and the client answer they rest on (R2-8, Round 2 Q8:
   "if a dispute occurs, it must reach independent adjudication. That is what distinguishes it from Dual sign-off").
2. **Create the Jira ticket** (story G2, criterion 3) and assign it; the branch is `CS57-Jingwei-scrum-<n>` from
   `origin/main`, since `CS57-Jingwei` holds #80.
3. **Order (decided 19/10, Jingwei): the settlement merges first.** It corrects our misreading of R2-8 (dual
   sign-off behaved like arbitration-ready), so it doesn't wait for #77 or #79. It is built from `origin/main` now.
   #79's checks learn settlements when #79 next takes in `main` (§4.6). `scenario.py` and `driver.py` gain a step
   on both sides, so whichever merges second keeps both. #85 (SCRUM-106) gets the event label, whichever merges
   second. New cases start at EV-125 (the highest on every open branch is EV-124, 19/10).
4. **Time:** build work ends 28 Oct. About 3–4 days of build, so start by 23 Oct at the latest.
5. **Merge window: by Mon 27 Oct, at the latest 28 Oct**, at least a day before the mid-W12 demo, so the team can
   run `init_data.py --reset` (§4.1) and rehearse with the new seed. Conditions: a reviewer's approval, both databases and web green, `baseline.json` regenerated on the merged branch. Use a
   merge commit and keep the branch. **If it isn't approved by 28 Oct, it waits until after the demo**: a stable
   demo comes first. The demo script is checked against v2 being the create form's default (§4.8).
