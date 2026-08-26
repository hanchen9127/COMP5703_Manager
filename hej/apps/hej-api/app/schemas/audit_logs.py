"""
Audit Log Schemas - 操作审计日志
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AuditLogRead(BaseModel):
    """审计日志读取响应"""
    id: int
    resource_type: str  # 'project' or 'task'
    resource_id: str  # project_id or task_id (string)
    operation: str  # 'create', 'update', 'delete', 'status_change'
    operator_id: int  # user_id who performed the operation
    old_values: Optional[str] = None  # old values (JSON string)
    new_values: Optional[str] = None  # new values (JSON string)
    description: Optional[str] = None  # operation description
    created_at: datetime
    project_id: Optional[str] = None  # project_id (for filtering)
    task_id: Optional[str] = None  # task_id (for filtering)

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """审计日志列表响应"""
    total_count: int
    logs: list[AuditLogRead]
