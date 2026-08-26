# Repo and Module Blueprint

Document: `repo_module_blueprint.md`
Status: Draft
Derived from:

* `docs/governance/repo-structure.md`
* `docs/design/product/one_core_two_operating_models.md`
* `docs/design/system/system_design.md`
* `docs/design/database/domain_model.md`
* `docs/implementation/planning/task-tree-general.md`

Purpose:

Turn the architectural principle of **One Core, Two Operating Models** into a concrete monorepo and module organization plan that students can implement against.

This document answers:

* what belongs in each app
* what module boundaries should exist
* what should remain shared
* what should remain optional
* how to grow from today's Canon-aligned system toward future marketplace support

---

# 1. Design Goal

The repository should be organized so that:

* the Canon-aligned ToB workflow can be built first
* the future marketplace can be added later
* students do not need to rewrite the workflow engine to support that evolution

This requires:

* stable domain boundaries
* stable execution objects
* extension-friendly modules
* strict separation between workflow core and product-specific outer layers

---

# 2. Monorepo Overview

Recommended top-level layout:

```text
repo-root/
  apps/
    hej-web/
    hej-api/
  packages/
    ui/
    config/
    contracts/
  infrastructure/
    terraform/
    kubernetes/
  supabase/
  docs/
  README.md
```

Meaning:

* `apps/`
  deployable applications
* `packages/`
  shared code or contracts
* `infrastructure/`
  deployment assets
* `supabase/`
  optional external platform configuration
* `docs/`
  governance, design, implementation references

---

# 3. Application Responsibilities

## 3.1 `apps/hej-api`

The system-of-record for:

* workflow control
* domain rules
* state transitions
* provenance
* export orchestration
* external integration boundaries

It should own:

* auth and access decisions
* organization/project/task APIs
* task item orchestration
* annotation and review recording
* disagreement, dispute, arbitration logic
* export assembly

It should not become:

* a UI-oriented backend shaped by page names
* a marketplace-only service
* a thin CRUD wrapper over tables

## 3.2 `apps/hej-web`

The user-facing application for:

* ToB workflow control surfaces
* project and task workspaces
* task-item execution desks
* dispute and export interfaces
* future marketplace or profile concerns only as additive outer layers

Interpretation:

* `Task` remains the workspace authority surface
* `TaskItem` remains the operation target inside task-level desks

It should not contain:

* real workflow authority
* hidden business rules
* state-machine truth

## 3.3 Future Deployables

Possible later additions:

* `apps/dap-worker`
  background jobs, import/export, scans
* `apps/dap-admin`
  operational and moderation console if split becomes useful
* `apps/dap-docs`
  if public-facing documentation becomes a product surface

These should only be added when the system boundary is real, not just because code feels crowded.

---

# 4. Shared Packages Strategy

Recommended `packages/` growth path:

```text
packages/
  ui/
  contracts/
  config/
```

## 4.1 `packages/ui`

Contains:

* shared React UI primitives
* design tokens
* layout helpers
* reusable workbench components when generic enough

Should not contain:

* business-specific fetch logic
* workflow state decisions

## 4.2 `packages/contracts`

Suggested future home for:

* shared DTOs
* API contract types
* enum mirrors
* workflow-state constants for frontend-safe use

This helps prevent:

* silent divergence between `hej-api` and `hej-web`
* duplicated enum definitions
* brittle fixture/data-module drift

## 4.3 `packages/config`

Suggested future home for:

* shared lint config
* shared TS config
* shared formatting rules
* perhaps frontend env parsing helpers

---

# 5. `hej-api` Internal Blueprint

The API should be organized by domain boundary, not by UI surface.

Recommended target structure:

```text
apps/hej-api/
  app/
    api/
      routes/
      dependencies/
      router.py
    core/
      config.py
      security.py
      errors.py
    domain/
      identity/
      organizations/
      projects/
      tasks/
      task_items/
      schemas/
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
    services/
    repositories/
    integrations/
    workers/
    main.py
  tests/
  pyproject.toml
```

Notes:

* `domain/` is the most important long-term boundary.
* `services/` may remain while the codebase is still small, but should gradually map to domain ownership.
* `workers/` is optional until background jobs become real.

---

# 6. Core Domain Modules

These modules belong to the shared core and should exist whether or not marketplace mode ships.

## 6.1 `identity/`

Owns:

* users
* login
* session/token verification
* role grants
* organization membership access decisions

Typical files:

```text
domain/identity/
  models.py
  repository.py
  service.py
  policies.py
  schemas.py
```

## 6.2 `organizations/`

Owns:

* organization lifecycle
* membership views
* tenant boundary enforcement hooks

## 6.3 `projects/`

Owns:

* project lifecycle
* project metadata
* project archival

## 6.4 `tasks/`

Owns:

* task creation and configuration
* task status transitions
* task class, task type, and execution mode selection
* task policy linkage
* task schema linkage

## 6.5 `task_items/`

Owns:

* task item generation
* task item retrieval
* task item state transitions

This is the operational center of gravity.

## 6.6 `schemas/`

Owns:

* label schemas
* versioning
* task-schema linkage

## 6.7 `annotations/`

Owns:

* annotation creation
* annotation version history
* AI and human annotation records

## 6.8 `reviews/`

Owns:

* reviewer actions
* review outcomes
* review history

## 6.9 `disagreements/`

Owns:

* disagreement detection rules
* disagreement record creation
* disagreement visibility state

## 6.10 `disputes/`

Owns:

* dispute case lifecycle
* dispute participants
* dispute state history

## 6.11 `arbitration/`

Owns:

* arbitration intake and ruling workflow
* final ruling capture
* arbitration authority checks

## 6.12 `judgments/`

Owns:

* canonical judgment publication
* authority resolution

## 6.13 `provenance/`

Owns:

* lineage assembly
* audit trail retrieval
* historical reconstruction

## 6.14 `exports/`

Owns:

* export package creation
* export membership
* delivery-state tracking

## 6.15 `data_access/`

Owns:

* data pointers
* retrieval policy
* controlled payload access

## 6.16 `assignments/`

Owns:

* work routing
* assignment lifecycle
* who is expected to act on what

This module is core, not marketplace-specific.

---

# 7. Extension Modules for Future Marketplace

These modules should be additive.
Do not make core execution depend on them.

## 7.1 `profiles/`

For:

* username
* public profile
* real-name verification
* domain interests
* contributor presentation

## 7.2 `trust/`

For:

* badges
* XP
* levels
* certification
* reviewer/arbitrator eligibility scoring

## 7.3 `marketplace/`

For:

* listing creation
* listing visibility
* listing discovery
* recommendation and match score

Important:

`MarketplaceListing` should reference `Task`, not replace it.

## 7.4 `applications/`

For:

* apply to listing
* invite contributor
* accept/decline workflow

## 7.5 `payments/`

For:

* billing
* escrow
* payout
* settlement corrections after disputes

## 7.6 `notifications/`

For:

* inbox
* alerts
* email / push / in-app notices

## 7.7 `messaging/`

For:

* requester-worker communication
* dispute-related message threads
* admin intervention channels

---

# 8. Backend Dependency Rules

These rules should be treated as architectural law.

## Allowed

* core modules depending on shared infrastructure helpers
* extension modules depending on core modules
* APIs depending on domain services
* integrations depending on domain contracts

## Not Allowed

* core review logic depending on payments
* canonical judgment logic depending on listing visibility
* dispute logic depending on XP
* task state machine depending on chat messages
* data pointer model depending on marketplace application state

If a student proposes one of those dependencies, it is almost certainly a design mistake.

---

# 9. Repository Pattern and Service Pattern Guidance

Current code uses `repositories/` and `services/`.
That is acceptable for early scaffolding.

Recommended evolution:

## Early Phase

```text
repositories/
services/
schemas/
```

Useful because:

* students understand it quickly
* API scaffolding moves faster

## Later Phase

Move toward domain-owned packages:

```text
domain/tasks/
domain/reviews/
domain/disputes/
```

Each domain can internally contain:

* repository adapters
* service logic
* policies
* validators
* event publishers

This avoids the anti-pattern where one giant `services/` folder becomes an unstructured dumping ground.

---

# 10. `hej-web` Internal Blueprint

Recommended target structure:

```text
apps/hej-web/
  app/
    access/
    admin/
    organizations/
    projects/
    tasks/
    disputes/
    arbitration/
    exports/
  components/
    layout/
    shared/
    project-workspace/
    task-workspace/
    task-item/
    dispute/
    export/
  hooks/
  lib/
    api/
    queries/
    mappers/
    mock/
    auth/
  styles/
```

Meaning:

* `app/` defines route structure
* `components/` should be feature-oriented, not a random global pile
* `lib/api/` wraps HTTP calls
* `lib/queries/` can later hold React Query or fetch orchestration
* `lib/mappers/` translates backend DTOs into UI-oriented shapes
* `lib/mock/` keeps temporary data out of permanent application logic

---

# 11. Frontend Experience Split

The web app should support two experience families over time.

## 11.1 Core / ToB Routes

Examples:

* `/organizations/[organizationId]`
* `/projects/[projectId]`
* `/tasks/[taskId]`
* `/tasks/[taskId]/setup`
* `/tasks/[taskId]/items`
* `/tasks/[taskId]/annotate`
* `/tasks/[taskId]/review`
* `/tasks/[taskId]/history`
* `/disputes/[disputeId]`
* `/exports/[exportId]`

These routes align with Canon workflow execution.

## 11.2 Marketplace Routes

Examples if those domains later become real:

* `/marketplace`
* `/marketplace/listings/[listingId]`
* `/profile/[userId]`
* `/applications`
* `/wallet`
* `/messages`

These routes align with discovery, trust, and economics.

Important:

The task workbench should remain task-centric, even if entered from a marketplace listing.

---

# 12. UI Component Boundary Rules

## Stable shared components

These can live in `packages/ui` or feature-shared folders:

* cards
* tables
* filters
* tabs
* badges
* page headers
* drawers

## Feature components

These should stay near the feature domain:

* task item desk
* review console
* dispute evidence view
* arbitration decision panel
* listing card
* profile badge cluster
* payout summary

Rule:

If a component encodes workflow semantics, keep it close to the feature, not in generic UI primitives.

---

# 13. Data Flow Blueprint

Recommended frontend data flow:

```text
Route
  ->
Query hook
  ->
API client
  ->
Backend endpoint
  ->
Domain service
  ->
Repository
```

And in the opposite direction:

```text
Repository data
  ->
Domain service result
  ->
API schema
  ->
Frontend mapper
  ->
Feature component
```

This helps keep:

* backend domain logic out of UI
* DTO quirks out of presentational components

---

# 14. API Route Grouping Blueprint

Recommended route grouping inside `hej-api`:

```text
api/routes/
  auth.py
  organizations.py
  projects.py
  tasks.py
  task_items.py
  annotations.py
  reviews.py
  disputes.py
  arbitration.py
  judgments.py
  exports.py
  profiles.py
  marketplace.py
  payments.py
  notifications.py
```

Not all files must exist now.
This is a target map.

Students should add routes only when the domain becomes real.

---

# 15. Test Layout Blueprint

Tests should mirror domain boundaries.

Recommended:

```text
apps/hej-api/tests/
  identity/
  organizations/
  projects/
  tasks/
  annotations/
  reviews/
  disputes/
  arbitration/
  exports/
  integration/
```

For frontend:

```text
apps/hej-web/tests/
  task-workbench/
  task-pages/
  organization-pages/
  project-pages/
  marketplace/
```

Types of tests expected:

* state transition tests
* repository tests
* policy and authorization tests
* API contract tests
* end-to-end workflow tests

---

# 16. Suggested Implementation Sequence

Students should implement in this order.

## Phase 1: Canon Core Skeleton

Build:

* auth
* organizations
* projects
* tasks
* task items
* data pointers

## Phase 2: First-Pass Work and Review

Build:

* task schemas
* first-pass output storage
* work runtime integration
* review flows

## Phase 3: Governance

Build:

* disagreements
* disputes
* arbitration
* canonical judgments
* provenance

## Phase 4: Export and Audit

Build:

* export packages
* audit views
* lineage inspection

## Phase 5: Reusable Extension Foundations

Build:

* profiles
* trust system
* notifications

## Phase 6: Marketplace Layer

Build:

* listings
* applications
* assignment matching
* billing and payouts

This order minimizes rework.

---

# 17. Practical Naming Guidance

Prefer names that survive both operating models.

Good:

* `Assignment`
* `ReviewDecision`
* `CanonicalJudgment`
* `TaskItems`
* `TaskOwner`
* `DisputeCase`

Bad if used as core concepts:

* `Gig`
* `BuyerJob`
* `SellerTask`
* `OrderWorker`
* `TaskRail`

Names in the core should remain professional, domain-stable, and convertible.

---

# 18. Anti-Patterns Students Should Avoid

## Anti-pattern 1: Organizing backend around pages

Bad:

* `dashboard_service.py`
* `homepage_repository.py`

Good:

* `task_service.py`
* `dispute_service.py`

## Anti-pattern 2: Keeping all logic in one services folder forever

Fine for MVP.
Bad for long-term maintainability.

## Anti-pattern 3: Mixing mock and production data paths

Keep mock data in explicit mock modules.

## Anti-pattern 4: Making marketplace assumptions inside core task logic

Example bad assumption:

* every assignment comes from a public listing

Not true in ToB mode.

## Anti-pattern 5: Turning the frontend navigation into the domain model

Navigation may change.
Domain truth should not.

---

# 19. Final Rule of Thumb

When deciding where code belongs, ask:

## If this feature disappeared, would the Canon workflow still make sense?

If yes, it is probably an extension module.

## If this feature disappeared, would task execution, review, dispute, arbitration, or export break?

If yes, it belongs in the shared core.

That is the operational test for where code, files, and modules should live in this repository.
