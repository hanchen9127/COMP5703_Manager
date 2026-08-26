# project-governance-model.pr.md

Status: Draft  
Owner track: Group B / CS-A Platform Core and API + CS-B Project and Task Workspace Frontend  
Primary milestone: M2 Project and Task Workflow  
Suggested submission window: Week 3-4  
PR type: full-stack metadata and UI integration PR

---

# 1. Summary

Deliver **Project Governance Model** as one PR that makes project-level governance posture a real platform field rather than a mock-only label.

This PR should define, persist, and display `governance model` as project metadata that helps users understand the review, escalation, and delivery posture of a governed work program.

---

# 2. Objective

Make `governance model` operational by:

* defining one stable project-level vocabulary
* storing it on the project object
* exposing it through API and persistence
* showing it in project creation, project portfolio, and project overview

This PR should treat governance model as a **project posture preset**, not as a standalone workflow engine.

---

# 3. Governance Basis

Derived from:

* `docs/terminology/governance-model.md`
* `docs/design/processes/project/project-process-map.md`
* `docs/design/processes/project/projects-ux-breakdown.md`
* `docs/design/processes/project/project-workspace-mvp-plan.md`
* `docs/governance/canon.md`
* `docs/governance/requirements.md`
* `docs/implementation/planning/milestone-definition.md`
* `docs/implementation/planning/team-allocation.md`

Key implications:

* governance model belongs at the `Project` layer
* it expresses project-level review, escalation, ownership, and delivery posture
* it must not replace organization policy or task-specific workflow rules
* it should remain lightweight in MVP

---

# 4. In Scope

Include:

* stable governance model vocabulary for projects
* backend project schema support for governance model
* project persistence of governance model
* create-project input for governance model
* governance model display in `/projects`
* governance model display in `/projects/{projectId}`
* shared frontend mapping from stored value to label and description

Suggested first vocabulary:

* `standard`
* `dual_signoff`
* `expert_gate`
* `arbitration_ready`

These values may be shown with product-facing labels such as:

* `Standard`
* `Dual sign-off`
* `Expert gate`
* `Arbitration-ready`

Likely touched surfaces:

* `apps/hej-api/app/models/domain.py`
* `apps/hej-api/app/schemas/projects.py`
* `apps/hej-api/app/services/project_service.py`
* project repository or persistence layer
* `apps/hej-web/components/project-create-form.tsx`
* `apps/hej-web/components/projects-overview-panel.tsx`
* `apps/hej-web/components/project-workspace-header.tsx`
* `apps/hej-web/lib/project-data.ts`

---

# 5. Out of Scope

Do not include:

* standalone governance subsystem
* task-level rule engine
* automatic review routing logic
* automatic dispute creation logic
* export blocking or approval engine
* large policy administration surface

This PR may describe posture implications in UI, but it should not silently change workflow authority.

---

# 6. Minimal Complete Slice

The smallest acceptable PR is:

```text
open create project
-> choose governance model
-> submit project
-> backend stores governance model
-> open projects portfolio or project overview
-> see the selected governance posture rendered correctly
```

If update is included, one lightweight edit path may be added, but it is not required for the first slice.

---

# 7. Dependencies

Depends on:

* project creation flow
* project persistence
* project detail retrieval
* projects portfolio surface

Helpful but not strictly blocking:

* project update endpoint
* project policies page

---

# 8. Team Ownership

Primary owners:

* **CS-A** for enum or constrained value design, schema, API, and persistence
* **CS-B** for create-form input, label mapping, and display across project surfaces

Coordination:

* CS-C if wording needs alignment with project policy or control surfaces

---

# 9. Acceptance Criteria

Accept when:

* governance model has one stable meaning across docs, API, and UI
* project objects can persist and return the chosen governance model
* create-project flow allows governance model selection
* `/projects` and `/projects/{projectId}` show governance posture clearly
* displayed labels help users understand posture without implying a hidden rules engine
* governance model remains distinct from task policy, review rule, and dispute state

---

# 10. Demo Expectation

Expected demo flow:

```text
open create project
-> choose governance model such as dual sign-off or expert gate
-> create project
-> open project portfolio
-> confirm the governance posture is visible on the created project
-> open project overview
-> confirm the same posture appears consistently
```

This should prove governance model is a real project-level metadata field that supports portfolio understanding and project entry.

---

# 11. Suggested PR Title

```text
feat: persist and surface project governance model
```
