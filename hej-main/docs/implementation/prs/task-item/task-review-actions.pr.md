# task-review-actions.pr.md

Status: Draft  
Owner track: Group B / CS-C Dispute, Admin, and Control Surfaces + CS-A Platform Core and API  
Primary milestone: M3 AI and Judgement Integration  
Suggested submission window: Week 6  
PR type: item-level review action PR

---

# 1. Summary

Deliver the item-level **review action contract** used inside review.

This PR splits the actual review mutations away from the broader review desk page.

---

# 2. Objective

Make review actions operational by:

* supporting accept / edit / reject / escalate on one item
* recording those actions against the correct item state
* keeping annotation and judgement review paths compatible without collapsing them

---

# 3. Governance Basis

Derived from:

* `docs/terminology/task-schema-and-policy.md`
* `docs/design/processes/project/task-process-map.md`
* `docs/design/product/workflow_states.md`
* `docs/implementation/planning/minimal-working-slice.md`

Key implications:

* review actions target `TaskItem`
* review desk and review action should be separable PRs
* escalate is the bridge into dispute posture

---

# 4. In Scope

Include:

* accept / edit / reject / escalate action model
* item-level submit path or action stub
* state update or state fixture transition
* clear distinction between review UI shell and review mutation semantics

---

# 5. Out of Scope

Do not include:

* full review desk layout
* dispute desk layout
* arbitration actions

---

# 6. Minimal Complete Slice

```text
open one item from review
-> perform accept, edit, reject, or escalate
-> observe item-level state or activity change
```

---

# 7. Dependencies

Depends on:

* review desk
* item details surface
* review policy visibility from setup

---

# 8. Team Ownership

Primary owners:

* **CS-C** for review action semantics
* **CS-A** for action contract and state mutation support

---

# 9. Acceptance Criteria

Accept when:

* one item can perform the core review actions
* review actions update the correct posture or state
* escalate cleanly hands off into dispute posture

---

# 10. Suggested PR Title

```text
feat: add item-level review actions
```

