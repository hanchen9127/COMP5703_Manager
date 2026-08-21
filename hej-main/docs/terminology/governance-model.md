# Governance Model

Document: `governance-model.md`  
Status: Draft  
Scope:

Define what `governance model` means in HEJ, where it belongs in the hierarchy, and how product and implementation documents should use the term.

---

# 1. Definition

`Governance model` is the project-level governance posture shared by the tasks inside one project.

It defines the expected review, escalation, ownership, and delivery posture for the project as a governed work program.

It is best understood as:

```text
organization policy context
  -> project governance model
    -> task-specific workflow rules
```

---

# 2. What It Covers

A project governance model may express:

* review intensity or review posture
* dispute and escalation expectations
* export or delivery sensitivity
* operating ownership or expert involvement posture
* any program-level governance signal that should be visible across tasks

Typical examples include product-facing labels such as:

* `Dual sign-off`
* `Expert gate`
* `Arbitration-ready`

These are governance posture signals, not separate workflow engines.

In practical terms:

* `Dual sign-off`
  means the project expects higher review assurance and typically requires two aligned approvals before output is treated as ready
* `Expert gate`
  means the project expects expert review or expert approval at a critical point before completion or delivery
* `Arbitration-ready`
  means the project is configured with the expectation that unresolved disagreement may escalate into formal arbitration rather than being silently collapsed

---

# 3. What It Does Not Mean

`Governance model` does **not** mean:

* a standalone governance subsystem
* a replacement for task-level workflow rules
* a substitute for organization-level policy ownership
* a separate marketplace or trust layer

It should not be used as a vague catch-all for every review, dispute, or policy concept in the system.

---

# 4. Placement in the Shared Core

In the shared core hierarchy:

* `Organization` owns tenant boundary, membership, and top-level policy ownership
* `Project` owns the work program container and its governance model
* `Task` owns setup, execution mode, output schema, and task-specific workflow rules

So the governance model belongs primarily at the `Project` layer.

---

# 5. UX Guidance

In product surfaces, governance model should usually appear as:

* project metadata
* project badge or posture label
* lightweight create-project input
* portfolio scanning signal

It should help users understand what kind of governed workspace they are entering.

It should not dominate the create-project flow or become a separate control plane in MVP.

---

# 6. Writing Guidance

When documents use the term `governance model`, they should mean:

> the project-level governance posture shared across tasks in that project

If a document is actually describing task-level rules, it should say:

* `workflow rules`
* `review rules`
* `task policy`

instead of `governance model`.
