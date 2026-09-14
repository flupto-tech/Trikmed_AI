from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies.auth import (
    auth_response,
    get_current_user,
    require_clinic_user,
    require_portal_user,
    require_staff_admin,
    store,
)
from app.api.routes._helpers import clinic_payload, next_token, queue_row, queue_sort_token
from app.core.security import hash_password, verify_password
from app.schemas.api import (
    ClinicRequest,
    DemoRequest,
    LoginRequest,
    MRBlockBody,
    MRCreateBody,
    MRUpdateBody,
    PermissionsRequest,
    SignupRequest,
    StaffCreateRequest,
    StaffLoginRequest,
    StaffUpdateRequest,
    WalkInRequest,
)
from app.utils.phone import normalize_phone, require_valid_phone
from app.utils.time import now_iso
from app.utils.users import public_user


router = APIRouter(tags=["Patients"])


@router.get("/patients")
def list_patients(current_user: dict[str, Any] = Depends(require_clinic_user)) -> list[dict[str, Any]]:
    return store.list_patients(current_user["clinic_id"])


@router.get("/patients/{patient_id}")
def get_patient(patient_id: str, current_user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    patient = next((p for p in store.list_patients(current_user["clinic_id"]) if p.get("id") == patient_id), None)
    if not patient:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


@router.get("/patients/{patient_id}/appointments")
def patient_appointments(patient_id: str, current_user: dict[str, Any] = Depends(require_clinic_user)) -> list[dict[str, Any]]:
    return [a for a in store.list_appointments(current_user["clinic_id"]) if a.get("patientId") == patient_id]


@router.get("/patients/{patient_id}/prescriptions")
def patient_prescriptions(patient_id: str, current_user: dict[str, Any] = Depends(require_clinic_user)) -> list[dict[str, Any]]:
    return []


# ── Prescriptions ─────────────────────────────────────────────────────────────

