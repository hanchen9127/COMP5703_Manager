# task-judge-cs.pr.md

Status: Draft  
Owner track: Group B / CS-B Project and Task Workspace Frontend + CS-A Platform Core and API  
Primary milestone: M3 AI and Judgement Integration  
Suggested submission window: Week 5-6  
PR type: human-first judgement workspace PR

---

# 1. Summary

Deliver the CS-owned **judgement execution desk** for judgement-class tasks.

This PR covers platform-side judgement item flow, verdict entry surface, and human-first judgement handling.

---

# 2. Objective

Make judgement execution operational by:

* showing judgement-task execution posture at task scope
* listing judgement items ready for work
* opening one item into item details and verdict entry
* supporting human-first structured judgement

---

# 3. Governance Basis

Derived from:

* `docs/design/processes/project/task-process-map.md`
* `docs/design/processes/project/task-structure-diagram.md`
* `docs/design/product/workspace_surface_hierarchy.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/implementation/planning/integration-contract.md`

Key implications:

* judgement is a first-class task class, not a review alias
* decision schema is defined in setup and consumed here
* human-first remains the default entry path unless ai_assisted is selected

---

# 4. In Scope

Include:

* `/tasks/{taskId}/annotate` behavior for judgement tasks using `Judge` wording
* task-level judgement summary and item filtering
* item-level verdict and rationale entry framing
* stable use of decision schema defined in setup

---

# 5. Out of Scope

Do not include:

* DS model generation
* automated review
* dispute detection engine
* project-level dispute visibility

---

# 6. Minimal Complete Slice

```text
open one judgement task
-> open judge desk
-> filter ready items
-> open one item
-> enter one verdict and rationale against the configured decision schema
```

---

# 7. Dependencies

Depends on:

* judgement task class routing
* decision schema defined in setup
* item details surface

---

# 8. Team Ownership

Primary owners:

* **CS-B** for judgement desk and item UX
* **CS-A** for verdict submit contract and state update

---

# 9. Acceptance Criteria

Accept when:

* judgement tasks branch into judgement-specific desk language
* decision schema is consumed rather than re-authored here
* one item can be judged with verdict and rationale in human-first mode

---

# 10. Suggested PR Title

```text
feat: add human-first judgement task desk
```

