# Development Workflow

Version: v1.1
Status: Active
Audience: Student Contributors

Governance:

* Read this document immediately after the project README
* This document is governed by the Project Canon, System Design, Task Tree, Milestone Definition, Quality Gate, and GitHub Governance Pack
* In case of conflict, higher-level governance documents take precedence

Purpose:
This document explains **how students are expected to work in this project**.
It defines:

* how to start work
* how to pick up tasks
* how to use GitHub correctly
* how to submit code
* how milestone review and acceptance work

This is the primary day-to-day workflow guide for all contributors.

---

# 1. What This Project Is

This project is not just a coding exercise.
It is a structured AI and Software Engineering project aiming for production-grade implementation and delivery.

You are not only expected to:

* write code
* make demos work

You are also expected to:

* preserve architecture
* keep the repository clean
* submit reviewable code
* follow milestone-based delivery
* explain your technical decisions

---

# 2. What You Must Read First

Before starting development, everyone must read:

1. `README.md`
2. `dev-workflow.md`  ← this file
3. `docs/governance/repo-structure.md`
4. `quality-gate.md`
5. `docs/implementation/planning/milestone-definition.md`
6. `docs/implementation/planning/task-tree.md`
7. `docs/team-discipline/ai-coding-guidelines.md`
8. `docs/team-discipline/project-ai-coding-profile.md`

If you are working on architecture-heavy or integration-heavy tasks, you must also read:

9. `docs/design/system/system_design.md`
10. `docs/implementation/planning/integration-contract.md`
11. `docs/design/backend/backend_module_map.md`

[IMPORTANT] Do not start implementation before understanding where your work fits.

---

# 3. Core Working Principles

## 3.1 Follow the Architecture

Do not create your own folder structures, service patterns, or random helper files.

You must follow:

* the defined repo structure
* the existing module boundaries
* the system design

If you think the current design is wrong, do not silently change it.
Raise an issue to your superviosr/leader or PR discussion first.

---

## 3.2 Work from the Task Tree

Do not invent features.
Do not work directly from vague ideas.

You should work from:

* Milestone
* Epic
* Story
* Task

Every code change should map back to a task.

---

## 3.3 Small, Reviewable Changes

Do not submit giant PRs.
Do not mix unrelated work.

One PR should ideally correspond to:

* one task, or
* one very small story slice

---

## 3.4 Clean Code Over Clever Code

This project values:

* readability
* consistency
* modularity
* maintainability

more than:

* over-engineering
* unusual abstractions
* unnecessary optimization

---

## 3.5 Demoable Progress

Every milestone must produce something that can be demonstrated (and more importantly, code quality is reviewed at deployable level).

If your code cannot contribute to a visible workflow, it is probably not in the right shape yet.

---

# 4. Team Structure

This project has two main tracks.

## 4.1 CS Track

Focus:

* platform backend
* workflow logic
* annotation integration
* review / dispute / export

## 4.2 DS Track

Focus:

* LLM/VLM annotation pipeline
* prediction generation
* output formatting
* confidence / evaluation

## 4.3 Integration

The two tracks are connected by the integration contract.

The AI system does not own the platform.
The platform does not own model development.

Integration happens through a stable contract, not through ad hoc coupling.

---

# 5. Standard Development Workflow

Follow this sequence for every task.

## Step 1 — Understand the Task

Before coding, confirm:

* which milestone it belongs to
* which Epic / Story / Task ID it maps to
* which module it belongs to
* whether it affects integration, schema, or architecture

If this is unclear, stop and ask.

---

## Step 2 — Check Module Ownership

Before touching code, confirm:

* who owns the module
* whether another subgroup is already working on it
* whether your change crosses module boundaries

Do not directly modify another team’s module without coordination.

---

## Step 3 — Create a Branch

Branch from `develop`.

Branch naming:

* `feature/<short-name>`
* `fix/<short-name>`
* `refactor/<short-name>`
* `docs/<short-name>`

Examples:

* `feature/task-api`
* `feature/llm-inference`
* `fix/export-builder`

Do not commit directly to:

* `main`
* `develop`

---

## Step 4 — Implement in the Correct Layer

Use the correct repository structure.

Examples:

* web pages go in `apps/hej-web/app/` for the current `hej-web` app
* web feature components go in `apps/hej-web/components/` for the current `hej-web` app
* shared UI primitives go in `packages/ui/`
* API routes go in `apps/hej-api/app/api/routes/` for the current `hej-api` service
* backend domain logic should trend toward `apps/hej-api/app/domains/`
* external integrations go in `apps/hej-api/app/integrations/`

Do not:

* put business logic in route files
* put SQL logic inside UI code
* scatter the same logic in multiple folders

---

## Step 5 — Test Locally

Before opening a PR, you must at minimum:

* run the relevant app / script
* test the expected flow locally
* run lint / formatting checks where applicable

You do not need perfect coverage for every small task, but you must confirm your change works.

---

## Step 6 — Run the Mandatory AI Review

Before opening a PR, run the required AI review prompts.

You must check:

1. architecture cleanliness
2. submission readiness
3. code quality
4. design consistency

Document the results in:

* `ai-review-report.md`

Do not skip this step.

---

## Step 7 — Open a Pull Request

Use the PR template.

You must include:

* summary
* module(s) affected
* milestone
* Epic / Story / Task IDs
* requirement IDs if relevant
* testing summary
* architecture impact
* AI review summary

A PR without this information is incomplete.

---

## Step 8 — Request Review

A PR is not ready to merge until it has:

* module owner review
* architecture owner review when needed
* passing CI checks

If your PR changes:

* schema
* integration contract
* module boundaries
* workflow state logic

then architecture review is mandatory.

---

## Step 9 — Merge Only After Approval

Do not merge your own PR unless project rules explicitly allow it.

Normal rule:

* merge only after approvals
* merge only after CI passes

---

# 6. What Good Work Looks Like

A strong contribution has these properties:

* clearly maps to a task
* follows repo structure
* changes only relevant modules
* is small enough to review
* includes basic validation/testing
* can be explained clearly
* does not break other flows

---

# 7. What Bad Work Looks Like

These are common failure patterns.

## 7.1 Random Files

Examples:

* `test2.py`
* `experiment_final_v4.py`
* `new_api_temp.py`

Do not create these in the main codebase.

---

## 7.2 Hidden Architecture Changes

Examples:

* moving logic to new folders without agreement
* changing shared payload shapes without updating contract docs
* adding new service patterns inconsistently

---

## 7.3 Giant PRs

Examples:

* 20 unrelated changes in one PR
* backend + frontend + schema + docs + refactor all mixed together

These are very hard to review and often rejected.

---

## 7.4 “Works on My Machine” Submission

Examples:

* missing config
* hidden dependency
* local-only path assumptions
* hardcoded credentials or paths

This is not acceptable.

---

# 8. Repository Rules

You must follow `docs/governance/repo-structure.md`.

Top-level expected folders:

* `apps/`
* `packages/`
* `infrastructure/`
* `supabase/`
* `docs/`

You must not create new top-level directories casually.

If you think a new module is needed, raise it first.

---

# 9. Milestone Workflow

Each milestone follows the same structure.

## 9.1 During the Milestone

* work from assigned tasks
* keep PRs small
* integrate continuously
* do not wait until the last week to merge

## 9.2 48 Hours Before Review

Code freeze begins.

From this point:

* no new features
* bug fixes only
* cleanup and testing only

## 9.3 Before Submission

Each team must submit:

* working demo
* `submission-checklist.md`
* `ai-review-report.md`
* cleaned repository

## 9.4 During Review

You may be asked to explain:

* why your module exists
* why code is organized the way it is
* how your implementation fits the system design
* what is still unfinished

If you cannot explain your code, that is a problem even if AI helped generate it.

---

# 10. Demo Expectations

A milestone review is not a code walkthrough.

It must show:

* user action
* system behavior
* visible result

Examples:

* create task
* annotate item
* import AI prediction
* review annotation
* export dataset

Demo should run from `dev` or `main` branch, instead of any feature branch.

If a milestone cannot be demonstrated, it is not complete.

---

# 11. CI and Quality Gates

Your PR must respect the quality gates.

Required checks include:

* lint
* formatting
* basic tests
* repo structure checks

Passing CI is necessary but not sufficient.

A milestone can still fail if:

* the architecture is messy
* the code is not submission-ready
* the demo flow is broken

---

# 12. How to Use AI Correctly

AI is allowed and expected to be used.

But AI must be used as:

* coding assistant
* review assistant
* explanation assistant

AI must not replace understanding.

## Acceptable use

* generate boilerplate
* suggest refactors
* review architecture cleanliness
* explain design patterns

## Unacceptable use

* merging code you do not understand
* submitting AI-generated code without testing
* changing architecture because AI suggested it casually

If AI writes code, you are still responsible for:

* correctness
* structure
* explanation

All of the changes made by AI (incl. codes, design, patterns, architecture, files, folders, docs, etc.) 
MUST be reviewed by the developer, and reviewed by the approver for PR.

## Three-Step AI Coding Strategy

AI often does not follow structural guidelines during generation.

To reduce this risk, always use a two-step workflow.

**Step 1 – Discuss**

Discuss your idea/intention with AI to reach agreement/design/solution.

**Step 2 — Generate**

Ask AI to implement the feature.

**Step 3 — Review**

Ask AI again to review the code for:
- architectural consistency
- unnecessary complexity
- file size and modularity

---

# 13. Communication Rules

## Weekly Team Sync

Each subgroup should report:

* completed tasks
* blocked tasks
* architecture concerns
* integration concerns

## When to Escalate Early

Raise issues immediately if:

* integration contract is unclear
* schema may need to change
* module ownership is unclear
* your change will block another subgroup

Do not wait until milestone review.

---

# 14. Submission Package

A proper milestone submission includes:

1. updated code in repository
2. open or merged PRs
3. passing CI
4. `submission-checklist.md`
5. `ai-review-report.md`
6. demo script or scenario
7. updated docs if architecture or structure changed

A demo without a clean submission package is incomplete.

---

# 15. Questions You Should Always Be Able to Answer

Before submitting work, make sure you can answer:

1. What task does this code implement?
2. Which module owns this logic?
3. Why is this file located here?
4. What are this change’s dependencies?
5. How was it tested?
6. Does it affect schema or integration?
7. Can it be demonstrated?

If you cannot answer these, your work is probably not ready.

---

# 16. Final Principle

This project is not judged by how much code exists.
It is judged by whether the codebase is:

* working
* clean
* structured
* reviewable
* explainable

The expected standard is:

> code that another engineer can understand, review, run, and extend.
