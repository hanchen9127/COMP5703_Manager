# Repo Structure

Document: `repo-structure.md`
Version: v2.2
Status: Active
Governance:

* Governed by Project Canon
* Aligned with `docs/design/system/repo_module_blueprint.md`
* Aligned with `docs/design/product/one_core_two_operating_models.md`

Purpose:

Define the monorepo layout for a **shared-core platform** that is implemented first as a governed ToB system and may later grow marketplace-style extensions.

---

# 1. Top-Level Layout

```text
repo-root/
  apps/
    hej-web/
    hej-api/
  packages/
    ui/
    eslint-config/
    typescript-config/
  infrastructure/
    terraform/
    kubernetes/
  supabase/
  docs/
  README.md
  package.json
```

Rules:

* `apps/` holds deployable applications.
* `packages/` holds shared code, mostly frontend-facing for now.
* `infrastructure/` holds deployment and environment provisioning assets.
* `supabase/` is optional integration/config space, not the core domain model.
* `docs/` holds governance, design, and implementation documents.

---

# 2. Application Boundaries

## `apps/hej-web`

The main `hej-web` application.

Current responsibility:

* shared-core platform UI
* organization, project, and task workspaces
* review, dispute, arbitration, export surfaces

It should not become a dumping ground for backend logic or DS experimentation code.

## `apps/hej-api`

The main `hej-api` service.

Current responsibility:

* shared-core execution and governance engine
* identity and tenant scope
* project/task/task-item orchestration
* review, dispute, arbitration, provenance, export
* integration endpoints for annotation runtime, AI import, and external data access

It should not directly absorb future marketplace, trust, or payment logic into core modules.

---

# 3. Backend Internal Shape

`hej-api` should organize around domain modules, not generic technical buckets.

Preferred structure:

```text
apps/hej-api/
  app/
    api/
      routes/
    core/
    domain/
      identity/
      organizations/
      projects/
      tasks/
      task_items/
      annotations/
      reviews/
      disagreements/
      disputes/
      arbitration/
      judgments/
      provenance/
      exports/
      data_access/
      assignments/
    integrations/
      ai_import/
      annotation_runtime/
      external_data/
    services/
    repositories/
    schemas/
    models/
  main.py
```

Notes:

* the current codebase uses `app/domain/` as the stable internal boundary root.
* `services/`, `repositories/`, `schemas/`, and `models/` may still exist during transition, but should gradually become domain-owned.
* `integrations/` is for external-system boundaries, not core business semantics.
* DS contributors should usually treat `domain/`, `integrations/`, `schemas/`, and `repositories/` as the most relevant backend entry points.

---

# 4. Frontend Internal Shape

`hej-web` should reflect the product hierarchy:

```text
apps/hej-web/
  app/
    access/
    dashboard/
    organizations/
    projects/
    tasks/
    disputes/
    arbitration/
    exports/
    admin/
  components/
  hooks/
  lib/
  styles/
```

Intent:

* routing should mirror `organization -> project -> task` scope
* project-scoped and task-scoped routes should remain the main workflow authority paths
* top-level `disputes`, `arbitration`, and `exports` routes may still exist for compatibility or global visibility, but should not replace project and task scoped workflow meaning
* components should be feature-oriented, not page-dump utilities
* `lib/` should contain API clients, mappers, queries, and mock data

---

# 5. Shared Packages

Current shared packages:

```text
packages/
  ui/
  eslint-config/
  typescript-config/
```

Likely future additions:

```text
packages/
  contracts/
  sdk/
  shared-types/
```

Rules:

* shared packages should exist only when multiple apps truly depend on them
* do not create packages for speculative abstraction

---

# 6. Extension Strategy

The repository should preserve a shared-core-first structure.

That means future extension domains should appear as additive modules, not as replacements for core structure.

Examples of future additions:

```text
apps/hej-api/app/domain/profile/
apps/hej-api/app/domain/marketplace/
apps/hej-api/app/domain/billing/
```

or, if needed later:

```text
apps/dap-marketplace/
```

But the current repository should not be restructured around those future concerns yet.

---

# 7. Governance Constraints

The monorepo must preserve these rules:

* top-level directories represent real system boundaries
* shared-core execution code is not mixed with future marketplace code
* docs remain aligned with actual repo shape
* frontend routes and backend modules should use the same domain vocabulary
* task-level workspace pages must not erase the `Task` versus `TaskItem` boundary

---

# 8. Summary

The repo should be understood as:

```text
one monorepo
two main apps
one shared-core execution engine
room for future extension layers
```

That is the correct structure for this project stage.
