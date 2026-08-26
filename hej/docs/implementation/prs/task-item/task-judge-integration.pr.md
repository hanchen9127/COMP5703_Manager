# task-judge-integration.pr.md

Status: Draft  
Owner track: Shared integration PR between Group A DS and Group B CS  
Primary milestone: M3 AI and Judgement Integration  
Suggested submission window: Week 6  
PR type: cross-team integration PR

---

# 1. Summary

Deliver the integrated **AI-assisted judgement** path:

```text
task configured as ai_assisted
-> task items exist
-> DS judgement candidates arrive
-> platform shows verdict candidates and rationale
-> reviewer can inspect them downstream
```

---

# 2. Objective

Prove the AI-assisted judgement path end to end by connecting:

* task execution mode and decision schema from setup
* DS verdict payload
* candidate ingestion
* judgement desk and review visibility
* downstream review entry

---

# 3. Governance Basis

Derived from:

* `docs/implementation/planning/integration-contract.md`
* `docs/design/processes/project/task-process-map.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/implementation/planning/minimal-working-slice.md`

Key implications:

* judgement remains a first-class task class
* AI-assisted is task-configured and optional
* candidate verdicts must stay explicitly reviewable
* if a dedicated `Queue` surface is introduced later, it should monitor candidate-generation runtime rather than replace the item desk

---

# 4. In Scope

Include:

* ingestion of judgement candidate payload
* candidate visibility in items / judge / review
* item state progression into candidate-available posture
* one demonstrated review handoff

---

# 5. Out of Scope

Do not include:

* automatic canonical judgement without review
* model retraining loop
* arbitration workflow

---

# 6. Minimal Complete Slice

```text
create ai-assisted judgement task
-> generate or import task items
-> ingest one batch of verdict candidates
-> open judge desk
-> inspect candidate verdicts and rationale
-> continue into review
```

---

# 7. Dependencies

Depends on:

* task setup exposing decision schema and execution mode
* task items
* DS judgement payload
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

* one AI-assisted judgement task can display imported verdict candidates
* rationale and confidence are visible in agreed shape
* users can move from candidate visibility into reviewable judgement flow

---

# 10. Suggested PR Title

```text
feat: integrate ai-assisted judgement path
```
