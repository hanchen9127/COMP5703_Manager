"""
Audit Log Service - 记录项目和任务的操作日志
"""

import json
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.db_models import AuditLogDB


class AuditLogService:
    """审计日志服务"""

    @staticmethod
    def log_operation(
        db: Session,
        resource_type: str,
        resource_id: str,
        operation: str,
        operator_id: int | None = None,
        old_values: dict | None = None,
        new_values: dict | None = None,
        description: str | None = None,
        project_id: str | None = None,
        task_id: str | None = None,
    ) -> AuditLogDB:
        """
        记录操作日志

        Args:
            db: 数据库会话
            resource_type: 资源类型 ('project' 或 'task')
            resource_id: 资源ID
            operation: 操作类型 ('create', 'update', 'delete', 'status_change')
            operator_id: 执行操作的用户ID
            old_values: 旧值（字典格式）
            new_values: 新值（字典格式）
            description: 操作描述
            project_id: 项目ID（用于快速查询）
            task_id: 任务ID（用于快速查询）

        Returns:
            AuditLogDB: 创建的审计日志记录
        """
        # 转换字典为JSON字符串
        old_values_str = json.dumps(old_values) if old_values else None
        new_values_str = json.dumps(new_values) if new_values else None

        audit_log = AuditLogDB(
            resource_type=resource_type,
            resource_id=resource_id,
            operation=operation,
            operator_id=operator_id,
            old_values=old_values_str,
            new_values=new_values_str,
            description=description,
            project_id=project_id,
            task_id=task_id,
        )

        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        return audit_log

    @staticmethod
    def get_logs_by_resource(
        db: Session,
        resource_type: str,
        resource_id: str,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[AuditLogDB], int]:
        """
        获取某个资源的操作日志

        Args:
            db: 数据库会话
            resource_type: 资源类型
            resource_id: 资源ID
            limit: 返回数量限制
            offset: 分页偏移

        Returns:
            tuple: (日志列表, 总数)
        """
        query = db.query(AuditLogDB).filter(
            AuditLogDB.resource_type == resource_type,
            AuditLogDB.resource_id == resource_id,
        )

        total = query.count()
        logs = query.order_by(AuditLogDB.created_at.desc()).offset(offset).limit(limit).all()

        return logs, total

    @staticmethod
    def get_logs_by_project(
        db: Session,
        project_id: str,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[AuditLogDB], int]:
        """获取项目的所有操作日志"""
        query = db.query(AuditLogDB).filter(AuditLogDB.project_id == project_id)
        total = query.count()
        logs = query.order_by(AuditLogDB.created_at.desc()).offset(offset).limit(limit).all()
        return logs, total

    @staticmethod
    def get_logs_by_task(
        db: Session,
        task_id: str,
        limit: int = 100,
        offset: int = 0,
        operations: list[str] | None = None,
    ) -> tuple[list[AuditLogDB], int]:
        """获取任务的所有操作日志"""
        query = db.query(AuditLogDB).filter(AuditLogDB.task_id == task_id)
        if operations:
            query = query.filter(AuditLogDB.operation.in_(operations))
        total = query.count()
        logs = (
            query.order_by(AuditLogDB.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return logs, total

    @staticmethod
    def get_logs_by_operator(
        db: Session,
        operator_id: int,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[AuditLogDB], int]:
        """获取某个用户执行的所有操作日志"""
        query = db.query(AuditLogDB).filter(AuditLogDB.operator_id == operator_id)
        total = query.count()
        logs = query.order_by(AuditLogDB.created_at.desc()).offset(offset).limit(limit).all()
        return logs, total
