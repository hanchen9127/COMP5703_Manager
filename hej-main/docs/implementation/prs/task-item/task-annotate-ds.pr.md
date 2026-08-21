# task-annotate-ds.pr.md

Status: Draft  
Owner track: Group A / DS-B Modeling and Candidate Generation + DS-C Review, Judgement, and Integration Packaging  
Primary milestone: M3 AI and Judgement Integration  
Suggested submission window: Week 5-6  
PR type: AI annotation candidate PR

---

# 1. Summary

Deliver DS-owned **AI-assisted annotation candidate generation** for annotation-class tasks.

This PR is not a platform page PR. It is the model-output and packaging PR that produces annotation candidates for task items.

---

# 2. Objective

Make AI-assisted annotation usable by:

* generating annotation candidates for task items
* packaging candidate output against the platform output schema
* providing confidence or quality signal
* supporting ingestion into platform reviewable state

---

# 3. Governance Basis

Derived from:

* `docs/design/product/annotation_strategy.md`
* `docs/design/ds/ds_task_dataset_matrix.md`
* `docs/implementation/planning/integration-contract.md`
* `docs/implementation/planning/team-allocation.md`
* `docs/implementation/planning/task-tree-general.md`
* `docs/implementation/planning/minimal-working-slice.md`

Key implications:

* DS must target the platform-defined output schema
* AI output is a candidate, not canonical truth
* AI-assisted remains optional and task-configured, not globally mandatory
* DS should treat annotation candidate generation as one part of a larger runnable proof obligation, not the whole DS story

---

# 4. In Scope

Include:

* annotation-candidate generation pipeline
* candidate payload format
* confidence or quality score packaging
* sample fixture or dataset-aligned output for integration

---

# 5. Out of Scope

Do not include:

* task workspace page composition
* human annotation runtime
* review action UI
* dispute-case creation

---

# 6. Minimal Complete Slice

```text
receive task-item-aligned inputs
-> generate annotation candidates
-> emit schema-compliant payload
-> provide confidence signal for integration
```

---

# 7. Dependencies

Depends on:

* agreed task output schema
* task-item fixture or API contract
* one agreed annotation task type

---

# 8. Team Ownership

Primary owners:

* **DS-B** for generation
* **DS-C** for packaging and evaluation framing

Coordination:

* CS-A for payload contract alignment

---

# 9. Acceptance Criteria

Accept when:

* DS output is schema-compliant
* candidate payload is task-item aligned
* confidence or quality signal is attached in a stable way
* platform ingestion can be attempted without manual reinterpretation

---

# 10. Suggested PR Title

```text
feat: add annotation candidate generation payload
```
