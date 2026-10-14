from __future__ import annotations

from typing import Any

from fastapi import Depends, Header, HTTPException, status

from app.core.security import issue_token, verify_token
from app.storage.supabase_store import SupabaseStore
from app.utils.users import public_user


store = SupabaseStore()


def get_current_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    payload = verify_token(authorization.split(" ", 1)[1])
    if not payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user = store.get_user(payload.get("sub"))
    if not user or not user.get("is_active", True):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="User is inactive or missing")
    # Carry forward token claims if user dictionary from store is missing them
    user_copy = dict(user)
    if "clinic_id" in payload and not user_copy.get("clinic_id"):
        user_copy["clinic_id"] = payload["clinic_id"]
    if "clinic_role" in payload and not user_copy.get("clinic_role"):
        user_copy["clinic_role"] = payload["clinic_role"]
    return user_copy


def require_clinic_user(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if user.get("role") != "clinic":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Clinic account required")
    if not user.get("clinic_id"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Clinic identity missing from authenticated account")
    return user


def require_staff_admin(user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    if user.get("clinic_role") not in {"owner", "doctor_owner", "doctor"}:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Staff management access required")
    return user


def require_doctor(user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    if user.get("clinic_role") not in {"doctor_owner", "doctor"}:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Doctor authorization required to approve prescriptions")
    return user



def require_portal_user(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if user.get("role") == "clinic":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Portal account required")
    return user


def auth_response(user: dict[str, Any]) -> dict[str, Any]:
    safe_user = public_user(user)
    token = issue_token(
        {
            "sub": safe_user["id"],
            "role": safe_user["role"],
            "clinic_id": safe_user.get("clinic_id"),
            "clinic_role": safe_user.get("clinic_role"),
            "zone": safe_user.get("zone"),
            "city": safe_user.get("city"),
        }
    )
    return {"token": token, "user": safe_user}
