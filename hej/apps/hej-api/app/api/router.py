from fastapi import APIRouter

from app.api.routes import admin_iam
from app.api.routes import auth
from app.api.routes import health
from app.api.routes import invitations
from app.api.routes import members
from app.api.routes import organizations
from app.api.routes import policy_bundles
from app.api.routes import projects
from app.api.routes import tasks
from app.api.routes import review_actions
from app.api.routes import annotations
from app.api.routes import drafts
from app.api.routes import predictions
from app.api.routes import uploads
from app.api.routes import init


api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admin_iam.router, prefix="/admin", tags=["admin-iam"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(members.router, prefix="/organizations", tags=["members"])
api_router.include_router(invitations.router, prefix="/invitations", tags=["invitations"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(
    policy_bundles.router, prefix="/policy-bundles", tags=["policy-bundles"]
)
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(tasks.project_tasks_router, tags=["tasks"])
api_router.include_router(review_actions.router, prefix="/tasks", tags=["task-reviews"])
api_router.include_router(uploads.router, prefix="/tasks", tags=["file-uploads"])
api_router.include_router(uploads.download_router, prefix="/uploads", tags=["file-downloads"])
api_router.include_router(uploads.fixtures_router, prefix="/fixtures", tags=["fixture-downloads"])
api_router.include_router(annotations.router, tags=["annotations"])
api_router.include_router(drafts.router, tags=["drafts"])
api_router.include_router(predictions.router, tags=["predictions"])
api_router.include_router(init.router, tags=["initialization"])
