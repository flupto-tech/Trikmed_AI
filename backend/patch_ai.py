import re

file_path = r"c:\Users\Anushka Agarwal\Downloads\TRIKMED.WEB-main\TRIKMED.WEB-main\backend\app\api\routes\ai.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We want to replace the `transcribe_audio` endpoint.
new_endpoint = '''@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language_hint: str = Form("hi-IN")
) -> dict[str, Any]:
    """Transcribe doctor speech to text using local faster-whisper."""
    import tempfile
    import os
    from app.ai.whisper_service import whisper_service
    
    try:
        t0 = time.perf_counter()
        
        # Save to a temporary file
        fd, temp_path = tempfile.mkstemp(suffix=".webm")
        try:
            with os.fdopen(fd, 'wb') as f:
                f.write(await file.read())
            
            # Transcribe
            text = whisper_service.transcribe_audio(temp_path)
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
        latency = (time.perf_counter() - t0) * 1000
        return {
            "text": text,
            "language": "auto",
            "confidence": 1.0,
            "latency_ms": round(latency, 1)
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
'''

# Find everything from @router.post("/transcribe") to the next @router.post("/structure-prescription")
pattern = re.compile(r'@router\.post\("/transcribe"\).*?(?=@router\.post\("/structure-prescription"\))', re.DOTALL)
content = pattern.sub(new_endpoint + "\n\n", content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
