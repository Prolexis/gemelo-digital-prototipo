from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from app.db.base import Base

def utc_now_naive():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class TelemetryHistory(Base):
    __tablename__ = "telemetry_history"

    id = Column(String(64), primary_key=True, index=True)
    vehicle_id = Column(String(64), ForeignKey("vehicles.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=utc_now_naive, index=True, nullable=False)
    
    # Cinemática GNSS
    easting = Column(Float, nullable=False)
    northing = Column(Float, nullable=False)
    elevation = Column(Float, nullable=False)
    speed_kmh = Column(Float, nullable=False)
    heading_deg = Column(Float, nullable=False)

    # Telemetría Biológica & LiDAR
    perclos = Column(Float, nullable=True)
    nearest_obstacle_dist = Column(Float, nullable=True)

    # Score de riesgo inferido
    risk_score = Column(Float, nullable=True)
    severity = Column(String(32), nullable=True)
