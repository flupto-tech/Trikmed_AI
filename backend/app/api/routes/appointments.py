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


router = APIRouter(tags=["Appointments"])


@router.get("/appointments")
def list_appointments(date: str | None = Query(default=None), current_user: dict[str, Any] = Depends(require_clinic_user)) -> list[dict[str, Any]]:
    return store.list_appointments(current_user["clinic_id"], date=date)


@router.patch("/appointments/{appointment_id}")
def update_appointment(appointment_id: str, payload: dict[str, Any], current_user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    appointment = next((a for a in store.list_appointments(current_user["clinic_id"]) if a.get("id") == appointment_id), None)
    if not appointment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return store.update_appointment(appointment_id, payload)


@router.post("/appointments")
def create_appointment(payload: dict[str, Any], current_user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    clinic_id = current_user["clinic_id"]
    phone = require_valid_phone(payload.get("phone") or "0000000000")
    patient_name = (payload.get("patientName") or "").strip() or "Unknown Patient"
    appointment_date = payload.get("date") or datetime.now(timezone.utc).date().isoformat()
    appointment_time = payload.get("time") or "09:00"
    token = next_token(clinic_id, appointment_date)
    patient = store.add_or_update_patient({
        "id": (store.find_patient_by_phone(clinic_id, phone) or {}).get("id") or f"PAT-{uuid4().hex[:8].upper()}",
        "clinic_id": clinic_id,
        "name": patient_name,
        "phone": phone,
        "created_at": now_iso(),
    })
    appointment = store.add_appointment({
        "id": f"APT-{uuid4().hex[:8].upper()}",
        "clinic_id": clinic_id,
        "patientId": patient["id"],
        "patientName": patient_name,
        "patientPhone": phone,
        "date": appointment_date,
        "time": appointment_time,
        "token": token,
        "tokenNum": token,
        "type": payload.get("type") or "Appointment",
        "source": "dashboard",
        "reason": (payload.get("reason") or "").strip() or "General consultation",
        "status": "confirmed",
        "queueStatus": "booked",
        "paymentAmount": None,
        "created_at": now_iso(),
        "created_by": current_user["id"],
    })
    return appointment


# ── Queue Complete & Session ──────────────────────────────────────────────────

