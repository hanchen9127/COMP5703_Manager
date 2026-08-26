# task-annotate-cs.pr.md

Status: Draft  
Owner track: Group B / CS-B Project and Task Workspace Frontend + CS-A Platform Core and API  
Primary milestone: M3 AI and Judgement Integration  
Suggested submission window: Week 5-6  
PR type: human-first annotation workspace PR

---

# 1. Summary

Deliver the CS-owned **annotation execution desk** for annotation-class tasks.

This PR covers the platform-side item desk, item opening flow, and human-first annotation handoff surface.

---

# 2. Objective

Make annotation execution operational by:

* showing annotation-task execution posture at task scope
* listing annotation items ready for work
* opening one item into item details and annotation work
* supporting human-first annotation runtime entry

---

# 3. Governance Basis

Derived from:

* `docs/design/product/annotation_strategy.md`
* `docs/design/processes/project/task-process-map.md`
* `docs/design/processes/project/task-ux-breakdown.md`
* `docs/design/product/workspace_surface_hierarchy.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/implementation/planning/minimal-working-slice.md`

Key implications:

* human-first is the default execution posture
* annotation execution is distinct from review
* external annotation runtime may be used, but task authority remains in platform scope

---

# 4. In Scope

Include:

* `/tasks/{taskId}/annotate` behavior for annotation tasks
* task-level execution summary and item filtering
* open-item flow into item details and annotation action
* Label Studio or equivalent human-annotation handoff framing
* browser-visible submit / save path or stubbed handoff path

Likely touched surfaces:

* `apps/hej-web/app/tasks/[taskId]/annotate/page.tsx`
* `apps/hej-web/components/task-annotation-workspace.tsx`
* `apps/hej-web/components/task-item-workspace-sheet.tsx`

---

# 5. Out of Scope

Do not include:

* AI candidate generation
* DS-side payload production
* review decisions
* dispute detection engine

---

# 6. Minimal Complete Slice

```text
open one annotation task
-> open annotate desk
-> filter ready items
-> open one item
-> hand off into human-first annotation runtime
```

---

# 7. Dependencies

Depends on:

* task items and item details
* annotation task class routing
* task setup already defining label schema and execution mode

---

# 8. Team Ownership

Primary owners:

* **CS-B** for execution desk and item interaction UX
* **CS-A** for runtime entry contract and annotation submit endpoint shape

---

# 9. Acceptance Criteria

Accept when:

* annotation tasks branch correctly into an annotation-specific desk
* human-first annotation can be entered from task scope
* label schema is consumed from setup rather than redefined here

---

# 10. Suggested PR Title

```text
feat: add human-first annotation task desk
```

