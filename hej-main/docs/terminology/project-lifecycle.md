# Project Lifecycle

Document: `project-lifecycle.md`  
Status: Draft  
Scope:

Define what `project lifecycle` means in HEJ, which states belong to it, and how it differs from task lifecycle.

---

# 1. Definition

`Project lifecycle` is the operational state of a project as a governed work program.

It answers:

* is this project still being prepared
* is it currently running work
* is it now historical or closed

It does **not** describe item-level execution or review state.

---

# 2. Placement In The Hierarchy

The intended hierarchy is:

```text
organization
  -> project
    -> task
      -> task item
```

Project lifecycle belongs at the `Project` layer.

It should stay distinct from:

* organization policy posture
* task lifecycle
* task-item lifecycle
* dispute or export lifecycle

---

# 3. Canonical Status Vocabulary

The first stable project lifecycle vocabulary should be:

* `draft`
* `active`
* `archived`

Meaning:

* `draft`
  project exists but is still being prepared as a work program
* `active`
  project is actively hosting runnable or ongoing task work
* `archived`
  project is historical and no longer the primary operating surface

---

# 4. What It Controls

Project lifecycle should influence:

* how projects appear in project portfolio
* which project is treated as currently active work
* how project overview frames next actions

Project lifecycle should **not** directly replace:

* task readiness
* task execution state
* review state
* dispute state

---

# 5. Writing Guidance

When documents use `project lifecycle`, they should mean:

> the operational state of a project as a governed work program

If the document is actually talking about task execution, it should say:

* `task lifecycle`
* `task status`
* `task-item state`

instead of `project lifecycle`.
