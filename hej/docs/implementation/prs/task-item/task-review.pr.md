# task-review.pr.md

Status: Draft  
Owner track: Group B / CS-B Project and Task Workspace Frontend + CS-C Dispute, Admin, and Control Surfaces  
Primary milestone: M3 AI and Judgement Integration  
Suggested submission window: Week 5-6  
PR type: task-level desk PR

---

# 1. Summary

Deliver `/tasks/{taskId}/review` as the task-level **review desk**.

This page should show review-oriented summary, filters, and item rows at task scope, then route into item-level review action.

---

# 2. Objective

Make task review operational by:

* surfacing review posture at task scope
* showing review-relevant item rows
* supporting filters and scanning
* routing into item-level review work
* making human-vs-AI candidate posture legible for both annotation and judgement tasks

---

# 3. Governance Basis

Derived from:

* `docs/design/processes/project/task-process-map.md`
* `docs/design/processes/project/task-ux-breakdown.md`
* `docs/design/processes/project/task-structure-diagram.md`
* `docs/design/product/workspace_surface_hierarchy.md`
* `docs/terminology/task-schema-and-policy.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/implementation/planning/minimal-working-slice.md`

Key implications:

* review remains downstream of first-pass work
* this is a task-level desk page
* actual review decisions still target `TaskItem`
* review should mirror annotate or judge desk structure, but with governance actions instead of first-pass creation
* review consumes schema-defined outputs and policy-defined review rules, but does not redefine either

---

# 4. In Scope

Include:

* `/tasks/{taskId}/review` page composition
* review-oriented summary cards or workflow block
* item filters and table
* route into item-level review action
* task-level ownership and recent activity where useful
* review posture for annotation and judgement tasks

Likely touched surfaces:

* `apps/hej-web/app/tasks/[taskId]/review/page.tsx`
* `apps/hej-web/components/task-workbench.tsx`
* `apps/hej-web/components/task-item-workspace-sheet.tsx`

---

# 5. Out of Scope

Do not include:

* project-level dispute board
* arbitration decision surface
* full item-level provenance page

---

# 6. Minimal Complete Slice

The smallest acceptable PR is:

```text
open one task
-> open review desk
-> inspect review summary and item rows
-> open one item into review action
```

---

# 7. Dependencies

Depends on:

* task workspace existing
* task item list data
* item-level work panel existing or in parallel

Helpful but not strictly blocking:

* richer review-specific filters
* disagreement summary signals
* DS-provided candidate confidence or rationale fields

---

# 8. Team Ownership

Primary owners:

* **CS-B** for task-level desk composition and routing
* **CS-C** for review and escalation semantics

Coordination:

* CS-A if review-oriented task-item data shape needs adjustment

---

# 9. Acceptance Criteria

Accept when:

* `/tasks/{taskId}/review` reads as a task-level review desk
* review remains visibly downstream from first-pass work
* review can inspect either annotation outputs or judgement outputs without semantic collapse
* users can scan, filter, and open one item into review
* the page does not confuse task-level desk behavior with item-level editor behavior

---

# 10. Demo Expectation

Expected demo flow:

```text
open one task
-> open review desk
-> inspect review posture
-> open one item into review action
```

---

# 11. Suggested PR Title

```text
feat: operationalize task review desk
```
