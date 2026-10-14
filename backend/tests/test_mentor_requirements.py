from __future__ import annotations

import os
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from main import app
from app.ai.adapter import DeIdentifier, LocalStubSpeechClient, get_llm_client
from app.services.ai_cost_logger import ai_cost_logger
from app.services.drug_validator import drug_validator
from app.storage.supabase_store import SupabaseStore, DEMO_USERS
from app.core.security import issue_token


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def doctor_headers():
    token = issue_token({
        "sub": "USR-DEMO-001",
        "role": "clinic",
        "clinic_id": "CLN-001",
        "clinic_role": "doctor_owner",
    })
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def receptionist_headers():
    token = issue_token({
        "sub": "USR-DEMO-003",
        "role": "clinic",
        "clinic_id": "CLN-001",
        "clinic_role": "receptionist",
    })
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Requirement 1: Authentication for every /ai route
# ---------------------------------------------------------------------------
def test_ai_routes_require_authentication(client):
    """Every /ai route must reject unauthenticated requests with 401."""
    resp1 = client.post("/ai/structure-prescription", json={"transcript": "Tab Paracetamol 500mg"})
    assert resp1.status_code == 401, f"Expected 401, got {resp1.status_code}"

    resp2 = client.post("/ai/transcribe", json={"audio_url": "https://example.com/audio.mp3"})
    assert resp2.status_code == 401, f"Expected 401, got {resp2.status_code}"

    resp3 = client.post("/ai/voice-to-prescription", data={"transcript": "Tab Paracetamol 500mg"})
    assert resp3.status_code == 401, f"Expected 401, got {resp3.status_code}"


def test_ai_routes_accept_valid_token(client, doctor_headers):
    """Authenticated clinic users can access /ai routes."""
    resp = client.post(
        "/ai/structure-prescription",
        json={"transcript": "Dolo 650 1-0-1 for 3 days"},
        headers=doctor_headers
    )
    assert resp.status_code in {200, 502}  # Either parsed or safe 502, never 401


# ---------------------------------------------------------------------------
# Requirement 2: Remove unsafe fallback parsers & fail safely on AI errors
# ---------------------------------------------------------------------------
def test_ai_prescription_fails_safely_when_llm_fails(client, doctor_headers):
    """When LLM completes with an error, the service must raise 502 rather than fabricating diagnoses or meds."""
    with patch("app.api.routes.ai.get_llm_client") as mock_get_llm:
        mock_llm = mock_get_llm.return_value
        mock_llm.complete.side_effect = RuntimeError("OpenAI API rate limit exceeded")

        resp = client.post(
            "/ai/structure-prescription",
            json={"transcript": "Patient with unknown symptoms"},
            headers=doctor_headers
        )
        assert resp.status_code == 502
        data = resp.json()
        assert "AI prescription structuring service failed" in data.get("detail", "")


def test_stub_speech_does_not_fabricate_prescriptions():
    """LocalStubSpeechClient must return empty / generic transcription, not hallucinated prescriptions."""
    stub = LocalStubSpeechClient()
    result = stub.transcribe(b"dummy audio data")
    assert "Dolo 650" not in result
    assert "Amoxicillin" not in result


# ---------------------------------------------------------------------------
# Requirement 3: Enforce safe drug matching
# ---------------------------------------------------------------------------
def test_drug_matching_never_substitutes_strength():
    """Uncertain matches must not silently substitute a different strength."""
    # Thyronorm with non-existent strength
    val = drug_validator.validate_medicine_name("Thyronorm 999mg")
    if val.get("band") == "yellow":
        # Must require confirmation, not green
        assert val.get("status") == "needs_confirmation"
        # Spoken strength must not be silently replaced
        assert "999" in (val.get("matched_name") or "")


# ---------------------------------------------------------------------------
# Requirement 4: Doctor-only approval & block printing / WhatsApp until approval
# ---------------------------------------------------------------------------
def test_doctor_only_prescription_approval(client, doctor_headers, receptionist_headers):
    """Only doctors may approve prescriptions; staff/receptionists receive 403."""
    store = SupabaseStore()
    rx = store.add_prescription({
        "id": "rx-auth-test-01",
        "clinic_id": "CLN-001",
        "doctor_id": "USR-DEMO-001",
        "is_approved": False,
        "patient_name": "Test Patient",
        "patient_phone": "9876543210",
    })

    # Receptionist attempts approval -> 403 Forbidden
    resp_rec = client.post(f"/prescriptions/{rx['id']}/approve", headers=receptionist_headers)
    assert resp_rec.status_code == 403, f"Expected 403 for receptionist approval, got {resp_rec.status_code}"

    # Doctor attempts approval -> 200 OK
    resp_doc = client.post(f"/prescriptions/{rx['id']}/approve", headers=doctor_headers)
    assert resp_doc.status_code == 200
    rx_approved = resp_doc.json().get("prescription", {})
    assert rx_approved.get("is_approved") is True
    assert rx_approved.get("status") == "approved"
    assert rx_approved.get("approved_by") == "USR-DEMO-001"
    assert rx_approved.get("approved_at") is not None
    assert rx_approved.get("rx_token", "").startswith("RX-")
    assert rx_approved.get("updated_at") is not None


def test_approve_nonexistent_prescription_returns_404(client, doctor_headers):
    """approve_prescription must NEVER create a prescription if it does not exist; returns 404."""
    resp = client.post("/prescriptions/nonexistent-rx-99999/approve", headers=doctor_headers)
    assert resp.status_code == 404
    assert "not found" in resp.json().get("detail", "").lower()

    # Also verify store layer raises KeyError directly
    store = SupabaseStore()
    with pytest.raises(KeyError):
        store.approve_prescription("nonexistent-rx-99999", "CLN-001", "USR-DEMO-001")


def test_approve_cross_clinic_prescription_returns_403(client, doctor_headers):
    """Approving a prescription belonging to another clinic must be denied with 403."""
    store = SupabaseStore()
    other_rx = store.add_prescription({
        "id": "rx-other-clinic-01",
        "clinic_id": "CLN-999",
        "doctor_id": "dr999",
        "patient_name": "Other Clinic Patient",
        "is_approved": False,
    })

    # Doctor belongs to CLN-001, attempts to approve CLN-999 rx -> 403
    resp = client.post(f"/prescriptions/{other_rx['id']}/approve", headers=doctor_headers)
    assert resp.status_code == 403
    assert "denied" in resp.json().get("detail", "").lower()

    # Store layer directly raises PermissionError
    with pytest.raises(PermissionError):
        store.approve_prescription("rx-other-clinic-01", "CLN-001", "USR-DEMO-001")


def test_supabase_write_failure_propagates_error(client, doctor_headers):
    """Supabase write failures during create or approve must NOT be swallowed; must raise clear errors."""
    store = SupabaseStore()
    store._is_demo = False  # Enable non-demo mode

    # 1. Supabase failure during creation
    with patch.object(store.client, "post") as mock_post:
        mock_post.return_value.status_code = 500
        mock_post.return_value.text = "Internal Postgres Database Error"
        with pytest.raises(RuntimeError) as exc_info:
            store.add_prescription({
                "id": "rx-fail-create-01",
                "clinic_id": "CLN-001",
                "doctor_id": "USR-DEMO-001",
            })
        assert "Database error persisting prescription" in str(exc_info.value)

    # 2. Add an unapproved rx in demo mode for testing approval failure
    store._is_demo = True
    rx = store.add_prescription({
        "id": "rx-fail-approve-01",
        "clinic_id": "CLN-001",
        "doctor_id": "USR-DEMO-001",
        "is_approved": False,
    })

    # Now test approval write failure in non-demo mode
    store._is_demo = False
    with patch.object(store, "_select", return_value=[rx]), patch.object(store.client, "patch") as mock_patch:
        mock_patch.return_value.status_code = 503
        mock_patch.return_value.text = "Database connection timeout"
        with pytest.raises(RuntimeError) as exc_info:
            store.approve_prescription(rx["id"], "CLN-001", "USR-DEMO-001")
        assert "Database error approving prescription" in str(exc_info.value)


def test_block_printing_and_whatsapp_until_approved(client, doctor_headers):
    """WhatsApp sharing and printing must fail with 400 for unapproved prescriptions."""
    store = SupabaseStore()
    rx = store.add_prescription({
        "id": "rx-unapproved-gate-02",
        "clinic_id": "CLN-001",
        "doctor_id": "USR-DEMO-001",
        "is_approved": False,
        "patient_name": "Unapproved Patient",
        "patient_phone": "9876543210",
    })

    # WhatsApp before approval -> 400 Bad Request
    resp_wa = client.post(f"/prescriptions/{rx['id']}/send-whatsapp", headers=doctor_headers)
    assert resp_wa.status_code == 400
    assert "approved" in resp_wa.json().get("detail", "").lower()

    # Print before approval -> 400 Bad Request
    resp_print = client.get(f"/prescriptions/{rx['id']}/print", headers=doctor_headers)
    assert resp_print.status_code == 400
    assert "approved" in resp_print.json().get("detail", "").lower()

    # Now approve prescription
    appr_resp = client.post(f"/prescriptions/{rx['id']}/approve", headers=doctor_headers)
    assert appr_resp.status_code == 200

    # WhatsApp after approval -> 200 OK
    resp_wa_ok = client.post(f"/prescriptions/{rx['id']}/send-whatsapp", headers=doctor_headers)
    assert resp_wa_ok.status_code == 200
    assert resp_wa_ok.json().get("success") is True

    # Print after approval -> 200 OK
    resp_print_ok = client.get(f"/prescriptions/{rx['id']}/print", headers=doctor_headers)
    assert resp_print_ok.status_code == 200
    assert resp_print_ok.json().get("prescription", {}).get("is_approved") is True


def test_missing_identity_fields_rejected_by_approval(client):
    """Approval must reject users with missing clinic_id or user id, never inventing fallback identities."""
    # User in store with missing clinic_id
    token_no_clinic = issue_token({
        "sub": "USR-DEMO-NOCLINIC",
        "role": "clinic",
        "clinic_role": "doctor",
    })
    resp_no_clinic = client.post(
        "/prescriptions/rx-any/approve",
        headers={"Authorization": f"Bearer {token_no_clinic}"}
    )
    assert resp_no_clinic.status_code == 403
    assert "clinic identity missing" in resp_no_clinic.json().get("detail", "").lower()


def test_unauthenticated_and_cross_clinic_sharing_and_printing(client, doctor_headers):
    """send-whatsapp and print must require authentication and reject cross-clinic access."""
    store = SupabaseStore()
    # Prescription belonging to Clinic 999
    other_rx = store.add_prescription({
        "id": "rx-clinic-999-share-01",
        "clinic_id": "CLN-999",
        "doctor_id": "dr999",
        "is_approved": True,
        "patient_name": "Clinic 999 Patient",
    })

    # 1. Unauthenticated requests rejected with 401
    resp_wa_unauth = client.post(f"/prescriptions/{other_rx['id']}/send-whatsapp")
    assert resp_wa_unauth.status_code == 401

    resp_print_unauth = client.get(f"/prescriptions/{other_rx['id']}/print")
    assert resp_print_unauth.status_code == 401

    # 2. Doctor from CLN-001 attempting to access CLN-999's prescription -> 403 Forbidden
    resp_wa_cross = client.post(
        f"/prescriptions/{other_rx['id']}/send-whatsapp",
        headers=doctor_headers
    )
    assert resp_wa_cross.status_code == 403
    assert "cross-clinic" in resp_wa_cross.json().get("detail", "").lower()

    resp_print_cross = client.get(
        f"/prescriptions/{other_rx['id']}/print",
        headers=doctor_headers
    )
    assert resp_print_cross.status_code == 403
    assert "cross-clinic" in resp_print_cross.json().get("detail", "").lower()


# ---------------------------------------------------------------------------
# Requirement 5 & 8: Prescription persistence survives backend restart
# ---------------------------------------------------------------------------
def test_prescription_persistence_across_backend_restart():
    """Prescriptions must persist across fresh SupabaseStore instances (simulated restart)."""
    rx_id = "rx-persist-test-03"
    
    # Store instance A creates prescription
    store_a = SupabaseStore()
    store_a.add_prescription({
        "id": rx_id,
        "clinic_id": "CLN-001",
        "doctor_id": "USR-DEMO-001",
        "patient_name": "Persistent Patient",
        "diagnosis": ["Viral Pharyngitis"],
        "medicines": [{"brandName": "Dolo 650", "dose": "650mg"}],
        "is_approved": False,
    })

    # Simulate backend restart with Store instance B
    store_b = SupabaseStore()
    rx_from_b = store_b.get_prescription(rx_id, clinic_id="CLN-001")
    assert rx_from_b is not None
    assert rx_from_b["patient_name"] == "Persistent Patient"
    assert rx_from_b["is_approved"] is False

    # Store instance B approves prescription
    store_b.approve_prescription(rx_id, "CLN-001", "USR-DEMO-001")

    # Simulate another backend restart with Store instance C
    store_c = SupabaseStore()
    rx_from_c = store_c.get_prescription(rx_id, clinic_id="CLN-001")
    assert rx_from_c is not None
    assert rx_from_c["is_approved"] is True
    assert rx_from_c.get("rx_token", "").startswith("RX-")

    # Verify historical suggestion query survives
    history = store_c.get_historical_prescriptions("CLN-001", "USR-DEMO-001", "Viral Pharyngitis")
    assert any(h["id"] == rx_id for h in history)


# ---------------------------------------------------------------------------
# Requirement 7: Privacy scrubbing (Aadhaar, phone, email) & AI cost logging
# ---------------------------------------------------------------------------
def test_privacy_scrubbing_aadhaar_phone_email():
    """DeIdentifier must scrub Aadhaar, Indian phone numbers, and emails."""
    text = (
        "Patient Rahul Sharma, phone 9876543210 and +91 9123456789, "
        "Aadhaar 1234 5678 9012, email rahul.sharma@example.com."
    )
    scrubbed = DeIdentifier.scrub_text(text)
    assert "9876543210" not in scrubbed
    assert "9123456789" not in scrubbed
    assert "1234 5678 9012" not in scrubbed
    assert "rahul.sharma@example.com" not in scrubbed
    assert "[PHONE_NUMBER]" in scrubbed
    assert "[AADHAAR_NUMBER]" in scrubbed
    assert "[EMAIL_ADDRESS]" in scrubbed


def test_ai_cost_logger_tracks_calls():
    """ai_cost_logger must correctly record token usage and cost metrics."""
    initial_calls = len(ai_cost_logger.get_cost_logs())
    rec = ai_cost_logger.log_llm_cost(
        model="gpt-4o-mini",
        prompt_tokens=100,
        completion_tokens=50,
        latency_ms=120.0,
        success=True
    )
    logs = ai_cost_logger.get_cost_logs()
    assert len(logs) == initial_calls + 1
    last = logs[-1]
    assert last["model"] == "gpt-4o-mini"
    assert last["prompt_tokens"] == 100
    assert last["completion_tokens"] == 50
    assert last["cost_usd"] > 0
    assert last["cost_inr"] > 0

    summary = ai_cost_logger.get_cost_summary()
    assert summary["total_calls"] >= 1
    assert summary["total_tokens"] >= 150


# ---------------------------------------------------------------------------
# Requirement 9: Preserving lab test functionality
# ---------------------------------------------------------------------------
def test_lab_test_validation_preserved():
    """Lab test matcher and extractor must remain functional."""
    val = drug_validator.validate_lab_test("Complete Blood Count")
    assert val["band"] == "green"
    assert "CBC" in val["matched_name"] or "Complete Blood Count" in val["matched_name"]

    extracted = drug_validator.extract_lab_tests("Check CBC and Fasting Blood Sugar")
    assert len(extracted) >= 1
