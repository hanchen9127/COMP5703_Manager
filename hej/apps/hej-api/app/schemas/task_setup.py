"""Read models for the task Setup surface."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.policies import ResolvedPolicyRead
from app.schemas.tasks import DataPointerRead, TaskItemRead, TaskRead

SetupRegistrationStatus = Literal["pending_registration", "partial", "registered"]


class TaskSetupDataPlaneRead(BaseModel):
    pointer_count: int
    item_count: int
    registration_status: SetupRegistrationStatus
    storage_provider_hint: str | None = None


class TaskSetupRead(BaseModel):
    task: TaskRead
    resolved_policy: ResolvedPolicyRead
    data_pointers: list[DataPointerRead] = Field(default_factory=list)
    task_items: list[TaskItemRead] = Field(default_factory=list)
    data_plane: TaskSetupDataPlaneRead
