from typing import Optional
from pydantic import BaseModel, Field

class VehicleBase(BaseModel):
    code: str = Field(default="CAEX-104", description="Código del equipo")
    name: str = Field(default="Camión Extracción CAT 797F", description="Nombre del vehículo")
    type: str = Field(default="HAUL_TRUCK_MANUAL", description="Tipo de vehículo")
    model: str = Field(default="Caterpillar 797F", description="Modelo industrial")
    is_autonomous: bool = Field(default=False, description="Si es autónomo o manual")
    current_zone: str = Field(default="RAMPA_SUR_SECTOR_3", description="Zona de operación")
    current_bench: str = Field(default="BANCO_3240", description="Banco minero")
    status: str = Field(default="ACTIVE_HAULING", description="Estado operativo")
    payload_tons: float = Field(default=360.0, description="Carga actual en toneladas")
    max_speed_kmh: float = Field(default=45.0, description="Velocidad máxima configurada")

    model_config = {
        "json_schema_extra": {
            "example": {
                "code": "CAEX-104",
                "name": "Camión Extracción CAT 797F",
                "type": "HAUL_TRUCK_MANUAL",
                "model": "Caterpillar 797F",
                "is_autonomous": False,
                "current_zone": "RAMPA_SUR_SECTOR_3",
                "current_bench": "BANCO_3240",
                "status": "ACTIVE_HAULING",
                "payload_tons": 360.0,
                "max_speed_kmh": 45.0
            }
        }
    }

class VehicleCreate(VehicleBase):
    id: Optional[str] = Field(default=None, description="ID opcional")

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
