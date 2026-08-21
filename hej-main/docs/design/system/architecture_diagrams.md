# Architecture Diagrams

Document: `architecture_diagrams.md`
Version: v1.3
Status: Draft
Governance:

* Derived from `docs/design/system/architecture_overview.md`
* Derived from `docs/design/system/system_design.md`
* Derived from `docs/design/product/one_core_two_operating_models.md`

Purpose:

Provide stable ASCII diagrams for the current architecture direction.

These diagrams are centered on the **shared core**.

---

# 1. System Context

```text
                        +---------------------------+
                        | Client Organization       |
                        | Task Owner / Manager      |
                        +-------------+-------------+
                                      |
                                      v
+--------------------------------------------------------------------+
| HEJ (Human Evaluation & Judgment Infrastructure)                  |
|                                                                    |
|  - identity and tenant scope                                       |
|  - project and task orchestration                                  |
|  - annotation, judgement, and review workflow                      |
|  - dispute and arbitration                                         |
|  - provenance and export                                           |
+--------------------------------------------------------------------+
      ^             ^                ^                ^
      |             |                |                |
+-------------------+  +------------+  +-------------+  +-------------+
| Annotator / Judge |  | Reviewer   |  | Arbitrator  |  | Admin       |
| Human Participant |  | QA         |  | Domain      |  | Operator    |
+-------------------+  +------------+  | Expert      |  +-------------+
                                       +-------------+

                |
                v
        +-----------------------+
        | External AI System    |
        | / Prediction Engine   |
        +-----------------------+

                |
                v
        +-----------------------+
        | External Data Storage |
        | S3 / Data Lake / DB   |
        +-----------------------+
```

---

# 2. Shared-Core Process

```text
Identity and Tenant Entry
        |
        v
Organization / Project Scope
        |
        v
Task Definition + Policy
        |
        v
Dataset Pointer Registration
        |
        v
Task Item Generation
        |
        +------------------------------+
        |                              |
        v                              v
 AI-assisted Entry               Human-first Entry
        |                              |
        +--------------+---------------+
                       |
                       v
         Review and Correction / Governance
                       |
                       v
               Disagreement Detection
                       |
                       v
                  Dispute Handling
                       |
                       v
                 Expert Arbitration
                       |
                       v
            Canonical Judgment + Provenance
                       |
                       v
                    Export
```

---

# 3. Container View

```text
+-----------------------------------------------------------------------------------+
|      HEJ (Human Evaluation & Judgment Infrastructure)                            |
+-----------------------------------------------------------------------------------+

+--------------------------+
| Web Application          |
| hej-web (apps/hej-web)   |
+------------+-------------+
             |
             v

+--------------------------+
| API / Workflow Core      |
| hej-api (apps/hej-api)   |
+------------+-------------+
             |
             +------------------------------+
             |                              |
             v                              v

+--------------------------+      +--------------------------+
| First-Pass Work Runtime  |      | External Data Access     |
| Integration              |      | Gateway / Pointer Logic  |
+------------+-------------+      +------------+-------------+
             |                                 |
             v                                 v

+--------------------------+
| AI Candidate Import      |
+------------+-------------+
             |
             v

+--------------------------+
| Review / Dispute /       |
| Arbitration Core         |
+------------+-------------+
             |
             v

+--------------------------+
| Provenance / Export      |
+--------------------------+
```

---

# 4. Backend Logical Modules

```text
identity
  ->
organizations
  ->
projects
  ->
tasks
  -> task_items
  -> annotations
  -> reviews
  -> disagreements
  -> disputes
  -> arbitration
  -> judgments
  -> provenance
  -> exports
  -> data_access

integrations
  -> ai_import
  -> annotation_runtime
  -> external_data
```

Rule:

* core workflow modules stay authoritative
* integrations feed the core
* future marketplace or billing layers must sit around the core, not replace it

---

# 5. Product Information Architecture

```text
Global Navigation
  - Dashboard
  - Organizations
  - Projects
  - Admin

Project Scope
  - Overview
  - Tasks
  - Disputes
  - Exports
  - Policies

Task Scope
  - Overview
  - Setup
  - Items
  - Annotate / Judge
  - Review
  - Dispute
  - History
```

This is the current ToB operating model presentation of the shared core.

---

# 6. One Core, Two Operating Models

```text
                    +---------------------------+
                    | Shared Workflow Core      |
                    |                           |
                    | org -> project -> task    |
                    | task-item execution       |
                    | review/dispute            |
                    | dispute/arbitration       |
                    | provenance/export         |
                    +-------------+-------------+
                                  |
              +-------------------+-------------------+
              |                                       |
              v                                       v
    ToB Governed Infrastructure            Future Marketplace Layer
    - private tenant workflows             - listing/discovery
    - admin / project control              - trust / profile
    - project and task workspaces          - billing / payout
```

Rule:

* the right-hand side may grow later
* the center must remain stable
