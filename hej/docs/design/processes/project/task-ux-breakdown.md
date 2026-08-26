# Task UX Breakdown

Document: `task-ux-breakdown.md`
Status: Draft
Scope:

Define the user experience breakdown for task-level surfaces in the current ToB-first operating model.

This document focuses on:

* page-level information architecture
* interaction priorities
* task-level navigation
* UX expectations for `Setup / Items / Annotate / Review / Dispute / History`

This document does **not** define implementation details.

---

# 1. Source References

Read together with:

* `docs/design/processes/project/task-process-map.md`
* `docs/design/processes/project/project-process-map.md`
* `docs/design/system/system_design.md`
* `docs/design/product/workflow_states.md`
* `docs/design/backend/api_surfaces.md`
* `docs/implementation/planning/demo-scenarios.md`

---

# 2. UX Goal

The task UX should help users do five things with low ambiguity:

1. understand whether the task is still being configured or already executing
2. understand how the task was configured across class, type, data source, execution mode, and instructions
3. move between setup, items, annotation or judgement work, review, dispute, and history without losing context
4. complete annotation work clearly before governance layers appear
5. inspect lineage and prior actions when confidence or trust is needed

The task UX should feel like an execution workspace, not like:

* a generic form wizard
* a plain spreadsheet with no workflow meaning
* a flattened annotation tool with governance hidden

---

# 3. UX Hierarchy

The intended hierarchy is:

```text
Projects
  -> Project workspace
    -> Task workspace

Task workspace
  -> Setup
  -> Items
  -> Annotate
  -> Review
  -> Dispute
  -> History
```

UX rule:

* task scope should preserve context from the parent project
* each task page should answer one clear operational question

---

# 4. Core UX Principles

## 4.1 Setup Must Communicate Readiness

`Setup` is not just metadata editing.
It should make it obvious:

* what task type is being configured
* what task class is being configured
* what data source is connected
* whether the task runs AI-assisted or human-first
* what annotation instructions or judgement rubric will guide execution
* what is missing
* whether the task is safe to activate

## 4.2 Items Must Support Scanning Into Annotation Work

`Items` should let users understand item state quickly.

Users should be able to scan:

* which items are ready
* which are in progress
* which already have candidates
* which are disputed or finalized
* whether work is being produced by AI in the background or by humans opening items directly

## 4.3 Annotate Must Branch by Task Class

`Annotate` is the primary execution surface.
It should reflect whether the task is an annotation task or a judgement task.

The page should make these distinctions legible:

* `annotation`
  source content plus structured labeling controls
* `judgement`
  source context plus answer/output under judgement, verdict controls, and rationale workspace

## 4.4 Review Must Stay Downstream of Annotation

`Review` is not the first thing the task exists for.
It is the governance layer that follows annotation output.

The page should make these actions unmistakable:

* accept
* edit
* reject
* escalate

## 4.5 History Must Explain, Not Just Log

`History` should not be a dump of timestamps.
It should help the user reconstruct:

* important actions
* state progression
* provenance-relevant milestones

## 4.6 Maintain Task Context

Across all task pages, the user should always know:

* which task they are in
* which project it belongs to
* what the task status is
* what the execution mode is
* what the task class is
* what task type it is

---

# 5. Page-Level UX Breakdown

## 5.1 `/tasks/{taskId}/setup` - Task Setup

### Primary UX Jobs

* define the task correctly
* show configuration completeness
* help the user move from `DRAFT` to `ACTIVE`

### First-Screen Priorities

1. task identity and status
2. task type and annotation mode
3. shared annotation instructions
4. output format and workflow rules visibility
5. data source state
6. launch readiness

### Recommended Components

Core components:

* task summary header
* mode selector or mode summary
* task type selector or type summary
* annotation instructions block
* output format summary
* workflow rules summary
* data source block
* readiness or validation summary

Supporting components:

* sample pointer preview
* storage integration summary
* draft warnings
* activation checklist

### Interaction Expectations

Users should be able to:

* understand what is configured
* understand what is missing
* register data sources
* activate only when governance requirements are satisfied

---

## 5.2 `/tasks/{taskId}/items` - Task Items

### Primary UX Jobs

* show the task item set in operational terms
* support scanning and triage
* direct users into annotation or review when needed

### Required Signals

* item identity
* preview/context
* candidate or source signal
* item status
* progress signal

### Recommended Components

Core components:

* item summary
* item table or board
* state badges
* workload count
* mode-aware progress panel

Supporting components:

* filter by state
* mode-aware explanation
* quick open into annotation or review

### Interaction Expectations

Users should be able to:

* scan item statuses quickly
* filter by state
* open the next meaningful item and continue the correct annotation path
* understand whether AI is still generating candidates or humans should annotate directly

---

## 5.3 `/tasks/{taskId}/annotate` - Task Annotate

### Primary UX Jobs

* provide the first-pass execution workbench
* let the user complete the output before governance starts
* preserve one task shell while still branching by task class

### First-Screen Priorities

1. current task/item context
2. source context
3. annotation controls or judgement controls
4. shared rules or rubric
5. save / submit actions

### Recommended Components

Core components:

* task-item context panel
* source preview
* task-class-aware output controls
* rules / rubric panel
* submit actions

Supporting components:

* mode-aware runtime panel
* candidate batch visibility
* item filters

### Interaction Expectations

Users should be able to:

* open the next item without losing task context
* understand whether they are labeling or making a structured judgement
* save work and send the output into review

---

## 5.4 `/tasks/{taskId}/review` - Task Review

### Primary UX Jobs

* present one governed decision surface after annotation output exists
* show candidate output and context
* support explicit review actions

### First-Screen Priorities

1. current task/item context
2. candidate annotation visibility
3. review controls
4. assignment / SLA or operator context
5. activity / escalation visibility

### Recommended Components

Core components:

* review workbench
* candidate display
* accept / edit / reject controls
* escalation path

Supporting components:

* confidence / source signal
* assignment or owner panel
* recent activity panel

### Interaction Expectations

Users should be able to:

* understand what they are deciding
* see whether the candidate is human or machine-originated
* perform a review action with low ambiguity
* escalate when conflict exists

### UX Warning

Do not make review feel like a generic form submission.
It should feel like a governed decision point.

---

## 5.5 `/tasks/{taskId}/history` - Task History

### Primary UX Jobs

* explain the path to current state
* make provenance-adjacent information visible
* support trust and audit interpretation

### Recommended Components

Core components:

* activity timeline
* workflow lineage
* key transition markers

Supporting components:

* actor attribution
* system event markers
* dispute or arbitration milestones where relevant

### Interaction Expectations

Users should be able to:

* reconstruct major actions
* understand state changes
* connect history to current governed outcome

---

# 6. Navigation Expectations

## 6.1 Stable Task Subnav

Task navigation should remain stable:

* Setup
* Items
* Annotate
* Review
* Dispute
* History

The user should not need to guess where a function moved.

## 6.2 Setup to Execution

The intended task path is:

```text
Setup
  ->
Items
  ->
Annotate
  ->
Review
  ->
History
```

This is not always linear in usage, but it is the clearest operational model.

## 6.3 Return Paths

Users should be able to move back to:

* the parent project
* project tasks list
* the relevant project-level dispute/export/policy surface when needed

---

# 7. Interaction Patterns

## 7.1 Validation

Setup should make readiness and missing requirements visible before activation.

## 7.2 Scanning

Items should prioritize compact, legible scanning over excessive ornament.

## 7.3 Decision-Making

Review should keep the primary actions visually obvious and context-rich.

## 7.4 Trace Reconstruction

History should help users reason about sequence, not just read raw logs.

---

# 8. MVP UX Priorities

If scope is tight, prioritize in this order:

1. task setup clarity
2. item readability and progress visibility
3. review decisiveness
4. history usefulness

This order matches the core product claim:

* configure the task first
* then execute annotation
* then review and escalate if needed
* then explain and prove lineage

---

# 9. Summary

The `Task` UX should feel like:

```text
annotation-first workspace
  -> define the task and launch readiness
  -> scan task-item state and progress
  -> complete annotation work
  -> make explicit review decisions
  -> inspect lineage and prior actions
```

The first success criterion is whether users can answer:

* is this task ready
* what is happening across task items
* what decision do I need to make
* how did this state happen
