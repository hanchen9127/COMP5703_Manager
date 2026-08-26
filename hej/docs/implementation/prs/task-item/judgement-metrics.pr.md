# judgement-metrics.pr.md

Status: Draft  
Owner track: Group A / DS-C Review, Judgement, and Integration Packaging  
Primary milestone: M4 ToB Workspace Completion  
Suggested submission window: Week 6-7  
PR type: DS evaluation PR

---

# 1. Summary

Deliver judgement-task evaluation metrics that prove the platform can support real judgement work with measurable quality.

---

# 2. Objective

Make judgement quality measurable by:

* defining verdict-oriented metrics
* evaluating rationale quality or agreement signal where possible
* showing whether AI-assisted judgement is useful before review
* supporting demoable evidence that the judgement path is practical

---

# 3. Governance Basis

Derived from:

* `docs/design/ds/ds_task_dataset_matrix.md`
* `docs/implementation/planning/team-allocation.md`
* `docs/implementation/planning/integration-contract.md`
* `docs/terminology/task-schema-and-policy.md`

Key implications:

* judgement metrics should follow decision schema semantics
* DS should prove more than raw model accuracy
* metrics should help explain disagreement and review load

---

# 4. In Scope

Include:

* metric definition for one or more judgement task types
* evaluation dataset or fixture alignment
* report shape for verdict quality, rationale quality, or agreement signal
* demo-ready summary of what the results mean

---

# 5. Out of Scope

Do not include:

* review UI implementation
* full analytics dashboard
* arbitration metrics

---

# 6. Minimal Complete Slice

```text
choose one judgement task type
-> evaluate candidate or human judgement outputs
-> compute agreed metrics
-> package a report that explains platform usability
```

---

# 7. Dependencies

Depends on:

* judgement dataset alignment
* decision schema alignment
* one runnable judgement path

---

# 8. Team Ownership

Primary owner:

* **DS-C** for evaluation design and reporting

---

# 9. Acceptance Criteria

Accept when:

* at least one judgement task type has agreed evaluation metrics
* results are packaged in a way that can support demo or review
* metrics explain practical judgement usability rather than only raw model score

---

# 10. Suggested PR Title

```text
feat: add judgement task evaluation metrics
```
