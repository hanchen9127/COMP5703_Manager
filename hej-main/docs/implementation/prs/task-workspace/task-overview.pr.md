# task-overview.pr.md

Status: Draft  
Owner track: Group B / CS-B Project and Task Workspace Frontend  
Primary milestone: M2 Project and Task Workflow  
Suggested submission window: Week 4-5  
PR type: frontend integration PR

---

# 1. Summary

Deliver `/tasks/{taskId}` as the operational **task overview** surface.

This page should explain one task clearly, summarize its posture, and route users into the correct next task-level tab.

---

# 2. Objective

Make task overview operational by:

* surfacing task identity, lifecycle, class, type, and mode
* showing item counts and workflow posture
* exposing the next relevant route into setup, items, annotate or judge, review, dispute, or history

---

# 3. Governance Basis

Derived from:

* `docs/design/processes/project/task-process-map.md`
* `docs/design/processes/project/task-ux-breakdown.md`
* `docs/design/processes/project/task-structure-diagram.md`
* `docs/design/product/workspace_surface_hierarchy.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/implementation/planning/milestone-definition.md`

Key implications:

* task overview is a task-level shell page
* it should orient the user before they drop into items or task-level desks

---

# 4. In Scope

Include:

* `/tasks/{taskId}` page composition
* task identity and lifecycle summary
* item and workflow summary
* next-action cards into task tabs
* task-level ownership or posture summary where useful

Likely touched surfaces:

* `apps/hej-web/app/tasks/[taskId]/page.tsx`
* `apps/hej-web/components/task-overview-panel.tsx`

---

# 5. Out of Scope

Do not include:

* task setup internals
* item-level editor itself
* review decision mechanics
* dispute handling mechanics

---

# 6. Minimal Complete Slice

The smallest acceptable PR is:

```text
open one task
-> understand what it is and how it runs
-> see item and workflow posture
-> choose the next task-level tab confidently
```

---

# 7. Dependencies

Depends on:

* task workspace existing
* task lifecycle vocabulary
* task item summary data

Helpful but not strictly blocking:

* richer workflow progress data

---

# 8. Team Ownership

Primary owner:

* **CS-B Project and Task Workspace Frontend**

Coordination:

* CS-A if task summary data shape needs adjustment

---

# 9. Acceptance Criteria

Accept when:

* `/tasks/{taskId}` reads as the home page for one task workspace
* task lifecycle, class, type, and mode are visible
* users can understand the next task-level step quickly

---

# 10. Demo Expectation

Expected demo flow:

```text
open one task
-> inspect task posture
-> choose setup, items, annotate or judge, review, dispute, or history
```

---

# 11. Suggested PR Title

```text
feat: operationalize task overview surface
```
