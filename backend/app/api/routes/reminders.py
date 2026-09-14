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


router = APIRouter(tags=["Reminders"])


@router.get("/reminders")
def list_reminders(current_user: dict[str, Any] = Depends(require_clinic_user)) -> list[dict[str, Any]]:
    return []


@router.patch("/reminders/{reminder_id}")
def update_reminder(reminder_id: str, payload: dict[str, Any], current_user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    return {"id": reminder_id, **payload}


# ── Missed Calls ──────────────────────────────────────────────────────────────

