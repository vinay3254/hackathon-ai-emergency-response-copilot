import re
from typing import Dict, Any

# Predefined coordinates for common demo locations
KNOWN_LOCATIONS = {
    "indiranagar": {"lat": 12.9784, "lng": 77.6408, "name": "Indiranagar, Bangalore"},
    "koramangala": {"lat": 12.9352, "lng": 77.6245, "name": "Koramangala, Bangalore"},
    "mg road": {"lat": 12.9756, "lng": 77.6066, "name": "MG Road, Bangalore"},
    "whitefield": {"lat": 12.9698, "lng": 77.7499, "name": "Whitefield, Bangalore"},
    "hsr layout": {"lat": 12.9121, "lng": 77.6446, "name": "HSR Layout, Bangalore"},
    "jayanagar": {"lat": 12.9308, "lng": 77.5838, "name": "Jayanagar, Bangalore"},
    "times square": {"lat": 40.7580, "lng": -73.9855, "name": "Times Square, New York"},
    "brooklyn": {"lat": 40.6782, "lng": -73.9442, "name": "Brooklyn, New York"},
    "market street": {"lat": 37.7749, "lng": -122.4194, "name": "Market Street, San Francisco"}
}

def extract_fallback_classification(text: str) -> Dict[str, Any]:
    lower_text = text.lower()

    # Determine emergency type
    emergency_type = "other"
    if any(k in lower_text for k in ["fire", "flames", "smoke", "burning", "explosion", "blaze"]):
        emergency_type = "fire"
    elif any(k in lower_text for k in ["heart attack", "chest pain", "unconscious", "breathing", "stroke", "seizure", "collapsed", "bleeding", "cardiac"]):
        emergency_type = "medical"
    elif any(k in lower_text for k in ["accident", "crash", "collision", "hit and run", "overturned", "bike crash", "car crash", "pedestrian"]):
        emergency_type = "accident"
    elif any(k in lower_text for k in ["robbery", "assault", "gunshot", "shooter", "stabbed", "theft", "break-in", "hostage"]):
        emergency_type = "crime"
    elif any(k in lower_text for k in ["gas leak", "chemical", "electric wire", "flooding", "collapsed building", "landslide"]):
        emergency_type = "hazard"

    # Severity scoring (1 to 5) explainable rubric
    severity = 2
    reasons = []
    
    if any(k in lower_text for k in ["unconscious", "not breathing", "severe bleeding", "cardiac arrest", "trapped in fire", "mass casualty", "explosion"]):
        severity = 5
        reasons.append("Critical life-threatening signs identified (unconscious, severe bleeding, or active entrapment)")
    elif any(k in lower_text for k in ["multiple injured", "heavy fire", "chest pain", "head injury", "fracture", "gunshot", "deep wound"]):
        severity = 4
        reasons.append("High urgency medical/structural danger with significant injury risk")
    elif any(k in lower_text for k in ["car damage", "moderate injury", "smoke", "dizziness", "minor bleeding", "robbery"]):
        severity = 3
        reasons.append("Moderate emergency requiring prompt field dispatch")
    else:
        reasons.append("Baseline emergency response protocol applied")

    # Location extraction fallback
    location_text = "Unknown Location"
    matched_geo = None
    for loc_key, geo_data in KNOWN_LOCATIONS.items():
        if loc_key in lower_text:
            location_text = geo_data["name"]
            matched_geo = geo_data
            break
            
    if not matched_geo:
        # Check for phrases like "at ...", "near ...", "on ..."
        loc_match = re.search(r'(?:at|near|on|in|around)\s+([A-Za-z0-9\s,\.-]+?)(?:\.|$|,|\s+(?:and|with|there|is|we|please))', text, re.IGNORECASE)
        if loc_match:
            location_text = loc_match.group(1).strip()
        else:
            location_text = "Incident Site (Coordinates pending GPS trace)"
        # Default demo coordinates (Indiranagar / Metro central)
        lat, lng = 12.9784, 77.6408
    else:
        lat, lng = matched_geo["lat"], matched_geo["lng"]

    # Key entities
    entities = []
    if emergency_type != "other":
        entities.append(emergency_type.upper())
    if "unconscious" in lower_text:
        entities.append("UNCONSCIOUS_VICTIM")
    if "fire" in lower_text:
        entities.append("ACTIVE_FIRE")
    if "trapped" in lower_text:
        entities.append("PERSONS_TRAPPED")

    # Clean concise summary
    summary = f"Caller reports {emergency_type} emergency at {location_text}. "
    if "unconscious" in lower_text or "trapped" in lower_text:
        summary += "Immediate life support and extrication priority required. "
    else:
        summary += "Dispatching nearest emergency responders and notifying local hospital trauma center."

    action_required = "Immediate Ambulance & Rescue Dispatch" if severity >= 4 else "Standard Emergency Dispatch & Monitoring"

    return {
        "location_text": location_text,
        "lat": lat,
        "lng": lng,
        "emergency_type": emergency_type,
        "severity": severity,
        "severity_reasoning": " | ".join(reasons),
        "num_people_affected": 2 if "multiple" in lower_text or "people" in lower_text else 1,
        "summary": summary,
        "key_entities": entities,
        "action_required": action_required
    }
