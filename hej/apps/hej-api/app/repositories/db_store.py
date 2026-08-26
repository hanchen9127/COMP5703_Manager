"""
Database Repository Layer
Data access layer - replaces InMemoryStore.
"""

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from datetime import datetime, UTC
from app.models.db_models import (
    UserDB, OrganizationDB, OrganizationUserDB, RoleAssignmentDB,
    OrganizationPolicyDB, AuditLogDB, ProjectDB, TaskDB, DataPointerDB, TaskItemDB, AnnotationDB,
    DraftDB, PredictionDB
)
from app.models.admin import User, Organization, OrganizationUser, RoleAssignment, OrganizationPolicy, AuditLog
from app.models.domain import Project, Task, DataPointer, TaskItem


def _commit_or_rollback(db: Session) -> None:
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise


class DBStore:
    """
    Database-backed store - replaces InMemoryStore.
    Keeps the same interface while using SQLAlchemy for database access.
    """
    
    def __init__(self, db: Session):
        """Initialize the store."""
        self.db = db
        # Initialize each repository.
        self.users = UserRepository(db)
        self.organizations = OrgRepository(db)
        self.organization_users = OrgUserRepository(db)
        self.role_assignments = RoleAssignmentRepository(db)
        self.organization_policies = PolicyRepository(db)
        self.audit_logs = AuditLogRepository(db)
        # Add project and task repositories.
        self.projects = ProjectRepository(db)
        self.tasks = TaskRepository(db)
        self.data_pointers = DataPointerRepository(db)
        self.task_items = TaskItemRepository(db)
        # Add annotation repositories.
        self.annotations = AnnotationRepository(db)
        # Add draft and prediction repositories.
        self.drafts = DraftRepository(db)
        self.predictions = PredictionRepository(db)


class UserRepository:
    """User repository."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, user: User) -> User:
        """Create a user."""
        db_user = UserDB(
            id=user.id,
            email=user.email,
            password_hash=user.password_hash,
            name=user.name,
            account_status=user.account_status,
            two_factor_enabled=user.two_factor_enabled
        )
        self.db.add(db_user)
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email {user.email} already exists"
            )
        return user
    
    def get(self, user_id: int) -> User | None:
        """Get a user."""
        db_user = self.db.query(UserDB).filter(UserDB.id == user_id).first()
        if not db_user:
            return None
        return self._to_model(db_user)
    
    def __setitem__(self, user_id: int, user: User):
        """Support dict-like assignment: store.users[id] = user."""
        existing = self.get(user_id)
        if existing:
            return self.update(user)
        else:
            return self.create(user)
    
    def __getitem__(self, user_id: int) -> User:
        """Support dict-like access: user = store.users[id]."""
        user = self.get(user_id)
        if not user:
            raise KeyError(f"User {user_id} not found")
        return user
    
    def get_by_email(self, email: str) -> User | None:
        """Get a user by email."""
        db_user = self.db.query(UserDB).filter(UserDB.email == email).first()
        if not db_user:
            return None
        return self._to_model(db_user)
    
    def list_all(self) -> list[User]:
        """List all users."""
        db_users = self.db.query(UserDB).all()
        return [self._to_model(u) for u in db_users]
    
    def values(self) -> list[User]:
        """Return all users (compatibility method)."""
        return self.list_all()
    
    def update(self, user: User) -> User:
        """Update a user."""
        db_user = self.db.query(UserDB).filter(UserDB.id == user.id).first()
        if not db_user:
            raise ValueError(f"User {user.id} not found")
        
        db_user.name = user.name
        db_user.account_status = user.account_status
        db_user.two_factor_enabled = user.two_factor_enabled
        db_user.last_login_at = user.last_login_at
        db_user.updated_at = datetime.now(UTC)
        
        _commit_or_rollback(self.db)
        return self._to_model(db_user)
    
    def delete(self, user_id: int) -> bool:
        """Delete a user."""
        db_user = self.db.query(UserDB).filter(UserDB.id == user_id).first()
        if not db_user:
            return False
        self.db.delete(db_user)
        _commit_or_rollback(self.db)
        return True
    
    def clear(self):
        """Clear all users (test only)."""
        self.db.query(UserDB).delete()
        _commit_or_rollback(self.db)
    
    @staticmethod
    def _to_model(db_user: UserDB) -> User:
        """Convert the database model to the application model."""
        return User(
            id=db_user.id,
            email=db_user.email,
            password_hash=db_user.password_hash,
            name=db_user.name,
            account_status=db_user.account_status,
            two_factor_enabled=db_user.two_factor_enabled,
            last_login_at=db_user.last_login_at,
            created_at=db_user.created_at,
            updated_at=db_user.updated_at
        )


class OrgRepository:
    """Organization repository."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, org: Organization) -> Organization:
        """Create an organization."""
        db_org = OrganizationDB(
            id=org.id,
            name=org.name,
            slug=org.slug,
            status=org.status
        )
        self.db.add(db_org)
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ValueError(f"Slug {org.slug} already exists")
        return org
    
    def get(self, org_id: int) -> Organization | None:
        """Get an organization."""
        db_org = self.db.query(OrganizationDB).filter(OrganizationDB.id == org_id).first()
        if not db_org:
            return None
        return self._to_model(db_org)
    
    def __setitem__(self, org_id: int, org: Organization):
        """Support dict-like assignment: store.organizations[id] = org."""
        existing = self.get(org_id)
        if existing:
            return self.update(org)
        else:
            return self.create(org)
    
    def __getitem__(self, org_id: int) -> Organization:
        """Support dict-like access: org = store.organizations[id]."""
        org = self.get(org_id)
        if not org:
            raise KeyError(f"Organization {org_id} not found")
        return org
    
    def list_all(self) -> list[Organization]:
        """List all organizations."""
        db_orgs = self.db.query(OrganizationDB).all()
        return [self._to_model(o) for o in db_orgs]
    
    def update(self, org: Organization) -> Organization:
        """Update an organization."""
        db_org = self.db.query(OrganizationDB).filter(OrganizationDB.id == org.id).first()
        if not db_org:
            raise ValueError(f"Organization {org.id} not found")
        
        db_org.name = org.name
        db_org.status = org.status
        db_org.updated_at = datetime.now(UTC)
        
        _commit_or_rollback(self.db)
        return self._to_model(db_org)
    
    def delete(self, org_id: int) -> bool:
        """Delete an organization."""
        db_org = self.db.query(OrganizationDB).filter(OrganizationDB.id == org_id).first()
        if not db_org:
            return False
        self.db.delete(db_org)
        _commit_or_rollback(self.db)
        return True
    
    def clear(self):
        """Clear all organizations."""
        self.db.query(OrganizationDB).delete()
        _commit_or_rollback(self.db)
    
    def values(self):
        """Return all values (dict compatibility)."""
        return self.list_all()
    
    @staticmethod
    def _to_model(db_org: OrganizationDB) -> Organization:
        return Organization(
            id=db_org.id,
            name=db_org.name,
            slug=db_org.slug,
            status=db_org.status,
            created_at=db_org.created_at,
            updated_at=db_org.updated_at
        )


class OrgUserRepository:
    """Organization member repository."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, org_user: OrganizationUser) -> OrganizationUser:
        """Create an organization member record."""
        db_ou = OrganizationUserDB(
            id=org_user.id,
            user_id=org_user.user_id,
            organization_id=org_user.organization_id,
            status=org_user.status,
            invited_at=org_user.invited_at,
            invited_by=org_user.invited_by,
            accepted_at=org_user.accepted_at,
            removed_at=org_user.removed_at,
            removed_by=org_user.removed_by
        )
        self.db.add(db_ou)
        _commit_or_rollback(self.db)
        return org_user
    
    def get(self, ou_id: int) -> OrganizationUser | None:
        """Get an organization member record."""
        db_ou = self.db.query(OrganizationUserDB).filter(OrganizationUserDB.id == ou_id).first()
        if not db_ou:
            return None
        return self._to_model(db_ou)
    
    def __setitem__(self, ou_id: int, org_user: OrganizationUser):
        """Support dict-like assignment."""
        existing = self.get(ou_id)
        if existing:
            return self.update(org_user)
        else:
            return self.create(org_user)
    
    def __getitem__(self, ou_id: int) -> OrganizationUser:
        """Support dict-like access."""
        ou = self.get(ou_id)
        if not ou:
            raise KeyError(f"OrganizationUser {ou_id} not found")
        return ou
    
    def list_all(self) -> list[OrganizationUser]:
        """List all member relationships."""
        db_ous = self.db.query(OrganizationUserDB).all()
        return [self._to_model(ou) for ou in db_ous]
    
    def update(self, org_user: OrganizationUser) -> OrganizationUser:
        """Update a member relationship."""
        db_ou = self.db.query(OrganizationUserDB).filter(OrganizationUserDB.id == org_user.id).first()
        if not db_ou:
            raise ValueError(f"OrganizationUser {org_user.id} not found")
        
        db_ou.status = org_user.status
        db_ou.accepted_at = org_user.accepted_at
        db_ou.removed_at = org_user.removed_at
        db_ou.removed_by = org_user.removed_by
        db_ou.updated_at = datetime.now(UTC)
        
        _commit_or_rollback(self.db)
        return self._to_model(db_ou)
    
    def clear(self):
        """Clear all member relationships."""
        self.db.query(OrganizationUserDB).delete()
        _commit_or_rollback(self.db)
    
    def values(self):
        """Return all values."""
        return self.list_all()
    
    @staticmethod
    def _to_model(db_ou: OrganizationUserDB) -> OrganizationUser:
        return OrganizationUser(
            id=db_ou.id,
            user_id=db_ou.user_id,
            organization_id=db_ou.organization_id,
            status=db_ou.status,
            invited_at=db_ou.invited_at,
            invited_by=db_ou.invited_by,
            accepted_at=db_ou.accepted_at,
            removed_at=db_ou.removed_at,
            removed_by=db_ou.removed_by,
            created_at=db_ou.created_at,
            updated_at=db_ou.updated_at
        )


class RoleAssignmentRepository:
    """Role assignment repository."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, role: RoleAssignment) -> RoleAssignment:
        """Create a role assignment."""
        db_role = RoleAssignmentDB(
            id=role.id,
            user_id=role.user_id,
            organization_id=role.organization_id,
            project_id=role.project_id,
            role_key=role.role_key,
            role_name=role.role_name,
            scope=role.scope,
            granted_by=role.granted_by,
            revoked_at=role.revoked_at,
            revoked_by=role.revoked_by,
            change_reason=role.change_reason
        )
        self.db.add(db_role)
        _commit_or_rollback(self.db)
        return role
    
    def get(self, role_id: int) -> RoleAssignment | None:
        """Get a role assignment."""
        db_role = self.db.query(RoleAssignmentDB).filter(RoleAssignmentDB.id == role_id).first()
        if not db_role:
            return None
        return self._to_model(db_role)
    
    def __setitem__(self, role_id: int, role: RoleAssignment):
        """Support dict-like assignment."""
        return self.create(role)
    
    def __getitem__(self, role_id: int) -> RoleAssignment:
        """Support dict-like access."""
        role = self.get(role_id)
        if not role:
            raise KeyError(f"RoleAssignment {role_id} not found")
        return role
    
    def list_all(self) -> list[RoleAssignment]:
        """List all role assignments."""
        db_roles = self.db.query(RoleAssignmentDB).all()
        return [self._to_model(r) for r in db_roles]
    
    def clear(self):
        """Clear all role assignments."""
        self.db.query(RoleAssignmentDB).delete()
        _commit_or_rollback(self.db)
    
    def values(self):
        """Return all values."""
        return self.list_all()
    
    @staticmethod
    def _to_model(db_role: RoleAssignmentDB) -> RoleAssignment:
        return RoleAssignment(
            id=db_role.id,
            user_id=db_role.user_id,
            organization_id=db_role.organization_id,
            project_id=db_role.project_id,
            role_key=db_role.role_key,
            role_name=db_role.role_name,
            scope=db_role.scope,
            granted_at=db_role.granted_at,
            granted_by=db_role.granted_by,
            revoked_at=db_role.revoked_at,
            revoked_by=db_role.revoked_by,
            change_reason=db_role.change_reason,
            created_at=db_role.created_at,
            updated_at=db_role.updated_at
        )


class PolicyRepository:
    """Policy repository."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, policy: OrganizationPolicy) -> OrganizationPolicy:
        """Create a policy."""
        db_policy = OrganizationPolicyDB(
            id=policy.id,
            organization_id=policy.organization_id,
            membership_approval_required=policy.membership_approval_required,
            review_dual_sign_off=policy.review_dual_sign_off,
            review_auto_escalate_disagreement=policy.review_auto_escalate_disagreement,
            dispute_escalation_gate=policy.dispute_escalation_gate,
            dispute_escalation_threshold=policy.dispute_escalation_threshold,
            export_provenance_required=policy.export_provenance_required,
            export_retention_days=policy.export_retention_days,
            annotation_mode=policy.annotation_mode,
            updated_by=policy.updated_by
        )
        self.db.add(db_policy)
        _commit_or_rollback(self.db)
        return policy
    
    def get(self, policy_id: int) -> OrganizationPolicy | None:
        """Get a policy."""
        db_policy = self.db.query(OrganizationPolicyDB).filter(OrganizationPolicyDB.id == policy_id).first()
        if not db_policy:
            return None
        return self._to_model(db_policy)

    def get_by_organization_id(self, organization_id: int) -> OrganizationPolicy | None:
        """Get a policy by organization ID (one policy record per organization)."""
        db_policy = (
            self.db.query(OrganizationPolicyDB)
            .filter(OrganizationPolicyDB.organization_id == organization_id)
            .first()
        )
        if not db_policy:
            return None
        return self._to_model(db_policy)

    def update(self, policy: OrganizationPolicy) -> OrganizationPolicy:
        """Update an existing policy."""
        db_policy = (
            self.db.query(OrganizationPolicyDB)
            .filter(OrganizationPolicyDB.id == policy.id)
            .first()
        )
        if not db_policy:
            raise KeyError(f"Policy {policy.id} not found")

        gate = policy.dispute_escalation_gate
        gate_value = gate.value if hasattr(gate, "value") else str(gate)

        db_policy.membership_approval_required = policy.membership_approval_required
        db_policy.review_dual_sign_off = policy.review_dual_sign_off
        db_policy.review_auto_escalate_disagreement = policy.review_auto_escalate_disagreement
        db_policy.dispute_escalation_gate = gate_value
        db_policy.dispute_escalation_threshold = policy.dispute_escalation_threshold
        db_policy.export_provenance_required = policy.export_provenance_required
        db_policy.export_retention_days = policy.export_retention_days
        db_policy.annotation_mode = policy.annotation_mode
        db_policy.updated_by = policy.updated_by
        db_policy.updated_at = policy.updated_at

        _commit_or_rollback(self.db)
        self.db.refresh(db_policy)
        return self._to_model(db_policy)
    
    def __setitem__(self, policy_id: int, policy: OrganizationPolicy):
        """Support dict-like assignment."""
        return self.create(policy)
    
    def __getitem__(self, policy_id: int) -> OrganizationPolicy:
        """Support dict-like access."""
        policy = self.get(policy_id)
        if not policy:
            raise KeyError(f"Policy {policy_id} not found")
        return policy
    
    def values(self):
        """Return all values."""
        db_policies = self.db.query(OrganizationPolicyDB).all()
        return [self._to_model(p) for p in db_policies]
    
    def list_all(self):
        """List all policies."""
        db_policies = self.db.query(OrganizationPolicyDB).all()
        return [self._to_model(p) for p in db_policies]
    
    def clear(self):
        """Clear all policies."""
        self.db.query(OrganizationPolicyDB).delete()
        _commit_or_rollback(self.db)
    
    @staticmethod
    def _to_model(db_policy: OrganizationPolicyDB) -> OrganizationPolicy:
        return OrganizationPolicy(
            id=db_policy.id,
            organization_id=db_policy.organization_id,
            membership_approval_required=db_policy.membership_approval_required,
            review_dual_sign_off=db_policy.review_dual_sign_off,
            review_auto_escalate_disagreement=db_policy.review_auto_escalate_disagreement,
            dispute_escalation_gate=db_policy.dispute_escalation_gate,
            dispute_escalation_threshold=db_policy.dispute_escalation_threshold,
            export_provenance_required=db_policy.export_provenance_required,
            export_retention_days=db_policy.export_retention_days,
            annotation_mode=db_policy.annotation_mode,
            created_at=db_policy.created_at,
            updated_at=db_policy.updated_at,
            updated_by=db_policy.updated_by
        )


class AuditLogRepository:
    """Audit log repository."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, log: AuditLog) -> AuditLog:
        """Create an audit log entry."""
        db_log = AuditLogDB(
            id=log.id,
            actor_user_id=log.actor_user_id,
            actor_ip_address=log.actor_ip_address,
            actor_user_agent=log.actor_user_agent,
            action=log.action,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            organization_id=log.organization_id,
            changes=log.changes,
            reason=log.reason
        )
        self.db.add(db_log)
        _commit_or_rollback(self.db)
        return log
    
    def __setitem__(self, log_id: int, log: AuditLog):
        """Support dict-like assignment."""
        return self.create(log)
    
    def clear(self):
        """Clear all logs."""
        self.db.query(AuditLogDB).delete()
        _commit_or_rollback(self.db)
    
    def values(self):
        """Return all logs (legacy compatibility)."""
        db_logs = self.db.query(AuditLogDB).all()
        return [self._to_model(log) for log in db_logs]
    
    def list_all(self):
        """List all logs."""
        return self.values()
    
    @staticmethod
    def _to_model(db_log: AuditLogDB) -> AuditLog:
        """Convert the database model to the application model."""
        return AuditLog(
            id=db_log.id,
            actor_user_id=db_log.actor_user_id,
            actor_ip_address=db_log.actor_ip_address,
            actor_user_agent=db_log.actor_user_agent,
            action=db_log.action,
            resource_type=db_log.resource_type,
            resource_id=db_log.resource_id,
            organization_id=db_log.organization_id,
            changes=db_log.changes,
            reason=db_log.reason,
            created_at=db_log.created_at
        )


# ======================== Project & Task repositories ========================


class ProjectRepository:
    """Project repository."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, project: Project) -> Project:
        """Create a project."""
        db_project = ProjectDB(
            id=project.id,
            organization_id=project.organization_id,
            name=project.name,
            description=project.description,
            governance_model=project.governance_model,
            status=project.status
        )
        self.db.add(db_project)
        _commit_or_rollback(self.db)
        self.db.refresh(db_project)
        return self._to_model(db_project)
    
    def get(self, project_id: str) -> Project | None:
        """Get a project."""
        db_project = self.db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
        if not db_project:
            return None
        return self._to_model(db_project)
    
    def update(self, project_id: str, **kwargs) -> Project:
        """Update a project."""
        db_project = self.db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
        if not db_project:
            raise ValueError(f"Project {project_id} not found")
        
        for key, value in kwargs.items():
            if value is not None and hasattr(db_project, key):
                setattr(db_project, key, value)
        
        db_project.updated_at = datetime.now(UTC)
        _commit_or_rollback(self.db)
        self.db.refresh(db_project)
        return self._to_model(db_project)
    
    def delete(self, project_id: str) -> bool:
        """Delete a project."""
        db_project = self.db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
        if not db_project:
            return False
        self.db.delete(db_project)
        _commit_or_rollback(self.db)
        return True
    
    def list_by_organization(self, organization_id: str) -> list[Project]:
        """Get all projects under an organization."""
        db_projects = self.db.query(ProjectDB).filter(
            ProjectDB.organization_id == organization_id
        ).all()
        return [self._to_model(p) for p in db_projects]
    
    def list_all(self) -> list[Project]:
        """List all projects."""
        db_projects = self.db.query(ProjectDB).all()
        return [self._to_model(p) for p in db_projects]
    
    def values(self):
        """Return all projects (compatibility interface)."""
        return self.list_all()
    
    @staticmethod
    def _to_model(db_project: ProjectDB) -> Project:
        """Convert the database model to the application model."""
        return Project(
            id=db_project.id,
            organization_id=db_project.organization_id,
            name=db_project.name,
            description=db_project.description,
            governance_model=db_project.governance_model,
            status=db_project.status,
            created_at=db_project.created_at
        )


class TaskRepository:
    """Task repository."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, task: Task) -> Task:
        """Create a task."""
        db_task = TaskDB(
            id=task.id,
            project_id=task.project_id,
            title=task.title,
            description=task.description,
            judgment_question=task.judgment_question,
            task_type=task.task_type,
            annotation_mode=task.annotation_mode,
            label_schema_ref=task.label_schema_ref,
            text_span_label_options=task.text_span_label_options,
            review_policy_ref=task.review_policy_ref,
            dispute_policy_ref=task.dispute_policy_ref,
            export_policy_ref=task.export_policy_ref,
            status=task.status
        )
        self.db.add(db_task)
        _commit_or_rollback(self.db)
        self.db.refresh(db_task)
        return self._to_model(db_task)
    
    def get(self, task_id: str) -> Task | None:
        """Get a task."""
        db_task = self.db.query(TaskDB).filter(TaskDB.id == task_id).first()
        if not db_task:
            return None
        return self._to_model(db_task)
    
    def update(self, task_id: str, **kwargs) -> Task:
        """Update a task."""
        db_task = self.db.query(TaskDB).filter(TaskDB.id == task_id).first()
        if not db_task:
            raise ValueError(f"Task {task_id} not found")
        
        nullable_policy_fields = {
            "review_policy_ref",
            "dispute_policy_ref",
            "export_policy_ref",
            "description",
            "text_span_label_options",
        }
        for key, value in kwargs.items():
            if not hasattr(db_task, key):
                continue
            if value is not None or key in nullable_policy_fields:
                setattr(db_task, key, value)
        
        db_task.updated_at = datetime.now(UTC)
        _commit_or_rollback(self.db)
        self.db.refresh(db_task)
        return self._to_model(db_task)
    
    def delete(self, task_id: str) -> bool:
        """Delete a task."""
        db_task = self.db.query(TaskDB).filter(TaskDB.id == task_id).first()
        if not db_task:
            return False
        self.db.delete(db_task)
        _commit_or_rollback(self.db)
        return True
    
    def list_by_project(self, project_id: str) -> list[Task]:
        """Get all tasks under a project."""
        db_tasks = self.db.query(TaskDB).filter(
            TaskDB.project_id == project_id
        ).all()
        return [self._to_model(t) for t in db_tasks]
    
    def list_all(self) -> list[Task]:
        """List all tasks."""
        db_tasks = self.db.query(TaskDB).all()
        return [self._to_model(t) for t in db_tasks]
    
    def values(self):
        """Return all tasks (compatibility interface)."""
        return self.list_all()
    
    @staticmethod
    def _to_model(db_task: TaskDB) -> Task:
        """Convert the database model to the application model."""
        return Task(
            id=db_task.id,
            project_id=db_task.project_id,
            title=db_task.title,
            description=db_task.description,
            judgment_question=db_task.judgment_question,
            task_type=db_task.task_type or "text",
            annotation_mode=db_task.annotation_mode,
            label_schema_ref=db_task.label_schema_ref,
            text_span_label_options=db_task.text_span_label_options,
            review_policy_ref=db_task.review_policy_ref,
            dispute_policy_ref=db_task.dispute_policy_ref,
            export_policy_ref=db_task.export_policy_ref,
            status=db_task.status,
            created_at=db_task.created_at
        )


class DataPointerRepository:
    """Data pointer repository."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, pointer: DataPointer) -> DataPointer:
        """Create a data pointer."""
        db_pointer = DataPointerDB(
            id=pointer.id,
            task_id=pointer.task_id,
            location_ref=pointer.location_ref,
            access_policy_ref=pointer.access_policy_ref,
            source_version_ref=pointer.source_version_ref
        )
        self.db.add(db_pointer)
        _commit_or_rollback(self.db)
        self.db.refresh(db_pointer)
        return self._to_model(db_pointer)
    
    def get(self, pointer_id: str) -> DataPointer | None:
        """Get a data pointer."""
        db_pointer = self.db.query(DataPointerDB).filter(DataPointerDB.id == pointer_id).first()
        if not db_pointer:
            return None
        return self._to_model(db_pointer)
    
    def list_by_task(self, task_id: str) -> list[DataPointer]:
        """Get all data pointers under a task."""
        db_pointers = self.db.query(DataPointerDB).filter(
            DataPointerDB.task_id == task_id
        ).all()
        return [self._to_model(p) for p in db_pointers]
    
    def save(self, pointer: DataPointer) -> DataPointer:
        """Save a data pointer (create or update)."""
        existing = self.get(pointer.id)
        if existing:
            # Update.
            db_pointer = self.db.query(DataPointerDB).filter(DataPointerDB.id == pointer.id).first()
            for key, value in pointer.dict(exclude_unset=True).items():
                if hasattr(db_pointer, key):
                    setattr(db_pointer, key, value)
            _commit_or_rollback(self.db)
            self.db.refresh(db_pointer)
            return self._to_model(db_pointer)
        else:
            return self.create(pointer)
    
    @staticmethod
    def _to_model(db_pointer: DataPointerDB) -> DataPointer:
        """Convert the database model to the application model."""
        return DataPointer(
            id=db_pointer.id,
            task_id=db_pointer.task_id,
            location_ref=db_pointer.location_ref,
            access_policy_ref=db_pointer.access_policy_ref,
            source_version_ref=db_pointer.source_version_ref,
            created_at=db_pointer.created_at
        )


class TaskItemRepository:
    """Task item repository."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, item: TaskItem) -> TaskItem:
        """Create a task item."""
        db_item = TaskItemDB(
            id=item.id,
            task_id=item.task_id,
            data_pointer_id=item.data_pointer_id,
            external_item_ref=item.external_item_ref,
            status=item.status,
            payload_preview=item.payload_preview
        )
        self.db.add(db_item)
        _commit_or_rollback(self.db)
        self.db.refresh(db_item)
        return self._to_model(db_item)
    
    def get(self, item_id: str) -> TaskItem | None:
        """Get a task item."""
        db_item = self.db.query(TaskItemDB).filter(TaskItemDB.id == item_id).first()
        if not db_item:
            return None
        return self._to_model(db_item)
    
    def update(self, item_id: str, **kwargs) -> TaskItem:
        """Update a task item."""
        db_item = self.db.query(TaskItemDB).filter(TaskItemDB.id == item_id).first()
        if not db_item:
            raise ValueError(f"TaskItem {item_id} not found")
        
        for key, value in kwargs.items():
            if value is not None and hasattr(db_item, key):
                setattr(db_item, key, value)
        
        db_item.updated_at = datetime.now(UTC)
        _commit_or_rollback(self.db)
        self.db.refresh(db_item)
        return self._to_model(db_item)
    
    def list_by_task(self, task_id: str) -> list[TaskItem]:
        """Get all task items under a task (including location_ref)."""
        from app.models.db_models import DataPointerDB

        rows = (
            self.db.query(TaskItemDB, DataPointerDB.location_ref)
            .outerjoin(DataPointerDB, DataPointerDB.id == TaskItemDB.data_pointer_id)
            .filter(TaskItemDB.task_id == task_id)
            .all()
        )

        result = []
        for db_item, location_ref in rows:
            result.append(self._to_model(db_item, location_ref))

        return result
    
    def save_many(self, items: list[TaskItem]) -> list[TaskItem]:
        """Save multiple task items."""
        from app.models.db_models import DataPointerDB
        db_items = []
        for item in items:
            db_item = TaskItemDB(
                id=item.id,
                task_id=item.task_id,
                data_pointer_id=item.data_pointer_id,
                external_item_ref=item.external_item_ref,
                status=item.status,
                payload_preview=item.payload_preview
            )
            db_items.append(db_item)
        
        self.db.add_all(db_items)
        _commit_or_rollback(self.db)
        for db_item in db_items:
            self.db.refresh(db_item)
        
        rows = (
            self.db.query(TaskItemDB, DataPointerDB.location_ref)
            .outerjoin(DataPointerDB, DataPointerDB.id == TaskItemDB.data_pointer_id)
            .filter(TaskItemDB.id.in_([db_item.id for db_item in db_items]))
            .all()
        )

        location_ref_by_item_id = {db_item.id: location_ref for db_item, location_ref in rows}
        result = []
        for db_item in db_items:
            result.append(self._to_model(db_item, location_ref_by_item_id.get(db_item.id)))
        
        return result
    
    @staticmethod
    def _to_model(db_item: TaskItemDB, location_ref: str | None = None) -> TaskItem:
        """Convert the database model to the application model."""
        # Ensure payload_preview includes a url field.
        payload = db_item.payload_preview or {}
        if isinstance(payload, dict) and not payload.get("url") and location_ref:
            # If url is missing, backfill it from location_ref.
            payload = {**payload, "url": location_ref}
        
        from app.models import TaskItemStatus

        raw_status = db_item.status or TaskItemStatus.PENDING
        try:
            status = TaskItemStatus(raw_status)
        except ValueError:
            status = raw_status

        return TaskItem(
            id=db_item.id,
            task_id=db_item.task_id,
            data_pointer_id=db_item.data_pointer_id,
            external_item_ref=db_item.external_item_ref,
            status=status,
            payload_preview=payload,
            created_at=db_item.created_at,
            location_ref=location_ref  # Derived from DataPointer.
        )


class AnnotationRepository:
    """Annotation repository."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, annotation_id: str, task_item_id: str, annotation_type: str, 
               annotation_data: dict, confidence: int | None = None, 
               version: int = 1, is_latest: bool = True,
               created_by: int | None = None, confirmed_by: int | None = None, 
               confirmed_at: datetime | None = None, base_annotation_id: str | None = None) -> AnnotationDB:
        """Create an annotation."""
        from datetime import datetime, UTC
        
        db_annotation = AnnotationDB(
            id=annotation_id,
            base_annotation_id=base_annotation_id or annotation_id,  # First version points to itself
            task_item_id=task_item_id,
            annotation_type=annotation_type,
            annotation_data=annotation_data,
            confidence=confidence,
            version=version,
            is_latest=is_latest,
            created_by=created_by,
            confirmed_by=confirmed_by,
            confirmed_at=confirmed_at or datetime.now(UTC)
        )
        self.db.add(db_annotation)
        _commit_or_rollback(self.db)
        self.db.refresh(db_annotation)
        return db_annotation
    
    def get(self, annotation_id: str) -> AnnotationDB | None:
        """Get a single annotation."""
        return self.db.query(AnnotationDB).filter(AnnotationDB.id == annotation_id).first()
    
    def update(self, annotation_id: str, **kwargs) -> AnnotationDB:
        """Update an annotation."""
        db_annotation = self.get(annotation_id)
        if not db_annotation:
            raise ValueError(f"Annotation {annotation_id} not found")
        
        for key, value in kwargs.items():
            if value is not None and hasattr(db_annotation, key):
                setattr(db_annotation, key, value)
        
        db_annotation.updated_at = datetime.now(UTC)
        _commit_or_rollback(self.db)
        self.db.refresh(db_annotation)
        return db_annotation
    
    def delete(self, annotation_id: str) -> bool:
        """Delete an annotation."""
        db_annotation = self.get(annotation_id)
        if not db_annotation:
            return False
        self.db.delete(db_annotation)
        _commit_or_rollback(self.db)
        return True
    
    def list_by_task_item(self, task_item_id: str) -> list[AnnotationDB]:
        """Get all annotations for a task item."""
        return self.db.query(AnnotationDB).filter(
            AnnotationDB.task_item_id == task_item_id
        ).order_by(AnnotationDB.created_at.desc()).all()
    
    def find_by_item_and_creator(self, task_item_id: str, created_by: int) -> AnnotationDB | None:
        """Find a user's annotation for a project item.

        Ensure each user has only one annotation for the same item.
        """
        return self.db.query(AnnotationDB).filter(
            AnnotationDB.task_item_id == task_item_id,
            AnnotationDB.created_by == created_by
        ).first()
    
    def list_all_versions(self, annotation_id: str) -> list[AnnotationDB]:
        """Get all versions for an annotation_id."""
        return self.db.query(AnnotationDB).filter(
            AnnotationDB.id == annotation_id
        ).order_by(AnnotationDB.version.asc()).all()
    
    def list_all(self) -> list[AnnotationDB]:
        """List all annotations."""
        return self.db.query(AnnotationDB).all()
    
    def values(self):
        """Return all annotations (compatibility interface)."""
        return self.list_all()


class DraftRepository:
    """Draft repository."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, draft_id: str, task_item_id: str, annotation_type: str, status: str, 
               draft_data: dict, revision_notes: str | None = None, created_by: int | None = None) -> DraftDB:
        """Create a draft."""
        db_draft = DraftDB(
            id=draft_id,
            task_item_id=task_item_id,
            annotation_type=annotation_type,
            status=status,
            draft_data=draft_data,
            revision_notes=revision_notes,
            created_by=created_by
        )
        self.db.add(db_draft)
        _commit_or_rollback(self.db)
        self.db.refresh(db_draft)
        return db_draft
    
    def get(self, draft_id: str) -> DraftDB | None:
        """Get a single draft."""
        return self.db.query(DraftDB).filter(DraftDB.id == draft_id).first()
    
    def update(self, draft_id: str, **kwargs) -> DraftDB:
        """Update a draft."""
        db_draft = self.get(draft_id)
        if not db_draft:
            raise ValueError(f"Draft {draft_id} not found")
        
        for key, value in kwargs.items():
            if value is not None and hasattr(db_draft, key):
                setattr(db_draft, key, value)
        
        db_draft.updated_at = datetime.now(UTC)
        _commit_or_rollback(self.db)
        self.db.refresh(db_draft)
        return db_draft
    
    def delete(self, draft_id: str) -> bool:
        """Delete a draft."""
        db_draft = self.get(draft_id)
        if not db_draft:
            return False
        self.db.delete(db_draft)
        _commit_or_rollback(self.db)
        return True
    
    def list_by_task_item(self, task_item_id: str) -> list[DraftDB]:
        """Get all drafts for a task item."""
        return self.db.query(DraftDB).filter(
            DraftDB.task_item_id == task_item_id
        ).order_by(DraftDB.created_at.desc()).all()
    
    def list_all(self) -> list[DraftDB]:
        """List all drafts."""
        return self.db.query(DraftDB).all()
    
    def values(self):
        """Return all drafts (compatibility interface)."""
        return self.list_all()


class PredictionRepository:
    """Prediction repository."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, prediction_id: str, task_item_id: str, prediction_type: str, 
               prediction_data: dict, confidence: int | None = None,
               model_version: str | None = None, created_by: int | None = None) -> PredictionDB:
        """Create a prediction."""
        db_prediction = PredictionDB(
            id=prediction_id,
            task_item_id=task_item_id,
            prediction_type=prediction_type,
            prediction_data=prediction_data,
            confidence=confidence,
            model_version=model_version,
            created_by=created_by
        )
        self.db.add(db_prediction)
        _commit_or_rollback(self.db)
        self.db.refresh(db_prediction)
        return db_prediction
    
    def get(self, prediction_id: str) -> PredictionDB | None:
        """Get a single prediction."""
        return self.db.query(PredictionDB).filter(PredictionDB.id == prediction_id).first()
    
    def update(self, prediction_id: str, **kwargs) -> PredictionDB:
        """Update a prediction."""
        db_prediction = self.get(prediction_id)
        if not db_prediction:
            raise ValueError(f"Prediction {prediction_id} not found")
        
        for key, value in kwargs.items():
            if value is not None and hasattr(db_prediction, key):
                setattr(db_prediction, key, value)
        
        db_prediction.updated_at = datetime.now(UTC)
        _commit_or_rollback(self.db)
        self.db.refresh(db_prediction)
        return db_prediction
    
    def delete(self, prediction_id: str) -> bool:
        """Delete a prediction."""
        db_prediction = self.get(prediction_id)
        if not db_prediction:
            return False
        self.db.delete(db_prediction)
        _commit_or_rollback(self.db)
        return True
    
    def list_by_task_item(self, task_item_id: str) -> list[PredictionDB]:
        """Get all predictions for a task item."""
        return self.db.query(PredictionDB).filter(
            PredictionDB.task_item_id == task_item_id
        ).order_by(PredictionDB.created_at.desc()).all()
    
    def list_all(self) -> list[PredictionDB]:
        """List all predictions."""
        return self.db.query(PredictionDB).all()
    
    def values(self):
        """Return all predictions (compatibility interface)."""
        return self.list_all()
