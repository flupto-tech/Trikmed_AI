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


router = APIRouter(tags=["Clinic"])


@router.post("/clinics")
def create_clinic(payload: ClinicRequest, current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    require_valid_phone(payload.contact_phone or payload.phone)
    status_default = "trial" if current_user.get("role") == "clinic" else "pending_approval"
    clinic = clinic_payload(payload, status_default=status_default)
    try:
        return store.add_clinic(clinic)
    except ValueError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(exc))


@router.get("/clinics/{clinic_id}")
def get_clinic(clinic_id: str, current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    clinic = store.get_clinic(clinic_id)
    if not clinic:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Clinic not found")
    if current_user.get("role") == "clinic" and current_user.get("clinic_id") != clinic_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Access denied")
    return clinic


@router.patch("/clinics/{clinic_id}")
def update_clinic(clinic_id: str, payload: dict[str, Any], current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    clinic = store.get_clinic(clinic_id)
    if not clinic:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Clinic not found")
    if current_user.get("role") == "clinic" and current_user.get("clinic_id") != clinic_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Access denied")
    return store.update_clinic(clinic_id, payload)


@router.get("/clinic/settings")
def get_clinic_settings(current_user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    clinic = store.get_clinic(current_user["clinic_id"]) or {}
    return clinic.get("settings") or {}


@router.patch("/clinic/settings")
def update_clinic_settings(payload: dict[str, Any], current_user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    store.update_clinic(current_user["clinic_id"], {"settings": payload})
    return payload


# ── Clinic Reviews ────────────────────────────────────────────────────────────


@router.get("/clinics/{clinic_id}/reviews")
def get_clinic_reviews(clinic_id: str, _current_user: dict[str, Any] = Depends(get_current_user)) -> list[dict[str, Any]]:
    return []


# ── Portal Team (write) ───────────────────────────────────────────────────────

