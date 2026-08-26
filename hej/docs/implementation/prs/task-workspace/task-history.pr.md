# task-history.pr.md

Status: Draft  
Owner track: Group B / CS-A Platform Core and API + CS-B Project and Task Workspace Frontend  
Primary milestone: M2 Project and Task Workflow  
Suggested submission window: Week 5-6  
PR type: provenance visibility PR

---

# 1. Summary

Deliver `/tasks/{taskId}/history` as the task-level **history** surface.

This page should help users reconstruct how the current task state was reached.

---

# 2. Objective

Make task history operational by:

* surfacing task-level activity and milestones
* exposing workflow progression clearly
* preserving append-oriented lineage visibility
* showing annotate or judge, review, and dispute transitions coherently at item-linked task scope

---

# 3. Governance Basis

Derived from:

* `docs/design/processes/project/task-process-map.md`
* `docs/design/processes/project/task-ux-breakdown.md`
* `docs/design/product/workflow_states.md`
* `docs/design/system/system_design.md`
* `docs/design/product/workspace_surface_hierarchy.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/implementation/planning/minimal-working-slice.md`

Key implications:

* history should explain workflow progression, not just log timestamps
* task-level history remains distinct from one item's detailed work panel

---

# 4. In Scope

Include:

* `/tasks/{taskId}/history` page composition
* task-level activity stream
* workflow step visibility
* provenance-relevant milestones

Likely touched surfaces:

* `apps/hej-web/app/tasks/[taskId]/history/page.tsx`
* `apps/hej-web/components/task-history-board.tsx`

---

# 5. Out of Scope

Do not include:

* complete provenance export engine
* project-level export visibility
* item-only audit dump without task framing

---

# 6. Minimal Complete Slice

The smallest acceptable PR is:

```text
open one task
-> open history
-> inspect workflow progression and recent activity
-> understand how current task posture was reached
```

---

# 7. Dependencies

Depends on:

* task workspace existing
* task activity data or fixtures

Helpful but not strictly blocking:

* task state history persistence
* richer lineage references to item-level events

---

# 8. Team Ownership

Primary owners:

* **CS-A** for history data contract
* **CS-B** for history page readability and presentation

---

# 9. Acceptance Criteria

Accept when:

* task history helps reconstruct workflow progression clearly
* users can see meaningful activity rather than a timestamp dump
* history remains task-scoped even if it references item-linked events

---

# 10. Demo Expectation

Expected demo flow:

```text
open one task
-> open history
-> inspect activity and workflow milestones
-> explain how the current task state was reached
```

---

# 11. Suggested PR Title

```text
feat: operationalize task history surface
```
