# candidate-payload-schema.pr.md

Status: Draft  
Owner track: Shared PR between Group A DS and Group B CS-A  
Primary milestone: M3 AI and Judgement Integration  
Suggested submission window: Week 5  
PR type: shared contract PR

---

# 1. Summary

Deliver the shared **candidate payload schema** used for AI-assisted annotation and judgement ingestion.

This PR is the contract that lets DS say "our outputs can plug into the platform" and CS say "the platform can consume them safely."

---

# 2. Objective

Make candidate handoff stable by:

* defining one payload shape for DS-to-CS candidate transfer
* specifying task, task-item, model-version, and confidence fields
* clarifying how annotation and judgement candidates fit the contract
* reducing manual remapping during integration

---

# 3. Governance Basis

Derived from:

* `docs/design/ds/ds_task_dataset_matrix.md`
* `docs/implementation/planning/integration-contract.md`
* `docs/terminology/task-schema-and-policy.md`
* `docs/implementation/planning/team-allocation.md`

Key implications:

* payloads must respect task-level schema binding
* DS output remains candidate-only, not canonical
* annotation and judgement variants should share one stable exchange pattern where possible

---

# 4. In Scope

Include:

* candidate payload schema versioning
* required and optional fields
* annotation vs judgement payload examples
* validation expectations and rejection conditions

---

# 5. Out of Scope

Do not include:

* runtime UI
* model training logic
* review decision logic

---

# 6. Minimal Complete Slice

```text
define one candidate payload schema
-> express annotation and judgement examples
-> validate that DS and CS can exchange candidates without manual reinterpretation
```

---

# 7. Dependencies

Depends on:

* schema binding direction
* integration contract

---

# 8. Team Ownership

Primary owners:

* **DS** for candidate payload requirements
* **CS-A** for ingestion and validation contract

---

# 9. Acceptance Criteria

Accept when:

* one stable payload schema exists
* annotation and judgement examples are explicit
* rejection conditions are clear enough to unblock integration

---

# 10. Suggested PR Title

```text
feat: define shared candidate payload schema
```
