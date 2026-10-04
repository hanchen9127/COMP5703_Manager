**Title:** `feat(SCRUM-38): every answer is a version of its own, and at most one is authoritative (API)`

**Opened as draft PR #47 on 2026-10-02** (head `f089ebb`, nine commits), with review requested from Yi.
The posted body is everything below the rule, with the ADR link made absolute.

**Marked ready for review on 2026-10-03**, after the manual walkthrough passed. The body was updated the same day.

**Base:** `main` · **Head:** `CS57-Hanchen-scrum-38` ·
**Reviewers:** @DIQI26 (Yi, SCRUM-99 builds on it), plus one more at the break meeting

---

## Summary

SCRUM-38, story F3. Backend only; there are no web changes. The client's answers set the bar:

- **R2-2:** "release output = authoritative resolution, release provenance = complete judgement history.
  Do not flatten the history into only the final answer."
- **R2-3:** a finalised answer "should never be overwritten".
- **R2-5:** the AI model is a recorded field.

Before this PR:

- **An AI answer had no author.** It was known only by `created_by IS NULL`, so a second model's
  submission rewrote the first model's row.
- **A resubmission rewrote its row in place.** The review that had returned an answer then pointed at an
  answer the reviewer never saw.
- **Nothing recorded supersession or authority.** Nothing said what a version replaced, or which version
  is the item's answer.

**Ready for review.** The manual walkthrough passed on 2026-10-03; see Testing.

**Decisions:** [ADR 009](docs/adr/adr009_every_write_is_a_version.md), which builds on ADR 008 (#46).

## Heads-up: this changes what other tickets build on

- **@DIQI26 (SCRUM-99).** `app/services/annotation_versions.py` is final:
  - `mark_authoritative(db, annotation, *, actor_id: int | None, cause: str) -> None`. Use
    `cause=ADJUDICATION_ACCEPT`.
    - It returns 409 for a superseded version, and 409 for a second marker on the item. Marking the
      version that already holds the marker changes nothing.
    - It writes into your transaction and never commits.
    - Call it after your own checks, with the item locked.
  - `clear_authoritative(db, task_item_id) -> str | None`. `reopen_task_item` calls it, so your Return
    clears the marker without doing anything.
  - Reject marks nothing.
  - The one change from what we agreed: `actor_id` may be `None`, for H4's platform rule.
  - SCRUM-99 merges after this PR, and its schema step goes after these columns in `migrate_db_schema()`.
- **Everyone with an open branch: an annotation id now changes with every resubmission.**
  - Review targets, the review queue's awaiting ids, `draft.annotation_id` and the evaluation harness (#39)
    already follow the current version. #39's cases pass 4/4 on top of this branch.
  - A superseded id is refused: `404` from the review route, and `409` from `assert_may_decide` itself.
    That second one is #45's nit, @Jingwei-Lin.
  - @part0922: SCRUM-109's state/history test and SCRUM-51 should name the version the latest submission
    returned. `review_refusal` is unchanged.
- **#46's guard test is flipped on purpose.** `test_a_resubmission_within_a_round_still_rewrites_in_place`
  is now `test_a_resubmission_within_a_round_is_a_new_version_too`.
- **Merge day.** PostgreSQL dev databases need `init_data.py --reset` (the `annotations` schema changes).
  SQLite migrates on start.

## Commits

| Commit | What |
| --- | --- |
| `b4653ca` | Every annotation records its `author_role` (`annotator`, `reviewer`, `ai_model`) and, for machine output, the model. Existing AI rows are backfilled from `metadata.ai`. No user is invented for the AI |
| `c8f54be` | `is_authoritative` plus who, when and why; a unique index on the item limited to marked rows; `mark_authoritative` and `clear_authoritative`; a reopen clears the marker |
| `3840efb` | Everything that asked "is this the AI's?" reads the role, not `created_by IS NULL`. Only `annotator` counts as a submission. Found on the way: `is_peer_work` also receives drafts, which have no role |
| `b50658d` | An AI answer belongs to its model: a second model writes its own row, and the normalized export keys AI answers by model. The one-per-item refusal becomes a named task rule, `ai_answers_allowed_per_item`, which returns 1 |
| `7fdad0e` | `derived_from_annotation_id` and `derivation` (`resubmission`, `reanswer_after_reopen`, `reviewer_correction`). `create_version` is the one write path, and #46's re-answer goes through it |
| `77f4a1d` | A resubmission is a new version: the returned one keeps its content, time and reviews. `assert_may_decide` refuses a superseded version |
| `979a406` | History returns the author's whole chain; before, it returned the one row asked for. The list returns current versions, plus earlier ones with `include_superseded=true`, and no longer serves superseded rows as current (true since #46). Provenance is on every read |
| `0d55b3a` | Both export formats carry each answer's provenance. The legacy export keys an AI answer by its model instead of `"None"` |
| `f089ebb` | ADR 009, and the data-model docs, `api_surfaces.md` and `workflow_states.md` |
| `2f1512e` | Wording: `total_count` counts authors, people and models alike, not people |

## Test changes worth checking

- **No assertion changed in commit 3.** Nine test files wrote AI rows with no role, so each now names
  `ai_model`. A fallback default (role from `created_by`) catches a forgotten role in seeds and scripts.
  The test data was fixed first, so the fallback could not hide a missing role.
- **Four tests pinned the in-place rewrite and now pin a new version, each with its intent kept:**
  - two in `test_draft_submission_atomicity` (a full item still takes its author's resubmission; the draft
    links to the version it produced);
  - one in `test_item_completion` (review starts over on the new version);
  - #46's guard.
- **Three `_resubmit` test helpers faked a resubmission by moving `submitted_at`.** They now write a real
  version, and their nine callers review the returned one. This covers review states, rework marking,
  approvals since submission, the queue's awaiting ids and item completion.

## Testing

- `npm run check` exits 0:
  - API on SQLite: 844 passed, 8 skipped;
  - web: 327 passed;
  - typecheck clean;
  - lint: 0 errors, and the 50 warnings `main` already has. No web file changes.
- PostgreSQL 18: 852 passed.
- Each feature commit adds tests that fail on its parent.
- #39 merged on top of this branch, in a scratch worktree: 4/4 cases and 42 evaluation tests pass.
- CI is green: the `sqlite` and `postgresql` jobs, on `2f1512e`.
- The manual walkthrough passed on 2026-10-03, on a reset PostgreSQL dev database with three browsers
  (annotators, and an annotator who also reviews).
  - **A resubmission keeps the returned answer.** v1 still holds `charlie sarcastic`, with erin's
    "redo" review on it. v2 follows from it as `resubmission`, and a reopen re-answer v3 follows v2 as
    `reanswer_after_reopen`.
  - **The review panel follows the new version.** It showed the resubmitted answer, and the accept landed
    on it.
  - **The marker.** It was set once. A second version and a superseded version were each refused with
    409, and the reopen cleared it.
  - **Independence.** An annotator who had not answered the new round saw only her own superseded answer,
    and got 403 on a colleague's history.
  - **Two models.** Their answers were kept and exported separately, and the legacy export used
    `ai:<provider>/<model>` keys.

## Not in this PR

- Issue 4 (a finalised item can export conflicting answers): this PR adds the marker; H4 (SCRUM-37) closes it.
- Issue 5 (reviewer corrections are not saved): this PR gives a correction a place to land; D3 (SCRUM-32) closes it.
- Which version a release carries, and marking items finalised without a dispute: H4 (SCRUM-37, W9).
- Writing a reviewer's correction: D3 (SCRUM-32, W9). This PR gives it a place to land.
- Provenance events: F1 (SCRUM-98, W9). The marker's who, when and why are on the row for it.
- A multi-model experiment and blind-then-reveal: I4 (SCRUM-73). Raising `ai_answers_allowed_per_item`
  alone does not run a second model yet: the first model's submitted draft still counts as annotation
  work (ADR 009, Consequences).
- Who may resubmit, and when: SCRUM-117.
