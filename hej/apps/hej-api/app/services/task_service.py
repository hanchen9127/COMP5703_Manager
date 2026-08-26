from typing import Any
from typing import Literal

from fastapi import HTTPException
from fastapi import status
from sqlalchemy.orm import Session

DatasetIntakeSource = Literal["text_upload", "image_upload", "audio_upload"]


def _data_intake_audit_new_values(
    *,
    item_names: list[str],
    intake_source: DatasetIntakeSource | None,
) -> dict[str, object] | None:
    payload: dict[str, object] = {}
    if intake_source is not None:
        payload["intake_source"] = intake_source
    if item_names:
        payload["item_names"] = item_names
    return payload or None

from app.models import DataPointer
from app.models import Task
from app.models import TaskItem
from app.repositories import DataPointerRepository
from app.repositories import TaskItemRepository
from app.repositories import TaskRepository
from app.repositories.db_store import DBStore
from app.schemas.tasks import DatasetRegistrationRequest
from app.schemas.tasks import TaskCreate
from app.schemas.tasks import normalize_text_span_label_options
from app.core.policy_refs import validate_task_policy_refs
from app.integrations.gemini_preannotator import GeminiPreannotator
from app.services.id_service import new_id
from app.services.project_service import ProjectService
from app.services.task_history_copy import build_data_intake_audit_copy
from app.services.task_history_recorder import TaskHistoryRecorder
from app.services.task_item_status_resolution import list_task_items_with_send_back_resolution

TASK_POLICY_AUDIT_FIELDS = frozenset(
    {
        "label_schema_ref",
        "review_policy_ref",
        "dispute_policy_ref",
        "export_policy_ref",
        "annotation_mode",
    }
)

TASK_DEFINITION_AUDIT_FIELDS = frozenset(
    {
        "title",
        "description",
        "judgment_question",
        "annotation_mode",
        "task_type",
        "text_span_label_options",
    }
)


def assert_task_allows_dataset_intake(task: Task) -> None:
    if task.status not in {"draft", "ready"}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Dataset intake is only allowed while the task is in draft or ready status.",
        )


TERMINAL_TASK_STATUSES = {"completed"}
TERMINAL_TASK_ITEM_STATUSES = {"canonicalized"}
WORKFLOW_OWNED_TASK_ITEM_STATUSES = {
    "annotated",
    "returned",
    "rejected",
    "reviewed",
    "disputed",
    "expert_send_back",
    "canonicalized",
}
FINALIZED_EXPORTABLE_TASK_ITEM_STATUSES = {
    "approved",
    "reviewed",
    "canonicalized",
}


def assert_task_item_status_update_allowed(
    task: Task,
    task_item: TaskItem,
    next_status: str,
) -> None:
    if task.status in TERMINAL_TASK_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Task item status cannot be updated because the task is in terminal status: {task.status}.",
        )

    if task_item.status in TERMINAL_TASK_ITEM_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Task item status cannot be updated from terminal status: {task_item.status}.",
        )

    if next_status in WORKFLOW_OWNED_TASK_ITEM_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Task item status cannot be set directly to workflow-owned status: {next_status}.",
        )


class TaskService:
    def __init__(
        self,
        db: Session = None,
        task_repository: TaskRepository | None = None,
        data_pointer_repository: DataPointerRepository | None = None,
        task_item_repository: TaskItemRepository | None = None,
        project_service: ProjectService | None = None,
    ) -> None:
        self.db = db
        self.task_repository = task_repository
        self.data_pointer_repository = data_pointer_repository
        self.task_item_repository = task_item_repository
        
        if db:
            # 使用数据库仓储
            self.db_store = DBStore(db)
            self.db_task_repo = self.db_store.tasks
            self.db_pointer_repo = self.db_store.data_pointers
            self.db_item_repo = self.db_store.task_items
            self.db_draft_repo = self.db_store.drafts
        else:
            self.db_store = None
            self.db_task_repo = None
            self.db_pointer_repo = None
            self.db_item_repo = None
            self.db_draft_repo = None
            # 使用内存仓储
            self.task_repository = task_repository or TaskRepository()
            self.data_pointer_repository = (
                data_pointer_repository or DataPointerRepository()
            )
            self.task_item_repository = task_item_repository or TaskItemRepository()
        
        self.project_service = project_service or ProjectService(db=db)

    @staticmethod
    def _apply_validated_policy_refs(existing: Task, kwargs: dict) -> dict:
        policy_field_names = {
            "label_schema_ref",
            "review_policy_ref",
            "dispute_policy_ref",
            "export_policy_ref",
        }
        if not policy_field_names.intersection(kwargs):
            return kwargs

        merged = dict(kwargs)
        policy_refs = validate_task_policy_refs(
            label_schema_ref=merged.get("label_schema_ref", existing.label_schema_ref),
            review_policy_ref=merged.get("review_policy_ref", existing.review_policy_ref),
            dispute_policy_ref=merged.get("dispute_policy_ref", existing.dispute_policy_ref),
            export_policy_ref=merged.get("export_policy_ref", existing.export_policy_ref),
        )
        merged.update(policy_refs)
        return merged

    def list_tasks(self, project_id: str) -> list[Task]:
        self.project_service.get_project(project_id)
        
        if self.db_task_repo:
            return self.db_task_repo.list_by_project(project_id)
        else:
            return self.task_repository.list_by_project(project_id)

    def get_task(self, task_id: str) -> Task:
        if self.db_task_repo:
            task = self.db_task_repo.get(task_id)
        else:
            task = self.task_repository.get(task_id)
        
        if task is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task '{task_id}' not found",
            )
        return task

    def create_task(
        self,
        project_id: str,
        payload: TaskCreate,
        *,
        operator_id: int | None = None,
    ) -> Task:
        self.project_service.get_project(project_id)
        policy_refs = validate_task_policy_refs(
            label_schema_ref=payload.label_schema_ref,
            review_policy_ref=payload.review_policy_ref,
            dispute_policy_ref=payload.dispute_policy_ref,
            export_policy_ref=payload.export_policy_ref,
        )
        task = Task(
            id=new_id("task"),
            project_id=project_id,
            title=payload.title,
            description=payload.description,
            judgment_question=payload.judgment_question,
            task_type=payload.task_type,
            annotation_mode=payload.annotation_mode,
            label_schema_ref=policy_refs["label_schema_ref"],
            text_span_label_options=payload.text_span_label_options,
            review_policy_ref=policy_refs["review_policy_ref"],
            dispute_policy_ref=policy_refs["dispute_policy_ref"],
            export_policy_ref=policy_refs["export_policy_ref"],
        )
        
        if self.db_task_repo:
            created = self.db_task_repo.create(task)
            if self.db and operator_id is not None:
                TaskHistoryRecorder.record(
                    self.db,
                    operation="task_created",
                    task_id=created.id,
                    project_id=project_id,
                    operator_id=operator_id,
                    summary=f"Task created: {created.title}",
                    description="Task shell created in draft posture",
                    new_values={"title": created.title, "status": str(created.status)},
                )
            return created
        else:
            return self.task_repository.save(task)

    def update_task(
        self,
        task_id: str,
        *,
        operator_id: int | None = None,
        **kwargs,
    ) -> Task:
        """更新任务"""
        if self.db_task_repo:
            existing = self.db_task_repo.get(task_id)
            if existing is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Task '{task_id}' not found",
                )
            if "text_span_label_options" in kwargs:
                kwargs["text_span_label_options"] = normalize_text_span_label_options(
                    kwargs.get("text_span_label_options")
                )
            kwargs = self._apply_validated_policy_refs(existing, kwargs)
            updated = self.db_task_repo.update(task_id, **kwargs)
            if self.db and operator_id is not None and existing is not None:
                old_policy = {
                    field: getattr(existing, field, None)
                    for field in TASK_POLICY_AUDIT_FIELDS
                }
                new_policy = {
                    field: getattr(updated, field, None) for field in TASK_POLICY_AUDIT_FIELDS
                }
                if old_policy != new_policy:
                    TaskHistoryRecorder.record(
                        self.db,
                        operation="policy_updated",
                        task_id=task_id,
                        project_id=updated.project_id,
                        operator_id=operator_id,
                        summary="Task policy refs updated",
                        description="Task policy refs updated",
                        old_values=old_policy,
                        new_values=new_policy,
                    )
                old_definition = {
                    field: getattr(existing, field, None)
                    for field in TASK_DEFINITION_AUDIT_FIELDS
                }
                new_definition = {
                    field: getattr(updated, field, None)
                    for field in TASK_DEFINITION_AUDIT_FIELDS
                }
                if old_definition != new_definition:
                    TaskHistoryRecorder.record(
                        self.db,
                        operation="task_updated",
                        task_id=task_id,
                        project_id=updated.project_id,
                        operator_id=operator_id,
                        summary="Task definition updated",
                        description="Task definition fields updated",
                        old_values=old_definition,
                        new_values=new_definition,
                    )
            return updated
        else:
            task = self.task_repository.get(task_id)
            if not task:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Task '{task_id}' not found"
                )
            nullable_fields = {
                "review_policy_ref",
                "dispute_policy_ref",
                "export_policy_ref",
                "description",
            }
            for key, value in kwargs.items():
                if not hasattr(task, key):
                    continue
                if value is not None or key in nullable_fields:
                    setattr(task, key, value)
            return self.task_repository.save(task)
    
    def _get_task_items_for_completion(self, task_id: str) -> list[TaskItem]:
        if self.db_item_repo:
            return self.db_item_repo.list_by_task(task_id)
        return self.task_item_repository.list_by_task(task_id)

    def assert_task_completeable(self, task: Task, items: list[TaskItem]) -> None:
        if not items:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Task cannot be completed because it has no task items.",
            )

        non_finalized = [
            item
            for item in items
            if str(getattr(item, "status", "")).lower() not in FINALIZED_EXPORTABLE_TASK_ITEM_STATUSES
        ]
        if non_finalized:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Task cannot be completed until all task items are finalized/exportable.",
            )

    def complete_task(self, task_id: str, *, operator_id: int | None = None) -> Task:
        task = self.get_task(task_id)
        items = self._get_task_items_for_completion(task_id)
        self.assert_task_completeable(task, items)

        updated = self.update_task(task_id, operator_id=operator_id, status="completed")
        if self.db and operator_id is not None:
            TaskHistoryRecorder.record(
                self.db,
                operation="task_completed",
                task_id=task_id,
                project_id=updated.project_id,
                operator_id=operator_id,
                summary="Task completed",
                description="Task marked completed after all items became exportable",
                old_values={"status": getattr(task, "status", None)},
                new_values={"status": getattr(updated, "status", None)},
            )
        return updated

    def delete_task(self, task_id: str) -> bool:
        """删除任务"""
        if self.db_task_repo:
            return self.db_task_repo.delete(task_id)
        else:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Task deletion not supported in memory mode"
            )

    def list_task_items(self, task_id: str) -> list[TaskItem]:
        self.get_task(task_id)

        if self.db_item_repo:
            items = self.db_item_repo.list_by_task(task_id)
        else:
            items = self.task_item_repository.list_by_task(task_id)

        if self.db is not None:
            return list_task_items_with_send_back_resolution(self.db, task_id, items)
        return items

    @staticmethod
    def _is_ai_assisted(task: Task) -> bool:
        return str(task.annotation_mode) == "ai_assisted"

    @staticmethod
    def _has_meaningful_draft(draft_data: dict[str, Any] | None, revision_notes: str | None) -> bool:
        if revision_notes and revision_notes.strip():
            return True
        if not isinstance(draft_data, dict):
            return False
        for value in draft_data.values():
            if isinstance(value, str) and value.strip():
                return True
            if isinstance(value, list) and len(value) > 0:
                return True
            if isinstance(value, dict) and len(value) > 0:
                return True
        return False

    def register_dataset(
        self,
        task_id: str,
        payload: DatasetRegistrationRequest,
        *,
        operator_id: int | None = None,
        intake_source: DatasetIntakeSource | None = None,
        intake_file_count: int | None = None,
    ) -> tuple[list[DataPointer], list[TaskItem]]:
        task = self.get_task(task_id)
        assert_task_allows_dataset_intake(task)

        pointers: list[DataPointer] = []
        task_items: list[TaskItem] = []

        if self.db_pointer_repo and self.db_item_repo:
            # 使用数据库
            for item in payload.items:
                pointer = DataPointer(
                    id=new_id("ptr"),
                    task_id=task_id,
                    location_ref=item.location_ref,
                    access_policy_ref=item.access_policy_ref,
                    source_version_ref=item.source_version_ref,
                )
                saved_pointer = self.db_pointer_repo.save(pointer)
                
                task_item = TaskItem(
                    id=new_id("item"),
                    task_id=task_id,
                    data_pointer_id=saved_pointer.id,
                    external_item_ref=item.external_item_ref,
                    payload_preview=item.payload_preview,
                )
                pointers.append(saved_pointer)
                task_items.append(task_item)
            
            saved_items = self.db_item_repo.save_many(task_items)

            preannotator = GeminiPreannotator() if self._is_ai_assisted(task) else None
            
            # 为每个 TaskItem 自动创建 Draft。ai_assisted 下优先写入 AI 初始化结果。
            if self.db_draft_repo:
                for index, saved_item in enumerate(saved_items):
                    existing_drafts = self.db_draft_repo.list_by_task_item(saved_item.id)
                    if any(self._has_meaningful_draft(d.draft_data, d.revision_notes) for d in existing_drafts):
                        continue

                    if preannotator:
                        source_item = payload.items[index]
                        ai_result = preannotator.generate_for_item(
                            task,
                            location_ref=source_item.location_ref,
                            payload_preview=source_item.payload_preview,
                        )
                        self.db_draft_repo.create(
                            draft_id=new_id("draft"),
                            task_item_id=saved_item.id,
                            annotation_type=ai_result.annotation_type,
                            status="pending",
                            draft_data=ai_result.draft_data,
                            revision_notes=ai_result.revision_notes,
                            created_by=operator_id,
                        )
                        continue

                    self.db_draft_repo.create(
                        draft_id=new_id("draft"),
                        task_item_id=saved_item.id,
                        annotation_type="bbox",
                        status="pending",
                        draft_data={"bboxes": {}, "labels": {}},
                    )
            
            if self.db and operator_id is not None:
                item_names = [
                    str(item.external_item_ref).strip()
                    for item in saved_items
                    if item.external_item_ref and str(item.external_item_ref).strip()
                ]
                audit_summary, audit_detail = build_data_intake_audit_copy(
                    item_count=len(saved_items),
                    intake_source=intake_source,
                    item_names=item_names,
                )
                audit_resource_type = "task"
                audit_resource_id: str | None = task_id
                if len(saved_items) == 1:
                    audit_resource_type = "task_item"
                    audit_resource_id = saved_items[0].id

                TaskHistoryRecorder.record(
                    self.db,
                    operation="dataset_registered",
                    task_id=task_id,
                    project_id=task.project_id,
                    operator_id=operator_id,
                    summary=audit_summary,
                    description=audit_detail,
                    resource_type=audit_resource_type,
                    resource_id=audit_resource_id,
                    new_values=_data_intake_audit_new_values(
                        item_names=item_names,
                        intake_source=intake_source,
                    ),
                )
            return pointers, saved_items
        else:
            # 使用内存存储
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
                    location_ref=item.location_ref,
                    payload_preview=item.payload_preview,
                )
                pointers.append(pointer)
                task_items.append(task_item)

            return pointers, self.task_item_repository.save_many(task_items)
