import os
import subprocess
import tempfile
import time
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Medical prompt to bias Whisper towards clinical vocabulary
MEDICAL_PROMPT = (
    "Indian clinical OPD consultation dictation with common medicines: "
    "Dolo 650, Crocin 650, Calpol 500, Augmentin 625, Azithral 500, Pan-D, Pan D, Pantocid 40, "
    "Telma 40, Glycomet 500, Montair-LC, Allegra 120, Combiflam, Meftal-Spas, Voveran, "
    "O2, Taxim-O, Clavam 625, Ascoril-D, Becosules, Shelcal 500, Supradyn, Ecosprin 75, "
    "Monocef, Atorva 10, Amlong 5, Metformin, Glimepiride, Diclomol. "
    "Thyroid medicines: Thyronorm, Eltroxin, Levothyroxine, livo thyroxin. "
    "Common lab tests: CBC, Lipid Profile, LFT, KFT, HbA1c, Chest X-Ray, ECG, TSH, "
    "Blood Sugar Fasting, Urine R/M, Serum Ferritin, Vitamin D3, CRP, MRI scan, MRI brain, CT scan. "
    "Common symptoms: bukhar, fever, dard, pain, khansi, cough, sardi, jukaam, "
    "pet dard, sar dard, headache, body ache, chest pain, breathlessness. "
    "Common instructions: bed rest, avoid oily food, plenty of fluids. "
    "Preserve medicine brand names, dosages (mg/ml), frequencies (din mein, baar, bar), "
    "timings (subah, shaam, khane ke baad, khali pet), and investigations."
)


class WhisperService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(WhisperService, cls).__new__(cls)
        return cls._instance

    def _load_model(self):
        if self._model is None:
            from faster_whisper import WhisperModel
            model_name = (
                os.getenv("WHISPER_MODEL_SIZE")
                or os.getenv("ASR_MODEL")
                or os.getenv("FASTER_WHISPER_MODEL")
                or "large-v3"
            )
            device = (
                os.getenv("WHISPER_DEVICE")
                or os.getenv("ASR_DEVICE")
                or os.getenv("FASTER_WHISPER_DEVICE")
                or "cpu"
            )
            compute_type = (
                os.getenv("WHISPER_COMPUTE_TYPE")
                or os.getenv("ASR_COMPUTE_TYPE")
                or os.getenv("FASTER_WHISPER_COMPUTE_TYPE")
                or "int8"
            )
            logger.info(
                f"Loading faster-whisper model='{model_name}' device='{device}' compute_type='{compute_type}'. "
                "This may take a moment on first load..."
            )
            self._model = WhisperModel(model_name, device=device, compute_type=compute_type)
            logger.info(f"Whisper model '{model_name}' loaded and cached successfully.")

    def _validate_audio_file(self, audio_path: str) -> dict:
        """Fast validation of audio file without spawning unnecessary subprocesses."""
        try:
            if not os.path.exists(audio_path):
                return {"valid": False, "error": f"Audio file not found: {audio_path}"}
            size = os.path.getsize(audio_path)
            if size < 500:
                return {"valid": False, "error": f"Audio file too small: {size} bytes (likely corrupt or empty)"}

            # Optional ffprobe validation if explicitly enabled via environment
            if os.getenv("ASR_USE_FFPROBE", "false").lower() == "true":
                cmd = [
                    "ffprobe", "-v", "quiet", "-print_format", "json",
                    "-show_format", "-show_streams", audio_path
                ]
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    import json
                    info = json.loads(result.stdout)
                    fmt = info.get("format", {})
                    duration_str = fmt.get("duration")
                    duration = float(duration_str) if duration_str is not None else 0.0
                    if duration > 0 and duration < 0.3:
                        return {"valid": False, "error": f"Audio too short: {duration:.2f}s (min 0.3s required)"}
                    return {
                        "valid": True,
                        "duration_s": round(duration, 2),
                        "size_bytes": size,
                        "format": fmt.get("format_name", "unknown"),
                    }

            return {
                "valid": True,
                "duration_s": 0.0,
                "size_bytes": size,
                "format": Path(audio_path).suffix or "unknown",
            }
        except Exception as e:
            return {"valid": False, "error": str(e)}

    def _convert_to_wav(self, input_path: str) -> tuple[str, float]:
        """
        Convert any audio format to 16kHz mono 16-bit PCM WAV.
        Uses single-pass conversion by default to avoid slow 2-pass loudnorm latency.
        Returns (wav_path, conversion_latency_ms).
        """
        t0 = time.perf_counter()
        fd, wav_path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        use_loudnorm = os.getenv("ASR_USE_LOUDNORM", "false").lower() == "true"
        try:
            if use_loudnorm:
                cmd = [
                    "ffmpeg", "-y",
                    "-i", input_path,
                    "-ar", "16000",
                    "-ac", "1",
                    "-c:a", "pcm_s16le",
                    "-af", "loudnorm",
                    wav_path
                ]
            else:
                cmd = [
                    "ffmpeg", "-y",
                    "-i", input_path,
                    "-ar", "16000",
                    "-ac", "1",
                    "-c:a", "pcm_s16le",
                    wav_path
                ]

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            if result.returncode != 0 and use_loudnorm:
                cmd_simple = [
                    "ffmpeg", "-y",
                    "-i", input_path,
                    "-ar", "16000",
                    "-ac", "1",
                    "-c:a", "pcm_s16le",
                    wav_path
                ]
                result2 = subprocess.run(cmd_simple, capture_output=True, text=True, timeout=60)
                if result2.returncode != 0:
                    logger.error(f"ffmpeg conversion failed: {result2.stderr[-400:]}")
                    raise RuntimeError(f"ffmpeg conversion failed: {result2.stderr[-400:]}")
                logger.warning("loudnorm not available; converted without normalization")
            elif result.returncode != 0:
                logger.error(f"ffmpeg conversion failed: {result.stderr[-400:]}")
                raise RuntimeError(f"ffmpeg conversion failed: {result.stderr[-400:]}")

            conv_ms = (time.perf_counter() - t0) * 1000
            return wav_path, conv_ms
        except FileNotFoundError:
            logger.error("ffmpeg not found on PATH. Please install ffmpeg.")
            raise RuntimeError("ffmpeg is required for audio conversion but was not found.")

    def transcribe_audio_with_timings(self, audio_path: str, language_hint: str | None = None) -> tuple[str, dict[str, float]]:
        """
        Transcribes the given audio file using faster-whisper and returns (transcript_text, timings_dict).
        """
        self._load_model()

        validation = self._validate_audio_file(audio_path)
        if not validation.get("valid", False):
            error_msg = validation.get("error", "Unknown audio validation error")
            logger.error(f"Audio validation failed: {error_msg}")
            raise ValueError(f"Audio validation failed: {error_msg}")

        logger.info(f"Transcribing audio: {audio_path} ({validation.get('duration_s', 0)}s)")

        wav_path = None
        try:
            wav_path, conv_ms = self._convert_to_wav(audio_path)

            asr_language = None
            env_lang = os.getenv("ASR_LANGUAGE") or os.getenv("FASTER_WHISPER_LANGUAGE", "")
            if language_hint and language_hint.lower().startswith("hi"):
                asr_language = None  
            elif env_lang:
                asr_language = env_lang.split("-")[0] if env_lang else None

            vad_params = dict(
                min_silence_duration_ms=int(os.getenv("ASR_VAD_SILENCE_MS", "600")),
                speech_pad_ms=int(os.getenv("ASR_VAD_SPEECH_PAD_MS", "400")),
            )

            # Benchmark setting: beam_size=1 (greedy decoding) default for 3-5x lower latency
            beam_size = int(os.getenv("ASR_BEAM_SIZE", "1"))
            temperature = float(os.getenv("ASR_TEMPERATURE", "0.0"))
            condition_on_previous = os.getenv("ASR_CONDITION_ON_PREVIOUS", "true").lower() == "true"

            t_inf0 = time.perf_counter()
            segments, info = self._model.transcribe(
                wav_path,
                beam_size=beam_size,
                temperature=temperature,
                initial_prompt=MEDICAL_PROMPT,
                language=asr_language,
                vad_filter=True,
                vad_parameters=vad_params,
                condition_on_previous_text=condition_on_previous,
                word_timestamps=False,
            )

            transcript_parts = []
            for segment in segments:
                transcript_parts.append(segment.text.strip())

            final_text = " ".join(p for p in transcript_parts if p).strip()
            inference_ms = (time.perf_counter() - t_inf0) * 1000

            if not final_text:
                logger.warning(f"Whisper returned empty transcript from audio file: {audio_path}")
                raise ValueError("No speech detected in audio. Please speak clearly and try again.")

            logger.info(
                "Transcription complete. Language: '%s' (%.2fs, chars=%d)",
                info.language,
                info.duration,
                len(final_text),
            )

            timings = {
                "audio_conversion_ms": round(conv_ms, 1),
                "stt_inference_ms": round(inference_ms, 1),
                "duration_s": round(info.duration, 2),
            }
            return final_text, timings
        finally:
            if wav_path and os.path.exists(wav_path):
                try:
                    os.remove(wav_path)
                except OSError:
                    pass

    def transcribe_audio(self, audio_path: str, language_hint: str | None = None) -> str:
        """
        Transcribes the given audio file using the loaded Whisper model.
        Converts to WAV first for maximum codec compatibility.
        """
        text, _ = self.transcribe_audio_with_timings(audio_path, language_hint=language_hint)
        return text


whisper_service = WhisperService()
