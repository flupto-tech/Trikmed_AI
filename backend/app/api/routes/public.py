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


router = APIRouter(tags=["Public"])


@router.post("/demo-requests")
def create_demo_request(payload: DemoRequest) -> dict[str, Any]:
    phone = require_valid_phone(payload.phone)
    request = store.add_demo_request(
        {
            "id": f"DMO-{uuid4().hex[:8].upper()}",
            "clinic": payload.clinic.strip(),
            "doctor": payload.doctor.strip(),
            "specialty": payload.specialty.strip(),
            "phone": phone,
            "city": payload.city.strip(),
            "status": "new",
            "created_at": now_iso(),
        }
    )
    return request


@router.get("/public/clinics")
def public_clinics() -> list[dict[str, Any]]:
    """Public endpoint to get list of clinics for demo selector on login page."""
    clinics = store.list_clinics({})
    return [
        {
            "id": c.get("id"),
            "clinic_name": c.get("clinic_name") or c.get("clinicName"),
            "doctor_name": c.get("doctor_name") or c.get("doctorName"),
            "city": c.get("city"),
            "status": c.get("status"),
        }
        for c in clinics
    ]


@router.get("/public/clinic-users/{clinic_id}")
def public_clinic_users(clinic_id: str) -> list[dict[str, Any]]:
    """Public endpoint: safe user list for a clinic's demo role shortcuts.
    Returns only active clinic users — no password hashes exposed.
    """
    users = store.list_clinic_users(clinic_id)
    role_order = {"doctor_owner": 0, "owner": 1, "doctor": 2, "receptionist": 3, "staff": 4}
    label_map = {
        "doctor_owner": "Doctor / Owner",
        "owner":        "Owner",
        "doctor":       "Doctor",
        "receptionist": "Receptionist",
        "staff":        "Staff",
    }
    result = []
    for u in users:
        if not u.get("is_active", True):
            continue
        clinic_role = u.get("clinic_role", "staff")
        result.append({
            "id":         u.get("id"),
            "name":       u.get("name", ""),
            "email":      u.get("email", ""),
            "clinic_role": clinic_role,
            "label":      label_map.get(clinic_role, clinic_role.replace("_", " ").title()),
        })
    result.sort(key=lambda u: role_order.get(u["clinic_role"], 99))
    return result

