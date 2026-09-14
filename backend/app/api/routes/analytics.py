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


router = APIRouter(tags=["Analytics"])


@router.get("/analytics/revenue-reports")
def get_revenue_reports(current_user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    """Calculate aggregated revenue statistics for the logged-in clinic."""
    clinic_id = current_user["clinic_id"]
    appointments = store.list_appointments(clinic_id)

    parsed_appts = []
    for a in appointments:
        date_str = a.get("date")
        if not date_str:
            continue
        try:
            appt_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            amount = float(a.get("paymentAmount") or a.get("payment") or 0)
            parsed_appts.append({
                "date": appt_date,
                "amount": amount,
                "type": a.get("type") or "Walk-in",
                "payment_mode": a.get("paymentMode") or "cash"
            })
        except Exception:
            continue

    today = datetime.now().date()
    current_year = today.year
    current_month = today.month

    # Monthly Calculations
    current_month_rev = sum(a["amount"] for a in parsed_appts if a["date"].year == current_year and a["date"].month == current_month)

    last_month_year = current_year if current_month > 1 else current_year - 1
    last_month = current_month - 1 if current_month > 1 else 12
    last_month_rev = sum(a["amount"] for a in parsed_appts if a["date"].year == last_month_year and a["date"].month == last_month)

    # Quarterly Calculations
    current_q = (current_month - 1) // 3 + 1
    current_q_rev = sum(a["amount"] for a in parsed_appts if a["date"].year == current_year and (a["date"].month - 1) // 3 + 1 == current_q)

    last_q_year = current_year if current_q > 1 else current_year - 1
    last_q = current_q - 1 if current_q > 1 else 4
    last_q_rev = sum(a["amount"] for a in parsed_appts if a["date"].year == last_q_year and (a["date"].month - 1) // 3 + 1 == last_q)

    # Yearly Calculations
    current_year_rev = sum(a["amount"] for a in parsed_appts if a["date"].year == current_year)
    last_year_rev = sum(a["amount"] for a in parsed_appts if a["date"].year == current_year - 1)

    def pct_change(cur: float, prev: float) -> float:
        if prev == 0:
            return 100.0 if cur > 0 else 0.0
        return round(((cur - prev) / prev) * 100.0, 1)

    # Formatted month label
    month_names_full = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    current_month_name = month_names_full[current_month - 1]

    summary = {
        "month": {
            "label": f"{current_month_name} {current_year}",
            "current": current_month_rev,
            "previous": last_month_rev,
            "percentage_change": pct_change(current_month_rev, last_month_rev),
            "trend": "up" if current_month_rev >= last_month_rev else "down"
        },
        "quarter": {
            "label": f"Q{current_q} {current_year}",
            "current": current_q_rev,
            "previous": last_q_rev,
            "percentage_change": pct_change(current_q_rev, last_q_rev),
            "trend": "up" if current_q_rev >= last_q_rev else "down"
        },
        "year": {
            "label": f"{current_year}",
            "current": current_year_rev,
            "previous": last_year_rev,
            "percentage_change": pct_change(current_year_rev, last_year_rev),
            "trend": "up" if current_year_rev >= last_year_rev else "down"
        }
    }

    # Breakdown by payment modes
    payment_modes = {}
    for a in parsed_appts:
        if a["date"].year == current_year:
            mode = (a["payment_mode"] or "cash").upper()
            payment_modes[mode] = payment_modes.get(mode, 0.0) + a["amount"]

    # Breakdown by appointment type
    app_types = {}
    for a in parsed_appts:
        if a["date"].year == current_year:
            t = a["type"] or "Walk-in"
            app_types[t] = app_types.get(t, 0.0) + a["amount"]

    # Monthly breakdown for Recharts
    monthly_data = []
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for m in range(1, 13):
        cur_rev = sum(a["amount"] for a in parsed_appts if a["date"].year == current_year and a["date"].month == m)
        prev_rev = sum(a["amount"] for a in parsed_appts if a["date"].year == current_year - 1 and a["date"].month == m)
        monthly_data.append({
            "name": month_names[m - 1],
            "current": cur_rev,
            "previous": prev_rev
        })

    # Quarterly breakdown for Recharts
    quarterly_data = []
    for q in range(1, 5):
        cur_rev = sum(a["amount"] for a in parsed_appts if a["date"].year == current_year and (a["date"].month - 1) // 3 + 1 == q)
        prev_rev = sum(a["amount"] for a in parsed_appts if a["date"].year == current_year - 1 and (a["date"].month - 1) // 3 + 1 == q)
        quarterly_data.append({
            "name": f"Q{q}",
            "current": cur_rev,
            "previous": prev_rev
        })

    return {
        "summary": summary,
        "charts": {
            "monthly": monthly_data,
            "quarterly": quarterly_data
        },
        "breakdowns": {
            "payment_modes": [{"name": k, "value": v} for k, v in payment_modes.items()],
            "appointment_types": [{"name": k, "value": v} for k, v in app_types.items()]
        }
    }


# ── Dashboard Stats ───────────────────────────────────────────────────────────


@router.get("/dashboard/stats")
def dashboard_stats(current_user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    clinic_id = current_user["clinic_id"]
    today = datetime.now(timezone.utc).date().isoformat()
    today_appts = store.list_appointments(clinic_id, date=today)
    all_patients = store.list_patients(clinic_id)
    completed = [a for a in today_appts if a.get("queueStatus") in {"completed", "done"}]
    return {
        "appointments": len(today_appts),
        "checkedIn": len([a for a in today_appts if a.get("queueStatus") not in {"cancelled", "no_show"}]),
        "missedCalls": 0,
        "revenue": sum(float(a.get("paymentAmount") or 0) for a in completed),
        "noShowRate": 0,
        "newPatients": len([p for p in all_patients if p.get("created_at", "")[:10] == today]),
        "qrBookings": len([a for a in today_appts if a.get("source") == "qr"]),
    }


# ── Create Appointment ────────────────────────────────────────────────────────

