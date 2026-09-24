# Commit messages — SCRUM-25 前端收尾

三条 commit，按顺序提交。文件互不重叠，可以逐条 `git add` 后单独提交。

```powershell
cd D:\COMP5703_Capstone\hej

git add apps/hej-web/components/task-annotation-workspace-with-real-data.tsx `
        apps/hej-web/components/task-workbench.tsx `
        apps/hej-web/lib/task-workspace-data.ts `
        apps/hej-web/lib/task-workspace-data.test.ts
git commit -F ..\docs\sandbox\W6\commits\commit-SCRUM-25-1-fix-web-draft-selection.txt

git add apps/hej-web/components/task-item-workspace-sheet.tsx `
        apps/hej-web/components/task-item-workspace-sheet.test.tsx
git commit -F ..\docs\sandbox\W6\commits\commit-SCRUM-25-2-fix-web-read-only-panel.txt

git add docs/design/backend/api_surfaces.md `
        docs/design/product/workflow_states.md
git commit -F ..\docs\sandbox\W6\commits\commit-SCRUM-25-3-docs-draft-ownership.txt
```

| # | 内容 | 文件 | 改动 |
| --- | --- | --- | --- |
| 1 | viewerId 接线 + 参数改必填 + 无主 submitted 草稿（A1） | 4 | +73 / −10，web 测试 +4 |
| 2 | 只读面板真的只读（A2）+ 横幅按持有者归因（B1） | 2 | +137 / −18，web 测试 +5 |
| 3 | Docs Sync + 准则 3 的 no-override 决定（C1/C2） | 2 | +38 |

> `terminology/task-lifecycle.md` 故意没动 —— 它定义的是任务容器生命周期，并明写不描述
> per-item 工作流。plan 的 Commit 6 把它列进来是为 SCRUM-28 的「finalized 保证什么」，不是
> 这张票的。

提交前确认全绿：

```powershell
cd D:\COMP5703_Capstone\hej\apps\hej-api ; .venv\Scripts\python -m pytest -q
cd D:\COMP5703_Capstone\hej\apps\hej-web ; npx vitest run ; npx tsc --noEmit
```

基线：backend **163 passed** + 111 subtests，web **131 passed** / 16 files，tsc 干净。

> 仓库历史里没有任何 attribution trailer，这三条也不加。
