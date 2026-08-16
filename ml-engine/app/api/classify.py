from fastapi import APIRouter
from app.schemas.incident import ClassifyRequest, IncidentClassification
from app.services.reasoning import classify_transcript_with_llm

router = APIRouter()

@router.post("/", response_model=IncidentClassification)
async def classify_incident(payload: ClassifyRequest):
    data = await classify_transcript_with_llm(payload.transcript)
    return IncidentClassification(**data)
