export type EquipmentType = 'HAUL_TRUCK_MANUAL' | 'HAUL_TRUCK_AHS' | 'SHOVEL' | 'LIGHT_VEHICLE' | 'WATER_TRUCK' | 'GRADER';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ShiftType = 'DAY' | 'NIGHT';

export type UserRole = 'ADMIN' | 'SAFETY_SUPERVISOR' | 'OPERATOR' | 'DATA_ANALYST' | 'AUDITOR';

export interface GNSSPosition {
  latitude: number;
  longitude: number;
  altitude: number;
  easting: number; // Coordenadas UTM locales de mina (metros)
  northing: number;
  elevation: number;
  speedKmh: number;
  headingDeg: number;
  accuracyM: number;
  timestamp: string;
}

export interface LiDARFeatures {
  nearestObstacleDistM: number;
  relativeVelocityKmh: number;
  obstacleType: 'VEHICLE' | 'BERM' | 'ROCKFALL' | 'PERSONNEL' | 'NONE';
  obstacleBoundingBox: { x: number; y: number; z: number; width: number; height: number; depth: number };
  pointCloudDensity: number; // pts/m2
  visibilityIndex: number; // 0.0 (niebla densa/polvo) - 1.0 (visibilidad perfecta)
  groundConfidence: number;
  timestamp: string;
}

export interface OperatorBehaviorState {
  operatorId: string;
  operatorName: string;
  shiftHoursAccumulated: number;
  perclosScore: number; // Porcentaje de cierre ocular (0.0 a 1.0; >0.25 indica fatiga)
  distractionLevel: number; // 0.0 a 1.0 (detección por cámara de cabina)
  steeringJerkStdDev: number; // Desviación en correcciones de volante
  harshBrakingCountLastHour: number;
  accelerationVariability: number;
  heartRateBpm?: number;
  isFatigued: boolean;
  hasInformedConsent: boolean;
  anonymizedId: string;
}

export interface ShapFactor {
  featureName: string;
  category: 'PERCEPCION_LIDAR' | 'COMPORTAMIENTO_OPERADOR' | 'CINEMATICA_GNSS' | 'ENTORNO_MINERO';
  attributionValue: number; // Valor SHAP (impacto positivo/negativo en el score de riesgo)
  percentageWeight: number; // Peso relativo (ej. 65%)
  unitValueString: string;
  humanReadableReason: string;
  counterfactualSuggestion?: string;
}

export interface RiskPrediction {
  predictionId: string;
  equipmentId: string;
  targetEquipmentId?: string;
  overallRiskScore: number; // 0.0 a 1.0
  riskLevel: RiskLevel;
  timeToCollisionSec: number; // TTC proyectado
  predictionHorizonSec: number; // Ventana predictiva anticipada (ej. 6.8s)
  confidenceScore: number;
  shapFactors: ShapFactor[];
  primaryRiskDriver: string;
  counterfactualRecommendation: string;
  timestamp: string;
  modelVersions: {
    perception: string; // PointNet++ v2.1
    behavior: string; // Bi-LSTM Operator v1.4
    fusion: string; // Multi-Modal Transformer v3.0
    xai: string; // Fast TreeSHAP / Kernel v1.2
  };
}

export interface Equipment {
  id: string;
  code: string; // Ej: "HT-104"
  name: string;
  type: EquipmentType;
  model: string; // Ej: "Caterpillar 797F (400 Ton)"
  isAutonomous: boolean;
  assignedOperator?: OperatorBehaviorState;
  currentZone: string; // Ej: "Rampa Principal - Banco 3400"
  currentBench: string;
  status: 'ACTIVE_HAULING' | 'LOADING' | 'DUMPING' | 'MAINTENANCE' | 'IDLE';
  payloadTons: number;
  maxSpeedKmh: number;
  position: GNSSPosition;
  lidarFeatures: LiDARFeatures;
  currentPrediction: RiskPrediction;
  trajectoryHistory: [number, number, number][]; // Coordenadas 3D recientes
}

export interface CollisionAlert {
  id: string;
  alertCode: string;
  timestamp: string;
  severity: 'WARNING' | 'CRITICAL' | 'EMERGENCY_INTERVENTION';
  sourceEquipmentId: string;
  sourceEquipmentCode: string;
  targetEquipmentId?: string;
  targetEquipmentCode?: string;
  zone: string;
  riskScore: number;
  timeToCollision: number;
  earlyWarningAnticipationSec: number; // Segundos de anticipación respecto al PDS estándar
  primaryFactor: string;
  shapExplanationSummary: string;
  recommendedAction: string;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  status: 'ACTIVE' | 'RESOLVED' | 'FALSE_POSITIVE' | 'ESCALATED';
}

export interface MiningScenario {
  id: string;
  title: string;
  description: string;
  zone: string;
  severityLevel: RiskLevel;
  involvedEquipments: string[];
  weatherCondition: 'CLEAR' | 'DUST_STORM' | 'HEAVY_FOG' | 'NIGHT_RAIN';
  roadCondition: 'DRY_COMPACT' | 'SLIPPERY_MUD' | 'UNEVEN_GRADE';
  operatorShiftHours: number;
  initialTtcSec: number;
  expectedShapDominance: string;
  audioWarningRequired: boolean;
}

export interface MshaIncidentRecord {
  id: string;
  incidentDate: string;
  mineName: string;
  location: string;
  equipmentType: string;
  classification: 'NEAR_MISS' | 'FATALITY' | 'EQUIPMENT_DAMAGE';
  narrativeDescription: string;
  rootCauses: string[];
  twinPreventabilityScore: number; // 0 a 100% de probabilidad de prevención con el gemelo digital
}

export interface OperatorConsent {
  operatorId: string;
  operatorName: string;
  employeeCode: string;
  nationalId: string;
  consentDate: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  dataScope: {
    facialPerclos: boolean;
    steeringTelemetry: boolean;
    heartRateVitals: boolean;
    shiftDurationLogs: boolean;
  };
  anonymizationHash: string;
  digitalSignatureRef: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userEmail: string;
  userRole: UserRole;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
}
