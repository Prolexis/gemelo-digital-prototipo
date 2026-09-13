from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.alert import AlertRead, AlertAcknowledgeRequest
from app.services.alert_service import AlertService
from app.core.rbac import require_roles, UserRole

router = APIRouter(prefix="/api/v1/alerts", tags=["Centro de Alertas de Colisión"])

@router.get("", response_model=List[AlertRead])
async def list_alerts(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Obtiene el historial y feed en tiempo real de alertas de colisión."""
    alerts = await AlertService.get_all_alerts(db, limit=limit)
    return alerts

@router.post("/{alert_id}/acknowledge", response_model=AlertRead)
async def acknowledge_alert(
    alert_id: str,
    ack_data: AlertAcknowledgeRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Reconoce y documenta la mitigación de una alerta por parte del Supervisor HSE.
    """
    updated_alert = await AlertService.acknowledge_alert(db, alert_id, ack_data)
    return updated_alert
