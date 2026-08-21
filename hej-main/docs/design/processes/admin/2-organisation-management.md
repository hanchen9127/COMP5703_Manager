第二条拆的是：**Organization / tenant policy admin 流程**

这条流程不是“建个组织名字”那么简单，核心是：

**定义谁是边界、边界内允许什么、以及这个 tenant 用什么治理规则运行。**

---

**1. Organization lifecycle**

Admin 要能做：

1. 创建 organization
2. 设置 organization 基本信息
3. 设置状态
4. 查看 organization 下 project / member / export / dispute 概况
5. 必要时冻结或归档 organization

最小状态可以先是：
- `active`
- `restricted`
- `suspended`
- `archived`

这里的含义是：
- `active`: 正常运行
- `restricted`: 可读多、可写少
- `suspended`: 暂停运营
- `archived`: 纯历史

对应数据：
- `Organization`

---

**2. Tenant boundary definition**

这是这个流程最核心的部分。

Admin 要决定：

- 哪些用户属于这个 tenant
- 哪些 project 属于这个 tenant
- 哪些 export 属于这个 tenant
- 是否允许跨 tenant 访问
- dispute / arbitration / export 是否只能在 tenant 内完成

默认原则应该是：

**strict tenant boundary**

也就是：
- project 不跨 tenant
- task 不跨 tenant
- canonical judgment 不跨 tenant
- export package 不跨 tenant
- 权限按 tenant resolve

---

**3. Tenant governance policy**

这部分决定“这个组织怎么跑流程”。

Admin 要能配置：

- membership approval policy
- role grant policy
- review strictness
- dispute escalation threshold
- arbitration routing policy
- export control policy
- provenance retention policy

也就是说 organization 不只是个容器，它还有一套 policy bundle。

可以先收敛成一个：
- `TenantPolicy`
或者拆成多个 policy object，后面再细化。

---

**4. Operational effect of tenant policy**

这些 policy 不能只是配置展示，必须影响流程。

举例：

- `membership approval = admin sign-off`
  -> 新成员不能立即 active

- `review strictness = dual sign-off`
  -> task item 不能一次 review 就 finalized

- `export control = provenance required`
  -> 没 provenance 的 export 不能生成

- `dispute routing = expert gate`
  -> dispute 不能直接 resolved，必须进 arbitration

也就是说：
**tenant policy 是 workflow 的外层约束器**

---

**5. Admin 真实操作流程**

如果落成 process，大概是：

1. Admin 创建或进入一个 organization
2. 打开 tenant overview
3. 看 tenant 当前状态和关键指标
4. 进入 policy configuration
5. 修改 policy
6. 保存并生效
7. 系统后续 task / review / dispute / export 流程按此执行

这条流程比 user management 更“控制面”。

---

**6. 对应页面结构**

我建议这条线至少有 3 个 admin surface：

1. `Organizations`
   organization list + status + scale summary

2. `Organization Detail`
   organization 概览、成员、projects、risk posture

3. `Tenant Policy`
   policy sections:
   - membership
   - review
   - dispute
   - export
   - provenance

如果做成一个更成熟的 flow，可以是：
- list
- detail
- policy editor
- audit log

---

**7. 对应最小 API 面**

至少要有：

- `GET /organizations`
- `POST /organizations`
- `GET /organizations/{orgId}`
- `PATCH /organizations/{orgId}`
- `GET /organizations/{orgId}/policy`
- `PATCH /organizations/{orgId}/policy`

如果拆 policy：
- `GET /organizations/{orgId}/review-policy`
- `GET /organizations/{orgId}/export-policy`
之类，但 MVP 不一定要这么碎。

---

**8. 这条流程的本质**

这条线的 Admin 不在“管理客户资料”，而是在：

**定义 tenant boundary + governance regime**

也就是说，组织在你们系统里同时是：
- ownership boundary
- permission boundary
- policy boundary
- export boundary

所以这条流程决定的是：
**这个组织怎样成为一个可运行的 judgment domain**

如果你愿意，下一条我继续拆第三条：
**Workflow policy management 流程**
这条会更接近 `task setup / review / dispute / export` 的规则控制。