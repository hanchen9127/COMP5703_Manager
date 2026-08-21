# Project Workspace MVP Plan

Document: `project-workspace-mvp-plan.md`
Status: Draft
Scope:

Define the MVP role of the Project workspace inside the current ToB-first governed human judgment infrastructure.

This document exists to keep the MVP centered on governed task execution rather than on admin-heavy control surfaces.

---

# 1. Why Project Workspace Leads the MVP

The MVP is trying to prove:

* execution-first task orchestration is real
* task creation, setup, items, execution, review, dispute, and history form a coherent operator workflow
* disputes and exports remain visible without becoming the main navigation model
* Admin exists, but as a lightweight governance surface

That means the primary execution anchor should be:

```text
Project workspace
  -> task setup
  -> task items
  -> task annotation or judgement execution
  -> task review
  -> task history
  -> minimal dispute / export visibility
```

Project scope is the correct level because it keeps:

* multiple tasks under one governance regime
* disputes and exports visible across a program
* policy ownership coherent
* task execution grounded in an organization-owned workstream
* task creation and launch anchored in one project container

---

# 2. MVP Role of Project Workspace

For MVP, Project workspace should be the **operational shell** for a governed program.

It should answer five operator questions:

1. what is this project trying to deliver
2. which tasks are in draft, active, blocked, or nearing completion
3. what type of task should I add next and how should it run
4. where should I go next: setup, items, annotation or judgement work, review, history, dispute, or export
5. which policies and governance expectations shape downstream work

It should not become:

* a flat reporting dashboard
* a second admin console
* a replacement for task-level workbenches

---

# 3. MVP Process Model

Recommended project-level operator journey:

1. open project overview
2. inspect project status, active tasks, and backlog pressure
3. create a new task or enter an existing task from the project task list
4. complete task-level work through:
   * `Setup` while task is `DRAFT`
   * task definition across task class, task type, data source, execution mode, instructions, and launch options
   * `Items` while task items are being prepared and tracked
   * annotation or judgment execution through AI-assisted or human-first paths
   * status / progress inspection while work is running
   * `Review` after first-pass outputs are ready for governance
   * `History` when provenance or state progression needs inspection
5. return to project scope for:
   * cross-task dispute visibility
   * export visibility
   * project-level policy understanding

This preserves the intended hierarchy:

```text
Organization
  -> Project workspace
    -> Task workspace
      -> TaskItem workflow
```

---

# 4. Page Responsibilities

## 4.1 Overview

Purpose:

* explain project intent
* summarize task portfolio state
* direct users into the next operational step

Should include:

* project operating frame
* task portfolio summary
* quick path into create task, task setup, items, execution, review, and history
* dispute / export / policy side visibility

## 4.2 Tasks

Purpose:

* primary operational list for the project
* launch surface into task workspaces

Should include:

* task table
* task class / type / mode and status
* task class signal
* data source connection signal
* progress signal
* backlog or workload signal
* direct actions into `Setup`, `Items`, task execution, `Review`, and `History`

## 4.3 Disputes

Purpose:

* cross-task disagreement and escalation visibility inside one governed project

Should include:

* dispute list
* severity and assignee
* links back to task or item context

## 4.4 Exports

Purpose:

* show delivery progress for finalized work products

Should include:

* export package status
* provenance inclusion signal
* destination / delivery state

## 4.5 Policies

Purpose:

* make the project's workflow rules visible and intelligible

Should include:

* task-linked policy summary
* review / dispute / export rule references
* clear indication that policy shapes downstream task execution

---

# 5. Minimal Backend Contract Implied by MVP

The Project workspace should imply a backend contract roughly like:

* `GET /organizations/{orgId}/projects`
* `GET /projects/{projectId}`
* `PATCH /projects/{projectId}`
* `GET /projects/{projectId}/tasks`
* `POST /projects/{projectId}/tasks`
* `GET /projects/{projectId}/disputes`
* `GET /projects/{projectId}/exports`
* `GET /projects/{projectId}/policies`

The task launch paths inside the project should rely on:

* `GET /tasks/{taskId}`
* `PATCH /tasks/{taskId}`
* `GET /tasks/{taskId}/setup`
* `PATCH /tasks/{taskId}/setup`
* `POST /tasks/{taskId}/data-sources`
* `GET /tasks/{taskId}/task-items`
* `GET /tasks/{taskId}/history`
* `POST /task-items/{taskItemId}/reviews`
* `POST /task-items/{taskItemId}/disputes`

This is enough to make Project workspace feel real without expanding into full reporting or policy administration.

---

# 6. Recommended Frontend Skeleton

Recommended MVP shape:

```text
Project workspace
  -> Overview
      -> project summary
      -> task portfolio health
      -> create task entry
      -> next-step launch cards
  -> Tasks
      -> task table or cards
      -> task class / type / mode / progress visibility
      -> setup / items / execution / review / history entry points
  -> Disputes
      -> cross-task escalation list
  -> Exports
      -> delivery status list
  -> Policies
      -> project policy summary
```

Design rules:

* keep project scope as the shell
* keep task scope as the execution surface
* do not flatten task pages into project tabs
* do not introduce a parallel process sidebar that breaks current IA

---

# 7. Recommended Sequencing

Project workspace should lead the next implementation slice in this order:

1. project overview and tasks surface
2. task creation and setup
3. task items and progress visibility
4. task annotation or judgement execution path
5. task review
6. task history
7. project disputes
8. project exports
9. lightweight project policy visibility

This keeps the MVP aligned with the product's core claim:

```text
governed execution first
admin and operations depth later
```

---

# 8. Summary

The correct MVP interpretation is:

```text
Project workspace is the shell.
Task workspace is the execution engine for annotation and judgment tasks that starts with task creation and launch.
Admin remains real, but lightweight.
```

That is the smallest shape that still proves governed human judgment infrastructure rather than flat annotation CRUD.
