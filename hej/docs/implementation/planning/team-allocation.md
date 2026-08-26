# Team Allocation

Document: `team-allocation.md`
Version: v2.0
Status: Draft
Governance:

* Derived from `docs/implementation/planning/task-tree-general.md`
* Derived from `docs/implementation/planning/integration-contract.md`
* Derived from `docs/implementation/planning/demo-scenarios.md`

Goal:

Define a workable delivery structure for:

* 2 groups
* CS x 8
* DS x 8
* one shared-core system goal
* different technical emphases
* Week 4 integration attempt
* independent fallback demos if integration is partial

This is not a permanent org chart.
It is a delivery-oriented allocation for the capstone handover period.

---

# 1. Delivery Principle

Both groups work toward one product outcome:

```text
shared-core governed human judgment infrastructure
```

The split is by emphasis, not by product ownership.

That means:

* the CS group owns the platform core and user-facing workflow
* the DS group owns machine-assistance capability, judgement assets, runnable task-family datasets, AI-assisted execution inputs, and task-family usability proof
* both groups meet at the task item execution and review path

If the integration is delayed, both groups must still have a defensible standalone demo.

---

# 2. Group Structure

## Group A — DS Track (8 students)

Primary emphasis:

```text
AI annotation and judgement
dataset preparation
candidate generation
confidence scoring
evaluation
review and judgement asset design
integration packaging
runnable task-family validation
```

Recommended subgroups:

```text
DS-A Dataset and Task Alignment (3)
DS-B Modeling and Candidate Generation (3)
DS-C Review, Judgement, and Integration Packaging (2)
```

## Group B — CS Track (8 students)

Primary emphasis:

```text
platform backend
web application
database
project and task workflow surfaces
tenant-admin surfaces
dispute and arbitration scaffolding
export and provenance surfaces
```

Recommended subgroups:

```text
CS-A Platform Core and API (3)
CS-B Project and Task Workspace Frontend (3)
CS-C Dispute, Admin, and Control Surfaces (2)
```

---

# 3. Ownership Boundaries

## CS Owns

```text
identity and access
organization and project scope
task workspace authority surfaces
data pointer registration
project pages and project workspace flow
dashboard, organizations, and admin surfaces
task item operation surfaces
dispute and arbitration workflow
export flow
```

## DS Owns

```text
dataset processing
task-class-aware data preparation
annotation and judgement task alignment
prediction generation
confidence scoring
evaluation metrics
prediction or judgement payload packaging
human-first runtime validation assets
dataset candidate search and selection justification
task-family metrics and evaluation evidence
```

## Shared Boundary

The shared integration boundary is:

```text
task_id
task_item_id
task_class
task_type
execution_mode
output schema
prediction payload
candidate output
model_version
confidence
```

---

# 4. Suggested Internal Work Split

## CS-A Platform Core and API

Suggested responsibilities:

```text
auth or seeded access
organizations
projects
tasks
task items
data pointers
backend route shape
persistence model
```

Primary success criterion:

```text
organization -> project -> task -> item flow works
```

## CS-B Project and Task Workspace Frontend

Suggested responsibilities:

```text
app shell
dashboard
organizations
project workspace
task setup
task items
task runtime queue
task-level review and dispute desks
task history
state-aware UI scaffolding
```

Primary success criterion:

```text
shared-core flow is visually legible and demoable
```

## CS-C Dispute, Admin, and Control Surfaces

Suggested responsibilities:

```text
review semantics
disagreement surfaces
dispute scaffolding
arbitration surfaces
canonical judgment views
admin control surface
export views
```

Primary success criterion:

```text
system looks and behaves like a governed judgment platform, not just a labeling tool
```

## DS-A Dataset and Task Alignment

Suggested responsibilities:

```text
dataset ingestion
cleaning
format conversion
output schema alignment with platform tasks
task class and task type alignment
sample evaluation datasets
candidate dataset search and selection
```

Primary success criterion:

```text
DS is preparing real task-family data that the platform can actually run
```

## DS-B Modeling and Candidate Generation

Suggested responsibilities:

```text
baseline model selection
training experiments
inference pipeline
prediction generation
judgement candidate generation
confidence estimation
schema-compliant candidate packaging
```

Primary success criterion:

```text
importable predictions exist early
```

## DS-C Review, Judgement, and Integration Packaging

Suggested responsibilities:

```text
prediction JSON packaging
schema compliance
evaluation metrics
error analysis
Week 4 import fixtures
joint debugging with CS
human-first runtime validation
task-family usability reporting
dataset candidate justification and selection notes
```

Primary success criterion:

```text
DS outputs are importable, explainable, and usable in at least one real task family
```

---

# 5. PR Ownership Matrix

This section maps the current PR specification inventory in `docs/implementation/prs/` to the recommended subgroup owners.

Legend:

* `Primary`
  subgroup expected to open and drive the PR
* `Support`
  subgroup expected to review, provide fixtures, or absorb integration changes

## 5.1 Global and Project Portfolio

| PR | Primary | Support |
| --- | --- | --- |
| `dashboard.pr.md` | CS-B | CS-A |
| `projects-portfolio.pr.md` | CS-B | CS-A |
| `project-creation.pr.md` | CS-A | CS-B |
| `project-governance-model.pr.md` | CS-A | CS-B |
| `project-lifecycle.pr.md` | CS-A | CS-B |

## 5.2 Project Workspace

| PR | Primary | Support |
| --- | --- | --- |
| `project-overview.pr.md` | CS-B | CS-A |
| `project-task-create-entry.pr.md` | CS-B | CS-A |
| `project-tasks.pr.md` | CS-B | CS-A |
| `project-disputes.pr.md` | CS-C | CS-A |
| `project-exports.pr.md` | CS-C | CS-A |
| `project-policies.pr.md` | CS-C | CS-A |

## 5.3 Task Workspace

| PR | Primary | Support |
| --- | --- | --- |
| `task-creation.pr.md` | CS-A | CS-B |
| `task-lifecycle.pr.md` | CS-A | CS-B |
| `task-item-import.pr.md` | CS-A | DS-A |
| `task-schema-binding.pr.md` | CS-A | DS-C |
| `task-policy-binding.pr.md` | CS-C | DS-C |
| `task-setup.pr.md` | CS-B | CS-A |
| `task-overview.pr.md` | CS-B | CS-A |
| `task-items.pr.md` | CS-B | CS-A |
| `task-history.pr.md` | CS-B | CS-A |
| `task-runtime-queue.pr.md` | CS-B | DS-B |

## 5.4 Task-Item Execution and Governance

| PR | Primary | Support |
| --- | --- | --- |
| `task-item-details.pr.md` | CS-B | CS-A |
| `task-annotate-cs.pr.md` | CS-B | CS-A |
| `task-judge-cs.pr.md` | CS-B | CS-A |
| `task-review.pr.md` | CS-B | CS-C |
| `task-review-actions.pr.md` | CS-C | CS-A |
| `task-disagreement-detection.pr.md` | DS-C | CS-C |
| `task-dispute.pr.md` | CS-C | CS-A |

## 5.5 DS Dataset, AI, and Evidence Track

| PR | Primary | Support |
| --- | --- | --- |
| `annotation-dataset-alignment.pr.md` | DS-A | DS-C |
| `judgement-dataset-alignment.pr.md` | DS-A | DS-C |
| `human-annotation-runtime-validation.pr.md` | DS-C | DS-A |
| `human-judgement-runtime-validation.pr.md` | DS-C | DS-A |
| `candidate-payload-schema.pr.md` | DS-C | CS-A |
| `task-annotate-ds.pr.md` | DS-B | DS-A |
| `task-judge-ds.pr.md` | DS-B | DS-A |
| `task-annotate-integration.pr.md` | CS-A | DS-C |
| `task-judge-integration.pr.md` | CS-A | DS-C |
| `annotation-metrics.pr.md` | DS-C | DS-B |
| `judgement-metrics.pr.md` | DS-C | DS-B |

Allocation note:

```text
CS proves the platform is authoritative and operable
DS proves the platform is usable for real task families
integration PRs are the handshake layer between those two claims
```

Surface note:

```text
Task owns setup, items, runtime queue, and history
TaskItem remains the operation target for annotate, judge, review actions, and dispute handling
```

---

# 6. Weekly Delivery Shape

The weekly PR wave should follow the delivery map in `docs/implementation/planning/team-handover-plan.md`.

Recommended interpretation:

* Weeks 1-3 skew toward CS-owned platform slices
* Weeks 4-6 become mixed CS/DS integration weeks
* Weeks 7-8 close governance, dispute, export, and demo breadth
* DS-owned PRs should not wait until the very end; dataset and runtime-validation slices must start no later than Week 5
* task-runtime-queue should be treated as AI-runtime monitoring, not as a relabelled items page

Operational rule:

```text
do not overload one subgroup with multiple integration-critical PRs in the same week unless the contract is already frozen
```

---

# 7. Fallback Demo Strategy

## CS Fallback Story

If DS integration is late, the CS team should still be able to demo:

```text
organization -> project -> task
dataset pointer
task items
human-first annotation
review action
history
dispute/export scaffolding
```

The AI-assisted path may be shown with:

```text
mock machine suggestion fixtures
```

## DS Fallback Story

If platform integration is late, the DS team should still be able to demo:

```text
dataset pipeline
baseline or improved model
prediction file generation
confidence output
evaluation report
```

This should be framed explicitly as:

```text
the AI-assistance module for the shared core
```

not as a separate product.

---

# 8. Coordination Rules

Recommended recurring coordination:

* one weekly all-hands sync
* one weekly CS/DS integration sync
* one shared fixture and schema owner from each group

Required shared artifacts:

```text
task definition
output schema
prediction JSON examples
demo dataset
Week 4 integration checklist
```

---

# 9. Leadership and Accountability

Recommended role assignment:

* one CS lead
* one DS lead
* one frontend lead
* one backend lead
* one integration lead from each group
* one demo lead

Each subgroup should own one visible output rather than generic participation.

---

# 10. Summary

The right team allocation for this project is:

```text
CS x 8 builds the platform core
DS x 8 builds the AI-assistance capability
both groups aim at the same shared-core workflow
Week 4 is the first serious integration point
either group can still defend a coherent demo if integration is partial
```

That structure gives the project ambition without making it fragile.
