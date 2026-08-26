# task-item-import.pr.md

Status: Draft  
Owner track: Group B / CS-A Platform Core and API + CS-B Project and Task Workspace Frontend  
Primary milestone: M2 Project and Task Workflow  
Suggested submission window: Week 4-5  
PR type: task setup extension PR

---

# 1. Summary

Deliver **task item import and generation** as a setup-owned PR.

This PR covers dataset pointer registration, import posture, and generating or linking task items under one task.

---

# 2. Objective

Make task item intake operational by:

* registering pointer or import source
* generating or linking task items under one task
* surfacing import or generation posture in setup
* making task items available to the items desk

---

# 3. Governance Basis

Derived from:

* `docs/design/processes/project/task-process-map.md`
* `docs/design/product/annotation_strategy.md`
* `docs/implementation/planning/minimal-working-slice.md`
* `docs/implementation/planning/integration-contract.md`

Key implications:

* raw data remains externally governed
* task setup owns pointer and import readiness
* item generation should not be hidden inside task creation

---

# 4. In Scope

Include:

* pointer or source registration UX/API
* task-item generation or linking path
* import status visibility in setup
* visible item availability signal after generation

---

# 5. Out of Scope

Do not include:

* annotate or judge workbench
* review actions
* DS candidate generation

---

# 6. Minimal Complete Slice

```text
open task setup
-> register pointer or source
-> generate task items
-> confirm items now exist for the task
```

---

# 7. Dependencies

Depends on:

* task creation
* task setup
* task items page

---

# 8. Team Ownership

Primary owners:

* **CS-A** for pointer contract and task-item generation
* **CS-B** for setup visibility and state feedback

---

# 9. Acceptance Criteria

Accept when:

* one task can register a source and generate task items
* import posture is visible in setup
* generated items become visible in task items

---

# 10. Suggested PR Title

```text
feat: add task item import and generation flow
```

