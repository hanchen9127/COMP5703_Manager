# project-creation.pr.md

Status: Draft  
Owner track: Group B / CS-A Platform Core and API + CS-B Project and Task Workspace Frontend  
Primary milestone: M1 Core Contracts + Platform Foundation  
Suggested submission window: Week 2-3  
PR type: full-stack workflow PR

---

# 1. Summary

Deliver **Project Creation** as one end-to-end PR:

```text
open /projects or /projects/new
-> fill project creation form
-> submit to backend
-> persist project under the correct organization
-> return visible success or failure state
```

This is a shared-core PR because `project` is one of the top-level execution objects in:

```text
organization -> project -> task -> task item
```

---

# 2. Objective

Make project creation real rather than presentational by connecting:

* create-project entry in web
* organization-scoped create API
* persistence of the new project
* visible post-submit result in UI

This PR should prove that project creation is an operational workflow, not a mock-only page.

---

# 3. Governance Basis

Derived from:

* `docs/governance/canon.md`
* `docs/governance/requirements.md`
* `docs/design/processes/project/project-process-map.md`
* `docs/design/processes/project/projects-ux-breakdown.md`
* `docs/terminology/governance-model.md`
* `docs/implementation/planning/task-tree.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/implementation/planning/milestone-definition.md`
* `docs/implementation/planning/minimal-working-slice.md`
* `docs/implementation/planning/team-allocation.md`

Key implications:

* project creation is part of the minimal working slice
* project must belong to one organization
* creation should stay lightweight, but ownership and governance intent must remain visible

---

# 4. In Scope

Include:

* `/projects/new` create-project flow
* frontend form validation and submit states
* `POST /organizations/{orgId}/projects`
* backend request validation and error handling
* project persistence
* success path that returns users to the new project workspace or projects portfolio with clear feedback
* failure path with visible error state

Field scope for this PR:

* organization
* project name
* description
* optional governance model as project-level governance posture, or operating notes
* initial status if the backend accepts it in the current design

Likely touched surfaces:

* `apps/hej-web/app/projects/new/page.tsx`
* `apps/hej-web/components/project-create-form.tsx`
* `apps/hej-api/app/api/routes/organizations.py`
* `apps/hej-api/app/schemas/projects.py`
* `apps/hej-api/app/services/project_service.py`
* project persistence layer

---

# 5. Out of Scope

Do not include:

* full project workspace implementation
* cross-project portfolio redesign
* task creation
* project lifecycle management beyond creation
* standalone governance policy engine

`governance model` should not become a separate architecture track in this PR. At this stage it is acceptable as project metadata that captures project-level governance posture.

---

# 6. Minimal Complete Slice

The smallest acceptable PR is:

```text
open create project page
-> choose or confirm owning organization
-> enter name and description
-> submit
-> backend stores project
-> user sees success and can open the created project
```

Failure handling must also be browser-visible.

---

# 7. Dependencies

Depends on:

* organization object existing
* organization-scoped access or seeded tenant context
* project persistence repository

Helpful but not strictly blocking:

* project overview route
* projects portfolio refresh after create

---

# 8. Team Ownership

Primary owners:

* **CS-A** for API, schema, persistence, and organization validation
* **CS-B** for form flow, submit UX, and success or failure handling

Coordination:

* CS-C only if project-level governance copy or policy posture needs alignment

---

# 9. Acceptance Criteria

Accept when:

* a user can create a project from browser UI
* the backend persists the project under the intended organization
* success and failure both produce visible UI feedback
* the resulting project is retrievable through project list or project detail surfaces
* create flow does not hide organization ownership
* create flow remains lightweight enough for M1 or M2 usage

---

# 10. Demo Expectation

Expected demo flow:

```text
open projects
-> click create project
-> submit a new project
-> see persisted result
-> open the created project
```

This demo should satisfy the shared-core expectation that project creation is real and persisted.

---

# 11. Suggested PR Title

```text
feat: implement end-to-end project creation flow
```
