from app.models import Project
from app.repositories.memory_store import store


class ProjectRepository:
    def list_by_organization(self, organization_id: str) -> list[Project]:
        return [
            project
            for project in store.projects.values()
            if project.organization_id == organization_id
        ]

    def get(self, project_id: str) -> Project | None:
        return store.projects.get(project_id)

    def save(self, project: Project) -> Project:
        store.projects[project.id] = project
        return project
