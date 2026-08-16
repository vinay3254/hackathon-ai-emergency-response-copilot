from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from app.db import get_db
from app.models import Incident, IncidentStatus
from app.schemas import IncidentCreate, IncidentOut
from app.services.ml_client import process_incident_pipeline
from app.services.notifier import manager
import uuid

router = APIRouter()

# In-memory storage cache for rapid demo persistence if DB connection is fallback
INCIDENT_CACHE = {}

@router.post("/", response_model=IncidentOut)
async def create_incident(
    incident_data: Optional[IncidentCreate] = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db)
):
    inc_id = str(uuid.uuid4())
    new_inc = {
        "id": inc_id,
        "transcript": incident_data.transcript if incident_data else "Emergency voice report initiated",
        "emergency_type": incident_data.emergency_type if incident_data else "pending",
        "severity": incident_data.severity if incident_data else 3,
        "lat": incident_data.lat if incident_data else 12.9784,
        "lng": incident_data.lng if incident_data else 77.6408,
        "status": IncidentStatus.processing,
        "summary": "AI classification in progress...",
        "created_at": "2026-08-16T13:00:00Z"
    }
    INCIDENT_CACHE[inc_id] = new_inc

    # Broadcast initial incident created
    await manager.broadcast({
        "type": "INCIDENT_CREATED",
        "incident": new_inc
    })

    # Run AI pipeline in background
    async def run_pipeline():
        res = await process_incident_pipeline(inc_id, transcript=new_inc["transcript"])
        classification = res.get("classification", {})
        if inc_id in INCIDENT_CACHE:
            INCIDENT_CACHE[inc_id]["transcript"] = res.get("transcript", new_inc["transcript"])
            INCIDENT_CACHE[inc_id]["emergency_type"] = classification.get("emergency_type", "accident")
            INCIDENT_CACHE[inc_id]["severity"] = classification.get("severity", 4)
            INCIDENT_CACHE[inc_id]["lat"] = classification.get("lat", 12.9784)
            INCIDENT_CACHE[inc_id]["lng"] = classification.get("lng", 77.6408)
            INCIDENT_CACHE[inc_id]["status"] = IncidentStatus.reported
            INCIDENT_CACHE[inc_id]["summary"] = classification.get("summary", "Incident classified.")

    background_tasks.add_task(run_pipeline)
    return new_inc

@router.post("/voice")
async def create_voice_incident(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    audio_bytes = await file.read()
    inc_id = str(uuid.uuid4())
    new_inc = {
        "id": inc_id,
        "transcript": "Processing voice report...",
        "emergency_type": "processing",
        "severity": 3,
        "lat": 12.9784,
        "lng": 77.6408,
        "status": IncidentStatus.processing,
        "summary": "Audio received. Running Whisper STT and reasoning agent...",
        "created_at": "2026-08-16T13:00:00Z"
    }
    INCIDENT_CACHE[inc_id] = new_inc

    await manager.broadcast({
        "type": "INCIDENT_CREATED",
        "incident": new_inc
    })

    async def run_voice_pipeline():
        res = await process_incident_pipeline(inc_id, raw_audio=audio_bytes)
        classification = res.get("classification", {})
        if inc_id in INCIDENT_CACHE:
            INCIDENT_CACHE[inc_id]["transcript"] = res.get("transcript")
            INCIDENT_CACHE[inc_id]["emergency_type"] = classification.get("emergency_type", "accident")
            INCIDENT_CACHE[inc_id]["severity"] = classification.get("severity", 4)
            INCIDENT_CACHE[inc_id]["lat"] = classification.get("lat", 12.9784)
            INCIDENT_CACHE[inc_id]["lng"] = classification.get("lng", 77.6408)
            INCIDENT_CACHE[inc_id]["status"] = IncidentStatus.reported
            INCIDENT_CACHE[inc_id]["summary"] = classification.get("summary")

    background_tasks.add_task(run_voice_pipeline)
    return new_inc

@router.get("/")
async def list_incidents():
    # Return cache combined with defaults
    return list(INCIDENT_CACHE.values())

@router.get("/{incident_id}")
async def get_incident(incident_id: str):
    if incident_id in INCIDENT_CACHE:
        return INCIDENT_CACHE[incident_id]
    raise HTTPException(status_code=404, detail="Incident not found")
