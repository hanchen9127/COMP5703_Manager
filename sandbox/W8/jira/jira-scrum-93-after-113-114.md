# SCRUM-93 — description update after SCRUM-114 (#43) and SCRUM-113 (#44)

2026-09-30. SCRUM-93's description (board download of 2026-09-29, last edited 27/09) is out of date in two places
and misses three things the two panel PRs changed under Kanishka's list. Replace the whole description with the
block below; the first line stays, because `tracking-sync` maps the ticket to D8 by it.

**What changed and why**

| # | Where | Change |
| --- | --- | --- |
| 1 | Split paragraph | SCRUM-113 is no longer "mid-semester break": it moved into W8 and is PR #44. SCRUM-114 is PR #43 |
| 2 | "Built on" paragraph | PR #33 and #35 are merged into `main` (`ffaac66`, `4d3352f`) and SCRUM-48 is Done, so "neither is on main yet" and "Blocked by SCRUM-48" are gone |
| 3 | New bullet | The review list hands the panel nothing: the Review tab reads the review queue itself and lets the reviewer choose a submission (#44). The old plan to pass `awaiting_review_annotation_ids` in is dropped |
| 4 | New bullet | Hydration no longer falls back to a colleague's draft (#44), so the existing `TaskItemTable` annotator and value columns show nothing of other people's work to a reviewer ("Unassigned"). The list must take "who is on it" from the queue numbers, not from `draftOwnerName` or draft text |
| 5 | New paragraph | #44 adds `ApiWorkQueueItem` (the fields the panel reads) to `lib/api/task-items.ts`. Define the full row in `lib/api/work-queues.ts`; once #44 merges, `task-items.ts` imports it from there instead of keeping two types |
| 6 | `working_count` bullet | Also counts the pending draft left behind when a returned item is resubmitted (known limitation of #43) |

**Not in the description** (a message instead): on Windows, the Docker web container does not pick up code changes
(`next dev --turbopack` on a bind mount); `docker compose restart frontend` after each change or branch switch.

**On the board:** paste the block inside the ticket's noformat block. Points, sprint and assignee unchanged.

```
Related to user story D8

FRONTEND

Rescoped 2026-09-17: there is no assignment. No "assign to" controls, no assignee column, no reassignment UI. The screen shows what the viewer may take and how full an item already is.

Split 2026-09-26: this ticket is the available-work list. The item workspace panel (the "X is annotating" block, S10, refusals on submit, peers' answers in the panel) is SCRUM-114, PR #43. Choosing which submission to review is SCRUM-113, PR #44 (moved into W8). To keep the branches apart, this ticket does not change components/task-item-workspace-sheet.tsx, lib/task-workspace-data.ts or lib/api/task-items.ts: opening an item from the list uses the panel as it is.

# An available-work list, filtered to what the viewer's role allows, with an item opening directly from it. Annotators read GET /tasks/{task_id}/work-queue/annotate, reviewers /work-queue/review, arbitrators /work-queue/adjudicate.
# Progress on each item reads as, for example, 2 of 3 — how many have submitted against how many the task requires.
# Annotate is greyed out once the item has as many submissions as the task requires. The annotate queue only returns items the viewer can take, so ask for the rest too: GET /tasks/{task_id}/work-queue/annotate?include_unavailable=true also returns the task's other unfinished items, each with can_annotate false. Grey Annotate out wherever can_annotate is false. The row says why: 3 of 3 submitted, has_ai_annotation, or submitted_by_you.
# The item shows how many people are working it and how many have submitted, so a viewer can see it is covered without opening it.
# Use the queue rows for the numbers. Each row is a WorkQueueItemRead: every TaskItemRead field, plus required_annotators, submitted_count (people only), working_count (people holding an unsubmitted draft), has_ai_annotation; on the annotate queue can_annotate, rework and submitted_by_you; and on the review queue awaiting_review_annotation_ids. "2 of 3" is submitted_count of required_annotators.
# Take who is on an item only from those numbers. Since PR #44 the item hydration shows a viewer only their own draft, never a colleague's, so draftOwnerName and the draft text are empty for other people's work (the existing TaskItemTable's annotator column reads "Unassigned" there). Do not name annotators in the list: several may work one item, and annotators must not see each other's work.
# AI-assisted items: when has_ai_annotation is true, the AI's first pass is done and the item is in review, not open for annotation (decision of 2026-09-25). Show it as AI-annotated rather than as "0 of N". An item whose AI run failed shows no AI annotation and fills up with people like a human-first item.
# Rework: work a reviewer returned or rejected comes back in its annotator's annotate queue, and only theirs (decision of 2026-09-26: reject means redo, like a return). Mark it as rework in the list; the row's rework field says so, with no extra request per row.
# The review list opens an item and hands the panel nothing else: the panel's Review tab reads the review queue itself, lists the item's submissions awaiting the reviewer by author, and records the decision against the one chosen (PR #44). Show the number awaiting (the length of awaiting_review_annotation_ids) if useful.
# working_count counts every pending draft with an author, including the draft a refused submission leaves behind and the draft saved before a returned item was resubmitted. So an item can show "1 working" when nobody is. Hiding "working" on a full item is enough for now.

Built on SCRUM-48's queue API (PR #33 and #35, both merged into main). PR #44 adds ApiWorkQueueItem to lib/api/task-items.ts with only the fields the panel reads. Define the full row type in lib/api/work-queues.ts; once #44 merges, task-items.ts imports it from there instead of keeping two types.

Every limit shown here is enforced in the API as well — a greyed-out button is the display of the rule, not the rule.

The required count is of human submissions: the AI's annotation is not one of the 3 (client answer, 2026-09-21).
```
