先拆第一条：**Admin 管理 `user / membership / role grant` 的完整流程**。

这条流程本质上是：

**人先存在**
-> **进入某个 organization**
-> **拿到角色**
-> **角色决定他能看到和操作什么**

---

**1. User lifecycle**

Admin 要处理的动作：

1. 创建用户或邀请用户
2. 用户完成激活
3. Admin 查看用户基本状态
4. 必要时暂停、恢复、限制账号
5. 检查 2FA / access posture

对应功能：
- user list
- user detail
- invite user
- activate / suspend / restrict
- auth posture inspection

对应数据：
- `User`
- `AccountStatus`
- `SecurityPosture`

---

**2. Membership lifecycle**

用户不是天然就在 tenant 里，得先进入 organization。

流程：

1. Admin 选择一个 organization
2. 添加用户进入该 organization
3. 设置 membership 状态
4. 用户在该 tenant 内可见
5. 退出或移除 membership

状态可以先简单定成：
- `invited`
- `active`
- `restricted`
- `removed`

对应功能：
- member directory
- add member to organization
- change membership status
- remove member

对应数据：
- `OrganizationUser`

---

**3. Role grant lifecycle**

membership 解决“你是不是这个 tenant 的人”，  
role grant 解决“你能干什么”。

流程：

1. Admin 进入某个 member detail
2. 查看当前 roles
3. 添加 role
4. 撤销 role
5. 角色变化立刻影响 UI 和 API 权限

最小角色集可以是：
- `admin`
- `task_owner`
- `annotator`
- `reviewer`
- `dispute_participant`
- `arbitrator`

对应功能：
- role assignment list
- grant role
- revoke role
- role history / audit log

对应数据：
- `RoleAssignment`

---

**4. Access resolution process**

这是最关键的一步，前面三条最后都要落到这里。

当用户登录后，系统要做：

1. 识别 `User`
2. 找到他有哪些 `OrganizationUser`
3. 在当前 tenant 下加载 `RoleAssignment`
4. 拼成当前 access context
5. 前端导航、按钮、页面、后端接口都按这个 context 控制

也就是：

**Admin 改的是用户、membership、role**
**系统运行时真正用的是 resolved access context**

---

**5. Admin 真实页面流程**

如果落成 UI，我建议 admin 这一条线至少拆成 3 个页面/过程：

1. `Members`
   看所有成员、状态、2FA、最近活跃、所属 tenant

2. `Member Detail`
   看单个用户资料、membership、roles、审计信息

3. `Role Grants`
   做 grant / revoke，查看权限影响范围

也可以是：
- 左侧 member list
- 中间 member detail
- 右侧 role grant panel

这个会比一个 flat admin page 更像 process。

---

**6. 对应的最小 API 面**

至少要有：

- `GET /users/me`
- `GET /organizations/{orgId}/members`
- `POST /organizations/{orgId}/members`
- `PATCH /organizations/{orgId}/members/{memberId}`
- `GET /organizations/{orgId}/role-assignments`
- `POST /organizations/{orgId}/role-assignments`
- `DELETE /organizations/{orgId}/role-assignments/{assignmentId}`

---

**7. 这条流程的核心判断**

Admin 在这条线上不是“编辑用户资料”。

它真正做的是：
- 控 tenant 边界
- 控谁能进入流程
- 控谁能做 review / dispute / arbitration
- 控整个平台的 authority graph

所以这条流程其实是整个系统的入口控制面。