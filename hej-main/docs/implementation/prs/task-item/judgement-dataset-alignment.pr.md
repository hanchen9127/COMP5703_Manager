# judgement-dataset-alignment.pr.md

Status: Draft  
Owner track: Group A / DS-A Dataset and Task Alignment  
Primary milestone: M3 AI and Judgement Integration  
Suggested submission window: Week 4-5  
PR type: DS dataset alignment PR

---

# 1. Summary

Deliver judgement-task dataset alignment for one or more supported judgement task types.

This PR proves the platform can host real judgement tasks rather than only annotation-shaped data.

---

# 2. Objective

Make judgement datasets platform-usable by:

* selecting one or more judgement task types
* aligning source data to task-item granularity
* preserving verdict target shape and rationale context
* preparing demoable fixtures for human-first and AI-assisted judgement

---

# 3. Governance Basis

Derived from:

* `docs/design/processes/project/task-process-map.md`
* `docs/design/ds/ds_task_dataset_matrix.md`
* `docs/implementation/planning/team-allocation.md`
* `docs/implementation/planning/integration-contract.md`
* `docs/terminology/task-schema-and-policy.md`

Key implications:

* judgement is a first-class task class
* DS must prepare data against decision-schema-aware task semantics
* rationale-bearing judgement context should not be flattened into plain labels
* review-compatible outputs must remain possible downstream

---

# 4. In Scope

Include:

* one or more judgement datasets aligned to task items
* stable refs, prompts, source context, or answer-pair context as needed
* task-type-aware fixtures for platform execution and evaluation

---

# 5. Out of Scope

Do not include:

* model training itself
* review or dispute UI
* canonical judgment logic

---

# 6. Minimal Complete Slice

```text
choose one judgement task type
-> align source data to task-item records
-> preserve verdict and rationale context
-> hand off judgement-aligned fixtures for platform execution
```

---

# 7. Dependencies

Depends on:

* agreed judgement task type vocabulary
* decision schema direction

---

# 8. Team Ownership

Primary owner:

* **DS-A** for dataset preparation and judgement-task alignment

Coordination:

* **CS-A** for task-item and schema compatibility

---

# 9. Acceptance Criteria

Accept when:

* at least one judgement dataset is aligned to task-item granularity
* dataset semantics match one agreed judgement task type
* fixtures preserve enough context for verdict and rationale work

---

# 10. Suggested PR Title

```text
feat: align judgement datasets to task items
```
