from fastapi import APIRouter

from app.schemas.organizations import OrganizationCreate
from app.schemas.organizations import OrganizationRead
from app.schemas.projects import ProjectCreate
from app.schemas.projects import ProjectRead
from app.services import OrganizationService
from app.services import ProjectService


router = APIRouter()
organization_service = OrganizationService()
project_service = ProjectService()


@router.get("", response_model=list[OrganizationRead])
def list_organizations() -> list[OrganizationRead]:
    return organization_service.list_organizations()


@router.post("", response_model=OrganizationRead, status_code=201)
def create_organization(payload: OrganizationCreate) -> OrganizationRead:
    return organization_service.create_organization(payload)


@router.get("/{organization_id}", response_model=OrganizationRead)
def get_organization(organization_id: str) -> OrganizationRead:
    return organization_service.get_organization(organization_id)


@router.get("/{organization_id}/projects", response_model=list[ProjectRead])
def list_projects(organization_id: str) -> list[ProjectRead]:
    return project_service.list_projects(organization_id)


@router.post("/{organization_id}/projects", response_model=ProjectRead, status_code=201)
def create_project(
    organization_id: str, payload: ProjectCreate
) -> ProjectRead:
    return project_service.create_project(organization_id, payload)
