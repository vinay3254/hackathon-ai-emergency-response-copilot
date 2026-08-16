from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from app.db import Base
import enum
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class IncidentStatus(str, enum.Enum):
    processing = "processing"
    reported = "reported"
    dispatched = "dispatched"
    resolved = "resolved"

class ResourceStatus(str, enum.Enum):
    available = "available"
    dispatched = "dispatched"

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    raw_audio_url = Column(String, nullable=True)
    transcript = Column(String, nullable=True)
    emergency_type = Column(String, nullable=True)
    severity = Column(Integer, nullable=True) # 1-5
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    status = Column(SQLEnum(IncidentStatus), default=IncidentStatus.processing)
    summary = Column(String, nullable=True)

class Hospital(Base):
    __tablename__ = "hospitals"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    capacity = Column(Integer)
    contact_number = Column(String, nullable=True)

class Ambulance(Base):
    __tablename__ = "ambulances"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    status = Column(SQLEnum(ResourceStatus), default=ResourceStatus.available)
    contact_number = Column(String, nullable=True)

class Dispatch(Base):
    __tablename__ = "dispatches"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    incident_id = Column(String, ForeignKey("incidents.id"))
    hospital_id = Column(String, ForeignKey("hospitals.id"), nullable=True)
    ambulance_id = Column(String, ForeignKey("ambulances.id"), nullable=True)
    eta_minutes = Column(Integer, nullable=True)
    dispatched_at = Column(DateTime(timezone=True), server_default=func.now())
