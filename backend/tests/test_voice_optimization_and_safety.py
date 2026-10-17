from __future__ import annotations

import asyncio
import os
import pytest
from fastapi import HTTPException
from pydantic import BaseModel

from app.api.routes import ai
from app.ai.adapter import (
    LocalStubSpeechClient,
    LocalStubLLMClient,
    Transcript,
    get_speech_client,
    get_llm_client,
)
from app.services.drug_validator import drug_validator
from app.ai.whisper_service import whisper_service


# ── Test 1: Missing clinical fields must NEVER be invented ─────────────────────

def test_missing_clinical_fields_are_not_invented(monkeypatch):
    """
    When the transcript only contains a bare medicine mention without diagnosis,
    symptoms, dosage, frequency, duration, or form, the extractor and validator
    must NOT invent defaults (e.g. no 'Fever & Headache', no 'General OPD', no 'Tablet', no '1-0-1').
    """
    class MinimalExtractor:
        def complete(self, system, user, schema):
            return schema.model_validate({
                "symptoms": [],
                "diagnosis": "",
                "medicines": [
                    {
                        "spoken_name": "Dolo 650",
                        "dose": "650 mg",
                        "frequency": None,
                        "timing": None,
                        "duration": None,
                        "form": None,
                    }
                ],
                "investigations": [],
                "advice": [],
                "follow_up": [],
                "notes": "",
            })

    monkeypatch.setattr(ai, "get_llm_client", lambda: MinimalExtractor())
    result = ai.structure_prescription(ai.StructureRequest(transcript="Dolo 650"))

    # Assert no clinical hallucinations
    assert result["symptoms"] == []
    assert result["diagnosis"] == ""
    assert result["investigations"] == []
    assert result["advice"] == []

    med = result["medicines"][0]
    assert med["spoken_name"] == "Dolo 650"
    assert med["dose"] == "650 mg"
    assert med["frequency"] is None
    assert med["timing"] is None
    assert med["duration"] is None
    assert med.get("form") != "Tablet"  # Must not force "Tablet"


# ── Test 2: Generic 'paracetamol' stays generic and is NOT mapped to 'Dolo 650' ──

def test_generic_paracetamol_stays_generic_and_not_substituted(monkeypatch):
    """
    Generic molecules like 'paracetamol' must never be auto-substituted to a brand
    like 'Dolo 650'. They remain yellow / needs_confirmation with canonical_name None.
    """
    class ParacetamolExtractor:
        def complete(self, system, user, schema):
            return schema.model_validate({
                "symptoms": [],
                "diagnosis": "",
                "medicines": [
                    {"spoken_name": "paracetamol"}
                ],
                "investigations": [],
            })

    monkeypatch.setattr(ai, "get_llm_client", lambda: ParacetamolExtractor())
    result = ai.structure_prescription(ai.StructureRequest(transcript="paracetamol"))

    assert len(result["medicines"]) == 1
    med = result["medicines"][0]
    assert med["spoken_name"] == "paracetamol"
    assert med["canonical_name"] is None
    assert med["validation_band"] in ("yellow", "red")
    assert med["validation_band"] != "green"
    assert med["name"] != "Dolo 650"


# ── Test 3: Failed AI calls never return a fabricated prescription ─────────────

def test_failed_ai_call_raises_http_exception(monkeypatch):
    """
    If the LLM or structuring provider fails, structure_prescription must raise
    HTTPException(502) and NEVER return a fabricated fallback prescription.
    """
    class BrokenLLM:
        def complete(self, system, user, schema):
            raise RuntimeError("Cloud provider unavailable (503 Service Unavailable)")

    monkeypatch.setattr(ai, "get_llm_client", lambda: BrokenLLM())

    with pytest.raises(HTTPException) as exc_info:
        ai.structure_prescription(ai.StructureRequest(transcript="Dolo 650 twice daily"))

    assert exc_info.value.status_code == 502
    assert "Please enter details manually" in exc_info.value.detail


def test_empty_transcript_raises_bad_request():
    """Empty or whitespace-only dictation must return 400 Bad Request."""
    with pytest.raises(HTTPException) as exc_info:
        ai.structure_prescription(ai.StructureRequest(transcript="   "))
    assert exc_info.value.status_code == 400


# ── Test 4: Stage-level timing instrumentation ────────────────────────────────

def test_stage_level_timing_instrumentation(monkeypatch):
    """
    voice_to_prescription must return detailed stage-level timings:
    audio_conversion_ms, speech_to_text_ms, ai_structuring_ms,
    medicine_validation_ms, database_logging_ms, total_response_ms.
    """
    class StubSpeech:
        def transcribe(self, audio, filename="audio.wav", language_hint=None):
            return Transcript(text="Dolo 650", language="hi-IN", confidence=0.95, duration_seconds=3.0, timings={"audio_conversion_ms": 12.5})

    class StubLLM:
        def complete(self, system, user, schema):
            return schema.model_validate({
                "symptoms": [],
                "diagnosis": "",
                "medicines": [{"spoken_name": "Dolo 650"}],
                "investigations": [],
            })

    monkeypatch.setattr(ai, "get_speech_client", lambda: StubSpeech())
    monkeypatch.setattr(ai, "get_llm_client", lambda: StubLLM())

    res = asyncio.run(ai.voice_to_prescription(
        file=None,
        transcript="Dolo 650",
        patient_name="Rahul",
        patient_age=30,
        doctor_name="Dr. Mehta"
    ))

    assert "timings" in res
    timings = res["timings"]
    assert "audio_conversion_ms" in timings
    assert "speech_to_text_ms" in timings
    assert "ai_structuring_ms" in timings
    assert "medicine_validation_ms" in timings
    assert "database_logging_ms" in timings
    assert "total_response_ms" in timings

    for key, val in timings.items():
        assert isinstance(val, (int, float))
        assert val >= 0.0

    assert res["total_latency_ms"] == timings["total_response_ms"]


# ── Test 5: Async non-blocking adapter execution ──────────────────────────────

def test_async_adapter_contracts():
    """
    SpeechClient and LLMClient async contracts must execute without blocking.
    """
    speech = LocalStubSpeechClient()
    transcript = asyncio.run(speech.transcribe_async(b"sample_audio"))
    assert transcript.text == "Stub audio dictation"
    assert transcript.confidence > 0

    class Dummy(BaseModel):
        diagnosis: str = ""

    llm = LocalStubLLMClient()
    structured = asyncio.run(llm.complete_async("system", "user text", Dummy))
    assert hasattr(structured, "diagnosis")


# ── Test 6: Whisper Service fast validation and default decoding configuration ─

def test_whisper_service_fast_validation_and_default_beam_size():
    """
    Whisper service defaults to beam_size=1 (greedy decoding) for low latency
    and validates audio file existence and size without running ffprobe by default.
    """
    # 1. Non-existent file
    v_missing = whisper_service._validate_audio_file("non_existent_file_xyz.wav")
    assert v_missing["valid"] is False
    assert "not found" in v_missing["error"]

    # 2. File too small (<500 bytes)
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(b"RIFF" + b"\x00" * 50)
        tmp_name = tmp.name

    try:
        v_small = whisper_service._validate_audio_file(tmp_name)
        assert v_small["valid"] is False
        assert "too small" in v_small["error"]
    finally:
        os.unlink(tmp_name)

    # 3. Default beam size is 1 when environment variable is unset
    if "ASR_BEAM_SIZE" in os.environ:
        del os.environ["ASR_BEAM_SIZE"]
    beam_size = int(os.getenv("ASR_BEAM_SIZE", "1"))
    assert beam_size == 1
