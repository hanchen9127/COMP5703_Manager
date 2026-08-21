# milestone-definition.md

Version: v2.0
Status: Draft
Governance:

* Derived from `docs/design/system/system_design.md`
* Derived from `docs/implementation/planning/integration-contract.md`
* Derived from `docs/implementation/planning/demo-scenarios.md`
* Derived from `docs/implementation/planning/minimal-working-slice.md`

Purpose:

Define milestone completion criteria for the remaining 8-week capstone handover window.

Each milestone must represent:

* a coherent capability
* a reviewable implementation slice
* a browser-visible demo
* a safe merge target for the shared `main` branch

Milestones are judged against the shared execution and governance core, not against speculative extension features.

---

# 1. Milestone Overview

The handover period is divided into four milestone checkpoints:

```text
Week 2 -> M1 Core Contracts + Platform Foundation
Week 4 -> M2 Project and Task Workflow
Week 6 -> M3 AI and Judgement Integration
Week 8 -> M4 ToB Workspace Completion
```

Each milestone must produce a demoable capability.

---

# 2. Milestone 1 — Core Contracts + Platform Foundation

Target week:

```text
Week 2
```

Goal:

Freeze the product and integration backbone so both groups can build without redefining shared semantics.

Deliverables:

```text
organization -> project -> task -> task_item hierarchy implemented
seeded auth or equivalent tenant entry
task class / task type / execution mode vocabulary locked
output schema / decision schema and core task policy surfaces present
integration contract frozen for fixture-backed exchange
task versus task_item boundary no longer ambiguous
```

Demo:

```text
open organization
create project
create task
register dataset pointer
generate task items
show task items in UI and API
```

Definition of done:

```text
project can be created
task can be created
task items can be generated
shared contract terms are stable enough for both groups to build against
```

---

# 3. Milestone 2 — Project and Task Workflow

Target week:

```text
Week 4
```

Goal:

Make the core ToB workflow operational from project entry to task-item execution.

Deliverables:

```text
projects page usable as a portfolio surface
project workspace navigable end to end
task workspace supports overview, setup, items, annotate or judge, review, dispute-ready posture, runtime-queue semantics, and history
one human-first path runnable for annotation or judgement
first real CS/DS integration attempt completed
```

Demo:

```text
open project workspace
create task
register pointer or mock source
open task items
complete one first-pass output
show resulting state change in review and history
```

Definition of done:

```text
project and task workspace surfaces are no longer placeholders
task items can be opened and worked on
one first-pass path persists real data
review remains a distinct downstream action
```

---

# 4. Milestone 3 — AI and Judgement Integration

Target week:

```text
Week 6
```

Goal:

Stabilize one AI-assisted execution path and one judgement-capable task path.

Deliverables:

```text
fixture-backed or API-backed AI import works
candidate outputs appear against platform task items
judgement task supports structured output fields
review can inspect and govern imported AI outputs
preference or evaluation-style judgement is demoable
DS task-family evidence includes dataset fit, runnable proof, and at least one metrics artifact
```

Demo:

```text
import AI-generated outputs
open AI-assisted task
inspect candidate output in task workspace
perform review on one item
show judgement lineage or canonical result
```

Definition of done:

```text
AI import path is stable enough for repeated demo use
judgement task is not modeled as a fake annotation task
task item lineage shows candidate -> draft/review/canonical progression where relevant
```

---

# 5. Milestone 4 — ToB Workspace Completion

Target week:

```text
Week 8
```

Goal:

Reach a coherent ToB-first platform that covers most of the operational workspace expected for handoff.

Deliverables:

```text
projects fully usable
task workflow coherent end to end
dispute path visible and minimally operable
dashboard, organizations, and admin are operational
real data replaces major mock-only seams where feasible
handover docs and PR ownership boundaries are stable enough for student execution
```

Target interpretation:

```text
roughly 80% of the ToB workspace
not perfect completeness
not marketplace scope
```

Demo:

```text
enter dashboard or organizations
open project workspace
create or continue a task
complete one first-pass item action
complete review
open dispute if needed
inspect admin or organization control surface
```

Definition of done:

```text
the platform reads as one coherent product
major workspace paths are usable in browser
PR-level delivery can continue safely after handover
teams are no longer blocked on missing canon or missing ownership boundaries
```
