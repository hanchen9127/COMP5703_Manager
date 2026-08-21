# Integration Contract

Document: `integration-contract.md`
Version: v2.0
Status: Draft
Governance:

* Governed by Project Canon
* Derived from `docs/design/system/system_design.md`
* Derived from `docs/design/product/one_core_two_operating_models.md`
* Derived from `docs/implementation/planning/demo-scenarios.md`
* Derived from `docs/implementation/planning/minimal-working-slice.md`

Purpose:

Define the stable technical contract between:

* the **CS track**, which implements the shared workflow and governance core
* the **DS track**, which implements AI-assisted annotation and judgement capability that plugs into that core

This contract exists so that:

* both teams build one system rather than parallel demos
* integration can be attempted by Week 4
* either team can still produce a defensible fallback if live integration slips

---

# 1. Shared Goal

The two groups are not building two products.
They are building one shared-core system with different emphases.

The shared system goal is:

```text
organization-scoped project
-> task definition
-> task item generation
-> annotation or judgement entry
-> AI-assisted or human-first execution
-> review
-> disagreement handling
-> dispute and arbitration
-> canonical judgment
-> export
```

The CS track owns workflow authority.
The DS track contributes candidate outputs, runnable task-family assets, and evaluation evidence to that workflow.

---

# 2. Group Roles

## CS Track

Primary emphasis:

```text
platform backend
web application
workflow state
project and task workspace
human-first annotation and judgement workflow
ai-assisted annotation and judgement workflow
review governance
dispute and arbitration
provenance
export
```

## DS Track

Primary emphasis:

```text
dataset preparation
task alignment
candidate generation
confidence scoring
human annotation and judgement runtime validation
ai-assisted candidate generation
judgement and evaluation assets
prediction packaging
review-oriented analysis
task-family metrics and experiment evidence
dataset candidate selection and quality justification
```

The DS track does not own workflow authority.
It contributes candidate outputs, runnable task-family assets, and evidence to the CS-owned workflow core.

---

# 3. Shared-Core Boundary

The following concepts are part of the shared core and must be treated as integration anchors:

```text
organization
project
task
task_item
task_class
task_type
execution_mode
data_pointer
output_schema
annotation or judgement output
review
disagreement
dispute_case
arbitration_decision
canonical_judgment
export_package
```

Interpretation:

* `Task` is the workspace authority surface
* `TaskItem` is the operation target for annotate, judge, review, and dispute handling
* `queue` is reserved for AI-runtime monitoring and should not be used as a synonym for `items`

The following are out of scope for this contract:

```text
marketplace listing
payment
payout
public task discovery
trust score systems
```

---

# 4. Integration Modes

Two integration modes are supported.

## Mode A — File Import

Primary mode for capstone delivery.

Flow:

```text
DS generates candidate payloads
CS imports them into a task context
platform turns them into machine-originated candidate outputs
operators inspect them in task and review workspaces
```

Why this is primary:

* lowest coordination cost
* easiest to freeze early
* easiest fallback if runtime integration is unstable

## Mode B — API Import

Optional mode if the teams are ahead of schedule.

Flow:

```text
DS posts candidate outputs to a platform endpoint
platform validates and stores machine-originated outputs
```

---

# 5. Core Objects Exchanged Between Teams

The DS track depends on the platform for:

```text
task_id
task_item_id
task_class
task_type
execution_mode
output_schema
data pointer or data access instructions
```

The CS track depends on the DS track for:

```text
candidate output payload
model_version
confidence score if available
payload schema version
task-family-aligned dataset fixtures
evaluation notes or metric evidence where needed for demo credibility
dataset candidate selection rationale where the choice affects demo credibility
```

The CS track remains authoritative for:

```text
task existence
task item identity
workflow state
review
dispute
arbitration
canonicalization
export
```

---

# 6. Candidate Payload Contract

Primary exchange format:

```json
{
  "payload_schema_version": "v1",
  "task_id": "task_answer-eval-v1",
  "model_version": "baseline_v1",
  "candidates": [
    {
      "task_item_id": "item_201",
      "candidate_output": {},
      "confidence": 0.82
    }
  ]
}
```

Required fields:

* `payload_schema_version`
* `task_id`
* `model_version`
* `candidates[].task_item_id`
* `candidates[].candidate_output`

Optional field:

* `candidates[].confidence`

Contract rules:

* `task_id` must refer to a platform task
* `task_item_id` must refer to a platform-generated task item
* payload shape must match the task's output schema
* CS may reject malformed or mismatched payloads without blocking core platform demos
* imported candidates must remain distinguishable from human-first output and reviewed output

---

# 7. Output Schema Contract

The platform defines the task output schema.
The DS track must target that schema.

Portable schema handoff may be expressed as:

```json
{
  "schema_version": "v1",
  "task_id": "task_answer-eval-v1",
  "task_class": "judgement",
  "task_type": "llm_answer_evaluation",
  "output_schema": {
    "required_fields": ["verdict", "rationale"],
    "optional_fields": ["confidence", "flags"]
  }
}
```

The exact expression may evolve, but this rule must remain stable:

**DS predicts against platform-defined task semantics, not against a parallel DS-only task definition.**

Judgement-oriented outputs may include:

```text
verdict
rationale
preferred option
flags
confidence
```

Annotation-oriented outputs may include:

```text
label
span or region
confidence
optional rationale
```

---

# 8. Data Access Contract

The platform does not own raw datasets by default.
The DS track should not assume raw payloads live inside platform storage.

The stable assumption is:

```text
the platform owns pointers, task identity, and workflow
raw client data may remain in external storage
```

This means:

* task items may reference externally hosted data
* imports must respect platform-owned `task_item_id`
* demos may use mocked local pointers if cloud connectors are incomplete

DS-side implication:

* DS should validate datasets against task-family suitability and schema fit before treating them as integration-ready

---

# 9. Handover Rule

For the remaining 8-week capstone window:

* integration must be attempted early with frozen payload examples
* file import is sufficient if it is stable and reviewable
* every contract change must be reflected in docs before both groups diverge
* the contract should be changed sparingly once Week 4 integration begins
* DS handover is incomplete if it provides raw candidates without runnable proof notes or metrics evidence
