# 给 Yi 的通知 —— SCRUM-48 的"领取"记录与 SCRUM-62 的衔接

2026-09-19。Kanishka 的 SCRUM-48 本周会写"领取 item"的历史记录，Yi 的 SCRUM-62（F1）在 W8 要把它迁成
provenance 事件。方案 A 当天定下，要在两人各自动手之前告诉 Yi。中文写，团队内部沟通用中文。

**依据：** `message-kanishka-SCRUM-48-questions.md` 第 2 点；`roadmap.md` 里"SCRUM-48 (API) ↔ SCRUM-62"
那一行（2026-09-19 已写入）。

---

## 消息正文

```
Yi，同步一下 Kanishka 的 SCRUM-48 里跟你的 SCRUM-62（F1）直接相关的部分，免得两边各做一套。

**1. "领取 item"现在由 Kanishka 先记录，你在 W8 迁移。**
现在不存在指派，也没有认领接口。"领取"沿用 SCRUM-25 的草稿归属，只会在两个地方发生：
- 用户新建自己的草稿（`create_draft`）；
- 用户第一次保存时认领一份无主草稿（`draft_service.py` 里的 `_claim_fields` 写入了 `created_by`）。

Kanishka 这周会在这两个位置写一条 `draft_started` 历史记录，统一通过一个 helper 调用（暂定名
`record_item_taken(db, task_item, user_id)`）。她开 PR 时会把 helper 的名字和字段发给你。
**SCRUM-62 请直接把这个 helper 迁到 F1 的事件记录上，不要另外找调用点，也不要再记一遍。**
字段如果不合 F1 的需要，趁她 PR 还没合并时提出来，改起来最便宜。

**2. 提交事件已经存在。**
提交目前记录为 `draft_submitted`，写在 `routes/drafts.py` 里，但它和提交本身不在同一个事务里。
我这周做的 SCRUM-26 会把提交改成一个事务，而且很可能把这条记录也并进去（还没最终定）。
F1 的提交事件请挂在同一个位置，到时候我告诉你最终的接入点。

**3. schema 变更的顺序要对齐。**
Kanishka 要给 task 加"需要几份提交"的新列，你要加事件表，Parth 的 SCRUM-94 这周定 schema 变更以后怎么落到
Postgres 上。三个人开工前先把迁移顺序对一下。

**4. 一个已知偏差，先知道就行，不用你处理。**
目前第一个人保存时会接管 AI 那份无主草稿，这也会被记成一次"领取"。等 Michael 的 SCRUM-46（W8）把 AI 的
输出改成 AI 自己的提交，这个问题就没有了。另外 AI 给出的建议本身也应该是一条 F1 事件——Michael 的 worker
（PR #22）和现在的 inline 路径都没有记录它，F1 的事件列表里请加上这一项。
```

---

## 发出后

**2026-09-19 已发送。**

1. Kanishka 开 PR 时，确认她把 helper 的名字和字段发给了 Yi。
2. SCRUM-26 的 D1（`draft_submitted` 是否并入提交事务）定下来以后，告诉 Yi 最终的接入点。
