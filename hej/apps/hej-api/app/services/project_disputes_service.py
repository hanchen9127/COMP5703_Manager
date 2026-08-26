"""Project-level dispute visibility service.

Derives dispute cases from TaskItemEscalationDB records belonging to
tasks under the given project. Each escalation row is a dispute event —
secondary-reviewer routing maps to medium severity, expert routing maps
to high severity.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.db_models import TaskDB, TaskItemEscalationDB, UserDB
from app.schemas.disputes import DisputeCaseRead


class ProjectDisputesService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_project_disputes(self, project_id: str) -> list[DisputeCaseRead]:
        tasks = (
            self.db.query(TaskDB)
            .filter(TaskDB.project_id == project_id)
            .all()
        )
        task_ids = [t.id for t in tasks]
        if not task_ids:
            return []

        escalations = (
            self.db.query(TaskItemEscalationDB)
            .filter(TaskItemEscalationDB.task_id.in_(task_ids))
            .order_by(TaskItemEscalationDB.routed_at.desc())
            .all()
        )

        result: list[DisputeCaseRead] = []
        for esc in escalations:
            user = (
                self.db.query(UserDB)
                .filter(UserDB.id == esc.routed_by)
                .first()
            )
            opened_by: str
            if user:
                opened_by = user.name or user.email
            else:
                opened_by = f"User {esc.routed_by}"

            severity = "high" if esc.target == "expert" else "medium"
            assigned_to = esc.assignee_ref or "Unassigned"
            summary = esc.note or f"Item escalated for {esc.target} review."

            result.append(
                DisputeCaseRead(
                    id=esc.id,
                    task_id=esc.task_id,
                    task_item_id=esc.task_item_id,
                    status=esc.status,
                    severity=severity,
                    opened_by=opened_by,
                    assigned_to=assigned_to,
                    disagreement_summary=summary,
                    created_at=esc.created_at,
                )
            )

        return result
