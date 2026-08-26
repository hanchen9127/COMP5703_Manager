"""
Prediction API routes
预测相关API端点
"""

from fastapi import APIRouter, Depends, Path, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import verify_user_is_active
from app.schemas.predictions import (
    PredictionCreate,
    PredictionRead,
    PredictionUpdate,
    PredictionListResponse,
)
from app.services.prediction_service import PredictionService


router = APIRouter()


@router.post(
    "/task-items/{task_item_id}/predictions",
    response_model=PredictionRead,
    status_code=201,
)
def create_prediction(
    task_item_id: str = Path(..., description="Task Item ID"),
    payload: PredictionCreate = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PredictionRead:
    """Create prediction for a task item"""
    # Verify user is active
    verify_user_is_active(current_user)
    
    # Create prediction
    service = PredictionService(db=db)
    prediction = service.create_prediction(
        task_item_id=task_item_id,
        payload=payload,
        user_id=current_user.get("user_id")
    )
    
    return PredictionRead(
        id=prediction.id,
        task_item_id=prediction.task_item_id,
        prediction_type=prediction.prediction_type,
        prediction_data=prediction.prediction_data,
        confidence=prediction.confidence,
        model_version=prediction.model_version,
        created_by=prediction.created_by,
        created_at=prediction.created_at,
        updated_at=prediction.updated_at,
    )


@router.get(
    "/task-items/{task_item_id}/predictions",
    response_model=PredictionListResponse,
)
def list_predictions(
    task_item_id: str = Path(..., description="Task Item ID"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PredictionListResponse:
    """List predictions for a task item"""
    # Verify user is active
    verify_user_is_active(current_user)
    
    # Get predictions
    service = PredictionService(db=db)
    predictions = service.list_predictions_by_task_item(task_item_id)
    
    prediction_reads = [
        PredictionRead(
            id=p.id,
            task_item_id=p.task_item_id,
            prediction_type=p.prediction_type,
            prediction_data=p.prediction_data,
            confidence=p.confidence,
            model_version=p.model_version,
            created_by=p.created_by,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        for p in predictions
    ]
    
    return PredictionListResponse(
        task_item_id=task_item_id,
        predictions=prediction_reads,
        total_count=len(predictions),
    )


@router.get(
    "/predictions/{prediction_id}",
    response_model=PredictionRead,
)
def get_prediction(
    prediction_id: str = Path(..., description="Prediction ID"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PredictionRead:
    """Get a single prediction"""
    # Verify user is active
    verify_user_is_active(current_user)
    
    # Get prediction
    service = PredictionService(db=db)
    prediction = service.get_prediction(prediction_id)
    
    return PredictionRead(
        id=prediction.id,
        task_item_id=prediction.task_item_id,
        prediction_type=prediction.prediction_type,
        prediction_data=prediction.prediction_data,
        confidence=prediction.confidence,
        model_version=prediction.model_version,
        created_by=prediction.created_by,
        created_at=prediction.created_at,
        updated_at=prediction.updated_at,
    )


@router.patch(
    "/predictions/{prediction_id}",
    response_model=PredictionRead,
)
def update_prediction(
    prediction_id: str = Path(..., description="Prediction ID"),
    payload: PredictionUpdate = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PredictionRead:
    """Update prediction"""
    # Verify user is active
    verify_user_is_active(current_user)
    
    # Update prediction
    service = PredictionService(db=db)
    prediction = service.update_prediction(prediction_id, payload)
    
    return PredictionRead(
        id=prediction.id,
        task_item_id=prediction.task_item_id,
        prediction_type=prediction.prediction_type,
        prediction_data=prediction.prediction_data,
        confidence=prediction.confidence,
        model_version=prediction.model_version,
        created_by=prediction.created_by,
        created_at=prediction.created_at,
        updated_at=prediction.updated_at,
    )


@router.delete(
    "/predictions/{prediction_id}",
    status_code=204,
)
def delete_prediction(
    prediction_id: str = Path(..., description="Prediction ID"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete prediction"""
    # Verify user is active
    verify_user_is_active(current_user)
    
    # Delete prediction
    service = PredictionService(db=db)
    service.delete_prediction(prediction_id)
