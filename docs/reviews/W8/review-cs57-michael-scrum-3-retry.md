# Review — PR #30, `CS57-Michael-scrum-3-retry` (SCRUM-3, C2)

2026-09-23. Head `a3d39d2` (two commits: `0688259` retry, `a3d39d2` #22 follow-ups). Base `main` at
`23e62a9`. 8 files, +973 / −65. No reviews or comments on GitHub yet (checked with `gh pr view 30`).

**Recommendation: approve.** Every acceptance criterion and all five #22 follow-ups are in and tested.
The points below are non-blocking.

## Verified

- Backend suite at `a3d39d2`: **437 passed + 147 subtests, 4 skipped** locally on SQLite. CI on
  PostgreSQL: **441 passed, none skipped**, so the worker tests now really run on Postgres.
- `test_ai_batch_worker.py` uses the shared `engine` fixture from `conftest.py`, keeping
  `autoflush=False`.
- Mutation checks, run again here:
  - removing `lease_owner == context.worker_id` → 2 tests fail (the close path and the new requeue
    path);
  - removing `lease_expires_at < moment` from the sweep → 1 test fails (the interleaving test).
- Against the ticket (W8 board description):

| Criterion | Status |
| --- | --- |
| Classify transient / permanent into `last_error_kind` | ✅ `classify_provider_error`: 429 and 5xx transient; other 4xx permanent; timeout and connection names transient; our own `ValueError`/`TypeError`/`KeyError` permanent; else `unknown` |
| Transient retries with backoff via `next_attempt_at`, up to `max_attempts` | ✅ Equal-jitter exponential backoff stored on the row, not slept; `retry_wait` claimable directly |
| Permanent and exhausted end `dead_letter` with the real error | ✅ Permanent never retried |
| A batch with any `dead_letter` is `completed_with_failures` | ✅ |
| #22 follow-up 1: test the owner half of the fence | ✅ Two tests; mutation confirmed |
| #22 follow-up 2: `worker_id` from the claim | ✅ `load_execution_context(..., worker_id=)` |
| #22 follow-up 3: shared fixture, runs on Postgres | ✅ |
| #22 follow-up 4: sweep re-checks expiry in both UPDATEs | ✅ Interleaving test; mutation confirmed |
| #22 follow-up 5: analyzer build failure dead-letters at once as permanent | ✅ `AnalyzerUnavailableError` |

The condition set on #22 (no worker mode on PostgreSQL, no second worker) is lifted once this merges.
Running more than one worker still has no provider-level rate limit, as the PR says. That belongs to
the bounded parallel-calls ticket.

## Non-blocking

1. **Unparseable or schema-invalid output is classified permanent.** The reasoning is that "the same
   prompt to the same model fails the same way", but LLM sampling is not deterministic, so one retry
   can succeed. Either treat an output-parse failure as `unknown`, which is still bounded by
   `max_attempts`, or keep it and record it as a placeholder decision beside the 3 / 30 s / 600 s
   numbers. It is a question for Michael, not a fix request.

2. **`try_claim_candidate` does not re-check `next_attempt_at`.** The comment says "a row whose wait has
   passed cannot go back to waiting", but with two workers it can. Between this worker's SELECT and its
   UPDATE, another worker can claim the row, fail fast, and put it back into `retry_wait` with a future
   time. The UPDATE then sees a claimable status and takes it early, skipping the backoff. That needs a
   fast failure, so it is unlikely, but the fix is one condition: add `next_attempt_at <= moment` to the
   UPDATE and correct the comment.

3. **An analyzer-build failure writes no draft.** The error is on the job row but not on the item.
   SCRUM-30 renders failures from the draft's `metadata.ai`, so this failure will not show there. Either
   write the failed draft here too, as the exhausted path does, or say in the PR that it is visible in
   the job status only (SCRUM-5).

4. **Two classifiers with #31.** The PR says it will delete `classify_provider_error` in favour of Yi's
   once #31 lands. If #31 is close to merging, merging it first and rebasing this PR onto it avoids
   landing code that is due to be deleted. If not, the stated plan is fine, and `_ai_status` already
   reads both metadata shapes.

5. **Cross-PR, with #29.** The rule "a retrying attempt writes no draft, because a failed draft counts
   as meaningful" is the same mechanism that stops #29 from ever re-running a dead-lettered item (#29
   review, finding 1). Keep the two consistent when #29 rebases.

## Merge order

This PR first, then #29 rebased on top. Michael has offered to do the rebase himself.
