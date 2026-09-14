from __future__ import annotations

from typing import Any


def public_user(user: dict[str, Any]) -> dict[str, Any]:
    hidden = {"password_hash", "pin_hash"}
    return {k: v for k, v in user.items() if k not in hidden}
