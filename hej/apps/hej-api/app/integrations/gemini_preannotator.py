from __future__ import annotations

import base64
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib import request

from app.core.storage_paths import FIXTURES_BASE_DIR
from app.core.storage_paths import UPLOAD_IMAGES_DIR
from app.core.config import settings
from app.models import Task
from app.models import TaskType
from app.schemas.tasks import TaskItemContentRead
from app.services.data_access_service import DataAccessService

MIN_IMAGE_BOXES = 2
DEFAULT_IMAGE_LABELS = ["person", "vehicle", "building", "animal", "product"]
GENERIC_LABELS = {"object", "item", "thing", "unknown", "entity"}


@dataclass
class PreannotateResult:
    annotation_type: str
    draft_data: dict[str, Any]
    revision_notes: str


class GeminiPreannotator:
    def __init__(self) -> None:
        self.enabled = settings.gemini_enabled and bool(settings.gemini_api_key)
        self.api_key = settings.gemini_api_key
        self.model = settings.gemini_model
        self.timeout = settings.gemini_timeout_seconds

    def generate_for_item(
        self,
        task: Task,
        *,
        location_ref: str,
        payload_preview: dict[str, Any] | None = None,
    ) -> PreannotateResult:
        if not self.enabled:
            return self._empty_result(task.task_type, "AI pre-annotation disabled")

        try:
            content = DataAccessService.resolve(location_ref)
            prompt = self._build_prompt(task, content, payload_preview or {})
            image_inline_data = self._build_image_inline_data(location_ref) if task.task_type == TaskType.IMAGE else None
            raw = self._call_gemini(prompt, image_inline_data=image_inline_data)
            parsed = self._parse_json(raw)
            return self._to_result(task.task_type, parsed)
        except Exception:
            return self._empty_result(task.task_type, "AI pre-annotation fallback")

    def _build_prompt(
        self,
        task: Task,
        content: TaskItemContentRead,
        payload_preview: dict[str, Any],
    ) -> str:
        label_hints = self._extract_label_hints(payload_preview)
        label_hints_text = ", ".join(label_hints)
        return (
            "You are an annotation assistant. Return ONLY valid JSON. "
            f"task_type={task.task_type}; judgment_question={task.judgment_question}. "
            f"label_schema_ref={task.label_schema_ref}. "
            f"payload_preview={json.dumps(payload_preview, ensure_ascii=False)}. "
            f"content_kind={content.content_kind}. "
            f"text={content.text or ''}. "
            f"media_url={content.media_url or ''}. "
            f"Prefer concrete category names from these hints when possible: [{label_hints_text}]. "
            "For image, detect at least two distinct visible objects and return at least two boxes. "
            "All coordinates must be normalized to 0-1 and boxes should not be identical. "
            "Each box label must be a specific category (e.g., person, car, bus, dog, bottle), not generic words like object/item/thing. "
            "For image return {\"boxes\":[{\"label\":\"object\",\"x\":0.1,\"y\":0.1,\"width\":0.2,\"height\":0.2},{\"label\":\"object\",\"x\":0.55,\"y\":0.2,\"width\":0.25,\"height\":0.3}]}. "
            "For text return {\"output_text\":\"...\"}. "
            "For audio return {\"segments\":[{\"id\":\"seg_1\",\"start_seconds\":0,\"end_seconds\":1,\"transcript\":\"...\"}]}."
        )

    def _extract_label_hints(self, payload_preview: dict[str, Any]) -> list[str]:
        labels = payload_preview.get("labels")
        if isinstance(labels, dict):
            keys = [str(key).strip() for key in labels.keys() if str(key).strip()]
            if keys:
                return keys[:8]
        if isinstance(labels, list):
            values = [str(value).strip() for value in labels if str(value).strip()]
            if values:
                return values[:8]
        return DEFAULT_IMAGE_LABELS

    def _call_gemini(
        self,
        prompt: str,
        *,
        image_inline_data: dict[str, str] | None = None,
    ) -> str:
        endpoint = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent?key={self.api_key}"
        )
        parts: list[dict[str, Any]] = [{"text": prompt}]
        if image_inline_data is not None:
            parts.append({"inline_data": image_inline_data})
        body = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json",
            },
        }
        data = json.dumps(body).encode("utf-8")
        req = request.Request(
            endpoint,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with request.urlopen(req, timeout=self.timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))

        return payload["candidates"][0]["content"]["parts"][0]["text"]

    @staticmethod
    def _parse_json(text: str) -> dict[str, Any]:
        try:
            payload = json.loads(text)
        except Exception:
            return {}
        if not isinstance(payload, dict):
            return {}
        return payload

    def _build_image_inline_data(self, location_ref: str) -> dict[str, str] | None:
        image_path = self._resolve_image_path(location_ref)
        if image_path is None or not image_path.is_file():
            return None
        try:
            content = image_path.read_bytes()
        except OSError:
            return None
        if not content:
            return None

        return {
            "mime_type": self._guess_mime_type(image_path),
            "data": base64.b64encode(content).decode("ascii"),
        }

    def _resolve_image_path(self, location_ref: str) -> Path | None:
        ref = location_ref.strip()
        if not ref:
            return None

        if ref.startswith("uploads/images/"):
            filename = ref[len("uploads/images/") :].strip()
            if filename and "/" not in filename and "\\" not in filename:
                return (UPLOAD_IMAGES_DIR / filename).resolve()

        # Support API-relative or absolute URLs that include uploads/images path.
        marker = "/uploads/images/"
        if marker in ref:
            filename = ref.split(marker, 1)[1].strip().split("?", 1)[0]
            if filename and "/" not in filename and "\\" not in filename:
                return (UPLOAD_IMAGES_DIR / filename).resolve()

        if ref.startswith("mock://fixtures/"):
            relative = ref[len("mock://fixtures/") :].strip().lstrip("/")
            if not relative:
                return None
            candidate = (FIXTURES_BASE_DIR / relative).resolve()
            base = FIXTURES_BASE_DIR.resolve()
            if str(candidate).startswith(str(base)):
                return candidate

        return None

    @staticmethod
    def _guess_mime_type(image_path: Path) -> str:
        suffix = image_path.suffix.lower()
        return {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".bmp": "image/bmp",
        }.get(suffix, "application/octet-stream")

    def _to_result(self, task_type: TaskType, parsed: dict[str, Any]) -> PreannotateResult:
        if task_type == TaskType.IMAGE:
            boxes = self._ensure_min_image_boxes(self._normalize_image_boxes(parsed))
            return PreannotateResult(
                annotation_type="bbox",
                draft_data={
                    "kind": "image",
                    "boxes": boxes,
                    "notes": "AI pre-annotation initialized",
                },
                revision_notes="AI initialized draft",
            )

        if task_type == TaskType.AUDIO:
            segments = parsed.get("segments", [])
            if not isinstance(segments, list):
                segments = []
            return PreannotateResult(
                annotation_type="audio",
                draft_data={
                    "kind": "audio",
                    "segments": segments,
                    "notes": "AI pre-annotation initialized",
                },
                revision_notes="AI initialized draft",
            )

        output_text = parsed.get("output_text", "")
        if not isinstance(output_text, str):
            output_text = ""
        return PreannotateResult(
            annotation_type="annotation",
            draft_data={
                "kind": "text",
                "output_text": output_text,
                "notes": "AI pre-annotation initialized",
            },
            revision_notes="AI initialized draft",
        )

    @staticmethod
    def _empty_result(task_type: TaskType, note: str) -> PreannotateResult:
        if task_type == TaskType.IMAGE:
            return PreannotateResult(
                annotation_type="bbox",
                draft_data={
                    "kind": "image",
                    "boxes": [
                        {"id": "ai_1", "label": "object", "x": 0.12, "y": 0.12, "width": 0.3, "height": 0.3},
                        {"id": "ai_2", "label": "object", "x": 0.56, "y": 0.2, "width": 0.28, "height": 0.34},
                    ],
                    "notes": note,
                },
                revision_notes=note,
            )

        if task_type == TaskType.AUDIO:
            return PreannotateResult(
                annotation_type="audio",
                draft_data={"kind": "audio", "segments": [], "notes": note},
                revision_notes=note,
            )

        return PreannotateResult(
            annotation_type="annotation",
            draft_data={"kind": "text", "output_text": "", "notes": note},
            revision_notes=note,
        )

    def _normalize_image_boxes(self, parsed: dict[str, Any]) -> list[dict[str, Any]]:
        raw_boxes = parsed.get("boxes")
        if not isinstance(raw_boxes, list):
            return []

        normalized: list[dict[str, Any]] = []
        for index, raw in enumerate(raw_boxes):
            box = self._normalize_single_box(raw, index)
            if box is not None:
                normalized.append(box)
        return normalized

    def _ensure_min_image_boxes(self, boxes: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if len(boxes) >= MIN_IMAGE_BOXES:
            return boxes

        defaults = [
            {"id": "ai_1", "label": "object", "x": 0.12, "y": 0.12, "width": 0.3, "height": 0.3},
            {"id": "ai_2", "label": "object", "x": 0.56, "y": 0.2, "width": 0.28, "height": 0.34},
        ]

        result = list(boxes)
        existing_ids = {str(box.get("id", "")).strip() for box in result}
        for default_box in defaults:
            if len(result) >= MIN_IMAGE_BOXES:
                break
            candidate = dict(default_box)
            if candidate["id"] in existing_ids:
                candidate["id"] = f"ai_{len(result) + 1}"
            result.append(candidate)
            existing_ids.add(candidate["id"])

        return result

    def _normalize_single_box(self, raw: Any, index: int) -> dict[str, Any] | None:
        if not isinstance(raw, dict):
            return None

        x = self._to_float(raw.get("x", raw.get("left")))
        y = self._to_float(raw.get("y", raw.get("top")))
        width = self._to_float(raw.get("width", raw.get("w")))
        height = self._to_float(raw.get("height", raw.get("h")))

        # Support outputs that provide right/bottom instead of width/height.
        if width is None:
            right = self._to_float(raw.get("right"))
            if x is not None and right is not None:
                width = right - x
        if height is None:
            bottom = self._to_float(raw.get("bottom"))
            if y is not None and bottom is not None:
                height = bottom - y

        if x is None or y is None or width is None or height is None:
            return None

        # If model returns percentage-like values, convert to 0-1.
        if x > 1 or y > 1 or width > 1 or height > 1:
            x = x / 100.0 if x <= 100 else x
            y = y / 100.0 if y <= 100 else y
            width = width / 100.0 if width <= 100 else width
            height = height / 100.0 if height <= 100 else height

        x = self._clamp01(x)
        y = self._clamp01(y)
        width = self._clamp01(width)
        height = self._clamp01(height)

        if width <= 0.001 or height <= 0.001:
            return None

        # Keep box in-frame after clamping.
        if x + width > 1:
            width = max(0.001, 1 - x)
        if y + height > 1:
            height = max(0.001, 1 - y)

        label_raw = raw.get("label", raw.get("class", raw.get("category", "object")))
        label = str(label_raw).strip() if label_raw is not None else "object"
        if not label or label.lower() in GENERIC_LABELS:
            label = DEFAULT_IMAGE_LABELS[index % len(DEFAULT_IMAGE_LABELS)]

        box_id_raw = raw.get("id")
        box_id = str(box_id_raw).strip() if box_id_raw is not None else ""
        if not box_id:
            box_id = f"ai_{index + 1}"

        return {
            "id": box_id,
            "label": label,
            "x": x,
            "y": y,
            "width": width,
            "height": height,
        }

    @staticmethod
    def _to_float(value: Any) -> float | None:
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _clamp01(value: float) -> float:
        return max(0.0, min(1.0, value))
