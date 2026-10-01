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

---

# Round 2 — head `c8443e6`

2026-09-30. Dishank pushed `c8443e6` at 13:14 UTC and asked for a re-review at 13:17
([comment](https://github.com/USYD-CS-Capstone/hej/pull/41#issuecomment-5912086411)). The comment also gives
Michael the heads-up about AI at activation and acknowledges the #42 conflict plan. `main` has not moved
(`e367ebd`); GitHub reports **MERGEABLE / CLEAN**; CI green on the head (SQLite and PostgreSQL). Yi's
*Changes requested* (on `987fec5`) still stands, so Yi needs to re-review too.

**Recommendation: approve.** Both blocking items are done, and nothing new blocks.

## The two blocking items

| # | Asked on `1765a5c` | On `c8443e6` |
| --- | --- | --- |
| 1 | Web can reach the new states | ✅ `ApiTaskStatus` is `draft \| active \| paused \| completed`; `activateTask` / `pauseTask` / `resumeTask` beside `completeTask`; the overview shows Activate (draft), Pause + Complete (active), Resume (paused), with the API's `detail` shown inline on refusal (`parseApiErrorMessage` reads it); `mapApiTaskStatus` covers all four; `canIntakeDataset` is `draft` only. The workspace maps the task through `mapApiTaskToMock`, so the buttons see these strings. Side fix: `completed` used to map to `pilot`, so the overview's *Completed* badge could never appear; now it does |
| 2 | Queues offer no work outside `active` (criterion 5) | ✅ All three queue services return `[]` unless the task is `active` (the three routes are their only callers); one paused-task test per queue |

## Verified

- Backend on the head (in-memory SQLite): **721 passed, 6 skipped**, 207 subtests — matches Dishank's count.
- Web: vitest **257 passed** (34 files); `tsc --noEmit` clean; ESLint on the changed files 0 errors
  (4 warnings, all on lines this PR does not touch).
- Walkthrough probe through the real services (`scratchpad/wt-pr41/apps/hej-api/tests/test_zz_probe_pr41_r2.py`,
  not in the PR):

  | Step | Status | Annotate queue | Draft create |
  | --- | --- | --- | --- |
  | activate with no items | — | — | 409 "no task items" |
  | after upload | draft | 0 rows | 409 |
  | activate | active | 2 rows | ok |
  | pause | paused | 0 rows | 409 |
  | complete while paused | — | — | 409 (transition not allowed) |
  | resume | active | 2 rows | ok |
  | complete with unfinished items | — | — | 409 (items not finalised) |

  The queue and the write refusal now agree in every state.

### Browser walkthrough (2026-10-01)

Run in headless Chrome (Playwright), isolated from the docker dev stack: a SQLite database seeded by
**`main`'s** `init_data.py` and `seed_test_roles.py` through `main`'s API, then the **PR head's** API started on
the same database (so the startup backfill ran on pre-merge data) and the PR head's web app on `:3001`.
Accounts: alice (PM), dana (annotator), erin (reviewer). Screenshots in the session scratchpad
(`pw/shots/`).

| Scenario | What the user sees |
| --- | --- |
| Pre-merge data after the switch | The five `ready` tasks from `init_data.py` are **Active**, with Pause + Complete (disabled until every item is finished). The sandbox task created through the API on `main` stays **Draft** |
| Annotator on a draft task | Before the switch dana saved a draft on the sandbox task (`201`); after it the same write is `409`. `/annotate` still lists every item with an *Annotate* button, the editor opens, and only Save draft / Submit show the red banner "Task is not accepting work while in status: draft." |
| PM activates / pauses / resumes | Each click about 1.6 s, with "Task activated." / "Task paused." / "Task resumed."; the buttons swap by state |
| Annotator and reviewer on a paused task | Save draft, Submit and erin's Accept each show "… status: paused." in the API's words; after Resume, erin's Accept goes through |
| Setup page outside `draft` | "Dataset intake is only available while the task is in draft status."; *Upload and register* disabled |
| Activating an empty task | "Task cannot be activated because it has no task items. Register the task's dataset before activating." |
| AI-assisted task (local Ollama `llama3`, inline mode) | Intake creates no AI run and no AI draft. Activate shows "Activating..." for **12.9 s** for three items, then all three are `annotated` |
| Complete | One item annotated and accepted → Complete enabled → the *Completed* badge and "Task completed." appear |
| Annotator on the overview | dana also sees Pause / Complete; clicking Pause shows the raw `403` role message |
| Project exports page | Lists every task now, including an empty draft task (`draft`, `building`, `ready`); the header still says "0 draft task export packages available" — that count sums `finalizedItemCount`, which is older than this PR |

## On merge day

- **Every task that is `draft` when the PR merges stops accepting work until its project manager presses
  Activate.** Tasks created in the UI, or by scripts, never left `draft` on `main`, so that is most dev
  tasks; only `ready` / `in_review` / `disputed` are backfilled to `active`. The team should hear this with
  the merge.
- **Hanchen's walkthrough helpers need an activation step.** `docs/sandbox/tools/seed_test_roles.py` and
  `docs/sandbox/W8/scripts/sandbox-SCRUM-48.py new` both register data and stop, so every step of the
  SCRUM-113/114 walkthroughs would be refused, and `new --ai` no longer gets its AI pass at registration
  (SCRUM-114 Part 6). Add `POST /projects/{project}/tasks/{task}/activate` after registration if #41
  merges before #43/#44 are re-tested.

## Not blocking

1. **The PR description was not updated.** The comment says it was, but the body is still the first
   commit's text ("292 passed", nothing on the web controls, AI at activation, queue gating, `/complete`
   under `MANAGE_TASK`, or the export listing).
2. **The work pages do not say the task is not active** (found in the browser walkthrough). On a draft or
   paused task, `/annotate` and `/review` look exactly as on an active one; the annotator can open an item
   and type an answer, and learns only from the 409 on Save or Submit, when the typing is not saved. A
   banner on the task's work pages when it is not `active` (or disabled actions) would fix it; a follow-up
   is fine. Related and smaller: the lifecycle buttons are shown to annotators, who get a raw `403` —
   the same as the Complete button before this PR. Dishank has not reported a browser walkthrough of their
   own; the one above covers it.
3. **The buttons' visibility by status is untested.** `tasks.test.ts` covers the four URLs, the 409
   message and the status mapping, not which button shows in which state. The repo already has component
   tests (`components/*.test.tsx`); a small `task-overview-panel.test.tsx` would pin it.
4. **`workflow_states.md` does not state the queue rule.** Its operational rules cover intake and the AI
   worker, not that the three human queues are empty unless the task is `active`. One line.
5. The queue tests cover `paused` only; `draft` and `completed` take the same branch — parametrising is
   optional.
6. Round 1's three follow-ups (deleting an untouched draft task, the intake/activation race, inline
   activation cost) have no reply. Fine to leave for later; worth a ticket or a line on the PR so they are
   not lost.

## Not checked

- `worker` execution mode, and the backfill against a real PostgreSQL dev database (the walkthrough used
  SQLite; CI's PostgreSQL job covers the backfill test).
- Creating a task through the UI form (the walkthrough created tasks through the same API endpoint).
- `TASK_STATUS.UNDER_REVIEW` / `PILOT` are no longer produced from the API; left as they are (labels and
  mock data still use the constants).

## Comment to post on the PR (condensed, round 2)

**Posted 2026-09-30 14:29 UTC** by `hanchen9127` as an *Approve* review on `c8443e6`, with the text below
unchanged except that the hard line breaks were removed. **Merged 14:30 UTC** by `hanchen9127` with a merge
commit, `75c27f2` (parents `e367ebd`, `c8443e6`). Yi's *Changes requested* was left in place, not dismissed.
CI on `75c27f2`: success. **PR description replaced after merge** at Hanchen's request (2026-10-01), in
the `tech-stack.md` layout (summary, changes by layer, decisions, testing, notes, known limitations), with a
closing line saying Hanchen refreshed it. Dishank's original 436-byte text is kept in the session
scratchpad (`pr41-body-original.md`).

> Thanks @Dishankaswal — both items are done. The overview now drives the whole lifecycle (Activate on
> draft, Pause/Complete on active, Resume on paused) with the API's 409 message shown inline, the status
> mapping covers all four states (which also makes the *Completed* badge show up — `completed` used to map
> to `pilot`), intake is draft-only, and all three queues return nothing unless the task is `active`, with a
> test each. On `c8443e6`: backend 721 passed + 6 skipped, web vitest 257 passed, typecheck clean. I also
> clicked through it in the browser on data created by `main` and then opened with this branch: the old
> `ready` tasks come up Active, activate → annotate → pause → resume → review → complete all work, the
> 409s show in the API's words, and an AI-assisted task gets its AI pass on Activate (12.9 s for three
> items with local llama3). Approving.
>
> **On merge day:** every task still in `draft` — most dev tasks, since nothing could leave `draft`
> before — refuses drafts, reviews and disputes until its PM presses Activate on the task overview. Please
> say so in the team channel when this merges.
>
> **Small follow-ups, not blocking:**
> - The annotate and review pages don't say the task isn't active: on a draft or paused task the items
>   still show *Annotate*, the editor opens, and the annotator only finds out from the 409 on Save or
>   Submit, after typing. A banner (or disabled actions) when the task isn't `active` would fix it — a
>   follow-up ticket is fine.
> - The PR description still shows the first commit (292 tests); please refresh it with the web controls,
>   AI at activation, queue gating, `/complete` under `MANAGE_TASK` and the export listing.
> - A small `task-overview-panel.test.tsx` for which button shows in which state would pin the UI;
>   `tasks.test.ts` covers the calls only.
> - One line in `workflow_states.md` that the annotate/review/adjudicate queues are empty unless the task is
>   `active`.
> - The three follow-ups from my first review (delete of an untouched draft task, intake/activation race,
>   inline activation cost) can wait — a ticket or a reply here so they aren't lost.
>
> @DIQI26 — merging without waiting for your re-review, since you're short of time: I checked all four
> of your points on `1765a5c` and again on this head, and each is fixed with a test (empty activation
> refused, backfill runs on PostgreSQL, no AI work outside `active`, paused tasks stop claims). If anything
> still looks wrong, please raise it here or as a new ticket.
>
> **Heads-ups for the open PRs:**
> - @Jingwei-Lin #39: it merges cleanly, but on top of this PR 14 evaluation tests fail — the harness never
>   activates its tasks, so step 1 is refused with "Task is not accepting work while in status: draft."
>   (41 pass on #39 alone). Adding `POST /projects/{project}/tasks/{task}/activate` after dataset
>   registration in the harness should fix it.
> - #42 conflicts in `uploads.py` and `database.py`. @Dishankaswal, as you offered, could you help resolve
>   it: keep both PostgreSQL steps, with the status backfill before #42's early `return`.

**Decided by Hanchen on 2026-10-01:** Yi has no time to re-review, so Hanchen approves and merges with Yi's
*Changes requested* still open; the approval text records that Yi's points were verified.
