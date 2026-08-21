# Admin MVP Plan

Document: `admin-mvp-plan.md`
Status: Draft
Scope:

Define the correct MVP boundary for the Admin area inside the current ToB-first governed human judgment infrastructure.

This document exists to prevent Admin from expanding into a full operations platform too early.

---

# 1. Admin in the Full Product

In the full product vision, Admin is the control plane for:

* identity and access
* tenant / organization governance
* workflow policy control
* operational exception handling
* audit and compliance support

That is the long-term direction.

However, the MVP should not attempt to fully implement all of that at once.

---

# 2. Admin in the MVP

For the MVP, Admin should be treated as a **lightweight control surface**, not as the main workflow hub.

The MVP priority remains:

```text
Project workspace
-> Task setup
-> Task queue
-> Task review
-> Task history
-> minimal dispute / export path
```

Admin exists to make the system boundary intelligible and realistic, but it should not consume the majority of implementation effort.

---

# 3. MVP Goals for Admin

Admin should prove four things:

1. the platform has a real user / membership / role model
2. tenant boundary and tenant policy exist
3. governance ownership is visible
4. students can infer the backend objects and APIs needed for these controls

Admin does **not** need to prove a full operational incident console in the MVP.

---

# 4. MVP In-Scope

## 4.1 User / Membership / Role Surface

Admin should include:

* member directory
* membership status visibility
* role grant visibility
* 2FA / access posture visibility

Optional lightweight actions:

* grant role
* revoke role
* restrict member

## 4.2 Organization / Tenant Surface

Admin should include:

* organization summary
* tenant status
* policy summary
* visibility into tenant boundary concepts

Optional lightweight actions:

* edit organization metadata
* update tenant policy summary fields

## 4.3 Workflow Policy Visibility

Admin should include:

* policy summary for membership, review, dispute, export, and provenance
* indication that these controls influence downstream workflow

This can initially be presented as:

* summary cards
* policy table
* read-only or lightly editable sections

---

# 5. MVP Out of Scope

The following should **not** be treated as primary MVP build targets:

* full incident center
* rich recovery console
* deep queue-operations tooling
* advanced retry / reroute / reopen tooling
* full compliance console
* platform-wide moderation tooling

These are valid future Admin expansions, but they should not compete with the main shared-core workflow work in MVP.

---

# 6. Recommended UI Shape for MVP

Recommended Admin shape:

```text
Admin
  -> summary header
  -> member directory
  -> role / access posture surface
  -> tenant policy summary
```

This should feel like:

* a real control surface
* a backend contract anchor
* a governance boundary explainer

It should not try to feel like a full operations command center yet.

---

# 7. Recommended Backend Contract for MVP

The MVP Admin UI should imply a backend contract roughly like:

* `GET /users/me`
* `GET /organizations`
* `GET /organizations/{orgId}`
* `GET /organizations/{orgId}/members`
* `GET /organizations/{orgId}/role-assignments`
* `POST /organizations/{orgId}/role-assignments`
* `DELETE /organizations/{orgId}/role-assignments/{assignmentId}`
* `GET /organizations/{orgId}/policy`
* `PATCH /organizations/{orgId}/policy`

This is enough to make Admin real without overbuilding it.

---

# 8. Recommended Sequencing

Admin should not lead the MVP.

Recommended delivery order:

1. project workspace
2. task setup
3. task queue
4. task review
5. task history
6. minimal dispute / export
7. lightweight admin

This keeps the product centered on its core differentiator:

```text
governed task execution and review
```

not on administration for its own sake.

---

# 9. Future Expansion Path

After the MVP proves the shared-core workflow, Admin can expand into:

* operational exception handling
* dispute backlog control
* pointer / import failure triage
* export failure recovery
* deeper audit and compliance tooling

Those should be treated as **Phase 2 Admin**, not MVP Admin.

---

# 10. Summary

The correct MVP interpretation is:

```text
Admin should be real, but light.
Project workspace and Task review should carry the MVP.
```

Admin is there to establish credibility, governance boundaries, and backend contract clarity.
It should not overshadow the shared-core workflow surfaces that define the product.
