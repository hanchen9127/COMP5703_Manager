# 给 Kanishka 的消息 —— 队列行结构（SCRUM-93 可以开工）

2026-09-25。修复分支 `CS57-Hanchen-scrum-48-fixes` 的 commit 6a 写完后发。按计划
（`../plans/plan-SCRUM-48-fixes.md` → Commit 6a）"行结构一写完就告诉她"，让 SCRUM-93 不用等合并。
英文写，和之前跟她的沟通一致。

---

```
Hi Kanishka, the queue row shape for SCRUM-93 is on CS57-Hanchen-scrum-48-fixes now, so you can build the screen against it before the fixes merge into your branch.

All three routes (GET /tasks/{task_id}/work-queue/annotate, /review, /adjudicate) return a list of WorkQueueItemRead. That's every TaskItemRead field, plus:
- required_annotators: the task's count, e.g. 3
- submitted_count: people who have submitted on the item. The AI isn't counted, so "2 of 3" is submitted_count of required_annotators
- working_count: people holding an unsubmitted draft on it
- has_ai_annotation: true when the AI's first pass succeeded. On an ai_assisted task, such an item is in the review queue, not the annotate queue
- awaiting_review_annotation_ids: review queue only, the submissions that reviewer can act on. Pass one as annotation_id to the review action once #34 is in

Two things you'll run into:
- The routes returned 500 on 1e4eb4a whenever a queue had an item in it. task_item_to_read reads location_ref, which TaskItemDB doesn't have. That's fixed; the rows now carry location_ref from the data pointer.
- The draft list is back to returning every draft to reviewers, and to annotators after they've submitted. Before they submit, annotators get their own drafts plus the AI's and any unclaimed placeholder. So S10's selectDraftForViewer will see the AI draft again.

The next commit changes which items the review queue offers (each submission separately), but the row shape stays the same.
```
