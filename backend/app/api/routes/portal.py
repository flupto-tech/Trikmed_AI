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
from app.services.qr_service import get_or_create_clinic_qr, qr_booking_url
from app.utils.phone import normalize_phone, require_valid_phone
from app.utils.time import now_iso
from app.utils.users import public_user


router = APIRouter(tags=["Portal"])


def clinic_with_qr(clinic: dict[str, Any]) -> dict[str, Any]:
    qr = get_or_create_clinic_qr(store, clinic["id"])
    return {**clinic, "qr_code": qr["code"], "qr_booking_url": qr_booking_url(qr["code"])}


@router.get("/portal/demo-requests")
def portal_demo_requests(current_user: dict[str, Any] = Depends(require_portal_user)) -> list[dict[str, Any]]:
    return store.list_demo_requests()


@router.get("/portal/overview")
def portal_overview(current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    clinics = store.list_clinics()
    active = [c for c in clinics if c.get("status") == "active"]
    by_zone: dict[str, int] = {}
    for clinic in clinics:
        zone = clinic.get("zone") or "Unassigned"
        by_zone[zone] = by_zone.get(zone, 0) + 1
    return {
        "total_clinics": len(clinics),
        "active": len(active),
        "revenue": sum(int(c.get("mrr") or 0) for c in active),
        "patients": 0,
        "by_zone": [{"zone": zone, "clinics": count} for zone, count in by_zone.items()],
        "recent_onboardings": clinics[-5:],
    }


@router.get("/portal/clinics")
def portal_clinics(
    city: str | None = Query(default=None),
    zone: str | None = Query(default=None),
    status: str | None = Query(default=None),
    plan: str | None = Query(default=None),
    search: str | None = Query(default=None),
    current_user: dict[str, Any] = Depends(require_portal_user),
) -> list[dict[str, Any]]:
    clinics = store.list_clinics({"city": city, "zone": zone, "status": status, "plan": plan, "search": search})
    return [clinic_with_qr(clinic) for clinic in clinics]


@router.post("/portal/clinics")
def portal_create_clinic(payload: ClinicRequest, current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    require_valid_phone(payload.contact_phone or payload.phone)
    login_email = payload.login_email or payload.loginEmail
    login_password = payload.login_password or payload.loginPassword
    if not login_email or not login_password:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Clinic login email and password are required")
    if len(login_password) < 6:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Clinic login password must be at least 6 characters")
    if store.find_user_by_email(login_email):
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Clinic login email is already registered")

    clinic = clinic_payload(payload, status_default="approved")
    clinic["status"] = "approved"
    clinic["approved_at"] = now_iso()
    clinic["approved_by"] = current_user.get("id")
    try:
        saved_clinic = store.add_clinic(clinic)
        user = store.add_user(
            {
                "id": f"USR-{uuid4().hex[:8].upper()}",
                "email": login_email.lower(),
                "name": saved_clinic["doctor_name"],
                "role": "clinic",
                "clinic_role": "doctor_owner",
                "clinic_id": saved_clinic["id"],
                "phone": normalize_phone(saved_clinic.get("contact_phone", "")),
                "password_hash": hash_password(login_password),
                "custom_permissions": {},
                "is_active": True,
                "created_at": now_iso(),
                "last_login": "Never",
            }
        )
        return {**clinic_with_qr(saved_clinic), "login_email": user["email"], "login_user_id": user["id"]}
    except ValueError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(exc))


@router.get("/portal/clinics/{clinic_id}")
def portal_get_clinic(clinic_id: str, current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    clinic = store.get_clinic(clinic_id)
    if not clinic:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Clinic not found")
    return clinic_with_qr(clinic)


@router.get("/portal/onboardings")
def portal_onboardings(status: str | None = Query(default=None), current_user: dict[str, Any] = Depends(require_portal_user)) -> list[dict[str, Any]]:
    clinics = store.list_clinics({"status": status} if status else {})
    return [c for c in clinics if c.get("status") in {"pending_approval", "approved", "rejected", "trial"}]


@router.patch("/portal/onboardings/{clinic_id}")
def portal_update_onboarding(clinic_id: str, payload: dict[str, Any], current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    if not store.get_clinic(clinic_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Onboarding not found")
    changes = dict(payload)
    new_status = changes.get("status")
    if new_status == "approved":
        changes["approved_at"] = now_iso()
        changes["approved_by"] = current_user.get("id")
        store.update_clinic_users(clinic_id, {"is_active": True})
    if new_status == "rejected":
        changes["rejected_at"] = now_iso()
        changes["rejected_by"] = current_user.get("id")
        store.update_clinic_users(clinic_id, {"is_active": False})
    return store.update_clinic(clinic_id, changes)


@router.get("/portal/team")
def portal_team(current_user: dict[str, Any] = Depends(require_portal_user)) -> list[dict[str, Any]]:
    return [
        public_user(u)
        for u in store.list_users()
        if u.get("role") != "clinic"
    ]


@router.get("/portal/dashboard")
def portal_dashboard(current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    clinics = store.list_clinics()
    return {
        "user": public_user(current_user),
        "clinics": clinics,
        "onboardings": [c for c in clinics if c.get("status") in {"pending_approval", "trial"}],
        "stats": {
            "total_clinics": len(clinics),
            "active_clinics": len([c for c in clinics if c.get("status") == "active"]),
        },
    }


# ── MR Manager endpoints ──────────────────────────────────────────────────────


@router.post("/portal/team")
def portal_add_member(payload: dict[str, Any], current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    email = (payload.get("email") or "").lower()
    if email and store.find_user_by_email(email):
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Email already registered")
    phone = require_valid_phone(payload.get("phone") or "0000000000")
    user = store.add_user({
        "id": f"USR-{uuid4().hex[:8].upper()}",
        "name": payload.get("name", ""),
        "phone": phone,
        "email": email,
        "role": payload.get("role", "mr"),
        "zone": payload.get("zone"),
        "city": payload.get("city"),
        "password_hash": hash_password(payload.get("password") or "trikmed123"),
        "custom_permissions": {},
        "is_active": True,
        "created_at": now_iso(),
        "last_login": "Never",
    })
    return public_user(user)


@router.patch("/portal/team/{user_id}")
def portal_update_member(user_id: str, payload: dict[str, Any], current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    try:
        updated = store.update_user(user_id, payload)
    except KeyError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")
    return public_user(updated)


# ── Portal MRs & Cities ───────────────────────────────────────────────────────


@router.get("/portal/mrs")
def portal_mrs(current_user: dict[str, Any] = Depends(require_portal_user)) -> list[dict[str, Any]]:
    return [public_user(u) for u in store.list_users() if u.get("role") in {"mr", "sales"}]


@router.get("/portal/cities")
def portal_cities_list(current_user: dict[str, Any] = Depends(require_portal_user)) -> list[dict[str, Any]]:
    clinics = store.list_clinics()
    cities = sorted({c.get("city") for c in clinics if c.get("city")})
    return [{"name": city} for city in cities]


# ── Portal Commission ─────────────────────────────────────────────────────────


@router.get("/portal/commission")
def portal_commission(current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    return {"total": 0, "pending": 0, "this_month": 0, "history": []}


# ── MR Pipeline ───────────────────────────────────────────────────────────────


@router.get("/portal/mr/dashboard")
def portal_mr_dashboard(current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    return {
        "name": current_user.get("name"),
        "zone": current_user.get("zone"),
        "city": current_user.get("city"),
        "monthly_target": 10,
        "monthly_achieved": 0,
        "today_pitched": 0,
        "today_followups": 0,
        "deals_this_month": 0,
        "active_pipeline_count": 0,
        "weekly_chart": [],
        "schedule_today": [],
        "pending_followups": [],
        "commission": {"this_month": 0, "pending": 0, "total": 0, "history": []},
        "pipeline": [],
    }


@router.get("/portal/mr/pipeline")
def portal_mr_pipeline(current_user: dict[str, Any] = Depends(require_portal_user)) -> list[dict[str, Any]]:
    return []


@router.post("/portal/mr/pipeline")
def portal_add_pipeline(payload: dict[str, Any], current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    return {"id": f"PIP-{uuid4().hex[:8].upper()}", **payload, "last_contact": now_iso()[:10]}


@router.patch("/portal/mr/pipeline/{entry_id}")
def portal_update_pipeline(entry_id: str, payload: dict[str, Any], current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    return {"id": entry_id, **payload}


@router.post("/portal/mr/pipeline/{entry_id}/notes")
def portal_add_pipeline_note(entry_id: str, payload: dict[str, Any], current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, bool]:
    return {"success": True}


@router.post("/portal/mr/schedule/{schedule_id}/visited")
def portal_mark_visited(schedule_id: str, current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, bool]:
    return {"success": True}


# ── Portal Hierarchy ──────────────────────────────────────────────────────────


@router.get("/portal/hierarchy")
def portal_hierarchy(current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    return {"zones": []}


@router.get("/portal/hierarchy/zones")
def portal_hierarchy_zones(current_user: dict[str, Any] = Depends(require_portal_user)) -> list[dict[str, Any]]:
    return []


@router.get("/portal/hierarchy/zones/{zone_id}/cities")
def portal_hierarchy_zone_cities(zone_id: str, current_user: dict[str, Any] = Depends(require_portal_user)) -> list[dict[str, Any]]:
    return []


@router.get("/portal/hierarchy/cities/{city_id}/mrs")
def portal_hierarchy_city_mrs(city_id: str, current_user: dict[str, Any] = Depends(require_portal_user)) -> list[dict[str, Any]]:
    return []


@router.get("/portal/hierarchy/mrs/{mr_id}/performance")
def portal_hierarchy_mr_performance(mr_id: str, current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    return {}


# ── HR Module ─────────────────────────────────────────────────────────────────


@router.get("/portal/hr/team")
def hr_team(current_user: dict[str, Any] = Depends(require_portal_user)) -> list[dict[str, Any]]:
    return [public_user(u) for u in store.list_users() if u.get("role") != "clinic"]


@router.post("/portal/hr/team")
def hr_add_employee(payload: dict[str, Any], current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    return {"id": f"EMP-{uuid4().hex[:8].upper()}", **payload, "created_at": now_iso()}


@router.patch("/portal/hr/team/{employee_id}")
def hr_update_employee(employee_id: str, payload: dict[str, Any], current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    try:
        return public_user(store.update_user(employee_id, payload))
    except KeyError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Employee not found")


@router.patch("/portal/hr/team/{employee_id}/deactivate")
def hr_deactivate_employee(employee_id: str, current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    try:
        return public_user(store.update_user(employee_id, {"is_active": False}))
    except KeyError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Employee not found")


@router.get("/portal/hr/attendance")
def hr_attendance(
    date: str | None = Query(default=None),
    employee_id: str | None = Query(default=None),
    current_user: dict[str, Any] = Depends(require_portal_user),
) -> list[dict[str, Any]]:
    return []


@router.get("/portal/hr/payroll")
def hr_payroll(month: str | None = Query(default=None), current_user: dict[str, Any] = Depends(require_portal_user)) -> list[dict[str, Any]]:
    return []


@router.patch("/portal/hr/payroll/{entry_id}/paid")
def hr_mark_payroll_paid(entry_id: str, current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    return {"id": entry_id, "status": "paid"}


@router.get("/portal/hr/performance")
def hr_performance(month: str | None = Query(default=None), current_user: dict[str, Any] = Depends(require_portal_user)) -> list[dict[str, Any]]:
    return []


# ── Company Revenue (super only) ──────────────────────────────────────────────


@router.get("/portal/revenue")
def portal_revenue(current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    if current_user.get("role") != "super":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Super admin only")
    return {"total_revenue": 0, "mrr": 0, "arr": 0, "by_zone": [], "by_plan": []}


# ── Zone / City Performance ───────────────────────────────────────────────────

_empty_perf: dict[str, Any] = {
    "achievement_pct": 0, "deals_this_month": 0, "deals_last_month": 0,
    "active_clinics": 0, "total_clinics": 0, "growth_pct": 0, "top_performers_count": 0,
}


@router.get("/portal/zones/{zone_id}/performance")
def zone_performance(zone_id: str, current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    return _empty_perf


@router.get("/portal/cities/{city_id}/performance")
def city_performance(city_id: str, current_user: dict[str, Any] = Depends(require_portal_user)) -> dict[str, Any]:
    return _empty_perf

