# Workflow States

Document: `workflow_states.md`
Version: v1.2
Status: Authoritative (Operational State Model)
Governance:

* Governed by Project Canon v1.0
* Derived from Requirements v1.1
* Aligned with Domain Model v1.1
* Aligned with API Surfaces v1.1
* Aligned with Annotation Strategy v1.1

Purpose:

Define the operational state machines for the shared-core platform.

The formal lifecycle entities are:

* `Task`
* `TaskItem`
* `DisputeCase`
* `ExportPackage`

---

# 1. Design Principles

* `TaskItem` is the atomic workflow unit.
* Review is distinct from first-pass execution.
* Judgment tasks use the same shared state machine even when the primary work is answer evaluation rather than labeling.
* Disagreement must remain preserved.
* State transitions must be explicit and auditable.
* Future marketplace or trust extensions must not redefine these states.

---

# 2. Task Lifecycle

States:

```text
DRAFT
ACTIVE
PAUSED
COMPLETED
ARCHIVED
```

Meaning:

* `DRAFT`: task setup and policy configuration
* `ACTIVE`: task items, first-pass execution, review, dispute flow available
* `PAUSED`: operational intake paused
* `COMPLETED`: execution complete, export/provenance still available
* `ARCHIVED`: read-only historical state

Primary transitions:

```text
DRAFT -> ACTIVE
ACTIVE -> PAUSED
PAUSED -> ACTIVE
ACTIVE -> COMPLETED
COMPLETED -> ARCHIVED
```

---

# 3. TaskItem Lifecycle

States:

```text
READY
ANNOTATION_IN_PROGRESS
CANDIDATE_AVAILABLE
UNDER_REVIEW
DISPUTED
IN_ARBITRATION
FINALIZED
CLOSED
```

Meaning:

* `READY`: item generated and available for work
* `ANNOTATION_IN_PROGRESS`: human first-pass work underway
* `CANDIDATE_AVAILABLE`: AI or human candidate exists
* `UNDER_REVIEW`: governance review in progress
* `DISPUTED`: disagreement escalated
* `IN_ARBITRATION`: expert authority engaged
* `FINALIZED`: canonical judgment active
* `CLOSED`: no further workflow expected

Typical paths:

```text
READY -> ANNOTATION_IN_PROGRESS -> CANDIDATE_AVAILABLE -> UNDER_REVIEW
READY -> CANDIDATE_AVAILABLE -> UNDER_REVIEW
UNDER_REVIEW -> FINALIZED
UNDER_REVIEW -> DISPUTED -> IN_ARBITRATION -> FINALIZED
FINALIZED -> CLOSED
```

Notes:

* AI-assisted tasks may skip `ANNOTATION_IN_PROGRESS`
* human-first tasks may enter `ANNOTATION_IN_PROGRESS` first
* `CANDIDATE_AVAILABLE` is shared by both entry modes
* for judgment tasks, `ANNOTATION_IN_PROGRESS` should be interpreted as primary judgement work in progress
* for judgment tasks, `CANDIDATE_AVAILABLE` may represent an AI answer or candidate verdict awaiting human evaluation

---

# 4. DisputeCase Lifecycle

States:

```text
OPEN
UNDER_DISCUSSION
ESCALATED
RESOLVED
CLOSED
```

Meaning:

* `OPEN`: dispute created from disagreement
* `UNDER_DISCUSSION`: dispute participants are working the case
* `ESCALATED`: arbitration required
* `RESOLVED`: authoritative resolution reached
* `CLOSED`: no further mutation

Typical path:

```text
OPEN -> UNDER_DISCUSSION -> RESOLVED -> CLOSED
OPEN -> UNDER_DISCUSSION -> ESCALATED -> RESOLVED -> CLOSED
```

---

# 5. ExportPackage Lifecycle

States:

```text
REQUESTED
BUILDING
READY
DELIVERED
FAILED
```

Meaning:

* `REQUESTED`: export requested
* `BUILDING`: export package generation in progress
* `READY`: export built and available
* `DELIVERED`: export sent or downloaded
* `FAILED`: build or delivery failure

Typical path:

```text
REQUESTED -> BUILDING -> READY -> DELIVERED
REQUESTED -> BUILDING -> FAILED
```

---

# 6. Invariants

The following must remain true:

* no `TaskItem` may become `FINALIZED` without a review or arbitration outcome
* `DisputeCase` does not erase underlying disagreements
* `ExportPackage` references finalized outputs, not raw unresolved candidates
* `Task` and `TaskItem` history must be append-preserving

---

# 7. UI Alignment

These state machines map onto the current product structure:

* task `DRAFT` mainly corresponds to `Setup`
* task items in `READY`, `CANDIDATE_AVAILABLE`, and `UNDER_REVIEW` appear in `Items`, `Annotate / Judge`, and `Review`
* finalized and historical transitions appear in `History`
* dispute and export states surface in project-scoped pages
