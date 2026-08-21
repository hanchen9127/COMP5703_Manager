# task-lifecycle.pr.md

Status: Draft  
Owner track: Group B / CS-A Platform Core and API + CS-B Project and Task Workspace Frontend  
Primary milestone: M2 Project and Task Workflow  
Suggested submission window: Week 4  
PR type: state model and UI integration PR

---

# 1. Summary

Deliver **Task Lifecycle** as one PR that defines and exposes task lifecycle consistently across API and UI.

Task lifecycle is a formal operational signal, not just a badge.

---

# 2. Objective

Make task lifecycle usable by:

* defining one stable task lifecycle vocabulary
* exposing it in backend and frontend consistently
* showing it in project tasks and task workspace
* supporting lawful task state changes where required

---

# 3. Governance Basis

Derived from:

* `docs/design/product/workflow_states.md`
* `docs/design/processes/project/task-process-map.md`
* `docs/design/processes/project/task-ux-breakdown.md`
* `docs/terminology/task-lifecycle.md`
* `docs/design/product/workspace_surface_hierarchy.md`
* `docs/implementation/planning/milestone-definition.md`
* `docs/implementation/planning/team-allocation.md`

Key implications:

* task lifecycle is distinct from task-item lifecycle
* task lifecycle must not collapse into review or dispute states
* `DRAFT` is setup-oriented and `ACTIVE` is execution-oriented

---

# 4. In Scope

Include:

* formal task lifecycle vocabulary
* lifecycle display on project tasks
* lifecycle display on task workspace header and relevant subpages
* optional state update path if current MVP needs it

Expected first vocabulary:

* `draft`
* `active`
* `paused`
* `completed`
* `archived`

---

# 5. Out of Scope

Do not include:

* task-item state redesign
* dispute-case lifecycle
* export-package lifecycle
* automatic state engine with complex hidden transitions

---

# 6. Minimal Complete Slice

The smallest acceptable PR is:

```text
create or load task
-> see one valid task lifecycle state
-> see it reflected in project tasks and task workspace
-> distinguish draft vs active vs completed in browser
```

---

# 7. Dependencies

Depends on:

* task model existing
* task retrieval API
* project tasks page
* task workspace routes

Helpful but not strictly blocking:

* task state history persistence

---

# 8. Team Ownership

Primary owners:

* **CS-A** for backend enum, validation, and optional update endpoint
* **CS-B** for task lifecycle presentation in project tasks and task workspace

---

# 9. Acceptance Criteria

Accept when:

* task lifecycle has one stable vocabulary across docs, API, and UI
* project tasks visibly show task lifecycle states
* task workspace shows current task status clearly
* task lifecycle stays distinct from item review or dispute state

---

# 10. Demo Expectation

Expected demo flow:

```text
open project tasks
-> inspect tasks by lifecycle state
-> open one task
-> confirm task workspace reflects current lifecycle stage
```

---

# 11. Suggested PR Title

```text
feat: define and surface task lifecycle
```
