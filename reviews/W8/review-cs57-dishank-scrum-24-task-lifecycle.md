# Review — PR #41, `CS57-Dishank` (SCRUM-24, B4; issues 28 and 30)

2026-09-30. Head `1765a5c`, base `main`; merge-base `c5b428b` (#36). `main` is at `e367ebd` (#28); GitHub
reports **MERGEABLE / CLEAN**. Six commits, 39 files, +1679 / −258.

**On GitHub (checked with `gh pr view 41`):** open since 2026-09-28. **Yi requested changes** on 2026-09-30
08:03 (four points, below); Dishank pushed `6e5a7b0` and `1765a5c` the same day in answer and has not
replied on the PR. No other reviews or comments. CI green on the head (SQLite and PostgreSQL). Board:
SCRUM-24 *In Review*, Dishank.

**Read before this review:** SCRUM-24 on the board (6 criteria + issue 30); story B4; the client's answer
to question 2 ("anything reasonable, no hard requirement"); `sandbox/W7/jira/jira-bug-task-delete.md`
(issue 30: decide first whether a task holding review history is deletable at all; never 500). Earlier
messages to Dishank (`sandbox/W7/msg/message-dishank-SCRUM-43.md`) are about B6's completion rule, which
this PR reuses as asked.

**Decided by Hanchen for this review (2026-09-30):** the missing web controls block, and are added in this
PR; the delete policy is Dishank's call and stays a non-blocking suggestion.

**Recommendation: request changes — two items.** The lifecycle is well built and well documented:
explicit endpoints under `MANAGE_TASK`, one transition table, SCRUM-43's completion rule reused, intake
closed outside `draft`, every work-accepting write gated to `active`, `409` instead of `500` on delete, and
`workflow_states.md` rewritten in the same change. All four of Yi's points are fixed, each with tests.
Before merge: the web app must be able to activate a task (today, after merge, nothing created in the UI
can be annotated), and the work queues must stop offering work the API then refuses.

## Verified

- PR head: backend (in-memory SQLite) **718 passed, 6 skipped**, 207 subtests. The description's "292
  passed" predates the last four commits.
- Probes on the PR head (`scratchpad/wt-pr41/apps/hej-api/tests/test_zz_probe_pr41.py`, not in the PR):
  - draft task with 2 items → annotate queue offers **2 rows**; creating a draft on either → **409** "Task
    is not accepting work while in status: draft". Same for a paused task (finding 2);
  - a draft task whose 2 items carry only intake placeholders → delete **409** (finding 3).
- Web: no call to `/activate`, `/pause` or `/resume` anywhere in `apps/hej-web`; `ApiTaskStatus` is still
  `draft | ready | in_review | disputed | completed` (finding 1).
- Trial merge with Yi's #42: **2 conflicts** — `uploads.py` (#42 rewrites `upload_texts`) and
  `database.py` (both add PostgreSQL work at the top of `migrate_db_schema()`; the resolution must keep
  both, with `migrate_legacy_task_statuses()` running before #42's PostgreSQL early `return`).

## Yi's review of 2026-09-30

| # | Yi's point | On `1765a5c` |
| --- | --- | --- |
| 1 | Activating an empty task strands it (intake closed, no way back, cannot complete) | ✅ `activate_task` refuses with 409 when the task has no items — `test_activate_without_items_is_rejected` |
| 2 | Legacy statuses not migrated on PostgreSQL (`migrate_db_schema` returns early) | ✅ `migrate_legacy_task_statuses()` runs before the SQLite-only return — `test_postgresql_dialect_still_runs_the_backfill` |
| 3A | AI runs at intake while the task is still draft | ✅ Intake does no AI work at all; activation starts the first AI pass (worker: enqueue; inline: run). Documented in `workflow_states.md` and as an amendment in `ai_batch_execution_architecture.md` |
| 3B | `start_ai_run` does not check the lifecycle | ✅ `assert_task_accepts_work` before `start_run` |
| Extra | A batch keeps running when the task is paused | ✅ Claims join `tasks` and require `active`; `record_result` and `record_analyzer_unavailable` re-read the status and hand the claim back (`_release_on_pause`, lease-checked) — four worker tests |

Dishank should say so on the PR, so Yi can re-review. Moving the AI pass from intake to activation is a
real design change to C2 (Michael's flow). It is the right call: no AI work on a draft task, and it also
takes the per-record inline model calls out of #42's upload request. Michael should hear about it before
merge.

## Scope — SCRUM-24 on the board, point by point

| # | Board description | On `1765a5c` |
| --- | --- | --- |
| 1 | `draft → active → completed`, `paused` from `active` and back | ✅ `TASK_STATUS_TRANSITIONS`; anything else 409 |
| 2 | PM triggers each step (`MANAGE_TASK`); explicit endpoints, not a generic status write | ✅ `/activate`, `/pause`, `/resume`, `/complete`; `TaskUpdate` has no `status`. `/complete` moved from `RELEASE` to `MANAGE_TASK` — consistent, worth one line in the description |
| 3 | Completes only once every item is finished, using SCRUM-43's rule | ✅ `assert_task_completeable`, and only from `active` |
| 4 | Dataset intake closes once active | ✅ `draft` only (was `draft`/`ready`), checked in all four upload routes before any file is written, and again in `register_dataset` |
| 5 | SCRUM-48's queues offer work only in the task states this defines | ❌ **Not done** — finding 2 |
| 6 | States and transitions in `workflow_states.md` in the same change | ✅ v1.3, with triggers, operational rules and the export projection |
| Issue 30 | Decide the policy, then never 500 | ✅ Decided and documented: no cascade; a task with items or a project with tasks is 409, and residual `IntegrityError`s map to 409. Route-level tests. See finding 3 on how far it goes |

**Beyond the ticket:** the AI pass moves to activation (above); the project export listing no longer hides
tasks that are not `completed` — it shows `draft` / `building` / `ready` by the new status mapping. Both are
reasonable, and both belong in the PR description, which still describes the first commit only.

## Fix before merge

### 1. The web app cannot activate a task, so nothing created in the UI can be worked on

The ticket said "only backend", but the backend now refuses work outside `active`, and only the new
endpoints reach `active`. After merge, in the running app:
- every task created in the UI stays `draft`, so creating, saving or submitting a draft, and every review
  and dispute action, is refused with 409;
- an AI-assisted task never gets its AI pass, which now starts only on activation;
- the startup backfill moves `ready` / `in_review` / `disputed` to `active`, but tasks already in `draft`
  (most dev tasks, since nothing could leave `draft` before) stay stuck in the same way;
- `mapApiTaskStatus` (`lib/project-data.ts:150`) has no case for `active` or `paused`, so it returns
  `undefined` for them.

This is the first week of scenario testing, and the Definition of Done asks for a demonstration in the
running app. **Decided by Hanchen: add it in this PR.** The minimum:
- `ApiTaskStatus` in `lib/api/tasks.ts` → `draft | active | paused | completed`, and
  `activateTask` / `pauseTask` / `resumeTask` next to `completeTask`;
- Activate / Pause / Resume buttons beside the existing Complete button in
  `task-overview-panel-with-real-data.tsx`, shown by status, with the API's 409 message on refusal;
- `mapApiTaskStatus` for the new states;
- `canIntakeDataset` in `task-dataset-registration-panel.tsx:153` → `draft` only (it still allows `ready`);
- a vitest for the buttons, and a short manual walkthrough: create → upload → activate → annotate →
  pause (refused) → resume → complete.

### 2. The work queues still offer work on draft and paused tasks (criterion 5)

`TaskWorkQueueService.list_annotation_queue` / `list_review_queue` / `list_adjudication_queue` and their
routes never read the task's status. Probe: a draft or paused task's annotate queue returns both items,
and the draft create for either is refused with 409. The annotator sees work and then gets an error. Return
an empty queue (or refuse with the same 409) unless the task is `active`, in all three queues, with a test
each.

## Not blocking

3. **Deleting a draft task after a wrong upload.** The rule refuses any task with items, even a `draft`
   one whose items carry nothing but intake placeholders. Intake closes on activation and there is no item
   delete, so a mistaken upload cannot be undone; the only way out is a new task beside the stuck one.
   Issue 30 asked Dishank to decide, and "no cascade" is documented and defensible. A later refinement:
   allow deleting a `draft` task whose items have no human work or history beyond intake.
4. **Activation and intake race.** `register_dataset` checks `draft` without locking the task row. An
   intake that commits just after an activation adds items to an active task; on an AI-assisted task they
   get no AI pass (activation listed its items before they existed). Rare; locking the task row in both,
   or a `start_ai_run` afterwards, covers it.
5. **Inline activation holds the request for every model call.** In `inline` mode, activating an
   AI-assisted task runs one model call per item before responding, and commits once at the end. That
   matches what intake did before; with #42's record files (hundreds of items) it is worth one line
   recommending `worker` mode.
6. **PR description.** Update it: the test count, the AI-at-activation change, `/complete` under
   `MANAGE_TASK`, the export listing change, and a reply to Yi's four points.

## Not checked

- The web app itself (finding 1 is from the code and the API: no web call reaches the new endpoints).
- The PostgreSQL backfill against a real legacy database (CI's PostgreSQL job runs the suite).

---

## Comment to post on the PR (condensed)

**Posted 2026-09-30 12:30 UTC** by `hanchen9127` as a *Request changes* review on the head `1765a5c`, with the
text below unchanged except that the hard line breaks were removed.

> Thanks @Dishankaswal — the lifecycle is solid and well documented: explicit endpoints under `MANAGE_TASK`,
> one transition table, SCRUM-43's completion rule reused, intake closed outside `draft`, every
> work-accepting write gated to `active`, 409 instead of 500 on delete, and `workflow_states.md` updated in
> the same change. All four of @DIQI26's points are fixed with tests: empty activation refused, the backfill
> runs on PostgreSQL, AI moved from intake to activation with `start_ai_run` gated, and paused tasks stop
> claims and hand in-flight results back. Moving the AI pass to activation changes C2's flow, so please
> give @mike-ad a heads-up. On the head (`1765a5c`): 718 passed + 6 skipped.
>
> **Two things before merge:**
>
> 1. **The web app can't activate a task, so nothing created in the UI can be worked on after merge.**
>    Every new task stays `draft`, so drafts, reviews and disputes all get 409, and an AI-assisted task
>    never runs its AI. Dev tasks already in `draft` are stuck too. `mapApiTaskStatus` has no case for
>    `active`/`paused`. We're scenario-testing this week, so please add the minimum in this PR:
>    - `ApiTaskStatus` → `draft | active | paused | completed`, plus `activateTask` / `pauseTask` /
>      `resumeTask` in `lib/api/tasks.ts`;
>    - Activate / Pause / Resume beside the existing Complete button in
>      `task-overview-panel-with-real-data.tsx`, showing the 409 message on refusal;
>    - `mapApiTaskStatus` updated for the new states;
>    - `canIntakeDataset` → `draft` only;
>    - a vitest and a quick walkthrough (create → upload → activate → annotate → pause → resume → complete).
>
> 2. **The work queues still offer work the API refuses (SCRUM-24 criterion 5).** None of the three queue
>    services or routes read the task status. A draft or paused task's annotate queue returns its items, and
>    creating a draft on any of them is 409. Return nothing unless the task is `active`, with a test per queue.
>
> **Not blocking:**
> - Delete: a `draft` task whose items carry only intake placeholders can't be deleted either, so a wrong
>   upload can't be undone. No cascade is a fair policy; allowing delete of an untouched draft task could
>   come later.
> - `register_dataset` checks `draft` without locking the task row, so an intake racing an activation can
>   land items on an active task with no AI pass.
> - Inline activation runs one model call per item before responding. With #42's record files that's
>   hundreds, so `worker` mode is worth recommending.
> - Please refresh the description (test count, AI at activation, `/complete` now `MANAGE_TASK`, export
>   listing shows all states) and reply to Yi's points so he can re-review.
> - Heads-up: #42 conflicts in `uploads.py` and `database.py`. Whichever merges second keeps both
>   PostgreSQL steps, with the status backfill before #42's early `return`.
