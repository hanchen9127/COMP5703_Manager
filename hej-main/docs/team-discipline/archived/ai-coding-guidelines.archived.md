-# AI Coding Guidelines

Version: v1.0
Status: Active
Primary Audience: Coding agents and human contributors using coding agents

Governance:

* Read this document before generating or modifying code
* This document is governed by the Project Canon, System Design, Repo Structure Standard, Quality Gate, Backend Module Map, and Student Development Workflow
* In case of conflict, higher-level governance documents take precedence

Purpose:
This document defines how code should be written in this project when development is performed by **humans working with AI coding agents**.

It is primarily written for coding agents, but humans are equally responsible for enforcing it.

This document covers:

* how to interpret the project structure
* how to generate code safely
* how to preserve architecture and module boundaries
* how to write code that is reviewable, maintainable, and submission-ready
* how to avoid common AI-generated code failures

This is **not** a generic style guide. It is a project-specific engineering discipline document.

---

# 1. Core Rule

The coding agent must optimize for:

* architectural consistency
* clarity of ownership
* maintainability
* demo reliability
* clean integration

The coding agent must **not** optimize for:

* maximum code output
* speculative abstraction
* cleverness
* unnecessary flexibility
* over-generalization

The project values:

> clean, understandable, correctly placed code

more than:

> fast but structurally damaging code generation.

---

# 2. Required Inputs Before Writing Code

Before generating code, the agent must understand the following context when relevant:

1. `README.md`
2. `student-dev-workflow.md`
3. `repo-structure-standard.md`
4. `quality-gate.md`
5. `system_design.md`
6. `backend_module_map.md`
7. `task-tree.md`
8. `integration-contract.md` (if integration-related)
9. `schema_blueprint.md` / `db_schema_strategy.md` (if data-related)

If the required context is missing, the agent must:

* avoid inventing architecture
* avoid creating new top-level structures
* prefer local minimal changes
* explicitly note uncertainty
* ask human for clarification and approval

---

# 3. Architectural Obedience

## 3.1 Respect Existing Module Boundaries

The agent must not move logic across modules casually – ask before act.

Examples:

* task lifecycle logic belongs to `tasks/`
* annotation candidate logic belongs to `annotation/`
* disagreement and review logic belongs to `review/`
* dispute lifecycle belongs to `disputes/`
* arbitration belongs to `arbitration/`
* provenance assembly belongs to `provenance/`
* export assembly belongs to `exports/`

If a requested change appears to cross modules, the agent must either:

* keep the change minimal and localized
* or explicitly mark architectural uncertainty

## 3.2 Do Not Invent New Architecture

The agent must not introduce:

* new top-level folders
* new service layers
* new patterns
* new orchestration modules
* new event systems
* microservices

unless explicitly requested and aligned with system design.

## 3.3 Prefer the Existing Pattern Over a Better-But-Different Pattern

If the current codebase uses a consistent pattern, the agent must follow it even if another pattern might also work.

Consistency is preferred over local elegance.

---

# 4. Layering Rules

The agent must preserve the following layering:

```text
API / Interfaces
    ↓
Services / Application Logic
    ↓
Repositories / Persistence Access
    ↓
Models / Schema
```

## 4.1 API Layer Rules

API route files may:

* parse inputs
* call services
* return responses

API route files must not:

* contain business workflow logic
* contain direct SQL / DB logic
* contain hidden integration logic

## 4.2 Service Layer Rules

Service files may:

* orchestrate business logic
* validate workflow state
* coordinate repositories
* call integration adapters

Service files should not:

* own raw SQL
* mix transport-specific behavior
* contain UI-specific logic

## 4.3 Repository Layer Rules

Repository files may:

* execute persistence queries
* load and save records

Repository files must not:

* contain workflow decisions
* interpret milestone logic
* decide review/dispute/arbitration state transitions

## 4.4 Integration Layer Rules

Integration files may:

* translate external payloads
* call external APIs/tools
* normalize external results

Integration files must not:

* become workflow owners
* own domain truth
* replace internal business logic

---

# 5. File and Module Rules

## 5.1 Create Files Only Where They Belong

The agent must place code in the correct directory.

Examples:

* backend route → `backend/api/`
* business logic → `backend/services/`
* db access → `backend/repositories/`
* external import adapter → `backend/integrations/`
* model inference → `ai_engine/inference/`
* prompt templates → `ai_engine/prompts/`
* test cases → `tests` folders

## 5.2 Do Not Create Junk Files

The agent must not create files such as:

* `test2.py`
* `new_logic_final.py`
* `temp_fix.py`
* `helper2.py`
* `experiment_v3.ipynb`

If a new file is required, its name must reflect a stable responsibility.

## 5.3 Prefer Modifying the Right Existing File

If a change belongs naturally in an existing module, prefer updating that file/module instead of creating parallel variants.

If a feature/function can form a single working unit in a large integrated file, extract it to a separete file.

---

# 6. Change Scope Rules

## 6.1 Keep Changes Narrow

Each generated change should solve one task or one tightly related story slice.

The agent should avoid broad refactors unless explicitly requested.

## 6.2 Do Not Mix Unrelated Changes

A single code generation action should not simultaneously:

* add schema changes
* refactor business logic
* redesign API responses
* rename modules
* change integration payloads

unless the task explicitly requires it.

## 6.3 Preserve Existing Behavior Unless the Task Requires Change

When modifying code, the agent must be conservative.
If existing behavior is not part of the task, do not alter it.

---

# 7. Data and Schema Rules

## 7.1 Respect the Data Model

The agent must follow the documented conceptual data model.

Examples:

* `TaskItem` is the atomic judgment unit
* `Annotation` is distinct from `Review`
* `Disagreement` is distinct from `DisputeCase`
* `CanonicalJudgment` is distinct from candidate labels

## 7.2 Preserve Source Distinction

AI-generated and human-generated annotations must remain distinguishable.

The agent must not collapse them into one ambiguous field.

## 7.3 Preserve Provenance-Relevant History

The agent must not replace append-preserving history with destructive overwrites in areas where lineage matters.

Examples:

* review history
* disagreement history
* dispute state history
* arbitration outcomes

## 7.4 Raw Client Data Must Remain External

The agent must not introduce code that stores raw client dataset content as canonical platform data unless explicitly authorized by design.

---

# 8. Workflow Rules

## 8.1 Respect Workflow States

The agent must preserve the documented workflow states and transitions.

It must not introduce shortcuts such as:

* direct finalization without valid preconditions
* creating canonical judgments without lineage
* resolving disputes by deleting disagreement data

## 8.2 Fail Closed on Authority-Sensitive Actions

For actions such as:

* arbitration decision submission
* canonical judgment publication
* export generation
* role assignment

if preconditions are unclear, the implementation should reject rather than guess.

## 8.3 Keep Demo Paths Reliable

The agent should favor explicit and reliable workflow paths that can be demonstrated.
Avoid fragile logic that only works under hidden assumptions.

---

# 9. Error Handling Rules

## 9.1 Never Fail Silently

The agent must not generate code that swallows exceptions or silently ignores invalid input in critical flows.

## 9.2 Return Explicit Failure States

When a failure occurs, the code should:

* signal the failure clearly
* preserve prior valid state
* make debugging possible

## 9.3 Do Not Hide Incomplete Logic

The agent must not disguise incomplete behavior as finished behavior.

Bad patterns:

* always returning success
* TODO logic in production path
* hidden fallback to dummy values

If placeholder logic exists, it must be clearly marked and isolated.

---

# 10. Testing Rules

## 10.1 Generate Testable Code

Code must be structured so that the main behavior can be tested.

The agent should prefer:

* explicit services
* pure validation logic where possible
* narrow functions
* clear inputs/outputs

## 10.2 Add Basic Tests for New Logic Where Appropriate

For non-trivial changes, the agent should add or update tests covering:

* expected success path
* expected failure path
* state transition correctness

## 10.3 Do Not Fake Test Coverage

The agent must not generate meaningless tests that merely execute code without asserting behavior.

---

# 11. Naming Rules

## 11.1 Use Clear, Stable Names

Prefer names that describe business meaning.

Good:

* `task_service.py`
* `annotation_repository.py`
* `review_outcome`
* `dispute_status`

Bad:

* `manager.py`
* `handler2.py`
* `misc_utils.py`
* `data_processor_final.py`

## 11.2 Name by Responsibility, Not Implementation Detail

Good:

* `export_builder.py`
* `ai_annotation_importer.py`

Bad:

* `json_helper.py`
* `new_parser.py`

---

# 12. Design Pattern Rules

## 12.1 Prefer Simple Patterns Already Present

Use project-consistent patterns such as:

* service + repository separation
* explicit adapters for integrations
* model/schema separation

## 12.2 Avoid Pattern Inflation

Do not introduce patterns such as:

* factories everywhere
* strategy abstractions without multiple real strategies
* abstract base class hierarchies without clear need
* generic managers with unclear ownership

## 12.3 Duplication vs Premature Abstraction

Small local duplication is acceptable if abstraction would be speculative.

The agent should only extract abstractions when:

* the duplication is real
* the boundary is stable
* the abstraction matches domain ownership

---

# 13. AI-Specific Anti-Patterns

These are common coding-agent failure modes and must be actively avoided.

## 13.1 Architecture Drift

The agent gradually creates new folders, new services, and parallel patterns over time.

Avoid by:

* checking existing structure first
* extending current modules instead of inventing new ones

## 13.2 Over-Generalization

The agent introduces configurable frameworks for future possibilities not required by the task.

Avoid by:

* implementing the simplest design that satisfies the documented requirement

## 13.3 Hidden Coupling

The agent introduces imports or shared helpers that create implicit module coupling.

Avoid by:

* preserving module ownership
* routing shared logic through appropriate service or platform utilities

## 13.4 Placeholder Completion Fraud

The agent generates code that looks complete but contains:

* placeholder return values
* fake success states
* incomplete branches

Avoid by:

* making incomplete logic explicit
* failing clearly if unsupported

## 13.5 Unowned Utility Explosion

The agent creates many generic helpers with unclear ownership.

Avoid by:

* placing helper logic inside the module that owns the behavior
* creating shared utilities only when genuinely cross-cutting

---

# 14. Before-Write Checklist for the Agent

Before generating code, the agent should check:

1. What task or issue is being implemented?
2. Which module owns this behavior?
3. Which files are the correct location?
4. Does this change affect schema, contract, or workflow state?
5. Does an existing pattern already solve this in the codebase?
6. Can this change stay small and local?

If any answer is unclear, prefer conservative code generation and explicitly note uncertainty.

---

# 15. Before-Submit Checklist for the Agent

Before proposing code as ready, the agent should check:

1. Does the code compile / run in the expected environment?
2. Is the change located in the correct module?
3. Is there any business logic in the wrong layer?
4. Are AI vs human outputs still distinguishable?
5. Are provenance-critical records preserved?
6. Are error paths explicit?
7. Does the code fit the repo structure standard?
8. Is there any junk file or temporary code?
9. Is the change small enough to review?
10. Can a human explain the design easily?

---

# 16. Mandatory AI Self-Review Prompts

Before finalizing a coding task, the agent or human operator should run the following review prompts.

## Prompt A — Architecture Fit

Inspect the current change against the intended project architecture.
Identify:

* module boundary violations
* cross-layer leakage
* misplaced logic
* unnecessary abstractions

## Prompt B — Submission Readiness

Inspect the current change and determine whether it is ready for milestone submission.
Check for:

* incomplete branches
* hidden placeholders
* broken flows
* missing configuration
* integration risks

## Prompt C — Code Quality

Review the code for maintainability.
Check:

* naming
* duplication
* function size
* clarity
* error handling
* testability

## Prompt D — Design Consistency

Check whether the implementation follows the existing design pattern and repository structure.
Highlight:

* inconsistent abstractions
* parallel patterns
* future maintenance risks

---

# 17. Output Format Expectations for Generated Code

When producing code, the agent should also provide a short implementation note containing:

* what files were changed
* why those files were chosen
* any assumptions made
* any unresolved risks or follow-up items

This note should be concise and engineering-oriented.

---

# 18. Human Responsibility Rule

Even if code is generated by AI, human contributors remain responsible for:

* understanding the code
* verifying correctness
* ensuring architectural fit
* cleaning up generated output
* defending the implementation during review

AI assistance does not reduce accountability.

---

# 19. Final Principle

In this project, good AI-assisted code is code that:

* lands in the right place
* respects the architecture
* preserves workflow integrity
* is easy to review
* is easy to extend
* can be explained clearly by a human

The target is not “AI wrote a lot of code.”
The target is:

> code that a real engineering team would be willing to keep.
