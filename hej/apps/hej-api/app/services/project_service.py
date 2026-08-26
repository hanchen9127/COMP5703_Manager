from fastapi import HTTPException
from fastapi import status
from sqlalchemy.orm import Session

from app.models import Project
from app.repositories import ProjectRepository
from app.repositories.db_store import DBStore, ProjectRepository as DBProjectRepository
from app.schemas.projects import ProjectCreate
from app.services.id_service import new_id
from app.services.organization_service import OrganizationService


class ProjectService:
    def __init__(
        self,
        db: Session = None,
        repository: ProjectRepository | None = None,
        organization_service: OrganizationService | None = None,
    ) -> None:
        self.db = db
        self.repository = repository
        if db:
            # 使用数据库仓储
            self.db_store = DBStore(db)
            self.db_repository = self.db_store.projects
        else:
            self.db_repository = None
        self.organization_service = organization_service or OrganizationService()

    def list_projects(self, organization_id: str) -> list[Project]:
        # 验证组织存在（使用数据库或内存存储）
        if self.db_repository:
            # 从数据库查找组织 - 处理字符串/整数 ID
            try:
                org_id_int = int(organization_id )
            except (ValueError, TypeError):
                org_id_int = organization_id
            
            org = self.db_store.organizations.get(org_id_int)
            if not org:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Organization '{organization_id}' not found"
                )
            # 从数据库读取项目
            return self.db_repository.list_by_organization(str(organization_id))
        else:
            # 兼容遗留的内存存储
            self.organization_service.get_organization(organization_id)
            return self.repository.list_by_organization(organization_id)

    def list_projects_for_user(self, current_user: dict) -> list[Project]:
        """Get all projects accessible to current user (through organization membership)"""
        if self.db_repository:
            # Get user's organizations from the database
            user_id = current_user.get("user_id")
            print(f"[DEBUG] list_projects_for_user called - user_id: {user_id}, current_user: {current_user}")
            
            if not user_id:
                return []
            
            # Query organization_users table to find all organizations the user belongs to
            from app.models.db_models import OrganizationUserDB
            org_users = self.db.query(OrganizationUserDB).filter(
                OrganizationUserDB.user_id == user_id,
                OrganizationUserDB.status.in_(["active", "invited"])  # Only active or invited members
            ).all()
            
            print(f"[DEBUG] Found {len(org_users)} organizations for user {user_id}")
            
            # Collect all projects from these organizations
            all_projects = []
            for org_user in org_users:
                org_id = org_user.organization_id
                print(f"[DEBUG] Querying projects for org {org_id}")
                projects = self.db_repository.list_by_organization(str(org_id))
                print(f"[DEBUG] Found {len(projects)} projects in org {org_id}")
                all_projects.extend(projects)
            
            print(f"[DEBUG] Total projects for user: {len(all_projects)}")
            return all_projects
        else:
            # For memory storage, return empty list
            print(f"[DEBUG] No db_repository available")
            return []

    def get_project(self, project_id: str) -> Project:
        if self.db_repository:
            project = self.db_repository.get(project_id)
        else:
            project = self.repository.get(project_id)
        
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project '{project_id}' not found",
            )
        return project

    def create_project(
        self, organization_id: str, payload: ProjectCreate
    ) -> Project:
        # Verify organization exists
        if self.db_repository:
            # Check in database
            try:
                org_id_int = int(organization_id)
            except (ValueError, TypeError):
                org_id_int = organization_id
            
            org = self.db_store.organizations.get(org_id_int)
            if not org:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Organization '{organization_id}' not found"
                )
        else:
            # Check in memory
            self.organization_service.get_organization(organization_id)
        
        project = Project(
            id=new_id("proj"),
            organization_id=str(organization_id),
            name=payload.name,
            description=payload.description,
            governance_model=payload.governance_model,
        )
        
        if self.db_repository:
            return self.db_repository.create(project)
        else:
            return self.repository.save(project)
    
    def update_project(self, project_id: str, **kwargs) -> Project:
        """更新项目"""
        if self.db_repository:
            return self.db_repository.update(project_id, **kwargs)
        else:
            # 内存存储不支持更新，直接修改再保存
            project = self.repository.get(project_id)
            if not project:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Project '{project_id}' not found"
                )
            for key, value in kwargs.items():
                if value is not None and hasattr(project, key):
                    setattr(project, key, value)
            return self.repository.save(project)
    
    def delete_project(self, project_id: str) -> bool:
        """删除项目"""
        if self.db_repository:
            return self.db_repository.delete(project_id)
        else:
            # 内存存储不支持，返回 False
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Project deletion not supported in memory mode"
            )
