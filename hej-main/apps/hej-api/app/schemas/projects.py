from datetime import datetime

from pydantic import BaseModel

from app.models import GovernanceModel
from app.models import ProjectStatus


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    governance_model: GovernanceModel = GovernanceModel.STANDARD


class ProjectRead(BaseModel):
    id: str
    organization_id: str
    name: str
    description: str | None
    governance_model: GovernanceModel
    status: ProjectStatus
    created_at: datetime
