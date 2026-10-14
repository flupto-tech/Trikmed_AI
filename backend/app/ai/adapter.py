from __future__ import annotations

import json
import mimetypes
import os
import re
import tempfile
import time
from pathlib import Path
from typing import Any, Protocol, TypeVar
import httpx
from pydantic import BaseModel, Field

T = TypeVar("T", bound=BaseModel)


class Transcript(BaseModel):
    text: str
    language: str = "hi-IN"
    confidence: float = 1.0
    duration_seconds: float = 0.0


class SpeechClient(Protocol):
    def transcribe(self, audio: bytes, filename: str = "audio.wav", language_hint: str | None = None) -> Transcript: ...


class LLMClient(Protocol):
    def complete(self, system: str, user: str, schema: type[T]) -> T: ...


# ── De-identification Layer (Section 12) ──────────────────────────────────────

class DeIdentifier:
    @staticmethod
    def scrub_text(text: str, patient_name: str | None = None, doctor_name: str | None = None) -> str:
        scrubbed = text or ""
        if patient_name and len(patient_name.strip()) > 1:
            scrubbed = re.sub(re.escape(patient_name.strip()), "[PATIENT_NAME]", scrubbed, flags=re.IGNORECASE)
        if doctor_name and len(doctor_name.strip()) > 1:
            scrubbed = re.sub(re.escape(doctor_name.strip()), "[DOCTOR_NAME]", scrubbed, flags=re.IGNORECASE)
        # Scrub email addresses
        scrubbed = re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", "[EMAIL_ADDRESS]", scrubbed)
        # Scrub Aadhaar card numbers (12 digits, optional spaces/dashes)
        scrubbed = re.sub(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b", "[AADHAAR_NUMBER]", scrubbed)
        # Scrub Indian phone numbers (10 digits starting with 6-9, optional +91 prefix, spaces, dashes)
        scrubbed = re.sub(r"(?:\+91[\s\-]?)?[6-9]\d{4}[\s\-]?\d{5}\b", "[PHONE_NUMBER]", scrubbed)
        scrubbed = re.sub(r"\b[6-9]\d{9}\b", "[PHONE_NUMBER]", scrubbed)
        return scrubbed



INDIAN_CLINICAL_PROMPT = (
    "Indian clinical OPD consultation dictation with common medicines: "
    "Dolo 650, Crocin 650, Calpol 500, Augmentin 625, Azithral 500, Pan-D, Pantocid 40, "
    "Telma 40, Glycomet 500, Montair-LC, Allegra 120, Combiflam, Meftal-Spas, Voveran, "
    "O2, Taxim-O, Clavam 625, Ascoril-D, Becosules, Shelcal 500, Supradyn. "
    "Preserve symptoms, medicine brand names, dosages (mg/ml), frequencies (1-0-1, 1-0-0), "
    "timings (after food), and investigations."
)


# ── Groq Whisper Speech Provider ──────────────────────────────────────────────

class GroqWhisperSpeechClient:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("GROQ_API_KEY", "").strip()

    def transcribe(self, audio: bytes, filename: str = "audio.wav", language_hint: str | None = None) -> Transcript:
        if not self.api_key:
            return LocalStubSpeechClient().transcribe(audio, filename=filename, language_hint=language_hint)

        url = "https://api.groq.com/openai/v1/audio/transcriptions"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        data = {
            "model": "whisper-large-v3-turbo",
            "temperature": "0.0",
            "response_format": "json",
            "prompt": INDIAN_CLINICAL_PROMPT,
        }
        if language_hint:
            data["language"] = language_hint.split("-")[0]  # e.g. 'hi' for 'hi-IN'

        mime_type = mimetypes.guess_type(filename)[0] or "audio/wav"
        files = {"file": (filename, audio, mime_type)}

        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, headers=headers, data=data, files=files)
            if resp.status_code != 200:
                raise RuntimeError(f"Groq Whisper transcription failed: {resp.status_code} - {resp.text}")
            res_json = resp.json()
            return Transcript(
                text=res_json.get("text", "").strip(),
                language=language_hint or "hi-IN",
                confidence=0.95
            )


# ── OpenAI speech + structured prescription providers ────────────────────────

class OpenAITranscriptionClient:
    """Server-side OpenAI transcription with prompt biasing."""

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "").strip()

    def transcribe(self, audio: bytes, filename: str = "audio.wav", language_hint: str | None = None) -> Transcript:
        if not self.api_key:
            return LocalStubSpeechClient().transcribe(audio, filename=filename, language_hint=language_hint)

        data: dict[str, str] = {
            "model": os.getenv("OPENAI_TRANSCRIPTION_MODEL", "whisper-1"),
            "prompt": INDIAN_CLINICAL_PROMPT,
        }
        if language_hint:
            data["language"] = language_hint.split("-")[0]

        mime_type = mimetypes.guess_type(filename)[0] or "audio/webm"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers=headers,
                data=data,
                files={"file": (filename, audio, mime_type)},
            )
            if resp.status_code != 200:
                raise RuntimeError(f"OpenAI transcription failed: {resp.status_code} - {resp.text}")
            result = resp.json()
            text = result.get("text", "").strip()
            if not text:
                raise RuntimeError("No speech was detected. Please speak closer to the microphone and try again.")
            return Transcript(text=text, language=language_hint or "en-IN", confidence=0.95)


class OpenAILLMClient:
    """Standard OpenAI Chat Completions with JSON Object structuring."""

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "").strip()

    def complete(self, system: str, user: str, schema: type[T]) -> T:
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured")

        try:
            t0 = time.perf_counter()
            model_name = os.getenv("OPENAI_LLM_MODEL", "gpt-4o-mini")
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": f"{system}\n\nYou must respond strictly with valid JSON conforming to the schema."},
                    {"role": "user", "content": user},
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.1,
            }
            headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
            with httpx.Client(timeout=45.0) as client:
                resp = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
                latency = (time.perf_counter() - t0) * 1000
                if resp.status_code == 200:
                    result = resp.json()
                    usage = result.get("usage", {})
                    from app.services.ai_cost_logger import ai_cost_logger
                    ai_cost_logger.log_llm_cost(
                        model=model_name,
                        prompt_tokens=usage.get("prompt_tokens", max(1, len(user) // 4)),
                        completion_tokens=usage.get("completion_tokens", 50),
                        latency_ms=latency,
                    )
                    content = result["choices"][0]["message"]["content"]
                    parsed_json = json.loads(content)
                    return schema.model_validate(parsed_json)
                if resp.status_code != 200:
                    from app.services.ai_cost_logger import ai_cost_logger
                    ai_cost_logger.log_llm_cost(
                        model=model_name,
                        prompt_tokens=max(1, len(user) // 4),
                        completion_tokens=0,
                        latency_ms=latency,
                        success=False,
                    )
                    raise RuntimeError(f"OpenAI API failed ({resp.status_code}): {resp.text[:160]}")
        except Exception as err:
            try:
                from app.services.ai_cost_logger import ai_cost_logger
                ai_cost_logger.log_llm_cost(
                    model=os.getenv("OPENAI_LLM_MODEL", "gpt-4o-mini"),
                    prompt_tokens=max(1, len(user) // 4),
                    completion_tokens=0,
                    latency_ms=(time.perf_counter() - t0) * 1000 if 't0' in locals() else 0.0,
                    success=False,
                )
            except Exception:
                pass
            raise RuntimeError(f"OpenAI structuring service failed: {err}")


# ── Google Gemini LLM Provider ────────────────────────────────────────────────

class GeminiLLMClient:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "").strip()

    def complete(self, system: str, user: str, schema: type[T]) -> T:
        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured")

        models_to_try = [
            os.getenv("GEMINI_MODEL", "gemini-flash-latest"),
            "gemini-flash-latest",
            "gemini-3.8-flash",
            "gemini-3.1-flash-lite",
        ]

        json_schema = json.dumps(schema.model_json_schema(), indent=2)
        system_prompt = f"{system}\n\nYou must respond strictly with a valid JSON object adhering to this JSON Schema:\n{json_schema}"
        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"parts": [{"text": user}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.1
            }
        }

        last_error = None
        for model_name in models_to_try:
            try:
                t0 = time.perf_counter()
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
                with httpx.Client(timeout=30.0) as client:
                    resp = client.post(url, json=payload)
                    latency = (time.perf_counter() - t0) * 1000
                    if resp.status_code == 200:
                        res_data = resp.json()
                        usage = res_data.get("usageMetadata", {})
                        from app.services.ai_cost_logger import ai_cost_logger
                        ai_cost_logger.log_llm_cost(
                            model=model_name,
                            prompt_tokens=usage.get("promptTokenCount", max(1, len(user) // 4)),
                            completion_tokens=usage.get("candidatesTokenCount", 50),
                            latency_ms=latency,
                        )
                        raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                        parsed_json = json.loads(raw_text)
                        # Sanitize null list fields — Gemini sometimes returns null instead of []
                        list_fields = ["symptoms","medicines","investigations","instruction_tags","advice","warnings","extraction_warnings","follow_up"]
                        for field in list_fields:
                            if parsed_json.get(field) is None:
                                parsed_json[field] = []
                        return schema.model_validate(parsed_json)
                    last_error = f"Model {model_name} returned {resp.status_code}: {resp.text[:120]}"
                    try:
                        from app.services.ai_cost_logger import ai_cost_logger
                        ai_cost_logger.log_llm_cost(
                            model=model_name,
                            prompt_tokens=max(1, len(user) // 4),
                            completion_tokens=0,
                            latency_ms=latency,
                            success=False,
                        )
                    except Exception:
                        pass
            except Exception as e:
                last_error = f"Model {model_name} error: {e}"
                try:
                    from app.services.ai_cost_logger import ai_cost_logger
                    ai_cost_logger.log_llm_cost(
                        model=model_name,
                        prompt_tokens=max(1, len(user) // 4),
                        completion_tokens=0,
                        latency_ms=(time.perf_counter() - t0) * 1000 if 't0' in locals() else 0.0,
                        success=False,
                    )
                except Exception:
                    pass

        raise RuntimeError(f"Gemini structuring service failed across all attempted models. Last error: {last_error}")


# ── Dynamic Clinical Heuristic Parser & Fallback ──────────────────────────────

class LocalStubSpeechClient:
    def transcribe(self, audio: bytes, filename: str = "audio.wav", language_hint: str | None = None) -> Transcript:
        return Transcript(
            text="Stub audio dictation",
            language=language_hint or "hi-IN",
            confidence=0.95,
            duration_seconds=1.0,
        )



class FasterWhisperSpeechClient:
    """Local ASR adapter; model selection belongs in FASTER_WHISPER_MODEL."""
    def transcribe(self, audio: bytes, filename: str = "audio.wav", language_hint: str | None = None) -> Transcript:
        from app.ai.whisper_service import whisper_service
        suffix = Path(filename).suffix or ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as handle:
            handle.write(audio)
            temp_path = handle.name
        try:
            text = whisper_service.transcribe_audio(temp_path)
            if not text:
                raise RuntimeError("No speech was detected. Please speak closer to the microphone and try again.")
            return Transcript(text=text, language=(language_hint or "hi-IN"), confidence=0.9)
        finally:
            try:
                os.unlink(temp_path)
            except OSError:
                pass


class LocalStubLLMClient:
    """Safe offline test double that populates default schema fields without fabricating clinical details."""

    def complete(self, system: str, user: str, schema: type[T]) -> T:
        base_data: dict[str, Any] = {
            "patient_name": "",
            "age": 0,
            "diagnosis": "",
            "symptoms": [],
            "medicines": [],
            "investigations": [],
            "instruction_tags": [],
            "advice": [],
            "follow_up": [],
            "warnings": [],
            "extraction_warnings": [],
            "notes": "",
            "confidence": 1.0,
            "raw_transcript": user,
            "normalized_transcript": user,
        }
        try:
            return schema.model_validate(base_data)
        except Exception:
            try:
                return schema(**base_data)
            except Exception:
                return schema.model_validate({})


def get_speech_client() -> SpeechClient:
    provider = os.getenv("AI_SPEECH_PROVIDER", "local").lower()
    # Explicit local / faster-whisper: no cloud key needed
    if provider in ("local", "faster-whisper", "faster_whisper"):
        return FasterWhisperSpeechClient()
    # Groq Whisper (cloud)
    if provider == "groq" and os.getenv("GROQ_API_KEY"):
        return GroqWhisperSpeechClient()
    # OpenAI Whisper (cloud)
    if provider == "openai" and os.getenv("OPENAI_API_KEY"):
        return OpenAITranscriptionClient()
    # Auto-detect cloud keys when provider is unset/unknown
    if os.getenv("GROQ_API_KEY"):
        return GroqWhisperSpeechClient()
    if os.getenv("OPENAI_API_KEY"):
        return OpenAITranscriptionClient()
    # Default: local faster-whisper (never use stub in a real voice request)
    return FasterWhisperSpeechClient()


def get_llm_client() -> LLMClient:
    provider = os.getenv("AI_LLM_PROVIDER", "").lower()
    if provider == "gemini" and os.getenv("GEMINI_API_KEY"):
        return GeminiLLMClient()
    if provider == "openai" and os.getenv("OPENAI_API_KEY"):
        return OpenAILLMClient()
    if os.getenv("GEMINI_API_KEY"):
        return GeminiLLMClient()
    if os.getenv("OPENAI_API_KEY"):
        return OpenAILLMClient()
    return LocalStubLLMClient()
