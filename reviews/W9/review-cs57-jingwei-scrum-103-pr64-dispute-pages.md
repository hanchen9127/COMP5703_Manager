# Review — PR #64, SCRUM-103 (E6): dispute cases in their task, and a project's real cases

- **PR:** https://github.com/USYD-CS-Capstone/hej/pull/64 — `CS57-Jingwei` → `main`, head `82e5d8a`
- **Author:** Jingwei · **Requested reviewer:** Hanchen · **State on GitHub (2026-10-12):** open, no review or comment yet
- **Size:** 54 files, +4,940 / −1,674, 17 commits; `main` is merged into the branch
- **Reviewed by:** Hanchen (with Claude), 2026-10-12
- **Posted:** 2026-10-12 06:57 UTC as a **Request changes** review, the "Comment for GitHub" text below unchanged

## Context read first

- SCRUM-103's description (board export 2026-10-12 17:30).
- The #48 review (`review-cs57-yi-scrum-99-101-pr48-disputes-reconciliation.md`): the lists must not offer what
  the decision refuses (finding 2); reconciliation belongs to SCRUM-99; no scope on in-progress tickets.
- SCRUM-32's agreed scope (`sandbox/Break/msg/2026-10-05-scrum-32-corrections-*`).
- **Team decision of 2026-10-12:** the expert's Accept of a reviewer's correction is built as **SCRUM-124**
  (W10), multi-annotator items included. Not SCRUM-37, which is in progress with Dishank.

## Verdict

**Request changes — two small points, then approve.** The backend is sound: one service builds the task
desks' and the project's lists, so they can't drift; the independence filter, the read rules and the blind
rule on history all hold, and `may_decide` uses the decision route's own two checks. Both points below are
a few lines each.

Locally on SQLite at `82e5d8a`: API **1,473 passed, 9 skipped, 207 subtests**, the same as the PR. Not run:
PostgreSQL (no local server), web tests and `tsc` (no `node_modules` in the review worktree), the browser.

## Ticket criteria

| SCRUM-103 | At `82e5d8a` |
| --- | --- |
| Project list, dispute view and arbitration view show real cases, scoped to the viewer | ✅ `dispute_case_lists.py`; DISPUTE, ADJUDICATE or MANAGE_PROJECT; annotators 403 |
| Build or delete the three `notFound()` routes, and record why | ✅ All three deleted; reasons in the PR description |
| Verify the task desks read live data | ✅ Desks share the case detail with the new page (`bab83bd`, a move) |
| Actions change real state and survive a refresh | ✅ The page reads the case again after a decision |
| Issue 15 closed through Return | ✅ EV-040 (but see merge order below) |
| An expert is never offered a dispute on work they annotated or reviewed (R2-8) | ✅ Open cases filtered through `adjudication_conflict_item_ids`, in the list and the counts |
| Automatic disputes marked as opened by the platform | ✅ |

## Findings

### Fix before merge

**1. A task owner or reviewer is linked to a reconciliation they can't open (403).**
The PR's own rule is that reconciliations are for ADJUDICATE only, "so a row never links to a 403", and the
project list follows it. Two other places don't:
- `get_task_item_adjustment` returns `open_reconciliation_id` to anyone who passes `_may_read_disputes`
  (DISPUTE, ADJUDICATE or MANAGE_PROJECT), and the work panel turns it into "View the reconciliation";
- `TaskAuditLogQueryService.list_for_task` keeps an `item_reconciliation` `case` for the same readers, and
  History shows "View the reconciliation".

The reconciliation detail requires ADJUDICATE (`_task_for_adjudicator`), so the page shows "Could not load
this case". **Probe** (`scratchpad/wt-pr64/apps/hej-api/tests/test_probe_pr64_review.py`, passes at
`82e5d8a`): with two accepted answers, `_adjustment(db, OWNER).open_reconciliation_id` and the owner's
History both name the case, and `get_item_reconciliation(..., OWNER)` raises 403. Fix: return the
reconciliation id, and keep a history `case` of kind `item_reconciliation`, only for a reader with
ADJUDICATE; a test for each, with the task owner.

**2. "Accepting the correction is SCRUM-37's" — it is SCRUM-124's.** Three places hand the expert's Accept of
a correction to SCRUM-37, which is in progress with Dishank and takes no new scope:
- the PR description's decision **P3**;
- `dispute-case-detail.tsx:266`, the comment on `ExpertCorrection`;
- `docs/design/backend/api_surfaces.md:1087`.

The team decided on 2026-10-12 that this is SCRUM-124 (W10). The page's line "accepting the correction itself
isn't available yet" is right as it stands.

### Merge order

**3. EV-040 and #51's category list.** EV-040 has `category = "dispute"`, which #51 refuses, so whichever of
the two merges second breaks collection of the whole casebook. You said on #51 you'd move it to
`regression`; after #62 merges, a PR that adds a case also commits `evaluation/baseline.json`
(`--update-baseline`). So: #51, then #62, then this PR with EV-040 as `regression` and the baseline
regenerated.

### Smaller (not blocking)

- **The held-case redirect finds the formal dispute by subject annotation**, `.first()` with no order
  (`get_annotation_dispute`). The dispute a held split entered is the one whose `source_disagreement_id` is the
  split's id; matching on that first, and on the subject only as a fallback, can't land on another dispute of
  the same version. The lookup is inherited from `main`'s 409; only what follows it is new.
- **`canReadAnnotationDisputes` repeats the backend's role list** (`admin`, `reviewer`,
  `dispute_participant`, `arbitrator`, `task_owner`). Listed under Known limits; fine for now.

## Not raised on the PR

- The project list builds every row before paging (Known limits): fine at this size.
- The sort on the project list mixes three sources by `opened_at`; all three columns are `UtcDateTime`, so it
  is safe.
- Reviewers (DISPUTE) can read every dispute's evidence in the project, held and resolved ones included. That
  is `main`'s rule (`get_annotation_dispute`), unchanged here; the new list and links only make it easier to
  reach.

## Comment for GitHub (ready to paste)

````
Thanks Jingwei. The backend reads well: one service behind the task desks and the project list means they can't drift, and `may_decide` uses the decision route's own two checks. Re-ran at `82e5d8a`: API 1,473 passed, 9 skipped on SQLite, same as yours. I didn't run the web tests or PostgreSQL.

Two small points before I approve:

**1. A task owner or reviewer is linked to a reconciliation they can't open.** The project list keeps reconciliations to ADJUDICATE, as you say, so no row links to a 403. But `get_task_item_adjustment` returns `open_reconciliation_id`, and the task history keeps an `item_reconciliation` case, for anyone who may read disputes. So the work panel and History show "View the reconciliation" to a task owner, and the page then can't load it (`_task_for_adjudicator`). A probe with two accepted answers: the owner's item read and history both name the case, and `get_item_reconciliation` as the owner is a 403. Could you give the reconciliation id and that history case only to a reader with ADJUDICATE, with a test for each?

**2. Accepting the correction is SCRUM-124, not SCRUM-37.** We decided today to build the expert's Accept of a correction as its own ticket, SCRUM-124 (W10), since SCRUM-37 is in progress with Dishank. Please change P3, the comment on `ExpertCorrection` (`dispute-case-detail.tsx:266`) and `api_surfaces.md:1087`. The page's "isn't available yet" is right as it is.

**Merge order:** EV-040's `category = "dispute"` breaks #51's casebook load, as you noted there. I'll merge #51, then #62; then this PR with EV-040 as `regression` and `evaluation/baseline.json` regenerated (`uv run python -m evaluation run --update-baseline`).

Smaller, not blocking: the held-case redirect finds the dispute by subject annotation with `.first()`. Matching `source_disagreement_id == <the split's id>` first would never land on another dispute of the same version.
````

---

## Round 2 — re-review at `46826c8` (2026-10-12)

Jingwei replied on the PR at 08:03 UTC and pushed `5586853`, `9632ed2` and `46826c8`, with `main` merged in
(#51 and #62 merged earlier that day).

| Point | At `46826c8` |
| --- | --- |
| 1. Reconciliation link 403 | ✅ `5586853`: new `may_read_reconciliations` (ADJUDICATE). The item read returns `open_reconciliation_id` and history keeps an `item_reconciliation` case only for such a reader. Four tests (item read and history, task owner and reviewer). **The round-1 probe now fails** (`open_reconciliation_id` is `None` for the owner), as it should |
| 2. SCRUM-37 → SCRUM-124 | ✅ `9632ed2`: the `ExpertCorrection` comment and `api_surfaces.md`; P3 in the description reads "Accepting it is SCRUM-124's" |
| 3. Merge order | ✅ `46826c8`: EV-040 is `regression`; `baseline.json` gains EV-040 as a pass |
| Smaller: held-case redirect | **Accepted as answered.** `annotation_disputes.subject_annotation_id` is `unique=True`, and opening a second dispute on a version is refused ("This annotation version already has a dispute record"), so the lookup by subject finds the only dispute that version can have |

Locally on SQLite at `46826c8`: API **1,562 passed, 14 skipped, 207 subtests** (the same as Jingwei's; the probe
was removed from the worktree before the count); `test_project_disputes.py` 27 passed; casebook against the
baseline, exact: **8/8 passed, 5 skipped, 13 unchanged, no regression**. Not run: PostgreSQL (Jingwei: 1,571
passed), web tests, the browser.

**Verdict: approve.**

### Comment for GitHub (round 2, ready to paste)

````
Thanks Jingwei, all three are in. Re-ran at `46826c8`: API 1,562 passed, 14 skipped on SQLite, and the casebook against the baseline is 8/8 passed, 5 skipped, no regression. My probe from round 1 now fails as it should: the task owner's item read has no reconciliation id.

You're right about the held-case redirect: `subject_annotation_id` is unique on `annotation_disputes`, so a version has at most one dispute and the lookup by subject can't pick the wrong one. Fine as it is.

Approving.
````

**Posted and merged:** Approve posted 2026-10-12 (round-2 text above, unchanged); CI green on SQLite and PostgreSQL; merged by Hanchen at 08:12 UTC with a merge commit, `48a6153`.
