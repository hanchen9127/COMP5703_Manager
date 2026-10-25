# Review — PR #98, `CS57-Hanchen-scrum-121` (SCRUM-121, A6: reads never write, and the project and overview pages read once per organisation)

<https://github.com/USYD-CS-Capstone/hej/pull/98> · reviewed 2026-10-24 at `17281e33` (8 commits including the merge of `main`, 26 files, +1155/−1107) · base `main` at `ffc42abd` (#97) · author and reviewer Hanchen Wang

**Self-review, not posted.** A sceptical pass before Yi's review. Nothing here is on GitHub. "Not for the PR" below the rule is for Hanchen only.

Read from GitHub first (read-only `gh`):
- **The PR is a draft**, `OPEN`, `MERGEABLE`, base `main`, head `17281e33`.
- **No comments, no reviews, no review requests.**
- **CI at `17281e33`:** `sqlite`, `web` and `postgresql` all skipping, because the PR is a draft.

Prior context read:
- story A6 in `shared/story_src.csv` (criteria 3–5, subtasks 2–5) and roadmap W11;
- the ticket text, `sandbox/W11/jira/jira-W11-updates-2026-10-24.md` §1;
- the plan and its "as built" notes, `sandbox/W11/plans/plan-SCRUM-121.md`;
- the PR description as posted, `reviews/W11/pr-cs57-hanchen-scrum-121-reads-never-write.md`;
- `sandbox/Break/tests/perf-findings.md`, "Result: SCRUM-121" and "The Dashboard";
- `specs/tech-stack.md` (Definition of Done, testing discipline, commits, the PR title rule of 2026-10-23, Docs Sync);
- ADR 014 (decision 6, read-side repairs), ADR 023 and ADR 024; `.github/workflows/backend-tests.yml`;
- the review format of `review-cs57-yi-scrum-132-pr99-model-confidence.md`.

## Verdict: ready for review after three should-fix points

I found nothing blocking in the code. The parts most likely to hide a problem hold up:
- **Access parity.** Both organisation routes check what the per-project routes check. I probed it on SQLite and on PostgreSQL with a project-scoped role, a restricted member, a removed member and a non-member, and the two routes gave the same answers.
- **Deleting the read-time repair.** It is safe. No live write produces the evidence the repair read.
- **The new tests prove their claims.** I reran each "fails without the change" claim, and each one fails as the PR says.

Three points need fixing before Yi reads it:

1. **ADR 014 still mandates what this PR removes.** Its decision 6 ("Protect read-side status repairs") and its verification paragraph require the repair and the concurrency tests that this PR deletes. Nothing amends it (finding 1).
2. **The two new endpoints are not in `api_surfaces.md`.** #97 documented `task-item-counts` there, and Docs Sync requires it for new routes (finding 2).
3. **The PR description makes two claims the code and CI don't support** (finding 3):
   - it says "CI runs [PostgreSQL] once this is ready", but the PostgreSQL job never runs on a pull request;
   - it says "each batched read falls back to the per-project path", but Canonical Decisions has no fallback.

## Checked

| Check | Result |
| --- | --- |
| Worktree `D:\COMP5703_Capstone\hej-review-98` at `17281e33`, `uv sync`, `npm ci` | Done. Hanchen's checkout `D:\COMP5703_Capstone\hej` untouched (clean, `17281e33`) |
| Backend, SQLite, full suite (`pytest -n 6`) | ✅ 2,535 passed, 63 skipped, 204 subtests (1 min 38 s), as the PR says |
| Backend, PostgreSQL 18 (CI's way: `DATABASE_URL`, per-test schemas, database timezone `Australia/Sydney`), throwaway database `hej_review98` in `hej-perf-pg` | ✅ 2,595 passed, 3 skipped, 204 subtests (5 min 16 s). This is the first PostgreSQL run of commits 6–7. The database was dropped afterwards, `hej_perf` and `/tmp` dumps untouched, and the container stopped |
| Casebook, `--baseline evaluation/baseline.json --exact` | ✅ 87/87 passed, 1 skipped; 88 unchanged, no regression |
| Web `test:web` | ✅ 109 files, 1,026 tests |
| `typecheck:web` / `lint:web` | ✅ clean (fresh worktree, no `.next`) / 0 errors, 38 warnings, none in a changed file |
| Fail before fix: `test_task_item_reads.py` against `main`'s `app/` | ✅ 3 of 4 fail: statement count `260 == 80`, and both no-write cases on `UPDATE task_items`. The expert Return test passes on both, so it is a Guard, as labelled |
| Fail before fix: `list_by_task`'s status column removed (`db_store.py` from `main`) | ✅ `test_task_list_does_not_revive_old_return_after_real_owner_reopen` fails (`['expert_send_back'] == ['pending']`), and so do both cases of `test_task_list_returns_current_status_with_a_strongly_cached_pre_review_item` |
| Fail before fix: `test_organization_reads.py` Prove tests against a per-project implementation (monkeypatched) | ✅ both fail, `(4, 14)` for tasks and `(5, 15)` for counts, as the PR says |
| Fail before fix: web, `project-data.ts` and `dashboard-canonical-count.ts` from `main` | ✅ as claimed: 4 of 5 project-page cases, the 3 Prove cases of `project-overview-data.test.ts`, 4 of 6 in `dashboard-canonical-count.test.ts` (and the 2 updated component tests, whose mocks changed) |
| Probe: access parity, organisation routes against per-project routes, on SQLite and PostgreSQL | ✅ identical answers for all four users (table below) |
| Callers of the deleted functions and of `current_expert_send_back_at` | ✅ `git grep`: none left in `app/`, `evaluation/` or tests. The one app caller passes `predecessor` (`independent_review_service.py:331`) |
| Who writes the evidence the repair read | ✅ Resolved `TaskItemEscalationDB` rows and `escalation_decided` audits are written only in `decide_escalation` (`review_actions.py:1899`, `:1949`, `:1991`, `:2010`), and its route answers 410 (`retired_decide_escalation`). `route_escalation` is retired too (`:1069`) |
| Any GET route that commits | ✅ none found by a scan of `routes/*.py` (heuristic: a `db.commit()` inside a `@router.get` function) |
| Probes deleted afterwards | ✅ The worktree is clean at `17281e33` |

### Access parity probe

The fixture has one organisation with an active and an archived project, one task each. The table shows each route's answer.

| User | Per-project tasks | `GET /organizations/{id}/tasks` | Per-project overview counts | `GET /organizations/{id}/item-status-counts` |
| --- | --- | --- | --- | --- |
| Member (annotator) + `task_owner` scoped to a project | 200, 200 | 200, 2 tasks | 403, 403 | 403 |
| Project-scoped `task_owner`, no membership | 403, 403 | 403 | 403, 403 | 403 |
| Restricted member, organisation-wide `task_owner` | 200, 200 | 200, 2 tasks | 200, 200 | 200, 2 projects |
| Removed member, organisation-wide `task_owner` | 403, 403 | 403 | 403, 403 | 403 |

Why it holds:
- Every governed check reads only organisation-wide roles (`permissions.py:460`–`:467`: `project_id IS NULL`, `scope = organization`), so a project-scoped role grants nothing on either path.
- `verify_user_project_access` reduces to `verify_user_org_access` on the project's organisation (`permissions.py:223`–`:266`).
- Neither `GET /organizations/{id}/projects` nor `list_by_project` filters by archive status (`db_store.py` `ProjectRepository.list_by_organization`, `TaskRepository.list_by_project`), so archived projects and their tasks are in both sets.
- Tasks are deleted outright, never soft-deleted, so the two paths list the same tasks.
- On the web, `hasGovernedAction(orgId, "oversee")` reads the login's organisation actions. The per-project read was gated the same way, so the set of projects asked is unchanged.

## A6, criterion by criterion (this PR's share)

| # | Criterion | Result |
| --- | --- | --- |
| 3 | Reading never writes; a status changes only through the action that causes it | ✅ `task_service.py:1027`: `list_task_items` returns the repository's items. Task-items and setup are guarded with no `INSERT`/`UPDATE`/`DELETE` and no `FOR UPDATE` (`test_task_item_reads.py`); content uses the same call. The one-off repair in `migrate_db_schema()` is dropped, with the reason given (#88 resets every development database; there is no deployment) |
| 4 | The project page does not repeat per-task work | ✅ `project-data.ts:524`: one `task-item-counts` read beside the project's reads; setups only as fallback |
| 5 | Before and after on the same measurement | ✅ `perf-findings.md`; I did not rerun the bed |
| Subtask 2 | Delete `use-hydrated-task-items.ts` | ✅ nothing referred to it |
| Subtask 5 | Route tests: same statements for 10 and 40 items; no write | ✅ |

---

## Findings

### 1. Should-fix: ADR 014 still requires the read-side repair and the tests this PR deletes

`docs/adr/adr014_review_and_submission_state_history.md:81`–`:93` (decision 6), `:107`–`:108` and `:115`–`:117`. The PR edits `api_surfaces.md` and `workflow_states.md` but leaves ADR 014 alone. Its text still says:
- decision 6, "Protect read-side status repairs": reconciliation and compatibility repair take item locks, use conditional updates and refresh cached items;
- under Consequences: "Read-side repairs cannot overwrite a newer finalized or reopened state…";
- and "Additional concurrency regressions must cover overlapping repair/submission/review/reopen operations, cached pre-lock items, conditional-write rejection on file-backed SQLite, and no-op transaction ownership".

Those are exactly the five tests deleted from `test_independent_second_review.py` and the code deleted from `task_item_status_resolution.py`.

**Failure scenario:** Yi, or the next team, reads ADR 014 and sees an accepted decision that the code no longer follows. The deleted tests are the ones the ADR demands, so the PR looks like it removed required coverage. Someone may "restore" the repair. That would bring back SCRUM-120's flip: a read writing `expert_send_back` over a reopened item.

**Suggested fix:** amend ADR 014 the way ADR 010 records ADR 018 (`adr010…md:7`). This needs no new ADR, and 025 is taken by #99.
- Add a header line: `- **Amended by:** A6 (SCRUM-121, #98) removes decision 6. Reads of a task's items return the stored status and write nothing; the writes set it (item_status_after_accept). The list reads the status column, so a cached ORM item cannot hide a newer state, which keeps the last sentence of decision 6.`
- Add one sentence under Consequences: the concurrency regressions for read-side repairs went with the repair.

### 2. Should-fix: the two new endpoints are not documented

`docs/design/backend/api_surfaces.md:463`–`:466`. #97 documented `GET /organizations/{org_id}/task-item-counts` there, with its access, shape and why it exists. Docs Sync (`tech-stack.md`, "API resources, routes or boundaries → `api_surfaces.md`") applies to the two routes this PR adds:
- `GET /organizations/{org_id}/tasks` (`routes/organizations.py:377`);
- `GET /organizations/{org_id}/item-status-counts` (`:395`).

The PR changes `api_surfaces.md` only for the read-never-writes paragraph.

**Failure scenario:** the next team, the harness or Setup looks for an organisation-wide read in `api_surfaces.md`, finds only `task-item-counts`, and adds a third per-project loop. Nothing written down says that `item-status-counts` carries OVERSEE, or that its 503 rule covers the whole organisation.

**Suggested fix:** two bullets after `:466`, in #97's style:
- `GET /organizations/{org_id}/tasks`: any member (`403` otherwise); every task in the organisation's projects, archived ones included, as `list[TaskRead]`, ordered by project, creation and id; it equals `GET /projects/{id}/tasks` over the organisation's projects. The Projects and Dashboard pages read it once per organisation, falling back to the per-project read if it fails.
- `GET /organizations/{org_id}/item-status-counts`: OVERSEE organisation-wide (`403` otherwise); `[{project_id, item_status_counts}]` for every project, all zeros for a project without items; the same query as the per-project overview counts; `503` if any item in the organisation has an unrecognised status. The Dashboard's Canonical Decisions reads it once per overseen organisation.

Optionally, point to it from the overview-counts paragraph at `:91`.

### 3. Should-fix: two claims in the PR description (and the ticket text) are wrong

`reviews/W11/pr-cs57-hanchen-scrum-121-reads-never-write.md`, Testing and Decisions for review.

**a. "PostgreSQL 18: 2574 passed … at `8a9fb31`. Not rerun locally since; CI runs it once this is ready."** `.github/workflows/backend-tests.yml:83` gives the job `if: ${{ github.event_name != 'pull_request' }}`, so marking the PR ready runs SQLite and web only. PostgreSQL runs after the merge to `main`, or by hand from the Actions tab. Commits 6–7 add two new SQL queries:
- a join on `ProjectDB.organization_id`;
- a `GROUP BY project_id, status` over an `IN` list.

They also add 7 statement-count tests. The author never ran any of these on PostgreSQL. *Failure scenario:* a reviewer approves expecting CI to check PostgreSQL, and a dialect problem would surface only on `main`. (I found none: 2,595 passed, 3 skipped at `17281e3`.) *Fix:* replace the sentence with this run, or run `workflow_dispatch` on the branch and link it.

**b. "Each batched read falls back to the per-project path if it fails, as #97's counts read does."** This holds for the tasks read (`project-data.ts:363`–`:365`) and the project page's counts (`:529`–`:530`). It does not hold for Canonical Decisions:
- `dashboard-canonical-count.ts:22`–`:27` returns `null` when any organisation read fails;
- it never asks `GET /projects/{id}/overview/item-status-counts`.

The ticket text says the same thing ("Each batched read falls back to the per-project path if it fails"). The behaviour is right: SCRUM-128's rule is that a partial sum is wrong, and the per-project read would be refused or fail in the same cases. The claim is not. *Fix:* "The tasks read and the project page's counts fall back to the per-project path if they fail. Canonical Decisions keeps SCRUM-128's rule: any failed read gives no figure." Make the same change in SCRUM-121's description.

### 4. Nit: one rewritten assertion holds whatever the code does

`apps/hej-api/tests/test_independent_second_review.py:2794`. In the per-author loop, `current_expert_send_back_at(db, TASK, ITEM, predecessor=previous) is None`. Nine lines earlier (`:2785`) the test asserts `previous.is_latest is False`, and `current_expert_send_back_at_by_submission` filters `AnnotationDB.is_latest.is_(True)` (`task_item_status_resolution.py:132`). So the call returns `None` because `previous` is superseded, not because its Return was used up. This is the same reason the PR gives for deleting `test_task_item_reopen.py`'s history-only case.

The comment says "a peer's stays its own", but no assertion checks it. *Fix:* when `index == 0`, assert that the other author's original still has its Return: `current_expert_send_back_at(db, TASK, ITEM, predecessor=db.get(AnnotationDB, originals[author_order[1]])) is not None`. That is the assertion that would catch a peer's resubmission consuming someone else's Return. Or drop the line, since the queue assertions below it carry the guard.

### 5. Nit: stale wording about the repair

- `test_independent_second_review.py:3703`, the docstring of `test_task_list_returns_current_status_with_a_strongly_cached_pre_review_item`, says "A writer finishes before the read's filtered repair queries execute." There are no repair queries now; the test pins the status column read.
- `review_policy_enforcement.py:408`, `item_status_after_accept`'s docstring, says "after a review, submission, or read reconciliation". It is a one-word docstring fix in someone else's hot file, so leave it if you'd rather not touch the file.

### 6. Nit: a test labelled Guard that fails on the old code

`apps/hej-web/lib/project-data-loader.test.ts:322`, "Guard. A task the counts don't list yet is counted from its setup alone". It fails on `main`'s `project-data.ts` (checked), so by `tech-stack.md`'s testing discipline it is a Prove. The plan called it one too. Relabel it, or reword the PR's "4 of 5 fail" to say which ones.

### 7. Nit: small efficiency points, not worth a change now

- `project-data.ts:326`–`:328`: `inProjectOrder` filters the whole task list once per project, which is O(projects × tasks). It is fine at the bed's 51 × 102. A `Map` grouped by `project_id` would be linear. Also, the batched path orders a project's tasks by `created_at, id` (`db_store.py:1305`), while the fallback keeps `list_by_project`'s unspecified order. That is harmless, since `projectsOverviewSignature` only re-renders.
- `project_overview_service.py:22`–`:35`: the organisation counts take two queries, the project ids and then `IN (...)`. A single `LEFT JOIN` from `ProjectDB` would do it in one. The statement count stays fixed either way.

---

## Not for the PR

- **`role_assignments.project_id` is an integer** (`db_models.py:209`), while project ids are strings. A project-scoped role therefore cannot point at a real project on PostgreSQL: my probe failed with `invalid input syntax for type integer: "p_active"` until I used `1`. It doesn't matter today, because no check reads project-scoped roles (`permissions.py:460`–`:467`). It is worth a line in the handover if project-scoped roles are ever meant to work.
- **The PostgreSQL job never runs on pull requests.** For a PR that changes queries, run `workflow_dispatch` once before merging, or ask the reviewer to.
- **Legacy data only:** on a database that still holds pre-#48 item-level Return rows, the list now reports the stored `annotated` while the annotate queue (`current_expert_send_back_at_by_submission`) can still offer rework. #88 resets every development database and there is no deployment, so nothing should hold such rows. SCRUM-134 retires `expert_send_back` itself.
- **Pre-existing, not from this PR:**
  - `api_surfaces.md:91`–`:93` says the overview counts need "project-management permission"; the code checks OVERSEE.
  - `test_task_item_reopen.py:30` and `:62` import `decide_escalation` and `EscalationDecisionRequest` without using them, on `main` too.
- **Commits and title:** fine. All seven non-merge headlines are `type(scope): … (A6, SCRUM-121)`, and the title follows the 2026-10-23 rule. Docs are under 2% of the changed lines, so they are not a scope. One quibble: `tech-stack.md` asks for the body to end with the reference, and these bodies carry it only in the headline. Earlier PRs do the same.
- **Numbers in the description that I confirmed:** SQLite 2535/63; web 1026 (109 files); casebook 87/87 + 1; 15 deleted cases (7 in `test_task_item_status_resolution.py`, 7 in `test_independent_second_review.py`, 1 in `test_task_item_reopen.py`); `80 against 260`; `4 against 14`; `5 against 15`. I did not rerun the perf bed.
