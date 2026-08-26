"""
SQLAlchemy ORM Models
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime, UTC

Base = declarative_base()


class UserDB(Base):
    """User table."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)  # User's display name
    account_status = Column(String(50), default="active")  # active, suspended, restricted
    two_factor_enabled = Column(Boolean, default=False)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Relationships
    organization_users = relationship("OrganizationUserDB", back_populates="user", cascade="all, delete-orphan")
    role_assignments = relationship("RoleAssignmentDB", back_populates="user", cascade="all, delete-orphan")


class OrganizationDB(Base):
    """Organization table."""
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    status = Column(String(50), default="active")  # active, suspended, archived
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Relationships
    organization_users = relationship("OrganizationUserDB", back_populates="organization", cascade="all, delete-orphan")
    role_assignments = relationship("RoleAssignmentDB", back_populates="organization", cascade="all, delete-orphan")
    policies = relationship("OrganizationPolicyDB", back_populates="organization", cascade="all, delete-orphan")


class OrganizationUserDB(Base):
    """Organization membership table."""
    __tablename__ = "organization_users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    status = Column(String(50), default="invited")  # invited, active, restricted, removed
    invited_at = Column(DateTime, nullable=True)
    invited_by = Column(Integer, nullable=True)  # user_id who invited
    accepted_at = Column(DateTime, nullable=True)
    removed_at = Column(DateTime, nullable=True)
    removed_by = Column(Integer, nullable=True)  # user_id who removed
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'organization_id', name='uq_user_org'),
    )
    
    # Relationships
    user = relationship("UserDB", back_populates="organization_users")
    organization = relationship("OrganizationDB", back_populates="organization_users")


class RoleAssignmentDB(Base):
    """Role assignment table."""
    __tablename__ = "role_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    project_id = Column(Integer, nullable=True)  # NULL = organization-level role
    role_key = Column(String(50), nullable=False)  # admin, task_owner, annotator, etc
    role_name = Column(String(255), nullable=False)  # 显示名称
    scope = Column(String(50), nullable=False)  # organization, project
    granted_at = Column(DateTime, default=lambda: datetime.now(UTC))
    granted_by = Column(Integer, nullable=False)  # user_id who granted
    revoked_at = Column(DateTime, nullable=True)
    revoked_by = Column(Integer, nullable=True)  # user_id who revoked
    change_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Relationships
    user = relationship("UserDB", back_populates="role_assignments")
    organization = relationship("OrganizationDB", back_populates="role_assignments")


class OrganizationPolicyDB(Base):
    """Organization policy table."""
    __tablename__ = "organization_policies"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), unique=True, nullable=False)
    # Membership Policy
    membership_approval_required = Column(Boolean, default=False)
    # Review Policy
    review_dual_sign_off = Column(Boolean, default=False)
    review_auto_escalate_disagreement = Column(Boolean, default=False)
    # Dispute Policy
    dispute_escalation_gate = Column(String(50), default="none")  # none, required, mandatory
    dispute_escalation_threshold = Column(Integer, default=100)
    # Export Policy
    export_provenance_required = Column(Boolean, default=True)
    export_retention_days = Column(Integer, default=365)
    # Annotation Policy
    annotation_mode = Column(String(50), default="human_first")  # human_first, ai_assisted, hybrid
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    updated_by = Column(Integer, nullable=False)
    
    # Relationships
    organization = relationship("OrganizationDB", back_populates="policies")


class AuditLogDB(Base):
    """Audit log table for project and task activity history."""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    resource_type = Column(String(100), nullable=False)  # 'project' or 'task'
    resource_id = Column(String(255), nullable=False)  # project_id or task_id (string type)
    operation = Column(String(100), nullable=False)  # create, update, delete, status_change
    operator_id = Column(Integer, nullable=False)  # user_id who performed the operation
    old_values = Column(String(4000), nullable=True)  # JSON string of old values
    new_values = Column(String(4000), nullable=True)  # JSON string of new values
    description = Column(String(255), nullable=True)  # operation description
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    project_id = Column(String(255), nullable=True)  # FK to projects (for filtering)
    task_id = Column(String(255), nullable=True)  # FK to tasks (for filtering)


class ProjectDB(Base):
    """Project table."""
    __tablename__ = "projects"
    
    id = Column(String(255), primary_key=True, index=True)
    organization_id = Column(String(255), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(2000), nullable=True)
    governance_model = Column(String(50), default="standard")  # standard, dual_signoff, expert_gate, arbitration_ready
    status = Column(String(50), default="draft")  # draft, active, archived
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    created_by = Column(Integer, nullable=True)  # 创建人ID
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    updated_by = Column(Integer, nullable=True)  # 最后修改人ID
    
    # Relationships
    tasks = relationship("TaskDB", back_populates="project", cascade="all, delete-orphan")


class TaskDB(Base):
    """Task table."""
    __tablename__ = "tasks"
    
    id = Column(String(255), primary_key=True, index=True)
    project_id = Column(String(255), ForeignKey("projects.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String(2000), nullable=True)
    judgment_question = Column(String(2000), nullable=False)
    task_type = Column(String(50), nullable=False, server_default="text")  # image, text
    annotation_mode = Column(String(50), nullable=False)  # ai_assisted, human_first
    label_schema_ref = Column(String(255), nullable=False)
    text_span_label_options = Column(JSON, nullable=True)
    review_policy_ref = Column(String(255), nullable=True)
    dispute_policy_ref = Column(String(255), nullable=True)
    export_policy_ref = Column(String(255), nullable=True)
    status = Column(String(50), default="draft")  # draft, ready, in_review, disputed, completed
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    created_by = Column(Integer, nullable=True)  # 创建人ID
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    updated_by = Column(Integer, nullable=True)  # 最后修改人ID
    
    # Relationships
    project = relationship("ProjectDB", back_populates="tasks")
    data_pointers = relationship("DataPointerDB", back_populates="task", cascade="all, delete-orphan")
    task_items = relationship("TaskItemDB", back_populates="task", cascade="all, delete-orphan")


class DataPointerDB(Base):
    """Data pointer table."""
    __tablename__ = "data_pointers"
    
    id = Column(String(255), primary_key=True, index=True)
    task_id = Column(String(255), ForeignKey("tasks.id"), nullable=False, index=True)
    location_ref = Column(String(2000), nullable=False)
    access_policy_ref = Column(String(255), nullable=True)
    source_version_ref = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    
    # Relationships
    task = relationship("TaskDB", back_populates="data_pointers")


class TaskItemDB(Base):
    """Task item table."""
    __tablename__ = "task_items"
    
    id = Column(String(255), primary_key=True, index=True)
    task_id = Column(String(255), ForeignKey("tasks.id"), nullable=False, index=True)
    data_pointer_id = Column(String(255), ForeignKey("data_pointers.id"), nullable=False, index=True)
    external_item_ref = Column(String(255), nullable=False)
    status = Column(String(50), default="pending")  # pending, annotated, returned, rejected, reviewed, disputed, expert_send_back, canonicalized
    payload_preview = Column(JSON, default={})
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Relationships
    task = relationship("TaskDB", back_populates="task_items")
    annotations = relationship("AnnotationDB", back_populates="task_item", cascade="all, delete-orphan")


class AnnotationDB(Base):
    """Annotation results table for confirmed/final versions."""
    __tablename__ = "annotations"
    
    id = Column(String(255), primary_key=True, index=True)
    base_annotation_id = Column(String(255), nullable=True, index=True)  # Points to first version (for version grouping)
    task_item_id = Column(String(255), ForeignKey("task_items.id"), nullable=False, index=True)
    annotation_type = Column(String(50), nullable=False)  # text, bbox, polygon, etc
    annotation_data = Column(JSON, nullable=False)  # 标注内容
    confidence = Column(Integer, nullable=True)  # 置信度 0-100
    version = Column(Integer, default=1)  # 版本号 (初稿是v1, 更新后是v2, v3, ...)
    is_latest = Column(Boolean, default=True)  # 是否为最新版本
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # 原始标注者
    confirmed_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # 确认者
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), index=True)
    confirmed_at = Column(DateTime, nullable=True)  # 确认时间
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Relationships
    task_item = relationship("TaskItemDB", back_populates="annotations")
    created_by_user = relationship("UserDB", foreign_keys=[created_by])
    confirmed_by_user = relationship("UserDB", foreign_keys=[confirmed_by])
    drafts = relationship("DraftDB", back_populates="annotation", cascade="all, delete-orphan")
    reviews = relationship("ReviewDB", back_populates="annotation", cascade="all, delete-orphan")


class DraftDB(Base):
    """Draft table for intermediate unconfirmed state."""
    __tablename__ = "drafts"
    
    id = Column(String(255), primary_key=True, index=True)
    task_item_id = Column(String(255), ForeignKey("task_items.id"), nullable=False, index=True)
    annotation_id = Column(String(255), ForeignKey("annotations.id"), nullable=True, index=True)  # 基于哪个标注进行修改 (初稿时为 None)
    status = Column(String(50), default="pending")  # pending (工作中), submitted (等待确认)
    draft_data = Column(JSON, nullable=False)  # 草稿内容
    annotation_type = Column(String(50), nullable=False)  # 标注类型 (与最终 Annotation 一致)
    revision_notes = Column(String(1000), nullable=True)  # 修改说明
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # 谁创建的草稿
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), index=True)
    submitted_at = Column(DateTime, nullable=True)  # 何时提交等待确认
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Relationships
    task_item = relationship("TaskItemDB")
    annotation = relationship("AnnotationDB", back_populates="drafts")  # 基于的标注版本
    created_by_user = relationship("UserDB")


class PredictionDB(Base):
    """预测结果表"""
    __tablename__ = "predictions"
    
    id = Column(String(255), primary_key=True, index=True)
    task_item_id = Column(String(255), ForeignKey("task_items.id"), nullable=False, index=True)
    prediction_type = Column(String(50), nullable=False)  # 预测类型
    prediction_data = Column(JSON, nullable=False)  # 预测内容
    confidence = Column(Integer, nullable=True)  # 置信度 0-100
    model_version = Column(String(50), nullable=True)  # 模型版本
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Relationships
    task_item = relationship("TaskItemDB")
    created_by_user = relationship("UserDB")


class ReviewDB(Base):
    """标注审核表 - 审核人对标注的反馈"""
    __tablename__ = "reviews"
    
    id = Column(String(255), primary_key=True, index=True)
    annotation_id = Column(String(255), ForeignKey("annotations.id"), nullable=False, index=True)
    task_item_id = Column(String(255), ForeignKey("task_items.id"), nullable=False, index=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=False)  # 审核人
    review_status = Column(String(50), nullable=False)  # approved, rejected, needs_revision
    review_score = Column(Integer, nullable=True)  # 审核评分 0-100
    review_notes = Column(String(1000), nullable=True)  # 审核意见
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Relationships
    annotation = relationship("AnnotationDB", back_populates="reviews")
    task_item = relationship("TaskItemDB")
    reviewed_by_user = relationship("UserDB")


class TaskItemEscalationDB(Base):
    """Reviewer escalation routing for a task item (secondary reviewer / expert)."""

    __tablename__ = "task_item_escalations"

    id = Column(String(255), primary_key=True, index=True)
    task_id = Column(String(255), ForeignKey("tasks.id"), nullable=False, index=True)
    task_item_id = Column(String(255), ForeignKey("task_items.id"), nullable=False, index=True)
    target = Column(String(50), nullable=False)  # secondary_reviewer | expert
    assignee_ref = Column(String(255), nullable=True)
    note = Column(String(2000), nullable=True)
    routed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    routed_at = Column(DateTime, default=lambda: datetime.now(UTC), index=True)
    status = Column(String(50), default="open")  # open | resolved
    decision = Column(String(50), nullable=True)  # finalize | send_back (legacy: adjust)
    decision_note = Column(String(2000), nullable=True)
    decided_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    decided_at = Column(DateTime, nullable=True)
    payload_preview_snap = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
