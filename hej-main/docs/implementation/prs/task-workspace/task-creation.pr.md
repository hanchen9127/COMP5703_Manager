# task-creation.pr.md

Status: Draft  
Owner track: Group B / CS-A Platform Core and API + CS-B Project and Task Workspace Frontend  
Primary milestone: M2 Project and Task Workflow  
Suggested submission window: Week 3-4  
PR type: full-stack workflow PR

---

# 1. Summary

Deliver **Task Creation** as one end-to-end PR:

```text
open project tasks
-> click create task
-> define initial task fields
-> submit to backend
-> persist task under the correct project
-> land in task workspace
```

Task creation is a shared-core workflow because task is the execution-level object under project scope.

---

# 2. Objective

Make task creation real rather than presentational by connecting:

* create-task entry in project scope
* `POST /projects/{projectId}/tasks`
* task persistence
* visible success or failure handling in UI

---

# 3. Governance Basis

Derived from:

* `docs/design/processes/project/task-process-map.md`
* `docs/design/processes/project/task-ux-breakdown.md`
* `docs/design/product/workflow_states.md`
* `docs/design/product/workspace_surface_hierarchy.md`
* `docs/implementation/planning/task-tree.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/implementation/planning/milestone-definition.md`
* `docs/implementation/planning/minimal-working-slice.md`
* `docs/implementation/planning/team-allocation.md`

Key implications:

* task creation must distinguish task class, task type, and execution mode
* task begins as `DRAFT`
* task creation should not collapse into review-first semantics

---

# 4. In Scope

Include:

* create-task route and form
* frontend validation and submit states
* project-scoped task create API
* task persistence
* success path into task workspace
* failure path with visible UI error handling

Initial field scope should include:

* project
* task title
* task objective or judgement question
* task class
* task type
* execution mode

---

# 5. Out of Scope

Do not include:

* full task setup and readiness workflow
* review decision handling
* dispute workflow
* export generation

Task creation may seed setup fields, but it should not absorb all setup responsibility.

Task creation may create the initial container for item import, but detailed pointer registration, schema binding, policy posture, and readiness checks belong in task setup.

---

# 6. Minimal Complete Slice

The smallest acceptable PR is:

```text
open create task
-> choose task class, task type, and execution mode
-> submit
-> backend stores task in draft
-> user lands in the created task workspace
```

---

# 7. Dependencies

Depends on:

* project existing
* project tasks route
* task persistence model

Helpful but not strictly blocking:

* task setup page
* task lifecycle display

---

# 8. Team Ownership

Primary owners:

* **CS-A** for API, schema, persistence, and project validation
* **CS-B** for form flow, submit UX, and route handoff into task workspace

Coordination:

* DS only if task type vocabulary or judgement-specific field wording needs alignment

---

# 9. Acceptance Criteria

Accept when:

* a user can create a task from browser UI
* the backend persists the task under the correct project
* task class, task type, and execution mode are captured distinctly
* the created task is visible in project tasks and task workspace
* success and failure states are both browser-visible

---

# 10. Demo Expectation

Expected demo flow:

```text
open project tasks
-> click create task
-> create one annotation or judgement task
-> see persisted result
-> open created task
```

---

# 11. Suggested PR Title

```text
feat: implement end-to-end task creation flow
```
