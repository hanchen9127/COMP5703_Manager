# Review — PR #80, `CS57-Jingwei` (SCRUM-45, story J4: update and archive a project, with its history)

<https://github.com/USYD-CS-Capstone/hej/pull/80> · reviewed 2026-10-20 at `b9b05e7` (16 commits, base `main` at `d49d5ad`)

**Posted 2026-10-20 13:11 UTC as Approve** on `b9b05e7`, at Hanchen's request, before the PostgreSQL, casebook and web
runs finished. Those results follow in a PR comment.

**Withdrawn the same day: Tim's review (`message_review80_from_Tim.txt`) found four P2 defects this review missed or
misjudged.**

| Tim's finding | This review |
| --- | --- |
| 1. SQLite: a write paused after the guard lands after the archive (an archived project with a draft task) | Missed. The docstring's "SQLite runs one writer at a time" was taken on trust. The check-then-write gap remains |
| 2. SQLite: overlapping renames record a stale "before" | Missed. #63's `policy_unchanged_condition` is the precedent for a conditional write on SQLite |
| 3. PostgreSQL: two concurrent deletes deadlock (500 and 204) | **Stated the opposite** ("the locks can't deadlock"). Only update, policy and restore were checked. A delete needs the row's exclusive lock, so two holders of the guard's `FOR KEY SHARE` deadlock upgrading |
| 4. A removed member's stale token gets 409 "archived" on a write | Raised as a nit, but called harmless. It discloses the project's existence and state, against the PR's own outsider rule; `main` answers 403 |

Hanchen asked to replace the Approve with a Request changes, posted on Tim's behalf with his four findings
unchanged. The body is in the session scratchpad (`pr80-request-changes-tim.md`). Posting was blocked by the auto-mode
classifier, so it waits for Hanchen.

**Lesson:** when a PR claims lock safety, check every lock mode the guarded routes take, delete included, and every
supported database's isolation, not only the paths the PR names.

Read from GitHub first:
- **The PR is a draft.**
- It has no reviews and no comments.
- Review is requested from Hanchen; the roadmap had Tim as reviewer.
- It is 50 commits behind `main`, which now has #79. The textual merge is clean.
- CI cannot run (GitHub Actions billing).

Prior context read: roadmap W10 group 6, story J4 in `story_src.csv`, and the merge-order decision of 2026-10-20
(#79 → #80 → #89 → #91). There are no sandbox messages to Jingwei about #80.

**After this PR:**
- **The permission model.** Under the 2026-10-20 decision, `task_owner` keeps `MANAGE_PROJECT`. So archive, restore and
  update stay open to a project manager (task owner), and #91 must keep them so.
- **#89.** #89 touches the same `organizations.py`, `test_project_policy_updates.py` and `api_surfaces.md`, without a
  textual conflict. It re-runs its suites after this merges.

## Verdict: approve, with one documentation request

### The read-only guard covers every project write on current `main`

The guard (`archived_projects.py`) finds the project from the path parameters. So a write whose path names nothing
it can trace would pass unguarded. I listed every write route on the merged tree (`app.routes`):

- **Guarded:** 47 write routes. Each path carries `project_id`, `task_id`, `task_item_id`/`item_id`, or one of
  `draft_id`, `annotation_id`, `review_id` or `prediction_id`. That includes the routes `main` gained since the PR's
  inventory said 41: #88's settle route and #65's releases.
- **Unguarded:** 14, all organisation, membership, authentication or init routes, none of them under a project.
- **Guarded but not traceable:** the four organisation-level writes (`POST /organizations`, `PUT` and `PATCH
  /organizations/{org_id}…`, and `create_project`). Passing them is correct, since none is under one project.

### The locks are ordered so they can't deadlock

- An ordinary write takes `FOR KEY SHARE`.
- Archive takes `FOR UPDATE`, which is the only one of those modes `FOR KEY SHARE` conflicts with. So an archive
  waits for the running writes, and later writes wait for it.
- Update, policy and restore take `FOR NO KEY UPDATE`, which doesn't conflict with `FOR KEY SHARE`. So a write
  holding the guard's lock can still update its own project.
- The guard runs on the route's own `get_db` session (FastAPI caches the dependency per request), so the lock lasts
  until the route's commit.

### Other checks

- **Restore:** `restore_project` reads the status kept in the `project_archived` entry and
  falls back to `draft`. `ProjectStatus` has only `draft`, `active` and `archived`, so nothing is lost.
- **History read access:** `GET /projects/{id}/history` needs project access only. That matches the task history
  (`GET /tasks/{id}/audit-logs` needs task access only).

## Documentation request (non-blocking): record the draft-task limitation

`archive_project` refuses while any task is not `completed`.

**The limitation:**
- A draft task can be deleted only while it has no items (`delete_task` refuses once items are registered).
- It can be completed only by activating it and finishing every item (`TASK_STATUS_TRANSITIONS`,
  `assert_task_completeable`).
- So a project with a draft task whose dataset was loaded but never started, for example a wrong upload, can never
  be archived.

**Keep the rule (team decision, Hanchen, 2026-10-21).** The alternative was to refuse only `active` and `paused`
tasks. It was considered and rejected: a draft task holds no annotation work, but it can hold a task owner's setup
in progress (a dataset just loaded, a guideline being edited before activation). Archiving then would cut that off
until someone restores the project, which is what the rule exists to prevent.

Letting a draft task with items be deleted would change the provenance rule on registered data, and is out of scope.

**Requested:**
- in the PR description's *Decisions to review*, add that a draft task with registered items blocks archiving, and
  why the rule is kept;
- the same limitation goes into SCRUM-75's findings record (I5) as a known limitation.

## Nits (non-blocking)

- **The outsider check uses the token's organisations.** `get_user_org_ids(current_user)` reads the JWT's
  `org_contexts`. Someone removed from the organisation, with an unexpired token, gets 409 "archived" instead of the
  route's own refusal. That is harmless, since the route then refuses them anyway.
- **Mark the PR ready for review.** It is a draft.

## Verification

Run on a local merge with `main` at `d49d5ad` (#79 included), without committing (detached worktree
`D:\COMP5703_Capstone\hej-review-80` at `ee3c672`). PostgreSQL ran in a throwaway `postgres:18` container on port
55432, configured as CI's job:

- Backend, SQLite: `2473 passed, 20 skipped, 209 subtests passed`.
- Backend, PostgreSQL 18: `2490 passed, 3 skipped, 209 subtests passed` (22 min).
- Casebook `--baseline evaluation/baseline.json --exact`: `86 cases: 86 unchanged. No regression.`
- Web: `78 files, 760 tests passed`; `npm run typecheck:web` clean.
- All green, which doesn't contradict Tim's findings: none of the existing tests schedules the interleavings, or
  uses the removed-member token, that he reproduced.
- The write-route listing above.

## Re-review at `11252f1` (2026-10-21)

Hanchen posted Tim's findings as Request changes at 13:20 UTC on 20 Oct. Jingwei pushed three fixes and a merge of
`main` (#75, #79, #90), and explained them in a comment at 14:00 UTC.

| Tim's finding | At `11252f1` |
| --- | --- |
| 1 and 2. SQLite reads outside any lock | ✅ `95eb113`: `take_sqlite_write_lock` runs a no-op `UPDATE projects SET id = id WHERE id = :id` first, in the guard, in `ProjectRepository.get(for_update/exclusive)`, and so in archive, restore and update. That takes SQLite's write lock before the read and holds it to the commit. It is raw SQL, so `updated_at` doesn't move. No trigger on `projects` fires on it, and `busy_timeout` is 5000 ms. It is a no-op on PostgreSQL, where it is skipped. The race tests now run on a file-backed SQLite with each actor on its own connection (`test_archive_race.py`) |
| 3. Two deletes deadlock | ✅ `b16cf1f`: `EXCLUSIVE_ENDPOINTS` holds `organizations.delete_project`, which takes `FOR UPDATE` at the guard, so a second delete waits and then gets the route's 404. Checked: it is the only route that deletes a project. The other DELETE routes (task, review, draft, prediction, member, role) only reference the project |
| 4. Stale token discloses the archive | ✅ `8a9028d`: the guard calls `verify_user_org_access(current_user, org, db)`, the token's list and then the live `organization_users` row (`removed_at IS NULL`, live status), as the routes do. Two full-router tests use a real `create_access_token` |
| Documentation: draft-task limitation | ✅ In *Decisions to review*, with the 21 Oct reason. The SQLite write-lock trade-off is recorded there too |

**The merge** `11252f1` is clean. `--remerge-diff` is empty, and `main` (`d49d5ad`) is fully contained.

**Trade-off accepted:** on SQLite, a write request under a project now holds the database's single write lock for its
whole span. A slow write route, such as a large dataset intake, makes other SQLite writers wait, up to the 5 s busy
timeout. That is acceptable for the fallback database. PostgreSQL, the default, keeps row locks.

**Still a draft on GitHub** at re-review time, although the comment says it was marked ready.

**Verification at `11252f1`:**
- race and read-only tests: SQLite `12 passed, 5 skipped` (PostgreSQL-only); PostgreSQL `17 passed`;
- full SQLite: `2480 passed, 21 skipped, 209 subtests passed`.

**Posted 2026-10-20 14:1x UTC as Approve** on `11252f1`. Hanchen then asked for the PR to be marked ready and merged.
**Merged 2026-10-20 14:17 UTC** by Hanchen (merge commit `f3dfdc1`, not squashed), after `gh pr ready 80`. The full
PostgreSQL run was still going at merge time.
- **After the merge, the full runs at `11252f1` finished:** PostgreSQL 18 `2498 passed, 3 skipped, 209 subtests
  passed` (21 min); casebook `86 cases: 86 unchanged. No regression.` Nothing to follow up.
