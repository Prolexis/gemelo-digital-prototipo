from typing import Optional
from pydantic import BaseModel

class AlertBase(BaseModel):
    alertCode: str
    timestamp: str
    severity: str # WARNING, CRITICAL, EMERGENCY_INTERVENTION
    sourceEquipmentId: str
    sourceEquipmentCode: str
    targetEquipmentId: Optional[str] = None
    targetEquipmentCode: Optional[str] = None
    zone: str
    riskScore: float
    timeToCollision: float
    earlyWarningAnticipationSec: float = 6.4
    primaryFactor: str
    shapExplanationSummary: str
    recommendedAction: str
    isAcknowledged: bool = False
    acknowledgedBy: Optional[str] = None
    status: str = "ACTIVE" # ACTIVE, RESOLVED, FALSE_POSITIVE, ESCALATED

class AlertCreate(AlertBase):
    id: Optional[str] = None

class AlertRead(AlertBase):
    id: str

    class Config:
        from_attributes = True

class AlertAcknowledgeRequest(BaseModel):
    supervisorName: str
    notes: Optional[str] = None
