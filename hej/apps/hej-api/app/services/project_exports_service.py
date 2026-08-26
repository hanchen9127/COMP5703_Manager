"""Project-level export package visibility service.

Derives export packages from tasks under the project. Each task becomes
one export package entry. Export status is inferred from task status;
provenance inclusion is pulled from the organization policy if available.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.db_models import (
    OrganizationPolicyDB,
    ProjectDB,
    TaskDB,
    TaskItemDB,
)
from app.schemas.exports import ExportPackageRead

_TASK_STATUS_TO_EXPORT: dict[str, str] = {
    "completed": "ready",
    "in_review": "building",
    "ready": "building",
    "disputed": "building",
    "draft": "draft",
}


class ProjectExportsService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_project_exports(self, project_id: str) -> list[ExportPackageRead]:
        tasks = (
            self.db.query(TaskDB)
            .filter(TaskDB.project_id == project_id)
            .all()
        )
        if not tasks:
            return []

        includes_provenance = self._resolve_provenance(project_id)

        result: list[ExportPackageRead] = []
        for task in tasks:
            item_count = (
                self.db.query(TaskItemDB)
                .filter(TaskItemDB.task_id == task.id)
                .count()
            )
            completed_item_count = (
                self.db.query(TaskItemDB)
                .filter(
                    TaskItemDB.task_id == task.id,
                    TaskItemDB.status == "canonicalized",
                )
                .count()
            )
            export_status = _TASK_STATUS_TO_EXPORT.get(str(task.status), "draft")

            result.append(
                ExportPackageRead(
                    id=f"exp_{task.id}",
                    project_id=project_id,
                    task_id=task.id,
                    status=export_status,
                    format="jsonl",
                    item_count=item_count,
                    completed_item_count=completed_item_count,
                    includes_provenance=includes_provenance,
                    destination=f"export://{project_id}/{task.id}",
                    created_at=task.created_at,
                )
            )

        return result

    def _resolve_provenance(self, project_id: str) -> bool:
        project = (
            self.db.query(ProjectDB)
            .filter(ProjectDB.id == project_id)
            .first()
        )
        if not project:
            return True
        try:
            org_id = int(project.organization_id)
        except (TypeError, ValueError):
            return True
        policy = (
            self.db.query(OrganizationPolicyDB)
            .filter(OrganizationPolicyDB.organization_id == org_id)
            .first()
        )
        return bool(policy.export_provenance_required) if policy else True
