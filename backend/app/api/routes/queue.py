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


router = APIRouter(tags=["Queue"])


@router.get("/queue/today")
def today_queue(current_user: dict[str, Any] = Depends(require_clinic_user)) -> list[dict[str, Any]]:
    clinic_id = current_user["clinic_id"]
    today = datetime.now(timezone.utc).date().isoformat()
    patients = store.list_patients(clinic_id)
    patients_by_id = {p.get("id"): p for p in patients}
    rows = [
        queue_row(appointment, patients_by_id.get(appointment.get("patientId") or appointment.get("patient_id")))
        for appointment in store.list_appointments(clinic_id, date=today)
    ]
    return sorted(rows, key=queue_sort_token)


@router.post("/queue/walkin")
def create_walkin(payload: WalkInRequest, current_user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    phone = require_valid_phone(payload.phone)
    clinic_id = current_user["clinic_id"]
    patient_name = payload.name.strip()
    if not patient_name:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Patient name is required")

    appointment_date = payload.appointmentDate or datetime.now(timezone.utc).date().isoformat()
    appointment_time = payload.appointmentTime or datetime.now().strftime("%H:%M")
    token = next_token(clinic_id, appointment_date)
    patient = store.add_or_update_patient(
        {
            "id": (store.find_patient_by_phone(clinic_id, phone) or {}).get("id") or f"PAT-{uuid4().hex[:8].upper()}",
            "clinic_id": clinic_id,
            "name": patient_name,
            "phone": phone,
            "age": payload.age,
            "gender": payload.gender or "",
            "address": (payload.address or "").strip(),
            "emergency": (payload.emergency or "").strip(),
            "created_at": now_iso(),
        }
    )

    payment_status = "free" if (payload.paymentAmount or 0) <= 0 and payload.paymentMode != "skip" else "pending" if payload.paymentMode == "skip" else "paid"
    appointment = store.add_appointment(
        {
            "id": f"APT-{uuid4().hex[:8].upper()}",
            "clinic_id": clinic_id,
            "patientId": patient["id"],
            "patientName": patient["name"],
            "patientPhone": phone,
            "doctorId": payload.doctorId or "",
            "date": appointment_date,
            "time": appointment_time,
            "token": token,
            "tokenNum": token,
            "type": "Walk-in",
            "source": "walkin",
            "reason": (payload.complaint or "").strip() or "General consultation",
            "status": "confirmed",
            "queueStatus": "paid" if payment_status in {"paid", "free"} else "booked",
            "vitals": payload.vitals,
            "vitalsEnteredAt": now_iso() if any(payload.vitals.values()) else None,
            "paymentAmount": payload.paymentAmount if payment_status == "paid" else None,
            "notes": f"Emergency contact: {payload.emergency.strip()}" if payload.emergency else "",
            "created_at": now_iso(),
            "created_by": current_user["id"],
        }
    )

    payment = store.add_payment(
        {
            "id": f"PAY-{uuid4().hex[:8].upper()}",
            "clinic_id": clinic_id,
            "patientId": patient["id"],
            "appointmentId": appointment["id"],
            "date": appointment_date,
            "amount": payload.paymentAmount or 0,
            "mode": payload.paymentMode,
            "status": payment_status,
            "consultationType": payload.consultationType or "new",
            "receivedBy": current_user["id"],
            "created_at": now_iso(),
        }
    )
    store.add_activity(clinic_id, current_user["id"], current_user["name"], current_user.get("clinic_role", "clinic"), f"Added walk-in: {patient_name}")
    return {"patient": patient, "appointment": appointment, "payment": payment}


@router.post("/queue/{appointment_id}/complete")
def complete_queue_item(
    appointment_id: str,
    payload: dict[str, Any],
    current_user: dict[str, Any] = Depends(require_clinic_user),
) -> dict[str, Any]:
    appts = store.list_appointments(current_user["clinic_id"])
    appt = next((a for a in appts if a.get("id") == appointment_id), None)
    if not appt:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    changes: dict[str, Any] = {"queueStatus": "completed", "status": "done", "completedAt": now_iso()}
    if payload.get("paymentAmount") is not None:
        changes["paymentAmount"] = payload["paymentAmount"]
    return store.update_appointment(appointment_id, changes)


@router.post("/queue/session/start")
def start_session(current_user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    session_id = f"SES-{uuid4().hex[:8].upper()}"
    store.update_clinic(current_user["clinic_id"], {"active_session_id": session_id, "session_started_at": now_iso()})
    return {"sessionId": session_id, "startedAt": now_iso()}


@router.post("/queue/session/end")
def end_session(current_user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    store.update_clinic(current_user["clinic_id"], {"active_session_id": None, "session_ended_at": now_iso()})
    return {"sessionId": None, "endedAt": now_iso()}


# ── Single Patient & Sub-Resources ────────────────────────────────────────────

