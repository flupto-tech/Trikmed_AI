from __future__ import annotations

from typing import Any
from uuid import uuid4

from app.api.dependencies.auth import store
from app.schemas.api import ClinicRequest
from app.utils.phone import normalize_phone
from app.utils.time import now_iso


def clinic_payload(payload: ClinicRequest, status_default: str = "pending_approval") -> dict[str, Any]:
    clinic_id = payload.id or f"CLN-{uuid4().hex[:6].upper()}"
    clinic_name = payload.clinic_name or payload.clinicName or "New Clinic"
    doctor_name = payload.doctor_name or payload.doctorName or clinic_name
    phone = normalize_phone(payload.contact_phone or payload.phone or "")
    plan = payload.plan_type or payload.plan or "Growth"
    return {
        "id": clinic_id,
        "clinic_name": clinic_name,
        "doctor_name": doctor_name,
        "contact_phone": phone,
        "whatsapp_number": payload.whatsapp_number or payload.whatsapp or phone,
        "address_line1": payload.address_line1 or payload.addressLine1 or "",
        "address_line2": payload.address_line2 or payload.addressLine2 or "",
        "city": payload.city or "",
        "zone": payload.zone or "",
        "pincode": payload.pincode or "",
        "specialization": payload.specialization or "",
        "plan_type": plan,
        "assigned_mr": payload.assigned_mr or payload.mr or "",
        "status": payload.status or status_default,
        "submittedDate": now_iso(),
        "created_at": now_iso(),
        "mrr": {"Basic": 1500, "Growth": 2500, "Pro": 3500}.get(plan, 0),
        "onboarding_notes": payload.onboarding_notes or "",
    }


def next_token(clinic_id: str, date: str) -> int:
    appointments = store.list_appointments(clinic_id, date=date)
    tokens: list[int] = []
    for appointment in appointments:
        token = appointment.get("token") or appointment.get("tokenNum") or appointment.get("token_number")
        if isinstance(token, int):
            tokens.append(token)
        elif isinstance(token, str) and token.isdigit():
            tokens.append(int(token))
    return (max(tokens) if tokens else 0) + 1


def queue_sort_token(row: dict[str, Any]) -> int:
    token = row.get("tokenNum") or row.get("token") or row.get("token_number") or 0
    return int(token) if str(token).isdigit() else 0


def queue_row(appointment: dict[str, Any], patient: dict[str, Any] | None) -> dict[str, Any]:
    token = appointment.get("tokenNum") or appointment.get("token") or appointment.get("token_number") or 0
    queue_status = appointment.get("queueStatus") or {
        "confirmed": "booked",
        "paid": "paid",
        "vitals_done": "vitals_done",
        "in_cabin": "in_cabin",
        "done": "completed",
        "completed": "completed",
        "no_show": "no_show",
        "cancelled": "cancelled",
    }.get(appointment.get("status"), "booked")
    patient_name = (
        (patient or {}).get("name")
        or (patient or {}).get("full_name")
        or appointment.get("patientName")
        or "Walk-in Patient"
    )
    patient_phone = (patient or {}).get("phone") or appointment.get("patientPhone") or ""
    return {
        **appointment,
        "patient": patient,
        "patientId": appointment.get("patientId") or appointment.get("patient_id") or (patient or {}).get("id"),
        "patientName": patient_name,
        "patientPhone": patient_phone,
        "token": token,
        "tokenNum": int(token) if str(token).isdigit() else token,
        "queueStatus": queue_status,
        "date": appointment.get("date") or appointment.get("appointment_date"),
        "time": appointment.get("time") or appointment.get("appointment_time"),
        "reason": appointment.get("reason") or appointment.get("notes") or "General consultation",
    }

