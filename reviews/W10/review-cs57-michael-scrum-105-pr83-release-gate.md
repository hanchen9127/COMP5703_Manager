# Review — PR #83, `CS57-Michael-scrum-105-release-gate` (SCRUM-105, H3: the pre-release gate)

<https://github.com/USYD-CS-Capstone/hej/pull/83> · reviewed 2026-10-19 at `c2b3a18` (3 commits on top of #63, base `main` = `eab648e`)

**Posted 2026-10-19 06:07 UTC as Request changes**, then **changed to Approve** the same day (Hanchen: ADR 020's
decisions are the team's design). The first review's body was edited to this text, from "Verdict" down; a short
Approve review follows it. Both on `c2b3a18`. Read from GitHub first: open, ready for review, review requested from Hanchen, no comments or reviews, `MERGEABLE`. CI cannot run (GitHub Actions billing, repo-wide since 16 Oct). #84 (SCRUM-104, H2) is stacked
on this branch.

Prior context read: roadmap W10 group 1 (H3), client answers R2-1, R2-2, R2-5 and R1-7 (`info/client-question.md`,
`info/client-qa.md`), the QA issues #38, #40 and #72, and Yi's heads-up to SCRUM-105 in #76. There are no sandbox
messages to Michael for W9 or W10.

## Verdict: approve

The gate does what H3 asks: it runs first in `create_release`, reads recorded decisions only, refuses with one 409
that names every failing item with every reason, and creates nothing on a refusal. It also handles this week's new
paths correctly (the Expert Gate and an accepted correction, checked below). ADR 020's three decisions are accepted
as the team's design. Only their attribution in the ADR needs a wording change, which does not block the merge.

## Checked

| Check | Result |
| --- | --- |
| Worktree `D:\COMP5703_Capstone\hej-review-83` at `c2b3a18` | `main` checkout untouched |
| SQLite, full suite | ✅ 2,142 passed, 18 skipped, 209 subtests (matches the PR) |
| Casebook, `--baseline --exact` | ✅ 66/66 passed, 5 skipped, 71 unchanged; EV-016 runs |
| PostgreSQL, release, gate, Expert Gate, accepted-correction and export suites | ✅ 125 passed |
| PostgreSQL, full suite (in the compose `backend` container, worktree mounted) | ✅ 2,154 passed, 6 skipped, 209 subtests |
| Review-only scenario: an expert accepts a reviewer's correction (SCRUM-124), then the gate | ✅ No refusal. The correction is `is_latest` and marked; the disputed original is `is_latest` but not marked, so `superseded` stays quiet |
| Review-only scenario: Expert Gate, one approval | ✅ Held item refused as `unreviewed` + `disputed`; passes once the expert confirms |
| Lock claim in `create_release` | ✅ The writers that change answers or status do take the item row first: owner reopen (`_load_task_item(..., for_update=True)`), draft submit (the review lock), `annotation_versions.create_version`, the send-back resolution |

The two review-only scenarios were a scratch test file in the worktree, not committed.

## Against H3 and the client's answers

| Asked | At `c2b3a18` |
| --- | --- |
| Refuse unreviewed items (H3; issue 19, issue 27) | ✅ `is_task_item_export_eligible`, the same rule as completion and export; no `approved` status |
| Refuse disputed items (E1's release exclusion) | ✅ Open escalation, annotation dispute or item reconciliation, which includes an Expert Gate case |
| Refuse superseded versions (H4) | ✅ H4's reading: a marked answer no longer current, a canonicalized item with no marked answer, an unresolved item with one |
| Refuse incomplete provenance (F1) | ✅ Each answer, correction, review, reopen, dispute and reconciliation after the item's first event must have its event |
| Name the items and why, before anything exists | ✅ One 409, every item once, every reason; no release row, artefact or `released` event |
| An ambiguous item can still be released (R2-1: "unresolved, still exported") | ✅ Passes the gate |
| Guideline and policy versions (R1-7, R2-5) | ✅ Reported as `gate_warnings` on the 201, not a refusal |

## Should fix (not blocking)

### 1. ADR 020: these are the team's decisions, so say so

ADR 020 says decisions 2 and 3 were "Decided by the client, 2026-10-18", and its first consequence cites
"(client, 2026-10-19)". The PR description repeats it: "agreed with the client, recorded in ADR 020". The client's
answers are kept in the `QA` issues (#38, #40, #72) and in `info/client-question.md`. None of them covers superseded
guideline or policy versions as warnings, the pre-F1 exemption, or reopening items finalised before authority
marking.

The decisions themselves are accepted as our design, and the reasoning is sound. Since 7 Oct Hunter has let the
team decide open design questions like these. Change the three attributions to "Decided by the team" (and the
PR description's "agreed with the client"), so that nothing later quotes them as the client's requirement. A
follow-up commit or the next push is fine.

### 2. Coordinate the casebook with #79 (Jingwei, SCRUM-74)

Both PRs edit `baseline.json`, EV-015, EV-016 and EV-101. The PR says EV-015's fault "cannot be injected" because
events are immutable. #79 adds exactly that fault: its `tamper` step deletes an event with the database owner's
rights, and #79's EV-015 already uses it, waiting only for this gate.

Suggested order: this PR first (critical path; #84 is stacked on it), then #79 merges `main`, enables EV-015 (tamper,
then release, expecting the 409 that names the item), and regenerates the baseline with `--update-baseline` instead
of merging it by hand.

### 3. A disagreement still waiting to be opened is reported as `unreviewed`, not `disputed`

Under `manual_review`, two reviewers who split leave a `review_disagreements` row with no dispute yet, and the item
in `disputed`. `held` reads escalations, disputes and reconciliations, but not that row. So the refusal says
`unreviewed: The item's status is 'disputed'`. The item is still refused, but the reason is misleading. Add a pending
disagreement (a disagreement row with no dispute opened from it) to `held`, for example "a reviewer disagreement
waiting to be opened as a dispute".

### 4. Name the Expert Gate in the refusal

An item held at the Expert Gate is refused with `disputed: … open item reconciliation 'rec_…'`. Yi's heads-up in #76
gave the field for this: `item_reconciliations.trigger_type = expert_confirmation_required`. Saying "waiting for an
expert's confirmation (Expert Gate)" tells the person releasing what to do next.

## Nit

- A canonicalized item with no marked answer is reported under `superseded`. That is H4's rule, but nothing was
  superseded. `no_authoritative_answer` would read better. If you keep the name, #84 and the H6 screens should not
  show the reason code alone.
