from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel
from pydantic import Field
from pydantic import field_validator

from app.models import AnnotationMode
from app.models import TaskItemStatus
from app.models import TaskStatus
from app.models import TaskType


def normalize_text_span_label_options(value):
    if value is None:
        return None
    if value == []:
        return None
    if not isinstance(value, list):
        raise ValueError("text_span_label_options must be a list of strings or null")

    normalized: list[str] = []
    seen: set[str] = set()
    for raw_label in value:
        if not isinstance(raw_label, str):
            raise ValueError("text_span_label_options must contain only strings")
        label = raw_label.strip()
        if not label:
            raise ValueError("text_span_label_options cannot contain empty labels")
        if len(label) > 64:
            raise ValueError("text_span_label_options entries must be 64 characters or fewer")
        key = label.lower()
        if key in seen:
            raise ValueError("text_span_label_options cannot contain duplicates")
        seen.add(key)
        normalized.append(label)

    if len(normalized) > 20:
        raise ValueError("text_span_label_options cannot contain more than 20 labels")
    return normalized


class TaskCreate(BaseModel):
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

    @field_validator("text_span_label_options", mode="before")
    @classmethod
    def normalize_text_span_label_options_field(cls, value):
        return normalize_text_span_label_options(value)


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    judgment_question: str | None = None
    task_type: TaskType | None = None
    annotation_mode: AnnotationMode | None = None
    label_schema_ref: str | None = None
    text_span_label_options: list[str] | None = None
    review_policy_ref: str | None = None
    dispute_policy_ref: str | None = None
    export_policy_ref: str | None = None

    @field_validator("text_span_label_options", mode="before")
    @classmethod
    def normalize_text_span_label_options_field(cls, value):
        return normalize_text_span_label_options(value)


class TaskRead(BaseModel):
    id: str
    project_id: str
    title: str
    description: str | None
    judgment_question: str
    task_type: TaskType
    annotation_mode: AnnotationMode
    label_schema_ref: str
    text_span_label_options: list[str] | None = None
    review_policy_ref: str | None
    dispute_policy_ref: str | None = None
    export_policy_ref: str | None = None
    status: TaskStatus
    created_at: datetime
    created_by: int | None = None
    updated_at: datetime | None = None
    updated_by: int | None = None


class DatasetItemInput(BaseModel):
    external_item_ref: str
    location_ref: str
    payload_preview: dict[str, Any] = Field(default_factory=dict)
    access_policy_ref: str | None = None
    source_version_ref: str | None = None


class DatasetRegistrationRequest(BaseModel):
    items: list[DatasetItemInput]


class DataPointerRead(BaseModel):
    id: str
    task_id: str
    location_ref: str
    access_policy_ref: str | None
    source_version_ref: str | None
    created_at: datetime


class TaskItemRead(BaseModel):
    id: str
    task_id: str
    data_pointer_id: str
    external_item_ref: str
    location_ref: str | None = None  # 文件存储位置（从DataPointer获取）
    status: TaskItemStatus
    payload_preview: dict[str, Any]
    created_at: datetime
    updated_at: datetime | None = None  # 最后修改时间


class DatasetRegistrationResponse(BaseModel):
    task_id: str
    created_data_pointers: list[DataPointerRead]
    created_task_items: list[TaskItemRead]


class TaskItemContentRead(BaseModel):
    content_kind: Literal["text", "image", "audio"]
    text: str | None = None
    media_url: str | None = None
    location_ref: str
    source: Literal["uploads", "mock_fixture"]
    truncated: bool = False
    filename: str | None = None
    mime_type: str | None = None
    size: int | None = None
    duration_seconds: float | None = None
