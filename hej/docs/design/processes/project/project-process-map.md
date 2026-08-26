# Project Process Map

Document: `project-process-map.md`
Status: Draft
Scope:

Define what the `Projects` area should do in the current ToB-first operating model, which flows it owns, how it should present those flows in UX, and how it remains compatible with future marketplace evolution.

This document is process and surface design only.
It does **not** define implementation details.

---

# 1. Source References

This map should be read together with:

* `docs/design/product/governed_human_judgment_infrastructure_workflows.md`
* `docs/design/product/marketplace_evolution_workflows.md`
* `docs/design/product/one_core_two_operating_models.md`
* `docs/design/backend/api_surfaces.md`
* `docs/design/system/architecture_diagrams.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/design/processes/project/project-workspace-mvp-plan.md`
* `docs/terminology/governance-model.md`

Key governing ideas from those documents:

* `organization -> project -> task -> task_item` is the core execution hierarchy
* projects are operational containers, not storefront listings
* the shared core must survive future marketplace expansion
* project scope owns `Overview / Tasks / Disputes / Exports / Policies`
* task scope is execution-first, with review and dispute as downstream governance layers
* project scope is where users create and track multiple annotation or judgment tasks
* task creation should distinguish task class, task type, and execution mode
* `governance model` means the project-level governance posture shared across tasks, not a separate subsystem

---

# 2. Role of Project in the Shared Core

`Project` is the program-level operating container inside the shared core.

It exists to:

* group related tasks under one organization-owned work program
* provide one governance and delivery context for those tasks
* allow users to add multiple annotation and judgment task types under one program
* support task creation across text, image, audio, video, and judgment-oriented flows
* make task progress visible before users enter review or dispute work
* keep disputes, exports, and policy visibility coherent
* route operators into the correct task-level execution surface

It does **not** exist to:

* act like a public marketplace listing
* replace task-level workflow pages
* become a generic dashboard with no operational next step

In the current ToB-first mode:

* `Project` means an internal governed work program

In future marketplace-compatible mode:

* `Project` may also serve as the container behind a listing family or campaign

But the core execution object should remain stable.

---

# 3. UX Principles

Project UX should follow these principles:

## 3.1 Project Must Lead Users into Action

The `Projects` area should not be a dead-end reporting page.

Users should be able to:

* create a project
* understand portfolio status quickly
* open the correct project
* enter the right downstream surface with low ambiguity

## 3.2 Overview Must Be Operational

`Overview` is not just decorative summary.
It should support:

* project creation entry
* project count and status visibility
* fast understanding of portfolio health
* fast access into active work

## 3.3 Project Scope and Task Scope Must Stay Distinct

Project pages answer:

* which work program am I managing
* which tasks exist here
* what kind of work each task runs
* what task class, task type, and execution mode each task uses
* how far each task has progressed
* what is the state of disputes, exports, and policies

Task pages answer:

* how is this one task configured, launched, executed, and later governed

## 3.4 UX Should Reflect Hierarchy Clearly

The user should be able to perceive:

```text
Organization
  -> Projects
    -> one Project workspace
      -> one Task workspace
```

The UX should not flatten these levels into one oversized screen.

---

# 4. Process Ownership

The `Projects` area primarily owns these flows:

## 4.1 Project Portfolio Overview

Goal:

* show the portfolio of accessible projects
* make status and workload legible
* provide the entry point for creating a new project

Primary actors:

* admin
* task owner / manager

Core outcomes:

* user sees how many projects exist
* user sees project statuses
* user can enter or create the correct project

## 4.2 Organization-to-Project Setup

Goal:

* create a project under an organization
* establish the program container for related tasks

Primary actors:

* admin
* task owner / manager

Core outcomes:

* project belongs to the correct organization
* project metadata is visible
* project appears in the projects portfolio
* project is ready to hold multiple task types such as text, image, audio, video annotation, or judgment over answer/output pairs

## 4.3 Project Workspace Navigation

Goal:

* give one stable shell for project-level operations

Primary actors:

* task owner / manager
* reviewer
* admin

Core outcomes:

* users understand that project is the container for many tasks
* users can create a new task from project scope
* users can move into task setup, task items, annotation or judgement work, review, dispute, and history

## 4.4 Cross-Task Governance Visibility

Goal:

* keep disputes, exports, and policy context visible at the project level

Primary actors:

* task owner / manager
* reviewer
* admin

Core outcomes:

* disputes are visible across tasks
* exports are visible as program-level deliverables
* policies remain legible as governance context

## 4.5 Project-to-Task Creation and Launch

Goal:

* make project the obvious place to add and start new annotation or judgement tasks

Primary actors:

* task owner / manager
* admin when governance or integration visibility matters

Core outcomes:

* user can choose a task type such as text, image, audio, or video
* user can first choose whether the task class is `annotation` or `judgement`
* user can then choose the concrete task type
* user can connect or mock a storage-backed data source
* user can choose AI-assisted or human-first execution
* user can define shared annotation rules or shared judgement instructions before launch
* launched tasks return to the project portfolio with visible progress

---

# 5. Page Map

Project should be treated as a layered surface:

```text
Global
  -> Projects

Secondary
  -> Projects Overview
  -> Create Project
  -> Project Workspace

Tertiary
  -> Project Overview
  -> Project Tasks
  -> Project Disputes
  -> Project Exports
  -> Project Policies
```

Recommended conceptual route map:

```text
/projects
  -> overview of all accessible projects
  -> create project entry

/projects/new
  -> create project flow

/projects/{projectId}
  -> project overview

/projects/{projectId}/tasks
/projects/{projectId}/disputes
/projects/{projectId}/exports
/projects/{projectId}/policies
```

Task-level pages remain below project context conceptually, even if routed separately:

```text
/tasks/{taskId}/setup
/tasks/{taskId}/items
/tasks/{taskId}/review
/tasks/{taskId}/history
```

---

# 6. Page Responsibilities

## 6.1 `Projects` Overview

This is the top-level portfolio page.

It should do four things first:

1. allow project creation
2. show total accessible project count
3. show project counts by status
4. list or spotlight projects so the user can enter the right workspace

Only after that should it include secondary components such as:

* recent activity
* governance notes
* portfolio highlights
* quick links into active reviews or blocked items

Minimum visible components:

* create project CTA
* portfolio summary cards
* project status breakdown
* project list or table

Suggested supporting components:

* active workload or backlog summary across projects
* draft-vs-active signal
* recent disputes or export readiness summary

## 6.2 `Create Project`

This should be a focused flow, not buried inside admin.

It should capture:

* owning organization
* project name
* project description
* optional governance model as project-level governance posture, plus any operating notes
* initial status

UX requirement:

* creation should feel lightweight enough for MVP
* but still make organization ownership explicit

## 6.3 `Project Overview`

This is the shell entry for one project.

It should explain:

* what the project is
* how many tasks it contains
* what kinds of annotation tasks it can host
* what the project status is
* which next action is most relevant
* where disputes, exports, and policies sit

Primary UX job:

* route users into the right task or project-level sub-surface

## 6.4 `Project Tasks`

This is the main operational list inside one project.

It should:

* list tasks
* show task type / mode and status
* show data source connection state
* show progress or current execution stage
* show workload or backlog pressure
* support creating a new task
* route to `Setup / Items / annotation / Review / History`

This page is the primary bridge from project management into annotation execution.

## 6.5 `Project Disputes`

This page should aggregate cross-task escalations.

It should:

* show dispute status and severity
* show which task and item the dispute belongs to
* help users move back into task context

## 6.6 `Project Exports`

This page should show program-level delivery state.

It should:

* list export packages
* show readiness and delivery state
* show provenance inclusion signal

## 6.7 `Project Policies`

This page should make workflow rules visible.

It should:

* summarize project-relevant task policies
* make review / dispute / export expectations legible
* help users understand downstream governance

---

# 7. Core User Journeys

## 7.1 Portfolio-to-Project Entry

```text
User opens Projects
  ->
Sees project count and status breakdown
  ->
Finds target project
  ->
Opens project workspace
```

## 7.2 Create Project

```text
User opens Projects overview
  ->
Chooses Create Project
  ->
Selects organization
  ->
Enters project metadata
  ->
Creates project
  ->
Returns to project overview or lands in the new project workspace
```

## 7.3 Project-to-Task Execution

```text
User opens project workspace
  ->
Checks task portfolio state
  ->
Creates a task or chooses a task
  ->
Chooses task type, data source, mode, annotation rules, and launch options
  ->
Creates or launches task
  ->
Tracks task status and progress
  ->
Enters Setup, Items, Annotate, Review, Dispute, or History
```

## 7.4 Cross-Task Governance

```text
User opens project workspace
  ->
Checks disputes / exports / policies
  ->
Decides whether to return to a task workbench or remain at project scope
```

---

# 8. Minimal Conceptual Backend Contract

The `Projects` area implies a contract roughly like:

* `GET /organizations/{orgId}/projects`
* `POST /organizations/{orgId}/projects`
* `GET /projects/{projectId}`
* `PATCH /projects/{projectId}`
* `GET /projects/{projectId}/tasks`
* `POST /projects/{projectId}/tasks`
* `GET /projects/{projectId}/disputes`
* `GET /projects/{projectId}/exports`
* `GET /projects/{projectId}/policies`

Supporting task-entry paths:

* `GET /tasks/{taskId}`
* `GET /tasks/{taskId}/setup`
* `GET /tasks/{taskId}/task-items`
* `GET /tasks/{taskId}/history`

This is enough to express the process map without overcommitting to implementation.

---

# 9. Compatibility With Future Marketplace Evolution

This project map should remain valid if the product later grows a marketplace layer.

Compatibility rules:

* `Project` remains a shared-core object
* marketplace listing or campaign semantics may wrap around project scope
* project execution must not depend on listing, payment, or reputation data
* disputes, exports, provenance, and task governance remain core workflow concepts

So the correct architecture is:

* `Projects` stays in the shared core
* marketplace adds outer discovery and economics flows later

Not:

* replacing project scope with marketplace listing scope

---

# 10. Summary

The `Projects` area should be understood as:

```text
portfolio overview
  -> create or enter project
  -> manage one project as a governed work program
  -> create and track annotation tasks
  -> route into task execution
  -> retain cross-task governance visibility
```

For MVP, the UX priority is:

* make `Projects Overview` truly useful
* make project creation explicit
* make project status and counts immediately visible
* make `Project -> Task` creation and navigation obvious
* keep disputes, exports, and policies in project scope
