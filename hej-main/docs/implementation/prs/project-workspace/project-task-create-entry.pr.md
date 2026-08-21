# project-task-create-entry.pr.md

Status: Draft  
Owner track: Group B / CS-B Project and Task Workspace Frontend  
Primary milestone: M2 Project and Task Workflow  
Suggested submission window: Week 4  
PR type: project-level entry PR

---

# 1. Summary

Deliver the **create-task entry flow** inside `/projects/{projectId}/tasks`.

This PR covers the project-level handoff into task creation, not the full task-creation backend contract.

---

# 2. Objective

Make project-to-task creation obvious by:

* exposing one clear create-task CTA in project scope
* making the create-vs-open distinction legible
* routing users from project tasks into the task creation flow without ambiguity

---

# 3. Governance Basis

Derived from:

* `docs/design/processes/project/project-process-map.md`
* `docs/design/processes/project/projects-ux-breakdown.md`
* `docs/design/product/workspace_surface_hierarchy.md`
* `docs/implementation/planning/demo-scenarios.md`

Key implications:

* project tasks is the launch hub into task creation
* the entry flow should stay at project scope
* actual task persistence remains owned by task creation

---

# 4. In Scope

Include:

* create-task CTA placement in `/projects/{projectId}/tasks`
* explanatory copy for create vs continue existing task
* route handoff into task creation page
* task portfolio page behavior after return from creation

---

# 5. Out of Scope

Do not include:

* `POST /projects/{projectId}/tasks`
* task persistence
* task setup fields
* item import

---

# 6. Minimal Complete Slice

```text
open project tasks
-> click create task
-> land in task creation flow
-> return cleanly into project task portfolio
```

---

# 7. Dependencies

Depends on:

* project tasks page
* task creation route existing

---

# 8. Team Ownership

Primary owner:

* **CS-B** for project-level task launch UX

---

# 9. Acceptance Criteria

Accept when:

* project tasks exposes one obvious create-task path
* users can tell whether they should create a new task or continue an existing one
* handoff into task creation is clean and project-scoped

---

# 10. Suggested PR Title

```text
feat: add project task creation entry flow
```

