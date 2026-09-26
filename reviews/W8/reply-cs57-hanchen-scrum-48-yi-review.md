Thanks @DIQI26. All three points are fixed on the branch, one commit each. Each commit message says what was wrong, what changed, and which tests fail on the commit before it.

**1. Inline AI path: `df1893c`**

Inline registration now does what the worker's `record_result` does. The AI's draft is written with no author, and a successful result is submitted through `DraftService.submit_draft(commit=False)` inside the registration's own transaction. The annotation, the draft's `annotation_id` and the item's move to `annotated` commit together; if anything fails, the whole registration rolls back. A failed result (`metadata.ai.status == "failed"`) stays a pending, unclaimed draft, so people annotate the item and a later AI run can pick it up.

Tests (`test_ai_draft_ownership.py`):
- a successful result is submitted with no author, and the item is `annotated`;
- an annotator's own submission on that item is then refused with 409;
- a failed result stays pending and unclaimed; the first annotator claims it and a second is refused.

The first two fail on the previous commit.

On your edit about removing inline mode: this fix doesn't tie us to keeping it. If we drop inline later, this branch of code goes with it. Until then, the default configuration behaves as decision A says.

**2. Review reads: `478f773`**

`GET /annotations/{id}/reviews` and `GET /reviews/{id}` now call `AnnotationService.assert_visible_to_caller` on the submission the reviews are about. The tests follow your reproduction:
- an annotator who has not submitted gets 403 from both reads;
- after submitting, and as a reviewer, both return the review.

I searched the routes for review fields and found no other read that returns them. `api_surfaces.md` lists both reads in the independence table.

**3. Concurrent accepts: `fbf5bdf`**

The review action loads the task item with `SELECT ... FOR UPDATE` before it reads the submissions and reviews, as `submit_draft` does. The other four readers of the item are unchanged.

The new PostgreSQL test (`test_review_lock_postgres.py`, skipped on SQLite) runs two accepts at once:
- Erin's accept is paused after it decides the item's status, before it commits;
- Frank's accept on the other submission must wait, then see Erin's review and complete the item;
- the item ends `canonicalized`.

With the lock removed, the test fails because Frank does not wait.

**Also since your review: `3d4d06d`**

This one isn't from your review. It is for SCRUM-93's list. `GET .../work-queue/annotate` takes `include_unavailable`, which also returns the task's other unfinished items with `can_annotate=false`. Annotate rows gain `can_annotate`, `rework` and `submitted_by_you`. The default response is unchanged. Please look at it too.

Backend suite: SQLite 599 passed, 6 skipped; PostgreSQL 605 passed.

Could you re-review when you have time?
