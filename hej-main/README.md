# HEJ

HEJ stands for **Human Evaluation & Judgment Infrastructure**.

This repository is organized as a single monorepo for HEJ.

## Structure

```text
apps/
  hej-web/        `hej-web` Next.js web application
  hej-api/        `hej-api` FastAPI service
packages/         Shared TypeScript packages
infrastructure/   Terraform and Kubernetes assets
supabase/         Supabase config and migrations
docs/             Design, governance, and implementation docs
```

## Frontend

The `hej-web` package lives in `apps/hej-web`.

From the repository root:

```bash
npm install
npm run dev:web
```

## Backend

The `hej-api` service lives in `apps/hej-api`.

From the repository root:

```bash
uv sync --project apps/hej-api
npm run dev:api
```

Current API structure:

```text
apps/hej-api/
  app/
    api/
    core/
    domain/
    services/
    repositories/
    models/
    schemas/
    integrations/
  main.py
```

Useful endpoints:

```text
GET /            service metadata
GET /api/v1/health  health check
GET /api/v1/organizations
POST /api/v1/organizations
GET /api/v1/organizations/{organization_id}/projects
POST /api/v1/organizations/{organization_id}/projects
GET /api/v1/projects/{project_id}
GET /api/v1/projects/{project_id}/tasks
POST /api/v1/projects/{project_id}/tasks
GET /api/v1/tasks/{task_id}
GET /api/v1/tasks/{task_id}/task-items
POST /api/v1/tasks/{task_id}/dataset-registration
GET /docs        Swagger UI
```

Environment variables for `hej-api` are documented in:

```text
apps/hej-api/.env.example
```

## Common Commands

From the repository root:

```bash
npm run dev:web
npm run dev:api
npm run lint:web
npm run check:api
```

## MVP Scaffold Status

The current backend scaffold is intentionally aligned with the project documents:

- Canon: governed human judgment infrastructure, not simple labeling CRUD
- System Design: modular monolith with explicit workflow boundaries
- Domain Model: `Organization -> Project -> Task -> TaskItem`
- Data Sovereignty: raw payloads stay external; API models `DataPointer`
- Task Tree M1: create project, create task, register dataset pointer, list task items

## Notes

- Previous standalone git metadata for `hej-web` and `hej-api` was moved into `.repo-backups/` and is gitignored.
- The root repository is now the source of truth for version control.
