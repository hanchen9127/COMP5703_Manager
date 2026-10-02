# Review — PR #46, `CS57-Jingwei-scrum-110` (SCRUM-110, D9)

2026-10-02. Head `ce951c3`. The base is `CS57-Jingwei-scrum-116` (PR #45, head `212cc89`), which is up to date
with `main` (`1967831`). Nine commits, 28 files, +2150 / −66; the diff below is against #45's branch, so it
shows SCRUM-110 only.

**On GitHub (checked with `gh pr view 46`):** open, review requested from Hanchen, no reviews or comments
yet. #45 is also open, review requested from Parth, with no reviews yet. CI is green on both: `sqlite` and
`postgresql` jobs, push and pull_request runs.

**Posted 2026-10-02 07:00 UTC: Request changes** on `ce951c3`, by Hanchen. The posted text covers finding 1,
the SCRUM-38 section and the two "should know" points, condensed; it is the record. The supersession split
in ADR 008 ("as agreed with Hanchen") was agreed in chat with Jingwei, confirmed by Hanchen on 2026-10-02.
Re-review on the fix commit: the 2001-character test is refused with 422 on both databases, and
`reopen_task_item` checks the length as well.

**Re-review 2026-10-02, on `8fbce3f`.** #45 merged at 07:26 UTC, and #46 now targets `main`. The fix
does what the review asked:
- the request schema sets `max_length=2000`;
- `reopen_task_item` checks `REOPEN_REASON_MAX_LENGTH`, which is read from the column, so SCRUM-99's
  Return is covered;
- `api_surfaces.md` states the limit;
- three tests were added.

Verified:
- **Suites.** #46 merges cleanly onto `main` `e56a61e`. SQLite: 810 passed, 8 skipped. PostgreSQL 18,
  in a throwaway container: 818 passed. CI green.
- **The new tests guard the fix.** With the schema and service put back to `ce951c3` (plus the constant
  alone, so the test module imports), both refusal tests fail on SQLite and PostgreSQL. The
  2000-character test passes there as expected, because it guards the limit rather than testing the fix.

Jingwei asked who takes #45's nit (`state is None` → 409): SCRUM-38 or a follow-up.
**Recommendation: approve.**

**Read before this review:**
- SCRUM-110's description, as replaced on 2026-09-30 (`sandbox/W8/jira/jira-scrum-110-update.md`);
- SCRUM-38's description of 2026-10-01 (`sandbox/Break/jira/jira-break-descriptions.md`), since this
  ticket is the first writer of its supersession fields;
- client answer R2-3;
- the roadmap's merge-order note: SCRUM-116, then SCRUM-110, then SCRUM-99's Return.

**Recommendation: request changes — one small fix, then approve.** Merge only after #45. The design follows the ticket
closely, and the ADR records the three decisions it had to make. Every criterion on the board is met
and tested. One request:
- **Fix before merge:** a reopen reason longer than 2000 characters returns a 500 on PostgreSQL.

## Verified

- Suite at `ce951c3`, run locally in a separate worktree:
  - **SQLite: 807 passed, 8 skipped.**
  - **PostgreSQL 18 (throwaway container): 815 passed.** This includes
    `test_two_owners_reopening_at_once_reopen_it_once`, the row-lock race.

  Both match the PR description. The web tests (327) were not re-run here.
- **Every read that decides review now follows the current round.**
  - `submission_review_states_by_item` already filtered on `is_latest`, so approvals, the
    "decided since submission" rule and item completion read the current round without change.
  - `human_submitter_ids`, `has_machine_annotation` and `machine_annotated_item_ids` now do too. A reopened
    item is offered again at 0 of N, and on an AI-assisted task it falls back to people through
    `first_pass_complete`.
- **Independence spans every round, everywhere it is checked.**
  - Authors are kept out of reviewing by the review queue, `assert_may_decide` and
    `assert_may_route_dispute`, all through `item_author_ids`.
  - Judges are kept out of annotating by the annotate queue, `create_draft` and `submit_draft`, all
    through `item_judge_ids`.
- **The AI is not re-run on a reopened item.** `items_needing_ai` and `ai_annotation_for_item` deliberately
  read every round, which is consistent with ADR decision 6.
- **The web app ignores superseded drafts.** `latestOwnDraft` and `selectDraftForViewer` count only
  `submitted` and `pending` drafts, so a round-1 annotator opening a reopened item is not shown as
  "submitted".
- **The Reopen card's role hint matches the backend.** `canEditProjectPolicy` grants `admin` and
  `task_owner`, the same roles as `MANAGE_PROJECT`.

## Scope — SCRUM-110 on the board, point by point

| # | Board description (30/09) | On `ce951c3` |
| --- | --- | --- |
| 1 | `MANAGE_PROJECT` only (403); canonicalized item on an active task (409) | ✅ `test_nobody_but_the_project_owner_reopens`, `test_an_administrator_may_reopen`, `test_only_a_finalised_item_on_an_active_task_is_reopened` |
| 2 | A reason is required; records who, when and why | ✅ `task_item_reopens`; `test_a_reopen_needs_a_reason`, `test_the_owners_reopen_needs_a_reason`. The 2000-character limit is not enforced (finding 1) |
| 3 | The whole round, human and AI, is superseded, never edited, and linked to the reopen | ✅ `superseded_by_reopen_id`, `superseded_at`; `test_a_reopen_supersedes_every_answer_of_the_round_without_changing_it`, `test_the_ai_first_pass_is_superseded_too` |
| 4 | Requirements count afresh: submitters, first pass, review queue and approvals | ✅ `test_a_reopened_item_takes_its_required_submissions_again`, `test_a_reopened_ai_assisted_item_goes_to_people`, `test_a_reopened_item_runs_a_whole_second_round` |
| 5 | A resubmission after a reopen is a new version; the superseded one is unchanged | ✅ `version + 1` in the same `base_annotation_id` group; `test_an_earlier_author_who_submits_again_adds_a_version` |
| 6 | AI-assisted items: decide and record | ✅ ADR decision 6 — people's work, no AI re-run; `test_a_reopened_ai_assisted_item_is_not_sent_to_the_ai_again` |
| 7 | The finalised-item message points at the reopen | ✅ `test_the_finalised_refusals_name_the_owners_reopen` |
| 8 | One history helper, for F1 to migrate | ✅ `record_item_reopened`; `test_a_reopen_is_recorded_in_the_items_history` |
| 9 | One reopen function shared with SCRUM-99, with no permission check | ✅ `reopen_task_item(db, item, *, actor_id, reason, cause)`, with `cause` either `owner_reopen` or `adjudication_return` |
| 10 | Web: the Reopen button for the owner; the superseded answer in history | ✅ The Reopen card in the workspace sheet; `ReopenHistoryDetail` on the task history board |

The PR also closes a leak it found: a round-1 author counted as "already submitted", and so could read
colleagues' round-2 answers before giving their own. This is fixed by `find_by_item_and_creator` reading
`is_latest` and tested by `test_an_earlier_author_reads_no_colleagues_answer_before_submitting_again`.

## Fix before merge

### 1. A reason over 2000 characters is a 500 on PostgreSQL

`TaskItemReopenRequest.reason` has no length limit (`app/schemas/review_actions.py`), but the column is
`String(2000)`. SQLite stores any length; PostgreSQL refuses the insert. Probe through the route, using the
PR's own fixtures, on a 2001-character reason:

```text
SQLite      -> accepted, stored length 2001
PostgreSQL  -> DataError (StringDataRightTruncation): value too long for type character varying(2000)
```

Nothing maps that error to a 4xx, so the API returns an unhandled 500. Unhandled 500s carry no CORS
headers, so the web app shows "Failed to fetch" rather than a reason.
`test_a_long_reason_is_kept_whole` uses about 690 characters, so it passes on both databases.

**Fix:** `reason: str | None = Field(default=None, max_length=2000)`, as `justification` and `feedback`
already do in the same file. Also add a test that 2001 characters are refused with 422 on both databases.
SCRUM-99 calls `reopen_task_item` directly, not through this schema. Checking the length inside the
function as well would cover that caller too.

## For SCRUM-38 (F3) — nothing to change here

The split the ADR records is the one SCRUM-38 builds on:
- **This PR — round-level supersession.** `task_item_reopens` is the reopen. Each annotation names the
  reopen that superseded it (`superseded_by_reopen_id`) and when (`superseded_at`).
- **SCRUM-38 — version-level supersession, on top.** A version names the version it supersedes and why
  (resubmission, reviewer correction, reopen), plus the authoritative marker.

SCRUM-38 reads `superseded_by_reopen_id` as the "reopen" cause. It does not replace it. Two things SCRUM-38
will change in code this PR touches, recorded here so they are not a surprise:
- **A resubmission within a round will stop rewriting in place.** ADR decision 4 keeps PR #35's in-place
  rewrite. R2-2 ("do not flatten the history") makes each resubmission a new version under SCRUM-38.
  `find_by_item_and_creator` filtering on `is_latest` stays the right lookup either way.
- **`is_latest` will be set through one helper.** `reopen_task_item` sets it directly today. SCRUM-38 moves
  every write of `is_latest`, and of the supersession links, behind a single write path, so the links and
  `is_latest` cannot disagree.

## Should know (not blocking)

- **The judge rule applies before any reopen too.** Anyone who has reviewed any submission on an item, in
  any round, can no longer annotate that item. It closes a real gap (Hanchen's point on #43; client Q4).
  But in small test setups it means one account cannot first review and then annotate the same item.
  Scenario tests (SCRUM-68 to 70) should seed separate annotator and reviewer accounts.
- **Merge order.** #45 goes in first, then this PR is retargeted to `main` (`gh pr edit 46 --base main`),
  as its description says. The schema changes, so PostgreSQL development databases need
  `init_data.py --reset` on merge day. Send the team a reminder.
