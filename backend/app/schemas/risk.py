from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class ShapFactorSchema(BaseModel):
    featureName: str
    category: str # PERCEPCION_LIDAR, COMPORTAMIENTO_OPERADOR, CINEMATICA_GNSS, ENTORNO_MINERO
    attributionValue: float
    percentageWeight: float
    unitValueString: str
    humanReadableReason: str
    counterfactualSuggestion: Optional[str] = None

class RiskPredictionSchema(BaseModel):
    predictionId: str
    equipmentId: str
    targetEquipmentId: Optional[str] = None
    overallRiskScore: float
    riskLevel: str # LOW, MEDIUM, HIGH, CRITICAL
    timeToCollisionSec: float
    predictionHorizonSec: float
    confidenceScore: float = 0.94
    primaryRiskDriver: str
    counterfactualRecommendation: str
    timestamp: str
    modelVersions: Dict[str, str] = {
        "perception": "PointNet++ LiDAR v2.1 (ONNX/TensorRT ready)",
        "behavior": "Bi-LSTM Maniobras Operador v1.4",
        "fusion": "Multi-Modal Transformer v3.0",
        "xai": "Fast Kernel-TreeSHAP RealTime v1.2"
    }
    shapFactors: List[ShapFactorSchema] = []

class RiskAnalysisRequestSchema(BaseModel):
    equipment_id: str = Field(default="eq-ht-104", description="ID equipo")
    target_equipment_id: Optional[str] = Field(default="eq-lv-02", description="ID equipo objetivo")
    weather: Optional[str] = Field(default="CLEAR", description="Condiciones climáticas")
    road_grade: Optional[float] = Field(default=8.5, description="Pendiente de la rampa %")
    visibility_factor: Optional[float] = Field(default=0.95, description="Factor de visibilidad 0 a 1")

    model_config = {
        "json_schema_extra": {
            "example": {
                "equipment_id": "eq-ht-104",
                "target_equipment_id": "eq-lv-02",
                "weather": "CLEAR",
                "road_grade": 8.5,
                "visibility_factor": 0.95
            }
        }
    }
