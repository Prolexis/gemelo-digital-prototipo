"""
ml_model_service.py — MineSafe 3D Backend
══════════════════════════════════════════════════════════════════════════════
Servicio de carga y uso de los modelos ML entrenados por el CRISP-DM Lab
(Streamlit). Conecta el laboratorio de I+D con el motor de producción.

Flujo:
  1. Streamlit entrena RandomForest + GBM → guarda en crisp-dm-lab/models/
  2. Este servicio carga esos .joblib al arrancar el backend
  3. RiskEngineService llama a predict_risk_score() para inferencia real
  4. Fallback automático a fórmulas manuales si los modelos no están disponibles

Features de entrada (deben coincidir con FEATURE_COLS del ml_model.py):
  - gnss_speed_kmh          Velocidad GNSS (km/h)
  - gnss_ramp_grade         Pendiente de rampa (%)
  - lidar_obstacle_dist_m   Distancia al obstáculo LiDAR (m)
  - lidar_visibility_index  Índice de visibilidad óptica (0-1)
  - op_perclos_score        PERCLOS — somnolencia del operador (0-1)
  - op_shift_hours          Horas de turno acumuladas (h)
  - op_steering_jerk_stddev Jerk de volante (grados/s)
  - op_harsh_braking_count  Frenadas bruscas en última hora (#)
  - is_autonomous           Vehículo autónomo AHS (0/1)
══════════════════════════════════════════════════════════════════════════════
"""

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

import json
import warnings
warnings.filterwarnings("ignore", message=".*sklearn.utils.parallel.*")

logger = logging.getLogger("ml_model_service")

# Orden de features exacto (debe coincidir con ml_model.py del CRISP-DM Lab)
FEATURE_COLS = [
    "gnss_speed_kmh",
    "gnss_ramp_grade",
    "lidar_obstacle_dist_m",
    "lidar_visibility_index",
    "op_perclos_score",
    "op_shift_hours",
    "op_steering_jerk_stddev",
    "op_harsh_braking_count",
    "is_autonomous",
]


class MLModelService:
    """
    Singleton que carga los modelos ML exportados por el CRISP-DM Lab y
    expone inferencia en tiempo real para el RiskEngineService.
    Soporta tanto estimadores directos como Pipelines formales de Scikit-Learn.
    """

    def __init__(self):
        self._rf = None
        self._gbm = None
        self._loaded_at: Optional[datetime] = None
        self._model_dir: Optional[Path] = None
        self._is_available = False
        self._is_pipeline = False
        self._pipeline_steps: List[str] = []
        self._metadata: Dict[str, Any] = {}

    def load(self, model_dir: Path) -> bool:
        """
        Intenta cargar rf_model.joblib y gbm_model.joblib desde model_dir.
        Devuelve True si al menos el RandomForest fue cargado exitosamente.
        Es seguro llamar esto varias veces (recarga el modelo si cambio).
        """
        self._model_dir = model_dir
        try:
            import joblib
        except ImportError:
            logger.warning(
                "joblib no instalado — ML models no disponibles. "
                "Instalar con: pip install joblib scikit-learn pandas"
            )
            self._is_available = False
            return False

        rf_path   = model_dir / "rf_model.joblib"
        gbm_path  = model_dir / "gbm_model.joblib"
        meta_path = model_dir / "pipeline_metadata.json"

        if not rf_path.exists():
            logger.warning(
                f"ML models no encontrados en: {model_dir} | "
                "Entrena y exporta desde el CRISP-DM Lab (Streamlit :8501). "
                "El motor usara formulas analiticas como fallback."
            )
            self._is_available = False
            return False

        try:
            self._rf  = joblib.load(rf_path)
            self._gbm = joblib.load(gbm_path) if gbm_path.exists() else None

            # Detección de Pipeline formal
            if hasattr(self._rf, "named_steps"):
                self._is_pipeline = True
                self._pipeline_steps = list(self._rf.named_steps.keys())
                # Optimizar clasificador para inferencia monomuestra
                clf = self._rf.named_steps.get("classifier")
                if clf and hasattr(clf, "n_jobs"):
                    clf.n_jobs = 1
            else:
                self._is_pipeline = False
                self._pipeline_steps = []
                if hasattr(self._rf, "n_jobs"):
                    self._rf.n_jobs = 1

            if self._gbm:
                if hasattr(self._gbm, "named_steps"):
                    gbm_clf = self._gbm.named_steps.get("classifier")
                    if gbm_clf and hasattr(gbm_clf, "n_jobs"):
                        gbm_clf.n_jobs = 1
                elif hasattr(self._gbm, "n_jobs"):
                    self._gbm.n_jobs = 1

            # Cargar metadatos si existen
            if meta_path.exists():
                try:
                    with open(meta_path, "r", encoding="utf-8") as f:
                        self._metadata = json.load(f)
                except Exception as _e:
                    logger.debug(f"No se pudieron leer metadatos: {_e}")
                    self._metadata = {}
            else:
                self._metadata = {}

            self._loaded_at = datetime.now(timezone.utc)
            self._is_available = True

            pipe_info = f" (Pipeline: {self._pipeline_steps})" if self._is_pipeline else ""
            gbm_info = f" + {type(self._gbm).__name__}" if self._gbm else ""
            logger.info(
                f"[ML] Modelos cargados: {type(self._rf).__name__}{pipe_info}{gbm_info} "
                f"desde {model_dir}"
            )
            return True

        except Exception as e:
            logger.error(f"[ML] Error cargando modelos: {e}")
            self._rf = None
            self._gbm = None
            self._is_available = False
            self._is_pipeline = False
            self._pipeline_steps = []
            return False

    @property
    def is_available(self) -> bool:
        return self._is_available and self._rf is not None

    def _build_feature_row(self, raw: Dict[str, Any]):
        """Construye el DataFrame de una fila con las 9 features esperadas."""
        try:
            import pandas as pd
        except ImportError:
            raise RuntimeError("pandas requerido para inferencia ML")

        row = {
            "gnss_speed_kmh":          float(raw.get("gnss_speed_kmh", 30.0)),
            "gnss_ramp_grade":         float(raw.get("gnss_ramp_grade", 8.5)),
            "lidar_obstacle_dist_m":   float(raw.get("lidar_obstacle_dist_m", 50.0)),
            "lidar_visibility_index":  float(raw.get("lidar_visibility_index", 0.85)),
            "op_perclos_score":        float(raw.get("op_perclos_score", 0.12)),
            "op_shift_hours":          float(raw.get("op_shift_hours", 6.0)),
            "op_steering_jerk_stddev": float(raw.get("op_steering_jerk_stddev", 1.0)),
            "op_harsh_braking_count":  int(raw.get("op_harsh_braking_count", 0)),
            "is_autonomous":           int(bool(raw.get("is_autonomous", False))),
        }
        return pd.DataFrame([row])[FEATURE_COLS]

    def predict_risk_score(self, raw_features: Dict[str, Any]) -> Optional[float]:
        """
        Predice la probabilidad de evento critico (0.0 a 1.0) usando el
        RandomForest entrenado por el CRISP-DM Lab.

        Returns:
            float (0.0-1.0) si el modelo esta disponible, None si no lo esta.
            En ese caso RiskEngineService usara las formulas analiticas.
        """
        if not self.is_available:
            return None
        try:
            X = self._build_feature_row(raw_features)
            proba = float(self._rf.predict_proba(X)[0, 1])
            return round(proba, 4)
        except Exception as e:
            logger.error(f"[ML] Error en inferencia RF: {e}")
            return None

    def predict_risk_score_gbm(self, raw_features: Dict[str, Any]) -> Optional[float]:
        """Prediccion alternativa usando GradientBoosting (para comparacion)."""
        if not self.is_available or self._gbm is None:
            return None
        try:
            X = self._build_feature_row(raw_features)
            proba = float(self._gbm.predict_proba(X)[0, 1])
            return round(proba, 4)
        except Exception as e:
            logger.error(f"[ML] Error en inferencia GBM: {e}")
            return None

    def get_status(self) -> Dict[str, Any]:
        """Estado actual del servicio para el endpoint /api/v1/ml/status."""
        if not self.is_available:
            return {
                "model_loaded": False,
                "model_type": None,
                "gbm_available": False,
                "loaded_at": None,
                "model_dir": str(self._model_dir) if self._model_dir else None,
                "message": (
                    "Modelos no disponibles. "
                    "Entrena y exporta desde el CRISP-DM Lab (Streamlit :8501)."
                ),
            }
        clf_name = (
            type(self._rf.named_steps["classifier"]).__name__
            if self._is_pipeline and "classifier" in self._rf.named_steps
            else type(self._rf).__name__
        )
        return {
            "model_loaded": True,
            "is_pipeline": self._is_pipeline,
            "pipeline_steps": self._pipeline_steps,
            "model_type": type(self._rf).__name__,
            "classifier": clf_name,
            "gbm_available": self._gbm is not None,
            "gbm_type": type(self._gbm).__name__ if self._gbm else None,
            "loaded_at": self._loaded_at.isoformat() if self._loaded_at else None,
            "model_dir": str(self._model_dir),
            "feature_cols": FEATURE_COLS,
            "pipeline_metadata": self._metadata,
            "message": (
                f"Pipeline Scikit-Learn activo ({' ➔ '.join(self._pipeline_steps)}) — "
                "inferencia en tiempo real habilitada."
                if self._is_pipeline
                else "Modelo ML activo — inferencia en tiempo real habilitada."
            ),
        }

    def reload(self) -> bool:
        """Recarga los modelos desde disco (util tras exportar desde Streamlit)."""
        if self._model_dir is None:
            return False
        return self.load(self._model_dir)


# Singleton global
ml_model_service = MLModelService()
