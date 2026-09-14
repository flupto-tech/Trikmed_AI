import asyncio
import os
import io
from fastapi import UploadFile
from app.api.routes.ai import transcribe_audio

async def main():
    try:
        # Create a small valid-ish audio or just random bytes
        mock = UploadFile(filename="test.webm", file=io.BytesIO(b"dummy audio content"))
        res = await transcribe_audio(file=mock)
        print("Success:", res)
    except Exception as e:
        print("Error:", e)

asyncio.run(main())
