from typing import List, Optional, Dict
from pydantic import BaseModel

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
    equipment_id: str
    target_equipment_id: Optional[str] = None
    weather: Optional[str] = "CLEAR"
    road_grade: Optional[float] = 8.5
    visibility_factor: Optional[float] = 0.95
