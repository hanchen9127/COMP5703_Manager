# Domain Model Relations

Document: `domain_model_relations.md`
Version: v1.2
Status: Authoritative (Conceptual Relations Model)
Governance:

* Governed by Project Canon v1.0
* Aligned with Requirements v1.1
* Aligned with Domain Model v1.1
* Aligned with Workflow States v1.2

Purpose:

Define the relationship structure between core domain entities.

---

# 1. Top-Level Ownership

## Organization -> Project

```text
Organization 1 -> many Project
```

Type:

* owns

Invariant:

* every project belongs to exactly one organization

## Project -> Task

```text
Project 1 -> many Task
```

Type:

* contains

Invariant:

* every task belongs to exactly one project

## Task -> TaskItem

```text
Task 1 -> many TaskItem
```

Type:

* contains

Invariant:

* every task item belongs to exactly one task

---

# 2. Identity and Authorization Relations

## User -> Organization

```text
User many -> many Organization
```

via:

* membership / organization user relation

## User -> RoleAssignment

```text
User 1 -> many RoleAssignment
```

Invariant:

* a workflow action should be attributable to a user acting under a valid role context

---

# 3. Task Execution Relations

## Task -> LabelSchema / DecisionSchema

```text
Task many -> 1 active LabelSchema or DecisionSchema
```

Meaning:

* annotation tasks usually reference a label schema
* judgment tasks may instead reference a decision schema or verdict model

## TaskItem -> DataPointer

```text
TaskItem many -> 1 DataPointer
```

Meaning:

* task items reference external content through pointers

## Task -> ExecutionMode

```text
Task 1 -> 1 active ExecutionMode
```

Modes:

* ai_assisted
* human_first

---

# 4. Judgment Relations

## TaskItem -> Annotation

```text
TaskItem 1 -> many Annotation
```

Meaning:

* one item may accumulate machine and human candidate records over time

## Annotation -> User or Machine Source

```text
Annotation many -> 1 ActorSource
```

Meaning:

* source may be human or explicit machine identity

## TaskItem -> Review

```text
TaskItem 1 -> many Review
```

Meaning:

* reviews are governance actions over candidate outputs

## TaskItem -> Disagreement

```text
TaskItem 1 -> many Disagreement
```

Meaning:

* disagreements remain preserved, even after later resolution

## TaskItem -> DisputeCase

```text
TaskItem 1 -> many DisputeCase
```

Meaning:

* disputes are escalations derived from disagreement or review conflict

## DisputeCase -> ArbitrationDecision

```text
DisputeCase 1 -> 0..many ArbitrationDecision
```

Operationally expected:

* one active authoritative decision per resolved case

## TaskItem -> CanonicalJudgment

```text
TaskItem 1 -> 0..many CanonicalJudgment
```

Operationally expected:

* at most one active canonical judgment at a time

---

# 5. Provenance and Export Relations

## CanonicalJudgment -> ProvenanceRecord

```text
CanonicalJudgment 1 -> many ProvenanceRecord
```

Meaning:

* final outputs must retain lineage to prior workflow stages

## Project -> ExportPackage

```text
Project 1 -> many ExportPackage
```

## Task / TaskItem -> ExportPackage

```text
Task many -> many ExportPackage
TaskItem many -> many ExportPackage
```

depending on packaging model.

---

# 6. Extension Boundary Relations

Future extension entities such as:

* Profile
* TrustScore
* Listing
* Application
* Invoice
* Payout

may reference:

* User
* Organization
* Project
* Task
* CanonicalJudgment

But the reverse dependency should not exist.
