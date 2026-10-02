# Review — PR #45, `CS57-Jingwei-scrum-116` (SCRUM-116, with SCRUM-86's routing half; D1, D5, D8)

2026-10-02. Head `212cc89`, base `main` (`1967831`), up to date with it. Nine commits, including a merge of
`main`; 12 files, +1039 / −93.

**On GitHub (checked with `gh pr view 45`):** open. The review request moved from Parth to Hanchen on
2026-10-02; there are no reviews or comments yet. CI is green: the `sqlite` and `postgresql` jobs, on both
the push and the pull_request runs. PR #46 (SCRUM-110) is stacked on this branch, and Hanchen requested
changes on it the same day.

**Posted 2026-10-02 07:18 UTC: Approve** on `212cc89`, by Hanchen. The posted text condenses this file, and it
is the record. The SCRUM-101 point led to Hanchen's decision the same day to move SCRUM-101 to W9
(`../../sandbox/Break/jira/jira-scrum-101-to-W9.md`).

**Read before this review:**
- SCRUM-116's description, replaced on 2026-09-30 (`sandbox/W8/jira/jira-scrum-86-fold.md`, block 2),
  with the collaboration line edited on 2026-10-01 (`sandbox/Break/jira/jira-break-descriptions.md`);
- the SCRUM-86 fold note, where Hanchen decided on 2026-09-30 that SCRUM-116 takes the routing half of
  issue 7 and SCRUM-99 the deciding half;
- issue #40 as rewritten by Hanchen on 2026-09-28 (`sandbox/W8/msg/issue-40-rewrite.md`): a dispute holds
  the whole item;
- client answers Q4, R2-1, R2-3 and R2-8.

**Recommendation: approve.** Nothing blocks merge. There is one nit, and three points matter to other
tickets, mostly to SCRUM-51 and SCRUM-101.

## Verified

- **The suite at `212cc89`,** run locally in a separate worktree:
  - SQLite: 774 passed, 7 skipped;
  - PostgreSQL 18, in a throwaway container: 781 passed, including the two-accepts race in
    `test_review_lock_postgres.py`.

  Both match the PR description.
- **The new tests guard the change.** Run against `main` (`1967831`), `test_review_decision_refusals.py`
  has 23 of 31 failing. The 8 that pass are the cases that must still be allowed: a reviewer who returned a
  submission reviewing its resubmission, an earlier approver approving it, a reviewer routing someone
  else's item, and similar.
- **The rule is read under the lock.** `assert_may_decide` runs after
  `_load_task_item(..., for_update=True)`, so a decision another reviewer has just committed is part of
  what it reads.
- **One rule now serves the queue and the action.** `awaits_review_by` is now
  `review_refusal(...) is None`, so the review queue and the review action cannot disagree again.
- **`route_escalation` refuses before writing anything.** The two new checks and the open-escalation check
  now come before the item's status is set to `disputed`. Before this PR, the status was set first.
- **No new refusal contradicts an earlier decision.** The disputed-item refusal (ADR decision 3) matches
  issue #40's settled point: a dispute holds the whole item. Per-item independence (decision 2) matches
  the queue's existing rule and Q4.

## Scope — SCRUM-116 on the board, point by point

| # | Board description (30/09) | On `212cc89` |
| --- | --- | --- |
| 1 | The action refuses, with 409 and a reason, a decision on a submission that does not await the caller, by the queue's rule, after the item lock | ✅ `assert_may_decide`, `review_refusal`, `_refusal_detail` |
| 2 | Self-review is refused for every action (403) | ✅ `test_nobody_returns_rejects_or_escalates_their_own_submission` covers revise, adjust, reject and escalate |
| 3 | `route_escalation` refuses anyone who authored a submission on the item (403), with a reason | ✅ `assert_may_route_dispute`; `test_nobody_sends_an_item_they_annotated_to_dispute` |
| 4 | No administrator override | ✅ `test_an_administrator_who_annotated_the_item_has_no_override`, plus the administrator case in routing |
| 5 | A finalised item's submissions are refused; reopening stays SCRUM-110's | ✅ The action and routing are both refused with 409; `test_an_item_finalised_by_approval_stays_final`, `test_a_finalised_item_is_not_sent_to_dispute` |
| 6 | A returner may review the resubmission; an earlier approver may approve it | ✅ Among the 8 tests that pass on `main` as well as here |
| 7 | Each test fails on the old behaviour | ✅ 23 of the 31 fail on `main`; the 8 that pass are criterion 6's allowed cases |

**Issue 7** (Critical) is half closed by this PR. It closes once SCRUM-99 lands the deciding half.

## Nit

- **`assert_may_decide` lets the decision through when the submission has no review state** (`if state is
  None: return`). Today this cannot happen: `_resolve_review_target` only returns current annotations, and
  every current annotation has a state. But if it ever did happen, the check would pass silently instead of
  refusing. Refusing there with a 409 ("not a current submission") would keep the guard safe if the target
  resolution changes later. SCRUM-38 will change which annotations count as current.

## Should know (not blocking)

- **SCRUM-51 (D7) must work within this rule.** `cross_review_percentage` is stored and exposed, but
  nothing enforces it yet. The rule here refuses three things:
  - a decision on a submission that already has its approvals;
  - a decision on a submission that was returned, rejected or escalated since it was last submitted;
  - any decision on a finalised item.

  So D7's sampled second review cannot be an extra review added after approval. A sampled submission has
  to need one more approval than the policy's default, and the item must stay open until that review is
  in. Under this rule, a first reviewer's return or reject also ends the review straight away, so a
  blind second review never happens on that submission. Disagreement can only arise as approve-then-
  disagree. Any change to that belongs in `review_refusal`, the one place both the queue and the action
  read.
- **This affects how SCRUM-101 detects disagreement.** For the same reason, two reviewers can only
  disagree on a submission the first reviewer approved. Take this into account when deciding whether
  SCRUM-101 waits for SCRUM-51's flag or detects disagreement itself.
- **The web Review tab still offers actions on a disputed item,** and they now return 409 (ADR 007,
  Consequences). The message is shown word for word, which works. Hiding the actions while a dispute is
  open fits SCRUM-103 (E6, W10).
- **Merge order.** This PR merges first, then #46 is retargeted to `main`. SCRUM-109 (Parth) changes
  `submit_task_item_review_action` as well. This PR adds only the `assert_may_decide` call there, so
  SCRUM-109 rebases onto it.
