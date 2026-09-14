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


router = APIRouter(tags=["Staff"])


@router.get("/staff")
def list_staff(current_user: dict[str, Any] = Depends(require_clinic_user)) -> list[dict[str, Any]]:
    return [public_user(u) for u in store.list_clinic_users(current_user["clinic_id"])]


@router.post("/staff")
def create_staff(payload: StaffCreateRequest, current_user: dict[str, Any] = Depends(require_staff_admin)) -> dict[str, Any]:
    phone = require_valid_phone(payload.phone)
    if store.find_staff_by_phone(current_user["clinic_id"], phone):
        raise HTTPException(status.HTTP_409_CONFLICT, detail="A staff member with this phone already exists")

    pin = payload.pin or "1234"
    user = store.add_user(
        {
            "id": f"STF-{uuid4().hex[:8].upper()}",
            "email": (payload.email or "").lower(),
            "name": payload.name,
            "phone": phone,
            "role": "clinic",
            "clinic_role": payload.clinic_role,
            "clinic_id": current_user["clinic_id"],
            "pin_hash": hash_password(pin),
            "custom_permissions": {},
            "is_active": True,
            "created_at": now_iso(),
            "last_login": "Never",
        }
    )
    store.add_activity(current_user["clinic_id"], current_user["id"], current_user["name"], current_user["clinic_role"], f"Added staff: {payload.name}")
    safe = public_user(user)
    return {**safe, "login_id": phone, "temp_password": pin}


@router.patch("/staff/{staff_id}")
def update_staff(staff_id: str, payload: StaffUpdateRequest, current_user: dict[str, Any] = Depends(require_staff_admin)) -> dict[str, Any]:
    staff = store.get_user(staff_id)
    if not staff or staff.get("clinic_id") != current_user["clinic_id"]:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Staff member not found")
    if staff.get("clinic_role") in {"owner", "doctor_owner"}:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Owner role cannot be changed here")

    changes = payload.model_dump(exclude_unset=True)
    updated = store.update_user(staff_id, changes)
    return public_user(updated)


@router.delete("/staff/{staff_id}")
def delete_staff(staff_id: str, current_user: dict[str, Any] = Depends(require_staff_admin)) -> dict[str, bool]:
    staff = store.get_user(staff_id)
    if not staff or staff.get("clinic_id") != current_user["clinic_id"]:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Staff member not found")
    if staff.get("clinic_role") in {"owner", "doctor_owner"}:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Owner role cannot be removed")
    store.delete_user(staff_id)
    return {"success": True}


@router.patch("/staff/{staff_id}/permissions")
def update_permissions(staff_id: str, payload: PermissionsRequest, current_user: dict[str, Any] = Depends(require_staff_admin)) -> dict[str, Any]:
    staff = store.get_user(staff_id)
    if not staff or staff.get("clinic_id") != current_user["clinic_id"]:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Staff member not found")
    updated = store.update_user(staff_id, {"custom_permissions": payload.custom_permissions})
    return public_user(updated)


@router.get("/staff/activity")
def staff_activity(
    staff_id: str | None = Query(default=None),
    date: str | None = Query(default=None),
    current_user: dict[str, Any] = Depends(require_clinic_user),
) -> list[dict[str, Any]]:
    return store.list_activity(current_user["clinic_id"], staff_id=staff_id, date=date)

