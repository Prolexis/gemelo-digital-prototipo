from typing import Optional
from pydantic import BaseModel

class VehicleBase(BaseModel):
    code: str
    name: str
    type: str # HAUL_TRUCK_MANUAL, HAUL_TRUCK_AHS, SHOVEL, LIGHT_VEHICLE, etc.
    model: str
    is_autonomous: bool = False
    current_zone: str
    current_bench: str
    status: str = "ACTIVE_HAULING"
    payload_tons: float = 0.0
    max_speed_kmh: float = 45.0

class VehicleCreate(VehicleBase):
    id: Optional[str] = None

class VehicleRead(VehicleBase):
    id: str
    last_easting: float = 0.0
    last_northing: float = 0.0
    last_elevation: float = 3200.0
    last_speed: float = 0.0
    last_heading: float = 0.0
    last_risk_score: float = 0.0
    last_risk_level: str = "LOW"

    class Config:
        from_attributes = True
