# SCRUM-113 — the reviewer chooses which submission to review (split from SCRUM-93)

2026-09-26. Split from SCRUM-93 by Hanchen when it was re-estimated (2.5 → 3 points), so that
SCRUM-93 stays within Kanishka's W8 capacity. Why the work exists:
- Since PR #35, an item holds one submission per annotator, and each is reviewed on its own.
- One reviewer may review every submission on an item.
- The review queue already returns `awaiting_review_annotation_ids`, the submissions the caller may act
  on now.
- But the review panel (`task-item-workspace-sheet.tsx`) shows the single draft `selectDraftForViewer`
  picks. It can review that one, and never reach the others on the same item. The walkthrough
  (`../tests/manual-test-SCRUM-48.md`, Part 3) has to use the helper script for the second submission.

**Board fields**

| Field | Value |
| --- | --- |
| Summary | `Review: choose which submission to review on a multi-annotator item (WEB)` |
| Type | Task |
| Story points | 1 |
| Sprint | Mid-semester Break (moved from W9 by Hanchen, 2026-09-26) |
| Assignee | picked at the weekly meeting (SCRUM-93 was split on 2026-09-26; see `jira-split-scrum-93.md`) |
| Links | blocked by SCRUM-93 and by SCRUM-114, whose file it edits next |

**Description** — paste inside a noformat block. The first line must stay: `tracking-sync` maps the
ticket to stories by it.

```
Related to user story D8, D4

FRONTEND

Split from SCRUM-93 on 2026-09-26. An item holds one submission per annotator, each reviewed on its own, and one reviewer may review every submission on an item they did not annotate (decisions of 2026-09-25). The review panel today shows one submission per item and cannot move to another.

# From a review-queue row (GET /tasks/{task_id}/work-queue/review), the reviewer sees the item's submissions that await them: awaiting_review_annotation_ids.
# The reviewer picks one. The panel opens it with GET /tasks/{task_id}/task-items/{item_id}/adjustment?annotation_id=<id>, which returns that submission's answer, its author and its own latest review.
# The decision is sent with that annotation_id, so it is recorded against the submission on screen.
# After a decision, the panel moves to the next awaiting submission on the item, or back to the queue when none is left. An accept that leaves the item open returns next_ui_status "awaiting_other_submissions" (already handled since PR #35).
# A reviewer who annotated the item is never offered it, and the API refuses naming a submission that is not current on the item (404). The screen needs no rule of its own for either.
# A web test: an item with two awaiting submissions; the reviewer decides on the second one, and the request carries its annotation_id.

Built on PR #35 (queue rows, per-submission review) and PR #34 (review names its annotation). Blocked by SCRUM-93, whose screens this extends.

D7 (SCRUM-51) samples items for a second review into this same per-submission review queue, so a second reviewer uses this screen too.
```

## After creating

1. Link it as blocked by SCRUM-93.
2. Re-download `Jira.csv`, then run `tracking-sync`: the new key maps to D8 and D4 by the first line.
3. `roadmap.md` W9 group 7 says "New ticket (split from SCRUM-93)". Replace that with the real key.
