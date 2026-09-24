# #29 评审 —— 贴到 GitHub（Request changes）

2026-09-23。PR #29（SCRUM-46：trigger + AI 输出进入审核），以 **Request changes** 提交。依据是完整评审
`../../../reviews/W8/review-cs57-michael-scrum-46-ai-trigger.md`。英文写。

**决定（Hanchen，2026-09-23）：**
- 只有第 1 项（dead-letter 无法重跑）是合并前必须修的，其余可以留到后续。
- **AI 作者选 A**：这个 PR 保持 `created_by = NULL`，模型记在 `metadata.ai` 里；看板上 SCRUM-46 的第 2 条
  验收标准要改写，SCRUM-38 加上"AI 作为正式作者"。这两处看板修改由 Hanchen 做。
- 描述里"Decisions taken with the client"那 5 条**不追问出处**，当作他和客户私下讨论的设计。
- 合并顺序：先 #30，#29 rebase 到它上面再合。

**发出前确认：** 用 `gh pr view 29` 确认仍是 OPEN、head 仍是 `8397270`、还没有 review。head 变了就先重看。

---

## Review 正文

````
Request changes — one thing before merge, and the rest is follow-up.

The structure is right, and the lifecycle decision is argued rather than assumed. I checked the description's claims and they hold: 421 + 147 at `8397270`, CI green on SQLite and PostgreSQL. The submission runs inside the worker's transaction under the same lease check as the job row, so a lapsed lease really does discard the annotation with everything else — your `test_a_lost_lease_discards_the_annotation_as_well_as_the_draft` pins it. The pre-call precondition check is worth having on its own.

On the author question: **agreed, keep `created_by` NULL for now.** Inventing a user id would falsify the provenance record, and the model is still traceable through `annotation_data.metadata.ai`. I'm amending SCRUM-46's criterion 2 to "submitted by the AI, model recorded in `metadata.ai`", and adding "AI as a first-class author" to SCRUM-38, so the gap you flagged is owned somewhere rather than left in a PR description.

## Fix before merge

### 1. A dead-lettered item can never be re-run, so "retrying failures creates a new batch" doesn't work

A dead-lettered item keeps its failed draft: `pending`, `created_by NULL`, `revision_notes = "AI pre-annotation"`. `_has_meaningful_draft` counts that as annotation work, so `items_needing_ai` leaves the item out and `evaluate_item_precondition` would skip it anyway. With your own fixture:

```python
run_next_item(db, worker_id=WORKER, lease_seconds=LEASE_SECONDS,
              generate=lambda _c: _result(failed=True))   # -> dead_letter
items_needing_ai(db, "task_1")                            # -> []
start_run(db, task=_task(db), requested_by=7)
# AiRunConflictError: No task items need AI annotation: every item is finalised,
# already carries annotation work, or already has an AI annotation.
```

So a batch that hit a provider outage can never be retried, and the only way an affected item moves forward is a human claiming the AI's failed draft — the opposite of the route this ticket exists to build.

**Fix:** don't count the AI's own failed, unclaimed draft as annotation work — `created_by IS NULL` together with `metadata.ai.status == "failed"` — in both `items_needing_ai` and `evaluate_item_precondition`. Then decide what the new run does with the old failed draft: replacing it is simplest, keeping it leaves the item with two pending unclaimed drafts. One test: dead-letter an item, trigger a run, and it ends `succeeded`.

Worth doing together with #30, which relies on the same rule from the other side — its retry writes no draft *because* a failed draft counts as meaningful. Whichever merges second should keep both consistent.

## Should fix (here or as a follow-up)

### 2. An AI submission writes no history, and F1's event hook won't see it

A human submission writes a `TaskHistoryRecorder` `draft_submitted` row in the same transaction (`routes/drafts.py:254`), and SCRUM-62's provenance event hooks in at the same place (`routes/drafts.py:267`). The worker calls `DraftService.submit_draft` directly, so an AI submission leaves no history row and no event, and the trigger records no "AI run started" either. On a Record-pillar story that means the AI's first pass is missing from the item's history.

Suggested fix: write the history row inside `record_result`'s transaction with `requested_by` as the operator. F4 (SCRUM-40) separates system actors from user actors later. I'm telling Yi that SCRUM-62 has to hook the worker path, not only the route.

### 3. PostgreSQL dev databases need a reset after this merges

`migrate_db_schema()` returns early on anything other than SQLite — at #24 we settled that Postgres dev databases are disposable and re-seeded. Your migration check covers SQLite only, so please add a line to the description saying everyone on Postgres re-seeds after merging. I'll repeat it in the team message on merge day.

### 4. One sentence for `api_surfaces.md`

On a task registered in `inline` mode, every item already carries a pending unclaimed AI draft, so the trigger leaves them all out and a run there is refused as "nothing needs annotating". That's consistent, but a reader of the new section won't predict it.

## Heads-up

- **Kanishka, SCRUM-48.** Her submission cap must count human submissions only (client answer R1-4, which supersedes our 2026-09-18 decision that an AI submission took a place). After this PR an AI submission is an annotation with `created_by IS NULL` on a `submitted` draft that is also unowned, so her count has to exclude those rows. I'm telling her; flagging it here because it's the one thing your change makes easy to get wrong.
- **Merge order with #30.** #30 is approved and ready, so it goes first; then rebase this one on top, with finding 1 fixed against #30's retry rule. You offered to do that rebase — thanks.
````

---

## 发出后

1. 看板：改写 SCRUM-46 的第 2 条验收标准，SCRUM-38 加"AI 作为正式作者"。
2. 告诉 Kanishka（SCRUM-48）：提交计数要排除 `created_by IS NULL`。
3. 告诉 Yi（SCRUM-62）：provenance 事件要挂 worker 路径，不能只挂路由。
4. tracker 上 #29 这一行的 `Review OK?` 保持空白，等他改完再复审：重跑 dead-letter → 新 run 的测试。
