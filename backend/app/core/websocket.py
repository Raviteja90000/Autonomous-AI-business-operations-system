import asyncio
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import WebSocket
from backend.app.core.logging import logger


class ConnectionManager:
    """Manages active WebSocket client connections and broadcasts events."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)
        logger.info(
            f"WebSocket client connected. Total connections: {len(self.active_connections)}",
            extra={"event": "websocket_connected"}
        )

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
        logger.info(
            f"WebSocket client disconnected. Total connections: {len(self.active_connections)}",
            extra={"event": "websocket_disconnected"}
        )

    async def broadcast(self, event_type: str, payload: Dict[str, Any], correlation_id: Optional[str] = None):
        """Broadcasts a structured JSON event to all connected dashboard clients."""
        message = {
            "type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "correlation_id": correlation_id,
            "data": payload,
        }
        encoded = json.dumps(message)
        
        async with self._lock:
            disconnected = []
            for connection in self.active_connections:
                try:
                    await connection.send_text(encoded)
                except Exception as e:
                    disconnected.append(connection)
            
            for conn in disconnected:
                if conn in self.active_connections:
                    self.active_connections.remove(conn)


ws_manager = ConnectionManager()
