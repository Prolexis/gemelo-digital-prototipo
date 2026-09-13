"""
ml_model.py — MineSafe 3D · Laboratorio CRISP-DM
═══════════════════════════════════════════════════════════════════════════════
Entrenamiento del modelo predictivo de riesgo de colisión en minería.

DATASET:
  Dataset Sintético de Telemetría Minera (DSTM-MineSafe-2026)
  • n = 6 250 registros  (80% train / 20% test)
  • Generado mediante simulación estocástica Monte Carlo
  • Distribuciones calibradas con:
      - Manual de operación CAT 797F / Komatsu 930E AHS
      - Regulación MSHA 30 CFR Part 56 (turno máximo, velocidades)
      - Literatura PERCLOS: Dinges et al. (1998), Wierwille & Ellsworth (1994)
      - Norma ISO 21815 (proximidad en maquinaria de construcción)
      - Estadísticas de accidentabilidad NIOSH (2010-2022)

MODELOS:
  1. Random Forest Classifier (sklearn) — ensamble de árboles
  2. Gradient Boosting Classifier (sklearn) — boosting secuencial

EXPLICABILIDAD:
  TreeSHAP via biblioteca `shap` — valores phi_i reales para cada predicción

PERSISTENCIA:
  Modelos guardados en models/ con joblib para carga rápida
═══════════════════════════════════════════════════════════════════════════════
"""

import numpy as np
import pandas as pd
import joblib
import shap
import warnings
from pathlib import Path
from typing import Dict, Any, Tuple

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import (
    train_test_split, cross_val_score, StratifiedKFold, learning_curve
)
from sklearn.metrics import (
    roc_auc_score, accuracy_score, precision_score,
    recall_score, f1_score, confusion_matrix, roc_curve, auc,
    classification_report
)
from sklearn.preprocessing import label_binarize

from data_generator import generate_dataset

warnings.filterwarnings("ignore")

# ── Rutas ────────────────────────────────────────────────────────────────────
MODEL_DIR = Path(__file__).parent / "models"
MODEL_DIR.mkdir(exist_ok=True)

# ── Features de entrada ──────────────────────────────────────────────────────
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

TARGET_BINARY  = "is_critical_event"   # HIGH + CRITICAL = 1
TARGET_MULTI   = "severity"            # LOW / MEDIUM / HIGH / CRITICAL
SEVERITY_ORDER = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

# ─────────────────────────────────────────────────────────────────────────────
def _prepare_X(df: pd.DataFrame) -> pd.DataFrame:
    """Prepara la matriz de features con tipos correctos."""
    X = df[FEATURE_COLS].copy()
    X["is_autonomous"] = X["is_autonomous"].astype(int)
    return X


# ─────────────────────────────────────────────────────────────────────────────
def train_models(df: pd.DataFrame, n_estimators_rf: int = 200) -> Dict[str, Any]:
    """
    Entrena RandomForest y GradientBoosting sobre el dataset,
    calcula métricas completas y valores SHAP reales.

    Returns dict con:
        rf, gbm               — modelos entrenados
        X_train, X_test       — splits de features
        y_train, y_test       — splits de etiquetas
        metrics               — dict de métricas por modelo
        shap_rf               — valores SHAP del RF (clase positiva)
        shap_gbm              — valores SHAP del GBM (clase positiva)
        shap_X_sample         — muestra de X_test usada para SHAP
        feature_cols          — lista de features
        feature_labels        — dict nombre → etiqueta legible
        cv_rf                 — scores CV del RF
        cv_gbm                — scores CV del GBM
        lc_rf                 — curva de aprendizaje RF
        class_report_rf       — classification report RF
        roc_rf, roc_gbm       — (fpr, tpr, thresholds) para ROC
        auc_rf, auc_gbm       — AUC-ROC
    """
    X = _prepare_X(df)
    y = df[TARGET_BINARY]

    # ── Train / Test split estratificado ─────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # ── 1. Random Forest ─────────────────────────────────────────────────────
    rf = RandomForestClassifier(
        n_estimators=n_estimators_rf,
        max_depth=12,
        min_samples_leaf=5,
        max_features="sqrt",
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)

    # ── 2. Gradient Boosting ─────────────────────────────────────────────────
    gbm = GradientBoostingClassifier(
        n_estimators=150,
        learning_rate=0.05,
        max_depth=6,
        min_samples_leaf=10,
        subsample=0.85,
        random_state=42,
    )
    gbm.fit(X_train, y_train)

    # ── Probabilidades y predicciones ────────────────────────────────────────
    rf_proba  = rf.predict_proba(X_test)[:, 1]
    gbm_proba = gbm.predict_proba(X_test)[:, 1]
    rf_pred   = rf.predict(X_test)
    gbm_pred  = gbm.predict(X_test)

    # ── Curvas ROC ────────────────────────────────────────────────────────────
    fpr_rf,  tpr_rf,  thr_rf  = roc_curve(y_test, rf_proba)
    fpr_gbm, tpr_gbm, thr_gbm = roc_curve(y_test, gbm_proba)
    auc_rf  = auc(fpr_rf,  tpr_rf)
    auc_gbm = auc(fpr_gbm, tpr_gbm)

    # ── Cross-Validation (5-fold estratificado) ───────────────────────────────
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_rf  = cross_val_score(rf,  X, y, cv=cv, scoring="roc_auc", n_jobs=-1)
    cv_gbm = cross_val_score(gbm, X, y, cv=cv, scoring="roc_auc", n_jobs=-1)

    # ── Curva de aprendizaje del Random Forest ────────────────────────────────
    train_sizes, train_scores, val_scores = learning_curve(
        rf, X, y, cv=3, scoring="roc_auc",
        train_sizes=np.linspace(0.1, 1.0, 8),
        n_jobs=-1
    )

    # ── Métricas por modelo ───────────────────────────────────────────────────
    def _metrics(y_t, y_p, y_proba):
        cm = confusion_matrix(y_t, y_p)
        tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
        return {
            "accuracy":  round(accuracy_score(y_t, y_p), 4),
            "precision": round(precision_score(y_t, y_p, zero_division=0), 4),
            "recall":    round(recall_score(y_t, y_p, zero_division=0), 4),
            "f1":        round(f1_score(y_t, y_p, zero_division=0), 4),
            "auc_roc":   round(roc_auc_score(y_t, y_proba), 4),
            "fpr":       round(fp / max(fp + tn, 1), 4),
            "tp": int(tp), "fp": int(fp), "fn": int(fn), "tn": int(tn),
        }

    metrics_rf  = _metrics(y_test, rf_pred,  rf_proba)
    metrics_gbm = _metrics(y_test, gbm_pred, gbm_proba)

    # ── SHAP — TreeExplainer (muestra de 300 registros para rapidez) ──────────
    shap_sample_idx = np.random.default_rng(42).choice(len(X_test), min(300, len(X_test)), replace=False)
    X_shap = X_test.iloc[shap_sample_idx].copy()

    explainer_rf  = shap.TreeExplainer(rf)
    explainer_gbm = shap.TreeExplainer(gbm)

    sv_rf  = explainer_rf.shap_values(X_shap)
    sv_gbm = explainer_gbm.shap_values(X_shap)

    # shap ≥ 0.45 devuelve ndarray (n_samples, n_features, n_classes) para RF binario
    # Tomamos siempre la clase positiva (índice 1)
    def _pos(sv):
        if isinstance(sv, np.ndarray) and sv.ndim == 3:
            return sv[:, :, 1]          # (n, features, 2) → (n, features)
        if isinstance(sv, list):
            return sv[1]                # versiones antiguas → lista de 2
        return sv                       # fallback

    shap_rf  = _pos(sv_rf)
    shap_gbm = _pos(sv_gbm)

    # ── Guardar modelos ───────────────────────────────────────────────────────
    joblib.dump(rf,  MODEL_DIR / "rf_model.joblib")
    joblib.dump(gbm, MODEL_DIR / "gbm_model.joblib")

    return {
        "rf":  rf,
        "gbm": gbm,
        "X_train": X_train,
        "X_test":  X_test,
        "y_train": y_train,
        "y_test":  y_test,
        "metrics_rf":  metrics_rf,
        "metrics_gbm": metrics_gbm,
        "shap_rf":     shap_rf,
        "shap_gbm":    shap_gbm,
        "shap_X":      X_shap,
        "shap_expected_rf":  float(
            explainer_rf.expected_value[1]
            if isinstance(explainer_rf.expected_value, (list, np.ndarray)) and len(np.atleast_1d(explainer_rf.expected_value)) > 1
            else float(np.atleast_1d(explainer_rf.expected_value)[0])
        ),
        "feature_cols":   FEATURE_COLS,
        "feature_labels": FEATURE_LABELS,
        "cv_rf":          cv_rf,
        "cv_gbm":         cv_gbm,
        "lc_train_sizes": train_sizes,
        "lc_train_scores": train_scores,
        "lc_val_scores":   val_scores,
        "roc_rf":  (fpr_rf,  tpr_rf),
        "roc_gbm": (fpr_gbm, tpr_gbm),
        "auc_rf":  auc_rf,
        "auc_gbm": auc_gbm,
        "class_report_rf":  classification_report(y_test, rf_pred,
                                                   target_names=["No Crítico","Crítico"],
                                                   output_dict=True),
        "n_train": len(X_train),
        "n_test":  len(X_test),
        "class_balance": {
            "train_pos": int(y_train.sum()),
            "train_neg": int((y_train == 0).sum()),
            "test_pos":  int(y_test.sum()),
            "test_neg":  int((y_test == 0).sum()),
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
def load_or_train(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Carga modelos guardados si existen; si no, los entrena y guarda.
    """
    rf_path  = MODEL_DIR / "rf_model.joblib"
    gbm_path = MODEL_DIR / "gbm_model.joblib"
    if rf_path.exists() and gbm_path.exists():
        rf  = joblib.load(rf_path)
        gbm = joblib.load(gbm_path)
        # Re-calcular métricas y SHAP sobre el dataset actual
        # (para que coincida con el dataset actual)
    return train_models(df)


# ─────────────────────────────────────────────────────────────────────────────
def predict_single(model, X_single: pd.DataFrame) -> Tuple[float, int]:
    """Predicción individual: devuelve (probabilidad_crítico, clase)."""
    X = X_single.copy()
    X["is_autonomous"] = X["is_autonomous"].astype(int)
    proba = model.predict_proba(X[FEATURE_COLS])[0, 1]
    pred  = int(proba >= 0.50)
    return round(float(proba), 4), pred


# ─────────────────────────────────────────────────────────────────────────────
def get_shap_single(explainer, X_single: pd.DataFrame) -> np.ndarray:
    """SHAP values para una sola observación (shap >= 0.45 compatible)."""
    sv = explainer.shap_values(X_single[FEATURE_COLS])
    # shap 0.51+: ndarray (1, n_features, n_classes) para RF binario
    if isinstance(sv, np.ndarray):
        if sv.ndim == 3:
            return sv[0, :, 1]   # clase positiva
        if sv.ndim == 2:
            return sv[0]
        return sv
    # versiones antiguas: lista [class0_array, class1_array]
    if isinstance(sv, list):
        return sv[1][0]
    return np.array(sv)
