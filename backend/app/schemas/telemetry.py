from typing import List, Optional, Tuple
from pydantic import BaseModel
from app.schemas.risk import RiskPredictionSchema

class GNSSPositionSchema(BaseModel):
    latitude: float
    longitude: float
    altitude: float
    easting: float
    northing: float
    elevation: float
    speedKmh: float
    headingDeg: float
    accuracyM: float = 0.05
    timestamp: str

class BoundingBoxSchema(BaseModel):
    x: float
    y: float
    z: float
    width: float
    height: float
    depth: float

class LiDARFeaturesSchema(BaseModel):
    nearestObstacleDistM: float
    relativeVelocityKmh: float
    obstacleType: str = "VEHICLE" # VEHICLE, BERM, ROCKFALL, PERSONNEL, NONE
    obstacleBoundingBox: BoundingBoxSchema
    pointCloudDensity: float = 650.0
    visibilityIndex: float = 0.85
    groundConfidence: float = 0.98
    timestamp: str

class OperatorBehaviorStateSchema(BaseModel):
    operatorId: str
    operatorName: str
    shiftHoursAccumulated: float
    perclosScore: float
    distractionLevel: float = 0.05
    steeringJerkStdDev: float = 1.0
    harshBrakingCountLastHour: int = 0
    accelerationVariability: float = 0.1
    heartRateBpm: Optional[int] = 72
    isFatigued: bool = False
    hasInformedConsent: bool = True
    anonymizedId: str

class EquipmentTelemetrySchema(BaseModel):
    id: str
    code: str
    name: str
    type: str
    model: str
    isAutonomous: bool
    assignedOperator: Optional[OperatorBehaviorStateSchema] = None
    currentZone: str
    currentBench: str
    status: str
    payloadTons: float
    maxSpeedKmh: float
    position: GNSSPositionSchema
    lidarFeatures: LiDARFeaturesSchema
    currentPrediction: RiskPredictionSchema
    trajectoryHistory: List[List[float]] = []

class FleetTelemetryMessage(BaseModel):
    timestamp: str
    fleetSize: int
    equipments: List[EquipmentTelemetrySchema]
