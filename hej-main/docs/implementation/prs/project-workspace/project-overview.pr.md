# project-overview.pr.md

Status: Draft  
Owner track: Group B / CS-B Project and Task Workspace Frontend  
Primary milestone: M2 Project and Task Workflow  
Suggested submission window: Week 4-5  
PR type: frontend integration PR

---

# 1. Summary

Deliver `/projects/{projectId}` as the operational **project overview** surface.

This page should explain what the project is, what task portfolio it contains, and what the most relevant next action is.

---

# 2. Objective

Make project overview real by:

* surfacing project identity and current posture
* summarizing task portfolio state
* exposing next actions into task setup, items, execution, review, and history
* keeping dispute, export, and policy visibility legible without replacing task execution

---

# 3. Governance Basis

Derived from:

* `docs/design/processes/project/project-process-map.md`
* `docs/design/processes/project/projects-ux-breakdown.md`
* `docs/design/processes/project/project-workspace-mvp-plan.md`
* `docs/terminology/project-lifecycle.md`
* `docs/terminology/governance-model.md`
* `docs/design/product/workspace_surface_hierarchy.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/implementation/planning/milestone-definition.md`

Key implications:

* project overview is an operational shell, not a decorative summary page
* it must route users toward task work first
* project-level governance surfaces should stay visible but secondary

---

# 4. In Scope

Include:

* `/projects/{projectId}` page composition
* project identity, lifecycle status, and governance posture
* task portfolio summary
* next-action cards into task workspace
* visible links to disputes, exports, and policies
* cross-task workload or backlog summary where feasible

Likely touched surfaces:

* `apps/hej-web/app/projects/[projectId]/page.tsx`
* `apps/hej-web/components/project-workspace-overview.tsx`
* `apps/hej-web/components/project-workspace-header.tsx`

---

# 5. Out of Scope

Do not include:

* task creation backend workflow
* task setup internals
* dispute-case handling logic
* export package generation logic
* policy administration engine

---

# 6. Minimal Complete Slice

The smallest acceptable PR is:

```text
open one project
-> understand what it is and what state it is in
-> see current task portfolio snapshot
-> identify the next operational action
-> navigate into tasks, disputes, exports, or policies
```

---

# 7. Dependencies

Depends on:

* project detail route
* project lifecycle vocabulary
* task portfolio data
* project-level navigation

Helpful but not strictly blocking:

* dispute summary counts
* export readiness signals

---

# 8. Team Ownership

Primary owner:

* **CS-B Project and Task Workspace Frontend**

Coordination:

* CS-A if project detail data shape needs adjustment
* CS-C for dispute, export, or policy summary alignment

---

# 9. Acceptance Criteria

Accept when:

* `/projects/{projectId}` reads as the operational shell for one governed work program
* project lifecycle and governance posture are visible
* task portfolio summary is meaningful
* next actions route clearly into downstream task work
* dispute, export, and policy surfaces are visible without taking over the page

---

# 10. Demo Expectation

Expected demo flow:

```text
open one project
-> inspect project posture and task portfolio
-> choose the next task-facing action
-> navigate into task workspace
```

---

# 11. Suggested PR Title

```text
feat: operationalize project overview workspace
```
