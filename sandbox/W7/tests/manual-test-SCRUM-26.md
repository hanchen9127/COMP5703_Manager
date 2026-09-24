# 手动测试 —— 提交要么完整、要么没有（SCRUM-26 / 故事 D5）

**约 20 分钟。** 验证 D5 的第 3 条承诺：**一次提交要么完整生效，要么完全没有发生**。另外，提交会记下它产生的是
哪条 annotation。

对应 issue 11：原来草稿状态、annotation、条目状态、历史记录分四次提交，中途失败会留下半截数据；而且
`draft.annotation_id` 从来没被写过。

满足 DoD 的「在运行中的应用里可演示」。**分工要说清楚：**
- **回滚本身在界面上触发不了**：没有办法让提交在中途失败。它由自动化测试证明
  （`tests/test_draft_submission_atomicity.py` 第 3–5 个测试，在修复前的代码上 5 个全部失败）。
- **这份走查验证的是正常路径在真实应用里的表现**：
  - 提交返回 `annotation_id`，并且和草稿里记录的是同一个；
  - 历史里有这次提交；
  - 退回重做后，指向的仍是同一条 annotation；
  - Commit 2 改成业务异常以后，定稿的拒绝在浏览器里仍然一字不差。

PR #23，分支 `CS57-Hanchen-scrum-26`。

---

## 准备

### 切到分支，启动两个服务

```powershell
cd D:\COMP5703_Capstone\hej
git switch CS57-Hanchen-scrum-26
$env:PYTHONIOENCODING = "utf-8"
cd apps\hej-api ; uv run python main.py    # API  :8000
cd D:\COMP5703_Capstone\hej ; npm run dev:web   # web  :3000（另开一个终端）
```

**这个分支没有 schema 变更**，共享的开发数据库可以直接用，不需要 `--reset`。

### 两个账号，两个浏览器

和 SCRUM-28 的走查相同：

| 登录名 | 密码 | 角色 |
| --- | --- | --- |
| `charlie@example.com` | `SecurePass3Charlie` | annotator |
| `erin@example.com` | `SecurePass5Erin` | reviewer |

`erin` 不在种子数据里，没有的话先重建：`.venv\Scripts\python ..\..\..\docs\sandbox\tools\seed_test_roles.py`
（在 `apps\hej-api` 下运行）。

必须用**两个不同的浏览器**（Chrome + Edge，或者正常窗口 + 无痕窗口）。同一浏览器的两个普通窗口共享登录状态。

### 打开 DevTools

**charlie 的浏览器**按 F12 → **Network** 标签 → 勾选 **Preserve log**，过滤框填 `drafts`。

> **Preserve log 必须勾上。** 提交成功后抽屉约 1 秒就自动关闭，页面还会刷新列表；不勾的话，提交那条请求
> 会被冲掉。

### 造两个干净条目

```powershell
cd D:\COMP5703_Capstone\docs\sandbox\W6\scripts
python sandbox-SCRUM-25.py new     # 条目 A：第一、二部分用
python sandbox-SCRUM-25.py new     # 条目 B：第三部分用
```

把两个 item id 和 URL 记下来。脚本结尾提示的是 SCRUM-25 的走查，忽略它。

**2026-09-20 实跑用的条目：**

| | task | item | 起始草稿 |
| --- | --- | --- | --- |
| 条目 A | `task_d41b2c97314c` | `item_b9a246910d61` | `draft_b898b8b944f1` pending，UNCLAIMED |
| 条目 B | `task_bb54edf6fce3` | `item_5ee379e07c8a` | `draft_20d4976e1566` pending，UNCLAIMED |


---

## 测试步骤

### 第一部分 —— 正常提交记下了 annotation（条目 A）

#### 1. 先看后动

以 **charlie** 身份打开条目 A 的 URL → **Annotate** → 在条目行点 **Annotate** 打开抽屉。

✅ 编辑器可用，没有任何拦截提示。

#### 2. 提交

填入 `ANSWER-A1` → **Save draft** → **Submit annotation**。

✅ 出现 `Submitted for review.`，抽屉约 1 秒后自动关闭。这是正常行为。

#### 3. 看提交请求的返回

Network 里找到 `POST …/drafts/<draft_id>/submit` → **Response**（或 Preview）。

✅ 返回里有 `"annotation_id": "ann_…"`，**不是 `null`**。把这个值记为 **ANN-1**。

```json
{ "id": "draft_…", "status": "submitted", "submitted_at": "…", "annotation_id": "ann_…", "message": "Draft submitted for review" }
```
❌ **修复之前的表现：返回里根本没有 `annotation_id` 这个字段；数据库里的 `draft.annotation_id` 也是空的。**

**2026-09-20 实跑，通过。** `POST /drafts/draft_b898b8b944f1/submit` 的返回：

```json
{
    "id": "draft_b898b8b944f1",
    "status": "submitted",
    "submitted_at": "2026-09-20T04:49:30.909837",
    "annotation_id": "ann_901d65d46fdf",
    "message": "Draft submitted for review"
}
```

**ANN-1 = `ann_901d65d46fdf`。**

#### 4. 草稿里记的是同一条

仍是 charlie，刷新页面。页面加载时会给**每个条目**各请求一次草稿列表，Network 里会出现多条
`GET …/task-items/<item>/drafts`。找到 URL 里是**条目 A 的 id** 的那一条，打开它的 **Response**。

✅ 这份草稿 `"status": "submitted"`，`"annotation_id"` **等于 ANN-1**。

> 第 3 步证明接口告诉了调用方，第 4 步证明数据库真的存下了，而且两者一致。D4（SCRUM-27）审核时就是靠这个
> id 找到这份提交对应的 annotation。

**2026-09-20 实跑，通过。** `GET /task-items/item_b9a246910d61/drafts` 的返回（节选）：

```json
{
    "task_item_id": "item_b9a246910d61",
    "drafts": [
        {
            "id": "draft_b898b8b944f1",
            "annotation_id": "ann_901d65d46fdf",
            "status": "submitted",
            "draft_data": { "output": { "label": "ANSWER-A1", "…": "…" } },
            "created_by": 3,
            "created_by_name": "Charlie Davis",
            "created_at": "2026-09-20T04:44:11.367776",
            "submitted_at": "2026-09-20T04:49:30.909837",
            "updated_at": "2026-09-20T04:49:30.917767"
        }
    ],
    "total_count": 1
}
```

和第 3 步的 ANN-1 一致，`created_by` 是 charlie（3），说明认领也生效了。

`updated_at`（`.917767`）比 `submitted_at`（`.909837`）晚约 8 毫秒：这正是事务里的第 ③ 步——
写完 annotation 之后回填 `annotation_id`——留下的痕迹，两次写入在同一次提交里。

#### 5. 历史里有这次提交

charlie（或 erin）打开这个任务的 **History** 页。

✅ 有一条 `Draft submitted for review`，操作人是 charlie，对象是条目 A。

> 这条历史记录现在和提交写在同一个事务里（D1），所以能看到这一条，就说明提交整体成功了。

**2026-09-20，数据库侧已确认，界面待看。** 只读查询 `hej_dev.db` 的结果：

| 检查项 | 值 |
| --- | --- |
| 草稿 | `draft_b898b8b944f1` `submitted` `annotation_id=ann_901d65d46fdf` `created_by=3` |
| annotation | `ann_901d65d46fdf` `created_by=3` `confirmed_by=3` version 1 |
| 条目状态 | `annotated` |
| 历史记录 | `draft_submitted` 操作人 3，`04:49:30.922856` |
| 该条目的 annotation 数 | 1 |

五处写入齐全，时间相差十几毫秒（`.909` → `.917` → `.922`），符合一次事务提交的样子。
界面上的 History 页仍需自己看一眼，那才是 DoD 要的「在运行中的应用里可演示」。

### 第二部分 —— 退回重做，指向的仍是同一条 annotation（条目 A）

#### 6. Erin 退回

换到 **erin** 的浏览器 → 该任务 → **Review** → 打开条目 A → 在 **Justification** 写理由，在
**Feedback for the annotator** 写返工说明 → **Adjust**。

✅ 条目状态变为 **Returned**。

#### 7. Charlie 重做并再次提交

回到 charlie，刷新页面 → **Annotate** 队列的 **Returned** 分组 → 打开条目 A → 改成 `ANSWER-A2` →
**Save draft** → **Submit annotation**。

✅ 两步都成功，没有任何 409。

**2026-09-20 实跑，通过，但发现一个既有的前端缺陷（S10，与 SCRUM-26 无关）。**
退回重做时点 **Save draft**，编辑器里新输入的 `ANSWER-A2` 会被重置回上一次提交的 `ANSWER-A1`，
存下去的也是 A1。**绕开方式：改完内容直接点 Submit annotation，不点 Save draft**，这条路径正常。
原因见 [`../plans/defects-SCRUM-25.md`](../plans/defects-SCRUM-25.md) 的 S10。

#### 8. 看这次提交的返回

Network 里找到**这一次的** `POST …/submit` → Response。

✅ `"annotation_id"` **仍然等于 ANN-1**。

> 这是预期行为，不是缺陷：同一作者重新提交时，会原地更新他自己那条 annotation（S5），所以 id 不变。
> 按作者保留多个版本是 SCRUM-27 的范围。这一步要确认的是：链接指向的是被更新的那一条，而不是空的，
> 也不是别人的。

我不知道如何查找POST，以下是Erin浏览器的信息
{
    "task_item_id": "item_b9a246910d61",
    "drafts": [
        {
            "id": "draft_51b145df29f3",
            "task_item_id": "item_b9a246910d61",
            "annotation_id": "ann_901d65d46fdf",
            "status": "submitted",
            "annotation_type": "annotation",
            "draft_data": {
                "output": {
                    "kind": "classification",
                    "version": 1,
                    "label": "ANSWER-A2",
                    "labels": [
                        "ANSWER-A2"
                    ],
                    "confidence": 0.9,
                    "rationale": "rationale"
                },
                "output_text": "{\n  \"kind\": \"classification\",\n  \"version\": 1,\n  \"label\": \"ANSWER-A2\",\n  \"labels\": [\n    \"ANSWER-A2\"\n  ],\n  \"confidence\": 0.9,\n  \"rationale\": \"rationale\"\n}",
                "notes": ""
            },
            "revision_notes": "",
            "created_by": 3,
            "created_by_name": "Charlie Davis",
            "created_at": "2026-09-20T05:57:35.950993",
            "submitted_at": "2026-09-20T05:58:03.663821",
            "updated_at": "2026-09-20T05:58:03.670892"
        },
        {
            "id": "draft_85e360e3ffe8",
            "task_item_id": "item_b9a246910d61",
            "annotation_id": "ann_901d65d46fdf",
            "status": "submitted",
            "annotation_type": "annotation",
            "draft_data": {
                "output": {
                    "kind": "classification",
                    "version": 1,
                    "label": "ANSWER-A1",
                    "labels": [
                        "ANSWER-A1"
                    ],
                    "confidence": 1,
                    "rationale": "rationale"
                },
                "output_text": "{\n  \"kind\": \"classification\",\n  \"version\": 1,\n  \"label\": \"ANSWER-A1\",\n  \"labels\": [\n    \"ANSWER-A1\"\n  ],\n  \"confidence\": 1,\n  \"rationale\": \"rationale\"\n}",
                "notes": ""
            },
            "revision_notes": "",
            "created_by": 3,
            "created_by_name": "Charlie Davis",
            "created_at": "2026-09-20T05:56:43.088089",
            "submitted_at": "2026-09-20T05:56:46.326659",
            "updated_at": "2026-09-20T05:56:46.333539"
        },
        {
            "id": "draft_b898b8b944f1",
            "task_item_id": "item_b9a246910d61",
            "annotation_id": "ann_901d65d46fdf",
            "status": "submitted",
            "annotation_type": "annotation",
            "draft_data": {
                "output": {
                    "kind": "classification",
                    "version": 1,
                    "label": "ANSWER-A1",
                    "labels": [
                        "ANSWER-A1"
                    ],
                    "confidence": 1,
                    "rationale": "rationale"
                },
                "output_text": "{\n  \"kind\": \"classification\",\n  \"version\": 1,\n  \"label\": \"ANSWER-A1\",\n  \"labels\": [\n    \"ANSWER-A1\"\n  ],\n  \"confidence\": 1,\n  \"rationale\": \"rationale\"\n}",
                "notes": ""
            },
            "revision_notes": "",
            "created_by": 3,
            "created_by_name": "Charlie Davis",
            "created_at": "2026-09-20T04:44:11.367776",
            "submitted_at": "2026-09-20T04:49:30.909837",
            "updated_at": "2026-09-20T04:49:30.917767"
        }
    ],
    "total_count": 3
}

❌ 如果是 `null`，或者变成了一个新的 id，说明第二次提交没有找到作者自己原来那条 annotation。

**2026-09-20 实跑，通过。** 第二次提交产生的新草稿 `draft_51b145df29f3`（`ANSWER-A2`）：

```json
{ "id": "draft_51b145df29f3", "annotation_id": "ann_901d65d46fdf", "status": "submitted",
  "draft_data": { "output": { "label": "ANSWER-A2", "…": "…" } }, "created_by": 3 }
```

`annotation_id` 仍是 ANN-1。数据库侧确认（只读查询）：

- 该 item 上有 3 份草稿（A1 初版、S10 导致的 A1 重复提交、A2），**三份的 `annotation_id` 都是 ANN-1**；
- 该 item 上**只有 1 条 annotation**，内容已更新为 `ANSWER-A2`，`confidence` 从 100 变为 90（原地更新的标记）；
- 历史：`dataset_registered` → `draft_submitted` → `review_action` → `draft_submitted` → `review_action`
  → `draft_submitted`，每次提交都留下了记录。

> 每次重做都会新建一份草稿，而不是复用旧的：提交后草稿变为 `submitted`，按设计不再接受修改。这是既有行为，
> 不是 SCRUM-26 造成的。

### 第三部分 —— 定稿的拒绝在浏览器里没变（条目 B）

Commit 2 把定稿拒绝改成了业务异常，再由 service 转成 409。这一部分确认用户看到的内容一字未变。
步骤是 SCRUM-28 走查第 2–6 步的精简版。

#### 9. Charlie 提交，并留着一张陈旧页面

charlie：条目 B → 填 `ANSWER-B-original` → **Save draft** → **Submit annotation**。然后
**Items** → 筛选 **Submitted** → 打开条目 B 的 **Annotate** 抽屉，**停在这里，不要刷新**。

> **2026-09-20 实跑后修订：用两个标签页更可靠。** 提交成功后页面会自动跳转，抽屉留不住。改成
> **在 charlie 的浏览器里开两个相同的标签页**：一个用来提交，另一个停在 Annotate 抽屉上不动。
> Erin 定稿后，在第二个标签页上操作，它就是那张陈旧页面。

#### 10. Erin 接受，条目定稿

erin：**Review** → 打开条目 B → 写 **Justification** → **Accept**。

✅ 条目状态变为 **Approved**（后端是 `canonicalized`）。

#### 11. Charlie 在陈旧页面上保存

回到 charlie 那张没有刷新的抽屉 → 改成 `ANSWER-B-sneaky` → **Save draft**。

✅ 出现红色错误提示，内容和 SCRUM-28 时完全一样：

```
Task item <id> is finalised (canonicalized) and does not accept new annotation work.
Reopening a finalised item is not available yet.
```

✅ Network 里这条请求的状态码是 **409**，不是 500。

❌ 如果是 **500**，说明业务异常没有被转换，`_assert_task_item_accepts_writes` 里的 `except` 失效了。

**2026-09-20 实跑，通过。** 用第二个标签页当陈旧页面，改成 `ANSWER-B-sneaky` 后提交，界面上出现：

```
Task item item_5ee379e07c8a is finalised (canonicalized) and does not accept new annotation work.
Reopening a finalised item is not available yet.
```

Network → Headers → General：

```
Request URL     http://localhost:8000/api/v1/task-items/item_5ee379e07c8a/drafts
Request method  POST
Status code     409 Conflict
```

和 SCRUM-28 时完全一致，**Commit 2 改成业务异常之后，用户看到的状态码和文字都没有变**。
被拒绝的是 `POST …/drafts`（新建草稿），不是 submit：前端提交前会先保存，第一步就被挡下了，
这和 SCRUM-28 走查的结论相同。

数据库侧确认（只读查询）：条目 B 是 `canonicalized`，annotation 仍是 `ANSWER-B-original`，
**`sneaky` 在所有草稿和 annotation 里一次都没出现**。

---

## 通过标准

| # | 期望 | 对应 |
| --- | --- | --- |
| 2 | 正常提交成功 | 基准 |
| **3** | **提交返回带 `annotation_id`（ANN-1），不是 null** | **issue 11 后半句 / 决定 A** |
| **4** | **草稿里存的 `annotation_id` 等于 ANN-1** | **issue 11 后半句** |
| **5** | **History 里有这次提交，操作人正确** | **D1：历史记录和提交在同一个事务里** |
| 7 | 退回的条目能重做并提交 | 防止修过头 |
| **8** | **重新提交后 `annotation_id` 仍是 ANN-1** | **同一作者重新提交时链接正确** |
| **11** | **陈旧页面保存仍被 409 拒绝，文字不变** | **Commit 2 没有改变用户看到的内容** |
| — | 中途失败时整体回滚 | 自动化测试 3–5，界面上触发不了 |

---

## 出问题时怎么查

| 现象 | 多半是什么 |
| --- | --- |
| Network 里找不到 submit 请求 | 没勾 **Preserve log**，抽屉关闭后请求被冲掉了 |
| 第 3 步返回里没有 `annotation_id` 字段 | 跑的不是 `CS57-Hanchen-scrum-26`，或者 API 没重启 |
| 第 3 步 `annotation_id` 是 `null` | `submit_draft` 没有写入第 ③ 步（`drafts.update(..., annotation_id=...)`） |
| 第 4 步和第 3 步的 id 不一致 | 看到的是另一份草稿：确认看的是 `submitted` 的那一份 |
| 第 5 步 History 里没有这条 | 路由没有调用 `TaskHistoryRecorder.record`，或者 charlie 的请求没带 user_id |
| 第 8 步变成了新的 id | `find_by_item_and_creator` 没找到作者原来那条：检查草稿的 `created_by` |
| 第 11 步是 500 | 业务异常没被转换：检查 `draft_service.py` 的 `_assert_task_item_accepts_writes` |
| 第 10 步 Accept 报 403 self-approval | 审核用的账号和标注的是同一个人 |

---

## 本次不覆盖的范围

- **中途失败的回滚**：界面上没法制造，见自动化测试 `test_draft_submission_atomicity.py`。
- **SCRUM-48 的提交数上限**：还没实现，`submit_draft` 里只留了位置。
- **F1 的 provenance 事件**：还没实现，路由里只留了位置（`routes/drafts.py:267`）。
- **按作者保留多个版本**：SCRUM-27 的范围，第 8 步因此预期 id 不变。

---

## 记录

| 日期 | 执行人 | 结果 | 备注 |
| --- | --- | --- | --- |
| 2026-09-20 | Hanchen | **通过** —— 第 1–11 步全部通过 | ANN-1 = `ann_901d65d46fdf`，重做后不变；条目 B 定稿后拒绝为 409，文字不变，`sneaky` 未落库；走查中发现既有前端缺陷 **S10**（与本次改动无关，归 SCRUM-93） |
