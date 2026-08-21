# Architecture Overview

Document: `architecture_overview.md`
Version: v1.3
Status: Draft
Governance: Governed by Project Canon v1.0

In case of conflict, **Project Canon takes precedence**.

---

# 1. Architecture Goals

The architecture supports a **Human Judgment Infrastructure Platform** designed to orchestrate AI-assisted and human-first annotation workflows while preserving data sovereignty and traceable decision provenance.

The architecture now follows a **One Core, Two Operating Models** direction:

* one durable shared workflow and governance core
* one current ToB governed-infrastructure operating model
* one future marketplace-style operating model built on top of the same core

Primary architectural goals:

### Judgment Authority

The system must produce **canonical judgments** derived from annotation and review workflows with traceable provenance.

### Data Sovereignty

Client datasets must remain under **client ownership and infrastructure control**.
The platform must avoid becoming a primary storage location for raw datasets.

### Execution Flexibility

The system must support two execution modes:

* **AI-assisted**
* **Human-first**

The architecture must support both across annotation tasks and judgement tasks without changing the core governance workflow.

### Governance and Traceability

The platform must maintain complete provenance of:

* annotation actions
* review outcomes
* dispute resolutions
* final decisions.

### Evolvability

The system must allow integration with:

* external AI models
* external annotation workspaces
* external data storage

without forcing tight coupling.

The system must also remain evolvable at the product-model level: future discovery, trust, and commercial modules may be added around the platform, but they must not redefine task execution, review, dispute, arbitration, provenance, or export.

### Organizational Isolation

Organizations using the platform must remain logically isolated from one another.

---

# 2. System Context (C4 Level 1)

### System Under Consideration

Human Judgment Infrastructure Platform

The system orchestrates annotation and judgement workflows involving AI systems and human participants, producing governed outputs and provenance records.

---

### External Actors

```text
+-----------------------+
| Client Organization   |
| Task Owner / Manager  |
+-----------+-----------+
            |
            v
+----------------------------------------------+
| Human Judgment Infrastructure Platform       |
|                                              |
| orchestrates project and task work,         |
| review, disputes, and decision provenance   |
+----------------------------------------------+
      ^              ^                 ^
      |              |                 |
+-----+-------------+   +-----------+-----+     +-----+------+
|Annotator / Judge  |   |Arbitrator       |     |Admin       |
|Human Participant  |   |Domain Expert    |     |Operator    |
+-------------------+   +-----------------+     +------------+

      |
      v
+-----------------------------+
| External AI Candidate       |
| Service / Model             |
+-----------------------------+

      |
      v
+-----------------------------+
| Client Data Storage         |
| Object Storage / Data Lake  |
| Internal Systems            |
+-----------------------------+
```

---

### Trust Boundaries

**Client Data Boundary**

Raw datasets remain inside the client’s infrastructure.

The platform accesses task items through controlled data pointers.

**Platform Governance Boundary**

The platform is responsible for:

* task orchestration
* annotation and judgement workflow
* review governance
* dispute resolution
* provenance tracking
* result export.

The platform is **not responsible for raw dataset storage**.

**Extension Boundary**

Future profile, marketplace, trust, or payment capabilities belong outside the core governance boundary. They may shape how work enters the system, but they do not replace project-scoped and task-scoped workflow authority.

---

# 3. Container Architecture (C4 Level 2)

The system consists of several conceptual containers.

```text
+-----------------------------------------------------------------------------------+
|                 Human Judgment Infrastructure Platform                            |
+-----------------------------------------------------------------------------------+

+--------------------------+
| Web Application          |
| (User Interface)         |
|                          |
| Used by annotators,      |
| judges, reviewers,       |
| and admins               |
+------------+-------------+
             |
             v

+--------------------------+
| Workflow Orchestration   |
| Service                  |
|                          |
| Manages task lifecycle,  |
| execution mode, review   |
| states and disputes      |
+------------+-------------+
             |
             +------------------------------+
             |                              |
             v                              v

+--------------------------+      +--------------------------+
| First-Pass Work Runtime  |      | External Data Access     |
| Container                |      | Gateway                  |
|                          |      |                          |
| Human-first or           |      | Retrieves task items     |
| AI-assisted work         |      | from external storage    |
+------------+-------------+      +------------+-------------+
             |                                 |
             v                                 v

+--------------------------+
| AI Candidate Import      |
|                          |
| Imports AI-generated     |
| candidate outputs        |
+------------+-------------+

             |
             v

+--------------------------+
| Review & Dispute         |
| Governance Service       |
|                          |
| Handles review actions,  |
| disagreement detection,  |
| dispute cases and        |
| arbitration routing      |
+------------+-------------+

             |
             v

+--------------------------+
| Judgment & Provenance    |
| Store                    |
|                          |
| Stores first-pass        |
| history and decision     |
| lineage                  |
+------------+-------------+

             |
             v

+--------------------------+
| Export & Delivery        |
| Service                  |
|                          |
| Delivers validated       |
| governed outputs         |
| back to client systems   |
+--------------------------+
```

This container view intentionally centers the **shared core**. If future phases introduce marketplace discovery or commercial logic, those capabilities should surround this core rather than duplicate it.

---

### Container Responsibilities

#### Web Application

Provides UI for:

* project and task workspace access
* first-pass item work access
* review actions
* dispute resolution
* task management.

---

#### Workflow Orchestration Service

Responsible for:

* task creation and configuration
* task class, task type, and execution mode selection
* assignment or routing of annotators, judges, and reviewers
* workflow state transitions.

This service remains authoritative whether work is created directly by an organization or eventually routed in through a future extension layer.

---

#### First-Pass Work Runtime Container

Provides the environment where humans perform first-pass annotation or judgement work and where AI-assisted candidates can be surfaced for governed use.

This runtime may be:

* an external annotation runtime
* a custom internal work surface
* a mixed model across task types

This container is responsible only for **first-pass work actions**, not governance logic.

---

#### AI Candidate Import

Integrates AI-generated candidate outputs into tasks.

Responsibilities:

* importing AI suggestions or judgement candidates
* associating candidates with task items
* preserving model provenance
* enabling governed downstream review.

---

#### External Data Access Gateway

Handles controlled access to client-owned datasets.

Responsibilities include:

* resolving dataset pointers
* retrieving task items at runtime.

---

#### Review & Dispute Governance Service

Responsible for:

* human review workflows
* disagreement detection
* dispute case management
* arbitration routing.

These governance capabilities remain part of the shared core and must not be outsourced to extension modules.

---

#### Judgment & Provenance Store

Stores platform-managed records:

* first-pass outputs
* review history
* dispute outcomes
* provenance metadata.

Raw datasets are not stored here.

---

#### Export & Delivery Service

Provides mechanisms to deliver validated annotation or judgement outputs to client organizations.

Exports may include:

* canonical labels
* provenance history
* audit information.

Export remains a project- and task-scoped shared-core capability, not a marketplace fulfillment concern.

---

# 4. Component Architecture (C4 Level 3)

Component-level decomposition is considered unstable at this stage.

Further decomposition will occur once the following stabilize:

* review governance policies
* annotation workspace integration patterns
* dispute resolution rules.

Status: **TBD**

---

# 5. Data and Control Flow (Structural)

The platform supports two execution modes across annotation and judgement tasks.

The same flow is intended to remain authoritative across both operating models. Future marketplace discovery may precede task creation, but once work enters the system it must still travel through this shared execution path.

```text
Task Creation
      |
      v
Task Profiling
(select task class, task type, and execution mode)
      |
      +-----------------------------+
      |                             |
      v                             v

AI-assisted Mode              Human-first Mode
      |                             |
      v                             v

AI Candidate Import          First-Pass Work Runtime
      |                             |
      +-------------+---------------+
                    |
                    v

            Review Governance

                    |
                    v

            Disagreement Detection

                    |
                    v

               Dispute Case

                    |
                    v

              Arbitration

                    |
                    v

          Canonical Judgment
               + Provenance

                    |
                    v

             Export / Delivery
```

---

# 6. Key Interfaces and Contracts

### External Data Access Interface

Allows the platform to retrieve task items from external storage.

Responsibilities:

* resolve dataset pointers
* enforce authorization
* avoid raw dataset storage within the platform.

Status: **TBD**

---

### AI Candidate Import Interface

Allows external AI systems to provide candidate outputs.

Responsibilities:

* ingest AI-generated candidates
* associate candidates with task items
* record model provenance.

Status: **TBD**

---

### First-Pass Work Runtime Interface

Allows the platform to integrate one or more first-pass work runtimes.

Possible implementations may include:

* external annotation workspaces
* custom internal task-item work panels
* task-type-specific interfaces

Status: **TBD**

---

### Export Interface

Allows client organizations to retrieve validated annotation or judgement results.

Exports may include:

* canonical annotations
* provenance records.

Status: **TBD**

---

# 7. Cross-Cutting Concerns

### Security and Privacy

Key principle: **Data Sovereignty**

* raw client data remains outside platform storage
* platform stores only metadata and judgment records
* annotators access only assigned task items.

---

### Observability

Minimal observability may include:

* workflow logs
* annotation activity metrics
* dispute statistics.

Implementation details: **TBD**

---

### Availability and Fault Isolation

Container separation allows failure isolation.

Examples:

* AI candidate generation failures must not block human-first workflows.
* data access failures must not corrupt governance records.

---

# 8. Trade-offs and Architectural Decisions

### First-Pass Work Runtime Strategy

The platform may integrate external runtimes or internal work surfaces for first-pass work.

Benefits:

* allows task-type-specific interfaces
* avoids coupling core governance semantics to one UI engine

Trade-off:

* runtime integration choices may vary by task family and maturity.

---

### Data Non-Ownership

The platform does not store raw datasets.

Benefits:

* regulatory compliance
* reduced legal exposure.

Trade-off:

* external data retrieval may increase latency.

---

### Human Governance Priority

Human review, dispute resolution, and arbitration are treated as **first-class architectural capabilities**.

This distinguishes the platform from traditional annotation tools.

It also distinguishes the platform from future marketplace features: discovery and payment may be added later, but governance authority stays here.

---

# 9. Open Architecture Issues

### First-Pass Work Runtime Evolution

Future phases may replace or extend the chosen first-pass work runtime mix.

Trigger conditions include:

* task-family workflow limitations
* governance integration constraints.

Status: **TBD**

---

### Data Access Strategy

The precise mechanism for retrieving external dataset items remains undecided.

Possible approaches include:

* runtime fetch
* signed URL access
* controlled gateway proxy.

Status: **TBD**

---

### Dispute Governance Policy

Rules governing disagreement escalation are not yet finalized.

Examples include:

* threshold-based dispute creation
* manual dispute initiation.

Status: **TBD**
