"""AI Cost and Usage Logging Service.
Section 13: Track token counts, audio duration, and estimated USD/INR costs
for third-party AI APIs (OpenAI, Gemini, Groq, Whisper).
"""
from __future__ import annotations

from datetime import datetime, timezone
import os
from typing import Any

# Pricing per million tokens / per minute audio
PRICING_RATES: dict[str, dict[str, float]] = {
    # LLMs (price per 1,000,000 tokens)
    "gpt-4o-mini": {"input_per_m": 0.15, "output_per_m": 0.60},
    "gpt-4o": {"input_per_m": 2.50, "output_per_m": 10.00},
    "gemini-flash": {"input_per_m": 0.075, "output_per_m": 0.30},
    "gemini-1.5-flash": {"input_per_m": 0.075, "output_per_m": 0.30},
    "gemini-flash-latest": {"input_per_m": 0.075, "output_per_m": 0.30},
    "gemini-3.8-flash": {"input_per_m": 0.075, "output_per_m": 0.30},
    "gemini-3.1-flash-lite": {"input_per_m": 0.0375, "output_per_m": 0.15},
    # Audio ASR (price per minute)
    "whisper-1": {"per_minute": 0.006},
    "whisper-large-v3": {"per_minute": 0.006},
    "whisper-large-v3-turbo": {"per_minute": 0.003},
    "local-whisper": {"per_minute": 0.0},
}

USD_TO_INR = 84.0


class AICostLogger:
    def __init__(self) -> None:
        self.logs: list[dict[str, Any]] = []

    def log_llm_cost(
        self,
        model: str,
        prompt_tokens: int | None,
        completion_tokens: int | None,
        latency_ms: float = 0.0,
        success: bool = True,
        retry_attempt: int | None = None,
    ) -> dict[str, Any]:
        # Guard against None token counts (provider didn't return usage metadata)
        pt = prompt_tokens or 0
        ct = completion_tokens or 0
        rates = PRICING_RATES.get(model.lower()) or PRICING_RATES.get("gpt-4o-mini", {"input_per_m": 0.15, "output_per_m": 0.60})
        cost_usd = (pt * rates.get("input_per_m", 0.15) / 1_000_000.0) + (
            ct * rates.get("output_per_m", 0.60) / 1_000_000.0
        )
        record = {
            "type": "llm",
            "model": model,
            "prompt_tokens": pt,
            "completion_tokens": ct,
            "total_tokens": pt + ct,
            "latency_ms": round(latency_ms, 2),
            "cost_usd": round(cost_usd, 6),
            "cost_inr": round(cost_usd * USD_TO_INR, 4),
            "success": success,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        if retry_attempt is not None:
            record["retry_attempt"] = retry_attempt
        self.logs.append(record)
        return record

    def log_speech_cost(
        self,
        model: str,
        duration_seconds: float,
        latency_ms: float = 0.0,
        success: bool = True,
    ) -> dict[str, Any]:
        rates = PRICING_RATES.get(model.lower()) or PRICING_RATES.get("whisper-1", {"per_minute": 0.006})
        minutes = max(0.0, duration_seconds / 60.0)
        cost_usd = minutes * rates.get("per_minute", 0.006)
        record = {
            "type": "speech",
            "model": model,
            "duration_seconds": round(duration_seconds, 2),
            "latency_ms": round(latency_ms, 2),
            "cost_usd": round(cost_usd, 6),
            "cost_inr": round(cost_usd * USD_TO_INR, 4),
            "success": success,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self.logs.append(record)
        return record

    def get_cost_logs(self, limit: int = 100) -> list[dict[str, Any]]:
        return list(self.logs[-limit:])

    def get_cost_summary(self) -> dict[str, Any]:
        total_tokens = sum(l.get("total_tokens", 0) for l in self.logs if l["type"] == "llm")
        total_usd = sum(l.get("cost_usd", 0.0) for l in self.logs)
        return {
            "total_calls": len(self.logs),
            "llm_calls": sum(1 for l in self.logs if l["type"] == "llm"),
            "speech_calls": sum(1 for l in self.logs if l["type"] == "speech"),
            "total_tokens": total_tokens,
            "total_cost_usd": round(total_usd, 6),
            "total_cost_inr": round(total_usd * USD_TO_INR, 4),
        }

    def clear(self) -> None:
        self.logs.clear()


ai_cost_logger = AICostLogger()
