"""Shared local storage paths for uploads and data access."""

from __future__ import annotations

import os
from pathlib import Path

if "HEJ_DATA_DIR" in os.environ:
    UPLOAD_BASE_DIR = Path(os.environ["HEJ_DATA_DIR"])
else:
    # apps/hej-api/app/core/storage_paths.py -> parents[3] == apps/hej-api
    UPLOAD_BASE_DIR = Path(__file__).resolve().parents[3] / "mydata"

UPLOAD_IMAGES_DIR = UPLOAD_BASE_DIR / "images"
UPLOAD_TEXTS_DIR = UPLOAD_BASE_DIR / "texts"
UPLOAD_AUDIO_DIR = UPLOAD_BASE_DIR / "audio"

# apps/hej-api/fixtures for mock://fixtures/... resolution
FIXTURES_BASE_DIR = Path(__file__).resolve().parents[2] / "fixtures"


def ensure_upload_dirs() -> None:
    UPLOAD_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    UPLOAD_TEXTS_DIR.mkdir(parents=True, exist_ok=True)
    UPLOAD_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
