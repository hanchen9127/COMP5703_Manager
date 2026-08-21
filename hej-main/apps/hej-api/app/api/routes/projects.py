from fastapi import APIRouter

from app.schemas.projects import ProjectRead
from app.schemas.tasks import TaskCreate
from app.schemas.tasks import TaskRead
from app.services import ProjectService
from app.services import TaskService


router = APIRouter()
project_service = ProjectService()
task_service = TaskService()


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: str) -> ProjectRead:
    return project_service.get_project(project_id)


@router.get("/{project_id}/tasks", response_model=list[TaskRead])
def list_tasks(project_id: str) -> list[TaskRead]:
    return task_service.list_tasks(project_id)


@router.post("/{project_id}/tasks", response_model=TaskRead, status_code=201)
def create_task(project_id: str, payload: TaskCreate) -> TaskRead:
    return task_service.create_task(project_id, payload)
