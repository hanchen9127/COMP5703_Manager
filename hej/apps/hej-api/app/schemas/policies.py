"""Schemas for policy bundles and resolved project/task policy views."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

from app.schemas.organizations import PolicyRead
from app.schemas.projects import ProjectRead
from app.schemas.tasks import TaskRead


class PolicyBundleRead(BaseModel):
    id: str
    kind: Literal["label_schema", "review", "dispute", "export"]
    title: str
    description: str
    rules: dict[str, Any] = Field(default_factory=dict)


class ResolvedPolicyRead(BaseModel):
    label_schema_ref: str
    review_policy_ref: str
    review_mode: Literal["dual_signoff", "single_pass"]
    review_required_approvals: int
    review_dual_sign_off: bool
    dispute_policy_ref: str | None = None
    dispute_escalation_gate: str
    dispute_escalation_threshold: int
    dispute_inherited_from_org: bool
    export_policy_ref: str | None = None
    export_provenance_required: bool
    export_retention_days: int
    export_inherited_from_org: bool
    annotation_mode: str
    rules_summary: list[str] = Field(default_factory=list)


class TaskPolicyEntryRead(BaseModel):
    task: TaskRead
    resolved_policy: ResolvedPolicyRead


class ProjectPoliciesRead(BaseModel):
    project: ProjectRead
    organization_id: str
    organization_policy: PolicyRead | None = None
    tasks: list[TaskPolicyEntryRead] = Field(default_factory=list)
    catalog: list[PolicyBundleRead] = Field(default_factory=list)
