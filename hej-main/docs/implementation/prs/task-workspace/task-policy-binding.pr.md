# task-policy-binding.pr.md

Status: Draft  
Owner track: Group B / CS-C Dispute, Admin, and Control Surfaces + CS-A Platform Core and API + CS-B Project and Task Workspace Frontend  
Primary milestone: M3 AI and Judgement Integration  
Suggested submission window: Week 5  
PR type: task setup governance PR

---

# 1. Summary

Deliver **task policy binding** in setup.

This PR covers the task-level governance rules that shape review, disagreement detection, dispute routing, and AI fallback posture.

---

# 2. Objective

Make task policy posture operational by:

* showing review policy and dispute policy clearly in setup
* exposing sampling or cross-validation posture where configured
* showing AI-assisted fallback posture
* providing stable downstream rule visibility for review and dispute surfaces

---

# 3. Governance Basis

Derived from:

* `docs/terminology/task-schema-and-policy.md`
* `docs/design/processes/project/task-process-map.md`
* `docs/design/product/workflow_states.md`
* `docs/implementation/planning/demo-scenarios.md`

Key implications:

* policy is configured in setup, not invented in review or dispute
* dispute should prefer auto-detected disagreement
* AI-assisted fallback posture must be explicit before execution starts

---

# 4. In Scope

Include:

* review policy visibility in setup
* dispute policy visibility in setup
* sampling / cross-validation rule visibility
* AI fallback-to-human-first posture visibility
* task read contract support for downstream rule consumers

---

# 5. Out of Scope

Do not include:

* actual review action UI
* actual dispute desk UI
* full project-level policy console

---

# 6. Minimal Complete Slice

```text
open task setup
-> inspect review and dispute policy posture
-> inspect sampling or cross-validation rule
-> understand how downstream review or dispute will be triggered
```

---

# 7. Dependencies

Depends on:

* task setup
* schema binding

---

# 8. Team Ownership

Primary owners:

* **CS-C** for policy semantics
* **CS-A** for contract and persistence
* **CS-B** for setup visibility

---

# 9. Acceptance Criteria

Accept when:

* review and dispute policy are visible at task setup
* sampling or cross-validation posture is understandable
* downstream review and dispute docs no longer need to invent missing rules

---

# 10. Suggested PR Title

```text
feat: bind task review and dispute policy
```

