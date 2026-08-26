"""Schemas for project-level export package visibility."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ExportPackageRead(BaseModel):
    id: str
    project_id: str
    task_id: str
    status: str
    format: str
    item_count: int
    completed_item_count: int
    includes_provenance: bool
    destination: str
    created_at: datetime
    export_scope: str = "current_finalized"
    is_full_project_ready: bool = False
    finalized_item_count: int = 0
    total_item_count: int = 0
