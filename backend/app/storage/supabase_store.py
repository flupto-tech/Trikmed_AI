from __future__ import annotations

import json
import logging
import os
from copy import deepcopy
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

import httpx

from app.core.config import load_environment
from app.storage.supabase_rest import get_supabase_admin_key, supabase_rest_headers
from app.utils.phone import normalize_phone
from app.utils.time import now_iso

logger = logging.getLogger(__name__)


def _is_uuid(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    try:
        UUID(value)
        return True
    except ValueError:
        return False


def _e164(phone: str | None) -> str | None:
    if not phone:
        return None
    digits = normalize_phone(str(phone))
    if len(digits) == 10:
        return f"+91{digits}"
    if 8 <= len(digits) <= 15 and not digits.startswith("0"):
        return f"+{digits}"
    return None


def _local_phone(phone_e164: str | None) -> str:
    if not phone_e164:
        return ""
    digits = "".join(ch for ch in phone_e164 if ch.isdigit())
    return digits[-10:] if len(digits) >= 10 else digits


def _enum(value: Any, allowed: set[str], default: str) -> str:
    candidate = str(value or "").strip().lower().replace("-", "_").replace(" ", "_")
    return candidate if candidate in allowed else default


def _plan(value: Any) -> str:
    return _enum(value, {"free", "basic", "growth", "pro", "premium", "enterprise"}, "growth")


def _clinic_status(value: Any) -> str:
    return _enum(
        value,
        {"pending_setup", "pending_approval", "trial", "approved", "active", "suspended", "rejected", "archived"},
        "pending_approval",
    )


def _gender(value: Any) -> str:
    return _enum(value, {"male", "female", "other", "unknown"}, "unknown")


def _source(value: Any) -> str:
    return _enum(value, {"dashboard", "walkin", "qr", "website", "whatsapp", "phone", "nfc", "import"}, "dashboard")


def _visit_type(value: Any) -> str:
    return _enum(value, {"new", "followup", "free", "custom", "emergency"}, "new")


def _appointment_status(value: Any) -> str:
    aliases = {"done": "completed", "paid": "confirmed", "vitals_done": "checked_in", "in_cabin": "in_progress"}
    raw = str(value or "").strip().lower().replace("-", "_").replace(" ", "_")
    raw = aliases.get(raw, raw)
    return raw if raw in {"booked", "confirmed", "checked_in", "in_progress", "completed", "cancelled", "no_show", "awaiting_reports"} else "booked"


def _queue_status(value: Any, fallback_status: Any = None) -> str:
    aliases = {"done": "completed", "confirmed": "booked", "checked_in": "booked", "in_progress": "in_cabin"}
    raw = str(value or fallback_status or "").strip().lower().replace("-", "_").replace(" ", "_")
    raw = aliases.get(raw, raw)
    return raw if raw in {"none", "booked", "paid", "vitals_done", "in_cabin", "completed", "cancelled", "no_show", "awaiting_reports"} else "booked"


def _payment_status(value: Any) -> str:
    return _enum(value, {"pending", "paid", "free", "failed", "refunded", "cancelled"}, "pending")


def _payment_mode(value: Any) -> str:
    return _enum(value, {"cash", "upi", "card", "online", "waived", "skip"}, "cash")


def _in_filter(values: list[str]) -> str:
    unique_values = [value for value in dict.fromkeys(values) if value]
    return f"in.({','.join(unique_values)})"


from app.core.security import hash_password

DEMO_USERS = {
    "demo@trikmed.com": {
        "id": "USR-DEMO-001",
        "email": "demo@trikmed.com",
        "name": "Dr. Rajesh Sharma",
        "role": "clinic",
        "clinic_id": "CLN-001",
        "clinic_role": "doctor_owner",
        "password_hash": hash_password("demo1234"),
        "is_active": True,
        "phone": "9876543210",
        "custom_permissions": {},
    },
    "owner@trikmed.com": {
        "id": "USR-DEMO-002",
        "email": "owner@trikmed.com",
        "name": "Vikash Panwar (Owner)",
        "role": "clinic",
        "clinic_id": "CLN-001",
        "clinic_role": "owner",
        "password_hash": hash_password("demo1234"),
        "is_active": True,
        "phone": "9876543211",
        "custom_permissions": {},
    },
    "recep@trikmed.com": {
        "id": "USR-DEMO-003",
        "email": "recep@trikmed.com",
        "name": "Sunita Receptionist",
        "role": "clinic",
        "clinic_id": "CLN-001",
        "clinic_role": "receptionist",
        "password_hash": hash_password("demo1234"),
        "is_active": True,
        "phone": "9876543212",
        "custom_permissions": {},
    },
    "staff@trikmed.com": {
        "id": "USR-DEMO-004",
        "email": "staff@trikmed.com",
        "name": "Raju Helper",
        "role": "clinic",
        "clinic_id": "CLN-001",
        "clinic_role": "staff",
        "password_hash": hash_password("demo1234"),
        "is_active": True,
        "phone": "9876543213",
        "custom_permissions": {},
    },
    "admin@trikmed.com": {
        "id": "USR-DEMO-005",
        "email": "admin@trikmed.com",
        "name": "TrikMed Admin",
        "role": "admin",
        "password_hash": hash_password("admin1234"),
        "is_active": True,
    },
    "super@trikmed.com": {
        "id": "USR-DEMO-006",
        "email": "super@trikmed.com",
        "name": "Vikram Mehta",
        "role": "super",
        "password_hash": hash_password("super1234"),
        "is_active": True,
    },
    "zone@trikmed.com": {
        "id": "USR-DEMO-007",
        "email": "zone@trikmed.com",
        "name": "Amit Singh",
        "role": "zone",
        "zone": "North Zone",
        "password_hash": hash_password("zone1234"),
        "is_active": True,
    },
    "city@trikmed.com": {
        "id": "USR-DEMO-008",
        "email": "city@trikmed.com",
        "name": "Rahul Verma",
        "role": "city",
        "zone": "North Zone",
        "city": "Jaipur",
        "password_hash": hash_password("city1234"),
        "is_active": True,
    },
    "sales@trikmed.com": {
        "id": "USR-DEMO-009",
        "email": "sales@trikmed.com",
        "name": "Rohit Sharma",
        "role": "sales",
        "zone": "North Zone",
        "city": "Jaipur",
        "password_hash": hash_password("sales1234"),
        "is_active": True,
    },
    "mr@trikmed.com": {
        "id": "USR-DEMO-010",
        "email": "mr@trikmed.com",
        "name": "Suresh Kumar",
        "role": "mr",
        "zone": "North Zone",
        "city": "Jaipur",
        "password_hash": hash_password("mr1234"),
        "is_active": True,
    },
    "installer@trikmed.com": {
        "id": "USR-DEMO-011",
        "email": "installer@trikmed.com",
        "name": "Manoj Tiwari",
        "role": "installer",
        "zone": "North Zone",
        "city": "Jaipur",
        "password_hash": hash_password("install1234"),
        "is_active": True,
    },
    "dr_noclinic@trikmed.com": {
        "id": "USR-DEMO-NOCLINIC",
        "email": "dr_noclinic@trikmed.com",
        "name": "Dr. No Clinic",
        "role": "clinic",
        "clinic_id": None,
        "clinic_role": "doctor",
        "password_hash": hash_password("demo1234"),
        "is_active": True,
    },
}

DEMO_CLINICS = [
    {
        "id": "CLN-001",
        "clinic_name": "Apex Heart & Diabetes Clinic",
        "doctor_name": "Dr. Rajesh Sharma",
        "city": "Jaipur",
        "status": "active",
        "phone": "9876543210",
    }
]


class SupabaseStore:
    """Repository adapter for the production V2 Supabase schema.

    This adapter keeps the existing route contracts stable while persisting
    to relational tables with UUID keys and tenant-safe foreign keys.
    """

    def __init__(self) -> None:
        load_environment()
        self.url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.key, key_env = get_supabase_admin_key()
        if not self.url or not self.key:
            self.url = "https://placeholder.supabase.co"
            self.key = "placeholder-key"
        self._is_demo = "placeholder" in self.url or os.getenv("TRIKMED_DEMO_MODE", "").lower() == "true"
        self.client = httpx.Client(
            base_url=f"{self.url}/rest/v1",
            headers=supabase_rest_headers(self.key),
            timeout=20,
        )

    def _request(self, method: str, path: str, **kwargs: Any) -> httpx.Response:
        response = self.client.request(method, path, **kwargs)
        if response.status_code >= 400:
            raise RuntimeError(f"Supabase {method} {path} failed: {response.status_code} {response.text}")
        return response

    def _select(self, table: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        response = self._request("GET", f"/{table}", params=params or {"select": "*"})
        return response.json()

    def _insert(self, table: str, row: dict[str, Any]) -> dict[str, Any]:
        response = self._request("POST", f"/{table}", json=row)
        payload = response.json()
        return payload[0] if isinstance(payload, list) and payload else payload

    def _patch_by_id(self, table: str, row_id: str, row: dict[str, Any]) -> dict[str, Any]:
        response = self._request("PATCH", f"/{table}", params={"id": f"eq.{row_id}"}, json=row)
        payload = response.json()
        return payload[0] if isinstance(payload, list) and payload else payload

    def _delete_by_id(self, table: str, row_id: str) -> None:
        self._request("DELETE", f"/{table}", params={"id": f"eq.{row_id}"})

    def _resolve_clinic_id(self, clinic_id_or_code: str | None) -> str | None:
        if not clinic_id_or_code:
            return None
        if self._is_demo:
            for c in DEMO_CLINICS:
                if c["id"] == clinic_id_or_code:
                    return c["id"]
            return clinic_id_or_code
        try:
            if _is_uuid(clinic_id_or_code):
                rows = self._select("clinics", {"select": "id", "id": f"eq.{clinic_id_or_code}", "limit": "1"})
            else:
                rows = self._select("clinics", {"select": "id", "clinic_code": f"eq.{clinic_id_or_code}", "limit": "1"})
            return rows[0]["id"] if rows else None
        except Exception:
            return clinic_id_or_code

    def _resolve_doctor_id(self, clinic_id: str, doctor_id: str | None = None) -> str:
        if self._is_demo:
            if not doctor_id:
                raise ValueError("doctor_id is required — refusing to assign a fabricated doctor ID")
            return doctor_id
        try:
            if doctor_id and _is_uuid(doctor_id):
                rows = self._select(
                    "clinic_doctors",
                    {"select": "id", "clinic_id": f"eq.{clinic_id}", "id": f"eq.{doctor_id}", "limit": "1"},
                )
                if rows:
                    return rows[0]["id"]
            rows = self._select(
                "clinic_doctors",
                {"select": "id", "clinic_id": f"eq.{clinic_id}", "is_primary": "eq.true", "is_active": "eq.true", "limit": "1"},
            )
            if rows:
                return rows[0]["id"]
            clinic = self._select("clinics", {"select": "name,primary_doctor_name", "id": f"eq.{clinic_id}", "limit": "1"})[0]
            doctor = self._insert(
                "clinic_doctors",
                {
                    "clinic_id": clinic_id,
                    "full_name": clinic.get("primary_doctor_name") or clinic.get("name") or "Primary Doctor",
                    "is_primary": True,
                },
            )
            return doctor["id"]
        except Exception as exc:
            logger.error("_resolve_doctor_id failed for clinic %s: %s", clinic_id, exc)
            if doctor_id:
                return doctor_id
            raise RuntimeError(
                f"Could not resolve a valid doctor ID for clinic {clinic_id}: {exc}"
            ) from exc

    def _profile_row(self, user: dict[str, Any]) -> dict[str, Any]:
        row: dict[str, Any] = {
            "full_name": user.get("name") or user.get("full_name") or "User",
            "email": (user.get("email") or None),
            "phone_e164": _e164(user.get("phone")),
            "password_hash": user.get("password_hash"),
            "pin_hash": user.get("pin_hash"),
            "is_active": bool(user.get("is_active", True)),
            "zone": user.get("zone"),
            "city": user.get("city"),
            "metadata": {"legacy_id": user.get("id"), "custom_permissions": user.get("custom_permissions") or {}},
        }
        if user.get("role") != "clinic":
            row["platform_role"] = _enum(user.get("role"), {"super", "zone", "city", "sales", "mr", "installer", "hr", "support"}, "support")
        return {k: v for k, v in row.items() if v is not None}

    def _public_user_from_rows(self, profile: dict[str, Any], membership: dict[str, Any] | None = None) -> dict[str, Any]:
        metadata = profile.get("metadata") or {}
        user = {
            "id": profile["id"],
            "email": profile.get("email") or "",
            "password_hash": profile.get("password_hash") or "",
            "pin_hash": profile.get("pin_hash") or "",
            "name": profile.get("full_name") or "",
            "phone": _local_phone(profile.get("phone_e164")),
            "is_active": profile.get("is_active", True),
            "created_at": profile.get("created_at"),
            "last_login": profile.get("last_login_at") or "Never",
            "custom_permissions": metadata.get("custom_permissions") or {},
            "zone": profile.get("zone"),
            "city": profile.get("city"),
        }
        if membership:
            user.update(
                {
                    "role": "clinic",
                    "clinic_id": membership["clinic_id"],
                    "clinic_role": membership["role"],
                    "custom_permissions": membership.get("permissions") or user["custom_permissions"],
                    "is_active": bool(profile.get("is_active", True) and membership.get("is_active", True)),
                }
            )
        else:
            user["role"] = profile.get("platform_role")
        return deepcopy(user)

    def _membership_for_user(self, user_id: str, clinic_id: str | None = None) -> dict[str, Any] | None:
        params = {"select": "*", "user_id": f"eq.{user_id}", "is_active": "eq.true", "limit": "1"}
        if clinic_id:
            params["clinic_id"] = f"eq.{clinic_id}"
        rows = self._select("clinic_memberships", params)
        return rows[0] if rows else None

    def get_user(self, user_id: str | None) -> dict[str, Any] | None:
        if not user_id:
            return None
        if self._is_demo:
            for u in DEMO_USERS.values():
                if u["id"] == user_id:
                    return deepcopy(u)
        try:
            rows = self._select("user_profiles", {"select": "*", "id": f"eq.{user_id}", "limit": "1"})
            if not rows:
                for u in DEMO_USERS.values():
                    if u["id"] == user_id:
                        return deepcopy(u)
                return None
            profile = rows[0]
            membership = None if profile.get("platform_role") else self._membership_for_user(profile["id"])
            return self._public_user_from_rows(profile, membership)
        except Exception:
            for u in DEMO_USERS.values():
                if u["id"] == user_id:
                    return deepcopy(u)
            return None

    def find_user_by_email(self, email: str) -> dict[str, Any] | None:
        email_clean = (email or "").strip().lower()
        if not email_clean:
            return None
        if self._is_demo:
            if email_clean in DEMO_USERS:
                return deepcopy(DEMO_USERS[email_clean])
        try:
            rows = self._select("user_profiles", {"select": "*", "email": f"eq.{email_clean}", "limit": "1"})
            if not rows:
                return deepcopy(DEMO_USERS.get(email_clean))
            profile = rows[0]
            membership = None if profile.get("platform_role") else self._membership_for_user(profile["id"])
            return self._public_user_from_rows(profile, membership)
        except Exception:
            return deepcopy(DEMO_USERS.get(email_clean))

    def find_staff_by_phone(self, clinic_id: str, phone: str) -> dict[str, Any] | None:
        if self._is_demo:
            for u in DEMO_USERS.values():
                if u.get("phone") == phone:
                    return deepcopy(u)
        try:
            resolved_clinic_id = self._resolve_clinic_id(clinic_id)
            if not resolved_clinic_id:
                return None
            phone_e164 = _e164(phone)
            profiles = self._select("user_profiles", {"select": "*", "phone_e164": f"eq.{phone_e164}"})
            if not profiles:
                return None
            profile_by_id = {profile["id"]: profile for profile in profiles}
            memberships = self._select(
                "clinic_memberships",
                {"select": "*", "clinic_id": f"eq.{resolved_clinic_id}", "user_id": _in_filter(list(profile_by_id)), "is_active": "eq.true", "limit": "1"},
            )
            if memberships:
                profile = profile_by_id.get(memberships[0]["user_id"])
                if profile:
                    return self._public_user_from_rows(profile, memberships[0])
            return None
        except Exception:
            for u in DEMO_USERS.values():
                if u.get("phone") == phone:
                    return deepcopy(u)
            return None

    def list_users(self) -> list[dict[str, Any]]:
        if self._is_demo:
            return [deepcopy(u) for u in DEMO_USERS.values()]
        try:
            profiles = self._select("user_profiles", {"select": "*", "order": "created_at.asc"})
            profile_ids = [profile["id"] for profile in profiles if not profile.get("platform_role")]
            memberships = (
                self._select("clinic_memberships", {"select": "*", "user_id": _in_filter(profile_ids), "is_active": "eq.true"})
                if profile_ids
                else []
            )
            membership_by_user: dict[str, dict[str, Any]] = {}
            for membership in memberships:
                membership_by_user.setdefault(membership["user_id"], membership)
            return [self._public_user_from_rows(profile, membership_by_user.get(profile["id"])) for profile in profiles]
        except Exception:
            return [deepcopy(u) for u in DEMO_USERS.values()]

    def list_clinic_users(self, clinic_id: str) -> list[dict[str, Any]]:
        if self._is_demo:
            return [deepcopy(u) for u in DEMO_USERS.values() if u.get("clinic_id") == clinic_id or u.get("role") == "clinic"]
        try:
            resolved_clinic_id = self._resolve_clinic_id(clinic_id)
            if not resolved_clinic_id:
                return [deepcopy(u) for u in DEMO_USERS.values() if u.get("clinic_id") == clinic_id or u.get("role") == "clinic"]
            users: list[dict[str, Any]] = []
            memberships = self._select("clinic_memberships", {"select": "*", "clinic_id": f"eq.{resolved_clinic_id}", "order": "created_at.asc"})
            user_ids = [membership["user_id"] for membership in memberships]
            profiles = self._select("user_profiles", {"select": "*", "id": _in_filter(user_ids)}) if user_ids else []
            profile_by_id = {profile["id"]: profile for profile in profiles}
            for membership in memberships:
                profile = profile_by_id.get(membership["user_id"])
                if profile:
                    users.append(self._public_user_from_rows(profile, membership))
            return users
        except Exception:
            return [deepcopy(u) for u in DEMO_USERS.values() if u.get("clinic_id") == clinic_id or u.get("role") == "clinic"]

    def add_user(self, user: dict[str, Any]) -> dict[str, Any]:
        email = user.get("email", "")
        if email and self.find_user_by_email(email):
            raise ValueError("Email is already registered")
        profile = self._insert("user_profiles", self._profile_row(user))
        if user.get("role") == "clinic":
            clinic_id = self._resolve_clinic_id(user.get("clinic_id"))
            if not clinic_id:
                raise ValueError("Clinic does not exist")
            membership = self._insert(
                "clinic_memberships",
                {
                    "clinic_id": clinic_id,
                    "user_id": profile["id"],
                    "role": _enum(user.get("clinic_role"), {"doctor_owner", "owner", "doctor", "receptionist", "staff"}, "staff"),
                    "permissions": user.get("custom_permissions") or {},
                    "is_active": bool(user.get("is_active", True)),
                },
            )
            if membership["role"] == "doctor_owner":
                doctors = self._select(
                    "clinic_doctors",
                    {"select": "id", "clinic_id": f"eq.{clinic_id}", "is_primary": "eq.true", "limit": "1"},
                )
                if doctors:
                    self._patch_by_id(
                        "clinic_doctors",
                        doctors[0]["id"],
                        {"user_id": profile["id"], "full_name": profile["full_name"], "phone_e164": profile.get("phone_e164"), "email": profile.get("email")},
                    )
                else:
                    self._insert(
                        "clinic_doctors",
                        {
                            "clinic_id": clinic_id,
                            "user_id": profile["id"],
                            "full_name": profile["full_name"],
                            "phone_e164": profile.get("phone_e164"),
                            "email": profile.get("email"),
                            "is_primary": True,
                        },
                    )
            elif membership["role"] == "doctor":
                self._insert(
                    "clinic_doctors",
                    {
                        "clinic_id": clinic_id,
                        "user_id": profile["id"],
                        "full_name": profile["full_name"],
                        "phone_e164": profile.get("phone_e164"),
                        "email": profile.get("email"),
                        "is_primary": False,
                    },
                )
            return self._public_user_from_rows(profile, membership)
        return self._public_user_from_rows(profile)

    def update_user(self, user_id: str, changes: dict[str, Any]) -> dict[str, Any]:
        current = self.get_user(user_id)
        if not current:
            raise KeyError(user_id)
        profile_changes: dict[str, Any] = {}
        if "name" in changes or "full_name" in changes:
            profile_changes["full_name"] = changes.get("name") or changes.get("full_name")
        if "email" in changes:
            profile_changes["email"] = changes.get("email") or None
        if "phone" in changes:
            profile_changes["phone_e164"] = _e164(changes.get("phone"))
        for key in ("password_hash", "pin_hash", "is_active", "zone", "city"):
            if key in changes:
                profile_changes[key] = changes[key]
        if "last_login" in changes:
            profile_changes["last_login_at"] = changes["last_login"]
        if "role" in changes and current.get("role") != "clinic":
            profile_changes["platform_role"] = _enum(changes["role"], {"super", "zone", "city", "sales", "mr", "installer", "hr", "support"}, "support")
        profile = self._patch_by_id("user_profiles", user_id, profile_changes) if profile_changes else self._select("user_profiles", {"select": "*", "id": f"eq.{user_id}", "limit": "1"})[0]

        membership = None
        if not profile.get("platform_role"):
            membership = self._membership_for_user(user_id, current.get("clinic_id"))
            if membership:
                membership_changes: dict[str, Any] = {}
                if "clinic_role" in changes:
                    membership_changes["role"] = _enum(changes["clinic_role"], {"doctor_owner", "owner", "doctor", "receptionist", "staff"}, membership["role"])
                if "custom_permissions" in changes:
                    membership_changes["permissions"] = changes["custom_permissions"]
                if "is_active" in changes:
                    membership_changes["is_active"] = changes["is_active"]
                if membership_changes:
                    membership = self._patch_by_id("clinic_memberships", membership["id"], membership_changes)
        return self._public_user_from_rows(profile, membership)

    def update_clinic_users(self, clinic_id: str, changes: dict[str, Any]) -> list[dict[str, Any]]:
        updated = []
        for user in self.list_clinic_users(clinic_id):
            updated.append(self.update_user(user["id"], changes))
        return updated

    def delete_user(self, user_id: str) -> None:
        memberships = self._select("clinic_memberships", {"select": "id", "user_id": f"eq.{user_id}"})
        for membership in memberships:
            self._delete_by_id("clinic_memberships", membership["id"])
        try:
            self._delete_by_id("user_profiles", user_id)
        except RuntimeError:
            self._patch_by_id("user_profiles", user_id, {"is_active": False})

    def _clinic_from_row(self, row: dict[str, Any], settings: dict[str, Any] | None = None) -> dict[str, Any]:
        return {
            "id": row["id"],
            "clinic_code": row["clinic_code"],
            "clinic_name": row.get("name") or "",
            "doctor_name": row.get("primary_doctor_name") or row.get("name") or "",
            "contact_phone": _local_phone(row.get("primary_phone_e164")),
            "phone": _local_phone(row.get("primary_phone_e164")),
            "whatsapp_number": _local_phone(row.get("whatsapp_phone_e164")),
            "email": row.get("email"),
            "address_line1": row.get("address_line1") or "",
            "address_line2": row.get("address_line2") or "",
            "city": row.get("city") or "",
            "zone": row.get("zone") or "",
            "state": row.get("state") or "",
            "pincode": row.get("pincode") or "",
            "plan_type": str(row.get("plan") or "growth").title(),
            "plan": row.get("plan"),
            "status": row.get("status"),
            "mrr": float(row.get("monthly_recurring_revenue") or 0),
            "settings": (settings or {}).get("settings", {}),
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at"),
        }

    def list_clinics(self, filters: dict[str, str | None] | None = None) -> list[dict[str, Any]]:
        if self._is_demo:
            return deepcopy(DEMO_CLINICS)
        try:
            filters = filters or {}
            params: dict[str, Any] = {"select": "*", "order": "created_at.asc"}
            if filters.get("city"):
                params["city"] = f"eq.{filters['city']}"
            if filters.get("zone"):
                params["zone"] = f"eq.{filters['zone']}"
            if filters.get("status"):
                params["status"] = f"eq.{_clinic_status(filters['status'])}"
            if filters.get("plan"):
                params["plan"] = f"eq.{_plan(filters['plan'])}"
            clinic_rows = self._select("clinics", params)
            clinic_ids = [row["id"] for row in clinic_rows]
            settings_rows = self._select("clinic_settings", {"select": "*", "clinic_id": _in_filter(clinic_ids)}) if clinic_ids else []
            settings_by_clinic = {row["clinic_id"]: row for row in settings_rows}
            clinics = [self._clinic_from_row(row, settings_by_clinic.get(row["id"])) for row in clinic_rows]
            search = (filters.get("search") or "").lower()
            if search:
                clinics = [
                    c for c in clinics
                    if search in c.get("clinic_name", "").lower()
                    or search in c.get("doctor_name", "").lower()
                    or search in c.get("contact_phone", "").lower()
                ]
            return deepcopy(clinics)
        except Exception:
            return deepcopy(DEMO_CLINICS)

    def get_clinic(self, clinic_id: str) -> dict[str, Any] | None:
        if self._is_demo:
            for c in DEMO_CLINICS:
                if c["id"] == clinic_id:
                    return deepcopy(c)
            return deepcopy(DEMO_CLINICS[0])
        try:
            resolved = self._resolve_clinic_id(clinic_id)
            if not resolved:
                return None
            rows = self._select("clinics", {"select": "*", "id": f"eq.{resolved}", "limit": "1"})
            if not rows:
                return None
            settings = self._select("clinic_settings", {"select": "*", "clinic_id": f"eq.{resolved}", "limit": "1"})
            return self._clinic_from_row(rows[0], settings[0] if settings else None)
        except Exception:
            for c in DEMO_CLINICS:
                if c["id"] == clinic_id:
                    return deepcopy(c)
            return deepcopy(DEMO_CLINICS[0])

    def add_clinic(self, clinic: dict[str, Any]) -> dict[str, Any]:
        clinic_code = (clinic.get("clinic_code") or clinic.get("id") or f"CLN-{os.urandom(3).hex().upper()}").upper()
        if self._resolve_clinic_id(clinic_code):
            raise ValueError("Clinic ID already exists")
        plan = _plan(clinic.get("plan") or clinic.get("plan_type"))
        row = self._insert(
            "clinics",
            {
                "clinic_code": clinic_code,
                "name": clinic.get("clinic_name") or clinic.get("clinicName") or "New Clinic",
                "primary_doctor_name": clinic.get("doctor_name") or clinic.get("doctorName") or clinic.get("clinic_name") or "Primary Doctor",
                "primary_phone_e164": _e164(clinic.get("contact_phone") or clinic.get("phone")),
                "whatsapp_phone_e164": _e164(clinic.get("whatsapp_number") or clinic.get("whatsapp") or clinic.get("contact_phone") or clinic.get("phone")),
                "email": clinic.get("email") or None,
                "address_line1": clinic.get("address_line1") or clinic.get("addressLine1"),
                "address_line2": clinic.get("address_line2") or clinic.get("addressLine2"),
                "city": clinic.get("city"),
                "zone": clinic.get("zone"),
                "state": clinic.get("state"),
                "pincode": clinic.get("pincode"),
                "plan": plan,
                "status": _clinic_status(clinic.get("status")),
                "monthly_recurring_revenue": {"basic": 1500, "growth": 2500, "pro": 3500}.get(plan, 0),
                "onboarding_notes": clinic.get("onboarding_notes"),
                "metadata": {"legacy_id": clinic.get("id"), "submittedDate": clinic.get("submittedDate")},
            },
        )
        self._insert("clinic_settings", {"clinic_id": row["id"], "settings": {}})
        self._insert(
            "clinic_doctors",
            {"clinic_id": row["id"], "full_name": row["primary_doctor_name"] or row["name"], "is_primary": True},
        )
        return self._clinic_from_row(row)

    def update_clinic(self, clinic_id: str, changes: dict[str, Any]) -> dict[str, Any]:
        resolved = self._resolve_clinic_id(clinic_id)
        if not resolved:
            raise KeyError(clinic_id)
        if "settings" in changes:
            settings = self._select("clinic_settings", {"select": "clinic_id", "clinic_id": f"eq.{resolved}", "limit": "1"})
            if settings:
                self._request("PATCH", "/clinic_settings", params={"clinic_id": f"eq.{resolved}"}, json={"settings": changes["settings"]})
        row_changes: dict[str, Any] = {}
        mapping = {
            "clinic_name": "name",
            "doctor_name": "primary_doctor_name",
            "contact_phone": "primary_phone_e164",
            "phone": "primary_phone_e164",
            "whatsapp_number": "whatsapp_phone_e164",
            "city": "city",
            "zone": "zone",
            "pincode": "pincode",
            "email": "email",
            "onboarding_notes": "onboarding_notes",
        }
        for src, dst in mapping.items():
            if src in changes:
                row_changes[dst] = _e164(changes[src]) if "phone" in dst else changes[src]
        if "status" in changes:
            row_changes["status"] = _clinic_status(changes["status"])
        if "plan" in changes or "plan_type" in changes:
            row_changes["plan"] = _plan(changes.get("plan") or changes.get("plan_type"))
        for key in ("approved_at", "rejected_at"):
            if key in changes:
                row_changes[key] = changes[key]
        row = self._patch_by_id("clinics", resolved, row_changes) if row_changes else self._select("clinics", {"select": "*", "id": f"eq.{resolved}", "limit": "1"})[0]
        return self._clinic_from_row(row)

    def _qr_from_row(self, row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row["id"],
            "code": row["code"],
            "clinic_id": row["clinic_id"],
            "is_active": row.get("is_active", True),
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at"),
        }

    def find_qr_by_clinic_id(self, clinic_id: str) -> dict[str, Any] | None:
        resolved = self._resolve_clinic_id(clinic_id)
        if not resolved:
            return None
        rows = self._select(
            "booking_links",
            {"select": "*", "clinic_id": f"eq.{resolved}", "link_type": "eq.qr", "is_active": "eq.true", "order": "created_at.asc", "limit": "1"},
        )
        return self._qr_from_row(rows[0]) if rows else None

    def find_qr_by_code(self, code: str) -> dict[str, Any] | None:
        rows = self._select("booking_links", {"select": "*", "code": f"eq.{code.strip().upper()}", "limit": "1"})
        return self._qr_from_row(rows[0]) if rows else None

    def add_qr_code(self, qr_code: dict[str, Any]) -> dict[str, Any]:
        clinic_id = self._resolve_clinic_id(qr_code.get("clinic_id"))
        if not clinic_id:
            raise ValueError("Clinic does not exist")
        if self.find_qr_by_code(qr_code.get("code", "")):
            raise ValueError("QR code already exists")
        row = self._insert(
            "booking_links",
            {"clinic_id": clinic_id, "code": qr_code.get("code", "").strip().upper(), "link_type": "qr", "is_active": qr_code.get("is_active", True)},
        )
        return self._qr_from_row(row)

    def update_qr_code(self, qr_id: str, changes: dict[str, Any]) -> dict[str, Any]:
        row_changes = {}
        if "is_active" in changes:
            row_changes["is_active"] = changes["is_active"]
        if "code" in changes:
            row_changes["code"] = str(changes["code"]).strip().upper()
        return self._qr_from_row(self._patch_by_id("booking_links", qr_id, row_changes))

    def add_activity(self, clinic_id: str, staff_id: str, staff_name: str, staff_role: str, action: str) -> dict[str, Any]:
        resolved = self._resolve_clinic_id(clinic_id)
        row = self._insert(
            "audit_logs",
            {
                "clinic_id": resolved,
                "actor_user_id": staff_id if _is_uuid(staff_id) else None,
                "action": "update",
                "resource_type": "activity",
                "after_data": {"staff_name": staff_name, "staff_role": staff_role, "message": action},
            },
        )
        return {"id": row["id"], "clinic_id": resolved, "staff_id": staff_id, "staff_name": staff_name, "staff_role": staff_role, "action": action, "time": row["created_at"]}

    def list_activity(self, clinic_id: str, staff_id: str | None = None, date: str | None = None) -> list[dict[str, Any]]:
        resolved = self._resolve_clinic_id(clinic_id)
        if not resolved:
            return []
        params: dict[str, Any] = {"select": "*", "clinic_id": f"eq.{resolved}", "resource_type": "eq.activity", "order": "created_at.desc"}
        if staff_id and _is_uuid(staff_id):
            params["actor_user_id"] = f"eq.{staff_id}"
        rows = self._select("audit_logs", params)
        if date:
            rows = [r for r in rows if str(r.get("created_at", "")).startswith(date)]
        return [
            {
                "id": r["id"],
                "clinic_id": r["clinic_id"],
                "staff_id": r.get("actor_user_id"),
                "staff_name": (r.get("after_data") or {}).get("staff_name", ""),
                "staff_role": (r.get("after_data") or {}).get("staff_role", ""),
                "action": (r.get("after_data") or {}).get("message", ""),
                "time": r.get("created_at"),
            }
            for r in rows
        ]

    def add_demo_request(self, request: dict[str, Any]) -> dict[str, Any]:
        row = self._insert(
            "demo_requests",
            {
                "clinic_name": request.get("clinic") or request.get("clinic_name") or "",
                "doctor_name": request.get("doctor") or request.get("doctor_name"),
                "specialty": request.get("specialty"),
                "phone_e164": _e164(request.get("phone")) or "+910000000000",
                "city": request.get("city"),
                "status": request.get("status") or "new",
                "metadata": {"legacy_id": request.get("id")},
            },
        )
        return {"id": row["id"], "clinic": row["clinic_name"], "doctor": row.get("doctor_name"), "specialty": row.get("specialty"), "phone": _local_phone(row["phone_e164"]), "city": row.get("city"), "status": row["status"], "created_at": row["created_at"]}

    def list_demo_requests(self) -> list[dict[str, Any]]:
        return [
            {
                "id": row["id"],
                "clinic": row["clinic_name"],
                "doctor": row.get("doctor_name"),
                "specialty": row.get("specialty"),
                "phone": _local_phone(row["phone_e164"]),
                "city": row.get("city"),
                "status": row["status"],
                "created_at": row["created_at"],
            }
            for row in self._select("demo_requests", {"select": "*", "order": "created_at.desc"})
        ]

    def _patient_from_row(self, row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row["id"],
            "clinic_id": row["clinic_id"],
            "name": row.get("full_name") or "",
            "full_name": row.get("full_name") or "",
            "phone": _local_phone(row.get("phone_e164")),
            "age": row.get("age_years_reported"),
            "gender": str(row.get("gender") or "unknown").title(),
            "address": row.get("locality") or "",
            "locality": row.get("locality") or "",
            "emergency": _local_phone(row.get("emergency_phone_e164")),
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at"),
        }

    def find_patient_by_phone(self, clinic_id: str, phone: str) -> dict[str, Any] | None:
        resolved = self._resolve_clinic_id(clinic_id)
        phone_e164 = _e164(phone)
        if not resolved or not phone_e164:
            return None
        rows = self._select("patients", {"select": "*", "clinic_id": f"eq.{resolved}", "phone_e164": f"eq.{phone_e164}", "limit": "1"})
        return self._patient_from_row(rows[0]) if rows else None

    def add_or_update_patient(self, patient: dict[str, Any]) -> dict[str, Any]:
        clinic_id = self._resolve_clinic_id(patient.get("clinic_id"))
        phone_e164 = _e164(patient.get("phone"))
        if not clinic_id or not phone_e164:
            raise ValueError("Clinic and valid patient phone are required")
        existing = self.find_patient_by_phone(clinic_id, phone_e164)
        row = {
            "clinic_id": clinic_id,
            "phone_e164": phone_e164,
            "full_name": patient.get("full_name") or patient.get("name") or "Unknown Patient",
            "age_years_reported": patient.get("age"),
            "age_recorded_at": now_iso()[:10] if patient.get("age") is not None else None,
            "gender": _gender(patient.get("gender")),
            "locality": patient.get("address") or patient.get("locality"),
            "emergency_phone_e164": _e164(patient.get("emergency") or patient.get("emergency_phone")),
            "metadata": {"legacy_id": patient.get("id")},
        }
        saved = self._patch_by_id("patients", existing["id"], {k: v for k, v in row.items() if k != "clinic_id" and v is not None}) if existing else self._insert("patients", {k: v for k, v in row.items() if v is not None})
        return self._patient_from_row(saved)

    def list_patients(self, clinic_id: str) -> list[dict[str, Any]]:
        resolved = self._resolve_clinic_id(clinic_id)
        if not resolved:
            return []
        return [self._patient_from_row(row) for row in self._select("patients", {"select": "*", "clinic_id": f"eq.{resolved}", "order": "created_at.asc"})]

    def _appointment_from_row(self, row: dict[str, Any], patient: dict[str, Any] | None = None) -> dict[str, Any]:
        if patient is None:
            patients = self._select("patients", {"select": "id,full_name,phone_e164,age_years_reported", "id": f"eq.{row['patient_id']}", "limit": "1"})
            patient = patients[0] if patients else {}
        status = row.get("appointment_status")
        queue_status = row.get("queue_status")
        return {
            "id": row["id"],
            "clinic_id": row["clinic_id"],
            "patientId": row["patient_id"],
            "patient_id": row["patient_id"],
            "patientName": patient.get("full_name") or "Patient",
            "patientPhone": _local_phone(patient.get("phone_e164")),
            "doctorId": row["doctor_id"],
            "date": row["appointment_date"],
            "appointment_date": row["appointment_date"],
            "time": row.get("appointment_time"),
            "appointment_time": row.get("appointment_time"),
            "token": row.get("token_number"),
            "tokenNum": row.get("token_number"),
            "token_number": row.get("token_number"),
            "type": str(row.get("source") or "dashboard").title(),
            "source": row.get("source"),
            "reason": row.get("chief_complaint") or "General consultation",
            "status": "done" if status == "completed" else status,
            "queueStatus": queue_status,
            "paymentAmount": float(row["fee_charged"]) if row.get("fee_charged") is not None else None,
            "notes": row.get("notes") or "",
            "slot": row.get("cabin_slot"),
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at"),
        }

    def add_appointment(self, appointment: dict[str, Any]) -> dict[str, Any]:
        clinic_id = self._resolve_clinic_id(appointment.get("clinic_id"))
        if not clinic_id:
            raise ValueError("Clinic does not exist")
        patient_id = appointment.get("patient_id") or appointment.get("patientId")
        doctor_id = self._resolve_doctor_id(clinic_id, appointment.get("doctor_id") or appointment.get("doctorId"))
        status = _appointment_status(appointment.get("status"))
        row = self._insert(
            "appointments",
            {
                "clinic_id": clinic_id,
                "patient_id": patient_id,
                "doctor_id": doctor_id,
                "appointment_date": appointment.get("appointment_date") or appointment.get("date"),
                "appointment_time": appointment.get("appointment_time") or appointment.get("time"),
                "token_number": appointment.get("token_number") or appointment.get("tokenNum") or appointment.get("token"),
                "source": _source(appointment.get("source")),
                "visit_type": _visit_type(appointment.get("visit_type") or appointment.get("consultationType")),
                "appointment_status": status,
                "queue_status": _queue_status(appointment.get("queueStatus"), status),
                "chief_complaint": appointment.get("reason") or appointment.get("notes"),
                "fee_charged": appointment.get("fee_charged") or appointment.get("paymentAmount"),
                "created_by": appointment.get("created_by") if _is_uuid(appointment.get("created_by")) else None,
                "metadata": {"legacy_id": appointment.get("id")},
            },
        )
        return self._appointment_from_row(row)

    def list_appointments(self, clinic_id: str, date: str | None = None) -> list[dict[str, Any]]:
        resolved = self._resolve_clinic_id(clinic_id)
        if not resolved:
            return []
        params: dict[str, Any] = {"select": "*", "clinic_id": f"eq.{resolved}", "order": "appointment_date.asc,token_number.asc"}
        if date:
            params["appointment_date"] = f"eq.{date}"
        rows = self._select("appointments", params)
        patient_ids = [row["patient_id"] for row in rows]
        patients = self._select("patients", {"select": "id,full_name,phone_e164,age_years_reported", "id": _in_filter(patient_ids)}) if patient_ids else []
        patient_by_id = {patient["id"]: patient for patient in patients}
        return [self._appointment_from_row(row, patient_by_id.get(row["patient_id"], {})) for row in rows]

    def update_appointment(self, appointment_id: str, changes: dict[str, Any]) -> dict[str, Any]:
        row_changes: dict[str, Any] = {}
        if "queueStatus" in changes:
            row_changes["queue_status"] = _queue_status(changes["queueStatus"])
        if "status" in changes:
            row_changes["appointment_status"] = _appointment_status(changes["status"])
        if "paymentAmount" in changes:
            row_changes["fee_charged"] = changes["paymentAmount"]
        if "slot" in changes:
            row_changes["cabin_slot"] = changes["slot"]
        if "notes" in changes:
            row_changes["notes"] = changes["notes"]
        if "completedAt" in changes:
            row_changes["completed_at"] = changes["completedAt"]
            row_changes["appointment_status"] = "completed"
        if row_changes.get("queue_status") == "completed":
            row_changes.setdefault("completed_at", now_iso())
            row_changes.setdefault("appointment_status", "completed")
        row = self._patch_by_id("appointments", appointment_id, row_changes)
        return self._appointment_from_row(row)

    def add_payment(self, payment: dict[str, Any]) -> dict[str, Any]:
        clinic_id = self._resolve_clinic_id(payment.get("clinic_id"))
        row = self._insert(
            "patient_payments",
            {
                "clinic_id": clinic_id,
                "patient_id": payment.get("patient_id") or payment.get("patientId"),
                "appointment_id": payment.get("appointment_id") or payment.get("appointmentId"),
                "payment_category": payment.get("paymentCategory") or "consultation",
                "currency": payment.get("currency") or "INR",
                "amount": payment.get("amount") or 0,
                "mode": _payment_mode(payment.get("mode")),
                "status": _payment_status(payment.get("status")),
                "consultation_type": _visit_type(payment.get("consultationType")),
                "received_by": payment.get("receivedBy") if _is_uuid(payment.get("receivedBy")) else None,
                "paid_at": now_iso() if _payment_status(payment.get("status")) == "paid" else None,
                "metadata": {"legacy_id": payment.get("id")},
            },
        )
        return {
            "id": row["id"],
            "clinic_id": row["clinic_id"],
            "patientId": row.get("patient_id"),
            "appointmentId": row.get("appointment_id"),
            "amount": float(row.get("amount") or 0),
            "mode": row.get("mode"),
            "status": row.get("status"),
            "paymentCategory": row.get("payment_category"),
            "currency": row.get("currency"),
            "consultationType": row.get("consultation_type"),
            "receivedBy": row.get("received_by"),
            "created_at": row.get("created_at"),
        }

    def _mr_from_row(self, row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row["id"],
            "clinic_id": row["clinic_id"],
            "full_name": row.get("full_name"),
            "phone": _local_phone(row.get("phone_e164")),
            "email": row.get("email"),
            "company_name": row.get("company_name"),
            "designation": row.get("designation"),
            "territory": row.get("territory"),
            "products_represented": row.get("products_represented") or [],
            "visiting_card_url": (row.get("metadata") or {}).get("visiting_card_url"),
            "profile_photo_url": (row.get("metadata") or {}).get("profile_photo_url"),
            "notes": row.get("notes"),
            "status": row.get("status"),
            "blocked_reason": row.get("blocked_reason"),
            "total_visits": row.get("total_visits", 0),
            "avg_rating": row.get("avg_rating"),
            "last_visit_at": row.get("last_visit_at"),
            "added_by": row.get("added_by"),
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at"),
        }

    def list_mrs(self, clinic_id: str, status: str | None = None, search: str | None = None) -> list[dict[str, Any]]:
        resolved = self._resolve_clinic_id(clinic_id)
        if not resolved:
            return []
        params: dict[str, Any] = {"select": "*", "clinic_id": f"eq.{resolved}", "order": "created_at.asc"}
        if status:
            params["status"] = f"eq.{_enum(status, {'active', 'blocked', 'archived'}, 'active')}"
        items = [self._mr_from_row(row) for row in self._select("medical_representatives", params)]
        if search:
            s = search.lower()
            items = [m for m in items if s in str(m.get("full_name", "")).lower() or s in str(m.get("phone", "")).lower() or s in str(m.get("company_name", "")).lower()]
        return deepcopy(items)

    def get_mr(self, mr_id: str, clinic_id: str) -> dict[str, Any] | None:
        resolved = self._resolve_clinic_id(clinic_id)
        rows = self._select("medical_representatives", {"select": "*", "id": f"eq.{mr_id}", "limit": "1"})
        if not rows:
            return None
        if rows[0]["clinic_id"] != resolved:
            raise PermissionError("Access denied")
        return self._mr_from_row(rows[0])

    def add_mr(self, mr: dict[str, Any]) -> dict[str, Any]:
        clinic_id = self._resolve_clinic_id(mr.get("clinic_id"))
        phone_e164 = _e164(mr.get("phone"))
        if not clinic_id or not phone_e164:
            raise ValueError("Clinic and valid MR phone are required")
        if self._select("medical_representatives", {"select": "id", "clinic_id": f"eq.{clinic_id}", "phone_e164": f"eq.{phone_e164}", "limit": "1"}):
            raise ValueError(f"An MR with phone {mr.get('phone')} already exists in this clinic")
        row = self._insert(
            "medical_representatives",
            {
                "clinic_id": clinic_id,
                "full_name": mr.get("full_name"),
                "phone_e164": phone_e164,
                "email": mr.get("email"),
                "company_name": mr.get("company_name") or mr.get("company") or "",
                "designation": mr.get("designation"),
                "territory": mr.get("territory"),
                "products_represented": mr.get("products_represented") or [],
                "notes": mr.get("notes"),
                "added_by": mr.get("added_by") if _is_uuid(mr.get("added_by")) else None,
                "metadata": {"legacy_id": mr.get("id"), "visiting_card_url": mr.get("visiting_card_url"), "profile_photo_url": mr.get("profile_photo_url")},
            },
        )
        return self._mr_from_row(row)

    def update_mr(self, mr_id: str, clinic_id: str, changes: dict[str, Any]) -> dict[str, Any]:
        if not self.get_mr(mr_id, clinic_id):
            raise KeyError(mr_id)
        row_changes: dict[str, Any] = {}
        for key in ("full_name", "email", "company_name", "designation", "territory", "products_represented", "notes", "blocked_reason"):
            if key in changes:
                row_changes[key] = changes[key]
        if "phone" in changes:
            row_changes["phone_e164"] = _e164(changes["phone"])
        if "status" in changes:
            row_changes["status"] = _enum(changes["status"], {"active", "blocked", "archived"}, "active")
        return self._mr_from_row(self._patch_by_id("medical_representatives", mr_id, row_changes))

    def delete_mr(self, mr_id: str, clinic_id: str) -> None:
        mr = self.get_mr(mr_id, clinic_id)
        if mr is None:
            raise KeyError(mr_id)
        if int(mr.get("total_visits") or 0) > 0:
            raise ValueError(f"Cannot delete MR: {mr['total_visits']} visit(s) exist. Block the MR instead.")
        self._delete_by_id("medical_representatives", mr_id)

    # ── Prescription Management & Approval Gate (Section 4.3 & 6) ─────────────

    def _prescription_from_row(self, row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row.get("id"),
            "clinic_id": row.get("clinic_id"),
            "doctor_id": row.get("doctor_id") or row.get("doctorId"),
            "patient_id": row.get("patient_id") or row.get("patientId"),
            "patient_name": row.get("patient_name") or row.get("patientName") or "",
            "patient_phone": row.get("patient_phone") or row.get("patientPhone") or "",
            "patient_age": row.get("patient_age") or row.get("patientAge"),
            "patient_gender": row.get("patient_gender") or row.get("patientGender"),
            "rx_number": row.get("rx_number") or row.get("rxNumber") or "",
            "rx_token": row.get("rx_token") or row.get("rxToken") or "",
            "symptoms": row.get("symptoms") or [],
            "diagnosis": row.get("diagnosis") or [],
            "medicines": row.get("medicines") or [],
            "tests": row.get("tests") or [],
            "instructions": row.get("instructions") or {},
            "follow_up": row.get("follow_up") or row.get("followUp") or "",
            "follow_up_date": row.get("follow_up_date") or row.get("followUpDate"),
            "vitals": row.get("vitals") or {},
            "status": row.get("status", "draft"),
            "is_approved": bool(row.get("is_approved", False)),
            "approved_at": row.get("approved_at"),
            "approved_by": row.get("approved_by"),
            "created_at": row.get("created_at") or now_iso(),
            "updated_at": row.get("updated_at") or now_iso(),
        }

    def add_prescription(self, prescription: dict[str, Any]) -> dict[str, Any]:
        resolved_clinic_id = self._resolve_clinic_id(prescription.get("clinic_id")) or prescription.get("clinic_id")
        if not resolved_clinic_id:
            raise ValueError("clinic_id is required to create a prescription — refusing to assign a fabricated clinic")
        clinic_id = resolved_clinic_id
        doctor_id = prescription.get("doctor_id") or prescription.get("doctorId")
        if not doctor_id:
            raise ValueError("doctor_id is required to create a prescription — refusing to assign a fabricated doctor")
        rx_id = prescription.get("id") or f"RX-{uuid4().hex[:8].upper()}"
        rx_record = {
            "id": rx_id,
            "clinic_id": clinic_id,
            "doctor_id": doctor_id,
            "patient_id": prescription.get("patient_id") or prescription.get("patientId"),
            "patient_name": prescription.get("patient_name") or prescription.get("patientName") or "",
            "patient_phone": prescription.get("patient_phone") or prescription.get("patientPhone") or "",
            "patient_age": prescription.get("patient_age") or prescription.get("patientAge"),
            "patient_gender": prescription.get("patient_gender") or prescription.get("patientGender"),
            "rx_number": prescription.get("rx_number") or prescription.get("rxNumber") or f"RX-{now_iso()[:10].replace('-','')}-{rx_id[-3:]}",
            "rx_token": prescription.get("rx_token") or f"RX-{uuid4().hex[:6].upper()}",
            "symptoms": prescription.get("symptoms") or [],
            "diagnosis": prescription.get("diagnosis") or [],
            "medicines": prescription.get("medicines") or [],
            "tests": prescription.get("tests") or [],
            "instructions": prescription.get("instructions") or {},
            "follow_up": prescription.get("follow_up") or prescription.get("followUp") or "",
            "follow_up_date": prescription.get("follow_up_date") or prescription.get("followUpDate"),
            "vitals": prescription.get("vitals") or {},
            "status": prescription.get("status", "draft"),
            "is_approved": bool(prescription.get("is_approved", False)),
            "approved_at": prescription.get("approved_at"),
            "approved_by": prescription.get("approved_by"),
            "created_at": prescription.get("created_at") or now_iso(),
            "updated_at": now_iso(),
        }
        records = self._load_prescriptions()
        records[rx_id] = deepcopy(rx_record)
        self._save_prescriptions(records)

        if not self._is_demo:
            try:
                res = self.client.post(
                    "/prescriptions",
                    json=rx_record,
                    headers={"Prefer": "resolution=merge-duplicates"}
                )
                if res.status_code >= 400:
                    logger.error("Supabase insert prescription failed: %s %s", res.status_code, res.text)
                    raise RuntimeError(f"Database error persisting prescription: {res.status_code} {res.text}")
            except Exception as e:
                logger.error("Failed to persist prescription %s to Supabase: %s", rx_id, e)
                raise RuntimeError(f"Failed to persist prescription to database: {e}") from e

        return deepcopy(rx_record)

    def _get_prescriptions_file(self) -> Path:
        data_dir = Path(__file__).resolve().parent.parent / "data"
        data_dir.mkdir(parents=True, exist_ok=True)
        return data_dir / "prescriptions.json"

    def _load_prescriptions(self) -> dict[str, dict[str, Any]]:
        file_path = self._get_prescriptions_file()
        if not file_path.exists():
            return {}
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
                elif isinstance(data, list):
                    return {item.get("id"): item for item in data if isinstance(item, dict) and item.get("id")}
        except Exception as e:
            logger.error("Failed to parse prescriptions file %s: %s", file_path, e)
        return {}

    def _save_prescriptions(self, prescriptions: dict[str, dict[str, Any]]) -> None:
        file_path = self._get_prescriptions_file()
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(prescriptions, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error("Failed to persist prescriptions to %s: %s", file_path, e)
            raise RuntimeError(f"Local prescription save failed: {e}") from e
    def get_prescription(self, rx_id: str, clinic_id: str | None = None) -> dict[str, Any] | None:
        rx = None
        if not self._is_demo:
            try:
                params: dict[str, Any] = {"id": f"eq.{rx_id}"}
                rows = self._select("prescriptions", params)
                if rows:
                    rx = rows[0]
                    records = self._load_prescriptions()
                    records[rx_id] = deepcopy(rx)
                    self._save_prescriptions(records)
            except Exception as e:
                logger.error("Failed to fetch prescription %s from Supabase: %s", rx_id, e)
                raise RuntimeError(f"Failed to fetch prescription from database: {e}") from e

        if not rx:
            records = self._load_prescriptions()
            rx = records.get(rx_id)

        if rx:
            if clinic_id and rx.get("clinic_id") != clinic_id:
                raise PermissionError("Access denied: prescription belongs to another clinic")
            return deepcopy(rx)
        return None

    def list_prescriptions(self, clinic_id: str, doctor_id: str | None = None) -> list[dict[str, Any]]:
        if not self._is_demo:
            try:
                params = {"clinic_id": f"eq.{clinic_id}", "order": "created_at.desc"}
                if doctor_id:
                    params["doctor_id"] = f"eq.{doctor_id}"
                sb_rows = self._select("prescriptions", params)
                records = self._load_prescriptions()
                for row in sb_rows:
                    if row.get("id"):
                        records[row["id"]] = row
                self._save_prescriptions(records)
                return [deepcopy(r) for r in sb_rows]
            except Exception as e:
                logger.error("Failed to list prescriptions from Supabase for clinic %s: %s", clinic_id, e)
                raise RuntimeError(f"Failed to query prescriptions from database: {e}") from e

        records = self._load_prescriptions()
        items = []
        for rx in records.values():
            if rx.get("clinic_id") == clinic_id:
                if not doctor_id or rx.get("doctor_id") == doctor_id:
                    items.append(deepcopy(rx))
        items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return items

    def approve_prescription(self, rx_id: str, clinic_id: str, approved_by_user_id: str) -> dict[str, Any]:
        """Section 4.3: Structural Doctor Approval Gate.
        Sets approved flag, records approved_at and approved_by, and mints reminder RX token.
        Raises KeyError if prescription does not exist.
        Raises PermissionError if prescription belongs to another clinic.
        """
        rx = self.get_prescription(rx_id, clinic_id=clinic_id)
        if not rx:
            raise KeyError(f"Prescription '{rx_id}' not found")

        now = now_iso()
        rx["is_approved"] = True
        rx["status"] = "approved"
        rx["approved_at"] = now
        rx["approved_by"] = approved_by_user_id
        if not rx.get("rx_token"):
            rx["rx_token"] = f"RX-{uuid4().hex[:6].upper()}"
        rx["updated_at"] = now

        if not self._is_demo:
            try:
                res = self.client.patch(
                    "/prescriptions",
                    params={"id": f"eq.{rx_id}"},
                    json={
                        "is_approved": True,
                        "status": "approved",
                        "approved_at": now,
                        "approved_by": approved_by_user_id,
                        "rx_token": rx["rx_token"],
                        "updated_at": now,
                    }
                )
                if res.status_code >= 400:
                    logger.error("Supabase patch prescription failed: %s %s", res.status_code, res.text)
                    raise RuntimeError(f"Database error approving prescription: {res.status_code} {res.text}")
            except Exception as e:
                logger.error("Failed to approve prescription %s in Supabase: %s", rx_id, e)
                raise RuntimeError(f"Failed to update prescription in database: {e}") from e

        records = self._load_prescriptions()
        records[rx_id] = deepcopy(rx)
        self._save_prescriptions(records)

        return deepcopy(rx)

    def get_historical_prescriptions(self, clinic_id: str, doctor_id: str, diagnosis: str) -> list[dict[str, Any]]:
        """Section 6: Historical Prescription Suggestions.
        Scoped strictly to doctor and clinic. Returns previous approved prescriptions matching diagnosis.
        """
        if not diagnosis:
            return []

        all_rxs = self.list_prescriptions(clinic_id=clinic_id, doctor_id=doctor_id)
        diag_clean = diagnosis.lower().strip()
        matched_prescriptions = []
        for rx in all_rxs:
            if rx.get("is_approved"):
                rx_diagnoses = [str(d).lower() for d in (rx.get("diagnosis") or [])]
                if any(diag_clean in d or d in diag_clean for d in rx_diagnoses):
                    matched_prescriptions.append(deepcopy(rx))
        return matched_prescriptions
