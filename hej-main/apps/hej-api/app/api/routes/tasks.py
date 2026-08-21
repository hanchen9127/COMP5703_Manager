from fastapi import APIRouter

from app.schemas.tasks import DatasetRegistrationRequest
from app.schemas.tasks import DatasetRegistrationResponse
from app.schemas.tasks import TaskItemRead
from app.schemas.tasks import TaskRead
from app.services import TaskService


router = APIRouter()
task_service = TaskService()


@router.get("/{task_id}", response_model=TaskRead)
def get_task(task_id: str) -> TaskRead:
    return task_service.get_task(task_id)


@router.get("/{task_id}/task-items", response_model=list[TaskItemRead])
def list_task_items(task_id: str) -> list[TaskItemRead]:
    return task_service.list_task_items(task_id)


@router.post(
    "/{task_id}/dataset-registration",
    response_model=DatasetRegistrationResponse,
    status_code=201,
)
def register_dataset(
    task_id: str, payload: DatasetRegistrationRequest
) -> DatasetRegistrationResponse:
    pointers, task_items = task_service.register_dataset(task_id, payload)
    return DatasetRegistrationResponse(
        task_id=task_id,
        created_data_pointers=pointers,
        created_task_items=task_items,
    )
