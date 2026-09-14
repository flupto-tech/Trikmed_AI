from __future__ import annotations

from fastapi import HTTPException, status


def normalize_phone(phone: str) -> str:
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    return digits


def is_valid_phone(phone: str | None) -> bool:
    if not phone:
        return False
    digits = normalize_phone(phone)
    return len(digits) == 10 and digits[0] in "6789"


def require_valid_phone(phone: str | None, label: str = "Phone number") -> str:
    if not is_valid_phone(phone):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{label} must be a valid 10-digit mobile number")
    return normalize_phone(phone or "")
