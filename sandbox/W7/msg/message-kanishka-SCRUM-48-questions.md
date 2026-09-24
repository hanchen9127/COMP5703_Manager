# 给 Kanishka 的回复 —— SCRUM-48 的四个问题

2026-09-19。她在动手前确认了理解并提出四个问题。她列出的理解基本正确，只有一处前提不成立：
`is_item_finished()` 目前不存在于任何远程分支（Dishank 的 SCRUM-43 还没推送，他的分支最后一次提交是
9/12）。英文写，和之前跟她的沟通一致。

**依据：** `message-SCRUM-48-client-answer.md`（缩范围及 AI 计入名额）、`jira-rescope-SCRUM-48-93.md`、
`story_src.csv` 中的 D8、`roadmap.md` W7 行（2026-09-19 已写入下面问题 4 的分工决定）。

---

## 消息正文

```
Hi Kanishka — your summary is right. One correction, then the answers.

**`is_item_finished()` doesn't exist yet.** It's Dishank's SCRUM-43, still unpushed. Please agree
the signature with him today. Whoever merges first adds it; please don't duplicate the rule.

**1. Count:** yes. It's the number of distinct authors who have submitted on the item, AI
included. A resubmission by the same author doesn't add one, and a failed AI run adds nothing. Put
it in one helper that the queue and `submit_draft` both call. AI submissions arrive with Michael's
SCRUM-46 in W8. The new task column defaults to 1; agree the migration order with Parth
(SCRUM-94) and Yi (SCRUM-62).

**2. Taking:** no endpoint. Use the draft ownership from SCRUM-25. An item is "taken" when a user
creates their own draft, or when their first save claims an unowned draft (`_claim_fields`). It
already works for several annotators per item; the one-annotator limit is only the web app's,
which SCRUM-93 removes.
- "Working" count = distinct `created_by` on the item's pending drafts.
- At those two points, also write a `draft_started` history row through one helper
  (e.g. `record_item_taken`). Ownership alone loses the time and doesn't survive deletion. Yi
  migrates that helper to F1 events in W8, so send him its name and fields.
- Submission is already recorded as `draft_submitted`, so leave it alone.

**3. Endpoints:** yours to propose; document them in `api_surfaces.md` in the same PR. My
suggestion: `GET /tasks/{task_id}/queues/{annotation|review|adjudication}`, role-checked, with
each row carrying `required_submissions`, `submitted_count` and `working_count` for SCRUM-93. Keep
the query in a service. Yes, talk to Parth: he builds on it in W9 (D7 sampling, adjudicator
independence). Task-state filtering waits for B4.

**4. Independence:** yes. Build both exclusions into the review queue this week: no items the
reviewer submitted on, and no items they already reviewed. How many reviews an item needs comes
from the review policy, not the queue. The adjudicator queue only needs the role check for now.

Finally, the order of refusals in `submit_draft`. Once both our tickets land, it can reject a
submission for three reasons:
1. the item is finalised (my SCRUM-28, 409);
2. the draft isn't pending, e.g. it was already submitted (existing check, 400);
3. the item already has its required submissions (yours).

When more than one is true, the user only sees the first, so the order decides the message. A
finalised item is usually full as well, and "this item is finalised" tells the user more than "this
item is full", so I'd keep that order.

Checks 1 and 2 run before anything is written. Yours has to run inside the submission transaction
(SCRUM-26 makes submission one transaction), with the item row locked (`with_for_update()`).
Otherwise two people submitting at the same moment can both take the last place. Does that work
for you?
```

---

## 发出后

**2026-09-19 已发送。**

1. **roadmap 已改**（2026-09-19）：W7 的 SCRUM-48 行加入审核队列的两条排除规则和 `is_item_finished()` 的现状；
   W9 第 7 组、W8 的排序说明和 W9 退出检查改为"仲裁队列加第二审核队列"。
2. ✅ **Jira 上 SCRUM-48 的描述第 3 条**已改为 "as many submissions as its task requires — an AI submission counts as one of them"（2026-09-19 的 `Jira.csv` 已确认）。
3. ~~告诉 Parth~~ **不需要单独做**（2026-09-19 核对）：看板上 SCRUM-51 没有写独立性，SCRUM-52 已经只剩仲裁队列，SCRUM-48 第 5 条本来就包含两条排除规则，所以 Jira 不用改。Kanishka 会按第 3 点去找 Parth 对查询的结构，Parth 也会 review 她的 API PR，分工会在那时传达给他。
4. ✅ **提醒 Dishank**（2026-09-19 已发，`message-dishank-SCRUM-43.md`）：`is_item_finished()` 的签名今天和 Kanishka 定下来。
5. ✅ **告诉 Yi**（2026-09-19 已发，`message-yi-SCRUM-62-taking-events.md`）：Kanishka 的 SCRUM-48 会通过 `record_item_taken` 这个 helper 写 `draft_started` 历史记录（2026-09-19 选定方案 A）。SCRUM-62 把这个 helper 迁到 F1 事件上，不要另起一套。
