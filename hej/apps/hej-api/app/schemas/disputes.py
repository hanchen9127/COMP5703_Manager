"""Schemas for project-level dispute case visibility."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class DisputeCaseRead(BaseModel):
    id: str
    task_id: str
    task_item_id: str
    status: str
    severity: str
    opened_by: str
    assigned_to: str
    disagreement_summary: str
    created_at: datetime
