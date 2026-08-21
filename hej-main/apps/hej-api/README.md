## `hej-api`

FastAPI service for the HEJ monorepo.

HEJ stands for `Human Evaluation & Judgment Infrastructure`.

Current location:

```text
apps/hej-api
```

Current structure:

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

Run locally with `uv`:

```bash
cd apps/hej-api
uv sync
uv run python main.py
```

Key endpoints:

```text
GET /
GET /api/v1/health
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
GET /docs
```

Current implementation strategy:

- modular monolith
- in-memory repositories for MVP scaffolding
- domain-aligned resource families based on Canon, Requirements, System Design, and Task Tree
- external data modeled as `DataPointer`, not raw platform-owned dataset storage

Environment variables:

```text
apps/hej-api/.env.example
```
