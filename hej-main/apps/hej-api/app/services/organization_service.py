from fastapi import HTTPException
from fastapi import status

from app.models import Organization
from app.repositories import OrganizationRepository
from app.schemas.organizations import OrganizationCreate
from app.services.id_service import new_id


class OrganizationService:
    def __init__(self, repository: OrganizationRepository | None = None) -> None:
        self.repository = repository or OrganizationRepository()

    def list_organizations(self) -> list[Organization]:
        return self.repository.list()

    def get_organization(self, organization_id: str) -> Organization:
        organization = self.repository.get(organization_id)
        if organization is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization '{organization_id}' not found",
            )
        return organization

    def create_organization(self, payload: OrganizationCreate) -> Organization:
        organization = Organization(
            id=new_id("org"),
            display_name=payload.display_name,
        )
        return self.repository.save(organization)
