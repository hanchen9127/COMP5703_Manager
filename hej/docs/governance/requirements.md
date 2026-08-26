# Requirements Document

Version: v1.2
Status: Authoritative
Last Updated: 2026-03-20

Governance:

* Governed by **Project Canon v1.0**
* In case of conflict, **Canon takes precedence over Requirements**

---

# 1. Purpose and Scope

## Purpose

This system must provide a **governed human judgment pipeline** integrated with AI annotation workflows, enabling organizations to:

* incorporate human review into AI-generated outputs
* detect and manage disagreements between reviewers
* perform structured dispute resolution
* record traceable decision provenance

The system must treat human judgment as **structured decision infrastructure**, not as unstructured annotation labor.

The current product mode is the **governed human judgment infrastructure** described by Canon. The architecture must, however, preserve a **shared core** that can later support an additional marketplace-style operating model without rewriting execution, governance, or provenance logic.

---

## Scope

The system must support:

* authenticated users operating within organization scope
* organization and project management
* task definition and task-item orchestration
* task setup, task items, annotation or judgment execution, review, history, dispute, arbitration, and export workflows
* external data pointers instead of platform-owned raw dataset hosting
* AI-generated candidate annotations
* AI-generated answers or judgment candidates
* human review of AI outputs
* detection of disagreement between reviewers
* dispute workflows
* expert arbitration
* traceable decision provenance

---

## Out of Scope

The system shall **not** provide in the current product mode:

* mass crowdsourcing marketplace
* gig economy labor distribution
* dataset hosting marketplace
* simple annotation-only workflow
* untraceable anonymous labeling

These exclusions derive directly from the Canon-defined operating model. Future extension layers may introduce marketplace concerns, but such concerns must remain outside the shared execution and governance core.

---

# 2. Stakeholders and Actors

The following actors are implied by the Canon.

| Actor                | Description                                       |
| -------------------- | ------------------------------------------------- |
| Organization         | entity providing data and defining tasks          |
| Task Owner / Manager | actor defining and managing governed work         |
| Annotator / Judge    | human participant performing first-pass work      |
| Reviewer             | human participant evaluating first-pass outputs   |
| Dispute Participant  | reviewer participating in disagreement resolution |
| Expert Arbitrator    | domain expert resolving disputes                  |
| System Administrator | entity managing governance rules                  |

Additional roles remain **TBD**.

---

# 3. Requirement Structure

This document currently uses a two-level requirement structure:

* `RQ-001` to `RQ-017`
  foundational summary requirements that capture the governing system intent
* `RQ-101+`
  operational requirement families that break the same system into delivery-facing domains

Interpretation:

* the `RQ-001..017` layer is the compact governing summary
* the `RQ-100+` layer is the more implementation-facing requirement catalog
* when the two layers differ in wording, the more specific `RQ-100+` requirement should be treated as a refinement of the higher-level summary rather than as a contradiction

This structure is deliberate for now because the project needs both:

* a compact Canon-aligned summary layer
* a more decomposed set of requirement families for planning and implementation

---

# 4. Foundational Requirements Index

| RQ ID  | Summary                                                       |
| ------ | ------------------------------------------------------------- |
| RQ-001 | System shall support AI-generated annotation suggestions      |
| RQ-002 | System shall allow human review of AI suggestions             |
| RQ-003 | System shall allow human first-pass outputs independent of AI suggestions |
| RQ-004 | System shall detect disagreement between judgments            |
| RQ-005 | System shall create dispute cases from disagreements          |
| RQ-006 | System shall support expert arbitration                       |
| RQ-007 | System shall record decision provenance                       |
| RQ-008 | System shall attribute judgments to reviewers                 |
| RQ-009 | System shall support role separation between participants     |
| RQ-010 | System shall preserve disagreement signals                    |
| RQ-011 | System shall maintain data ownership external to the platform |
| RQ-012 | System shall allow organizations to define tasks              |
| RQ-013 | System shall record revision history of judgments             |
| RQ-014 | System shall support structured decision outcomes             |
| RQ-015 | System shall support traceable audit of decisions             |
| RQ-016 | System shall preserve a shared core independent of marketplace extensions |
| RQ-017 | System shall keep execution and governance workflows valid across multiple operating models |

---

# 5. Foundational Summary Requirements

---

## RQ-001

requirement_ref:
doc://requirements/human-ai-judgment@v1.0#RQ-001

statement:
The system shall support the ingestion and presentation of AI-generated annotation suggestions or answer candidates for human work.

rationale:
Canon defines AI suggestion as the first stage of the judgment pipeline.

acceptance:

* AI-generated annotations can be associated with a task item
* reviewers can view AI-generated suggestions
* suggestions are distinguishable from human judgments
* the same model applies whether the suggestion is a label candidate or an answer candidate

canon_refs:

* Canon §2.2
* Canon §3.3

priority:
P0

notes:
TBD: supported annotation types.

---

## RQ-002

requirement_ref:
doc://requirements/human-ai-judgment@v1.0#RQ-002

statement:
The system shall allow downstream human review of AI-generated annotation suggestions or answer candidates.

acceptance:

* downstream reviewer can accept an AI suggestion
* downstream reviewer can modify an AI suggestion
* downstream reviewer can reject an AI suggestion

canon_refs:

* Canon §2.2
* Canon §5.3

priority:
P0

notes:
None.

---

## RQ-003

requirement_ref:
doc://requirements/human-ai-judgment@v1.0#RQ-003

statement:
The system shall allow human participants to produce independent first-pass outputs separate from AI suggestions.

acceptance:

* first-pass human output is recorded as human-generated output
* human-generated output is distinguishable from AI suggestions
* human-first output may exist without prior AI suggestion

canon_refs:

* Canon §3.3
* Canon §5.3

priority:
P0

---

## RQ-004

requirement_ref:
doc://requirements/human-ai-judgment@v1.0#RQ-004

statement:
The system shall detect disagreements between outputs generated by different human participants or between AI and human participants where the workflow requires comparison.

acceptance:

* conflicting judgments can be identified
* disagreement state is recorded
* disagreement can trigger further workflow

canon_refs:

* Canon §3.2
* Canon §5.4

priority:
P0

notes:
TBD: disagreement detection logic.

---

## RQ-005

requirement_ref:
doc://requirements/human-ai-judgment@v1.0#RQ-005

statement:
The system shall allow disagreements to be escalated into structured dispute cases.

acceptance:

* dispute cases can be created
* dispute case references conflicting judgments
* dispute cases can be assigned participants

canon_refs:

* Canon §5.4

priority:
P0

---

## RQ-006

requirement_ref:
doc://requirements/human-ai-judgment@v1.0#RQ-006

statement:
The system shall allow expert arbitrators to resolve dispute cases.

acceptance:

* arbitrator can view dispute context
* arbitrator can produce final judgment
* arbitration outcome is recorded

canon_refs:

* Canon §5.5

priority:
P0

notes:
TBD: expert qualification mechanism.

---

## RQ-007

requirement_ref:
doc://requirements/human-ai-judgment@v1.0#RQ-007

statement:
The system shall record the provenance of decisions across all stages of the judgment pipeline.

acceptance:

* system records sequence of judgments
* system records actors involved
* system records timestamps

canon_refs:

* Canon §3.1
* Canon §5.6

priority:
P0

---

## RQ-008

requirement_ref:
doc://requirements/human-ai-judgment@v1.0#RQ-008

statement:
The system shall attribute each human judgment or review action to an identifiable participant.

acceptance:

* judgments or review actions contain actor identifier
* anonymous human decisions are not permitted
* participant identity is traceable within the system

canon_refs:

* Canon §3.1

priority:
P0

---

## RQ-009

requirement_ref:
doc://requirements/human-ai-judgment@v1.0#RQ-009

statement:
The system shall support role separation between reviewers, dispute participants, and arbitrators.

acceptance:

* role types are defined
* users can be assigned roles
* role permissions differ

canon_refs:

* Canon §3.5

priority:
P0

notes:
Exact role taxonomy TBD.

---

## RQ-010

requirement_ref:
doc://requirements/human-ai-judgment@v1.0#RQ-010

statement:
The system shall preserve disagreement information instead of collapsing disagreements into majority votes.

acceptance:

* conflicting judgments remain stored
* disagreement records remain accessible
* final arbitration does not delete prior judgments

canon_refs:

* Canon §3.2

priority:
P1

---

## RQ-011

requirement_ref:
doc://requirements/human-ai-judgment@v1.0#RQ-011

statement:
The system shall treat organizations as the authoritative owners of task data.

acceptance:

* organization ownership of tasks is recorded
* system does not claim ownership of task data
* data access is controlled by the organization

canon_refs:

* Canon §3.6

priority:
P0

notes:
Data storage model TBD.

---

## RQ-012

requirement_ref:
doc://requirements/human-ai-judgment@v1.0#RQ-012

statement:
The system shall allow organizations to define annotation tasks and judgment tasks.

acceptance:

* tasks can be created
* tasks define the question to be evaluated
* tasks reference associated data items

canon_refs:

* Canon §5.1

priority:
P0

---

## RQ-013

requirement_ref:
doc://requirements/human-ai-judgment@v1.0#RQ-013

statement:
The system shall maintain revision history for judgments.

acceptance:

* prior versions of judgments remain accessible
* revisions are timestamped
* reviewer attribution is preserved

canon_refs:

* Canon §3.1
* Canon §5.6

priority:
P1

---

## RQ-014

requirement_ref:
doc://requirements/human-ai-judgment@v1.0#RQ-014

statement:
The system shall produce structured decision outcomes after arbitration.

acceptance:

* arbitration produces canonical judgment
* canonical judgment references underlying task
* canonical judgment remains traceable to prior stages

canon_refs:

* Canon §2.2
* Canon §5.6

priority:
P0

---

## RQ-015

requirement_ref:
doc://requirements/human-ai-judgment@v1.0#RQ-015

statement:
The system shall support auditability of decision pipelines.

acceptance:

* system can reconstruct judgment pipeline
* system exposes sequence of review stages
* system exposes arbitration decisions

canon_refs:

* Canon §3.1
* Canon §5.6

priority:
P1

---

# 6. Shared-Core and Operating-Model Requirements

Derived from Canon principles.

---

## RQ-016

requirement_ref:
doc://requirements/human-ai-judgment@v1.1#RQ-016

statement:
The system shall preserve a shared execution and governance core independent of future marketplace extensions.

acceptance:

* core workflow entities remain valid without profile, listing, payment, or marketplace records
* task, task item, review, dispute, arbitration, provenance, and export remain part of the shared core
* future product extensions consume the shared core rather than redefining it

canon_refs:

* Canon §2.2
* Canon §3.2
* Canon §5.6

priority:
P0

---

## RQ-017

requirement_ref:
doc://requirements/human-ai-judgment@v1.1#RQ-017

statement:
The system shall keep execution and governance workflows valid across multiple operating models.

acceptance:

* organization-to-project-to-task workflow remains valid in the core operating model
* future discovery, listing, matching, or commercial layers do not replace task execution semantics
* project and task scoped workflows remain authoritative for review, dispute, arbitration, and export

canon_refs:

* Canon §5.1
* Canon §5.4
* Canon §5.5
* Canon §5.6

priority:
P1

---

# 7. Architectural Alignment

The following alignment rules constrain all downstream design documents:

## Shared Core

The following concepts belong to the durable shared core:

* identity and access
* organization membership and tenant isolation
* projects
* tasks and task items
* external data pointers
* task class, task type, and execution mode selection
* review, disagreement, dispute, and arbitration
* canonical judgment, provenance, and export

## Extension Layer

The following concepts may exist later as product extensions, but must not become prerequisites for the shared core:

* public or semi-public listings
* marketplace matching and applications
* trust scores, badges, and certification ladders
* payments, billing, payout, and commission logic
* direct messaging and labor-market interaction

The implementation consequence is simple: **listing is not execution, and payment is not execution**. Execution and governance remain defined by the shared core.

# 8. Constraints and Prohibitions

Derived from Canon.

The system shall **not**:

* operate as anonymous crowdsourcing
* remove disagreement records
* collapse human judgments into opaque aggregated outputs
* claim ownership of organization data

---

# 9. Canon Coverage

## 9.1 Foundational Summary Coverage

| Canon Section | Covered By                     |
| ------------- | ------------------------------ |
| Canon §2.2    | RQ-001, RQ-002, RQ-014         |
| Canon §3.1    | RQ-007, RQ-008, RQ-013, RQ-015 |
| Canon §3.2    | RQ-004, RQ-010                 |
| Canon §3.3    | RQ-001, RQ-003                 |
| Canon §3.5    | RQ-009                         |
| Canon §3.6    | RQ-011                         |
| Canon §5.1    | RQ-012                         |
| Canon §5.4    | RQ-005                         |
| Canon §5.5    | RQ-006                         |
| Canon §5.6    | RQ-007, RQ-014                 |

## 9.2 Operational Requirement Family Coverage

| Canon Section | Covered By |
| ------------- | ---------- |
| Canon §2.2 | RQ-301, RQ-701, RQ-801, RQ-802 |
| Canon §2.3 | RQ-206, RQ-304 |
| Canon §2.4 | RQ-205 |
| Canon §2.5 | RQ-205, RQ-304 |
| Canon §3.1 | RQ-101, RQ-102, RQ-501 |
| Canon §3.2 | RQ-401, RQ-702 |
| Canon §3.3 | RQ-303, RQ-607, RQ-608 |
| Canon §3.5 | RQ-103 |
| Canon §3.6 | RQ-202, RQ-601, RQ-602, RQ-603, RQ-604, RQ-605, RQ-606, RQ-1101 |
| Canon §5 | RQ-1201 |
| Canon §5.1 | RQ-151, RQ-153, RQ-154, RQ-201, RQ-203, RQ-206, RQ-207, RQ-208, RQ-901 |
| Canon §5.3 | RQ-204, RQ-302 |
| Canon §5.4 | RQ-152, RQ-153, RQ-402 |
| Canon §5.5 | RQ-403 |
| Canon §5.6 | RQ-153, RQ-155, RQ-207, RQ-208, RQ-501, RQ-1001 |

Interpretation:

* the foundational table preserves the compact Canon-to-core-summary trace
* the operational table shows which delivery-facing requirement families refine that Canon coverage
* not every operational requirement maps to a unique Canon clause; some requirements are implementation-facing refinements of the same Canon principle

---

# 10. PR Coverage Alignment

The current PR inventory under `docs/implementation/prs/` is expected to be covered by this requirements document at the **requirement family** level rather than by a strict one-PR-to-one-requirement mapping.

Coverage interpretation:

* `global/`
  covered primarily by `RQ-155`
* `project-portfolio/`
  covered primarily by `RQ-151`, `RQ-152`, and `RQ-154`
* `project-workspace/`
  covered primarily by `RQ-153`
* `task-workspace/`
  covered primarily by `RQ-201` to `RQ-208`
* `task-item/`
  covered primarily by `RQ-301` to `RQ-608`, plus `RQ-701+` where DS evidence or evaluation is involved

Important note:

* PRs define mergeable delivery slices
* requirements define system obligations
* a single requirement may justify multiple PRs
* a single PR may satisfy parts of multiple requirements

At the current document state, the major PR families are now covered at least once, including:

* project creation, governance model, lifecycle, and portfolio
* project overview, tasks, disputes, exports, and policies
* task creation, setup, schema binding, policy binding, items, runtime queue, overview, and history
* task-item details, annotate, judge, review, disagreement detection, dispute, and candidate payload integration
* DS dataset alignment, runtime validation, metrics, and evidence extensions

---

# 11. Assumptions

The following assumptions were made during requirement extraction:

* AI-assisted execution may exist prior to downstream review, but human-first execution must also remain valid.
* Human participants operate under identifiable accounts.
* Organizations control task data ownership.

These assumptions may change pending future design decisions.

---

# 12. Open Questions

1. How reviewer expertise and trust should be modeled.
2. Whether label semantics may be hidden to reduce bias.
3. What mechanisms govern dispute participation.
4. Whether multiple arbitration outcomes may coexist.
5. What economic structure supports participation.

---

# 13. Explicit Exclusions

The following ideas appeared in conversation but are **excluded by Canon**:

* gig worker crowdsourcing platform
* simple data labeling service
* dataset marketplace
* low-cost annotation labor market


---

# 14. Operational Requirement Families

The remaining sections formalize the more implementation-facing requirement families.

These sections refine the summary requirements above and should be used for:

* planning
* design decomposition
* milestone definition
* PR boundary discussion

---

# 14.1 Identity & Access Requirements

### RQ-101 — User Registration

requirement_ref:
doc://requirements/identity@v1.0#RQ-101

statement:
The system shall allow users to create accounts to participate in the platform.

acceptance:

* a user can register an account
* account identity is persisted
* duplicate identity prevention exists

canon_refs:

* Canon §3.1

priority:
P0

---

### RQ-102 — User Authentication

statement:
The system shall authenticate users before allowing access to platform functionality.

acceptance:

* login mechanism exists
* authenticated sessions are required
* unauthorized access is prevented

canon_refs:

* Canon §3.1

priority:
P0

---

### RQ-103 — Role Assignment

statement:
The system shall support assignment of roles to users.

acceptance:

* user roles exist
* roles determine permissions
* roles can be changed by administrators

canon_refs:

* Canon §3.5

priority:
P0

notes:

Possible roles:

* task_owner
* annotator
* judge
* reviewer
* arbitrator
* admin

Exact model TBD.

---

# 14.2 Project Portfolio and Workspace Requirements

### RQ-151 — Project Creation and Lifecycle

statement:

The system shall allow organizations to create projects and track project lifecycle state independently from task-level workflow state.

acceptance:

* projects can be created within organization scope
* projects expose a project-level lifecycle state
* project lifecycle remains distinct from task lifecycle and task-item state

canon_refs:

* Canon §5.1

priority:
P0

---

### RQ-152 — Project Governance Posture

statement:

The system shall allow a project to carry project-level governance posture without replacing task-specific workflow rules.

acceptance:

* project may define governance model or governance posture metadata
* project-level governance posture remains visible in portfolio and workspace surfaces
* task-level review, dispute, or schema rules remain task-owned rather than absorbed into project metadata

canon_refs:

* Canon §5.1
* Canon §5.4

priority:
P1

---

### RQ-153 — Project Workspace Surface

statement:

The system shall provide a project-scoped workspace that organizes overview, tasks, disputes, exports, and policies as project-level surfaces.

acceptance:

* project workspace exposes overview, tasks, disputes, exports, and policies surfaces
* project-level disputes remain distinct from task-level desks
* project-level exports and policies remain visible without erasing originating task or task-item lineage

canon_refs:

* Canon §5.1
* Canon §5.4
* Canon §5.6

priority:
P0

---

### RQ-154 — Projects Portfolio Visibility

statement:

The system shall provide a projects portfolio surface that supports project scanning, project creation entry, and portfolio-level project state visibility.

acceptance:

* users can list projects available in organization scope
* users can enter project creation from the portfolio surface
* portfolio can display project-level state such as lifecycle or governance posture

canon_refs:

* Canon §5.1

priority:
P1

---

### RQ-155 — Dashboard Operational Visibility

statement:

The system shall provide a top-level dashboard or landing surface that aggregates real platform state rather than acting as a decorative homepage.

acceptance:

* dashboard links into real organization, project, task, or governance surfaces
* dashboard summarizes actual workflow objects or operational counts where available
* dashboard does not invent a separate workflow authority model outside the shared core

canon_refs:

* Canon §5.1
* Canon §5.6

priority:
P1

---

# 14.3 Task Lifecycle Requirements

### RQ-201 — Task Creation

statement:

The system shall allow organizations to create annotation tasks and judgment tasks.

acceptance:

* tasks can be created
* tasks contain description
* tasks reference data items
* tasks declare whether they are annotation tasks or judgment tasks

canon_refs:

* Canon §5.1

priority:
P0

---

### RQ-202 — Task Dataset Association

statement:

The system shall allow tasks to reference external data items for evaluation.

acceptance:

* tasks link to data items
* data ownership remains external
* task items can be enumerated

canon_refs:

* Canon §3.6

priority:
P0

---

### RQ-203 — Task Profiling

statement:

The system shall allow tasks to define annotation or judgment parameters.

acceptance:

* task includes work objective or judgment question
* task includes task class
* task includes task type
* task includes execution mode
* task includes allowed label space or decision schema
* task includes review policy or dispute policy references where required

canon_refs:

* Canon §5.1

priority:
P1

notes:

Review policy examples TBD.

---

### RQ-204 — Task Assignment

statement:

The system shall support assignment or routing of task items to the appropriate human participants.

acceptance:

* task-item work can be allocated or routed
* assigned actor receives the relevant task items
* assignment or routing history is recorded

canon_refs:

* Canon §5.3

priority:
P0

---

### RQ-205 — Task Execution Mode

statement:

The system shall allow a task to specify whether execution begins through AI-generated suggestions or through a human-first path.

acceptance:

* task execution mode may be set to `ai_assisted` or `human_first`
* human-first execution is supported without requiring prior AI suggestions
* AI-assisted execution remains reviewable rather than canonical by default

canon_refs:

* Canon §2.4
* Canon §2.5

priority:
P0

---

### RQ-206 — Judgment Task Support

statement:

The system shall support judgment tasks that evaluate AI-generated answers, candidate outputs, or context-answer pairs.

acceptance:

* task class may be set to `judgement`
* task type may be set to a judgement-oriented type such as `llm_answer_evaluation`
* judgment tasks can define decision schema or verdict options
* judgment tasks can collect rationale or justification
* judgment tasks can enter the same downstream review, dispute, and provenance flows as annotation tasks

canon_refs:

* Canon §2.3
* Canon §5.1

priority:
P0

---

### RQ-207 — Workspace Surface Boundary

statement:

The system shall preserve the distinction between task-level workspace authority surfaces and task-item-level operation targets.

acceptance:

* `Task` remains the authority surface for setup, items, queue or runtime monitoring, and history
* `TaskItem` remains the operation target for annotate, judge, review, and dispute handling
* task-level desk pages do not erase item-level provenance or action boundaries

canon_refs:

* Canon §5.1
* Canon §5.6

priority:
P0

---

### RQ-208 — Queue Semantic Boundary

statement:

The system shall reserve `queue` semantics for runtime monitoring or AI-assisted processing posture, not as a synonym for the task-item index.

acceptance:

* task items remain accessible through an `items`-oriented surface
* queue views, if present, represent runtime or throughput monitoring rather than the neutral item list
* documentation and UI terminology do not use `queue` and `items` interchangeably

canon_refs:

* Canon §5.1
* Canon §5.6

priority:
P1

---

# 14.4 Annotation Pipeline Requirements

### RQ-301 — AI Pre-Annotation

statement:

The system shall support AI-generated candidate annotations before human review.

acceptance:

* AI annotations can be attached to tasks
* AI annotations appear as suggestions
* AI annotations remain distinguishable from human labels

canon_refs:

* Canon §2.2

priority:
P0

---

### RQ-302 — Human Annotation / Review

statement:

The system shall allow downstream human reviewers to evaluate and modify AI-generated candidate outputs.

acceptance:

* reviewer can accept suggestion
* reviewer can modify suggestion
* reviewer can reject suggestion
* review action remains distinct from first-pass annotation or judgement creation

canon_refs:

* Canon §5.3

priority:
P0

---

### RQ-303 — Human Independent Annotation

statement:

The system shall allow human participants to create independent first-pass annotations without requiring prior AI suggestions.

acceptance:

* annotator can generate annotation without AI suggestion
* human-first annotation is recorded as human-generated output
* annotation provenance preserved

canon_refs:

* Canon §3.3

priority:
P0

---

### RQ-304 — Annotation Workspace Separation

statement:

The system shall provide a dedicated annotation or judgement work surface that remains distinct from review and dispute surfaces.

acceptance:

* first-pass work is performed in an annotation or judgement work surface
* review actions are not silently merged into annotation actions
* dispute actions remain downstream of review or disagreement posture

canon_refs:

* Canon §2.3
* Canon §2.5

priority:
P0

---

# 14.5 Review / Governance Requirements

### RQ-401 — Disagreement Detection

statement:

The system shall detect disagreements between judgments.

acceptance:

* conflicting labels detected
* disagreement flagged
* dispute case may be created

canon_refs:

* Canon §3.2

priority:
P0

---

### RQ-402 — Dispute Creation

statement:

The system shall allow disagreements to become dispute cases.

acceptance:

* dispute references conflicting judgments
* dispute participants assigned
* dispute state tracked

canon_refs:

* Canon §5.4

priority:
P0

---

### RQ-403 — Arbitration

statement:

The system shall allow expert arbitrators to produce final decisions.

acceptance:

* arbitrator can access dispute
* arbitrator decision recorded
* arbitration closes dispute

canon_refs:

* Canon §5.5

priority:
P0

---

# 14.6 Decision Governance Requirements

### RQ-501 — Decision Provenance

statement:

The system shall record the full judgment history for each task item.

acceptance:

* AI suggestion recorded
* human judgments recorded
* dispute decisions recorded

canon_refs:

* Canon §5.6

priority:
P0

---


## Requirement Family Summary
```
Identity Layer
RQ-100

Project Portfolio and Workspace
RQ-150

Task Lifecycle
RQ-200

Annotation Pipeline
RQ-300

Review & Dispute
RQ-400

Decision Governance
RQ-500
```

This produces the following formal system layering:

```
Users
 -> Tasks
 -> AI-assisted or human-first first-pass work
 -> Review
 -> Dispute
 -> Arbitration
 -> Decision record
```

Interpretation:

* user and role identity remain upstream
* task definition and task items remain the execution container
* first-pass work may begin from AI-assisted or human-first entry
* review, dispute, arbitration, and provenance remain downstream governance layers

---

# 14.7 Data Privacy & Sovereignty Requirements

## RQ-601 — Data Ownership Preservation

requirement_ref:
doc://requirements/privacy@v1.0#RQ-601

statement:
The system shall not assume ownership of client data used in annotation tasks.

rationale:
The platform is designed as a judgment orchestration system rather than a data hosting platform.

acceptance:

* client datasets remain owned by the client
* platform metadata references dataset location but does not claim ownership
* contractual ownership boundaries are preserved

canon_refs:

* Canon §3.6 (Data sovereignty principle)

priority:
P0

---

## RQ-602 — External Data Storage Requirement

statement:
The system shall support annotation workflows where the source data is stored outside the platform.

acceptance:

* tasks reference external storage locations
* the platform does not require uploading datasets to the platform
* external data endpoints can be used as task sources

canon_refs:

* Canon §3.6

priority:
P0

notes:

Typical storage examples may include cloud storage such as object stores.
Specific providers are implementation details.

---

## RQ-603 — Secure Data Access Pipeline

statement:
The system shall support a secure data access pipeline that retrieves task items from external storage during annotation.

acceptance:

* task items can be retrieved at runtime
* access authorization is enforced
* retrieval does not require permanent storage on the platform

canon_refs:

* Canon §3.6

priority:
P0

notes:

Temporary caching policies TBD.

---

## RQ-604 — No Persistent Storage of Client Data

statement:
The system shall not persist raw client data within platform storage unless explicitly configured by the client.

acceptance:

* platform storage does not contain client raw datasets
* annotation results may reference source identifiers rather than full data copies
* data retention policies are enforceable

canon_refs:

* Canon §3.6

priority:
P0

---

## RQ-605 — Minimal Data Retention

statement:
The system shall minimize retention of client data and store only metadata required for annotation governance.

acceptance:

* stored metadata includes task identifiers
* annotation records stored separately from raw data
* data retention configuration is possible

canon_refs:

* Canon §3.6

priority:
P1

---

## RQ-606 — Annotation Result Ownership

statement:
The system shall ensure that annotation outputs remain owned by the client organization that created the task.

acceptance:

* annotation outputs can be exported
* ownership attribution is recorded
* platform does not claim rights over outputs

canon_refs:

* Canon §3.6

priority:
P0

---

## RQ-607 — Annotator Data Isolation

statement:
The system shall ensure that annotators only access the minimal information required to complete the task.

acceptance:

* annotators cannot access full datasets
* annotators only see task items assigned to them
* sensitive metadata can be masked

canon_refs:

* Canon §3.3

priority:
P0

---

## RQ-608 — Tag Abstraction Option (anonymous tags)

statement:
The system shall support abstraction of label semantics when required by the task owner.

acceptance:

* task owners can define abstract label identifiers
* annotators may not see semantic meaning of labels
* label mapping remains internal to the task owner

canon_refs:

* Canon §3.3

priority:
P2

notes:

Use cases include sensitive classification tasks.

---

## Data Architecture Interpretation

```text
Client Data
     ↓
External Storage (S3 / internal DB / etc.)
     ↓
Secure Data Access Pipeline
     ↓
Annotation Task Interface
     ↓
Human / AI Judgement
     ↓
Decision Metadata (stored by platform)
```

The platform should store only:

```text
task_id
data_pointer
annotation
review
decision
provenance
```

instead of treating the platform as the default owner of:

```text
image
text
video
dataset
```

---

# 14.8 Judgment Evidence and Quality Extensions

The following requirements formalize extension ideas that emerged during requirement elaboration.

These are not casual notes.
They are legitimate secondary requirements with lower immediate delivery priority than the core workflow layers above.

Rationale:

* the platform is not only recording labels
* it is recording governed judgments
* in many task families, reasoning and evidence are nearly as important as the final verdict

### RQ-701 — Judgment Evidence

requirement_ref:
doc://requirements/judgement@v1.0#RQ-701

statement:
The system shall allow annotators, judges, or reviewers to attach evidence or reasoning when submitting governed outputs where the task requires it.

acceptance:

* governed outputs may include textual justification
* governed outputs may reference evidence within the data item
* justification is stored with the relevant output record

canon_refs:

* Canon §2 (Judgment model)

priority:
P1

---

## Quality Measurement

### RQ-702 — Annotator Quality Metrics

statement:
The system shall track performance indicators for human participants based on annotation, judgement, review, and disagreement outcomes where appropriate.

acceptance:

* participant quality statistics available where the task family supports them
* disagreement rate can be tracked for the relevant participant role
* arbitration or review outcomes can be linked back to prior human work

canon_refs:

* Canon §3.2

priority:
P1

---

## AI Model Integration Pipeline

### RQ-801 — AI Annotation Integration

statement:
The system shall support importing AI-generated annotations as candidate judgments.

acceptance:

* AI results can be attached to task items
* AI annotations are distinguishable from human annotations
* AI annotations can be replaced or overridden by reviewers

canon_refs:

* Canon §2.2

priority:
P0

notes:

AI models may be external.

---

### RQ-802 — Model Evaluation Support

statement:
The system shall allow comparison between AI annotations and human judgments.

acceptance:

* AI vs human disagreement metrics available
* model evaluation statistics accessible
* model versions identifiable

canon_refs:

* Canon §2.2

priority:
P1

---

## Dataset Versioning

### RQ-901 — Dataset Version Tracking

statement:
The system shall track versions of datasets used in annotation tasks.

acceptance:

* tasks reference dataset version
* dataset updates create new versions
* annotations reference dataset version

canon_refs:

* Canon §5.1

priority:
P1

---

## Export / Delivery Mechanism

### RQ-1001 — Annotation Export

statement:
The system shall allow clients to export annotation results.

acceptance:

* results can be exported in structured formats
* export includes annotation provenance
* export includes reviewer identity (optional)

canon_refs:

* Canon §5.6

priority:
P0

---

## Organization / Multi-Tenant Support

### RQ-1101 — Organization Isolation

statement:
The system shall isolate tasks and data across organizations.

acceptance:

* organization boundary enforced
* users belong to organizations
* cross-organization access prevented

canon_refs:

* Canon §3.6

priority:
P0

---

## Annotation Interface Flexibility

### RQ-1201 — Flexible Annotation Interface

statement:
The system shall support multiple annotation interface types.

acceptance:

* task defines annotation interface
* interface supports multiple data modalities
* interface configuration stored with task

canon_refs:

* Canon §5

priority:
P1

---

## Task Economics / Payment

This section remains optional and non-core for the current product mode.

### RQ-1301 — Task Reward Mechanism

statement:
The system may support reward mechanisms for reviewers.

acceptance:

* task may define reward
* reward tracked per annotation
* reviewer statistics available

priority:
P2

notes:

MVP optional.
