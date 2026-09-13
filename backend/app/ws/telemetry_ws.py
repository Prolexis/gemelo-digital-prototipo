import logging
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.ws.connection_manager import ws_manager
from app.services.simulator_service import simulator_service

logger = logging.getLogger("telemetry_ws")
router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """
    Stream WebSocket de telemetría de toda la flota en tiempo real a 1 Hz.
    Envía inmediatamente una instantánea del estado actual al conectar.
    """
    await ws_manager.connect_telemetry(websocket)
    try:
        # Enviar snapshot inicial
        fleet = simulator_service.get_current_fleet()
        initial_msg = {
            "type": "INITIAL_SNAPSHOT",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "fleetSize": len(fleet),
            "equipments": fleet
        }
        await websocket.send_json(initial_msg)

        # Mantener conexión viva y escuchar posibles mensajes de control del cliente
        while True:
            # Espera ping/pong o solicitudes del cliente
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect_telemetry(websocket)
    except Exception as e:
        logger.warning(f"Excepción en /ws/telemetry: {e}")
        ws_manager.disconnect_telemetry(websocket)
