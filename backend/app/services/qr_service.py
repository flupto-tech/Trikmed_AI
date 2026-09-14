from __future__ import annotations

import re
import secrets
import string
from typing import Any
from urllib.parse import quote
from uuid import uuid4

from app.core.config import get_public_base_url, get_whatsapp_number
from app.utils.time import now_iso


QR_CODE_PREFIX = "TM"
QR_CODE_RANDOM_LENGTH = 6
QR_CODE_ALPHABET = "".join(ch for ch in string.ascii_uppercase + string.digits if ch not in {"I", "O"})
QR_CODE_PATTERN = re.compile(rf"^{QR_CODE_PREFIX}[A-HJ-NP-Z0-9]{{{QR_CODE_RANDOM_LENGTH}}}$")
MAX_QR_CREATE_ATTEMPTS = 50
GENERIC_QR_NOT_FOUND = "Booking link not found"


def generate_qr_code() -> str:
    suffix = "".join(secrets.choice(QR_CODE_ALPHABET) for _ in range(QR_CODE_RANDOM_LENGTH))
    return f"{QR_CODE_PREFIX}{suffix}"


def normalize_qr_code(code: str) -> str:
    return code.strip().upper()


def is_valid_qr_code_format(code: str) -> bool:
    return bool(QR_CODE_PATTERN.fullmatch(normalize_qr_code(code)))


def get_or_create_clinic_qr(store: Any, clinic_id: str) -> dict[str, Any]:
    existing = store.find_qr_by_clinic_id(clinic_id)
    if existing:
        return existing

    for _ in range(MAX_QR_CREATE_ATTEMPTS):
        code = generate_qr_code()
        if store.find_qr_by_code(code):
            continue
        timestamp = now_iso()
        try:
            return store.add_qr_code(
                {
                    "id": f"QR-{uuid4().hex[:10].upper()}",
                    "code": code,
                    "clinic_id": clinic_id,
                    "is_active": True,
                    "created_at": timestamp,
                    "updated_at": timestamp,
                }
            )
        except ValueError as exc:
            if "Clinic already has a QR code" in str(exc):
                concurrent = store.find_qr_by_clinic_id(clinic_id)
                if concurrent:
                    return concurrent
                raise
            if "QR code already exists" in str(exc):
                continue
            raise
        except RuntimeError as exc:
            message = str(exc).lower()
            if "clinic_id" in message and ("duplicate" in message or "unique" in message):
                concurrent = store.find_qr_by_clinic_id(clinic_id)
                if concurrent:
                    return concurrent
            if "code" in message and ("duplicate" in message or "unique" in message):
                continue
            raise
    raise RuntimeError("Unable to generate a unique QR code")


def lookup_qr(store: Any, code: str) -> dict[str, Any] | None:
    normalized = normalize_qr_code(code)
    if not is_valid_qr_code_format(normalized):
        return None
    return store.find_qr_by_code(normalized)


def is_qr_active(qr_code: dict[str, Any]) -> bool:
    value = qr_code.get("is_active", True)
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes"}
    return bool(value)


def qr_booking_url(qr_code: str) -> str:
    return f"{get_public_base_url()}/q/{normalize_qr_code(qr_code)}"


def shared_whatsapp_number(_clinic: dict[str, Any] | None = None) -> str:
    raw_number = get_whatsapp_number()
    if not raw_number:
        raise RuntimeError("WHATSAPP_NUMBER is not configured")
    if not re.fullmatch(r"[+\d\s().-]+", raw_number):
        raise RuntimeError("WHATSAPP_NUMBER contains invalid characters")
    number = re.sub(r"\D", "", raw_number)
    if not re.fullmatch(r"\d{8,15}", number):
        raise RuntimeError("WHATSAPP_NUMBER must include 8 to 15 digits")
    return number


def whatsapp_redirect_url(qr_code: str, clinic: dict[str, Any] | None = None) -> str:
    number = shared_whatsapp_number(clinic)
    message = quote(f"START {normalize_qr_code(qr_code)}", safe="")
    return f"https://wa.me/{number}?text={message}"
