from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

import httpx

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import load_environment  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.storage.supabase_rest import get_supabase_admin_key, supabase_rest_headers  # noqa: E402


ADMIN_ROLE = "super"


def require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


def request(client: httpx.Client, method: str, path: str, **kwargs: Any) -> httpx.Response:
    response = client.request(method, path, **kwargs)
    if response.status_code >= 400:
        raise RuntimeError(f"Supabase {method} {path} failed: {response.status_code} {response.text}")
    return response


def select_rows(client: httpx.Client, table: str, params: dict[str, Any]) -> list[dict[str, Any]]:
    return request(client, "GET", f"/{table}", params=params).json()


def insert_row(client: httpx.Client, table: str, row: dict[str, Any]) -> dict[str, Any]:
    payload = request(client, "POST", f"/{table}", json=row).json()
    return payload[0] if isinstance(payload, list) and payload else payload


def main() -> int:
    load_environment()

    supabase_url = require_env("SUPABASE_URL").rstrip("/")
    admin_key, key_env = get_supabase_admin_key()
    if not admin_key:
        raise RuntimeError(f"{key_env} is required")
    admin_email = require_env("BOOTSTRAP_ADMIN_EMAIL").lower()
    admin_password = require_env("BOOTSTRAP_ADMIN_PASSWORD")
    admin_name = require_env("BOOTSTRAP_ADMIN_NAME")

    if "@" not in admin_email:
        raise RuntimeError("BOOTSTRAP_ADMIN_EMAIL must be a valid email address")

    headers = supabase_rest_headers(admin_key)

    with httpx.Client(base_url=f"{supabase_url}/rest/v1", headers=headers, timeout=20) as client:
        existing_admins = select_rows(
            client,
            "user_profiles",
            {"select": "id,email", "platform_role": f"eq.{ADMIN_ROLE}", "limit": "1"},
        )
        if existing_admins:
            email = existing_admins[0].get("email") or "(no email)"
            print(f"Platform administrator already exists: {email}")
            print("No changes made.")
            return 0

        existing_email = select_rows(
            client,
            "user_profiles",
            {"select": "id,email,platform_role", "email": f"eq.{admin_email}", "limit": "1"},
        )
        if existing_email:
            raise RuntimeError(
                f"User already exists for {admin_email}, but no platform administrator exists. "
                "Choose a different BOOTSTRAP_ADMIN_EMAIL or promote the existing user manually."
            )

        created = insert_row(
            client,
            "user_profiles",
            {
                "email": admin_email,
                "full_name": admin_name,
                "password_hash": hash_password(admin_password),
                "platform_role": ADMIN_ROLE,
                "is_active": True,
                "metadata": {"bootstrap_admin": True},
            },
        )

    print("Created first platform administrator successfully.")
    print(f"Admin email: {created.get('email') or admin_email}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Bootstrap failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
