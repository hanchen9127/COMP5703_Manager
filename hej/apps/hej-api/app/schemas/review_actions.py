"""Schemas for task-item review / escalation / finalized contract endpoints.

These types are shared by the routes mounted under ``/tasks`` so the
frontend can submit reviewer actions without inventing ad-hoc JSON
shapes in each component.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel
from pydantic import Field


class TaskItemReviewActionRequest(BaseModel):
    """Body for POST .../task-items/{id}/review-actions."""

    action: Literal["accept", "reject", "adjust", "revise", "escalate"]
    comment: str | None = None
    final_payload: str | None = None
    final_verdict: str | None = None


class TaskItemReviewActionResponse(BaseModel):
    """Response after persisting a review row and computing the next UI status."""

    review_id: str
    review_status: str
    next_ui_status: str
    review_mode: str = "single_pass"
    approvals_received: int = 0
    approvals_required: int = 1


class TaskItemAdjustmentRead(BaseModel):
    """Reserved for GET .../adjustment (501 until implemented)."""

    task_id: str
    task_item_id: str
    base_status: str
    payload_preview: dict
    last_submitted_payload: dict | None = None
    reviewer_note: str | None = None
    routed_by: str | None = None
    routed_at: datetime | None = None


class EscalationRouteRequest(BaseModel):
    target: Literal["secondary_reviewer", "expert"]
    assignee_ref: str | None = None
    note: str | None = None


class EscalationRouteResponse(BaseModel):
    task_item_id: str
    target: Literal["secondary_reviewer", "expert"]
    assignee_ref: str | None
    routed_at: datetime
    next_status: str


class EscalationDecisionRequest(BaseModel):
    decision: Literal["finalize", "send_back"]
    note: str | None = None
    payload_preview: dict | None = None


class EscalationDecisionResponse(BaseModel):
    next_status: str
    payload_preview: dict


class EscalationListItem(BaseModel):
    task_item_id: str
    external_item_ref: str | None = None
    status: str
    target: Literal["secondary_reviewer", "expert"] | None = None
    assignee_ref: str | None = None
    routed_at: datetime | None = None
    note: str | None = None


class EscalationListResponse(BaseModel):
    task_id: str
    items: list[EscalationListItem]


class FinalizedTaskItemRead(BaseModel):
    id: str
    task_id: str
    external_item_ref: str | None = None
    status: str
    finalized_at: datetime | None = None


class FinalizedItemsResponse(BaseModel):
    task_id: str
    items: list[FinalizedTaskItemRead]
