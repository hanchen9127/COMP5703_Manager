"""Read and enrich task audit logs for the history API."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.db_models import AuditLogDB, TaskItemDB, UserDB
from app.schemas.task_history import (
    HistoryActorRead,
    HistoryChangeRead,
    HistoryResourceRead,
    TaskAuditLogsResponse,
    TaskHistoryEventRead,
)
from app.services.audit_log_service import AuditLogService
from app.services.task_history_copy import (
    DATA_INTAKE_OPERATIONS,
    format_item_name_list,
    normalize_legacy_data_intake_copy,
)
from app.services.task_history_recorder import OPERATION_CATEGORIES, category_for_operation


def _operations_for_category(category: str) -> list[str]:
    return [op for op, cat in OPERATION_CATEGORIES.items() if cat == category]


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def _parse_json_dict(raw: str | None) -> dict[str, Any]:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        return {}


# Internal ids and foreign keys are not shown in operator-facing history.
_SKIP_CHANGE_FIELDS = frozenset(
    {
        "draft_id",
        "data_pointer_id",
        "annotation_id",
        "review_id",
        "escalation_id",
        "pointer_id",
        "task_item_id",
    }
)

_OPERATIONS_WITHOUT_CHANGES = DATA_INTAKE_OPERATIONS

_USER_VISIBLE_CHANGE_FIELDS = frozenset(
    {
        "status",
        "action",
        "decision",
        "target",
        "review_status",
        "next_status",
        "next_item_status",
        "title",
    }
)


def _should_include_change_field(key: str) -> bool:
    if key in _SKIP_CHANGE_FIELDS:
        return False
    if key in _USER_VISIBLE_CHANGE_FIELDS:
        return True
    return key.endswith("_status")


def _merge_legacy_data_intake_duplicates(logs: list[AuditLogDB]) -> list[AuditLogDB]:
    """Collapse duplicate upload + register audits from the same request."""
    if len(logs) < 2:
        return logs

    merged: list[AuditLogDB] = []
    index = 0
    while index < len(logs):
        current = logs[index]
        if current.operation not in DATA_INTAKE_OPERATIONS:
            merged.append(current)
            index += 1
            continue

        group = [current]
        scan = index + 1
        while scan < len(logs):
            candidate = logs[scan]
            if candidate.operation not in DATA_INTAKE_OPERATIONS:
                break
            if (
                candidate.operator_id == current.operator_id
                and candidate.task_id == current.task_id
                and _as_utc(candidate.created_at).replace(microsecond=0)
                == _as_utc(current.created_at).replace(microsecond=0)
            ):
                group.append(candidate)
                scan += 1
            else:
                break

        if len(group) > 1:
            preferred = next(
                (row for row in group if row.operation == "dataset_registered"),
                group[0],
            )
            merged.append(preferred)
        else:
            merged.append(current)
        index = scan

    return merged


def _build_changes(
    operation: str,
    old_values: dict[str, Any],
    new_values: dict[str, Any],
) -> list[HistoryChangeRead]:
    if operation in _OPERATIONS_WITHOUT_CHANGES:
        return []
    keys = sorted(set(old_values) | set(new_values))
    changes: list[HistoryChangeRead] = []
    for key in keys:
        if not _should_include_change_field(key):
            continue
        before = old_values.get(key)
        after = new_values.get(key)
        if before != after:
            changes.append(HistoryChangeRead(field=key, before=before, after=after))
    return changes


def _summary_for_log(log: AuditLogDB, new_values: dict[str, Any]) -> str:
    operation = log.operation
    if operation == "escalation_routed":
        target = new_values.get("target") or "reviewer"
        return f"Escalation routed to {target}"
    if operation == "escalation_decided":
        decision = new_values.get("decision") or "resolved"
        return f"Escalation decision: {decision}"
    if operation == "review_action":
        action = new_values.get("action")
        if action:
            return f"Review {action} on item"
        return "Review action"
    if operation == "draft_submitted":
        return "Draft submitted for review"
    if operation in DATA_INTAKE_OPERATIONS:
        summary, _ = normalize_legacy_data_intake_copy(
            operation,
            log.description,
            new_values,
        )
        return summary
    if log.description and log.description.strip():
        desc = log.description.strip()
        if "=" not in desc and ";" not in desc:
            return desc
    return operation.replace("_", " ").strip().capitalize()


def _detail_for_log(
    log: AuditLogDB,
    summary: str,
    new_values: dict[str, Any],
) -> str | None:
    if log.operation in DATA_INTAKE_OPERATIONS:
        _, detail = normalize_legacy_data_intake_copy(
            log.operation,
            log.description,
            new_values,
        )
        if detail and detail != summary:
            return detail
        item_names = new_values.get("item_names")
        if isinstance(item_names, list):
            names = [str(n).strip() for n in item_names if n and str(n).strip()]
            if len(names) > 1:
                formatted = format_item_name_list(names)
                if formatted and formatted != summary:
                    return formatted
        return None

    if not log.description or not log.description.strip():
        return None
    detail = log.description.strip()
    if detail == summary:
        return None
    return detail


def _resource_for_log(
    log: AuditLogDB,
    *,
    external_item_ref_by_id: dict[str, str],
) -> HistoryResourceRead | None:
    if log.resource_type == "task_item" and log.resource_id:
        label = external_item_ref_by_id.get(log.resource_id)
        return HistoryResourceRead(
            type="task_item",
            id=log.resource_id,
            label=label,
        )
    if log.resource_type == "task" and log.resource_id and log.resource_id != log.task_id:
        return HistoryResourceRead(type="task", id=log.resource_id)
    if log.resource_type not in {"task", "project", "organization"} and log.resource_id:
        return HistoryResourceRead(type=log.resource_type, id=log.resource_id)
    return None


def _load_external_item_refs(
    db: Session,
    logs: list[AuditLogDB],
) -> dict[str, str]:
    item_ids = {
        log.resource_id
        for log in logs
        if log.resource_type == "task_item" and log.resource_id
    }
    if not item_ids:
        return {}
    rows = db.query(TaskItemDB).filter(TaskItemDB.id.in_(item_ids)).all()
    return {
        row.id: row.external_item_ref
        for row in rows
        if row.external_item_ref and str(row.external_item_ref).strip()
    }


def _enrich_log(
    log: AuditLogDB,
    users_by_id: dict[int, UserDB],
    *,
    external_item_ref_by_id: dict[str, str],
) -> TaskHistoryEventRead:
    old_values = _parse_json_dict(log.old_values)
    new_values = _parse_json_dict(log.new_values)
    user = users_by_id.get(log.operator_id)
    display_name = "System"
    actor_kind: str = "user"
    if user:
        display_name = (user.name or user.email or f"User {log.operator_id}").strip()
    elif log.operator_id:
        display_name = f"User {log.operator_id}"

    summary = _summary_for_log(log, new_values)
    detail = _detail_for_log(log, summary, new_values)

    return TaskHistoryEventRead(
        id=log.id,
        occurred_at=_as_utc(log.created_at),
        category=category_for_operation(log.operation),  # type: ignore[arg-type]
        operation=log.operation,
        summary=summary,
        detail=detail,
        actor=HistoryActorRead(
            kind=actor_kind,  # type: ignore[arg-type]
            id=log.operator_id,
            display_name=display_name,
        ),
        resource=_resource_for_log(log, external_item_ref_by_id=external_item_ref_by_id),
        changes=_build_changes(log.operation, old_values, new_values),
    )


class TaskAuditLogQueryService:
    @staticmethod
    def list_for_task(
        db: Session,
        task_id: str,
        *,
        project_id: str | None,
        limit: int = 50,
        offset: int = 0,
        category: str | None = None,
    ) -> TaskAuditLogsResponse:
        operations = _operations_for_category(category) if category else None
        logs, total = AuditLogService.get_logs_by_task(
            db,
            task_id,
            limit=limit,
            offset=offset,
            operations=operations,
        )
        operator_ids = {log.operator_id for log in logs if log.operator_id is not None}
        users_by_id: dict[int, UserDB] = {}
        if operator_ids:
            rows = db.query(UserDB).filter(UserDB.id.in_(operator_ids)).all()
            users_by_id = {row.id: row for row in rows}

        display_logs = _merge_legacy_data_intake_duplicates(logs)
        external_item_ref_by_id = _load_external_item_refs(db, display_logs)
        enriched = [
            _enrich_log(
                log,
                users_by_id,
                external_item_ref_by_id=external_item_ref_by_id,
            )
            for log in display_logs
        ]

        merged_away = max(0, len(logs) - len(display_logs))
        adjusted_total = max(0, total - merged_away)

        return TaskAuditLogsResponse(
            task_id=task_id,
            project_id=project_id,
            total_count=adjusted_total,
            logs=enriched,
        )
