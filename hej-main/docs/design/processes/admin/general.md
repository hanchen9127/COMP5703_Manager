如果先不看页面，**只看这个项目定位**，Admin 在这个 ToB governed human judgment infrastructure 里，应该做的是这几类事：

**1. Identity 与 Access Admin**
这是最基础的一层。

Admin 要能：
- 管用户账号
- 看 organization membership
- 分配 / 撤销角色
- 控制谁能进哪个 tenant / project
- 控制 2FA、账号状态、受限访问

对应对象：
- `User`
- `OrganizationUser`
- `RoleAssignment`
- `Session / Access posture`

**2. Tenant / Organization Admin**
Admin 不是只管“人”，还要管 tenant 边界。

Admin 要能：
- 创建 / 管理 organization
- 维护 organization 的隔离边界
- 配 organization 级 governance policy
- 管 organization 的成员与权限模型

对应对象：
- `Organization`
- `OrganizationPolicy`

**3. Project Governance Admin**
项目不只是 task 容器，还是治理范围。

Admin 要能：
- 看 project 列表和状态
- 介入 project 的 policy ownership
- 控制哪些 project 可以创建 task / export / dispute
- 做 project 级审计和冻结

对应对象：
- `Project`
- `Project policy set`

**4. Workflow Policy Admin**
这是你们平台和普通 annotation tool 不一样的地方。

Admin 要能配置或审核：
- annotation mode policy
- review policy
- dispute escalation policy
- arbitration routing policy
- export policy
- provenance retention policy

也就是：  
**Admin 决定流程规则，不只是看数据。**

**5. Operational Queue / Exception Admin**
Admin 还要管“出问题的流程”。

Admin 要能：
- 看 blocked task / broken pointer / failed export
- 看 dispute backlog
- 看 arbitration queue
- 看 import failures / integration failures
- 做 retry / reassign / freeze / reopen

这部分更像 operations console。

**6. Audit / Compliance Admin**
因为你们是 governance-first 平台，这个很关键。

Admin 要能：
- 查谁改了什么
- 查 role grant 历史
- 查 task / dispute / export 的关键操作日志
- 查 canonical judgment 的 provenance
- 为老师 / client / reviewer 提供审计证据

**7. Bootstrap / Platform Admin**
这是更高权限的一层，不一定一开始全做，但概念上应该有。

Admin 要能：
- 初始化 tenant
- 初始化默认角色
- 初始化 policy templates
- 配 annotation runtime / AI import / storage integration 的平台级设置

---

所以如果压成一句话：

**这个项目里的 Admin，不是“后台设置页”。**
**它本质上是 identity + tenant governance + workflow policy + operational control 的控制面。**

我建议你下一步别先画页面，而是先把 Admin 拆成这 4 条主流程：

1. `User / membership / role grant`
2. `Organization / tenant policy`
3. `Workflow policy management`
4. `Operational exception handling`

然后我们再逐条说：
- actor 是谁
- 入口在哪
- step-by-step process 是什么
- 页面怎么串
- 后端要哪些接口