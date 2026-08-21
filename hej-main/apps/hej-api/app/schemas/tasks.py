from datetime import datetime

from pydantic import BaseModel
from pydantic import Field

from app.models import AnnotationMode
from app.models import TaskItemStatus
from app.models import TaskStatus


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    judgment_question: str
    annotation_mode: AnnotationMode
    label_schema_ref: str
    review_policy_ref: str | None = None


class TaskRead(BaseModel):
    id: str
    project_id: str
    title: str
    description: str | None
    judgment_question: str
    annotation_mode: AnnotationMode
    label_schema_ref: str
    review_policy_ref: str | None
    status: TaskStatus
    created_at: datetime


class DatasetItemInput(BaseModel):
    external_item_ref: str
    location_ref: str
    payload_preview: dict[str, str] = Field(default_factory=dict)
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
    status: TaskItemStatus
    payload_preview: dict[str, str]
    created_at: datetime


class DatasetRegistrationResponse(BaseModel):
    task_id: str
    created_data_pointers: list[DataPointerRead]
    created_task_items: list[TaskItemRead]
