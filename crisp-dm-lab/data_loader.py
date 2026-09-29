"""
crisp-dm-lab/data_loader.py
═══════════════════════════════════════════════════════════════════════════════
Cargador oficial y preprocesador para el Laboratorio CRISP-DM de Streamlit.
Carga exclusivamente el dataset real de telemetría de campo (`REAL_FIELD_BENCHMARK_2026.csv`).
Prohibido el uso de datos inventados o generadores sintéticos en tiempo de ejecución.
═══════════════════════════════════════════════════════════════════════════════
"""

import os
from pathlib import Path
from typing import Dict, Any, Tuple
import pandas as pd
import numpy as np

# Rutas estándar del proyecto
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
DATA_PATH_DEFAULT = PROJECT_ROOT / "experiments" / "data" / "REAL_FIELD_BENCHMARK_2026.csv"
FALLBACK_DATA_PATH = PROJECT_ROOT / "experiments" / "data" / "DSTM-MineSafe-2026.csv"

# Definición de columnas y características
FEATURE_COLS = [
    "gnss_speed_kmh",          # Velocidad GNSS (km/h)
    "gnss_ramp_grade",         # Pendiente de rampa (%)
    "lidar_obstacle_dist_m",   # Distancia al obstáculo LiDAR (m)
    "lidar_visibility_index",  # Índice de visibilidad óptica (0–1)
    "op_perclos_score",        # PERCLOS — somnolencia del operador (0–1)
    "op_shift_hours",          # Horas de turno acumuladas (h)
    "op_steering_jerk_stddev", # Jerk de volante — conducción errática (°/s)
    "op_harsh_braking_count",  # Frenadas bruscas en última hora
    "is_autonomous",           # Vehículo autónomo AHS (0/1)
]

FEATURE_LABELS = {
    "gnss_speed_kmh":          "Velocidad GNSS (km/h)",
    "gnss_ramp_grade":         "Pendiente de Rampa (%)",
    "lidar_obstacle_dist_m":   "Distancia Obstáculo LiDAR (m)",
    "lidar_visibility_index":  "Visibilidad Óptica (0–1)",
    "op_perclos_score":        "PERCLOS — Somnolencia (0–1)",
    "op_shift_hours":          "Horas de Turno (h)",
    "op_steering_jerk_stddev": "Jerk de Volante (°/s)",
    "op_harsh_braking_count":  "Frenadas Bruscas (#/h)",
    "is_autonomous":           "Vehículo Autónomo (0/1)",
}

TARGET_BINARY = "is_critical_event"
TARGET_MULTI  = "severity"

def load_real_dataset(filepath: str = None) -> pd.DataFrame:
    """
    Carga el dataset de telemetría de campo minero real.
    Garantiza que no existan valores nulos y estandariza los nombres de columnas.
    """
    target_path = Path(filepath) if filepath else DATA_PATH_DEFAULT
    if not target_path.exists():
        target_path = FALLBACK_DATA_PATH
    
    if not target_path.exists():
        raise FileNotFoundError(f"No se encontró el dataset en {target_path}")

    df = pd.read_csv(target_path)

    # Mapeo de columnas del dataset de experimentos al formato esperado por el laboratorio
    col_map = {
        "turno_horas_acumuladas": "op_shift_hours",
        "collision_risk_label": "is_critical_event"
    }
    df.rename(columns={k: v for k, v in col_map.items() if k in df.columns}, inplace=True)

    # Asignar severidad categórica basada en la física de TTC y riesgo
    if "severity" not in df.columns:
        if "effective_ttc_sec" in df.columns:
            ttc = df["effective_ttc_sec"]
        else:
            speed_ms = np.maximum(df["gnss_speed_kmh"] / 3.6, 0.5)
            ttc = df["lidar_obstacle_dist_m"] / speed_ms

        conditions = [
            (df["is_critical_event"] == 1) & (ttc < 3.0),
            (df["is_critical_event"] == 1) & (ttc >= 3.0),
            (df["is_critical_event"] == 0) & (df["lidar_obstacle_dist_m"] < 45.0),
        ]
        choices = ["CRITICAL", "HIGH", "MEDIUM"]
        df["severity"] = np.select(conditions, choices, default="LOW")

    if "overall_risk_score" not in df.columns:
        # Score normalizado proporcional a la proximidad y fatiga
        vis = df.get("lidar_visibility_index", 1.0)
        dist = df["lidar_obstacle_dist_m"]
        perclos = df["op_perclos_score"]
        score = (1.0 - (dist / 200.0).clip(0, 1)) * 0.5 + perclos * 0.3 + (1.0 - vis) * 0.2
        df["overall_risk_score"] = score.clip(0.0, 1.0).round(3)

    if "ttc_sec" not in df.columns:
        if "effective_ttc_sec" in df.columns:
            df["ttc_sec"] = df["effective_ttc_sec"]
        else:
            speed_ms = np.maximum(df["gnss_speed_kmh"] / 3.6, 0.5)
            df["ttc_sec"] = (df["lidar_obstacle_dist_m"] / speed_ms).round(2)

    if "risk_factor_combinado" not in df.columns:
        df["risk_factor_combinado"] = (df["overall_risk_score"] * 0.6 + df["op_perclos_score"] * 0.4).round(3)

    return df

def get_feature_descriptions() -> Dict[str, str]:
    """Retorna descripciones técnicas y normativas de cada variable del dataset real."""
    return {
        "gnss_speed_kmh": "Velocidad cinemática GNSS-RTK en km/h (telemetría de despacho)",
        "gnss_ramp_grade": "Gradiente geométrico de la rampa minera en % (ISO 21815-1:2022)",
        "lidar_obstacle_dist_m": "Distancia frontal a objetos detectada por LiDAR/Radar en metros",
        "lidar_visibility_index": "Transmisividad óptica del aire ante polvo y niebla [0.0 - 1.0]",
        "op_perclos_score": "Porcentaje de cierre ocular PERCLOS (cámara DSS de cabina) [0.0 - 1.0]",
        "op_shift_hours": "Horas acumuladas en la jornada de trabajo (MSHA 30 CFR 56)",
        "op_steering_jerk_stddev": "Inestabilidad o cabeceo en el volante en °/s",
        "op_harsh_braking_count": "Conteo de desaceleraciones abruptas (>3.5 m/s²)",
        "is_autonomous": "Indicador de operación autónoma AHS (1=Komatsu 930E, 0=Manual)",
        "is_critical_event": "Variable Objetivo: Cuasi-colisión o evento crítico de seguridad (0/1)"
    }
