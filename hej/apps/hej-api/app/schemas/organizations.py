"""
Organization Schemas - 组织管理 API 合约

支持两个 schema：
1. 工作流 Organization - id 为 str（来自 models/domain.py）
2. Admin Organization - id 为 int（来自 models/admin.py）
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.models import OrganizationStatus


# ============ 工作流相关 (来自 models/domain.py - id: str) ============

class OrganizationCreate(BaseModel):
    display_name: str


class OrganizationRead(BaseModel):
    id: int  # 现在与 DB 对齐为 Integer
    name: str  # 改为 name （而不是 display_name）
    slug: str | None = None  # 添加 slug 字段
    status: OrganizationStatus
    created_at: datetime


# ============ Admin 相关 (来自 models/admin.py - id: int) ============

class AdminOrganizationCreateRequest(BaseModel):
    """创建 organization 请求（Admin 系统）"""
    name: str
    slug: str = Field(
        pattern=r"^[a-z0-9\-]+$",
        description="URL-friendly 标识，只能含小写字母、数字和连字符"
    )
    description: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Acme Corporation",
                "slug": "acme-corp",
                "description": "Leading innovation company"
            }
        }


class AdminOrganizationCreateResponse(BaseModel):
    """创建响应"""
    organization_id: int
    name: str
    slug: str
    status: str  # "active"
    created_by: int
    message: str


class AdminOrganizationRead(BaseModel):
    """organization 读取响应"""
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    status: OrganizationStatus  # 改为 enum 类型
    created_at: datetime
    member_count: int = Field(default=0, serialization_alias="members_count")
    admin_count: int = 0
    
    class Config:
        from_attributes = True
        populate_by_name = True


class PolicyRead(BaseModel):
    """读取 policy"""
    id: int
    organization_id: int
    membership_approval_required: bool
    review_dual_sign_off: bool
    review_auto_escalate_disagreement: bool
    dispute_escalation_gate: str
    dispute_escalation_threshold: int
    export_provenance_required: bool
    export_retention_days: int
    annotation_mode: str  # 保持 string（DB中是 string）


class AdminOrganizationDetailRead(AdminOrganizationRead):
    """详细信息（包含 policy 和成员统计）"""
    member_count: int
    admin_count: int
    policy: PolicyRead


class AdminOrganizationUpdateRequest(BaseModel):
    """编辑 organization 请求"""
    name: Optional[str] = None
    description: Optional[str] = None


class AdminOrganizationUpdateResponse(BaseModel):
    """编辑响应"""
    organization_id: int
    updated_at: datetime
    message: str


# ============ 非 Admin 别名（兼容现有路由） ============
OrganizationCreateRequest = AdminOrganizationCreateRequest
OrganizationCreateResponse = AdminOrganizationCreateResponse
OrganizationDetailRead = AdminOrganizationDetailRead
OrganizationUpdateRequest = AdminOrganizationUpdateRequest
OrganizationUpdateResponse = AdminOrganizationUpdateResponse


class PolicyUpdateRequest(BaseModel):
    """更新 policy 请求"""
    membership_approval_required: Optional[bool] = None
    review_dual_sign_off: Optional[bool] = None
    review_auto_escalate_disagreement: Optional[bool] = None
    dispute_escalation_gate: Optional[str] = None
    dispute_escalation_threshold: Optional[int] = None
    export_provenance_required: Optional[bool] = None
    export_retention_days: Optional[int] = None
    annotation_mode: Optional[str] = None


class PolicyUpdateResponse(BaseModel):
    """更新响应"""
    organization_id: int
    updated_at: datetime
    policy: PolicyRead
    message: str


class AdminOrganizationListResponse(BaseModel):
    """组织列表响应"""
    total_count: int
    organizations: list[AdminOrganizationRead]
