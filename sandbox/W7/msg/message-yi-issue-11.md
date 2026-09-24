# 给 Yi 的回复 —— issue 11 怎么修（SCRUM-26）

2026-09-19。Yi 问 issue 11（"Draft submission is non-atomic, and drafts never link to their own annotation"）打算
怎么修。上次（`message-yi-SCRUM-62-taking-events.md` 第 2 点）说过提交事件的接入点"还没最终定、到时候告诉你"，
D1 已于 2026-09-19 定下（`draft_submitted` 并入提交事务），这次一并给出。团队内部沟通，中文写。

**依据：** `../plans/plan-SCRUM-28-26.md` → *SCRUM-26 (re-planned)*；`../commits/commits-SCRUM-26.md`；PR #23。

---

## 消息正文

```
Yi，issue 11 在 SCRUM-26 里修，PR 是 #23（draft，叠在 #19 上）。思路和进度如下，
第 3 点跟你的 F1 直接相关。

**1. 问题在哪**
`DraftService.submit_draft` 一次提交要写三样东西：草稿改成 submitted、新建或更新 annotation、
item 状态改成 annotated。每一步都各自 commit，中间任何一步失败，就会留下"草稿已提交但没有 annotation"
或"item 状态和草稿对不上"。路由之后还要单独 commit 一次 `draft_submitted` 历史记录。
另外 `draft.annotation_id` 在 model 里声明了，但从来没写过，所以看不出一份提交对应的是哪条 annotation。

**2. 怎么修（分四个 commit）**
- ✅ Commit 2：finalised-item guard 改成抛业务异常 `TaskItemFinalisedError`，路由层转成 409（Michael 的 worker 要用）。
- ✅ Commit 3：提交流程用到的 4 个仓储写方法加了 `commit=False` 参数，只 flush 不提交。行为不变，测试不变。
- ⏳ Commit 4（正在做）：
  - `submit_draft` 的所有写入放进一个事务，失败就整体 rollback；
  - 提交时把 `draft.annotation_id` 写上。
  - 路由那一步的 `draft_submitted` 历史记录**也并进同一个事务**（已定）。
- ⏳ Commit 5：文档。

**3. 跟 F1 的关系：提交事件的接入点**
Commit 4 之后，提交路由的写法会变成这样：

    draft = service.submit_draft(..., commit=False)   # 草稿 + annotation + annotation_id + item 状态
    TaskHistoryRecorder.record(..., commit=False)      # draft_submitted
    # ← F1 的提交事件加在这里，同样 commit=False
    db.commit()                                        # 一次提交；前面任何一步出错就 rollback

所以 F1 的提交事件只要写在 `db.commit()` 之前、用同一个 `db`、不自己 commit，就会和提交本身同生同死。
事件里可以直接带上 `draft.id` 和 `draft.annotation_id`，这正是"这次提交产生了哪条 annotation"。
确切的行号等 Commit 4 推上去后告诉你。

**4. 这次不修的**
- 同一作者重新提交时，仍然是在原地覆盖自己那条 annotation，不会生成新版本（S5）。
  按作者保留版本属于 SCRUM-27 / F1 follow-up，这对 F1 怎么记录"版本被替换"有影响，先让你知道。
- review 读取 annotation 时还没改成按 `annotation_id` 找（`_latest_annotation`），那是 SCRUM-27 (D4) 的范围。
```

---

## 发出后

1. ✅ Commit 4 推上去后，把路由里的确切接入行号告诉 Yi。见下面的跟进消息（2026-09-20）。

---

## 跟进消息（2026-09-20，Commit 4 已推送）

```
Yi，接上次说的：Commit 4 已经推到 PR #23 了（404ffda），F1 提交事件的接入点定下来了：

- 位置：`apps/hej-api/app/api/routes/drafts.py` 第 267 行，我留了一行注释
  `# SCRUM-62 (F1): the submission's provenance event joins here, with commit=False.`
  紧接着第 268 行就是 `db.commit()`。
- 写法：用同一个 `db`，`commit=False`（只 flush 不提交），不要自己 commit，也不要自己 rollback。
  出错时直接抛出，外面的 `except` 会整体 rollback，事件和提交一起撤销。
- 可用的数据：这时 `draft.id`、`draft.annotation_id`、`draft.task_item_id` 都已经有值，
  `task` 和 `operator_id` 也在上面几行取好了。
- 另外，提交接口的返回现在也带 `annotation_id` 了。

#23 还叠在 #19 上，#19 合并后才会改为指向 main。你那边可以先按这个位置写，
合并顺序到时候再对。
```
