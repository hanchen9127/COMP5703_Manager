# Backend Module Map

Document: `backend_module_map.md`
Version: v1.2
Status: Draft
Last Updated: 2026-03-22
Governance:

* Governed by Project Canon v1.0
* Derived from `docs/design/system/system_design.md`
* Derived from `docs/design/system/repo_module_blueprint.md`

Purpose:

Map the backend into implementation-oriented modules with clear ownership boundaries.

The map is for a modular monolith that implements the **shared core** first.

---

# 1. Module Principles

* modules follow domain boundaries, not page names
* core workflow modules stay independent of future marketplace or billing concerns
* integrations feed the core, but do not own core workflow semantics
* provenance ownership is explicit

---

# 2. Preferred Module Map

```text
identity
organizations
projects
tasks
data_access
annotation
review
judgments
disputes
arbitration
provenance
exports
integrations
platform
```

Future extension candidates:

```text
profiles
marketplace
billing
notifications
```

These future modules must depend on the core, not the reverse.

---

# 3. Core Modules

## identity

Owns:

* users
* memberships
* role assignments
* access checks

## organizations

Owns:

* organizations
* tenant boundary semantics

## projects

Owns:

* projects
* project metadata and status

## tasks

Owns:

* tasks
* task_items
* task and task-item state history
* task setup semantics
* task-item listing and runtime-monitoring support

## data_access

Owns:

* data pointers
* external data resolution policy
* runtime payload access helpers

## annotation

Owns:

* human first-pass annotation submissions
* machine-originated candidate outputs for annotation tasks
* annotation-level history if needed

## review

Owns:

* review decisions
* candidate inspection
* acceptance / edit / rejection logic
* disagreement creation triggers

## judgments

Owns:

* human judgement submissions
* machine-originated candidate verdicts for judgement tasks
* judgement-output history if needed
* judgement-specific schema binding support at the execution layer

## disputes

Owns:

* dispute cases
* dispute participants
* dispute state transitions

## arbitration

Owns:

* arbitration decisions
* authoritative decision path
* resolved outcome handoff

## provenance

Owns:

* lineage assembly
* history queries
* audit-friendly decision trace

## exports

Owns:

* export package creation
* export status
* export content assembly

---

# 4. Integration Modules

`integrations` contains adapters for:

* AI import
* first-pass runtime
* external data systems

Rules:

* integrations may translate external payloads
* integrations must not redefine core state machines

---

# 5. Dependency Direction

Preferred dependency direction:

```text
integrations -> core workflow modules -> platform infrastructure
```

And within the core:

```text
identity / organizations / projects
  -> tasks
  -> annotation / review / judgments
  -> disputes / arbitration
  -> provenance / exports
```

Avoid:

* exports owning task logic
* integrations owning review semantics
* future marketplace modules owning task execution

---

# 6. Mapping to Current Product Surfaces

Current frontend surfaces map roughly to modules like this:

* `Admin` -> identity, organizations
* `Projects` -> projects, tasks, exports, disputes
* `Task Setup` -> tasks, data_access
* `Task Items / Annotate / Judge / Review` -> tasks, annotation, judgments, review
* `Task History` -> provenance

---

# 7. Summary

The backend should be understood as:

```text
one modular monolith
domain-oriented modules
shared-core first
integrations at the edge
future extensions layered later
```
