from pydantic import BaseModel, Field
from typing import Optional, Literal

class TranscribeResponse(BaseModel):
    transcript: str
    language: str = "en"
    duration_seconds: Optional[float] = None

class ClassifyRequest(BaseModel):
    transcript: str

class IncidentClassification(BaseModel):
    location_text: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    emergency_type: Literal["medical", "fire", "accident", "crime", "hazard", "other"]
    severity: int = Field(ge=1, le=5, description="Severity score from 1 (minor) to 5 (critical/life-threatening)")
    severity_reasoning: str
    num_people_affected: Optional[int] = 1
    summary: str
    key_entities: list[str] = []
    action_required: str
