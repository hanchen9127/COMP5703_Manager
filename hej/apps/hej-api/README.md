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

/* Project Management (New in PR1) */
GET    /api/v1/organizations/{organization_id}/projects
POST   /api/v1/organizations/{organization_id}/projects
GET    /api/v1/projects/{project_id}
PUT    /api/v1/projects/{project_id}
DELETE /api/v1/projects/{project_id}

/* Task Management (New in PR1) */
GET    /api/v1/projects/{project_id}/tasks
POST   /api/v1/projects/{project_id}/tasks
GET    /api/v1/tasks/{task_id}
PUT    /api/v1/tasks/{task_id}
DELETE /api/v1/tasks/{task_id}

/* Future: Task Items & Provenance */
GET /api/v1/tasks/{task_id}/task-items
POST /api/v1/tasks/{task_id}/dataset-registration
GET /docs
```

Current implementation strategy:

- modular monolith with explicit service layer
- in-memory repositories for MVP scaffolding
- domain-aligned resource families based on Canon, Requirements, System Design, and Task Tree
- external data modeled as `DataPointer`, not raw platform-owned dataset storage

Recent additions (PR1):

- ProjectService: complete CRUD with membership verification
- TaskService: complete CRUD supporting annotation and judgement task types
- API routes: /projects, /tasks with proper error handling and validation
- Permission layer: organization membership verification at API boundary
- Data models: Task and Project schemas aligned with domain model v1.0

Environment variables:

```text
apps/hej-api/.env.example
```

## Testing

### Database Configuration

The API supports both in-memory (development) and database (production) backends:

**Development with SQLite:**
```bash
# Default: creates hej_dev.db
export DATABASE_URL="sqlite:///./hej_dev.db"
python -m uvicorn main:app --reload
```

**Production with PostgreSQL:**
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/hej"
python -m uvicorn main:app
```

**Environment Setup:**
```bash
# Copy environment template
cp .env.example .env

# Edit with your database URL
# DATABASE_URL=sqlite:///./hej_dev.db  (default)
# DATABASE_URL=postgresql://...         (production)
```

**Initialize Database:**
```bash
# Automatic on startup via init_db()
# Or manually:
from app.core.database import init_db
init_db()  # Creates all tables
```

### Running Comprehensive API Tests

A test suite is provided to validate all new endpoints and functionality:

**Start the API first:**
```bash
cd apps/hej-api
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Run tests in another terminal:**
```bash
cd apps/hej-api

# Install test dependencies (if not already installed)
pip install pytest pytest-asyncio requests

# Run all tests
python -m pytest test_comprehensive_api.py -v

# Run specific test class
python -m pytest test_comprehensive_api.py::TestProjects -v
python -m pytest test_comprehensive_api.py::TestTasks -v

# Run with detailed output
python -m pytest test_comprehensive_api.py -v -s
```

**What's Tested:**
- ✅ All project CRUD endpoints (create, read, list, update, delete)
- ✅ All task CRUD endpoints (both annotation and judgement types)
- ✅ Permission verification (organization membership checks)
- ✅ Error handling (403 Forbidden, 404 Not Found, 422 Validation)
- ✅ Data validation (enums, required fields, type constraints)

### Quick Test with curl

After starting the API, test endpoints manually:

```bash
# Login to get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"SecurePass1Alice"}' \
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# Get organizations
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/organizations

# Create a project
curl -X POST http://localhost:8000/api/v1/organizations/ORG_ID/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Project","description":"Test"}'
```
