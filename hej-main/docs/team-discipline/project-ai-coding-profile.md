# Project AI Coding Profile

Version: v1.0
Status: Active
Primary Audience: Coding agents and human contributors using coding agents in this repository

Governance:

* Read this document together with `ai-coding-guidelines.md`
* This document is governed by the Project Canon, System Design, Repo Structure, Backend Module Map, DB documents, and Development Workflow
* In case of conflict, higher-level project governance documents take precedence

Purpose:

Define the **repository-specific AI coding constraints** for this project.

This document exists because the generic AI coding guide is intentionally repository-agnostic.
This profile adds the constraints that are unique to this codebase.

---

# 1. Project Context

This repository implements a:

```text
governed human judgment infrastructure
```

It is built around a **shared core** and a **One Core, Two Operating Models** strategy.

Current implementation priority:

```text
ToB governed workflow first
```

Future compatibility requirement:

```text
the shared core must remain usable even if marketplace-style layers are added later
```

---

# 2. Required Project Context Before Writing Code

Before generating code, load the relevant local docs.

Core set:

1. `README.md`
2. `docs/team-discipline/dev-workflow.md`
3. `docs/governance/repo-structure.md`
4. `docs/design/system/system_design.md`
5. `docs/design/backend/backend_module_map.md`
6. `docs/implementation/planning/task-tree.md`

When relevant, also load:

* `docs/implementation/planning/integration-contract.md`
* `docs/design/database/db_schema_strategy.md`
* `docs/design/database/db_schema_blueprint.md`
* `docs/design/product/workflow_states.md`
* `docs/design/backend/api_surfaces.md`

If those documents are missing or unclear, do not invent project structure.

---

# 3. Repository Structure Constraints

The current monorepo shape is:

```text
apps/
  hej-web/
  hej-api/
packages/
  ui/
infrastructure/
supabase/
docs/
```

Do not generate or rely on obsolete top-level structures like:

```text
frontend/
backend/
ai_engine/
```

unless the user explicitly asks to create a new app or package.

---

# 4. Frontend Constraints

`hej-web` should reflect the current product hierarchy:

```text
Dashboard
Organizations
Projects
Admin
```

Within scope:

```text
Project
  -> Overview / Tasks / Disputes / Exports / Policies

Task
  -> Overview / Setup / Items / Annotate|Judge / Review / Dispute / History
```

Frontend code should:

* preserve this information architecture
* avoid inventing parallel navigation models
* prefer shared UI primitives from `packages/ui` when appropriate

---

# 5. Backend Constraints

`hej-api` should move toward domain-oriented ownership:

```text
identity
organizations
projects
tasks
data_access
annotation
review
disputes
arbitration
provenance
exports
integrations
```

Do not place project logic into generic catch-all modules if a domain module already owns it.

---

# 6. Shared-Core Rules

The durable shared core includes:

* identity and access
* organization membership and tenant scope
* projects
* tasks and task items
* external data pointers
* annotation mode selection
* review, disagreement, dispute, and arbitration
* canonical judgment, provenance, and export

The following are future extension concerns and must not become prerequisites for core execution:

* marketplace listing
* matching
* trust and badges
* billing / payout
* messaging

Rule:

```text
listing is not execution
payment is not execution
```

---

# 7. Workflow and Data Rules

Project-specific invariants:

* `TaskItem` is the atomic workflow unit
* annotation is distinct from review
* disagreement is distinct from dispute
* canonical judgment is distinct from candidate annotation
* raw client data remains external
* task and task-item workflows follow `docs/design/product/workflow_states.md`

Do not collapse these distinctions in code.

---

# 8. Integration Rules

This project has:

* CS x 8
* DS x 8
* one shared system goal
* Week 4 first serious integration attempt

The DS track integrates through:

* prediction files
* AI import surfaces
* platform-owned `task_id` and `task_item_id`

The DS track does **not** own:

* task lifecycle
* review semantics
* dispute semantics
* export semantics

When working near integration boundaries, read:

* `docs/implementation/planning/integration-contract.md`

---

# 9. File Placement Rules Specific to This Repo

Examples:

* web routes and pages belong in `apps/hej-web/app/`
* web feature components belong in `apps/hej-web/components/`
* shared frontend primitives belong in `packages/ui/`
* backend routes belong under `apps/hej-api/app/api/routes/`
* backend domain logic should trend toward `apps/hej-api/app/domains/`
* backend integrations belong under `apps/hej-api/app/integrations/`

Do not create speculative sibling apps or packages casually.

---

# 10. Review Focus for This Project

When self-reviewing code for this repository, pay extra attention to:

* shared-core vs extension boundary violations
* workflow-state shortcuts
* UI/IA drift away from current scoped navigation model
* storing raw client payloads inside canonical platform storage
* AI suggestions being treated as final truth
* disagreement history being erased

---

# 11. Output Expectation in This Repo

When proposing changes here, the implementation note should mention:

* which app or package was changed
* which domain or workflow surface owns the behavior
* whether any API, schema, or workflow state changed
* any integration or demo-path risks

---

# 12. Final Principle

In this repository, good AI-assisted code is code that:

* strengthens the shared core
* lands in the right module
* preserves workflow semantics
* keeps the system convertible for future operating models
* remains easy for students to understand and extend
