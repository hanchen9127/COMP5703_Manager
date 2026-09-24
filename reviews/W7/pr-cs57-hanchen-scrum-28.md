# PR — SCRUM-28: finalised items refuse new annotation work

**Base:** `main` ← **Compare:** `CS57-Hanchen` · **Reviewer:** _to be assigned at the W7 meeting_

Suggested reviewers: **Dishank** (SCRUM-43 touches the same `task_service.py` lines and settles what
"finished" means) or **Parth** (works in the review path this guard sits next to).

## Title

```
SCRUM-28: a finalised task item refuses new annotation work (issue 2)
```

## Description

```markdown
Closes SCRUM-28 (story D5 criterion 1, issue 2).

## Problem

`DraftService.submit_draft` checked that the draft was `pending` and nothing else.
It then called `_create_annotation_from_draft`, which looked up the author's
existing annotation and overwrote `annotation_data` in place.

On a `canonicalized` item that meant:

- the item kept its finalised status, while the answer under it changed;
- no new review was triggered, because nothing in the item's state moved;
- the approving `ReviewDB` row still pointed at that annotation — so an approval
  that a reviewer gave to one answer silently transferred to another.

`_TASK_ITEM_STATUSES_SKIP_ANNOTATED_ON_SUBMIT` looks like it already protected
this path. It does not: it only stops the item's *status* moving on submit, and
never touches the content. `create_draft` and `update_draft` checked the item
even less — neither loaded it at all.

This is the defect behind "a released dataset cannot answer how this label got
here": the provenance chain still reads as reviewed and approved, while the value
it points at is not the one anybody reviewed.

## Changes

**Backend — the guard (`app/services/task_service.py`)**
- New `assert_task_item_accepts_draft_writes(task_item)`, placed beside
  `assert_task_item_status_update_allowed` and reading the same
  `TERMINAL_TASK_ITEM_STATUSES`, so "finalised" keeps one definition in one file.
- The two guards are deliberately separate: the existing one protects the item's
  **status**, the new one protects its **content**. Issue 2 lived in the gap
  between them.

**Backend — wiring (`app/services/draft_service.py`)**
- One private helper loads the item and applies the guard; `create_draft`,
  `update_draft` and `submit_draft` all call it. Checked in the service rather
  than in each route, so a future caller that reaches drafts another way is
  covered too.
- It runs **before** each path's own status check. On a finalised item the
  annotator now reads "this item is finalised", not "this draft is not pending" —
  the second invites them to start another draft, which would be refused in turn.
- `delete_draft` is deliberately **not** guarded: deleting a pending draft removes
  no annotation, and refusing it would strand unusable rows on the item forever.
- A draft write naming an unknown task item now returns `404`. It previously
  reached the database and surfaced as a foreign-key `500`, which cannot be told
  apart from an outage (the same class of problem as issue 29).

**Docs**
- `workflow_states.md` — a `FINALIZED` item refuses new annotation work; reopening
  is not available; `RETURNED` and `EXPERT_SEND_BACK` are not finalised. Plus one
  invariant: a finalized `TaskItem` keeps the answer it was finalized on.
- `api_surfaces.md` — draft mutation now carries a third, orthogonal condition:
  capability (may I do this class of thing), authorship (is this draft mine), and
  the record's own state (is this item still open). Records why the guard is
  ordered ahead of the draft status check, and why delete stays open.
- `task-lifecycle.md` — "finalised" belongs to the item, not the task, and means
  `canonicalized` today.

No schema change. No frontend change.

## Decisions for review

1. **"Finalised" means `canonicalized` only.** `FINALIZED_EXPORTABLE_TASK_ITEM_STATUSES`
   also names `reviewed` and `approved`, so export already disagrees with this guard.
   That disagreement is issues 19 and 27, owned by SCRUM-43 — I did not widen the
   terminal set here, because "finished enough to export" and "locked against new
   work" may rightly differ. **Dishank and I should confirm this stays true after
   SCRUM-43.**
2. **Refuse, never reopen.** Who may reopen a finalised item, whether it returns to
   review, and whether the finalised answer survives as a superseded version are all
   open questions with the client. Until they are answered the platform refuses, and
   the message says the feature does not exist rather than implying a permission
   problem. D5 criterion 2 waits on that answer.
3. **The 404 is in scope.** Strictly it is a separate defect, but the guard has to load
   the item anyway, so the alternative was to keep a known `500` in a function I was
   already touching.
4. **`reviewed` is asserted as an allowed status** in the unit tests. That pins today's
   behaviour, so SCRUM-43 will turn the test red when it settles what "finished" means.
   That is intended — the conflict should surface in CI, not in production data.

## Testing

Backend **235 passed**, 147 subtests (baseline before this change: 226 / 138).
Frontend untouched.

**The test that fails against the old behaviour.** `tests/test_finalised_item_writes.py`
drives the three write routes against a real in-memory SQLite database with real users
and role rows. Verified by reverting the fix — commenting out the three calls in
`draft_service.py` — which turns **5 of its 6 tests red**:

| Test | Guard reverted |
| --- | --- |
| `create_draft` on a finalised item is refused | ❌ |
| `update_draft` on a finalised item is refused | ❌ |
| `submit_draft` on a finalised item is refused | ❌ |
| **a finalised answer and its review survive a resubmission** | ❌ |
| a draft for an unknown item is reported as not found | ❌ |
| returned and sent-back items still accept a submission | ✅ |

The sixth is green either way **on purpose**: it is the guard against widening the
terminal set and breaking rework — a reviewer could return work that nobody could
then redo. The two kinds are kept separate deliberately: five prove the fix, one
stops it going too far.

The fourth test is the one that matters. It seeds a `canonicalized` item with an
annotation and an approving review, attempts a resubmission, and then asserts that
`annotation_data`, `version`, `confirmed_by`, the review row and the item's status are
all unchanged, and that no second annotation appeared.

`tests/test_task_item_lifecycle_guards.py` adds unit coverage for the helper: every
non-terminal status is allowed, the message names the item and says reopening is
unavailable, and a plain-string status works as well as the enum.

**Manual, in the running app**, on 2026-09-16, with two browsers and two accounts
(annotator and reviewer). The annotator submits an item and reopens it from
**Items → Submitted**; the reviewer accepts it in the other browser; the annotator's
now-stale page is refused on both save and submit with:

```
Task item item_292e3490d82c is finalised (canonicalized) and does not accept new
annotation work. Reopening a finalised item is not available yet.
```

The same walkthrough confirms the send-back loop still works end to end: adjust →
returned → rework → resubmit, with no refusal.

## Notes for reviewers

- **Where the refusal actually comes from in the browser.** Once a draft is `submitted`,
  the web app finds no pending draft and posts a new one, so the refusal surfaces from
  `create_draft`, not `update_draft`. `submit_draft`'s guard is unreachable from the UI —
  the front end always saves before submitting and is stopped at that first step. It is
  the API-level backstop, and tests are the only thing that exercise it. Guarding one
  path would have left the browser hole open.
- **How to reproduce the race.** The item sheet closes itself ~900 ms after a successful
  action, and the Annotate queue lists only Draft, Returned and Rejected, so a submitted
  item leaves it. Reopen the item from **Items → Submitted**, which is allowed
  (`canAnnotate("submitted")` is true) — that is the real scenario, an annotator fixing a
  typo in submitted work at the moment the reviewer accepts it.
- The guard compares against a set of plain strings and `TaskItemStatus` is a `StrEnum`,
  so no normalisation is needed; there is a test for the plain-string case.
- `task_service.py` and `draft_service.py` are both files other W7 tickets touch —
  SCRUM-43 (Dishank) and SCRUM-48 (Kanishka) respectively. My changes are additive: one
  new function, one new private method, three one-line calls.
- `create_draft` now does one extra primary-key read per draft created. Negligible, but
  worth knowing for SCRUM-48, which also loads task items.

## Known limitations

- **Review actions are not guarded.** A reviewer can still reject or escalate a
  `canonicalized` item and move its status away from finalised. This guard covers
  annotation writes only. Out of scope for SCRUM-28; I will raise it as a follow-up
  rather than widen this PR.
- **Reopening a finalised item does not exist** (D5 criterion 2), pending the client's
  answer.
- **A resubmission by the same author still overwrites their own annotation in place**
  on a non-finalised item — there is no per-author versioning yet. The client has since
  said that different authors keep different versions, so this needs a version line per
  author; that is a separate commit after SCRUM-26, once SCRUM-27 settles which version
  review and export read.
- **Submission is still not atomic** and `draft.annotation_id` is still never written
  (issue 11). That is SCRUM-26, next in this branch.
```

## Before opening the PR

```powershell
cd D:\COMP5703_Capstone\hej
git fetch origin
git merge origin/CS57-Hanchen   # e2878b8 (PR #15 merge) is not in the local branch
```

Local `CS57-Hanchen` is exactly `origin/main` (`5070efd`), so a push would otherwise be
refused as a non-fast-forward. Merge, do not rebase; never force push a shared branch.

Then run the suite once more — expected **235 passed** — and record the reviewer in the
tracker when the PR is opened. PRs #14 and #17 have no reviewer recorded, which is a
gap `roadmap.md` already notes; do not repeat it here.
