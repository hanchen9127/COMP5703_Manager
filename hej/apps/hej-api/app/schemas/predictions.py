"""
Prediction schemas for API validation and serialization
预测结果数据 schema 定义
"""

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class PredictionCreate(BaseModel):
    """Create prediction request"""
    prediction_type: str
    prediction_data: dict = Field(..., description="预测的实际内容")
    confidence: Optional[int] = Field(None, ge=0, le=100, description="置信度 0-100")
    model_version: Optional[str] = None


class PredictionUpdate(BaseModel):
    """Update prediction request"""
    prediction_type: Optional[str] = None
    prediction_data: Optional[dict] = None
    confidence: Optional[int] = Field(None, ge=0, le=100)
    model_version: Optional[str] = None


class PredictionRead(BaseModel):
    """Prediction response"""
    id: str
    task_item_id: str
    prediction_type: str
    prediction_data: dict
    confidence: Optional[int] = None
    model_version: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PredictionListResponse(BaseModel):
    """List predictions response"""
    task_item_id: str
    predictions: list[PredictionRead]
    total_count: int
