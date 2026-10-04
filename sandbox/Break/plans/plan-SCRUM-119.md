# Plan — SCRUM-119: Read a task's drafts in one request

2026-10-04. Story **A6** (P1, added 2026-10-04), first ticket. Board: W9, 2 points, Jason Wang (Hanchen).
Ticket text: `../jira/jira-perf-investigation.md` → SCRUM-119. Evidence: `../tests/perf-findings.md`.
A6 has no feature spec yet; its criteria are in `shared/story_src.csv`.

**When:** after SCRUM-70's casebook structure (Hanchen's break work comes first), then this. In review by Wed
7 Oct, it counts as break work and Hanchen's W9 drops to F1 alone (roadmap → Week boundaries); otherwise it stays W9.

**Branch:** `CS57-Hanchen-scrum-119` from `origin/main` (`df7c05a` or later).

## Goal and target

A 200-item Annotate page sends 404 requests and takes 2,969 ms, because the task shell fetches drafts once
per item and Annotate and Review fetch them all again. One batched read replaces both.

| Page @200 items (perf bed) | Today | Target | Prototype |
| --- | --- | --- | --- |
| Annotate, Review, Items | 2,969 / 2,979 / 1,585 ms | under 300 ms | 222 / 233 / 235 ms |
| API requests per page | 404 / 405 / 204 | at most 10 | 5 (6 with the tabs' refresh) |

## Ground rules (keep everyone else's work untouched)

| Rule | Why |
| --- | --- |
| `GET /task-items/{id}/drafts` is not changed | PR #39's harness (`evaluation/harness/driver.py:327`) and the panel's save path (`lib/api/task-items.ts:253`) call it |
| `AnnotationService.visible_to_caller` keeps its signature | `annotations.py` and `review_actions.py` (PR #48) call it. The batch rule is added beside it, sharing its pieces |
| Every item's list is exactly what the per-item route returns | Same `DraftRead` shape, same order (`created_at` desc), so `applyApiDraftsToMockItem` and every component below it stay as they are |
| Do not touch `task-item-workspace-sheet.tsx` or `task-workspace-data.ts` | The hottest files (SCRUM-117 now, SCRUM-32 and 87 in W9) |
| `api_surfaces.md`: only the read-independence table and *Task Items* | PR #48 edits *Disputes and Arbitration* |
| No schema change | Outside W9's day-one migration order |
| Out of scope | The send-back repair on reads (A6 subtask 3), project page counts (A6 subtask 4), deleting `use-hydrated-task-items.ts` |

## Commits

### 1. `refactor(api): decide peer visibility once per task (SCRUM-119)`

`app/services/annotation_service.py`. Today `should_hide_other_annotators(task_item_id, user)` loads the
item, task and project, checks REVIEW and ANNOTATE, then looks for the caller's current answer, all per item.

- Split it into two pieces: whether the caller's role hides peers in this organisation (REVIEW → no; ANNOTATE
  without REVIEW → yes), and whether the caller has a current answer on the item (`is_latest`, as
  `find_by_item_and_creator` reads it).
- `should_hide_other_annotators` and `visible_to_caller` keep their signatures and call the pieces. Behaviour unchanged.
- Add `visible_drafts_by_item(task, drafts, current_user) -> dict[item_id, list]`: the role check once; one
  query for the item ids where the caller has a current answer; `is_peer_work` per draft, as today.

Tests: guards, green before and after — `test_annotation_independence_privacy.py` and the list tests in
`test_draft_ownership_routes.py` (`test_annotator_list_hides_peers_drafts_until_they_submit` and the next three)
pass unchanged.

### 2. `feat(api): read every item's drafts in one request (SCRUM-119)`

- `app/schemas/drafts.py`: `TaskDraftsRead { task_id, drafts_by_item: dict[str, list[DraftRead]] }`. Every item of
  the task is a key, with `[]` when it has no visible draft, so the web can tell "none" from "not loaded".
- `app/api/routes/drafts.py`: `GET /tasks/{task_id}/drafts`.
  1. `verify_user_is_active`;
  2. the task (404), its project, and `verify_user_project_access`;
  3. the task's item ids, in one query;
  4. the drafts of those items, in one query, `selectinload(DraftDB.created_by_user)`, `created_at` desc;
  5. `visible_drafts_by_item`;
  6. `_to_draft_read`.
- The prototype (`../scripts/sandbox-perf-experiments.py` → `batch-drafts`) is the reference: 9 statements for 200 items.

Tests, new file `tests/test_task_drafts_read.py`, on the shared fixture:
- **Proves the change:** the per-item route runs one more set of statements per item, and the batch the same
  number of SELECTs for 3 items as for 30 (the `before_cursor_execute` pattern in `test_ai_run_progress.py:197`).
- **Equivalence**, for each item `drafts_by_item[id] == list_drafts(id).drafts`:
  - a reviewer: every draft;
  - an annotator who has answered: every draft;
  - an annotator who has not: their own, the AI's and the unclaimed placeholder; no peer's.
- 404 for an unknown task; 403 for a member of another organisation; 403 for an inactive user.

### 3. `docs: document the batched drafts read (SCRUM-119)`

`docs/design/backend/api_surfaces.md`:
- a row in *Annotator independence on reads* for `GET /tasks/{task_id}/drafts`: per item, what the per-item
  route returns;
- one line in *Task Items*: the shape, and that the per-item route stays.

### 4. `feat(web): client for the batched drafts read (SCRUM-119)`

`lib/api/task-items.ts`: `listDraftsForTask(taskId)` and `ApiTaskDraftsResponse`. Test in `task-items.test.ts`:
it calls `/tasks/{id}/drafts` and returns the map.

### 5. `perf(web): the task shell reads drafts in one request (SCRUM-119)`

`lib/live-task-workspace.ts:85-98`: one `listDraftsForTask(taskId)` instead of one call per item. Each item is
then `applyApiDraftsToMockItem(item, drafts_by_item[item.id] ?? [], …)`, as now. If the call fails, the items stay
unhydrated, as one item's failure does today.

`lib/live-task-workspace.test.ts` (mocks `listDraftsForTaskItem` today):
- "hydrates saved pending drafts" now reads them from the batch;
- "keeps live task items when draft hydration fails" fails the batch;
- new: the per-item read is never called.

### 6. `perf(web): Annotate and Review refresh drafts in one request (SCRUM-119)`

The two wrappers (`task-annotation-workspace-with-real-data.tsx:43`, `task-workbench.tsx:95`) hold the same
effect, word for word. Move it into one hook, `hooks/use-task-drafts-refresh.ts`: on mount and when the shell's
items change, one `listDraftsForTask`; apply as in commit 5; cancel on unmount. The tabs still refresh when
opened, so they show the same fresh data as today.

Test `hooks/use-task-drafts-refresh.test.ts`: one call per refresh, drafts applied, a late response after unmount ignored.

## Validation

1. `npm run check` (`test:api`, `test:web`, `typecheck:web`, `lint:web`). The suite on PostgreSQL as well (CI does both).
2. **Perf bed**, the same as the findings (`hej-perf` worktree, `hej-perf-pg`, seed snapshot):
   - check out the branch in the worktree;
   - point `sandbox-perf-load.py`'s batch mode at `/tasks/{id}/drafts`, with the tabs' refresh as one call;
   - run `sandbox-perf-matrix.sh` with `baseline` and the branch;
   - record Annotate, Review and Items @200 against the target, in the PR and in `perf-findings.md`.
3. **Equivalence on real data:** `sandbox-perf-equivalence.py` against the branch's route, for admin, `ann1` and `ann3`.
4. **Manual walkthrough** (`../tests/manual-test-SCRUM-119.md`, two browsers):
   - as an annotator who has not answered, Annotate shows only their own and the AI's drafts;
   - after they submit, peers' drafts appear;
   - a reviewer sees every draft;
   - save a draft, switch to Review and back: it is still there (the refresh);
   - Network tab: one drafts request per page load, and no `/task-items/{id}/drafts` on load;
   - reload, and look before acting.

## PR

- Into `main`, merge commit.
- Reviewer: Kanishka suggested (the read-independence rule came with SCRUM-48), or whoever is free at the break meeting.
- Description, per `tech-stack.md`:
  - summary with A6 and SCRUM-119;
  - changes by layer;
  - decisions: a new route beside the old one; the keyed map; the tabs keep refreshing;
  - testing, with the perf table before and after;
  - notes: the send-back repair is deferred (A6 subtask 3); SCRUM-120 is separate.
- After merging, tell the team in chat that `GET /tasks/{id}/drafts` exists, and ask SCRUM-32, 87 and 98 to build on it.

## After merge

- Log the PR in the tracker. A6 stays `working`: subtasks 3 to 5 remain.
- Mark SCRUM-119 Done, and update `roadmap.md` (W9 group 11, or the break if it was in review by 7 Oct).
