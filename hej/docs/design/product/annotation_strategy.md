# Annotation Strategy

Document: `annotation_strategy.md`
Version: v1.1
Status: Authoritative (MVP Strategy)
Governance: Governed by Project Canon v1.0

This document defines the annotation strategy used by the Human Judgment Infrastructure Platform.

It clarifies:

* execution paths supported for annotation tasks
* the role of the first-pass runtime for annotation work
* the relationship between annotation and governance layers
* the MVP integration strategy with integrated or external first-pass runtimes

If conflicts arise, **Project Canon takes precedence**.

---

# 1. Purpose

The purpose of this document is to define how annotation activities are performed within the platform and how they integrate with the broader judgment governance system.

The platform distinguishes between:

* **annotation generation**
* **annotation validation and governance**

Annotation generation may involve either:

* human annotators
* AI models
* a combination of both.

However, the platform's core responsibility is **not annotation itself**, but **orchestrating and validating judgments** produced through annotation workflows.

This document is annotation-specific.
Judgement tasks follow the same shared-core governance model, but their task-specific execution details are defined elsewhere.

---

# 2. Core Principles

## Annotation vs Governance Separation

The system separates two conceptual layers:

**Annotation Layer**

Responsible for producing candidate labels.

Activities include:

* human annotation
* AI-generated suggestions
* correction of annotations.

**Governance Layer**

Responsible for validating and governing annotation outcomes.

Activities include:

* review
* disagreement detection
* dispute resolution
* arbitration
* provenance tracking.

The annotation runtime generates candidate outputs, while the platform governance layer determines which outputs become **canonical judgments**.

---

## Data Sovereignty

Annotation workflows must respect the platform's **data sovereignty principle**:

* raw datasets remain in client infrastructure
* annotation actions operate on externally referenced task items
* the platform stores only metadata and judgment records.

---

## Mode Flexibility

The platform supports multiple annotation strategies depending on task requirements.

Tasks may begin with:

* AI-generated candidate annotations
* human-generated annotations.

This allows the system to adapt to domains where AI capability varies significantly.

---

# 3. Supported Annotation Modes

The platform supports two primary annotation execution paths.

---

## 3.1 AI-assisted Annotation Mode

In this mode, annotation begins with AI-generated candidate labels.

Workflow structure:

```text
Task Item
   ↓
AI Annotation
   ↓
Human First-Pass Review / Correction
   ↓
Governance Workflow
   ↓
Final Judgment
```

Characteristics:

* AI provides initial annotation suggestions.
* Humans verify, modify, or reject these suggestions.
* Humans may act as first-pass annotators or downstream reviewers depending on workflow configuration.

Typical use cases:

* large-scale labeling
* AI evaluation
* model validation
* tasks with moderate AI accuracy.

---

## 3.2 Human-first Annotation Mode

In this mode, annotation begins directly with human annotators.

Workflow structure:

```text
Task Item
   ↓
Human Annotation
   ↓
Review / QA
   ↓
Governance Workflow
   ↓
Final Judgment
```

Characteristics:

* human annotators generate initial labels
* downstream reviewers may validate or audit annotations
* AI is optional or absent.

Typical use cases:

* complex reasoning tasks
* domain expert labeling
* tasks where AI performance is insufficient.

---

# 4. Annotation Runtime

The annotation runtime is the environment where human annotators interact with task items and create or modify annotations.

Responsibilities of the annotation runtime include:

* displaying task data
* presenting task schema
* allowing annotators to create labels
* allowing annotators to modify existing labels.

The annotation runtime is **not responsible for workflow governance**.

---

# 5. MVP Annotation Runtime

During the MVP phase, the platform may integrate an external annotation engine or use a native first-pass surface.

The current strategy does not require one fixed vendor runtime.
An integrated external tool, native web surface, or hybrid path may be used.

The annotation runtime responsibilities include:

* rendering task data
* capturing annotation actions
* submitting annotation results.

However, the runtime does not control:

* task lifecycle
* review workflows
* dispute resolution
* arbitration
* provenance records.

Those responsibilities remain within the platform.

Current implementation note:

* human-first remains the default execution posture
* AI-assisted is task-configured and optional
* both paths must remain review-compatible

---

# 6. Platform Responsibilities

The platform manages all orchestration and governance functions surrounding annotation.

These include:

### Task Management

* project creation
* task definition
* schema definition
* execution mode selection.

---

### Workflow Orchestration

* assigning annotators
* controlling first-pass stages
* managing task state transitions.

---

### AI Annotation Integration

* importing AI-generated candidate annotations
* associating AI suggestions with task items
* enabling human correction of AI labels.

---

### Review Governance

* human review workflows
* quality assurance processes
* disagreement detection.

---

### Dispute Resolution

* dispute case management
* escalation mechanisms
* arbitration workflows.

---

### Provenance Tracking

* recording annotation history
* recording review actions
* preserving decision lineage.

---

### Result Delivery

* exporting canonical judgments
* exporting provenance data
* delivering results to client systems.

---

# 7. Relationship Between Annotation and Review

Annotation does not automatically produce final results.

Instead:

```text
Annotation
    ↓
Review
    ↓
Disagreement Detection
    ↓
Dispute / Arbitration
    ↓
Canonical Judgment
```

The platform ensures that only judgments validated through governance workflows become **final outputs**.

---

# 8. Annotation Engine Integration Strategy

The platform integrates an annotation runtime through a defined integration interface.

The annotation runtime must support:

* task data ingestion
* annotation submission
* schema-based labeling.

The platform remains responsible for:

* workflow orchestration
* first-pass provenance
* governance processes.

---

# 9. Future Evolution

Future versions of the platform may introduce:

* custom annotation runtimes
* specialized annotation interfaces for specific domains
* enhanced AI-human collaboration interfaces.

Replacement of the annotation runtime may occur if:

* annotation workflows require deeper integration with governance
* performance limitations arise
* task types exceed capabilities of existing tools.

The decision to replace the annotation runtime will be treated as an architectural change and documented via ADR.

---

# 10. Non-goals

The platform does not aim to become a generic standalone annotation tool.

Specifically, the system does not prioritize:

* building low-level annotation rendering engines
* replacing existing annotation tools without clear architectural benefit.

Instead, the platform focuses on **judgment governance and orchestration** around annotation workflows.

---

# 11. Open Questions

The following issues remain unresolved:

### Annotation UI Embedding

Whether the annotation runtime will be:

* embedded inside the platform UI
* accessed as a linked external workspace.

Status: **TBD**

---

### AI Annotation Pipeline

The platform must decide whether AI candidate annotations are:

* generated internally
* imported from external model pipelines.

Status: **TBD**

---

### Reviewer Interaction Model

The relationship between:

* annotators
* reviewers
* arbitrators

may evolve depending on task complexity.

Status: **TBD**
