import logging
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from fastapi import HTTPException, status
from app.models.alert import Alert
from app.schemas.alert import AlertRead, AlertCreate, AlertAcknowledgeRequest
from app.services.simulator_service import simulator_service

logger = logging.getLogger("alert_service")

class AlertService:
    @staticmethod
    async def get_all_alerts(session: AsyncSession, limit: int = 50) -> List[AlertRead]:
        """Obtiene las alertas recientes desde PostgreSQL o el buffer del simulador."""
        try:
            stmt = select(Alert).order_by(desc(Alert.timestamp)).limit(limit)
            result = await session.execute(stmt)
            alerts_db = result.scalars().all()
            if alerts_db:
                return [
                    AlertRead(
                        id=a.id,
                        alertCode=a.alert_code,
                        timestamp=a.timestamp.isoformat(),
                        severity=a.severity,
                        sourceEquipmentId=a.source_vehicle_id,
                        sourceEquipmentCode=a.source_vehicle_code,
                        targetEquipmentId=a.target_vehicle_id,
                        targetEquipmentCode=a.target_vehicle_code,
                        zone=a.zone,
                        riskScore=a.risk_score,
                        timeToCollision=a.time_to_collision,
                        earlyWarningAnticipationSec=a.early_warning_sec,
                        primaryFactor=a.primary_factor,
                        shapExplanationSummary=a.shap_summary,
                        recommendedAction=a.recommended_action,
                        isAcknowledged=a.is_acknowledged,
                        acknowledgedBy=a.acknowledged_by,
                        status=a.status
                    ) for a in alerts_db
                ]
        except Exception as e:
            logger.warning(f"Error consultando alertas en BD: {e}. Usando alertas del simulador.")

        # Fallback a buffer del simulador
        raw_alerts = simulator_service.get_latest_alerts()
        return [AlertRead(**a) for a in raw_alerts[:limit]]

    @staticmethod
    async def acknowledge_alert(
        session: AsyncSession,
        alert_id: str,
        ack_data: AlertAcknowledgeRequest
    ) -> AlertRead:
        """Marca una alerta como reconocida y mitigada por un supervisor HSE."""
        # 1. Intentar actualizar en simulador
        sim_alert = simulator_service.acknowledge_alert(alert_id, ack_data.supervisorName)
        
        # 2. Intentar actualizar en base de datos si existe
        try:
            stmt = select(Alert).where((Alert.id == alert_id) | (Alert.alert_code == alert_id))
            result = await session.execute(stmt)
            db_alert = result.scalar_one_or_none()
            if db_alert:
                db_alert.is_acknowledged = True
                db_alert.acknowledged_by = ack_data.supervisorName
                db_alert.status = "RESOLVED"
                await session.commit()
                await session.refresh(db_alert)
                return AlertRead(
                    id=db_alert.id,
                    alertCode=db_alert.alert_code,
                    timestamp=db_alert.timestamp.isoformat(),
                    severity=db_alert.severity,
                    sourceEquipmentId=db_alert.source_vehicle_id,
                    sourceEquipmentCode=db_alert.source_vehicle_code,
                    targetEquipmentId=db_alert.target_vehicle_id,
                    targetEquipmentCode=db_alert.target_vehicle_code,
                    zone=db_alert.zone,
                    riskScore=db_alert.risk_score,
                    timeToCollision=db_alert.time_to_collision,
                    earlyWarningAnticipationSec=db_alert.early_warning_sec,
                    primaryFactor=db_alert.primary_factor,
                    shapExplanationSummary=db_alert.shap_summary,
                    recommendedAction=db_alert.recommended_action,
                    isAcknowledged=db_alert.is_acknowledged,
                    acknowledgedBy=db_alert.acknowledged_by,
                    status=db_alert.status
                )
        except Exception as e:
            logger.warning(f"No se pudo persistir reconocimiento de alerta en BD: {e}")

        if sim_alert:
            return AlertRead(**sim_alert)

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alerta {alert_id} no encontrada."
        )
