# task-schema-binding.pr.md

Status: Draft  
Owner track: Group B / CS-A Platform Core and API + CS-B Project and Task Workspace Frontend  
Primary milestone: M2 Project and Task Workflow  
Suggested submission window: Week 5  
PR type: task setup contract PR

---

# 1. Summary

Deliver **task schema binding** in setup.

This PR binds one task to either an annotation `output schema` or a judgement `decision schema`.

---

# 2. Objective

Make schema binding operational by:

* showing what result shape the task expects
* distinguishing annotation output schema from judgement decision schema
* exposing schema reference or summary in setup
* providing a stable contract for DS payloads and execution surfaces

---

# 3. Governance Basis

Derived from:

* `docs/terminology/task-schema-and-policy.md`
* `docs/implementation/planning/integration-contract.md`
* `docs/design/processes/project/task-process-map.md`
* `docs/implementation/planning/demo-scenarios.md`

Key implications:

* schema is a task setup concept
* execution and review consume schema but do not redefine it
* DS payloads must align to the bound schema

---

# 4. In Scope

Include:

* schema binding UX or display in setup
* annotation vs judgement schema distinction
* schema reference in task read contract
* visibility of required fields or allowed values where useful

---

# 5. Out of Scope

Do not include:

* full policy configuration
* annotate or judge submission UI
* DS candidate generation itself

---

# 6. Minimal Complete Slice

```text
open task setup
-> see bound output schema or decision schema
-> understand required result shape
-> expose the same schema reference to downstream execution
```

---

# 7. Dependencies

Depends on:

* task setup
* task class and task type being defined

---

# 8. Team Ownership

Primary owners:

* **CS-A** for schema contract in API/model
* **CS-B** for setup visibility

Coordination:

* **DS** for payload alignment

---

# 9. Acceptance Criteria

Accept when:

* setup clearly distinguishes output schema from decision schema
* one bound schema is visible per task
* downstream teams can target that schema without reinterpretation

---

# 10. Suggested PR Title

```text
feat: bind task output and decision schema
```

