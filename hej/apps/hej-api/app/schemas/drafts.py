"""
Draft schemas for API validation and serialization
草稿数据 schema 定义 (中间状态，未确认)
"""

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class DraftCreate(BaseModel):
    """Create draft request - 创建初稿或修改草稿"""
    annotation_type: str = Field(..., description="标注类型: bbox, text, classification, etc")
    draft_data: dict = Field(..., description="草稿的实际内容")
    revision_notes: Optional[str] = Field(None, description="修改说明 (修改时添加)")


class DraftUpdate(BaseModel):
    """Update draft request - 更新草稿 (仅在 pending 状态)"""
    annotation_type: Optional[str] = None
    draft_data: Optional[dict] = None
    revision_notes: Optional[str] = None


class DraftSubmit(BaseModel):
    """Submit draft request - 提交草稿等待确认"""
    revision_notes: Optional[str] = Field(None, description="最终修改说明")


class DraftApprove(BaseModel):
    """Approve draft request - 批准草稿转换为 Annotation"""
    confidence: Optional[int] = Field(None, ge=0, le=100, description="置信度 0-100")


class DraftRead(BaseModel):
    """Draft response"""
    id: str
    task_item_id: str
    annotation_id: Optional[str] = None  # 基于的标注版本
    status: str  # pending (工作中), submitted (等待确认)
    annotation_type: str
    draft_data: dict
    revision_notes: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    submitted_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DraftListResponse(BaseModel):
    """List drafts response"""
    task_item_id: str
    drafts: list[DraftRead]
    total_count: int


class DraftToAnnotationResponse(BaseModel):
    """Response when approving draft to annotation"""
    annotation_id: str
    version: int
    status: str = "confirmed"
    message: str
