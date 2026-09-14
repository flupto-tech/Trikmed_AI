from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


BACKEND_ROOT = Path(__file__).resolve().parents[2]


def load_environment() -> None:
    """Load local env files."""
    for path in (
        BACKEND_ROOT / ".env",
        BACKEND_ROOT / ".env.local",
    ):
        load_dotenv(path)


def get_allowed_origins() -> list[str]:
    return [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "").split(",") if origin.strip()]


def get_whatsapp_number() -> str:
    return os.getenv("WHATSAPP_NUMBER", "").strip()


def get_public_base_url() -> str:
    return (os.getenv("PUBLIC_BASE_URL") or "https://trikmed.com").strip().rstrip("/")
