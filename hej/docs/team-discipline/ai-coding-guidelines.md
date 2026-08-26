# AI Coding Guidelines

Version: v2.0
Status: Active
Primary Audience: Coding agents and human contributors using coding agents

Governance:

* Read this document before generating or modifying code in any repository
* Repository-specific rules must live in a separate project profile
* In case of conflict, the project-specific profile overrides this generic guide for that repository

Purpose:

Define a **generic engineering discipline** for AI-assisted coding.

This document is intentionally repository-agnostic.
It defines how coding agents and humans should behave when writing or modifying code, regardless of framework or domain.

It covers:

* change discipline
* architectural obedience
* layering hygiene
* testing and error handling expectations
* common AI-generated failure modes

It does **not** define:

* project-specific folder names
* project-specific modules
* project-specific workflow states
* project-specific governance documents

Those belong in a project profile document.

---

# 1. Core Rule

AI-assisted development should optimize for:

* correctness
* clarity
* maintainability
* reviewability
* low surprise

It should not optimize for:

* maximum code output
* speculative abstraction
* cleverness
* local elegance that breaks consistency
* fake completeness

The target is:

> code that a real engineering team would be willing to keep

---

# 2. Required Context Before Writing Code

Before generating code, the agent should understand the relevant local context.

Typical required context may include:

* repository README
* development workflow guide
* architecture or system design documents
* module or package map
* schema or data model docs
* testing / quality gates

If the required context is missing or unclear, the agent should:

* avoid inventing architecture
* avoid creating new major structures casually
* prefer minimal local changes
* explicitly note uncertainty
* ask for clarification when the risk of being wrong is meaningful

---

# 3. Architectural Obedience

## 3.1 Respect Existing Boundaries

Do not move logic across modules, layers, or packages casually.

If a change appears to cross boundaries, prefer one of:

* keep the change minimal and local
* note architectural uncertainty explicitly
* ask for approval before restructuring

## 3.2 Do Not Invent New Architecture Without Need

Do not introduce new architectural layers, service boundaries, event systems, microservices, or heavy patterns unless:

* the task requires it
* the repository design supports it
* the human owner explicitly wants it

## 3.3 Prefer Existing Patterns Over New Patterns

If the repository already uses a stable pattern, follow it unless there is a strong reason not to.

Consistency is usually more valuable than local optimality.

---

# 4. Layering Rules

The exact layer names differ by project, but the principle is stable:

```text
interfaces / entry points
    ->
application logic
    ->
persistence or integration access
    ->
data definitions
```

General rules:

* entry-point files should parse input, dispatch work, and return output
* business logic should live in explicit application or domain logic, not in transport handlers
* persistence access should not own workflow decisions
* integration code should translate external systems, not become domain authority

---

# 5. File and Module Rules

## 5.1 Create Files Only Where They Belong

Put code where the repository expects it.

Do not create parallel structures because they feel cleaner in the moment.

## 5.2 Do Not Create Junk Files

Avoid unstable filenames such as:

* `test2.py`
* `new_logic_final.py`
* `tmp_fix.ts`
* `helper2.js`
* `draft_v3.ipynb`

If a new file is required, its name should reflect a stable responsibility.

## 5.3 Prefer Updating the Right Existing File

If the behavior already belongs naturally in an existing module, prefer modifying that module over creating a shadow version.

## 5.4 Split Large Files When Responsibility Becomes Blurry

Large files are acceptable temporarily.
They should be split when:

* the file holds multiple distinct responsibilities
* behavior becomes hard to review
* further work would clearly make the file worse

---

# 6. Change Scope Rules

## 6.1 Keep Changes Narrow

Each change should solve one task or one tightly related slice.

## 6.2 Do Not Mix Unrelated Changes

Avoid bundling unrelated schema, API, refactor, UI, and tooling changes into one change unless the task truly requires it.

## 6.3 Preserve Existing Behavior Unless Required Otherwise

Be conservative when editing working code.
Do not change behavior that is outside the task.

---

# 7. Data and State Rules

## 7.1 Respect the Documented Data Model

Do not collapse distinct concepts into one ambiguous field or structure if the repository’s model treats them as distinct.

## 7.2 Preserve Source Distinction

If a system distinguishes different origins of data or decisions, preserve that distinction in code and storage.

## 7.3 Preserve History When History Matters

Do not replace append-preserving or audit-relevant behavior with destructive overwrite logic in areas where lineage matters.

## 7.4 Avoid Silent Ownership Changes

Do not introduce code that changes what the system is considered to own or persist without explicit design approval.

---

# 8. Workflow Rules

## 8.1 Respect Explicit States and Preconditions

If the system documents workflow states, transitions, or preconditions, code should enforce them rather than bypass them.

## 8.2 Fail Closed on Authority-Sensitive Actions

For authority-sensitive actions, reject on uncertainty rather than guessing.

## 8.3 Keep Demo and Operator Paths Reliable

Prefer explicit and reliable paths over hidden assumptions and fragile magic.

---

# 9. Error Handling Rules

## 9.1 Never Fail Silently

Do not swallow exceptions or ignore invalid input in important flows.

## 9.2 Return Explicit Failure States

When failure occurs, the code should:

* signal failure clearly
* preserve prior valid state when possible
* support debugging

## 9.3 Do Not Hide Incomplete Logic

Do not present incomplete logic as finished behavior.

Bad examples:

* always returning success
* hidden dummy values
* TODO branches in real execution paths

If placeholder logic exists, it must be explicit and isolated.

---

# 10. Testing Rules

## 10.1 Generate Testable Code

Prefer code shapes that can actually be tested:

* explicit services or functions
* narrow inputs and outputs
* isolated validation logic

## 10.2 Add Tests for Non-Trivial New Logic

Where appropriate, add or update tests for:

* success path
* failure path
* important state transitions

## 10.3 Do Not Fake Test Coverage

Avoid meaningless tests that merely execute code without asserting behavior.

---

# 11. Naming Rules

## 11.1 Use Clear, Stable Names

Prefer names that describe domain or responsibility, not vague implementation detail.

## 11.2 Name by Responsibility

Good names describe what the file or symbol is for.

Bad names describe only that something is “new”, “misc”, or “helper”.

---

# 12. Pattern Rules

## 12.1 Prefer Simple Existing Patterns

Use the project’s existing patterns where they are adequate.

## 12.2 Avoid Pattern Inflation

Do not introduce abstract factories, strategy hierarchies, generic managers, or over-configured frameworks without real need.

## 12.3 Accept Small Duplication Over Premature Abstraction

Small, local duplication is often preferable to speculative abstraction.

Extract only when:

* duplication is real
* the boundary is stable
* the abstraction matches ownership

---

# 13. Common AI-Specific Failure Modes

## 13.1 Architecture Drift

The agent gradually creates new folders, new patterns, or new ownership models.

## 13.2 Over-Generalization

The agent builds for hypothetical futures not required by the task.

## 13.3 Hidden Coupling

The agent introduces convenience helpers or imports that quietly create dependency problems.

## 13.4 Placeholder Completion Fraud

The agent writes code that looks complete but is functionally unfinished.

## 13.5 Unowned Utility Explosion

The agent creates many generic utilities with unclear ownership.

The defense against these failures is:

* inspect structure first
* keep changes small
* preserve ownership
* make incomplete logic explicit

---

# 14. Before-Write Checklist

Before generating code, check:

1. What problem is being solved?
2. Which module or area owns this behavior?
3. What is the smallest correct change?
4. Does this affect schema, workflow, or external contracts?
5. Is there already an established pattern for this?
6. Is any uncertainty high enough to justify asking first?

---

# 15. Before-Submit Checklist

Before proposing code as ready, check:

1. Does it run or compile in the expected environment?
2. Is the code located in the correct module or layer?
3. Is any business logic in the wrong place?
4. Are source distinctions and important histories preserved?
5. Are error paths explicit?
6. Is the change small enough to review?
7. Can a human explain the design easily?

---

# 16. Recommended Review Prompts

Use review prompts such as:

* architecture fit
* submission readiness
* code quality
* design consistency

The exact prompt wording may be defined by the project.

---

# 17. Output Expectations for AI-Generated Changes

When presenting generated changes, include a short implementation note covering:

* which files changed
* why those files were chosen
* key assumptions
* unresolved risks or follow-ups

This note should stay concise and engineering-oriented.

---

# 18. Human Responsibility Rule

Even when code is generated by AI, humans remain responsible for:

* understanding the code
* verifying correctness
* checking architectural fit
* cleaning up generated output
* defending the implementation in review

AI assistance does not reduce accountability.

---

# 19. Final Principle

Good AI-assisted code is code that:

* lands in the right place
* respects the structure it enters
* preserves important invariants
* is easy to review
* is easy to maintain
* can be explained clearly by a human
