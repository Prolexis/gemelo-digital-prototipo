import { Equipment, RiskPrediction, ShapFactor, RiskLevel } from '../types/mining';

/**
 * Servicio de Inferencia de Riesgo Explicable (XAI).
 * Recrea en frontend la lógica del microservicio `risk_engine_service.py`
 * que sirve los artefactos de:
 * 1. PointNet++ (Percepción LiDAR)
 * 2. Bi-LSTM (Secuencia temporal de comportamiento del operador)
 * 3. Transformer Multi-Modal (Fusión Percepción + Comportamiento + Cinemática GNSS)
 * 4. Fast Kernel / TreeSHAP (Explicabilidad aditiva en tiempo real)
 */
export class RiskEngineService {
  /**
   * Calcula la predicción de riesgo multi-modal y las atribuciones SHAP
   */
  public static calculateRisk(
    sourceEquipment: Equipment,
    targetEquipment?: Equipment,
    environmentalContext?: { weather: string; roadGrade: number; visibilityFactor: number }
  ): RiskPrediction {
    const isManual = !sourceEquipment.isAutonomous;
    const operator = sourceEquipment.assignedOperator;
    const lidar = sourceEquipment.lidarFeatures;
    const gnss = sourceEquipment.position;

    // 1. Feature Extraction: Comportamiento del Operador (Bi-LSTM Proxy)
    let behaviorRisk = 0.05;
    let perclosImpact = 0;
    let shiftDurationImpact = 0;
    let jerkImpact = 0;

    if (isManual && operator) {
      // PERCLOS > 0.25 indica fatiga biológica
      perclosImpact = Math.max(0, (operator.perclosScore - 0.12) * 1.8);
      // Horas de turno > 8 horas incrementan probabilidad de error exponencialmente
      shiftDurationImpact = Math.max(0, (operator.shiftHoursAccumulated - 7.5) * 0.08);
      // Movimientos erráticos de volante
      jerkImpact = Math.min(0.25, (operator.steeringJerkStdDev / 10.0) * 0.3);

      behaviorRisk = Math.min(0.95, perclosImpact + shiftDurationImpact + jerkImpact + (operator.harshBrakingCountLastHour * 0.05));
    }

    // 2. Feature Extraction: Percepción LiDAR (PointNet++ Features Proxy)
    const obstacleDist = targetEquipment 
      ? this.calculateEuclideanDistance(sourceEquipment, targetEquipment)
      : lidar.nearestObstacleDistM;
    
    let perceptionRisk = 0.05;
    const distFactor = Math.max(0, (60.0 - obstacleDist) / 60.0); // 0 a 1 si dist < 60m
    const visibilityDegradation = 1.0 - (environmentalContext?.visibilityFactor ?? lidar.visibilityIndex);
    perceptionRisk = Math.min(0.95, (distFactor * 0.7) + (visibilityDegradation * 0.3));

    // 3. Feature Extraction: Cinemática GNSS y Vía (Transformer Fusion Component)
    const speed = gnss.speedKmh;
    const speedRisk = Math.min(0.9, (speed / 45.0) * 0.6);
    
    // Cálculo de TTC (Time To Collision)
    let relativeSpeed = 0;
    if (targetEquipment) {
      relativeSpeed = Math.abs(gnss.speedKmh + targetEquipment.position.speedKmh);
    } else {
      relativeSpeed = Math.max(15, gnss.speedKmh);
    }
    
    const relSpeedMs = Math.max(1.0, (relativeSpeed * 1000) / 3600);
    const ttcSec = Math.max(1.2, parseFloat((obstacleDist / relSpeedMs).toFixed(1)));

    // 4. Multi-Modal Transformer Fusion Score (0.0 a 1.0)
    let rawScore = 0.0;
    if (isManual) {
      // Ponderación Multi-Modal: 45% Comportamiento + 30% Cinemática/Distancia + 25% Percepción LiDAR
      rawScore = (behaviorRisk * 0.45) + (speedRisk * 0.30) + (perceptionRisk * 0.25);
    } else {
      // Flota Autónoma: 55% Cinemática GNSS / Trayectoria + 45% Percepción LiDAR
      rawScore = (speedRisk * 0.55) + (perceptionRisk * 0.45);
    }

    // Modulador por distancia crítica
    if (obstacleDist < 35.0) {
      rawScore = Math.min(0.98, rawScore + 0.25);
    } else if (obstacleDist > 120.0) {
      rawScore = Math.max(0.05, rawScore * 0.3);
    }

    const overallRiskScore = Math.min(0.98, Math.max(0.04, parseFloat(rawScore.toFixed(2))));

    // Determinar Nivel de Riesgo
    let riskLevel: RiskLevel = 'LOW';
    if (overallRiskScore >= 0.80) riskLevel = 'CRITICAL';
    else if (overallRiskScore >= 0.60) riskLevel = 'HIGH';
    else if (overallRiskScore >= 0.30) riskLevel = 'MEDIUM';

    // 5. Fast TreeSHAP / XAI Decomposition (Cálculo de Atribución Aditiva)
    const shapFactors: ShapFactor[] = [];
    const baseValue = 0.15; // Riesgo basal en operaciones mineras
    const deltaRisk = overallRiskScore - baseValue;

    if (isManual && operator && (perclosImpact > 0.05 || shiftDurationImpact > 0.05)) {
      const fatigueShap = parseFloat(((perclosImpact + shiftDurationImpact) * 0.55).toFixed(2));
      shapFactors.push({
        featureName: 'Fatiga Biológica & Horas de Turno (PERCLOS)',
        category: 'COMPORTAMIENTO_OPERADOR',
        attributionValue: +fatigueShap,
        percentageWeight: 0,
        unitValueString: `PERCLOS: ${(operator.perclosScore * 100).toFixed(0)}% | ${operator.shiftHoursAccumulated.toFixed(1)}h turno`,
        humanReadableReason: `El operador registra un nivel de somnolencia del ${(operator.perclosScore * 100).toFixed(0)}% con ${operator.shiftHoursAccumulated}h de turno continuo, reduciendo drásticamente su capacidad de frenado reactivo.`,
        counterfactualSuggestion: 'Relevo inmediato en garita o activación de alerta acústica vibratoria en cabina.',
      });
    }

    // Cinemática GNSS
    const speedShap = parseFloat(((speed / 45.0) * 0.28).toFixed(2));
    shapFactors.push({
      featureName: 'Velocidad de Descenso y Distancia de Frenado',
      category: 'CINEMATICA_GNSS',
      attributionValue: +speedShap,
      percentageWeight: 0,
      unitValueString: `${speed.toFixed(1)} km/h (Distancia: ${obstacleDist.toFixed(1)}m)`,
      humanReadableReason: `A ${speed.toFixed(1)} km/h con ${sourceEquipment.payloadTons}t de carga, la masa inercial requiere ${(speed * 1.4).toFixed(1)}m para detenerse completamente.`,
      counterfactualSuggestion: `Reducir velocidad a ≤ ${(speed * 0.55).toFixed(0)} km/h y acoplar retardador hidráulico.`,
    });

    // Percepción LiDAR
    if (distFactor > 0.3 || visibilityDegradation > 0.2) {
      const lidarShap = parseFloat(((distFactor * 0.25) + (visibilityDegradation * 0.15)).toFixed(2));
      shapFactors.push({
        featureName: 'Proximidad Espacial LiDAR y Atenuación de Haz',
        category: 'PERCEPCION_LIDAR',
        attributionValue: +lidarShap,
        percentageWeight: 0,
        unitValueString: `Distancia: ${obstacleDist.toFixed(1)}m | Visibilidad: ${((1 - visibilityDegradation) * 100).toFixed(0)}%`,
        humanReadableReason: `Nube de puntos LiDAR detecta envolvente de colisión en radio de ${obstacleDist.toFixed(1)}m con polvo en suspensión.`,
        counterfactualSuggestion: 'Activar aspersores de supresión de polvo en rampa.',
      });
    }

    // Geometría del Tajo / Vía
    const envShap = 0.09;
    shapFactors.push({
      featureName: 'Geometría del Banco y Curvatura de Rampa',
      category: 'ENTORNO_MINERO',
      attributionValue: +envShap,
      percentageWeight: 0,
      unitValueString: 'Curva en radio cerrado (Banco 3200)',
      humanReadableReason: 'La berma de seguridad y el talud rocoso limitan la línea de vista directa a menos de 45 metros.',
      counterfactualSuggestion: 'Mantener separación estricta de carril y radio de giro abierto.',
    });

    // Normalizar pesos porcentuales para visualización de cascada (Waterfall Chart)
    const sumAttributions = shapFactors.reduce((acc, f) => acc + Math.abs(f.attributionValue), 0) || 1.0;
    shapFactors.forEach(f => {
      f.percentageWeight = parseFloat(((Math.abs(f.attributionValue) / sumAttributions) * 100).toFixed(1));
    });

    // Ordenar factores por impacto descendente
    shapFactors.sort((a, b) => b.percentageWeight - a.percentageWeight);

    // Conclusión y Recomendación Contrafáctica (Counterfactual)
    const primaryFactor = shapFactors[0]?.featureName || 'Cinemática GNSS';
    let recommendation = 'Mantener velocidad de crucero y distancia de seguridad.';
    if (overallRiskScore >= 0.8) {
      recommendation = `ALERTA CRÍTICA: ${shapFactors[0]?.counterfactualSuggestion || 'Detención de emergencia controlada inmediata.'}`;
    } else if (overallRiskScore >= 0.5) {
      recommendation = `PRECAUCIÓN: Reducir velocidad y aumentar separación a ≥50m.`;
    }

    return {
      predictionId: `pred-${sourceEquipment.id}-${Date.now()}`,
      equipmentId: sourceEquipment.id,
      targetEquipmentId: targetEquipment?.id,
      overallRiskScore,
      riskLevel,
      timeToCollisionSec: ttcSec,
      predictionHorizonSec: parseFloat((ttcSec + 2.2).toFixed(1)), // Anticipación > 5s
      confidenceScore: 0.93,
      primaryRiskDriver: primaryFactor,
      counterfactualRecommendation: recommendation,
      timestamp: new Date().toISOString(),
      modelVersions: {
        perception: 'PointNet++ LiDAR v2.1 (ONNX RT)',
        behavior: 'Bi-LSTM Maniobras Operador v1.4',
        fusion: 'Multi-Modal Transformer v3.0 (TensorRT)',
        xai: 'Fast Kernel-TreeSHAP RealTime v1.2',
      },
      shapFactors,
    };
  }

  private static calculateEuclideanDistance(eqA: Equipment, eqB: Equipment): number {
    const dx = eqA.position.easting - eqB.position.easting;
    const dy = eqA.position.northing - eqB.position.northing;
    const dz = (eqA.position.elevation || 3200) - (eqB.position.elevation || 3200);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
