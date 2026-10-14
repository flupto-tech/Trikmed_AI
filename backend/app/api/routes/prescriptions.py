from __future__ import annotations

from typing import Any
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies.auth import require_clinic_user, require_doctor, store
from app.services.drug_validator import drug_validator
from app.utils.time import now_iso
from drug_validation.supabase_client import supabase_drug_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Prescriptions"])


@router.get("/prescriptions")
def list_prescriptions(
    doctor_id: str | None = None,
    current_user: dict[str, Any] = Depends(require_clinic_user)
) -> list[dict[str, Any]]:
    """List all clinic prescriptions, scoped by authenticated clinic."""
    clinic_id = current_user.get("clinic_id")
    if not clinic_id:
        raise HTTPException(status_code=403, detail="Clinic identity missing from authenticated account")
    return store.list_prescriptions(clinic_id, doctor_id=doctor_id)


@router.get("/prescriptions/historical-suggestions")
def get_historical_suggestions(
    diagnosis: str = Query("", description="Diagnosis to retrieve past prescribing history for"),
    current_user: dict[str, Any] = Depends(require_clinic_user)
) -> list[dict[str, Any]]:
    """Section 6: Historical Prescription Suggestions.
    
    Invariants:
    1. Suggestions are strictly scoped to authenticated clinic & doctor.
    2. Suggestions pass through the Drug Safety Validator.
    3. Failure returns an empty list [] - never raises or delays.
    4. Labelled as past prescribing history for clinical reference.
    """
    try:
        if not diagnosis.strip():
            return []
        
        clinic_id = current_user.get("clinic_id")
        doctor_id = current_user.get("id")
        if not clinic_id or not doctor_id:
            return []

        past_rxs = store.get_historical_prescriptions(clinic_id, doctor_id, diagnosis)
        if not past_rxs:
            return []

        # Aggregate medicine frequencies
        med_counts: dict[str, dict[str, Any]] = {}
        for rx in past_rxs:
            for med in rx.get("medicines", []):
                name = (med.get("brandName") or med.get("name") or "").strip()
                if not name:
                    continue
                name_key = name.lower()
                if name_key not in med_counts:
                    # Validate drug with Drug Safety Layer
                    validation = drug_validator.validate_medicine_name(name)
                    med_counts[name_key] = {
                        "name": validation.get("matched_name") or name,
                        "raw_name": name,
                        "generic_name": med.get("genericName") or (validation.get("details") or {}).get("generic_name", ""),
                        "dose": med.get("dose") or med.get("strength") or "",
                        "dosage": med.get("dosage") or med.get("frequency") or "1-0-1",
                        "timing": med.get("timing") or "After food",
                        "duration": med.get("duration") or "3 days",
                        "count": 0,
                        "validation_band": validation.get("band", "green"),
                        "validation_status": validation.get("status", "verified"),
                    }
                med_counts[name_key]["count"] += 1

        # Sort by frequency descending
        suggestions = sorted(med_counts.values(), key=lambda x: x["count"], reverse=True)
        return suggestions[:8]
    except Exception:
        # Invariant 4: Failure returns empty list
        return []


@router.get("/prescriptions/{prescription_id}")
def get_prescription(
    prescription_id: str,
    current_user: dict[str, Any] = Depends(require_clinic_user)
) -> dict[str, Any]:
    """Retrieve a single prescription with clinic scoping check."""
    clinic_id = current_user.get("clinic_id")
    if not clinic_id:
        raise HTTPException(status_code=403, detail="Clinic identity missing from authenticated account")
    try:
        rx = store.get_prescription(prescription_id, clinic_id=clinic_id)
        if not rx:
            raise HTTPException(status_code=404, detail="Prescription not found")
        return rx
    except PermissionError:
        raise HTTPException(status_code=403, detail="Cross-clinic access denied")


@router.post("/prescriptions")
def create_prescription(
    payload: dict[str, Any],
    current_user: dict[str, Any] = Depends(require_clinic_user)
) -> dict[str, Any]:
    """Create or update a prescription record in unapproved draft state."""
    clinic_id = current_user.get("clinic_id")
    doctor_id = current_user.get("id")
    if not clinic_id or not doctor_id:
        raise HTTPException(status_code=403, detail="Clinic or doctor identity missing from authenticated account")
    
    # Auto-log doctor corrections (Section 5.3)
    # Guarded: in demo mode log_doctor_correction raises RuntimeError — log and continue.
    rx_id = payload.get("id")
    for med in payload.get("medicines", []):
        raw_name = med.get("raw_name")
        current_name = med.get("brandName") or med.get("name")
        if raw_name and current_name and raw_name.lower() != current_name.lower():
            try:
                supabase_drug_client.log_doctor_correction(
                    original_text=raw_name,
                    corrected_text=current_name,
                    prescription_id=rx_id,
                    doctor_id=doctor_id,
                    item_type="drug"
                )
            except RuntimeError as exc:
                logger.debug("log_doctor_correction skipped (demo mode or unconfigured): %s", exc)

    rx_data = {
        **payload,
        "clinic_id": clinic_id,
        "doctor_id": payload.get("doctor_id") or doctor_id,
        "is_approved": False,  # Section 4.3: Initial state is ALWAYS unapproved
        "status": "draft",
        "approved_at": None,
        "approved_by": None,
    }
    return store.add_prescription(rx_data)


@router.post("/prescriptions/{prescription_id}/approve")
def approve_prescription(
    prescription_id: str,
    current_user: dict[str, Any] = Depends(require_doctor)
) -> dict[str, Any]:
    """Section 4.3: Structural Doctor Approval Gate.
    
    Requirements:
    1. Explicit human approval action by authenticated doctor.
    2. Writes is_approved = True and approved_at timestamp.
    3. Records approved_by audit trail.
    4. Mints per-prescription RX-XXXXXX token for WhatsApp reminder opt-in (Section 9.2).
    """
    clinic_id = current_user.get("clinic_id")
    approved_by = current_user.get("id")
    if not clinic_id or not approved_by:
        raise HTTPException(status_code=403, detail="Clinic or doctor identity missing from authenticated account")

    try:
        approved_rx = store.approve_prescription(prescription_id, clinic_id, approved_by)
        
        # Build reminder opt-in link
        rx_token = approved_rx.get("rx_token")
        clinic_phone = current_user.get("phone") or "9876543210"
        opt_in_link = f"https://wa.me/91{clinic_phone}?text=OPTIN%20{rx_token}"

        return {
            "success": True,
            "prescription": approved_rx,
            "rx_token": rx_token,
            "opt_in_link": opt_in_link,
            "approved_at": approved_rx.get("approved_at"),
            "approved_by": approved_by,
            "disclaimer": "Clinical decision support only. Doctor verification mandatory."
        }
    except KeyError:
        raise HTTPException(status_code=404, detail="Prescription not found")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Cross-clinic access denied")
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/prescriptions/{prescription_id}/send-whatsapp")
def send_prescription_whatsapp(
    prescription_id: str,
    current_user: dict[str, Any] = Depends(require_clinic_user)
) -> dict[str, bool]:
    clinic_id = current_user.get("clinic_id")
    if not clinic_id:
        raise HTTPException(status_code=403, detail="Clinic identity missing from authenticated account")
    try:
        rx = store.get_prescription(prescription_id, clinic_id=clinic_id)
    except PermissionError:
        raise HTTPException(status_code=403, detail="Cross-clinic access denied")
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    if not rx.get("is_approved"):
        raise HTTPException(
            status_code=400,
            detail="Prescription must be approved by a doctor before sharing via WhatsApp"
        )
    return {"success": True}


@router.get("/prescriptions/{prescription_id}/print")
def print_prescription(
    prescription_id: str,
    current_user: dict[str, Any] = Depends(require_clinic_user)
) -> dict[str, Any]:
    clinic_id = current_user.get("clinic_id")
    if not clinic_id:
        raise HTTPException(status_code=403, detail="Clinic identity missing from authenticated account")
    try:
        rx = store.get_prescription(prescription_id, clinic_id=clinic_id)
    except PermissionError:
        raise HTTPException(status_code=403, detail="Cross-clinic access denied")
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    if not rx.get("is_approved"):
        raise HTTPException(
            status_code=400,
            detail="Prescription must be approved by a doctor before printing"
        )
    return {"success": True, "prescription": rx}

from pydantic import BaseModel

class CorrectionRequest(BaseModel):
    item_type: str = "drug"
    original_text: str
    corrected_text: str

@router.post("/prescriptions/{prescription_id}/log-correction")
def log_correction(
    prescription_id: str,
    payload: CorrectionRequest,
    current_user: dict[str, Any] = Depends(require_clinic_user)
) -> dict[str, Any]:
    """Section 5.3: Log doctor corrections for auditability and AI self-learning."""
    doctor_id = current_user.get("id")
    if not doctor_id:
        raise HTTPException(status_code=403, detail="Doctor identity missing from authenticated account")
    try:
        success = supabase_drug_client.log_doctor_correction(
            original_text=payload.original_text,
            corrected_text=payload.corrected_text,
            prescription_id=prescription_id,
            doctor_id=doctor_id,
            item_type=payload.item_type
        )
    except RuntimeError as exc:
        logger.debug("log_doctor_correction skipped (demo mode or unconfigured): %s", exc)
        success = False
    return {"success": success}

