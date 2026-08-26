# dashboard.pr.md

Status: Draft  
Owner track: Group B / CS-B Project and Task Workspace Frontend  
Primary milestone: M4 ToB Workspace Completion  
Suggested submission window: Week 7-8  
PR type: frontend integration PR

---

# 1. Summary

Deliver **Dashboard** as one integrated PR.

This is appropriate because dashboard is mainly a **downstream information display and navigation surface**, not a workflow-authority surface. It should aggregate real platform state that already exists across organizations, projects, tasks, disputes, exports, and admin.

---

# 2. Objective

Make dashboard usable as the global landing surface for demos and normal entry by:

* showing meaningful platform status
* reflecting the current IA and vocabulary
* routing users into real downstream workspaces

Dashboard must stay subordinate to the shared-core hierarchy:

```text
organization -> project -> task -> task item
```

---

# 3. Governance Basis

Derived from:

* `docs/governance/canon.md`
* `docs/governance/requirements.md`
* `docs/implementation/planning/task-tree.md`
* `docs/implementation/planning/demo-scenarios.md`
* `docs/implementation/planning/integration-contract.md`
* `docs/implementation/planning/milestone-definition.md`
* `docs/implementation/planning/minimal-working-slice.md`
* `docs/implementation/planning/team-allocation.md`

Key implications:

* dashboard is a shared-core visibility surface, not a separate product
* wording must stay annotation-first and judgement-aware
* displayed status should come from real platform objects where feasible

---

# 4. In Scope

Include:

* dashboard route and current component composition
* summary metrics from real data, shared fixtures, or existing mocks
* status panels tied to real organizations, projects, tasks, disputes, exports, or admin surfaces
* navigation into real downstream pages
* cleanup needed to align dashboard with current platform IA

Current surface likely includes:

* `apps/hej-web/app/page.tsx`
* `apps/hej-web/components/dashboard-hero.tsx`
* `apps/hej-web/components/dashboard-stats.tsx`
* `apps/hej-web/components/dashboard-product-structure.tsx`
* `apps/hej-web/components/dashboard-workflow-process.tsx`

---

# 5. Out of Scope

Do not include:

* new workflow semantics
* dashboard-only backend models
* speculative analytics architecture
* marketplace, billing, trust, payout, or listing surfaces
* task, review, dispute, or arbitration behavior changes

---

# 6. Minimal Complete Slice

The smallest acceptable PR is:

```text
open dashboard
-> see meaningful platform counts or status
-> understand current workflow posture
-> navigate into at least one real organization, project, task, and admin surface
```

The PR is not complete if dashboard remains decorative or disconnected from actual objects.

---

# 7. Dependencies

Depends on these surfaces existing first or in parallel:

* identity / tenant entry
* organizations
* projects
* task workspace
* admin

Helpful but not strictly blocking:

* dispute visibility
* export visibility

---

# 8. Team Ownership

Primary owner:

* **CS-B Project and Task Workspace Frontend**

Coordination:

* CS-A for read endpoints or aggregation shape if needed
* CS-C for alignment with dispute, export, or admin visibility
* DS only if AI execution posture needs to be shown

---

# 9. Acceptance Criteria

Accept when:

* dashboard loads as a coherent top-level workspace
* labels and counts use current domain vocabulary
* judgement is represented as a first-class task path, not as review
* links land in real downstream surfaces
* displayed data is derived from shared platform objects, fixtures, or existing mocks
* dashboard matches current IA and no longer reads like a placeholder homepage

---

# 10. Demo Expectation

Expected demo flow:

```text
enter platform
-> open dashboard
-> show current organizations / projects / tasks / workflow posture
-> navigate into project or task workspace
-> navigate into admin
```

This should prove dashboard is an operational landing surface built on top of real workflow objects.

---

# 11. Suggested PR Title

```text
feat: operationalize dashboard as shared-core landing surface
```
