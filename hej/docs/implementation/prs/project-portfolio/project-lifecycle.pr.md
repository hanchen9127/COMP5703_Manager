# project-lifecycle.pr.md

Status: Draft  
Owner track: Group B / CS-A Platform Core and API + CS-B Project and Task Workspace Frontend  
Primary milestone: M2 Project and Task Workflow  
Suggested submission window: Week 3-4  
PR type: state model and UI integration PR

---

# 1. Summary

Deliver **Project Lifecycle** as one PR that defines and exposes the project lifecycle clearly across API and UI.

This PR exists because project lifecycle is already part of the project model and is required for portfolio visibility, project overview, and operator routing.

---

# 2. Objective

Make project lifecycle a usable shared-core signal by:

* defining the allowed project states clearly
* exposing status in backend and frontend consistently
* making status visible in project portfolio and project workspace
* supporting basic status updates if required by the MVP flow

---

# 3. Governance Basis

Derived from:

* `docs/terminology/project-lifecycle.md`
* `docs/design/processes/project/project-process-map.md`
* `docs/design/processes/project/projects-ux-breakdown.md`
* `docs/design/processes/project/project-workspace-mvp-plan.md`
* `docs/design/database/db_schema_strategy.md`
* `docs/implementation/planning/milestone-definition.md`
* `docs/implementation/planning/team-allocation.md`

Key implications:

* users must be able to see project lifecycle states in the projects portfolio
* project overview should explain current status and next step
* task-level lifecycle remains separate; project lifecycle must not absorb task workflow semantics

---

# 4. In Scope

Include:

* formal project lifecycle vocabulary used by backend and frontend
* lifecycle display on `/projects`
* lifecycle display on `/projects/{projectId}`
* optional update path if `PATCH /projects/{projectId}` is part of the MVP slice
* status-based copy or badges that help users distinguish draft, active, and archived work

Likely status set for the first PR:

* `draft`
* `active`
* `archived`

---

# 5. Out of Scope

Do not include:

* task lifecycle redesign
* dispute or export state logic
* heavy project workflow engine
* speculative approval chains or auto-transition rules

If status history is introduced, keep it minimal. Full project governance history is not required for this PR.

---

# 6. Minimal Complete Slice

The smallest acceptable PR is:

```text
create or load project
-> see one valid project lifecycle state
-> see it reflected in projects portfolio and project overview
-> distinguish draft vs active vs archived in browser
```

If editing status is in scope, one visible update path should persist and re-render correctly.

---

# 7. Dependencies

Depends on:

* project model existing
* project retrieval API
* projects portfolio page
* project overview page

Helpful but not strictly blocking:

* status-aware filtering on `/projects`
* optional project status history storage

---

# 8. Team Ownership

Primary owners:

* **CS-A** for backend enum, validation, and optional update endpoint
* **CS-B** for lifecycle presentation in portfolio and project workspace

Coordination:

* CS-C if lifecycle wording needs to align with governance/control surfaces

---

# 9. Acceptance Criteria

Accept when:

* project lifecycle has one stable vocabulary across API and UI
* `/projects` visibly groups or signals project states
* `/projects/{projectId}` shows current status clearly
* project lifecycle does not collapse into task lifecycle or review status
* users can understand whether a project is only being prepared, currently running, or closed

---

# 10. Demo Expectation

Expected demo flow:

```text
open projects portfolio
-> inspect projects by lifecycle state
-> open one project
-> confirm project overview reflects current lifecycle stage and next-step posture
```

---

# 11. Suggested PR Title

```text
feat: define and surface project lifecycle
```
