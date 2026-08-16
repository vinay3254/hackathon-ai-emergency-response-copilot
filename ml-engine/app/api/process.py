from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.schemas.incident import IncidentClassification
from app.services.stt import transcribe_audio_stream
from app.services.reasoning import classify_transcript_with_llm

router = APIRouter()

@router.post("/")
async def process_full_pipeline(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None)
):
    """
    Accepts raw audio blob or pre-transcribed text, runs full STT -> Reasoning pipeline.
    """
    transcript = text
    if file:
        content = await file.read()
        transcript = await transcribe_audio_stream(content, filename=file.filename)
    
    if not transcript:
        raise HTTPException(status_code=400, detail="Either audio file or text transcript must be provided.")

    classification = await classify_transcript_with_llm(transcript)
    return {
        "transcript": transcript,
        "classification": classification
    }
