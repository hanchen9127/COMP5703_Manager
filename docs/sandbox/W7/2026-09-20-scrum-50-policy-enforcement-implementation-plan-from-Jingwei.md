# Scrum 50 Implementation Plan: Apply Configured Governance Rules

**Prepared:** 20 September 2026
**Revised:** 20 September 2026, after reading `Jira.csv`. The first draft of
this plan scoped all four values into SCRUM-50. The board shows three of them
belong to other tickets, two of those already in progress. See the appendix.
**Baseline inspected:** `8a6033e` (`CS57-Jingwei`, with `main` merged)
**Ticket:** SCRUM-50, Task under epic SCRUM-11, In Progress, sprint **W7**, 1 point
**Stories:** G2 — My project's governance posture actually governs; B2 third criterion
**Depends on:** SCRUM-27 (blocked on a client decision)
**Collides with:** SCRUM-43 (in progress), SCRUM-48 (in progress)
**Consumed by:** SCRUM-51 in W8

---

## 1. Revised objective

SCRUM-50 is not the enforcement of four values. It is the **policy source** the
enforcement tickets read from.

Scrum 20 persists four project policy values. Each has a consumer, and three of
those consumers are other people's tickets. SCRUM-50's job is to make the
configured values resolvable and consumable, enforce the one part no other ticket
owns, and publish the contract before W8 needs it.

This reading is what makes the ticket's own description coherent. "Collab with
project admin" is not a footnote — coordination *is* the deliverable, because
SCRUM-50 sits in W7 and its consumer sits in W8.

---

## 2. Who owns each value

| Configured value | Consumer ticket | Owner | Status | Sprint |
| --- | --- | --- | --- | --- |
| `review_required_approvals` | **SCRUM-50 (this ticket)** | Jingwei | In Progress | W7 |
| `cross_review_percentage` | SCRUM-51 Independent second reviewer | Parth | In Progress | W8 |
| `disagreement_handling` | SCRUM-51, and SCRUM-57 Detect reviewer disagreement automatically | Parth / unassigned | In Progress / To Do | W8 / — |
| escalation posture | SCRUM-60 Make the escalation posture configurable and enforced | unassigned | To Do | — |

SCRUM-51's description is explicit about taking three of these on: *"Apply
configured sampling percentage, hide the first decision until the second decision
is submitted, and detect disagreement."*

**Note an overlap to resolve:** SCRUM-51 says it detects disagreement, and
SCRUM-57 exists to detect disagreement. One of them should give it up.

---

## 3. Correction: there is no assignment, by decision

My first draft said cross-review needs a routing or assignee concept, and
proposed a `cross_review_selected` column. The board says otherwise. SCRUM-48 was
rescoped on 2026-09-17:

> there is no assignment. A task owner does not hand items to named annotator
> accounts, so this ticket has no assignee field, no individual or bulk assignment
> endpoints, and no reassignment. Work is self-served from role-checked queues.

> Independence is a condition in the queue query, not a property of an assignee,
> because there is no assignee. D7 (SCRUM-51) samples into that same query, so
> agree its shape with Parth.

So sampling is a **condition in the queue query**, not a flag on `task_items`.
The absence of an assignee field is a design decision, not the gap I read it as.
Any column I add for sampling would be the wrong shape and would duplicate
Kanishka's queue.

SCRUM-48 also introduces something policy-shaped outside the policy layer: *"A
task carries a required-annotators count, chosen at creation."* See §6.2.

---

## 4. Scope

**In scope for SCRUM-50:**

1. Project policy becomes a third input to `PolicyResolver.resolve_task_policy`,
   with precedence organisation → project → task.
2. `ResolvedPolicy` gains `cross_review_percentage`, `disagreement_handling` and
   `governance_model`, so consumers read resolved policy rather than querying the
   `project_policies` table themselves.
3. `review_required_approvals` is sourced from project policy instead of the
   code-defined bundle default — gated on SCRUM-27, see §5.1.
4. The effective-policy display labels each value enforced or recorded, per
   value, and each label is true at the time it ships.
5. The resolved-policy contract is documented so SCRUM-51, 57 and 60 consume it
   rather than each re-deriving precedence.

**Out of scope, with owners:**

| Work | Ticket |
| --- | --- |
| Sampling percentage, blinding the first decision | SCRUM-51 |
| Automatic disagreement detection | SCRUM-51 / SCRUM-57 |
| Escalation posture enforcement | SCRUM-60 |
| One canonical annotation per item | SCRUM-27, blocked on the client |
| Task completion and export readiness rules | SCRUM-43, in progress |
| Queues, independence conditions, required-annotators count | SCRUM-48 / SCRUM-93 |

---

## 5. Blocking and colliding dependencies

### 5.1 SCRUM-27 blocks the approval count

`_latest_annotation(db, task_item_id)` filters on `task_item_id` and
`is_latest=True`, ordered by `version`, which is hardcoded to 1 everywhere.
`_create_annotation_from_draft` still scopes uniqueness to
`(task_item_id, created_by)`, so a two-annotator item has **two rows both flagged
latest**. Approvals accumulate against `ReviewDB.annotation_id`.

"This project requires 2 approvals" is therefore undefined on a multi-annotator
item, and **raising the count makes it worse**: the higher the threshold, the more
likely approvals split across the two rows and the item never finalises.

SCRUM-27 carries this and says it is *"BLOCKED on a client decision: one canonical
annotation per item, or per-annotator submissions? SCRUM-37 and provenance both
wait on the same answer."*

Consequence for SCRUM-50: either the approval count ships behind that decision,
or SCRUM-50 ships the resolver and defers §4.3 to a follow-up. Given SCRUM-27 is
W8 and unassigned, plan for the second and say so.

### 5.2 SCRUM-43 collides on the completion gate

Dishank is rewriting `assert_task_completeable` and export eligibility **right
now** (W7, in progress) so completion and export agree on "done". That is the
same function any posture gate would hook into. Do not touch it in SCRUM-50;
agree the seam with Dishank, and let SCRUM-60 build on his rule afterwards.

### 5.3 SCRUM-51 consumes this contract next sprint

Parth is in progress on SCRUM-51 in W8 and needs the resolved values. Agree the
`ResolvedPolicy` shape with him this week, before he reads the
`project_policies` table directly and creates a second precedence implementation.
This is the single highest-value coordination in the ticket.

### 5.4 Required-annotators versus approval count

SCRUM-48 puts a required-annotators count on the task. Project policy holds a
required-approvals count. Two numbers, both about how many people touch an item,
in two places, chosen by two different tickets. Worth settling now rather than
discovering the interaction later.

### 5.5 Per-item policy snapshot — ownership unclear

Recording which policy judged an item serves F2 and provenance. Yi Geng holds
SCRUM-62 and SCRUM-39 (provenance, in progress), and SCRUM-53 covers source
versioning. Their descriptions do not claim policy-in-force explicitly. Confirm
whether this belongs to SCRUM-50 or to the provenance line before building it.

---

## 6. Decisions for the project admin

### 6.1 Precedence when a task override exists

Today a task's `review_policy_ref` wins over organisation defaults. With project
policy inserted, does a task override still beat project policy, or does project
policy become a floor the task cannot weaken? A project requiring two approvals
that a task can quietly reduce to one is a governance hole.

Recommendation: project policy is a floor for assurance-increasing values.

### 6.2 Required-annotators and required-approvals

Are these one concept or two? If two, state the difference in one sentence in the
glossary, because the UI will otherwise show two similar numbers with no
explanation.

### 6.3 What may the display claim?

While SCRUM-51, 57 and 60 are unbuilt, three of the four values are resolved but
not enforced. Confirm the display marks them per value. This is a correctness
requirement, not presentation: Scrum 20 shipped an honest "recorded, not
enforced" statement, and SCRUM-50 must not flip it wholesale.

### 6.4 Is the resolved policy snapshotted per item?

Recommended yes, so a later policy change cannot retroactively invalidate a
correctly finalised item — but see §5.5 on whose ticket that is.

### 6.5 Unblock SCRUM-27

Not SCRUM-50's decision to make, but SCRUM-50's approval count, SCRUM-37 and the
provenance line all wait on it. Worth raising at the same meeting.

---

## 7. Data model changes

Possibly none. That is the point of the revised scope: SCRUM-50 changes
resolution and presentation, not persistence.

The only candidate is the per-item policy snapshot in §6.4, and only if §5.5
resolves in this ticket's favour. If it lands here, one additive nullable JSON
column on `task_items`, timestamps following the `UtcDateTime`/`utcnow()`
convention.

---

## 8. Implementation phases

| Phase | Work | Commit |
| --- | --- | --- |
| 1 | Project policy as a third resolver input; precedence; tests on all three layers | `feat(api): resolve project policy into executable task rules` |
| 2 | New `ResolvedPolicy` fields for the values other tickets consume | `feat(api): expose configured governance values to the workflow` |
| 3 | Approval count from project policy, and `review_mode` derivation correct for N > 2 — only if SCRUM-27 unblocks | `feat(api): enforce the configured approval count` |
| 4 | Effective-policy display, enforced versus recorded per value | `feat(web): show which policy rules are enforced` |
| 5 | Contract documentation for SCRUM-51, 57, 60 | `docs: publish the resolved policy contract` |

Phases 1, 2, 4 and 5 are unblocked today. Phase 3 is not.

---

## 9. The contract to publish

The actual deliverable for the rest of the team. `ResolvedPolicy` gains:

```text
cross_review_percentage: int        # consumed by SCRUM-51
disagreement_handling:   str        # consumed by SCRUM-51 / SCRUM-57
governance_model:        str        # consumed by SCRUM-60
review_required_approvals: int      # already present; source changes to project policy
```

With one stated rule: **consumers call `resolve_for_task(db, task)` and never
read `project_policies` directly.** One precedence implementation, in one place.

---

## 10. Test plan

- Precedence: organisation only; organisation plus project; all three layers with
  the §6.1 rule applied.
- A task override attempting to weaken project policy below its floor.
- Approval counts of 1, 2 and 3 finalising at the right point (Phase 3 only).
- Distinct approvers still required; self-approval still refused.
- New resolved fields present and correctly valued for each of the four presets.
- Regression: the existing 315 backend tests, especially the dual-sign-off suite,
  which must keep passing once the approval source moves.
- New tests use PR #24's shared fixtures so they run on both backends.

---

## 11. Acceptance traceability

| Criterion | Story | Satisfied by |
| --- | --- | --- |
| Configured approvals required from different reviewers | G2 | Phase 3, blocked on SCRUM-27 |
| Workflow behaves as configured, not a label ignored | B2 | Phases 1–4 for the approval count; for the other three values, only once SCRUM-51, 57 and 60 land |
| Posture visible on the project | E5, G2 | Phase 4 |
| Expert gate prevents completion | G2, E5 | **SCRUM-60**, built on SCRUM-43's rule |
| Cross-review percentage routes items | D7 | **SCRUM-51** |
| Second reviewer cannot see the first decision | D7 | **SCRUM-51** |
| Conflicting reviews raise a dispute automatically | E1 | **SCRUM-51 / SCRUM-57** |

SCRUM-50 cannot close G2 on its own, and the PR body should say so rather than
implying the posture now governs.

---

## 12. Risks

1. **Parth implements his own policy read.** SCRUM-51 is in progress now. If the
   contract is not agreed this week, W8 produces a second precedence
   implementation and the two will disagree. Highest risk in the ticket, and it
   is a communication risk, not a technical one.
2. **SCRUM-43 conflict.** Same function, same sprint, different owner. Coordinate
   before touching completion or export.
3. **Phase 3 ships on an undefined canonical annotation.** Enforcing a higher
   count on top of SCRUM-27's ambiguity multiplies a live defect.
4. **The display over-claims.** Three of four values resolved but unenforced at
   the end of this ticket. Per-value labelling is the mitigation.
5. **Story points mislead.** SCRUM-50 and SCRUM-20 are both 1 point; SCRUM-20 ran
   to seven commits and roughly 5,000 lines. Do not treat 1 point as a small
   ticket on this board.

---

## 13. Definition of done

- Project policy participates in resolution, with precedence covered by tests.
- SCRUM-51, 57 and 60 have a documented contract and do not need to read
  `project_policies` directly.
- Every value in the effective-policy display is labelled enforced or recorded,
  and every label is true.
- The approval count is either enforced, or explicitly deferred to SCRUM-27 in
  writing.
- The full suite passes on both backends.
- The criteria SCRUM-50 does not satisfy are named in the PR body, with the
  tickets that will.

---

## Appendix: what changed from the first draft

The first draft proposed a three-way split — 50a enforce what is enforceable, 50b
cross-review sampling, 50c disagreement detection — and treated the missing
assignee field as a gap to fill.

Reading the board corrected three things:

1. **50b and 50c are already tickets, and 50b is already in progress.** SCRUM-51
   (Parth) covers sampling, blinding and disagreement detection. SCRUM-60 covers
   escalation posture. Proposing them as SCRUM-50 sub-phases would have
   duplicated work a teammate is doing this sprint.
2. **The absent assignee field is a decision, not a gap.** SCRUM-48's 2026-09-17
   rescope removed assignment deliberately; independence lives in the queue
   query. A `cross_review_selected` column would have cut against it.
3. **The completion gate is occupied.** SCRUM-43 is rewriting
   `assert_task_completeable` in the same sprint.

What survived unchanged: the resolver is the single chokepoint and cannot see
project policy; SCRUM-27's ambiguity blocks meaningful approval-count
enforcement; and `assert_escalation_allowed` is not a real gate.
