from __future__ import annotations

import os


SUPABASE_SECRET_KEY_ENV = "SUPABASE_SECRET_KEY"
SUPABASE_SERVICE_ROLE_KEY_ENV = "SUPABASE_SERVICE_ROLE_KEY"


def get_supabase_admin_key() -> tuple[str, str]:
    """Return the preferred Supabase backend key and the env var it came from."""
    secret_key = os.getenv(SUPABASE_SECRET_KEY_ENV, "").strip()
    if secret_key:
        return secret_key, SUPABASE_SECRET_KEY_ENV

    service_role_key = os.getenv(SUPABASE_SERVICE_ROLE_KEY_ENV, "").strip()
    if service_role_key:
        return service_role_key, SUPABASE_SERVICE_ROLE_KEY_ENV

    return "", f"{SUPABASE_SECRET_KEY_ENV} or {SUPABASE_SERVICE_ROLE_KEY_ENV}"


def supabase_rest_headers(admin_key: str) -> dict[str, str]:
    headers = {
        "apikey": admin_key,
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    if admin_key.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {admin_key}"
    return headers
