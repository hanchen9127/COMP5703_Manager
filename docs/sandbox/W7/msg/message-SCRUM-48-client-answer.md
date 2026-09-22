# 给 Kanishka 的通知 —— SCRUM-48 缩范围

2026-09-17。**她正在写这张票，尽快发。** 两件事叠在一起：客户 2026-09-17 对问题 1 的答复
（`../../info/client-question.md`），以及同日确定的范围变化——**task owner 不需要把工作指派给具体的
标注人账号**。指派整体取消，SCRUM-48 的一半内容不用做了。

英文写，和之前跟她的沟通一致。

---

## 消息正文

```
Kanishka — SCRUM-48 has shrunk, and I'd rather tell you today than at the meeting, since you're
in the middle of it. Short version: **no assignment at all**. Please stop on the assignee field
and the assignment endpoints.

**The scope change.** A task owner does not hand specific items to specific annotator accounts.
There is no assignee, no individual or bulk assignment, and no reassignment. Work is self-served:
a person opens the platform and takes what their role allows them to take.

**What replaces it, and what SCRUM-48 is now.**

1. Role-checked queue endpoints — annotation work, review work, adjudication work — each
   returning what the caller may actually take.
2. A required-annotators count on the task, chosen at creation.
3. A server-side refusal: once that many people have submitted on an item, the next submission
   fails. Drafts themselves are not capped — anyone may start one, and each person sees only
   their own.
4. A full item drops out of the annotate queue.

That last one comes from the client's other answer this week: an item needs N human annotators,
each keeps their own draft, and progress reads 2 of 3, then 3 of 3 with Annotate greyed out.

**Independence now lives in the queue.** With no assignee, "a reviewer never reviews their own
work" and "a second review never goes back to the first reviewer" have to be conditions in the
queue query. That is the part D7 depends on in W9, so it is worth getting right now rather than
bolting on later. Worth a word with Parth — he builds the sampling on top of it.

**What this costs you.** The assignee model and the bulk endpoints are gone, which is most of
what was estimated. The queue query, the task-level count and the submission refusal are new.
Roughly a wash, maybe lighter — but if it doesn't feel that way once you're into it, say so at
the meeting and we'll rebalance rather than you absorbing it.

**Heads-up on `submit_draft`.** The submission limit is a refusal inside
`DraftService.submit_draft`. I'm in that same function this week for SCRUM-28 and SCRUM-26 —
refusing writes to a finalised item, and making submission atomic. Yours is a third refusal in
the same place. Let's agree the order they run in and who merges first, rather than resolving it
as a conflict afterwards.

I've rewritten D8's acceptance criteria and will update the SCRUM-48 and SCRUM-93 descriptions
on the board today, so the ticket doesn't still read "add an assignee".
```

---

## 发出后要做的

1. **更新 Jira 上 SCRUM-48 和 SCRUM-93 的描述。** 两张票现在都逐字抄了 D8 的旧验收标准，通篇是指派。
   按新的 D8 改写。
2. **告诉 Parth。** D7 在 W9 要"把抽样的 item 路由给独立的第二审核人"，现在改成"进入排除第一审核人的
   第二审核队列"。他本周的 SCRUM-51 切片不受影响，但 W9 的部分设计变了。
3. **周会上过一遍 D8 的新验收标准**——这是一条 P0 story 的重写，不是措辞调整。

## 已经做完的

| 文件 | 改动 |
| --- | --- |
| `story_src.csv` / `user-stories.html` | D8 整条重写（标题、story、5 条验收、7 条子任务、related issues），D7 子任务 1 和 4 改为队列口径 |
| `roadmap.md` | 依赖表 D8 行、W7 的 SCRUM-48 行和退出检查、W8 第 1/2 组和协作表、W9 第 1 组和排序说明 |
| `mission.md` | 风险表"工作指派不存在"那行重写为"没有队列 + 不做指派"，并说明 RQ-607 是被重新解释而非满足 |
| `client-question.md` | 问题 1 的解读、F4/F6 已答复 |

---

## 补充（2026-09-18）—— AI 的提交占名额

缩范围的消息已经发出；这是后续补充，单独发。

```
Kanishka — one addition to SCRUM-48, decided today: an AI submission counts toward the task's
required number of annotators.

So when the queue and the submission limit count submissions on an item, an AI-authored
submission is one of them. With one annotator required, an AI submission fills the item and it
never appears in the annotate queue at all; with three, the AI takes one place and two people
take the rest. A failed AI run submits nothing, so its place stays open.

Michael's worker writes those AI submissions, and your count reads them — so the two of you are
building against the same number. Worth a five-minute check with him that you're reading the
same rows.
```

## SCRUM-48 看板描述要加的一句

缩范围后的描述第 3 条是 "A submission is refused once that many people have already submitted on
the item..."。改成：

```
# A submission is refused once the item already has as many submissions as its task requires — an AI submission counts as one of them. Drafts are not capped — anyone may start one, and each person sees only their own.
```

"that many people" 要改掉，因为 AI 不是人——原句会让人以为只数人类的提交。
