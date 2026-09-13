# Code review — `Fix: Role-based permission`

**Commit:** `55e23c9` · **Branch:** `CS57-Jingwei` · **Author:** jlin4572
**Scope:** 24 files, +1436 / −86 · **Closes:** issue #7 (D1 / SCRUM-86), delivers G1 / SCRUM-44

---

## Summary

Strong change with the right architecture. The capability registry is the correct shape for this
problem, and it fixes a real vulnerability along the way: authorization previously trusted the
`org_contexts` claim baked into the JWT at login, so a **revoked role stayed live until the user
logged in again**. `verify_user_can_perform_governed_action` now resolves roles from the database
and documents why. That alone is worth the change.

**Two blocking items** (one trivial, one a genuine access-control gap), and **one deployment
question** that needs an answer before this can merge — invited members will be locked out of every
governed action.

### Test evidence

Ran the suite at `55e23c9`: **144 passed, 1 failed, 1 collection error.**

Both failures are **inherited from a stale base, not caused by this change** — I reproduced both at
the parent commit `c1ab994`:

| Failure | Status |
| --- | --- |
| `tests/test_project_exports_route.py` — collection error | Pre-existing (issue #14), already fixed on `main` by `e0e642a` |
| `test_task_audit_log_query.py::test_list_for_task_attaches_external_item_ref_label` | Pre-existing (issue #22), already fixed on `main` by `e0e642a` |

Every test touched or added by this commit passes.

---

## Blocking

### 1. `.gitignore:53` — typo un-ignores SQLite journal files

```diff
-apps/hej-api/*.db-journal
+apps/hej-api/*.db-journa324
```

That pattern matches nothing, so `hej_dev.db-journal` (written whenever the dev API runs) now shows
up in `git status` and can be committed.

```suggestion
apps/hej-api/*.db-journal
```

The other half of the hunk — `report/` → `reports/` — is correct; keep it.

### 2. `apps/hej-api/app/api/routes/tasks.py:334` — cross-task task-item write is still open

`update_task_item` authorizes against the **path `task_id`**, then mutates by **`item_id`** with no
check that the item belongs to that task:

```python
verify_user_can_perform_task_action(current_user, task, GovernedAction.MANAGE_TASK, db)
...
task_item = service.db_item_repo.get(item_id)        # tasks.py:343
assert_task_item_status_update_allowed(task, task_item, payload.status)   # :346
```

- `TaskItemRepository.get` / `.update` (`app/repositories/db_store.py:875`, `:882`) filter on
  `TaskItemDB.id` alone.
- `assert_task_item_status_update_allowed` (`app/services/task_service.py:89`) only validates
  statuses, never the item→task relationship.

**Result:** a user holding `task_owner` in org A can pass a `task_id` they legitimately own together
with an `item_id` belonging to org B, and write to it.

This is the task-item half of **issue #9**. The commit fixes the sibling case correctly — both
`projects.py:205` and `projects.py:249` added `if task.project_id != project_id: 404`. The same
guard just needs to land here:

```python
task_item = service.db_item_repo.get(item_id)
if task_item is None or task_item.task_id != task_id:
    raise HTTPException(status_code=404, detail="Task item not found")
```

`test_role_separation_routes.py::test_direct_task_item_update_requires_task_management` covers the
*role* but not the *scoping*, so it passes either way — the fix needs its own test.

---

## Needs a decision before merge

### 3. Invited members will have zero capabilities

`verify_user_can_perform_governed_action` requires a live `role_assignments` row. Role rows are
created by exactly five paths:

| Path | Grants roles? |
| --- | --- |
| `admin_service.py:95` — org creation (creator → `admin`) | yes |
| `admin_service.py:556` — `assign_role` | yes |
| `admin_iam_service.py:214` — `create_user_for_org` | yes |
| `admin_iam_service.py:338` — `set_org_member_roles` | yes |
| `init_data.py:329` — seed | yes |
| **`admin_service.invite_member` (`:370`)** | **no** |
| **`admin_service.accept_invitation` (`:409`)** | **no** |

So a user added through the invite flow gets an `OrganizationUserDB` row and nothing else. After
this change they receive `403 "You are not authorized to annotate…"` on every governed action —
where before the commit membership alone was enough. The same applies to **any existing membership
row in an already-seeded database**, and the commit ships no backfill.

Local dev hides this because `init_data.py` assigns roles.

Requiring explicit roles is arguably the correct behaviour — this is a question, not an accusation.
But one of these needs to happen before merge:

- assign a default role (`annotator`?) on invite/accept, **or**
- ship a backfill for existing membership rows, **or**
- document that an admin must grant a role through the admin-IAM dialog before a new member can do
  anything, and confirm the UI makes that obvious.

Worth noting the invite flow is *already* broken end to end (issues #17 / #18 — `invite_member`
sets `status=ACTIVE, accepted_at=now` while returning `"status": "invited"`), so this may be moot
until G5 / SCRUM-8 lands. Flagging it so the interaction is a decision rather than a surprise.

---

## Should address

### 4. Self-approval guard fails open on `NULL`

`app/services/review_policy_enforcement.py:64`:

```python
if creator_id is not None and int(creator_id) == int(reviewer_id):
```

If `created_by` is null — a nullable column, so legacy, seeded, or machine-generated rows — the
guard silently permits self-approval. The normal path does populate it
(`draft_service.py:45` → `_create_annotation_from_draft(..., created_by=draft.created_by)`), so
impact is low today. But a Critical-severity control that fails **open** is the wrong default; it
should deny, or at minimum log.

Also worth stating in the PR description: the guard covers `accept` / `approved` only. A user
holding **both** `annotator` and `reviewer` — explicitly supported, since "permissions are additive"
— can still `reject` or `adjust` their own item. That may be fine; it should just be a decision on
the record rather than an omission.

### 5. Draft ownership is unenforced, and it undermines the self-approval control

`verify_user_draft_access` (`app/core/resource_scope.py:49`) checks org/project scope; the new
`ANNOTATE` capability check adds a role. **Neither checks `draft.created_by`.** So annotator A can
`PATCH`, `DELETE`, or `POST /submit` annotator B's draft (`drafts.py:177`, `:216`, `:250`).

The submit case matters for this commit specifically. `_create_annotation_from_draft` stamps the
annotation with `created_by = draft.created_by` — i.e. **B** — even though **A** submitted it. If A
also holds the reviewer role, `assert_not_self_approval` compares the reviewer against B, passes,
and A approves work A actually submitted. The new control is bypassable through a gap it doesn't own.

This is a pre-existing defect (issue #6, story **D6** / SCRUM-25) and reasonably out of scope here.
Raising it so that (a) nobody marks D6 done on the strength of these added checks, and (b) the
dependency between D6 and D1 is visible when D6 gets scheduled.

### 6. Rebase onto `main`

Base is `f063d9d`; `main` is at `0b9c492`. Rebasing drops both inherited test failures and gives the
reviewer a green suite.

### 7. Frontend duplicates the role vocabulary

`apps/hej-web/lib/organization-roles.ts` hardcodes the six role strings that the backend
deliberately centralized (`assignable_role_keys()`, with `admin_service.py:525` now deriving from
it). Nothing binds the two, so they can drift silently. Either serve the list from an endpoint, or
add a comment naming `RoleKey` as the source of truth.

---

## Minor

- **`app/core/permissions.py:353` — project-scoped role assignments are silently ignored.** The
  query filters `project_id IS NULL AND scope == 'organization'`. Correct today (every grant path
  writes org scope, verified), but `RoleScope.PROJECT` and `RoleAssignmentDB.project_id` both exist
  and the column is documented as "NULL = organization-level role". A future project-scoped grant
  would confer nothing, and the 403 would report *"Your active organization roles: none"*, which is
  misleading. One comment on the filter, or an explicit reject of project scope, prevents a long
  debugging session later.

- **`app/core/permissions.py:58` — import-time `raise RuntimeError` has a wide blast radius.** The
  registry-completeness guard is good intent, but it runs at import of a module nearly every route
  depends on. Add a role without a capability entry and the API fails to boot and *all* test
  collection errors out opaquely — when `test_governed_action_permissions.py` already asserts the
  same invariant as a clean test failure. Consider demoting to test-only.

- **`app/api/routes/drafts.py:323`** — `assert_not_self_approval(draft, reviewer_id)` passes a
  `DraftDB` to a parameter named `annotation`. Duck-typing works (both have `created_by`); rename
  the parameter to `candidate`.

---

## What's good here

- **Capability registry keyed on actions, not role names.** Routes ask for `GovernedAction.APPROVE`,
  not `"reviewer"`, so adding a role means editing one map instead of every endpoint.
- **The startup invariant** — `if set(ROLE_CAPABILITIES) != set(RoleKey): raise` — makes it
  impossible to add a role without declaring its capabilities. (See the blast-radius note above;
  the *idea* is right.)
- **DB-authoritative role resolution.** Fixes the stale-JWT hole. Role grants and revocations now
  take effect immediately instead of at next login.
- **Two IDOR gaps closed as a side effect** — `predictions.list_predictions` and `get_prediction`
  previously performed no task-item scope check at all.
- **The tests are genuinely good.** `test_governed_action_permissions.py` seeds a *deliberately
  stale* JWT context specifically to prove the DB wins, and covers revoked roles.
  `test_role_separation_routes.py` and `test_governed_action_routes.py` cover 19 route/capability
  combinations between them.
- **`docs/design/backend/api_surfaces.md` updated in the same commit** with the capability matrix —
  exactly what `AGENTS.md`'s Docs Sync rule asks for.

---

## Suggested merge path

1. Fix the `.gitignore` typo (1 line).
2. Add the item→task guard in `update_task_item`, with a test (issue #9).
3. Answer the invited-members question — default role, backfill, or documented admin step.
4. Rebase onto `main` for a green suite.

Items 4–7 and the Minor section can follow up; none of them need to block.
