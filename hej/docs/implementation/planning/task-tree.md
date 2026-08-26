# Task Tree

Version: v2.0
Status: Draft
Governance:

* Governed by `docs/governance/canon.md`
* Derived from `docs/governance/requirements.md`
* Derived from `docs/design/system/system_design.md`
* Derived from `docs/design/product/workspace_surface_hierarchy.md`
* Derived from `docs/implementation/planning/milestone-definition.md`
* Derived from `docs/implementation/planning/team-handover-plan.md`

Purpose:

Translate the shared-core platform design into an execution tree that matches the current capstone handover window.

Hierarchy:

```text
Milestone -> Delivery lane -> Capability cluster -> Task family
```

Current planning rule:

* this tree is a decomposition reference, not the weekly merge ledger
* the authoritative weekly delivery unit now lives in `docs/implementation/prs/`
* task trees should explain why work exists and how it groups, not duplicate all PR specs line by line

---

# 1. Execution Framing

The current handover window should be read through four milestone checkpoints:

```text
M1 Core contracts and platform foundation
M2 Project and task workflow
M3 AI and judgement integration
M4 ToB workspace completion
```

The shared-core object hierarchy remains:

```text
organization -> project -> task -> task_item
```

The current workspace hierarchy remains:

```text
Projects Portfolio
-> Project Workspace
-> Task Workspace
-> TaskItem operation surfaces
```

Interpretation:

* `Project` owns project overview, tasks, disputes, exports, and policies
* `Task` owns overview, setup, items, runtime queue, and history
* `TaskItem` is the operation target for annotate, judge, review, and dispute handling

---

# 2. M1 — Core Contracts and Platform Foundation

Target weeks:

```text
Weeks 1-2
```

Goal:

Freeze the platform backbone so both CS and DS can build without redefining the shared vocabulary.

## Lane A — Project Portfolio Foundation

Capability clusters:

* project creation and persistence
* project lifecycle visibility
* governance model capture
* project portfolio listing

Representative PR families:

* `project-creation`
* `project-governance-model`
* `project-lifecycle`
* `projects-portfolio`

## Lane B — Task Container Foundation

Capability clusters:

* task creation
* task lifecycle visibility
* item import bootstrap
* schema binding

Representative PR families:

* `task-creation`
* `task-lifecycle`
* `task-item-import`
* `task-schema-binding`

## Lane C — Contract Freezing

Capability clusters:

* task class, task type, execution mode vocabulary
* output schema and decision schema vocabulary
* DS-facing candidate payload contract

Representative PR families:

* `task-schema-binding`
* `candidate-payload-schema`

Definition of done:

```text
project and task objects are real
task items can be generated or registered
schema and payload vocabulary are stable enough for integration
```

---

# 3. M2 — Project and Task Workflow

Target weeks:

```text
Weeks 3-4
```

Goal:

Make the main ToB workflow operational from project entry to item-level human work.

## Lane A — Project Workspace

Capability clusters:

* project overview
* project task entry
* project tasks table and navigation

Representative PR families:

* `project-overview`
* `project-task-create-entry`
* `project-tasks`

## Lane B — Task Workspace Shell

Capability clusters:

* task overview
* task setup
* task policy binding
* task items
* task history

Representative PR families:

* `task-overview`
* `task-setup`
* `task-policy-binding`
* `task-items`
* `task-history`

## Lane C — Human-First Item Work

Capability clusters:

* item details
* human annotation entry
* human judgement entry

Representative PR families:

* `task-item-details`
* `task-annotate-cs`
* `task-judge-cs`

Definition of done:

```text
one human-first path is runnable
task workspace tabs are not placeholders
item-level work can produce persisted first-pass output
```

---

# 4. M3 — AI and Judgement Integration

Target weeks:

```text
Weeks 5-6
```

Goal:

Prove that the platform is usable for real annotation and judgement task families, not just visually complete.

## Lane A — DS Dataset and Runnable-Task Proof

Capability clusters:

* annotation dataset alignment
* judgement dataset alignment
* human runtime validation
* candidate dataset search and justification

Representative PR families:

* `annotation-dataset-alignment`
* `judgement-dataset-alignment`
* `human-annotation-runtime-validation`
* `human-judgement-runtime-validation`

## Lane B — AI Candidate Production and Integration

Capability clusters:

* DS annotation candidate generation
* DS judgement candidate generation
* annotation integration
* judgement integration
* runtime queue visibility

Representative PR families:

* `task-annotate-ds`
* `task-judge-ds`
* `task-annotate-integration`
* `task-judge-integration`
* `task-runtime-queue`

## Lane C — Measurement and Contract Stability

Capability clusters:

* candidate payload schema
* annotation metrics
* judgement metrics

Representative PR families:

* `candidate-payload-schema`
* `annotation-metrics`
* `judgement-metrics`

Definition of done:

```text
one AI-assisted path is stable enough for repeated demo use
one judgement-capable path is stable enough for real structured decisions
DS can defend task-family usability with data, schema, and metrics evidence
```

---

# 5. M4 — Governance and ToB Workspace Completion

Target weeks:

```text
Weeks 7-8
```

Goal:

Close the downstream governance path and complete the core ToB workspace.

## Lane A — Review and Disagreement Governance

Capability clusters:

* task review desk
* review action contract
* disagreement detection
* task dispute handling

Representative PR families:

* `task-review`
* `task-review-actions`
* `task-disagreement-detection`
* `task-dispute`

## Lane B — Project-Level Operational Surfaces

Capability clusters:

* project disputes
* project exports
* project policies
* dashboard

Representative PR families:

* `project-disputes`
* `project-exports`
* `project-policies`
* `dashboard`

Definition of done:

```text
review and disagreement are real workflow states rather than decorative UI
project-level visibility exists for disputes, exports, and policy posture
the platform is demoable as a governed ToB workspace rather than a loose task runner
```

---

# 6. DS and CS Interpretation

The execution tree should now be read as two converging claims:

## CS claim

```text
the platform is authoritative and operable
```

CS-heavy capability clusters:

* project and task APIs
* project and task workspaces
* review, dispute, export, and admin-facing surfaces
* state, persistence, and authoritative workflow transitions

## DS claim

```text
the platform is usable for real annotation and judgement task families
```

DS-heavy capability clusters:

* task-family dataset alignment
* human-first runtime validation
* AI candidate generation
* schema-compliant candidate packaging
* metrics and experiment evidence

The handshake layer is:

```text
candidate payloads
task-item mapping
schema binding
runtime queue visibility
reviewable imported outputs
```

---

# 7. Open Constraints

These are still real planning constraints, but they no longer justify a second competing execution tree:

* arbitration is still downstream and can remain minimal for the capstone window
* export remains project-level, not task-level
* `queue` is reserved for runtime monitoring, not as an alias for `items`
* alternative annotation runtimes may exist, but the platform semantics cannot depend on one vendor-specific tool

---

# 8. Summary

This task tree now says one clear thing:

```text
early weeks establish the project and task backbone
middle weeks prove human-first and AI-assisted task execution
late weeks close governance and workspace breadth
PR specs remain the operational weekly delivery unit
```
