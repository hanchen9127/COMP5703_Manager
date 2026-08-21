from datetime import datetime

from pydantic import BaseModel

from app.models import OrganizationStatus


class OrganizationCreate(BaseModel):
    display_name: str


class OrganizationRead(BaseModel):
    id: str
    display_name: str
    status: OrganizationStatus
    created_at: datetime
