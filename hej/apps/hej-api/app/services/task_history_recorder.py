"""Write-through audit events for task-scoped history."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.services.audit_log_service import AuditLogService

OPERATION_CATEGORIES: dict[str, str] = {
    "task_created": "setup",
    "task_updated": "setup",
    "task_activated": "setup",
    "status_change": "setup",
    "policy_updated": "policy",
    "dataset_registered": "data",
    "files_uploaded": "data",
    "draft_submitted": "annotation",
    "review_action": "review",
    "escalation_routed": "dispute",
    "escalation_decided": "dispute",
    "task_item_status_changed": "system",
}


def category_for_operation(operation: str) -> str:
    return OPERATION_CATEGORIES.get(operation, "system")


class TaskHistoryRecorder:
    @staticmethod
    def record(
        db: Session,
        *,
        operation: str,
        task_id: str,
        project_id: str,
        operator_id: int,
        summary: str,
        description: str | None = None,
        resource_type: str = "task",
        resource_id: str | None = None,
        old_values: dict[str, Any] | None = None,
        new_values: dict[str, Any] | None = None,
    ) -> None:
        AuditLogService.log_operation(
            db,
            resource_type=resource_type,
            resource_id=resource_id or task_id,
            operation=operation,
            operator_id=operator_id,
            old_values=old_values,
            new_values=new_values,
            description=description,
            project_id=project_id,
            task_id=task_id,
        )
