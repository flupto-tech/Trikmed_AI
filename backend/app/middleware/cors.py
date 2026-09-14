from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_allowed_origins


def configure_cors(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"] + get_allowed_origins(),
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1):\d+|https://.*\.(up\.railway\.app|vercel\.app)",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
