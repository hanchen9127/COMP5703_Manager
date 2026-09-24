# 给 Michael 的回复 —— C2 两个决定 + PR #20/#21 评审

2026-09-18。回答他 2026-09-17 提的两个阻塞问题，给出 PR #20、#21 的评审意见，并告诉他删除缺陷已由
我们登记。英文写，和之前跟他的沟通一致。

**回复前提**（都已确认）：
- PR #20、#21 自评审以来没有新提交，都未合并；SCRUM-1、SCRUM-2 都是 In Progress。
- Postgres 迁移已立项：**SCRUM-94**，Parth，本周。这改变了他文档里"数据库是硬约束"那部分的前提。
- 客户 2026-09-17 答复：AI 标注直接算 submitted，版本作者是 AI model，无需人工初稿。

---

> **2026-09-18 更正**：下文最后一段要求 Michael 改 PR #20、#21 的记录，**这是错的**。tracker 的约定是 PR 开出时就登记，
> `Review OK?` 为空表示等待评审——他的记录是对的。撤回写在 `message-michael-correction.md` 里。

## 消息正文

```
Michael — answers to both questions, then the review. Two things changed since you wrote the
docs, and one of them moves the ground under §4, so I'll lead with those.

## Your two questions

**1. Does a run need to survive an API restart? — No, not as a C2 requirement.**

C2's acceptance criteria are: trigger and keep working, retry transient failures and surface
permanent ones, and show progress. None of them says a run survives a restart. So it is a
preference, not a requirement, and Option A stays admissible.

One condition: the *state* must survive even when the process doesn't. Your SCRUM-1 tables
already give that — after a restart the rows are still there, so a `running` row can be moved
back to `queued` on startup and picked up again. Please include that resume-on-start step in
SCRUM-2 rather than leaving a run stranded in `running` for ever.

**2. The database — Postgres is in scope, and it lands this week.**

Parth offered to do the migration and I accepted: it is SCRUM-94, In Progress, assigned to him,
and it must merge before W8, where four groups change the schema. Conditions:

- **SQLite keeps working.** 22 test files build their own in-memory SQLite engine, so Postgres
  is an opt-in DATABASE_URL, not a replacement.
- The PR also settles what happens to a schema change from now on — Alembic, or dev databases
  are disposable and re-seeded. `migrate_db_schema()` returns early for anything that is not
  SQLite, so today Postgres has no path for adding a column at all.

**What that does to your §4.** The binding constraint you measured — one writer, `database is
locked` after 5 s — goes away on Postgres. Option B stops being "a second writer fighting
SQLite" and becomes ordinary. So the queue choice is now a cost question rather than a
contention question, and question 1's answer already says durability is not required. My read:
Option A plus resume-on-start is still the cheapest thing that satisfies C2, and W8 has 2u for
finishing C2. But you are the one building it — if B is close in cost now that the database is
no longer the ceiling, take B. Either way, decide it in the PR and write the reason down.

Your `db_types.py` work goes from prudent to load-bearing: the UTC handling is now on the path
everyone runs, not a hypothetical.

## The client answer that changes SCRUM-1's shape

On 2026-09-17 the client settled how AI annotation is treated:

> if the task uses AI annotation, the output is treated as submitted and goes straight to the
> reviewer; the version's author is the AI model; no human annotator is involved.

That has three consequences for your two PRs:

1. **`ai_item_jobs.result_draft_id` may be pointing at the wrong thing.** If an AI run produces
   a submitted annotation authored by the AI, the job's result is an annotation, not a draft.
   Worth deciding before the column is merged — even if the answer is "both", the FK should say
   so.
2. **Your open question 1 mostly dissolves.** The race you described — a worker creating drafts
   while an annotator claims them — assumed AI output lands as an unclaimed draft that a human
   takes over. Under the client's answer the AI's version is its own and nobody claims it.
3. **One new question, for you and Kanishka.** A task now sets how many human annotators an item
   needs, and a submission is refused once that many have submitted. Does an AI submission count
   against that number? I read the client as saying it does not — the AI replaces the human
   first pass rather than occupying one of its slots — but it needs to be explicit, because both
   your worker and her queue API act on it.

Also relevant: assignment is gone entirely (client decision, 2026-09-17). There is no assignee;
work is self-served from role-checked queues. Nothing in your PRs depends on it, but it removes
the "who is this item assigned to" half of your open question 1.

## Review — PR #21

Three worth changing:

1. **`UtcDateTime` binds aware -> naive but has no `process_result_value`.** Values read back are
   naive, while the rest of the codebase uses `datetime.now(UTC)`. `job.lease_expires_at <
   datetime.now(UTC)` in the worker raises `TypeError`. Your tests cover the bind direction only,
   which is why it doesn't show. This matters more now that Postgres is actually landing.
2. **`status` and `last_error_kind` are free-form strings** with the allowed values in a comment.
   That is the shape of issue 10, which G4 has just fixed for task items — an invalid status
   reaching the database. A StrEnum plus service-level validation is cheapest now, while the
   tables are still empty.
3. **Docs Sync is incomplete.** AGENTS.md asks for `domain_model.md`, `domain_model_relations.md`
   and `db_schema_strategy.md` as well as the blueprint.

Minor: `AiBatchJobDB` has no `updated_at` while `AiItemJobDB` does; no index on
`ai_batch_jobs.status`.

Merge order is fine as you describe it — the two branches touch different files, so #20 first
costs nothing. Worth saying plainly: the mutation testing (breaking the schema on purpose to
prove 7 of 17 tests fail) and the explicit verification boundary on Postgres are the most
careful work anyone has submitted this semester. The boundary statement in particular is what
made your Postgres claims reviewable rather than something I had to take on faith.

## Review — PR #20

The measurements are what make it decidable, and not recommending an option was the right call.
Three gaps:

- **Per-item concurrency isn't discussed.** The 17-hour figure is worst-case sequential.
  Whichever topology wins, 1,000 items in W8 needs bounded parallel model calls. That matters
  more for subtask 6 than A vs B does — and the calls are network-bound, so even on SQLite they
  never contended, as long as each DB write stays short.
- **No transition plan for the inline path** in `register_dataset`. Subtask 3 moves the assist
  call out; does anything keep working inline meanwhile, or does the old path go on the day the
  worker lands?
- **The options aren't costed against W8's budget.** C2's finish is 2u there.

Section 6 needs a short update now that Postgres is decided rather than deferred — SCRUM-94
picks up the session-time-zone fix you identified, so that part of §6 becomes "done elsewhere"
rather than "what would force the decision".

## The delete bug — filed, and you don't need to write it up

It is issue 30 in our defect register, hung off B4 (task lifecycle). No separate ticket: B4 already
has SCRUM-24, and whether a task holding review history may be deleted is part of the lifecycle that
story defines. Keep your time for SCRUM-1/2.

I reproduced it, and the root cause is one layer below your description: deleting a task fails
**even when its items have no annotation work at all**. The ORM emits `DELETE FROM data_pointers`
first, and `task_items.data_pointer_id` still references it, because nothing declares the
dependency between those two models. That is the first statement issued, so it fails before
cascades are even relevant.

Your point stands on top of it: once the ordering is fixed, drafts, predictions and escalations
each block deleting a task item in turn (annotations don't — they have an ORM cascade). Both
`DELETE /projects/{id}/tasks/{id}` and `DELETE /organizations/{id}/projects/{id}` return 500.

And I agree with your instinct that the real question is whether deleting a task with review
history should be allowed at all. The ticket's first acceptance criterion is that decision, not
the code.

## Two small things

- `assert_task_item_accepts_draft_writes()` raises `HTTPException`, which is the wrong shape for
  a background worker to catch. When SCRUM-26 lands I'll lift it into a domain exception the
  routes map to 409. PR #19 is still open and unmerged, so don't build on it yet.
- The tracker logs PRs #20 and #21 as merged; git says neither is, and neither records a
  reviewer. Could you fix those two rows? We've had the same thing three times now, and the
  client report is built from those rows.
```

---

## 发出后

1. **SCRUM-94 合并当天**，Michael 和所有人都要合 `main` 重跑测试——他的两个分支都碰 `db_models.py`。
2. **AI 是否占用标注人名额**这个问题要同时抄送 Kanishka，她的 SCRUM-48 要实现那个上限。
3. 缺陷 30 不建票（决定 2026-09-17），已记在 issues.md、mission 缺陷表和 B4 的 backlog 条目里。
