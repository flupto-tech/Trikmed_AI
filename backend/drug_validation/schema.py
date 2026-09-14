"""Pydantic schemas for drug validation, lab test resolution, and doctor corrections.
Matches Section 3.3, 3.4 & 5.5 of TrikMed Technical Specification.
"""

from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Literal
from pydantic import BaseModel, Field


class DrugReferenceSchema(BaseModel):
    """Schema for a record in the drug_references table."""
    id: str | None = None
    brand: str
    generic: str | None = None
    strength: str | None = None
    category: str | None = None
    form: str | None = "Tablet"
    manufacturer: str | None = None
    atc_code: str | None = None
    atc_category: str | None = None
    is_active: bool = True
    created_at: str | None = None


class ValidationResult(BaseModel):
    """3-band validation outcome for an extracted medicine (Section 3.3)."""
    raw_name: str
    matched_name: str | None = None
    score: float = 0.0
    band: Literal["green", "yellow", "red"] = "red"
    auto_corrected: bool = False
    status: Literal["verified", "needs_confirmation", "unverified"] = "unverified"
    generic_name: str | None = None
    strength: str | None = None
    form: str | None = None
    category: str | None = None
    atc_code: str | None = None
    method: str = "fuzzy_match"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class LabTestReferenceSchema(BaseModel):
    """Schema for a diagnostic investigation / pathology / radiology test."""
    id: str | None = None
    test_name: str
    category: str = "Pathology"  # Hematology, Biochemistry, Radiology, Serology, etc.
    specimen: str | None = "Blood"
    turnaround_time: str | None = "Same Day"
    common_aliases: list[str] = Field(default_factory=list)
    is_fasting_required: bool = False
    is_active: bool = True


class LabTestValidationResult(BaseModel):
    """Validation outcome for a spoken lab test."""
    raw_text: str
    matched_name: str | None = None
    category: str | None = None
    specimen: str | None = None
    score: float = 0.0
    band: Literal["green", "yellow", "red"] = "red"
    is_fasting_required: bool = False
    status: Literal["verified", "needs_confirmation", "unverified"] = "unverified"


class DoctorCorrectionSchema(BaseModel):
    """Audit log entry when a doctor overrides an AI suggestion (Section 3.4)."""
    id: str | None = None
    prescription_id: str | None = None
    doctor_id: str | None = None
    item_type: Literal["drug", "lab_test", "instruction"] = "drug"
    original_text: str
    corrected_text: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
