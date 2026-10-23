# Review — PR #79, `CS57-Jingwei-scrum-74` (SCRUM-74, story I5: integrity checks on roles, provenance and releases)

<https://github.com/USYD-CS-Capstone/hej/pull/79> · reviewed 2026-10-20 at `12d4668` (29 commits, base `main` at `17469db`)

**Posted 2026-10-20 12:11 UTC as Request changes** on `12d4668`. The posted text is a condensed version of this file,
written to Jingwei.

Read from GitHub first: **still a draft**, although the description opens with "Ready". It has no reviews and no
inline comments. Review is requested from Hanchen. Jingwei left two comments for Hanchen on 20 Oct (`9570b56` to
`12d4668`). The textual merge with `main` is clean. CI cannot run (GitHub Actions billing).

Prior context read:
- roadmap W11 (I5 "starts once H6 and E5 are merged": #86 and #81 are both on `main`);
- the SCRUM-74 ticket text (`sandbox/Break/jira/jira-W11-descriptions.md`);
- Jingwei's settlement plan, §4.6 (`sandbox/W10/msg/2026-10-19-dual-signoff-settlement-plan-from-Jingwei.md`);
- the review of #77, which asked for #77 to merge before this PR;
- the review of #90, which left EV-015 and EV-101 to this PR;
- Jingwei's review of #91, point 5, on the merge order.

There are no sandbox messages to Jingwei about #79.

**Merge order (decided 2026-10-20):** #79 → #80 → #89 → #91. #91 removes `GovernedAction.MANAGE_DATASET` and
`APPROVE`, which `integrity.py` imports. The text merges cleanly, but the code fails at import. So #91 adapts the
three mappings after this PR merges, as Jingwei offered on #91.

## Verdict: request changes — one rule gap, then approve

The checks do what the description says. Their rules match the routes':
- org-wide roles only;
- membership and roles as they were held at the time of each step;
- reopen on `manage_project`;
- accept on `approve`;
- escalate on `dispute`;
- registration on `manage_dataset`;
- adjudication independence that ignores an earlier adjudication alone.

The release rebuild is also right after a reopen. Withdrawing authority (`annotation_versions.py:398`) clears only
`is_authoritative` and keeps the cause, author and time that the release line froze. So an old release still rebuilds
byte for byte. One rule is missing, shown below by a probe.

## Must fix

### 1. A settler who later answers the item is not found

**Where:**
- `evaluation/harness/integrity.py`, `_Record.reviewed_or_decided_before`, which `_self_work_of_event` uses for a
  submission and for a blind verdict.

**The gap:**
- **The platform's rule:** `submission_rules.item_judge_ids_by_item` refuses annotation work from everyone who has
  reviewed, **settled** or adjudicated an item, in any round. It is applied in `draft_service._assert_not_a_judge_of_item`
  and in the work queue. Settlers were added in #88 (SCRUM-126), because a settler has read the answers.
- **The check:** `reviewed_or_decided_before` counts only `reviewed` and `adjudicated` events, plus the old
  `escalation_decided` history rows. It does not count `disagreement_settled`.
- **The result:** a settler's later answer on the same item, for example after a reopen, would be refused by the
  platform. If it is written past the API, the check passes it.

`fc84e8c` taught `_JUDGED` about settlements, which covers a settler who later adjudicates. It did not cover the
answer rule.

**Probe** (not in the PR), on the PR's own fixtures in `tests/test_evaluation_integrity_roles.py`:

| Steps | `check_roles` finds |
| --- | --- |
| `REV` reviews the item, then submits an answer on it | `answered an item they had already reviewed or decided` |
| `LATE` settles the item (`disagreement_settled`), then submits an answer on it | nothing |

**Fix:**
- add `disagreement_settled` to the kinds `reviewed_or_decided_before` reads;
- make its message say "reviewed, settled or decided";
- add a prove test beside the reviewer case, and its revert check, as the other rules have.

## Nits (non-blocking)

- **A tampered manifest crashes the check instead of producing a finding.** `rebuild_release` calls
  `json.loads(manifest_bytes)` and then reads `manifest["release"]["id"]` and `manifest["items"]`. A manifest that
  has been rewritten into invalid JSON, or that is missing one of those keys, raises out of `verify`, because the
  command catches only `CannotVerify` and `SQLAlchemyError`. The command then ends with a traceback and exit status 1,
  the status that means "found something". It does not name the release, as the ticket's "fails loudly, a named
  item" asks. `_released_answers` reads each artefact line with `json.loads` in the same way. A `try` that turns the error into a `Finding` would cover it. This only matters when someone has
  tampered with the manifest.
- **Mark the PR ready.** The description says "Ready", but GitHub still shows a draft, so it can't be merged.

## Verification

Run on a local merge with `main` at `17469db`, without committing (detached worktree
`D:\COMP5703_Capstone\hej-review-79` at the merge commit `73c8570`):

- Backend, full, SQLite: `uv run pytest -q` → `2445 passed, 16 skipped, 209 subtests passed` (6 min 15 s).
- Casebook, `python -m evaluation run --baseline evaluation/baseline.json --exact`: `85/85 passed, 1 skipped`
  (EV-018), `86 cases: 86 unchanged. No regression.`
- PostgreSQL: not run.
- The probe for point 1, as above.

## After merging

- **#91 (SCRUM-127)** merges `main` and remaps these in `integrity.py`:
  - `source_registered` → `MANAGE_TASK`;
  - `disagreement_settled` and `accept` → `REVIEW`;
  - the owner's reopen → `MANAGE_TASK`, held by both `admin` and `task_owner` under the 2026-10-20 decision.

  It also renames the two integrity tests named after the old capabilities, and regenerates `baseline.json`.
- **SCRUM-75 (I5's findings record, Kanishka)** can cite these checks and the casebook cases EV-116 to EV-123.

## Re-review at `3f9a0cb` (2026-10-20)

Jingwei pushed three commits after the Request changes, and explained them in a comment at 12:33 UTC:
- **`b5f3d45`** fixes must-fix 1;
- **`c638a9e`** fixes the manifest nit;
- **`3f9a0cb`** merges `main` at #75 and #90.

| Point | At `3f9a0cb` |
| --- | --- |
| Must fix 1: a settler who later answers the item | ✅ `reviewed_or_decided_before` counts `disagreement_settled` (matches `item_judge_ids_by_item`). Its message reads "reviewed, settled or decided". A prove test sits beside the reviewer's: LATE settles, then answers |
| Nit: a tampered manifest crashes the check | ✅ `rebuild_release` reads the manifest's JSON, release id and task, each item's id, answer, resolution and line, and `release_manifest.verify`, all under one guard. `ValueError`, `KeyError` or `TypeError` there becomes one finding on the release, e.g. "its manifest can't be read: it has no 'items'". `_released_answers` does the same for each artefact line, with a finding of item `None` and the line skipped. Four prove tests: not JSON, missing `items`, a JSON array, an artefact line that isn't JSON |
| Nit: mark the PR ready | ❌ GitHub still shows a draft at re-review time, although the comment says it is marked ready |

**The merge commit** (`3f9a0cb`) is clean. `git show --remerge-diff` is empty, and `main` (`17469db`) is fully contained.

**One observation, not a change request:** `release_manifest.verify` (platform code) sits inside the guard, so a
genuine `KeyError` inside it would read as an unreadable manifest. That is acceptable, because `verify` consumes
the manifest and a tampered one is exactly what would make it raise. The platform's line recipe
(`_release_line`), which reads the database's rows, stays outside the guard, as the comment says.

**Verification at `3f9a0cb`** (detached worktree `D:\COMP5703_Capstone\hej-review-79`):
- Backend, full, SQLite: `2450 passed, 16 skipped, 209 subtests passed`. That is 2,445 plus the five new tests.
- Casebook `--baseline evaluation/baseline.json --exact`: `85/85 passed, 1 skipped` (EV-018),
  `86 cases: 86 unchanged. No regression.`
- PostgreSQL: not run here. Jingwei reports 2,423 passed, 3 skipped on it.

**Verdict: approve.** Posted 2026-10-20 12:51 UTC as Approve on `3f9a0cb`. It asks Jingwei to mark the PR ready for
review, since it is still a draft.
