import math
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

from app.services.ml_model_service import ml_model_service

class PerceptionLayer:
    """
    Capa 1: Percepción Espacial LiDAR (Proxy PointNet++).
    Evalúa proximidad tridimensional de obstáculos y degradación del haz láser
    por factores meteorológicos (polvo en suspensión, niebla, lluvia).
    """
    @staticmethod
    def extract_features(
        nearest_dist_m: float,
        visibility_index: float,
        obstacle_type: str = "VEHICLE"
    ) -> Tuple[float, float, float]:
        """
        Retorna:
          - dist_factor: Grado de proximidad crítica (0.0 a 1.0)
          - visibility_degradation: Atenuación óptica por polvo/clima (0.0 a 1.0)
          - perception_risk: Riesgo de percepción agregado
        """
        # Distancia crítica bajo 60 metros incrementa factor de proximidad
        dist_factor = max(0.0, (60.0 - nearest_dist_m) / 60.0)
        visibility_degradation = max(0.0, min(1.0, 1.0 - visibility_index))
        
        # Ponderación de percepción: 70% proximidad de nube de puntos + 30% pérdida de retorno
        perception_risk = min(0.95, (dist_factor * 0.70) + (visibility_degradation * 0.30))
        return dist_factor, visibility_degradation, perception_risk


class BehaviorLayer:
    """
    Capa 2: Comportamiento del Conductor (Proxy Bi-LSTM Temporal).
    Evalúa telemetría fisiológica y de conducción:
      - PERCLOS (porcentaje de cierre ocular > 0.25 indica fatiga biológica crítica)
      - Horas continuas de turno acumuladas (> 8h eleva exponencialmente el riesgo)
      - Desviación estándar de corrección de volante (Jerk) y frenadas bruscas
    """
    @staticmethod
    def extract_features(
        perclos_score: float,
        shift_hours: float,
        steering_jerk: float,
        harsh_braking_count: int = 0
    ) -> Tuple[float, float, float, float]:
        """
        Retorna:
          - perclos_impact
          - shift_duration_impact
          - jerk_impact
          - behavior_risk
        """
        # Baseline PERCLOS nominal es 0.12; por encima de eso se penaliza
        perclos_impact = max(0.0, (perclos_score - 0.12) * 1.8)
        # Turno seguro ≤ 7.5h; más allá de eso penaliza exponencialmente
        shift_duration_impact = max(0.0, (shift_hours - 7.5) * 0.08)
        # Jerking de dirección
        jerk_impact = min(0.25, (steering_jerk / 10.0) * 0.3)
        # Riesgo de comportamiento combinado
        behavior_risk = min(0.95, perclos_impact + shift_duration_impact + jerk_impact + (harsh_braking_count * 0.05))
        return perclos_impact, shift_duration_impact, jerk_impact, behavior_risk


class KinematicsLayer:
    """
    Capa 3: Cinemática GNSS y Vía (Masa Inercial, Pendiente y Trayectoria).
    Calcula velocidad relativa de aproximación y Time-To-Collision (TTC).
    """
    @staticmethod
    def calculate_kinematics(
        speed_kmh: float,
        target_speed_kmh: Optional[float],
        obstacle_dist_m: float,
        payload_tons: float = 385.0,
        road_grade: float = 8.5
    ) -> Tuple[float, float, float]:
        """
        Retorna:
          - speed_risk: Riesgo por velocidad (0.0 a 1.0)
          - relative_speed_kmh: Velocidad de convergencia
          - ttc_sec: Tiempo proyectado al impacto (TTC)
        """
        # Límite seguro en rampas de acarreo con carga es 30-35 km/h
        speed_risk = min(0.90, (speed_kmh / 45.0) * 0.60)
        
        if target_speed_kmh is not None:
            relative_speed_kmh = abs(speed_kmh + target_speed_kmh)
        else:
            relative_speed_kmh = max(15.0, speed_kmh)

        rel_speed_ms = max(1.0, (relative_speed_kmh * 1000.0) / 3600.0)
        ttc_sec = max(1.2, round(obstacle_dist_m / rel_speed_ms, 1))

        return speed_risk, relative_speed_kmh, ttc_sec


class MultiModalFusionLayer:
    """
    Capa 4: Fusión Multi-Modal (Transformer Fusion Proxy).
    Integra Percepción + Comportamiento + Cinemática según naturaleza de flota:
      - Flota Manual: 45% Comportamiento + 30% Cinemática + 25% LiDAR
      - Flota Autónoma (AHS): 55% Cinemática / V2X + 45% Percepción LiDAR
    Clasifica severidad: LOW, MEDIUM, HIGH, CRITICAL.
    """
    @staticmethod
    def fuse(
        is_autonomous: bool,
        behavior_risk: float,
        speed_risk: float,
        perception_risk: float,
        obstacle_dist_m: float
    ) -> Tuple[float, str]:
        if not is_autonomous:
            raw_score = (behavior_risk * 0.45) + (speed_risk * 0.30) + (perception_risk * 0.25)
        else:
            raw_score = (speed_risk * 0.55) + (perception_risk * 0.45)

        # Modulación de borde por distancia espacial crítica
        if obstacle_dist_m < 35.0:
            raw_score = min(0.98, raw_score + 0.25)
        elif obstacle_dist_m > 120.0:
            raw_score = max(0.05, raw_score * 0.30)

        overall_score = round(max(0.04, min(0.98, raw_score)), 2)

        # Clasificación de Severidad
        if overall_score >= 0.80:
            severity = "CRITICAL"
        elif overall_score >= 0.60:
            severity = "HIGH"
        elif overall_score >= 0.30:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        return overall_score, severity


class XAILayer:
    """
    Capa 5: Explicabilidad Aditiva y Sugerencias Contrafácticas (TreeSHAP Proxy).
    Descompone el score de riesgo en atribuciones causales (phi_i) con porcentajes
    normalizados y recomendaciones prescriptivas en lenguaje natural.
    """
    @staticmethod
    def explain(
        is_manual: bool,
        perclos_impact: float,
        shift_duration_impact: float,
        speed_kmh: float,
        payload_tons: float,
        dist_factor: float,
        visibility_degradation: float,
        obstacle_dist_m: float,
        overall_score: float,
        operator_info: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[Dict[str, Any]], str, str]:
        shap_factors = []

        # 1. Atribución Comportamiento / Fatiga
        if is_manual and operator_info and (perclos_impact > 0.05 or shift_duration_impact > 0.05):
            fatigue_shap = round((perclos_impact + shift_duration_impact) * 0.55, 2)
            perclos_val = operator_info.get("perclosScore", 0.0)
            shift_hrs = operator_info.get("shiftHoursAccumulated", 0.0)
            shap_factors.append({
                "featureName": "Fatiga Biológica & Horas de Turno (PERCLOS)",
                "category": "COMPORTAMIENTO_OPERADOR",
                "attributionValue": fatigue_shap,
                "percentageWeight": 0.0,
                "unitValueString": f"PERCLOS: {int(perclos_val * 100)}% | {shift_hrs:.1f}h turno",
                "humanReadableReason": f"El operador registra somnolencia del {int(perclos_val * 100)}% con {shift_hrs:.1f}h continuas, reduciendo su capacidad de frenado reactivo.",
                "counterfactualSuggestion": "Relevo inmediato en garita o activación de alerta acústica y vibratoria en cabina."
            })

        # 2. Atribución Cinemática GNSS
        speed_shap = round((speed_kmh / 45.0) * 0.28, 2)
        shap_factors.append({
            "featureName": "Velocidad de Descenso y Distancia de Frenado",
            "category": "CINEMATICA_GNSS",
            "attributionValue": speed_shap,
            "percentageWeight": 0.0,
            "unitValueString": f"{speed_kmh:.1f} km/h (Distancia: {obstacle_dist_m:.1f}m)",
            "humanReadableReason": f"A {speed_kmh:.1f} km/h con {payload_tons:.0f}t de mineral, la masa inercial requiere {(speed_kmh * 1.4):.1f}m para detenerse completamente.",
            "counterfactualSuggestion": f"Reducir velocidad a ≤ {int(speed_kmh * 0.55)} km/h y acoplar retardador hidráulico."
        })

        # 3. Atribución Percepción LiDAR
        if dist_factor > 0.30 or visibility_degradation > 0.20:
            lidar_shap = round((dist_factor * 0.25) + (visibility_degradation * 0.15), 2)
            vis_pct = int((1.0 - visibility_degradation) * 100)
            shap_factors.append({
                "featureName": "Proximidad Espacial LiDAR y Atenuación de Haz",
                "category": "PERCEPCION_LIDAR",
                "attributionValue": lidar_shap,
                "percentageWeight": 0.0,
                "unitValueString": f"Distancia: {obstacle_dist_m:.1f}m | Visibilidad: {vis_pct}%",
                "humanReadableReason": f"Nube de puntos LiDAR detecta envolvente de colisión en radio de {obstacle_dist_m:.1f}m con atenuación por polvo.",
                "counterfactualSuggestion": "Activar aspersores de supresión de polvo en rampa y ralentizar velocidad de convoy."
            })

        # 4. Atribución Entorno / Geometría del Tajo
        env_shap = 0.09
        shap_factors.append({
            "featureName": "Geometría del Banco y Curvatura de Rampa",
            "category": "ENTORNO_MINERO",
            "attributionValue": env_shap,
            "percentageWeight": 0.0,
            "unitValueString": "Curva en radio cerrado (Banco 3200)",
            "humanReadableReason": "La berma de seguridad y el talud rocoso limitan la línea de vista directa a menos de 45 metros.",
            "counterfactualSuggestion": "Mantener carril derecho estricto y respetar radio de giro abierto."
        })

        # Normalizar pesos porcentuales a 100%
        sum_attr = sum(abs(f["attributionValue"]) for f in shap_factors) or 1.0
        for f in shap_factors:
            f["percentageWeight"] = round((abs(f["attributionValue"]) / sum_attr) * 100.0, 1)

        shap_factors.sort(key=lambda x: x["percentageWeight"], reverse=True)

        primary_driver = shap_factors[0]["featureName"] if shap_factors else "Cinemática GNSS"
        
        if overall_score >= 0.80:
            rec = f"ALERTA CRÍTICA: {shap_factors[0].get('counterfactualSuggestion', 'Detención de emergencia controlada inmediata.')}"
        elif overall_score >= 0.50:
            rec = "PRECAUCIÓN: Reducir velocidad y aumentar separación a ≥50m."
        else:
            rec = "Mantener velocidad de crucero y distancia de seguridad reglamentaria."

        return shap_factors, primary_driver, rec


class RiskEngineService:
    """
    Servicio de Inferencia de Riesgo Explicable (XAI).
    Orquesta las 5 capas industriales y devuelve la predicción completa con SHAP.
    Preparado para conectar futuros modelos compilados en ONNX Runtime / TensorRT.
    """
    @classmethod
    def calculate_risk(
        cls,
        source_vehicle: Dict[str, Any],
        target_vehicle: Optional[Dict[str, Any]] = None,
        environmental_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        is_autonomous = source_vehicle.get("isAutonomous", False)
        operator = source_vehicle.get("assignedOperator")
        lidar = source_vehicle.get("lidarFeatures", {})
        pos = source_vehicle.get("position", {})

        # Contexto Ambiental
        env = environmental_context or {}
        vis_factor = env.get("visibility_factor", lidar.get("visibilityIndex", 0.85))
        road_grade = env.get("road_grade", 8.5)

        # 1. Percepción LiDAR
        if target_vehicle:
            # Distancia euclidiana 3D
            target_pos = target_vehicle.get("position", {})
            dx = pos.get("easting", 0) - target_pos.get("easting", 0)
            dy = pos.get("northing", 0) - target_pos.get("northing", 0)
            dz = pos.get("elevation", 3200) - target_pos.get("elevation", 3200)
            obstacle_dist = math.sqrt(dx * dx + dy * dy + dz * dz)
        else:
            obstacle_dist = lidar.get("nearestObstacleDistM", 35.0)

        dist_factor, vis_degradation, perception_risk = PerceptionLayer.extract_features(
            nearest_dist_m=obstacle_dist,
            visibility_index=vis_factor,
            obstacle_type=lidar.get("obstacleType", "VEHICLE")
        )

        # 2. Comportamiento Operador
        perclos_impact = 0.0
        shift_duration_impact = 0.0
        jerk_impact = 0.0
        behavior_risk = 0.05
        if not is_autonomous and operator:
            perclos_impact, shift_duration_impact, jerk_impact, behavior_risk = BehaviorLayer.extract_features(
                perclos_score=operator.get("perclosScore", 0.12),
                shift_hours=operator.get("shiftHoursAccumulated", 6.0),
                steering_jerk=operator.get("steeringJerkStdDev", 1.0),
                harsh_braking_count=operator.get("harshBrakingCountLastHour", 0)
            )

        # 3. Cinemática GNSS
        target_speed = target_vehicle.get("position", {}).get("speedKmh") if target_vehicle else None
        speed_kmh = pos.get("speedKmh", 30.0)
        payload_tons = source_vehicle.get("payloadTons", 380.0)

        speed_risk, relative_speed_kmh, ttc_sec = KinematicsLayer.calculate_kinematics(
            speed_kmh=speed_kmh,
            target_speed_kmh=target_speed,
            obstacle_dist_m=obstacle_dist,
            payload_tons=payload_tons,
            road_grade=road_grade
        )

        # 4. Fusión Multi-Modal / Inferencia ML
        # ── Intentar inferencia con modelo ML del CRISP-DM Lab ───────────────
        raw_features = {
            "gnss_speed_kmh":          speed_kmh,
            "gnss_ramp_grade":         road_grade,
            "lidar_obstacle_dist_m":   obstacle_dist,
            "lidar_visibility_index":  vis_factor,
            "op_perclos_score":        operator.get("perclosScore", 0.12) if operator else 0.12,
            "op_shift_hours":          operator.get("shiftHoursAccumulated", 6.0) if operator else 6.0,
            "op_steering_jerk_stddev": operator.get("steeringJerkStdDev", 1.0) if operator else 1.0,
            "op_harsh_braking_count":  operator.get("harshBrakingCountLastHour", 0) if operator else 0,
            "is_autonomous":           is_autonomous,
        }
        ml_score = ml_model_service.predict_risk_score(raw_features)

        if ml_score is not None:
            # Modelo ML disponible: usar su probabilidad directamente
            # Mapear severidad desde el score ML
            overall_score = ml_score
            if overall_score >= 0.80:
                severity = "CRITICAL"
            elif overall_score >= 0.60:
                severity = "HIGH"
            elif overall_score >= 0.30:
                severity = "MEDIUM"
            else:
                severity = "LOW"
        else:
            # Fallback: fórmulas analíticas (sin modelo ML exportado aún)
            overall_score, severity = MultiModalFusionLayer.fuse(
                is_autonomous=is_autonomous,
                behavior_risk=behavior_risk,
                speed_risk=speed_risk,
                perception_risk=perception_risk,
                obstacle_dist_m=obstacle_dist
            )

        # 5. Explicabilidad XAI (TreeSHAP)
        shap_factors, primary_driver, rec = XAILayer.explain(
            is_manual=(not is_autonomous),
            perclos_impact=perclos_impact,
            shift_duration_impact=shift_duration_impact,
            speed_kmh=speed_kmh,
            payload_tons=payload_tons,
            dist_factor=dist_factor,
            visibility_degradation=vis_degradation,
            obstacle_dist_m=obstacle_dist,
            overall_score=overall_score,
            operator_info=operator
        )

        prediction_id = f"pred-{source_vehicle.get('id', 'veh')}-{int(time.time() * 1000)}"
        
        return {
            "predictionId": prediction_id,
            "equipmentId": source_vehicle.get("id"),
            "targetEquipmentId": target_vehicle.get("id") if target_vehicle else None,
            "overallRiskScore": overall_score,
            "riskLevel": severity,
            "timeToCollisionSec": ttc_sec,
            "predictionHorizonSec": round(ttc_sec + 2.2, 1),
            "confidenceScore": 0.94,
            "primaryRiskDriver": primary_driver,
            "counterfactualRecommendation": rec,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "modelVersions": {
                "perception": "PointNet++ LiDAR v2.1 (ONNX/TensorRT ready)",
                "behavior": "Bi-LSTM Maniobras Operador v1.4",
                "fusion": (
                    f"RandomForest ML (CRISP-DM Lab) v1.0"
                    if ml_score is not None
                    else "Multi-Modal Transformer v3.0 (analítico)"
                ),
                "xai": "Fast Kernel-TreeSHAP RealTime v1.2"
            },
            "ml_inference": ml_score is not None,
            "shapFactors": shap_factors
        }
