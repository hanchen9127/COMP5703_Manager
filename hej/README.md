# Hej

Hej is a human evaluation and judgment platform for organizing projects, creating tasks, and processing task items through annotation, review, dispute resolution, and finalization.

## Overview

Hej is organized around four core concepts:

- **Organization**: the top-level workspace container
- **Project**: groups related tasks under an organization
- **Task**: defines a workflow for human or AI-assisted evaluation
- **Task Items**: individual work units processed inside a task

The application includes both project-level pages and task workspace pages for operating the full workflow.

---

## Workflow

### 1. Project setup
Projects group related work under an organization and provide the entry point for tasks.

Typical project actions:
- view project details
- inspect project task lists
- create a new task

### 2. Task creation
Tasks define the workflow for a specific evaluation job.

A task usually includes:
- title
- objective or description
- task class
- task type
- execution mode
- output schema / review policy

### 3. Task execution
Once created, a task can move into active execution.

Task execution typically includes:
- annotating task items
- reviewing item outputs
- resolving disputes
- finalizing results

### 4. Finalization
When work is complete, the task is finalized and can be treated as closed.

At this stage:
- results are considered stable
- outputs may be exported or archived
- the task is no longer actively edited

---

## Task item lifecycle

Task items are the atomic units of work inside a task.

Common task item states include:

- **Pending**: item has not yet been processed
- **Annotated**: item has an initial result
- **Reviewed**: item has been inspected in review
- **Disputed**: item requires escalation or resolution
- **Canonicalized**: item has been finalized into a stable result

The UI may show these in simplified groupings such as:

- Draft
- In review
- Approved
- Disputed

---

## Main screens

### Dashboard
Provides a high-level summary of the workspace and recent activity.

### Projects
Shows organizations and their projects.

### Project tasks
Shows all tasks within a project and provides a task creation entry point.

### Task overview
Summarizes the task, its items, and its current workflow state.

### Items
Shows the full list of task items and their statuses.

### Annotate
Used to create first-pass task item outputs.

### Review
Used to inspect and approve, reject, or escalate item results.

### Dispute
Used to handle unresolved disagreements or governance escalations.

### Finalized
Used to inspect closed task output after workflow completion.

---

## Authentication

Hej uses token-based authentication.

Login behavior:
- credentials are submitted through the login page
- a successful login stores the access token in browser storage
- the API client automatically attaches the token as `Authorization: Bearer <token>`

Persistence modes:
- **Keep me signed in**  
  stores the token in `localStorage`
- **Session-only login**  
  stores the token in `sessionStorage`

Logging out clears both storage locations.

---

## Frontend structure

The frontend uses a shared API layer under:

- `apps/hej-web/lib/api/*`

Important pieces:
- `lib/api/client.ts` — shared API client
- `lib/api/auth.ts` — login/logout/token helpers
- `lib/auth-storage.ts` — token persistence helpers

The login page and auth context are wired globally through the app shell boundary.

---

## Task workspace behavior

Task workspace pages are designed to keep summary data and item lists in sync with the active task item dataset.

Pages include:
- `/tasks/[taskId]`
- `/tasks/[taskId]/items`
- `/tasks/[taskId]/annotate`
- `/tasks/[taskId]/review`
- `/tasks/[taskId]/dispute`
- `/tasks/[taskId]/finalized`

The task workspace shows:
- task summary metrics
- task item counts
- workflow navigation
- item-level processing views

---

## Creating a task

The create-task workflow is available from the project task list.

A task creation flow typically:
1. opens the create task page
2. collects the title and other required task metadata
3. submits to the backend create-task endpoint
4. redirects back to the project task list on success

---

## Notes for development

- The frontend uses existing API helpers under `apps/hej-web/lib/api/`
- No custom API client should be introduced
- Authentication state is handled in the browser
- The task workspace and task item views should stay in sync with live task item data when available

---

## Summary

- **Organization** = workspace boundary
- **Project** = collection of tasks
- **Task** = workflow definition
- **Task Item** = work unit inside a task
- **Annotate** = first-pass processing
- **Review** = quality control
- **Dispute** = escalation handling
- **Finalized** = closed and stable output

## Local development

### Backend

```bash
pip install uv
cd apps/hej-api
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd apps/hej-web
npm install
npm run dev
```

### Local login

After starting the backend and frontend, open the frontend login page:

```text
http://localhost:3000/login
```

If the frontend starts on a different port, replace `3000` with the port shown in the terminal.

To use the seeded backend data, initialize the backend database first:

```bash
cd apps/hej-api
uv run python init_data.py --reset
```

Seed demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `alice@example.com` | `SecurePass1Alice` |
| Reviewer | `bob@example.com` | `SecurePass2Bob` |
| Annotator | `charlie@example.com` | `SecurePass3Charlie` |

These accounts are for local development and demo use only. They are created by `apps/hej-api/init_data.py`.
