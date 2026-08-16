from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.notifier import manager
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/incidents")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send immediate connection acknowledgment
        await websocket.send_json({
            "type": "SYSTEM_CONNECTED",
            "message": "Connected to RescueAI Live Dispatch Stream"
        })
        while True:
            # Keep connection open and listen for any client pings
            data = await websocket.receive_text()
            # Optional echo or client heartbeat
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as exc:
        logger.error(f"WebSocket error: {exc}")
        manager.disconnect(websocket)
