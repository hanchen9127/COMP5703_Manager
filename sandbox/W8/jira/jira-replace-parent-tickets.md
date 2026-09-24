# 用独立 Task 替换带子任务的父票（2026-09-22）

**起因：** Jira 规定子任务必须和父任务在同一个 sprint，而 roadmap 把这些子任务排在不同的周。把子任务转成 Task
的操作在看板上失败了（2026-09-21），所以 Hanchen 决定：**删除所有还没完成、又带子任务的父票，改建独立的 Task**。
这份文件取代 `jira-W8-sprint.md` 的 §0（转换方案作废）。

**要删的 14 张：**
- SCRUM-36（争议容器）及子任务 57、58、59、60、61；
- SCRUM-39（F1/F5，In Progress，Yi）及子任务 62（In Progress，Yi）、63；
- SCRUM-42（发布容器）及子任务 64、65、66、67。

SCRUM-6 也有子任务，但已经 Done，不动。

**新建 11 张 Task，没有子任务、也没有容器票：** 两个容器票不再重建。SCRUM-39 和 62 合并成一张 F1，63 单独成
一张 F5。

---

## 操作顺序（很重要）

1. **先建新票，再删旧票。** 删除不可恢复；先建新票，不会有哪段工作在中间"没有票"。
2. **F1 新票建好后，状态直接设成 In Progress、指派给 Yi**，并告诉 Yi：SCRUM-39 / 62 换成了新票号。
3. **删除旧的 14 张。** 旧票的原始描述已经完整保存在本文件末尾的附录里。
4. **把新票号告诉我**（旧 → 新的对应关系），我来统一更新：
   - `roadmap.md`、`mission.md` 等文档里的旧票号；
   - `story_src.csv` 的 `scrum` 列——见下面的"删除之后"。
5. 重新下载 `Jira.csv`，跑一次 `tracking-sync`。

---

## 新建的 11 张 Task

点数按 u 计（1 点 = 1u）。**只有 W8 的三张现在放进 sprint**，其余留在 backlog，到对应那周的周会再排。

| # | Summary | Story | 负责人 | Sprint | 点数 | 替换 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Provenance: Record the production history of every label | F1 | Yi | **W8**（In Progress） | 2 | SCRUM-39 + 62 |
| 2 | Dispute: Record an expert adjudication as its own decision | E3 | Hanchen | **W8** | 1.5 | SCRUM-58 |
| 3 | Dispute: Keep the disagreement after the dispute is resolved | E4 | Hanchen | **W8** | 1 | SCRUM-59 |
| 4 | Dispute: Detect reviewer disagreement automatically | E1 | — | backlog（W9） | 1.5 | SCRUM-57 |
| 5 | Release: Create an immutable release artefact | H1 | — | backlog（W9） | 2 | SCRUM-64 |
| 6 | Dispute: Connect the dispute and arbitration screens | E6 | — | backlog（W10） | 2 | SCRUM-61 |
| 7 | Release: Produce a manifest for every release | H2 | — | backlog（W10） | 2 | SCRUM-65 |
| 8 | Release: Refuse a release that fails its pre-release checks | H3 | — | backlog（W10） | 2 | SCRUM-66 |
| 9 | Provenance: Show an item's whole timeline on one screen | F5 | — | backlog（W11） | 2 | SCRUM-63 |
| 10 | Dispute: Make the escalation posture configurable and enforced | E5 | — | backlog（W11） | 2 | SCRUM-60 |
| 11 | Release: Show real releases, policy and history on the project screens | H6 | — | backlog（W11） | 2 | SCRUM-67 |

以下每段描述**原样粘贴**，第一行是 `tracking-sync` 建立映射用的，不能删。

### 1. F1 — Provenance: Record the production history of every label
```
Related to user story F1

Replaces SCRUM-39 and its subtask SCRUM-62 (deleted 2026-09-22: Jira keeps a subtask in its parent's sprint, and F5 is planned for W11).

Add a provenance event record, distinct from AuditLogDB, and write an event at each decision point: source registered, AI suggested, human responded (accepted, modified, rejected or replaced), reviewed, disputed, adjudicated, released.

# Each event names the item, its kind, the actor (a person or an AI model — the AI is an author), the time, and the record it refers to.
# Events are written at the point of decision, never reconstructed afterwards, and are never edited or deleted.
# An item's events read back in order with actor and time.
# A refused or failed action writes no event.
# The submission event joins the draft-submission transaction (routes/drafts.py:267, commit=False).
# SCRUM-48's record_item_taken helper is moved onto this record.
# Tests fail on the old behaviour and pass now.

Out of scope: which version an export carries (client follow-up F1); actor-type correction and duplicate escalation entries (F4, SCRUM-40 and 41); supersession itself (F3).
Agree the schema and migration order with the other W8 schema changes on day one.
```

### 2. E3 — Dispute: Record an expert adjudication as its own decision
```
Related to user story E3

Replaces SCRUM-58 (deleted 2026-09-22 with its parent SCRUM-36). Moved forward from W10 to W8 on 2026-09-21.

# An adjudication is its own record, separate from the escalation that requested it.
# It references the task item, the dispute (escalation) and the conflicting decisions it resolves, with who decided and when.
# Following the client's answer (2026-09-17): the expert may not finalise. decide_escalation's finalize outcome is removed, and the item returns to the reviewer. Its send_back to the annotator is reviewed against the same answer.
# The self-decision guard from SCRUM-86 (D1, issue 7) stays in force on this path.

Disputes opened by hand through escalation exist today, so this does not wait for E1. E1 (W9) then opens the same record automatically — agree its shape with Parth before W8 ends.
Open: client follow-up F2 — same reviewer or another, and whether the expert's decision binds. Asked at the 2026-09-23 meeting.
```

### 3. E4 — Dispute: Keep the disagreement after the dispute is resolved
```
Related to user story E4

Replaces SCRUM-59 (deleted 2026-09-22 with its parent SCRUM-36). Moved forward from W10 to W8 on 2026-09-21.

# Resolving a dispute adds a resolution record; it never deletes or overwrites the conflicting decisions.
# A resolved item's history still shows the original disagreement.
# Reports can tell a contested item from a unanimous one.
# A test proves that resolving a dispute deletes and overwrites nothing.
```

### 4. E1 — Dispute: Detect reviewer disagreement automatically
```
Related to user story E1

Replaces SCRUM-57 (deleted 2026-09-22 with its parent SCRUM-36). Planned for W9, with D7's sampling (SCRUM-51).

# Detect conflicting independent reviews on the same item and open a dispute without anyone reporting it — using the dispute record E3 defines in W8.
# The dispute shows both conflicting decisions and who made them.
# Disputed items are listed in one place, scoped to what the viewer may see.
# Disputed items are excluded from release until resolved.

Needs D7's second review and disagreement flag (SCRUM-51, W8) and D8's queues.
```

### 5. H1 — Release: Create an immutable release artefact
```
Related to user story H1

Replaces SCRUM-64 (deleted 2026-09-22 with its parent SCRUM-42). Planned for W9.

Today's export list is derived live from task status (project_exports_service.py) — nothing is ever written or frozen. There is no release object at all; this is the largest greenfield build in the project.

# A release record stores the items as they were at the moment of release.
# Later changes to the underlying items leave an existing release untouched.
# Each release has a stable identifier and an artefact that can be downloaded again unchanged.
```

### 6. E6 — Dispute: Connect the dispute and arbitration screens
```
Related to user story E6

Replaces SCRUM-61 (deleted 2026-09-22 with its parent SCRUM-36). Planned for W10, alongside SCRUM-52's E6 part.

# The project dispute list, the individual dispute view and the arbitration view show real cases from the backend, scoped to what the viewer may see.
# Build or delete the three routes that return notFound() — /disputes/[id], /arbitration/[id] and /exports/[id] — and record which and why.
# Verify rather than rebuild: the task dispute and finalized desks already read live data.
# An action taken on these screens changes real state, and the change survives a refresh.
```

### 7. H2 — Release: Produce a manifest for every release
```
Related to user story H2

Replaces SCRUM-65 (deleted 2026-09-22 with its parent SCRUM-42). Planned for W10.

# The manifest carries item count, the guideline and source versions covered, when it was produced and by whom.
# Each item in the release points to its provenance record.
# The release's contents can be checked against the manifest independently.

Needs F1 (provenance pointers) and F2 (versions). Written only after H3's gate passes.
```

### 8. H3 — Release: Refuse a release that fails its pre-release checks
```
Related to user story H3

Replaces SCRUM-66 (deleted 2026-09-22 with its parent SCRUM-42). Planned for W10.

# The checks run before anything is produced — a failure means no release is created.
# Refuse on unreviewed items, incomplete provenance, superseded versions, or open disputes.
# Name the items that caused the refusal and why.
# Check against the recorded decisions, never against someone asserting that review happened.

Uses H4's canonical-value rule (SCRUM-37) to recognise superseded versions.
```

### 9. F5 — Provenance: Show an item's whole timeline on one screen
```
Related to user story F5

Replaces SCRUM-63 (deleted 2026-09-22 with its parent SCRUM-39). Planned for W11.

# Show the item's timeline in order: annotation, reviews, disputes, adjudication.
# Each entry shows who, when and what changed.
# The timeline is reachable from the review screen without losing the reviewer's place.

Needs F1's events and shows supersession as F3 records it.
```

### 10. E5 — Dispute: Make the escalation posture configurable and enforced
```
Related to user story E5

Replaces SCRUM-60 (deleted 2026-09-22 with its parent SCRUM-36). Planned for W11, after G2.

# The escalation posture can be set when configuring a project or task.
# Where an expert gate is required, an item cannot complete without an expert decision.
# The posture in force is visible on the project.

The gate values already exist on OrganizationPolicyDB and are never enforced. Read them through SCRUM-50's resolved-policy contract (resolve_for_task), not from the policy tables directly; the enforcement itself is G2.
```

### 11. H6 — Release: Show real releases, policy and history on the project screens
```
Related to user story H6

Replaces SCRUM-67 (deleted 2026-09-22 with its parent SCRUM-42). Planned for W11.

# The project export list and individual export view show real releases produced by H1.
# The project policy screen shows the policy actually in force, as set in B2, and the governance posture from G2.
# Verify rather than rebuild: the task history and setup screens already read that task's real activity.
# Figures on these screens agree with the task screen and the dashboard.

Needs H1 and H2 — there are no real releases to display until they exist.
```

---

## 删除之后要收尾的事

1. **`story_src.csv` 的 `scrum` 列**：11 个 story 引用了被删的 SCRUM-36、39、42（E1、E3、E4、E5、E6、F1、F5、
   H1、H2、H3、H6）。`tracking-sync` 只会**新增**票号、不会删除，而且只要列表里有一张票不在看板上，它就：
   - 每次都报 "ticket X is not on the board snapshot"；
   - 永远不会按"所有票都 Done"判定这个 story 完成。

   所以同步把新票号加进来之后，这 3 个旧票号要从这 11 行里删掉。这是对"`scrum` 只由 `apply` 修改"这条规则的
   一次性例外，**需要 Hanchen 批准**，并记进 `tech-stack.md`。
2. **SCRUM-50（Jingwei）的描述**提到了 SCRUM-57 和 SCRUM-60，改成 E1、E5 的新票号。
3. **文档里的旧票号**：`roadmap.md`、`mission.md`、W7/W8 的消息和计划里有很多处 SCRUM-36、39、42、57–67。拿到新票号
   后统一替换；历史消息保持原样，只在需要时加注。
4. **git**：`404ffda`（SCRUM-26）的提交信息里写了 "SCRUM-62"。已提交的历史不改，留作遗留引用。
5. **告诉 Yi 和 Parth**：Yi 的 F1 换了新票号；Parth 的 E1（W9）和 SCRUM-52 的描述如果引用了 SCRUM-36，也要更新。

---

## 附录：被删票的原始内容（2026-09-21 的 `Jira.csv` 快照）

| 票 | 类型 | 状态 | 负责人 | Sprint | 点数 | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| SCRUM-36 | Task | To Do | — | — | — | Dispute: Basic Functionality |
| SCRUM-57 | Subtask | To Do | — | — | — | Dispute: Detect reviewer disagreement automatically |
| SCRUM-58 | Subtask | To Do | — | — | — | Dispute: Record an expert adjudication as its own decision |
| SCRUM-59 | Subtask | To Do | — | — | — | Dispute: Keep the disagreement after the dispute is resolved |
| SCRUM-60 | Subtask | To Do | — | — | — | Dispute: Make the escalation posture configurable and enforced |
| SCRUM-61 | Subtask | To Do | — | — | — | Dispute: Connect the dispute and arbitration screens |
| SCRUM-39 | Task | In Progress | Yi Geng | W8 | 2 | Provenance: Item-level provenance timeline |
| SCRUM-62 | Subtask | In Progress | Yi Geng | W8 | — | Provenance: Record the production history of every label |
| SCRUM-63 | Subtask | To Do | — | W8 | — | Provenance: Show an item's whole timeline on one screen |
| SCRUM-42 | Task | To Do | — | — | — | Release & Export: Basic functionality |
| SCRUM-64 | Subtask | To Do | — | — | — | Release: Create an immutable release artefact |
| SCRUM-65 | Subtask | To Do | — | — | — | Release: Produce a manifest for every release |
| SCRUM-66 | Subtask | To Do | — | — | — | Release: Refuse a release that fails its pre-release checks |
| SCRUM-67 | Subtask | To Do | — | — | — | Release: Show real releases, policy and history on the project screens |

子任务的描述都是空的。有内容的三张父票原文如下。

**SCRUM-36**
```
Related to user story E1, E3, E4, E5, E6

Container ticket covering automatic disagreement detection, adjudication records, preserving disagreement, escalation posture and the dispute screens. OVERSIZED — carries five stories. Split before estimating; see the recommended split below.
```

**SCRUM-42**
```
Container ticket covering the release object, its manifest, the pre-release gate and the export screens. OVERSIZED — carries four stories, all P0, all net-new. Split before estimating; see the recommended split below.

Story *H1* — A release is a fixed thing I can point at
Issues none

h4. Recommended split for SCRUM-42

Four stories, all P0, all net-new. There is no release object in the codebase at all — today's export list is computed live from task status, so nothing is ever written or frozen. This is the largest greenfield build in the project.
```

**SCRUM-39**（全文已并入新 F1 和 F5 的描述；原文保留如下）
```
SCRUM-39（Parent Task）：
Related to user Story F1
Related to user Story F5

Provenance for every task item: a structured, ordered, attributed record of how a label came to exist, and one screen that shows it.

Scope
* F1 (SCRUM-62): a provenance event record, separate from AuditLogDB. Events are written at the point of decision, never reconstructed afterwards. Each names the actor and the time.
* F5 (SCRUM-63): an item timeline on one screen, reachable from the review screen without losing your place.

Out of scope
* Which version an export carries (client follow-up F1).
* Actor-type correction and duplicate escalation entries (F4, SCRUM-40 and 41).
* Supersession itself (F3); the timeline only displays it.

Order: SCRUM-54 first, then SCRUM-62, then SCRUM-63. The timeline has nothing to read until events are being written.

SCRUM-62（F1）：
Story F1 — I can ask how any label came to exist.
Add a provenance event record, distinct from AuditLogDB, and write an event at each decision point:
source registered, AI suggested, human responded (accepted, modified, rejected or replaced), reviewed, disputed, adjudicated, released.
Each event: item, kind, actor (a person or an AI model, since the AI is an author), time, and the record it refers to.
Append-preserving: events are never edited or deleted.
Done when
* An item's events read back in order with actor and time.
* A refused or failed action writes no event.
* The submission event joins the draft-submission transaction (routes/drafts.py:267, commit=False).
* SCRUM-48's record_item_taken is moved onto this record.
* Tests fail on the old behaviour and pass now.
Agree the schema and migration order with the other W8 schema changes on day one.

SCRUM-63（F5）：
Story F5 — I can see an item's whole story on one screen.
Show an item's timeline in order (annotation, reviews, disputes, adjudication), with who, when and what changed on each entry.
Reachable from the review screen without losing the reviewer's place.
Depends on SCRUM-62 (events being written) and shows supersession as F3 records it.
Planned for W11; it sits in the W7 sprint on the board and should move.
```
