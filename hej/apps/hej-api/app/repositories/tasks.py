from app.models import DataPointer
from app.models import Task
from app.models import TaskItem
from app.repositories.memory_store import store


class TaskRepository:
    def list_by_project(self, project_id: str) -> list[Task]:
        return [task for task in store.tasks.values() if task.project_id == project_id]

    def get(self, task_id: str) -> Task | None:
        return store.tasks.get(task_id)

    def save(self, task: Task) -> Task:
        store.tasks[task.id] = task
        return task


class DataPointerRepository:
    def list_by_task(self, task_id: str) -> list[DataPointer]:
        return [
            pointer
            for pointer in store.data_pointers.values()
            if pointer.task_id == task_id
        ]

    def save(self, pointer: DataPointer) -> DataPointer:
        store.data_pointers[pointer.id] = pointer
        return pointer


class TaskItemRepository:
    def list_by_task(self, task_id: str) -> list[TaskItem]:
        return [
            item for item in store.task_items.values() if item.task_id == task_id
        ]

    def save_many(self, task_items: list[TaskItem]) -> list[TaskItem]:
        for task_item in task_items:
            store.task_items[task_item.id] = task_item
        return task_items
