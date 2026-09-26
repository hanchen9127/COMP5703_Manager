# Splitting SCRUM-93 into two non-conflicting tickets

2026-09-26, Hanchen's decision. SCRUM-93 (3 points, W8) is split in two, divided by the code each part
touches so the two branches do not edit the same files:

| | Ticket | Owner | Points | Sprint | Touches |
| --- | --- | --- | --- | --- | --- |
| **A** | SCRUM-93, narrowed: the available-work list | Kanishka | 1.5 | W8 | New files: the list component, a `lib/api/work-queues.ts` client, the page that hosts it |
| **B** | New ticket: the item workspace panel | Hanchen | 1.5 | W8 | `components/task-item-workspace-sheet.tsx`, `lib/task-workspace-data.ts`, `lib/api/task-items.ts` |

SCRUM-113 (the reviewer chooses which submission to review, 1 point) goes to the **mid-semester break** (Hanchen's choice, 2026-09-26), unassigned for
now. It edits the same panel as B, after B.

**Board state these drafts start from** (the `download` of 2026-09-26 03:38): SCRUM-93 has 3 points,
W8, no assignee, and the post-split text from `jira-scrum-93-queue-inputs.md`. SCRUM-113 has 1 point,
**W8**, no assignee.

**Updated 2026-09-26 after review of the pasted text:** bullets 3 and 7 and the row fields now use
`include_unavailable`, `can_annotate`, `rework` and `submitted_by_you`, which PR #35 adds (Commit 12). SCRUM-113
is in the mid-semester break. Re-paste block A on SCRUM-93.

**On the board:**
1. **SCRUM-93**:
   - replace the description with **A** below;
   - Summary `Work queues: available-work list and progress (WEB)`;
   - points **1.5**;
   - assignee **Kanishka**.
2. **Create** a ticket from **B** below: points **1.5**, sprint **W8**, assignee **Hanchen** (Jason Wang).
3. **SCRUM-113**: move it to the **W9** sprint. Link it as blocked by **B**, since it builds on the same
   panel, as well as by SCRUM-93.
4. Re-download `Jira.csv`, then give me B's key for `roadmap.md`.

Paste each block inside the ticket's noformat block. Keep the first line: `tracking-sync` maps the ticket
to its story by it.

## A — SCRUM-93 (Kanishka)

```
Related to user story D8

FRONTEND

Rescoped 2026-09-17: there is no assignment. No "assign to" controls, no assignee column, no reassignment UI. The screen shows what the viewer may take and how full an item already is.

Split 2026-09-26: this ticket is the available-work list. The item workspace panel (the "X is annotating" block, S10, refusals on submit, peers' answers in the panel) moved to SCRUM-114 (Hanchen). Choosing which submission to review is SCRUM-113 (mid-semester break). To keep the two branches apart, this ticket does not change components/task-item-workspace-sheet.tsx, lib/task-workspace-data.ts or lib/api/task-items.ts: opening an item from the list uses the panel as it is.

# An available-work list, filtered to what the viewer's role allows, with an item opening directly from it. Annotators read GET /tasks/{task_id}/work-queue/annotate, reviewers /work-queue/review, arbitrators /work-queue/adjudicate.
# Progress on each item reads as, for example, 2 of 3 — how many have submitted against how many the task requires.
# Annotate is greyed out once the item has as many submissions as the task requires. The annotate queue only returns items the viewer can take, so ask for the rest too: GET /tasks/{task_id}/work-queue/annotate?include_unavailable=true also returns the task's other unfinished items, each with can_annotate false. Grey Annotate out wherever can_annotate is false. The row says why: 3 of 3 submitted, has_ai_annotation, or submitted_by_you.
# The item shows how many people are working it and how many have submitted, so a viewer can see it is covered without opening it.
# Use the queue rows for the numbers. Each row is a WorkQueueItemRead: every TaskItemRead field, plus required_annotators, submitted_count (people only), working_count (people holding an unsubmitted draft), has_ai_annotation; on the annotate queue can_annotate, rework and submitted_by_you; and on the review queue awaiting_review_annotation_ids. "2 of 3" is submitted_count of required_annotators.
# AI-assisted items: when has_ai_annotation is true, the AI's first pass is done and the item is in review, not open for annotation (decision of 2026-09-25). Show it as AI-annotated rather than as "0 of N". An item whose AI run failed shows no AI annotation and fills up with people like a human-first item.
# Rework: work a reviewer returned or rejected comes back in its annotator's annotate queue, and only theirs (decision of 2026-09-26: reject means redo, like a return). Mark it as rework in the list; the row's rework field says so, with no extra request per row.
# working_count counts every pending draft with an author, including the draft a refused submission leaves behind. So a full item can show "1 working" when nobody is. Hiding "working" on a full item is enough for now.

Built on SCRUM-48's queue API: PR #33, with the fixes in PR #35 stacked on it. Neither is on main yet. Blocked by SCRUM-48. The include_unavailable parameter and the can_annotate, rework and submitted_by_you fields arrive with PR #35's commit of 2026-09-26.

Every limit shown here is enforced in the API as well — a greyed-out button is the display of the rule, not the rule.

The required count is of human submissions: the AI's annotation is not one of the 3 (client answer, 2026-09-21).
```

## B — new ticket (Hanchen)

Summary: `Work queues: item workspace panel — independence, refusals and S10 (WEB)`

```
Related to user story D8

FRONTEND

Split from SCRUM-93 on 2026-09-26: this ticket is the item workspace panel that an item opens in. The available-work list is SCRUM-93 (Kanishka). To keep the two branches apart, this ticket changes only components/task-item-workspace-sheet.tsx, lib/task-workspace-data.ts and lib/api/task-items.ts, and does not build the list.

# The existing "X is annotating this item" block is removed: several annotators per item is the rule now, each with their own draft.
# Fix S10: on a returned or rejected item, Save draft must keep what the annotator typed.
# An annotator does not see other annotators' submissions on the item before submitting their own (client answer, 2026-09-21). The API already hides them (PR #35); the panel must not show another person's draft, read-only or otherwise, and must not fall back to one when the viewer has none.
# Show the refusals the API gives, in its own words. A submission on a full item is refused (409, "Human annotation submission limit reached for this item (2/2)."), and so is a person's submission on an AI-assisted item the AI has annotated (409). The panel must not report either as submitted, nor update the item as if it were.

S10, found in SCRUM-26's manual walkthrough: on a returned item, editing the answer and clicking Save draft reverts the editor to the previously submitted answer and saves that instead; submitting directly works. Two causes:
- selectDraftForViewer (lib/task-workspace-data.ts) prefers the viewer's submitted draft over their pending one, and after rework an item has both. Prefer the viewer's own pending draft.
- The editor's initialising effect (components/task-item-workspace-sheet.tsx) is keyed on the whole item object, so any re-render discards unsaved typing. Key it on item.id, or leave the editor alone once it is dirty.
With several annotators per item, picking the wrong draft could show another annotator's work.

Already done in PR #35, so not part of this ticket: the panel sends the submission it shows (from #34), and shows "awaiting_other_submissions" without marking the item approved.

Built on PR #35 (independence on reads, refusals on submit). SCRUM-113 (mid-semester break) edits this same panel afterwards.
```
