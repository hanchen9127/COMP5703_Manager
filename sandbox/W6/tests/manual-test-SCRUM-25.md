# 手动测试 —— 草稿所有权（SCRUM-25 / 故事 D6）

**约 15 分钟。** 验证 D6 的两条承诺：

1. **别人未完成的工作，谁都改不了** —— 后端拒绝，前端不引诱你去改。
2. **自己的工作始终是自己的** —— 认领之后刷新、返工都不受影响。

满足 DoD 的「在运行中的应用里可演示，而不只是 API —— 用两个标注员账号登录并展示 403」。

> 第 2、4、9 步是后补的，每一条都对应一个**已经漏出去过**的缺陷。别删。

---

## 准备

### 启动两个服务

```powershell
$env:PYTHONIOENCODING = "utf-8"
cd D:\COMP5703_Capstone\hej\apps\hej-api ; uv run python main.py    # API  :8000
cd D:\COMP5703_Capstone\hej             ; npm run dev:web           # web  :3000
```

### 两个账号（同属 TechStart Inc）

| 登录名 | 密码 | 角色 |
| --- | --- | --- |
| `charlie@example.com` | `SecurePass3Charlie` | annotator |
| `dana@example.com` | `SecurePass4Dana` | annotator |

`charlie` 在种子数据里，`dana` 不在。两个都会被 `init_data.py --reset` 清掉，缺了就重建：

```powershell
cd D:\COMP5703_Capstone\hej\apps\hej-api
.venv\Scripts\python ..\..\..\docs\sandbox\tools\seed_test_roles.py
```

### ⚠️ 必须用两个不同的浏览器

Chrome + Edge，或一个正常窗口 + 一个无痕窗口。**同一浏览器的两个普通窗口不行** —— 它们共享
`localStorage`，第二次登录会顶掉第一个，两个窗口变成同一个人。

### 造一个干净条目

```powershell
cd D:\COMP5703_Capstone\docs\sandbox\W6\scripts
python sandbox-SCRUM-25.py new
```

会打印任务、条目、要打开的 URL，以及草稿的初始状态：

```
  drafts (1):
    draft_...  pending    owner=UNCLAIMED
```

**`UNCLAIMED` 是必须的起点。** 数据集导入时会给每个条目自动建一份无主的占位草稿，第一个写入
的人取得所有权。显示别的就重新 `new` 一次。

把打印出来的 `check` 命令留着，每步之间都要用。

> 原来的 `sandbox_text_00N` 夹具已经用废了（五个条目全部 canonicalized），所以这个脚本每次自己
> 造一个新的。想重来就再跑一次 `new`，比手工重置便宜。

---

## 测试步骤

### 第一部分 —— Charlie 占用条目

#### 1. Charlie 认领

以 **charlie** 身份打开 URL → **Annotate** → 在条目行点 **Annotate** → 在 **Notes** 里打点字 →
**Save draft**。

```powershell
python sandbox-SCRUM-25.py check <item>
```

✅ 仍然是一份草稿，但变成 `owner=3 (charlie)`。
❌ 还是 `UNCLAIMED` → 首写认领（claim-on-first-write）没生效。

#### 2. Charlie 刷新后仍然能改自己的草稿 ⭐

**按 F5 刷新页面**，重新打开同一条目的 Annotate 面板。

✅ 编辑器里是他自己的文字，可以继续改，**Save draft 和 Submit 都可点**，顶部没有任何只读横幅。

❌ 出现「**Charlie Davis is annotating this item**」把他自己挡在外面 → 前端 hydrate 时没传
`viewerId`，把所有有主的草稿都当成了别人的。

再在 `/tasks/<taskId>/review` 页面重复一次 —— 那是另一个独立的 hydrate 入口。

> **刷新这一步是关键。** 第 1 步能成功是因为草稿当时还是 `UNCLAIMED`，走的是「无主可认领」分支；
> 只有认领**之后**重新加载，才会走到「这是不是我的」判断。缺了这一步，整类缺陷都测不出来。

---

### 第二部分 —— Dana 被正确挡住

#### 3. Dana 打开同一条目 —— 先看，别动

以 **dana** 身份打开**同一个** URL → **Annotate** → 在同一条目上点 **Annotate**。

**什么都别碰，先看三处：**

| 位置 | 应当看到 |
| --- | --- |
| 条目表格的 **Annotator** 列 | `Charlie Davis` —— 一眼就知道有人在做 |
| 面板**顶部**横幅 | **Charlie Davis is annotating this item.**<br>One annotator works an item at a time. Pick another item from the queue. |
| 编辑器 | Charlie 的文字，**灰掉不可编辑** |
| **Actions** 区块 | Save draft 和 Submit 都是灰的 |

❌ 顶部横幅写的是「This item cannot be annotated right now. Current status: …」→ 横幅按状态归因
了，而真正的原因是所有权。

#### 4. Dana 真的打不了字 ⭐

不要只看按钮是不是灰的，**动手试**：

- 往 **Notes** 里打字
- 往 **Verdict** / **Rationale** 里打字（judgement 型任务）
- 点 **Quick verdicts** 的快捷标签
- 点 **Format JSON**（图像型任务）

✅ 全部没反应，右上角不出现「Unsaved changes」。

❌ 能打进去 → 「只读」只做在了按钮上，输入框还是活的。Dana 会写完一整段理由，才发现存不了。

#### 5. Dana 无法用任何方式写入

```powershell
python sandbox-SCRUM-25.py check <item>
```

✅ 仍然**只有一份**草稿，Charlie 的。

❌ 多出一份 Dana 的草稿 → 「一个条目同一时间只由一个标注员处理」这条约定被绕过了。面板里也不
该出现任何「另起一份」的入口。

#### 6. Charlie 的内容原封不动

仍以 **dana** 身份，看队列里的条目行 —— 能**看到** Charlie 的草稿内容，这是对的：读别人的工作
是允许的，改不行。

✅ Charlie 的笔记还是他原来的文字。

#### 7. 直接打 API，看 403

先拿到 Charlie 的**草稿 id**（界面上不显示，只能从 `check` 的输出里取）：

```powershell
python sandbox-SCRUM-25.py check <item>
```

```
  drafts (1):
    draft_0469dd989b2d  pending   owner=3 (charlie)
    ^^^^^^^^^^^^^^^^^^ 要的是这个
```

> ⚠️ **`draft_…` 不是 `item_…`。** 填成条目 id 的话四个请求全会返回 **404**（那个草稿不存在），
> 看起来像权限没生效，其实只是 id 填错了。四个全 404 就是填错的信号 —— 真正的权限失败是三个
> 403 加一个 200。

在 **Dana 的窗口**打开 DevTools → Console，把 id 填进 `D`：

```js
const t = localStorage.getItem('hej.auth.access_token') || sessionStorage.getItem('hej.auth.access_token');
const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` };
const D = 'draft_0469dd989b2d';   // draft_… 开头
for (const [method, path, body] of [
  ['PATCH',  `/drafts/${D}`,         JSON.stringify({ annotation_type: 'annotation', draft_data: {} })],
  ['POST',   `/drafts/${D}/submit`,  '{}'],
  ['DELETE', `/drafts/${D}`,         null],
  ['GET',    `/drafts/${D}`,         null],
]) {
  const r = await fetch(`http://localhost:8000/api/v1${path}`, { method, headers: H, body });
  console.log(method, r.status, r.status === 403 ? (await r.json()).detail : '');
}
```

✅ 期望：

```
PATCH  403 This draft belongs to another annotator. Only its author can edit, delete or submit it.
POST   403
DELETE 403
GET    200
```

**`GET 200` 和那三个 403 一样重要。** 审核人必须能读、能批准别人的草稿，把读也锁上就是改过头了
—— 这一行就是防止改过头的守卫。

---

### 第三部分 —— Charlie 始终掌控自己的工作

#### 8. Charlie 提交自己的草稿

回到 **charlie**，打开条目 → **Submit annotation**。

✅ 成功，条目进入 `annotated`。

```powershell
python sandbox-SCRUM-25.py check <item>
```

✅ 一份草稿，Charlie 的，状态 `submitted`。Dana 从头到尾没建过草稿 —— 这正是第 5 步的意义。

---

### 第四部分 —— 历史遗留数据

#### 9. 无主的 submitted 草稿仍然能返工 ⭐

后端加所有权检查之前（`a25d0ae`），**通过网页产生的每一份草稿 `created_by` 都是空的**。开发库里
的老条目全是这个形状，所以这一步测的是真实数据，不是假设。

把第 8 步的条目改造成历史数据的样子 —— 抹掉作者，并退回返工状态。**这里要的是条目 id
（`item_…`），不是第 7 步那个 `draft_…`：**

```powershell
cd D:\COMP5703_Capstone\hej\apps\hej-api
.venv\Scripts\python -c "import sqlite3; d = sqlite3.connect('hej_dev.db'); i = 'item_21721c5ea129'; d.execute('UPDATE drafts SET created_by = NULL WHERE task_item_id = ?', (i,)); d.execute('UPDATE task_items SET status = ? WHERE id = ?', ('returned', i)); d.commit(); print(list(d.execute('SELECT id, status, created_by FROM drafts WHERE task_item_id = ?', (i,))))"
```

以 **charlie** 身份重新打开该条目。

✅ 可以正常返工：编辑器可编辑，Save draft / Submit 可点，**没有**只读横幅。

❌ 出现「**Another annotator is annotating this item**」—— 但根本没有这个人，后端也允许写
（`verify_user_owns_draft` 遇到 `created_by is None` 直接放行）→ 前端把无主草稿当成了别人的，
用户被挡在一次 API 本来接受的返工之外。

> 这一步改了数据库。做完直接 `python sandbox-SCRUM-25.py new` 换个干净条目，别把改过的数据留着。

---

## 验收对照表

| 步骤 | 验的是什么 | 对应 |
| --- | --- | --- |
| 1 | 无主占位草稿可以被认领 | 否则没人能开始工作 |
| 2 ⭐ | **认领之后刷新，作者仍能编辑** | `viewerId` 漏传 —— 会把作者锁在自己工作之外 |
| 3 | 顶部横幅按**持有者**归因，不按状态 | 显示缺陷 + 横幅归因错误 |
| 4 ⭐ | **输入框真的禁用，不只是按钮** | 「只读」名不副实 |
| 5 | 被占用的条目无法以任何方式写入 | 一个条目一个标注员（产品决定） |
| 6 | 别人的内容不被改动 | D6 准则 1 |
| 7 | 拒绝时给出清楚理由；读仍然允许 | D6 准则 1、2 |
| 8 | 作者完全掌控自己的草稿 | D6 准则 1 |
| 9 ⭐ | **无主的历史草稿仍可返工** | 前端不该拒绝 API 允许的操作 |

九步全过 = D6 在运行中的应用里确实闭合。

---

## 清理

```powershell
python sandbox-SCRUM-25.py clean          # 只列出将要删除的
python sandbox-SCRUM-25.py clean --yes    # 真的删除
```

只删标题为 `SCRUM-25 sandbox` 的任务，不会碰原始夹具或别人的工作。

> ⚠️ **已知问题：** 任务删除接口目前返回 **500**，所以 `clean --yes` 会报告删除动作但任务仍然
> 留着。无害（只是堆在项目列表里），但清理其实没生效。与草稿所有权无关，值得单独开一张票。
