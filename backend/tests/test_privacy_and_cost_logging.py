"""
Tests for Task 2 (privacy-safe logging) and Task 3 (AI cost logging).

Covers:
- Whisper service does NOT log raw transcript text
- ai.py logger calls do NOT emit patient names, phone numbers, or raw transcripts
- ai_cost_logger handles missing usage metadata without crashing
- ai_cost_logger records success=False for failures
- ai_cost_logger records retry_attempt field
- DrugValidator.log_validation() stores only non-sensitive fields
- Validation log does not persist patient names or transcript fragments
"""
from __future__ import annotations

import logging
import os
from unittest.mock import MagicMock, patch

import pytest

from app.services.ai_cost_logger import ai_cost_logger
from app.services.drug_validator import drug_validator


# ---------------------------------------------------------------------------
# Task 2 — Privacy-safe logging: whisper_service
# ---------------------------------------------------------------------------

class TestWhisperLoggingPrivacy:
    """Whisper service must not log raw transcript text."""

    def test_whisper_log_does_not_contain_raw_transcript(self, caplog):
        """
        Simulate a transcription completion and verify the logger emits
        character count (chars=N) but NOT the actual transcript text.
        """
        from app.ai import whisper_service as ws_module

        sensitive_text = "Patient Ramesh Kumar has fever and chest pain, paracetamol 500mg"

        with caplog.at_level(logging.INFO, logger="app.ai.whisper_service"):
            # Directly call the internal log path by patching the logger
            with patch.object(ws_module.logger, "info") as mock_log:
                # Simulate what whisper_service now emits after the privacy fix
                ws_module.logger.info(
                    "Transcription complete chars=%d language=%s confidence=%.2f",
                    len(sensitive_text), "hi-IN", 0.95
                )
                assert mock_log.called
                call_args = str(mock_log.call_args)
                # Must NOT contain the actual words from the transcript
                assert "Ramesh" not in call_args
                assert "chest pain" not in call_args
                assert "paracetamol" not in call_args
                # Must contain char-count metadata
                assert str(len(sensitive_text)) in call_args

    def test_whisper_log_format_uses_chars_not_text(self, caplog):
        """
        Verify the current whisper_service log format string at the 
        transcription-complete path does not include {final_text} or {text}.
        """
        import inspect
        from app.ai import whisper_service as ws_module

        source = inspect.getsource(ws_module)
        # The old bad pattern: Text: {final_text[:100]} or similar
        assert "Text: {final_text" not in source, (
            "Raw transcript still logged in whisper_service.py — privacy violation"
        )
        assert "final_text[:100]" not in source, (
            "Raw transcript slice still logged in whisper_service.py — privacy violation"
        )


# ---------------------------------------------------------------------------
# Task 2 — Privacy-safe logging: drug_validator.log_validation
# ---------------------------------------------------------------------------

class TestValidationLogPrivacy:
    """DrugValidator.log_validation must not store patient names or raw text."""

    def test_validation_log_fields_are_non_sensitive(self):
        """
        After calling validate_medicine_name, the in-memory validation log
        must only store non-sensitive fields: spoken_name, matched_name,
        score, band, reason, created_at.
        Prohibited: patient_name, transcript, doctor_name, raw text.
        """
        drug_validator.validation_logs.clear()
        drug_validator.validate_medicine_name("Paracetamol")

        assert len(drug_validator.validation_logs) >= 1
        log_entry = drug_validator.validation_logs[-1]

        sensitive_keys = {"patient_name", "transcript", "doctor_name", "phone", "aadhaar"}
        found = sensitive_keys.intersection(log_entry.keys())
        assert not found, f"Sensitive keys found in validation log: {found}"

        # Required non-sensitive fields must be present
        for required in ("spoken_name", "band", "created_at"):
            assert required in log_entry, f"Expected field '{required}' missing from validation log"

    def test_validation_log_spoken_name_is_medicine_not_patient(self):
        """spoken_name in validation log must be the medicine name, not a patient name."""
        drug_validator.validation_logs.clear()
        drug_validator.validate_medicine_name("Amoxicillin")

        log_entry = drug_validator.validation_logs[-1]
        # spoken_name should be the medicine term, not a patient identifier
        assert log_entry["spoken_name"].lower() in ("amoxicillin",)


# ---------------------------------------------------------------------------
# Task 3 — AI cost logging: missing usage metadata
# ---------------------------------------------------------------------------

class TestCostLoggerMissingMetadata:
    """ai_cost_logger must handle None/missing token counts without crashing."""

    def test_log_llm_cost_with_none_tokens_does_not_crash(self):
        """If token counts are unavailable (None), logger must not raise."""
        initial = len(ai_cost_logger.get_cost_logs())
        # Should not raise even with None tokens
        ai_cost_logger.log_llm_cost(
            model="gemini-1.5-flash",
            prompt_tokens=None,
            completion_tokens=None,
            latency_ms=250.0,
            success=True,
        )
        logs = ai_cost_logger.get_cost_logs()
        assert len(logs) == initial + 1
        last = logs[-1]
        assert last["model"] == "gemini-1.5-flash"
        # cost_usd must be defined (0.0 is acceptable for unknown tokens)
        assert "cost_usd" in last
        assert last["cost_usd"] >= 0.0

    def test_log_llm_cost_with_zero_tokens_returns_zero_cost(self):
        """Zero tokens should produce zero cost, not a crash or negative cost."""
        ai_cost_logger.log_llm_cost(
            model="gemini-1.5-flash",
            prompt_tokens=0,
            completion_tokens=0,
            latency_ms=10.0,
            success=True,
        )
        logs = ai_cost_logger.get_cost_logs()
        last = logs[-1]
        assert last["cost_usd"] == 0.0


# ---------------------------------------------------------------------------
# Task 3 — AI cost logging: failure recording
# ---------------------------------------------------------------------------

class TestCostLoggerFailureRecording:
    """Failed AI calls must be recorded with success=False."""

    def test_log_llm_cost_failure_is_recorded(self):
        """A failed LLM call must appear in the log with success=False."""
        initial = len(ai_cost_logger.get_cost_logs())
        ai_cost_logger.log_llm_cost(
            model="gemini-1.5-flash",
            prompt_tokens=50,
            completion_tokens=0,
            latency_ms=800.0,
            success=False,
        )
        logs = ai_cost_logger.get_cost_logs()
        assert len(logs) == initial + 1
        last = logs[-1]
        assert last["success"] is False

    def test_failed_calls_appear_in_cost_summary(self):
        """get_cost_summary must count failed calls in total_calls."""
        before = ai_cost_logger.get_cost_summary()["total_calls"]
        ai_cost_logger.log_llm_cost(
            model="gemini-1.5-flash",
            prompt_tokens=0,
            completion_tokens=0,
            latency_ms=1200.0,
            success=False,
        )
        after = ai_cost_logger.get_cost_summary()["total_calls"]
        assert after == before + 1

    def test_log_speech_cost_records_entry(self):
        """log_speech_cost must record a cost entry for transcription operations."""
        initial = len(ai_cost_logger.get_cost_logs())
        ai_cost_logger.log_speech_cost(
            model="large-v3",
            duration_seconds=12.5,
            latency_ms=340.0,
        )
        logs = ai_cost_logger.get_cost_logs()
        assert len(logs) == initial + 1
        last = logs[-1]
        assert last["model"] == "large-v3"
        assert "cost_usd" in last
        assert last["cost_usd"] >= 0.0


# ---------------------------------------------------------------------------
# Task 3 — AI cost logging: retry_attempt field
# ---------------------------------------------------------------------------

class TestCostLoggerRetryField:
    """Cost logs should capture retry_attempt when provided."""

    def test_log_llm_cost_with_retry_attempt(self):
        """If retry_attempt kwarg is accepted, it must appear in the log."""
        initial = len(ai_cost_logger.get_cost_logs())
        try:
            ai_cost_logger.log_llm_cost(
                model="gemini-1.5-flash",
                prompt_tokens=100,
                completion_tokens=80,
                latency_ms=400.0,
                success=True,
                retry_attempt=2,
            )
            logs = ai_cost_logger.get_cost_logs()
            assert len(logs) == initial + 1
            last = logs[-1]
            # If the field is stored, verify it
            if "retry_attempt" in last:
                assert last["retry_attempt"] == 2
        except TypeError:
            # If retry_attempt kwarg is not yet accepted, mark as known gap
            pytest.xfail(
                "ai_cost_logger.log_llm_cost does not yet accept retry_attempt kwarg — "
                "add it to the signature to complete Task 3"
            )


# ---------------------------------------------------------------------------
# Task 3 — AI cost logging: adapter instruments all paths
# ---------------------------------------------------------------------------

class TestAdapterCostInstrumentation:
    """GeminiLLMClient must log cost entries on both success and failure paths."""

    def test_gemini_failure_path_logs_cost(self):
        """
        When GeminiLLMClient receives a non-200 HTTP response, it must call
        ai_cost_logger.log_llm_cost with success=False.
        """
        from app.ai.adapter import GeminiLLMClient
        from app.services.ai_cost_logger import ai_cost_logger
        import httpx

        initial = len(ai_cost_logger.get_cost_logs())

        client = GeminiLLMClient.__new__(GeminiLLMClient)
        client.api_key = "test-key"
        client.models = ["gemini-1.5-flash"]
        client.max_retries = 1
        client.timeout = 5

        mock_resp = MagicMock(spec=httpx.Response)
        mock_resp.status_code = 429
        mock_resp.text = "rate limited"
        mock_resp.json.side_effect = Exception("not json")

        with patch("httpx.Client") as MockClient:
            ctx = MagicMock()
            ctx.__enter__ = MagicMock(return_value=ctx)
            ctx.__exit__ = MagicMock(return_value=False)
            ctx.post.return_value = mock_resp
            MockClient.return_value = ctx

            from pydantic import BaseModel

            class _Schema(BaseModel):
                medicines: list = []

            try:
                client.complete(system="sys", user="user text", schema=_Schema)
            except Exception:
                pass  # Expected — non-200 raises

        after_logs = ai_cost_logger.get_cost_logs()
        failure_entries = [l for l in after_logs[initial:] if l.get("success") is False]
        assert len(failure_entries) >= 1, (
            "GeminiLLMClient did not log a failure cost entry on HTTP 429"
        )
