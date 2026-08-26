# task-items.pr.md

Status: Draft  
Owner track: Group B / CS-A Platform Core and API + CS-B Project and Task Workspace Frontend  
Primary milestone: M2 Project and Task Workflow  
Suggested submission window: Week 4-5  
PR type: workflow surface PR

---

# 1. Summary

Deliver `/tasks/{taskId}/items` as the operational **task items** surface.

This PR should make task items legible as the atomic workflow unit and route users into the right execution or governance step.

---

# 2. Objective

Make task items operational by:

* listing task items clearly
* surfacing item states
* showing workload or runtime pressure where useful
* routing users into annotate or judge, review, dispute, or item detail where appropriate

---

# 3. Governance Basis

Derived from:

* `docs/design/processes/project/task-process-map.md`
* `docs/design/processes/project/task-ux-breakdown.md`
* `docs/design/processes/project/task-structure-diagram.md`
* `docs/design/product/workflow_states.md`
* `docs/design/product/workspace_surface_hierarchy.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/implementation/planning/minimal-working-slice.md`

Key implications:

* `TaskItem` is the atomic workflow unit
* `Items` is the task-level item index
* AI-assisted and human-first tasks may enter the item flow differently
* a future `Queue` runtime monitor may exist for AI-assisted progress, but it should not replace `Items`

---

# 4. In Scope

Include:

* task items page composition
* item list or board
* item state badges
* workload summary
* filters or scanning aids
* quick path into annotate or judge, review, dispute, or item detail
* state-aware explanation for AI-assisted vs human-first entry

Likely touched surfaces:

* `apps/hej-web/app/tasks/[taskId]/items/page.tsx`
* `apps/hej-web/components/task-item-table.tsx`
* `apps/hej-web/components/task-items-board.tsx`

---

# 5. Out of Scope

Do not include:

* full annotate or judge workbench
* review decision mechanics
* project-level dispute management
* export generation

This PR may link into review or dispute, but it should not absorb their authority.

---

# 6. Minimal Complete Slice

The smallest acceptable PR is:

```text
open task items
-> see task items and their states
-> scan which items are ready or blocked
-> open the next meaningful item into the correct downstream surface
```

---

# 7. Dependencies

Depends on:

* task existing
* task item generation or fixture-backed task items
* task-item state vocabulary

Helpful but not strictly blocking:

* mode-aware candidate availability signals
* backlog or runtime metrics

---

# 8. Team Ownership

Primary owners:

* **CS-A** for task-item list and state data contract
* **CS-B** for items UI, filtering, and routing into task work

Coordination:

* DS if AI-assisted candidate availability needs to be represented accurately

---

# 9. Acceptance Criteria

Accept when:

* task items are visible as a dedicated task-level surface
* item states are legible and meaningful
* users can identify the next item to work on quickly
* task-item routing into annotate or judge, review, dispute, or history is clear
* the page reinforces task-item atomicity rather than hiding it

---

# 10. Demo Expectation

Expected demo flow:

```text
open one task
-> open task items
-> inspect item states
-> open one item into the next correct surface
```

---

# 11. Suggested PR Title

```text
feat: operationalize task items surface
```
