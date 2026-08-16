# Backend — AI Emergency Response Copilot

## Role

Orchestrates the whole flow: receives incident input, calls the ML Engine,
runs geospatial matching, persists data, and pushes real-time updates to
responders and the caller. The backend never does model inference itself.

## Stack

- **Framework**: FastAPI (Python 3.11+), async endpoints throughout
- **DB**: PostgreSQL 16 + PostGIS extension
- **Cache / pub-sub**: Redis
- **Realtime**: native WebSockets (FastAPI's `WebSocket` support)
- **Notifications**: Twilio (SMS/voice) or Firebase Cloud Messaging (push)
- **Routing/ETA**: OSRM (self-hosted) or Google Maps Directions API
- **Auth** (if needed for responder dashboard): JWT via `fastapi-users` or a
  simple custom scheme — keep light for a hackathon
- **Migrations**: Alembic
- **ORM**: SQLAlchemy 2.0 (async) or SQLModel

## Core Responsibilities

1. Accept incident submissions (audio upload or pre-transcribed text) from
   the frontend
2. Forward to the ML Engine, receive structured classification
3. Query PostGIS for nearest hospitals and available ambulances
4. Persist the incident, its classification, and matched resources
5. Broadcast live status to connected frontend clients over WebSocket
6. Trigger notifications to matched responders
7. Serve REST endpoints for dashboard/history views

## Data Model (minimum viable)

```
incidents
  id, created_at, raw_audio_url, transcript, emergency_type,
  severity (1-5), lat, lng, status (reported|dispatched|resolved), summary

hospitals
  id, name, lat, lng, capacity, contact_number

ambulances
  id, name, lat, lng, status (available|dispatched), contact_number

dispatches
  id, incident_id, hospital_id, ambulance_id, eta_minutes, dispatched_at
```

PostGIS enables:
```sql
SELECT * FROM hospitals
ORDER BY location <-> ST_MakePoint(:lng, :lat)::geography
LIMIT 5;
```

## API Surface (draft)

| Method | Path | Purpose |
|---|---|---|
| POST | `/incidents` | Submit new incident (audio or text) |
| GET | `/incidents/{id}` | Get incident status/details |
| GET | `/incidents` | List/filter incidents (dashboard) |
| GET | `/resources/nearby?lat&lng` | Nearest hospitals + ambulances |
| POST | `/dispatch` | Confirm dispatch of a resource to an incident |
| WS | `/ws/incidents` | Live incident/status stream to frontend |

## Flow Implementation Notes

- POST `/incidents` should return immediately with an `incident_id` and
  `status: processing`, then do ML classification + matching as a background
  task — keeps the frontend responsive and lets you show a "processing"
  state in the UI.
- Use Redis pub/sub internally to decouple "incident classified" events from
  the WebSocket broadcaster, so you can add more consumers (e.g., an SMS
  worker) without touching the main request path.
- Keep the ML Engine call behind a thin client module with a timeout + retry
  and a hardcoded fallback classification, so a flaky model call doesn't
  kill the live demo.

## Suggested Folder Structure

```
backend/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── incidents.py
│   │   ├── resources.py
│   │   └── ws.py
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas (shared shape with ML engine)
│   ├── services/
│   │   ├── ml_client.py      # calls ML Engine
│   │   ├── matching.py       # PostGIS nearest-neighbor logic
│   │   └── notify.py         # Twilio/FCM
│   ├── db.py
│   └── redis_bus.py
├── alembic/
├── tests/
└── requirements.txt
```

## Local Dev

- `docker-compose.yml` should bring up Postgres (with PostGIS image),
  Redis, and the backend together, so the whole team runs one command.
