# Commit messages — SCRUM-28 定稿守卫

一条 commit，代码、测试、文档一起（决定于 2026-09-16）。DoD 要求「改动的状态和契约在同一改动里
更新文档」，这里就按字面做。

```powershell
cd D:\COMP5703_Capstone\hej

git add apps/hej-api/app/services/task_service.py `
        apps/hej-api/app/services/draft_service.py `
        apps/hej-api/tests/test_task_item_lifecycle_guards.py `
        apps/hej-api/tests/test_finalised_item_writes.py `
        docs/design/product/workflow_states.md `
        docs/design/backend/api_surfaces.md `
        docs/terminology/task-lifecycle.md

git commit -F ..\docs\sandbox\W7\commits\commit-SCRUM-28-1-fix-finalised-item-writes.txt
```

`test_finalised_item_writes.py` 是新文件，`git add` 会一并加入。

| 文件 | 改动 |
| --- | --- |
| `app/services/task_service.py` | +17 —— `assert_task_item_accepts_draft_writes` |
| `app/services/draft_service.py` | +27/−1 —— 私有 helper + 三处调用 + 404 |
| `tests/test_task_item_lifecycle_guards.py` | +54 —— 新测试类，3 条 |
| `tests/test_finalised_item_writes.py` | 新建，328 行，6 条测试 |
| `docs/design/product/workflow_states.md` | +4 —— 3 条 note + 1 条 invariant |
| `docs/design/backend/api_surfaces.md` | +17 —— 表格一行 + 三段说明 |
| `docs/terminology/task-lifecycle.md` | +7 —— finalised 属于 item |

## 提交前确认

```powershell
cd D:\COMP5703_Capstone\hej\apps\hej-api ; .venv\Scripts\python -m pytest -q
```

基线（改动前，2026-09-16 于 `5070efd`）：**226 passed** + 138 subtests。
改动后：**235 passed** + 147 subtests。前端未触及，`npm run check` 的 web 部分不受影响。

红/绿验证已做过：临时注释掉 `draft_service.py` 的三处调用后，
`test_finalised_item_writes.py` 由 6 passed 变成 **5 failed / 1 passed**，随后还原。

手动走查已实跑通过（2026-09-16），界面上确实收到
`Task item ... is finalised (canonicalized) and does not accept new annotation work.`

## ✅ 已执行（2026-09-16）

提交为 `1adc707`；远端分支的 `e2878b8` 已合并进来（`65c8133`）；已推送，开出 PR #19，等待评审。

**现在还要做的（2026-09-18）**：`main` 之后又前进了 4 个提交（其中有 PR #16），分支现在领先 3、落后 4。
PR #19 合并前先 `git merge origin/main`，再重跑测试——通过数不会再是 235。

## 下一条 commit

SCRUM-26 的 Commit 2（延迟 commit 的重构）和 Commit 3（原子提交 + 记录 `annotation_id`），
见 `../plans/plan-SCRUM-28-26.md`。Commit 2 的验收方式是：默认值保持 `True`，测试一行不改，
通过数必须等于开工时的数——合并 `main` 之后重跑得到的那个数，不再是 235。
