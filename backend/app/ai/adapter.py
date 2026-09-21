from __future__ import annotations

import json
import mimetypes
import os
import re
import tempfile
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
        scrubbed = text
        if patient_name and len(patient_name.strip()) > 1:
            scrubbed = re.sub(re.escape(patient_name.strip()), "[PATIENT_NAME]", scrubbed, flags=re.IGNORECASE)
        if doctor_name and len(doctor_name.strip()) > 1:
            scrubbed = re.sub(re.escape(doctor_name.strip()), "[DOCTOR_NAME]", scrubbed, flags=re.IGNORECASE)
        # Scrub 10-digit Indian phone numbers
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
            return LocalStubLLMClient().complete(system, user, schema)

        try:
            payload = {
                "model": os.getenv("OPENAI_LLM_MODEL", "gpt-4o-mini"),
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
                if resp.status_code == 200:
                    result = resp.json()
                    content = result["choices"][0]["message"]["content"]
                    parsed_json = json.loads(content)
                    return schema.model_validate(parsed_json)
                print(f"[OpenAILLMClient] API warning: {resp.status_code} - {resp.text}, falling back to local clinical parser")
        except Exception as err:
            print(f"[OpenAILLMClient] Error: {err}, falling back to local clinical parser")

        return LocalStubLLMClient().complete(system, user, schema)


# ── Google Gemini LLM Provider ────────────────────────────────────────────────

class GeminiLLMClient:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "").strip()

    def complete(self, system: str, user: str, schema: type[T]) -> T:
        if not self.api_key:
            return LocalStubLLMClient().complete(system, user, schema)

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

        for model_name in models_to_try:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
                with httpx.Client(timeout=30.0) as client:
                    resp = client.post(url, json=payload)
                    if resp.status_code == 200:
                        res_data = resp.json()
                        raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                        parsed_json = json.loads(raw_text)
                        # Sanitize null list fields — Gemini sometimes returns null instead of []
                        list_fields = ["symptoms","medicines","investigations","instruction_tags","advice","warnings","extraction_warnings","follow_up"]
                        for field in list_fields:
                            if parsed_json.get(field) is None:
                                parsed_json[field] = []
                        return schema.model_validate(parsed_json)
                    print(f"[GeminiLLMClient] Model {model_name} returned {resp.status_code}: {resp.text[:120]}")
            except Exception as e:
                print(f"[GeminiLLMClient] Model {model_name} error: {e}")

        print("[GeminiLLMClient] All models failed, falling back to local clinical parser")
        return LocalStubLLMClient().complete(system, user, schema)


# ── Dynamic Clinical Heuristic Parser & Fallback ──────────────────────────────

class LocalStubSpeechClient:
    def transcribe(self, audio: bytes, filename: str = "audio.wav", language_hint: str | None = None) -> Transcript:
        return Transcript(
            text="Dolo 650 din mein do baar khana khane ke baad, Pan-D subah khali pet ek goli teen din ke liye.",
            language=language_hint or "hi-IN",
            confidence=0.95,
            duration_seconds=5.0
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
    """Intelligent offline clinical extractor that parses symptoms, medicines, frequencies,
    and durations directly from Hinglish text when third-party LLMs are unavailable or offline."""

    def complete(self, system: str, user: str, schema: type[T]) -> T:
        text = user.strip()
        from app.services.drug_validator import drug_validator

        symptoms: list[str] = []
        # Detect symptoms (English & Hinglish)
        symptom_patterns = [
            (r"\b(bhari sar dard|severe headache)\b", "Severe Headache"),
            (r"\b(tej tapman|high fever|high temperature)\b", "High Fever"),
            (r"\b(tapman|bukhar|fever|taap)\b", "Fever"),
            (r"\b(sar dard|headache|sar me(?:in)? dard|sir me(?:in)? dard|sir dard)\b", "Headache"),
            (r"\b(pet dard|stomach ache|abdominal pain|pet kharab|pet me(?:in)? dard)\b", "Abdominal pain"),
            (r"\b(chest pain|seene me(?:in)? dard|chhati me(?:in)? dard)\b", "Chest pain"),
            (r"\b(saans lene me(?:in)? takleef|breathlessness|shortness of breath|dyspnea)\b", "Breathlessness"),
            (r"\b(gala kharab|gale me(?:in)? dard|throat pain|sore throat|kharash)\b", "Sore throat"),
            (r"\b(khansi|cough|sardi|jukaam|cold)\b", "Cough & Cold"),
            (r"\b(dast|diarrhea|loose motion|loose motions)\b", "Diarrhea"),
            (r"\b(vomiting|ulti|nausea)\b", "Vomiting"),
            (r"\b(joint pain|body ache|body ek|badan dard|kamardard|kamar dard|back pain)\b", "Body ache"),
            (r"\b(kamzori|weakness|thakan|fatigue)\b", "Weakness & Fatigue"),
            (r"\b(chakkar|dizziness|giddiness)\b", "Dizziness"),
        ]
        for pattern, label in symptom_patterns:
            if re.search(pattern, text, flags=re.IGNORECASE) and label not in symptoms:
                symptoms.append(label)

        # Detect lab investigations & tests (Catalog-driven via LabTestMatcher + Open-vocabulary)
        investigations: list[str] = []
        try:
            from drug_validation.matcher import lab_test_matcher
            detected_tests = lab_test_matcher.extract_from_text(text)
            for dt in detected_tests:
                tname = dt.matched_name or dt.raw_text
                if tname and tname not in investigations:
                    investigations.append(tname)
        except Exception as e:
            # Fallback patterns if import fails
            test_patterns = [
                (r"\b(cbc|complete blood count|cbc lap test|cbc lab test|sidhi\s*si|seedhi\s*si)\b", "CBC (Complete Blood Count)"),
                (r"\b(lft|liver function test|liver function)\b", "Liver Function Test (LFT)"),
                (r"\b(kft|kidney function test|kidney function|renal function)\b", "Kidney Function Test (KFT)"),
                (r"\b(blood sugar test|fasting sugar|pp sugar|rbs test|random blood sugar)\b", "Blood Sugar Fasting"),
                (r"\b(hba1c)\b", "HbA1c"),
                (r"\b(lipid profile|lipid test|cholesterol panel|cholesterol test)\b", "Lipid Profile"),
                (r"\b(urine r/?m|urine routine|urine culture)\b", "Urine R/M"),
                (r"\b(chest x-?ray|x-?ray chest)\b", "Chest X-Ray"),
                (r"\b(ultrasound|usg abdomen)\b", "Ultrasound Abdomen"),
                (r"\b(widal|typhoid test)\b", "Typhoid Widal"),
                (r"\b(dengue|dengue ns1)\b", "Dengue NS1+IgM"),
                (r"\b(crp)\b", "CRP"),
                (r"\b(thyroid profile|thyroid test|tsh)\b", "Thyroid Profile (TSH)"),
                (r"\b(serum ferritin|ferritin test)\b", "Serum Ferritin"),
                (r"\b(d-?dimer)\b", "D-Dimer"),
                (r"\b(ecg|electrocardiogram)\b", "ECG"),
                (r"\b(echo|echocardiogram)\b", "Echocardiogram"),
                (r"\b(mri brain|ct scan|ct head)\b", "CT/MRI Scan"),
            ]
            for pattern, tname in test_patterns:
                if re.search(pattern, text, flags=re.IGNORECASE) and tname not in investigations:
                    investigations.append(tname)


        # Detect dietary & lifestyle instruction tags
        instruction_tags: list[str] = []
        instr_patterns = [
            (r"\b(avoid oily and spicy food|oily and spicy food avoid|tel mirch masala avoid|oily food avoid|avoid spicy|oily aur spicy)\b", "Avoid oily and spicy food"),
            # "oily khana avoid" / "oily food avoid" — common Hinglish form
            (r"\boily\s+(?:khana|food|khaana)\s+(?:avoid|mat khao|nahi khana)\b", "Avoid oily and spicy food"),
            (r"\b(bed rest|bed rest advised|aaram karna|rest karna|bed rest karein)\b", "Bed rest advised"),
            (r"\b(plenty of fluids|paani khoob peena|paani zyada|fluids|khub paani)\b", "Plenty of fluids (2-3 litres per day)"),
            (r"\b(low salt|kam namak|salt restriction)\b", "Low salt diet"),
            (r"\b(avoid sweets|sugar avoid|mithai band|meetha band)\b", "Diabetic diet — avoid sweets"),
            (r"\b(steam inhalation|bhap lena|bhaap)\b", "Steam inhalation twice daily"),
            (r"\b(gargle|garare|namak paani)\b", "Warm saline gargles"),
            (r"\b(complete course|dawa ka pura course)\b", "Take complete course of medicines"),
            (r"\b(regular exercise|exercise karein|walk karein)\b", "Regular exercise / 30 min daily walk"),
        ]
        for pattern, iname in instr_patterns:
            if re.search(pattern, text, flags=re.IGNORECASE) and iname not in instruction_tags:
                instruction_tags.append(iname)

        # Detect follow up
        follow_up = "3 days"
        if re.search(r"(3 din ke ba[ad]|3 days|teen din ba[ad])", text, flags=re.IGNORECASE):
            follow_up = "3 days"
        elif re.search(r"(ek hafta|1 week|7 din|saat din)", text, flags=re.IGNORECASE):
            follow_up = "1 week"
        elif re.search(r"(2 weeks?|do hafte)", text, flags=re.IGNORECASE):
            follow_up = "2 weeks"
        elif re.search(r"(sos|zaroorat padne par)", text, flags=re.IGNORECASE):
            follow_up = "SOS"

        # Detect medicines by scanning words and phrases
        detected_meds: list[dict[str, Any]] = []
        seen_names: set[str] = set()   # full brand names already added
        seen_bases: set[str] = set()   # base stems already added (e.g. "nitrocontin", "allegra")
        seen_norm_brands: set[str] = set()

        # 1. Check all registered brand names and generic names
        for med in drug_validator.medicines:
            bname = med.get("brand_name", "")
            gname = med.get("generic_name", "")
            bname_base = bname.split()[0] if bname else ""
            clean_bname = re.sub(r"[\s\-_]+", "", bname.lower())
            if bname_base.lower() in seen_bases or clean_bname in seen_norm_brands:
                continue

            # Check exact, hyphenated, space variants (e.g. Pan-D vs Pan D)
            bname_variants = [bname]
            if "-" in bname:
                bname_variants.append(bname.replace("-", " "))
            elif " " in bname:
                bname_variants.append(bname.replace(" ", "-"))

            matched_variant = None
            for bv in bname_variants:
                if re.search(r"\b" + re.escape(bv) + r"\b", text, re.I):
                    matched_variant = bv
                    break

            is_match = bool(matched_variant)
            if not is_match and bname_base and len(bname_base) > 3:
                if re.search(r"\b" + re.escape(bname_base) + r"\b", text, re.I):
                    is_match = True
                    matched_variant = bname_base
            if not is_match and gname and len(gname) > 3:
                if re.search(r"\b" + re.escape(gname) + r"\b", text, re.I):
                    is_match = True
                    matched_variant = gname

            if is_match and bname not in seen_names and clean_bname not in seen_norm_brands:
                seen_names.add(bname)
                seen_norm_brands.add(clean_bname)
                if bname_base:
                    seen_bases.add(bname_base.lower())

                # Find local context snippet for this medicine
                pos = -1
                for cand_str in ([matched_variant] if matched_variant else []) + bname_variants + [bname_base]:
                    if cand_str:
                        pos = text.lower().find(cand_str.lower())
                        if pos != -1:
                            break

                drug_context_text = text
                if pos != -1:
                    snippet = text[pos:]
                    bound_match = re.search(r"(?:aur\s+(?:gale|pet|patient|blood|chest|chhati|seene)|[.;\n]|$)", snippet[15:], re.I)
                    cut = 15 + bound_match.start() if bound_match else 140
                    drug_context_text = snippet[:min(cut, 140)]

                # Extract duration
                drug_dur_match = re.search(r"(\d+)\s*(din|days?|hafte|weeks?)", drug_context_text, re.I)
                if not drug_dur_match:
                    drug_dur_match = re.search(r"\b" + re.escape(bname_base.replace("-", "[ -]?")) + r"[^.]*?(\d+)\s*(din|days?)", text, re.I)
                dur = f"{drug_dur_match.group(1)} days" if drug_dur_match else ("3 days")

                # Extract frequency
                freq = "1-0-1"
                morn, aft, night = True, False, True
                if re.search(r"(teen\s+ba*r|teen\s+time|1-1-1|three\s+times|3\s+times|3\s+ba*r|subah\s+dopahar\s+raat)", drug_context_text, re.I):
                    freq, morn, aft, night = "1-1-1", True, True, True
                elif re.search(r"(din\s+me(?:in)?\s+ek\s+ba*r|ek\s+ba*r|1-0-0|once\s+a\s+day|once\s+daily|subah\s+khane|sirf\s+subah|roz\s+subah|subah\s+ko|1\s+ba*r)", drug_context_text, re.I):
                    freq, morn, aft, night = "1-0-0", True, False, False
                elif re.search(r"(sirf\s+raat|sote\s+waqt|0-0-1|once\s+at\s+night|raat\s+ko|raat\s+me(?:in)?|night\s+only)", drug_context_text, re.I):
                    freq, morn, aft, night = "0-0-1", False, False, True
                elif re.search(r"(do\s+ba*r|1-0-1|twice\s+daily|din\s+me(?:in)?\s+do\s+ba*r|2\s+ba*r|do\s+time|2\s+time|subah\s+shaam)", drug_context_text, re.I):
                    freq, morn, aft, night = "1-0-1", True, False, True
                elif re.search(r"\b(subah)\b", drug_context_text, re.I) and not re.search(r"\b(shaam|raat)\b", drug_context_text, re.I):
                    freq, morn, aft, night = "1-0-0", True, False, False

                # Extract food timing
                after_food = True
                if re.search(r"(khali\s+pet|bhookhe\s+pet|before\s+food|empty\s+stomach|khane\s+se\s+p[ae]hle|khane\s+ke\s+p[ae]hle)", drug_context_text, re.I):
                    after_food = False
                elif re.search(r"(khane\s+ke\s+ba*d|nashte\s+ke\s+ba*d|after\s+food)", drug_context_text, re.I):
                    after_food = True

                # Extract dose if spoken (e.g. 200mg, 650mg)
                dose_match = re.search(r"\b" + re.escape(bname_base) + r"[^\d]*?(\d+\s*mg)", text, re.I)
                dose = dose_match.group(1).replace(" ", "") if dose_match else med.get("strength", "")

                detected_meds.append({
                    "name": bname,
                    "dose": dose,
                    "frequency": freq,
                    "duration": dur,
                    "morning": morn,
                    "afternoon": aft,
                    "night": night,
                    "after_food": after_food
                })

        # 2b. Open-Vocabulary Drug Detection — Name + bare numeric strength ("pant 40", "allegra", "nitro glycerine")
        # This catches drugs spoken WITHOUT explicit unit (mg/g/ml) - uses pre-corrected transcript hints
        # Also catches [likely: X] annotations injected by pre_correct_transcript
        likely_inline = re.findall(r"\[likely:\s*([^\]]+)\]", text)
        for lm in likely_inline:
            lm = lm.strip()
            lm_base = lm.split()[0].lower() if lm else ""
            if lm_base in seen_bases:
                continue
            if lm not in seen_names and not any(lm.lower() in sn.lower() for sn in seen_names):
                seen_names.add(lm)
                if lm_base:
                    seen_bases.add(lm_base)
                pos = text.lower().find(lm.split()[0].lower())
                local_ctx = text[max(0, pos):pos+200] if pos != -1 else text[:200]
                freq, morn, aft, night = "1-0-1", True, False, True
                if re.search(r"(teen baar|teen time|1-1-1|three times)", local_ctx, re.I):
                    freq, morn, aft, night = "1-1-1", True, True, True
                elif re.search(r"(ek baar|din mein ek baar|once daily|1-0-0)", local_ctx, re.I):
                    freq, morn, aft, night = "1-0-0", True, False, False
                elif re.search(r"(raat ko|sote waqt|night|sirf raat)", local_ctx, re.I):
                    freq, morn, aft, night = "0-0-1", False, False, True
                elif re.search(r"(subah|morning|sirf subah)", local_ctx, re.I):
                    freq, morn, aft, night = "1-0-0", True, False, False
                dur_m = re.search(r"(\d+)\s*(din|days?)", local_ctx, re.I)
                dur = f"{dur_m.group(1)} days" if dur_m else "3 days"
                after_food = not bool(re.search(r"(khali pet|khane se pahle|khane ke pahle|before food|empty stomach)", local_ctx, re.I))

                # Find the medicine's default strength from brand_lookup if available
                med_info = drug_validator.brand_lookup.get(lm.lower()) or drug_validator.brand_lookup.get(lm.lower().split()[0])
                dose = med_info.get("strength", "") if med_info else ""

                detected_meds.append({
                    "name": lm,
                    "dose": dose,
                    "frequency": freq,
                    "duration": dur,
                    "morning": morn,
                    "afternoon": aft,
                    "night": night,
                    "after_food": after_food
                })

        # 2. Open-Vocabulary Drug Detection: Match any spoken DrugName + Dose (e.g., "Monocef 1 gm", "Azithral 500 mg")
        open_drug_matches = re.finditer(r"\b([A-Za-z0-9\-_]{3,25})\s+(\d+\s*(?:mg|gm|g|ml|mcg|iu|tablet|tab|cap))\b", text, re.I)
        for odm in open_drug_matches:
            dname = odm.group(1).strip().capitalize()
            dname_base = dname.split()[0].lower() if dname else ""
            if dname_base in seen_bases:
                continue
            ddose = odm.group(2).strip().replace(" ", "")
            # Skip if already detected or if it's a common Hindi/English number or unit
            if dname.lower() not in ("din", "days", "mein", "patient", "baad", "lena", "hai") and not any(dname.lower() in sn.lower() for sn in seen_names):
                seen_names.add(dname)
                if dname_base:
                    seen_bases.add(dname_base)
                # Find local frequency
                pos = odm.start()
                local_ctx = text[pos:pos+150]
                freq, morn, aft, night = "1-0-1", True, False, True
                if re.search(r"(teen baar|teen time|1-1-1|three times)", local_ctx, re.I):
                    freq, morn, aft, night = "1-1-1", True, True, True
                elif re.search(r"(ek baar|1-0-0|once daily|raat ko|sote waqt)", local_ctx, re.I):
                    if re.search(r"(raat ko|sote waqt|night)", local_ctx, re.I):
                        freq, morn, aft, night = "0-0-1", False, False, True
                    else:
                        freq, morn, aft, night = "1-0-0", True, False, False

                dur_match = re.search(r"(\d+)\s*(din|days?)", local_ctx, re.I)
                dur = f"{dur_match.group(1)} days" if dur_match else "3 days"
                after_food = not bool(re.search(r"(khali pet|before food|empty stomach)", local_ctx, re.I))

                detected_meds.append({
                    "name": dname,
                    "dose": ddose,
                    "frequency": freq,
                    "duration": dur,
                    "morning": morn,
                    "afternoon": aft,
                    "night": night,
                    "after_food": after_food
                })

        # 3. If no known medicine matched from dictionary, check for likely annotations or fallback
        if not detected_meds:
            likely_matches = re.findall(r"\[likely:\s*([^\]]+)\]", text)
            for lm in likely_matches:
                if lm not in seen_names:
                    seen_names.add(lm)
                    detected_meds.append({
                        "name": lm,
                        "dose": "",
                        "frequency": "1-0-1",
                        "duration": "3 days",
                        "morning": True,
                        "afternoon": False,
                        "night": True,
                        "after_food": True
                    })

        diagnosis = "Acute Febrile Illness / Headache" if "High Fever" in symptoms or "Headache" in symptoms else ("Cardiac / Chest Evaluation" if "Chest pain" in symptoms else "General Consultation")
        notes_parts = ["Follow up if not improved."]
        if instruction_tags:
            notes_parts.append(", ".join(instruction_tags) + ".")

        raw_data = {
            "patient_name": "",
            "age": 0,
            "symptoms": symptoms or ["General consultation"],
            "diagnosis": diagnosis,
            "medicines": detected_meds,
            "investigations": investigations,
            "instruction_tags": instruction_tags,
            "follow_up": follow_up,
            "notes": " ".join(notes_parts),
            "confidence": 0.95
        }
        return schema.model_validate(raw_data)


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
