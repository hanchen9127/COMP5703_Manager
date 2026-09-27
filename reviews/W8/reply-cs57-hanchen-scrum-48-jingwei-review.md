Thanks @Jingwei-Lin. I re-ran each point on `3d4d06d` before changing anything, and all of them hold. Three commits answer them; each message says what was wrong and which tests fail on the commit before it. Suite on `5113d18`: SQLite 608 + 6 skipped, PostgreSQL 614.

**2. An open escalation now keeps the item disputed — `5113d18`.** I reproduced both paths: through `escalations/route` alone, two accepts canonicalised the item with its escalation still `open`; after the web's escalate-then-route, accepting the other submission dropped `disputed`. A return or reject of another submission did the same, so the check sits in the review action after the item's status is decided, for any action: while an escalation is open the item stays `disputed`, and an accept reports `awaiting_other_submissions`. The review queue skips items with an open escalation whatever their status (one grouped query, so the counts stay flat). Whether the review action should refuse outright stays with SCRUM-107/109, as you say.

**3. Approvals count since the last submission — `5adfe72`.** `approvers_of` and the queue's review state both read only approvals since the submission was last submitted, like returns and rejections. Your sequence is now a test: after Frank approves the rework the item waits at `pending_second_review`, Erin is offered the new answer, and her approval canonicalises it.

**Question 2 (`updated_at`) — `c92a496`.** It was worse than a later update: the column has `onupdate`, so any write to the row would have reset review state. Annotations gain `submitted_at`, set on creation and by a resubmission only, and every "since the last submission" rule reads it. SQLite dev databases migrate (backfilled from `updated_at`); PostgreSQL dev databases need the reset this branch already asks for.

**4.** Per submission, as D8 criterion 7 says. It's written into `api_surfaces.md` now; please go ahead and correct #37's description. @part0922, that's the number SCRUM-51 reads.

**1. A rejected or returned AI first pass** is outside SCRUM-48's scope and is tracked in #38 (@DIQI26). One correction to its background: on this branch the item is not sent to a human annotator. It is stranded, as you found — no queue offers it, a person's submission gets 409, and it can never complete. That stays true until #38 is decided.

**Disagreement** is R2-7's dispute rule and belongs to SCRUM-101; @DIQI26, `item_status_after_accept` is the hook.

On merging with #37: noted — whichever of us merges second takes both changes. Could you re-review when you have a moment?
