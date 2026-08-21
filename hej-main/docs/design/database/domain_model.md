# Domain Model

Document: `domain_model.md`
Version: v1.2
Status: Authoritative (Conceptual Data Model)
Governance:

* Governed by Project Canon v1.0
* Aligned with Requirements v1.1
* Aligned with Architecture Overview v1.2
* Aligned with One Core, Two Operating Models

Purpose:

Define the conceptual core data model of the platform.

This document describes what entities exist, what they mean, and which invariants must hold in the shared core.

---

# 1. Modeling Goals

The domain model must preserve these truths:

* the platform orchestrates judgment workflows, not raw data ownership
* `organization -> project -> task -> task_item` is the core execution hierarchy
* first-pass outputs and review are distinct concepts
* annotation tasks and judgment tasks are both valid task forms
* disagreement is first-class
* arbitration produces canonical judgment
* provenance is preserved
* the core remains valid even if future marketplace layers are added

---

# 2. Core Domains

The shared core is organized around:

* Identity and Access
* Organization and Project Scope
* Task Execution
* Annotation and Review
* Dispute and Arbitration
* Provenance and Export
* External Data Boundary

---

# 3. Core Entities

## Organization

Top-level tenant and ownership boundary.

Invariant:

* projects belong to exactly one organization

## User

Identified actor in the system.

Invariant:

* workflow actions are attributable to a real user or explicit machine source

## RoleAssignment

Authorization binding for a user within platform or organization scope.

## Project

Organization-owned container for related tasks, disputes, exports, and policies.

## Task

Project-scoped judgment program.

Key attributes:

* title / description
* task_class
* task_type
* execution_mode
* task_status
* policy context

## TaskItem

Atomic workflow unit inside a task.

Key attributes:

* task reference
* data pointer reference
* item state

## DataPointer

Reference to externally hosted client data.

## LabelSchema / DecisionSchema

Task-bound output space.

For annotation tasks this may be a label schema.
For judgment tasks this may be a decision schema, verdict set, or structured rationale format.

## Annotation

Candidate work record produced by human or machine.

For annotation tasks this is a label-oriented annotation.
For judgment tasks this may carry a candidate verdict or evaluation output.

## Review

Governance action over one or more candidate outputs.

## Disagreement

Persisted conflict signal between candidate or review outcomes.

## DisputeCase

Structured escalation object for unresolved conflict.

## ArbitrationDecision

Expert-level authoritative decision.

## CanonicalJudgment

Final authoritative output for a task item, linked to its lineage.

## ProvenanceRecord

Audit-friendly trace or lineage relation across workflow steps.

## ExportPackage

Deliverable bundle of finalized outputs.

---

# 4. Shared-Core vs Future Extension

The following belong to the durable shared core:

* Organization
* User / RoleAssignment
* Project
* Task / TaskItem
* DataPointer
* Annotation / Review
* Disagreement / DisputeCase / ArbitrationDecision
* CanonicalJudgment / ProvenanceRecord
* ExportPackage

The following are future-compatible but not required by the shared core:

* richer profile entities
* trust or badge entities
* listing or marketplace entities
* billing or payout entities

Rule:

* extension entities may reference the core
* the core must not depend on them
