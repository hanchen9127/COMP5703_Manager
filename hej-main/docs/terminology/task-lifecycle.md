# Task Lifecycle

Document: `task-lifecycle.md`  
Status: Draft  
Scope:

Define what `task lifecycle` means in HEJ, which states belong to it, and how it differs from task-item lifecycle.

---

# 1. Definition

`Task lifecycle` is the operational state of one task as an execution-level container inside a project.

It answers:

* is this task still in setup
* is it currently executing
* is it paused
* is it completed or historical

It does **not** describe the per-item workflow state of task items.

---

# 2. Placement In The Hierarchy

Task lifecycle belongs at the `Task` layer:

```text
project
  -> task
    -> task item
```

It should stay distinct from:

* project lifecycle
* task-item lifecycle
* dispute-case lifecycle
* export-package lifecycle

---

# 3. Canonical Status Vocabulary

The stable task lifecycle vocabulary should align with `workflow_states.md`:

* `draft`
* `active`
* `paused`
* `completed`
* `archived`

Meaning:

* `draft`
  setup and readiness work is still underway
* `active`
  items, annotate or judge, review, and downstream governance flow are available
* `paused`
  execution intake is paused
* `completed`
  execution is complete, though history and export visibility may remain
* `archived`
  task is historical and read-only

---

# 4. Relationship To Task-Item Lifecycle

Task lifecycle and task-item lifecycle are related but not identical.

The rule is:

* task lifecycle describes the state of the container
* task-item lifecycle describes the state of each atomic work unit

Examples:

* a task may be `active` while many task items are `ready`
* a task may still be `active` while some task items are `under_review`
* a task should not be treated as `completed` until its task-item flow is sufficiently resolved

---

# 5. Writing Guidance

When documents use `task lifecycle`, they should mean:

> the operational state of one task as a runnable execution container

If the document is actually describing item progression, it should say:

* `task-item lifecycle`
* `item state`
* `review state`

instead of `task lifecycle`.
