# Risk Register

Document: `risk-register.md`
Version: v2.0
Status: Draft
Governance:

* Derived from `docs/design/system/system_design.md`
* Derived from `docs/implementation/planning/integration-contract.md`
* Derived from `docs/implementation/planning/demo-scenarios.md`

Purpose:

Track the major risks that could derail delivery of the shared-core platform.

This register is written for the real execution model of the capstone:

* 2 groups
* 8 students in CS
* 8 students in DS
* one shared system goal
* different implementation emphases
* Week 4 integration attempt
* independent fallback demos if integration is partial

---

# 1. Severity Scale

Likelihood:

```text
Low
Medium
High
```

Impact:

```text
Low
Medium
High
Critical
```

Priority is evaluated as:

```text
Likelihood x Impact
```

---

# 2. Risk 1 — CS and DS Never Actually Integrate

Description:

Both teams make progress, but the DS outputs never successfully enter the CS workflow.

Typical failure patterns:

* mismatched `task_item_id`
* incompatible output schema assumptions
* DS predicts against a different task definition than the platform owns
* import pipeline is started too late

Likelihood:

```text
High
```

Impact:

```text
Critical
```

Mitigation:

```text
freeze exchange format early
prepare import fixtures by Week 3
attempt one real integration in Week 4
assign one CS integration subgroup and one DS integration subgroup
```

Fallback:

```text
CS uses mock prediction fixtures
DS demos standalone prediction pipeline and evaluation outputs
```

Owner:

```text
cross-track integration leads
```

---

# 3. Risk 2 — Shared Core Gets Diluted by Side Features

Description:

Students spend time on peripheral ideas and fail to complete the core workflow.

Examples:

```text
marketplace concepts
profile systems
payment or payout logic
advanced reputation features
visual polish without workflow completion
```

Likelihood:

```text
High
```

Impact:

```text
High
```

Mitigation:

```text
keep shared-core-first rule visible
evaluate milestones against demo scenarios
reject scope that does not strengthen organization/project/task/review/dispute/export
```

Fallback:

```text
feature freeze
drop extension ideas
recover around the shared-core demo path
```

Owner:

```text
project lead and both group leads
```

---

# 4. Risk 3 — Platform Becomes Only a CRUD Annotation App

Description:

The CS team ships project/task creation plus labels, but not the governance identity of the platform.

Missing pieces may include:

```text
review
history
data pointer boundary
tenant scope
```

Likelihood:

```text
Medium
```

Impact:

```text
High
```

Mitigation:

```text
define minimal working slice around reviewable task items
keep review and history in the MWS
make demos show organization -> project -> task -> items/review/history
```

Fallback:

```text
reduce breadth but preserve one complete reviewable workflow item
```

Owner:

```text
CS lead
```

---

# Additional Risk — PR Volume Outruns Review Quality

Description:

The teams produce the desired PR volume, but PRs are too partial, too broad, or too weakly reviewed to merge safely into `main`.

Examples:

```text
UI-only PR without real state handling
API shape changed without docs sync
half-finished feature branches merged to hit weekly counts
multiple unrelated fixes bundled into one hard-to-review PR
```

Likelihood:

```text
High
```

Impact:

```text
High
```

Mitigation:

```text
require each PR to be a coherent slice
require lint or relevant checks before review
tie PR review against milestone and contract documents
reject placeholder-only work from main
```

Fallback:

```text
reduce weekly PR target pressure
prefer fewer mergeable slices over many partial PRs
stabilize with a short merge freeze if main quality drops
```

Owner:

```text
project lead and both group leads
```

---

# 5. Risk 4 — Workflow State Model Drifts Across Frontend and Backend

Description:

The UI suggests one lifecycle while backend state handling implements another.

Examples:

```text
task setup page assumes states not supported by API
items and review screens use status names different from backend
dispute or export surfaces imply transitions that do not exist
```

Likelihood:

```text
Medium
```

Impact:

```text
High
```

Mitigation:

```text
tie UI flows to documented workflow states
review frontend pages against backend route design weekly
keep one shared vocabulary for states and actions
```

Fallback:

```text
restrict demo to the implemented state path
hide incomplete state branches from UI
```

Owner:

```text
frontend lead + backend lead
```

---

# 6. Risk 5 — External Data Pointer Strategy Breaks Demos

Description:

The platform correctly avoids hosting raw data, but external data retrieval becomes unreliable.

Examples:

```text
broken pointers
expired access
inconsistent local versus remote paths
```

Likelihood:

```text
Medium
```

Impact:

```text
High
```

Mitigation:

```text
prepare stable local demo pointer fixtures
define one deterministic pointer format for demos
separate pointer registration from live remote retrieval complexity
```

Fallback:

```text
use local fixture-backed pointers while preserving the same platform semantics
```

Owner:

```text
CS platform core subgroup
```

---

# 7. Risk 6 — Annotation Runtime Integration Consumes Too Much Time

Description:

The team over-invests in one annotation runtime or runtime-specific behavior and starves the core workflow implementation.

Likelihood:

```text
High
```

Impact:

```text
Medium
```

Mitigation:

```text
treat annotation runtime as replaceable integration
keep a stub annotation input path available
avoid making runtime integration the blocker for review/history flows
```

Fallback:

```text
simple internal annotation form or mock annotation surface
```

Owner:

```text
CS annotation integration subgroup
```

---

# 8. Risk 7 — DS Model Quality Is Too Weak or Too Late

Description:

The DS team may deliver candidates that are too weak, too late, or not defensible for the chosen task family.

Likelihood:

```text
Medium
```

Impact:

```text
Medium
```

Mitigation:

```text
start with baseline models
use rule-based or heuristic fallback if needed
optimize for importable output before optimizing for best quality
freeze dataset selection early
require runnable proof notes and at least one metrics artifact for the chosen task family
```

Fallback:

```text
deliver baseline predictions plus evaluation report and explicit dataset/task-family limitations
```

Owner:

```text
DS lead
```

---

# 9. Risk 8 — Uneven Contribution in a 16-Person Project

Description:

A two-group, 16-person project can hide uneven contribution until late.

Likelihood:

```text
High
```

Impact:

```text
High
```

Mitigation:

```text
assign named ownership by module or surface
run weekly accountability check-ins
require demo-visible deliverables from subgroups
```

Fallback:

```text
reassign ownership
compress scope around strongest contributors and core workflow
```

Owner:

```text
project supervisor + group leads
```

---

# 10. Risk 9 — Week 4 Integration Attempt Is Avoided

Description:

Teams postpone integration until it is too late.

Likelihood:

```text
High
```

Impact:

```text
Critical
```

Mitigation:

```text
schedule Week 4 integration as a hard milestone
define minimum success as one importable prediction file and one visible AI-assisted review item
```

Fallback:

```text
freeze on file-based import
defer live API integration
continue with separate fallback demos while preserving the contract
```

Owner:

```text
integration leads
```

---

# 11. Risk 10 — Terminology and Surface Boundaries Drift Again

Description:

Teams reintroduce ambiguity around task versus task_item responsibilities, or reuse `queue` as an alias for `items`.

Examples:

```text
task-level desk pages treated as item editors
item-level actions described as task-owned state
queue reused to mean items list, workload count, and runtime monitor at the same time
```

Likelihood:

```text
Medium
```

Impact:

```text
High
```

Mitigation:

```text
keep workspace hierarchy doc and terminology docs visible
require same-week doc updates when surface semantics change
review task and task-item PRs against the agreed hierarchy before merge
```

Fallback:

```text
hide or relabel ambiguous routes
restrict demos to the stable surface names already documented
```

Owner:

```text
project lead + frontend lead + backend lead
```

---

# 12. Risk 11 — Demo Failure Despite Working Components

Description:

The system may technically work, but the demo fails because the scenario is not rehearsed or data is missing.

Likelihood:

```text
Medium
```

Impact:

```text
High
```

Mitigation:

```text
freeze one canonical demo dataset
rehearse role sequence
prepare seeded accounts
prepare a step-by-step demo script
```

Fallback:

```text
backup fixture data
backup API screenshots
backup walkthrough video
```

Owner:

```text
demo lead
```

---

# 13. Monitoring Process

Risks should be reviewed:

```text
weekly
```

At each review, record:

```text
current status
new evidence
mitigation progress
whether fallback must be prepared now
```

---

# 14. Escalation Rule

A risk should be escalated immediately if:

* it threatens the Week 4 integration attempt
* it threatens the shared-core demo path
* it introduces dependency on out-of-scope marketplace features
* it blocks one group without a defined fallback path

---

# 15. Summary

The dominant risks in this project are not generic software risks.
They are:

* delayed CS/DS integration
* loss of shared-core focus
* weak workflow semantics
* terminology or surface-boundary drift
* unstable external-data and annotation-runtime assumptions
* coordination failure in a 16-person team

If these are managed well, the project remains viable even when some integration work is late.
