"""Policy ref validation shared by task create/update."""

from __future__ import annotations

import re

from fastapi import HTTPException, status

POLICY_REF_PATTERN = re.compile(r"^[a-z][a-z0-9_]{2,254}$")

KNOWN_LABEL_SCHEMA_REFS = frozenset(
    {
        "image_detection_schema_v1",
        "sentiment_classification_schema_v1",
        "default",
    }
)
KNOWN_REVIEW_POLICY_REFS = frozenset({"review_dual_signoff_v1", "review_single_pass_v1"})
KNOWN_DISPUTE_POLICY_REFS = frozenset({"dispute_escalation_policy_v1"})
KNOWN_EXPORT_POLICY_REFS = frozenset({"export_authoritative_with_provenance_v1"})


def normalize_optional_policy_ref(value: str | None) -> str | None:
    if value is None:
        return None
    trimmed = value.strip()
    return trimmed if trimmed else None


def validate_policy_ref(field_name: str, value: str | None, *, optional: bool = False) -> str | None:
    normalized = normalize_optional_policy_ref(value)
    if normalized is None:
        if optional:
            return None
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} is required",
        )
    if not POLICY_REF_PATTERN.match(normalized):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid {field_name}: use lowercase letters, numbers, and underscores "
                f"(e.g. review_dual_signoff_v1)"
            ),
        )
    return normalized


def validate_task_policy_refs(
    *,
    label_schema_ref: str,
    review_policy_ref: str | None,
    dispute_policy_ref: str | None = None,
    export_policy_ref: str | None = None,
) -> dict[str, str | None]:
    """Validate and normalize task-level policy refs."""
    return {
        "label_schema_ref": validate_policy_ref("label_schema_ref", label_schema_ref),
        "review_policy_ref": validate_policy_ref(
            "review_policy_ref",
            review_policy_ref,
            optional=True,
        ),
        "dispute_policy_ref": validate_policy_ref(
            "dispute_policy_ref",
            dispute_policy_ref,
            optional=True,
        ),
        "export_policy_ref": validate_policy_ref(
            "export_policy_ref",
            export_policy_ref,
            optional=True,
        ),
    }
