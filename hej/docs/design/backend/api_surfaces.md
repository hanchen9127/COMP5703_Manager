# API Surfaces

Document: `api_surfaces.md`
Version: v1.2
Status: Authoritative (Conceptual External API Surface)
Governance:

* Governed by Project Canon v1.0
* Aligned with Requirements v1.1
* Aligned with Architecture Overview v1.2
* Aligned with Domain Model v1.1

Purpose:

Define the conceptual external API surface of the shared-core platform.

This document defines resource families and stable semantics, not final REST details.

---

# 1. Design Rules

* resources follow `organization -> project -> task -> task_item` ownership
* governance resources remain distinct from annotation resources
* provenance and export are first-class
* DS integration enters through AI import surfaces, not through a parallel task model
* task semantics must support both annotation tasks and judgment tasks
* `Task` remains the workspace authority surface while `TaskItem` remains the atomic operation target

---

# 2. Top-Level Resource Families

Core resources:

```text
organizations
users
role_assignments
projects
tasks
task_items
data_pointers
annotations
reviews
disagreements
dispute_cases
arbitration_decisions
canonical_judgments
provenance
export_packages
```

Integration resources:

```text
ai_imports
annotation_runtime_sessions
external_data_resolution
```

---

# 3. Resource Hierarchy

Preferred conceptual hierarchy:

```text
Organization
  -> Project
    -> Task
      -> TaskItem
        -> Annotation
        -> Review
        -> Disagreement
        -> CanonicalJudgment
```

Project-scoped collections:

```text
Project
  -> Tasks
  -> Disputes
  -> Exports
  -> Policies
```

Task-scoped collections:

```text
Task
  -> Setup
  -> Items
  -> Annotate / Judge desk
  -> Review desk
  -> Runtime Monitoring
  -> History / Provenance
```

---

# 4. Core Surfaces

## Identity and Access

Conceptual operations:

* get current user
* login / logout or session handoff
* list memberships
* list role assignments
* list tenant-scoped users
* inspect authentication posture such as 2FA or access status

## Organizations

Conceptual operations:

* list accessible organizations
* retrieve organization
* list projects in organization
* list organization members
* inspect or update tenant governance policy

## Projects

Conceptual operations:

* create project
* retrieve project
* update project
* list tasks
* list project disputes
* list project exports
* inspect project policies

## Admin

Admin is not a separate ownership hierarchy, but it is a real operational surface over shared-core resources.

Conceptual operations:

* list tenant-scoped member directory
* grant or revoke role assignments
* inspect membership posture
* inspect tenant governance policy
* update admin-owned policy controls

## Tasks

Conceptual operations:

* create task under project
* retrieve task
* update task setup
* choose task class, task type, and execution mode
* define output format, decision schema, and labeling or judgment rules
* activate / pause / complete
* register dataset pointer
* list task items
* inspect runtime-monitoring posture for AI-assisted execution
* inspect task history

## Task Items

Conceptual operations:

* list task items
* retrieve item detail
* retrieve item content (resolve data pointer `location_ref` for annotate/review viewport; supports `uploads/*` and `mock://fixtures/*` in MVP)
* inspect item state
* inspect item activity
* enter annotation or judgment work
* enter review or dispute work from task-level desks

## Annotations

Conceptual operations:

* submit human first-pass annotation or human judgment
* import machine suggestion or model answer candidate
* list item candidate outputs

## Reviews

Conceptual operations:

* submit review decision
* accept / edit / reject
* escalate to dispute

## Disputes and Arbitration

Conceptual operations:

* create dispute case
* list disputes
* retrieve dispute detail
* add participant
* submit arbitration decision

## Provenance

Conceptual operations:

* get task item lineage
* get state history
* get decision trace

## Exports

Conceptual operations:

* create export package
* get export status
* list export contents
* retrieve export artifact or delivery record

---

# 5. AI / DS Integration Surface

Primary conceptual entry:

```text
AI Import
  -> validate prediction payload
  -> map task_item_id
  -> create machine-originated candidate outputs
```

Rules:

* DS does not create tasks through a DS-only API
* DS targets platform-owned `task_id` and `task_item_id`
* imported predictions remain machine suggestions until reviewed

---

# 6. Stability Rules

The following concepts should remain stable across future iterations:

* ownership hierarchy
* task/task-item semantics
* review vs first-pass execution separation
* dispute and arbitration as separate resources
* export as a project-scoped outcome driven by finalized task-item results

Future marketplace layers may add discovery-facing APIs, but they must wrap around this surface rather than replace it.
