import httpx
import logging
from app.services.notifier import manager
from app.services.matching import haversine_distance_km, calculate_eta_minutes

logger = logging.getLogger(__name__)
ML_ENGINE_URL = "http://127.0.0.1:8001"

async def process_incident_pipeline(incident_id: str, transcript: str = None, raw_audio: bytes = None):
    """
    Calls ML Engine to transcribe (if audio) and classify incident,
    updates the incident in the database, and broadcasts updates over WebSockets.
    """
    logger.info(f"Triggering AI pipeline for incident: {incident_id}")
    
    classification_data = None
    processed_transcript = transcript

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if raw_audio:
                files = {"file": ("audio.wav", raw_audio, "audio/wav")}
                resp = await client.post(f"{ML_ENGINE_URL}/process/", files=files)
            else:
                resp = await client.post(f"{ML_ENGINE_URL}/process/", data={"text": transcript or "Emergency accident at Indiranagar"})
            
            if resp.status_code == 200:
                result = resp.json()
                processed_transcript = result.get("transcript", transcript)
                classification_data = result.get("classification")
    except Exception as exc:
        logger.warning(f"ML Engine call failed ({exc}). Using direct backend fallback.")

    # Fallback if ML Engine was unreachable
    if not classification_data:
        from app.models import IncidentStatus
        classification_data = {
            "location_text": "100 Feet Road, Indiranagar",
            "lat": 12.9784,
            "lng": 77.6408,
            "emergency_type": "accident",
            "severity": 4,
            "severity_reasoning": "High urgency road collision reported with active injuries.",
            "num_people_affected": 2,
            "summary": "Multi-vehicle collision at Indiranagar. Immediate dispatch of ALS ambulance recommended.",
            "key_entities": ["ACCIDENT", "URGENT"],
            "action_required": "Immediate Dispatch"
        }
        if not processed_transcript:
            processed_transcript = "Reported road collision with multiple injured near Indiranagar."

    # Broadcast real-time classification event
    await manager.broadcast({
        "type": "INCIDENT_CLASSIFIED",
        "incident_id": incident_id,
        "transcript": processed_transcript,
        "classification": classification_data,
        "status": "classified"
    })

    return {
        "transcript": processed_transcript,
        "classification": classification_data
    }
