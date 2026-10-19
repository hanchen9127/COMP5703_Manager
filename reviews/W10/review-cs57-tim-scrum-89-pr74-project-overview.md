# Review — PR #74, `CS57-Tim` (SCRUM-89, J2: project overview of status and progress)

**Posted 2026-10-15 05:16 UTC** as a Request changes review by `hanchen9127`. The posted text is this file
without this header and without the worktree row. Reviewed at `fd8b2c5` (4 commits, base `main` = `c3ac7a8`,
mergeable today). Nothing else was on the PR before it.
<https://github.com/USYD-CS-Capstone/hej/pull/74>

## Verdict: request changes

The overview itself is the right size for J2: project status, task counts by lifecycle state, item totals,
export progress and a raw status breakdown, all on the existing project page. The new endpoint is small,
gated on `MANAGE_PROJECT`, and the page keeps working without it. The refresh hardening in
`use-live-project-workspace.ts` (coalescing, keeping the last good view, nothing queued after unmount) is a
real improvement.

The PR misses its own criterion 2, though: *figures agree with the task and export screens*. Three problems
have the same cause. Since PR #48 (`c196b98`, 2026-10-11) `main` treats `unresolved` as a finalised,
export-eligible outcome, and this PR is built on the rule from before that change:

1. The task screen now counts only `canonicalized` items as finalised. A task holding any `unresolved`
   item can no longer be completed from the UI, although the backend allows it. **This is a regression.**
2. The "Reviewed" counter and the existing "Reconciliation" counter count the same items, so the task
   screen's totals add up to more than the number of items.
3. The project breakdown leaves `unresolved` out, so its rows don't add up to "Total items".

Web typecheck also fails (5 errors in this PR's tests), and `api_surfaces.md` is reformatted wholesale while
five open PRs edit the same file.

## Checked locally

| Check | Result |
| --- | --- |
| Worktree `D:\COMP5703_Capstone\hej-review-74` at `fd8b2c5` | `main` checkout untouched |
| `uv run pytest -q` (SQLite) | ✅ **1,804 passed, 18 skipped**, 209 subtests, 4 min 20 s (matches the PR body) |
| `npm run test:web` | ✅ 60 files, 555 tests (matches the PR body) |
| `npm run typecheck:web` | ❌ **5 errors**, all in this PR's test files (finding 4). CI doesn't run it |
| CI (Backend tests) | SQLite ✅, PostgreSQL ✅ |
| Reviewer probe (temporary vitest file, deleted afterwards) | Confirms findings 1 and 2. Output below |
| Running app | Not run. The probe drives the real mapping functions (`mapApiItemToMock` → `getTaskItemStatusCounts` → the KPI builders), so the screens show exactly these numbers |

Probe: three API items with statuses `canonicalized`, `reviewed` and `unresolved`, mapped the way the task
screen maps them:

```text
ui statuses  canonicalized->approved, reviewed->reconciliation, unresolved->unresolved
counts       approved:1 reviewed:1 exportEligible:1 reconciliation:1 unresolved:1
lifecycle    Draft:0 Submitted:0 Returned:0 Reviewed:1 Finalized:1 Rejected:0 Disputed:0 Reconciliation:1 Unresolved:1   sum 4 of 3
outOfScope   Reviewed:1 Finalized:1 Disputed:0 Reconciliation:1 Unresolved:1
narrative    1 awaiting reconciliation · 1 reviewed · 1 finalized · 1 unresolved
canCompleteTask (canonicalized + unresolved)   false     (backend: completeable)
```

## Scope, criterion by criterion

| # | SCRUM-89 / J2 | At `fd8b2c5` |
| --- | --- | --- |
| 1 | Project status, item counts by state, basic workflow statistics | ✅ Status, task counts (draft/active/paused/completed), total items, export eligible, progress %. ⚠️ The by-state breakdown misses `unresolved` (finding 3) |
| 2 | Figures agree with the task and export screens (B6) | ❌ The project tiles come from the export packages, which count `unresolved` as eligible. The task screen counts `canonicalized` only. The task screen also double-counts `reviewed` (findings 1, 2) |
| 3 | Deliberately limited | ✅ One small endpoint, one card, no new screen. Builds on the existing project page as the ticket asked |
| DoD | Tests in the same change | ✅ Many. But the KPI tests build items in a state the app never produces (`status: approved` with `rawStatus: "reviewed"`), which is why they didn't catch finding 2 |
| DoD | Docs sync | ✅ The endpoint is documented in `api_surfaces.md`. ⚠️ The rest of the file is reformatted (finding 5) |
| DoD | Typecheck | ❌ Finding 4 |

## Fix before merge

### 1. `unresolved` is a finalised outcome on `main`, and the task screen stopped treating it as one

On `main` (`apps/hej-api/app/services/task_service.py:291`):

```python
EXPORT_ELIGIBLE_TASK_ITEM_STATUSES = frozenset({CANONICALIZED, UNRESOLVED})
```

`assert_task_completeable` uses this rule, and so do the export packages' `completed_item_count`. It has been
like this since PR #48 (`c196b98`, 2026-10-11).

This PR changes the web the other way:
- `task-format.ts`: `exportEligible = rawStatus === "canonicalized"`.
- `task-overview-panel-with-real-data.tsx`: `finalizedCount = itemCounts.exportEligible`. Before, it was
  `approved + unresolved`, which was correct.

Consequences, for a task with one canonicalised item and one unresolved item:
- The **Complete task** button stays disabled (`canCompleteTask` is false), while
  `POST /tasks/{id}/complete` would succeed. The probe confirms it.
- The task screen says "1/2 finalized", while the project overview says "Export eligible 2" and "100%".
  These are the two numbers criterion 2 says must agree.
- On the same task screen, the phase pipeline's "final" count still adds `unresolved`, so the screen also
  disagrees with itself.

**Fix:** count `canonicalized` and `unresolved` as finalised on the web, matching the backend, with one
shared constant rather than a literal in each place. If you want the UI to show unresolved separately,
show it *inside* finalised (for example "2 finalized, 1 of them unresolved"), not as a separate outcome. The
PR body's "Count only raw `canonicalized` items as finalized and export eligible" needs correcting too.

### 2. "Reviewed" and "Reconciliation" are the same items, counted twice

`status-mapping.ts` maps the raw `reviewed` status to the UI's `reconciliation`. The new `counts.reviewed`
(`rawStatus === "reviewed"`) therefore counts exactly the same items as the existing `counts.reconciliation`.
Both are now shown:
- in `buildOverviewLifecycleSegments`, as "Reviewed" and "Reconciliation". The bar adds up to 4 for 3 items;
- in `buildAnnotateDistribution`, among the out-of-scope segments;
- in `buildOverviewNarrative`: "1 awaiting reconciliation · 1 reviewed";
- in `buildOverviewDetailMetrics`.

The "Reviewed" segment also takes the *approved* colour (`visualStatus: APPROVED`), so an item still waiting
for an expert decision looks finished.

**Fix:** drop the new `reviewed` counter and keep "Reconciliation". If a separate counter is wanted, remove
the old one, so each item is counted once. Change the KPI tests to build items through `mapApiItemToMock`
from an API status, so they can't hold combinations the app never produces. Add a test that the lifecycle
segments sum to the item count.

`reviewed` is also about to mean "held at the Expert Gate" (SCRUM-118, Yi, this week), which is one more
reason not to call it "Reviewed": an item in that state is waiting for an expert, not done.

### 3. The project status breakdown misses `unresolved`

`itemStatusRows` in `project-workspace-overview.tsx` lists 8 statuses. `TaskItemStatus` has 9, and the
backend returns all 9. `unresolved` is a terminal outcome that a dispute Reject or a reconciliation
`reject_all` produces, so the rows don't add up to "Total items" once one exists. The PR body's "all eight
raw task-item workflow states" has the same miss.

**Fix:** add the row. Use the labels the task screen uses, so a manager can match the two screens. Today the
project card says "Reviewed" and "Canonicalized", while the task screen says "Reconciliation" and
"Finalized". Better still, derive the rows from the response keys, so the next status cannot be dropped.

### 4. Web typecheck fails

`npm run typecheck:web` at `fd8b2c5`:

```text
lib/project-data-loader.test.ts(118,63): TS2739 'never[]' is missing ... from type 'ApiProjectDisputeList'
lib/project-data-loader.test.ts(123,7):  TS2741 Property 'unresolved' is missing ...
lib/project-data.test.ts(312,38):        TS2345 ... 'itemStatusCounts' ... 'unresolved' is missing
lib/project-data.test.ts(315,9):         TS2741 Property 'unresolved' is missing ...
lib/project-overview-metrics.test.ts(24,3): TS2322 ... 'unresolved' ... 'number | undefined'
```

Four of the five errors are finding 3 showing up in the test fixtures. The first comes from the main merge:
the dispute list type changed with SCRUM-103. CI runs only the backend tests, so please run
`npm run typecheck:web` locally before you push.

### 5. Revert the formatting of `api_surfaces.md`

The file shows +144 −136, but the content change is one five-line paragraph. The rest is a formatter
rewriting the bullets (`*` → `-`), emphasis (`*run*` → `_run_`) and table rules. PRs #63, #65, #66, #70 and
#73 all edit this file, so whichever of them merges after this one will conflict throughout. Keep only the
paragraph.

The same applies, on a smaller scale, to the web files: about 70 lines change only by Prettier wrapping, for
example `task-side-panels.tsx`, `api-fallback-banner.tsx`, `live-hydrate.ts`, and the JSX in
`task-overview-panel.tsx`. That is not blocking, but it hides the real changes from review.

## Suggestions (not blocking)

- **S1.** `test_project_overview_service.py` mocks the session and compares SQL strings
  (`"tasks.project_id = :project_id_1"`). Any query refactor breaks it, and it proves nothing the
  database-backed route test doesn't already prove. Consider deleting it, or replacing it with a
  database test that also covers an item in a *draft* task and an item with an unknown status. The service
  drops unknown statuses silently, which is the other way the breakdown can stop adding up.
- **S2.** The route test covers a manager and an annotator in the same organisation. Add a manager from
  **another** organisation (expect 403/404), because the counts are project-scoped data.
- **S3.** `getProjectWorkspaceView` now throws when `listTasks` fails. Before, it showed the project with no
  tasks. Throwing is fine, given that the hook keeps the last good view, but please say so in the PR body:
  it is a behaviour change outside the overview.
- **S4.** `project-data.ts`: the `itemStatusCounts` ternary is mis-indented (`? itemCountsResult...` at
  column 4).

## What is good

- The `MANAGE_PROJECT` gate, with the reason (blind-review workflow state) written in the docs, and a page
  that degrades to "unavailable" instead of failing.
- The export panel's headline now counts packages (`packageCount`). Before, it printed the finalised-item
  count as "N draft task export packages available", which was a real bug.
- The refresh signature now includes task statuses, item counts, enforcement and resolved policies, so the
  page updates when any of them change.
- `key={projectId}` on the shell, so moving between projects never shows the previous project's state.

---

## Round 2 — `699ff76` (2026-10-15)

**Posted 2026-10-15 11:11 UTC** as a PR comment, in a shorter form: it confirms the five fixes, asks for the
"Reviewed" → "Reconciliation" label, and says the approval follows the S1–S4 push
(<https://github.com/USYD-CS-Capstone/hej/pull/74#issuecomment-6190682667>). The review stays at Request
changes until then. Tim replied on the PR at 06:53 UTC: all five findings addressed, and S1–S4 still in progress.
The fix commit changes web and docs files only; no backend file changed.

| Check | Result |
| --- | --- |
| `npm run test:web` | ✅ 60 files, 555 tests |
| `npm run typecheck:web` | ✅ 0 errors (was 5) |
| CI (Backend tests) | SQLite ✅, PostgreSQL ✅ |
| Reviewer probe, re-run (deleted afterwards) | ✅ Output below |

```text
lifecycle     Draft:0 Submitted:0 Returned:0 Canonicalized:1 Rejected:0 Disputed:0 Reconciliation:1 Unresolved:1   sum 3 of 3
distribution  Draft:0 Returned:0 Rejected:0 Handed to review:0 Canonicalized:1 Disputed:0 Reconciliation:1 Unresolved:1   sum 3
narrative     1 awaiting reconciliation · 2 finalized · 1 of those unresolved
canCompleteTask (canonicalized + unresolved)   true
```

| Finding | At `699ff76` |
| --- | --- |
| 1. `unresolved` is finalised | ✅ `EXPORT_ELIGIBLE_TASK_ITEM_STATUSES` (canonicalized, unresolved) in `task-format.ts`, with a comment tying it to the backend rule. `exportEligible`, and with it `canCompleteTask`, uses it. The breakdowns use `approved` (canonicalized) and `unresolved` separately, and the narrative reads "2 finalized · 1 of those unresolved", as suggested |
| 2. Reviewed counted twice | ✅ The `reviewed` bucket is gone from the lifecycle, the distribution, the narrative and the detail metrics. A new test maps real API statuses through `mapApiItemToMock` and checks that both bars sum to the item count |
| 3. Breakdown misses `unresolved` | ✅ Row added. ⚠️ **Still open:** the project card labels raw `reviewed` as "Reviewed", while the task screen shows the same items as "Reconciliation". The rows are still a hand-written list rather than derived from the response, which was optional |
| 4. Typecheck | ✅ Fixtures include `unresolved`; the disputes mock is fixed |
| 5. `api_surfaces.md` | ✅ +11 −5 against `main`: the overview paragraph, trailing-space removal on three lines, and the "A any" typo fixed. No conflict risk now |

Still on the task screen: the phase pipeline counts raw `reviewed` under "review" (`task-overview-panel.tsx:193`, `detectTaskPhase`). No item is counted twice, because the pipeline has no reconciliation phase, so this is acceptable.

**Verdict for this round:** the blocking findings are fixed. One small point is left: rename "Reviewed" to
"Reconciliation" on the project card. It is a one-line change, and SCRUM-118 will make `reviewed` also mean
"held at the Expert Gate", so "Reviewed" will be more misleading still. Approve once that and the S1–S4 push
land, after checking the new commit.

---

## Round 3 — `c882bab` (2026-10-16)

**Posted 2026-10-16 08:05 UTC as Approve** (condensed; Tim's reply comment of 07:58 matches the checks), then merged by hanchen9127 with a merge commit, `4ab7c91`. Tim pushed `c882bab` (S1–S4 and the label). GitHub: `MERGEABLE`, review decision still
`CHANGES_REQUESTED`.

**CI shows failure, but no test ran.** Both jobs ended in 3 s with no steps. The check-run annotation says: "The job
was not started because recent account payments have failed or your spending limit needs to be increased". That
is the organisation's GitHub Actions billing, not this PR. Until it is fixed, CI won't run on any PR, so the checks
below were run locally.

| Point | At `c882bab` |
| --- | --- |
| Label | ✅ The project card shows raw `reviewed` as "Reconciliation", matching the task screen (and SCRUM-118's gate hold, now on `main`) |
| S1 | ✅ The mocked SQL-string test is deleted. The database route test now has an item in a **draft** task (counted under `pending`, sum 4) and parametrises an unknown and a NULL stored status. Tim chose to fail loudly: the service returns **503** instead of partial counts, the page shows the breakdown as unavailable, and `api_surfaces.md` says so. An unknown status in *another* project doesn't affect this one |
| S2 | ✅ A `task_owner` of another organisation gets 403 |
| S3 | ✅ The PR body states that a failed task list now marks hydration as failed, and that the last good view is kept |
| S4 | ✅ Indentation fixed |

Trial merge of `main` at `f88793c` (#66, #70, #73, #76 in; no conflicts; aborted afterwards, worktree clean):
- Backend, full SQLite: **2,034 passed, 21 skipped**, 209 subtests.
- Web: `typecheck:web` clean; `test:web` **62 files, 614 passed**.
- PostgreSQL: not run (no CI). The only backend change is one grouped count query and its test.

Nits, not blocking:
- 503 says "try later" for what is a data-integrity problem. 500 would be more exact, but the page treats both the
  same way.
- Test style in `test_project_overview_route.py`: `user_id = 103` (spaces around keyword `=`), missing trailing
  commas, a "organisaiton" typo.

### Verdict: approve and merge

Every point from rounds 1 and 2 is fixed. The branch merges cleanly with today's `main` and passes the full backend
and web suites locally.
