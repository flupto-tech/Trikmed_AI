"""Regression tests for the prescription persistence and authorization audit.

Covers:
  A1  add_prescription raises ValueError for missing clinic_id — no "CLN-001" fallback
  A2  add_prescription raises ValueError for missing doctor_id — no "dr001" fallback
  A3  _save_prescriptions propagates IOError as RuntimeError (save failure visible to caller)
  A4  _load_prescriptions logs parse errors and returns {} (data not silently lost)
  A5  create_prescription route continues when log_doctor_correction raises RuntimeError (demo mode)
  A6  log-correction endpoint returns success=False when in demo mode (no 500)
  A7  Full medicine fields (strength, form, symptoms, instructions, follow_up) round-trip correctly
  A8  Existing tests still pass — no unintended regressions
"""

from __future__ import annotations

import io
import json
import os
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.core.security import issue_token
from app.storage.supabase_store import SupabaseStore
from main import app


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

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
def store():
    return SupabaseStore()


# ---------------------------------------------------------------------------
# A1 — add_prescription raises ValueError for missing clinic_id
# ---------------------------------------------------------------------------

class TestAddPrescriptionRequiresClinicId:

    def test_missing_clinic_id_raises_value_error(self, store):
        """No prescription must be created when clinic_id is absent."""
        with pytest.raises(ValueError, match="clinic_id is required"):
            store.add_prescription({
                "id": "RX-AUDIT-NO-CLINIC",
                "doctor_id": "USR-DEMO-001",
                "patient_name": "Test Patient",
                "medicines": [],
            })

    def test_empty_string_clinic_id_raises_value_error(self, store):
        with pytest.raises(ValueError, match="clinic_id is required"):
            store.add_prescription({
                "id": "RX-AUDIT-EMPTY-CLINIC",
                "clinic_id": "",
                "doctor_id": "USR-DEMO-001",
            })

    def test_none_clinic_id_raises_value_error(self, store):
        with pytest.raises(ValueError, match="clinic_id is required"):
            store.add_prescription({
                "id": "RX-AUDIT-NONE-CLINIC",
                "clinic_id": None,
                "doctor_id": "USR-DEMO-001",
            })


# ---------------------------------------------------------------------------
# A2 — add_prescription raises ValueError for missing doctor_id
# ---------------------------------------------------------------------------

class TestAddPrescriptionRequiresDoctorId:

    def test_missing_doctor_id_raises_value_error(self, store):
        """No prescription must be created when doctor_id is absent."""
        with pytest.raises(ValueError, match="doctor_id is required"):
            store.add_prescription({
                "id": "RX-AUDIT-NO-DOCTOR",
                "clinic_id": "CLN-001",
                "patient_name": "Test Patient",
                "medicines": [],
            })

    def test_empty_string_doctor_id_raises_value_error(self, store):
        with pytest.raises(ValueError, match="doctor_id is required"):
            store.add_prescription({
                "id": "RX-AUDIT-EMPTY-DOCTOR",
                "clinic_id": "CLN-001",
                "doctor_id": "",
            })

    def test_none_doctor_id_raises_value_error(self, store):
        with pytest.raises(ValueError, match="doctor_id is required"):
            store.add_prescription({
                "id": "RX-AUDIT-NONE-DOCTOR",
                "clinic_id": "CLN-001",
                "doctor_id": None,
            })

    def test_valid_clinic_and_doctor_succeeds(self, store):
        """Control: a complete prescription is created successfully."""
        rx = store.add_prescription({
            "id": "RX-AUDIT-VALID-001",
            "clinic_id": "CLN-001",
            "doctor_id": "USR-DEMO-001",
            "patient_name": "Valid Patient",
        })
        assert rx["clinic_id"] == "CLN-001"
        assert rx["doctor_id"] == "USR-DEMO-001"


# ---------------------------------------------------------------------------
# A3 — _save_prescriptions propagates failures
# ---------------------------------------------------------------------------

class TestSaveFailurePropagates:

    def test_save_failure_raises_runtime_error(self, store, tmp_path):
        """A failed file write must raise RuntimeError — not silently succeed."""
        # Point the store at a path it cannot write (a directory where the file path is)
        bad_path = tmp_path / "prescriptions.json"
        bad_path.mkdir()  # Create a directory at the path — writing a file here will fail

        with patch.object(store, "_get_prescriptions_file", return_value=bad_path):
            with pytest.raises(RuntimeError, match="Local prescription save failed"):
                store._save_prescriptions({"RX-TEST": {"id": "RX-TEST"}})

    def test_add_prescription_failure_propagates(self, store):
        """add_prescription must propagate a save failure so the caller cannot report success."""
        with patch.object(store, "_save_prescriptions", side_effect=RuntimeError("disk full")):
            with pytest.raises(RuntimeError, match="disk full"):
                store.add_prescription({
                    "id": "RX-SAVE-FAIL-001",
                    "clinic_id": "CLN-001",
                    "doctor_id": "USR-DEMO-001",
                })

    def test_approve_prescription_save_failure_propagates(self, store):
        """approve_prescription must propagate a save failure."""
        store.add_prescription({
            "id": "RX-APPROVE-SAVE-FAIL",
            "clinic_id": "CLN-001",
            "doctor_id": "USR-DEMO-001",
            "patient_name": "Test Patient",
        })

        with patch.object(store, "_save_prescriptions", side_effect=RuntimeError("write error on approval")):
            with pytest.raises(RuntimeError, match="write error on approval"):
                store.approve_prescription("RX-APPROVE-SAVE-FAIL", "CLN-001", "USR-DEMO-001")


# ---------------------------------------------------------------------------
# A4 — _load_prescriptions logs parse errors and returns {}
# ---------------------------------------------------------------------------

class TestLoadPrescriptionsCorruption:

    def test_corrupted_json_returns_empty_dict_and_logs(self, store, tmp_path, caplog):
        """A corrupted prescriptions.json must log an error and return {} — not raise."""
        bad_file = tmp_path / "prescriptions.json"
        bad_file.write_text("this is not valid json{{{", encoding="utf-8")

        import logging
        with patch.object(store, "_get_prescriptions_file", return_value=bad_file):
            with caplog.at_level(logging.ERROR):
                result = store._load_prescriptions()

        assert result == {}, "Corrupted file must return empty dict, not raise"
        assert any("Failed to parse prescriptions file" in r.message for r in caplog.records), (
            "A parse failure must be logged at ERROR level"
        )


# ---------------------------------------------------------------------------
# A5 — create_prescription route handles demo-mode log_doctor_correction gracefully
# ---------------------------------------------------------------------------

class TestCreatePrescriptionDemoModeCorrections:

    def test_create_with_corrected_medicine_in_demo_mode_succeeds(self, client, doctor_headers):
        """When log_doctor_correction raises RuntimeError (demo mode), prescription creation
        must still succeed — the correction logging is advisory, not mandatory."""
        payload = {
            "id": "RX-DEMO-CORRECTION-01",
            "patient_name": "Test Patient",
            "medicines": [
                {
                    "raw_name": "paracetamol",
                    "brandName": "Dolo 650",
                    "name": "Dolo 650",
                }
            ],
        }
        # Patch log_doctor_correction to simulate demo-mode RuntimeError
        with patch(
            "app.api.routes.prescriptions.supabase_drug_client.log_doctor_correction",
            side_effect=RuntimeError("log_doctor_correction: blocked in demo mode"),
        ):
            resp = client.post("/prescriptions", json=payload, headers=doctor_headers)

        assert resp.status_code == 200, (
            f"Prescription creation must succeed even when log_doctor_correction raises "
            f"(demo mode). Got {resp.status_code}: {resp.text}"
        )
        data = resp.json()
        assert data.get("clinic_id") == "CLN-001"
        assert data.get("is_approved") is False


# ---------------------------------------------------------------------------
# A6 — log-correction endpoint returns success=False in demo mode (no 500)
# ---------------------------------------------------------------------------

class TestLogCorrectionEndpointDemoMode:

    def test_log_correction_demo_mode_returns_success_false(self, client, doctor_headers):
        """In demo mode, log-correction must return {success: false} not a 500 error."""
        with patch(
            "app.api.routes.prescriptions.supabase_drug_client.log_doctor_correction",
            side_effect=RuntimeError("log_doctor_correction: blocked in demo mode"),
        ):
            resp = client.post(
                "/prescriptions/RX-ANY/log-correction",
                json={"original_text": "paracetamol", "corrected_text": "Dolo 650", "item_type": "drug"},
                headers=doctor_headers,
            )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        assert resp.json().get("success") is False


# ---------------------------------------------------------------------------
# A7 — Medicine fields round-trip correctly (strength, form, symptoms, instructions, follow_up)
# ---------------------------------------------------------------------------

class TestPrescriptionFieldPreservation:

    FULL_RX = {
        "id": "RX-FIELD-ROUNDTRIP-01",
        "clinic_id": "CLN-001",
        "doctor_id": "USR-DEMO-001",
        "patient_name": "Field Test Patient",
        "patient_age": 35,
        "patient_gender": "male",
        "symptoms": ["fever", "cough"],
        "diagnosis": ["Viral URTIs"],
        "medicines": [
            {
                "brandName": "Dolo 650",
                "name": "Dolo 650",
                "strength": "650mg",
                "form": "tablet",
                "dosage": "1-0-1",
                "timing": "After food",
                "duration": "5 days",
                "instructions": "Avoid alcohol",
            }
        ],
        "tests": [{"name": "CBC"}],
        "instructions": {"general": "Rest and hydration"},
        "follow_up": "7 days",
        "follow_up_date": "2026-10-20",
        "vitals": {"bp": "120/80", "temp": "99.1F"},
    }

    def test_all_fields_preserved_after_add(self, store):
        rx = store.add_prescription(self.FULL_RX)

        assert rx["symptoms"] == ["fever", "cough"]
        assert rx["diagnosis"] == ["Viral URTIs"]
        assert rx["follow_up"] == "7 days"
        assert rx["follow_up_date"] == "2026-10-20"
        assert rx["instructions"] == {"general": "Rest and hydration"}
        assert rx["vitals"] == {"bp": "120/80", "temp": "99.1F"}

        med = rx["medicines"][0]
        assert med["strength"] == "650mg"
        assert med["form"] == "tablet"
        assert med["dosage"] == "1-0-1"
        assert med["timing"] == "After food"
        assert med["duration"] == "5 days"

    def test_all_fields_survive_restart(self, store):
        """Fields must survive a simulated backend restart (new store instance)."""
        store.add_prescription(self.FULL_RX)

        store2 = SupabaseStore()
        rx = store2.get_prescription("RX-FIELD-ROUNDTRIP-01", clinic_id="CLN-001")
        assert rx is not None
        assert rx["symptoms"] == ["fever", "cough"]
        assert rx["follow_up"] == "7 days"
        med = rx["medicines"][0]
        assert med["strength"] == "650mg"
        assert med["form"] == "tablet"

    def test_approved_fields_preserved_after_approval(self, store):
        """Approval must not strip medicine or clinical fields."""
        store.add_prescription(self.FULL_RX)
        approved = store.approve_prescription(
            "RX-FIELD-ROUNDTRIP-01", "CLN-001", "USR-DEMO-001"
        )
        assert approved["is_approved"] is True
        assert approved["symptoms"] == ["fever", "cough"]
        med = approved["medicines"][0]
        assert med["strength"] == "650mg"
