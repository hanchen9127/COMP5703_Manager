# Task Structure Diagram

Document: `task-structure-diagram.md`
Status: Draft
Scope:

Visualize the relationship between:

* `Project`
* `Task`
* `TaskItem`
* `Setup / Items / Annotate / Review / Dispute / History`
* `ai_assisted` and `human_first` execution paths

This document is a clarification aid for current MVP implementation.

---

# 1. Core Hierarchy

```text
Organization
  ->
Project
  ->
Task
  ->
TaskItem
```

Meaning:

* `Project` is the governed work program container
* `Task` is one annotation or judgment task inside that project
* `TaskItem` is the atomic unit that AI and humans actually work on

Rule:

* AI and humans do not really "annotate a Task"
* they act on `TaskItem`s inside a `Task` workflow

---

# 2. Project vs Task

```text
Project
  -> shows task list
  -> shows disputes / exports / policies across tasks
  -> routes users into the right task

Task
  -> defines one annotation or judgment task
  -> owns setup, items, execution desks, review, dispute, and history
  -> governs item-level execution after annotation begins
```

Simple interpretation:

* `Project` answers: which tasks exist and what program are we running
* `Task` answers: how does this one task get configured, launched, executed, and then governed

---

# 3. Task Workspace Structure

```text
Task workspace
  -> Setup
  -> Items
  -> Annotate
  -> Review
  -> Dispute
  -> History
```

Meaning:

* `Setup`
  define the task before execution
* `Items`
  inspect task items and state
* `Annotate`
  complete the actual AI-assisted or human-first annotation or judgment work
* `Review`
  make governed human decisions on candidate outputs
* `History`
  inspect lineage, activity, and traceability

---

# 4. Setup Structure

Current recommended mental model:

```text
Setup
  -> Task definition
  -> Task class
  -> Task type
  -> Execution mode
  -> Shared rules
  -> Output format / Decision schema
  -> Workflow rules
  -> Data source
  -> Launch readiness
  -> Advanced options
```

Meaning:

* `Task definition`
  what this task is deciding
Naming hierarchy:

* `Task class`
  annotation or judgement
* `Task type`
  text, image, audio, or video annotation, or a concrete judgement use case such as answer evaluation
* `Execution mode`
  AI-assisted or human-first
* `Shared rules`
  shared instructions for how annotations or judgments should be produced
* `Output format / Decision schema`
  what the result must look like
* `Workflow rules`
  how review / escalation / delivery should run
* `Data source`
  where task items come from
* `Launch readiness`
  whether the task can move from `DRAFT` into active execution

---

# 5. Execution Structure

```text
Task
  ->
TaskItems enter the task item index
  ->
TaskItems receive annotation or candidate output
  ->
TaskItems enter review
  ->
TaskItems may escalate into dispute / arbitration
  ->
TaskItems finalize
  ->
Task history and provenance remain visible
```

Key rule:

* the real work unit is always `TaskItem`

---

# 6. AI-Assisted Path

```text
Task setup
  ->
Task items generated
  ->
AI suggestion or candidate verdict imported for task items in the background
  ->
Human operator opens item
  ->
candidate annotation or candidate judgement is checked or refined
  ->
accept / edit / reject
  ->
finalize or escalate
```

Meaning:

* AI enters as a candidate source
* human authority still resolves the governed outcome

---

# 7. Human-First Path

```text
Task setup
  ->
Task items generated
  ->
Human operator opens workspace for a task item from the items desk
  ->
human creates initial annotation or judgement
  ->
item enters review
  ->
finalize or escalate
```

Meaning:

* human work produces the first candidate
* review and governance still remain explicit

---

## 7.1 Judgement Task Subflow

```text
Project
  ->
Create judgement task
  ->
Choose judgement task type
  ->
Connect source data or answer/output source
  ->
Choose execution mode
  ->
Write shared judgement instructions
  ->
Define decision schema
  ->
Launch
  ->
Annotate page becomes judgement workbench
  ->
Review / dispute later
```

Meaning:

* judgement is primary task execution
* review is downstream governance
* dispute is escalation, not the main task itself

# 8. Combined View

```text
Project
  ->
Task list
  ->
Open one Task
  ->
Setup
  -> define task + task class + task type + execution mode + shared rules + output format or decision schema + workflow rules + data source + launch readiness
  ->
Items
  -> inspect task items + progress
  ->
Annotate
    -> AI-assisted: AI candidate first
    -> Human-first: human output first
  ->
Review
  -> accept / edit / reject / escalate
  ->
History
  -> activity + lineage + provenance
```

---

# 9. MVP Interpretation

For the current MVP:

```text
Project = work program shell
Task = annotation or judgment task inside that shell
TaskItem = atomic execution unit
```

And:

```text
Setup = define and launch
Items = inspect and enter execution
Review = govern annotation outcomes later
History = explain
```

That is the simplest stable mental model for implementation.
