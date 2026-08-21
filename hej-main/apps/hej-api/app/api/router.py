from fastapi import APIRouter

from app.api.routes import health
from app.api.routes import organizations
from app.api.routes import projects
from app.api.routes import tasks


api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
