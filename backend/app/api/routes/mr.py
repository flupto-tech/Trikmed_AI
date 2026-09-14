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


router = APIRouter(tags=["MR"])


@router.get("/mr")
def list_mrs(
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    current_user: dict[str, Any] = Depends(require_clinic_user),
) -> list[dict[str, Any]]:
    return store.list_mrs(current_user["clinic_id"], status=status, search=search)


@router.post("/mr", status_code=status.HTTP_201_CREATED)
def create_mr(payload: MRCreateBody, current_user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    phone = require_valid_phone(payload.phone, "MR phone number")
    clinic_id = current_user["clinic_id"]
    mr = {
        "id": f"MR-{uuid4().hex[:8].upper()}",
        "clinic_id": clinic_id,
        "full_name": payload.full_name.strip(),
        "phone": phone,
        "email": (payload.email or "").strip() or None,
        "company_name": payload.company_name.strip(),
        "designation": (payload.designation or "").strip() or None,
        "territory": (payload.territory or "").strip() or None,
        "products_represented": [p.strip() for p in (payload.products_represented or []) if p.strip()],
        "visiting_card_url": payload.visiting_card_url or None,
        "profile_photo_url": payload.profile_photo_url or None,
        "notes": (payload.notes or "").strip() or None,
        "status": "active",
        "blocked_reason": None,
        "total_visits": 0,
        "avg_rating": None,
        "last_visit_at": None,
        "added_by": current_user.get("id"),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    try:
        return store.add_mr(mr)
    except ValueError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(exc))


@router.patch("/mr/{mr_id}")
def update_mr(mr_id: str, payload: MRUpdateBody, current_user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    changes = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not changes:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No fields provided for update")
    try:
        return store.update_mr(mr_id, current_user["clinic_id"], changes)
    except KeyError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="MR not found")
    except PermissionError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Access denied")


@router.post("/mr/{mr_id}/block")
def block_mr(mr_id: str, payload: MRBlockBody, current_user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    try:
        mr = store.get_mr(mr_id, current_user["clinic_id"])
    except PermissionError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Access denied")
    if mr is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="MR not found")
    if mr.get("status") == "blocked":
        raise HTTPException(status.HTTP_409_CONFLICT, detail="MR is already blocked")
    try:
        return store.update_mr(mr_id, current_user["clinic_id"], {
            "status": "blocked",
            "blocked_reason": payload.blocked_reason,
        })
    except KeyError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="MR not found")


@router.post("/mr/{mr_id}/unblock")
def unblock_mr(mr_id: str, current_user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    try:
        mr = store.get_mr(mr_id, current_user["clinic_id"])
    except PermissionError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Access denied")
    if mr is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="MR not found")
    if mr.get("status") == "active":
        raise HTTPException(status.HTTP_409_CONFLICT, detail="MR is already active")
    try:
        return store.update_mr(mr_id, current_user["clinic_id"], {
            "status": "active",
            "blocked_reason": None,
        })
    except KeyError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="MR not found")


@router.delete("/mr/{mr_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mr(mr_id: str, current_user: dict[str, Any] = Depends(require_clinic_user)) -> None:
    try:
        store.delete_mr(mr_id, current_user["clinic_id"])
    except KeyError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="MR not found")
    except PermissionError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Access denied")
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc))


# ── Clinic QR endpoint ────────────────────────────────────────────────────────

