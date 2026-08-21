from fastapi import HTTPException
from fastapi import status

from app.models import Project
from app.repositories import ProjectRepository
from app.schemas.projects import ProjectCreate
from app.services.id_service import new_id
from app.services.organization_service import OrganizationService


class ProjectService:
    def __init__(
        self,
        repository: ProjectRepository | None = None,
        organization_service: OrganizationService | None = None,
    ) -> None:
        self.repository = repository or ProjectRepository()
        self.organization_service = organization_service or OrganizationService()

    def list_projects(self, organization_id: str) -> list[Project]:
        self.organization_service.get_organization(organization_id)
        return self.repository.list_by_organization(organization_id)

    def get_project(self, project_id: str) -> Project:
        project = self.repository.get(project_id)
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project '{project_id}' not found",
            )
        return project

    def create_project(
        self, organization_id: str, payload: ProjectCreate
    ) -> Project:
        self.organization_service.get_organization(organization_id)
        project = Project(
            id=new_id("proj"),
            organization_id=organization_id,
            name=payload.name,
            description=payload.description,
            governance_model=payload.governance_model,
        )
        return self.repository.save(project)
