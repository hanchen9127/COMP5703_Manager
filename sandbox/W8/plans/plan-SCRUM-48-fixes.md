# Plan — fixing PR #33 (SCRUM-48, D8) for Jingwei's re-review

**Branch:** `CS57-Hanchen-scrum-48-fixes`, cut from `origin/CS57-KANISHKA` at `1e4eb4a`, with a PR whose
base is `CS57-KANISHKA`. Kanishka reviews and merges it into her branch, so PR #33 picks the commits up,
and Jingwei re-reviews #33. · **Story:** D8 · **Written:** 2026-09-25, against `1e4eb4a`, `main` at
`2fab5ec` and PR #34 at `8ca7325`. `main` and #34 both merge into `1e4eb4a` without conflicts.

The review this answers is [`../../../reviews/W8/review-cs57-kanishka-scrum-48-work-queues.md`](../../../reviews/W8/review-cs57-kanishka-scrum-48-work-queues.md).
Jingwei's comments are on the PR itself (Changes requested, 2026-09-25).

## Decisions this plan follows (Hanchen, 2026-09-25)

| # | Decision | Where it lands |
| --- | --- | --- |
| A | **AI-assisted items skip human annotation.** On an `ai_assisted` task, a successful AI annotation completes the first pass. The item goes to the review queue and is not offered to annotators. `required_annotators` governs `human_first` tasks. An item whose AI run failed has no AI annotation, so it is offered to a human | Commit 5 |
| B | **Each submission is reviewed on its own.** An item is reviewable from its first submission | Commits 6b, 8 |
| C | **One reviewer may review every submission on an item.** The "already reviewed" exclusion is per submission, not per item. A second approval on the same submission (dual sign-off) still never goes to the first approver | Commit 6b |
| D | **An accept does not complete an item early.** It is fixed in this PR, not left to SCRUM-109 or #34 | Commit 8 |
| E | **Scope:** Jingwei's five blocking points, both of Hanchen's findings, all the small items, the N+1 query and rework re-offering. The role-keyed privacy exemption, arbitrator independence (R2-8, SCRUM-52) and the nits Jingwei marked optional stay follow-ups | all |

## Rules the commits share

Written once here, and once in code, in Commit 1's module:

- **Human submission:** an annotation with `created_by` set. **Machine annotation:** `created_by IS NULL`,
  until SCRUM-38 gives the AI an author. Only the new module may test `created_by` for this purpose.
- **First pass complete:**
  - `human_first` — distinct human submitters ≥ `required_annotators`;
  - `ai_assisted` — a machine annotation exists, or human submitters ≥ `required_annotators` (the
    failed-AI route).
- **Awaiting review, for reviewer R:** a current annotation that
  - R did not author;
  - R has not reviewed since its last submission (`ReviewDB.created_at >= annotation.updated_at`,
    because a resubmission rewrites the annotation in place);
  - still needs a decision: no reject or return since its last submission, and approvals below what the
    policy requires.
- **Item complete** (the only way `accept` may set `canonicalized`): the first pass is complete **and**
  every current annotation that counts has its required approvals.

---

## Before you start

1. **Tell Kanishka first. (DONE)** She must not push to `CS57-KANISHKA` while this branch is open — see
   [Messages](#messages). Wait for her reply before cutting the branch.
2. Cut the branch and bring `main` in (a merge, never a rebase):
   ```powershell
   cd D:\COMP5703_Capstone\hej
   git fetch origin
   git switch -c CS57-Hanchen-scrum-48-fixes origin/CS57-KANISHKA
   git merge origin/main
   ```
3. **Record the baseline** on SQLite, and on PostgreSQL if a local server is available (Jingwei's
   figures on `1e4eb4a` were 496 passed + 4 skipped and 500 respectively; the `main` merge changes them):
   ```powershell
   cd apps\hej-api ; .venv\Scripts\python -m pytest -q
   ```
4. **Check PR #34.** Commits 4 and 8 build on its `_resolve_review_target`. If #34 has merged, merge
   `origin/main` again before Commit 4. If it has not, do Commits 1–3 and 5–7 first, then ask Jingwei
   when it will land.

**Done 2026-09-25:**
- `origin/CS57-KANISHKA` was still `1e4eb4a`. Branch created with `--no-track`, so a later
  `git push -u origin CS57-Hanchen-scrum-48-fixes` cannot go to her branch by accident.
- `origin/main` (`2fab5ec`, PR #32) merged in as `53508fa`, no conflicts. Not pushed yet.
- **Baseline, SQLite: 512 passed, 4 skipped, 147 subtests.** Commit 1 must end on exactly this.
- **PostgreSQL: not run.** Docker Desktop was not running. Start it before Commit 10, which needs it
  (`docker compose up -d db`; port 5432 comes from `compose.override.yaml`), and record the PostgreSQL
  baseline then.
- **#34 is still open** (`8ca7325`, no review decision). Commits 1–3 and 5–7 go first.
- **Local `.gitignore` change** (the `compose.override.*` lines on `CS57-Hanchen`) blocked the switch,
  because both branches append to that file. It is kept in `stash@{0}` ("CS57-Hanchen: local .gitignore
  compose.override lines"), and the same two rules are now in `.git/info/exclude`, which is local and
  applies on every branch. Once back on `CS57-Hanchen`, either `git stash pop` it, or `git stash drop`
  it if the exclude file is enough.

## Progress (2026-09-25)

Pushed to `origin/CS57-Hanchen-scrum-48-fixes`; CI (SQLite + PostgreSQL) green on each unless noted.

| # | Commit | Suite after (SQLite) |
| --- | --- | --- |
| 1 | `e1b348b` | 518 — a mocked lifecycle test's `setUp` needed a real `required_annotators` |
| 2 | `295d895` | 521 |
| 3 | `3dceb42` | 525 — also routes `user_has_governed_action` through the membership-checking verifier |
| 5 | `adca6cc` | 536 |
| 6a | `05365c5` | 541 — **also fixes a 500 on every non-empty queue** (`task_item_to_read` on a DB row without `location_ref`) |
| 6b | `11992a2` | 546 — `test_different_reviewer_is_offered_second_review` now sets dual sign-off |
| 7 | `7404afb` | 550 — the review side of rework landed in 6b |
| 9 | `b05435f` | 554 |
| merge | `ea3cb71` | `main` with #34 (merged 25/09); one import conflict in `test_draft_ownership_routes.py`, kept both. SQLite 574, PostgreSQL 579 |
| 4 | `0b9b6ca` | 579 |
| 8 | `4d79cd6` | 587 — includes the de-duplication: `submission_accept_outcome`, `approvers_of`; web panel handles `awaiting_other_submissions` |
| 7b | `38e7f4f` | 587 — reject means redo (Hanchen, 26/09): rejected work goes back to its annotator too |
| 10 | `73d1bcc` | SQLite 554 + 5 skipped; **PostgreSQL 559** (local and CI) |
| 11 | `5647c03` | docs only |

**PR #35 opened 2026-09-25** (`CS57-Hanchen-scrum-48-fixes` → `CS57-KANISHKA`, head `5647c03`, reviewer Jingwei). Description: `../../../reviews/W8/pr-cs57-hanchen-scrum-48-fixes.md`. Its diff also shows PR #32's files, because `main` was merged into this branch first; the description says to skip them. Commits 4 and 8 are pushed to the same branch after #34 merges.

**Complete 2026-09-26.** PR #35 description updated the same day; reviewer is now Yi (`DIQI26`), changed by Hanchen on 25/09. PostgreSQL 592, web 230 tests. Remaining: the manual walkthrough.

**Was not end to end before Commits 4 and 8:** per-submission review works in the queue, but the review action still acts on
`_latest_annotation()` until #34 adds `annotation_id`, and an accept still canonicalises early until
Commit 8. The queue-row message to Kanishka is drafted in `../msg/message-kanishka-scrum-48-queue-rows.md`.

## Order, and why

- **1 first.** A refactor with no change in behaviour: the suite must stay at the baseline without
  editing a test. Every later commit calls it.
- **2** is independent, but it unbreaks everyone's dev database, so it goes early.
- **3 → 4** is privacy: first the reads PR #33 owns, then the one #34 is changing.
- **5 → 6a → 6b → 7** are the queues, each adding one rule to `task_work_queue_service.py`.
- **8** is the only change to a review action, and it needs #34's annotation targeting.
- **9, 10, 11** close out: recording takes, the lock test, docs.

| # | Headline | Closes |
| --- | --- | --- |
| 1 | `refactor(api): count human submissions in one place (SCRUM-48)` | Finding 1 |
| 2 | `fix(api): migrate, seed and bound required_annotators (SCRUM-48)` | Schema (small) |
| 3 | `fix(api): hide peers' answers, not every draft, until an annotator submits (SCRUM-48)` | Jingwei 1, 3 (drafts), 5 (`total_count`) |
| 4 | `fix(api): apply the independence rule to the review adjustment read (SCRUM-48)` | Jingwei 3 (adjustment) |
| 5 | `fix(api): send AI-assisted items straight to review (SCRUM-48)` | Jingwei 2, decision A |
| 6a | `feat(api): queue rows carry submission progress, in grouped queries (SCRUM-48)` | Jingwei 5, N+1 |
| 6b | `feat(api): review queue offers each submission awaiting the reviewer (SCRUM-48)` | Decisions B, C |
| 7 | `feat(api): offer returned work back to its annotator (SCRUM-48)` | Rework |
| 8 | `fix(api): an accept completes an item only once every submission is in (SCRUM-48)` | Jingwei 4, decision D |
| 9 | `feat(api): record taking an item through record_item_taken (SCRUM-48)` | Finding 2, "Recording takes" |
| 10 | `test(api): prove the submission lock on PostgreSQL (SCRUM-48)` | Lock test |
| 11 | `docs: work queues, required annotators and annotator independence (SCRUM-48)` | Docs Sync |

Files are listed in the order to edit them. One file per turn, as usual.

---

## Commit 1 — `refactor(api): count human submissions in one place (SCRUM-48)`

**Why:** the rule is written five times (review finding 1), and Commits 5, 6a, 6b and 8 would add four
more. When SCRUM-38 lands, one file changes.

1. **New** `app/services/submission_rules.py`:
   - `is_machine_annotation(annotation) -> bool`;
   - `human_submitter_ids(db, task_item_id) -> set[int]`;
   - `human_submitter_ids_by_item(db, item_ids) -> dict[str, set[int]]` — one grouped query, used by the
     queues from Commit 6a;
   - the SQL expression both queries filter on, so a query and the Python predicate cannot drift apart.
2. `app/services/draft_service.py` — `_assert_human_submission_slot_available` uses `human_submitter_ids`.
3. `app/services/task_work_queue_service.py` — both queues use it (still per item; grouping is 6a).
4. `app/api/routes/annotations.py` — `_enforce_independent_annotation_read` and `list_annotations` use
   `is_machine_annotation`.
5. **New** `tests/test_submission_rules.py` — human vs machine rows, a resubmission counted once,
   the grouped version agreeing with the single one.

**Check:** the whole suite at the baseline, with no existing test edited.
**Not touched:** `ai_batch_service.py` (Michael's) filters on `created_by IS NULL` in SQL too. Note it in
the PR as SCRUM-38's to switch over.

## Commit 2 — `fix(api): migrate, seed and bound required_annotators (SCRUM-48)`

1. `app/core/database.py` — `migrate_db_schema()`:
   `ALTER TABLE tasks ADD COLUMN required_annotators INTEGER NOT NULL DEFAULT 1`, next to SCRUM-46's
   columns. Without it, every existing SQLite dev database fails on the first task query.
2. `app/schemas/tasks.py` and `app/models/domain.py` — `Field(default=1, ge=1, le=10)`, matching the
   policy's 1..10.
3. `init_data.py` — the seeded items that carry two human annotations belong to a task that requires
   one. Set `required_annotators=2` on that task, so the seed data is legal.
4. Tests: the migration adds the column to a pre-SCRUM-48 SQLite schema (copy the pattern of SCRUM-46's
   migration test, `sqlite_engine` fixture); creating a task with 11 returns 422.

**PR note:** PostgreSQL dev databases have no additive migration — run `init_data.py --reset`.

## Commit 3 — `fix(api): hide peers' answers, not every draft, until an annotator submits (SCRUM-48)`

**Why:** Jingwei 1. The rule is "an annotator who has not submitted does not see *other humans'* work",
not "nobody sees anyone else's drafts". It must be one predicate for drafts and annotations.

1. `app/services/annotation_service.py` — `should_hide_other_annotators` stays the one predicate. Add
   `visible_to_caller(record, current_user) -> bool` for a draft or an annotation: own, machine, or not
   hidden. `user_has_governed_action` (`permissions.py`) should reuse the role resolution
   `verify_user_can_perform_governed_action` uses, which checks membership status (Jingwei's nit), rather
   than query roles itself.
2. `app/api/routes/drafts.py`
   - `list_drafts` — `list_drafts_by_task_item` again, filtered through `visible_to_caller`. A reviewer
     gets what `main` returns; an annotator who has not submitted gets their own and the AI's drafts.
   - `get_draft` — 403 when the draft belongs to another human and the caller is hidden.
   - `_to_draft_read` docstring — say what is true now.
3. `app/services/draft_service.py` — remove `list_user_drafts_by_task_item`, which nothing calls now.
4. `app/api/routes/annotations.py` — `total_count` counts every current annotation, so a hidden
   annotator reads 2, not 0. The client allows the count, not the answers.
5. Tests:
   - `test_draft_ownership_routes.py` — `test_annotator_list_only_returns_their_own_drafts` becomes
     "hides peers until submitted". Add: a reviewer sees every draft; an annotator sees the AI's failed
     draft; after submitting, the annotator sees peers' drafts; `GET /drafts/{id}` refuses a peer's draft.
   - `test_annotation_independence_privacy.py:344` — expect the real count.
6. **Web check:** start the app and confirm the "AI failed" badge renders again on the review panel.

## Commit 4 — `fix(api): apply the independence rule to the review adjustment read (SCRUM-48)`

**After #34 is on `main` and merged into this branch.** #34 rewrites this read to resolve a named
annotation (`_annotation_to_preview`).

1. `app/api/routes/review_actions.py` — `get_task_item_adjustment`: once the annotation is resolved,
   403 unless `visible_to_caller` passes for it.
2. Test: an annotator who has not submitted gets 403 on a peer's annotation, with and without
   `annotation_id`; a reviewer still gets 200.

If #34 is late, this commit waits. It is the only change here in that function.

## Commit 5 — `fix(api): send AI-assisted items straight to review (SCRUM-48)`

**Why:** decision A. It also corrects Hanchen's message of 23/09, which Kanishka followed.

1. `app/services/submission_rules.py` — `first_pass_complete(task, human_ids, has_machine) -> bool`.
2. `app/services/draft_service.py` — on an `ai_assisted` item that already has a machine annotation,
   refuse a human submission with 409 ("This item's first pass is the AI's; it is in review"). The API
   holds the rule the queue shows, as the ticket asks. A failed-AI item has no machine annotation and is
   unaffected.
3. `app/services/task_work_queue_service.py`
   - annotate queue — skip items whose first pass is complete (replaces the bare count check);
   - review queue — an item with a machine annotation qualifies without a human one.
4. Tests (`test_task_work_queues.py`): an `ai_assisted` item with an AI annotation is in the review
   queue and not the annotate queue; a failed-AI item is in the annotate queue; a human submission on
   the first item returns 409; `human_first` is unchanged.

## Commit 6a — `feat(api): queue rows carry submission progress, in grouped queries (SCRUM-48)`

**Why:** Jingwei 5 (SCRUM-93 needs the numbers) and the N+1 (2,001 SELECTs for 1,000 items).

1. `app/schemas/tasks.py` — `WorkQueueItemRead(TaskItemRead)` adding `required_annotators`,
   `submitted_count`, `working_count` (distinct humans holding a pending draft) and
   `awaiting_review_annotation_ids: list[str]` (empty outside the review queue).
2. `app/services/task_work_queue_service.py` — load items, then one grouped query each for submitters,
   pending-draft holders and (for review) reviews; no query inside the loop. Return rows, not
   `TaskItemDB`.
3. `app/api/routes/tasks.py` — the three routes use `response_model=list[WorkQueueItemRead]`.
4. Tests: the counts on a 2-of-3 item; a statement counter (SQLAlchemy `before_cursor_execute`)
   shows the same number of queries for 5 items and for 50.

**Tell Kanishka the shape as soon as it is written** — SCRUM-93 can start on it before merge.

## Commit 6b — `feat(api): review queue offers each submission awaiting the reviewer (SCRUM-48)`

**Why:** decisions B and C. Today the exclusion is per item, so with N=3 and one reviewer, two
submissions are never reviewed.

1. `app/services/submission_rules.py` — `annotations_awaiting_review(...)`, as defined in
   [Rules](#rules-the-commits-share). It needs the policy's approvals figure (`resolve_for_task`).
2. `app/services/task_work_queue_service.py` — the review queue offers an item when that list is
   non-empty for the caller, and fills `awaiting_review_annotation_ids`. Filter out `canonicalized` and
   `disputed` items rather than keeping only `annotated`: with several submissions, a return on one
   submission sets the whole item to `returned` while the others still await review. Drop the dead
   `is_task_item_export_eligible` test.
3. Tests:
   - one reviewer, N=3: all three submissions are offered, one at a time, as each is reviewed;
   - dual sign-off: after R1 approves submission A, R1 is not offered A again, but R2 is;
   - a reviewer who annotated the item is never offered it;
   - `test_annotated_item_is_offered_to_independent_reviewer` stays as it is (decision B).

## Commit 7 — `feat(api): offer returned work back to its annotator (SCRUM-48)`

1. `app/services/task_work_queue_service.py` — the annotate queue also offers an item to U when U's own
   annotation was returned (`adjust`/`revise`) since its last submission. The submission limit already
   lets an existing contributor resubmit.
2. Tests: return A → A sees the item again, B does not; A resubmits → the reviewer who returned it is
   offered it again (Commit 6b's "since its last submission"); on a one-reviewer task the item goes all
   the way round.

`expert_send_back` is left alone: R2-1 replaces it with "Return to the open workflow" in SCRUM-58
(Hanchen, W8), which will say who gets the item back.

## Commit 8 — `fix(api): an accept completes an item only once every submission is in (SCRUM-48)`

**Why:** Jingwei 4 and decision D. On `main` today, the first accept canonicalises the item and SCRUM-28's
guard then refuses the remaining annotators. **Needs #34** so that an accept names its submission.

1. `app/services/submission_rules.py` — `item_complete(db, task, item, resolved) -> bool`.
2. `app/services/review_policy_enforcement.py` — one function returns the item's next status after an
   accept: `canonicalized` only if `item_complete`, otherwise `annotated`. Single sign-off and
   `dual_signoff_accept_outcome_after_review` both go through it.
3. `app/api/routes/review_actions.py` — use it. The response still reports this submission as approved
   (`next_ui_status`), while the item stays open. Reject, return and escalate are unchanged.
4. Tests (`test_review_actions.py`): N=3 — accept A leaves the item `annotated`, B and C can still
   submit, accepting all three canonicalises it; N=1 and dual sign-off unchanged; `ai_assisted` — an
   accept on the AI annotation canonicalises.

**Not settled here, and said so in the PR:** which of three approved answers is the item's
authoritative one is D4/H4's (SCRUM-27, SCRUM-37; the client's R2-2). **Tell Parth:** SCRUM-109's
state-versus-history test must allow "accepted, item still open".

## Commit 9 — `feat(api): record taking an item through record_item_taken (SCRUM-48)`

**Why:** finding 2. SCRUM-98 (F1) on the board moves this helper onto the event record.

1. `app/services/task_history_recorder.py` — `record_item_taken(db, *, task, task_item_id, user_id,
   commit=False)` writes one `draft_started` row. The name and fields are the ones sent to Yi on 19/09.
2. `app/services/draft_service.py` — `create_draft(..., commit=True)` passes `commit` through to
   `drafts.create` (PR #11's pattern).
3. `app/api/routes/drafts.py`
   - `create_draft` — create with `commit=False`; if it is the caller's first draft on the item, call
     `record_item_taken`; commit; roll back on error;
   - `update_draft` — the inline block becomes a call to `record_item_taken`.
4. Tests: a first `create_draft` writes one row; a second draft by the same person writes none; the
   claim path still writes one; a failed write leaves neither the draft nor the row.

## Commit 10 — `test(api): prove the submission lock on PostgreSQL (SCRUM-48)`

1. **New** `tests/test_submission_lock_postgres.py`, on the shared `engine` fixture; skipped unless the
   dialect is PostgreSQL. Two sessions on one item with one slot left: session 1 submits with
   `commit=False` and holds its transaction; session 2 submits in a thread and must still be blocked
   after a short wait; session 1 commits; session 2 returns 409. Use a join timeout, so a missing lock
   fails the test rather than hanging it.
2. **Fail-before check:** delete `.with_for_update()` locally → the test fails; restore it.

CI runs the suite on PostgreSQL (SCRUM-94), so this is the test that keeps the lock there.

## Commit 11 — `docs: work queues, required annotators and annotator independence (SCRUM-48)`

- `docs/design/backend/api_surfaces.md` — the three queue endpoints and their row shape; the 409s from
  `submit_draft` (limit; AI-assisted first pass); which reads hide peers' answers.
- `docs/design/database/domain_model.md` and `db_schema_blueprint.md` — `tasks.required_annotators`.
- `docs/design/product/workflow_states.md` — per-submission review; an item completes only when every
  submission is in and approved; AI-assisted items skip the annotate queue.

---

## After the commits

1. Suite on SQLite and PostgreSQL; record both counts in the PR.
2. **Manual walkthrough** — write `../tests/manual-test-SCRUM-48.md` before running it. Use two
   browsers or Swagger with three accounts (two annotators, one reviewer), N=2, `human_first`:
   annotator 1 cannot read annotator 2's answer before submitting; both submit; a third submission is
   refused; the reviewer reviews both; the item completes only after the second accept. Then one
   `ai_assisted` item. Include a reload and a look-before-acting step.
3. Open the PR into `CS57-KANISHKA`, with the PR format from `tech-stack.md`: decisions A–D under
   "decisions for review"; known limitations — authoritative answer (R2-2), the role-keyed exemption,
   R2-8 in SCRUM-52, `ai_batch_service` for SCRUM-38.
4. After Kanishka merges it: propose an updated description for #33 to her (the Postgres reset note, the
   decisions), and request Jingwei's re-review. Also ask Parth for a look at the queue service.
5. Update the review file's "After posting" steps, and correct `message-pr29-followups-kanishka-yi.md`.

## Messages

**To Kanishka — before cutting the branch** (English):

```
Hi Kanishka, Jingwei's review on #33 turned up a few things that come from my own instructions (the AI-assisted part of my 23/09 message was wrong), and a couple of product calls I had to make. So I'd like to help rather than hand it all back to you.

The plan: I'll put the fixes on a branch off yours (CS57-Hanchen-scrum-48-fixes) and open a PR into CS57-KANISHKA. You review it and merge it, and #33 updates by itself. Then Jingwei re-reviews #33.

Could you hold off pushing to CS57-KANISHKA until then, so we don't both change the same files? If you have anything local that isn't pushed yet, push it now and tell me, and I'll start from there.

Decisions I've made, so you're not guessing:
- On an ai_assisted task, a successful AI annotation completes the first pass. The item goes straight to review, and required_annotators applies to human_first tasks.
- Each submission is reviewed on its own, and one reviewer may review all of them on an item.
- An accept completes the item only once every required submission is in and approved.

Since SCRUM-93 is blocked on this, I'll send you the queue row shape (submitted_count, required_annotators, working_count, awaiting_review_annotation_ids) as soon as it's written, so you can start the screen before it merges.
```

**On PR #33** — replaces the draft comment in the review file, which assumed Kanishka would do the fixes:

```
Thanks Jingwei. I agree with all five blocking points. Some of them come from my own instructions, so I'll push the fixes as a PR into CS57-KANISHKA for Kanishka to review, and #33 will pick them up. Decisions, so the thread has them:
- #2: on an ai_assisted task, the AI's successful first pass goes straight to review. My 23/09 message to Kanishka said otherwise, and that was wrong.
- #4: each submission is reviewed on its own, and one reviewer may review all of them. But an accept completes the item only once all required_annotators submissions are in and approved. That goes in this PR.
- Also in this PR: one module for "is this a human submission" (it's in five places now, which SCRUM-38 would break); record_item_taken as the helper SCRUM-98 expects; rework re-offering; grouped queries; migration, seed, bound, Postgres lock test and docs.
- Follow-ups: the role-keyed exemption, and adjudicator independence (R2-8), which is SCRUM-52's.
I'll ping you for the re-review when it's in.
```
