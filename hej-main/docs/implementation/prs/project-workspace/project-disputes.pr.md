# project-disputes.pr.md

Status: Draft  
Owner track: Group B / CS-C Dispute, Admin, and Control Surfaces + CS-B Project and Task Workspace Frontend  
Primary milestone: M4 ToB Workspace Completion  
Suggested submission window: Week 6-7  
PR type: governance visibility PR

---

# 1. Summary

Deliver `/projects/{projectId}/disputes` as the project-level **disputes** surface.

This page should make cross-task escalation visible inside one project without pretending that disputes originate at project level.

---

# 2. Objective

Make project disputes operational by:

* showing dispute cases that arose from item-level disagreement or review escalation
* keeping severity, status, assignee, and routing visible
* linking users back into the originating task or item context

---

# 3. Governance Basis

Derived from:

* `docs/design/processes/project/project-process-map.md`
* `docs/design/processes/project/projects-ux-breakdown.md`
* `docs/design/processes/project/task-process-map.md`
* `docs/design/product/workflow_states.md`
* `docs/design/product/workspace_surface_hierarchy.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/implementation/planning/milestone-definition.md`
* `docs/implementation/planning/team-allocation.md`

Key implications:

* dispute authority begins from item-level disagreement or review escalation
* dispute visibility belongs at project scope because it cuts across tasks
* project disputes page should not erase the originating task-item lineage

---

# 4. In Scope

Include:

* `/projects/{projectId}/disputes` page composition
* dispute case list or board
* visible dispute status, severity, assignee, and summary
* links back to originating task or item context
* enough state to understand whether the project currently has unresolved escalations

Likely touched surfaces:

* `apps/hej-web/app/projects/[projectId]/disputes/page.tsx`
* `apps/hej-web/components/project-dispute-table.tsx`

---

# 5. Out of Scope

Do not include:

* item-level dispute creation flow
* arbitration decision workflow implementation
* task review mechanics
* export generation

This PR is primarily about project-level visibility and navigation for dispute cases.

---

# 6. Minimal Complete Slice

The smallest acceptable PR is:

```text
open project disputes
-> see active dispute cases
-> understand dispute status and severity
-> open the originating task or item context
```

---

# 7. Dependencies

Depends on:

* dispute cases existing in data model or fixtures
* project workspace existing
* task or item links being stable

Helpful but not strictly blocking:

* arbitration visibility
* richer dispute summaries

---

# 8. Team Ownership

Primary owners:

* **CS-C** for dispute semantics and control-surface alignment
* **CS-B** for page composition and navigation integration

Coordination:

* CS-A if dispute list read endpoints need shaping

---

# 9. Acceptance Criteria

Accept when:

* `/projects/{projectId}/disputes` shows cross-task dispute visibility clearly
* dispute status, severity, and assignment are legible
* users can route back into the relevant task or item context
* the page reinforces that disputes originate from governed review or disagreement, not from abstract project metadata

---

# 10. Demo Expectation

Expected demo flow:

```text
open one project
-> open disputes
-> inspect one active escalation
-> navigate back to the relevant task context
```

---

# 11. Suggested PR Title

```text
feat: operationalize project disputes visibility
```
