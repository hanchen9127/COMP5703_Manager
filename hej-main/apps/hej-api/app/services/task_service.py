from app.models import DataPointer
from app.models import Task
from app.models import TaskItem
from app.repositories import DataPointerRepository
from app.repositories import TaskItemRepository
from app.repositories import TaskRepository
from app.schemas.tasks import DatasetRegistrationRequest
from app.schemas.tasks import TaskCreate
from app.services.id_service import new_id
from app.services.project_service import ProjectService


class TaskService:
    def __init__(
        self,
        task_repository: TaskRepository | None = None,
        data_pointer_repository: DataPointerRepository | None = None,
        task_item_repository: TaskItemRepository | None = None,
        project_service: ProjectService | None = None,
    ) -> None:
        self.task_repository = task_repository or TaskRepository()
        self.data_pointer_repository = (
            data_pointer_repository or DataPointerRepository()
        )
        self.task_item_repository = task_item_repository or TaskItemRepository()
        self.project_service = project_service or ProjectService()

    def list_tasks(self, project_id: str) -> list[Task]:
        self.project_service.get_project(project_id)
        return self.task_repository.list_by_project(project_id)

    def get_task(self, task_id: str) -> Task:
        from fastapi import HTTPException
        from fastapi import status

        task = self.task_repository.get(task_id)
        if task is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task '{task_id}' not found",
            )
        return task

    def create_task(self, project_id: str, payload: TaskCreate) -> Task:
        self.project_service.get_project(project_id)
        task = Task(
            id=new_id("task"),
            project_id=project_id,
            title=payload.title,
            description=payload.description,
            judgment_question=payload.judgment_question,
            annotation_mode=payload.annotation_mode,
            label_schema_ref=payload.label_schema_ref,
            review_policy_ref=payload.review_policy_ref,
        )
        return self.task_repository.save(task)

    def list_task_items(self, task_id: str) -> list[TaskItem]:
        self.get_task(task_id)
        return self.task_item_repository.list_by_task(task_id)

    def register_dataset(
        self, task_id: str, payload: DatasetRegistrationRequest
    ) -> tuple[list[DataPointer], list[TaskItem]]:
        self.get_task(task_id)

        pointers: list[DataPointer] = []
        task_items: list[TaskItem] = []

        for item in payload.items:
            pointer = self.data_pointer_repository.save(
                DataPointer(
                    id=new_id("ptr"),
                    task_id=task_id,
                    location_ref=item.location_ref,
                    access_policy_ref=item.access_policy_ref,
                    source_version_ref=item.source_version_ref,
                )
            )
            task_item = TaskItem(
                id=new_id("item"),
                task_id=task_id,
                data_pointer_id=pointer.id,
                external_item_ref=item.external_item_ref,
                payload_preview=item.payload_preview,
            )
            pointers.append(pointer)
            task_items.append(task_item)

        return pointers, self.task_item_repository.save_many(task_items)
