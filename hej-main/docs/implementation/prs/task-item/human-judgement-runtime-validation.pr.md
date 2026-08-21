# human-judgement-runtime-validation.pr.md

Status: Draft  
Owner track: Group A / DS-C Review, Judgement, and Integration Packaging + coordination with Group B CS  
Primary milestone: M3 AI and Judgement Integration  
Suggested submission window: Week 5  
PR type: DS runtime validation PR

---

# 1. Summary

Validate that human-first judgement can run against real task-aligned data and decision schema.

This PR proves the platform can support real judgement work, not just annotation-flavored tasks.

---

# 2. Objective

Prove human-first judgement usability by:

* validating one judgement task type end to end
* checking verdict and rationale fit against real examples
* confirming the runtime or workbench can support the intended decision process
* surfacing schema or UX mismatch early

---

# 3. Governance Basis

Derived from:

* `docs/design/processes/project/task-process-map.md`
* `docs/design/ds/ds_task_dataset_matrix.md`
* `docs/terminology/task-schema-and-policy.md`
* `docs/implementation/planning/minimal-working-slice.md`

Key implications:

* judgement is a first-class execution path
* rationale-bearing outputs must be validated against real work
* DS should prove the decision schema is usable in practice
* validated output must remain review-compatible

---

# 4. In Scope

Include:

* one validated human-first judgement flow
* decision-schema fit validation
* verdict and rationale usability checks
* evidence that outputs can re-enter platform review workflow

---

# 5. Out of Scope

Do not include:

* model inference
* review UI
* arbitration logic

---

# 6. Minimal Complete Slice

```text
choose one judgement task type
-> load real task-aligned examples
-> run human-first judgement
-> confirm verdict and rationale match platform expectations
```

---

# 7. Dependencies

Depends on:

* judgement dataset alignment
* decision schema clarity
* CS judgement entry surface

---

# 8. Team Ownership

Primary owner:

* **DS-C** for runtime validation and handoff packaging

Coordination:

* **CS-B** for human-judgement entry expectations

---

# 9. Acceptance Criteria

Accept when:

* one human-first judgement flow is validated against real examples
* verdict and rationale shape match platform expectations
* practical judgement-runtime blockers are visible early

---

# 10. Suggested PR Title

```text
feat: validate human-first judgement runtime
```
