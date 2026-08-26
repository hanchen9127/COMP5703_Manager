"""Operator-facing copy for task activity history (write + legacy read paths)."""

from __future__ import annotations

import re
from typing import Any

DATA_INTAKE_OPERATIONS = frozenset({"dataset_registered", "files_uploaded"})

_LEGACY_TEXT_UPLOAD = re.compile(
    r"^Registered\s+(\d+)\s+task\s+items?\s+from\s+text\s+upload$",
    re.IGNORECASE,
)
_LEGACY_IMAGE_UPLOAD = re.compile(
    r"^Registered\s+(\d+)\s+task\s+items?\s+from\s+image\s+upload$",
    re.IGNORECASE,
)
_LEGACY_AUDIO_UPLOAD = re.compile(
    r"^Registered\s+(\d+)\s+task\s+items?\s+from\s+audio\s+upload$",
    re.IGNORECASE,
)
_LEGACY_CREATED_POINTERS = re.compile(
    r"^Created\s+(\d+)\s+data\s+pointers?\s+and\s+(\d+)\s+task\s+items?$",
    re.IGNORECASE,
)
_LEGACY_UPLOAD_REGISTER = re.compile(
    r"^Uploaded\s+(\d+)\s+(\w+)\s+file\(s\);\s+registered\s+(\d+)\s+task\s+items?$",
    re.IGNORECASE,
)


def queue_item_noun(*, intake_source: str | None, count: int) -> str:
    if intake_source == "text_upload":
        return "text item" if count == 1 else "text items"
    if intake_source == "image_upload":
        return "image item" if count == 1 else "image items"
    if intake_source == "audio_upload":
        return "audio item" if count == 1 else "audio items"
    return "item" if count == 1 else "items"


def format_item_name_list(names: list[str], *, max_visible: int = 5) -> str | None:
    cleaned = [str(name).strip() for name in names if name and str(name).strip()]
    if not cleaned:
        return None
    if len(cleaned) <= max_visible:
        return ", ".join(cleaned)
    visible = ", ".join(cleaned[:max_visible])
    remaining = len(cleaned) - max_visible
    return f"{visible} (+{remaining} more)"


def build_data_intake_audit_copy(
    *,
    item_count: int,
    intake_source: str | None,
    item_names: list[str],
) -> tuple[str, str | None]:
    """Returns (summary, detail) for a single data-intake history event."""
    count = max(item_count, 0)
    if count == 0:
        return "Added items to queue", None

    if intake_source is None:
        noun = "item" if count == 1 else "items"
        summary = f"Registered {count} {noun} from dataset"
    else:
        noun = queue_item_noun(intake_source=intake_source, count=count)
        summary = f"Added {count} {noun} to queue"

    names = [str(name).strip() for name in item_names if name and str(name).strip()]
    if count == 1 and len(names) == 1:
        return summary, names[0]
    if len(names) > 0:
        return summary, format_item_name_list(names)
    return summary, None


def normalize_legacy_data_intake_copy(
    operation: str,
    description: str | None,
    new_values: dict[str, Any],
) -> tuple[str, str | None]:
    """Map pre-UX-refactor audit text to operator-facing summary + detail."""
    if operation not in DATA_INTAKE_OPERATIONS:
        desc = (description or "").strip()
        return (desc or operation.replace("_", " ").strip().capitalize()), None

    desc = (description or "").strip()
    item_names_raw = new_values.get("item_names")
    names: list[str] = []
    if isinstance(item_names_raw, list):
        names = [str(n).strip() for n in item_names_raw if n and str(n).strip()]

    if names:
        count_raw = new_values.get("item_count")
        try:
            count = int(count_raw) if count_raw is not None else len(names)
        except (TypeError, ValueError):
            count = len(names)
        intake_source = new_values.get("intake_source")
        if isinstance(intake_source, str):
            return build_data_intake_audit_copy(
                item_count=count,
                intake_source=intake_source,
                item_names=names,
            )
        return build_data_intake_audit_copy(
            item_count=count,
            intake_source=None,
            item_names=names,
        )

    count = new_values.get("item_count")
    if count is None and desc:
        for pattern in (
            _LEGACY_TEXT_UPLOAD,
            _LEGACY_IMAGE_UPLOAD,
            _LEGACY_AUDIO_UPLOAD,
            _LEGACY_CREATED_POINTERS,
        ):
            match = pattern.match(desc)
            if match:
                count = int(match.group(2) if pattern is _LEGACY_CREATED_POINTERS else match.group(1))
                break
        upload_match = _LEGACY_UPLOAD_REGISTER.match(desc)
        if upload_match:
            count = int(upload_match.group(3))

    try:
        n = int(count) if count is not None else 1
    except (TypeError, ValueError):
        n = 1

    intake_source: str | None = None
    if _LEGACY_TEXT_UPLOAD.match(desc):
        intake_source = "text_upload"
    elif _LEGACY_IMAGE_UPLOAD.match(desc):
        intake_source = "image_upload"
    elif _LEGACY_AUDIO_UPLOAD.match(desc):
        intake_source = "audio_upload"
    elif upload_match := _LEGACY_UPLOAD_REGISTER.match(desc):
        medium = upload_match.group(2).lower()
        if medium == "text":
            intake_source = "text_upload"
        elif medium == "image":
            intake_source = "image_upload"
        elif medium == "audio":
            intake_source = "audio_upload"

    if operation == "files_uploaded" and intake_source is None and "text" in desc.lower():
        intake_source = "text_upload"
    elif operation == "files_uploaded" and "image" in desc.lower():
        intake_source = "image_upload"
    elif operation == "files_uploaded" and "audio" in desc.lower():
        intake_source = "audio_upload"

    summary, detail = build_data_intake_audit_copy(
        item_count=n,
        intake_source=intake_source,
        item_names=names,
    )
    if not detail and desc:
        legacy_prefixes = ("Added ", "Registered ", "Uploaded ", "Created ")
        if not any(desc.startswith(prefix) for prefix in legacy_prefixes):
            if "pointer" not in desc.lower() and "task item" not in desc.lower():
                return summary, desc
    return summary, detail
