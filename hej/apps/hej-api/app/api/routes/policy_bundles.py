"""Policy bundle catalog for UI datalists and validation hints."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, Query

from app.core.policy_bundles import PolicyBundleKind, list_bundles
from app.core.security import get_current_user
from app.core.permissions import verify_user_is_active
from app.schemas.policies import PolicyBundleRead

router = APIRouter()


@router.get("", response_model=list[PolicyBundleRead])
def list_policy_bundles(
    kind: Literal["label_schema", "review", "dispute", "export"] | None = Query(
        default=None,
        description="Filter bundles by kind",
    ),
    current_user: dict = Depends(get_current_user),
) -> list[PolicyBundleRead]:
    verify_user_is_active(current_user)
    bundles = list_bundles(kind=kind)  # type: ignore[arg-type]
    return [
        PolicyBundleRead(
            id=bundle.id,
            kind=bundle.kind,
            title=bundle.title,
            description=bundle.description,
            rules=dict(bundle.rules),
        )
        for bundle in bundles
    ]
