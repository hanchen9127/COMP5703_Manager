# SCRUM-93 — updated description after PR #35

2026-09-26. SCRUM-93 (Kanishka, W8) builds the screens on SCRUM-48's queue API. That API changed shape
and rules in Hanchen's fixes, PR #35, which is stacked on Kanishka's PR #33. The 24/09 description
(`../../../shared/Jira.csv`) still says only "Built on SCRUM-48's queue API". It says nothing about
what the rows carry, how review now works per submission, or what the screen has to do that the API
cannot.

**Sources:** the PR #35 description (`../../../reviews/W8/pr-cs57-hanchen-scrum-48-fixes.md`), the
walkthrough's Observations (`../tests/manual-test-SCRUM-48.md`), and `api_surfaces.md` → "Work queues",
"When an accept completes the item" and "Annotator independence on reads" on
`CS57-Hanchen-scrum-48-fixes` (`38e7f4f`). The web app was checked on the same commit: nothing calls
the queue routes yet, the annotate page lists items from `GET /tasks/{id}/task-items`, and S10 is
still open (`selectDraftForViewer` still prefers the viewer's submitted draft,
`lib/task-workspace-data.ts:372`).

**How to paste:** replace the whole description, inside the existing noformat block. The text below
carries no `{noformat}` of its own. The first line, `Related to user story D8`, must stay:
`tracking-sync` maps the ticket by it.

**Split on 2026-09-26 (Hanchen): SCRUM-93 → 3 points, and choosing a submission to review becomes its
own 1-point ticket in W9** (`jira-new-review-choose-submission.md`). The board already carries the first
version of this text, pasted before the split. To bring it in line:
1. **Delete the bullet** that starts "Review each submission separately."
2. **Add this paragraph** after "Built on SCRUM-48's queue API … Blocked by SCRUM-48.":
   `Not in this ticket: choosing which of an item's submissions to review (reviewer side). Split out on 2026-09-26 into its own 1-point ticket in W9. Until it lands, the review panel shows one submission per item.`
3. **Story points: 2.5 → 3**, for bullets 8–12 below.

The block below is already the post-split text, so pasting it whole works too.

**What changed from the 24/09 text:**
- bullets 1–7 are kept, with bullet 1 now naming the routes;
- bullets 8–12 are new;
- the "Built on" paragraph now says which PRs, and that they are not on `main` yet;
- a new paragraph points to the split-out ticket.

```
Related to user story D8

FRONTEND

Rescoped 2026-09-17: there is no assignment. No "assign to" controls, no assignee column, no reassignment UI. The screen shows what the viewer may take and how full an item already is.

# An available-work list, filtered to what the viewer's role allows, with an item opening directly from it. Annotators read GET /tasks/{task_id}/work-queue/annotate, reviewers /work-queue/review, arbitrators /work-queue/adjudicate.
# Progress on each item reads as, for example, 2 of 3 — how many have submitted against how many the task requires.
# Annotate is greyed out once the item has as many submissions as the task requires.
# The item shows how many people are working it and how many have submitted, so a viewer can see it is covered without opening it.
# The existing "X is annotating this item" block is removed: several annotators per item is the rule now, each with their own draft.
# Fix S10: on a returned item, Save draft must keep what the annotator typed.
# An annotator does not see other annotators' submissions on the item before submitting their own (client answer, 2026-09-21) — the screen shows only the 2-of-3 count, never the answers.
# Use the queue rows for the numbers. Each row is a WorkQueueItemRead: every TaskItemRead field, plus required_annotators, submitted_count (people only), working_count (people holding an unsubmitted draft), has_ai_annotation and, on the review queue, awaiting_review_annotation_ids. "2 of 3" is submitted_count of required_annotators.
# AI-assisted items: when has_ai_annotation is true, the AI's first pass is done and the item is in review, not open for annotation (decision of 2026-09-25). Show it as AI-annotated rather than as "0 of N". An item whose AI run failed shows no AI annotation and fills up with people like a human-first item.
# Show the refusals the API gives, in its own words. A submission on a full item is refused (409, "Human annotation submission limit reached for this item (2/2)."), and so is a person's submission on an AI-assisted item the AI has annotated (409). The screen must not report either as submitted.
# Rework: work a reviewer returned or rejected comes back in its annotator's annotate queue, and only theirs (decision of 2026-09-26: reject means redo, like a return). Mark it as rework. The viewer's own submitted draft on the item tells the screen it is theirs to redo.
# working_count counts every pending draft with an author, including the draft a refused submission leaves behind. So a full item can show "1 working" when nobody is. Decide how to show it; hiding "working" on a full item is enough for now.

Built on SCRUM-48's queue API: PR #33, with the fixes in PR #35 stacked on it. Neither is on main yet. Blocked by SCRUM-48.

Not in this ticket: choosing which of an item's submissions to review (reviewer side). Split out on 2026-09-26 into its own 1-point ticket in W9. Until it lands, the review panel shows one submission per item.

Already done in PR #35, so not part of this ticket: the review panel sends the submission it shows (from #34), and an accept that leaves the item open returns next_ui_status "awaiting_other_submissions", which the panel shows without marking the item approved.

Every limit shown here is enforced in the API as well — a greyed-out button is the display of the rule, not the rule.

The required count is of human submissions: the AI's annotation is not one of the 3 (client answer, 2026-09-21).

S10, found in SCRUM-26's manual walkthrough: on a returned item, editing the answer and clicking Save draft reverts the editor to the previously submitted answer and saves that instead; submitting directly works. Two causes:
- selectDraftForViewer (lib/task-workspace-data.ts) prefers the viewer's submitted draft over their pending one, and after rework an item has both. Prefer the viewer's own pending draft.
- The editor's initialising effect (components/task-item-workspace-sheet.tsx) is keyed on the whole item object, so any re-render discards unsaved typing. Key it on item.id, or leave the editor alone once it is dirty.
With several annotators per item, picking the wrong draft could show another annotator's work.
```

## After pasting

1. Re-download `Jira.csv` (`tracking-sync download`), so the local snapshot has the new text.
2. Send Kanishka the queue-row message (`../msg/message-kanishka-scrum-48-queue-rows.md`) if it has not
   gone yet. It covers bullet 8 in more detail.
3. **Load.** Done 2026-09-26: 2.5 → 3 points, with the reviewer-side choice split out (see above).
   `roadmap.md` carries both: W8 group 1 at 3u, and W9 group 7 at 1u.
