"""Resolve task item content from external location_ref (uploads + mock fixtures)."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Literal

from app.core.storage_paths import (
    FIXTURES_BASE_DIR,
    UPLOAD_AUDIO_DIR,
    UPLOAD_IMAGES_DIR,
    UPLOAD_TEXTS_DIR,
)
from app.schemas.tasks import TaskItemContentRead

TEXT_UPLOAD_PREFIX = "uploads/texts/"
IMAGE_UPLOAD_PREFIX = "uploads/images/"
AUDIO_UPLOAD_PREFIX = "uploads/audio/"
MOCK_FIXTURE_PREFIX = "mock://fixtures/"

MAX_TEXT_BYTES = 65_536


class UnsupportedLocationRefError(ValueError):
    """location_ref scheme is not supported in MVP."""


class LocationRefNotFoundError(FileNotFoundError):
    """Resolved path does not exist."""


def _api_public_base() -> str:
    return os.environ.get("HEJ_API_PUBLIC_BASE_URL", "http://localhost:8000/api/v1").rstrip("/")


def _safe_fixture_path(relative_path: str) -> Path:
    raw = relative_path.strip().lstrip("/")
    if not raw or ".." in Path(raw).parts:
        raise ValueError("Invalid fixture path")
    base = FIXTURES_BASE_DIR.resolve()
    candidate = (base / raw).resolve()
    if not str(candidate).startswith(str(base)):
        raise ValueError("Invalid fixture path")
    return candidate


def _extract_text_from_bytes(data: bytes, suffix: str) -> tuple[str, bool]:
    truncated = False
    if len(data) > MAX_TEXT_BYTES:
        data = data[:MAX_TEXT_BYTES]
        truncated = True
    text = data.decode("utf-8", errors="replace")
    if suffix == ".json":
        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                for key in ("text", "preview", "content", "body"):
                    value = parsed.get(key)
                    if isinstance(value, str) and value.strip():
                        return value, truncated
            return json.dumps(parsed, indent=2, ensure_ascii=False), truncated
        except json.JSONDecodeError:
            pass
    return text, truncated


class DataAccessService:
    @staticmethod
    def resolve(location_ref: str) -> TaskItemContentRead:
        ref = location_ref.strip()
        if not ref:
            raise ValueError("location_ref is required")

        if ref.startswith(TEXT_UPLOAD_PREFIX):
            return DataAccessService._resolve_upload_text(ref)
        if ref.startswith(IMAGE_UPLOAD_PREFIX):
            return DataAccessService._resolve_upload_image(ref)
        if ref.startswith(AUDIO_UPLOAD_PREFIX):
            return DataAccessService._resolve_upload_audio(ref)
        if ref.startswith(MOCK_FIXTURE_PREFIX):
            return DataAccessService._resolve_mock_fixture(ref)

        raise UnsupportedLocationRefError(
            f"Unsupported location_ref scheme for MVP: {ref.split('://', 1)[0] if '://' in ref else ref[:32]}"
        )

    @staticmethod
    def _resolve_upload_text(location_ref: str) -> TaskItemContentRead:
        filename = location_ref[len(TEXT_UPLOAD_PREFIX) :].strip()
        if not filename or "/" in filename or "\\" in filename:
            raise ValueError("Invalid uploads/texts location_ref")
        file_path = (UPLOAD_TEXTS_DIR / filename).resolve()
        if not file_path.is_file():
            raise LocationRefNotFoundError(f"Text upload not found: {location_ref}")
        data = file_path.read_bytes()
        text, truncated = _extract_text_from_bytes(data, file_path.suffix.lower())
        return TaskItemContentRead(
            content_kind="text",
            text=text,
            media_url=None,
            location_ref=location_ref,
            source="uploads",
            truncated=truncated,
        )

    @staticmethod
    def _resolve_upload_image(location_ref: str) -> TaskItemContentRead:
        filename = location_ref[len(IMAGE_UPLOAD_PREFIX) :].strip()
        if not filename or "/" in filename or "\\" in filename:
            raise ValueError("Invalid uploads/images location_ref")
        file_path = (UPLOAD_IMAGES_DIR / filename).resolve()
        if not file_path.is_file():
            raise LocationRefNotFoundError(f"Image upload not found: {location_ref}")
        media_url = f"{_api_public_base()}/uploads/images/{filename}"
        return TaskItemContentRead(
            content_kind="image",
            text=None,
            media_url=media_url,
            location_ref=location_ref,
            source="uploads",
            truncated=False,
        )

    @staticmethod
    def _resolve_upload_audio(location_ref: str) -> TaskItemContentRead:
        filename = location_ref[len(AUDIO_UPLOAD_PREFIX) :].strip()
        if not filename or "/" in filename or "\\" in filename:
            raise ValueError("Invalid uploads/audio location_ref")
        file_path = (UPLOAD_AUDIO_DIR / filename).resolve()
        if not file_path.is_file():
            raise LocationRefNotFoundError(f"Audio upload not found: {location_ref}")
        media_url = f"{_api_public_base()}/uploads/audio/{filename}"
        suffix = file_path.suffix.lower()
        mime_type = {
            ".mp3": "audio/mpeg",
            ".wav": "audio/wav",
            ".m4a": "audio/mp4",
            ".mp4": "audio/mp4",
            ".webm": "audio/webm",
            ".ogg": "audio/ogg",
            ".aac": "audio/aac",
        }.get(suffix)
        return TaskItemContentRead(
            content_kind="audio",
            text=None,
            media_url=media_url,
            location_ref=location_ref,
            source="uploads",
            truncated=False,
            filename=filename,
            mime_type=mime_type,
            size=file_path.stat().st_size,
            duration_seconds=None,
        )

    @staticmethod
    def _resolve_mock_fixture(location_ref: str) -> TaskItemContentRead:
        relative = location_ref[len(MOCK_FIXTURE_PREFIX) :]
        file_path = _safe_fixture_path(relative)
        if not file_path.is_file():
            raise LocationRefNotFoundError(f"Fixture not found: {location_ref}")

        suffix = file_path.suffix.lower()
        image_suffixes = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"}
        if suffix in image_suffixes:
            media_url = f"{_api_public_base()}/fixtures/{relative.replace(chr(92), '/')}"
            return TaskItemContentRead(
                content_kind="image",
                text=None,
                media_url=media_url,
                location_ref=location_ref,
                source="mock_fixture",
                truncated=False,
            )

        data = file_path.read_bytes()
        text, truncated = _extract_text_from_bytes(data, suffix)
        return TaskItemContentRead(
            content_kind="text",
            text=text,
            media_url=None,
            location_ref=location_ref,
            source="mock_fixture",
            truncated=truncated,
        )
