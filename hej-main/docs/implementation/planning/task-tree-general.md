# Task Tree

Version: v2.0
Status: Draft (General)
Governance:

* Governed by `docs/governance/canon.md`
* Derived from `docs/governance/requirements.md`
* Derived from `docs/design/system/system_design.md`
* Derived from `docs/design/product/one_core_two_operating_models.md`
* Derived from `docs/design/product/workspace_surface_hierarchy.md`

Purpose:

Provide the broad execution decomposition for the platform without pretending to be the week-by-week PR plan.

Interpretation:

* this document explains the large work domains
* `docs/implementation/planning/task-tree.md` explains the current 8-week handover shape
* `docs/implementation/prs/` remains the authoritative merge-granularity map

---

# 1. Shared-Core Planning Rule

The platform must be built in this order:

```text
identity and tenant scope
-> project scope
-> task scope
-> task-item execution
-> review and dispute governance
-> provenance and export
-> future extension layers
```

This preserves the one-core model:

* execution and governance stay authoritative in the shared core
* marketplace, billing, and trust remain wrappers or downstream extensions

---

# 2. Stable Work Domains

The broad execution domains are now:

## D1 Platform Foundation

Includes:

* identity
* organizations
* projects
* tasks
* task items
* persistence and API backbone

## D2 Project Workspace

Includes:

* projects portfolio
* project overview
* project tasks
* project disputes
* project exports
* project policies

## D3 Task Workspace

Includes:

* task overview
* task setup
* task schema and policy binding
* task items
* task runtime queue
* task history

## D4 Task-Item Execution

Includes:

* item details
* annotate
* judge
* review
* dispute handling

## D5 DS Usability Proof

Includes:

* dataset alignment
* runtime validation
* candidate payload packaging
* AI candidate generation
* metrics and experiment evidence

## D6 Governance Completion

Includes:

* disagreement detection
* project-level dispute visibility
* export readiness and export surfaces
* dashboard and operational breadth

---

# 3. Milestone Logic

The general milestone logic is:

```text
M1 establish contracts and objects
M2 make human-first workflow runnable
M3 prove AI-assisted and judgement-capable usability
M4 close governance and operational workspace breadth
```

This is the same logic reflected in:

* `docs/implementation/planning/milestone-definition.md`
* `docs/implementation/planning/team-handover-plan.md`
* `docs/implementation/prs/`

---

# 4. DS and CS Split

The split is by proof obligation, not by isolated component ownership.

## CS proves

```text
the platform exists as an authoritative governed workflow system
```

## DS proves

```text
the platform can be used for real annotation and judgement task families
```

That means DS is not only responsible for AI outputs.
DS also owns:

* dataset quality and suitability evidence
* task-family schema fit
* human-first runtime validation
* metrics and experiment evidence

---

# 5. What This Document No Longer Does

This general task tree should no longer:

* enumerate every implementation task as if it were the current delivery plan
* freeze vendor-specific assumptions such as one annotation runtime
* use `queue` as a synonym for `items`
* describe judgement as a thin alias of review

Those ambiguities are now resolved upstream.

---

# 6. Summary

Use this document to understand the durable work domains.

Use:

* `task-tree.md`
  for the current capstone handover decomposition
* `docs/implementation/prs/`
  for actual weekly PR slices
