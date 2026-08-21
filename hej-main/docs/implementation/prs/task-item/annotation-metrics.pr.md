# annotation-metrics.pr.md

Status: Draft  
Owner track: Group A / DS-C Review, Judgement, and Integration Packaging  
Primary milestone: M4 ToB Workspace Completion  
Suggested submission window: Week 6-7  
PR type: DS evaluation PR

---

# 1. Summary

Deliver annotation-task evaluation metrics that prove AI-assisted or human-first annotation outputs are useful inside the platform workflow.

---

# 2. Objective

Make annotation quality measurable by:

* defining task-type-aware annotation metrics
* reporting candidate quality or agreement signal
* showing whether outputs are fit to enter review
* supporting demoable comparison between human-first and AI-assisted paths where possible

---

# 3. Governance Basis

Derived from:

* `docs/design/ds/ds_task_dataset_matrix.md`
* `docs/implementation/planning/team-allocation.md`
* `docs/implementation/planning/integration-contract.md`
* `docs/design/product/annotation_strategy.md`

Key implications:

* DS should prove the platform is usable, not just integrated
* quality evidence should align to task type and schema
* metrics should help explain review load or disagreement posture

---

# 4. In Scope

Include:

* metric definition for one or more annotation task types
* evaluation dataset or fixture alignment
* report shape for candidate quality, agreement, or error modes
* demo-ready summary of what the metrics mean

---

# 5. Out of Scope

Do not include:

* review UI implementation
* full analytics dashboard
* canonical judgment metrics across the whole platform

---

# 6. Minimal Complete Slice

```text
choose one annotation task type
-> evaluate candidate or human outputs
-> compute agreed metrics
-> package a report that explains platform usability
```

---

# 7. Dependencies

Depends on:

* annotation dataset alignment
* output schema alignment
* one runnable annotation path

---

# 8. Team Ownership

Primary owner:

* **DS-C** for evaluation design and reporting

---

# 9. Acceptance Criteria

Accept when:

* at least one annotation task type has agreed evaluation metrics
* results are packaged in a way that can support demo or review
* metrics explain practical usability rather than only offline model score

---

# 10. Suggested PR Title

```text
feat: add annotation task evaluation metrics
```
