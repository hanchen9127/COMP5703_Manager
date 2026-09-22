# W8 sprint 的 Jira 录入清单（24–30 Sep）

2026-09-21 定稿。依据是 `../../specs/roadmap.md` 的 W8 一节。点数沿用 u（1 点 = 1u = 2–3 个子任务，按 0.5
递增），按每张票**当前的实际范围**重估。**从 W7 顺延的票照常放进 W8，但不计入 W8 负载**（2026-09-21 定）。

看板规则提醒：
- 每张票描述的第一行必须是 `Related to user story X`，`tracking-sync` 靠它建立映射，不能删。
- W8 sprint：**周四 9/24 00:00 → 周三 9/30 21:00**（会后结束）。
- 关闭 W7 sprint 时，Jira 会问怎么处理未完成的票，选"移到 W8"——那就是下面第 4 节的顺延票。

---

## 0. ~~先做：把跨 sprint 的子任务改成独立 Task~~ —— 作废（2026-09-22）

> **转换在看板上失败了。** 改为删除这些父票、新建独立 Task，见 **`jira-replace-parent-tickets.md`**。下面这一节和本文件里
> 所有提到 SCRUM-36、39、58、59、63 的地方，都以那份文件为准。

**Jira 规则：子任务必须和父任务在同一个 sprint**（2026-09-21 录入时发现）。所以凡是 roadmap 排在不同周的子任务，
都要先改成 Task（子任务页面 → `…` → 更改工作类型 / Change work type → **Task**），再设 sprint 和点数。

| 票 | 原父任务 | 改成 Task 后描述**第一行** | 第二行 | 何时做 |
| --- | --- | --- | --- | --- |
| SCRUM-58 | SCRUM-36 | `Related to user story E3` | `Part of SCRUM-36` | **现在（W8）** |
| SCRUM-59 | SCRUM-36 | `Related to user story E4` | `Part of SCRUM-36` | **现在（W8）** |
| SCRUM-63 | SCRUM-39 | `Related to user story F5` | `Part of SCRUM-39` | **现在**——它要离开 W8，而 SCRUM-39 和 62 留在 W8 |
| SCRUM-57 | SCRUM-36 | `Related to user story E1` | `Part of SCRUM-36` | W9 排期前 |
| SCRUM-61 | SCRUM-36 | `Related to user story E6` | `Part of SCRUM-36` | W10 排期前 |
| SCRUM-60 | SCRUM-36 | `Related to user story E5` | `Part of SCRUM-36` | W11 排期前 |
| SCRUM-64 | SCRUM-42 | `Related to user story H1` | `Part of SCRUM-42` | W9 排期前 |
| SCRUM-65 | SCRUM-42 | `Related to user story H2` | `Part of SCRUM-42` | W10 排期前 |
| SCRUM-66 | SCRUM-42 | `Related to user story H3` | `Part of SCRUM-42` | W10 排期前 |
| SCRUM-67 | SCRUM-42 | `Related to user story H6` | `Part of SCRUM-42` | W11 排期前 |

- **第一行必须有**：改成 Task 后它不再从父任务继承 story，`tracking-sync` 只认描述里的
  `Related to user story X`。
- SCRUM-62 **保持子任务**：它和 SCRUM-39 都在 W8。
- **SCRUM-36、SCRUM-42 变成容器票**：不打点、不进 sprint；拆出去的票全部 Done 之后再关闭。它们描述第一行的
  `Related to user story …` 保留——那是现有映射，`tracking-sync` 只增不删。
- 其余几张（57、60、61、64–67）不急，排到对应周之前改就行；一次全改也可以。

---

## 1. 字段改动一览

| 票 | 负责人 | Sprint | 点数 | 备注 |
| --- | --- | --- | --- | --- |
| SCRUM-93 | Kanishka | W8 | 2 → **2.5** | 加上 S10，描述见 §3 |
| SCRUM-86 | Parth | W8 | 1 | 不变 |
| SCRUM-51 | Parth | W8 | 1.5 | 不变（D7 第一部分） |
| **新票：D2 剩余** | Parth | W8 | **1** | 新建，见 §2 |
| SCRUM-27 | Jingwei | W7 → **W8** | 2 | W7 结束时如未完成就移过来 |
| SCRUM-39 | Yi | W8 | 2 | 不变；子任务 SCRUM-62 不打点 |
| SCRUM-3 | Michael | W8 | 0.5 → **1.5** | 5 个后续项已加进描述 |
| SCRUM-46 | Michael | W8 | 1 → **1.5** | 加一句，见 §3 |
| SCRUM-5 | Michael → **Tim** | W8 | 0.5 → **1** | 换人 |
| SCRUM-24 | （无）→ **Dishank** | W8 | 2 → **2.5** | 加 issue 30，见 §3 |
| **SCRUM-58** | （无）→ **Hanchen** | （无）→ **W8** | **1.5** | 描述见 §2 |
| **SCRUM-59** | （无）→ **Hanchen** | （无）→ **W8** | **1** | 描述见 §2 |
| SCRUM-36 | — | （无） | **不打点** | 容器票，描述见 §2 |
| SCRUM-63 | — | W8 → **移出**（W11） | — | 依赖 F1 和 F3，W8 做不了。**先按 §0 改成 Task**，否则它离不开 SCRUM-39 所在的 W8 |

**SCRUM-58、59 按 §0 先改成 Task**：一是子任务不能和父任务 SCRUM-36 分属不同 sprint，二是子任务没有
*Story point estimate* 字段，点数进不了 sprint 统计。

---

## 2. 新建或重写描述的票

### 新票 —— D2 剩余子任务（Parth）

**Summary**
```
Review: Review actions always move item status, and state cannot diverge from history
```

**Description**
```
Related to user story D2

ONLY BACKEND

SCRUM-29 closed D2's first part: the legacy review writes return 410 (PR #6). D2's subtasks 2 and 4 have no code yet, so this ticket carries them.

# Every review action moves the task item to the status it implies, in the same write — no action leaves the item where it was.
# A test proves item status and review history cannot diverge: after any sequence of review actions, the item's status matches what its latest decision implies.

Same file as SCRUM-86 (review_actions.py): land after SCRUM-86, or in the same PR.
```

### SCRUM-58 —— 专家裁决作为独立决定（Hanchen）

**Description（整篇替换，原来是空的）**
```
Related to user story E3

Part of SCRUM-36 (converted from a subtask so it can sit in its own sprint). Moved forward from W10 to W8 on 2026-09-21.

# An adjudication is its own record, separate from the escalation that requested it.
# It references the task item, the dispute (escalation) and the conflicting decisions it resolves, with who decided and when.
# Following the client's answer (2026-09-17): the expert may not finalise. decide_escalation's finalize outcome is removed, and the item returns to the reviewer. Its send_back to the annotator is reviewed against the same answer.
# The self-decision guard from SCRUM-86 (D1, issue 7) stays in force on this path.

Disputes opened by hand through escalation exist today, so this does not wait for E1. E1 (SCRUM-57, W9) then opens the same record automatically — agree its shape with Parth before W8 ends.
Open: client follow-up F2 — same reviewer or another, and whether the expert's decision binds. Asked at the 2026-09-23 meeting.
```

### SCRUM-59 —— 解决争议后保留分歧（Hanchen）

**Description（整篇替换，原来是空的）**
```
Related to user story E4

Part of SCRUM-36 (converted from a subtask so it can sit in its own sprint). Moved forward from W10 to W8 on 2026-09-21.

# Resolving a dispute adds a resolution record; it never deletes or overwrites the conflicting decisions.
# A resolved item's history still shows the original disagreement.
# Reports can tell a contested item from a unanimous one.
# A test proves that resolving a dispute deletes and overwrites nothing.
```

### SCRUM-36 —— 容器票（不打点）

**Description（整篇替换）**
```
Related to user story E1, E3, E4, E5, E6

Container for the dispute stories. It carries no points, no assignee and no sprint. Split 2026-09-21 into standalone tasks (Jira keeps a subtask in its parent's sprint, and these span W8–W11), in dependency order:

# SCRUM-58 — E3: an adjudication is its own record; the expert no longer finalises. W8, Hanchen.
# SCRUM-59 — E4: resolution adds, never overwrites. W8, Hanchen.
# SCRUM-57 — E1: detect reviewer disagreement and open the same dispute record automatically. W9, with D7 (SCRUM-51).
# SCRUM-61 — E6: real cases on the dispute and arbitration screens; build or delete the three notFound() routes. W10.
# SCRUM-60 — E5: escalation posture configurable and enforced. W11, after G2 (SCRUM-50).

SCRUM-52 (Parth) carries the adjudicator queue and who may adjudicate (E3's authorisation part, W10).
```

---

## 3. 追加到现有描述的内容

**SCRUM-93（Kanishka）** —— 追加到末尾：
```
Also fixes S10, found in SCRUM-26's manual walkthrough: on a returned item, Save draft reverts the editor to the previously submitted answer and saves that instead. Two causes: selectDraftForViewer (lib/task-workspace-data.ts) prefers the viewer's submitted draft over their pending one, and the editor's initialising effect (components/task-item-workspace-sheet.tsx) is keyed on the whole item object, so a re-render discards unsaved typing. Prefer the viewer's own pending draft, and key the effect on item.id. With several annotators per item, picking the wrong draft could show another annotator's work.
```

**SCRUM-46（Michael）** —— 追加到末尾：
```
Scope (from PR #22's review): a successful AI item becomes a submitted annotation authored by the AI, written through SCRUM-26's atomic submission path, and linked from a new result_annotation_id column on ai_item_jobs. That column needs a migration step.
```

**SCRUM-5（Tim）** —— 追加到末尾：
```
Moved from Michael to Tim on 2026-09-21. Reads the job tables SCRUM-3 changes — agree the fields with Michael on day one.
```

**SCRUM-24（Dishank）** —— 追加到末尾（如果描述里还没有 issue 30）：
```
Also issue 30: deleting a task or project that has items returns 500 on a foreign-key error. Decide the policy first — is a task holding review history deletable at all? — then implement it.
```

---

## 4. 从 W7 顺延的票（不计入 W8 负载）

关闭 W7 sprint 时把它们移到 W8，点数照旧留在票上：

| 票 | 负责人 | 点数 | 剩下什么 |
| --- | --- | --- | --- |
| SCRUM-48 | Kanishka | 2 | 队列 API；SCRUM-93 建在它上面，先合并 |
| SCRUM-90 | Tim | 2 | 成员管理界面和被邀请人的接受界面 |
| SCRUM-50 | Jingwei | 1 → **1.5** | 他计划里的 Phase 1、2、5；Phase 3、4 随 G2 放到 W11 |

**注意：** Jira 的 sprint 报表会把顺延票的点数算进 W8 的总数（约 24.5 点），而 roadmap 里 W8 计入的是 **19u**。
两个数字不一致是正常的——口径不同，roadmap 那个才是计划负载。

---

## 5. 每人 W8 负载（只算计入的部分）

| 人 | 票 | 负载 |
| --- | --- | --- |
| Parth | SCRUM-86、SCRUM-51、D2 剩余 | 3.5 |
| Michael | SCRUM-3、SCRUM-46 | 3 |
| Hanchen | SCRUM-58、SCRUM-59 | 2.5 |
| Kanishka | SCRUM-93 | 2.5 |
| Dishank | SCRUM-24 | 2.5 |
| Jingwei | SCRUM-27 | 2 |
| Yi | SCRUM-39 / 62 | 2 |
| Tim | SCRUM-5 | 1（顺延的 SCRUM-90 占满其余时间，按决定不再加） |
| **合计** | | **19u** |

---

## 录入后

1. 重新下载 `Jira.csv`，跑一次 `tracking-sync`：新票会按 `Related to user story D2` 自动映射，SCRUM-58、59 会挂到
   E3、E4，allocation 也会跟着更新。
2. 在 W8 周会（9/23 会后）上过一遍每人的票，特别是两处协作：
   - SCRUM-86 头两天先合并，Hanchen 在它之上改 `decide_escalation`；
   - W8 有五组改 schema，第一天定好一条迁移路径。
