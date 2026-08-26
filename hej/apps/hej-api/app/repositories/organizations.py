from app.models import Organization
from app.repositories.memory_store import store


class OrganizationRepository:
    def list(self) -> list[Organization]:
        return list(store.organizations.values())

    def get(self, organization_id: str) -> Organization | None:
        return store.organizations.get(organization_id)

    def save(self, organization: Organization) -> Organization:
        store.organizations[organization.id] = organization
        return organization
