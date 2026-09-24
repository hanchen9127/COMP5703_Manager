# 两条消息 —— PR #29 落地后对 SCRUM-48 和 SCRUM-62 的影响

2026-09-23。来自 PR #29（SCRUM-46）的评审：
`../../../reviews/W8/review-cs57-michael-scrum-46-ai-trigger.md`。

两件事都不是新决定，是 #29 把原来的规则变成了**具体要写的代码**：

- **Kanishka**：R1-4"AI 不占人工名额"9/22 已经告诉过她了。#29 之后，AI 的提交长什么样才确定下来——
  annotation 的 `created_by` 是 NULL，它挂着的 draft 也是无主的。她的计数必须排除这两种行，
  否则规则写对了、SQL 还是会把 AI 算进去。她的 SCRUM-48 还没开 PR，现在说最便宜。
- **Yi**：9/19 告诉过他提交事件挂在 `routes/drafts.py`。#29 的 AI 提交**不走路由**，直接调
  `DraftService.submit_draft`，所以按原计划做，F1 里会没有 AI 首轮标注的事件。这是 Record 支柱的洞。

Kanishka 用英文（跟 9/22 那条一致），Yi 用中文（跟 9/19 那条一致）。

---

## To Kanishka (SCRUM-48)

```
Hi Kanishka — a follow-up to the 22/09 correction (the AI's first pass doesn't count toward the required annotators). Michael's PR #29 is what makes that concrete, so here is exactly what an AI submission looks like in the database once it merges:

- an annotation row with `created_by IS NULL`, and
- the draft it came from, `status = "submitted"`, also with `created_by IS NULL`.

Machine output has no human author, and `created_by` is a foreign key to `users`, so NULL is how an AI annotation is identified for now (a real AI author identity is SCRUM-38, later).

So the submission count needs `created_by IS NOT NULL` on whichever rows you count — otherwise the rule is right and the SQL still gives the AI one of the human places. The same goes for the refusal: the (N+1)-th *human* submission is refused, and the AI's submission is never refused by the limit.

One consequence worth knowing: on an AI-assisted task the item reaches `annotated` with zero human submissions, so the queue will see items in `annotated` that still need their full count of human work. If your queue query filters on item status, please check that case.

Nothing to change today if you haven't written the count yet — I'd rather say it before the PR than after. #29 isn't merged; I've asked for one fix first.
```

---

## 给 Yi 的消息（SCRUM-62 / F1）

```
Yi，接 9/19 那条的后续，关于提交事件的接入点。

那时我说提交记录在 `routes/drafts.py`，F1 的事件挂同一个位置。Michael 的 PR #29 让这句话不再完整：
AI 的提交**不经过路由**，worker 直接调 `DraftService.submit_draft`（`ai_batch_service.record_result` 里）。
所以只挂路由的话，AI 的首轮标注在 F1 的事件里是完全没有的——而在 AI 辅助的任务上，那是 item 进入审核的
唯一一次提交。

两点请你按这个做：

**1. F1 的提交事件要覆盖两条路径**：人工提交（路由）和 AI 提交（worker）。我在 #29 的评审里请 Michael 在
worker 的同一个事务里补一条历史记录，operator 用 `requested_by`（触发这次 run 的人）。如果他加了，你的事件
挂在它旁边即可；如果留成后续项，就由 SCRUM-62 自己在 worker 里补。等 #29 合并后我告诉你最终落在哪边。

**2. 事件的 actor 要能表示"不是人"。** AI 的 annotation 没有作者（`created_by` 是 NULL，因为它是 users 的
外键），模型记在 `annotation_data.metadata.ai` 的 `provider` / `model` 里。所以 F1 的事件如果 actor 只能是
user_id，AI 那条要么记成触发的人、要么记不下来。W8 先用"触发的人 + 事件类型标明是 AI 提交"是可以接受的，
但请把它写成一个已知取舍——把系统动作和用户动作真正分开是 F4（SCRUM-40）。

#29 还没合并（我提了一处要先修），所以现在不用改代码，只是别把接入点定死在路由上。
```

---

## 发出后

1. #29 合并当天，告诉 Yi 那条历史记录最终由谁写（Michael 的 PR 还是 SCRUM-62）。
2. Kanishka 开 SCRUM-48 的 PR 时，复核计数是否排除了 `created_by IS NULL` 的行。
