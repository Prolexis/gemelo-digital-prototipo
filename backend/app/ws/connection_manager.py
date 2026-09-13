import logging
import json
from typing import Set, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("ws_manager")

class ConnectionManager:
    def __init__(self):
        self.telemetry_connections: Set[WebSocket] = set()
        self.alerts_connections: Set[WebSocket] = set()

    async def connect_telemetry(self, websocket: WebSocket):
        await websocket.accept()
        self.telemetry_connections.add(websocket)
        logger.info(f"Nuevo cliente conectado a /ws/telemetry. Total: {len(self.telemetry_connections)}")

    def disconnect_telemetry(self, websocket: WebSocket):
        if websocket in self.telemetry_connections:
            self.telemetry_connections.remove(websocket)
            logger.info(f"Cliente desconectado de /ws/telemetry. Restantes: {len(self.telemetry_connections)}")

    async def broadcast_telemetry(self, message: Dict[str, Any]):
        if not self.telemetry_connections:
            return
        
        dead_connections = set()
        payload = json.dumps(message)
        for connection in self.telemetry_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.debug(f"Fallo enviando telemetría a WebSocket: {e}")
                dead_connections.add(connection)
        
        for dead in dead_connections:
            self.telemetry_connections.discard(dead)

    async def connect_alerts(self, websocket: WebSocket):
        await websocket.accept()
        self.alerts_connections.add(websocket)
        logger.info(f"Nuevo cliente conectado a /ws/alerts. Total: {len(self.alerts_connections)}")

    def disconnect_alerts(self, websocket: WebSocket):
        if websocket in self.alerts_connections:
            self.alerts_connections.remove(websocket)
            logger.info(f"Cliente desconectado de /ws/alerts. Restantes: {len(self.alerts_connections)}")

    async def broadcast_alert(self, message: Dict[str, Any]):
        if not self.alerts_connections:
            return

        dead_connections = set()
        payload = json.dumps(message)
        for connection in self.alerts_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.debug(f"Fallo enviando alerta a WebSocket: {e}")
                dead_connections.add(connection)

        for dead in dead_connections:
            self.alerts_connections.discard(dead)

ws_manager = ConnectionManager()
