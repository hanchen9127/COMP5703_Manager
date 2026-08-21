# task-setup.pr.md

Status: Draft  
Owner track: Group B / CS-A Platform Core and API + CS-B Project and Task Workspace Frontend  
Primary milestone: M2 Project and Task Workflow  
Suggested submission window: Week 4-5  
PR type: full-stack configuration PR

---

# 1. Summary

Deliver `/tasks/{taskId}/setup` as the authoritative **task setup** surface.

This PR should make it obvious whether a task is properly configured and ready to leave `DRAFT`.

---

# 2. Objective

Make task setup operational by:

* surfacing configuration completeness
* showing class, type, mode, data source, rules, and schema clearly
* supporting update of setup fields where needed
* making launch readiness legible before activation
* making high-level intake and governance posture explicit before execution begins

---

# 3. Governance Basis

Derived from:

* `docs/design/processes/project/task-process-map.md`
* `docs/design/processes/project/task-ux-breakdown.md`
* `docs/design/product/workflow_states.md`
* `docs/design/product/workspace_surface_hierarchy.md`
* `docs/terminology/task-schema-and-policy.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/implementation/planning/milestone-definition.md`
* `docs/implementation/planning/minimal-working-slice.md`

Key implications:

* setup is the `DRAFT`-phase authority surface
* task class, task type, and execution mode must remain distinct
* review and dispute should not lead setup framing

---

# 4. In Scope

Include:

* `/tasks/{taskId}/setup` page composition
* setup summary header or checklist
* class / type / mode visibility
* data source or pointer readiness visibility
* shared rules or judgement instructions
* output schema and review policy visibility
* AI-assisted enablement posture and fallback-to-human-first posture
* launch-readiness messaging
* setup update contract if current implementation supports editing

Likely touched surfaces:

* `apps/hej-web/app/tasks/[taskId]/setup/page.tsx`
* `apps/hej-web/components/task-setup-scaffold.tsx`
* setup-related task API surfaces

---

# 5. Out of Scope

Do not include:

* first-pass annotate or judge workbench
* review action handling
* dispute management
* export generation

This PR may show readiness warnings, but it should not implement a separate approval engine.

---

# 6. Minimal Complete Slice

The smallest acceptable PR is:

```text
open task setup
-> understand current task configuration
-> see what is missing
-> understand whether task is ready to leave draft
```

If editing is in scope, one update path should persist and re-render correctly.

---

# 7. Dependencies

Depends on:

* task creation flow
* task retrieval API
* task lifecycle vocabulary

Helpful but not strictly blocking:

* item import PR
* schema binding PR
* policy binding PR

---

# 8. Team Ownership

Primary owners:

* **CS-A** for setup data contract and persistence
* **CS-B** for setup page UX, readability, and readiness signals

Coordination:

* DS if setup wording touches AI-assisted or judgement-specific assets

---

# 9. Acceptance Criteria

Accept when:

* task setup clearly explains current configuration
* users can see class, type, execution mode, data source posture, and rules
* users can see where output schema / decision schema and review or dispute policy are coming from
* launch readiness is visible and defensible
* task setup feels like a runnable task configuration surface, not a review backlog

---

# 10. Demo Expectation

Expected demo flow:

```text
open one task in draft
-> inspect setup
-> confirm data source, rules, and mode
-> show whether the task is ready to activate
```

---

# 11. Suggested PR Title

```text
feat: operationalize task setup and launch readiness
```
