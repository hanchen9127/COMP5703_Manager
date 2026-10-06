# Review — PR #53, `CS57-Parth` (SCRUM-51 D7/E1, SCRUM-52 D8/E3)

2026-10-05. Head `942d4e0`, two commits, based on `main` `bbb93cb`, which is still `main`'s head:
- `c16c87f` feat(api): implement independent second review workflow (SCRUM-51);
- `942d4e0` feat(api): add adjudication queue independence checks (SCRUM-52).

31 files, +2,857 / −90. That includes two new tables (`cross_review_samples`, `review_disagreements`), ADRs 010
and 011, and two test files (+1,110 and +522).

**On GitHub (checked with `gh pr view 53`):** open, not a draft, mergeable. Review requested from Yi. No reviews or
comments yet. CI is green: `sqlite` and `postgresql`, push and pull_request runs.

**Read before this review:**
- SCRUM-51 and SCRUM-52's descriptions, including the additions of 2026-10-01 (supplies, gate, AI never a slot,
  report) and 2026-10-02 (SCRUM-101 calls the comparison);
- client answers R2-5 (release provenance), R2-7 (cross-review supplies and gates) and R2-8 (no adjudicator on
  their own work);
- PR #45's review rule (SCRUM-116, `review_refusal`);
- PR #52 (Dishank, SCRUM-117) and PR #48 (Yi, SCRUM-99/100, paused on issue #40), which change the same files.

**Recommendation: request changes.** Most of SCRUM-52 is ready:
- one shared conflict rule for the queue and the decision;
- a 403 under the item lock, before any write;
- no administrator override.

The SCRUM-51 machinery underneath is sound too:
- frozen samples;
- supplies, not stacks;
- the AI never counts as a reviewer slot;
- idempotent disagreement flags;
- bounded batch reads for lists.

Four things block the merge:
1. **Blindness never ends.** Anyone who can review but did not review a submission is blind to its decisions
   forever — even after the item is final. That hides review provenance from exports, history and reads.
2. **An adjudicator who can review is blind to the dispute.** This follows from point 1, and SCRUM-52 forbids them
   from ever unlocking it by reviewing.
3. **The two-review rule (decided by Hanchen on 2026-10-05).** Every required reviewer gives a verdict before
   anything is decided. Today a first return hands the work back to the annotator at once, while the second
   reviewer can still review the same version.

4. **The cross-review report discloses an open round's verdicts** (Yi's P2). Reproduced: with three approvals
   required and two accepts, an admin who still owes the third review sees `completed=1, agreed=1`. Fix: count a
   submission only once its round is decided.

Fixing point 3 also removes most of the status masking points 1–2 rely on.

**Yi's review (CHANGES_REQUESTED, 2026-10-05 10:42, on `942d4e0`)**
- **P1 is point 3.** Yi lays out the sequence (v1 superseded with one review, then SECOND is moved on to v2) and
  offers a choice between completing the state model and immediate rework. Hanchen's decision picks the first.
  - One difference: only the submission needs holding, not draft create and update.
- **P2 is point 4.**
- **Yi's non-blocking export follow-up** is agreed, and tracked with H2/F1.
- **Yi does not raise points 1–2.** P2 assumes admins stay blind until they review, which point 1 replaces:
  blindness ends when the round is decided. The GitHub text says so, to keep the two reviews consistent.
- Yi's code links (`./hej/apps/...`) do not resolve on GitHub; this does not affect the content.

## Verified

- **Suites at `942d4e0`, SQLite: 1,013 passed, 9 skipped**, matching the PR description. CI ran SQLite and
  PostgreSQL.
- **SCRUM-52.**
  - `adjudication_conflict_item_ids` covers human answers and reviewer corrections (author roles `annotator` and
    `reviewer`) and every review, across versions and rounds.
  - Routing alone and AI answers are not conflicts.
  - `list_adjudication_queue` filters on that rule, and `decide_escalation` locks the item (`for_update=True`) and
    refuses with 403 before writing anything.
  - Both decisions, `finalize` and `send_back`, go through the check.
- **Sampling is frozen per version.**
  - `ensure_submission_sample` runs inside the creating transaction: on a first answer in `draft_service`, and on
    every later version in `create_version`.
  - It runs lazily for legacy answers at their first review.
  - Policy changes do not re-sample. Canonicalised legacy work is never sampled retroactively.
- **Supplies, not stacks.** `effective_required_approvals = max(required, 2 if sampled else 1)`. AI first passes
  are never an approval.
- **The comparison SCRUM-101 needs exists.**
  - `compare_submission_reviews(..., disagreement_only=True)` and `persist_submission_disagreement` are idempotent
    per submission and carry `disagreement_handling`.
  - Accept versus redo counts as a disagreement; `adjust`, `revise` and `reject` all mean redo; an escalation is
    not an ordinary verdict.
- **Lists stay batched.** The task-item list, setup, queues and history use `blind_submissions_by_item` with
  bounded queries, and there is a statement-count test.

## Blocking

### 1. Blindness never ends

`review_details_hidden` hides a submission's reviews from a caller who holds REVIEW, is not its author, and has not
reviewed it. "Requires independent review" means the submission is sampled or the policy wants more than one
approval. Nothing asks whether the submission can still be reviewed.

I seeded it with the PR's fixtures: 100% sampling, one approval required, two reviewers both accept, and the item
canonicalises.

| Reader | `review_details_hidden` after the item is final |
| --- | --- |
| A third reviewer, who never reviewed it | **True** |
| An administrator | **True** |

Neither can ever unlock it, because a final submission takes no more reviews. Every surface this PR masks then
drops the decisions for them:
- the review read (403, "hidden until you submit your own review");
- history;
- workflow counts;
- **exports**.

`test_export_keeps_owner_review_provenance_and_masks_unreviewed_peers` asserts exactly that: an administrator's
export of fully reviewed work carries no review reasoning.

Client answer R2-5 lists "review decisions and justifications" in every released item's provenance, and H1/H2
(SCRUM-102, 104) build releases on this export path. Whoever releases needs the export capability, and an
administrator also holds REVIEW. A release made by an administrator would therefore drop the reviews.

**Fix:** blind a reader only while *they* could still review the submission. That means its round is still open:
- it is short of the verdicts it needs;
- it is not escalated;
- the item is not finished.

Once the round is decided — fully approved, back with its author, escalated or disputed — every permitted reader
sees the decisions. The rule protects a pending reviewer from anchoring, and nothing more is needed.

Tests:
- after both reviews, a third reviewer and an administrator see both decisions in the review read, history and
  export;
- flip the export test above.

### 2. An adjudicator who can review is blind to the dispute

The same rule, from the other side.

Seeded: dual sign-off. FIRST accepts, SECOND escalates, and the item is `disputed`. For the administrator, who
holds ADJUDICATE and REVIEW and reviewed nothing, `review_details_hidden` returns **True**. The same holds for
anyone with both the reviewer and arbitrator roles.

SCRUM-52 (R2-8) requires the adjudicator *not* to have reviewed the work, so this person can never unlock the two
decisions they are there to settle. Only an arbitrator-only account sees them.

**Fix:** point 1's fix covers it, since an escalated submission is decided. Add a test: an independent
administrator, and a reviewer-arbitrator, deciding an open escalation can read both reviews.

### 3. Every required reviewer gives a verdict before the outcome (Hanchen, 2026-10-05)

Rule for a submission that needs more than one verdict (dual sign-off, or sampled):
- **Every required reviewer gives an ordinary verdict before anything is decided.**
- All accept: approved. All redo (`adjust`, `revise` or `reject`): back with its author.
- Accept and redo mixed: a disagreement. It follows the resolved `disagreement_handling` — `open_dispute` opens a
  dispute (SCRUM-101), and `manual_review` flags it and holds the submission for a person to escalate.
- An escalation still stops review at once.

What the PR does today. Seeded with dual sign-off, FIRST returns:
- item status `returned`;
- `back_with_author = True`, and the author's annotate row has `rework = True`;
- the submission is **still offered to SECOND**.

So the annotator reworks while a second reviewer judges the version being replaced. Under #52's rule the author can
resubmit at once, and SECOND's decision on the superseded version then gets 409. The pair is lost.

Change `review_refusal`'s `needs_independent_second` (which also widens #45's rule) into the rule above, and build it
into `SubmissionReviewState`:
- `back_with_author` (and `returned_since` / `rejected_since`) only once the required verdicts are all in and all
  redo;
- a disagreement state when they are mixed.

Then the following all read the same state and need no change of their own:
- #52's `may_resubmit`;
- the annotate queue;
- the item-status transition;
- SCRUM-101.

The item status stays `annotated` (awaiting review) until the round is decided. That also removes the reason for
`blind_item_status(es)` and the queue rows' status masking: no coarse status reveals a first verdict any more.

Tests:
- two looks, FIRST returns: not back with the author, still offered to SECOND, item `annotated`;
- SECOND returns too: back with the author;
- SECOND accepts: a disagreement, handled as the policy says, and not back with the author;
- the same three with a sampled single-approval policy.

## Non-blocking

4. **Merge order with #52 and #48.**
   - #52 (Dishank) changes `submission_rules.py`, `task_work_queue_service.py`, `draft_service.py` and the queue
     tests, and its `may_resubmit` reads `back_with_author`. Point 3 makes the two agree, but the files will
     conflict. Agree who merges first.
   - #48 (Yi) touches eight of the same files (`review_actions.py`, `tasks.py`, `db_models.py`, the schemas,
     `api_surfaces.md` and more). SCRUM-99's decision route must call `adjudication_conflict_item_ids` — the one
     rule SCRUM-52 asked for.
5. **ADR numbers.** This PR takes 010 and 011. Jingwei's SCRUM-32 proposal expects an ADR 010 from Yi, and SCRUM-32
   plans its own. Whoever merges second renumbers.
6. **Reviewer corrections (SCRUM-32, W9).** `create_version` samples every new version, including the reviewer
   corrections SCRUM-32 will write, and the report counts them. Agree with Jingwei that corrections take no sample
   and stay out of the counts.
7. **The report's denominators.** `total_submissions` counts every annotation of the task: superseded versions,
   AI answers and corrections included. `sampled_submissions` for unrecorded answers counts current ones only.
   Define both — for example, human and AI submissions, all versions — and say so in the response. SCRUM-72 (I3)
   computes its coefficient on these counts.
8. **Export cost.** The export calls `visible_reviews` and `reviewer_correction_hidden` once per annotation, at
   about six queries each, so a 200-item export adds over a thousand statements. Point 1 narrows who is blind.
   Use the batched `blind_submissions_by_item` there too, as the lists already do (A6, SCRUM-119, is measuring
   exactly this kind of cost).
9. **Sampling by version.** `is_sampled` hashes the annotation id, so a resubmission redraws the sample.
   Hashing `base_annotation_id` would keep one decision per answer across its versions — worth an explicit choice
   in ADR 010.
10. **Schema timing.** The two new tables land before W9's agreed schema order (F1, F2, C4). Mention in the PR
    that development PostgreSQL databases need `init_data.py --reset` after merging (SCRUM-94 rule).
11. **Naming and size.** The convention is `feat(SCRUM-51, SCRUM-52): …` for the title. Two tickets and 2.9k
    lines in one PR made this hard to review; split future ones by ticket.

## Suggested GitHub review (request changes)

Markdown for GitHub: paste the block as is.

```markdown
Thanks Parth — a lot of careful work here.

**What's good**
- **SCRUM-52 is close.** One conflict rule serves both the adjudication queue and `decide_escalation`. It is checked under the item lock, before any write, and returns 403 with no admin override.
- **The SCRUM-51 machinery is sound:**
  - per-version samples are frozen;
  - a cross-review supplies the second approval rather than adding a third;
  - the AI never fills a reviewer slot;
  - disagreement flags are idempotent and carry `disagreement_handling`;
  - list reads are batched.
- **Tests:** 1,013 passed on SQLite, and CI is green.

**Four changes before merge** (points 3 and 4 are also in Yi's review — P1 and P2)

**1. Blindness never ends**
- `review_details_hidden` hides a submission's reviews from anyone with REVIEW who did not review it. It never checks whether the submission can still be reviewed.
- Seeded with your fixtures (100% sampling, two accepts, item `canonicalized`): a third reviewer and an admin are still blind, and can never unlock it.
- Review reads, history, counts and **exports** all drop the decisions. `test_export_keeps_owner_review_provenance_and_masks_unreviewed_peers` asserts that an admin's export of finished work has no review reasoning.
- R2-5 requires review decisions and justifications in release provenance, and releases (SCRUM-102/104) build on this export.
- **Fix:** blind a reader only while the submission's round is still open — short of its verdicts, not escalated, item not finished. Once the round is decided, every permitted reader sees the decisions.
- **This is the rule points 2 and 4 build on.** Blindness ends when the round is decided — admins and adjudicators then see the decisions. It does not last until the reader submits a review of their own.
- **Tests:** flip that export test, and add read, history and export tests after both reviews.

**2. An adjudicator who holds REVIEW is blind to the dispute**
- Dual sign-off: FIRST accepts, SECOND escalates. `review_details_hidden` is `True` for an admin, or a reviewer-arbitrator, who reviewed nothing.
- SCRUM-52 forbids them from ever reviewing it, so they can never see what they are deciding.
- **Fix:** fix 1 covers this, because an escalated submission is decided.
- **Test:** an independent admin adjudicator can read both reviews.

**3. Rule clarification: all required verdicts first** (agrees with your ADR 010 decision 5; contradicts ADR 007, which will be amended)
- **Same issue as Yi's P1.** Yi offered two ways out. Hanchen's decision keeps ADR 010's path, so complete the state model rather than switching to immediate rework.
- **The rule**, where a submission needs more than one verdict (dual sign-off or sampled):
  - every required reviewer gives an ordinary verdict before anything is decided;
  - all accept → approved;
  - all redo → back with the author;
  - mixed → a disagreement, handled by `disagreement_handling`: `open_dispute` opens a dispute via SCRUM-101, and `manual_review` flags it and holds it;
  - an escalation still stops review at once.
- **Today:** under dual sign-off, when FIRST returns:
  - the item becomes `returned`;
  - `back_with_author` and the author's `rework` flag are `true`;
  - SECOND is still offered the submission.
- **So** the annotator reworks while SECOND judges the version being replaced. Under #52, SECOND's decision on the superseded version then gets 409.
- **Fix:**
  - build the rule into `SubmissionReviewState`, instead of `review_refusal`'s `needs_independent_second`: `back_with_author` only once all verdicts are in and all redo, and a disagreement state when they are mixed;
  - keep the item `annotated` until the round is decided. That also removes the need for `blind_item_status(es)` and the queue status masking;
  - hold the **submission** while the round is open — #52's `may_resubmit` reads `back_with_author` and follows on its own. Saving a draft meanwhile is harmless, so draft create and update need no new refusal.
- **Tests:** each under dual sign-off and under sampling:
  - FIRST returns → still offered to SECOND, not back with the author, and a resubmission is refused;
  - SECOND returns too → back with the author;
  - SECOND accepts → a disagreement, handled per policy.

**4. The cross-review report discloses verdicts to a reviewer who still owes one** (Yi's P2)
- Reproduced with your fixtures: 3 approvals required, 100% sampling, FIRST and SECOND accept. The admin is still offered the third review, and the report shows `completed_cross_reviews=1, agreed_cross_reviews=1` — so the admin knows both were accepts.
- **Fix:** count a submission in the report only once its round is decided. That is the same line as fix 1: no reader sees an open round's verdicts, and a project manager's figures stay the same whoever asks.
- **Test:** with the round open, the report leaves the submission out of the completed, agreed and disagreed counts; once the round is decided, it counts it.

**Smaller points**
- **Merge order:** #52 (Dishank) and #48 (Yi) touch the same files, so agree who merges first. SCRUM-99's decision must call `adjudication_conflict_item_ids`.
- **ADR numbers:** Yi's SCRUM-99 and Jingwei's SCRUM-32 also plan ADRs; whoever merges second renumbers 010/011.
- **Reviewer corrections:** `create_version` samples every version, including SCRUM-32's reviewer corrections. Exclude corrections from sampling and from the report.
- **Report denominators:** `total_submissions` counts every annotation (superseded versions, AI answers, corrections), while unrecorded sampled ones count current versions only. Define both; I3 builds on them.
- **Export cost:** the export calls `visible_reviews` once per annotation, at about six queries each. Use `blind_submissions_by_item` there, as the lists do.
- **Sampling key:** `is_sampled` hashes the version id, so a resubmission redraws the sample. Consider `base_annotation_id`, and record the choice in ADR 010.
- **Schema:** note that the two new tables need `init_data.py --reset` on dev PostgreSQL.
- **Export (Yi's follow-up):** neither export carries the per-version sampling decision or the disagreement flag. Agreed this is not a blocker; it will be tracked with the release and provenance work (SCRUM-104, H2's manifest, or F1).
```
