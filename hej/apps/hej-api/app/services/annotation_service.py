"""
Annotation Service
标注功能服务层 (新工作流：Annotation 仅通过 Draft 批准创建，为只读)
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.db_store import DBStore
from app.services.id_service import new_id
from app.models.db_models import AnnotationDB


class AnnotationService:
    """标注服务 - Annotation 是最终确认版本，通过 Draft 工作流创建"""
    
    def __init__(self, db: Session):
        self.db = db
        self.db_store = DBStore(db)
    
    def get_annotation(self, annotation_id: str) -> AnnotationDB:
        """获取单个标注"""
        annotation = self.db_store.annotations.get(annotation_id)
        
        if not annotation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Annotation '{annotation_id}' not found"
            )
        return annotation
    
    def list_annotations_by_task_item(self, task_item_id: str) -> list[AnnotationDB]:
        """获取某个任务项的所有最新标注 (is_latest=true)"""
        # 新工作流：仅返回最新版本
        return self.db_store.annotations.list_by_task_item(task_item_id)
    
    def get_annotation_history(self, annotation_id: str) -> list[AnnotationDB]:
        """获取标注的完整版本历史 (所有版本，包括旧版本)"""
        # 获取某个 annotation_id 的所有版本
        annotations = self.db_store.annotations.list_all_versions(annotation_id)
        
        if not annotations:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Annotation '{annotation_id}' not found"
            )
        
        # 按版本号排序
        annotations.sort(key=lambda x: x.version)
        return annotations
    
    # Note: create_annotation, update_annotation, delete_annotation 已移除
    # 标注现在只能通过 Draft 工作流创建：
    # 1. 创建 Draft (status: pending)
    # 2. 修改 Draft (PATCH)
    # 3. 提交 Draft (status: submitted)
    # 4. 批准 Draft (POST /drafts/{id}/approve) → 创建 Annotation
    # 
    # 详见 draft_service.py 的 approve_draft() 方法
