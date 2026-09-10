from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.app.core.websocket import ws_manager
from backend.app.core.logging import logger

router = APIRouter(tags=["WebSocket Realtime Events"])


@router.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and receive any client ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"type": "pong"}')
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {str(e)}")
        await ws_manager.disconnect(websocket)
