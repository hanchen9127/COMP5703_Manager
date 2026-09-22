# Code review — PR #14 `fix(api): enforce project boundaries on task writes`

**PR:** #14 · **Commit:** `8e964b9` (+3 merge commits, head `ea5fd3a`) · **Branch:** `CS57-Jingwei` ·
**Author:** Jingwei Lin · **Reviewed:** 2026-09-13
**Scope:** 4 files, +160 / −85 · **Closes:** issue #9 · **Story:** G3 / SCRUM-21

---

## Summary

**Approve.** The change is small, correct, and closes a real hole. It implements exactly the guard
proposed as **Blocking #2** in the review of `55e23c9` ("cross-task task-item write is still open"),
together with the dedicated test that review asked for.

The fix that matters is **task-item ownership in `update_task_item`**. Proven end-to-end below: on
`main`, a caller with a valid task in the URL could rewrite an item belonging to another task; on
this branch the same request is refused with 404 and nothing is written. Removing the shadowed
duplicate `PUT` handler is correct cleanup.

Two things need attention, neither blocking the merge:

- **The PR description overstates the change in places** — it credits this PR with checks that
  already existed, references a report that isn't in the PR, and says ownership is validated before
  authorization, which is not true for item routes.
- **G3's underlying promise can't be delivered by any route change.** The permission model has no
  project-scoped roles, so "a person with access to one project" does not exist today. The PR meets
  G3's acceptance criteria as written; the story itself needs a decision.

### Test evidence

| Check | Result |
| --- | --- |
| Backend full suite at PR head `ea5fd3a` | **191 passed**, 121 subtests |
| Backend full suite at `8e964b9` (before merging `main`) | 157 passed, 121 subtests — matches the PR description |
| Focused: `test_cross_project_write_guards.py` + `test_role_separation_routes.py` | 14 passed, 13 subtests — matches the PR description |
| New tests run against `origin/main` | **2 of 4 fail** — route registered once; task item refused across tasks |
| Merge into `origin/main` / into PR #13 (SCRUM-25) | No conflicts, no shared files |
| Automated code review (`/code-review`) | No correctness findings |

The two new tests that **pass** on `main` are not defective: task update and delete across projects
were already refused on `main`. They guard existing behaviour rather than prove this fix.

### End-to-end verification

Real routing (FastAPI `TestClient`) against real SQLite, run on both `main` and this branch. The
caller holds organisation-level `task_owner`, `annotator` and `reviewer`, so it is legitimately
allowed on both projects — the only thing that can refuse a mismatched request is the ownership
check. Every control request against the caller's own resources succeeded.

| Request: project A's URL, project B's resource | `main` | PR #14 |
| --- | --- | --- |
| `PUT /projects/pA/tasks/tB` | 404 | 404 |
| `POST /projects/pA/tasks/tB/complete` | 404 | 404 |
| `DELETE /projects/pA/tasks/tB` | 404 | 404 |
| `POST /tasks/tA/task-items/iB/review-actions` | 404 | 404 |
| **`PATCH /tasks/tA/task-items/iB`** | **200 — item B rewritten** | **404 — item B unchanged** |

---

## Checking the PR description

| Claim | Verdict |
| --- | --- |
| Removed the duplicate `PUT /projects/{project_id}/tasks/{task_id}` | ✅ Correct — route enumeration shows it registered once, served by `tasks.update_task` |
| Kept one canonical handler using `TaskUpdate` | ✅ Correct |
| Verified a task belongs to the URL's project before update | ⚠️ True, but **not new** — `tasks.py` has had this check since `2b8ac54` (May), and the removed duplicate also had it |
| Verified the same before task deletion | ⚠️ True, but **not in this PR** — `projects.delete_task` gained it in `55e23c9`; this diff does not touch it |
| Added task-item ownership validation before status updates | ✅ Correct — the substantive fix |
| 404 for mismatched identifiers; no mutation | ✅ Correct |
| Updated role-separation tests to the canonical route | ✅ Correct |
| Detailed implementation report under `reports/` | ❌ **Not in the PR.** `reports/` is gitignored (`.gitignore:57`), so the report exists only locally |
| Ownership validation occurs **before authorization** | ❌ **Partly wrong** — see finding 2 |
| Backend full suite: 157 passed | ⚠️ Correct at `8e964b9`; stale after merging `main` — the head is 191 |
| Focused tests: 14 passed, 13 subtests | ✅ Reproduced |

---

## Needs a decision

### 1. G3's premise — "access to one project" — does not exist in the permission model

G3 promises that "a person with access to one project [is] unable to change anything in another".
Role resolution only honours **organisation-level** assignments:

```python
# app/core/permissions.py:353-354
RoleAssignmentDB.project_id.is_(None),
RoleAssignmentDB.scope == RoleScope.ORGANIZATION.value,
```

`RoleScope.PROJECT` is defined but never read. Verified end-to-end: a user given `task_owner`,
`annotator` and `reviewer` scoped to project A only was refused **403 on project A's own tasks** —
the project-scoped grants confer nothing.

So every role is org-wide: an organisation `task_owner` may legitimately edit every project's tasks
through the correct URL. This PR closes the **URL/resource mismatch** — which is what G3's acceptance
criteria actually test — but not the isolation the story describes. G3 subtask 4 ("a member of
project A cannot … in project B") is not representable either.

Not a defect in this PR. Worth one line in the PR and a product call: either project-scoped roles
become a ticket of their own, or G3 is reworded to match the org-wide model.

---

## Should address

### 2. "Ownership before authorization" holds for task routes, not item routes

| Handler (PR head) | Authorization | Ownership | Order |
| --- | --- | --- | --- |
| `tasks.update_task` | L106 | L104 | ownership first |
| `tasks.complete_task` | L130 | L128 | ownership first |
| `projects.delete_task` | — | — | ownership first (the PR's own test asserts `authorize.assert_not_called()`) |
| **`tasks.update_task_item`** | **L369** | **L379** | **authorization first** |
| **`review_actions.submit_task_item_review_action`** | **L218** | **L220** | **authorization first** |

The PR's own item test asserts `authorize.assert_called_once()`, which is consistent with the code
and contradicts the description.

**Not exploitable**: authorization runs against the task in the URL, which the caller must already
be allowed on, and the mismatch is then refused before any write. It's the description that is
wrong. Either reword it, or move the item check above authorization so all five routes behave the
same.

### 3. Correct the description before merge

It is the record a grader or reviewer will read. Suggested changes:

- Separate what this PR **adds** (item ownership, duplicate removal, new tests) from what it
  **relies on** (task-in-project checks from `2b8ac54` and `55e23c9`).
- Drop the `reports/` reference, or paste the report's content into the PR.
- Update the full-suite count to the head: 191 passed, 121 subtests.
- Qualify "before authorization" per finding 2.

### 4. Tests are handler-level; the original bug was routing-level

All four new tests call handlers directly with mocks. That proves each handler's logic, but issue 9
existed because of **route registration order** — `projects.router` was mounted first and shadowed
the checked handler. `test_project_task_update_route_is_registered_once` pins that specific case,
which is good. A `TestClient` test that sends the mismatched requests through real routing would
cover the whole class, including any future duplicate. The probe used for the end-to-end table above
can be turned into one.

---

## Minor

- **404 wording differs by route.** `PUT` returns `Task 'tB' not found`; `DELETE` returns
  `Task tB not found in project pA`.
- **Commit message has no ticket reference.** `8e964b9` names none of SCRUM-21, G3 or issue #9;
  the PR description names G3 and #9 but not SCRUM-21.
- **Three merge commits**, including a self-merge from pulling without rebase
  (`Merge branch 'CS57-Jingwei' of … into CS57-Jingwei`). Squash on merge keeps `main` readable.
- **G3 subtask 1 is out of date.** It asks to remove duplicate `PUT` **and `DELETE`** routes. Route
  enumeration on `main` shows only `PUT` was duplicated, so the PR is right to leave `DELETE` alone —
  worth noting so nobody reads it as an omission.

---

## Out of scope — found while reviewing

**Issue 10 is still present** (G4 / SCRUM-22, allocated to Dishank Aswal). `TaskItemStatusUpdate.status`
is a bare `str`, and `assert_task_item_status_update_allowed` never checks it against
`TaskItemStatus`. An unknown value such as `in_progress` is **written to the database, then fails
response validation with a 500**. The stored row stays invalid, so listing that task's items or
completing the task also returns 500 afterwards.

Two facts worth passing on for G4:

- Every valid status except `pending` is terminal or workflow-owned, so this endpoint can only ever
  legitimately set `pending`.
- No frontend code calls it.

Whether it should exist at all is a fair question for that ticket.

---

## What's good here

- **Exactly the fix the previous review asked for**, including the dedicated scoping test — and
  that test genuinely fails without the change.
- **Deleting the duplicate instead of patching both copies.** Two handlers for one route is how
  issue 9 happened; the registration test makes a reappearance fail loudly.
- **The refusal happens before any write.** Verified end-to-end, not just asserted on mocks.
- **Small and focused.** Four files, no conflicts with the other in-flight PRs, including #13.

---

## Suggested merge path

1. Correct the PR description (finding 3).
2. Note the G3 premise gap in the PR and raise it for a product decision (finding 1).
3. Optionally, align item routes to validate ownership before authorization (finding 2).
4. Squash merge.

None of these need to block. A route-level `TestClient` test (finding 4) can follow separately.
