"""Aggregate read model for task Setup (definition, policy, data plane)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import DataPointer, Task, TaskItem
from app.schemas.policies import ResolvedPolicyRead
from app.schemas.task_setup import TaskSetupDataPlaneRead, TaskSetupRead
from app.schemas.tasks import DataPointerRead, TaskItemRead, TaskRead
from app.services.review_policy_enforcement import resolve_for_task
from app.services.task_service import TaskService


def infer_storage_provider_hint(location_refs: list[str]) -> str | None:
    for raw in location_refs:
        label = raw.strip().lower()
        if not label:
            continue
        if "s3://" in label or "aws" in label:
            return "AWS S3"
        if "gcs" in label or "google" in label:
            return "Google Cloud Storage"
        if "azure" in label or "blob" in label:
            return "Azure Blob Storage"
        if "mock://" in label:
            return "Mock storage"
        return "Backend storage"
    return None


def registration_status(pointer_count: int, item_count: int) -> str:
    if pointer_count == 0 and item_count == 0:
        return "pending_registration"
    if pointer_count > 0 and item_count > 0:
        return "registered"
    return "partial"


def data_pointer_to_read(pointer: DataPointer) -> DataPointerRead:
    return DataPointerRead(
        id=pointer.id,
        task_id=pointer.task_id,
        location_ref=pointer.location_ref,
        access_policy_ref=pointer.access_policy_ref,
        source_version_ref=pointer.source_version_ref,
        created_at=pointer.created_at,
    )


def task_item_to_read(item: TaskItem) -> TaskItemRead:
    return TaskItemRead(
        id=item.id,
        task_id=item.task_id,
        data_pointer_id=item.data_pointer_id,
        external_item_ref=item.external_item_ref,
        location_ref=item.location_ref,
        status=item.status,
        payload_preview=item.payload_preview,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def task_to_read(task: Task) -> TaskRead:
    return TaskRead.model_validate(task.model_dump(mode="json"))


class TaskSetupService:
    @staticmethod
    def list_data_pointers(db: Session, task_id: str) -> list[DataPointerRead]:
        service = TaskService(db=db)
        service.get_task(task_id)
        pointers = TaskSetupService._load_pointers(service, task_id)
        return [data_pointer_to_read(pointer) for pointer in pointers]

    @staticmethod
    def build_setup_read(db: Session, task_id: str) -> TaskSetupRead:
        service = TaskService(db=db)
        task = service.get_task(task_id)
        pointers = TaskSetupService._load_pointers(service, task_id)
        items = service.list_task_items(task_id)
        resolved = resolve_for_task(db, task)

        location_refs = [p.location_ref for p in pointers]
        location_refs.extend(
            item.location_ref for item in items if item.location_ref
        )

        pointer_count = len(pointers)
        item_count = len(items)

        return TaskSetupRead(
            task=task_to_read(task),
            resolved_policy=ResolvedPolicyRead.model_validate(resolved.to_dict()),
            data_pointers=[data_pointer_to_read(p) for p in pointers],
            task_items=[task_item_to_read(item) for item in items],
            data_plane=TaskSetupDataPlaneRead(
                pointer_count=pointer_count,
                item_count=item_count,
                registration_status=registration_status(pointer_count, item_count),
                storage_provider_hint=infer_storage_provider_hint(location_refs),
            ),
        )

    @staticmethod
    def _load_pointers(service: TaskService, task_id: str) -> list[DataPointer]:
        if service.db_pointer_repo:
            return service.db_pointer_repo.list_by_task(task_id)
        if service.data_pointer_repository:
            return service.data_pointer_repository.list_by_task(task_id)
        return []
