import logging
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.ws.connection_manager import ws_manager
from app.services.simulator_service import simulator_service

logger = logging.getLogger("alerts_ws")
router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    """
    Stream WebSocket de alertas de colisión críticas (HIGH / CRITICAL) con explicabilidad XAI.
    """
    await ws_manager.connect_alerts(websocket)
    try:
        # Enviar alertas activas iniciales
        alerts = simulator_service.get_latest_alerts()
        initial_msg = {
            "type": "INITIAL_ALERTS_SNAPSHOT",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "count": len(alerts),
            "alerts": alerts
        }
        await websocket.send_json(initial_msg)

        while True:
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect_alerts(websocket)
    except Exception as e:
        logger.warning(f"Excepción en /ws/alerts: {e}")
        ws_manager.disconnect_alerts(websocket)
