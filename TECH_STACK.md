# AI Emergency Response Copilot — Tech Stack & Architecture

## Concept

A voice-first emergency reporting system. A caller describes an incident in natural
language; the system extracts location, classifies the emergency type and severity,
finds the nearest hospitals/ambulances, generates a structured report, notifies
responders, and keeps the caller updated — all coordinated by AI instead of a
human dispatcher chain.

```
Person → AI → Emergency Classification → Nearest Resources → Coordinated Response
```

## High-Level Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  Frontend    │────▶│   Backend    │────▶│   ML Engine   │
│  (React)     │◀────│   (FastAPI)  │◀────│  (FastAPI/gRPC)│
└─────────────┘ WS   └──────────────┘     └───────────────┘
                          │      │
                          │      └──▶ PostgreSQL + PostGIS (geospatial data)
                          │
                          └──▶ Redis (pub/sub, live status, session cache)
```

## Three Independent Services

| Service | Role | Owns |
|---|---|---|
| **Frontend** | Voice capture, live dashboard, incident map | UI, real-time updates |
| **Backend** | API, orchestration, routing, notifications, DB | Business logic, persistence |
| **ML Engine** | STT, NLU/reasoning, classification, severity scoring | Model inference only |

Keeping the ML Engine as a separate service (own repo/container) means it can be
swapped, scaled, or run on GPU independently, and it's the cleanest story for a
hackathon demo — three teammates can own one service each in parallel.

## Recommended Stack Summary

**Frontend**
- React + Vite, TypeScript
- Tailwind CSS (static, no-animation UI)
- Leaflet / Mapbox GL for the live incident map
- WebSocket client for real-time status
- Zustand for state management

**Backend**
- FastAPI (Python) — async, easy to share Pydantic models with ML engine
- PostgreSQL + PostGIS — geospatial queries (nearest hospital/ambulance)
- Redis — pub/sub for live updates, session/call state
- WebSockets — pushing live updates to frontend
- Twilio / Firebase Cloud Messaging — caller & responder notifications
- OSRM or Google Maps Directions API — ETA/routing

**ML Engine**
- Whisper (local or API) — speech-to-text
- Claude API (or local LLM) — reasoning agent: extract location, classify
  emergency type, estimate severity, draft the report
- spaCy / regex fallback — lightweight NER backup for location/entity extraction
- Simple rules-based or fine-tuned classifier — severity scoring, explainable
  and fast for a live demo

## End-to-End Flow

1. Frontend records/streams audio → sends to Backend
2. Backend forwards audio to ML Engine
3. ML Engine: STT → LLM reasoning → structured JSON
   `{ location, emergency_type, severity, summary }`
4. Backend receives structured output, runs PostGIS nearest-neighbor query for
   hospitals/ambulances, builds the emergency report
5. Backend pushes live updates to Frontend via WebSocket, and alerts to
   responders via Twilio/FCM
6. Frontend renders the incident + resources on the live map, updates caller

## Suggested Repo Layout

```
rescueai/
├── frontend/        (see FRONTEND.md)
├── backend/         (see BACKEND.md)
├── ml-engine/       (see ML_ENGINE.md)
└── docker-compose.yml   # spins up all three + Postgres + Redis for the demo
```

## Demo-Day Notes

- Seed the hospital/ambulance DB with real nearby locations (use actual city
  data) so the map looks convincing.
- Keep a hardcoded fallback response path in the ML engine in case live model
  calls fail during the demo.
- The live map + WebSocket-driven status updates are the visual payoff — budget
  the most polish time there.
