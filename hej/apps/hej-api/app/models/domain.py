from datetime import UTC
from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel
from pydantic import Field


def utc_now() -> datetime:
    return datetime.now(UTC)


class OrganizationStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class ProjectStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class GovernanceModel(StrEnum):
    STANDARD = "standard"
    DUAL_SIGNOFF = "dual_signoff"
    EXPERT_GATE = "expert_gate"
    ARBITRATION_READY = "arbitration_ready"


class AnnotationMode(StrEnum):
    AI_ASSISTED = "ai_assisted"
    HUMAN_FIRST = "human_first"


class TaskStatus(StrEnum):
    DRAFT = "draft"
    READY = "ready"
    IN_REVIEW = "in_review"
    DISPUTED = "disputed"
    COMPLETED = "completed"


class TaskType(StrEnum):
    IMAGE = "image"
    TEXT = "text"
    AUDIO = "audio"


class TaskItemStatus(StrEnum):
    PENDING = "pending"
    ANNOTATED = "annotated"
    RETURNED = "returned"
    REJECTED = "rejected"
    REVIEWED = "reviewed"
    DISPUTED = "disputed"
    EXPERT_SEND_BACK = "expert_send_back"
    CANONICALIZED = "canonicalized"


class Organization(BaseModel):
    id: int  # 改为 Integer，与 DB 对齐
    name: str  # 改为 name，与 DB 对齐 (而不是 display_name)
    slug: str | None = None  # 添加 slug 字段
    status: OrganizationStatus = OrganizationStatus.ACTIVE
    created_at: datetime = Field(default_factory=utc_now)


class Project(BaseModel):
    id: str
    organization_id: str
    name: str
    description: str | None = None
    governance_model: GovernanceModel = GovernanceModel.STANDARD
    status: ProjectStatus = ProjectStatus.DRAFT
    created_at: datetime = Field(default_factory=utc_now)
    created_by: int | None = None  # 创建人ID
    updated_at: datetime | None = None  # 最后修改时间
    updated_by: int | None = None  # 最后修改人ID


class DataPointer(BaseModel):
    id: str
    task_id: str
    location_ref: str
    access_policy_ref: str | None = None
    source_version_ref: str | None = None
    created_at: datetime = Field(default_factory=utc_now)


class Task(BaseModel):
    id: str
    project_id: str
    title: str
    description: str | None = None
    judgment_question: str
    task_type: TaskType = TaskType.TEXT
    annotation_mode: AnnotationMode
    label_schema_ref: str
    text_span_label_options: list[str] | None = None
    review_policy_ref: str | None = None
    dispute_policy_ref: str | None = None
    export_policy_ref: str | None = None
    status: TaskStatus = TaskStatus.DRAFT
    created_at: datetime = Field(default_factory=utc_now)
    created_by: int | None = None  # 创建人ID
    updated_at: datetime | None = None  # 最后修改时间
    updated_by: int | None = None  # 最后修改人ID


class TaskItem(BaseModel):
    id: str
    task_id: str
    data_pointer_id: str
    external_item_ref: str
    location_ref: str | None = None  # 文件存储位置（来自DataPointer）
    status: TaskItemStatus = TaskItemStatus.PENDING
    payload_preview: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime | None = None  # 最后修改时间


class Annotation(BaseModel):
    """已确认的标注 - 最终版本"""
    id: str
    task_item_id: str
    annotation_type: str  # bbox, text, polygon, classification, etc
    annotation_data: dict  # 标注内容
    confidence: int | None = None  # 置信度 0-100
    version: int = 1  # 版本号
    is_latest: bool = True  # 是否为最新版本
    created_by: int | None = None  # 原始标注者
    confirmed_by: int | None = None  # 确认者
    created_at: datetime = Field(default_factory=utc_now)
    confirmed_at: datetime | None = None  # 确认时间
    updated_at: datetime | None = None


class Draft(BaseModel):
    """草稿 - 中间状态(未确认)"""
    id: str
    task_item_id: str
    annotation_id: str | None = None  # 基于哪个标注的修改 (初稿时为 None)
    status: str = "pending"  # pending (工作中), submitted (等待确认)
    draft_data: dict  # 草稿内容
    annotation_type: str  # 标注类型
    revision_notes: str | None = None  # 修改说明
    created_by: int | None = None
    created_at: datetime = Field(default_factory=utc_now)
    submitted_at: datetime | None = None  # 提交时间
    updated_at: datetime | None = None
