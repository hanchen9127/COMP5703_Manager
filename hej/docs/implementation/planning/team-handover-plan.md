# Team Handover Plan

Document: `team-handover-plan.md`
Version: v2.0
Status: Draft
Governance:

* Derived from `docs/implementation/planning/milestone-definition.md`
* Derived from `docs/implementation/planning/team-allocation.md`
* Derived from `docs/implementation/planning/integration-contract.md`
* Derived from `docs/implementation/planning/risk-register.md`

Purpose:

Define the practical handover plan for the remaining 8-week capstone implementation period.

This document is written for:

* Group A: DS-focused team
* Group B: CS-focused team
* the project lead reviewing and merging work into `main`

---

# 1. Delivery Goal

The target is not a collection of disconnected page demos.
The target is a coherent ToB-first governed workflow platform.

The intended Week 13 outcome is:

```text
Projects fully usable
Task workflow coherent end to end
One AI-assisted path working
One human-first path working
Review and dispute minimally runnable
DS task-family evidence defensible
Dashboard, Organizations, and Admin operational enough for demo use
```

Practical interpretation:

```text
roughly 80% of the ToB workspace
not marketplace scope
not full production hardening
```

---

# 2. Ownership Model

Work should be divided by workflow and authority, not by random page fragments.

## Group B — CS Track

Primary ownership:

```text
apps/hej-api (`hej-api`)
project and task APIs
project workspace
dashboard
organizations
admin
dispute workflow
shared persistence and authoritative workflow state
```

Authoritative boundaries:

```text
organization
project
task
task_item
workflow state
review
dispute
arbitration
export
```

## Group A — DS Track

Primary ownership:

```text
dataset alignment for annotation and judgement task families
human-first runtime validation for annotation and judgement
AI annotation and judgement candidate generation
real or fixture-backed import payloads
judgement task semantics
review-supporting analysis assets
task-family metrics and evaluation evidence
dataset candidate search and selection justification
AI-assisted task execution path
```

Contributing boundaries:

```text
candidate output
confidence
model version
judgement rationale assets
evaluation and error analysis
dataset quality and task-family suitability evidence
```

## Shared Boundary

Both groups must treat the following as frozen integration anchors once Week 4 begins:

```text
task_id
task_item_id
task_class
task_type
execution_mode
output_schema
candidate payload shape
reviewable item state transitions
```

Interpretation:

* `Task` is the workspace authority surface
* `TaskItem` is the operation target for annotate, judge, review, and dispute handling
* `queue` should only mean runtime monitoring for AI-assisted flows, never a synonym for `items`

---

# 3. Weekly Rhythm

The shared delivery target should be:

```text
at least 4 coherent PRs per week across the repo
```

This is a planning target, not a license to merge partial work.

Recommended weekly rhythm:

## Monday

```text
freeze the week's slices
confirm ownership and dependencies
identify shared contract changes early
```

## Mid-week

```text
ship small vertical slices
review integration risks
surface blockers quickly
```

## End of week

```text
merge only coherent slices
demo visible progress
update docs if contracts changed
```

Weekly review rule:

```text
if a PR changes task/item boundaries, queue semantics, schema terms, or DS-facing payloads, the affected docs must be updated in the same week
```

---

# 4. PR Discipline

Every PR merged into `main` should be:

```text
small enough to review
complete enough to demo or verify
scoped to one coherent slice
safe to merge without breaking the main workflow
```

Required PR properties:

* one semantic purpose
* lint or relevant checks passing
* no dead placeholder branch merged just to hit weekly counts
* docs updated if API, workflow, or integration contract changed
* screenshots or short demo notes for meaningful UI changes

Bad PR examples:

```text
"start task page"
"add mock api routes, real logic later"
"wip review redesign"
```

Good PR examples:

```text
feat: add project creation flow with persisted API state
feat: support judgement task output schema in task item work panel
fix: preserve dispute state transition in review workflow
```

---

# 5. Merge Gate

`main` should be treated as demoable at all times.

Before merge, the reviewer should be able to answer:

* Does this PR keep the current demo path intact?
* Does it preserve the shared workflow semantics?
* Does it cross a contract boundary without docs sync?
* Is it coherent enough that another student can safely build on it next week?

If the answer is unclear, the PR should wait.

Short rule:

```text
mergeability beats activity
```

---

# 6. Recommended 8-Week Shape

## Weeks 1-2

Focus:

```text
freeze canon-sensitive contracts
stabilize project and task APIs
make project workspace and task workspace structurally reliable
```

## Weeks 3-4

Focus:

```text
complete human-first path
attempt first real CS/DS integration
replace major placeholder workflow steps with persisted behavior
freeze first round of dataset, schema, and payload alignment
```

## Weeks 5-6

Focus:

```text
stabilize AI-assisted path
land judgement-capable workflow
bring review and dispute onto real data
```

## Weeks 7-8

Focus:

```text
complete ToB workspace breadth
close major gaps in dashboard, organizations, and admin
reduce breakage risk
prepare final coherent demo flow
```

---

# 7. Recommended 8-Week PR Delivery Map

The authoritative PR inventory now lives in `docs/implementation/prs/`.

Current planning count:

```text
39 PR specifications across global, project-portfolio, project-workspace, task-workspace, and task-item slices
```

This means the team should plan for:

```text
at least 4 coherent PRs per week
typically 4-5 PRs per week across both groups
```

Interpretation:

* this is a recommended delivery wave, not a hard serial dependency chain
* each weekly set should still produce coherent mergeable slices
* integration PRs should only land after the upstream contract-carrying PRs are stable
* DS-owned PRs should also leave behind runnable proof artifacts, not only model files or raw notebooks

## Week 1

Target PRs:

* `project-creation.pr.md`
* `project-governance-model.pr.md`
* `project-lifecycle.pr.md`
* `task-creation.pr.md`
* `task-lifecycle.pr.md`

Primary objective:

```text
freeze project and task creation semantics early
```

## Week 2

Target PRs:

* `projects-portfolio.pr.md`
* `project-overview.pr.md`
* `project-task-create-entry.pr.md`
* `task-item-import.pr.md`
* `task-schema-binding.pr.md`

Primary objective:

```text
make project entry and task bootstrapping visible and persisted
```

## Week 3

Target PRs:

* `project-tasks.pr.md`
* `task-setup.pr.md`
* `task-policy-binding.pr.md`
* `task-overview.pr.md`
* `task-items.pr.md`

Primary objective:

```text
stabilize the task workspace shell before item-level execution expands
```

## Week 4

Target PRs:

* `task-item-details.pr.md`
* `task-annotate-cs.pr.md`
* `task-judge-cs.pr.md`
* `task-history.pr.md`
* `candidate-payload-schema.pr.md`

Primary objective:

```text
complete one human-first path and freeze the DS-facing payload contract
```

## Week 5

Target PRs:

* `annotation-dataset-alignment.pr.md`
* `judgement-dataset-alignment.pr.md`
* `human-annotation-runtime-validation.pr.md`
* `human-judgement-runtime-validation.pr.md`
* `task-runtime-queue.pr.md`

Primary objective:

```text
prove that real task-family datasets and AI-runtime signals can enter the platform coherently
```

Expected evidence:

```text
dataset candidate comparison
final dataset justification
human-first runnable proof notes
```

## Week 6

Target PRs:

* `task-annotate-ds.pr.md`
* `task-judge-ds.pr.md`
* `task-annotate-integration.pr.md`
* `task-judge-integration.pr.md`
* `annotation-metrics.pr.md`

Primary objective:

```text
land one stable AI-assisted execution path and make it measurable
```

Expected evidence:

```text
schema-compliant candidate payloads
integration notes
at least one usable metrics artifact
```

## Week 7

Target PRs:

* `task-review.pr.md`
* `task-review-actions.pr.md`
* `task-disagreement-detection.pr.md`
* `task-dispute.pr.md`
* `judgement-metrics.pr.md`

Primary objective:

```text
make review and disagreement governance real rather than decorative
```

## Week 8

Target PRs:

* `project-disputes.pr.md`
* `project-exports.pr.md`
* `project-policies.pr.md`
* `dashboard.pr.md`

Primary objective:

```text
finish project-level operational visibility and demo-facing workspace breadth
```

Recommended guardrail:

```text
do not pull Week 7 or Week 8 governance surfaces forward if Weeks 1-6 workflow slices are still unstable
```

Handover guardrail:

```text
do not let decorative workspace breadth replace missing task-item execution or missing DS usability proof
```

---

# 8. Product Priority Order

When tradeoffs are needed, keep this order:

```text
Project workspace
-> Task execution path
-> Review
-> Dispute
-> Dashboard / Organizations / Admin breadth
-> Nice-to-have polish
```

Do not let peripheral polish displace workflow completion.

---

# 9. Fallback Rule

If a full AI-assisted integration path slips, the teams should still preserve:

```text
real project and task workflow
real task item persistence
human-first execution
review state transition
visible dispute path
```

That fallback is still defensible because it preserves the platform's core identity.
