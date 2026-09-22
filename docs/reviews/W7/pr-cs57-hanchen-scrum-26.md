# PR #23 — SCRUM-26: atomic draft submission (draft PR, stacked on #19)

**Base:** `CS57-Hanchen` (PR #19) ← **Compare:** `CS57-Hanchen-scrum-26` ·
**Reviewer:** Kanishka (`kanishkakathait`) — her SCRUM-48 submission limit goes into the same
`submit_draft`.

**Opened 2026-09-19 as draft PR #23** (https://github.com/USYD-CS-Capstone/hej/pull/23) with `gh`, body
as below. **Ready for review since 2026-09-20**, after the manual walkthrough passed.

Once #19 merges: **Edit** next to the title → change the base to `main`. GitHub then shows only this
PR's commits.

## Title

```
fix(api): make draft submission atomic and record its annotation (D5/SCRUM-26)
```

## Description

```markdown
Closes SCRUM-26 (story D5 criterion 3, issue 11). **Draft, stacked on #19**: the base is
`CS57-Hanchen`, so the diff shows only this ticket. It will be retargeted to `main` once #19 merges.

## Problem

`DraftService.submit_draft` writes three things, and each commits on its own: the draft status, the
annotation, and the item status. A failure between them leaves a submitted draft with no annotation,
or an item out of step with its draft. The route then writes the `draft_submitted` history row in a
fourth commit. The draft's link to its annotation, `draft.annotation_id`, is declared but never
written, so review cannot tell which annotation a submission produced.

## Plan, commit by commit

- [x] **Commit 2 — `refactor(api): raise a domain error from the finalised-item guard`** (`620e7dd`).
  The guard from #19 raises `TaskItemFinalisedError`, and `DraftService` maps it to 409. The routes
  are unchanged. Requested in the review of #22 so the AI worker can refuse without catching an HTTP
  exception.
- [x] **Commit 3 — `refactor(api): let the submit path defer its commits`** (`5b764aa`). Adds
  `commit: bool = True` to the four repository writes submission uses. No behaviour change, and no
  test edits.
- [x] **Commit 4 — `fix(api): make draft submission atomic and record its annotation`** (`404ffda`).
  - `submit_draft` writes the draft, the annotation, `draft.annotation_id` and the item status with
    `commit=False`, then commits once, rolling back on any error.
  - The submit route adds the `draft_submitted` history row to the same transaction, commits once, and
    now returns `annotation_id` in its response. This is additive; the web client ignores the extra
    field until D4 uses it.
  - Marked places are left for SCRUM-48's submission limit (inside the transaction, with the item row
    locked) and for F1's submission event (`routes/drafts.py:267`, before the commit).
- [x] **Commit 5 — `docs: record atomic submission and the draft's annotation link`** (`48fb057`).
  `api_surfaces.md`: the domain error and its 409 mapping, submission as one transaction, and
  `annotation_id` in the submit response. `workflow_states.md`: a TaskItem lifecycle note and an
  invariant — submission is all or nothing.

**Also in this PR, not SCRUM-26:** `a54a343` `docs: several annotators may work one item`. While I was
editing `workflow_states.md`, I found it still said one annotator works an item at a time. It now
follows the client's 2026-09-17 answer (D8): several annotators per item, drafts uncapped, submissions
limited per task, no assignment. It is a separate commit so it can be reviewed on its own.

## Testing so far

- Commit 2: with the code changed but the tests not yet updated, only the two guard unit tests
  failed; the route-level 409 tests passed unedited. After updating those two tests: **264 passed,
  147 subtests**, the same as the baseline.
- Commit 3: **264 passed, 147 subtests** with no test edits, so the default path is unchanged. The
  `commit=False` path was checked against a file database: flushed writes are visible in the same
  session but not to a second connection until commit, and rollback undoes all three. Commit 4's
  rollback tests cover it formally.
- Commit 4: new `test_draft_submission_atomicity.py`, five tests on real SQLite with
  `autoflush=False`, as the app's `SessionLocal` has:
  - the link to the annotation is recorded;
  - a resubmission links to the author's existing annotation;
  - a failure injected at the item status, at the annotation and at the history row leaves nothing
    written.

  **All five fail on the previous commit** (`5b764aa`), each for the reason it names:
  `annotation_id` is `None`, or the draft is already `submitted` after the failure. All five pass on
  `404ffda`. One existing mock assertion gains `commit=False`; the behaviour it guards
  (`expert_send_back` → `annotated`) is unchanged. Full suite: **269 passed, 147 subtests**.
- **Manual walkthrough in the running app: done 2026-09-20, all 11 steps passed**
  (`docs/sandbox/W7/tests/manual-test-SCRUM-26.md`, kept outside this repo). Two accounts, two
  browsers:
  - the submit response carries `annotation_id`, and the stored draft carries the same one;
  - `draft_submitted` appears in the task's history;
  - after the reviewer returns the item, resubmitting keeps the same `annotation_id`, and the item
    still has exactly one annotation, updated in place;
  - on a finalised item, a stale page is still refused with `409` and the same message as before
    Commit 2 — and `ANSWER-B-sneaky` reached neither the drafts nor the annotations table.

## Notes for reviewers

- PR #22's worker catches this guard's exception. Michael has been sent the change, and a way to
  catch both exception types so either PR can merge first.
- The refusal order in `submit_draft` is: finalised item, then draft is pending (both before any
  write), then SCRUM-48's limit (inside the transaction). This is being agreed with Kanishka.
- **A pre-existing web defect turned up during the walkthrough, and is not fixed here.** On a returned
  item, **Save draft** reverts the editor to the previously submitted answer and saves that instead of
  what was typed; submitting directly works. Two causes, both on `main` since `d4d809c`:
  `selectDraftForViewer` (`lib/task-workspace-data.ts:373`) prefers the viewer's submitted draft over
  their pending one, and the editor's initialising effect is keyed on the whole `item` object
  (`components/task-item-workspace-sheet.tsx:951`), so a re-render discards unsaved typing. It is
  recorded as S10 and carried by **SCRUM-93**, which rebuilds this screen for several annotators per
  item. No Jira ticket, as with issue 30 under B4.
```
