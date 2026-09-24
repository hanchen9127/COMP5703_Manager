# 给 Michael 的消息 —— guard 改为 domain error，#22 的 `except` 要同步

2026-09-19。SCRUM-26 的 Commit 2 已按他在 #22 里的建议，把 finalised-item guard 改成抛 `TaskItemFinalisedError`。
#22 的 `record_result` 仍用 `except HTTPException` 捕获这个 guard。两个 PR 谁先合并都可能出问题：如果 Commit 2
先合并而 #22 没改，已定稿的 item 就不会被标成 dead-letter，而是随 lease 过期被无限重试（review 发现 2）。英文写。

**依据：** `commits/commits-SCRUM-26.md`；`../../reviews/W7/review-cs57-michael-scrum-2-ai-worker.md` 的发现 2 和
"For Hanchen, as #19's author" 一节；`origin/CS57-Michael-scrum-2-ai-worker` 的 `ai_batch_service.py:345`（2026-09-19 核对）。

**已验证（2026-09-19）**：`620e7dd` 与 #22（`53e612b`）合并后，`test_finalised_item_is_dead_lettered_rather_than_retried`
失败。按下面的写法修改后：合并后 276 passed，#22 单独 267 passed。`str(HTTPException(409, "x"))` 得到的是 `"409: x"`，
所以正文用 `getattr(exc, "detail", None) or exc`，不能直接用 `str(exc)`。

**已发出**：2026-09-19 19:39（悉尼时间），作为 #22 的 comment，与下面正文一致（gh 核对过）。

---

## 消息正文

```
Hi Michael — I've taken your suggestion from #22: the finalised-item guard now raises a domain error
instead of HTTPException.

**What changed (SCRUM-26, Commit 2, stacked on #19):**
- `app.services.task_service.TaskItemFinalisedError(task_item)`, with `.task_item_id` and `.status`;
  `str(exc)` is the same message as before.
- `assert_task_item_accepts_draft_writes()` raises it. `DraftService` maps it to 409, so the routes
  are unchanged.

**What it means for #22:** `record_result` catches `HTTPException` (ai_batch_service.py:345). Once my
change lands, that no longer matches. A finalised item would then raise out of `run_once` and loop on
lease expiry instead of being dead-lettered. While you're fixing the review points, could you catch
both until mine merges?

    from app.services import task_service

    finalised_error = getattr(task_service, "TaskItemFinalisedError", None)
    refused = (HTTPException,) + ((finalised_error,) if finalised_error else ())
    try:
        assert_task_item_accepts_draft_writes(task_item)
    except refused as exc:
        return _finish(..., error=str(getattr(exc, "detail", None) or exc), ...)

The domain error has no `.detail`, and `str()` of an HTTPException prepends "409: ", hence the
`getattr`. With this, either PR can merge first. Once both are on main, drop the HTTPException half
and the getattr fallbacks.

Your `test_finalised_item_is_dead_lettered_rather_than_retried` already pins it: merged with my
branch today it fails, and with the change above it passes. I checked both orders: 276 passed with
my branch, 267 without. The branch is `CS57-Hanchen-scrum-26` if you want to look.
```

---

## 发出后

1. 确认 #22 的修改同时捕获两种异常，再 approve。
2. 两个 PR 都合并后，提醒他删掉过渡写法。
