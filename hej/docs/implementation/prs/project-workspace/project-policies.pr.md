# project-policies.pr.md

Status: Draft  
Owner track: Group B / CS-C Dispute, Admin, and Control Surfaces + CS-B Project and Task Workspace Frontend  
Primary milestone: M4 ToB Workspace Completion  
Suggested submission window: Week 6-7  
PR type: governance context PR

---

# 1. Summary

Deliver `/projects/{projectId}/policies` as the project-level **policies** surface.

This page should make downstream workflow rules legible without turning project scope into an admin-heavy control plane.

---

# 2. Objective

Make project policies operational by:

* surfacing the workflow rules shaping tasks under one project
* showing review, dispute, export, or pointer-related policy references clearly
* helping users understand how governance context affects downstream task setup and execution

---

# 3. Governance Basis

Derived from:

* `docs/design/processes/project/project-process-map.md`
* `docs/design/processes/project/projects-ux-breakdown.md`
* `docs/design/processes/project/project-workspace-mvp-plan.md`
* `docs/design/system/system_design.md`
* `docs/design/product/workspace_surface_hierarchy.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/implementation/planning/milestone-definition.md`

Key implications:

* policy visibility belongs at project scope because tasks under one project should remain governable as one program
* this page should explain workflow posture, not replace admin ownership
* policy context should remain connected to real tasks and downstream review or export expectations

---

# 4. In Scope

Include:

* `/projects/{projectId}/policies` page composition
* policy summary for tasks under the project
* visible references for review, dispute, export, or pointer posture where relevant
* enough context to understand how policy shapes downstream task behavior

Likely touched surfaces:

* `apps/hej-web/app/projects/[projectId]/policies/page.tsx`
* `apps/hej-web/components/project-policy-panel.tsx`

---

# 5. Out of Scope

Do not include:

* full policy authoring engine
* role administration
* organization-wide admin controls
* review or dispute execution logic changes

This PR is about policy visibility and intelligibility, not complete policy administration.

---

# 6. Minimal Complete Slice

The smallest acceptable PR is:

```text
open project policies
-> inspect policy references linked to tasks
-> understand how review, dispute, pointer, or export posture affects work
```

---

# 7. Dependencies

Depends on:

* project workspace existing
* task-linked policy data or fixtures

Helpful but not strictly blocking:

* richer project-level governance posture
* admin-linked policy controls

---

# 8. Team Ownership

Primary owners:

* **CS-C** for governance semantics and policy framing
* **CS-B** for page composition and task-linked visibility

Coordination:

* CS-A if policy read endpoints or data shape need adjustment

---

# 9. Acceptance Criteria

Accept when:

* `/projects/{projectId}/policies` explains project-linked workflow rules clearly
* users can understand how policy context affects downstream task work
* the page stays connected to real tasks and governance surfaces
* policy visibility does not collapse into an oversized admin console

---

# 10. Demo Expectation

Expected demo flow:

```text
open one project
-> open policies
-> inspect task-linked review or export policy posture
-> explain how policy shapes downstream work
```

---

# 11. Suggested PR Title

```text
feat: operationalize project policies visibility
```
