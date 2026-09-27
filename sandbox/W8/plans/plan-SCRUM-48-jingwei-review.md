# Plan — answer Jingwei's review of PR #35 (SCRUM-48, D8)

2026-09-27. Jingwei requested changes on PR #35 on 2026-09-26 at `3d4d06d` (review on GitHub, checked with
`gh pr view 35`). Branch `CS57-Hanchen-scrum-48-fixes`, stacked on `CS57-KANISHKA` (#33). Earlier plan:
`plan-SCRUM-48-fixes.md` (decisions A–E, commits 1–15).

## Is each point true?

Checked with scratch tests on `3d4d06d` (SQLite, the shared conftest session), before planning anything.

| # | Jingwei's point | Verdict | What the scratch test showed |
| --- | --- | --- | --- |
| 1 | Rejecting or returning the AI's first pass strands the item | **True** | AI-assisted task, reject the AI's submission: status `rejected`; annotate queue empty; review queue empty for both reviewers; a person's submission → 409 "AI-assisted items take no human annotation". Same with `revise` (status `returned`). `item_complete` needs the AI's submission approved, and the AI never resubmits |
| 2 | An accept on one submission clears a dispute, and ordinary review can then finalise the item | **True** | Via `POST …/escalations/route` alone: `disputed` → accept A → `annotated`, back in the review queue → accept B → **`canonicalized` with the escalation still `open`**. Via the web's path (escalate review action, then route): accept B turns `disputed` into `annotated` with the escalation open; the escalated submission's `needs_revision` blocks completion, so it stops there — but the item has left the adjudication queue's status |
| 3 | An approval of a submission's old answer counts for its resubmission | **True** | Dual sign-off: Erin approves → Frank returns → resubmit → Erin not offered the new answer → Frank approves → `approved`, **`canonicalized`**. `submission_rules.py:276` counts approvals with no `since_submission` check |
| 4 | What `review_required_approvals` counts (per submission or per item) | Contract, not a defect | D8 criterion 7 says per submission: "each has the approvals the review policy requires". Agree with Jingwei; she corrects #37's description |
| Q1 | Disagreement gets canonicalised | True, out of scope | R2-7 sends disagreeing judgements to dispute under dual sign-off. That is SCRUM-101 (E1, Yi, W8); `item_status_after_accept` is the hook |
| Q2 | "Since the last submission" relies on `annotations.updated_at` | **True, and worse than stated** | The column has `onupdate=now`, so *any* ORM write to the row resets every submission's review state, not only an explicit update. Today only a resubmission writes the row (`draft_service.py`, the one `annotations.update` call), so nothing is wrong yet |

## Decisions (Hanchen, 2026-09-27)

- **Point 1 is not in this ticket's scope, and waits for the client.** It is not fixed in #35. It goes into
  the Round 3 client Q&A (not yet sent): what should happen to an AI-assisted item whose first pass a
  reviewer rejects or returns. The follow-up ticket below is written once the answer is in, and the reply
  says so. Note for the record: the stranding is new with decision A, made in #35, so #35
  merges with a known gap on AI-assisted tasks until the follow-up lands.
- **Points 2 and 3 are fixed in #35**, as Jingwei proposes.
- **Point 4: per submission**, as D8 criterion 7 says. No code; the rule is written down in `api_surfaces.md`.
- **Q2: add `annotations.submitted_at` now.** This branch already requires a dev-database reset, so a new
  column costs nothing extra.

## Commits

**Done 2026-09-27:** `c92a496`, `5adfe72`, `5113d18` pushed to `CS57-Hanchen-scrum-48-fixes`; the reply
posted on PR #35 (`../../../reviews/W8/reply-cs57-hanchen-scrum-48-jingwei-review.md`). Point 1 is tracked
in issue #38 (Yi, 2026-09-26), not a new ticket; the reply corrects #38's background, which says the item
goes to a human annotator — it is stranded.

Three commits, in this order. Each one updates `docs/design/backend/api_surfaces.md` for its own rule,
and its message says which tests fail on the commit before it. One commit per turn.

### Commit 16 — `feat(api): record when an annotation was last submitted (SCRUM-48)`

**Status (2026-09-27):** committed as `c92a496` (not pushed). SQLite 602 + 6 skipped, PostgreSQL 608. Message:
`../commits/commit-SCRUM-48-16-submitted-at.txt`. The migration sits before `migrate_db_schema`'s
early return for a database without `tasks`, next to `project_policies`.

**Why:** Jingwei Q2. Every "since the last submission" rule reads `annotations.updated_at`, which any
write to the row resets.

- `db_models.py`: `AnnotationDB.submitted_at = Column(UtcDateTime, default=now, nullable=False)`. No
  `onupdate`, so it changes only when a submission sets it.
- `draft_service._create_annotation_from_draft`: the resubmission branch sets `submitted_at` explicitly;
  a first submission gets it from the default. The AI's path and `approve_draft` create through the
  same repository, so they get the default too.
- `database.migrate_db_schema` (SQLite): add the column, backfilled from `updated_at`, with
  `created_at` where that is null. PostgreSQL dev databases are reset (already required).
- `submission_rules.submission_review_states_by_item`: `since_submission` compares `ReviewDB.created_at`
  with `AnnotationDB.submitted_at`.
- Tests: an update to an annotation that is not a submission (e.g. `confirmed_at`) leaves every
  submission's review state unchanged — fails on the commit before; a resubmission still resets it.
  `test_item_completion._resubmit` sets `submitted_at` instead of `updated_at`.

### Commit 17 — `fix(api): count a submission's approvals since it was last submitted (SCRUM-48)`

**Status (2026-09-27):** committed as `5adfe72` (not pushed). SQLite 604 + 6 skipped, PostgreSQL 610. Message:
`../commits/commit-SCRUM-48-17-approvals-since-submission.txt`. Point 4's per-submission rule is
written into `api_surfaces.md` here. The tests' resubmit helpers changed: dating a resubmission a second
ahead put the reviews after it before it once approvals are time-bound.

**Why:** Jingwei 3. Under dual sign-off, an approval of the old answer counted for the new one, and its
approver was never offered the new answer.

- `submission_rules.approvers_of`: only reviews at or after the annotation's `submitted_at`.
- `submission_review_states_by_item`: `approved_by` collects only approvals since the submission, as
  `reviewed_since_submission_by`, `decided_since_submission` and the rest already do. The
  `SubmissionReviewState.approved_by` comment changes to match.
- `assert_can_add_approval` and `distinct_approved_reviewers` follow `approvers_of`, so an earlier approver
  may approve the resubmission; `awaits_review_by` offers it to them.
- Tests: Jingwei's sequence — Erin approves, Frank returns, resubmit, Frank approves →
  `pending_second_review` and not canonical; Erin's review queue now offers it; Erin approves →
  `canonicalized`. Fails on the commit before at the first assertion.

### Commit 18 — `fix(api): an open escalation keeps an item disputed (SCRUM-48)`

**Status (2026-09-27):** committed as `5113d18`. SQLite 608 + 6 skipped, PostgreSQL 614. Message:
`../commits/commit-SCRUM-48-18-escalation-keeps-disputed.txt`. **Two changes from the plan below:** the
check sits in the review action after the item's status is decided, not in `item_status_after_accept`,
so it covers a return or reject of another submission too (same defect, found while writing it); and
`test_queue_routes_return_rows_for_real_items` gives adjudication its own disputed item, since one item
with an open escalation can no longer sit in the review queue.

**Why:** Jingwei 2. An accept on another submission turned a disputed item back into `annotated`, the
review queue offered it again, and a second accept could canonicalise it with the escalation open.

- `submission_rules`: `open_escalation_item_ids(db, item_ids)` — one grouped query on
  `TaskItemEscalationDB` with status `open`.
- `review_policy_enforcement.item_status_after_accept`: returns `disputed` while the item has an open
  escalation, before any other outcome, and never `canonicalized` then.
- `task_work_queue_service.list_review_queue`: skips items with an open escalation, from that query, as
  well as the `disputed` status. Query count stays flat (Jingwei's 1,000-item check: 8 and 10 SELECTs).
- Whether the review action should refuse outright on a disputed item stays with SCRUM-107 / SCRUM-109,
  as Jingwei says; the reply points there.
- Tests, both paths from the scratch run: route only → accept → accept leaves it `disputed`, not in the
  review queue, escalation `open`; escalate action + route → accept the other submission → still
  `disputed`. Both fail on the commit before.

## Out of scope — follow-up ticket for point 1

**Draft only — waits for the Round 3 client answer**, which may change it. Jingwei's proposal, as a
starting point (sprint and owner at the weekly meeting; it touches `submission_rules.py`, so after #35
merges):

```
Related to user story D8, C2

ONLY BACKEND

Found in Jingwei's review of PR #35 (2026-09-26). On an AI-assisted task, a reviewer who rejects or returns the AI's first pass strands the item: the annotate queue skips it because a machine annotation exists, a person's submission is refused ("AI-assisted items take no human annotation"), the review queue skips it because the AI's submission was decided, and the item can never complete because that submission is never resubmitted and approved.

# An AI first pass that a reviewer rejected or returned counts like a failed AI run: people annotate the item, as D8 criterion 2 already says for a failed run.
# The rejected AI submission stays in the item's history, but no longer has to be approved for the item to complete.
# The item's status says it is open work again, not "rejected" or "returned" waiting on an author who will never redo it.
# The queue row's has_ai_annotation is false once the AI's first pass is rejected, so SCRUM-93's list shows the item as open.
# Tests: reject the AI's submission, then a person annotates, is reviewed and approved, and the item completes; the same with a return.
```

## Reply to Jingwei (post after commit 18 is pushed)

> Thanks Jingwei — I re-ran each point on `3d4d06d` before changing anything, and all of them hold.
>
> **2** is fixed in `<sha18>`: while an item has an open escalation, any review of its submissions
> (accept, and also return or reject, which had the same effect) leaves it `disputed`, and the review
> queue skips it. I reproduced the canonicalisation through `escalations/route` alone, and the
> lost `disputed` status through the web's escalate-then-route path; both are now tests. Whether the
> review action should refuse outright stays with SCRUM-107/109, as you say.
>
> **3** is fixed in `<sha17>`: approvals count since the submission was last submitted, like returns and
> rejections, so under dual sign-off Erin is offered the new answer and her old approval no longer counts.
>
> **Q2**: the column has `onupdate`, so any write to the row would have reset review state, not only an
> explicit update. `<sha16>` adds `annotations.submitted_at`, set only on submission, and every "since
> submission" rule reads it. SQLite migrates; PostgreSQL dev databases need the reset this branch
> already asks for.
>
> **1** is real, and it follows from decision A, but it's outside SCRUM-48's scope. What a rejected or
> returned AI first pass should lead to is going to the client in the Round 3 Q&A, with your proposal
> (count it like a failed run) as ours; the ticket follows the answer. Until then an AI-assisted item
> whose first pass is rejected stays stuck.
>
> **4**: per submission, as D8 criterion 7 says. Please go ahead and correct #37's description.
> @part0922, that's the number SCRUM-51 reads.
>
> **Disagreement**: agreed it's R2-7's dispute rule and belongs to SCRUM-101. @DIQI26,
> `item_status_after_accept` is the hook.
>
> On merging with #37: noted, whichever of us merges second takes both changes.
