当前 context 压缩成一句话就是：

**我们已经把项目收敛成一个 ToB-first 的 governed human judgment infrastructure，核心是 shared core。现在不是在补散页面，而是在按 process 拆控制面，Admin 已经拆到：**
1. `user / membership / role grant`
2. `organization / tenant policy`
3. `workflow policy management`

现在继续第四条：

## Operational Exception Handling

这条流程本质上是：

**当 shared-core workflow 跑不动、卡住、失败、积压时，Admin 如何发现、分诊、处理、恢复。**

它不是普通“运维告警页”，而是 **workflow operations console**。

---

## 1. 这条流程管什么

至少包括这 5 类异常：

- broken pointers
- failed imports
- blocked queues
- dispute backlog
- export failures

这些问题的共同点是：

**它们不一定是业务规则错了，而是流程执行被中断、降级、延迟或卡死。**

---

## 2. 异常类型拆分

### A. Broken pointers
含义：
- task item 指向的外部数据不可访问
- pointer 配置失效
- 权限过期
- 目标对象不存在

影响：
- task item 无法打开
- annotation / review 无法继续
- queue 里出现 blocked item

Admin 能做的动作：
- 查看 pointer failure 列表
- 看失败原因
- 重试解析
- 标记 item 为 blocked / recovered
- 协调 owner 更新 pointer 配置

---

### B. Failed imports
含义：
- AI suggestion import 失败
- payload schema 不合法
- task_item_id 对不上
- label schema mismatch
- import batch 部分成功部分失败

影响：
- AI-assisted task 没法进入正常 candidate path
- review queue 缺少 machine suggestions
- DS/CS integration 被卡住

Admin 能做的动作：
- 看 import job 状态
- 看失败批次和失败项
- 下载 / 查看 validation report
- retry import
- quarantine bad batch
- fallback 到 mock / human-first path

---

### C. Blocked queues
含义：
- queue 有 item，但没人能处理
- item 状态卡住
- assignment 不完整
- review 前置条件不满足
- pointer / import / policy 问题导致 queue 停摆

影响：
- task 仍然 active，但实际不流动
- dashboard 看起来正常，执行上已经停了

Admin 能做的动作：
- 看 queue health
- 按 blocked reason 聚类
- reassign
- reopen item
- force reroute
- freeze task 或降级运行

---

### D. Dispute backlog
含义：
- dispute case 越积越多
- secondary review / arbitrator 不足
- escalation policy 太严或处理能力不足

影响：
- finalization 变慢
- canonical judgment 积压
- export 被拖延

Admin 能做的动作：
- 看 backlog aging
- 看 severity 分布
- 调整 routing
- 增派 dispute participant / arbitrator
- 临时改变 queue priority

---

### E. Export failures
含义：
- export build 失败
- destination 不可写
- provenance 缺失导致不允许导出
- package assembly 中断

影响：
- final results 无法交付
- demo 或 client delivery 卡住

Admin 能做的动作：
- 看 export job status
- 看失败原因
- retry build / retry delivery
- 改 destination
- 标记为 blocked 并通知 owner

---

## 3. 这条流程的核心步骤

Admin 的 exception handling process 通常是：

1. 发现异常
2. 归类异常
3. 定位影响范围
4. 判断 owner 和责任域
5. 选择处理动作
6. 执行恢复 / 降级 / reroute
7. 记录操作与结果
8. 关闭或继续跟踪

也就是：

**detect -> triage -> isolate -> act -> recover -> audit**

---

## 4. 这里真正需要的“对象”

这条流程如果只做页面，会很空。它背后至少要有这些概念对象：

- `OperationalIncident` 或 `ExceptionRecord`
- `ImportJob`
- `PointerAccessFailure`
- `QueueHealthSnapshot`
- `DisputeBacklogMetric`
- `ExportJob`
- `RecoveryActionLog`

MVP 不一定全建独立表，但前端 process 最好按这些对象去想。

---

## 5. 页面怎么承载 process

这条线我建议不是一个“Admin settings page”，而是一套 operations flow：

### A. Operations Overview
展示：
- pointer failures
- failed imports
- blocked queues
- dispute backlog
- export failures
- severity / aging / owner

### B. Incident Queue
一个统一 exception table，按类型筛选：
- pointers
- imports
- queues
- disputes
- exports

### C. Incident Detail
看：
- affected organization / project / task
- root cause
- impacted items
- retry / reassign / freeze / reopen actions
- recovery history

### D. Recovery Console
执行动作：
- retry import
- refresh pointer
- reopen queue item
- escalate dispute
- rebuild export

---

## 6. 对应最小 API 面

至少要有：

- `GET /admin/incidents`
- `GET /admin/incidents/{incidentId}`
- `POST /admin/incidents/{incidentId}/retry`
- `POST /admin/incidents/{incidentId}/reassign`
- `POST /admin/incidents/{incidentId}/freeze-scope`
- `GET /admin/import-jobs`
- `GET /admin/export-jobs`
- `GET /admin/queue-health`
- `GET /admin/dispute-backlog`

如果先不做统一 incident 模型，也至少得有分散的 jobs/health endpoints。

---

## 7. 这条流程的本质

前 3 条 admin 流程是在定义：
- 谁能进来
- tenant 怎么划
- workflow 怎么跑

第 4 条是在处理：
**workflow 跑不动怎么办。**

所以它其实是：

**Admin 作为 workflow operator 的控制面**

不是设置页，不是看板，而是一个：
- 诊断
- 干预
- 恢复
- 留痕

的流程。

如果你愿意，下一步我可以继续两种走法之一：

1. 继续拆成更细的 **step-by-step process**，比如先单拆 `broken pointers handling`
2. 直接开始把 Admin 前端改成真正的 `Operations Overview -> Incident Queue -> Incident Detail` 这条流程