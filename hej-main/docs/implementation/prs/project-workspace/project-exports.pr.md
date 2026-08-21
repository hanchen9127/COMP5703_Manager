# project-exports.pr.md

Status: Draft  
Owner track: Group B / CS-C Dispute, Admin, and Control Surfaces + CS-B Project and Task Workspace Frontend  
Primary milestone: M4 ToB Workspace Completion  
Suggested submission window: Week 6-7  
PR type: delivery visibility PR

---

# 1. Summary

Deliver `/projects/{projectId}/exports` as the project-level **exports** surface.

This page should make delivery state visible for finalized work products inside one project.

---

# 2. Objective

Make project exports operational by:

* showing export package status
* exposing provenance-inclusion and destination signals
* helping users understand whether finalized work is export-ready, building, delivered, or failed

---

# 3. Governance Basis

Derived from:

* `docs/design/processes/project/project-process-map.md`
* `docs/design/processes/project/projects-ux-breakdown.md`
* `docs/design/product/workflow_states.md`
* `docs/design/system/system_design.md`
* `docs/design/product/workspace_surface_hierarchy.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/implementation/planning/milestone-definition.md`

Key implications:

* export is a downstream governance and delivery surface
* project scope is the right visibility layer because export tracks work across tasks
* exports must remain linked to finalized outputs and provenance expectations

---

# 4. In Scope

Include:

* `/projects/{projectId}/exports` page composition
* export package list or table
* visible export status
* provenance inclusion signal
* destination or delivery target summary
* enough metadata to understand readiness and delivery posture

Likely touched surfaces:

* `apps/hej-web/app/projects/[projectId]/exports/page.tsx`
* `apps/hej-web/components/project-export-table.tsx`

---

# 5. Out of Scope

Do not include:

* export package builder backend
* canonical judgment logic
* dispute workflow
* raw data hosting features

This PR is about project-level visibility of export packages, not end-to-end export generation.

---

# 6. Minimal Complete Slice

The smallest acceptable PR is:

```text
open project exports
-> see export package statuses
-> understand provenance inclusion and destination
-> identify whether one export is ready, delivered, or blocked
```

---

# 7. Dependencies

Depends on:

* export package objects existing in data model or fixtures
* project workspace existing
* export status vocabulary being stable

Helpful but not strictly blocking:

* richer provenance details
* delivery timestamps or failure reasons

---

# 8. Team Ownership

Primary owners:

* **CS-C** for export semantics and control-surface alignment
* **CS-B** for page composition and navigation integration

Coordination:

* CS-A if export list read endpoints need shaping

---

# 9. Acceptance Criteria

Accept when:

* `/projects/{projectId}/exports` shows project-level delivery posture clearly
* export package statuses are legible
* provenance inclusion and destination signals are visible
* the page reads as a governed delivery surface rather than a generic download list

---

# 10. Demo Expectation

Expected demo flow:

```text
open one project
-> open exports
-> inspect one export package
-> explain readiness, provenance inclusion, and delivery state
```

---

# 11. Suggested PR Title

```text
feat: operationalize project exports visibility
```
