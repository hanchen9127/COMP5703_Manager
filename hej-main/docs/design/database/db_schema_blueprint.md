# DB Schema Blueprint

Document: `db_schema_blueprint.md`
Version: v1.2
Status: Authoritative (Table-Level Blueprint)
Governance:

* Governed by Project Canon v1.0
* Derived from Requirements v1.1
* Aligned with Architecture Overview v1.2
* Aligned with Domain Model v1.1
* Aligned with Workflow States v1.2
* Aligned with DB Schema Strategy v1.1

Purpose:

Translate the conceptual domain model into a table-level blueprint without committing to concrete SQL.

---

# 1. Blueprint Rules

The schema must support:

* tenant isolation
* operational queries
* append-preserving history
* review/dispute/arbitration as distinct concepts
* raw data remaining external
* a durable shared core independent of future marketplace extensions

---

# 2. Shared-Core Table Families

## Control Tables

* organizations
* users
* organization_users
* role_assignments
* projects
* tasks
* task_items
* assignments
* data_pointers
* schemas

## Workflow History Tables

* task_state_history
* task_item_state_history
* dispute_state_history
* export_state_history
* assignment_history

## Judgment Tables

* annotations
* annotation_actions
* reviews
* disagreements
* dispute_cases
* dispute_participants
* arbitration_decisions
* canonical_judgments
* canonical_judgment_lineage

## Delivery and Audit Tables

* export_packages
* export_package_items
* provenance_records or equivalent lineage tables

---

# 3. Core Table Intent

## organizations

Tenant root.

## projects

Organization-owned grouping container.

## tasks

Project-scoped judgment program with:

* execution_mode
* task_status
* policy references or embedded policy payloads

## task_items

Atomic workflow unit with:

* task reference
* data pointer reference
* current state
* optional current canonical judgment reference

## data_pointers

External data references, not raw payload storage.

## annotations

Append-preserving candidate records from human or machine sources.

## reviews

Governance decisions over candidate outputs.

## disagreements

Persisted conflicting signals.

## dispute_cases

Current dispute state with workflow history.

## arbitration_decisions

Authoritative resolution records.

## canonical_judgments

Current authoritative output per finalized item, with lineage links.

## export_packages

Packaged delivery units for finalized outputs.

---

# 4. Dependency Rules

Allowed dependency direction:

```text
organizations -> projects -> tasks -> task_items
task_items -> annotations / reviews / disagreements / dispute_cases
task_items -> canonical_judgments
tasks / projects -> export_packages
```

Future extension tables may reference these rows.
These rows must not require future extension tables.

---

# 5. Extension Boundary

Not part of the shared-core blueprint:

* profile tables
* trust score tables
* listings
* applications
* billing
* payouts

Those may be added later as separate table families.
