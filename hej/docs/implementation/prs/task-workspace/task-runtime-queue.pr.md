# task-runtime-queue.pr.md

Status: Draft  
Owner track: Shared integration PR between Group A DS and Group B CS  
Primary milestone: M4 ToB Workspace Completion  
Suggested submission window: Week 6-7  
PR type: task runtime monitoring PR

---

# 1. Summary

Deliver a dedicated **task runtime queue** surface for AI-assisted execution.

This is not the task item index. It is the runtime monitor for candidate-generation progress, backlog, and blocked processing.

---

# 2. Objective

Make AI-assisted runtime monitoring operational by:

* showing candidate-generation progress
* surfacing blocked or delayed item processing
* exposing backlog and throughput posture
* helping users understand whether AI-assisted work is ready to enter item-level execution or review

---

# 3. Governance Basis

Derived from:

* `docs/terminology/queue.md`
* `docs/design/processes/project/task-process-map.md`
* `docs/implementation/planning/integration-contract.md`
* `docs/implementation/planning/demo-scenarios.md`

Key implications:

* `Queue` must remain distinct from `Items`
* this surface is most relevant for ai_assisted tasks
* human-first tasks may show a lighter or empty version of the same runtime posture

---

# 4. In Scope

Include:

* runtime status summary for ai_assisted tasks
* candidate-generation or import progress
* blocked / delayed / ready counts
* route back into task items, annotate or judge, or review when outputs are ready

---

# 5. Out of Scope

Do not include:

* neutral task-item browsing
* full annotate or judge workbench
* review decisions

---

# 6. Minimal Complete Slice

```text
open one ai-assisted task
-> open runtime queue
-> inspect candidate-generation progress and backlog
-> identify whether items are ready for item-level work or review
```

---

# 7. Dependencies

Depends on:

* ai_assisted execution mode
* DS candidate generation or import signals
* task items existing

---

# 8. Team Ownership

Primary owners:

* **DS** for runtime signal generation
* **CS-A** for runtime status contract
* **CS-B** for runtime queue page visibility

---

# 9. Acceptance Criteria

Accept when:

* `Queue` is no longer confused with `Items`
* ai_assisted runtime progress is visible in one dedicated place
* users can tell whether to wait, inspect items, or move to review

---

# 10. Suggested PR Title

```text
feat: add task runtime queue for ai-assisted execution
```

