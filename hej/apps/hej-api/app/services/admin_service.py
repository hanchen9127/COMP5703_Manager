"""
AdminService - 管理员相关的业务逻辑服务

责任：
1. Organization 管理（创建、更新、详情）
2. Policy 管理
3. Member 管理（邀请、接受、列表）
4. Role 管理（分配、撤销）
5. 审计日志
"""

from datetime import datetime, UTC
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.admin import (
    User, Organization, OrganizationUser, OrganizationUserStatus,
    RoleAssignment, RoleScope, OrganizationPolicy,
    DisputeEscalationGate, AccountStatus
)
from app.repositories.db_store import DBStore
from app.core.security import is_org_admin, create_invitation_token
from app.services.id_service import new_id
from app.services.audit_log_service import AuditLogService

ORG_POLICY_AUDIT_FIELDS = (
    "membership_approval_required",
    "review_dual_sign_off",
    "review_auto_escalate_disagreement",
    "dispute_escalation_gate",
    "dispute_escalation_threshold",
    "export_provenance_required",
    "export_retention_days",
    "annotation_mode",
)


class AdminService:
    """管理服务"""
    
    # ============ Organization 管理 ============
    
    @staticmethod
    def create_organization(db: Session, name: str, slug: str, description: str | None, created_by: int) -> dict:
        """创建 organization
        
        creator 自动成为 admin
        """
        store = DBStore(db)
        
        # Step 1: 检查权限 - creator 必须是 active 用户
        creator = store.users.get(created_by)
        if not creator or creator.account_status != AccountStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only active users can create organizations"
            )
        
        # Step 2: 检查 slug 唯一性
        for org in store.organizations.values():
            if org.slug == slug:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Slug '{slug}' is already taken"
                )
        
        # Step 3: 创建 Organization
        org_id = max([o.id for o in store.organizations.values()] or [0]) + 1
        new_org = Organization(
            id=org_id,
            name=name,
            slug=slug,
            status="active",
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC)
        )
        store.organizations[org_id] = new_org
        
        # Step 4: 自动添加 creator 为成员（active）
        org_user_id = max([ou.id for ou in store.organization_users.values()] or [0]) + 1
        org_user = OrganizationUser(
            id=org_user_id,
            user_id=created_by,
            organization_id=org_id,
            status=OrganizationUserStatus.ACTIVE,
            invited_at=datetime.now(UTC),
            accepted_at=datetime.now(UTC),
            invited_by=created_by
        )
        store.organization_users[org_user_id] = org_user
        
        # Step 5: 自动赋予 creator admin 角色
        role_id = max([r.id for r in store.role_assignments.values()] or [0]) + 1
        admin_role = RoleAssignment(
            id=role_id,
            user_id=created_by,
            organization_id=org_id,
            project_id=None,
            role_key="admin",
            role_name="Administrator",
            scope=RoleScope.ORGANIZATION,
            granted_by=created_by,
            granted_at=datetime.now(UTC)
        )
        store.role_assignments[role_id] = admin_role
        
        # Step 6: 创建默认 Policy
        policy_id = max([p.id for p in store.organization_policies.values()] or [0]) + 1
        policy = OrganizationPolicy(
            id=policy_id,
            organization_id=org_id,
            membership_approval_required=False,
            review_dual_sign_off=False,
            review_auto_escalate_disagreement=False,
            dispute_escalation_gate=DisputeEscalationGate.NONE,
            dispute_escalation_threshold=100,
            export_provenance_required=True,
            export_retention_days=365,
            annotation_mode="human_first",
            updated_by=created_by
        )
        store.organization_policies[org_id] = policy
        
        # Step 7: 记录审计日志
        AdminService._log_audit(
            db=db,
            actor_user_id=created_by,
            action="organization_created",
            resource_type="organization",
            resource_id=org_id,
            organization_id=org_id,
            reason=f"Created organization: {name}"
        )
        
        return {
            "organization_id": org_id,
            "name": name,
            "slug": slug,
            "status": "active",
            "created_by": created_by,
            "message": "Organization 创建成功"
        }
    
    @staticmethod
    def get_organization(db: Session, org_id: int, user_id: int) -> dict:
        """获取 organization 详情
        
        权限: 需要是该 org 的成员
        """
        store = DBStore(db)
        
        # Permission check
        if not AdminService._is_org_member(db, user_id, org_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this organization"
            )
        
        org = store.organizations.get(org_id)
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization does not exist"
            )
        
        # 统计成员和 admin 数量（除removed之外的所有成员）
        member_count = sum(1 for ou in store.organization_users.values() 
                          if ou.organization_id == org_id and ou.status != "removed")
        admin_count = 0
        for role in store.role_assignments.values():
            if role.organization_id == org_id and role.role_key == "admin" and role.revoked_at is None:
                # 确保这个 admin 确实是非removed成员
                for ou in store.organization_users.values():
                    if ou.user_id == role.user_id and ou.organization_id == org_id and ou.status != "removed":
                        admin_count += 1
                        break
        
        policy = store.organization_policies.get_by_organization_id(org_id)
        
        return {
            "id": org.id,
            "name": org.name,
            "slug": org.slug,
            "status": org.status,
            "created_at": org.created_at,
            "member_count": member_count,
            "admin_count": admin_count,
            "policy": {
                "id": policy.id,
                "organization_id": policy.organization_id,
                "membership_approval_required": policy.membership_approval_required,
                "review_dual_sign_off": policy.review_dual_sign_off,
                "review_auto_escalate_disagreement": policy.review_auto_escalate_disagreement,
                "dispute_escalation_gate": policy.dispute_escalation_gate,
                "dispute_escalation_threshold": policy.dispute_escalation_threshold,
                "export_provenance_required": policy.export_provenance_required,
                "export_retention_days": policy.export_retention_days,
                "annotation_mode": policy.annotation_mode
            } if policy else {}
        }
    
    @staticmethod
    def update_organization(db: Session, org_id: int, name: str | None, description: str | None, user_id: int) -> dict:
        """更新 organization（仅 admin）
        
        权限: org admin only
        """
        store = DBStore(db)
        
        if not AdminService._is_org_admin(db, user_id, org_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin can modify organization"
            )
        
        org = store.organizations.get(org_id)
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization does not exist"
            )
        
        # Record old values
        old_values = {"name": org.name}
        
        # 更新
        if name:
            org.name = name
        org.updated_at = datetime.now(UTC)
        
        # 记录审计
        new_values = {"name": org.name}
        AdminService._log_audit(
            db=db,
            actor_user_id=user_id,
            action="organization_updated",
            resource_type="organization",
            resource_id=org_id,
            organization_id=org_id,
            changes={"before": old_values, "after": new_values}
        )
        
        return {
            "organization_id": org_id,
            "updated_at": org.updated_at,
            "message": "Organization 更新成功"
        }
    
    @staticmethod
    def update_policy(db: Session, org_id: int, user_id: int, **kwargs) -> dict:
        """更新 organization policy（仅 admin）
        
        权限: org admin only
        原子操作: 所有字段一起更新
        """
        store = DBStore(db)
        
        if not AdminService._is_org_admin(db, user_id, org_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin can modify policy"
            )
        
        policy = store.organization_policies.get_by_organization_id(org_id)
        if not policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Policy does not exist"
            )

        old_values = {
            field: getattr(policy, field, None) for field in ORG_POLICY_AUDIT_FIELDS
        }

        for key, value in kwargs.items():
            if value is not None and hasattr(policy, key):
                setattr(policy, key, value)

        policy.updated_at = datetime.now(UTC)
        policy.updated_by = user_id
        policy = store.organization_policies.update(policy)

        new_values = {
            field: getattr(policy, field, None) for field in ORG_POLICY_AUDIT_FIELDS
        }
        gate = policy.dispute_escalation_gate
        old_values["dispute_escalation_gate"] = (
            old_values["dispute_escalation_gate"].value
            if hasattr(old_values["dispute_escalation_gate"], "value")
            else old_values["dispute_escalation_gate"]
        )
        new_values["dispute_escalation_gate"] = (
            gate.value if hasattr(gate, "value") else gate
        )

        AdminService._log_audit(
            db=db,
            actor_user_id=user_id,
            action="policy_updated",
            resource_type="policy",
            resource_id=policy.id,
            organization_id=org_id,
            changes={"before": old_values, "after": new_values},
        )

        return {
            "organization_id": org_id,
            "updated_at": policy.updated_at,
            "policy": {
                "id": policy.id,
                "organization_id": policy.organization_id,
                "membership_approval_required": policy.membership_approval_required,
                "review_dual_sign_off": policy.review_dual_sign_off,
                "review_auto_escalate_disagreement": policy.review_auto_escalate_disagreement,
                "dispute_escalation_gate": new_values["dispute_escalation_gate"],
                "dispute_escalation_threshold": policy.dispute_escalation_threshold,
                "export_provenance_required": policy.export_provenance_required,
                "export_retention_days": policy.export_retention_days,
                "annotation_mode": policy.annotation_mode,
            },
            "message": "Policy 更新成功",
        }
    
    # ============ Member 管理 ============
    
    @staticmethod
    def invite_member(db: Session, org_id: int, email: str, user_id: int) -> dict:
        """邀请用户加入 organization（仅 admin）
        
        权限: org admin only
        """
        store = DBStore(db)
        
        if not AdminService._is_org_admin(db, user_id, org_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin can invite members"
            )
        
        # 检查 org 是否存在且 active
        org = store.organizations.get(org_id)
        if not org or org.status != "active":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization does not exist or is unavailable"
            )
        
        # 查找目标用户
        target_user = None
        for u in store.users.values():
            if u.email == email:
                target_user = u
                break
        
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {email} does not exist, please register first"
            )
        
        # 检查是否已是成员
        for ou in store.organization_users.values():
            if ou.user_id == target_user.id and ou.organization_id == org_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This user is already a member of this organization"
                )
        
        # 创建 OrganizationUser
        org_user_id = max([ou.id for ou in store.organization_users.values()] or [0]) + 1
        org_user = OrganizationUser(
            id=org_user_id,
            user_id=target_user.id,
            organization_id=org_id,
            status=OrganizationUserStatus.ACTIVE,
            invited_at=datetime.now(UTC),
            invited_by=user_id,
            accepted_at=datetime.now(UTC)  # Admin invite is automatically accepted
        )
        store.organization_users[org_user_id] = org_user
        
        # 记录审计
        AdminService._log_audit(
            db=db,
            actor_user_id=user_id,
            action="member_invited",
            resource_type="organization_user",
            resource_id=org_user_id,
            organization_id=org_id,
            reason=f"Invited {email}"
        )
        
        # TODO: 发送邀请邮件
        invitation_token = create_invitation_token(target_user.id, org_id)
        
        return {
            "member_id": org_user_id,
            "user_id": target_user.id,
            "user_email": target_user.email,
            "organization_id": org_id,
            "status": "invited",
            "invited_at": org_user.invited_at,
            "invitation_token": invitation_token,  # 实际应该放在邮件中
            "message": f"已邀请 {email}"
        }
    
    @staticmethod
    def accept_invitation(db: Session, user_id: int, org_id: int) -> dict:
        """接受邀请
        
        用户点击邮件中的链接后调用此接口
        """
        store = DBStore(db)
        
        # 查找 OrganizationUser
        org_user = None
        for ou in store.organization_users.values():
            if ou.user_id == user_id and ou.organization_id == org_id:
                org_user = ou
                break
        
        if not org_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation does not exist"
            )
        
        if org_user.status != OrganizationUserStatus.INVITED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Invitation already {org_user.status}"
            )
        
        # 更新状态为 active
        org_user.status = OrganizationUserStatus.ACTIVE
        org_user.accepted_at = datetime.now(UTC)
        
        # 记录审计
        AdminService._log_audit(
            db=db,
            actor_user_id=user_id,
            action="invitation_accepted",
            resource_type="organization_user",
            resource_id=org_user.id,
            organization_id=org_id
        )
        
        return {
            "member_id": org_user.id,
            "status": "active",
            "accepted_at": org_user.accepted_at,
            "message": f"已加入 organization {org_id}"
        }
    
    @staticmethod
    def list_members(db: Session, org_id: int, user_id: int) -> dict:
        """列出 organization 的所有成员
        
        权限: 需要是该 org 的成员
        """
        store = DBStore(db)
        
        if not AdminService._is_org_member(db, user_id, org_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this organization"
            )
        
        members = []
        for org_user in store.organization_users.values():
            if org_user.organization_id != org_id:
                continue
            if org_user.status == OrganizationUserStatus.REMOVED:
                continue  # Do not show removed members
            
            user = store.users.get(org_user.user_id)
            if not user:
                continue
            
            # 查询该成员的角色
            roles = []
            is_admin = False
            for role in store.role_assignments.values():
                if role.user_id == org_user.user_id and role.organization_id == org_id and role.revoked_at is None:
                    roles.append(role.role_key)
                    if role.role_key == "admin":
                        is_admin = True
            
            members.append({
                "id": org_user.id,
                "user_id": org_user.user_id,
                "user_email": user.email,
                "status": org_user.status,
                "roles": roles,
                "is_admin": is_admin,
                "invited_at": org_user.invited_at,
                "accepted_at": org_user.accepted_at,
                "invited_by": org_user.invited_by
            })
        
        return {
            "organization_id": org_id,
            "total_count": len(members),
            "members": members
        }
    
    # ============ Role 管理 ============
    
    @staticmethod
    def assign_role(db: Session, org_id: int, user_id: int, role_key: str, admin_id: int) -> dict:
        """分配角色给成员（仅 admin）
        
        权限: org admin only
        """
        store = DBStore(db)
        
        if not AdminService._is_org_admin(db, admin_id, org_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="只有 admin 才能分配角色"
            )
        
        # 验证 role_key
        valid_roles = ["admin", "task_owner", "annotator", "reviewer", "arbitrator", "dispute_participant"]
        if role_key not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"无效的角色，必须是: {valid_roles}"
            )
        
        # 检查目标用户是否是 active 成员
        target_org_user = None
        for ou in store.organization_users.values():
            if ou.user_id == user_id and ou.organization_id == org_id:
                target_org_user = ou
                break
        
        if not target_org_user or target_org_user.status != OrganizationUserStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="目标用户必须先接受邀请成为 active 成员"
            )
        
        # 检查是否已有此角色
        for role in store.role_assignments.values():
            if (role.user_id == user_id and role.organization_id == org_id and 
                role.role_key == role_key and role.revoked_at is None):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"用户已有 {role_key} 角色"
                )
        
        # 创建 RoleAssignment
        role_id = max([r.id for r in store.role_assignments.values()] or [0]) + 1
        new_role = RoleAssignment(
            id=role_id,
            user_id=user_id,
            organization_id=org_id,
            project_id=None,
            role_key=role_key,
            role_name=role_key.replace("_", " ").title(),
            scope=RoleScope.ORGANIZATION,
            granted_by=admin_id,
            granted_at=datetime.now(UTC)
        )
        store.role_assignments[role_id] = new_role
        
        # 记录审计
        AdminService._log_audit(
            db=db,
            actor_user_id=admin_id,
            action="role_granted",
            resource_type="role_assignment",
            resource_id=role_id,
            organization_id=org_id,
            changes={"role_key": role_key, "target_user_id": user_id}
        )
        
        return {
            "role_assignment_id": role_id,
            "user_id": user_id,
            "organization_id": org_id,
            "role_key": role_key,
            "granted_at": new_role.granted_at,
            "message": f"已分配 {role_key} 角色"
        }
    
    @staticmethod
    def revoke_role(db: Session, org_id: int, admin_user_id: int, role_assignment_id: int, reason: str | None = None) -> dict:
        """撤销成员角色（仅 admin）
        
        权限: org admin only
        安全检查: 防止撤销最后一个管理员
        """
        store = DBStore(db)
        
        if not AdminService._is_org_admin(db, admin_user_id, org_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="只有 admin 才能撤销角色"
            )
        
        # 查找要撤销的角色分配
        role_assignment = store.role_assignments.get(role_assignment_id)
        if not role_assignment or role_assignment.organization_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="角色分配不存在"
            )
        
        # 如果是撤销 admin 角色，检查是否还有其他 admin
        if role_assignment.role_key == "admin":
            admin_count = 0
            for role in store.role_assignments.values():
                if (role.organization_id == org_id and role.role_key == "admin" and 
                    role.revoked_at is None):
                    admin_count += 1
            
            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="无法撤销最后一个管理员角色"
                )
        
        # 撤销角色（使用 revoked_at 软删除）
        role_assignment.revoked_at = datetime.now(UTC)
        role_assignment.revoked_by = admin_user_id
        role_assignment.change_reason = reason
        
        # 记录审计
        AdminService._log_audit(
            db=db,
            actor_user_id=admin_user_id,
            action="role_revoked",
            resource_type="role_assignment",
            resource_id=role_assignment_id,
            organization_id=org_id,
            reason=reason,
            changes={"role_key": role_assignment.role_key, "target_user_id": role_assignment.user_id, "status": "revoked"}
        )
        
        return {
            "role_id": role_assignment_id,
            "revoked_at": role_assignment.revoked_at,
            "message": "角色已撤销"
        }
    
    # ============ 审核日志 ============
    
    @staticmethod
    def _log_audit(
        db: Session,
        actor_user_id: int,
        action: str,
        resource_type: str,
        resource_id: int,
        organization_id: int | None = None,
        changes: dict | None = None,
        reason: str | None = None,
    ):
        """记录审计日志（写入 audit_logs 表，与 AuditLogDB 列一致）"""
        old_values = None
        new_values = None
        if changes:
            if "before" in changes or "after" in changes:
                old_values = changes.get("before")
                new_values = changes.get("after")
            else:
                new_values = changes

        description = reason or action.replace("_", " ")

        AuditLogService.log_operation(
            db=db,
            resource_type=resource_type,
            resource_id=str(resource_id),
            operation=action,
            operator_id=actor_user_id,
            old_values=old_values if isinstance(old_values, dict) else None,
            new_values=new_values if isinstance(new_values, dict) else None,
            description=description,
        )
    
    # ============ 辅助方法 ============
    
    @staticmethod
    def _is_org_member(db: Session, user_id: int, org_id: int) -> bool:
        """检查用户是否是 org 成员"""
        store = DBStore(db)
        for org_user in store.organization_users.values():
            if org_user.user_id == user_id and org_user.organization_id == org_id:
                return org_user.status in [OrganizationUserStatus.ACTIVE, OrganizationUserStatus.RESTRICTED]
        return False
    
    @staticmethod
    def _is_org_admin(db: Session, user_id: int, org_id: int) -> bool:
        """检查用户是否是 org 管理员"""
        store = DBStore(db)
        for role in store.role_assignments.values():
            if (role.user_id == user_id and role.organization_id == org_id and 
                role.role_key == "admin" and role.revoked_at is None):
                # 确保这个admin确实是active成员
                for org_user in store.organization_users.values():
                    if org_user.user_id == user_id and org_user.organization_id == org_id:
                        return org_user.status == OrganizationUserStatus.ACTIVE
        return False
