# 手动测试 —— 定稿之后不能再改（SCRUM-28 / 故事 D5）

**约 20 分钟。** 验证 D5 的第 1 条承诺：**定稿的答案不会再变**。

对应 issue 2：提交草稿会原地覆盖作者已有的 annotation，`canonicalized` 的条目**状态不变、答案却换了** ——
那条通过的审核记录，从此在为一个没人审过的答案背书。

满足 DoD 的「在运行中的应用里可演示，而不只是 API」。自动化测试证明数据库没被改
（`tests/test_finalised_item_writes.py`），**但它证明不了浏览器里那张陈旧页面** —— 第 6、7 步才是这份走查
存在的理由。

> **2026-09-16 实跑后修订。** 初版让 Charlie 提交后「停在原页面」，实际做不到：提交成功后抽屉会在
> 900ms 后自动关闭（`completeAction` → `onOpenChange(false)`），而且 Annotate 队列只列
> Draft / Returned / Rejected 三组，条目一变 Submitted 就从队列里消失。第 3 步是改过的路径。

---

## 准备

### 启动两个服务

```powershell
$env:PYTHONIOENCODING = "utf-8"
cd D:\COMP5703_Capstone\hej\apps\hej-api ; uv run python main.py    # API  :8000
cd D:\COMP5703_Capstone\hej             ; npm run dev:web           # web  :3000
```

### 两个账号（同属 TechStart Inc）

| 登录名 | 密码 | 角色 | 在本走查里做什么 |
| --- | --- | --- | --- |
| `charlie@example.com` | `SecurePass3Charlie` | annotator | 标注、提交，然后在陈旧页面上尝试改 |
| `erin@example.com` | `SecurePass5Erin` | reviewer | 审核并定稿 |

`erin` 不在种子数据里，`init_data.py --reset` 之后要重建：

```powershell
cd D:\COMP5703_Capstone\hej\apps\hej-api
.venv\Scripts\python ..\..\..\docs\sandbox\tools\seed_test_roles.py
```

**两人必须是不同的人。** 同一个账号既标注又审核会先撞上自审拒绝（403 self-approval），那是 D1 的守卫，
不是这次要验的东西。

### ⚠️ 必须用两个不同的浏览器

Chrome + Edge，或一个正常窗口 + 一个无痕窗口。**同一浏览器的两个普通窗口不行** —— 它们共享
`localStorage`，第二次登录会顶掉第一个。

这次比 SCRUM-25 更要紧：整份走查的关键是**两个人各自持有一张页面**，其中一张是陈旧的。

### 造一个干净条目

复用 W6 的脚本（它造的条目对本走查同样合适：human-first、全新、未认领的占位草稿）：

```powershell
cd D:\COMP5703_Capstone\docs\sandbox\W6\scripts
python sandbox-SCRUM-25.py new
```

它会打印任务、条目和 URL，结尾提示的是 SCRUM-25 的走查 —— 忽略那句，回到本文件。
把 `check` 命令留着，后面每一步都要用：

```powershell
python sandbox-SCRUM-25.py check <item>
```

第 10 步要**再造一个新条目**，别用同一个。

---

## 测试步骤

### 第一部分 —— Charlie 做完第一轮

#### 1. 先看后动

以 **charlie** 身份打开脚本给出的 URL → **Annotate**。

✅ 条目状态是 **Draft** 或 **Unstarted**，编辑器可以输入，没有任何拦截提示。

> 这一步不是走过场。不先确认起点是可编辑的，第 6 步的拒绝就说明不了问题 —— 分不清是守卫生效了，还是
> 这个条目本来就动不了。

#### 2. Charlie 提交

在条目行点 **Annotate** 打开抽屉 → 填入可识别的内容，例如 `ANSWER-A-original` → **Save draft** →
再点 **Submit annotation**。

✅ 出现 `Submitted for review.`，**抽屉在约 1 秒后自动关闭**，条目从 Annotate 队列里消失。

> 这是正常行为，不是缺陷。Annotate 队列只列 Draft / Returned / Rejected，条目已经变成 Submitted。
> 所以陈旧页面要靠下一步重新打开，而不是「停在原地」。

#### 3. Charlie 重新打开条目，并停在这张页面上

仍然是 charlie → 左侧切到 **Items** → 筛选 **Submitted** → 找到该条目 → 点开，打开抽屉的
**Annotate** 标签。

✅ 编辑器可用，里面是 `ANSWER-A-original`，**没有**任何「不能标注」的提示。

**保持这个窗口开着，停在这张抽屉上。不要刷新，不要关。** 它就是第 6 步要用的陈旧页面。

> 这不是为了制造 bug 而拗出来的操作。条目在 Submitted 状态下本来就是可以继续改的 —— 标注人送审之后想起
> 一处笔误，回来补一下，是完全正常的行为。**真实场景就是：他补的时候，审核人正好按下了 Accept。**

### 第二部分 —— Erin 定稿

#### 4. Erin 先看清楚在审谁的东西

换到**另一个浏览器**，以 **erin** 身份打开同一个任务 → **Review** → 打开该条目。

✅ 看到的提交内容是 `ANSWER-A-original`，署名 charlie。

#### 5. Erin 接受

在 **Justification** 里写一句理由（例如 `matches the guideline`）→ 点 **Accept**。

> 理由是必填的，无论什么情况 —— 这是客户对问题 7 的答复。留空会被 422 挡下。

```powershell
python sandbox-SCRUM-25.py check <item>
```

✅ Erin 这边条目状态变成 **Approved**（后端 `canonicalized`）。**条目现在已定稿。**

### 第三部分 —— 陈旧页面（核心）

#### 6. Charlie 在陈旧页面上改内容并保存

回到 **charlie** 的窗口，就是第 3 步留着的那张抽屉。**仍然不要刷新** —— 它还以为条目是 Submitted。

把内容改成 `ANSWER-B-sneaky` → 点 **Save draft**。

✅ 出现红色错误提示，内容包含：

```
Task item <id> is finalised (canonicalized) and does not accept new annotation work.
Reopening a finalised item is not available yet.
```

❌ **修复之前的表现：保存成功，没有任何提示。**

> 这一下触发的是 `create_draft` 的守卫，不是 `update_draft`：Charlie 那份草稿已经是 `submitted` 了，
> 前端找不到 pending 草稿，于是走的是新建（`upsertDraft` → `POST /task-items/{id}/drafts`）。

#### 7. 同一张陈旧页面，再试提交

不刷新，点 **Submit annotation**。

✅ 同样的 409 拒绝，条目状态没有任何变化。

❌ **修复之前的表现：提交成功。annotation 被原地改成 `ANSWER-B-sneaky`，条目状态仍是 Approved，
Erin 那条 `approved` 的审核记录仍然指着它 —— 这就是 issue 2 的全部危害。**

> 前端提交前会先保存，所以这一步也是在新建草稿那里就被挡下了。`submit_draft` 自己的守卫在网页端走不到，
> 它是 API 层的兜底 —— 直接调接口的脚本、或者将来别的客户端会走到。已在 PR 描述里写明。

#### 8. 确认存下来的答案没变

```powershell
python sandbox-SCRUM-25.py check <item>
```

✅ 仍然只有一份草稿，状态 `submitted`，**没有新增任何草稿**。

再到 **erin** 的窗口 → **Finalized** 标签 → 打开该条目。

✅ 显示的仍然是 `ANSWER-A-original`。**`ANSWER-B-sneaky` 在系统里任何地方都不存在。**

#### 9. 刷新之后，界面本身就不让标注了

刷新 **charlie** 的页面，重新打开该条目。

✅ 编辑器被禁用，提示：`This item cannot be annotated right now. Current status: Approved.`

> 第 6、7 步和第 9 步拦截的层次不同，两个都要留着：第 9 步是界面按状态禁用，**只要页面是新的**；
> 第 6、7 步是后端拒绝，**页面陈旧时唯一的防线**。删掉任何一个，issue 2 都会从另一条路回来。

### 第四部分 —— 返工通道没有被堵死

守卫最危险的失败方式是拦得太多。退回重做必须还能走通。

#### 10. 造第二个条目，走到退回

```powershell
python sandbox-SCRUM-25.py new
```

用**新的** item：charlie 提交（同第 1、2 步）→ erin 打开它 → 在 **Justification** 写理由、在
**Feedback for the annotator** 写一句返工说明 → 点 **Adjust**。

✅ 条目状态变 **Returned**。

> Feedback 在 Adjust 和 Reject 时是必填的，留空会被 422 挡下。

#### 11. Charlie 重做并再次提交

回到 charlie，刷新页面 → 条目现在回到 **Annotate** 队列的 **Returned** 分组 → 打开它 → 改内容 →
**Save draft** → **Submit annotation**。

✅ **两步都成功。** 没有任何 409。条目回到 **Submitted**。

❌ 如果这里被拒了，说明守卫把 `returned` 也当成了最终态 —— 那是个严重回归，审核人能退回但没人能重做。
（自动化测试 `test_returned_and_sent_back_items_still_accept_a_submission` 覆盖了这条，但请在真实界面上
也确认一次。）

---

## 通过标准

| # | 期望 | 对应 |
| --- | --- | --- |
| 1 | 起点条目可编辑 | 基准 |
| 2 | Charlie 能正常提交，抽屉自动关闭 | 基准 |
| 3 | Submitted 的条目能从 Items 页重新打开并编辑 | 既有行为，守卫不能破坏它 |
| 5 | Erin 接受后条目定稿 | 基准 |
| **6** | **陈旧页面上 Save draft 被 409 拒绝** | **issue 2 / D5 准则 1** |
| **7** | **陈旧页面上 Submit 被 409 拒绝** | **issue 2 / D5 准则 1** |
| **8** | **存下来的答案仍是审核时那份，审核记录仍然成立** | **issue 2 的实质** |
| 9 | 刷新后界面按状态禁用标注 | 既有行为，不能被破坏 |
| 11 | 退回的条目仍可重做并提交 | 防止修过头 |

---

## 出问题时怎么查

| 现象 | 多半是什么 |
| --- | --- |
| 第 3 步在 Items 里找不到条目 | 筛选没切到 **Submitted**；Annotate 队列里确实没有 |
| 第 6 步保存成功了 | 守卫没接上。检查 `draft_service.py` 的 `create_draft` 和 `update_draft` 是否都调了 `_assert_task_item_accepts_writes` |
| 第 6 步报的是 403 而不是 409 | 撞上了归属或角色检查。确认 charlie 就是这份草稿的作者 |
| 第 6 步报的是「Can only update drafts in 'pending' status」 | 守卫排在了草稿状态检查之后，顺序反了。定稿的提示必须先出 |
| 第 5 步 Accept 报 403 self-approval | 审核用的账号和标注的是同一个人 |
| 第 11 步被 409 拒了 | `TERMINAL_TASK_ITEM_STATUSES` 被人扩大了范围 |
| 两个窗口显示同一个人 | 用的是同一浏览器的两个普通窗口 |

---

## 本次不覆盖的范围

写清楚，免得评审时被当成漏测：

- **审核动作本身不受这个守卫限制。** 已定稿的条目上，审核人仍然可以再点 Reject 或 Escalate，把状态从
  `canonicalized` 改走。守卫只拦标注写入（draft 的建、改、提交）。这是 SCRUM-28 范围之外的缺口，已在
  PR 描述里写明。
- **`submit_draft` 的守卫在网页端触发不到**，因为前端提交前必然先保存，新建或更新那一步就已经被拒。它
  是 API 层的兜底，由 `tests/test_finalised_item_writes.py` 覆盖。
- **重新打开已定稿的条目**（D5 准则 2）没有实现，等客户答复追问 F5。
- **删除已定稿条目上的待处理草稿**仍然允许 —— 它不动任何 annotation。
- **同一作者的重新提交仍然原地覆盖**（缺陷 S5），只是现在定稿之后不给覆盖了。按作者分版本是 SCRUM-26
  之后的单独提交，等 F1。
