# 缺陷 30（删除任务/项目失败）—— 不建票，记在 backlog 里

**决定 2026-09-17：不在看板上单独建票。** 缺陷记在 `../../info/issues.md` 第 30 条，并作为 B4 的一部分
记进客户视图（`../../shared/story_src.csv` 和 `user-stories.html`）。B4 已有 SCRUM-24，删除行为属于任务
生命周期的一部分，不需要自己的票。

这份文件只保留决定和依据；原先准备的可粘贴票文已删除。

## 缺陷是什么

`DELETE /projects/{project_id}/tasks/{task_id}` 和 `DELETE /organizations/{org_id}/projects/{project_id}`
在任务有 items 时失败，返回 500。**即使 items 上没有任何标注工作也会失败。** 两个接口都没有测试覆盖。

由 Michael 2026-09-17 设计 SCRUM-1 外键时发现，同日由 Hanchen 在 `main` `17673c8` 上复现并定位。

## 根因（两层）

1. **删除顺序**——ORM 先发 `DELETE FROM data_pointers`，而 `task_items.data_pointer_id` 还指着它，因为
   两个模型之间没有声明依赖关系。这是发出的**第一条语句**，所以在触及任何标注工作之前就失败了。
2. **task_items 的子记录**——顺序修好之后，drafts、predictions、task_item_escalations 会各自挡住删除
   （annotations 不会，它的关系上声明了 `cascade="all, delete-orphan"`）。

可运行的复现脚本在 `../../info/issues.md` → *Issue 30 — detail*，已验证照抄即可复现。

## 修之前要先决定的事

**持有标注或审核历史的任务，能不能删？** 级联删除会抹掉平台存在意义所在的 provenance，所以用 409 拒绝、
并提供归档路径，可能才是对的答案。这个决定属于 B4 现在自己拥有的生命周期定义（客户对问题 2 答复"合理
即可"）。

无论选哪个，接口都不能再返回 500——要么成功，要么以说明原因的状态码拒绝。这和 issue 29 是同一类问题。

## 已经记在哪

| 位置 | 内容 |
| --- | --- |
| `../../info/issues.md` | 第 30 条 + 详细根因 + 复现脚本，严重度 Medium |
| `../../specs/mission.md` | 缺陷表第 30 行，Story 栏为 B4 |
| `../../specs/roadmap.md` | W8 第 7 组（B4 / SCRUM-24）的行里写明它属于这里 |
| `../../shared/story_src.csv`、`user-stories.html` | B4 的 `defects` 列加了 30，related issues 增加一段，子任务第 5 条是那个决定 |

## SCRUM-24 的描述要改

B4 的票现在还写着"实现前先和客户确认路径"——**那一步已经完成了**（客户 2026-09-17 答复"合理即可没有
硬性要求"），而且它没提 issue 30。整篇替换成下面这段。

`Issues` 那行按看板体例写成 `*28*, *30*`（先例：SCRUM-43 的 `Issues *19*, *27*, *14*`）。

```
A task stays a draft forever today, so dataset intake never closes and the in_review / ready /
disputed states the export dashboard is built around can never occur.

The client answered on 2026-09-17: "anything reasonable, no hard requirement". The path is
therefore ours to define and to write down as part of this ticket: draft -> active -> completed,
with paused reachable from active; the project manager triggers each step; a task completes only
once every item is finished; and no new items can be added once it is active. Record it in
workflow_states.md in the same change.

This ticket also closes issue 30. Deleting a task or a project that has items fails with a
foreign-key error and returns 500 — even when those items carry no annotation work at all,
because the ORM deletes the task's data pointers before its task items, which still reference
them. Fixing that ordering is the smaller half. The real question belongs to the lifecycle this
ticket defines: may a task holding annotation or review history be deleted at all, or is it
refused with a 409 and offered archival instead? Cascading the delete erases the provenance the
platform exists to keep. Decide that first, then make deletion behave accordingly — and whichever
way it goes, the route must never return a 500. Neither delete endpoint has any test today.

Story *B4* — My task moves through real states, not just "draft"
Issues *28*, *30*
```

改完重新下载 `Jira.csv` 跑 `tracking-sync`。`scrum` 列不会变——SCRUM-24 本来就挂在 B4 上。
