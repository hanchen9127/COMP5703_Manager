# 给 Michael 的第二轮回复 —— Option B、CI、本地 Postgres、改挂 C2

2026-09-18，精简版。他的五点全部采纳，SCRUM-2 选 Option B 同意（附条件），AI 提交占名额已定。英文写。

**2026-09-18 已核对**：看板上 SCRUM-94 的六项（挂 C2、第 3/4/5/7 条）和 SCRUM-48 的 AI 计数句都已到位，可以发。

---

## 消息正文

```
Thanks — all five land. What I've changed in SCRUM-94:

- **Item 5** is now due before W8, not just "in the PR" — four groups add columns that week.
- **CI** is now item 7: the suite runs on every push, on SQLite and on a Postgres service
  container. It also fixes your local problem better than anything local could — GitHub's runners
  aren't behind your firewall, so everything you push runs on real Postgres. (Reopens A1 for that
  piece only.)
- **A setup path without Docker** (native install + DATABASE_URL). Note compose already pulls
  python and node from Docker Hub, so it was never available to you anyway. If the native install
  fails too, SQLite locally plus CI is a fine place to be.
- **Your UtcDateTime stays** — item 3 now says the session fix complements it.
- **Moved to C2.** You're right: 81/82/84 went on A-stories because they fixed those stories'
  criteria; 94 exists for C2's queue.

**SCRUM-2 on Option B — agreed**, with one condition from your own measurement: SQLite stays
supported, and there a separate worker is exactly the second writer that hit `database is locked`.
So B needs WAL and an explicit busy_timeout. Both are in `database.py`, which Parth is also
changing — please agree with him which PR carries them. If B doesn't fit C2's 2u in W8, say so at
the meeting. And please test the lease path: kill a worker mid-claim and check the items come back.

**Decided today: an AI submission counts toward a task's required annotators.** I read the client
the other way last time — this is the reading that makes "no human annotator involved" hold (one
required: the AI fills it). So the worker's result is a submitted annotation that Kanishka's count
sees, which answers the `result_draft_id` question. A failed run submits nothing, so its place
stays open. I've told Kanishka.
```

---

## 发出后

**告诉 Parth** SCRUM-94 新增的两条（非 Docker 路径、CI）和 `UtcDateTime` 那句，以及 WAL 由他和 Michael 商定落点。
