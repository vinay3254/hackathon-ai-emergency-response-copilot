from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models import IncidentStatus, ResourceStatus

class IncidentBase(BaseModel):
    raw_audio_url: Optional[str] = None
    transcript: Optional[str] = None
    emergency_type: Optional[str] = None
    severity: Optional[int] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    summary: Optional[str] = None

class IncidentCreate(IncidentBase):
    pass

class IncidentOut(IncidentBase):
    id: str
    created_at: datetime
    status: IncidentStatus

    class Config:
        from_attributes = True

class HospitalOut(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    capacity: int
    contact_number: Optional[str] = None

    class Config:
        from_attributes = True

class AmbulanceOut(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    status: ResourceStatus
    contact_number: Optional[str] = None

    class Config:
        from_attributes = True

class DispatchCreate(BaseModel):
    incident_id: str
    hospital_id: Optional[str] = None
    ambulance_id: Optional[str] = None
    eta_minutes: Optional[int] = None

class DispatchOut(DispatchCreate):
    id: str
    dispatched_at: datetime

    class Config:
        from_attributes = True
