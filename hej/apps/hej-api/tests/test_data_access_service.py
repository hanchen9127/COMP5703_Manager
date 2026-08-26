"""Tests for location_ref content resolution (data access)."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from app.services.data_access_service import (
    DataAccessService,
    LocationRefNotFoundError,
    UnsupportedLocationRefError,
)


class DataAccessServiceTests(unittest.TestCase):
    def test_resolve_mock_fixture_json(self) -> None:
        result = DataAccessService.resolve("mock://fixtures/text/item_002.json")
        self.assertEqual(result.content_kind, "text")
        self.assertEqual(result.source, "mock_fixture")
        self.assertIn("Longer annotatable body", result.text or "")

    def test_resolve_mock_fixture_image(self) -> None:
        result = DataAccessService.resolve("mock://fixtures/images/demo_item.png")
        self.assertEqual(result.content_kind, "image")
        self.assertTrue(result.media_url)
        self.assertIn("/fixtures/images/demo_item.png", result.media_url or "")

    def test_unsupported_s3_scheme(self) -> None:
        with self.assertRaises(UnsupportedLocationRefError):
            DataAccessService.resolve("s3://bucket/object.json")

    def test_fixture_path_traversal_rejected(self) -> None:
        with self.assertRaises(ValueError):
            DataAccessService.resolve("mock://fixtures/../pyproject.toml")

    def test_upload_audio_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            audio_dir = Path(tmp)
            (audio_dir / "sample.mp3").write_bytes(b"fake audio bytes")
            with patch(
                "app.services.data_access_service.UPLOAD_AUDIO_DIR",
                audio_dir,
            ):
                result = DataAccessService.resolve("uploads/audio/sample.mp3")
        self.assertEqual(result.content_kind, "audio")
        self.assertEqual(result.source, "uploads")
        self.assertTrue(result.media_url)
        self.assertIn("/uploads/audio/sample.mp3", result.media_url or "")
        self.assertEqual(result.filename, "sample.mp3")

    def test_upload_audio_missing_raises(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            with patch(
                "app.services.data_access_service.UPLOAD_AUDIO_DIR",
                Path(tmp),
            ):
                with self.assertRaises(LocationRefNotFoundError):
                    DataAccessService.resolve("uploads/audio/missing.mp3")

    def test_upload_text_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            texts_dir = Path(tmp)
            (texts_dir / "sample.txt").write_text("hello from upload path", encoding="utf-8")
            with patch(
                "app.services.data_access_service.UPLOAD_TEXTS_DIR",
                texts_dir,
            ):
                result = DataAccessService.resolve("uploads/texts/sample.txt")
        self.assertEqual(result.content_kind, "text")
        self.assertEqual(result.source, "uploads")
        self.assertEqual(result.text, "hello from upload path")

    def test_upload_text_missing_raises(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            with patch(
                "app.services.data_access_service.UPLOAD_TEXTS_DIR",
                Path(tmp),
            ):
                with self.assertRaises(LocationRefNotFoundError):
                    DataAccessService.resolve("uploads/texts/missing.txt")


if __name__ == "__main__":
    unittest.main()
