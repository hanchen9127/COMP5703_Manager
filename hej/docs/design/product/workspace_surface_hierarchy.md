# Workspace Surface Hierarchy

Document: `workspace_surface_hierarchy.md`  
Status: Draft  
Scope:

Define the authoritative page hierarchy, page naming, page responsibilities, and object vocabulary for the current HEJ workspace.

This document exists because the platform already has a stable object hierarchy and route structure, but page names, task-level tabs, and item-level work actions can still be described ambiguously if they are not pinned down explicitly.

This document is a **surface and terminology clarification** document.
It does not define backend implementation details.

---

# 1. Why This Document Exists

The current product has three different concepts that are easy to mix together:

* **object hierarchy**
  `Organization -> Project -> Task -> TaskItem`
* **page hierarchy**
  portfolio pages, project workspace pages, and task workspace pages
* **operation target**
  the object a user is actually acting on

The key source of confusion is:

* a page may be a **Task-level page**
* but the action taken on that page may still target a **TaskItem**

This document separates:

* what each page is called
* which object the page is about
* which object the user is acting on
* what belongs on the page
* what does not belong on the page

---

# 2. Core Hierarchy

The durable object hierarchy remains:

```text
Organization
  ->
Project
  ->
Task
  ->
TaskItem
```

Meaning:

* `Organization`
  tenant boundary and top-level governance ownership
* `Project`
  governed work program container
* `Task`
  one concrete annotation or judgement task inside a project
* `TaskItem`
  atomic work unit that humans and AI actually operate on

Rule:

* humans and AI do not really annotate a `Task`
* they work on `TaskItem`s inside a `Task` workspace

---

# 3. Naming Rules

To reduce ambiguity, the following terms should be used consistently.

Use:

* `Projects Portfolio`
  for the global `/projects` page
* `Project Workspace`
  for the set of pages under `/projects/{projectId}`
* `Task Workspace`
  for the set of pages under `/tasks/{taskId}`
* `TaskItem Work Panel`
  for the item-level side sheet or panel opened from task-level pages

Avoid vague phrases such as:

* `project page`
* `task page`
* `review page`
* `dispute page`

unless the route and level are made explicit.

---

# 4. Top-Level Surface Hierarchy

The current top-level workspace structure is:

```text
Dashboard
Organizations
Projects
Admin
```

Current code alignment:

* `/`
  Dashboard
* `/organizations/{organizationId}`
  Organization overview
* `/projects`
  Projects Portfolio
* `/admin`
  Admin

These are global navigation surfaces.
They are not project-scoped or task-scoped pages.

---

# 5. Project Layer

## 5.1 Projects Portfolio

Route:

```text
/projects
```

Page object:

* `Project collection`

Primary actions target:

* `Project`

Responsibilities:

* show accessible projects
* support create project
* show project status and governance posture
* help users choose the correct project workspace

Does not own:

* task execution
* item-level review
* dispute handling logic
* export package internals

---

## 5.2 Project Creation

Route:

```text
/projects/new
```

Page object:

* new `Project`

Primary actions target:

* `Project`

Responsibilities:

* create a project under an organization
* collect initial project metadata
* establish lifecycle and governance posture inputs

---

## 5.3 Project Workspace

Project workspace is the project-scoped shell under:

```text
/projects/{projectId}
```

It is not a single page only.
It is a scoped workspace with multiple project-level pages:

```text
Project Workspace
  -> Overview
  -> Tasks
  -> Disputes
  -> Exports
  -> Policies
```

Page object:

* one `Project`

Primary actions target:

* usually `Project`
* sometimes routing into `Task`

Responsibilities:

* explain the project as a governed work program
* make task portfolio visible
* keep cross-task governance surfaces visible
* route users into the right task workspace

Does not own:

* task setup internals
* item-level annotation or judgement work
* item-level review decisions

---

## 5.4 Project Overview

Route:

```text
/projects/{projectId}
```

Page object:

* `Project`

Primary actions target:

* `Project`
* route into `Task`

Responsibilities:

* show project identity, lifecycle, and governance posture
* summarize task portfolio
* highlight next actions into task work
* keep disputes, exports, and policies visible as secondary project-level surfaces

---

## 5.5 Project Tasks

Route:

```text
/projects/{projectId}/tasks
```

Page object:

* `Project`

Primary actions target:

* `Task`

Responsibilities:

* act as the task portfolio inside one project
* show which tasks exist
* show task status, task class, task type, and execution mode
* create a task
* route into the right task workspace

Important clarification:

* this page is **inside Project Workspace**
* it is **not** the task workspace itself

---

## 5.6 Project Disputes

Route:

```text
/projects/{projectId}/disputes
```

Page object:

* `Project`

Primary actions target:

* `DisputeCase`
* route back to `Task` or `TaskItem`

Responsibilities:

* show cross-task dispute visibility
* surface severity, assignment, and escalation posture
* keep dispute visibility at project scope

Important clarification:

* disputes originate from item-level disagreement or review escalation
* project disputes page is a visibility surface, not the origin of dispute semantics

---

## 5.7 Project Exports

Route:

```text
/projects/{projectId}/exports
```

Page object:

* `Project`

Primary actions target:

* `ExportPackage`

Responsibilities:

* show delivery posture across work in the project
* expose export package status and provenance inclusion
* keep exports visible as project-level deliverables

---

## 5.8 Project Policies

Route:

```text
/projects/{projectId}/policies
```

Page object:

* `Project`

Primary actions target:

* `Project` policy context
* task-linked policy references

Responsibilities:

* show governance context that shapes downstream task work
* keep project-linked policy references legible

Does not own:

* full admin policy authoring
* tenant-wide administration

---

# 6. Task Layer

## 6.1 Task Workspace

Task workspace is the task-scoped shell under:

```text
/tasks/{taskId}
```

It is also not a single page only.
It is a scoped workspace with multiple task-level tabs:

```text
Task Workspace
  -> Overview
  -> Setup
  -> Items
  -> Annotate or Judge
  -> Review
  -> Dispute
  -> History
```

Page object:

* one `Task`

Primary actions target:

* page-level state is about `Task`
* row-level actions usually target `TaskItem`

This distinction is critical:

* **Task pages are about one task**
* but **work performed from those pages often acts on task items**

---

## 6.2 Task Overview

Route:

```text
/tasks/{taskId}
```

Page object:

* `Task`

Primary actions target:

* `Task`
* route into `TaskItem` work surfaces

Responsibilities:

* explain what the task is
* show task configuration posture
* summarize item counts and workflow progress
* route into Setup, Items, Annotate or Judge, Review, and History

---

## 6.3 Task Setup

Route:

```text
/tasks/{taskId}/setup
```

Page object:

* `Task`

Primary actions target:

* `Task`

Responsibilities:

* define or inspect task configuration
* show task class, task type, execution mode, rules, schema, data source, and readiness
* explain whether task can move beyond `DRAFT`

---

## 6.4 Task Items

Route:

```text
/tasks/{taskId}/items
```

Page object:

* `Task`

Primary actions target:

* `TaskItem`

Responsibilities:

* act as the neutral item index for the task
* show item list and item state
* support scanning and filtering
* route into item-level work from a task-level page

Important clarification:

* `Items` is not the same as the item work panel
* it is the task-level item index
* `Queue` should not be used as an alias for `Items`
* if a future `Queue` surface exists, it should mean runtime monitoring for AI-assisted processing, backlog, or candidate-generation progress

---

## 6.5 Task Annotate or Judge

Route:

```text
/tasks/{taskId}/annotate
```

Label rule:

* use `Annotate` for annotation tasks
* use `Judge` for judgement tasks

Page object:

* `Task`

Primary actions target:

* `TaskItem`

Responsibilities:

* act as the task-level execution desk
* show execution summary, filters, and item rows
* route users into item-level annotate or judge work

Important clarification:

* this is a **task-level desk page**
* it is not merely one item editor
* actual first-pass work still happens on `TaskItem`s

---

## 6.6 Task Review

Route:

```text
/tasks/{taskId}/review
```

Page object:

* `Task`

Primary actions target:

* `TaskItem`

Responsibilities:

* act as the task-level review desk
* show review-oriented summary, filters, and item rows
* route users into item-level review actions

Important clarification:

* `Review` is still a **task-level page**
* but the accept / edit / reject / escalate action is taken on `TaskItem`

---

## 6.7 Task Dispute

Current status:

* not yet implemented as a dedicated task tab in code
* should still be recognized in the intended hierarchy

Intended route shape:

```text
/tasks/{taskId}/dispute
```

Page object:

* `Task`

Primary actions target:

* dispute-eligible `TaskItem`

Responsibilities:

* act as a task-level dispute desk
* show escalated or dispute-eligible items inside one task
* route into item-linked dispute handling

Important clarification:

* this does **not** replace project-level disputes
* project-level disputes remain the cross-task visibility surface
* task-level dispute would be the in-task dispute desk or index

---

## 6.8 Task History

Route:

```text
/tasks/{taskId}/history
```

Page object:

* `Task`

Primary actions target:

* `Task`
* inspect `TaskItem` lineage indirectly

Responsibilities:

* show task-level activity
* expose workflow milestones and provenance-relevant events
* help reconstruct how the current task state was reached

---

# 7. Item-Level Operation Layer

The task workspace pages above are all **task-level pages**.
They often contain task-level summary and filters first.

Actual detailed work on one item happens in a separate operation layer:

```text
Task-level desk page
  ->
select item row
  ->
open TaskItem Work Panel
```

This is the correct place for:

* item details
* annotate or judge controls
* review controls
* dispute-triggering actions

Current code alignment:

* `TaskWorkbench` is a task-level review desk
* `TaskItemWorkspaceSheet` is the item-level work panel
* the sheet currently contains:
  * `Items details`
  * `Annotate or Judge`
  * `Review`

So the correct interpretation is:

* page object = `Task`
* operation target = `TaskItem`

---

# 8. Special Global Case Pages

The current implementation also includes global detail pages for downstream governance objects:

* `/disputes/{disputeId}`
* `/exports/{exportId}`
* `/arbitration/{arbitrationId}`

These should be treated as **detail pages for governance cases or packages**, not as replacements for project-scoped visibility pages.

Interpretation:

* project-scoped pages provide scoped visibility and entry
* global detail pages provide case-level or package-level deep inspection

---

# 9. Current Implementation Ambiguities

The current codebase already shows the intended hierarchy in many places, but several route and naming ambiguities remain.

## 9.1 `Queue` vs `Items`

Current interpretation:

* `Items` is the authoritative task-item index page
* `Queue` should only be used for a future runtime-monitoring surface

Recommendation:

* when discussing the actual implemented page, say `Task Items`
* do not use `Queue` as a synonym for item browsing
* if `Queue` is later added, reserve it for AI-assisted progress, backlog, or candidate-generation monitoring

## 9.2 `Review` and `Annotate or Judge` Naming

Potential confusion:

* they can sound like item editors only

But current implementation shows they are:

* task-level desk pages with metrics, filters, and item rows

Recommendation:

* describe them as `task-level desks`
* describe item-level editing as happening inside the `TaskItem Work Panel`

## 9.3 Task-Level Dispute vs Project-Level Disputes

Potential confusion:

* dispute is item-originated
* but dispute visibility also exists at project scope

Clarification:

* `Project Disputes`
  cross-task dispute visibility
* `Task Dispute`
  task-level dispute desk or filtered index, if implemented
* `TaskItem` / dispute action
  the actual escalation target

---

# 10. Authoritative Surface Map

The current intended map should be read as:

```text
Global
  -> Dashboard
  -> Organizations
  -> Projects Portfolio
  -> Admin

Projects Portfolio
  -> Create Project
  -> Open one Project Workspace

Project Workspace
  -> Overview
  -> Tasks
  -> Disputes
  -> Exports
  -> Policies

Project Tasks
  -> Create Task
  -> Open one Task Workspace

Task Workspace
  -> Overview
  -> Setup
  -> Items
  -> Annotate or Judge
  -> Review
  -> Dispute
  -> History

Task-level desk page
  -> select one TaskItem
  -> open TaskItem Work Panel

TaskItem Work Panel
  -> Item details
  -> Annotate or Judge
  -> Review
  -> Dispute action
```

---

# 11. Writing Guidance

When future design, PR, or implementation docs refer to a page, they should specify:

1. the route or exact surface name
2. the page object
3. the operation target if different

Example good phrasing:

* `Project Tasks is the project-scoped task portfolio page`
* `Task Review is a task-level review desk`
* `TaskItem Work Panel is the item-level operation layer opened from task-level pages`

Avoid phrasing like:

* `review happens on the task page`
* `dispute is a project page`
* `items page is the same thing as annotate`

because those phrases erase the separation between:

* workspace level
* action level
* object hierarchy
