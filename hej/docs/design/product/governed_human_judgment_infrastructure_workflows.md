# Governed Human Judgment Infrastructure Workflows

Document: `governed_human_judgment_infrastructure_workflows.md`
Version: v1.1
Status: Draft
Derived from:

* `docs/governance/canon.md`
* `docs/governance/requirements.md`
* `docs/design/system/system_design.md`
* `docs/design/product/annotation_strategy.md`
* `docs/design/product/workflow_states.md`
* `docs/design/database/domain_model.md`

Purpose:

Describe the product workflows implied by the current Canon-driven system.

This document does not redefine Canon.
It translates Canon into:

* product processes
* user journeys
* system capabilities
* implementation-facing feature groups

---

# 1. System Identity

The Canon-defined system is a **governed human judgment infrastructure**.

It is not primarily a labor marketplace.
It is a workflow-owning platform that helps an organization:

* define annotation and judgment programs
* connect externally hosted data
* run AI-assisted or human-first first-pass work
* run judgment tasks that evaluate model outputs directly
* review and govern judgments
* detect disagreement
* resolve disputes
* record arbitration outcomes
* produce canonical decisions with provenance
* export validated outputs back to the client organization

The platform's core unit is the **TaskItem**, not the worker listing, not the payment record, and not the dataset blob.

The platform uses a consistent task naming hierarchy:

* `Task Class`
  `annotation` or `judgement`
* `Task Type`
  the concrete modality or use case inside that class
* `Execution Mode`
  `ai_assisted` or `human_first`

---

# 2. Core Actors

The Canon-oriented system centers on these actors:

* `Organization`
  The tenant boundary and data owner.
* `Task Owner / Manager`
  Configures projects, tasks, policies, and export expectations.
* `Annotator`
  Produces initial human annotations in human-first flows.
* `Judge`
  Produces first-pass verdicts in judgement flows.
* `Reviewer`
  Verifies AI suggestions or human outputs.
* `Dispute Participant`
  Engages in structured disagreement resolution.
* `Expert Arbitrator`
  Produces authoritative decisions for unresolved disputes.
* `System Administrator`
  Controls roles, permissions, tenant configuration, and governance rules.
* `AI System`
  Produces machine suggestions.
* `External Data Storage`
  Remains the source of truth for raw payloads.

One real user may hold multiple roles.
The system model should allow role composition without collapsing workflow authority.

---

# 3. Master Process Map

The Canon-driven end-to-end flow is:

```text
Identity and Organization Access
  ->
Organization / Project Setup
  ->
Task Definition and Policy Configuration
  ->
Dataset Pointer Registration
  ->
TaskItem Generation
  ->
First-Pass Entry
    -> AI-assisted
    -> Human-first
  ->
Review and Correction
  ->
Disagreement Detection
  ->
Dispute Case Handling
  ->
Expert Arbitration
  ->
Canonical Judgment
  ->
Provenance Inspection and Export
```

This is the main operating system for the product.

---

# 4. Workflow 1: Identity, Access, and Tenant Entry

## Goal

Ensure every action is attributable, permissioned, and organization-scoped.

## Actors

* User
* System Administrator
* Authentication Service

## User Journey

1. User authenticates.
2. System determines organization membership and role assignments.
3. User enters the correct tenant scope.
4. UI and APIs expose only permitted actions.

## Required Functional Capabilities

* login
* logout
* authenticated session or token verification
* organization membership lookup
* role assignment and role grant inspection
* route and API authorization checks
* attribution of actions to a real user identity

## Key Data Objects

* `User`
* `OrganizationUser`
* `RoleAssignment`
* `Session` or `AccessToken`

## Key Screens / Surfaces

* login screen
* organization switcher or tenant landing
* role-aware navigation
* admin role-management UI
* admin membership and tenant-policy UI

## Notes

Canon requires traceability and non-anonymous actions.
Identity is therefore not an accessory feature.
It is a structural prerequisite for the entire system.

---

# 5. Workflow 2: Organization and Project Setup

## Goal

Create the tenant-owned operating boundary for all downstream work.

## Actors

* Task Owner / Manager
* Admin

## User Journey

1. Authorized user creates or enters an organization.
2. User creates a project under that organization.
3. Project becomes the grouping container for related tasks.

## Required Functional Capabilities

* create organization
* list organizations
* create project
* update project metadata
* archive project
* organization-level membership and permission control

## Key Data Objects

* `Organization`
* `Project`
* `OrganizationPolicy` if needed later

## Key Screens / Surfaces

* organization overview
* project listing
* project detail

## Notes

In the Canon model, the organization is the data owner and trust boundary.
Projects are operational containers, not storefront listings.

---

# 6. Workflow 3: Task Definition and Policy Configuration

## Goal

Define one task with clear operational rules, whether it is an annotation task or a judgment task.

## Actors

* Task Owner / Manager
* Admin

## User Journey

1. Task owner creates a task under a project.
2. Task owner selects the task class:
   `annotation` or `judgement`.
3. Task owner selects the concrete task type.
4. Task owner connects source data through upload, storage path, or future cloud integration.
5. Task owner chooses whether the task starts with AI-assisted or human-first execution.
6. Task owner defines shared annotation rules or judgment instructions and output expectations.
7. Task owner adds workflow and advanced launch options as needed.
8. Task stays in `DRAFT` until configuration is complete.
9. Task is activated when operationally ready.

## Required Functional Capabilities

* create task
* update task metadata
* define task class:
  `annotation` or `judgement`
* define task type such as `text_annotation`, `image_annotation`, `audio_annotation`, `video_annotation`, `llm_answer_evaluation`, or `claim_support_judgement`
* connect source data through storage-backed links or mocked external sources
* assign execution mode:
  `ai_assisted` or `human_first`
* define or attach output format or decision schema
* define shared annotation rules or judgment instructions
* define review / escalation / export workflow rules
* activate / pause / complete / archive task

## Key Data Objects

* `Task`
* `Schema`
* `ReviewPolicy`
* `TaskStateHistory`

## Key Screens / Surfaces

* task creation form
* task configuration page
* task setup and launch page
* task policy summary
* task status controls

## Notes

This is not merely "create a labeling job".
It is defining and launching a task whose primary work may be annotation or judgement, and whose outputs will later be governed through review, dispute, provenance, and export.

## 6.1 Annotation Task Path

The annotation task path is:

```text
Create task
  ->
Choose annotation task type
  ->
Connect source data
  ->
Choose ai_assisted or human_first
  ->
Write shared annotation rules
  ->
Define output format and workflow rules
  ->
Launch
  ->
Run annotation
  ->
Review / dispute later
```

Typical task types include:

* `text_annotation`
* `image_annotation`
* `audio_annotation`
* `video_annotation`

## 6.2 Judgement Task Path

The judgement task path is:

```text
Create task
  ->
Choose judgement task type
  ->
Connect source data or answer/output source
  ->
Choose ai_assisted or human_first
  ->
Write shared judgement instructions
  ->
Define decision schema and workflow rules
  ->
Launch
  ->
Run structured judgement on task items
  ->
Review / dispute later
```

Typical task types include:

* `llm_answer_evaluation`
* `claim_support_judgement`
* `policy_decision_judgement`
* `reasoning_quality_judgement`

Judgement tasks should be understood as primary execution tasks.
They are not merely review screens for annotation output.

---

# 7. Workflow 4: External Data Connection and TaskItem Generation

## Goal

Connect externally owned data to platform workflow without transferring raw ownership.

## Actors

* Task Owner / Manager
* Platform Backend
* External Data Access Gateway

## User Journey

1. Task owner registers dataset pointers or external storage locations.
2. System validates pointer metadata and access policy.
3. System generates TaskItems.
4. Raw data remains outside canonical platform storage.
5. TaskItems become visible in task item views.
6. Human-first tasks can open those items directly into annotation or judgement work.
7. AI-assisted tasks can use those items as the basis for background candidate generation.

## Required Functional Capabilities

* dataset pointer registration
* pointer validation
* pointer access policy storage
* controlled runtime retrieval
* task item generation from pointer sets
* payload preview generation if permitted
* no canonical raw-data persistence by default

## Key Data Objects

* `DataPointer`
* `TaskItem`
* `TaskItemStateHistory`

## Key Screens / Surfaces

* dataset registration form
* task items desk
* task item list
* pointer inspection panel

## Notes

This is one of the strongest differentiators of the Canon system.
The platform owns workflow state and provenance, not the raw dataset.

---

# 8. Workflow 5A: AI-Assisted First-Pass Entry

## Goal

Begin first-pass work with machine suggestions, then pass into human governance.

## Actors

* AI System
* Annotator, Judge, or Reviewer
* Platform Backend

## User Journey

1. AI system generates candidate outputs for TaskItems.
2. Platform imports these as machine-attributed suggestions.
3. Human participant opens TaskItem in the task-level desk or work surface.
4. Human participant sees AI output and confidence separately from human action.
5. Human participant accepts, edits, rejects, or supersedes the candidate.

## Required Functional Capabilities

* AI import adapter
* model/source attribution
* confidence score storage
* candidate output display
* explicit distinction between AI output and human judgment
* first-pass or review action capture

## Key Data Objects

* `Annotation` or `JudgementOutput`
* `MachineCandidateSource`
* `Confidence`
* `OutputAction`

## Key Screens / Surfaces

* AI import console
* task desk
* annotate / judge desk
* candidate output tab

## Notes

This is not an auto-labeling pipeline that silently writes final truth.
AI output is only a candidate signal.

---

# 9. Workflow 5B: Human-First Annotation Entry

## Goal

Begin annotation with a human annotator when AI is insufficient or undesirable.

## Actors

* Annotator
* Reviewer
* Platform Backend
* Annotation Runtime

## User Journey

1. TaskItem is assigned for human-first annotation.
2. Annotator opens the annotation runtime.
3. Annotator creates labels directly.
4. System records annotation and history.
5. Output moves into review / QA / governance.

## Required Functional Capabilities

* assignment of annotation work
* annotation runtime rendering
* label schema presentation
* annotation submission receiver
* annotation version history
* handoff into review

## Key Data Objects

* `Annotation`
* `AnnotationAction`
* `Assignment`

## Key Screens / Surfaces

* workspace launch surface
* annotation work surface
* annotation submission state

## Notes

Human-first is not a different platform.
It is a different entry path into the same governance system.

---

# 10. Workflow 6: Review and Correction

## Goal

Transform candidate outputs into governed judgments through human evaluation.

## Actors

* Reviewer
* Annotator in some cases
* Platform Backend

## User Journey

1. Reviewer opens a TaskItem.
2. Reviewer inspects the source context, candidate label, and task policy.
3. Reviewer accepts, modifies, or rejects the candidate output.
4. System records the action with attribution and timestamp.
5. TaskItem progresses to `FINALIZED`, `DISPUTED`, or another governed state.

## Required Functional Capabilities

* task-item filtering
* item selection
* output inspection
* review decision capture
* reviewer attribution
* revision history
* explicit state transition tracking

## Key Data Objects

* `Review`
* `ReviewDecision`
* `TaskItemStateHistory`
* `ProvenanceEvent`

## Key Screens / Surfaces

* review console
* review desk
* item history
* evidence tabs

## Notes

Review is where the platform begins exercising governance over first-pass output.

---

# 11. Workflow 7: Disagreement Detection

## Goal

Preserve ambiguity and surface conflicts for governed handling.

## Actors

* Platform Backend
* Reviewer
* Quality / Governance Operator

## User Journey

1. System compares judgments:
   AI vs human, or human vs human.
2. System marks disagreement when conditions are met.
3. Disagreement is stored, not deleted.
4. TaskItem may continue, route to dispute, or await further handling.

## Required Functional Capabilities

* disagreement detection logic
* threshold or policy-based disagreement rules
* explicit disagreement record
* disagreement-aware state transition
* disagreement visibility in UI

## Key Data Objects

* `DisagreementRecord`
* `TaskItemState`
* `ReviewPolicy`

## Key Screens / Surfaces

* disagreement indicators in task items
* review detail comparison view
* governance dashboard for unresolved conflicts

## Notes

Canon is explicit: disagreement is first-class.
The platform must not flatten it away prematurely.

---

# 12. Workflow 8: Dispute Case Handling

## Goal

Move unresolved disagreements into a structured case workflow.

## Actors

* Reviewer
* Dispute Participant
* Governance Operator

## User Journey

1. A disagreement is escalated into a dispute case.
2. The dispute references the conflicting outputs or judgments.
3. Participants are assigned.
4. Participants inspect evidence and prior actions.
5. The case is discussed or evaluated within a structured process.
6. The case is resolved directly or escalated to arbitration.

## Required Functional Capabilities

* create dispute case
* link dispute to conflicting outputs or judgments
* assign dispute participants
* track dispute state
* preserve all prior review records
* route to arbitration when unresolved

## Key Data Objects

* `DisputeCase`
* `DisputeParticipant`
* `DisputeStateHistory`

## Key Screens / Surfaces

* dispute case list
* dispute detail view
* evidence comparison panel
* participant assignment UI

## Notes

Dispute is not a side feature.
In Canon it is a core part of the pipeline.

---

# 13. Workflow 9: Expert Arbitration

## Goal

Produce an authoritative outcome when dispute handling cannot resolve the issue.

## Actors

* Expert Arbitrator
* Governance Operator

## User Journey

1. Unresolved dispute enters arbitration.
2. Arbitrator receives the full context:
   task item, candidate outputs, review history, disagreement records, dispute history.
3. Arbitrator issues a final decision.
4. System records that decision immutably.
5. Dispute is closed, but prior disagreement remains in history.

## Required Functional Capabilities

* arbitration intake
* arbitrator-only access control
* dispute context aggregation
* arbitration decision recording
* immutable or append-preserving arbitration history
* transition into canonical judgment

## Key Data Objects

* `ArbitrationDecision`
* `ArbitrationAssignment`
* `DisputeCase`
* `CanonicalJudgmentCandidate`

## Key Screens / Surfaces

* arbitration intake
* arbitration decision console
* arbitration summary view

## Notes

Arbitration is the mechanism that turns unresolved ambiguity into authoritative output.

---

# 14. Workflow 10: Canonical Judgment and Provenance

## Goal

Publish the final authoritative decision while preserving how it was produced.

## Actors

* Platform Backend
* Task Owner
* Auditor / Reviewer

## User Journey

1. Governance conditions for finalization are satisfied.
2. System creates a canonical judgment for the TaskItem.
3. Provenance chain remains navigable:
   annotation -> review -> disagreement -> dispute -> arbitration -> final outcome.
4. Authorized users inspect the history.

## Required Functional Capabilities

* canonical judgment generation
* provenance graph or history chain
* immutable or append-preserving event history
* audit retrieval
* participant and arbitrator attribution

## Key Data Objects

* `CanonicalJudgment`
* `ProvenanceRecord`
* `JudgmentLineage`

## Key Screens / Surfaces

* final judgment view
* provenance viewer
* audit inspection page

## Notes

This is the product's core differentiator.
The output is not just a label.
It is a governed, attributable decision record.

---

# 15. Workflow 11: Export and Delivery

## Goal

Return validated outputs to the client organization in structured form.

## Actors

* Task Owner
* Organization
* Platform Backend

## User Journey

1. Task or project reaches exportable completion state.
2. System assembles an export package.
3. Export includes canonical judgments and provenance according to policy.
4. Client retrieves or receives the package.

## Required Functional Capabilities

* export package creation
* export package membership
* export state tracking
* structured export formats
* provenance inclusion options
* organization-scoped delivery

## Key Data Objects

* `ExportPackage`
* `ExportPackageItem`
* `ExportStateHistory`

## Key Screens / Surfaces

* export builder
* export package list
* export status detail

## Notes

Without export, the platform is incomplete as client infrastructure.

---

# 16. Functional Capability Map by Product Area

The Canon system naturally groups into these product modules:

* `Identity and Access`
  login, auth, membership, roles
* `Tenant and Project Management`
  organization, project, policy context
* `Task Definition`
  task config, output format, labeling rules, workflow rules, state machine
* `Data Access`
  dataset pointers, secure retrieval, payload boundary
* `First-Pass Runtime Integration`
  human annotation runtime and later adapters
* `AI Integration`
  prediction import, machine source identity, confidence
* `Review Operations`
  governance after first-pass output exists
* `Disagreement and Disputes`
  disagreement records, dispute creation, participant routing
* `Arbitration`
  expert intake, decision issuance
* `Judgment and Provenance`
  canonical records, lineage, audit
* `Export`
  package generation and delivery

---

# 17. What This Model Explicitly Does Not Center

The Canon-oriented workflow does not center:

* open public task listings
* labor-market discovery
* commission checkout
* worker bidding
* chat-first negotiation between poster and worker
* gig-style acceptance loops

That does not mean those ideas are impossible later.
It means they are not the core operating model of the current system.

---

# 18. Compatibility Guidance for Future Marketplace Evolution

The most important compatibility insight is:

**the Canon system already defines the core execution engine.**

A later marketplace can be layered on top if it treats the existing system as the operational backbone.

Stable core concepts worth preserving:

* `Organization`
* `User`
* `RoleAssignment`
* `Project`
* `Task`
* `TaskItem`
* `Assignment`
* `Annotation`
* `Review`
* `Disagreement`
* `DisputeCase`
* `ArbitrationDecision`
* `CanonicalJudgment`
* `ExportPackage`
* `DataPointer`

Marketplace-specific capabilities can be added around this core without destroying it:

* worker profiling
* public or semi-public task discovery
* application and acceptance flows
* reputation systems
* pricing and payments
* creator / worker negotiation

In other words:

* Canon flow = execution and governance engine
* Marketplace flow = acquisition, matching, and economic layer

That split is compatible and strategically strong.
