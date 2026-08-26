"""Task-scoped history: enriched audit logs and derived workflow lineage."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

HistoryCategory = Literal[
    "setup", "policy", "data", "annotation", "review", "dispute", "system"
]

WorkflowStepState = Literal[
    "pending", "in_progress", "complete", "blocked", "later"
]

WorkflowStepTone = Literal["default", "accent", "dark"]


class HistoryActorRead(BaseModel):
    kind: Literal["user", "system"]
    id: int | None = None
    display_name: str


class HistoryResourceRead(BaseModel):
    type: str
    id: str
    label: str | None = None


class HistoryChangeRead(BaseModel):
    field: str
    before: Any = None
    after: Any = None


class TaskHistoryEventRead(BaseModel):
    id: int
    occurred_at: datetime
    category: HistoryCategory
    operation: str
    summary: str
    detail: str | None = None
    actor: HistoryActorRead
    resource: HistoryResourceRead | None = None
    changes: list[HistoryChangeRead] = Field(default_factory=list)


class TaskAuditLogsResponse(BaseModel):
    task_id: str
    project_id: str | None = None
    total_count: int
    logs: list[TaskHistoryEventRead]


class TaskItemCountsRead(BaseModel):
    total: int = 0
    pending: int = 0
    annotated: int = 0
    reviewed: int = 0
    disputed: int = 0
    canonicalized: int = 0


class WorkflowStepRead(BaseModel):
    key: str
    title: str
    description: str
    state: WorkflowStepState
    tone: WorkflowStepTone = "default"
    evidence: str | None = None
    filter_categories: list[HistoryCategory] = Field(default_factory=list)
    workspace_tab: str | None = None


class TaskWorkflowLineageResponse(BaseModel):
    task_id: str
    task_status: str
    annotation_mode: str
    generated_at: datetime
    item_counts: TaskItemCountsRead
    open_escalations: int
    steps: list[WorkflowStepRead]
    current_step_key: str | None = None
    headline: str = ""
    next_action: str = ""
