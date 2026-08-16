from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.services.matching import haversine_distance_km, calculate_eta_minutes
from app.services.notifier import manager
from app.schemas import DispatchCreate, DispatchOut
import uuid
from datetime import datetime

router = APIRouter()

# Realistic seed hospitals
DEFAULT_HOSPITALS = [
    {"id": "hosp-1", "name": "Manipal Hospital (Trauma Center)", "lat": 12.9592, "lng": 77.6534, "capacity": 42, "contact_number": "+91 80 2502 4444", "status": "Ready"},
    {"id": "hosp-2", "name": "Apollo Emergency Care", "lat": 12.9789, "lng": 77.6087, "capacity": 28, "contact_number": "+91 80 2630 4050", "status": "Ready"},
    {"id": "hosp-3", "name": "Fortis Emergency Hospital", "lat": 12.9015, "lng": 77.5989, "capacity": 35, "contact_number": "+91 80 6621 4444", "status": "Ready"},
    {"id": "hosp-4", "name": "Bowring & Lady Curzon Hospital", "lat": 12.9822, "lng": 77.6045, "capacity": 60, "contact_number": "+91 80 2559 1325", "status": "High Occupancy"},
    {"id": "hosp-5", "name": "Columbia Asia Clinic", "lat": 12.9712, "lng": 77.6356, "capacity": 18, "contact_number": "+91 80 4155 0555", "status": "Ready"}
]

# Realistic seed ambulances
DEFAULT_AMBULANCES = [
    {"id": "amb-101", "name": "ALS Unit 101 (Advanced Life Support)", "lat": 12.9750, "lng": 77.6380, "status": "available", "contact_number": "+91 98800 12345"},
    {"id": "amb-102", "name": "BLS Unit 102 (Basic Life Support)", "lat": 12.9810, "lng": 77.6450, "status": "available", "contact_number": "+91 98800 12346"},
    {"id": "amb-103", "name": "Rapid Trauma Response 103", "lat": 12.9680, "lng": 77.6120, "status": "available", "contact_number": "+91 98800 12347"},
    {"id": "amb-104", "name": "Cardiac Rescue Mobile 104", "lat": 12.9390, "lng": 77.6280, "status": "dispatched", "contact_number": "+91 98800 12348"},
    {"id": "amb-105", "name": "ALS Unit 105", "lat": 12.9150, "lng": 77.6420, "status": "available", "contact_number": "+91 98800 12349"}
]

@router.get("/nearby")
async def get_nearby_resources(lat: float, lng: float):
    # Calculate real distances and ETAs
    hospitals_with_distance = []
    for h in DEFAULT_HOSPITALS:
        dist = haversine_distance_km(lat, lng, h["lat"], h["lng"])
        eta = calculate_eta_minutes(dist)
        hospitals_with_distance.append({**h, "distance_km": dist, "eta_minutes": eta})

    ambulances_with_distance = []
    for a in DEFAULT_AMBULANCES:
        dist = haversine_distance_km(lat, lng, a["lat"], a["lng"])
        eta = calculate_eta_minutes(dist, speed_kmh=45.0)
        ambulances_with_distance.append({**a, "distance_km": dist, "eta_minutes": eta})

    hospitals_sorted = sorted(hospitals_with_distance, key=lambda x: x["distance_km"])
    ambulances_sorted = sorted(ambulances_with_distance, key=lambda x: x["distance_km"])

    return {
        "hospitals": hospitals_sorted,
        "ambulances": ambulances_sorted
    }

@router.post("/dispatch")
async def confirm_dispatch(dispatch_data: DispatchCreate):
    dispatch_id = str(uuid.uuid4())
    
    # Update ambulance status
    for amb in DEFAULT_AMBULANCES:
        if amb["id"] == dispatch_data.ambulance_id:
            amb["status"] = "dispatched"

    # Broadcast dispatch confirmed event
    dispatch_record = {
        "id": dispatch_id,
        "incident_id": dispatch_data.incident_id,
        "hospital_id": dispatch_data.hospital_id,
        "ambulance_id": dispatch_data.ambulance_id,
        "eta_minutes": dispatch_data.eta_minutes or 6,
        "dispatched_at": datetime.utcnow().isoformat()
    }

    await manager.broadcast({
        "type": "DISPATCH_CONFIRMED",
        "dispatch": dispatch_record
    })

    return dispatch_record
