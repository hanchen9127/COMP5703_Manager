# Review — PR #50, `CS57-Jingwei-scrum-120` (SCRUM-120, D9)

2026-10-04. Head `34f58c6`, one commit, based on `main` `df7c05a`, which is still `main`'s head. Two files,
+252 / −5: `app/services/task_item_status_resolution.py` (+55 / −5) and `tests/test_task_item_reopen.py` (+197).

**On GitHub (checked with `gh pr view 50`):** open, not a draft, mergeable, review requested from Hanchen. There
are no reviews or comments yet. CI is green: `sqlite` and `postgresql` jobs, push and pull_request runs.

**Read before this review:**
- SCRUM-120's description and its impact table (`sandbox/Break/jira/jira-perf-investigation.md`);
- the reproduction script `sandbox/Break/scripts/sandbox-perf-reopen-flip.py`;
- the roadmap's break-sprint entry, and the merge order SCRUM-116 → SCRUM-110 → SCRUM-99's Return;
- PR #46's review (`review-cs57-jingwei-scrum-110-reopen.md`);
- PR #48 at `fbbba0c` (Yi, draft, paused on issue #40), which edits the same functions.

**Recommendation: approve.** The fix does what the ticket asks, in all four places. Every criterion on the board
is met and tested. The fix is proved on both databases and end to end. Nothing blocks the merge. There is one
optional nit. There is also one note for Yi, which matters more than anything in this diff: it is about how
#48 should take this rule over.

## Verified

- **Suites**, run at `34f58c6` in a separate worktree:
  - **SQLite: 856 passed, 8 skipped.**
  - **PostgreSQL 18, in a throwaway container set up like CI:** `PGTZ=Australia/Sydney`, and the role's
    `timezone` set to Sydney. **864 passed.**

  Both counts match the PR description.
- **The prove tests prove the fix.** With `task_item_status_resolution.py` put back to `df7c05a` and the
  new tests kept, all three prove tests fail on SQLite and on PostgreSQL. Two of them fail with
  `'expert_send_back' == 'pending'`; the history one fails with `'item_reopen' not in {'item_reopen'}`.
  The guard passes there too, as a guard should.
- **End to end.** I started a backend from the PR worktree on a throwaway PostgreSQL. I seeded it with
  `sandbox-perf-seed.py` and ran `sandbox-perf-reopen-flip.py` on the 50-item task. The steps went
  `expert_send_back` → `annotated` → `canonicalized` → reopen `pending`. The first and second reads
  after the reopen are both **`pending`**. On `df7c05a` the first read gave `expert_send_back`.
- **The ticket's criteria.**
  - **The cutoff is in both functions, for both sources.** `collect_expert_send_back_item_ids` applies
    it to the latest escalation (send_back and the legacy `adjust` branch) and to the history fallback.
    `_latest_send_back_at` applies it to the escalation row and to the audit row.
  - **It counts reopens of either cause.** `_latest_reopen_at_by_item` reads `task_item_reopens` with no
    filter on `cause`, and takes the `max`. A second reopen therefore also cuts off round two's send-back.
  - **Prove test:** `test_a_reopened_item_stays_open_after_the_next_read` follows the ticket's steps
    through the real routes. It reads through both `list_task_items` and `build_setup_read`. It also
    asserts that `status` and `updated_at` are unchanged, which covers the "write with no audit row"
    half of the bug.
  - **Guards.** `test_a_send_back_after_the_reopen_still_applies` covers round two's own dispute. The
    "never reopened behaves as today" guard is the existing `test_task_item_status_resolution.py`
    (7 tests). All of them still pass.
- **There is only one consumer.** `list_task_items_with_send_back_resolution`, called from
  `TaskService.list_task_items`, is the only read path that uses these functions. The setup read goes
  through it as well. No other route computes send-back on its own.
- **Time zones are safe.** `reopened_at` is `UtcDateTime`, while `decided_at` and `created_at` are plain
  `DateTime`. Every comparison goes through `_normalize_datetime`, and the Sydney-session run above
  passes.
- **Rows the bug already flipped heal on their own.** On such a row, `_latest_send_back_at` now returns
  `None`, so `reconcile_resubmitted_send_back_items` leaves it as it is. The next submission still moves
  it to `annotated`, because `_advance_task_item_to_annotated_on_submit` only skips `disputed` and
  `canonicalized`. So the PR's "until their next submission" holds, and the decision not to repair these
  rows is sound. The only rows affected are in dev databases.
- **"No reachable state tells it apart" (the `_latest_send_back_at` cutoff) is right.** That function is
  only called for items in `expert_send_back`. Such an item gets there either from a send-back after the
  reopen, which is counted in both versions, or from the bug. A bug-flipped item leaves the state at its
  next submission. So no reachable state tells the two versions apart.

## Nit (optional)

1. **`_latest_send_back_at` reads every reopen in the task, once per candidate.** It calls
   `_latest_reopen_at_by_item(db, task_id).get(task_item_id)`, and `reconcile_resubmitted_send_back_items`
   calls it for each `expert_send_back` item. That is one whole-task query per candidate, not "one query
   per task" as the PR description says. A `.filter(TaskItemReopenDB.task_item_id == task_item_id)` would
   make it one small query, or the caller could pass the map in. It costs little next to the existing
   whole-task audit scan in the same function. That scan is A6 subtask 3's to remove, so this nit can
   wait for that too.

## For Yi — how #48 should take this rule over

Jingwei's note on the PR says SCRUM-99's Return should set the escalation's `decided_at` before it calls
`reopen_task_item`. That is necessary, but it is not enough:

- At `fbbba0c`, #48 counts `return` as a send-back in **both** sources: the escalation filter and
  `_audit_send_back_timestamps`.
- The decision route writes its `escalation_decided` history row **after** the commit
  (`_record_task_history`, `review_actions.py` after line 765).
- `AuditLogDB.created_at` defaults to `datetime.now(UTC)` at the time of the insert.

So once Return reopens through `reopen_task_item`, the history row is dated after `reopened_at`. The cutoff
lets it count, and the next read flips the item back to `expert_send_back`. This is the bug this PR fixes,
coming back through the history fallback.

**The robust fix:** when Return goes through `reopen_task_item`, as SCRUM-110 planned, it no longer sends
the item to anyone. It reopens the item to `pending`. So #48 should **stop counting `return` as a
send-back**, rather than depend on the order of two timestamps. If the client chooses annotation scope on
#40 and Return then does not reopen the whole item, this needs revisiting. Either way, SCRUM-99's tests
should read the item after a Return, as the ticket already says.

## Draft comment for GitHub (approve)

Approve. Checked on `34f58c6`:
- SQLite 856 passed / 8 skipped; PostgreSQL 18 with a Sydney session 864 passed.
- With the service file back at `df7c05a`, the three prove tests fail on both databases and the guard passes.
- End to end on a throwaway PostgreSQL, with the reopen-flip script: after the reopen, both reads return `pending` (`expert_send_back` on `df7c05a`).

Agree with all three decisions. Already-flipped rows heal at their next submission, since submit only skips `disputed` and `canonicalized`.

Nit, optional: `_latest_send_back_at` loads the whole task's reopens once per `expert_send_back` candidate. Filtering on `task_item_id` would make it one small query, or it can wait for A6 subtask 3.

@DIQI26 for #48, one more thing on top of the `decided_at` note: #48 also counts `return` in `_audit_send_back_timestamps`. The `escalation_decided` history row is written after the commit, so it would be dated after `reopened_at` and flip the item again. Once Return goes through `reopen_task_item`, it is simpler to stop counting `return` as a send-back at all.
