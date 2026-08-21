from app.models import DataPointer
from app.models import Organization
from app.models import Project
from app.models import Task
from app.models import TaskItem


class InMemoryStore:
    def __init__(self) -> None:
        self.organizations: dict[str, Organization] = {
            "org_arc-intelligence": Organization(
                id="org_arc-intelligence",
                display_name="Arc Intelligence",
            )
        }
        self.projects: dict[str, Project] = {}
        self.tasks: dict[str, Task] = {}
        self.data_pointers: dict[str, DataPointer] = {}
        self.task_items: dict[str, TaskItem] = {}


store = InMemoryStore()
