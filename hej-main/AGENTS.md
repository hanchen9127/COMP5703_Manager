# AGENTS.md

This repository uses a two-layer guidance model for AI-assisted coding:

1. [Generic AI Coding Guidelines](/Users/hunterxu/Codes/data_annotation_platform/docs/team-discipline/ai-coding-guidelines.md)
2. [Project AI Coding Profile](/Users/hunterxu/Codes/data_annotation_platform/docs/team-discipline/project-ai-coding-profile.md)

Read both before making meaningful code changes in this repository.

**Stack**
Frontend:

* Next.js App Router
* React
* TypeScript
* Tailwind CSS
* shadcn-style UI primitives via `packages/ui`

Backend:

* FastAPI
* Python
* modular-monolith domain structure under `apps/hej-api` for the current `hej-api` service

Monorepo:

* npm workspaces for web and shared TS packages
* Python project management for API

**Must Read**
Core repo guidance:

* [Development Workflow](/Users/hunterxu/Codes/data_annotation_platform/docs/team-discipline/dev-workflow.md)
* [Repo Structure](/Users/hunterxu/Codes/data_annotation_platform/docs/governance/repo-structure.md)
* [Project AI Coding Profile](/Users/hunterxu/Codes/data_annotation_platform/docs/team-discipline/project-ai-coding-profile.md)

Core product and architecture:

* [canon.md](/Users/hunterxu/Codes/data_annotation_platform/docs/governance/canon.md)
* [requirements.md](/Users/hunterxu/Codes/data_annotation_platform/docs/governance/requirements.md)
* [architecture_overview.md](/Users/hunterxu/Codes/data_annotation_platform/docs/design/system/architecture_overview.md)
* [system_design.md](/Users/hunterxu/Codes/data_annotation_platform/docs/design/system/system_design.md)
* [one_core_two_operating_models.md](/Users/hunterxu/Codes/data_annotation_platform/docs/design/product/one_core_two_operating_models.md)
* [architecture_diagrams.md](/Users/hunterxu/Codes/data_annotation_platform/docs/design/system/architecture_diagrams.md)

Backend and API:

* [backend_module_map.md](/Users/hunterxu/Codes/data_annotation_platform/docs/design/backend/backend_module_map.md)
* [api_surfaces.md](/Users/hunterxu/Codes/data_annotation_platform/docs/design/backend/api_surfaces.md)

Data model and persistence:

* [domain_model.md](/Users/hunterxu/Codes/data_annotation_platform/docs/design/database/domain_model.md)
* [domain_model_relations.md](/Users/hunterxu/Codes/data_annotation_platform/docs/design/database/domain_model_relations.md)
* [db_schema_strategy.md](/Users/hunterxu/Codes/data_annotation_platform/docs/design/database/db_schema_strategy.md)
* [db_schema_blueprint.md](/Users/hunterxu/Codes/data_annotation_platform/docs/design/database/db_schema_blueprint.md)
* [workflow_states.md](/Users/hunterxu/Codes/data_annotation_platform/docs/design/product/workflow_states.md)

Implementation planning:

* [demo-scenarios.md](/Users/hunterxu/Codes/data_annotation_platform/docs/implementation/planning/demo-scenarios.md)
* [integration-contract.md](/Users/hunterxu/Codes/data_annotation_platform/docs/implementation/planning/integration-contract.md)
* [minimal-working-slice.md](/Users/hunterxu/Codes/data_annotation_platform/docs/implementation/planning/minimal-working-slice.md)
* [task-tree.md](/Users/hunterxu/Codes/data_annotation_platform/docs/implementation/planning/task-tree.md)
* [task-tree-general.md](/Users/hunterxu/Codes/data_annotation_platform/docs/implementation/planning/task-tree-general.md)
* [team-allocation.md](/Users/hunterxu/Codes/data_annotation_platform/docs/implementation/planning/team-allocation.md)
* [risk-register.md](/Users/hunterxu/Codes/data_annotation_platform/docs/implementation/planning/risk-register.md)

**Core Rules**
Project-specific rules to keep in mind:

* this repo is a monorepo centered on a shared core
* current top-level structure is `apps/`, `packages/`, `infrastructure/`, `supabase/`, `docs/`
* do not rely on obsolete layouts such as `backend/`, `frontend/`, or `ai_engine/`
* preserve the shared-core boundary:
  * `organization -> project -> task -> task_item`
  * review, dispute, arbitration, provenance, and export remain core
  * marketplace, trust, billing, and payout are future extension concerns
* prefer small, local changes when uncertainty is high
* avoid inventing new architecture unless explicitly needed and approved

**Frontend**
Frontend should preserve the current scoped IA:

* global: `Dashboard`, `Organizations`, `Projects`, `Admin`
* project: `Overview`, `Tasks`, `Disputes`, `Exports`, `Policies`
* task: `Setup`, `Queue`, `Review`, `History`

Frontend implementation rules:

* preserve the current platform IA and scoped workspace model
* prefer professional, platform-oriented layouts over marketing-style compositions
* keep information density controlled so future workbench complexity can fit
* prefer typography, spacing, and hierarchy that read like an operational control plane
* keep color lively but restrained; do not trade away trust or readability
* prefer shadcn-style native primitives from `packages/ui` or the direct shadcn/Radix pattern over custom hand-rolled controls when an appropriate primitive already exists
* do not keep rewriting basic controls like tabs, sheet, textarea, dialog, table, badge, button, or card from scratch unless there is a clear gap

**Backend**
Backend should trend toward domain-oriented ownership under `apps/hej-api/app/domains/` for `hej-api`.

Current target module ownership:

* identity
* organizations
* projects
* tasks
* data_access
* annotation
* review
* disputes
* arbitration
* provenance
* exports
* integrations

Backend-specific rules:

* keep shared-core workflow modules authoritative
* do not let integrations own workflow semantics
* do not collapse annotation, review, dispute, arbitration, and canonical judgment into one ambiguous model
* preserve external-data boundary; raw client data should not silently become canonical platform storage

**Docs Sync**
If domain ownership changes, check:

* [backend_module_map.md](/Users/hunterxu/Codes/data_annotation_platform/docs/design/backend/backend_module_map.md)
* [repo-structure.md](/Users/hunterxu/Codes/data_annotation_platform/docs/governance/repo-structure.md)

If API resources, routes, or boundaries change, check:

* [api_surfaces.md](/Users/hunterxu/Codes/data_annotation_platform/docs/design/backend/api_surfaces.md)
* [integration-contract.md](/Users/hunterxu/Codes/data_annotation_platform/docs/implementation/planning/integration-contract.md) when DS-facing

If workflow states or transitions change, check:

* [workflow_states.md](/Users/hunterxu/Codes/data_annotation_platform/docs/design/product/workflow_states.md)
* [demo-scenarios.md](/Users/hunterxu/Codes/data_annotation_platform/docs/implementation/planning/demo-scenarios.md)

If data model or persistence structure changes, check:

* [domain_model.md](/Users/hunterxu/Codes/data_annotation_platform/docs/design/database/domain_model.md)
* [domain_model_relations.md](/Users/hunterxu/Codes/data_annotation_platform/docs/design/database/domain_model_relations.md)
* [db_schema_strategy.md](/Users/hunterxu/Codes/data_annotation_platform/docs/design/database/db_schema_strategy.md)
* [db_schema_blueprint.md](/Users/hunterxu/Codes/data_annotation_platform/docs/design/database/db_schema_blueprint.md)

If the change affects milestone scope, demo shape, or implementation order, check:

* [milestone-definition.md](/Users/hunterxu/Codes/data_annotation_platform/docs/implementation/planning/milestone-definition.md)
* [task-tree.md](/Users/hunterxu/Codes/data_annotation_platform/docs/implementation/planning/task-tree.md)
* [task-tree-general.md](/Users/hunterxu/Codes/data_annotation_platform/docs/implementation/planning/task-tree-general.md)
* [minimal-working-slice.md](/Users/hunterxu/Codes/data_annotation_platform/docs/implementation/planning/minimal-working-slice.md)

**Workflow**
Preferred implementation workflow:

* plan first
* communicate the plan or intent clearly
* confirm direction when the change is structurally meaningful
* implement
* test or verify
* commit only when the change is a coherent unit

**Commit Rules**
Commit discipline:

* do not commit every tiny intermediate step
* each commit should represent a complete, reviewable unit
* use semantic commit headlines such as `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
* commit message format should be:
  * one semantic headline
  * followed by 1-3 short detail lines if needed
* do not include literal `\\n` sequences in commit details; use real new lines instead

When in doubt:

* prefer small, local changes
* preserve workflow semantics
* avoid inventing new architecture
* consult the project profile before restructuring
