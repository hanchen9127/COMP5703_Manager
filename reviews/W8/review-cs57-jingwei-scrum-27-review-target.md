# Review — PR #34, `CS57-Jingwei` (SCRUM-27, D4)

2026-09-25. Head `8ca7325`, base `main`; merge-base `fd273b9` (`main` is now at `2fab5ec`). Seven
commits, 6 files, +801 / −17. It merges cleanly with `main`, and with `CS57-Hanchen-scrum-48-fixes`
(#35).

**On GitHub (checked with `gh pr view 34`):** open, review requested from Hanchen, no reviews or
comments yet.

**Read before this review:** the SCRUM-27 description on the board (`Jira.csv`, 24/09, drafted in
`sandbox/W8/jira/jira-W8-descriptions.md`), story D4, issue 3 in `info/issues.md`, S7 in
`sandbox/W7/plans/defects-SCRUM-25.md`, and `shared/client-qa.md` Round 1 Q4 (several human judgements
per item, 21/09). The only earlier message to Jingwei (`message-client-qa-R1-corrections.md`) was
about SCRUM-20/50, not this ticket.

**Recommendation: request changes.** The API change is right, and its central test proves what it
claims. Three things need doing before merge:
1. the web app sends the annotation it shows (Hanchen's decision, 2026-09-25: minimal web wiring in
   this PR);
2. the adjustment read pairs the named answer with *another* submission's review;
3. the S7 fix has no test.

## Verified

- Suite at `8ca7325`: **SQLite 469 passed, 4 skipped; PostgreSQL 473 passed** (local Docker, PostgreSQL
  18). Both match the description.
- The description says three tests fail against the old selection. Checked by putting
  `_latest_annotation` back into `submit_task_item_review_action`: exactly
  `test_review_acts_on_the_named_annotation`, `test_review_refuses_to_guess_between_candidates` and
  `test_self_review_is_refused_on_the_named_annotation` fail. The two-items-naming-opposite-annotators
  design is a good one.
- `approve_draft` with an AI draft (`created_by` NULL): the new `created_by == draft.created_by` filter
  becomes `IS NULL` in SQLAlchemy, so the fallback still finds the AI's own annotation. That is fine.
- The "Q4" reference in the test docstring is Round 1 Q4 (21/09), which is correct.

## Scope — SCRUM-27 on the board, point by point

| # | Board description (24/09) | On `8ca7325` |
| --- | --- | --- |
| 1 | Opening an item for review always shows a specific, identified annotator's submission | ⚠️ API: yes — the adjustment read names `annotation_id`, `annotated_by` and `annotated_by_name`. But the review fields beside it can belong to another submission (finding 2). Web: the panel does not know which submission it shows (finding 1) |
| 2 | On a two-annotator item both submissions are individually addressable | ✅ API. ❌ Web (finding 1) |
| 3 | The decision is recorded against the submission the reviewer actually opened | ✅ API when named. ❌ Web: the running app can't name it, so a two-annotator item returns 409 |
| 4 | `approve_draft` stops falling back to another author's annotation (S7) | ✅ Code. ❌ No test (finding 3) |
| 5 | A test on a two-annotator item returns a specific submission every time | ✅ `test_review_annotation_selection.py` |

Issue 3 closes on the API side only. D4 criterion 1 ("I know I'm reviewing the right person's work")
is a screen criterion, and the Definition of Done asks for it to be demonstrable in the running app.

## Fix before merge

### 1. The web app cannot name the submission, so review 409s on every two-annotator item

**Decided by Hanchen (2026-09-25):** the minimal web wiring goes into this PR. SCRUM-49 has no owner
and no sprint, and its description does not cover naming a submission.

`submitTaskItemReviewAction` (`lib/api/review-actions.ts:103-113`) never sends `annotation_id`. After
this PR, any item with two or more current annotations refuses the review with 409. That includes the
first ten seeded items, which carry one annotation each from Alice and Bob. The reviewer sees the
backend's "Name the one being reviewed in 'annotation_id'" message on the screen.

The panel must send the submission it **shows**, not the one the adjustment read picks. It shows
`buildReviewFinalPayload(item)`, built from the draft `selectDraftForViewer` chose. `ApiDraft` already
carries `annotation_id` (`lib/api/task-items.ts:50`), but hydration drops it. Suggested:
- keep the chosen draft's `annotation_id` on the hydrated item;
- add `annotation_id` to `TaskItemReviewActionRequestBody` and `buildTaskItemReviewActionRequestBody`;
- send it from the panel's submit (`task-item-workspace-sheet.tsx:1624`);
- add a web test that the body carries the displayed draft's `annotation_id`.

Seed data needs one more line. Step 5's drafts are written without `annotation_id`, so a seeded
two-annotator item would still 409. Linking each seeded submitted draft to its author's annotation, as
SCRUM-26 does for new submissions, fixes that.

### 2. The adjustment read shows one submission with another submission's review

`get_task_item_adjustment` resolves the named annotation, but takes `reviewer_note`, `review_verdict`,
`review_justification` and `review_feedback` from `_latest_review(db, task_item_id)`: the item's latest
review, whichever submission it was about (`review_actions.py:486`, `_latest_review` at `:244`).

Probe on the PR's own fixture: a reviewer returns Alice's submission with feedback, then reads Bob's.

```text
read(annotation_id=Bob's) -> annotated_by: 2 | reviewer_note: "ALICE-ONLY: your span is wrong" | verdict: revise
```

The web panel reads `reviewer_note` for the annotator's rework notice. So Bob would be told his work
was returned, with Alice's feedback, and Alice's feedback describes her answer, which Bob must not see
before submitting. **Fix:** once an annotation is resolved, take the latest review whose
`annotation_id` is that annotation. Keep the item-level review only when there is no annotation at
all. Add a test with two submissions and one review.

### 3. The S7 fix has no test

`approve_draft`'s fallback now filters by `created_by`. That is criterion 4, and a listed defect, but
neither test file touches `approve_draft`.

*Re-checked 2026-09-26 on the whole branch, not only the diff (head still `8ca7325`).* Three existing
tests call `approve_draft`, and none reaches the fallback:
- `test_reviewer_can_still_approve_another_members_draft` submits through the route first, so
  `draft.annotation_id` is set and the early return at `draft_service.py:305` is taken;
- `test_draft_approval_requires_approve_capability` is refused with 403 before the service runs;
- `test_draft_service_lifecycle.py:56` is refused with 409 for a draft that is not submitted.

With the `AnnotationDB.created_by == draft.created_by` line deleted, the full suite still passes
unchanged: SQLite 469 + 4 skipped, PostgreSQL 473. The point stands as posted. The Definition of Done asks for a test that fails against the
old behaviour. A two-author item, a draft with `annotation_id` empty, and an approve that must return
its own author's annotation would do. Check it fails with the `created_by` filter removed.

## Should know (not blocking)

- **Escalating now needs a named submission** on a multi-annotator item, because `escalate` goes through
  `_resolve_review_target` too. That is consistent — a review row needs an annotation — but a
  disagreement is usually about *two* submissions. Worth a line in the docs, or a thought for E1
  (SCRUM-51/101), which opens disputes automatically.
- **"Most recent" is by `created_at`**, and a resubmission rewrites its annotation in place without
  moving `created_at`. So the default pick is the most recently *first* submitted, not the most recently
  resubmitted. That is fine as a tie-break, but the docs say "most recent current annotation".
- **Item status is still item-wide.** A per-submission decision still sets the whole item's status, so
  accepting one of three submissions canonicalises the item. This is not this PR's to fix: #35 does it
  (its Commit 8) once this merges, and SCRUM-109's state/history test must allow "accepted, item still
  open".
- **Annotator independence on this read** is #35's Commit 4, as Jingwei intended when withdrawing her
  filter. Until then this read also names the peer (`annotated_by_name`) to an annotator who hasn't
  submitted. It is pre-existing, and closed by #35 after this merges.

## Nits

- `test_review_actions.py` imports `_latest_annotation` and `_resolve_review_target`, which are private
  helpers. That's fine for these unit tests; just noting that the route-level file covers the contract.
- The `TaskItemAdjustmentRead` docstring says "is one person's answer and saying whose is part of showing
  it". The review fields are not yet that person's (finding 2).

## Merge order with #35

#35 (the SCRUM-48 fixes) waits for this PR: its Commit 4 applies the independence rule to the
adjustment read as rewritten here, and its Commit 8 needs the review action's named target. So this
merges first; then `main` is merged into #35's branch and the two commits are written on top. The two
merge cleanly today.

---

## Draft comment for the PR (English, for Hanchen to post)

```
Thanks Jingwei, this is the right fix, and the two-items-naming-opposite-annotators test design is a good one. I checked it on 8ca7325: SQLite 469 + 4 skipped and PostgreSQL 473, matching yours. Putting _latest_annotation back into the review action fails exactly the three tests you list.

Requesting changes for three things.

**1. The web app can't name the submission, so review now 409s on every two-annotator item.**
submitTaskItemReviewAction (lib/api/review-actions.ts) never sends annotation_id. That covers the first ten seeded items (Alice + Bob each), and any SCRUM-48 item with more than one submission. SCRUM-49 has no owner or sprint, and doesn't cover this, so I'd like the minimal wiring in this PR even though the ticket says ONLY BACKEND.

It should send the submission the panel *shows*: buildReviewFinalPayload(item) comes from the draft selectDraftForViewer chose. ApiDraft already has annotation_id, but hydration drops it. Suggested:
- keep the chosen draft's annotation_id on the item;
- add annotation_id to the request body builder;
- send it from the panel's submit;
- add a web test that the body carries the displayed draft's id.

Seeded drafts have no annotation_id (step 5 doesn't link them), so init_data should link each submitted draft to its author's annotation, as SCRUM-26 does for new submissions.

**2. The adjustment read pairs the named answer with another submission's review.**
get_task_item_adjustment resolves the named annotation, but reviewer_note / review_verdict / review_justification / review_feedback come from _latest_review(db, task_item_id), the item's latest review, whichever submission it was about. On your fixture, returning Alice's with feedback and then reading Bob's gives:
annotated_by: 2 | reviewer_note: "ALICE-ONLY: your span is wrong" | verdict: revise
The panel shows reviewer_note as the rework notice, so Bob would be told he was returned, with Alice's feedback about Alice's answer. Could the review fields come from the latest review whose annotation_id is the resolved annotation, with a two-submission test?

**3. S7 has no test.** approve_draft's created_by filter is criterion 4, but neither test file calls approve_draft. A two-author item, a draft with annotation_id empty, and an approve that must return its own author's annotation would pin it. Please check it fails with the filter removed.

Not blocking, for the thread:
- escalate now needs a named submission on multi-annotator items too. That's consistent, but a disagreement is usually about two submissions. Worth a line in the docs, and something for E1 to know.
- "most recent" is by created_at, and a resubmission doesn't move it, so the default is the most recently first-submitted. Fine as a tie-break; the doc wording could say so.
- Accepting one submission still canonicalises the whole item. That's #35's Commit 8 after this merges, not yours. Independence on this read is #35's Commit 4, as you intended.

Merge order: this first, then #35 builds its last two commits on it.
```

---

# Re-review — `bd84b3e` (2026-09-26)

Jingwei pushed four commits on 25/09 at 15:38 UTC, one per point of the posted review, with no reply on
the thread. Head `bd84b3e`. **PR #37 is not this PR's frontend:** it is SCRUM-50 (project policy governs
review). The web wiring for #34 is `291db67`, inside #34.

**Recommendation: approve.** All three blocking points are fixed and tested, and the two non-blocking
doc points are addressed too.

| Posted point | Commit | Checked |
| --- | --- | --- |
| 1. Web can't name the submission | `291db67` (web), `43c2794` (seed links drafts to their author's annotation) | The panel sends the **displayed** draft's `annotation_id` (`item.draftAnnotationId`, kept by `applyApiDraftsToMockItem`) with the decision, and passes it to the adjustment read. Hydration always starts from freshly mapped API items, so no stale id is carried over |
| 2. Adjustment read pairs the answer with another submission's review | `1d8056d` | `_latest_review` is now keyed by `annotation_id`, with no review when there is no annotation |
| 3. S7 has no test | `bd84b3e` | `test_approving_an_unlinked_draft_returns_its_own_authors_annotation` |
| Not blocking: escalate; "most recent" wording | docs in the same commits | `api_surfaces.md` says both |

## Verified on `bd84b3e`

- Backend: **SQLite 472 passed, 4 skipped; PostgreSQL 473 → 476 passed** (local Docker). CI green on
  `bd84b3e`.
- Web (run locally; CI runs the backend only): **211 tests in 28 files pass**, `tsc --noEmit` exits 0,
  eslint 0 errors. The 3 warnings in `task-item-workspace-sheet.tsx` (lines 817, 3526, 3921) are
  pre-existing, not on changed lines.
- Each fix's new tests fail with only that fix's source reverted to `8ca7325`:
  - `review_actions.py` → `test_the_review_read_reports_the_review_of_the_named_submission`;
  - `init_data.py` → `test_seeded_drafts_point_at_the_annotation_their_author_submitted`;
  - the S7 `created_by` filter removed → `test_approving_an_unlinked_draft_returns_its_own_authors_annotation`;
  - the four web source files → all 6 new web tests.
- Merges cleanly with `main` and with #37.

## Draft approval comment (English, for Hanchen to post)

```
Thanks Jingwei, all three are fixed, and the escalate and "most recent" notes made it into the docs as well. Approving.

What I checked on bd84b3e:
- Backend: SQLite 472 + 4 skipped, PostgreSQL 476, and CI is green.
- Web: 211 tests pass, tsc is clean, lint has 0 errors. The 3 warnings in task-item-workspace-sheet.tsx are pre-existing.
- Each fix's new tests fail with only that fix reverted to 8ca7325: the named-submission review read, the seeded draft links, the S7 author filter, and all six web tests.
- The panel sends the draft it actually shows. Hydration always starts from freshly mapped items, so no stale annotation id can carry over.
- It merges cleanly with main and with #37.

Merge order as before: this first, then #35 picks up its last two commits on top.
```
