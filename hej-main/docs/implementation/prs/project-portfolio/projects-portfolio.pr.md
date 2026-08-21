# projects-portfolio.pr.md

Status: Draft  
Owner track: Group B / CS-B Project and Task Workspace Frontend  
Primary milestone: M2 Project and Task Workflow  
Suggested submission window: Week 4-5  
PR type: frontend integration PR

---

# 1. Summary

Deliver `/projects` as the operational **projects portfolio** surface.

This page should behave like the entry point for project-oriented work: users must be able to understand portfolio state, create a project, and enter the correct project workspace quickly.

---

# 2. Objective

Make `/projects` a real portfolio page rather than a decorative overview by:

* surfacing meaningful project counts and statuses
* showing project mix across annotation and judgement work
* giving one obvious create-project path
* routing users into the right project workspace

---

# 3. Governance Basis

Derived from:

* `docs/design/processes/project/project-process-map.md`
* `docs/design/processes/project/projects-ux-breakdown.md`
* `docs/design/processes/project/project-workspace-mvp-plan.md`
* `docs/terminology/governance-model.md`
* `docs/terminology/project-lifecycle.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/implementation/planning/milestone-definition.md`
* `docs/implementation/planning/team-allocation.md`

Key implications:

* `/projects` is the portfolio layer above task execution
* it must show project lifecycle and next action clearly
* it should support both annotation-first and judgement-aware task mixes
* `governance model` on this page means project-level governance posture, not a separate governance subsystem

---

# 4. In Scope

Include:

* `/projects` page composition
* portfolio summary cards
* visible project lifecycle breakdown
* project list or table with clear entry into project workspace
* create-project CTA
* filtering or sorting that materially helps users find the right project
* project metadata display that helps portfolio scanning, such as organization, lifecycle, governance model, and task mix

Likely touched surfaces:

* `apps/hej-web/app/projects/page.tsx`
* `apps/hej-web/components/projects-overview-panel.tsx`
* `apps/hej-web/components/organization-project-table.tsx`

---

# 5. Out of Scope

Do not include:

* create-project backend workflow
* project workspace implementation
* task creation flow
* dispute, export, or policy detail pages
* dashboard-level cross-system aggregation

This PR may display governance model as project-level governance posture, but it should not invent a separate governance subsystem.

---

# 6. Minimal Complete Slice

The smallest acceptable PR is:

```text
open /projects
-> understand how many projects exist
-> see project lifecycle states
-> identify at least one project quickly
-> click into the correct project workspace
-> see an obvious create-project path
```

The page is not complete if it only shows decorative cards without clear project entry.

---

# 7. Dependencies

Depends on:

* project list data
* stable project lifecycle vocabulary
* create-project route
* project workspace route

Helpful but not strictly blocking:

* task counts or backlog summary per project
* dispute or export readiness signals

---

# 8. Team Ownership

Primary owner:

* **CS-B Project and Task Workspace Frontend**

Coordination:

* CS-A if portfolio data shape needs additional read endpoints
* CS-C if dispute or governance summary signals appear on the page

---

# 9. Acceptance Criteria

Accept when:

* `/projects` reads as the main portfolio surface for governed work programs
* users can create a project from one obvious path
* project cards or rows show enough metadata to choose the right workspace
* project lifecycle is visible and legible
* annotation and judgement work can both be perceived in the portfolio
* the page routes cleanly into `/projects/{projectId}`

---

# 10. Demo Expectation

Expected demo flow:

```text
open /projects
-> inspect portfolio summary
-> filter or scan projects
-> create or choose one project
-> enter project workspace
```

This should prove that project portfolio management is operational before users drop into task execution.

---

# 11. Suggested PR Title

```text
feat: operationalize projects portfolio surface
```
