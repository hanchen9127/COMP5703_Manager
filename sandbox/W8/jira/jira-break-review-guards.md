# Review guards found in the D8 browser walkthrough — two new break tickets, one addition to SCRUM-109

2026-09-27. From the browser walkthrough of `CS57-KANISHKA` (`../tests/manual-test-SCRUM-48.md`,
"Findings from the browser run") and the pre-merge comment on PR #33
(`../../../reviews/W8/comment-cs57-kanishka-scrum-48-premerge.md`). Hanchen's decision (2026-09-27):
items 1 and 2 become new tickets in the Mid-semester Break sprint; item 3 is added to SCRUM-109.

The break's rule (`../../../specs/roadmap.md` → Break): a bug found in scenario testing gets a ticket in
the break sprint, and testing and bug fixing are not counted in units. The points below are the board's
estimate only.

---

## New ticket A — the review action refuses what the queue would never offer

**Board fields**

| Field | Value |
| --- | --- |
| Summary | `Review: refuse a decision on a submission that is not awaiting the reviewer` |
| Type | Task |
| Story points | 1 (bug fix, not counted in the break's load) |
| Sprint | Mid-semester Break |
| Assignee | picked at the weekly meeting |
| Links | relates to SCRUM-86 and SCRUM-109 (same file, `review_actions.py`); after PR #33 merges |

**Description** — paste inside a noformat block. The first line must stay: `tracking-sync` maps the
ticket to stories by it.

```
Related to user story D1, D5, D8

ONLY BACKEND

Found in the D8 browser walkthrough on CS57-KANISHKA (2026-09-27) and in Yi's review of PR #33. The review queue offers a reviewer only the submissions that await them (awaits_review_by: not their own, not already decided since it was last submitted, short of the policy's approvals, and not already reviewed by them since then). The review action does not apply that rule, so it accepts decisions the queue would never offer:
- the same reviewer accepts the same submission again under single sign-off (six approvals of one answer in the walkthrough);
- a reviewer decides on a submission that already has its approvals;
- a person returns, rejects or escalates their own submission (only accept checks self-review; Yi, related to SCRUM-86);
- a reject on a canonicalized item's approved submission reopens the item (Yi, related to SCRUM-110).

# submit_task_item_review_action refuses, with 409 and a message that says why, a decision on a submission that does not await the caller, using the same rule as the queue (awaits_review_by), after the item lock.
# Self-review is refused for every action, not only accept (403, as today for accept).
# A finalised item's submissions are refused this way; reopening stays SCRUM-110's owner-only path.
# A reviewer who returned a submission may still review its resubmission, and an earlier approver may approve a resubmission (approvals count since the last submission, PR #35).
# Tests: a repeat accept under single sign-off, a decision on a fully approved submission, a self-return, and a reject after canonicalisation are each refused; each fails on the old behaviour.
```

---

## New ticket B — an approved answer cannot be resubmitted

**Board fields**

| Field | Value |
| --- | --- |
| Summary | `Review: an annotator resubmits only work that is theirs to redo` |
| Type | Task |
| Story points | 1 (bug fix, not counted in the break's load): API 0.5, panel 0.5 |
| Sprint | Mid-semester Break |
| Assignee | picked at the weekly meeting |
| Links | relates to SCRUM-114 (the panel files); after PR #33 merges |

**Description** — paste inside a noformat block.

```
Related to user story D8

BACKEND AND FRONTEND

Found in the D8 browser walkthrough on CS57-KANISHKA (2026-09-27). On an item that was "rejected" because of one annotator's work, another annotator resubmitted an answer a reviewer had already accepted. The panel offers the editor on the item's status to every annotator, and the API lets anyone who has submitted resubmit at any time. Approvals now count only since the last submission (PR #35), so the old approval stopped counting and the item waited for a new one: nothing was lost, but an accepted answer changed after it was accepted.

Proposed rule, to confirm at the weekly meeting before building: an annotator may resubmit their own answer while it awaits its first review, or once a reviewer has returned or rejected it. Once it is approved, it is not changed by its author.

# The draft service refuses a resubmission that the rule does not allow, with 409 and a message that says why.
# The workspace panel offers the editor on an item only where the viewer may submit: a first submission, or their own work that is back with them — not because of the item's status, which may be returned or rejected for someone else's work.
# Tests: the API refuses a resubmission of an approved answer and allows one of a returned or rejected answer; a web test shows no editor to an annotator whose approved answer sits on a rejected item.
```

---

## Addition to SCRUM-109 — status after a submission

Append to the end of SCRUM-109's description (inside the noformat block), and raise its estimate from
1 to **1.5** points.

```
Added 2026-09-27 from the D8 browser walkthrough on CS57-KANISHKA: a submission also moves item status, and it currently ignores the item's other submissions.

# A submission sets the item's status from all of its submissions, the same way an accept does: "returned" or "rejected" while any submission is back with its author, otherwise "annotated". Today _advance_task_item_to_annotated_on_submit sets "annotated" regardless, so an item whose one submission is returned reads "annotated" as soon as another annotator submits. The accept path already computes it (item_status_after_accept): share that computation with the human and AI submission paths.
# The divergence test covers sequences of submissions as well as review actions: return one submission, then another annotator submits — the item stays "returned".

The queues are not affected (they read review states), but the item's status, the panel's notices and SCRUM-89's figures read it.
```
