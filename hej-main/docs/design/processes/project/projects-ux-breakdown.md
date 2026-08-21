# Projects UX Breakdown

Document: `projects-ux-breakdown.md`
Status: Draft
Scope:

Define the user experience breakdown for the `Projects` area in the current ToB-first operating model.

This document focuses on:

* information architecture
* page responsibilities
* UX priorities
* navigation and interaction expectations

This document does **not** define implementation details.

---

# 1. Source References

Read together with:

* `docs/design/processes/project/project-process-map.md`
* `docs/design/processes/project/project-workspace-mvp-plan.md`
* `docs/design/product/governed_human_judgment_infrastructure_workflows.md`
* `docs/design/product/one_core_two_operating_models.md`
* `docs/design/backend/api_surfaces.md`
* `docs/design/system/architecture_diagrams.md`
* `docs/implementation/planning/demo-scenarios.md`

---

# 2. UX Goal

The `Projects` area should help users do three things with low ambiguity:

1. understand the current portfolio of projects
2. create or enter the correct project quickly
3. move from project scope into task execution without getting lost

The UX should feel like an operational control plane, not like:

* a marketing surface
* a dead-end reporting dashboard
* a generic CRUD list with no workflow direction

---

# 3. UX Hierarchy

The intended hierarchy is:

```text
Global navigation
  -> Projects

Projects area
  -> Projects Overview
  -> Create Project
  -> Project Workspace

Project workspace
  -> Overview
  -> Tasks
  -> Disputes
  -> Exports
  -> Policies

Task workspace
  -> Overview
  -> Setup
  -> Items
  -> Annotate or Judge
  -> Review
  -> Dispute
  -> History
```

UX rule:

* `Projects` should orient and route
* `Project workspace` should group and govern
* `Task workspace` should execute

---

# 4. Core UX Principles

## 4.1 Overview First, But Operational

The top-level `Projects` page should start with:

* create project
* total project count
* project counts by status
* project list / table

These are not optional decorations.
They are the primary job of the page.

## 4.2 Make Status Visible Early

Users should not need to open each project to understand portfolio state.

At minimum, users should be able to see:

* total projects
* active projects
* draft / pilot / archived or other relevant statuses

## 4.3 Route Toward the Next Action

Every major projects surface should make the next move obvious.

Examples:

* portfolio page -> create or open a project
* project overview -> open tasks or related governance surfaces
* project tasks -> open task setup / items / review / history

## 4.4 Avoid Flat Overload

Do not place all project and task concerns on one page.

Users should not need to parse:

* project summary
* task table
* dispute list
* export list
* policy detail
* item-level work

all at once.

## 4.5 Preserve Operational Context

The user should always know:

* which organization they are in
* which project they are managing
* whether they are still in project scope or already in task scope

---

# 5. Page-Level UX Breakdown

## 5.1 `/projects` - Projects Overview

### Primary UX Jobs

* give a readable portfolio snapshot
* allow project creation
* help users identify the right project fast
* provide a stable landing page for project-oriented work

### First-Screen Priorities

The first visible region should contain:

1. page title and context
2. create project CTA
3. total project count
4. counts by status
5. project list or table

### Recommended Components

Core components:

* header
* create project CTA
* portfolio summary cards
* status breakdown
* project table / list

Supporting components:

* active backlog summary across projects
* disputes requiring attention
* export readiness summary
* recent project activity

### Interaction Expectations

Users should be able to:

* create a project in one obvious path
* scan statuses quickly
* sort or filter projects
* open a project from the primary list

### UX Warning

Do not let this page turn into a decorative “overview” with abstract cards but no strong project entry path.

---

## 5.2 `/projects/new` - Create Project

### Primary UX Jobs

* make project creation explicit
* keep organization ownership visible
* keep creation lightweight enough for MVP

### Required Inputs

* organization
* project name
* project description
* optional governance model
* initial status

### Interaction Expectations

Users should be able to:

* understand which organization will own the project
* create the project without admin-only detours
* land back in a sensible next state after creation

Preferred post-submit behavior:

* go to the newly created project workspace
  or
* return to projects overview with clear success feedback

---

## 5.3 `/projects/{projectId}` - Project Overview

### Primary UX Jobs

* explain what the project is
* summarize task portfolio state
* surface the most relevant next step
* make project-level governance surfaces visible

### Recommended Content Order

1. project identity and status
2. task counts and workload summary
3. next-step launch components
4. supporting governance visibility

### Recommended Components

Core components:

* project header
* task count / status summary
* “next actions” panel
* links to tasks, disputes, exports, policies

Supporting components:

* lead task spotlight
* backlog pressure summary
* dispute count
* export readiness signal

### Interaction Expectations

Users should be able to:

* understand the project in one glance
* enter the project tasks page quickly
* move into the most relevant task workspace
* reach disputes / exports / policies without hunting

---

## 5.4 `/projects/{projectId}/tasks` - Project Tasks

### Primary UX Jobs

* be the main operating list inside one project
* help users choose the right task
* bridge project scope to task execution

### Required Table Signals

Each task row should expose enough context to decide next action:

* task title
* annotation mode
* status
* backlog or workload pressure
* review / policy reference

### Required Actions

Each task row should clearly support entry into:

* `Setup`
* `Items`
* `Review`
* `History`

### UX Warning

The user should not need to first open task overview just to discover where setup or review lives.

---

## 5.5 `/projects/{projectId}/disputes` - Project Disputes

### Primary UX Jobs

* give cross-task escalation visibility
* help users understand which issues need attention

### Required Signals

* dispute status
* severity
* related task
* related item
* assignee or owner

### Interaction Expectations

Users should be able to:

* scan dispute backlog
* open the relevant dispute detail or task context

---

## 5.6 `/projects/{projectId}/exports` - Project Exports

### Primary UX Jobs

* show deliverable state at project scope
* keep export progress legible

### Required Signals

* export package status
* task source
* item count
* provenance inclusion
* destination or delivery state

### Interaction Expectations

Users should be able to:

* understand whether outputs are ready, building, delivered, or failed
* move toward export detail if needed

---

## 5.7 `/projects/{projectId}/policies` - Project Policies

### Primary UX Jobs

* expose workflow rules that shape downstream task execution
* help users understand the governance regime for the project

### Required Signals

* annotation mode references
* review policy references
* dispute policy references
* export policy references

### Interaction Expectations

Users should be able to:

* inspect policy context without entering admin
* understand how policies affect task setup and downstream review

---

# 6. Navigation Expectations

## 6.1 Global to Project

From global navigation, `Projects` should open the portfolio view, not jump directly into one arbitrary project.

## 6.2 Project to Task

The strongest primary path should be:

```text
Projects overview
  ->
Project workspace
  ->
Project tasks
  ->
Task setup / items / review / history
```

## 6.3 Project Subnav

Inside a project, navigation should remain stable:

* Overview
* Tasks
* Disputes
* Exports
* Policies

This stability matters more than clever shortcuts.

---

# 7. Interaction Patterns

## 7.1 Scanning

The UI should support fast scanning of:

* project counts
* project statuses
* task statuses
* dispute and export state

## 7.2 Filtering

The UI should support lightweight filtering where useful:

* projects by status
* tasks by mode or status
* disputes by severity or owner

## 7.3 Launching

Important workflow entry points should be explicit buttons or links, not buried in card copy.

## 7.4 Context Preservation

When moving from project to task scope, the user should retain enough context to understand:

* which project they came from
* why they entered this task surface

---

# 8. MVP UX Priorities

If scope is tight, prioritize in this order:

1. useful `Projects` overview
2. explicit create project flow
3. strong `Project -> Tasks` navigation
4. strong `Task setup / items / review / history` entry
5. project disputes / exports / policies visibility

This order keeps the UX aligned with:

* project as operational shell
* task as execution surface

---

# 9. Summary

The `Projects` UX should feel like:

```text
portfolio control plane
  -> create or enter the right project
  -> understand project state quickly
  -> route into governed task execution
  -> retain project-level governance visibility
```

The first success criterion is not visual polish.
It is whether users can immediately answer:

* how many projects exist
* what status they are in
* how to create one
* which one to open next
