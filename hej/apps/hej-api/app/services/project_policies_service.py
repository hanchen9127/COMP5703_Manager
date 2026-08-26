"""Aggregate project policy configuration and resolved rules per task."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.policy_bundles import PolicyBundle, list_bundles
from app.repositories.db_store import DBStore
from app.schemas.organizations import PolicyRead
from app.schemas.policies import (
    PolicyBundleRead,
    ProjectPoliciesRead,
    ResolvedPolicyRead,
    TaskPolicyEntryRead,
)
from app.schemas.projects import ProjectRead
from app.schemas.tasks import TaskRead
from app.services.policy_resolver import PolicyResolver
from app.services.project_service import ProjectService
from app.services.task_service import TaskService


class ProjectPoliciesService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.project_service = ProjectService(db=db)
        self.task_service = TaskService(db=db)
        self.db_store = DBStore(db)

    def get_project_policies(self, project_id: str) -> ProjectPoliciesRead:
        project = self.project_service.get_project(project_id)
        org_id = int(project.organization_id)
        org_policy_model = self.db_store.organization_policies.get_by_organization_id(org_id)
        org_policy_read = (
            PolicyRead.model_validate(org_policy_model.model_dump(mode="json"))
            if org_policy_model
            else None
        )

        tasks = self.task_service.list_tasks(project_id)
        entries: list[TaskPolicyEntryRead] = []
        for task in tasks:
            resolved = PolicyResolver.resolve_task_policy(task, org_policy_model)
            entries.append(
                TaskPolicyEntryRead(
                    task=TaskRead.model_validate(task.model_dump(mode="json")),
                    resolved_policy=ResolvedPolicyRead.model_validate(resolved.to_dict()),
                )
            )

        catalog = [_bundle_to_read(bundle) for bundle in list_bundles()]

        return ProjectPoliciesRead(
            project=ProjectRead.model_validate(project.model_dump(mode="json")),
            organization_id=str(project.organization_id),
            organization_policy=org_policy_read,
            tasks=entries,
            catalog=catalog,
        )


def _bundle_to_read(bundle: PolicyBundle) -> PolicyBundleRead:
    return PolicyBundleRead(
        id=bundle.id,
        kind=bundle.kind,
        title=bundle.title,
        description=bundle.description,
        rules=dict(bundle.rules),
    )
