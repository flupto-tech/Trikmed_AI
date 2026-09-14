from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse

from app.api.dependencies.auth import require_clinic_user, store
from app.services.qr_service import (
    GENERIC_QR_NOT_FOUND,
    get_or_create_clinic_qr,
    is_qr_active,
    lookup_qr,
    qr_booking_url,
    whatsapp_redirect_url,
)


router = APIRouter(tags=["QR"])


@router.get("/clinics/{clinic_id}/qr")
def get_clinic_qr(clinic_id: str, current_user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    """Return the authenticated clinic's secure QR booking URL and display info."""
    if current_user.get("clinic_id") != clinic_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Access denied")

    clinic = store.get_clinic(current_user["clinic_id"])
    if not clinic:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Clinic not found")

    qr_code = get_or_create_clinic_qr(store, current_user["clinic_id"])
    return {
        "clinic_name": clinic.get("clinic_name") or clinic.get("clinicName") or "",
        "booking_url": qr_booking_url(qr_code["code"]),
        "qr_code": qr_code["code"],
    }


@router.get("/q/{qr_code}")
def redirect_qr_to_whatsapp(qr_code: str) -> RedirectResponse:
    qr = lookup_qr(store, qr_code)
    if not qr:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=GENERIC_QR_NOT_FOUND)
    if not is_qr_active(qr):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=GENERIC_QR_NOT_FOUND)

    clinic = store.get_clinic(qr["clinic_id"])
    if not clinic:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=GENERIC_QR_NOT_FOUND)

    try:
        redirect_url = whatsapp_redirect_url(qr["code"], clinic)
    except RuntimeError:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Booking service unavailable")

    return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)
