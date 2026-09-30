# SCRUM-110 — description update before Jingwei starts

2026-09-30. SCRUM-110's description (written 2026-09-24, board download of 2026-09-30) predates three things:
F1 moving to W11, SCRUM-116 and PR #41. It also understates what "count afresh" costs, because of how today's
code counts and stores submissions. Replace the whole description with the block below. The first line stays,
because `tracking-sync` maps the ticket to D9 by it. Code references are to `main` `e367ebd`.

**What changed and why**

| # | Where | Change |
| --- | --- | --- |
| 1 | Criterion 1 | Reopen only while the task is `active`. PR #41 (SCRUM-24) makes `completed` terminal and refuses work outside `active`, so a reopen in a completed task would open an item nobody may work on |
| 2 | Criteria 3–5 | "Count afresh" made concrete. Today `human_submitter_ids` counts every annotation row, so a reopened item stays full; `first_pass_complete` treats an old AI annotation as the new first pass; and a resubmission rewrites the author's annotation in place (`draft_service.py:360`), which would overwrite the superseded answer. The fix is to separate rounds: earlier annotations are marked superseded, and a resubmission creates a new version |
| 3 | Criterion 6 (new) | AI-assisted items after a reopen: a decision to record in the PR, with a recommendation |
| 4 | Criterion 8 | "Provenance event on F1's event record" cannot be met: F1 moved to W11 (SCRUM-98, unassigned) and the table does not exist. The reopen goes through one helper that writes a history row, the way `record_item_taken` does, and F1 migrates it |
| 5 | Criterion 9 (new) | One reopen function shared with SCRUM-99's Return. It carries no permission check; each route checks its own |
| 6 | Criterion 10 | The frontend waits for PR #43 and #44, which rewrite the same panel |
| 7 | Collaboration | SCRUM-116 lands first; PR #41 added; the SCRUM-38 agreement moved to day one |

**On the board:** assignee Jingwei (planning of 2026-09-30). Sprint unchanged (Mid-semester Break).
**Points: your call.** Change 2 makes 1.5 look low; 2 is closer. If SCRUM-116 moves to Jingwei too, his
break load is 2.5u at 1.5 points, or 3u at 2 points, since SCRUM-68 was in review at the end of W8.

```
{noformat}Related to user story D9

BACKEND AND FRONTEND

Added 2026-09-24 from the client's answer R2-3. D5 (SCRUM-26, SCRUM-28) built the refusal: a finalised item refuses every new draft, edit and submission. This ticket builds the deliberate way back. Updated 2026-09-30 before work starts: task lifecycle (PR #41), rounds of work, provenance while F1 is in W11, and the function shared with SCRUM-99.

Client answer: "The project owner may reopen a finalised item directly. [...] A reopened item returns to the normal open workflow, rather than simply resuming at the previous review step. The previous finalised answer must remain in history as a superseded version. It should never be overwritten."

Out of scope (Hanchen's reply to the client, 2026-09-24): requests to reopen from annotators, reviewers and experts. Only the project owner reopens.

# A reopen action on a canonicalized task item, allowed only to a user holding the MANAGE_PROJECT capability (app/core/permissions.py — task_owner and admin today). Everyone else is refused on the backend with 403, not only hidden in the UI. The item must be canonicalized and its task active (SCRUM-24, PR #41: completed is terminal and only an active task accepts work); otherwise 409 with the reason.
# The reopen requires a reason and records who reopened, when and why.
# The finalised answer is marked superseded, never edited or deleted, and stays visible in the item's history. Every annotation of the finished round, human and AI, and its reviews become an earlier round: no longer the latest (is_latest exists on annotations), and linked to the reopen that superseded them. Use the same supersession model as SCRUM-38 (F3).
# The item leaves canonicalized and returns to the open workflow: it appears in the available-work list (D8) for new annotation, and its annotation and review requirements count afresh for the new round. Today's code counts every round, so this needs changing wherever submissions are counted:
#* human_submitter_ids and human_submitter_ids_by_item (app/services/submission_rules.py:34, :52) count every annotation row on the item, so a reopened item would show "3 of 3" and never be offered again;
#* first_pass_complete (submission_rules.py:151) treats an existing AI annotation as the finished first pass, so a reopened AI-assisted item would go straight back to review;
#* the review queue and the approvals-since-submission rule (PR #35) must read only the new round's submissions and reviews.
# A resubmission after a reopen creates a new annotation version and leaves the superseded one unchanged. Today DraftService rewrites the author's existing annotation in place (app/services/draft_service.py:360, "each user keeps one annotation per item"), which would overwrite the finalised answer when someone who annotated the earlier round annotates again.
# AI-assisted tasks: decide in the PR whether a reopened item's new round is human work or gets a new AI pass, and record the decision. Recommended: human work — the client's "normal open workflow" — with no automatic AI re-run.
# The finalised-item guard (TaskItemFinalisedError, app/services/task_service.py:194) still refuses writes to items that are finalised; its message "Reopening a finalised item is not available yet." is updated to point at the reopen action.
# Provenance: F1's event record (SCRUM-98) moved to W11 and does not exist yet. Record the reopen through one helper that writes an item_reopened history row with the actor, reason and superseded annotation ids — the pattern of record_item_taken (app/services/task_history_recorder.py:66) — so F1 migrates it in one place.
# One reopen function, shared with SCRUM-99's Return outcome, e.g. reopen_task_item(db, item, *, actor_id, reason, cause). It does no permission check: the owner's reopen route checks MANAGE_PROJECT, and the adjudication route checks ADJUDICATE. cause tells an owner's reopen from an adjudication's Return in the history.
# Frontend: a Reopen button on the finalised-item view, shown to the project owner only, asking for a reason. The superseded answer is shown in the item's history. The view is in components/task-item-workspace-sheet.tsx, which PR #43 (SCRUM-114) and PR #44 (SCRUM-113) rewrite — build the button after both merge.
# Tests:
#* refused: a reviewer's or annotator's reopen (403), a reopen without a reason, a reopen of an item that is not canonicalized or whose task is not active (409);
#* the owner's reopen keeps the old answer as superseded and unchanged, and the item is offered again at 0 of N;
#* someone who annotated the earlier round submits again: a new version is created and the superseded annotation is unchanged;
#* a reopened AI-assisted item is not sent straight to review;
#* the history shows the reopen with its actor and reason.

Collaboration:
- SCRUM-116 (D1, D5, D8): refuses review decisions on a finalised item, which today lets a reviewer's reject reopen it by accident. It lands first: it closes the accidental path, this ticket adds the owner's.
- SCRUM-38 (F3): agree the supersession fields on day one — this ticket is their first writer.
- SCRUM-99 (E3, Yi): Return calls reopen_task_item once this lands. Until then it sets the item back to open work directly. Agree the signature on day one.
- SCRUM-24 (B4, Dishank, PR #41): the active-only rule and assert_task_accepts_work come from it. If #41 has not merged, build on its branch's function.
- SCRUM-114 / SCRUM-113 (PR #43, #44): the frontend part follows their merge.
{noformat}
```
