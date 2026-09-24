# #22 评审 —— 贴到 GitHub

2026-09-19。PR #22（SCRUM-2 worker）的评审，按 Request changes 提交。依据是完整评审
`../../reviews/W7/review-cs57-michael-scrum-2-ai-worker.md`。英文写。

**发出前已确认（2026-09-19，gh）**：#22 仍是 OPEN，head `53e612b`，没有评论和 review；base 仍是已合并的
`CS57-Michael-scrum-1-job-schema`。

**决定**（Hanchen，2026-09-19）：
- 结论为 Request changes。finding 1–3 合并前修，4–6 可在本 PR 里一起修，也可以留到后续。
- AI 输出按客户答复应作为 AI 自己提交的标注，这个缺口归 **SCRUM-46**（W8），`result_annotation_id` 列也一起在那里加。
- 由 Hanchen 自己贴：在 GitHub 上选 **Review changes → Request changes**，粘贴下面的正文。

**已发出**：2026-09-19 01:02（悉尼时间），以 Request changes 提交。GitHub 上的正文与下面逐字一致（gh 核对过）；#22 的 reviewDecision 为 CHANGES_REQUESTED。

---

## 评审正文

````
Request changes — three small fixes, each a few lines. The rest is follow-up.

**First, please retarget the PR to `main`.** Its base is still `CS57-Michael-scrum-1-job-schema`, which #21 has already merged, so merging as it stands would land the worker on that branch, not on `main`.

The structure is right. The model call runs outside any transaction, and a test proves it. Claiming an item is a conditional `UPDATE` settled by row count. #19's finalised-item guard is applied to AI writes. The `inline` default keeps the PR inert until someone switches it on. I checked the description's claims and they hold: 267 passed + 138 subtests at `53e612b`; clean merges with `main` and #19 (276 + 147); and all three mutation checks fail the tests you said they would.

The weak point is the lease, which is what makes Option B worth choosing over A. The first three findings below are all about it. I reproduced each one with your own test fixture.

## Fix before merge

### 1. A worker whose lease has expired can still write its result

`record_result` and `_finish` load the job row by id and write whatever this worker concluded, without checking it still holds the lease. The lease is 300 s, and one model call can take 60 s × 3 with the SDK's retries, longer on audio or video. So this can happen:

```python
a = claim_next_item(db, worker_id="A", lease_seconds=1)
ctx_a = load_execution_context(db, a)
reclaim_expired_leases(db, now=datetime.now(UTC) + timedelta(hours=1))  # A's lease lapses mid-call
b = claim_next_item(db, worker_id="B", lease_seconds=300)
record_result(db, load_execution_context(db, b), _result())   # -> succeeded
record_result(db, ctx_a, _result())                           # -> skipped, overwrites B
```

| B recorded | A then records | Final job row | Batch |
| --- | --- | --- | --- |
| `succeeded`, draft d1 | `skipped` (B's draft counts as meaningful) | `skipped`, `result_draft_id = NULL`: d1 is unlinked | `completed` |
| `dead_letter` | `skipped` | `skipped` | `completed`: the failure is gone |

The second row is what schema doc §3 rules out: `dead_letter` "never collapses into 'completed'".

**Fix:** only close a job if this worker still holds its lease. For example, `UPDATE … WHERE id = :id AND status = 'running' AND lease_owner = :worker_id`, with the draft insert in the same transaction and rolled back when no row matches. Pass `worker_id` through `ItemExecutionContext`. One test: after B has finished, A's stale `record_result` changes nothing.

### 2. `max_attempts` is never enforced

Every claim increments `attempt_count`, and `reclaim_expired_leases` returns an expired item to `queued` whatever its count. Nothing reads `max_attempts`. In my probe, after six claim-raise-reclaim cycles the item had `attempt_count = 6` and `max_attempts = 3`, and it was `queued` again in a batch still `running`. That batch never closes.

This can really happen: `AIPreannotator.__init__` calls `resolve_annotation_schema(...)` outside the `try` that guards analyzer selection, and the task's schema can change after enqueue (finding 4). This is a bound, not SCRUM-3's retry policy. Backoff and transient-versus-permanent stay in SCRUM-3.

**Fix:** in `reclaim_expired_leases`, move rows with `attempt_count >= max_attempts` to `dead_letter` (`last_error_kind = 'unknown'`, a short `last_error`) and roll up their batches. One test.

### 3. A database error during reclaim ends the worker

In `Worker.run_forever`, `reclaim_expired_leases(db)` sits outside the `try` that protects `run_once`, so an `OperationalError` there ends the process. On SQLite, `database is locked` is exactly the transient error your #20 §4 measured, and the `ai-worker` compose service has no `restart:` policy. The queue would stop and nobody would notice.

**Fix:** move the reclaim inside the `try`, with `db.rollback()` in the `except`. Consider `restart: unless-stopped` on the compose service too.

## Should fix (here or in a follow-up)

### 4. The batch records one model, and the worker runs another

`enqueue_batch` snapshots `provider` and `model`, which is the point of the snapshot (schema doc §2.1). But `load_execution_context` rebuilds the task from the live row, and `update_task` lets `ai_provider`, `ai_model`, `annotation_mode` and the label schema change at any task status. Enqueue, change `ai_model`, then claim: the batch says `configured-model`, but the worker runs `changed-model`. **Fix:** run with the batch's `provider` and `model`, by overriding them on the task object passed to `AIPreannotator`. Also, §2.1 calls `schema_snapshot` the *resolved* output schema, but `enqueue_batch` stores the raw `task.label_schema`, which can be `None`. Store the resolved schema, or change the doc. This bears on C1's criterion that the assistant and version behind a suggestion are recorded.

### 5. `release_lease` on shutdown can never run (minor)

`run_once`'s `finally` resets `_current_item_job_id` to `None` before `run_forever`'s `finally` checks it, so the branch is unreachable. It does no harm, because SIGTERM/SIGINT let the current item finish. Delete the branch and say that in the docstring.

### 6. Double sleep after an error (nit)

After an exception, the loop sleeps in the `except` and again in `if status is None`. Drop one.

## Scope: AI output as the AI's own submission (SCRUM-46, not this PR)

The worker still writes AI output the way the inline path does: a pending draft with `created_by=None`, which the first human save takes over. Under the client's answer (AI output is submitted, goes straight to review, authored by the AI) and the decision that it counts toward required annotators, that gap belongs to **SCRUM-46**. There, a successful item becomes a submitted annotation authored by the AI, goes through SCRUM-26's atomic submission path, and is linked from a new `result_annotation_id` column on `ai_item_jobs`. The table now exists on everyone's database, so that column needs a `migrate_db_schema()` step. For this PR, please add one sentence to the description: *"AI output still lands as an unclaimed pending draft; submission as the AI's own version is SCRUM-46."*

Two more things for the description:
- **Per-item concurrency.** Still one item at a time, so up to ~17 h for 1,000 items (C2 subtask 6, W8). Say whether bounded parallel calls go to SCRUM-3 or SCRUM-46.
- **The domain error you suggested instead of `HTTPException(409)`:** agreed. It goes in SCRUM-26, not #19, and `record_result`'s `except HTTPException` switches over in the same change.

## Heads-up

- Kanishka (SCRUM-48) and Dishank (SCRUM-43) also change `task_service.py`. Yours touches only the draft loop in `register_dataset`, and it merges cleanly with `main` today. Whoever merges second re-runs the suite.
- `HEJ_AI_EXECUTION_MODE=worker` on SQLite waits for WAL + `busy_timeout`, the condition I set on #20. SCRUM-94's first merge now carries both, so please agree the details with Parth.
````

---

## 发出后

1. 在 tracker 上，这条 PR 的 `Review OK?` 保持空白，等 Michael 修完再复审。
2. Michael 修完后，重跑 probe 1–5 和测试套件，确认修复，再批准。
