from typing import Optional
from pydantic import BaseModel, Field

class AlertBase(BaseModel):
    alertCode: str = Field(default="ALT-2026-0928-01", description="Código único de la alerta")
    timestamp: str = Field(default="2026-09-28T21:40:00Z", description="Timestamp ISO")
    severity: str = Field(default="CRITICAL", description="WARNING, CRITICAL, EMERGENCY_INTERVENTION")
    sourceEquipmentId: str = Field(default="eq-ht-104", description="ID equipo emisor")
    sourceEquipmentCode: str = Field(default="CAEX-104", description="Código del equipo")
    targetEquipmentId: Optional[str] = Field(default="eq-lv-02", description="ID equipo objetivo")
    targetEquipmentCode: Optional[str] = Field(default="CAMIONETA-02", description="Código equipo objetivo")
    zone: str = Field(default="RAMPA_SUR_SECTOR_3", description="Zona de la mina")
    riskScore: float = Field(default=0.88, description="Score de riesgo 0 a 1")
    timeToCollision: float = Field(default=5.4, description="Segundos para colisión")
    earlyWarningAnticipationSec: float = Field(default=6.4, description="Segundos de anticipación")
    primaryFactor: str = Field(default="Fatiga PERCLOS > 0.40", description="Factor causal principal")
    shapExplanationSummary: str = Field(default="PERCLOS contribuye con +42% al riesgo", description="Resumen SHAP")
    recommendedAction: str = Field(default="Frenado de emergencia y llamada de supervisor", description="Acción sugerida")
    isAcknowledged: bool = Field(default=False, description="Reconocimiento de alerta")
    acknowledgedBy: Optional[str] = Field(default=None, description="Supervisor que reconoce")
    status: str = Field(default="ACTIVE", description="ACTIVE, RESOLVED, FALSE_POSITIVE, ESCALATED")

    model_config = {
        "json_schema_extra": {
            "example": {
                "alertCode": "ALT-2026-0928-01",
                "timestamp": "2026-09-28T21:40:00Z",
                "severity": "CRITICAL",
                "sourceEquipmentId": "eq-ht-104",
                "sourceEquipmentCode": "CAEX-104",
                "targetEquipmentId": "eq-lv-02",
                "targetEquipmentCode": "CAMIONETA-02",
                "zone": "RAMPA_SUR_SECTOR_3",
                "riskScore": 0.88,
                "timeToCollision": 5.4,
                "earlyWarningAnticipationSec": 6.4,
                "primaryFactor": "Fatiga PERCLOS > 0.40",
                "shapExplanationSummary": "PERCLOS contribuye con +42% al riesgo",
                "recommendedAction": "Frenado de emergencia y llamada de supervisor",
                "isAcknowledged": False,
                "status": "ACTIVE"
            }
        }
    }

class AlertCreate(AlertBase):
    id: Optional[str] = Field(default=None, description="ID opcional")

class AlertRead(AlertBase):
    id: str

    class Config:
        from_attributes = True

class AlertAcknowledgeRequest(BaseModel):
    supervisorName: str
    notes: Optional[str] = None
