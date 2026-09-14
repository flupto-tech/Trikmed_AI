from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from secrets import token_hex
from typing import Any

from app.core.config import BACKEND_ROOT, load_environment


ROOT = BACKEND_ROOT
load_environment()
SECRET = os.getenv("TRIKMED_AUTH_SECRET", "dev-only-change-me")
TOKEN_TTL_SECONDS = int(os.getenv("TRIKMED_TOKEN_TTL_SECONDS", str(60 * 60 * 24 * 7)))


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _unb64(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def hash_password(password: str) -> str:
    salt = token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000)
    return f"pbkdf2_sha256${salt}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        scheme, salt, digest = stored_hash.split("$", 2)
        if scheme != "pbkdf2_sha256":
            return False
        candidate = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()
        return hmac.compare_digest(candidate, digest)
    except Exception:
        return False


def issue_token(payload: dict[str, Any]) -> str:
    body = {**payload, "iat": int(time.time()), "exp": int(time.time()) + TOKEN_TTL_SECONDS}
    encoded = _b64(json.dumps(body, separators=(",", ":"), sort_keys=True).encode())
    sig = hmac.new(SECRET.encode(), encoded.encode(), hashlib.sha256).hexdigest()
    return f"{encoded}.{sig}"


def verify_token(token: str) -> dict[str, Any] | None:
    try:
        encoded, sig = token.split(".", 1)
        expected = hmac.new(SECRET.encode(), encoded.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(_unb64(encoded))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        return payload
    except Exception:
        return None
