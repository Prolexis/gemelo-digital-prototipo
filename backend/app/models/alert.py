from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text
from app.db.base import Base

def utc_now_naive():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(64), primary_key=True, index=True)
    alert_code = Column(String(64), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=utc_now_naive, index=True, nullable=False)
    severity = Column(String(32), nullable=False) # WARNING, CRITICAL, EMERGENCY_INTERVENTION
    
    source_vehicle_id = Column(String(64), ForeignKey("vehicles.id"), nullable=False)
    source_vehicle_code = Column(String(32), nullable=False)
    target_vehicle_id = Column(String(64), nullable=True)
    target_vehicle_code = Column(String(32), nullable=True)
    
    zone = Column(String(128), nullable=False)
    risk_score = Column(Float, nullable=False)
    time_to_collision = Column(Float, nullable=False)
    early_warning_sec = Column(Float, default=6.4, nullable=False)
    
    primary_factor = Column(String(256), nullable=False)
    shap_summary = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    
    is_acknowledged = Column(Boolean, default=False, nullable=False)
    acknowledged_by = Column(String(128), nullable=True)
    status = Column(String(32), default="ACTIVE", nullable=False) # ACTIVE, RESOLVED, FALSE_POSITIVE
