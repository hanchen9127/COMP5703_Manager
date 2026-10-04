"""Prototype fixes for the perf investigation, applied at runtime (local only).

Imported by sandbox-perf-server.py with --experiment a,b,c. Nothing here is
product code: each prototype exists to measure what a fix would gain, and is
checked for identical output by sandbox-perf-equivalence.py before its numbers
are trusted.

batch-drafts  GET /api/v1/tasks/{task_id}/drafts-batch: every item's drafts in
              one request - one auth and scope check, one drafts query with
              authors eager-loaded, one own-annotation query. Same visibility
              rule as list_drafts (H1).
no-repair     GET task-items / setup return the stored statuses without the
              send-back repair passes (H2) - the read side of "repair on the
              write paths instead".
sync-auth     get_current_user served as a plain def, so it runs in the thread
              pool rather than on the event loop (H4).
"""


from collections import defaultdict
from typing import Annotated


def apply(app, names: set[str]) -> None:
    if "batch-drafts" in names:
        _batch_drafts(app)
    if "no-repair" in names:
        _no_repair()
    if "sync-auth" in names:
        _sync_auth(app)


def _batch_drafts(app) -> None:
    from fastapi import APIRouter, Depends, HTTPException
    from sqlalchemy.orm import Session, selectinload

    from app.api.routes.drafts import _to_draft_read
    from app.core.database import get_db
    from app.core.permissions import GovernedAction, user_has_governed_action, verify_user_is_active, verify_user_project_access
    from app.core.security import get_current_user
    from app.models.db_models import AnnotationDB, DraftDB, ProjectDB, TaskDB, TaskItemDB
    from app.services.annotation_service import is_peer_work

    router = APIRouter()

    @router.get("/api/v1/tasks/{task_id}/drafts-batch")
    def drafts_batch(task_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
        verify_user_is_active(current_user)
        task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
        if task is None:
            raise HTTPException(404, f"Task {task_id} not found")
        project = db.query(ProjectDB).filter(ProjectDB.id == task.project_id).first()
        verify_user_project_access(current_user, project, db)

        item_ids = [r[0] for r in db.query(TaskItemDB.id).filter(TaskItemDB.task_id == task_id).all()]
        drafts = (
            db.query(DraftDB)
            .options(selectinload(DraftDB.created_by_user))
            .filter(DraftDB.task_item_id.in_(db.query(TaskItemDB.id).filter(TaskItemDB.task_id == task_id)))
            .order_by(DraftDB.created_at.desc())
            .all()
        )

        hide_unless_answered = False
        if not user_has_governed_action(current_user, project.organization_id, GovernedAction.REVIEW, db):
            hide_unless_answered = user_has_governed_action(
                current_user, project.organization_id, GovernedAction.ANNOTATE, db
            )
        answered: set[str] = set()
        if hide_unless_answered and current_user.get("user_id") is not None:
            answered = {
                r[0]
                for r in db.query(AnnotationDB.task_item_id).filter(
                    AnnotationDB.task_item_id.in_(db.query(TaskItemDB.id).filter(TaskItemDB.task_id == task_id)),
                    AnnotationDB.created_by == int(current_user["user_id"]),
                    AnnotationDB.is_latest.is_(True),
                )
            }

        by_item = defaultdict(list)
        for d in drafts:
            hidden = (
                hide_unless_answered
                and d.task_item_id not in answered
                and is_peer_work(d, current_user)
            )
            if not hidden:
                by_item[d.task_item_id].append(_to_draft_read(d))
        return {i: [r.model_dump(mode="json") for r in by_item.get(i, [])] for i in item_ids}

    app.include_router(router)


def _no_repair() -> None:
    import app.services.task_service as ts

    def stored_statuses(db, task_id, items):
        return items

    ts.list_task_items_with_send_back_resolution = stored_statuses


def _sync_auth(app) -> None:
    from fastapi import Depends, Header
    from sqlalchemy.orm import Session

    from app.core.database import get_db
    from app.core.security import get_current_user

    def get_current_user_sync(
        authorization: Annotated[str | None, Header()] = None,
        db: Session = Depends(get_db),
    ) -> dict:
        # The original never awaits, so driving the coroutine once runs it to
        # completion with identical behaviour - now on a worker thread.
        coro = get_current_user(authorization, db)
        try:
            coro.send(None)
        except StopIteration as done:
            return done.value
        raise RuntimeError("get_current_user awaited unexpectedly")

    app.dependency_overrides[get_current_user] = get_current_user_sync
