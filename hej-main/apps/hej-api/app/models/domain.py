from datetime import UTC
from datetime import datetime
from enum import StrEnum

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


class TaskItemStatus(StrEnum):
    PENDING = "pending"
    ANNOTATED = "annotated"
    REVIEWED = "reviewed"
    DISPUTED = "disputed"
    CANONICALIZED = "canonicalized"


class Organization(BaseModel):
    id: str
    display_name: str
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
    annotation_mode: AnnotationMode
    label_schema_ref: str
    review_policy_ref: str | None = None
    status: TaskStatus = TaskStatus.DRAFT
    created_at: datetime = Field(default_factory=utc_now)


class TaskItem(BaseModel):
    id: str
    task_id: str
    data_pointer_id: str
    external_item_ref: str
    status: TaskItemStatus = TaskItemStatus.PENDING
    payload_preview: dict[str, str] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=utc_now)
