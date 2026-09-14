from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str
    role: Literal["clinic", "admin"] = "clinic"


class StaffLoginRequest(BaseModel):
    clinic_id: str
    phone: str
    pin: str = Field(min_length=4, max_length=4)


class SignupRequest(BaseModel):
    clinic_name: str | None = None
    doctor_name: str | None = None
    email: str
    phone: str | None = None
    password: str


class DemoRequest(BaseModel):
    clinic: str
    doctor: str
    specialty: str
    phone: str
    city: str


class StaffCreateRequest(BaseModel):
    name: str
    phone: str
    email: str | None = ""
    clinic_role: Literal["doctor", "receptionist", "staff"] = "staff"
    pin: str | None = Field(default=None, min_length=4, max_length=4)


class StaffUpdateRequest(BaseModel):
    clinic_role: Literal["doctor", "receptionist", "staff"] | None = None
    is_active: bool | None = None


class PermissionsRequest(BaseModel):
    custom_permissions: dict[str, bool] = Field(default_factory=dict)


class ClinicRequest(BaseModel):
    id: str | None = None
    clinic_name: str | None = None
    clinicName: str | None = None
    doctor_name: str | None = None
    doctorName: str | None = None
    contact_phone: str | None = None
    phone: str | None = None
    whatsapp_number: str | None = None
    whatsapp: str | None = None
    address_line1: str | None = None
    addressLine1: str | None = None
    address_line2: str | None = None
    addressLine2: str | None = None
    city: str | None = None
    zone: str | None = None
    pincode: str | None = None
    specialization: str | None = None
    plan_type: str | None = None
    plan: str | None = None
    assigned_mr: str | None = None
    mr: str | None = None
    status: str | None = None
    onboarding_notes: str | None = None
    login_email: str | None = None
    loginEmail: str | None = None
    login_password: str | None = None
    loginPassword: str | None = None


class WalkInRequest(BaseModel):
    name: str
    phone: str
    age: int | None = None
    gender: str | None = None
    address: str | None = None
    emergency: str | None = None
    complaint: str | None = None
    doctorId: str | None = None
    appointmentDate: str | None = None
    appointmentTime: str | None = None
    paymentAmount: int | float | None = 0
    paymentMode: Literal["cash", "upi", "card", "skip"] = "cash"
    consultationType: str | None = "new"
    vitals: dict[str, Any] = Field(default_factory=dict)


class MRCreateBody(BaseModel):
    full_name: str
    phone: str
    email: str | None = None
    company_name: str
    designation: str | None = None
    territory: str | None = None
    products_represented: list[str] = Field(default_factory=list)
    visiting_card_url: str | None = None
    profile_photo_url: str | None = None
    notes: str | None = None


class MRUpdateBody(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    email: str | None = None
    company_name: str | None = None
    designation: str | None = None
    territory: str | None = None
    products_represented: list[str] | None = None
    visiting_card_url: str | None = None
    profile_photo_url: str | None = None
    notes: str | None = None
    status: str | None = None


class MRBlockBody(BaseModel):
    blocked_reason: str = Field(..., min_length=5, max_length=500)
