# Review — PR #33, `CS57-KANISHKA` (SCRUM-48, D8)

2026-09-25. Head `1e4eb4a`, base `main` (merge-base `fd273b9`; `main` is now at `2fab5ec`). Six commits,
24 files, +1944 / −26 — about 480 lines of app code and 1,460 of tests.

**On GitHub (checked with `gh pr view 33`):** open. Jingwei posted **Changes requested** on 2026-09-25
09:32 UTC, on `1e4eb4a`, with five blocking points, three small ones, four possible follow-ups and five
nits. No other reviews or comments. Parth has not reviewed. The roadmap lists him as a reviewer of this
PR, because D7's sampling (SCRUM-51) and the adjudicator queue (SCRUM-52) build on these queries.

**Read before this review:** `sandbox/W7/msg/message-kanishka-SCRUM-48-questions.md` (19/09),
`message-SCRUM-48-client-answer.md` (17–18/09), `sandbox/W8/msg/message-client-qa-R1-corrections.md`
(22/09), `message-pr29-followups-kanishka-yi.md` (23/09), `chat_from_Kanishka.md`, `info/client-question.md`
questions 1 and R1-4, `shared/client-qa.md` R2-7 and R2-8, and the SCRUM-48 description in `Jira.csv`
(24/09).

**Recommendation: request changes, as Jingwei did.** Each of her blocking points holds in the code. Two
of them needed a product decision, which Hanchen took on 2026-09-25 (A and B below); one of the two came
from Hanchen's own message of 23/09. The comment below adds two points her review does not cover.

---

## Scope — SCRUM-48 on the board, point by point

| # | Board description (24/09) | On `1e4eb4a` |
| --- | --- | --- |
| 1 | Queue endpoints by role: annotation, review, adjudication | ⚠️ Three `GET /tasks/{id}/work-queue/{annotate,review,adjudicate}` routes, each role-checked. The review queue never offers AI-assisted items (Jingwei 2 — see decision A). The adjudication queue checks the role only, which is what Hanchen asked for on 19/09; arbitrator independence (R2-8) is SCRUM-52's, in the break |
| 2 | Required-annotators count on the task, chosen at creation | ✅ `tasks.required_annotators`, default 1, `ge=1`. Missing: a `migrate_db_schema()` entry, a seed value and an upper bound (Jingwei, small) |
| 3 | Human submissions refused at the limit; AI never counted or refused; drafts not capped; each person sees only their own | ✅ The limit sits inside SCRUM-26's transaction, after the finalised and not-pending refusals and with the item row locked — the order agreed on 19/09. ❌ "Each person sees only their own" was built as *nobody sees anyone else's*, reviewers included, so AI drafts disappear from every screen (Jingwei 1) |
| 4 | An annotator cannot read peers' submissions before submitting — in the API | ⚠️ Enforced on the three `/annotations` reads. Bypassed through `GET …/adjustment` and `GET /drafts/{id}` (Jingwei 3) |
| 5 | Full items leave the annotate queue; finished items never offered (`is_task_item_export_eligible`) | ✅ |
| 6 | Review queue excludes the reviewer's own items and items they already reviewed | ✅ Both exclusions, at item level. An item enters review after its first human submission, which Hanchen kept (decision B); one approval still ends collection (Jingwei 4) |
| 7 | Taking and submitting recorded against the person | ⚠️ Submission: yes, `draft_submitted` as before. Taking: only when a user claims an ownerless draft; `create_draft` records nothing (Jingwei, small), and there is no `record_item_taken` helper (finding 2 below) |

Also asked of her on 19/09 and not yet done: counts on each queue row (Jingwei 5), the endpoints in
`api_surfaces.md` (Jingwei, small), and one helper for the count (finding 1 below).

## Jingwei's blocking points — checked

All five hold on `1e4eb4a`:

1. `list_drafts` (`drafts.py:122`) now calls `list_user_drafts_by_task_item`, which drops every draft
   with `created_by IS NULL` — that is, all AI output — and every other person's draft, for every caller.
2. `list_review_queue` skips an item with no human annotation (`task_work_queue_service.py:99-105`).
3. `get_task_item_adjustment` (`review_actions.py:379-397`) checks project access only and returns the
   latest annotation's payload.
4. `list_review_queue` never reads `task.required_annotators`.
5. `list_annotations` sets `total_count` to the filtered length; the queue routes return plain
   `TaskItemRead`.

## Hanchen's decisions (2026-09-25)

### A. On an AI-assisted task, does an item also need human annotators? (Jingwei 2)

Jingwei says no, citing the client on 17/09 ("直接视为submitted让reviewer review … 无需human annotator
参与") and R2-7 (the AI's first pass is never canonical without human review). Our own record agrees:
`info/client-question.md` question 1 reads "no human annotator is involved", and its R1-4 note says the
17/09 answer "still stands".

**But Kanishka built the opposite on our instruction.** Hanchen's message of 23/09
(`message-pr29-followups-kanishka-yi.md`) told her: "on an AI-assisted task the item reaches `annotated`
with zero human submissions, so the queue will see items in `annotated` that still need their full count
of human work." Her reply (`chat_from_Kanishka.md`) confirms she built exactly that. So this is not her
mistake, and the thread should say so before she reworks it.

**Decided (2026-09-25, as recommended): follow the client.** On an `ai_assisted` task, a successful AI annotation completes the
first pass: the item goes to the review queue and is not offered in the annotate queue.
`required_annotators` governs `human_first` tasks. An item whose AI run failed has no AI annotation, so it
goes to the annotate queue for a human — which keeps SCRUM-46's "a human claims the failed draft" route.

### B. Does review wait for all N human submissions? (Jingwei 4)

Today, with `required_annotators = 3`, the first submission puts the item in the review queue, and one
approval canonicalises it. The other two annotators are then refused by SCRUM-28's finalised guard, so
the item is released with one judgement out of three. The client's words (R1-4): "the important
requirement is that the system collects 3 independent human judgements."

**Recommendation was:** hold the item out of review until it is full, as Jingwei suggests.

**Decided by Hanchen (2026-09-25): each submission is reviewed on its own.** An item stays in the review
queue from its first submission, so Jingwei's proposed fix is not taken, and
`test_annotated_item_is_offered_to_independent_reviewer` stays valid. What this does *not* settle is the
problem Jingwei found: one approval must no longer canonicalise the item while fewer than N have
submitted, or collection still stops at 1 of 3. That is a review-action rule, not a queue rule. It fits
#34 (SCRUM-27, a review names the annotation it acts on) and SCRUM-109 (review actions own item status),
but has no owner yet. For this PR, per-submission review means:

- the review queue carries the annotation ids awaiting review (Jingwei 5 already asks for this);
- "already reviewed" should probably be per submission, not per item — today a reviewer who reviewed
  annotator A's submission is never offered annotator B's on the same item. Open: whether independence
  allows that.

---

## Additional findings (not in Jingwei's review)

### 1. The human-submission rule is written five times, not once

On 19/09 Hanchen asked for the count "in one helper that the queue and `submit_draft` both call". The PR
decides "is this a human submission?" as `created_by is not None` in five places:

- `draft_service.py:206` — the submission limit;
- `task_work_queue_service.py:50` — the annotate queue;
- `task_work_queue_service.py:99` — the review queue;
- `annotations.py:56` and `:108` — the privacy filter's "AI output is always visible".

Jingwei's points 4 and 5 add two more users of the same count (hold review until N; `submitted_count` on
each row). And the rule itself is temporary: `created_by IS NULL` identifies AI output only until
SCRUM-38 gives the AI a real author (#29's review, decided 23/09). When that lands, every copy starts
counting the AI as a human and stops showing its output as AI — a silent reversal of R1-4, with each copy
needing its own fix.

**Fix:** one module owns the rule — for example `human_submitter_ids(db, task_item_id) -> set[int]` and
`is_machine_annotation(annotation) -> bool` — and all seven callers use it. The queue can take a
grouped variant, which also removes the N+1 Jingwei measured.

### 2. `draft_started` is written inline in a route, not through `record_item_taken`

The helper name was agreed on 19/09 and sent to Yi the same day. It is now written into the board:
SCRUM-98 (F1, W11) says "SCRUM-48's `record_item_taken` helper is moved onto this record". The PR writes
the history row inline in `update_draft` (`drafts.py:184-212`), and not at all in `create_draft`, so F1
has no single place to migrate and would miss the path a second or third annotator takes.

**Fix:** a `record_item_taken(db, *, task_item_id, user_id, commit=False)` helper next to
`TaskHistoryRecorder`, called from both the claim path and `create_draft`. This resolves Jingwei's
"Recording takes" point at the same time.

---

## Draft comment for the PR (English, for Hanchen to post)

> **Superseded 2026-09-25:** Hanchen is fixing #33 himself on a stacked branch. The comment to post is
> in [`../../sandbox/W8/plans/plan-SCRUM-48-fixes.md`](../../sandbox/W8/plans/plan-SCRUM-48-fixes.md) → Messages.
> Also decided since: one reviewer may review every submission on an item, and the accept rule is
> fixed in this PR.

Updated after decisions A (follow the client) and B (review each submission) on 2026-09-25. It adds to Jingwei's review rather than repeating it. Nothing is posted until Hanchen
agrees.

```
Thanks Kanishka, and thanks Jingwei for the thorough review. I've checked her five blocking points against 1e4eb4a and agree with all of them. Three things from me: two product answers so you're not guessing, and two small additions.

**Jingwei's #2 (AI-assisted items) is my fault, not yours.** On 23/09 I told you AI-assisted items "still need their full count of human work". That was wrong. The client said on 17/09 that on an AI-assisted task the AI's output goes straight to review and no human annotator is involved. So:
- on an `ai_assisted` task, a successful AI annotation completes the first pass. The item goes to the review queue and is not offered in the annotate queue;
- `required_annotators` applies to `human_first` tasks;
- an item whose AI run failed has no AI annotation, so it stays in the annotate queue for a human.

**Jingwei's #4: each submission is reviewed on its own.** So an item stays in the review queue from its first submission, and your test for that stays. Jingwei's underlying point still stands, though: one approval must not canonicalise the item while fewer than `required_annotators` have submitted, or collection stops at 1 of 3. That's a review-action rule, not a queue rule, so I'll settle where it goes (#34 / SCRUM-109) separately. For this PR it means two things:
- the review queue should carry the annotation ids awaiting review, as Jingwei's #5 suggests;
- "already reviewed" is currently per item, so a reviewer who reviewed one annotator's submission is never offered another annotator's on the same item. Please keep it as it is for now; I'll confirm whether it should become per submission.

**1. One helper for "is this a human submission?"** It's decided as `created_by is not None` in five places: `draft_service.py:206`, `task_work_queue_service.py:50` and `:99`, and `annotations.py:56` and `:108`. Jingwei's #4 and #5 add two more. `created_by IS NULL` only means "AI" until SCRUM-38 gives the AI a real author. Then every copy would start counting the AI as a human, which reverses the client's R1-4. Could one module own it, e.g. `human_submitter_ids(db, task_item_id)` and `is_machine_annotation(annotation)`? A grouped version of the first would also fix the N+1.

**2. `record_item_taken`.** That's the helper name we agreed on 19/09, and SCRUM-98 (F1) on the board now says it moves "SCRUM-48's `record_item_taken` helper" onto the event record. At the moment the row is written inline in `update_draft` and not at all in `create_draft`. Could it be a helper called from both? That also covers Jingwei's "Recording takes" point.

On timing: SCRUM-93 is blocked on this PR and W8 ends on Wednesday. If you agree Jingwei's #5 response shape (`submitted_count`, `required_annotators`, `working_count` on each row) on this thread today, you can start the screen against it before this merges.
```

---

## Not raised on the PR

- **Schedule.** SCRUM-48 is W7 carry-over (planned in W7, PR opened 24/09), so it is outside W8's load.
  SCRUM-93 (2.5u, W8) is blocked by it, and the break week has no feature work, so if the PR doesn't merge
  early next week, SCRUM-93 moves to W9. Worth raising at the next meeting.
- **Parth's review.** The roadmap's W7 collaboration table has Parth reviewing the API PR, for D7's
  sampling and SCRUM-52's adjudicator queue. Ask him to look at `task_work_queue_service.py` before merge,
  even if only that file.
- **Finalised check before the lock.** `_assert_task_item_accepts_writes` (`draft_service.py:245`) runs
  before the item row is locked (`:175`), so an item canonicalised while a submission waits for the lock
  is not re-checked. Once decision B is in, the window is small: an item reaches review only when it is
  full, and a full item refuses new submitters anyway. Re-checking after the lock is cheap, but it can
  wait.
- **Dead check.** `list_review_queue` filters on `status == "annotated"`, then tests
  `is_task_item_export_eligible` (`task_work_queue_service.py:89`), which can never be true for such an
  item. Harmless.
- **PR description.** It has no "decisions for review" or "known limitations" section and no manual test,
  which the PR format in `tech-stack.md` asks for. The web part is SCRUM-93, so "demonstrable in the running
  app" is met there, not here.

## After posting

1. Record decisions A and B (both taken 2026-09-25) in `info/client-question.md` (question 1's reading)
   and in the W8 row for SCRUM-93 in `roadmap.md` — the screen shows AI-assisted items differently.
2. Give the "one approval must not end collection" rule an owner: #34 (Jingwei, SCRUM-27) or SCRUM-109
   (Parth). Decide whether the review queue's "already reviewed" exclusion is per item or per submission.
3. Correct the 23/09 message's claim in `message-pr29-followups-kanishka-yi.md` with a note pointing
   here.
4. Re-review when Kanishka pushes; check the helper covers all seven callers.
