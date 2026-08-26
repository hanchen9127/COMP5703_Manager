下面是 `db_schema_strategy.md`，目标是**在不进入具体表结构实现细节之前，先钉死数据库建模策略**。
这份文档要回答的核心问题是：

> 这个系统到底是：
>
> * 纯 mutable row model
> * 纯 event sourcing
> * 还是 hybrid model

对于DAP这个平台，答案应该很明确：

> **采用 Hybrid Persistence Strategy**
> 也就是：
>
> * **当前状态用 mutable canonical tables 表达**
> * **关键判断与状态迁移用 append-only history / audit / provenance 表达**

这样才能同时满足：

* 查询效率
* 运营可用性
* provenance 可追踪
* dispute / arbitration 历史保留
* 工程复杂度可控

---

# DB Schema Strategy

Document: `db_schema_strategy.md`
Version: v1.1
Status: Authoritative (Persistence Strategy)

Governance:

* Governed by Project Canon v1.0
* Derived from Requirements v1.1
* Aligned with Architecture Overview v1.2
* Aligned with Domain Model v1.1
* Aligned with Workflow States v1.2

If conflicts occur, precedence applies:

1. Project Canon
2. Requirements
3. Domain Model / Workflow States
4. DB Schema Strategy

This document defines the **database persistence strategy** of the platform.
It does not define vendor-specific SQL, index syntax, migration tooling, or ORM choices.

It is also aligned with the **One Core, Two Operating Models** design direction. The database strategy must preserve a durable shared core schema while leaving room for optional extension schemas in future product modes.

---

# 1. Purpose

The database layer must support a system that is simultaneously:

* operationally efficient
* provenance-preserving
* dispute-aware
* tenant-isolated
* compatible with external data ownership

The persistence model must therefore support both:

* **current state queries**
* **historical traceability**

without forcing the system into a fully event-sourced architecture.

---

# 2. Primary Strategy

## Chosen Strategy

The platform uses a **Hybrid Persistence Strategy**.

This means:

### Current-state model

The system maintains canonical current-state records for operational entities such as:

* Project
* Task
* TaskItem
* DisputeCase
* CanonicalJudgment
* ExportPackage

These records reflect the **current active state** of the system and are optimized for normal application queries.

---

### Append-preserving history model

The system also maintains append-preserving historical records for:

* annotation actions
* review actions
* disagreement creation
* dispute transitions
* arbitration outcomes
* state transitions
* provenance events

These records are not overwritten and provide the lineage required by the Canon.

---

# 3. Why Not Pure Event Sourcing

A pure event-sourced architecture is not chosen for the following reasons:

### Operational Complexity

The platform needs straightforward querying for:

* dashboard views
* task item indexes or runtime-monitoring views
* review lists
* dispute status
* export generation

Reconstructing all such views from raw events would add unnecessary complexity.

---

### Product Velocity

The platform is still in early architectural definition and should not assume a full event-sourced operational model prematurely.

---

### Provenance Scope

Not every system action needs to be a domain event persisted as the only source of truth.
What is required is:

* decision lineage
* judgment traceability
* dispute history
* actor attribution

This can be achieved through append-preserving history tables/logs.

---

# 4. Why Not Pure Mutable Rows

A pure mutable-row model is also insufficient.

### It would violate Canon requirements:

* disagreement must remain preserved
* provenance must be append-preserving
* finalization must not erase prior states
* review and arbitration history must remain auditable

If the system stored only the latest row state, it would lose exactly the trust properties the platform is intended to provide.

---

# 5. Persistence Layers

The persistence model is divided into three conceptual layers.

---

## 5.1 Canonical State Layer

Stores the current active state of primary operational entities.

### Examples

* organizations
* users
* projects
* tasks
* task_items
* assignments
* disputes
* canonical_judgments
* export_packages

### Characteristics

* mutable
* optimized for normal product queries
* represents the latest valid state

### Purpose

This layer powers normal system operation.

---

## 5.2 Workflow History Layer

Stores append-only historical records of key lifecycle transitions and actions.

### Examples

* task_state_history
* task_item_state_history
* dispute_state_history
* export_state_history
* assignment_history

### Characteristics

* append-only
* records who changed what and when
* provides operational auditability

### Purpose

This layer preserves workflow history independently of current-state tables.

---

## 5.3 Judgment Provenance Layer

Stores append-preserving judgment lineage.

### Examples

* annotation records
* annotation revisions or actions
* review records
* disagreement records
* arbitration decisions
* judgment lineage links

### Characteristics

* append-preserving
* tied to TaskItem as atomic judgment unit
* supports explainability and audit

### Purpose

This layer preserves the semantic evolution of judgments.

---

# 6. Canonical Storage Principle

The system must distinguish between:

### canonical state

what is currently true

and

### historical trace

how the current truth emerged

This distinction is central to schema design.

---

# 7. Entity Persistence Strategy

This section defines how major domain entities should be persisted conceptually.

---

## 7.1 Organization

Persistence type:

* canonical state

History requirement:

* minimal administrative history only if needed

Notes:
Organization is a tenant boundary, not a provenance-heavy domain object.

---

## 7.2 User

Persistence type:

* canonical state

History requirement:

* role assignment history
* account status history if relevant

---

## 7.3 Project

Persistence type:

* canonical state

History requirement:

* optional project status history

---

## 7.4 Task

Persistence type:

* canonical state
* workflow history

Task must support:

* current operational state
* state transition history

Important examples:

* draft → active
* active → paused
* active → completed

---

## 7.5 TaskItem

Persistence type:

* canonical state
* workflow history
* judgment provenance anchor

TaskItem is the central domain anchor and requires both:

* current state
* state history
* all linked judgment records

---

## 7.6 Annotation

Persistence type:

* append-preserving judgment record

Annotations should not be modeled as a single mutable “latest label” row only.

The system must preserve:

* source type (AI / human)
* author/model attribution
* creation timestamp
* annotation content
* later human modifications or replacement logic

### Recommended conceptual model

* immutable annotation records
* optional separate annotation action / revision records

---

## 7.7 Review

Persistence type:

* append-preserving judgment record

Reviews are governance events and must remain historically visible.

A review should not be overwritten into a single “latest review” row without history.

---

## 7.8 Disagreement

Persistence type:

* append-preserving judgment signal

Disagreements must remain preserved even after dispute closure or arbitration.

---

## 7.9 DisputeCase

Persistence type:

* canonical state
* workflow history

The dispute itself has:

* a current state
* a historical transition record

Associated evidence and referenced disagreements remain separate.

---

## 7.10 ArbitrationDecision

Persistence type:

* append-preserving authoritative decision record

An arbitration decision is historically significant and must remain immutable once issued, except under explicit versioning policy.

---

## 7.11 CanonicalJudgment

Persistence type:

* canonical state
* lineage references

The platform needs a current active canonical judgment for each finalized TaskItem.

However, that judgment must reference its lineage, not replace it.

### Recommended conceptual model

* one active canonical judgment per task item
* optional version chain for superseded canonical judgments

---

## 7.12 Provenance

Persistence type:

* append-preserving lineage model

Provenance should not be treated as a derived afterthought.
It is a first-class persistence concern.

Possible representation:

* linked provenance events
* lineage edges between domain records
* explicit provenance tables

Final representation is TBD, but append preservation is mandatory.

---

## 7.13 ExportPackage

Persistence type:

* canonical state
* export workflow history

Exports need:

* current export state
* generation/delivery history
* reference set of included outputs

---

# 8. Recommended Structural Pattern

A practical schema strategy should follow this pattern:

```text
Canonical Table
    +
History Table
    +
Reference / Lineage Tables
```

Examples:

```text
tasks
task_state_history

task_items
task_item_state_history

disputes
dispute_state_history

canonical_judgments
canonical_judgment_lineage

exports
export_state_history
```

For provenance-heavy entities:

```text
annotations
annotation_actions (optional)

reviews

disagreements

arbitration_decisions
```

This preserves both usability and trust.

---

# 9. Shared Core and Extension Schema Boundary

Before defining concrete table sets, the schema must distinguish between **durable shared-core tables** and **optional extension tables**.

## 9.1 Shared-Core Tables

The following table families belong to the durable shared core and must remain valid without any marketplace or commercial extension:

* users, memberships, role assignments
* organizations and projects
* tasks, task_items, assignments
* data_pointers and access-related metadata
* annotations, reviews, disagreements
* dispute_cases and arbitration_decisions
* canonical_judgments and provenance-supporting lineage tables
* export_packages and export history

These tables define execution, governance, and auditability.

## 9.2 Optional Extension Tables

Future product modes may add extension tables such as:

* user_profiles
* certifications
* trust_scores
* listings
* applications
* contracts
* invoices
* payouts
* messages or notification preferences

These tables may reference shared-core rows, but shared-core rows must never require them in order to remain valid.

## 9.3 Direction of Dependency

The dependency rule is strict:

* extension tables may depend on shared-core tables
* shared-core tables must not depend on extension tables

This prevents a future marketplace mode from contaminating the canonical workflow model.

---

# 10. Identity and Foreign-Key Strategy

The schema should use stable globally unique identifiers for all major entities.

At conceptual level:

* all domain entities require stable ids
* all history records reference parent entity ids
* provenance records must reference both source object and actor where applicable

No business logic should depend on mutable display names.

---

# 11. Tenant Isolation Strategy

Tenant isolation is a non-negotiable persistence rule.

## Required principle

All organization-owned records must be isolatable by organization boundary.

This implies that organization scope must be recoverable for:

* projects
* tasks
* task_items
* annotations
* reviews
* disputes
* canonical judgments
* exports

### Recommended conceptual approach

Either:

* organization_id is directly present on key operational tables

or

* tenant lineage is recoverable through enforced ownership chains

Final denormalization policy is TBD.

---

# 12. External Data Strategy

Raw client datasets are not canonical database entities inside the platform.

The database stores:

* data pointers
* access metadata
* linkage to task items

The database does not store:

* raw images
* raw text corpora
* raw audio/video blobs

except possibly temporary runtime cache outside canonical storage model.

This distinction must remain clear in schema design.

---

# 13. Mutation Policy

## Mutable records allowed for:

* canonical state tables
* status fields
* assignment state
* export state
* current canonical judgment pointer

## Immutable / append-preserving records required for:

* annotation records
* review records
* disagreement records
* arbitration decisions
* workflow state history
* provenance history

This is the core mutation policy of the system.

---

# 14. Versioning Strategy

Versioning is required in selected areas.

## Required / likely versioned

* task schema (TBD exact model)
* canonical judgments (if supersession occurs)
* data pointers (if external source version changes)
* first-pass runtime integrations (outside DB scope)

## Not necessarily versioned as first-class entities

* organizations
* users
* projects

unless policy requires historical administrative tracking.

---

# 15. Auditability Strategy

The database must support reconstruction of:

* who performed an action
* what changed
* when it changed
* which entity was affected
* what the current state is
* what the prior state was

This does not require full event sourcing, but it does require explicit history persistence.

---

# 16. Query Classes to Optimize For

The persistence strategy should support the following query classes efficiently.

## Operational Queries

* list active tasks
* list assigned task items
* list items under review
* list open disputes
* list unresolved arbitration intake
* list export packages awaiting delivery

## Judgment Queries

* retrieve candidate outputs for task item
* compare AI and human annotations
* retrieve review chain
* inspect dispute evidence
* retrieve canonical judgment

## Provenance Queries

* reconstruct lineage for task item
* inspect all actors involved
* inspect state transitions
* inspect arbitration path

## Tenant Queries

* retrieve all project/task outputs for organization
* export organization-owned judgments

---

# 17. Recommended Record Categories

The system should conceptually separate records into these categories:

### A. Control Records

Used to run the platform

* organizations
* users
* roles
* assignments
* projects
* tasks

### B. Workflow Records

Used to manage lifecycle

* task state history
* task item state history
* dispute state history
* export state history

### C. Judgment Records

Used to represent semantic work

* annotations
* reviews
* disagreements
* arbitration decisions
* canonical judgments

### D. Reference Records

Used to connect the platform to external reality

* data pointers
* task schemas
* export membership records
* lineage mappings

This categorization is more important than specific table names.

---

# 18. Anti-Patterns to Avoid

The schema must avoid the following patterns.

## Anti-pattern 1: Single mutable annotation row

A design where only the latest label exists and prior annotation context is lost.

Why invalid:
violates provenance and disagreement preservation.

---

## Anti-pattern 2: Raw blob storage as platform truth

A design where platform database becomes a primary repository for client raw content.

Why invalid:
violates data sovereignty positioning.

---

## Anti-pattern 3: Final judgment without lineage

A design where the final label exists but cannot be traced back to prior review/dispute/arbitration.

Why invalid:
violates explainability and audit requirements.

---

## Anti-pattern 4: Dispute collapse

A design where disputes are “resolved” by deleting or overwriting disagreement evidence.

Why invalid:
violates disagreement preservation.

---

# 19. Open Questions

## Annotation revision model

Should human changes to annotations be represented as:

* new annotations
* annotation revisions
* action log on top of canonical annotation id

Status: TBD

---

## Canonical judgment supersession

If a finalized judgment is later corrected, should the old one be:

* superseded but retained
* marked inactive
* moved fully into history

Status: TBD

---

## Tenant key denormalization

Should organization_id be stamped directly on most operational tables for query efficiency?

Status: TBD

---

## Provenance representation

Should provenance be modeled primarily as:

* explicit provenance events
* lineage link tables
* mixed strategy

Status: TBD

---

# 20. Summary

The database strategy for this platform is:

> **mutable current-state tables for operational truth**
> plus
> **append-preserving history and provenance records for judgment integrity**

This is the minimum viable persistence strategy that satisfies both:

* platform usability
* Canon-level trust requirements

---
