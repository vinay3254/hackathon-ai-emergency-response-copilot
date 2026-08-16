from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.incident import TranscribeResponse
from app.services.stt import transcribe_audio_stream
import time

router = APIRouter()

@router.post("/", response_model=TranscribeResponse)
async def transcribe_audio(file: UploadFile = File(...)):
    start_t = time.time()
    try:
        content = await file.read()
        text = await transcribe_audio_stream(content, filename=file.filename)
        return TranscribeResponse(
            transcript=text,
            language="en",
            duration_seconds=round(time.time() - start_t, 2)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
