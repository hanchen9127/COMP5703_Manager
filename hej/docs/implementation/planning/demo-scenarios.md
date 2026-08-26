# Demo Scenarios

Document: `demo-scenarios.md`
Version: v2.0
Status: Draft
Governance:

* Derived from `docs/governance/canon.md`
* Derived from `docs/governance/requirements.md`
* Derived from `docs/design/system/system_design.md`
* Derived from `docs/design/product/governed_human_judgment_infrastructure_workflows.md`
* Derived from `docs/design/product/workspace_surface_hierarchy.md`
* Derived from `docs/implementation/planning/milestone-definition.md`

Purpose:

Define repeatable, browser-visible demo scenarios that match the current shared-core hierarchy and PR decomposition.

This document is not a PR list.
It describes what the audience should be able to see when the platform is working coherently.

---

# 1. Demo Philosophy

Every accepted demo must show:

```text
actor action
-> system processing
-> visible persisted result
-> inspectable workflow state
```

Not acceptable:

```text
terminal output only
architecture explanation only
UI placeholder without state change
mock success toasts without persisted objects
```

---

# 2. Shared-Core Demo Rule

All demos assume the shared-core hierarchy:

```text
organization -> project -> task -> task_item
```

And the workspace hierarchy:

```text
Projects Portfolio
-> Project Workspace
-> Task Workspace
-> item-level actions opened from task desks
```

Implications:

* `Project` owns tasks, disputes, exports, and policies
* `Task` owns setup, items, runtime queue, and history
* `TaskItem` is the action target for annotate, judge, review, and dispute handling
* `queue` is not an alias for `items`; it is future runtime monitoring for AI-assisted flows

---

# 3. Minimum Demo Environment

Required environment:

```text
web application
application backend
relational persistence
sample dataset pointer or fixture-backed item import
one annotation-capable or judgement-capable task family
```

Optional environment:

```text
AI candidate generator
background runtime processing
export delivery adapter
```

Recommended demo roles:

```text
admin
task owner or manager
annotator or judge
reviewer
dispute participant
```

---

# 4. Demo Datasets and Fixtures

All demos should use a small but non-trivial fixture set.

Recommended size:

```text
10-30 task items
```

Recommended task families:

```text
text annotation
image annotation
claim support judgement
LLM answer evaluation
preference judgement
```

Minimum fixture inventory:

* one organization
* one project
* one human-first task
* one AI-assisted task
* at least one reviewable item
* at least one disagreement-ready item

DS note:

Where DS-backed datasets are used, the fixture should be defensible under `docs/design/ds/ds_task_dataset_matrix.md`, not just convenient.

---

# 5. Canonical Demo Sequence

The full end-state demo sequence is:

```text
tenant entry
-> project creation
-> task creation and setup
-> item import or item generation
-> human-first or AI-assisted first-pass work
-> review
-> disagreement detection
-> dispute handling
-> history and lineage inspection
-> export visibility
```

Not every milestone demo must show the entire sequence.
The final handover demo should still feel like one coherent system.

---

# 6. Scenario 1 — Organization and Project Entry

Goal:

Show that the platform has a real tenant boundary and project-level workspace.

Primary actors:

* admin
* task owner

Steps:

```text
1. Enter organization scope
2. Open projects portfolio
3. Create a project
4. Open project workspace
5. Inspect overview, tasks, disputes, exports, and policies navigation
```

Expected visible result:

```text
project persisted under the correct organization
project workspace is operational rather than decorative
```

Verification:

* project record persisted
* project appears in portfolio listing
* project workspace navigation renders correctly

---

# 7. Scenario 2 — Task Creation and Setup

Goal:

Show that a task is a governed workflow container, not a loose label bucket.

Primary actors:

* task owner

Steps:

```text
1. Open project tasks
2. Create a task
3. Set task class, task type, and execution mode
4. Bind output schema or decision schema
5. Bind minimal review or dispute policy posture
6. Save task and open task workspace
```

Expected visible result:

```text
task record created
setup summary visible
task workspace tabs render coherently
```

Verification:

* task stored with project linkage
* schema and policy references persisted
* task lifecycle visible

---

# 8. Scenario 3 — Item Import and Task Items

Goal:

Show that the platform owns workflow state while respecting the external-data boundary.

Primary actors:

* task owner
* system

Steps:

```text
1. Open task setup
2. Register dataset pointer or import fixture-backed items
3. Generate or ingest task items
4. Open task items desk
5. Filter or inspect item states
```

Expected visible result:

```text
task items exist as platform workflow objects
raw data is still treated as externally sourced
```

Verification:

* import or pointer record persisted
* task items link back to the intended task
* items desk shows identifiers and workflow state

---

# 9. Scenario 4 — Human-First Annotation or Judgement

Goal:

Show that human-first execution is the default viable path.

Primary actors:

* annotator or judge
* reviewer

Steps:

```text
1. Open a human-first task
2. Open one task item
3. Submit one first-pass annotation or judgement
4. Move the item into reviewable state
5. Open the review desk
```

Expected visible result:

```text
human-authored first-pass output stored
item becomes reviewable
review desk can see the item
```

Verification:

* item output stored with human attribution
* task-item state updated
* review entry point available

---

# 10. Scenario 5 — AI-Assisted Annotation or Judgement

Goal:

Show that AI enters as a candidate signal rather than final truth.

Primary actors:

* AI system
* reviewer or human operator

Steps:

```text
1. Open an AI-assisted task
2. Import or generate candidate outputs
3. Inspect runtime queue or candidate availability if present
4. Open one task item with machine-originated output
5. Continue work or govern the imported candidate
```

Expected visible result:

```text
candidate payload remains attributable to its machine source
human action remains distinct from machine proposal
```

Verification:

* candidate output includes source and model metadata
* imported output remains distinguishable from reviewed or canonical output
* task item state and history change visibly

---

# 11. Scenario 6 — Review, Disagreement, and Dispute

Goal:

Show that downstream governance is preserved as a real workflow path.

Primary actors:

* reviewer
* dispute participant
* system

Steps:

```text
1. Open task review desk
2. Review one item
3. Accept, edit, reject, or escalate
4. Trigger disagreement-ready or dispute-ready state where applicable
5. Open dispute handling surface
```

Expected visible result:

```text
review is separate from first-pass work
disagreement is not silently lost
dispute state is visible when escalation happens
```

Verification:

* review decision persisted
* disagreement or dispute signal persisted where expected
* history reflects the transition

---

# 12. Scenario 7 — History and Export Readiness

Goal:

Show that the platform preserves inspectable workflow memory and project-level downstream readiness.

Primary actors:

* task owner
* reviewer

Steps:

```text
1. Open task history
2. Inspect item-level or task-level workflow events
3. Return to project workspace
4. Inspect project exports or export-readiness surface
```

Expected visible result:

```text
workflow changes remain inspectable
export belongs to project scope, not as an item-level shortcut
```

Verification:

* history shows meaningful state transitions
* project exports surface can inspect readiness or export artifacts

---

# 13. Scenario 8 — DS Usability Proof

Goal:

Show that DS work proves the platform is usable for a real task family.

Primary actors:

* DS team
* project lead

Steps:

```text
1. Present chosen dataset candidates and final selection rationale
2. Show schema fit for the chosen task family
3. Show human-first runnable proof
4. Show AI-assisted runnable proof if available
5. Show metrics or evaluation evidence
```

Expected visible result:

```text
the platform is not only visually complete
the task family is defensible, runnable, and measurable
```

Verification:

* dataset source and justification documented
* schema fit is explicit
* runtime validation artifacts exist
* metrics or experiment evidence exist

---

# 14. Summary

The demo plan now validates three things together:

```text
the platform has the right hierarchy
the workflow is governable end to end
the chosen task families are actually usable in practice
```
