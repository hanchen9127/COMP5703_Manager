# Jira 新票草稿 —— PostgreSQL 迁移（Parth，W7）

2026-09-17 决定。Parth 自己提出本周能完成，条件是限定范围和时机。挂在 **A3**（"我能自己把平台跑起来"）
下面——先例是 SCRUM-81/82/84 这些基础设施票都挂在 A2–A4 上。

**票已建好：`SCRUM-94`**（2026-09-17，Task，Parth，In Progress，sprint `W7 Lock down review data`）。
票号已填回 `../../specs/roadmap.md`。`Jira.csv` 已重新下载，`tracking-sync` 的报告确认它会被加进 A3 的
`scrum` 列。下面是当时提交给看板的内容，留作记录。

---

## 字段

| 字段 | 值 |
| --- | --- |
| Issue Type | **Task** |
| Summary | 见下 |
| Priority | Medium（看板上这个字段实际没在用） |
| Assignee | **Parth** |
| Status | To Do → In Progress |
| Sprint | **W7 Lock down review data** |

## Summary

```
Infrastructure: run on PostgreSQL while keeping SQLite working
```

## Description

```
Related to user story A3

Every option for C2's job queue adds a long-running writer alongside requests, and SQLite
serialises writers: a second connection that tries to write gets "database is locked" after
about 5 seconds (measured on main). Moving to PostgreSQL removes that ceiling before the
1,000-item batch in W8 runs into it.

Scope, agreed 2026-09-17:

# Both databases keep working. SQLite is not dropped — 10 test files touch a database, and each builds its own in-memory SQLite engine, and rewriting them is a bigger job than this migration. PostgreSQL is an opt-in DATABASE_URL.
# Add the PostgreSQL driver as a dependency. The project has none today.
# Set the session time zone to UTC on connect. Every existing DateTime column is written with a timezone-aware datetime.now(UTC), which both drivers send as timestamptz; Postgres then converts it into the session's time zone when storing it in a column without one. Nothing fails — the times are simply wrong.
# Add a PostgreSQL service to compose.yaml, and update the setup and reset instructions so a new member can still get running in one step.
# Write down what happens to a schema change from now on. migrate_db_schema() returns early for anything that is not SQLite, so on Postgres there is no path for adding a column at all — create_all() only creates missing tables. Either adopt Alembic, or agree that dev databases are disposable and re-seeded on every schema change. Both are acceptable; leaving it unstated is not.
# The suite passes on SQLite exactly as before, and the same suite is run once against PostgreSQL by hand, with the result recorded in the PR.

Timing: this must land in W7, ahead of W8, where four groups change the schema. If it slips
past the weekend it waits for the W9 boundary rather than landing mid-week — it changes
app/core/database.py, which every other ticket runs on.

Not in scope: moving production hosting, data migration of anyone's existing dev database
(re-seed instead), and Alembic itself unless decision 5 chooses it.
```

---

## 排期影响

| | 之前 | 之后 |
| --- | --- | --- |
| Parth W7 | SCRUM-51 切片 + SCRUM-86 = 2.5u | SCRUM-51 切片 + 迁移 = **3u** |
| W7 总量 | 20u | **20.5u** |
| W8 总量 | 14u | **15u**（SCRUM-86 并入第 2 组，该组 2u → 3u） |

**代价要说清楚：SCRUM-86 关的是 Critical 缺陷 7**（管理员可以自己升级、自己裁决自己的工作），
推到 W8 意味着这个 Critical 再开一周。W7 的退出检查已经改成"issue 2 关闭，issue 7 移到 W8"。

1.5u 是我按"一次性代码改动约 4 个文件 + 双数据库验证 + 文档"估的，**和 Parth 确认**。

---

## 周会上要提的

1. **Critical 缺陷 7 推迟一周**，需要全队知情。
2. **迁移合并当天要通知所有人**：它改 `app/core/database.py`，任何有未合并分支的人都要当天合 `main`
   并重跑测试。roadmap 的 W7 紧密协作表已经加了这一行。
3. **第 5 条决定（Alembic 还是重建）在 PR 里定下来。** W8 有四个组要改 schema，他们当天就要知道
   自己的 ALTER 该往哪写。

---

## 2026-09-18 改范围 —— 替换看板上的描述

Michael 读了票之后提了四点，全部采纳（决定 2026-09-18）：

| 变化 | 原因 |
| --- | --- |
| **挂 C2，不挂 A3** | 票的动机就是 C2 的任务队列。SCRUM-81/82/84 挂 A 类是因为它们修的是 A 类自己的验收标准，SCRUM-94 不修 A3 的任何一条。还能消掉"A3 已完成但票未完成"的同步噪声 |
| **加 CI**（第 7 条） | 两个数据库、没有自动检查，从合并那天起任何人都可能悄悄弄坏 Postgres。这等于部分重开已搁置的 A1——只重开这一件，其余仍搁置 |
| **必须有不依赖 Docker 的搭建路径**（第 4 条） | compose 从 Docker Hub 拉镜像，而至少一名成员的环境连 Docker Hub 都不通——compose 现在对他本来就不可用 |
| **别动 SCRUM-1 的 `UtcDateTime`**（第 3 条） | 会话级 UTC 和列类型是互补关系：列类型不管会话怎么设都成立 |

负载 1.5u → **2u**（CI 约 0.5u），Parth 本周 3u → **3.5u**（到上限，合规）。W7 总量 20.5u → **21u**。

### 新描述（整篇替换）

```
Related to user story C2

C2's job queue needs a second writer alongside the API, and SQLite serialises writers: a second
connection that tries to write gets "database is locked" after about 5 seconds (measured on
main). Moving to PostgreSQL removes that ceiling before the 1,000-item batch in W8 runs into it.

Scope, agreed 2026-09-17 and extended 2026-09-18:

# Both databases keep working. SQLite is not dropped (allow fallback) — 10 test files touch a database, and each builds its own in-memory SQLite engine, and rewriting them is a bigger job than this migration. PostgreSQL is an opt-in DATABASE_URL.
# Add the PostgreSQL driver as a dependency. The project has none today.
# Set the session time zone to UTC on connect. Every existing DateTime column is written with a timezone-aware datetime.now(UTC), which both drivers send as timestamptz; Postgres then converts it into the session's time zone when storing it in a column without one. Nothing fails — the times are simply wrong. This complements SCRUM-1's UtcDateTime column type rather than replacing it: the column type holds whatever the session is set to, so leave it in place.
# Document a setup path that does not need Docker — a native PostgreSQL install plus DATABASE_URL — alongside any compose service. Docker is optional in the README, and Docker Hub is blocked in at least one member's environment, so a compose service alone would leave them unable to run Postgres at all.
# Write down what happens to a schema change from now on. migrate_db_schema() returns early for anything that is not SQLite, so on Postgres there is no path for adding a column at all — create_all() only creates missing tables. Either adopt Alembic, or agree that dev databases are disposable and re-seeded on every schema change. Both are acceptable; leaving it unstated is not. This has to be settled before W8, when four groups change the schema.
# The suite passes on SQLite exactly as before.
# Add a CI workflow that runs the backend suite on every push, once on SQLite and once against a PostgreSQL service container. Without it, Postgres compatibility can break silently from merge day, since nobody runs Postgres by default. It is also the only way a member who cannot run Postgres locally sees their code run on it.

Timing: this must land in W7, ahead of W8, where four groups change the schema. If it slips
past the weekend it waits for the W9 boundary rather than landing mid-week — it changes
app/core/database.py, which every other ticket runs on.

Not in scope: moving production hosting, data migration of anyone's existing dev database
(re-seed instead), PR templates, CODEOWNERS or branch protection, and Alembic itself unless
item 5 chooses it.
```

### 改挂 C2 的顺序（不能颠倒）—— ✅ 2026-09-18 已完成

看板首行已改为 `Related to user story C2`；A3 的 `scrum` 已手动去掉 SCRUM-94；`tracking-sync` 已把它加进 C2，并按规则把 Parth 加进 C2 的分配。**但看板描述的正文还是旧的**——第 3、4、7 条的新内容还没贴上去。

原步骤留作记录：

`tracking-sync` 的 `scrum` 列**只增不减**，而且它是从看板描述读映射的。所以：

1. **先**在看板上把描述替换成上面这段（首行变成 `Related to user story C2`）；
2. 重新下载 `Jira.csv`；
3. **再**手动从 `story_src.csv` 的 A3 `scrum` 列删掉 `SCRUM-94`（这是 `tracking-sync` 做不到的唯一一步，已获同意）；
4. 跑 `tracking-sync`，它会把 SCRUM-94 加进 C2。

如果先删第 3 步再改看板，下一次同步会按旧描述把它重新加回 A3。

---

## 2026-09-18（第二次）—— 看板上还要改两条，外加时间安排

**发现的问题**：碰数据库的测试文件是 **10 个，不是 22 个**。22 是 `grep -r` 把 `__pycache__` 里 12 个 `.pyc`
也数了进去。更要紧的是这 10 个**全都写死了内存 SQLite 引擎**，没有 `conftest.py`，也没有测试读
`DATABASE_URL`。所以按原来第 7 条的写法，Postgres 那个 CI job 会一直是绿的，但一行 Postgres 都没测到。

**决定**（2026-09-18）：SCRUM-94 负责把这 10 个文件全部改完；Parth 本周只做 SCRUM-94（SCRUM-51 切片已移到
W8）；负载 2u → **3u**；**分两次合并**。

### 第 1 条 —— 整条替换

```
# Both databases keep working. SQLite is not dropped (allow fallback): it stays the default, and PostgreSQL is an opt-in DATABASE_URL.
```

### 第 7 条 —— 整条替换

```
# Make the tests reach PostgreSQL, then run them in CI. The 10 test files that touch a database all hard-code an in-memory SQLite engine, so pointing DATABASE_URL at Postgres changes nothing and a Postgres CI job would pass without testing Postgres at all. Add a shared pytest fixture that takes the engine from DATABASE_URL (in-memory SQLite when unset) and isolates each test, move the 10 files onto it, and add a CI workflow that runs the backend suite on every push, once on SQLite and once against a PostgreSQL service container.
```

### Timing 段 —— 整段替换

```
Timing: two merges. The first — the database.py changes, the driver, the UTC setting, the shared
fixture, the CI workflow and the item 5 decision — lands before W8, because it changes what every
other ticket runs on and four groups change the schema that week. The second — moving the 10 test
files onto the fixture — touches tests only and may land early in W8.
```

改完重新下载 `Jira.csv`，我核对一遍。

---

## 2026-09-19 —— 默认数据库改为 PostgreSQL（看板第 1 条再换一次）

Parth 问 Docker 部署能否默认 PostgreSQL，我确认**不只 Docker，全局默认 PostgreSQL**，SQLite 降为回退
（决定 2026-09-19）。这推翻了 09-18 版第 1 条里的"SQLite stays the default, PostgreSQL is an opt-in
DATABASE_URL"。Parth 已在看板上留了评论。

要点：

- 没设 `DATABASE_URL` 时先连 Postgres；**驱动没装或服务器连不上**才回退 SQLite。
- 回退时要在启动日志里说明用的是哪个库——否则连不上 Postgres 的人会以为自己在测 Postgres。
- 显式设置的 `DATABASE_URL` 永远优先，所以 SQLite 仍可以直接指定。
- **测试不受影响**：第 7 条的共享 fixture 在 `DATABASE_URL` 未设置时仍用内存 SQLite。
- 第 4 条（不依赖 Docker 的搭建路径）更重要了：现在它就是默认路径。

### 第 1 条 —— 整条替换

```
# Both databases keep working, and PostgreSQL is now the default everywhere, not only under Docker (changed 2026-09-19). With no DATABASE_URL set, the platform connects to PostgreSQL first and falls back to SQLite only when PostgreSQL is not available (the driver is not installed or the server cannot be reached), and logs at startup which database it is running on, so a fallback is never silent. compose.yaml starts PostgreSQL and points DATABASE_URL at it. An explicit DATABASE_URL always wins, so SQLite can still be chosen directly. The tests are unaffected: the shared fixture in item 7 still uses in-memory SQLite when DATABASE_URL is unset.
```

改完重新下载 `Jira.csv`，我核对一遍。

---

## 2026-09-20 —— PR #24 已合并；第 1 条改为快速失败，并补第 8 条

PR #24（`486d4a2`，合并为 `1c0c874`）把整张票一次做完了，原定的"分两次合并"没有发生——测试文件在同一个 PR
里就搬上了共享 fixture，所以 W8 那次合并不再需要。review 在 `../../../reviews/W7/review-cs57-parth-scrum-94.md`。

看板还要改两处：

**第 1 条 —— 实现和描述对不上。** 描述写的是"连不上 Postgres 就回退 SQLite，并在启动日志里说明"，代码做的是
"没配就报错退出"。**决定 2026-09-20：保留代码的做法，改描述。** 静默回退会让人以为自己在测 Postgres——这正是
第 7 条那条 CI 要防的事；代价是所有人合并当天都要改 `.env`，已单独通知。

**第 8 条 —— 补记 SQLite pragma。** 这条 2026-09-18 在 PR #20 review 上就定了，但只写进了 `roadmap.md`，
没进看板描述，Parth 因此在第一版里没做，是我们漏传。现在 `486d4a2` 已经实现，补进描述留档。

### 第 1 条 —— 整条替换

```
# Both databases keep working, and PostgreSQL is the default everywhere, not only under Docker (changed 2026-09-19; fail-fast confirmed 2026-09-20 at review of PR #24). The platform builds its URL from POSTGRES_USER, POSTGRES_PASSWORD and POSTGRES_DB in apps/hej-api/.env. There is no automatic fallback: with no PostgreSQL credentials and no DATABASE_URL, startup stops with an error naming what to set, because a silent fallback would let someone believe they are testing PostgreSQL when they are not. SQLite stays fully supported and is selected explicitly with DATABASE_URL=sqlite:///./hej_dev.db, which always wins over the components. The tests are unaffected: the shared fixture in item 7 still uses in-memory SQLite when DATABASE_URL is unset.
```

### 第 8 条 —— 新增

```
# Set PRAGMA journal_mode=WAL and an explicit busy_timeout on every SQLite connection, alongside the existing foreign_keys=ON. Decided 2026-09-18 at review of PR #20 and recorded only in roadmap.md until now: this is the condition on which C2's Option B — a worker polling the job tables — was agreed, because a separate worker is the second SQLite writer that otherwise fails with "database is locked" after about 5 seconds. WAL applies to file databases; an in-memory database keeps its memory journal mode.
```

### Timing 段 —— 整段替换

```
Timing: landed in one merge on 2026-09-20 (PR #24), ahead of W8's four schema changes. The second merge planned for the test files was not needed — they moved onto the shared fixture in the same PR.
```

票可以移到 Done。合并当天的 `.env` 通知还要发给全队——文案见 review 文件的 **Before merging** 第 1 条。
