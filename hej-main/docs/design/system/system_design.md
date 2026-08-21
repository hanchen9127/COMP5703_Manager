# System Design Document

Version: v1.2
Status: Draft
Last Updated: 2026-03-22

Governance:

* Governed by Project Canon v1.0
* In case of conflict, Canon takes precedence over this document
* This document describes **HOW** the system may be implemented while preserving Canon constraints

---

# 1. Purpose

This document describes an implementation-oriented design for the **Human Judgment Infrastructure Platform**.

The system is designed to orchestrate two execution modes:

* **AI-assisted first-pass work**
* **Human-first first-pass work**

across at least two first-class task classes:

* **annotation tasks**
* **judgment tasks**

and to govern the resulting judgment lifecycle through:

* review
* disagreement detection
* dispute handling
* arbitration
* provenance recording
* export back to client organizations.

This document is not a product brief. It is an engineering guide for implementing the platform while preserving the Canon’s core commitments:

* human judgment is traceable
* disagreement is first-class
* AI and human roles remain distinct
* data ownership remains external to the platform
* final judgments remain lineage-traceable.

It is also aligned with the **One Core, Two Operating Models** approach: the current implementation targets the governed ToB operating model first, while preserving a shared core that can later support a marketplace-style operating model.

---

# 2. Architectural Goals

## 2.1 Primary Goals

1. **Workflow control**
   The platform must control task lifecycle, execution mode, review state, dispute state, and export state.

2. **Judgment traceability**
   All significant decisions must be reconstructable across annotation, review, dispute, and arbitration.

3. **Data sovereignty**
   Raw client data must remain outside canonical platform storage.

4. **First-pass runtime flexibility**
   The platform must support an integrated or native first-pass work runtime in MVP without making that runtime the platform shell.

5. **Tenant isolation**
   Each client organization must remain logically isolated.

6. **Operational simplicity**
   The first implementation should prefer a modular monolith with clear boundaries over premature distributed complexity.

7. **Convertible product architecture**
   The first implementation must keep shared execution and governance modules separate from future listing, trust, payment, and marketplace concerns.

---

# 3. Scope and Assumptions

## 3.1 In Scope

* organization, user, role, project, task, task item management
* external data reference and controlled retrieval
* AI candidate import
* human annotation or judgement via integrated or native first-pass runtime
* review workflows
* disagreement detection
* dispute handling
* arbitration recording
* canonical judgment publication
* provenance and audit trail
* export package generation

## 3.2 Out of Scope

For the current implementation slice, the following remain out of scope:

* raw client dataset hosting as system-of-record
* model training pipelines
* billing / payments
* public marketplace mechanics
* real-time collaborative editing in the annotation UI

## 3.3 Assumptions

The following are implementation assumptions because they are not fixed by Canon:

1. **Deployment shape**
   Initial implementation uses a **modular monolith backend** with separable internal modules and one primary relational database.

2. **First-pass runtime**
   MVP may use an integrated or native first-pass work runtime. The platform must preserve workflow authority outside that runtime.

3. **External data access**
   Client data is accessed via **data pointers** and runtime fetch through a controlled gateway.

4. **Storage choice**
   A relational database is used for canonical state, workflow history, and provenance-supporting records.

5. **Authentication**
   Session or token-based auth is used, but exact protocol is TBD.

6. **Asynchronous processing**
   Long-running work such as AI import, export generation, and batch disagreement scans may use background jobs.

---

# 4. Core Design Principles

## 4.1 Platform Owns Workflow; First-Pass Runtime Owns Item Interaction

The platform owns:

* task creation
* task profiling
* task class, task type, and execution mode selection
* review/dispute/arbitration workflow
* provenance
* export

The first-pass runtime owns:

* rendering task items for annotation or judgment work
* collecting annotation inputs or verdict inputs
* editing candidate annotations or candidate judgments

## 4.2 First-Pass Execution and Governance Are Separate Layers

First-pass execution does not directly produce final truth.
A TaskItem becomes authoritative only after governance logic allows a canonical judgment to be published.

## 4.3 Current State + Append-Preserving History

The persistence model uses:

* canonical current-state records for normal operations
* append-preserving history for workflow transitions and judgment lineage.

## 4.4 TaskItem Is the Atomic Workflow Unit

All operational judgment logic anchors to TaskItem:

* annotations
* reviews
* disagreements
* disputes
* arbitration
* canonical judgment
* provenance

Task remains the workspace authority surface for setup, items, review desks, dispute desks, and history.
TaskItem remains the atomic operation target inside those task-level desks.

## 4.5 One Core, Two Operating Models

The platform must distinguish between:

* the **shared core**, which owns execution, governance, and provenance
* the **operating model**, which determines how work is introduced and managed around the core

The shared core includes:

* identity and access
* organization and project scope
* tasks and task items
* external data pointers
* first-pass execution, review, dispute, arbitration, provenance, and export

Potential future extension modules include:

* richer profiles and trust systems
* marketplace discovery and applications
* payments, billing, and payout
* messaging or labor-market interaction

These future modules must consume the shared core rather than redefining task execution semantics.

---

# 5. High-Level Architecture

## 5.1 System Context

External actors and systems:

* Client Organization / Task Owner
* Annotator / Judge
* Reviewer
* Arbitrator
* Admin / Operator
* External AI candidate service
* External client data storage
* First-pass work runtime

## 5.2 Container-Level Design

### A. Web Application

Used by:

* task owners
* annotators
* reviewers
* arbitrators
* admins

Responsibilities:

* organization/project/task management UI
* task-level first-pass, review, dispute, and history desks
* access orchestration to first-pass runtime
* export and audit views

### B. Application Backend

Main orchestrator of system logic.

Responsibilities:

* identity and authorization
* task lifecycle
* task item orchestration
* execution mode control
* AI candidate import handling
* review and disagreement rules
* dispute/arbitration workflow
* provenance aggregation
* export generation

### C. Relational Database

Stores:

* control state
* workflow state
* judgment records
* provenance-supporting references
* export package metadata

### D. First-Pass Work Runtime (Integrated or Native)

MVP runtime may be an integrated external tool, a native web surface, or a hybrid path.

Responsibilities:

* display task items for annotation or judgement work
* collect human first-pass inputs
* allow edits to AI-suggested candidates

Not responsible for:

* dispute logic
* workflow state authority
* export logic
* provenance authority

### E. External Data Access Gateway

Boundary for accessing client-owned task data.

Responsibilities:

* resolve data pointer
* retrieve task payload at runtime
* enforce access policy
* avoid canonical persistence of raw data

### F. AI Candidate Import Adapter

Boundary for AI-generated candidate outputs.

Responsibilities:

* import AI suggestions or draft judgments
* validate mapping to task items
* persist imported candidate records with machine source identity

### G. Background Job Runner

Responsibilities:

* batch AI candidate import processing
* export generation
* disagreement scans
* cleanup of temporary first-pass runtime artifacts

---

# 6. Module Design (Implementation-Oriented)

The backend should be implemented as a modular monolith with the following internal modules.

## 6.1 Identity Module

Responsibilities:

* users
* memberships
* role assignments
* access checks

Key interfaces:

* resolve current user
* authorize action in organization scope
* list role grants

## 6.2 Organization & Project Module

Responsibilities:

* organizations
* projects
* organization-scoped visibility

## 6.3 Task Module

Responsibilities:

* create task
* attach schema
* set execution mode
* create task items
* assign task items
* manage task state

## 6.4 Data Access Module

Responsibilities:

* manage data pointers
* resolve external item access
* validate pointer configuration
* produce runtime payload handles for annotation, judgement, and review

## 6.5 Annotation Module

Responsibilities:

* accept human first-pass submissions
* record AI candidate outputs
* distinguish human and machine source
* maintain first-pass output history as needed

## 6.6 Review Module

Responsibilities:

* create reviews
* compare candidate outputs
* approve / reject / escalate
* emit disagreement records when applicable

## 6.7 Dispute Module

Responsibilities:

* create dispute cases
* attach participants
* manage dispute state
* route cases to arbitration

## 6.8 Arbitration Module

Responsibilities:

* record arbitration decisions
* transition disputes to resolved
* trigger publication eligibility for canonical judgment

## 6.9 Provenance Module

Responsibilities:

* expose lineage for task item
* aggregate annotation/review/dispute/arbitration history
* expose audit-friendly query views

## 6.10 Export Module

Responsibilities:

* assemble canonical judgments
* include optional provenance references
* create export packages
* manage export lifecycle

## 6.11 Future Extension Modules

These modules are intentionally excluded from the first implementation, but the internal boundaries above must leave room for them.

### Profile & Trust Module

Potential responsibilities:

* user profile enrichment
* certification metadata
* trust and badge systems

### Marketplace Module

Potential responsibilities:

* listing and discovery
* matching and applications
* work opportunity presentation

### Commercial Module

Potential responsibilities:

* billing
* payout
* commission logic

None of these modules may become a prerequisite for project-scoped or task-scoped execution.

---

# 7. Representative Data Model

This section is representative, not exhaustive.

## 7.1 Core Current-State Tables

### organizations

* id
* name
* status
* created_at
* updated_at

### users

* id
* display_name
* account_status
* created_at
* updated_at

### organization_users

* id
* organization_id
* user_id
* membership_status
* created_at

### role_assignments

* id
* user_id
* organization_id (nullable for global role)
* role_type
* active
* created_at

### projects

* id
* organization_id
* name
* status
* created_at
* updated_at

### tasks

* id
* project_id
* title
* description
* execution_mode
* schema_ref_id
* task_status
* policy_payload
* created_at
* updated_at

### task_items

* id
* task_id
* data_pointer_id
* task_item_status
* active_canonical_judgment_id (nullable)
* created_at
* updated_at

### assignments

* id
* user_id
* organization_id
* target_type
* target_id
* assignment_role
* assignment_status
* created_at
* updated_at

### dispute_cases

* id
* task_item_id
* dispute_status
* created_by_user_id
* created_at
* updated_at

### canonical_judgments

* id
* task_item_id
* judgment_payload
* active
* published_at
* superseded_by_id (nullable)

### export_packages

* id
* organization_id
* scope_type
* scope_id
* export_status
* export_config_payload
* created_at
* updated_at

## 7.2 Workflow History Tables

### task_state_history

* id
* task_id
* prior_state
* next_state
* actor_type
* actor_id
* reason
* created_at

### task_item_state_history

* id
* task_item_id
* prior_state
* next_state
* actor_type
* actor_id
* reason
* created_at

### dispute_state_history

* id
* dispute_case_id
* prior_state
* next_state
* actor_type
* actor_id
* reason
* created_at

### export_state_history

* id
* export_package_id
* prior_state
* next_state
* actor_type
* actor_id
* reason
* created_at

## 7.3 Judgment Tables

### data_pointers

* id
* external_locator
* access_policy_payload
* source_version
* created_at

### schemas

* id
* name
* schema_payload
* version
* created_at

### annotations

* id
* task_item_id
* source_type (ai|human)
* source_ref_type
* source_ref_id
* output_payload
* output_status
* created_at

### output_actions (optional but recommended)

* id
* output_id
* actor_user_id
* action_type
* action_payload
* created_at

### ai_candidate_imports

* id
* task_id
* model_name
* model_version
* import_status
* created_at

### reviews

* id
* task_item_id
* reviewer_user_id
* review_outcome
* rationale
* created_at

### review_outputs

* id
* review_id
* output_id

### disagreements

* id
* task_item_id
* disagreement_type
* disagreement_status
* created_at

### disagreement_positions

* id
* disagreement_id
* source_type
* source_id

### dispute_disagreements

* id
* dispute_case_id
* disagreement_id

### dispute_participants

* id
* dispute_case_id
* user_id
* participant_role
* created_at

### arbitration_decisions

* id
* dispute_case_id
* arbitrator_user_id
* decision_payload
* rationale
* created_at

### canonical_judgment_lineage

* id
* canonical_judgment_id
* source_type
* source_id

### export_package_items

* id
* export_package_id
* task_item_id
* canonical_judgment_id

---

# 8. External Interfaces

## 8.1 Client-Facing Web Flows

### Task Owner UI

Supports:

* create project
* create task
* choose task class, task type, and execution mode
* attach schema
* bind workflow policy
* register task items via data pointers
* view progress
* trigger export

### Annotator / Judge UI

Supports:

* view assigned work
* open first-pass work surface
* create or modify first-pass output
* submit first-pass output

### Reviewer UI

Supports:

* open task items under review
* compare candidate outputs
* approve / reject / escalate

### Arbitrator UI

Supports:

* inspect dispute case
* inspect evidence lineage
* issue arbitration decision

### Admin UI

Supports:

* manage organizations/users/roles
* inspect workflow states
* inspect failures and audit history

## 8.2 Machine Interfaces

### External Data Access Interface

Inputs:

* task item reference
* data pointer
* authorization context

Outputs:

* renderable task payload or payload handle
* access error if retrieval fails

### AI Candidate Import Interface

Inputs:

* task/task item references
* model identity
* candidate output payloads

Outputs:

* persisted AI candidate outputs
* validation result

### First-Pass Work Runtime Integration Interface

Inputs:

* task item
* schema
* optional AI candidate outputs
* execution mode

Outputs:

* human first-pass submissions
* edit actions

### Export Interface

Inputs:

* export request scope
* provenance inclusion option

Outputs:

* export package metadata
* generated deliverable

---

# 9. Core Workflows

## 9.1 Task Setup Workflow

1. Task owner creates Project
2. Task owner creates Task
3. Task owner defines task class and task type
4. Task owner defines execution mode
5. Task owner associates schema and shared workflow rules
6. Task owner registers TaskItems using DataPointers
7. System validates task configuration and launch readiness
8. Task transitions from DRAFT to ACTIVE

Failure handling:

* invalid schema or policy binding -> reject activation
* unresolved data pointers -> reject activation or mark blocked items
* incomplete task configuration -> keep task in DRAFT

## 9.2 Human-First First-Pass Workflow

1. TaskItem becomes available for assignment
2. Annotator or Judge opens TaskItem in first-pass runtime
3. Human participant creates first-pass output
4. First-pass output is persisted with source_type=human
5. TaskItem transitions toward first-pass completion
6. Review is created or scheduled downstream
7. Review outcome either finalizes or escalates

Failure handling:

* runtime submission failure -> keep item in pre-submission state
* invalid first-pass payload -> reject submission with validation error
* user loses access mid-session -> block commit and require re-auth

## 9.3 AI-Assisted First-Pass Workflow

1. Task is configured for AI-assisted mode
2. AI Candidate Import Adapter ingests candidate outputs
3. AI candidate outputs are persisted with source_type=ai
4. Human annotator, judge, or reviewer opens task item with AI candidate context
5. Human accepts / modifies / rejects AI suggestion or continues first-pass work
6. Review proceeds downstream as configured

Failure handling:

* AI import mismatch to task items -> reject batch rows and log import errors
* AI service unavailable -> task items may still proceed via fallback human-first handling if policy allows
* malformed AI payload -> store import failure, do not publish candidate output

## 9.4 Review Workflow

1. Reviewer loads TaskItem context
2. Reviewer sees candidate outputs that already came from AI-assisted or human-first execution
3. Reviewer submits Review
4. System evaluates review outcome
5. If no unresolved conflict -> TaskItem may finalize
6. If conflict exists -> Disagreement is recorded and dispute may be created

Failure handling:

* review references missing candidate output -> reject review write
* concurrent review collision -> accept both reviews if valid and allow disagreement logic to resolve
* invalid reviewer role -> reject action

## 9.5 Dispute and Arbitration Workflow

1. System or authorized user creates DisputeCase
2. Relevant disagreements are attached
3. Participants are associated
4. Case enters discussion / escalation path
5. Arbitrator issues ArbitrationDecision
6. System resolves DisputeCase and enables canonical judgment publication

Failure handling:

* dispute created without disagreement -> reject
* arbitrator decision submitted by unauthorized user -> reject
* dispute already resolved -> reject further mutation unless future reopening policy exists

## 9.6 Canonical Judgment Publication Workflow

1. Preconditions verified:

   * task item is review-complete or arbitration-resolved
   * judgment lineage sources exist
2. CanonicalJudgment is created or superseding one is published
3. task_items.active_canonical_judgment_id updated
4. TaskItem transitions to FINALIZED
5. lineage links stored in canonical_judgment_lineage

Failure handling:

* missing lineage -> block publication
* second active canonical judgment detected -> reject transaction
* task item not in valid state -> reject publication

## 9.7 Export Workflow

1. Task owner requests export
2. ExportPackage created in CREATED state
3. Background job assembles canonical judgments
4. Optional provenance links included
5. Export status transitions CREATED -> GENERATING -> READY
6. Client retrieves export
7. Export state becomes DELIVERED if delivery acknowledged

Failure handling:

* included task item lacks canonical judgment -> skip or fail based on export policy (assumption: fail-fast for MVP)
* generation job failure -> mark FAILED and preserve error details
* delivery failure -> READY remains until retried or explicit failure policy applies

---

# 10. Representative Interfaces (Conceptual)

These are structural interfaces, not final API definitions.

## 10.1 Task Management Interface

Capabilities:

* create_project
* create_task
* update_task_configuration
* activate_task
* pause_task
* complete_task
* list_task_items

## 10.2 First-Pass Output Interface

Capabilities:

* import_ai_candidates
* submit_human_first_pass_output
* list_task_item_outputs
* get_task_item_output_context

## 10.3 Review Interface

Capabilities:

* submit_review
* list_pending_reviews
* inspect_candidate_outputs
* escalate_to_dispute

## 10.4 Dispute Interface

Capabilities:

* create_dispute_case
* attach_disagreement
* add_participant
* submit_arbitration_decision
* resolve_dispute_case

## 10.5 Provenance Interface

Capabilities:

* get_task_item_lineage
* get_task_item_state_history
* get_dispute_history
* get_canonical_judgment_sources

## 10.6 Export Interface

Capabilities:

* create_export_package
* get_export_status
* list_export_items
* retrieve_export

---

# 11. Failure Handling Strategy

## 11.1 Design Principles

1. **Do not lose human work silently**
   Human submissions must fail explicitly with retry-safe behavior.

2. **Preserve partial truth where safe**
   AI import failure must not corrupt human workflows.

3. **Fail closed on authority-sensitive actions**
   Canonical judgment publication, arbitration submission, and cross-tenant access must reject on ambiguity.

4. **Separate operational failure from semantic failure**
   Example: external data access failure is not the same as a disagreement in judgment.

## 11.2 Failure Classes

### A. Data Access Failures

Examples:

* pointer invalid
* authorization expired
* external object missing

Handling:

* mark task item as blocked for runtime access
* log failure in operational event log
* do not create false first-pass state transitions

### B. First-Pass Runtime Failures

Examples:

* runtime submission timeout
* invalid payload returned

Handling:

* keep task item in current pre-submission state
* present retry-safe UI
* preserve draft if supported by integration

### C. AI Import Failures

Examples:

* task item mapping mismatch
* malformed AI candidate payload

Handling:

* reject invalid records
* keep import batch status visible
* do not mix failed import rows with valid canonical workflow state

### D. Governance Failures

Examples:

* review without required references
* dispute without valid disagreement
* arbitration by unauthorized user

Handling:

* reject transaction
* preserve prior state
* log audit event

### E. Export Failures

Examples:

* packaging job crash
* missing canonical judgments

Handling:

* transition export package to FAILED
* allow retry if policy permits
* preserve previous generation attempts in history

---

# 12. Security, Privacy, and Trust Boundaries

## 12.1 Tenant Isolation

All organization-owned operational records must be isolated by organization boundary.

Implementation implications:

* authorization checks are organization-scoped
* queries must never return cross-tenant data
* exports only contain organization-owned outputs

## 12.2 Data Sovereignty

Raw client datasets remain external.

Implementation implications:

* canonical DB stores data pointers, not raw dataset blobs
* runtime payload retrieval should be ephemeral where possible
* first-pass output records reference task items, not embedded raw source ownership

## 12.3 Source Distinction

AI-generated and human-generated first-pass outputs must remain distinguishable in storage and interfaces.

## 12.4 Authority-Sensitive Actions

The following actions require strict authorization:

* role assignment
* task activation/completion
* dispute routing
* arbitration decision submission
* canonical judgment publication
* export generation

---

# 13. Observability

Minimum observability should include:

## Logs

* authentication and authorization failures
* task state transitions
* task item state transitions
* dispute transitions
* export transitions
* AI import failures
* data access failures

## Metrics

* active tasks
* task item counts by status
* review throughput
* dispute rate
* arbitration intake length
* export success/failure counts

## Traceability

At minimum, all authority-sensitive actions should be reconstructable by:

* actor
* entity id
* prior state
* next state
* timestamp

---

# 14. Minimal Working Slice

This section defines the smallest coherent implementation that proves the architecture.

## 14.1 Goal of the Slice

Support one end-to-end workflow where:

* a client creates a task
* task items reference external data
* AI suggestions may be imported
* a human participant creates or edits first-pass outputs in first-pass runtime
* a reviewer approves or escalates
* a dispute may be resolved by arbitrator
* a canonical judgment is published
* an export package is generated

## 14.2 Included Capabilities

### Control

* organizations
* users
* organization membership
* role assignments
* projects
* tasks
* task items

### First-Pass Execution

* human-first mode
* AI-assisted mode
* integrated or native first-pass runtime
* AI candidate import adapter

### Governance

* review submission
* disagreement record creation
* dispute case creation
* arbitration decision submission
* canonical judgment publication

### Delivery

* export package creation
* export package generation for finalized task items

### Provenance

* task item state history
* review/dispute/arbitration lineage references

## 14.3 Excluded from Minimal Working Slice

* advanced reviewer scoring
* automated disagreement heuristics beyond simple explicit comparison rules
* label obfuscation
* multi-workspace support
* complex export customization
* full provenance event engine if lineage links suffice

## 14.4 Why This Slice Is Minimal but Valid

This slice proves all Canon-critical properties:

* human judgment is traceable
* disagreement is first-class
* AI and human remain distinct
* raw client data remains external
* final judgments are lineage-traceable

---

# 15. Implementation Roadmap Constraints (Non-Roadmap Commitments)

This section states architectural sequencing constraints, not delivery promises.

1. **Identity and tenant boundaries must exist before multi-user workflows**
2. **Task and task-item lifecycle must exist before first-pass runtime integration**
3. **First-pass source distinction must exist before AI-assisted mode is valid**
4. **Review/dispute/arbitration must exist before canonical judgment publication is trustworthy**
5. **Export must depend on canonical judgments, not raw first-pass outputs**

---

# 16. Open Design Questions

1. **How much of review UI should be separate from the first-pass runtime?**
   Assumption in this design: separate governance UI outside the first-pass runtime.

2. **Should first-pass output revisions create new rows or action-linked mutation history?**
   TBD.

3. **Should organization_id be denormalized on most operational tables for simpler authorization and querying?**
   TBD.

4. **Should provenance be represented primarily by lineage links, explicit provenance events, or both?**
   TBD.

5. **What is the precise fallback policy when AI-assisted tasks cannot obtain AI suggestions?**
   Assumption in this design: task may continue through human-first path if allowed by task policy.

---

# 17. Summary

This system should be implemented as a **workflow-owning, governance-first platform** with:

* a first-pass runtime for human annotation and judgement work
* a modular backend that owns task, review, dispute, and export logic
* a relational persistence model combining current state with append-preserving history
* explicit separation between raw client data and platform-owned judgment records.

The implementation should optimize for a **minimal working slice that proves governance integrity**, rather than prematurely optimizing for full marketplace scale or generic annotation-tool completeness.
