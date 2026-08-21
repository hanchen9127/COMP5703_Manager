# task-item-details.pr.md

Status: Draft  
Owner track: Group B / CS-B Project and Task Workspace Frontend + CS-A Platform Core and API  
Primary milestone: M2 Project and Task Workflow  
Suggested submission window: Week 5  
PR type: item-level operation surface PR

---

# 1. Summary

Deliver the reusable **TaskItem details** layer opened from task-level desks.

This PR is the shared item shell used by annotate, judge, review, and dispute flows.

---

# 2. Objective

Make item-level work possible by:

* showing one `TaskItem` clearly
* exposing source context and external reference
* surfacing current item state and prior candidate or draft output
* giving downstream desks a stable item-level container

---

# 3. Governance Basis

Derived from:

* `docs/design/product/workspace_surface_hierarchy.md`
* `docs/design/processes/project/task-process-map.md`
* `docs/design/processes/project/task-ux-breakdown.md`
* `docs/design/processes/project/task-structure-diagram.md`
* `docs/implementation/planning/minimal-working-slice.md`

Key implications:

* `TaskItem` is the atomic workflow unit
* task-level tabs remain desks, but actual work targets one item
* item details should stay reusable across annotate, judge, review, and dispute

---

# 4. In Scope

Include:

* item-level work panel or detail container
* source preview and external reference visibility
* item status visibility
* candidate / draft / review context where available
* stable open / close behavior from task-level desks

Likely touched surfaces:

* `apps/hej-web/components/task-item-workspace-sheet.tsx`
* task-item detail contracts in task workspace pages

---

# 5. Out of Scope

Do not include:

* full annotate controls
* full judge controls
* review decision logic
* dispute routing logic

This PR establishes the reusable item shell, not the downstream decisions themselves.

---

# 6. Minimal Complete Slice

```text
open one task
-> open one item from task items / annotate / review
-> inspect source, state, and current output posture
-> stay in a stable item-level container for downstream work
```

---

# 7. Dependencies

Depends on:

* task items surface
* task-item read contract

Helpful but not strictly blocking:

* richer candidate lineage
* review history snippet

---

# 8. Team Ownership

Primary owners:

* **CS-B** for reusable item panel UX
* **CS-A** for item read shape and state payload

---

# 9. Acceptance Criteria

Accept when:

* one item can be opened consistently from task-level desks
* source context, status, and current output posture are visible
* the item shell can be reused by annotate, judge, review, and dispute without semantic drift

---

# 10. Suggested PR Title

```text
feat: add reusable task item details work panel
```

