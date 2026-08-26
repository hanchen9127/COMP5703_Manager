"""
Annotation schemas for API validation and serialization
标注数据 schema 定义 (已确认的最终版本)
"""

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class AnnotationRead(BaseModel):
    """Annotation response - 已确认的标注"""
    id: str
    task_item_id: str
    annotation_type: str
    annotation_data: dict
    confidence: Optional[int] = None
    version: int = 1  # 版本号
    is_latest: bool = True  # 是否为最新版本
    created_by: Optional[int] = None  # 原始标注者
    confirmed_by: Optional[int] = None  # 确认者
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AnnotationListResponse(BaseModel):
    """List annotations response"""
    task_item_id: str
    annotations: list[AnnotationRead]
    total_count: int


class ReviewRead(BaseModel):
    """Review response - 标注审核反馈"""
    id: str
    annotation_id: str
    task_item_id: str
    reviewed_by: Optional[int] = None  # 审核人 user_id
    review_status: str  # approved, rejected, needs_revision
    review_score: Optional[int] = None  # 审核评分 0-100
    review_notes: Optional[str] = None  # 审核意见
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    """Create review request"""
    review_status: str  # approved, rejected, needs_revision
    review_score: Optional[int] = Field(None, ge=0, le=100)
    review_notes: Optional[str] = None


class ReviewUpdate(BaseModel):
    """Update review request"""
    review_status: Optional[str] = None
    review_score: Optional[int] = Field(None, ge=0, le=100)
    review_notes: Optional[str] = None


class AnnotationDetailRead(AnnotationRead):
    """Annotation with reviews - 包含审核记录的标注详情"""
    reviews: list[ReviewRead] = []
