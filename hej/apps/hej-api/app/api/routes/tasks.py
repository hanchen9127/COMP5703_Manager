from fastapi import APIRouter, Depends, Path, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, UTC
from typing import Literal
from collections import defaultdict

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import (
    verify_user_is_active,
    verify_user_task_access,
)
from app.schemas.tasks import DatasetRegistrationRequest
from app.schemas.tasks import DatasetRegistrationResponse
from app.schemas.tasks import DataPointerRead
from app.schemas.tasks import TaskItemRead
from app.schemas.tasks import TaskItemContentRead
from app.schemas.policies import ResolvedPolicyRead
from app.schemas.tasks import TaskRead
from app.schemas.tasks import TaskUpdate
from app.schemas.task_history import TaskAuditLogsResponse, TaskWorkflowLineageResponse
from app.schemas.task_setup import TaskSetupRead
from app.services import TaskService
from app.services.task_service import assert_task_item_status_update_allowed
from app.services.review_policy_enforcement import resolve_for_task
from app.services.task_setup_service import TaskSetupService, task_item_to_read
from app.services.data_access_service import (
    DataAccessService,
    LocationRefNotFoundError,
    UnsupportedLocationRefError,
)
from app.services.task_audit_log_query import TaskAuditLogQueryService
from app.services.task_workflow_service import TaskWorkflowService
from app.services.task_history_recorder import TaskHistoryRecorder
from app.models.db_models import (
    ProjectDB,
    DataPointerDB,
    TaskItemDB,
    TaskItemEscalationDB,
    AnnotationDB,
    ReviewDB,
    UserDB,
)


router = APIRouter()
project_tasks_router = APIRouter()


class TaskItemStatusUpdate(BaseModel):
    status: str


@project_tasks_router.put("/projects/{project_id}/tasks/{task_id}", response_model=TaskRead)
def update_task(
    project_id: str,
    task_id: str,
    payload: TaskUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskRead:
    verify_user_is_active(current_user)
    service = TaskService(db=db)
    task = service.get_task(task_id)
    if task is None or task.project_id != project_id:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found")
    verify_user_task_access(current_user, task, db)

    updates = payload.model_dump(exclude_unset=True)
    updated = service.update_task(task_id, operator_id=current_user.get("user_id"), **updates)
    return updated


@project_tasks_router.post("/projects/{project_id}/tasks/{task_id}/complete", response_model=TaskRead)
def complete_task(
    project_id: str,
    task_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskRead:
    verify_user_is_active(current_user)
    service = TaskService(db=db)
    task = service.get_task(task_id)
    if task is None or task.project_id != project_id:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found")
    verify_user_task_access(current_user, task, db)
    return service.complete_task(task_id, operator_id=current_user.get("user_id"))


@router.get("/{task_id}", response_model=TaskRead)
def get_task(
    task_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskRead:
    # Verify user is active
    verify_user_is_active(current_user)
    
    # Get task
    service = TaskService(db=db)
    task = service.get_task(task_id)
    
    # Verify user has access to this task's project/organization
    verify_user_task_access(current_user, task, db)
    
    return task


@router.get("/{task_id}/audit-logs", response_model=TaskAuditLogsResponse)
def list_task_audit_logs(
    task_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    category: Literal[
        "setup", "policy", "data", "annotation", "review", "dispute", "system"
    ]
    | None = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskAuditLogsResponse:
    verify_user_is_active(current_user)
    service = TaskService(db=db)
    task = service.get_task(task_id)
    verify_user_task_access(current_user, task, db)
    return TaskAuditLogQueryService.list_for_task(
        db,
        task_id,
        project_id=task.project_id,
        limit=limit,
        offset=offset,
        category=category,
    )


@router.get("/{task_id}/workflow-lineage", response_model=TaskWorkflowLineageResponse)
def get_task_workflow_lineage(
    task_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskWorkflowLineageResponse:
    verify_user_is_active(current_user)
    service = TaskService(db=db)
    task = service.get_task(task_id)
    verify_user_task_access(current_user, task, db)
    return TaskWorkflowService.build_lineage(db, task)


@router.get("/{task_id}/resolved-policy", response_model=ResolvedPolicyRead)
def get_task_resolved_policy(
    task_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ResolvedPolicyRead:
    verify_user_is_active(current_user)
    service = TaskService(db=db)
    task = service.get_task(task_id)
    verify_user_task_access(current_user, task, db)
    resolved = resolve_for_task(db, task)
    return ResolvedPolicyRead.model_validate(resolved.to_dict())


@router.get("/{task_id}/setup", response_model=TaskSetupRead)
def get_task_setup(
    task_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskSetupRead:
    verify_user_is_active(current_user)
    service = TaskService(db=db)
    task = service.get_task(task_id)
    verify_user_task_access(current_user, task, db)
    return TaskSetupService.build_setup_read(db, task_id)


@router.get("/{task_id}/data-pointers", response_model=list[DataPointerRead])
def list_task_data_pointers(
    task_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DataPointerRead]:
    verify_user_is_active(current_user)
    service = TaskService(db=db)
    task = service.get_task(task_id)
    verify_user_task_access(current_user, task, db)
    return TaskSetupService.list_data_pointers(db, task_id)


@router.get("/{task_id}/task-items", response_model=list[TaskItemRead])
def list_task_items(
    task_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TaskItemRead]:
    # Verify user is active
    verify_user_is_active(current_user)
    
    # Get task to verify access
    service = TaskService(db=db)
    task = service.get_task(task_id)
    
    # Verify user has access to this task's project/organization
    verify_user_task_access(current_user, task, db)

    return service.list_task_items(task_id)


@router.get(
    "/{task_id}/task-items/{task_item_id}/content",
    response_model=TaskItemContentRead,
)
def get_task_item_content(
    task_id: str,
    task_item_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskItemContentRead:
    verify_user_is_active(current_user)
    service = TaskService(db=db)
    task = service.get_task(task_id)
    verify_user_task_access(current_user, task, db)

    items = service.list_task_items(task_id)
    item = next((i for i in items if i.id == task_item_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Task item not found")

    location_ref = (item.location_ref or "").strip()
    if not location_ref:
        raise HTTPException(status_code=404, detail="Task item has no location_ref")

    try:
        return DataAccessService.resolve(location_ref)
    except UnsupportedLocationRefError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except LocationRefNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/{task_id}/dataset-registration",
    response_model=DatasetRegistrationResponse,
    status_code=201,
)
def register_dataset(
    task_id: str,
    payload: DatasetRegistrationRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DatasetRegistrationResponse:
    # Verify user is active
    verify_user_is_active(current_user)
    
    # Get task to verify access
    service = TaskService(db=db)
    task = service.get_task(task_id)
    
    # Verify user has access to this task's project/organization
    verify_user_task_access(current_user, task, db)
    
    try:
        pointers, task_items = service.register_dataset(
            task_id,
            payload,
            operator_id=current_user.get("user_id"),
        )
        
        # Convert pointers and task_items to response models
        pointer_reads = [
            DataPointerRead(
                id=p.id,
                task_id=p.task_id,
                location_ref=p.location_ref,
                access_policy_ref=p.access_policy_ref,
                source_version_ref=p.source_version_ref,
                created_at=p.created_at
            )
            for p in pointers
        ]
        
        item_reads = [task_item_to_read(item) for item in task_items]
        
        return DatasetRegistrationResponse(
            task_id=task_id,
            created_data_pointers=pointer_reads,
            created_task_items=item_reads,
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to register dataset: {str(e)}"
        )


@router.patch("/{task_id}/task-items/{item_id}", response_model=TaskItemRead, status_code=200)
def update_task_item(
    task_id: str = Path(..., description="Task ID"),
    item_id: str = Path(..., description="Task Item ID"),
    payload: TaskItemStatusUpdate = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskItemRead:
    """Update task item status with permission checks"""
    # Verify user is active
    verify_user_is_active(current_user)
    
    # Get task to verify access
    service = TaskService(db=db)
    task = service.get_task(task_id)
    
    # Verify user has access to this task's project/organization
    verify_user_task_access(current_user, task, db)
    
    # Update task item
    if service.db_item_repo:
        task_item = service.db_item_repo.get(item_id)
        if task_item is None:
            raise HTTPException(status_code=404, detail="Task item not found")
        assert_task_item_status_update_allowed(task, task_item, payload.status)
        return service.db_item_repo.update(item_id, status=payload.status)
    else:
        raise Exception("Task item update requires database connection")


def _safe_iso(value):
    return value.isoformat() if value else None


def _user_ref(user: UserDB | None, user_id: int | None) -> dict:
    if user is None:
        return {"user_id": user_id, "name": None, "email": None}
    return {
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
    }


def _latest_resolved_escalations_by_item(
    escalations: list[TaskItemEscalationDB],
) -> dict[str, TaskItemEscalationDB]:
    """Keep the most recently decided resolved escalation per task item."""
    latest: dict[str, TaskItemEscalationDB] = {}
    for esc in escalations:
        if esc.task_item_id not in latest:
            latest[esc.task_item_id] = esc
    return latest


def _finalization_export_block(
    escalation: TaskItemEscalationDB | None,
    user_by_id: dict[int, UserDB],
) -> dict | None:
    """Dispute-desk finalize metadata for normalized_json export."""
    if escalation is None:
        return None
    decider = (
        user_by_id.get(escalation.decided_by)
        if escalation.decided_by is not None
        else None
    )
    return {
        "escalation_id": escalation.id,
        "decision": escalation.decision,
        "decision_note": escalation.decision_note,
        "decided_at": _safe_iso(escalation.decided_at),
        "decided_by": _user_ref(decider, escalation.decided_by),
        "routed_note": escalation.note,
        "routed_at": _safe_iso(escalation.routed_at),
        "target": escalation.target,
    }


def _normalize_text_annotation(raw_annotation_data: dict) -> dict:
    source = raw_annotation_data or {}
    if isinstance(source.get("output"), dict):
        source = source["output"]
    text_value = source.get("output_text")
    if text_value is None:
        text_value = source.get("text")
    if text_value is None:
        text_value = source.get("output")
    if text_value is None:
        text_value = source.get("value")
    if text_value is None:
        text_value = source.get("content")
    notes = source.get("notes")
    text_spans = source.get("text_spans")
    labels = source.get("labels")
    if text_spans is None and isinstance(raw_annotation_data, dict):
        text_spans = raw_annotation_data.get("text_spans")
    if labels is None and isinstance(raw_annotation_data, dict):
        labels = raw_annotation_data.get("labels")
    return {
        "modality": "text",
        "kind": "text_json",
        "value": {
            "text": text_value,
            "text_spans": text_spans,
            "labels": labels,
            "notes": notes,
        },
    }


def _normalize_image_annotation(raw_annotation_data: dict) -> dict:
    source = raw_annotation_data or {}
    if isinstance(source.get("output"), dict):
        source = source["output"]
    boxes = source.get("boxes")
    if boxes is None:
        boxes = source.get("annotations")
    if boxes is None:
        boxes = source.get("regions")
    if boxes is None:
        boxes = source.get("items")
    image_url = source.get("imageUrl")
    if image_url is None:
        image_url = source.get("image_url")
    notes = source.get("notes")
    return {
        "modality": "image",
        "kind": "image_bbox",
        "value": {
            "imageUrl": image_url,
            "boxes": boxes or [],
            "notes": notes,
        },
    }


def _normalize_audio_annotation(raw_annotation_data: dict) -> dict:
    source = raw_annotation_data or {}
    if isinstance(source.get("output"), dict):
        source = source["output"]
    segments = source.get("segments")
    if segments is None:
        segments = source.get("audio_segments")
    if segments is None:
        segments = []
    normalized_segments = []
    for segment in segments:
        if not isinstance(segment, dict):
            normalized_segments.append(segment)
            continue
        normalized_segments.append(
            {
                "id": segment.get("id"),
                "label": segment.get("label"),
                "speaker": segment.get("speaker"),
                "startTime": segment.get("startTime") if segment.get("startTime") is not None else segment.get("start_time"),
                "endTime": segment.get("endTime") if segment.get("endTime") is not None else segment.get("end_time"),
                "transcript": segment.get("transcript"),
                "confidence": segment.get("confidence"),
            }
        )
    audio_url = source.get("audioUrl")
    if audio_url is None:
        audio_url = source.get("audio_url")
    notes = source.get("notes")
    return {
        "modality": "audio",
        "kind": "audio_segments",
        "value": {
            "audioUrl": audio_url,
            "timeUnit": "seconds",
            "segments": normalized_segments,
            "notes": notes,
        },
    }


def _normalize_annotation_payload(task_type: str | None, annotation_type: str | None, raw_annotation_data: dict) -> dict:
    annotation_type_lower = (annotation_type or "").lower()
    task_type_lower = (task_type or "").lower()
    try:
        if task_type_lower == "text" or "text" in annotation_type_lower or annotation_type_lower in {"annotation", "judgement"}:
            return _normalize_text_annotation(raw_annotation_data)
        if task_type_lower == "image" or "image" in annotation_type_lower or "bbox" in annotation_type_lower:
            return _normalize_image_annotation(raw_annotation_data)
        if task_type_lower == "audio" or "audio" in annotation_type_lower or "segment" in annotation_type_lower:
            return _normalize_audio_annotation(raw_annotation_data)
    except Exception:
        pass
    return {
        "modality": task_type_lower or "unknown",
        "kind": "legacy",
        "value": {"raw": raw_annotation_data},
        "normalization_status": "fallback",
    }


@router.get("/{task_id}/export-annotations", status_code=200)
def export_annotations(
    task_id: str,
    created_by: int | None = None,
    format: str | None = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export annotations for a task.

    Query params:
    - created_by: optional filter by creator ID
    - format: omitted or legacy keeps existing behavior; normalized_json returns normalized export
    """
    verify_user_is_active(current_user)

    service = TaskService(db=db)
    task = service.get_task(task_id)
    verify_user_task_access(current_user, task, db)

    resolved = resolve_for_task(db, task)
    task_items = db.query(TaskItemDB).filter(TaskItemDB.task_id == task_id).all()
    exportable_statuses = {"reviewed", "canonicalized"}
    # Export is a data egress boundary: regardless of provenance policy,
    # only reviewed or canonicalized task items are eligible for export.
    exportable_task_items = [item for item in task_items if item.status in exportable_statuses]
    if not exportable_task_items:
        raise HTTPException(
            status_code=403,
            detail="Export blocked: no reviewed or canonicalized task items are available for export.",
        )

    if format in (None, "", "legacy"):
        export_data = {
            "task_id": task_id,
            "task_title": task.title,
            "task_description": task.description or "",
            "judgment_question": task.judgment_question,
            "annotation_mode": task.annotation_mode,
            "export_timestamp": datetime.now(UTC).isoformat(),
            "requested_by_user_id": current_user.get("id"),
            "requested_by_user_email": current_user.get("email"),
            "filter_created_by": created_by,
            "resolved_export_policy": resolved.to_dict(),
            "provenance": {
                "required": resolved.export_provenance_required,
                "export_policy_ref": resolved.export_policy_ref,
                "retention_days": resolved.export_retention_days,
                "requested_by_user_id": current_user.get("user_id"),
                "requested_by_user_email": current_user.get("email"),
            },
            "items": [],
        }

        for item in exportable_task_items:
            query = (
                db.query(AnnotationDB)
                .filter(AnnotationDB.task_item_id == item.id)
                .order_by(AnnotationDB.created_by, AnnotationDB.version.desc())
            )

            if created_by is not None:
                query = query.filter(AnnotationDB.created_by == created_by)

            all_annotations = query.all()
            if not all_annotations:
                continue

            annotations_by_creator = {}
            for ann in all_annotations:
                creator_id = ann.created_by
                if creator_id not in annotations_by_creator:
                    annotations_by_creator[creator_id] = ann

            item_data = {
                "item_id": item.id,
                "external_ref": item.external_item_ref,
                "status": item.status,
                "payload": item.payload_preview or {},
                "annotations_by_creator": {},
            }

            for creator_id, ann in annotations_by_creator.items():
                creator_user = db.query(UserDB).filter(UserDB.id == creator_id).first()
                creator_name = creator_user.name if creator_user else f"User_{creator_id}"
                creator_email = creator_user.email if creator_user else ""

                creator_entry = {
                    "creator_id": creator_id,
                    "creator_name": creator_name,
                    "creator_email": creator_email,
                    "annotation_count": 1,
                    "annotations": [],
                }

                reviews = db.query(ReviewDB).filter(
                    ReviewDB.annotation_id == ann.id
                ).all()

                reviewer_info = []
                for review in reviews:
                    reviewer_user = db.query(UserDB).filter(UserDB.id == review.reviewed_by).first()
                    reviewer_name = reviewer_user.name if reviewer_user else f"User_{review.reviewed_by}"
                    reviewer_info.append({
                        "reviewer_id": review.reviewed_by,
                        "reviewer_name": reviewer_name,
                        "status": review.review_status,
                        "score": review.review_score,
                        "notes": review.review_notes,
                        "created_at": review.created_at.isoformat(),
                    })

                ann_data = {
                    "annotation_id": ann.id,
                    "version": ann.version,
                    "type": ann.annotation_type,
                    "data": ann.annotation_data,
                    "confidence": ann.confidence,
                    "is_latest": ann.is_latest,
                    "confirmed_by": ann.confirmed_by,
                    "created_at": ann.created_at.isoformat(),
                    "confirmed_at": ann.confirmed_at.isoformat() if ann.confirmed_at else None,
                    "reviews": reviewer_info,
                }
                creator_entry["annotations"].append(ann_data)
                item_data["annotations_by_creator"][str(creator_id)] = creator_entry

            export_data["items"].append(item_data)

        return export_data

    if format != "normalized_json":
        raise HTTPException(status_code=400, detail=f"Unsupported export format: {format}")

    project = db.query(ProjectDB).filter(ProjectDB.id == task.project_id).first()
    project_description = getattr(project, "description", None) if project else None
    project_name = getattr(project, "name", None) if project else None
    project_id = getattr(project, "id", None) if project else None

    pointer_rows = db.query(DataPointerDB).filter(DataPointerDB.task_id == task_id).all()
    pointer_by_id = {pointer.id: pointer for pointer in pointer_rows}

    task_item_ids = [item.id for item in exportable_task_items]
    if task_item_ids:
        annotations = (
            db.query(AnnotationDB)
            .filter(AnnotationDB.task_item_id.in_(task_item_ids))
            .order_by(AnnotationDB.task_item_id.asc(), AnnotationDB.created_by.asc(), AnnotationDB.is_latest.desc(), AnnotationDB.version.desc(), AnnotationDB.created_at.desc())
            .all()
        )
    else:
        annotations = []
    if created_by is not None:
        annotations = [annotation for annotation in annotations if annotation.created_by == created_by]

    latest_annotations_by_item_and_creator = {}
    for annotation in annotations:
        key = (annotation.task_item_id, annotation.created_by)
        existing = latest_annotations_by_item_and_creator.get(key)
        annotation_is_latest = bool(getattr(annotation, "is_latest", False))
        existing_is_latest = bool(getattr(existing, "is_latest", False)) if existing is not None else False
        annotation_version = getattr(annotation, "version", None) or 0
        existing_version = getattr(existing, "version", None) or 0
        annotation_created_at = getattr(annotation, "created_at", None)
        existing_created_at = getattr(existing, "created_at", None) if existing is not None else None

        if existing is None:
            latest_annotations_by_item_and_creator[key] = annotation
            continue
        if annotation_is_latest and not existing_is_latest:
            latest_annotations_by_item_and_creator[key] = annotation
            continue
        if existing_is_latest and not annotation_is_latest:
            continue
        if annotation_version > existing_version:
            latest_annotations_by_item_and_creator[key] = annotation
            continue
        if annotation_version == existing_version:
            if annotation_created_at is not None and existing_created_at is not None and annotation_created_at > existing_created_at:
                latest_annotations_by_item_and_creator[key] = annotation

    reviews_by_annotation_id = defaultdict(list)
    if latest_annotations_by_item_and_creator:
        review_rows = db.query(ReviewDB).filter(
            ReviewDB.annotation_id.in_([annotation.id for annotation in latest_annotations_by_item_and_creator.values()])
        ).all()
        for review in review_rows:
            reviews_by_annotation_id[review.annotation_id].append(review)

    needed_user_ids = set()
    for annotation in latest_annotations_by_item_and_creator.values():
        if annotation.created_by is not None:
            needed_user_ids.add(annotation.created_by)
        if annotation.confirmed_by is not None:
            needed_user_ids.add(annotation.confirmed_by)
    for review_list in reviews_by_annotation_id.values():
        for review in review_list:
            needed_user_ids.add(review.reviewed_by)
    if current_user.get("user_id") is not None:
        needed_user_ids.add(current_user.get("user_id"))

    latest_escalation_by_item: dict[str, TaskItemEscalationDB] = {}
    if task_item_ids:
        escalation_rows = (
            db.query(TaskItemEscalationDB)
            .filter(
                TaskItemEscalationDB.task_id == task_id,
                TaskItemEscalationDB.task_item_id.in_(task_item_ids),
                TaskItemEscalationDB.status == "resolved",
            )
            .order_by(TaskItemEscalationDB.decided_at.desc())
            .all()
        )
        latest_escalation_by_item = _latest_resolved_escalations_by_item(escalation_rows)
        for esc in latest_escalation_by_item.values():
            if esc.decided_by is not None:
                needed_user_ids.add(esc.decided_by)

    user_rows = db.query(UserDB).filter(UserDB.id.in_(list(needed_user_ids))).all() if needed_user_ids else []
    user_by_id = {user.id: user for user in user_rows}

    items_output = []
    annotation_count = 0
    annotated_item_count = 0
    for item in exportable_task_items:
        item_data_pointer_id = getattr(item, "data_pointer_id", None)
        pointer = pointer_by_id.get(item_data_pointer_id) if item_data_pointer_id is not None else None
        location_ref = pointer.location_ref if pointer else None
        payload_preview = item.payload_preview or {}
        if isinstance(payload_preview, dict):
            payload_url = payload_preview.get("url")
            payload_media_url = payload_preview.get("media_url")
        else:
            payload_url = None
            payload_media_url = None
        content_ref = {
            "kind": task.task_type,
            "location_ref": location_ref,
            "url": payload_url or payload_media_url or location_ref,
        }
        item_annotations = []
        for (annotation_item_id, creator_id), annotation in latest_annotations_by_item_and_creator.items():
            if annotation_item_id != item.id:
                continue
            reviewer_rows = reviews_by_annotation_id.get(annotation.id, [])
            creator_user = user_by_id.get(annotation.created_by) if annotation.created_by is not None else None
            confirmed_user = user_by_id.get(annotation.confirmed_by) if annotation.confirmed_by is not None else None
            review_output = []
            for review in reviewer_rows:
                reviewer_user = user_by_id.get(review.reviewed_by)
                review_output.append({
                    "review_id": review.id,
                    "reviewed_by": _user_ref(reviewer_user, review.reviewed_by),
                    "review_status": review.review_status,
                    "review_score": review.review_score,
                    "review_notes": review.review_notes,
                    "created_at": _safe_iso(review.created_at),
                    "updated_at": _safe_iso(review.updated_at),
                })
            raw_annotation_data = annotation.annotation_data or {}
            try:
                normalized_annotation = _normalize_annotation_payload(task.task_type, annotation.annotation_type, raw_annotation_data)
            except Exception:
                normalized_annotation = {
                    "modality": task.task_type,
                    "kind": "unavailable",
                    "value": raw_annotation_data,
                }
            item_annotations.append({
                "annotation_id": annotation.id,
                "annotation_type": annotation.annotation_type,
                "version": getattr(annotation, "version", None) or 0,
                "is_latest": bool(getattr(annotation, "is_latest", False)),
                "created_by": _user_ref(creator_user, annotation.created_by),
                "confirmed_by": _user_ref(confirmed_user, annotation.confirmed_by),
                "created_at": _safe_iso(getattr(annotation, "created_at", None)),
                "confirmed_at": _safe_iso(getattr(annotation, "confirmed_at", None)),
                "confidence": annotation.confidence,
                "raw_annotation_data": raw_annotation_data,
                "normalized_annotation": normalized_annotation,
                "reviews": review_output,
            })
            annotation_count += 1
        if item_annotations:
            annotated_item_count += 1
        items_output.append({
            "task_item_id": item.id,
            "external_item_ref": item.external_item_ref,
            "location_ref": location_ref,
            "status": item.status,
            "payload_preview": payload_preview,
            "content_ref": content_ref,
            "finalization": _finalization_export_block(
                latest_escalation_by_item.get(item.id),
                user_by_id,
            ),
            "has_annotations": bool(item_annotations),
            "annotations": item_annotations,
        })

    return jsonable_encoder({
        "export_format": "normalized_json",
        "export_generated_at": datetime.now(UTC).isoformat(),
        "task": {
            "task_id": task.id,
            "title": task.title,
            "description": task.description,
            "judgment_question": task.judgment_question,
            "annotation_mode": task.annotation_mode,
            "task_type": task.task_type,
        },
        "project": {
            "project_id": project_id,
            "name": project_name,
            "description": project_description,
        },
        "requested_by": {
            "user_id": current_user.get("user_id"),
            "email": current_user.get("email"),
        },
        "filter": {
            "created_by": created_by,
        },
        "provenance": {
            "required": resolved.export_provenance_required,
            "export_policy_ref": resolved.export_policy_ref,
            "retention_days": resolved.export_retention_days,
        },
        "summary": {
            "item_count": len(exportable_task_items),
            "annotated_item_count": annotated_item_count,
            "unannotated_item_count": len(exportable_task_items) - annotated_item_count,
            "annotation_count": annotation_count,
        },
        "items": items_output,
    })
