# Review — PR #90, `CS57-Michael-release-review-followups` (SCRUM-104/105: the release gate's and manifest's review follow-ups)

<https://github.com/USYD-CS-Capstone/hej/pull/90> · reviewed 2026-10-20 at `849f58d` (3 commits, base `main`)

**Posted 2026-10-20 04:05 UTC as Approve** on `5d8fc4e`, after Hanchen pushed the two commits below to Michael's
branch (fast-forward from `849f58d`; GitHub then showed `MERGEABLE`). The posted text is a condensed version of this
file from "Verdict" down, written to Michael, and asks him to pull before he pushes again. **Merged 2026-10-20
04:32 UTC** by Hanchen, merge commit `fbcff2e` (not squashed), head `4f7c87b`.

**Added after the Approve (Hanchen's choice to carry it on this PR):** `4f7c87b`,
`ci(SCRUM-125): run the PostgreSQL job on main and on demand, not on PRs`. Pull requests run the `sqlite` job only;
`postgresql` runs on every push to `main` and through `workflow_dispatch`. Pushed as a fast-forward; GitHub still
shows `MERGEABLE` and `APPROVED`. The repo's docs that say CI runs both backends (ADR 006, the evaluation README,
`ai_batch_execution_architecture.md`) stay true on `main` and were not changed. Read from GitHub first: open, no comments or reviews, `CONFLICTING` with `main`. The conflict
comes from #88 (Jingwei, SCRUM-126, settlements of held splits), merged 2026-10-20 03:08 UTC, after this PR was
pushed. CI cannot run (GitHub Actions billing).

Prior context read: the reviews of #83 and #84 (`review-cs57-michael-scrum-105-pr83-release-gate.md`,
`review-cs57-michael-scrum-104-pr84-release-manifest.md`), roadmap W10 groups 1 and 2, and the SCRUM-126 notes in
the roadmap's 2026-10-19 update. There are no sandbox messages to Michael for W10.

## Verdict: approve, after the merge below is pushed

Every point from the reviews of #83 and #84 is addressed, as the description says. The one real fix, the manifest's
source version, is right: an authoritative item now takes `AnnotationDB.source_version_ref`, the version its answer
followed, and an ambiguous item keeps the pointer's. The merge with #88 needed one extra change (below), so that the
gate keeps matching the case list's rule now that a split can be settled.

## The earlier points

| Point | At `849f58d` |
| --- | --- |
| #83 should-fix 1: ADR 020's decisions are the team's | ✅ Decisions 2 and 3 and the first consequence say "the team" |
| #83 should-fix 2 and #84 should-fix 1: EV-015 and EV-101 with #79 | ✅ Left to #79, and ADR 020 says so |
| #83 should-fix 3: a held split reads as `unreviewed` | ✅ Named under `disputed`, by the case list's `pending_route` rule (see below for settlements) |
| #83 should-fix 4: name the Expert Gate | ✅ "the Expert Gate: item reconciliation '…' waits for an expert's confirmation" |
| #83 nit: `no_authoritative_answer` | ✅ New refusal code, its own web label, ADR 020 and `api_surfaces.md` updated |
| #84 should-fix 2: the source version from the answer | ✅ `answer.source_version_ref` for an authoritative item; the pointer's for an ambiguous one |
| #84 nit: `authoritative_cause` in each manifest item | ✅ Added; null for an ambiguous item |
| #84 nit: comment on `db.rollback()` | ✅ |

The artefact's lines carry no source version, so the manifest's new `source_version_ref` cannot disagree with them.
`verify()` is unchanged and needs no change.

## The merge with `main` (#88)

`release_gate.py` was the only conflicting file: #88 added the settlements query (for the provenance check) right
where this PR added the held-splits query. Both are kept. Done in the worktree `D:\COMP5703_Capstone\hej-review-90`
on the local branch `review-pr90-merge`, as two commits on top of `849f58d`:

1. **The merge** (`9395697`): the conflict resolved by keeping both blocks, nothing else.
2. **A follow-up fix**, because #88 changed the rule this PR copies. Since #88, the case list's held split is a
   `manual_review` disagreement on a disputed item that no dispute has taken up **and nobody has settled**
   (`dispute_case_lists._pending_disagreements`). This PR's rule predates that, so it lacked the settlement
   condition. A settlement sets the item's status through `item_status_after_accept`, so an item can stay
   `disputed` after one, when another answer's split on it is still held. The gate then named the settled split
   as holding the item; the case list shows it as resolved. The fix adds settled disagreements to the set the gate
   skips, with a fail-before-fix test (`test_a_settled_split_is_not_named_as_held`: it failed with
   `['unreviewed', 'disputed']` before the change). ADR 020's decision 1 and the `disputed` row in
   `api_surfaces.md` say "and nobody has settled", and the manifest's `authoritative_cause` list there gains
   `settlement_accept`, the cause #88 added.

## Checked (after the merge and the fix)

| Check | Result |
| --- | --- |
| SQLite, gate, manifest and settlement suites | ✅ 85 passed, 1 skipped (after the merge, before the fix) |
| SQLite, full suite | ✅ 2,323 passed, 20 skipped, 209 subtests (PR alone: 2,268; #88 and the new test add the rest) |
| Casebook, `--baseline --exact` | ✅ 73/73 passed, 5 skipped, 78 unchanged (#88's six settlement cases included) |
| Web | Not run: the merge does not touch `task-releases-section`, and the worktree has no `node_modules`. The PR reports 735 passed |
| PostgreSQL | Not run; no schema change in this PR |
