from __future__ import annotations

import asyncio
import uuid
import pytest
from fastapi import HTTPException
from pydantic import BaseModel

from app.api.routes import ai
from app.api.routes.ai import IncrementalStructureRequest, structure_transcript_incremental


class StubIncrementalLLM:
    """Returns grounded extractions based on transcript contents without hallucinating."""

    async def complete_async(self, system: str, user: str, schema: type[BaseModel]):
        meds = []
        user_lower = user.lower()

        if "paracetamol" in user_lower:
            dose = "500 mg" if "500" in user_lower else ("650 mg" if "650" in user_lower else None)
            freq = "1-0-1" if ("subah shaam" in user_lower or "1-0-1" in user_lower) else None
            timing = "After food" if "khane ke baad" in user_lower else None
            meds.append({
                "spoken_name": "paracetamol",
                "dose": dose,
                "frequency": freq,
                "timing": timing,
                "duration": "3 days" if "3 din" in user_lower else None,
                "after_food": True if timing == "After food" else None,
            })

        if "amoxicillin" in user_lower:
            meds.append({
                "spoken_name": "amoxicillin",
                "dose": "500 mg" if "500" in user_lower else None,
                "frequency": "1-1-1" if "din mein teen baar" in user_lower else None,
                "duration": "5 days" if "5 din" in user_lower else None,
            })

        symptoms = []
        if "bukhar" in user_lower or "fever" in user_lower:
            symptoms.append("Fever")
        if "gala kharab" in user_lower or "sore throat" in user_lower:
            symptoms.append("Sore Throat")

        diagnosis = "Upper Respiratory Tract Infection" if "urti" in user_lower else ""

        return schema.model_validate({
            "symptoms": symptoms,
            "diagnosis": diagnosis,
            "medicines": meds,
            "investigations": [],
            "advice": [],
            "follow_up": [],
            "notes": "",
        })


def test_incremental_endpoint_requires_valid_session_id():
    """Session ID must be a valid UUID string to prevent request collision."""
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(structure_transcript_incremental(IncrementalStructureRequest(
            session_id="not-a-uuid",
            transcript="Patient has high fever and cough for two days",
        )))
    assert exc_info.value.status_code == 400
    assert "UUID" in exc_info.value.detail


def test_incremental_endpoint_rejects_empty_or_too_short_transcript():
    """Empty or very short transcripts (<20 chars) are rejected to save LLM roundtrips."""
    valid_sid = str(uuid.uuid4())

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(structure_transcript_incremental(IncrementalStructureRequest(
            session_id=valid_sid,
            transcript="   ",
        )))
    assert exc_info.value.status_code == 400

    with pytest.raises(HTTPException) as exc_info2:
        asyncio.run(structure_transcript_incremental(IncrementalStructureRequest(
            session_id=valid_sid,
            transcript="short",
        )))
    assert exc_info2.value.status_code == 400
    assert "too short" in exc_info2.value.detail


def test_incremental_delta_detection_skips_processing(monkeypatch):
    """When transcript matches prev_transcript, LLM is bypassed and unchanged=True is returned."""
    valid_sid = str(uuid.uuid4())
    same_text = "Patient has acute fever and needs paracetamol 650 mg"

    called = False
    class FailingLLM:
        async def complete_async(self, *args, **kwargs):
            nonlocal called
            called = True
            raise RuntimeError("Should not be called")

    monkeypatch.setattr(ai, "get_llm_client", lambda: FailingLLM())

    result = asyncio.run(structure_transcript_incremental(IncrementalStructureRequest(
        session_id=valid_sid,
        transcript=same_text,
        prev_transcript=same_text,
    )))

    assert result["unchanged"] is True
    assert result["session_id"] == valid_sid
    assert called is False


def test_incremental_progressive_structuring(monkeypatch):
    """Progressive structuring extracts medicines and symptoms incrementally."""
    monkeypatch.setattr(ai, "get_llm_client", lambda: StubIncrementalLLM())
    valid_sid = str(uuid.uuid4())

    # Step 1: Doctor dictates symptom and first medicine
    step1_text = "bukhar hai paracetamol 500 subah shaam khane ke baad"
    res1 = asyncio.run(structure_transcript_incremental(IncrementalStructureRequest(
        session_id=valid_sid,
        transcript=step1_text,
        prev_transcript="",
        is_final=False,
    )))

    assert res1["session_id"] == valid_sid
    assert res1["is_final"] is False
    assert "Fever" in res1["symptoms"]
    assert len(res1["medicines"]) == 1
    med1 = res1["medicines"][0]
    assert med1["spoken_name"] == "paracetamol"
    assert med1["dose"] == "500 mg"
    assert med1["frequency"] == "1-0-1"
    # Doctor confirmed must ALWAYS be false
    assert med1.get("doctor_confirmed") is not True

    # Step 2: Doctor continues speaking and adds amoxicillin
    step2_text = "bukhar hai paracetamol 500 subah shaam khane ke baad amoxicillin 500 din mein teen baar 5 din tak"
    res2 = asyncio.run(structure_transcript_incremental(IncrementalStructureRequest(
        session_id=valid_sid,
        transcript=step2_text,
        prev_transcript=step1_text,
        is_final=False,
    )))

    assert res2["is_final"] is False
    assert len(res2["medicines"]) == 2
    names = [m["spoken_name"] for m in res2["medicines"]]
    assert "paracetamol" in names
    assert "amoxicillin" in names


def test_incremental_no_fabricated_fallbacks_on_failure(monkeypatch):
    """If the LLM fails during incremental processing, 502 is raised and no fake prescription is generated."""
    class FailingLLM:
        async def complete_async(self, *args, **kwargs):
            raise ConnectionError("Upstream LLM timeout")

    monkeypatch.setattr(ai, "get_llm_client", lambda: FailingLLM())

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(structure_transcript_incremental(IncrementalStructureRequest(
            session_id=str(uuid.uuid4()),
            transcript="Patient needs urgent paracetamol and rest",
        )))

    assert exc_info.value.status_code == 502
    assert "structuring" in exc_info.value.detail.lower()


def test_voice_to_prescription_backward_compatibility(monkeypatch):
    """The existing non-streaming voice_to_prescription endpoint remains fully functional and backward-compatible."""
    monkeypatch.setattr(ai, "get_llm_client", lambda: StubIncrementalLLM())

    res = asyncio.run(ai.voice_to_prescription(
        file=None,
        transcript="paracetamol 650 subah shaam khane ke baad",
        patient_name="Ramesh",
        patient_age=45,
    ))

    assert res["patient_name"] == "Ramesh"
    assert res["age"] == 45
    assert len(res["medicines"]) == 1
    assert res["medicines"][0]["spoken_name"] == "paracetamol"
    assert "timings" in res
    assert "total_response_ms" in res["timings"]
