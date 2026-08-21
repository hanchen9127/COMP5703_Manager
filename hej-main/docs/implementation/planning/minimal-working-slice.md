# Minimal Working Slice

Document: `minimal-working-slice.md`
Version: v2.0
Status: Draft
Governance:

* Derived from `docs/design/system/system_design.md`
* Derived from `docs/design/product/workspace_surface_hierarchy.md`
* Derived from `docs/implementation/planning/integration-contract.md`
* Derived from `docs/implementation/planning/demo-scenarios.md`

Purpose:

Define the smallest shared-core slice that proves the platform is already a governed judgment system rather than a CRUD shell or model demo.

---

# 1. MWS Definition

The Minimal Working Slice should prove this flow:

```text
seeded or authenticated entry
-> open organization scope
-> create project
-> create task
-> bind schema and basic policy
-> register or import task items
-> open task items
-> complete one human-first annotation or judgement
-> perform one review action
-> inspect resulting history
```

The MWS may optionally include imported machine suggestions, but it does not require a stable AI-assisted loop yet.

---

# 2. Why This Slice

The correct MWS is not:

```text
project -> task -> label -> export
```

That would still be too close to a generic labeling tool.

The shared-core MWS must already prove:

* tenant scope
* project and task authority surfaces
* schema-aware task setup
* item-level execution
* review as a distinct downstream governance action
* history as an inspectable workflow trace

---

# 3. Required Domain Objects

Minimum required objects:

```text
organization
project
task
task_item
data_pointer or import registration record
output schema or decision schema
annotation or judgement record
review record
task state history
task item state history
```

Interpretation:

* `Project` and `Task` must be real workflow containers
* `TaskItem` must be the operational unit
* review cannot be collapsed into first-pass work

---

# 4. Required Capability Clusters

## 4.1 Entry and Scope

The system must support:

```text
seeded login or seeded authenticated user
organization-scoped access
project entry
```

## 4.2 Task Definition

The system must support:

```text
create task
set task class
set task type
set execution mode
bind output schema or decision schema
save minimal review policy posture
```

## 4.3 Task Item Bootstrap

The system must support:

```text
register dataset pointer or fixture-backed import
generate or import task items
list task items in the task workspace
```

## 4.4 Human-First Item Work

The system must support at least one of:

```text
submit a human-first annotation
submit a human-first judgement
```

The chosen path must be reviewable.

## 4.5 Review

The system must support:

```text
open one task item
inspect current candidate or first-pass output
accept, edit, reject, or escalate
record the review decision
```

## 4.6 History

The system must support:

```text
view resulting item state or review history
```

---

# 5. UI Interpretation

The MWS UI should already respect the current hierarchy:

```text
Projects Portfolio
-> Project Workspace
-> Task Workspace
-> Task items and item-level actions
```

Minimum visible surfaces:

* project creation or project overview
* task creation
* task setup
* task items
* one item-level annotate or judge path
* review
* history

Notes:

* `queue` is not required for the MWS
* dispute, export, and arbitration are not required in the first working slice

---

# 6. API Interpretation

Representative minimum API shape:

```text
POST /organizations
POST /projects
POST /projects/{project_id}/tasks
POST /tasks/{task_id}/schema-binding
POST /tasks/{task_id}/item-import or equivalent
GET  /tasks/{task_id}/items
POST /annotations or /judgements or task-item scoped equivalent
POST /reviews or task-item scoped review endpoint
GET  /tasks/{task_id}/history or equivalent
```

Exact route names may evolve.
Domain semantics should not.

---

# 7. DS and CS Contribution

## CS contribution

The CS team should own almost all of the MWS authority surface:

```text
organization/project/task objects
schema and policy binding surface
task items
review persistence
history visibility
```

## DS contribution

The DS team is optional for the strict MWS, but useful if ready.
DS can contribute:

```text
schema alignment feedback
fixture-backed item import examples
early candidate payload examples
```

This keeps the MWS viable even if AI-assisted integration is still stabilizing.

---

# 8. Constraints

Do not require the following in the MWS:

```text
stable AI-assisted loop
dispute workflow completion
arbitration completion
project-level export completion
dashboard breadth
marketplace or payment layers
```

Do not remove the following:

```text
organization scope
task setup semantics
task items
review
history
```

Those define the real product direction.

---

# 9. Success Criteria

The Minimal Working Slice is complete when:

```text
a user can enter organization scope
a project can be created
a task can be created and minimally configured
task items can be registered or generated
one human-first item can be completed
one review decision can be recorded
history reflects the workflow change
```

---

# 10. Summary

The correct MWS for this project is:

```text
tenant-scoped task execution with one reviewable human-first item
```

That is small enough to land early and strong enough to prove the shared core is real.
