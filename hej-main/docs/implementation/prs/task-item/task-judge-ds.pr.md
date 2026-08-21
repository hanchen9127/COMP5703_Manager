# task-judge-ds.pr.md

Status: Draft  
Owner track: Group A / DS-B Modeling and Candidate Generation + DS-C Review, Judgement, and Integration Packaging  
Primary milestone: M3 AI and Judgement Integration  
Suggested submission window: Week 5-6  
PR type: AI judgement candidate PR

---

# 1. Summary

Deliver DS-owned **AI-assisted judgement candidate generation** for judgement-class tasks.

This PR produces verdict candidates, rationale payloads, and confidence signals for task items.

---

# 2. Objective

Make AI-assisted judgement usable by:

* generating verdict candidates for task items
* emitting rationale and confidence
* packaging outputs against the task decision schema
* supporting platform ingestion into reviewable state

---

# 3. Governance Basis

Derived from:

* `docs/design/ds/ds_task_dataset_matrix.md`
* `docs/implementation/planning/integration-contract.md`
* `docs/implementation/planning/team-allocation.md`
* `docs/design/processes/project/task-process-map.md`
* `docs/implementation/planning/demo-scenarios.md`

Key implications:

* judgement candidates must align to platform decision schema
* candidate rationale is part of the governed flow, not optional decoration
* AI output remains candidate-only until reviewed
* DS should treat judgement candidate generation as one part of a larger runnable proof obligation, not the whole DS story

---

# 4. In Scope

Include:

* judgement-candidate generation
* verdict + rationale payload structure
* confidence or score payload
* sample integrated fixtures for one judgement task type

---

# 5. Out of Scope

Do not include:

* task workspace UI
* review decision UI
* dispute-case UI

---

# 6. Minimal Complete Slice

```text
receive judgement-task-aligned inputs
-> generate verdict candidate and rationale
-> emit schema-compliant payload
-> provide confidence signal for integration
```

---

# 7. Dependencies

Depends on:

* agreed decision schema
* task-item-aligned fixture set
* one agreed judgement task type

---

# 8. Team Ownership

Primary owners:

* **DS-B** for candidate generation
* **DS-C** for rationale packaging and evaluation framing

Coordination:

* CS-A for payload contract alignment

---

# 9. Acceptance Criteria

Accept when:

* verdict payload matches task decision schema
* rationale is present and machine-readable in agreed shape
* platform ingestion can be attempted without manual remapping

---

# 10. Suggested PR Title

```text
feat: add judgement candidate generation payload
```
