# task-dispute.pr.md

Status: Draft  
Owner track: Group B / CS-C Dispute, Admin, and Control Surfaces + CS-B Project and Task Workspace Frontend  
Primary milestone: M4 ToB Workspace Completion  
Suggested submission window: Week 6-7  
PR type: task-level dispute desk PR

---

# 1. Summary

Deliver task-level **dispute** as a task workspace tab or desk.

This surface should show dispute-eligible or escalated items inside one task without replacing project-level dispute visibility.

---

# 2. Objective

Make task dispute operational by:

* showing dispute-related item filters and counts at task scope
* listing escalated or dispute-eligible items
* routing into item-linked dispute handling
* making automatic disagreement-triggered dispute posture visible when cross-validation rules are configured

---

# 3. Governance Basis

Derived from:

* `docs/design/processes/project/task-process-map.md`
* `docs/design/processes/project/task-structure-diagram.md`
* `docs/design/product/workspace_surface_hierarchy.md`
* `docs/terminology/task-schema-and-policy.md`
* `docs/design/product/workflow_states.md`
* `docs/implementation/planning/demo-scenarios.md`

Key implications:

* this is a task-level dispute desk, not the cross-task dispute visibility surface
* actual dispute authority still links back to item-level disagreement and review escalation
* task-level dispute should prefer auto-detected disagreement over user-self-opened ad hoc dispute
* dispute consumes setup-defined disagreement sampling and dispute policy rather than inventing rules locally

---

# 4. In Scope

Include:

* task-level dispute tab or page
* item-level dispute filters and counts
* visible dispute-related item list
* route into item-linked dispute handling
* disagreement-triggered dispute visibility for sampled or cross-validated items

---

# 5. Out of Scope

Do not include:

* project-level dispute board
* arbitration decision page
* manual self-service dispute opening by the first annotator as the primary design

---

# 6. Minimal Complete Slice

The smallest acceptable PR is:

```text
open one task
-> open dispute desk
-> inspect escalated or dispute-eligible items
-> open one item into dispute handling
```

---

# 7. Dependencies

Depends on:

* task workspace existing
* item-level dispute signal or fixtures

Helpful but not strictly blocking:

* arbitration linkage
* configurable cross-validation percentage or routing rule from setup

---

# 8. Team Ownership

Primary owners:

* **CS-C** for dispute semantics and auto-detection posture
* **CS-B** for task-level page integration

---

# 9. Acceptance Criteria

Accept when:

* task dispute reads as an in-task dispute desk
* it stays distinct from project-level disputes
* dispute posture is explainable as disagreement-detected rather than arbitrary user complaint flow
* users can understand which items are in dispute posture and open them accordingly

---

# 10. Demo Expectation

Expected demo flow:

```text
open one task
-> open dispute tab
-> inspect one dispute-eligible item
-> route into item-linked dispute handling
```

---

# 11. Suggested PR Title

```text
feat: add task-level dispute desk
```
