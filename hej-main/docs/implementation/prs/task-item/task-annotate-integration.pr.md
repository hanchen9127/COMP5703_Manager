# task-annotate-integration.pr.md

Status: Draft  
Owner track: Shared integration PR between Group A DS and Group B CS  
Primary milestone: M3 AI and Judgement Integration  
Suggested submission window: Week 6  
PR type: cross-team integration PR

---

# 1. Summary

Deliver the integrated **AI-assisted annotation** path:

```text
task configured as ai_assisted
-> task items exist
-> DS annotation candidates arrive
-> platform shows candidates at task scope
-> user can open one item and continue into reviewable work
```

---

# 2. Objective

Prove the AI-assisted annotation path end to end by connecting:

* task execution mode from setup
* DS candidate payload
* candidate ingestion or fixture loading
* task-level annotation desk visibility
* downstream review entry

---

# 3. Governance Basis

Derived from:

* `docs/design/product/annotation_strategy.md`
* `docs/implementation/planning/integration-contract.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/implementation/planning/minimal-working-slice.md`

Key implications:

* AI-assisted is task-configured, not default-global
* candidates must remain reviewable and non-canonical
* fallback to human-first should remain possible if AI is absent or fails
* if a dedicated `Queue` surface is introduced later, it should monitor candidate-generation runtime rather than replace the item desk

---

# 4. In Scope

Include:

* ingestion of DS annotation candidate payload
* item state update into candidate-available posture
* candidate visibility in items / annotate / review surfaces
* one demonstrated downstream handoff into review

---

# 5. Out of Scope

Do not include:

* model retraining loop
* automatic finalization without review
* complex queue operations console

---

# 6. Minimal Complete Slice

```text
create ai-assisted annotation task
-> generate or import task items
-> ingest one batch of annotation candidates
-> open annotate desk
-> see candidates on item rows
-> open one item
-> continue into review
```

---

# 7. Dependencies

Depends on:

* task setup exposing execution mode and schema
* task items
* DS annotation payload
* review desk

---

# 8. Team Ownership

Primary owners:

* **DS** for candidate payload readiness
* **CS-A** for ingestion and state transition
* **CS-B** for candidate visibility in workspace

---

# 9. Acceptance Criteria

Accept when:

* one AI-assisted annotation task can display imported candidates
* candidate output remains visibly non-canonical
* users can move from candidate visibility into reviewable item work

---

# 10. Suggested PR Title

```text
feat: integrate ai-assisted annotation path
```
