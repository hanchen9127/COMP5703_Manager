# Task Process Map

Document: `task-process-map.md`
Status: Draft
Scope:

Define what the `Task` area should do inside the shared core, which workflows it owns, and how it should connect project scope to item-level governed execution.

This document is process and surface design only.
It does **not** define implementation details.

---

# 1. Source References

This map should be read together with:

* `docs/design/processes/project/project-process-map.md`
* `docs/design/processes/project/project-workspace-mvp-plan.md`
* `docs/design/product/governed_human_judgment_infrastructure_workflows.md`
* `docs/design/system/system_design.md`
* `docs/design/product/workflow_states.md`
* `docs/design/backend/api_surfaces.md`
* `docs/implementation/planning/demo-scenarios.md`

Key governing ideas from those documents:

* task may be an annotation-first workflow or a judgement-first workflow, but not a review-first workflow
* task scope owns setup, item preparation, first-pass execution, review, and history
* `TaskItem` is the atomic workflow unit
* task setup happens while task is `DRAFT`
* annotation or judgement is the main production flow
* review, dispute, provenance, and export are downstream governance layers

---

# 2. Role of Task in the Shared Core

`Task` is the execution-level container for one annotation or judgment task inside a project.

It exists to:

* define one concrete annotation or judgment task inside a project
* choose task class, task type, and execution mode
* connect to the source data that will become task items
* choose whether the task starts with AI-assisted execution or human-first execution
* define shared annotation instructions or judgment instructions that can guide both humans and AI
* define output format or decision schema and downstream workflow rules
* provide the shell for item visibility, execution desks, review, dispute, and history
* govern item-level progression after annotation begins

It does **not** exist to:

* behave like an ungoverned labeling batch
* collapse annotation and review into one ambiguous step
* bypass dispute, provenance, or state history requirements

Framing rule:

* annotation or judgment is the primary production layer
* review and dispute are the platform's governance innovation layer
* setup should feel like configuring a runnable task, not preparing a review backlog

---

# 3. Process Ownership

The `Task` area primarily owns these flows:

## 3.1 Task Definition and Launch Configuration

Goal:

* define one runnable annotation or judgment task

Primary actors:

* task owner / manager
* admin when policy visibility or governance constraints matter

Core outcomes:

* task has title and objective
* task class is defined
* task type is defined
* execution mode is defined
* output format or decision schema is linked
* shared annotation instructions or judgment instructions are defined
* workflow rules are visible
* data source connection is ready or pending
* advanced options can be added without blocking the basic path
* task remains `DRAFT` until configuration is sufficient

Typical setup choices include:

* task class such as annotation or judgement
* task type such as text, image, audio, or video annotation, or answer evaluation / verdict collection
* source data location or storage address
* AI-assisted or human-first execution mode
* shared annotation instructions or judgment rubric
* advanced or governance-sensitive options
* future cloud storage integrations such as Google Cloud, AWS, or Azure, with mock data sources acceptable in MVP

## 3.2 Data Source Registration and Task Item Generation

Goal:

* connect the task to external data without making the platform the raw data owner

Primary actors:

* task owner / manager
* system

Core outcomes:

* data source link is registered
* task items are generated or linked
* upload, storage-path, or integration-backed source states are visible
* task items can be opened

## 3.3 Launch, Status, and Annotation Execution

Goal:

* launch the task and expose the item set entering annotation execution

Primary actors:

* task owner / manager
* annotator
* reviewer after candidate outputs exist

Core outcomes:

* task status is visible after creation
* task progress is visible while work is running
* item statuses are visible
* backlog or runtime pressure is visible
* the user can enter the correct annotation path
* AI-assisted and human-first tasks can diverge while staying in one task shell
* AI-assisted tasks can run candidate generation in the background
* human-first tasks can open directly into the annotate workspace from a task item

## 3.4 Review Operations

Goal:

* govern first-pass outputs through explicit human review after execution work has started

Primary actors:

* reviewer
* task owner / manager for oversight

Core outcomes:

* accept / edit / reject is explicit
* disagreement and dispute remain available
* item state progresses lawfully

## 3.5 History and Provenance Visibility

Goal:

* expose append-preserving operational and workflow history

Primary actors:

* reviewer
* task owner / manager
* admin when governance evidence is needed

Core outcomes:

* activity is visible
* workflow lineage is visible
* users can understand how current state was reached

---

# 4. Page Map

Task should be treated as a stable workspace under project context:

```text
Project workspace
  -> Tasks
    -> one Task workspace

Task workspace
  -> Setup
  -> Items
  -> Annotate or Judge
  -> Review
  -> Dispute
  -> History
```

Recommended conceptual route map:

```text
/tasks/{taskId}/setup
/tasks/{taskId}/items
/tasks/{taskId}/annotate
/tasks/{taskId}/review
/tasks/{taskId}/dispute
/tasks/{taskId}/history
```

These surfaces should remain distinct because they answer different operational questions.
Annotation runtime may open from the items desk or direct task-item entry, but should remain conceptually part of task execution rather than a separate top-level governance surface.

---

# 5. Page Responsibilities

## 5.1 `Setup`

Purpose:

* define the task before active execution begins

Should include:

* task identity and annotation objective
* task class
* task type
* execution mode
* shared annotation instructions
* output format reference
* workflow rules reference
* data source state
* launch readiness
* advanced configuration summary when present

Primary workflow question:

* is this task valid and ready to leave `DRAFT`

Task setup should make the naming hierarchy explicit:

* `task class`
  annotation or judgement
* `task type`
  the concrete modality or judgement use case
* `execution mode`
  ai-assisted or human-first

## 5.2 `Items`

Purpose:

* show the task item set as the neutral object-level index for one task

Should include:

* item list
* item state
* external reference / preview signal
* item state summary
* quick path into annotation, judgement, or review context where appropriate
* progress signal for AI-assisted or human-first execution

Primary workflow question:

* which items are ready, in progress, or ready for the next execution or governance step

## 5.3 `Annotate`

Purpose:

* provide the primary execution workbench before review begins

Should include:

* task-item context
* mode-aware execution controls
* task-class-aware work surface
* shared rules or rubric visibility
* direct save / submit action

For `annotation` tasks:

* show source content and structured labeling controls

For `judgement` tasks:

* show source context, answer/output under judgement, and a decision workspace for verdict plus rationale

Primary workflow question:

* what is the correct first-pass output for this task item
## 5.4 `Review`

Purpose:

* act as the downstream governed workbench after annotation outputs exist

Should include:

* item context
* candidate annotation visibility
* reviewer actions
* assignment and SLA context if relevant
* activity signal
* disagreement / escalation path

Primary workflow question:

* what human decision should be made on this item right now

## 5.5 `History`

Purpose:

* expose append-preserving activity and workflow progression

Should include:

* activity timeline
* workflow lineage
* key transitions
* provenance-adjacent detail

Primary workflow question:

* how did this task or item reach its current governed state

---

# 6. Core User Journeys

## 6.1 Project-to-Task Setup

```text
User opens project tasks
  ->
Chooses create task
  ->
Defines task type, data source, mode, shared annotation rules, output format, and advanced options
  ->
Creates task in draft
  ->
Opens setup
  ->
Confirms launch readiness
  ->
Activates task when ready
```

## 6.2 Task Setup-to-Items

```text
Task leaves draft
  ->
Task items are generated or linked
  ->
User opens task items
  ->
Item statuses become visible
  ->
User enters AI-assisted or human-first annotation path
```

## 6.3 Items-to-Review

```text
User scans task items
  ->
Chooses an item or task requiring attention
  ->
Completes annotation or inspects AI output
  ->
Enters review workbench
  ->
Accepts, edits, rejects, or escalates
```

## 6.4 Review-to-History

```text
User completes or inspects a governance action
  ->
Needs traceability or explanation
  ->
Opens history
  ->
Checks activity and lineage
```

---

# 7. State Alignment

Task surfaces should align to documented workflow states:

* `Setup` mainly corresponds to task `DRAFT`
* `Items` and annotation execution mainly correspond to task items in `READY`, `ANNOTATION_IN_PROGRESS`, `CANDIDATE_AVAILABLE`
* `Review` mainly corresponds to task items in `UNDER_REVIEW` and escalation-adjacent states
* dispute escalation may surface from review, but dispute management remains visible at project scope
* `History` should remain available wherever provenance and state progression matter

The state model should remain authoritative:

* `Task`: `DRAFT -> ACTIVE -> PAUSED -> COMPLETED -> ARCHIVED`
* `TaskItem`: `READY -> ... -> FINALIZED -> CLOSED`

---

# 8. Minimal Conceptual Backend Contract

The `Task` area implies a contract roughly like:

* `GET /tasks/{taskId}`
* `PATCH /tasks/{taskId}`
* `GET /tasks/{taskId}/setup`
* `PATCH /tasks/{taskId}/setup`
* `POST /tasks/{taskId}/data-sources`
* `GET /tasks/{taskId}/task-items`
* `GET /tasks/{taskId}/history`
* `POST /task-items/{taskItemId}/annotations`
* `POST /task-items/{taskItemId}/reviews`
* `POST /task-items/{taskItemId}/disputes`

This is enough to define the workflow boundary without fixing final implementation shape.

---

# 9. Summary

The `Task` area should be understood as:

```text
define the task
  -> connect source data through external boundaries
  -> choose AI-assisted or human-first execution
  -> launch and track progress
  -> expose task-item state
  -> optionally expose runtime backlog when AI-assisted processing exists
  -> run annotation execution
  -> run review decisions
  -> preserve history and lineage
```

For MVP, task scope is where the product proves two things together:

* annotation-first execution
* governed review and disagreement handling after annotation
* visible provenance
