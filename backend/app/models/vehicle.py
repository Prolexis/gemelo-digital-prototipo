from sqlalchemy import Column, String, Boolean, Float
from app.db.base import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String(64), primary_key=True, index=True)
    code = Column(String(32), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    type = Column(String(64), nullable=False)
    model = Column(String(128), nullable=False)
    is_autonomous = Column(Boolean, default=False, nullable=False)
    current_zone = Column(String(128), nullable=False)
    current_bench = Column(String(64), nullable=False)
    status = Column(String(64), nullable=False, default="ACTIVE_HAULING")
    payload_tons = Column(Float, default=0.0, nullable=False)
    max_speed_kmh = Column(Float, default=45.0, nullable=False)

    # Último estado cinemático y de riesgo conocido
    last_easting = Column(Float, default=0.0)
    last_northing = Column(Float, default=0.0)
    last_elevation = Column(Float, default=3200.0)
    last_speed = Column(Float, default=0.0)
    last_heading = Column(Float, default=0.0)
    last_risk_score = Column(Float, default=0.0)
    last_risk_level = Column(String(32), default="LOW")
