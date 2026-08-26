# One Core, Two Operating Models

Document: `one_core_two_operating_models.md`
Version: v1.1
Status: Draft
Derived from:

* `docs/governance/canon.md`
* `docs/governance/requirements.md`
* `docs/design/system/system_design.md`
* `docs/design/database/domain_model.md`
* `docs/design/product/governed_human_judgment_infrastructure_workflows.md`
* `docs/design/product/marketplace_evolution_workflows.md`

Purpose:

Define how the project should be architected so that:

* it can be implemented today as a Canon-aligned ToB governed judgment platform
* it can later evolve into a marketplace-oriented ToC / hybrid platform
* both modes share one durable core execution engine

This document is primarily for:

* student implementers
* maintainers
* future refactors
* architecture reviews

---

# 1. Core Thesis

The system should be built as:

* **one shared workflow and governance core**
* **two operating models on top of that core**

The two operating models are:

## Operating Model A: ToB Governed Judgment Infrastructure

Private, organization-owned workflow execution.

Primary characteristics:

* tenant-scoped work
* organization-owned data
* private task orchestration
* governed first-pass execution and review
* dispute, arbitration, provenance, export

## Operating Model B: ToC / Marketplace Coordination Layer

Public or semi-public discovery, matching, commercial, and contributor-growth features.

Primary characteristics:

* listing and discovery
* task publishing and funding
* applications and assignment
* contributor reputation and growth
* messaging and notifications
* payments and payouts

The second model must **reuse** the first model's execution engine rather than replacing it.

---

# 2. Architectural Position

The most important design decision is:

**The core of the system is not the dashboard, not the listing page, and not the payment flow.**

The core is the **judgment execution and governance engine**:

* identity
* organization scope
* project
* task
* task item
* assignment
* first-pass outputs
* review
* disagreement
* dispute
* arbitration
* canonical judgment
* provenance
* export
* external data pointer access

Everything else should be treated as one of:

* an outer product layer
* an integration layer
* a trust and economic layer

---

# 3. Why This Split Matters

If the project is built as "just an enterprise admin app", it will be hard to evolve into a marketplace.

If the project is built as "just a marketplace", it will dilute the Canon and weaken the actual differentiator:
governed, traceable human judgment.

Therefore:

* `ToB mode` proves the infrastructure is real
* `Marketplace mode` later provides scale, liquidity, and commercial reach

This is not two separate products.
It is one product with:

* one execution core
* one shared data model
* one workflow engine
* multiple experience layers

---

# 4. Shared Core Domain

The following domains must remain in the shared core.
They are valid in both operating models.

## 4.1 Identity and Access

Shared because both modes need:

* users
* authentication
* role assignments
* permission checks
* attribution

Core entities:

* `User`
* `RoleAssignment`
* `Session` or token
* `OrganizationUser`

## 4.2 Organization and Tenant Scope

Shared because both enterprise and marketplace flows still need ownership and data boundaries.

Core entities:

* `Organization`
* `Project`

Note:
Marketplace mode may later add lighter-weight publisher profiles or pseudo-organizations, but those should still map into the same ownership model rather than inventing a separate execution universe.

## 4.3 Task and TaskItem Execution

This is the heart of the engine.

Core entities:

* `Task`
* `TaskItem`
* `TaskStateHistory`
* `TaskItemStateHistory`

Core invariants:

* every task item belongs to one task
* every task has one active execution mode at a time
* workflow state transitions are explicit

## 4.4 First-Pass Outputs and Review

Shared because both operating models still produce first-pass outputs and reviews.

Core entities:

* `Annotation`
* `AnnotationAction`
* `Review`
* `ReviewDecision`

## 4.5 Governance

Shared because disagreement, dispute, and arbitration are the essence of the product.

Core entities:

* `DisagreementRecord`
* `DisputeCase`
* `DisputeParticipant`
* `ArbitrationDecision`
* `CanonicalJudgment`

## 4.6 Provenance and Audit

Shared because both models must preserve trust.

Core entities:

* `ProvenanceRecord`
* `JudgmentLineage`
* append-preserving history tables

## 4.7 Export and Delivery

Shared because validated results must leave the platform in both operating modes.

Core entities:

* `ExportPackage`
* `ExportPackageItem`
* `ExportStateHistory`

## 4.8 External Data Boundary

Shared because the Canon's data sovereignty principle should survive marketplace expansion.

Core entities:

* `DataPointer`
* `AccessPolicy`
* `StorageProviderConfig`

---

# 5. Non-Core but Compatible Extension Domains

These domains should not be embedded into the core judgment engine.
They should sit beside it as extension modules.

## 5.1 Marketplace Discovery

* listing feeds
* search
* recommendation
* match scoring

Example entities:

* `MarketplaceListing`
* `ListingRecommendation`

## 5.2 Commercial Layer

* pricing
* billing
* escrow
* payout
* refunds

Example entities:

* `Invoice`
* `Transaction`
* `EscrowBalance`

## 5.3 Trust and Reputation Layer

* user profile
* certification
* XP
* badges
* rank
* trust score

Example entities:

* `UserProfile`
* `Certification`
* `TrustScore`
* `ExperienceLedger`

## 5.4 Communication Layer

* notifications
* direct messaging
* status alerts

Example entities:

* `Notification`
* `Conversation`
* `Message`

## 5.5 Application and Acceptance Layer

* apply to task
* invitation
* contributor approval

Example entities:

* `Application`
* `Invitation`

---

# 6. The Correct Dependency Direction

The dependency rule should be:

```text
Marketplace / Experience Layer
    depends on
Trust / Commercial / Communication Layer
    depends on
Shared Workflow Core
    depends on
Infrastructure / Integrations
```

And not:

```text
Workflow Core depends on marketplace concepts
```

This means:

* `Task` must not require `Listing`
* `DisputeCase` must not require `Payment`
* `CanonicalJudgment` must not depend on `XP`
* `Assignment` must not assume marketplace origin

Instead:

* a `MarketplaceListing` may reference a `Task`
* a `PaymentDecision` may reference a `TaskItem` outcome
* a `TrustScore` may consume quality events from reviews and disputes

---

# 7. Canonical Object Mapping

This is the most important compatibility table in the whole architecture.

| Shared Core Object      | ToB Meaning                                 | Marketplace Meaning                                  |
| ----------------------- | ------------------------------------------- | ---------------------------------------------------- |
| `Organization`          | client tenant                               | publisher entity, client entity, or platform cohort  |
| `Project`               | internal work program                       | listing family or campaign container                 |
| `Task`                  | governed judgment program                   | funded work unit behind a listing                    |
| `TaskItem`              | atomic operation target                     | payable atomic work unit                             |
| `Assignment`            | internal routing                            | accepted work allocation                             |
| `Annotation`            | candidate result                            | worker-produced output                               |
| `Review`                | governance review                           | QA, reviewer, or platform quality review             |
| `DisputeCase`           | governance conflict                         | contested quality/payment decision case              |
| `ArbitrationDecision`   | expert final ruling                         | expert ruling with payout or trust implications      |
| `CanonicalJudgment`     | authoritative final output                  | final judged result behind settlement and export     |
| `ExportPackage`         | deliverable dataset package                 | deliverable dataset package or requester handoff     |
| `DataPointer`           | external client storage reference           | requester-controlled external storage reference      |

The implication is:

**the meaning can expand, but the execution object should remain stable.**

---

# 8. Backend Module Strategy

The backend should be organized around domain ownership, not around page names.

Recommended durable modules:

* `identity/`
* `organizations/`
* `projects/`
* `tasks/`
* `task_items/`
* `schemas/`
* `annotations/`
* `reviews/`
* `disagreements/`
* `disputes/`
* `arbitration/`
* `judgments/`
* `provenance/`
* `exports/`
* `data_access/`
* `assignments/`

Recommended extension modules:

* `profiles/`
* `trust/`
* `marketplace/`
* `applications/`
* `billing/`
* `payments/`
* `notifications/`
* `messaging/`

Rule:

* Core modules may not import marketplace and billing concepts.
* Extension modules may depend on core modules.

---

# 9. API Surface Strategy

The API should also reflect the split.

## 9.1 Core APIs

Stable, Canon-aligned, reusable in both modes:

* `/auth`
* `/organizations`
* `/projects`
* `/tasks`
* `/task-items`
* `/annotations`
* `/reviews`
* `/disputes`
* `/arbitration`
* `/judgments`
* `/exports`

## 9.2 Extension APIs

Layered on top later:

* `/profiles`
* `/trust`
* `/marketplace/listings`
* `/marketplace/applications`
* `/payments`
* `/wallet`
* `/notifications`
* `/messages`

Rule:

* A core API must remain meaningful even if marketplace mode never ships.
* An extension API should be able to disappear without breaking core execution.

---

# 10. Frontend Architecture Strategy

The frontend should not be treated as one giant dashboard shell forever.

It should evolve into layered experiences over the same backend.

## 10.1 Shared Shell and Components

Reusable across both modes:

* auth shell
* page headers
* item tables
* workbench panels
* provenance viewer
* dispute and arbitration views

## 10.2 ToB Experience Surfaces

Enterprise / private workflow:

* organization overview
* project control plane
* task configuration
* review console
* dispute console
* export console

## 10.3 Marketplace Experience Surfaces

Public / semi-public:

* home feed
* listing cards
* listing detail
* profile page
* apply flow
* wallet / earnings
* notifications and inbox

The same app can host both if routes and layouts are organized cleanly.

Example route families:

* `/org/...`
* `/projects/...`
* `/tasks/...`
* `/marketplace/...`
* `/profile/...`
* `/wallet/...`

---

# 11. State Machine Strategy

The current formal state machines should stay in the core:

* `Task`
* `TaskItem`
* `DisputeCase`
* `ExportPackage`

Marketplace should add parallel states rather than mutating those into commerce-specific hacks.

Example:

Core task states:

* `DRAFT`
* `ACTIVE`
* `PAUSED`
* `COMPLETED`
* `ARCHIVED`

Marketplace publishing states:

* `UNFUNDED`
* `PENDING_PAYMENT`
* `PUBLISHED`
* `MATCHING`
* `CLOSED`

These should be separate concerns.
Do not overload one state machine to represent both workflow governance and marketplace economics.

---

# 12. Database Strategy

The schema should follow the same split.

## 12.1 Core Tables

Should exist regardless of operating model:

* `users`
* `organizations`
* `organization_users`
* `role_assignments`
* `projects`
* `tasks`
* `task_items`
* `data_pointers`
* `annotations`
* `annotation_actions`
* `reviews`
* `disagreements`
* `dispute_cases`
* `dispute_participants`
* `arbitration_decisions`
* `canonical_judgments`
* `provenance_records`
* `export_packages`
* `export_package_items`

## 12.2 Extension Tables

Should remain optional and isolated:

* `user_profiles`
* `certifications`
* `trust_scores`
* `badge_awards`
* `marketplace_listings`
* `applications`
* `notifications`
* `messages`
* `billing_accounts`
* `transactions`
* `payouts`

Rule:

Core rows must never require extension rows to be valid.

---

# 13. Event and Integration Strategy

As the product grows, cross-domain communication should increasingly use events rather than direct coupling.

Examples:

* `first_pass_output_submitted`
* `review_completed`
* `disagreement_detected`
* `dispute_opened`
* `arbitration_decided`
* `canonical_judgment_published`
* `export_ready`

Marketplace or trust modules can subscribe to these:

* update XP
* compute trust score
* trigger payout eligibility
* send notifications

This is safer than embedding payout or reputation rules into review logic.

---

# 14. Example End-to-End Mapping

## 14.1 ToB Flow

```text
Org creates project
  ->
Org creates task
  ->
Org registers data pointer
  ->
System generates task items
  ->
AI-assisted or human-first first-pass work
  ->
Review
  ->
Dispute if needed
  ->
Arbitration if needed
  ->
Canonical judgment
  ->
Export package
```

## 14.2 Marketplace Flow

```text
Requester creates listing
  ->
Listing funds a task
  ->
Workers apply or are matched
  ->
Assignments created on task items
  ->
Annotation and review run on same core engine
  ->
Quality checks and disputes happen on same governance engine
  ->
Final decisions drive payout and reputation
  ->
Results export to requester
```

The key point:

* Listing is not execution.
* Payment is not execution.
* Assignment and judgment remain execution.

---

# 15. Implementation Guidance for Students

If students only implement the Canon today, they should still code as if marketplace will later exist.

That means:

## Do

* keep domain boundaries explicit
* model shared core entities cleanly
* use generic names like `Assignment`, not `GigAcceptance`
* preserve append-only workflow history
* keep task ownership and worker acquisition separate
* keep raw data external
* keep role logic extensible

## Do Not

* hard-code everything into one `dashboard` module
* tie review logic to one specific UI layout
* make `Task` depend on payment fields
* make dispute logic assume only enterprise reviewers exist
* put marketplace matching logic inside task state transitions
* store raw client data as platform truth

---

# 16. Migration Strategy

The recommended implementation sequence is:

## Phase 1: Core First

Build:

* auth
* org / project / task
* data pointers
* first-pass outputs
* review
* disagreement
* dispute
* arbitration
* provenance
* export

This yields a credible ToB platform.

## Phase 2: Trust and Profile Layer

Add:

* profiles
* certifications
* XP and badges
* trust scores

This is useful for both ToB and marketplace.

## Phase 3: Marketplace Discovery Layer

Add:

* listings
* applications
* contributor discovery
* notifications and messaging

## Phase 4: Economic Layer

Add:

* checkout
* escrow
* payout
* settlement adjustments after disputes

This order keeps the hard part stable first:
the governance engine.

---

# 17. Architectural Anti-Patterns

Avoid these at all costs:

## Anti-pattern 1: Two Separate Task Models

Bad:

* enterprise tasks
* marketplace tasks

Good:

* one `Task`
* multiple outer acquisition models

## Anti-pattern 2: Marketplace Fields Polluting Core Workflow

Bad:

* `tasks.commission_amount`
* `tasks.listing_visibility`
* `tasks.worker_match_score`

Good:

* keep those in listing / billing modules

## Anti-pattern 3: Payment Logic Inside Review Logic

Bad:

* review service decides payout directly

Good:

* review emits outcome
* settlement module consumes outcome

## Anti-pattern 4: Replacing Provenance with Derived Summaries

Bad:

* only storing final label and aggregate score

Good:

* preserve full workflow history

## Anti-pattern 5: Designing UI Categories as Domain Boundaries

Bad:

* `dashboard/`
* `homepage/`
* `workbench/`
as backend module boundaries

Good:

* domain-driven backend modules
* UI as one projection layer over those modules

---

# 18. Final Design Rule

If a feature answers one of these questions, it belongs in the shared core:

* What is the task?
* What is the task item?
* Who is allowed to act?
* What first-pass output happened?
* What review happened?
* Was there disagreement?
* Was a dispute opened?
* What was the arbitration result?
* What is the canonical judgment?
* What is the provenance chain?
* What gets exported?

If a feature answers one of these questions, it is probably an extension layer:

* How did the worker discover the task?
* How much does it pay?
* Who messaged whom?
* What badge did the user earn?
* What is the match score?
* Has escrow settled?

That is the practical meaning of:

**One Core, Two Operating Models.**
