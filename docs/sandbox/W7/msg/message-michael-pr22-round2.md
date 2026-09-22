# PR #22 第二轮 —— Approve + 后续项（给 Michael）

2026-09-21。回复他 `21fe863` 和 `37a7fc2` 两次提交，以及对应的两条 PR 评论。原 review 的 6 项和 schema 快照
都已核实修好。**决定（Hanchen，2026-09-21）：现在 approve**，因为 worker 默认关闭（`HEJ_AI_EXECUTION_MODE`
默认 `inline`），合并不改变任何现有行为，而且 Michael W8 的 SCRUM-3、5、46 都建立在这个 PR 上。剩下的
R1、R2、R3、R7 转为后续项，放进 SCRUM-3；R8 本来就归 SCRUM-3。附一条硬性条件：R3 和 R7 完成之前，不在
PostgreSQL 上打开 worker 模式，也不跑多个 worker。"the client resolved both"的出处照问。

英文写，作为 **Approve review** 发（`gh pr review 22 --approve --body-file …`），而不是普通评论，这样 PR 上
之前那条 CHANGES_REQUESTED 会被取代。

**依据：** `../../reviews/W7/review-cs57-michael-scrum-2-ai-worker.md` 的 *Update — `37a7fc2`* 和
*Re-review — `21fe863`* 两节。所有结论都在全新的 `uv` 环境里、以 PR 自己的测试 fixture 复现过。

**已发出（2026-09-21）：** Hanchen 在 PR #22 上提交了 Approve，正文**不含最后的 "One question"**（"the client resolved both" 的出处没有问）。其余与下文一致。

---

## Review 正文

```
Approving. Thanks, Michael — this is a thorough round. I re-ran everything from scratch (fresh `uv`
env): 408 + 147 at `37a7fc2`, and my four original probes now all end the way they should. The lease
fence, the `max_attempts` bound, the reclaim inside the `try`, the batch driving provider/model/schema,
and the compose fix you found yourself — all confirmed. I also checked that re-validating a resolved
schema is a no-op for all 11 subtypes and all 11 presets, so the snapshot really does drive the run.

I'm approving now rather than asking for another round because the worker is off by default
(`HEJ_AI_EXECUTION_MODE=inline`), so merging changes nothing that runs today, and SCRUM-3, 5 and 46 all
build on this. The items below are real, though. They are all about the lease and retry, so please
take them into **SCRUM-3**, where you'll be in this code anyway.

**One condition until 3 and 4 are done: don't switch on worker mode on PostgreSQL, and don't run more
than one worker.** Both are safe on the current single-worker setup.

**Follow-ups for SCRUM-3**

1. **The ownership half of the fence has no test.** Your test lets B *finish* before A returns, and
   then `status = 'running'` alone stops A. If I remove only `lease_owner == :worker_id`, all 16 tests
   stay green — yet the case it exists for goes wrong: A returns while B is **still running**, A's
   stale `succeeded` is accepted, and B's real outcome is later refused as `lease_lost`. The code is
   right today; please add that test so it stays right: A records while B holds the lease →
   `lease_lost`, job still `running`, owner B.

2. **`worker_id` is read at load time, not at claim time.** `load_execution_context` sets
   `worker_id=item_job.lease_owner`, i.e. whoever owns the lease *when the context is loaded*. If the
   lease moves between the claim and the load, A's context carries B's id and passes the fence. The
   window is a few milliseconds against a 300 s lease, so this is about correctness rather than
   likelihood. `run_once` and `run_next_item` already have the claiming worker's id — pass it in.

3. **The worker tests don't run on PostgreSQL.** `test_ai_batch_worker.py` builds its own `sqlite://`
   engine (`_engine()`, `StaticPool`) instead of using `conftest.py`'s `empty_engine`, so CI's
   PostgreSQL job never reaches the claim `UPDATE` or the fenced `UPDATE` — the two statements the whole
   worker rests on. Please move the `db` fixture onto the shared one (keeping `autoflush=False`).

4. **The sweep's UPDATEs don't re-check expiry.** `reclaim_expired_leases` selects expired rows, then
   requeues with `WHERE id IN (…) AND status = 'running'`. On PostgreSQL (READ COMMITTED, now the default
   after #24), if another sweep requeues the item and worker B claims it between that SELECT and that
   UPDATE, this UPDATE re-evaluates against B's row, still sees `running`, and erases B's fresh lease.
   The fence stops wrong data, but B's model call is wasted and an attempt is burned — enough to
   dead-letter a healthy item early. On SQLite with WAL the stale sweep errors instead, so this is
   PostgreSQL-only and needs two workers. Fix: add `lease_expires_at < :moment` to both UPDATEs in the
   sweep, plus a test with that interleaving.

5. **A subtype change fails slowly and silently.** When the subtype changes after enqueue, the item does
   end as `dead_letter`, but the `ValueError` from `AIPreannotator.__init__` only reaches the log, and
   the row says "Abandoned after 3 attempt(s): the lease expired without a result". Nobody reading
   `ai_item_jobs` can tell a schema mismatch from a crashed worker, and it takes three lease periods
   (~15 min) for an error that is permanent before any model call. Building the analyzer inside the
   recorded path and dead-lettering at once as `permanent`, with the real message, is SCRUM-3's error
   classification.

**Nit.** The new comment in `load_execution_context` says the live task "isn't consulted at all", but
`resolve_annotation_schema` still validates the snapshot against the live `task_subtype` — as your PR
comment says in its next paragraph. Worth making the code comment match when you're next in there.

**One question.** Your last comment says "the client resolved both". I don't have a client answer on
the schema snapshot or on `release_lease` in our records, and client decisions come through me — where
did that come from? The change itself is right, and is what my notes would have asked for. I just want
the PR to say who decided it, so the record holds up later.

`release_lease` staying is fine. Parallel calls as their own ticket — agreed, please draft it.
```

---

## 发出后

1. **SCRUM-3 的描述里加上 1–5 项**，并写明那条条件：R3（第 3 项）和 R7（第 4 项）完成之前，不在 PostgreSQL
   上打开 worker 模式、不跑多个 worker。
2. 如果 Michael 说明了"client resolved"的出处，写进 review 文件的 *Update — `37a7fc2`* 一节。
3. 他做 SCRUM-3 的 PR 时重跑：只删 `lease_owner` 的变异测试（这次必须失败）、第 4 项的交错测试、PostgreSQL CI。
