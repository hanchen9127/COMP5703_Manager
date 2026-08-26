# project-tasks.pr.md

Status: Draft  
Owner track: Group B / CS-B Project and Task Workspace Frontend  
Primary milestone: M2 Project and Task Workflow  
Suggested submission window: Week 4-5  
PR type: frontend integration PR

---

# 1. Summary

Deliver `/projects/{projectId}/tasks` as the operational **project tasks** surface inside one project workspace.

This page should let users understand which tasks exist, what lifecycle state each task is in, what kind of work each task runs, and where to go next.

---

# 2. Objective

Make the project task list a real operating page by:

* surfacing task counts and task lifecycle states
* showing task class, task type, and execution mode clearly
* exposing one obvious create-task path
* routing users into the correct task workspace

---

# 3. Governance Basis

Derived from:

* `docs/design/processes/project/project-process-map.md`
* `docs/design/processes/project/projects-ux-breakdown.md`
* `docs/design/processes/project/task-process-map.md`
* `docs/design/processes/project/task-ux-breakdown.md`
* `docs/design/product/workspace_surface_hierarchy.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/implementation/planning/milestone-definition.md`
* `docs/implementation/planning/team-allocation.md`

Key implications:

* this page belongs to project scope, not task scope
* it is the bridge from project management into task execution
* it must remain annotation-first while keeping judgement first-class

---

# 4. In Scope

Include:

* `/projects/{projectId}/tasks` page composition
* task summary cards or metrics
* task table or list
* visible task lifecycle, task class, task type, and execution mode
* backlog or workload signal where feasible
* create-task CTA
* direct entry into task workspace

Likely touched surfaces:

* `apps/hej-web/app/projects/[projectId]/tasks/page.tsx`
* `apps/hej-web/components/project-task-table.tsx`
* project-to-task navigation surfaces

---

# 5. Out of Scope

Do not include:

* project-level create-task entry semantics if split into its own PR
* task setup implementation
* item-level dispute handling
* export package generation
* task review or history logic changes

This page may show dispute or export signals, but it should not become their authority surface.

---

# 6. Minimal Complete Slice

The smallest acceptable PR is:

```text
open project tasks
-> see which tasks exist
-> understand task lifecycle and work types
-> create a task or open an existing task
-> reach the right downstream task workspace
```

---

# 7. Dependencies

Depends on:

* project workspace existing
* task list data
* task lifecycle vocabulary
* task workspace routes

Helpful but not strictly blocking:

* task backlog count
* dispute or export counts per task

---

# 8. Team Ownership

Primary owner:

* **CS-B Project and Task Workspace Frontend**

Coordination:

* CS-A if task list data shape or read endpoints need adjustment
* CS-C if cross-task governance summary signals appear here

---

# 9. Acceptance Criteria

Accept when:

* `/projects/{projectId}/tasks` reads as the main project-level task portfolio
* task lifecycle is legible at first scan
* task class, task type, and execution mode are visible
* users can create a task from one obvious path
* users can open the correct task workspace without ambiguity

---

# 10. Demo Expectation

Expected demo flow:

```text
open one project
-> open project tasks
-> inspect task mix and lifecycle states
-> create a task or open an existing task
-> enter task workspace
```

---

# 11. Suggested PR Title

```text
feat: operationalize project tasks surface
```
