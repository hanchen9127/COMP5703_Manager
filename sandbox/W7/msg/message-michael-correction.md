# 给 Michael 的更正 —— CI 暂时测不到 Postgres

2026-09-18。第二轮回复里说"你 push 的所有代码都会在真实 Postgres 上跑"，这句当时不成立：碰数据库的 10 个测试
文件全都写死了内存 SQLite。另外"22 个测试文件"是数错的。英文写，尽量短。

最后一段撤回第一轮回复里"请改 PR #20、#21 那两行记录"的要求——按 tracker 的约定，`Review OK?` 为空
表示 PR 已开、等待评审，他的记录本来就是对的。

倒数第二段（AI 占名额）：如果你在 PR 评论里已经告诉过他，就删掉。

---

## 消息正文

```
One correction to my last message. I said everything you push runs on real Postgres in CI — that
isn't true yet. The 10 test files that touch a database all hard-code an in-memory SQLite engine,
so a Postgres CI job would pass without testing Postgres at all. (And it's 10, not 22 — my count
picked up __pycache__.)

SCRUM-94 now fixes it, and it's Parth's only ticket this week: a shared fixture that takes the
engine from DATABASE_URL, the 10 files moved onto it, and CI running the suite on both. Two
merges — database.py, the fixture and CI before W8; moving the old tests early in W8. Write
SCRUM-2's worker tests against that fixture and they'll run on Postgres in CI from the first merge.

One more thing, in case it didn't reach you through the PR comment: an AI submission counts toward
a task's required annotators. So the worker's result is a submitted annotation the count sees,
which answers the result_draft_id question. A failed run submits nothing, so its place stays open.

And please ignore what I said earlier about fixing your tracker rows for #20 and #21 — they were
right. A row is logged when the PR opens and Review OK? stays blank until review passes, so they
were pending, not wrongly marked merged. My sync script had that convention backwards; it's fixed.
```
