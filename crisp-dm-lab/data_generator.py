"""
data_generator.py — MineSafe 3D CRISP-DM Lab
Generador de dataset sintético de telemetría minera para tajo abierto.
Simula sensores GNSS, LiDAR y biométricos de flota mixta:
  - Camiones manuales CAT 797F
  - Camiones autónomos Komatsu 930E AHS
  - Palas eléctricas P&H 4100XPC
  - Camionetas livianas Toyota Land Cruiser
"""

import numpy as np
import pandas as pd
from typing import Tuple

# ── Semilla global para reproducibilidad ──────────────────────────────────────
SEED = 42
RNG  = np.random.default_rng(SEED)

# ── Constantes de la flota ────────────────────────────────────────────────────
VEHICLE_TYPES = ["CAT_797F_MANUAL", "KOMATSU_930E_AHS", "PALA_PH_4100XPC", "CAMIONETA_4x4"]
VEHICLE_WEIGHTS = [0.40, 0.30, 0.15, 0.15]   # proporción de cada tipo

SHIFT_LABELS = ["TURNO_DIA_A", "TURNO_NOCHE_B"]
WEATHER_CONDITIONS = ["DESPEJADO", "POLVO_MODERADO", "POLVO_DENSO", "NIEBLA_BAJA"]
WEATHER_WEIGHTS    = [0.45, 0.30, 0.15, 0.10]

# ─────────────────────────────────────────────────────────────────────────────
def _generate_gnss_features(n: int, vtype: np.ndarray) -> pd.DataFrame:
    """Genera variables GNSS: velocidad, pendiente de rampa, posición 3D."""
    speed = np.where(
        vtype == "CAMIONETA_4x4",
        RNG.uniform(20, 60, n),
        np.where(
            vtype == "PALA_PH_4100XPC",
            RNG.uniform(0, 5, n),
            np.where(
                vtype == "KOMATSU_930E_AHS",
                RNG.uniform(15, 40, n),
                RNG.uniform(10, 50, n)  # CAT 797F manual
            )
        )
    )

    ramp_grade = RNG.normal(8.5, 2.5, n).clip(0, 18)          # % pendiente
    easting    = RNG.uniform(350000, 352000, n)                 # UTM Este (m)
    northing   = RNG.uniform(7850000, 7852000, n)               # UTM Norte (m)
    elevation  = RNG.uniform(3180, 3260, n)                     # msnm (Tajo)

    return pd.DataFrame({
        "gnss_speed_kmh":  speed.round(1),
        "gnss_ramp_grade": ramp_grade.round(2),
        "gnss_easting":    easting.round(1),
        "gnss_northing":   northing.round(1),
        "gnss_elevation":  elevation.round(1),
    })


def _generate_lidar_features(n: int, weather: np.ndarray) -> pd.DataFrame:
    """Genera variables LiDAR: distancia a obstáculo, índice de visibilidad."""
    # Visibilidad según clima
    vis_map = {
        "DESPEJADO":      (0.80, 1.00),
        "POLVO_MODERADO": (0.55, 0.80),
        "POLVO_DENSO":    (0.25, 0.55),
        "NIEBLA_BAJA":    (0.30, 0.65),
    }
    visibility = np.zeros(n)
    for cond, (lo, hi) in vis_map.items():
        mask = weather == cond
        visibility[mask] = RNG.uniform(lo, hi, mask.sum())

    # Distancia al obstáculo más cercano (m) — cola pesada hacia situaciones cercanas
    dist_raw = RNG.exponential(scale=55, size=n)
    obstacle_dist = dist_raw.clip(5, 200).round(1)

    return pd.DataFrame({
        "lidar_obstacle_dist_m":  obstacle_dist,
        "lidar_visibility_index": visibility.round(3),
        "lidar_attenuation_pct":  ((1 - visibility) * 100).round(1),
    })


def _generate_operator_features(n: int, vtype: np.ndarray) -> pd.DataFrame:
    """
    Genera variables biométricas y de conducción del operador.
    Solo aplica a vehículos manuales; los AHS tienen valores nulos/baseline.
    """
    is_manual = np.isin(vtype, ["CAT_797F_MANUAL", "CAMIONETA_4x4"])

    # PERCLOS (0 = ojos abiertos, 1 = ojos cerrados) — normal en operación: ~0.12
    perclos = np.where(
        is_manual,
        RNG.beta(a=2.0, b=12.0, size=n).clip(0.05, 0.65),
        0.08   # AHS: valor nominal bajo sin operador
    )

    # Horas acumuladas de turno (0 – 12 h)
    shift_hours = np.where(
        is_manual,
        RNG.uniform(0.5, 12.0, n).round(1),
        RNG.uniform(0.0, 1.0, n).round(1)   # AHS: ciclos cortos
    )

    # Jerk de volante (desviación estándar de corrección angular, °/s)
    steering_jerk = np.where(
        is_manual,
        RNG.gamma(shape=2.0, scale=1.8, size=n).clip(0.1, 12.0),
        0.2
    ).round(2)

    # Frenadas bruscas en la última hora (conteo)
    harsh_braking = np.where(
        is_manual,
        RNG.poisson(lam=1.2, size=n).clip(0, 8),
        0
    ).astype(int)

    return pd.DataFrame({
        "op_perclos_score":        perclos.round(3),
        "op_shift_hours":          shift_hours,
        "op_steering_jerk_stddev": steering_jerk,
        "op_harsh_braking_count":  harsh_braking,
    })


def _compute_risk_labels(df: pd.DataFrame) -> pd.DataFrame:
    """
    Aplica las fórmulas del risk_engine_service.py para generar el score
    y la etiqueta de severidad.  Fiel traducción de las 4 capas de producción.
    """
    is_auto = df["vehicle_type"] == "KOMATSU_930E_AHS"

    # ── Capa Comportamiento ──────────────────────────────────────────────────
    perclos_impact       = np.clip((df["op_perclos_score"] - 0.12) * 1.8, 0, None)
    shift_impact         = np.clip((df["op_shift_hours"] - 7.5) * 0.08, 0, None)
    jerk_impact          = np.clip(df["op_steering_jerk_stddev"] / 10.0 * 0.3, None, 0.25)
    behavior_risk        = np.clip(perclos_impact + shift_impact + jerk_impact +
                            df["op_harsh_braking_count"] * 0.05, None, 0.95)
    behavior_risk        = np.where(is_auto, 0.05, behavior_risk)

    # ── Capa Percepción ──────────────────────────────────────────────────────
    dist_factor          = np.clip((60.0 - df["lidar_obstacle_dist_m"]) / 60.0, 0, None)
    vis_degradation      = np.clip(1.0 - df["lidar_visibility_index"], 0, 1)
    perception_risk      = np.clip(dist_factor * 0.70 + vis_degradation * 0.30, None, 0.95)

    # ── Capa Cinemática ──────────────────────────────────────────────────────
    speed_risk           = np.clip(df["gnss_speed_kmh"] / 45.0 * 0.60, None, 0.90)

    # ── Fusión Multi-Modal ───────────────────────────────────────────────────
    raw_manual = (behavior_risk * 0.45) + (speed_risk * 0.30) + (perception_risk * 0.25)
    raw_auto   = (speed_risk * 0.55) + (perception_risk * 0.45)
    raw_score  = np.where(is_auto, raw_auto, raw_manual)

    # Modulación por distancia crítica
    raw_score  = np.where(df["lidar_obstacle_dist_m"] < 35,
                          np.clip(raw_score + 0.25, None, 0.98),
                          raw_score)
    raw_score  = np.where(df["lidar_obstacle_dist_m"] > 120,
                          np.clip(raw_score * 0.30, 0.05, None),
                          raw_score)

    overall_score = np.clip(raw_score, 0.04, 0.98).round(3)

    # ── Severidad ────────────────────────────────────────────────────────────
    severity = pd.cut(
        overall_score,
        bins=[-0.01, 0.30, 0.60, 0.80, 1.01],
        labels=["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    )

    # ── TTC (Time To Collision) ───────────────────────────────────────────────
    rel_speed_ms  = np.clip(np.clip(df["gnss_speed_kmh"], 15, None) * 1000 / 3600, 1.0, None)
    ttc_sec       = np.clip(df["lidar_obstacle_dist_m"] / rel_speed_ms, 1.2, None).round(1)

    # ── Feature derivada: risk_factor_combinado ──────────────────────────────
    risk_factor_combinado = np.clip(
        overall_score * 0.60 +
        (1 - df["lidar_visibility_index"]) * 0.20 +
        df["op_perclos_score"] * 0.20,
        0, 1
    ).round(3)

    df = df.copy()
    df["behavior_risk"]          = behavior_risk.round(3)
    df["perception_risk"]        = perception_risk.round(3)
    df["speed_risk"]             = speed_risk.round(3)
    df["overall_risk_score"]     = overall_score
    df["severity"]               = severity
    df["ttc_sec"]                = ttc_sec
    df["risk_factor_combinado"]  = risk_factor_combinado
    df["is_critical_event"]      = (overall_score >= 0.60).astype(int)

    return df


# ─────────────────────────────────────────────────────────────────────────────
def generate_dataset(n_samples: int = 1200) -> pd.DataFrame:
    """
    Punto de entrada principal.
    Genera un DataFrame completo con n_samples registros de telemetría simulada.
    """
    vtype   = RNG.choice(VEHICLE_TYPES, size=n_samples, p=VEHICLE_WEIGHTS)
    shift   = RNG.choice(SHIFT_LABELS, size=n_samples)
    weather = RNG.choice(WEATHER_CONDITIONS, size=n_samples, p=WEATHER_WEIGHTS)

    # Metadatos del vehículo
    meta = pd.DataFrame({
        "sample_id":     [f"SIM-{i:05d}" for i in range(n_samples)],
        "vehicle_type":  vtype,
        "shift":         shift,
        "weather":       weather,
        "is_autonomous": (vtype == "KOMATSU_930E_AHS"),
        "payload_tons":  np.where(
            vtype == "CAT_797F_MANUAL",   RNG.uniform(340, 420, n_samples).round(1),
            np.where(
            vtype == "KOMATSU_930E_AHS",  RNG.uniform(290, 330, n_samples).round(1),
            np.where(
            vtype == "PALA_PH_4100XPC",   0.0,
                                           RNG.uniform(0, 3, n_samples).round(1)
            ))),
    })

    gnss    = _generate_gnss_features(n_samples, vtype)
    lidar   = _generate_lidar_features(n_samples, weather)
    operator= _generate_operator_features(n_samples, vtype)

    raw = pd.concat([meta, gnss, lidar, operator], axis=1)
    df  = _compute_risk_labels(raw)

    return df


def get_feature_descriptions() -> dict:
    """Retorna descripciones legibles de cada feature para la UI de Streamlit."""
    return {
        "gnss_speed_kmh":          "Velocidad GNSS del vehículo (km/h)",
        "gnss_ramp_grade":         "Pendiente de rampa de acarreo (%)",
        "gnss_easting":            "Posición Este UTM (m)",
        "gnss_northing":           "Posición Norte UTM (m)",
        "gnss_elevation":          "Elevación sobre el nivel del mar (msnm)",
        "lidar_obstacle_dist_m":   "Distancia LiDAR al obstáculo más próximo (m)",
        "lidar_visibility_index":  "Índice de visibilidad óptica (0=nula, 1=máxima)",
        "lidar_attenuation_pct":   "Atenuación de haz láser por polvo/niebla (%)",
        "op_perclos_score":        "PERCLOS - Porcentaje de cierre ocular (somnolencia)",
        "op_shift_hours":          "Horas acumuladas en turno (h)",
        "op_steering_jerk_stddev": "Desviación estándar del jerk de volante (°/s)",
        "op_harsh_braking_count":  "Nº de frenadas bruscas en la última hora",
        "overall_risk_score":      "Score de riesgo de colisión (0.0 – 1.0)",
        "severity":                "Severidad clasificada (LOW/MEDIUM/HIGH/CRITICAL)",
        "ttc_sec":                 "Tiempo proyectado al impacto – TTC (segundos)",
        "risk_factor_combinado":   "Feature derivada: riesgo combinado normalizado",
        "is_critical_event":       "Etiqueta binaria: evento crítico (HIGH+CRITICAL=1)",
    }
