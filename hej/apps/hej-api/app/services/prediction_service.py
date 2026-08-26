"""
Prediction Service
预测功能服务层
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.db_store import DBStore
from app.schemas.predictions import PredictionCreate, PredictionUpdate
from app.services.id_service import new_id
from app.models.db_models import PredictionDB


class PredictionService:
    """预测服务"""
    
    def __init__(self, db: Session):
        self.db = db
        self.db_store = DBStore(db)
    
    def create_prediction(
        self, 
        task_item_id: str, 
        payload: PredictionCreate, 
        user_id: int | None = None
    ) -> PredictionDB:
        """创建预测"""
        prediction = self.db_store.predictions.create(
            prediction_id=new_id("prediction"),
            task_item_id=task_item_id,
            prediction_type=payload.prediction_type,
            prediction_data=payload.prediction_data,
            confidence=payload.confidence,
            model_version=payload.model_version,
            created_by=user_id,
        )
        return prediction
    
    def get_prediction(self, prediction_id: str) -> PredictionDB:
        """获取单个预测"""
        prediction = self.db_store.predictions.get(prediction_id)
        
        if not prediction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Prediction '{prediction_id}' not found"
            )
        return prediction
    
    def list_predictions_by_task_item(self, task_item_id: str) -> list[PredictionDB]:
        """获取某个任务项的所有预测"""
        return self.db_store.predictions.list_by_task_item(task_item_id)
    
    def update_prediction(
        self, 
        prediction_id: str, 
        payload: PredictionUpdate
    ) -> PredictionDB:
        """更新预测"""
        self.get_prediction(prediction_id)  # Verify exists
        
        update_data = payload.model_dump(exclude_unset=True)
        prediction = self.db_store.predictions.update(prediction_id, **update_data)
        return prediction
    
    def delete_prediction(self, prediction_id: str) -> bool:
        """删除预测"""
        self.get_prediction(prediction_id)  # Verify exists
        return self.db_store.predictions.delete(prediction_id)
