"""
risk_engine.py — MineSafe 3D CRISP-DM Lab
Motor de predicción de riesgo XAI — espejo fiel del risk_engine_service.py
del backend FastAPI de producción.

Incluye la misma lógica de 5 capas:
  1. PerceptionLayer   — LiDAR + Clima
  2. BehaviorLayer     — PERCLOS + Turno + Jerk
  3. KinematicsLayer   — GNSS Velocidad + TTC
  4. FusionLayer       — Score 0-1 + Severidad
  5. XAILayer          — SHAP Proxy + Recomendación
"""

import math
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple


# ─────────────────────────────────────────────────────────────────────────────
@dataclass
class ShapFactor:
    feature_name: str
    category: str
    attribution_value: float
    percentage_weight: float = 0.0
    unit_value_string: str = ""
    human_readable_reason: str = ""
    counterfactual_suggestion: str = ""


@dataclass
class RiskPrediction:
    prediction_id: str
    overall_risk_score: float
    risk_level: str            # LOW | MEDIUM | HIGH | CRITICAL
    ttc_sec: float
    prediction_horizon_sec: float
    confidence_score: float
    primary_risk_driver: str
    recommendation: str
    shap_factors: List[ShapFactor] = field(default_factory=list)
    # Capas intermedias (para dashboard de validación)
    behavior_risk: float = 0.0
    perception_risk: float = 0.0
    speed_risk: float = 0.0
    dist_factor: float = 0.0
    vis_degradation: float = 0.0


# ─────────────────────────────────────────────────────────────────────────────
class PerceptionLayer:
    """
    Capa 1 — Percepción Espacial LiDAR (Proxy PointNet++).
    Evalúa proximidad 3D y degradación óptica por polvo/clima.
    """
    @staticmethod
    def extract(nearest_dist_m: float,
                visibility_index: float) -> Tuple[float, float, float]:
        """
        Returns:
            dist_factor         : 0→1 (mayor cuando más cerca del obstáculo)
            visibility_degradation: 0→1 (mayor cuando peor visibilidad)
            perception_risk     : 0→0.95 (riesgo agregado de percepción)
        """
        dist_factor           = max(0.0, (60.0 - nearest_dist_m) / 60.0)
        visibility_degradation= max(0.0, min(1.0, 1.0 - visibility_index))
        perception_risk       = min(0.95, dist_factor * 0.70 + visibility_degradation * 0.30)
        return dist_factor, visibility_degradation, perception_risk


# ─────────────────────────────────────────────────────────────────────────────
class BehaviorLayer:
    """
    Capa 2 — Comportamiento del Conductor (Proxy Bi-LSTM Temporal).
    Telemetría fisiológica: PERCLOS, horas de turno, jerk de volante.
    """
    @staticmethod
    def extract(perclos_score: float,
                shift_hours: float,
                steering_jerk: float,
                harsh_braking_count: int = 0) -> Tuple[float, float, float, float]:
        """
        Returns:
            perclos_impact          : contribución de la somnolencia
            shift_duration_impact   : contribución de fatiga acumulada
            jerk_impact             : contribución de conducción errática
            behavior_risk           : riesgo comportamental total (0→0.95)
        """
        perclos_impact        = max(0.0, (perclos_score - 0.12) * 1.8)
        shift_duration_impact = max(0.0, (shift_hours - 7.5) * 0.08)
        jerk_impact           = min(0.25, (steering_jerk / 10.0) * 0.3)
        behavior_risk         = min(0.95,
                                    perclos_impact
                                    + shift_duration_impact
                                    + jerk_impact
                                    + harsh_braking_count * 0.05)
        return perclos_impact, shift_duration_impact, jerk_impact, behavior_risk


# ─────────────────────────────────────────────────────────────────────────────
class KinematicsLayer:
    """
    Capa 3 — Cinemática GNSS y Vía (Masa Inercial, Pendiente, TTC).
    """
    @staticmethod
    def calculate(speed_kmh: float,
                  obstacle_dist_m: float,
                  target_speed_kmh: Optional[float] = None) -> Tuple[float, float, float]:
        """
        Returns:
            speed_risk          : 0→0.90
            relative_speed_kmh  : velocidad de convergencia
            ttc_sec             : Time-To-Collision proyectado (s)
        """
        speed_risk = min(0.90, (speed_kmh / 45.0) * 0.60)

        if target_speed_kmh is not None:
            relative_speed_kmh = abs(speed_kmh + target_speed_kmh)
        else:
            relative_speed_kmh = max(15.0, speed_kmh)

        rel_speed_ms = max(1.0, (relative_speed_kmh * 1000.0) / 3600.0)
        ttc_sec      = max(1.2, round(obstacle_dist_m / rel_speed_ms, 1))

        return speed_risk, relative_speed_kmh, ttc_sec


# ─────────────────────────────────────────────────────────────────────────────
class FusionLayer:
    """
    Capa 4 — Fusión Multi-Modal (Transformer Fusion Proxy).
    Ponderación diferenciada: flota manual vs. autónoma AHS.
    """
    @staticmethod
    def fuse(is_autonomous: bool,
             behavior_risk: float,
             speed_risk: float,
             perception_risk: float,
             obstacle_dist_m: float) -> Tuple[float, str]:
        """
        Returns:
            overall_score   : 0.04 → 0.98
            severity        : LOW | MEDIUM | HIGH | CRITICAL
        """
        if not is_autonomous:
            # Flota Manual: 45% comportamiento + 30% cinemática + 25% LiDAR
            raw_score = behavior_risk * 0.45 + speed_risk * 0.30 + perception_risk * 0.25
        else:
            # Flota AHS: 55% cinemática/V2X + 45% percepción LiDAR
            raw_score = speed_risk * 0.55 + perception_risk * 0.45

        # Modulación de borde por distancia espacial crítica
        if obstacle_dist_m < 35.0:
            raw_score = min(0.98, raw_score + 0.25)
        elif obstacle_dist_m > 120.0:
            raw_score = max(0.05, raw_score * 0.30)

        overall_score = round(max(0.04, min(0.98, raw_score)), 3)

        if overall_score >= 0.80:
            severity = "CRITICAL"
        elif overall_score >= 0.60:
            severity = "HIGH"
        elif overall_score >= 0.30:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        return overall_score, severity


# ─────────────────────────────────────────────────────────────────────────────
class XAILayer:
    """
    Capa 5 — Explicabilidad Aditiva TreeSHAP (Proxy).
    Descompone el score en atribuciones causales (phi_i) con porcentajes
    normalizados y recomendaciones contrafácticas en lenguaje natural.
    """
    @staticmethod
    def explain(is_manual: bool,
                perclos_impact: float,
                shift_duration_impact: float,
                speed_kmh: float,
                obstacle_dist_m: float,
                dist_factor: float,
                vis_degradation: float,
                perclos_score: float,
                shift_hours: float,
                overall_score: float) -> Tuple[List[ShapFactor], str, str]:

        factors: List[ShapFactor] = []

        # 1. Fatiga Biológica (solo flotas manuales)
        if is_manual and (perclos_impact > 0.05 or shift_duration_impact > 0.05):
            fatigue_shap = round((perclos_impact + shift_duration_impact) * 0.55, 3)
            factors.append(ShapFactor(
                feature_name="Fatiga Biológica & Horas de Turno (PERCLOS)",
                category="COMPORTAMIENTO_OPERADOR",
                attribution_value=fatigue_shap,
                unit_value_string=f"PERCLOS: {int(perclos_score*100)}% | {shift_hours:.1f}h turno",
                human_readable_reason=(
                    f"El operador registra somnolencia del {int(perclos_score*100)}% "
                    f"con {shift_hours:.1f}h continuas, reduciendo capacidad de frenado reactivo."
                ),
                counterfactual_suggestion=(
                    "Relevo inmediato en garita o activación de alerta acústica/vibratoria en cabina."
                )
            ))

        # 2. Cinemática GNSS — siempre presente
        speed_shap = round((speed_kmh / 45.0) * 0.28, 3)
        factors.append(ShapFactor(
            feature_name="Velocidad de Descenso y Distancia de Frenado",
            category="CINEMATICA_GNSS",
            attribution_value=speed_shap,
            unit_value_string=f"{speed_kmh:.1f} km/h | Distancia: {obstacle_dist_m:.1f}m",
            human_readable_reason=(
                f"A {speed_kmh:.1f} km/h la masa inercial requiere "
                f"{speed_kmh * 1.4:.1f}m para detenerse completamente."
            ),
            counterfactual_suggestion=(
                f"Reducir velocidad a ≤{int(speed_kmh * 0.55)} km/h y acoplar retardador hidráulico."
            )
        ))

        # 3. Percepción LiDAR — si hay proximidad o baja visibilidad
        if dist_factor > 0.30 or vis_degradation > 0.20:
            lidar_shap = round(dist_factor * 0.25 + vis_degradation * 0.15, 3)
            vis_pct = int((1.0 - vis_degradation) * 100)
            factors.append(ShapFactor(
                feature_name="Proximidad Espacial LiDAR y Atenuación de Haz",
                category="PERCEPCION_LIDAR",
                attribution_value=lidar_shap,
                unit_value_string=f"Distancia: {obstacle_dist_m:.1f}m | Visibilidad: {vis_pct}%",
                human_readable_reason=(
                    f"Nube de puntos LiDAR detecta obstáculo a {obstacle_dist_m:.1f}m "
                    "con atenuación de haz por polvo/niebla."
                ),
                counterfactual_suggestion=(
                    "Activar aspersores de supresión de polvo y ralentizar convoy."
                )
            ))

        # 4. Geometría del Tajo — factor ambiental constante
        factors.append(ShapFactor(
            feature_name="Geometría del Banco y Curvatura de Rampa",
            category="ENTORNO_MINERO",
            attribution_value=0.09,
            unit_value_string="Curva de radio cerrado (Banco 3200)",
            human_readable_reason=(
                "La berma de seguridad y el talud rocoso limitan la línea de vista a <45m."
            ),
            counterfactual_suggestion=(
                "Mantener carril derecho estricto y respetar radio de giro abierto."
            )
        ))

        # Normalizar pesos porcentuales a 100 %
        total_attr = sum(abs(f.attribution_value) for f in factors) or 1.0
        for f in factors:
            f.percentage_weight = round(abs(f.attribution_value) / total_attr * 100.0, 1)

        factors.sort(key=lambda x: x.percentage_weight, reverse=True)

        primary_driver = factors[0].feature_name if factors else "Cinemática GNSS"

        if overall_score >= 0.80:
            rec = f"⛔ ALERTA CRÍTICA: {factors[0].counterfactual_suggestion}"
        elif overall_score >= 0.50:
            rec = "⚠️ PRECAUCIÓN: Reducir velocidad y aumentar separación a ≥50m."
        else:
            rec = "✅ Mantener velocidad de crucero y distancia de seguridad reglamentaria."

        return factors, primary_driver, rec


# ─────────────────────────────────────────────────────────────────────────────
class RiskEngine:
    """
    Orquestador principal: idéntico en lógica al RiskEngineService de producción.
    Recibe parámetros individuales (adecuado para sliders de Streamlit).
    """

    @classmethod
    def predict(cls,
                speed_kmh: float          = 30.0,
                obstacle_dist_m: float    = 45.0,
                visibility_index: float   = 0.80,
                perclos_score: float      = 0.12,
                shift_hours: float        = 6.0,
                steering_jerk: float      = 1.5,
                harsh_braking_count: int  = 0,
                is_autonomous: bool       = False,
                target_speed_kmh: Optional[float] = None) -> RiskPrediction:
        """
        Ejecuta el pipeline completo de predicción XAI de 5 capas.
        Retorna un objeto RiskPrediction con todos los detalles.
        """
        # Capa 1: Percepción LiDAR
        dist_factor, vis_degradation, perception_risk = PerceptionLayer.extract(
            nearest_dist_m=obstacle_dist_m,
            visibility_index=visibility_index
        )

        # Capa 2: Comportamiento Operador
        if not is_autonomous:
            perclos_impact, shift_duration_impact, jerk_impact, behavior_risk = \
                BehaviorLayer.extract(perclos_score, shift_hours, steering_jerk, harsh_braking_count)
        else:
            perclos_impact, shift_duration_impact, jerk_impact, behavior_risk = 0.0, 0.0, 0.0, 0.05

        # Capa 3: Cinemática GNSS
        speed_risk, relative_speed, ttc_sec = KinematicsLayer.calculate(
            speed_kmh=speed_kmh,
            obstacle_dist_m=obstacle_dist_m,
            target_speed_kmh=target_speed_kmh
        )

        # Capa 4: Fusión Multi-Modal
        overall_score, severity = FusionLayer.fuse(
            is_autonomous=is_autonomous,
            behavior_risk=behavior_risk,
            speed_risk=speed_risk,
            perception_risk=perception_risk,
            obstacle_dist_m=obstacle_dist_m
        )

        # Capa 5: XAI
        factors, primary_driver, rec = XAILayer.explain(
            is_manual=(not is_autonomous),
            perclos_impact=perclos_impact,
            shift_duration_impact=shift_duration_impact,
            speed_kmh=speed_kmh,
            obstacle_dist_m=obstacle_dist_m,
            dist_factor=dist_factor,
            vis_degradation=vis_degradation,
            perclos_score=perclos_score,
            shift_hours=shift_hours,
            overall_score=overall_score
        )

        prediction_id = f"lab-pred-{int(time.time()*1000)}"

        return RiskPrediction(
            prediction_id=prediction_id,
            overall_risk_score=overall_score,
            risk_level=severity,
            ttc_sec=ttc_sec,
            prediction_horizon_sec=round(ttc_sec + 2.2, 1),
            confidence_score=0.94,
            primary_risk_driver=primary_driver,
            recommendation=rec,
            shap_factors=factors,
            behavior_risk=behavior_risk,
            perception_risk=perception_risk,
            speed_risk=speed_risk,
            dist_factor=dist_factor,
            vis_degradation=vis_degradation
        )

    @classmethod
    def predict_batch(cls, df) -> "pd.DataFrame":
        """Aplica predict() a cada fila de un DataFrame (para evaluación masiva)."""
        import pandas as pd
        results = []
        for _, row in df.iterrows():
            pred = cls.predict(
                speed_kmh=row["gnss_speed_kmh"],
                obstacle_dist_m=row["lidar_obstacle_dist_m"],
                visibility_index=row["lidar_visibility_index"],
                perclos_score=row["op_perclos_score"],
                shift_hours=row["op_shift_hours"],
                steering_jerk=row["op_steering_jerk_stddev"],
                harsh_braking_count=int(row["op_harsh_braking_count"]),
                is_autonomous=bool(row["is_autonomous"])
            )
            results.append({
                "pred_risk_score": pred.overall_risk_score,
                "pred_severity":   pred.risk_level,
                "pred_ttc_sec":    pred.ttc_sec,
                "pred_horizon_sec":pred.prediction_horizon_sec,
            })
        return pd.DataFrame(results)
