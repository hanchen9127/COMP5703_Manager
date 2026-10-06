# Review — PR #52, `CS57-Dishank` (SCRUM-117, D8)

2026-10-05. Head `399cd9a`, one commit, based on `main` `bbb93cb`, which is still `main`'s head. Ten files,
+852 / −10:
- backend: `draft_service.py` (+122) and `tests/test_draft_resubmission_rules.py` (+406, 9 tests);
- web: the workspace panel, a new `lib/api/task-work-queue.ts`, `applyAnnotateQueueFlags` in
  `task-workspace-data.ts`, `live-task-workspace.ts`, and tests.

**On GitHub (checked with `gh pr view 52`):** open, not a draft, mergeable. No reviews, no comments, no reviewer
requested. CI is green: `sqlite` and `postgresql`, push and pull_request runs.

**Read before this review:**
- SCRUM-117's description, including the update of 2026-10-03 after SCRUM-38;
- the handover, `../../sandbox/Break/jira/jira-scrum-117-handover.md`;
- ADR 009 (every write is a version) and the review of PR #50 (the send-back cutoff after a reopen);
- PR #49 (Kanishka), which reads the same annotate queue;
- PR #48 (Yi, paused on issue #40), which may make disputes annotation-scoped.

**Rule decided by Hanchen on 2026-10-05: a submission locks the answer.** An annotator may resubmit only once
their answer is back with them: returned, rejected, or sent back by adjudication. While it waits for review, it
cannot be changed. This replaces the ticket's proposed rule ("while it awaits its first review"), so SCRUM-117's
description changes with it.

**Recommendation: request changes.** The backend guard sits in the right place and its tests prove the fix.
Two things block the merge, and both are places where the web app and the API disagree:
1. the panel hides the editor from work an expert sent back, which `main` offers today — a regression;
2. under the rule above, the API must refuse what the panel already refuses.

The best fix for both is one rule that the guard and the queue share.

## Verified

- **Suites**, run at `399cd9a` in a separate worktree:
  - backend, SQLite: **865 passed, 8 skipped**;
  - web: **37 files, 333 tests passed**, and `tsc --noEmit` is clean;
  - CI ran the backend on SQLite and PostgreSQL, and both passed.
- **The tests prove the fix.** With `draft_service.py` put back to `main` and the new tests kept, 3 of the 9 fail
  and 6 pass:
  - the 3 that fail are the approved refusal, the escalated refusal and the linked-version test;
  - the 6 that pass are guards, as guards should.
- **Where the refusal sits.** It is in `submit_draft`, after the finalised-item guard and the pending check,
  before any write. A refusal leaves the draft pending and the answer untouched (`_assert_nothing_was_written`).
- **A reopen still lets the author answer again.** `reopen_task_item` sets the round's answers to
  `is_latest = False`, so `find_by_item_and_creator` finds nothing. The guard then treats the next answer as a
  first submission, and it becomes `reanswer_after_reopen` as ADR 009 intends.
- **Machine work is outside the rule.** An ownerless AI submission has no base. An unclaimed AI draft that a
  person submits is checked against that person's own answer (`user_id` stands in for `created_by`).
- **The panel's flags survive a refresh.** Every refresh goes through `fetchLiveTaskWorkspace`, which re-reads
  the queue. `useHydratedTaskItems` maps items without the flags, but nothing calls it.
- **Fail closed.** A reviewer with no annotate role, an inactive task, or a failed queue read gets no editor.
  That is the right default.

## Blocking

### 1. Work an expert sent back loses its editor (regression)

The guard allows a resubmission after an adjudication send-back (`_sent_back_by_adjudication`). The annotate
queue does not. For a submitter it sets `can_annotate = rework = back_with_author`, and `back_with_author` counts
only `revise`, `adjust` and `reject` verdicts. An escalated answer keeps `verdict = "escalate"` after the send-back.

I seeded each case with the PR's own fixtures, then read the guard and the queue row for Alice:

| Alice's answer | Guard (API) | Queue `can_annotate` / `rework` | Panel |
| --- | --- | --- | --- |
| Returned by a reviewer (control) | allowed | true / true | editor shown |
| Escalated, then sent back by adjudication | **allowed** | **false / false** | **no editor** |
| Submitted, no review yet | allowed | false / false | no editor |

On `main` today, a sent-back item has status `expert_send_back`. The web shows it as `returned`, and
`canAnnotate("returned")` opens the editor. After this PR, the annotator cannot redo work the expert sent back.
The panel also tells them "You can redo it once a reviewer returns or rejects it", which is not what happened.

**Fix: one rule, used by both.** Put a single predicate in `submission_rules.py`, for example
`may_resubmit(state, *, sent_back)`:
- the guard calls it in `submit_draft`;
- `TaskWorkQueueService.list_annotation_queue` sets `rework` and `can_annotate` from it.

The queue can compute the send-back set once per task with `collect_expert_send_back_item_ids`, instead of once
per row. Then the queue and the API cannot drift apart again. Kanishka's list (#49) reads the same `rework` flag,
so it gets this fix too.

Tests to add:
- a queue test: after an escalation and a send-back, Alice's row has `can_annotate` and `rework` true;
- a web test: the editor is shown on a sent-back item;
- the panel's message for this case.

### 2. A submission locks the answer (rule of 2026-10-05)

Remove the branch in `_assert_resubmission_allowed` that allows a resubmission when nobody has reviewed the
answer since it was submitted. The panel already behaves this way, because the queue does not offer the editor
there. Refuse with 409, in words the annotator can act on — for example: "Your answer is submitted and waiting
for review. You can change it once a reviewer returns or rejects it, or an expert sends it back."

I ran the suite with that branch removed. **7 tests fail**, and none of them is a real problem:
- `test_draft_resubmission_rules.py::test_answer_awaiting_its_first_review_can_be_resubmitted`: flip it to expect
  409, and add a test that the answer is still unchanged afterwards.
- `test_resubmission_versions.py` (3 tests): their `_return` fixture writes the review with `created_at = now − 1s`.
  That is earlier than the answer's `submitted_at`, so the return does not count "since submission". These tests
  have been resubmitting with no review in effect. Timestamp the return after the submission instead (these
  fixtures came in with SCRUM-38, #47).
- `test_draft_submission_atomicity.py::test_existing_human_can_resubmit_when_slots_are_full` and
  `::test_resubmission_links_to_the_authors_existing_annotation`: add a return before the resubmission.
- `test_task_item_reopen.py::test_a_resubmission_within_a_round_is_a_new_version_too`: the same.

No evaluation case resubmits (`main`, #39 and #51 checked), so the casebook is unaffected.

## Non-blocking

3. **A branch that never runs.** `_resubmission_base_id` reads `draft.annotation_id` first, but no pending draft
   carries one:
   - only `submit_draft` writes a draft's `annotation_id` (`draft_service.py:497`);
   - it does so in the same step that makes the draft `submitted`;
   - `submit_draft` refuses any draft that is not pending.

   `test_the_linked_version_is_checked_not_the_author` builds that state by hand. It then refuses Alice's *first*
   answer because Eve's answer is approved — which would be wrong if the state could ever occur. Suggest dropping
   the branch and that test, and resolving the base with `find_by_item_and_creator` only. The comments in
   `submit_draft` and the module docstring of the test file say the same thing and need trimming too.
4. **Two wrappers for one endpoint.** #49 adds `lib/api/work-queues.ts` with `listAnnotationWorkQueue`, the same
   `GET /tasks/{id}/work-queue/annotate`. The two PRs share no file, but whichever merges second should use the
   other's function. #49's module is the natural home, because it serves the queue screens.
5. **Send-back is decided per item.** `_sent_back_by_adjudication` reads the item's escalations, which matches
   `main`, where disputes are item-scoped. If issue #40 makes them annotation-scoped (#48), this check has to
   follow — worth a line in #48's description.
6. **A test next to SCRUM-120.** Add a test that, after a reopen, the author who had an approved answer can answer
   again. That case is correct today, but only through `is_latest`, and nothing asserts it.
7. **Naming.** The convention is `fix(api): … (SCRUM-117)` for the commit and `fix(SCRUM-117): …` for the PR
   title (`tech-stack.md`). Both lack the ticket id.

## Suggested GitHub review (request changes)

```text
Thanks Dishank — the guard is in the right place (before any write), and the tests prove it: with main's draft_service, the approved, escalated and linked-version tests fail and the six guards pass. Backend 865 passed on SQLite, web 333 passed, tsc clean, CI green on both databases.

Two changes before merge, both where the panel and the API disagree:

1. Work an expert sent back loses its editor. The guard allows a resubmission after an adjudication send-back, but the annotate queue sets can_annotate = rework = back_with_author, which only counts revise/adjust/reject. A sent-back answer keeps verdict "escalate", so its row says false and the panel hides the editor — main offers it today (expert_send_back shows as "returned"). Please put one predicate in submission_rules.py (e.g. may_resubmit(state, *, sent_back)) and use it in both submit_draft and list_annotation_queue (the queue can compute the send-back set once per task). Tests: the queue row after a send-back has can_annotate and rework true; the web shows the editor there.

2. Rule change (Hanchen, 2026-10-05): a submission locks the answer. Resubmitting is allowed only once it is back with its author — returned, rejected or sent back by adjudication — not while it waits for review. Please remove the "no review since submission" branch and refuse with a 409 the annotator can act on. Seven existing tests resubmit with no review in effect and will fail: flip test_answer_awaiting_its_first_review_can_be_resubmitted; in test_resubmission_versions.py, timestamp the _return review after the submission (it is now − 1s, before submitted_at, so it never counted); add a return in the two test_draft_submission_atomicity tests and in test_task_item_reopen::test_a_resubmission_within_a_round_is_a_new_version_too. The SCRUM-117 description is being updated to match.

Smaller:
- _resubmission_base_id's draft.annotation_id branch never runs: only submit_draft writes that field, in the same step that makes the draft submitted, so a pending draft never has one. test_the_linked_version_is_checked_not_the_author builds that state by hand (and would refuse Alice's first answer because of Eve's). Suggest dropping both and resolving the base with find_by_item_and_creator only.
- #49 adds listAnnotationWorkQueue for the same endpoint as listAnnotateQueue; whichever merges second should reuse the other.
- Send-back is decided per item, as disputes are on main; if #40 makes them annotation-scoped (#48), this check follows.
- A test that after a reopen, the author of an approved answer can answer again (true today through is_latest, but unasserted).
- Commit/PR title: fix(api): … (SCRUM-117) / fix(SCRUM-117): ….
```

## Board change that goes with the rule

In SCRUM-117's description, replace the proposed rule:

```text
Proposed rule, to confirm at the weekly meeting before building: an annotator may resubmit their own answer while it awaits its first review, or once a reviewer has returned or rejected it. Once it is approved, it is not changed by its author.
```

with:

```text
Rule decided 2026-10-05 (Hanchen): a submission locks the answer. Its author may resubmit it only once it is back with them — returned or rejected by a reviewer, or sent back by adjudication. While it waits for review, and once it is approved, it is not changed by its author. The guard and the annotate queue read one shared predicate, so the panel and the API agree.
```

In "Where the pieces are", change "Allowed: no current answer yet; no review since it was submitted; back_with_author (returned or rejected)" to "Allowed: no current answer yet; back_with_author (returned or rejected); sent back by adjudication".

---

## Re-review — head `d3e9924` (2026-10-05, evening)

Dishank force-pushed one commit, `d3e9924` `fix(SCRUM-117): restrict annotator resubmissions`, in place of `399cd9a`.
It is still based on `main` `bbb93cb`. Sixteen files, +998 / −21. CI is green: `sqlite` and `postgresql`, push and
pull_request runs. Hanchen's review of the first head (Changes requested) is on GitHub.

**Recommendation: request changes, for one line.** Both blocking points are addressed. There is now one shared
rule, `may_resubmit`, and a submission locks the answer. But the shared rule checks the adjudication send-back
before "approved", and it reads the send-back for the whole item. So another annotator's send-back unlocks any
answer on that item, approved ones included. The fix is one condition plus one test fixture.

### Addressed

- **One rule for the guard and the queue.**
  - `may_resubmit(state, *, sent_back)` is in `submission_rules.py`.
  - `submit_draft` and `list_annotation_queue` both call it.
  - The queue computes the send-back set once per task and drops items with an open escalation, as the guard
    does.
  - New tests: the queue offers sent-back work as rework (`test_sent_back_work_is_offered_to_its_author_as_rework`),
    and the panel opens the editor on it.
- **A submission locks the answer.** The "no review since submission" branch is gone. The test now expects 409
  (`test_answer_awaiting_its_first_review_cannot_be_resubmitted`), and the 409 names all three ways the answer
  comes back.
- **The seven tests.**
  - `_return` in `test_resubmission_versions.py` now postdates `submitted_at`.
  - The atomicity tests and the reopen test add a return before resubmitting.
- **The branch that never ran is removed.** The base is the submitter's current answer, from
  `find_by_item_and_creator`, and the hand-built linked-version test is gone.
- **The reopen case has a test.** `test_an_approved_round1_author_answers_again_after_reopen`.
- **The commit names the ticket.** The PR title still reads `fix: restrict annotator resubmissions to returned
  work` — the GitHub title should become `fix(SCRUM-117): …`.

### Verified

- **Suites at `d3e9924`:**
  - backend, SQLite: **866 passed, 8 skipped**;
  - web: **37 files, 334 tests passed**;
  - `tsc --noEmit` is clean.
- **The tests prove the fix.** I put `draft_service.py`, `submission_rules.py` and `task_work_queue_service.py`
  back to `main` and kept the new tests:
  - these 4 fail: the lock, approved, escalated and queue-send-back tests;
  - the other 46 in those two files pass.

### Blocking

**A send-back of one annotator's answer unlocks every answer on the item.**
`may_resubmit` returns `state.back_with_author or sent_back`, and `sent_back` is per item. In the guard it runs
before the approved check. In the queue it decides `rework` for every submitter on the item.

I seeded it with the PR's own fixtures: Eve's answer escalated and sent back by adjudication, Alice's on the same
item.

| Alice's answer | Guard (API) | Queue `can_annotate` / `rework` |
| --- | --- | --- |
| Approved | **allowed** | **true / true** |
| Waiting for review (never reviewed) | **allowed** | **true / true** |
| Waiting for review, no send-back on the item (control) | refused 409 | false / false |

The first row is new in this revision. At `399cd9a` the approved check came before the send-back check, so
Alice's approved answer was refused.

Both rows break the rule: an approved answer is not changed by its author, and a submitted answer stays locked
until it comes back. The send-back is meant for the answer that went to adjudication.

**Fix:**

```python
def may_resubmit(state: SubmissionReviewState, *, sent_back: bool) -> bool:
    # Returned or rejected; or escalated since it was last submitted, and adjudication sent the item back.
    return state.back_with_author or (sent_back and state.decided_since_submission)
```

`decided_since_submission` without `back_with_author` means escalated: rejected and returned are already
`back_with_author`. With this condition:
- an approved answer stays locked, unless it was itself escalated afterwards — under dual sign-off, for example;
- an answer that was never reviewed stays locked.

**Tests:**
- add a guard test and a queue test for Alice-approved and for Alice-waiting, each beside Eve's escalated and
  sent-back answer — both refused, both rows false;
- `test_sent_back_work_is_offered_to_its_author_as_rework` seeds Alice's answer with no review at all. It needs an
  escalate review on her answer, as `test_escalated_and_sent_back_can_be_resubmitted` has, or it will fail
  under the fix.

### Non-blocking

- **Who decided the lock.** Six places say "(Jingwei & Yi, 2026-10-05)":
  - `draft_service.py:318` and `submission_rules.py:300`;
  - in tests: `test_draft_resubmission_rules.py:10`, `test_draft_submission_atomicity.py:172`,
    `test_resubmission_versions.py:106` and `test_task_item_reopen.py:470`.

  The rule was Hanchen's decision at the review of the first head. If Jingwei and Yi were not part of it, these
  lines should name Hanchen.
- **Carried over from the first review:**
  - #49 still adds a second wrapper for the same annotate-queue endpoint (`listAnnotationWorkQueue` vs
    `listAnnotateQueue`); whichever merges second reuses the other;
  - send-back stays item-scoped, which #48 will have to follow if issue #40 goes annotation-scoped.

### Suggested GitHub review (request changes)

```text
Thanks Dishank — both points are addressed: may_resubmit is shared by submit_draft and list_annotation_queue, the lock is in, the seven tests are fixed, the dead branch is gone and the reopen case has a test. Backend 866 passed, web 334, tsc clean, CI green; with main's three services the lock, approved, escalated and queue send-back tests fail and the rest pass.

One change before merge. may_resubmit returns `state.back_with_author or sent_back`, and sent_back is per item — so when Eve's escalated answer is sent back, Alice's answer on the same item unlocks too, even when it is approved (the guard now checks may_resubmit before approved_by) or was never reviewed. I seeded both with your fixtures: guard allowed, queue rework true. Please make it:

    return state.back_with_author or (sent_back and state.decided_since_submission)

(decided without back_with_author = escalated), add guard and queue tests for Alice-approved and Alice-waiting beside Eve's sent-back answer (both refused / false), and give test_sent_back_work_is_offered_to_its_author_as_rework an escalate review on Alice's answer, which it will need under the fix.

Smaller: the lock is attributed to "Jingwei & Yi, 2026-10-05" in six places — it was decided at the review here, so please check the attribution; and the PR title could become fix(SCRUM-117): ….
```

---

## Re-review — head `597aecf` (2026-10-05, night)

Dishank force-pushed one commit, `597aecf`, in place of `d3e9924`. It is still based on `main` `bbb93cb`. The PR
title is now `fix(SCRUM-117): …`. CI is green: `sqlite` and `postgresql`, push and pull_request runs. Hanchen's two
reviews (Changes requested, on `399cd9a` and `d3e9924`) are on GitHub.

**Recommendation: approve.**

### What changed since `d3e9924`

- **The fix asked for.** `may_resubmit` returns `state.back_with_author or (sent_back and
  state.decided_since_submission)`. The docstring explains why: a send-back is decided per item, so it may release
  only an answer that was itself decided on. The queue's comment says the same.
- **The tests asked for.**
  - Guard: `test_an_approved_co_authors_answer_is_not_unlocked_by_a_send_back` and
    `test_a_co_authors_answer_awaiting_review_is_not_unlocked_by_a_send_back`. Both expect 409 and nothing written.
  - Queue: `test_an_approved_co_authors_answer_stays_locked_by_a_send_back` and
    `test_an_unreviewed_co_authors_answer_stays_locked_by_a_send_back`. Alice's row reads `(False, False, True)`;
    Charlie's sent-back row reads `(True, True, True)`.
  - The existing sent-back queue test now seeds an escalate review on the author's answer.
- No web changes, so the earlier web run stands: 334 passed, `tsc` clean.

### Verified

- **Backend at `597aecf`, SQLite: 870 passed, 8 skipped.**
- **The new tests guard the fix.** With `submission_rules.py` put back to `d3e9924`, the 4 new tests fail and the
  other 50 in those two files pass.

### Left open (non-blocking)

- **Attribution.** Six places still say "(Jingwei & Yi, 2026-10-05)" for the lock rule. Hanchen confirms whether
  that is right.
- **Duplicate wrapper.** #49's `listAnnotationWorkQueue` and this PR's `listAnnotateQueue` wrap the same endpoint;
  whichever merges second reuses the other.
- **Merge order with #53.** #53 (Parth) changes `submission_rules.py`, `task_work_queue_service.py` and
  `draft_service.py` too. Suggest this PR merges first, since it is smaller and ready, and #53 rebases.
  - Under the round rule, #53 makes `back_with_author` true only once a round is decided. `may_resubmit` reads it,
    so the two agree with no further change here.
- **Send-back stays item-scoped.** #48 has to follow if issue #40 goes annotation-scoped.

### Suggested GitHub review (approve)

```markdown
Thanks Dishank — approving at `597aecf`.

- **The fix:** `may_resubmit` now releases a send-back only for an answer that was itself decided on, so a co-author's approved or unreviewed answer stays locked. Guard and queue still share the one predicate.
- **Tests:** the four new ones cover both cases, in the guard and in the queue. With the previous `may_resubmit` they fail and the other 50 pass. The suite is 870 passed on SQLite, and CI is green on both databases.
- **Before merging:**
  - please merge before #53, which touches `submission_rules.py`, the queue and `draft_service.py`; Parth will rebase;
  - whichever of this PR and #49 merges second should reuse the other's annotate-queue wrapper.
```

---

## Merged — 2026-10-05

- **Approved by Hanchen** at 11:58 UTC on `597aecf`; the posted text adds the docs step to the approve block above.
- **Docs commit by Hanchen,** `719265b` `docs(api): record that a submission locks its answer (SCRUM-117)`, on
  `CS57-Dishank`. It changes `api_surfaces.md` only:
  - the submission refusal order now includes the resubmission lock;
  - a new paragraph states the lock rule and `may_resubmit`;
  - the annotate-queue row names the adjudication send-back.
- **CI green** on `719265b`: `sqlite` and `postgresql`, push and pull_request runs.
- **Merged** at 12:02 UTC as `9f4ec6c`, a merge commit; the branch is kept.

**Still to do:**
- **Board:** move SCRUM-117 to Done, and replace its "Proposed rule" text — the replacement text is under *Board
  change that goes with the rule* above.
- **Tracker:** mark PR #52's row Review OK.
- **#53 (Parth):** rebase onto `main`. It conflicts in `submission_rules.py`, `task_work_queue_service.py` and
  `draft_service.py`.
- **#49 (Kanishka):** reuse `listAnnotateQueue` from `lib/api/task-work-queue.ts`, or replace it with its own
  wrapper.
