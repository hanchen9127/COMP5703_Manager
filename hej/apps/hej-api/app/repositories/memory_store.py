from app.models import DataPointer
from app.models import Organization
from app.models import Project
from app.models import Task
from app.models import TaskItem


class InMemoryStore:
    def __init__(self) -> None:
        # ============ 工作流模型 ============
        self.organizations: dict[int, Organization] = {
            1: Organization(
                id=1,
                name="Arc Intelligence",
                slug="arc-intelligence",
            )
        }
        self.projects: dict[str, Project] = {}
        self.tasks: dict[str, Task] = {}
        self.data_pointers: dict[str, DataPointer] = {}
        self.task_items: dict[str, TaskItem] = {}
        
        # ============ Admin 系统模型 ============
        # 用户相关
        self.users: dict[int, any] = {}
        self.organization_users: dict[int, any] = {}
        self.role_assignments: dict[int, any] = {}
        
        # 组织和权限
        self.admin_organizations: dict[int, any] = {}
        self.organization_policies: dict[int, any] = {}
        
        # 审计
        self.audit_logs: dict[int, any] = {}


store = InMemoryStore()
