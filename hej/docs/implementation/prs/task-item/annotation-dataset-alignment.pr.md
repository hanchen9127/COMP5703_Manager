# annotation-dataset-alignment.pr.md

Status: Draft  
Owner track: Group A / DS-A Dataset and Task Alignment  
Primary milestone: M3 AI and Judgement Integration  
Suggested submission window: Week 4-5  
PR type: DS dataset alignment PR

---

# 1. Summary

Deliver annotation-task dataset alignment for one or more supported annotation task types.

This PR proves the platform is not only structurally correct, but can be fed with task-item-aligned annotation data.

---

# 2. Objective

Make annotation datasets platform-usable by:

* selecting one or more annotation task types
* aligning raw data to task-item granularity
* defining external refs or pointer-friendly records
* preparing demoable train / eval / fixture splits

---

# 3. Governance Basis

Derived from:

* `docs/design/product/annotation_strategy.md`
* `docs/design/ds/ds_task_dataset_matrix.md`
* `docs/implementation/planning/team-allocation.md`
* `docs/implementation/planning/integration-contract.md`
* `docs/implementation/planning/minimal-working-slice.md`

Key implications:

* task items are the atomic execution unit
* DS should align data to platform task semantics, not invent a separate labeling universe
* data preparation must work for human and AI-assisted annotation paths
* review-compatible outputs must remain possible downstream

---

# 4. In Scope

Include:

* one or more annotation datasets aligned to task types
* task-item-level slicing or record mapping
* pointer-friendly identifiers or references
* sample fixtures for platform integration and evaluation

---

# 5. Out of Scope

Do not include:

* model training itself
* task workspace UI
* review action logic

---

# 6. Minimal Complete Slice

```text
choose one annotation task type
-> align source dataset to task-item records
-> expose stable refs and sample fixtures
-> hand off dataset-aligned assets for platform execution
```

---

# 7. Dependencies

Depends on:

* agreed annotation task type vocabulary
* task-item contract

---

# 8. Team Ownership

Primary owner:

* **DS-A** for dataset preparation and task alignment

Coordination:

* **CS-A** for task-item contract compatibility

---

# 9. Acceptance Criteria

Accept when:

* at least one annotation dataset is aligned to task-item granularity
* refs and fixtures are stable enough for platform integration
* dataset semantics match one agreed annotation task type

---

# 10. Suggested PR Title

```text
feat: align annotation datasets to task items
```
