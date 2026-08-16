from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import incidents, resources, ws

app = FastAPI(
    title="AI Emergency Response Copilot - Orchestration Backend",
    description="Emergency dispatch API with PostGIS matching, WebSocket broadcast, and ML orchestration",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
app.include_router(resources.router, prefix="/resources", tags=["resources"])
app.include_router(ws.router, prefix="/ws", tags=["websocket"])

@app.get("/")
async def health_check():
    return {
        "status": "online",
        "service": "backend-orchestrator",
        "active_features": ["realtime-websockets", "geospatial-matching", "ml-pipeline"]
    }
