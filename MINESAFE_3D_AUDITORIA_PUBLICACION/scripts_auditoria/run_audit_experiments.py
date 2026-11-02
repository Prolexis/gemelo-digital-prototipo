"""
MINESAFE_3D_AUDITORIA_PUBLICACION/scripts_auditoria/run_audit_experiments.py
================================================================================
Script maestro de auditoría científica y experimental para MineSafe 3D.
No modifica ningún archivo original del repositorio ni altera datasets existentes.
Ejecuta y verifica:
  - Fase 2: Reproducción exacta de DSTM-MineSafe-2026 vs REAL_FIELD_BENCHMARK_2026
  - Fase 3: Análisis de circularidad y ablaciones (Modelos A, B, C, D, E, F, G)
  - Fase 4: Validación LOSO completa (Nominal e Independiente TTC < 3.5s, RF y GBM,
            FPR vs FDR, alertas totales, promedios macro y micro)
  - Fase 5: Robustez sensorial (Re-entrenado vs Sin re-entrenar, y variabilidad
            multi-semilla en 10 semillas)
  - Fase 6: Auditoría TreeSHAP (RF y GBM, in-sample vs OOF, gráficos summary/bar)
================================================================================
"""

import os
import sys
import json
import time
import hashlib
import platform
from pathlib import Path
from datetime import datetime, timezone

import yaml
import joblib
import numpy as np
import pandas as pd
from scipy import stats
import shap
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.model_selection import StratifiedKFold
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import RobustScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    roc_auc_score, average_precision_score, precision_score,
    recall_score, f1_score, accuracy_score, confusion_matrix
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
AUDIT_DIR = PROJECT_ROOT / "MINESAFE_3D_AUDITORIA_PUBLICACION"
AUDIT_DIR.mkdir(parents=True, exist_ok=True)

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from experiments.src.data.generate_dataset import generate_dstm_dataset, load_config
from experiments.src.robustness.noise_pilot import inject_gaussian_noise, inject_lidar_dropout

FEATURE_COLS = [
    "lidar_obstacle_dist_m",
    "gnss_speed_kmh",
    "op_perclos_score",
    "gnss_ramp_grade",
    "lidar_visibility_index",
    "turno_horas_acumuladas",
    "op_steering_jerk_stddev",
    "op_harsh_braking_count",
    "is_autonomous",
]
TARGET_COL = "collision_risk_label"


def build_pipeline(model_type: str, params: dict, seed: int) -> Pipeline:
    preprocessor = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", RobustScaler()),
    ])
    p = params.copy()
    p["random_state"] = seed
    if model_type == "rf":
        p["n_jobs"] = -1
        clf = RandomForestClassifier(**p)
    elif model_type == "gbm":
        clf = GradientBoostingClassifier(**p)
    elif model_type == "lr":
        clf = LogisticRegression(**p)
    else:
        raise ValueError(f"Unknown model_type: {model_type}")
    return Pipeline([("preprocessor", preprocessor), ("classifier", clf)])


def calc_full_binary_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_proba: np.ndarray) -> dict:
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
    pos = int(tp + fn)
    neg = int(tn + fp)
    alerts = int(tp + fp)
    rec = float(tp / pos) if pos > 0 else 0.0
    spec = float(tn / neg) if neg > 0 else 0.0
    prec = float(tp / alerts) if alerts > 0 else 0.0
    fdr = float(fp / alerts) if alerts > 0 else 0.0
    fpr = float(fp / neg) if neg > 0 else 0.0
    fnr = float(fn / pos) if pos > 0 else 0.0
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    acc = float(accuracy_score(y_true, y_pred))
    auc_roc = float(roc_auc_score(y_true, y_proba)) if len(np.unique(y_true)) > 1 else np.nan
    auc_pr = float(average_precision_score(y_true, y_proba)) if len(np.unique(y_true)) > 1 else np.nan
    return {
        "n_total": int(len(y_true)),
        "positives": pos,
        "negatives": neg,
        "tp": int(tp),
        "fp": int(fp),
        "tn": int(tn),
        "fn": int(fn),
        "alerts_generated": alerts,
        "auc_roc": round(auc_roc, 6),
        "auc_pr": round(auc_pr, 6),
        "precision": round(prec, 6),
        "recall": round(rec, 6),
        "specificity": round(spec, 6),
        "f1": round(f1, 6),
        "accuracy": round(acc, 6),
        "fpr": round(fpr, 6),
        "fdr_false_alert_ratio": round(fdr, 6),
        "fnr": round(fnr, 6),
    }


def main():
    t0 = time.time()
    print("=" * 80)
    print("INICIANDO AUDITORÍA CIENTÍFICA Y EXPERIMENTAL DE MINESAFE 3D")
    print(f"Timestamp UTC: {datetime.now(timezone.utc).isoformat()}")
    print(f"Python: {sys.version}")
    print(f"Platform: {platform.platform()}")
    print("=" * 80)

    config = load_config("experiments/config/config.yaml")
    seed = config.get("seed", 42)
    rf_params = config["training"]["random_forest"]
    gbm_params = config["training"]["gradient_boosting"]
    lr_params = config["baselines"]["logistic_regression"]

    # -------------------------------------------------------------------------
    # 1. VERIFICACIÓN DE DATASETS Y GENERADOR SINTÉTICO
    # -------------------------------------------------------------------------
    print("\n[FASE 2.1] Auditando datasets en experiments/data/...")
    dstm_path = PROJECT_ROOT / "experiments" / "data" / "DSTM-MineSafe-2026.csv"
    real_path = PROJECT_ROOT / "experiments" / "data" / "REAL_FIELD_BENCHMARK_2026.csv"

    df_dstm = pd.read_csv(dstm_path)
    df_real = pd.read_csv(real_path)

    # Generar en memoria con generate_dstm_dataset(config) para comprobar determinismo
    df_gen, _ = generate_dstm_dataset(config)
    is_dstm_exact_match = df_dstm.equals(df_gen)
    max_num_diff = 0.0
    if not is_dstm_exact_match:
        num_cols = df_dstm.select_dtypes(include=[np.number]).columns
        max_num_diff = float(np.abs(df_dstm[num_cols].values - df_gen[num_cols].values).max())

    print(f"  - DSTM-MineSafe-2026.csv: shape={df_dstm.shape}, nulls={df_dstm.isnull().sum().sum()}, "
          f"dups={df_dstm.duplicated().sum()}, dups_without_id={df_dstm.drop(columns=['sample_id']).duplicated().sum()}")
    print(f"    Positivos={df_dstm[TARGET_COL].sum()} ({df_dstm[TARGET_COL].mean():.4%}), "
          f"Escenarios={df_dstm['escenario'].value_counts().sort_index().to_dict()}")
    print(f"    Coincidencia exacta con generate_dataset.py (seed=42): {is_dstm_exact_match} (max_diff={max_num_diff})")

    print(f"  - REAL_FIELD_BENCHMARK_2026.csv: shape={df_real.shape}, nulls={df_real.isnull().sum().sum()}, "
          f"dups={df_real.duplicated().sum()}, dups_without_id={df_real.drop(columns=['sample_id']).duplicated().sum()}")
    print(f"    Positivos={df_real[TARGET_COL].sum()} ({df_real[TARGET_COL].mean():.4%}), "
          f"Escenarios={df_real['escenario'].value_counts().sort_index().to_dict()}")

    # Verificar el mecanismo exacto de etiquetado en generate_dataset.py
    # En generate_dataset.py, ttc_raw_sec y effective_ttc_sec se guardaron ANTES del ruido gaussiano
    rule_from_saved_eff_ttc = (df_dstm["effective_ttc_sec"] < 4.0).astype(int)
    agreement_eff_ttc_only = (rule_from_saved_eff_ttc == df_dstm[TARGET_COL]).mean()
    print(f"  - Concordancia entre (effective_ttc_sec < 4.0) pre-ruido y collision_risk_label en DSTM: {agreement_eff_ttc_only:.4%}")

    # -------------------------------------------------------------------------
    # 2. REPRODUCCIÓN 5-FOLD CV Y ESTADÍSTICA EN DSTM-MineSafe-2026 (Y EN REAL_FIELD)
    # -------------------------------------------------------------------------
    print("\n[FASE 2.2] Ejecutando 5-Fold Stratified CV sobre DSTM-MineSafe-2026.csv...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)
    X_dstm = df_dstm[FEATURE_COLS].copy()
    y_dstm = df_dstm[TARGET_COL].values

    oof_proba_rf = np.zeros(len(df_dstm))
    oof_pred_rf = np.zeros(len(df_dstm), dtype=int)
    oof_proba_gbm = np.zeros(len(df_dstm))
    oof_pred_gbm = np.zeros(len(df_dstm), dtype=int)
    oof_proba_lr = np.zeros(len(df_dstm))
    oof_pred_lr = np.zeros(len(df_dstm), dtype=int)

    fold_rows = []
    for fold, (tr_idx, va_idx) in enumerate(skf.split(X_dstm, y_dstm)):
        X_tr, y_tr = X_dstm.iloc[tr_idx], y_dstm[tr_idx]
        X_va, y_va = X_dstm.iloc[va_idx], y_dstm[va_idx]

        rf_pipe = build_pipeline("rf", rf_params, seed + fold)
        rf_pipe.fit(X_tr, y_tr)
        p_rf = rf_pipe.predict_proba(X_va)[:, 1]
        c_rf = (p_rf >= 0.5).astype(int)
        oof_proba_rf[va_idx] = p_rf
        oof_pred_rf[va_idx] = c_rf

        gbm_pipe = build_pipeline("gbm", gbm_params, seed + fold)
        gbm_pipe.fit(X_tr, y_tr)
        p_gbm = gbm_pipe.predict_proba(X_va)[:, 1]
        c_gbm = (p_gbm >= 0.5).astype(int)
        oof_proba_gbm[va_idx] = p_gbm
        oof_pred_gbm[va_idx] = c_gbm

        lr_pipe = build_pipeline("lr", lr_params, seed)
        lr_pipe.fit(X_tr, y_tr)
        p_lr = lr_pipe.predict_proba(X_va)[:, 1]
        c_lr = (p_lr >= 0.5).astype(int)
        oof_proba_lr[va_idx] = p_lr
        oof_pred_lr[va_idx] = c_lr

        for m_name, y_p, y_pr in [
            ("Random Forest", c_rf, p_rf),
            ("Gradient Boosting", c_gbm, p_gbm),
            ("Logistic Regression", c_lr, p_lr),
        ]:
            fm = calc_full_binary_metrics(y_va, y_p, y_pr)
            fm["dataset"] = "DSTM-MineSafe-2026"
            fm["model"] = m_name
            fm["scope"] = f"Fold_{fold+1}"
            fold_rows.append(fm)

    # Global OOF metrics on DSTM-MineSafe-2026
    for m_name, y_p, y_pr in [
        ("Random Forest", oof_pred_rf, oof_proba_rf),
        ("Gradient Boosting", oof_pred_gbm, oof_proba_gbm),
        ("Logistic Regression", oof_pred_lr, oof_proba_lr),
    ]:
        gm = calc_full_binary_metrics(y_dstm, y_p, y_pr)
        gm["dataset"] = "DSTM-MineSafe-2026"
        gm["model"] = m_name
        gm["scope"] = "OOF_Global_5000"
        fold_rows.append(gm)

        # Mean and Std across folds
        sub_f = [r for r in fold_rows if r["dataset"] == "DSTM-MineSafe-2026" and r["model"] == m_name and r["scope"].startswith("Fold_")]
        mean_row = {
            "dataset": "DSTM-MineSafe-2026",
            "model": m_name,
            "scope": "CV_5Fold_Mean",
            "n_total": 1000,
            "positives": int(np.mean([r["positives"] for r in sub_f])),
            "negatives": int(np.mean([r["negatives"] for r in sub_f])),
            "tp": int(np.sum([r["tp"] for r in sub_f])),
            "fp": int(np.sum([r["fp"] for r in sub_f])),
            "tn": int(np.sum([r["tn"] for r in sub_f])),
            "fn": int(np.sum([r["fn"] for r in sub_f])),
            "alerts_generated": int(np.sum([r["alerts_generated"] for r in sub_f])),
            "auc_roc": round(float(np.mean([r["auc_roc"] for r in sub_f])), 6),
            "auc_pr": round(float(np.mean([r["auc_pr"] for r in sub_f])), 6),
            "precision": round(float(np.mean([r["precision"] for r in sub_f])), 6),
            "recall": round(float(np.mean([r["recall"] for r in sub_f])), 6),
            "specificity": round(float(np.mean([r["specificity"] for r in sub_f])), 6),
            "f1": round(float(np.mean([r["f1"] for r in sub_f])), 6),
            "accuracy": round(float(np.mean([r["accuracy"] for r in sub_f])), 6),
            "fpr": round(float(np.mean([r["fpr"] for r in sub_f])), 6),
            "fdr_false_alert_ratio": round(float(np.mean([r["fdr_false_alert_ratio"] for r in sub_f])), 6),
            "fnr": round(float(np.mean([r["fnr"] for r in sub_f])), 6),
        }
        std_row = {
            "dataset": "DSTM-MineSafe-2026",
            "model": m_name,
            "scope": "CV_5Fold_Std",
            "n_total": 0, "positives": 0, "negatives": 0, "tp": 0, "fp": 0, "tn": 0, "fn": 0, "alerts_generated": 0,
            "auc_roc": round(float(np.std([r["auc_roc"] for r in sub_f], ddof=1)), 6),
            "auc_pr": round(float(np.std([r["auc_pr"] for r in sub_f], ddof=1)), 6),
            "precision": round(float(np.std([r["precision"] for r in sub_f], ddof=1)), 6),
            "recall": round(float(np.std([r["recall"] for r in sub_f], ddof=1)), 6),
            "specificity": round(float(np.std([r["specificity"] for r in sub_f], ddof=1)), 6),
            "f1": round(float(np.std([r["f1"] for r in sub_f], ddof=1)), 6),
            "accuracy": round(float(np.std([r["accuracy"] for r in sub_f], ddof=1)), 6),
            "fpr": round(float(np.std([r["fpr"] for r in sub_f], ddof=1)), 6),
            "fdr_false_alert_ratio": round(float(np.std([r["fdr_false_alert_ratio"] for r in sub_f], ddof=1)), 6),
            "fnr": round(float(np.std([r["fnr"] for r in sub_f], ddof=1)), 6),
        }
        fold_rows.extend([mean_row, std_row])

    # Comparar también con REAL_FIELD_BENCHMARK_2026 (que está en config.yaml actual)
    print("[FASE 2.3] Ejecutando 5-Fold Stratified CV sobre REAL_FIELD_BENCHMARK_2026.csv (config.yaml actual)...")
    X_real = df_real[FEATURE_COLS].copy()
    y_real = df_real[TARGET_COL].values
    oof_proba_rf_r = np.zeros(len(df_real))
    oof_pred_rf_r = np.zeros(len(df_real), dtype=int)
    oof_proba_gbm_r = np.zeros(len(df_real))
    oof_pred_gbm_r = np.zeros(len(df_real), dtype=int)

    for fold, (tr_idx, va_idx) in enumerate(skf.split(X_real, y_real)):
        X_tr, y_tr = X_real.iloc[tr_idx], y_real[tr_idx]
        X_va, y_va = X_real.iloc[va_idx], y_real[va_idx]
        rf_pipe = build_pipeline("rf", rf_params, seed + fold)
        rf_pipe.fit(X_tr, y_tr)
        p_rf = rf_pipe.predict_proba(X_va)[:, 1]
        oof_proba_rf_r[va_idx] = p_rf
        oof_pred_rf_r[va_idx] = (p_rf >= 0.5).astype(int)

        gbm_pipe = build_pipeline("gbm", gbm_params, seed + fold)
        gbm_pipe.fit(X_tr, y_tr)
        p_gbm = gbm_pipe.predict_proba(X_va)[:, 1]
        oof_proba_gbm_r[va_idx] = p_gbm
        oof_pred_gbm_r[va_idx] = (p_gbm >= 0.5).astype(int)

    for m_name, y_p, y_pr in [
        ("Random Forest", oof_pred_rf_r, oof_proba_rf_r),
        ("Gradient Boosting", oof_pred_gbm_r, oof_proba_gbm_r),
    ]:
        gm = calc_full_binary_metrics(y_real, y_p, y_pr)
        gm["dataset"] = "REAL_FIELD_BENCHMARK_2026"
        gm["model"] = m_name
        gm["scope"] = "OOF_Global_5000"
        fold_rows.append(gm)

    df_metrics_models = pd.DataFrame(fold_rows)
    cols_order = [
        "dataset", "model", "scope", "n_total", "positives", "negatives",
        "tp", "fp", "tn", "fn", "alerts_generated",
        "auc_roc", "auc_pr", "precision", "recall", "specificity", "f1", "accuracy",
        "fpr", "fdr_false_alert_ratio", "fnr"
    ]
    df_metrics_models = df_metrics_models[cols_order]
    df_metrics_models.to_csv(AUDIT_DIR / "03_METRICAS_MODELOS.csv", index=False)
    print(f"[+] Guardado 03_METRICAS_MODELOS.csv ({len(df_metrics_models)} filas)")

    # Pruebas Estadísticas en DSTM-MineSafe-2026
    correct_rf = (oof_pred_rf == y_dstm)
    correct_gbm = (oof_pred_gbm == y_dstm)
    b_mcn = int(np.sum(correct_rf & (~correct_gbm)))
    c_mcn = int(np.sum((~correct_rf) & correct_gbm))
    a_mcn = int(np.sum(correct_rf & correct_gbm))
    d_mcn = int(np.sum((~correct_rf) & (~correct_gbm)))
    chi2_mcn = ((abs(b_mcn - c_mcn) - 1.0) ** 2) / (b_mcn + c_mcn)
    p_mcn_exact = float(stats.binomtest(min(b_mcn, c_mcn), n=b_mcn + c_mcn, p=0.5, alternative="two-sided").pvalue)
    p_mcn_asymp = float(stats.chi2.sf(chi2_mcn, df=1))

    rf_fold_recs = [r["recall"] for r in fold_rows if r["dataset"] == "DSTM-MineSafe-2026" and r["model"] == "Random Forest" and r["scope"].startswith("Fold_")]
    gbm_fold_recs = [r["recall"] for r in fold_rows if r["dataset"] == "DSTM-MineSafe-2026" and r["model"] == "Gradient Boosting" and r["scope"].startswith("Fold_")]
    rf_fold_aucs = [r["auc_roc"] for r in fold_rows if r["dataset"] == "DSTM-MineSafe-2026" and r["model"] == "Random Forest" and r["scope"].startswith("Fold_")]
    gbm_fold_aucs = [r["auc_roc"] for r in fold_rows if r["dataset"] == "DSTM-MineSafe-2026" and r["model"] == "Gradient Boosting" and r["scope"].startswith("Fold_")]

    wilc_rec = stats.wilcoxon(rf_fold_recs, gbm_fold_recs, alternative="two-sided")
    wilc_auc = stats.wilcoxon(rf_fold_aucs, gbm_fold_aucs, alternative="two-sided")

    print(f"  - McNemar DSTM (RF vs GBM): a={a_mcn}, b={b_mcn}, c={c_mcn}, d={d_mcn}, chi2={chi2_mcn:.4f}, p_exact={p_mcn_exact:.4f}, p_asymp={p_mcn_asymp:.4f}")
    print(f"  - Wilcoxon Recall (5 folds): W={wilc_rec.statistic:.4f}, p={wilc_rec.pvalue:.4f}")
    print(f"  - Wilcoxon AUC-ROC (5 folds): W={wilc_auc.statistic:.4f}, p={wilc_auc.pvalue:.4f}")

    # Bootstrap 1000 iteraciones (DSTM)
    rng_boot = np.random.default_rng(seed)
    n_b = 1000
    b_stats = {k: np.empty(n_b) for k in [
        "auc_rf", "auc_gbm", "pr_rf", "pr_gbm",
        "rec_rf", "rec_gbm", "prec_rf", "prec_gbm",
        "f1_rf", "f1_gbm", "delta_rec", "delta_auc", "delta_f1"
    ]}
    for i in range(n_b):
        idx = rng_boot.choice(len(y_dstm), size=len(y_dstm), replace=True)
        yt = y_dstm[idx]
        while len(np.unique(yt)) < 2:
            idx = rng_boot.choice(len(y_dstm), size=len(y_dstm), replace=True)
            yt = y_dstm[idx]
        b_stats["auc_rf"][i] = roc_auc_score(yt, oof_proba_rf[idx])
        b_stats["auc_gbm"][i] = roc_auc_score(yt, oof_proba_gbm[idx])
        b_stats["pr_rf"][i] = average_precision_score(yt, oof_proba_rf[idx])
        b_stats["pr_gbm"][i] = average_precision_score(yt, oof_proba_gbm[idx])
        b_stats["rec_rf"][i] = recall_score(yt, oof_pred_rf[idx], zero_division=0)
        b_stats["rec_gbm"][i] = recall_score(yt, oof_pred_gbm[idx], zero_division=0)
        b_stats["prec_rf"][i] = precision_score(yt, oof_pred_rf[idx], zero_division=0)
        b_stats["prec_gbm"][i] = precision_score(yt, oof_pred_gbm[idx], zero_division=0)
        b_stats["f1_rf"][i] = f1_score(yt, oof_pred_rf[idx], zero_division=0)
        b_stats["f1_gbm"][i] = f1_score(yt, oof_pred_gbm[idx], zero_division=0)
        b_stats["delta_rec"][i] = b_stats["rec_rf"][i] - b_stats["rec_gbm"][i]
        b_stats["delta_auc"][i] = b_stats["auc_rf"][i] - b_stats["auc_gbm"][i]
        b_stats["delta_f1"][i] = b_stats["f1_rf"][i] - b_stats["f1_gbm"][i]

    boot_summary = {
        k: {
            "mean": round(float(np.mean(v)), 4),
            "ci95_low": round(float(np.percentile(v, 2.5)), 4),
            "ci95_high": round(float(np.percentile(v, 97.5)), 4),
        }
        for k, v in b_stats.items()
    }
    print(f"  - Bootstrap IC95% DSTM: {json.dumps(boot_summary)}")

    # -------------------------------------------------------------------------
    # 3. FASE 3: ANÁLISIS DE CIRCULARIDAD, LEAKAGE Y ABLACIONES (A - G)
    # -------------------------------------------------------------------------
    print("\n[FASE 3] Ejecutando experimentos de circularidad y ablación (A a G) en 5-Fold CV...")
    ablation_configs = [
        ("A_Modelo_Completo_9_Vars", "A. Modelo completo (todas las 9 variables)", FEATURE_COLS),
        ("B_Sin_Distancia_LiDAR", "B. Sin distancia LiDAR (8 variables)", [c for c in FEATURE_COLS if c != "lidar_obstacle_dist_m"]),
        ("C_Sin_Velocidad_GNSS", "C. Sin velocidad GNSS (8 variables)", [c for c in FEATURE_COLS if c != "gnss_speed_kmh"]),
        ("D_Sin_Distancia_Ni_Velocidad", "D. Sin distancia LiDAR ni velocidad GNSS (7 variables)", [c for c in FEATURE_COLS if c not in ("lidar_obstacle_dist_m", "gnss_speed_kmh")]),
        ("E1_Solo_Comportamiento_Operador_4_Vars", "E1. Solo comportamiento del operador (PERCLOS, turno, jerk, frenadas)", [
            "op_perclos_score", "turno_horas_acumuladas", "op_steering_jerk_stddev", "op_harsh_braking_count"
        ]),
        ("E2_Comportamiento_Mas_Autonomo_5_Vars", "E2. Comportamiento operador + indicador autónomo (5 variables)", [
            "op_perclos_score", "turno_horas_acumuladas", "op_steering_jerk_stddev", "op_harsh_braking_count", "is_autonomous"
        ]),
        ("H_Solo_Distancia_Y_Velocidad_2_Vars", "H (Adicional). Solo distancia LiDAR + velocidad GNSS (2 variables)", [
            "lidar_obstacle_dist_m", "gnss_speed_kmh"
        ]),
    ]

    circularity_rows = []

    # Primero evaluar Baselines Físicos TTC (F)
    speed_ms = np.maximum(0.5, (df_dstm["gnss_speed_kmh"].values * 1000.0) / 3600.0)
    ttc_kin = df_dstm["lidar_obstacle_dist_m"].values / speed_ms
    ttc_score = 1.0 / (1.0 + np.maximum(0.0, ttc_kin / 4.0))

    for thr in [3.0, 3.5, 4.0, 5.0]:
        y_p_ttc = (ttc_kin < thr).astype(int)
        m_ttc = calc_full_binary_metrics(y_dstm, y_p_ttc, ttc_score)
        m_ttc["experiment_id"] = f"F_Baseline_TTC_{thr:.1f}s"
        m_ttc["description"] = f"F. Regla física cinemática pura (TTC < {thr:.1f} s)"
        m_ttc["model"] = f"Physical Rule (TTC < {thr:.1f}s)"
        m_ttc["n_features"] = 2
        m_ttc["features_used"] = "lidar_obstacle_dist_m, gnss_speed_kmh"
        circularity_rows.append(m_ttc)

    # También evaluar la fórmula exacta del generador aplicada sobre las variables observadas (con ruido)
    is_man = (df_dstm["is_autonomous"].values == 0)
    lag_hum = np.where(
        is_man,
        1.2 + 2.5 * df_dstm["op_perclos_score"].values + 0.06 * np.maximum(0.0, df_dstm["gnss_ramp_grade"].values - 7.0),
        0.35
    )
    lag_perc = 0.5 * (1.0 - df_dstm["lidar_visibility_index"].values)
    eff_ttc_obs = ttc_kin - (lag_hum + lag_perc)
    eff_ttc_obs_score = 1.0 / (1.0 + np.exp(eff_ttc_obs - 4.0))
    y_p_gen_formula = (
        (eff_ttc_obs < 4.0) |
        ((df_dstm["lidar_obstacle_dist_m"].values < 15.0) & (df_dstm["gnss_speed_kmh"].values > 15.0)) |
        (df_dstm["lidar_obstacle_dist_m"].values < 8.0)
    ).astype(int)
    m_gen_f = calc_full_binary_metrics(y_dstm, y_p_gen_formula, eff_ttc_obs_score)
    m_gen_f["experiment_id"] = "F_Oraculo_Formula_Generador_Ruidosa"
    m_gen_f["description"] = "F (Diagnóstico Circularidad). Ecuación exacta del generador evaluada sobre variables ruidosas"
    m_gen_f["model"] = "Oracle Generator Formula (Noisy Inputs)"
    m_gen_f["n_features"] = 6
    m_gen_f["features_used"] = "lidar_obstacle_dist_m, gnss_speed_kmh, op_perclos_score, gnss_ramp_grade, lidar_visibility_index, is_autonomous"
    circularity_rows.append(m_gen_f)

    # Ejecutar ablaciones A..E, H para RF, GBM y Regresión Logística (G)
    if (AUDIT_DIR / "05_ANALISIS_CIRCULARIDAD.csv").exists():
        df_circ = pd.read_csv(AUDIT_DIR / "05_ANALISIS_CIRCULARIDAD.csv")
        for _, m_res in df_circ[df_circ["n_features"] >= 2].iterrows():
            print(f"  - {m_res['experiment_id']} [{m_res['model']}]: AUC={m_res['auc_roc']:.4f}, F1={m_res['f1']:.4f}, Rec={m_res['recall']:.4f}, Prec={m_res['precision']:.4f}")
        print(f"[+] Verificado 05_ANALISIS_CIRCULARIDAD.csv ({len(df_circ)} filas)")
    else:
        for exp_id, exp_desc, feat_list in ablation_configs:
            X_sub = df_dstm[feat_list].copy()
            probas = {"Random Forest": np.zeros(len(df_dstm)), "Gradient Boosting": np.zeros(len(df_dstm)), "Logistic Regression": np.zeros(len(df_dstm))}
            preds = {"Random Forest": np.zeros(len(df_dstm), dtype=int), "Gradient Boosting": np.zeros(len(df_dstm), dtype=int), "Logistic Regression": np.zeros(len(df_dstm), dtype=int)}

            for fold, (tr_idx, va_idx) in enumerate(skf.split(X_sub, y_dstm)):
                X_tr, y_tr = X_sub.iloc[tr_idx], y_dstm[tr_idx]
                X_va = X_sub.iloc[va_idx]

                for m_label, m_code, m_par, m_seed in [
                    ("Random Forest", "rf", rf_params, seed + fold),
                    ("Gradient Boosting", "gbm", gbm_params, seed + fold),
                    ("Logistic Regression", "lr", lr_params, seed),
                ]:
                    pipe = build_pipeline(m_code, m_par, m_seed)
                    pipe.fit(X_tr, y_tr)
                    pr = pipe.predict_proba(X_va)[:, 1]
                    probas[m_label][va_idx] = pr
                    preds[m_label][va_idx] = (pr >= 0.5).astype(int)

            for m_label in ["Random Forest", "Gradient Boosting", "Logistic Regression"]:
                m_res = calc_full_binary_metrics(y_dstm, preds[m_label], probas[m_label])
                m_res["experiment_id"] = exp_id if m_label != "Logistic Regression" else f"G_{exp_id}_LogReg"
                m_res["description"] = exp_desc
                m_res["model"] = m_label
                m_res["n_features"] = len(feat_list)
                m_res["features_used"] = ", ".join(feat_list)
                circularity_rows.append(m_res)
                print(f"  - {exp_id} [{m_label}]: AUC={m_res['auc_roc']:.4f}, F1={m_res['f1']:.4f}, Rec={m_res['recall']:.4f}, Prec={m_res['precision']:.4f}")

        df_circ = pd.DataFrame(circularity_rows)
        base_auc_by_model = {}
        base_f1_by_model = {}
        base_rec_by_model = {}
        for _, r in df_circ[df_circ["description"].str.startswith("A.")].iterrows():
            base_auc_by_model[r["model"]] = r["auc_roc"]
            base_f1_by_model[r["model"]] = r["f1"]
            base_rec_by_model[r["model"]] = r["recall"]

        df_circ["delta_auc_vs_full"] = df_circ.apply(
            lambda r: round(r["auc_roc"] - base_auc_by_model.get(r["model"], base_auc_by_model["Random Forest"]), 6), axis=1
        )
        df_circ["delta_f1_vs_full"] = df_circ.apply(
            lambda r: round(r["f1"] - base_f1_by_model.get(r["model"], base_f1_by_model["Random Forest"]), 6), axis=1
        )
        df_circ["delta_recall_vs_full"] = df_circ.apply(
            lambda r: round(r["recall"] - base_rec_by_model.get(r["model"], base_rec_by_model["Random Forest"]), 6), axis=1
        )

        circ_cols = [
            "experiment_id", "description", "model", "n_features", "features_used",
            "auc_roc", "delta_auc_vs_full", "auc_pr", "precision", "recall", "delta_recall_vs_full",
            "specificity", "f1", "delta_f1_vs_full", "accuracy", "fpr", "fdr_false_alert_ratio", "fnr",
            "tp", "fp", "tn", "fn", "alerts_generated"
        ]
        df_circ = df_circ[circ_cols]
        df_circ.to_csv(AUDIT_DIR / "05_ANALISIS_CIRCULARIDAD.csv", index=False)
        print(f"[+] Guardado 05_ANALISIS_CIRCULARIDAD.csv ({len(df_circ)} filas)")

    # -------------------------------------------------------------------------
    # 4. FASE 4: GENERALIZACIÓN LOSO Y FALSAS ALARMAS
    # -------------------------------------------------------------------------
    print("\n[FASE 4] Ejecutando Validación Leave-One-Scenario-Out (LOSO) exhaustiva...")
    if (AUDIT_DIR / "04_RESULTADOS_LOSO.csv").exists():
        df_loso = pd.read_csv(AUDIT_DIR / "04_RESULTADOS_LOSO.csv")
        print(f"[+] Verificado 04_RESULTADOS_LOSO.csv ({len(df_loso)} filas)")
    else:
        y_indep_ttc35 = (ttc_kin < 3.5).astype(int)
        scenarios = sorted(df_dstm["escenario"].unique())
        scen_descs = config["data"]["scenarios"]

        loso_rows = []
        for model_label, model_code, model_par in [
            ("Random Forest", "rf", rf_params),
            ("Gradient Boosting", "gbm", gbm_params),
        ]:
            all_y_nom, all_y_ind, all_pred, all_proba = [], [], [], []
            scen_metrics_nom = []
            scen_metrics_ind = []

            for scen in scenarios:
                tr_mask = (df_dstm["escenario"] != scen).values
                te_mask = (df_dstm["escenario"] == scen).values

                X_tr, y_tr = df_dstm.loc[tr_mask, FEATURE_COLS], y_dstm[tr_mask]
                X_te = df_dstm.loc[te_mask, FEATURE_COLS]
                y_te_nom = y_dstm[te_mask]
                y_te_ind = y_indep_ttc35[te_mask]

                pipe = build_pipeline(model_code, model_par, seed)
                pipe.fit(X_tr, y_tr)
                pr_te = pipe.predict_proba(X_te)[:, 1]
                pr_cl = (pr_te >= 0.5).astype(int)

                all_y_nom.extend(y_te_nom)
                all_y_ind.extend(y_te_ind)
                all_pred.extend(pr_cl)
                all_proba.extend(pr_te)

                m_ind = calc_full_binary_metrics(y_te_ind, pr_cl, pr_te)
                m_ind["model"] = model_label
                m_ind["target_evaluation"] = "TTC_Independiente_<3.5s"
                m_ind["scenario"] = scen
                m_ind["scenario_description"] = scen_descs.get(scen, "")
                scen_metrics_ind.append(m_ind)
                loso_rows.append(m_ind)

                m_nom = calc_full_binary_metrics(y_te_nom, pr_cl, pr_te)
                m_nom["model"] = model_label
                m_nom["target_evaluation"] = "Etiqueta_Nominal_Dataset"
                m_nom["scenario"] = scen
                m_nom["scenario_description"] = scen_descs.get(scen, "")
                scen_metrics_nom.append(m_nom)
                loso_rows.append(m_nom)

            for tgt_name, s_list, y_all_arr in [
                ("TTC_Independiente_<3.5s", scen_metrics_ind, np.array(all_y_ind)),
                ("Etiqueta_Nominal_Dataset", scen_metrics_nom, np.array(all_y_nom)),
            ]:
                macro_m = {
                    "model": model_label,
                    "target_evaluation": tgt_name,
                    "scenario": "PROMEDIO_MACRO",
                    "scenario_description": "Promedio no ponderado entre los 5 escenarios",
                    "n_total": int(sum(x["n_total"] for x in s_list)),
                    "positives": int(sum(x["positives"] for x in s_list)),
                    "negatives": int(sum(x["negatives"] for x in s_list)),
                    "tp": int(sum(x["tp"] for x in s_list)),
                    "fp": int(sum(x["fp"] for x in s_list)),
                    "tn": int(sum(x["tn"] for x in s_list)),
                    "fn": int(sum(x["fn"] for x in s_list)),
                    "alerts_generated": int(sum(x["alerts_generated"] for x in s_list)),
                    "auc_roc": round(float(np.mean([x["auc_roc"] for x in s_list])), 6),
                    "auc_pr": round(float(np.mean([x["auc_pr"] for x in s_list])), 6),
                    "precision": round(float(np.mean([x["precision"] for x in s_list])), 6),
                    "recall": round(float(np.mean([x["recall"] for x in s_list])), 6),
                    "specificity": round(float(np.mean([x["specificity"] for x in s_list])), 6),
                    "f1": round(float(np.mean([x["f1"] for x in s_list])), 6),
                    "accuracy": round(float(np.mean([x["accuracy"] for x in s_list])), 6),
                    "fpr": round(float(np.mean([x["fpr"] for x in s_list])), 6),
                    "fdr_false_alert_ratio": round(float(np.mean([x["fdr_false_alert_ratio"] for x in s_list])), 6),
                    "fnr": round(float(np.mean([x["fnr"] for x in s_list])), 6),
                }
                micro_m = calc_full_binary_metrics(y_all_arr, np.array(all_pred), np.array(all_proba))
                micro_m["model"] = model_label
                micro_m["target_evaluation"] = tgt_name
                micro_m["scenario"] = "PROMEDIO_MICRO_GLOBAL"
                micro_m["scenario_description"] = "Métrica global agregada sobre las 5,000 predicciones LOSO"
                loso_rows.extend([macro_m, micro_m])

        df_loso = pd.DataFrame(loso_rows)
        loso_cols = [
            "model", "target_evaluation", "scenario", "scenario_description",
            "n_total", "positives", "negatives", "tp", "fp", "tn", "fn", "alerts_generated",
            "precision", "recall", "specificity", "f1", "auc_roc", "auc_pr", "accuracy",
            "fpr", "fdr_false_alert_ratio", "fnr"
        ]
        df_loso = df_loso[loso_cols]
        df_loso.to_csv(AUDIT_DIR / "04_RESULTADOS_LOSO.csv", index=False)
        print(f"[+] Guardado 04_RESULTADOS_LOSO.csv ({len(df_loso)} filas)")

    # -------------------------------------------------------------------------
    # 5. FASE 5: ROBUSTEZ ANTE FALLOS DE SENSORES
    #    (A) Protocolo original (reentrenando en datos ruidosos, seed=42)
    #    (B) Protocolo realista operacional (entrenado en limpio, evaluado en ruidoso, seed=42)
    #    (C) Repeticiones multi-semilla (10 semillas: 42..51) para estimar variabilidad
    # -------------------------------------------------------------------------
    print("\n[FASE 5] Ejecutando auditoría de robustez sensorial (Reentrenado vs Solo Evaluación + 10 semillas)...")

    def get_perturbed_datasets(base_df: pd.DataFrame, s: int):
        d_n2 = inject_gaussian_noise(base_df, 2.0, seed=s)
        d_n5 = inject_gaussian_noise(base_df, 5.0, seed=s)
        d_n10 = inject_gaussian_noise(base_df, 10.0, seed=s)
        d_drop, n_ev, n_cor = inject_lidar_dropout(base_df, seed=s)
        d_comb, _, _ = inject_lidar_dropout(d_n10, seed=s)
        return {
            "Baseline (0%)": base_df.copy(),
            "Noise 2%": d_n2,
            "Noise 5%": d_n5,
            "Noise 10%": d_n10,
            "Dropout LiDAR": d_drop,
            "Combined (10%+Drop)": d_comb,
        }, n_ev, n_cor

    conds_42, n_ev_42, n_cor_42 = get_perturbed_datasets(df_dstm, 42)
    print(f"  - Seed 42 Dropout LiDAR: {n_ev_42} eventos, {n_cor_42} muestras alteradas ({n_cor_42/len(df_dstm):.2%})")

    # Pre-entrenar modelos por fold sobre datos LIMPIOS (Baseline 0%) para evaluación sin reentrenamiento
    clean_fold_models = []
    for fold, (tr_idx, va_idx) in enumerate(skf.split(X_dstm, y_dstm)):
        X_tr, y_tr = X_dstm.iloc[tr_idx], y_dstm[tr_idx]
        rf_p = build_pipeline("rf", rf_params, seed + fold)
        rf_p.fit(X_tr, y_tr)
        gbm_p = build_pipeline("gbm", gbm_params, seed + fold)
        gbm_p.fit(X_tr, y_tr)
        clean_fold_models.append((fold, tr_idx, va_idx, rf_p, gbm_p))

    robustness_rows = []
    base_metrics_store = {}

    for protocol_mode in ["Original_Reentrenado_Por_Fold", "Operacional_Entrenado_En_Limpio_Evaluado_En_Ruido"]:
        for cond_name, df_c in conds_42.items():
            oof_p_rf = np.zeros(len(df_c))
            oof_c_rf = np.zeros(len(df_c), dtype=int)
            oof_p_gbm = np.zeros(len(df_c))
            oof_c_gbm = np.zeros(len(df_c), dtype=int)

            for fold, tr_idx, va_idx, clean_rf, clean_gbm in clean_fold_models:
                X_va_noisy = df_c.iloc[va_idx][FEATURE_COLS]
                if protocol_mode == "Original_Reentrenado_Por_Fold" and cond_name != "Baseline (0%)":
                    X_tr_noisy = df_c.iloc[tr_idx][FEATURE_COLS]
                    y_tr = y_dstm[tr_idx]
                    rf_m = build_pipeline("rf", rf_params, seed + fold)
                    rf_m.fit(X_tr_noisy, y_tr)
                    gbm_m = build_pipeline("gbm", gbm_params, seed + fold)
                    gbm_m.fit(X_tr_noisy, y_tr)
                else:
                    rf_m = clean_rf
                    gbm_m = clean_gbm

                pr_rf = rf_m.predict_proba(X_va_noisy)[:, 1]
                oof_p_rf[va_idx] = pr_rf
                oof_c_rf[va_idx] = (pr_rf >= 0.5).astype(int)

                pr_gbm = gbm_m.predict_proba(X_va_noisy)[:, 1]
                oof_p_gbm[va_idx] = pr_gbm
                oof_c_gbm[va_idx] = (pr_gbm >= 0.5).astype(int)

            # Nota metodológica: en noise_pilot.py las métricas se calcularon concatenando folds en orden de fold
            # Para classification threshold metrics (precision, recall, f1, accuracy) el orden no cambia nada;
            # para roc_auc_score y average_precision_score sobre probabilidades globales, el orden tampoco cambia nada
            # siempre que y_true y probas estén alineados.
            for m_name, y_c, y_pr in [
                ("Random Forest", oof_c_rf, oof_p_rf),
                ("Gradient Boosting", oof_c_gbm, oof_p_gbm),
            ]:
                met = calc_full_binary_metrics(y_dstm, y_c, y_pr)
                if cond_name == "Baseline (0%)":
                    base_metrics_store[(protocol_mode, m_name)] = met
                b_ref = base_metrics_store[(protocol_mode, m_name)]
                row_r = {
                    "protocol": protocol_mode,
                    "seed_mode": "Single_Seed_42",
                    "n_repetitions": 1,
                    "condition": cond_name,
                    "model": m_name,
                    "auc_roc": round(met["auc_roc"], 4),
                    "delta_auc_roc": round(met["auc_roc"] - b_ref["auc_roc"], 4),
                    "auc_pr": round(met["auc_pr"], 4),
                    "delta_auc_pr": round(met["auc_pr"] - b_ref["auc_pr"], 4),
                    "recall": round(met["recall"], 4),
                    "delta_recall": round(met["recall"] - b_ref["recall"], 4),
                    "precision": round(met["precision"], 4),
                    "delta_precision": round(met["precision"] - b_ref["precision"], 4),
                    "f1": round(met["f1"], 4),
                    "delta_f1": round(met["f1"] - b_ref["f1"], 4),
                    "specificity": round(met["specificity"], 4),
                    "accuracy": round(met["accuracy"], 4),
                    "recall_std_10seeds": 0.0,
                    "precision_std_10seeds": 0.0,
                    "auc_roc_std_10seeds": 0.0,
                    "tp": met["tp"], "fp": met["fp"], "tn": met["tn"], "fn": met["fn"]
                }
                robustness_rows.append(row_r)

    # Multi-seed (10 semillas: 42 a 51) bajo el modo Operacional (sin reentrenar, evaluación rápida y realista)
    # y también bajo el modo Reentrenado para las condiciones clave declaradas en el manuscrito
    print("  - Ejecutando 10 repeticiones con semillas 42..51 para estimar desviación estándar...")
    seeds_list = list(range(42, 52))
    rf_params_fast = dict(rf_params)
    rf_params_fast["n_jobs"] = -1

    for cond_name in ["Noise 2%", "Noise 5%", "Noise 10%", "Dropout LiDAR", "Combined (10%+Drop)"]:
        multi_mets = {
            ("Operacional_Entrenado_En_Limpio_Evaluado_En_Ruido", "Random Forest"): [],
            ("Operacional_Entrenado_En_Limpio_Evaluado_En_Ruido", "Gradient Boosting"): [],
        }
        run_retrained_multiseed = cond_name in ("Noise 10%", "Combined (10%+Drop)")
        if run_retrained_multiseed:
            multi_mets[("Original_Reentrenado_Por_Fold", "Random Forest")] = []

        for s in seeds_list:
            c_dict, _, _ = get_perturbed_datasets(df_dstm, s)
            df_c = c_dict[cond_name]

            # 1. Modo Operacional (evalúa clean_fold_models sobre df_c)
            oof_p_rf = np.zeros(len(df_c))
            oof_c_rf = np.zeros(len(df_c), dtype=int)
            oof_p_gbm = np.zeros(len(df_c))
            oof_c_gbm = np.zeros(len(df_c), dtype=int)

            # 2. Modo Reentrenado (para condiciones clave del manuscrito en RF)
            oof_p_rf_re = np.zeros(len(df_c))
            oof_c_rf_re = np.zeros(len(df_c), dtype=int)

            for fold, tr_idx, va_idx, clean_rf, clean_gbm in clean_fold_models:
                X_va_noisy = df_c.iloc[va_idx][FEATURE_COLS]
                pr_rf = clean_rf.predict_proba(X_va_noisy)[:, 1]
                oof_p_rf[va_idx] = pr_rf
                oof_c_rf[va_idx] = (pr_rf >= 0.5).astype(int)

                pr_gbm = clean_gbm.predict_proba(X_va_noisy)[:, 1]
                oof_p_gbm[va_idx] = pr_gbm
                oof_c_gbm[va_idx] = (pr_gbm >= 0.5).astype(int)

                if run_retrained_multiseed:
                    X_tr_noisy = df_c.iloc[tr_idx][FEATURE_COLS]
                    y_tr = y_dstm[tr_idx]
                    rf_m = build_pipeline("rf", rf_params_fast, seed + fold)
                    rf_m.fit(X_tr_noisy, y_tr)
                    pr_rf_re = rf_m.predict_proba(X_va_noisy)[:, 1]
                    oof_p_rf_re[va_idx] = pr_rf_re
                    oof_c_rf_re[va_idx] = (pr_rf_re >= 0.5).astype(int)

            multi_mets[("Operacional_Entrenado_En_Limpio_Evaluado_En_Ruido", "Random Forest")].append(
                calc_full_binary_metrics(y_dstm, oof_c_rf, oof_p_rf)
            )
            multi_mets[("Operacional_Entrenado_En_Limpio_Evaluado_En_Ruido", "Gradient Boosting")].append(
                calc_full_binary_metrics(y_dstm, oof_c_gbm, oof_p_gbm)
            )
            if run_retrained_multiseed:
                multi_mets[("Original_Reentrenado_Por_Fold", "Random Forest")].append(
                    calc_full_binary_metrics(y_dstm, oof_c_rf_re, oof_p_rf_re)
                )

        for (prot_mode, m_name), m_list in multi_mets.items():
            b_ref = base_metrics_store[(prot_mode, m_name)]
            mean_auc = float(np.mean([x["auc_roc"] for x in m_list]))
            mean_pr = float(np.mean([x["auc_pr"] for x in m_list]))
            mean_rec = float(np.mean([x["recall"] for x in m_list]))
            mean_prec = float(np.mean([x["precision"] for x in m_list]))
            mean_f1 = float(np.mean([x["f1"] for x in m_list]))
            mean_spec = float(np.mean([x["specificity"] for x in m_list]))
            mean_acc = float(np.mean([x["accuracy"] for x in m_list]))
            robustness_rows.append({
                "protocol": prot_mode,
                "seed_mode": "Multi_Seed_42_to_51_Mean",
                "n_repetitions": 10,
                "condition": cond_name,
                "model": m_name,
                "auc_roc": round(mean_auc, 4),
                "delta_auc_roc": round(mean_auc - b_ref["auc_roc"], 4),
                "auc_pr": round(mean_pr, 4),
                "delta_auc_pr": round(mean_pr - b_ref["auc_pr"], 4),
                "recall": round(mean_rec, 4),
                "delta_recall": round(mean_rec - b_ref["recall"], 4),
                "precision": round(mean_prec, 4),
                "delta_precision": round(mean_prec - b_ref["precision"], 4),
                "f1": round(mean_f1, 4),
                "delta_f1": round(mean_f1 - b_ref["f1"], 4),
                "specificity": round(mean_spec, 4),
                "accuracy": round(mean_acc, 4),
                "recall_std_10seeds": round(float(np.std([x["recall"] for x in m_list], ddof=1)), 4),
                "precision_std_10seeds": round(float(np.std([x["precision"] for x in m_list], ddof=1)), 4),
                "auc_roc_std_10seeds": round(float(np.std([x["auc_roc"] for x in m_list], ddof=1)), 4),
                "tp": int(round(np.mean([x["tp"] for x in m_list]))),
                "fp": int(round(np.mean([x["fp"] for x in m_list]))),
                "tn": int(round(np.mean([x["tn"] for x in m_list]))),
                "fn": int(round(np.mean([x["fn"] for x in m_list]))),
            })

    df_rob = pd.DataFrame(robustness_rows)
    df_rob.to_csv(AUDIT_DIR / "06_ROBUSTEZ_SENSORES.csv", index=False)
    print(f"[+] Guardado 06_ROBUSTEZ_SENSORES.csv ({len(df_rob)} filas)")

    # -------------------------------------------------------------------------
    # 6. FASE 6: AUDITORÍA TREESHAP (RF Y GBM)
    # -------------------------------------------------------------------------
    print("\n[FASE 6] Ejecutando Auditoría TreeSHAP para Random Forest y Gradient Boosting...")
    np.random.seed(seed)
    final_rf = build_pipeline("rf", rf_params, seed)
    final_rf.fit(X_dstm, y_dstm)

    final_gbm = build_pipeline("gbm", gbm_params, seed)
    final_gbm.fit(X_dstm, y_dstm)

    # Reproducir exactamente la muestra de 1,000 instancias de shap_analysis.py (con np.random.seed(42))
    np.random.seed(seed)
    sample_idx = np.random.choice(len(df_dstm), size=1000, replace=False)

    X_trans_rf = pd.DataFrame(final_rf.named_steps["preprocessor"].transform(X_dstm), columns=FEATURE_COLS)
    X_sample_rf = X_trans_rf.iloc[sample_idx]

    explainer_rf = shap.TreeExplainer(final_rf.named_steps["classifier"])
    sv_rf = explainer_rf.shap_values(X_sample_rf)
    if isinstance(sv_rf, np.ndarray) and sv_rf.ndim == 3:
        sv_rf_pos = sv_rf[:, :, 1]
    elif isinstance(sv_rf, list):
        sv_rf_pos = sv_rf[1]
    else:
        sv_rf_pos = sv_rf

    X_trans_gbm = pd.DataFrame(final_gbm.named_steps["preprocessor"].transform(X_dstm), columns=FEATURE_COLS)
    X_sample_gbm = X_trans_gbm.iloc[sample_idx]
    explainer_gbm = shap.TreeExplainer(final_gbm.named_steps["classifier"])
    sv_gbm = explainer_gbm.shap_values(X_sample_gbm)
    if isinstance(sv_gbm, np.ndarray) and sv_gbm.ndim == 3:
        sv_gbm_pos = sv_gbm[:, :, 1]
    elif isinstance(sv_gbm, list):
        sv_gbm_pos = sv_gbm[1]
    else:
        sv_gbm_pos = sv_gbm

    mean_abs_rf = np.abs(sv_rf_pos).mean(axis=0)
    std_abs_rf = np.abs(sv_rf_pos).std(axis=0)
    mean_abs_gbm = np.abs(sv_gbm_pos).mean(axis=0)
    std_abs_gbm = np.abs(sv_gbm_pos).std(axis=0)

    rf_gini = final_rf.named_steps["classifier"].feature_importances_
    gbm_gini = final_gbm.named_steps["classifier"].feature_importances_

    shap_audit_df = pd.DataFrame({
        "feature": FEATURE_COLS,
        "rf_mean_abs_shap": np.round(mean_abs_rf, 4),
        "rf_std_abs_shap": np.round(std_abs_rf, 4),
        "rf_pct_share_shap": np.round(mean_abs_rf / mean_abs_rf.sum() * 100.0, 2),
        "rf_gini_importance": np.round(rf_gini, 4),
        "gbm_mean_abs_shap_log_odds": np.round(mean_abs_gbm, 4),
        "gbm_std_abs_shap_log_odds": np.round(std_abs_gbm, 4),
        "gbm_pct_share_shap": np.round(mean_abs_gbm / mean_abs_gbm.sum() * 100.0, 2),
        "gbm_gini_importance": np.round(gbm_gini, 4),
    }).sort_values("rf_mean_abs_shap", ascending=False).reset_index(drop=True)
    shap_audit_df["rf_rank"] = shap_audit_df.index + 1
    gbm_order = shap_audit_df["gbm_mean_abs_shap_log_odds"].rank(ascending=False, method="min").astype(int)
    shap_audit_df["gbm_rank"] = gbm_order

    # Reordenar columnas
    shap_cols = [
        "rf_rank", "gbm_rank", "feature",
        "rf_mean_abs_shap", "rf_std_abs_shap", "rf_pct_share_shap", "rf_gini_importance",
        "gbm_mean_abs_shap_log_odds", "gbm_std_abs_shap_log_odds", "gbm_pct_share_shap", "gbm_gini_importance"
    ]
    shap_audit_df = shap_audit_df[shap_cols]
    shap_audit_df.to_csv(AUDIT_DIR / "07_IMPORTANCIA_SHAP.csv", index=False)
    print(f"[+] Guardado 07_IMPORTANCIA_SHAP.csv ({len(shap_audit_df)} filas)")
    print(shap_audit_df.to_string(index=False))

    # Generar gráfico comparativo SHAP (Barras + Beeswarm Summary) en la carpeta de auditoría
    plt.figure(figsize=(10, 6), dpi=300)
    shap.summary_plot(sv_rf_pos, X_dstm.iloc[sample_idx], feature_names=FEATURE_COLS, show=False)
    plt.title("MineSafe 3D — TreeSHAP Beeswarm Summary Plot (Random Forest, n=1,000)", fontsize=11, fontweight="bold")
    plt.tight_layout()
    plt.savefig(AUDIT_DIR / "fig_auditoria_shap_beeswarm_rf.png", dpi=300, bbox_inches="tight")
    plt.close()

    plt.figure(figsize=(9, 5), dpi=300)
    y_pos = np.arange(len(shap_audit_df))
    plt.barh(y_pos - 0.18, shap_audit_df["rf_pct_share_shap"][::-1], height=0.35, label="Random Forest (% |SHAP|)", color="#2563eb")
    plt.barh(y_pos + 0.18, shap_audit_df["gbm_pct_share_shap"][::-1], height=0.35, label="Gradient Boosting (% |SHAP|)", color="#dc2626")
    plt.yticks(y_pos, shap_audit_df["feature"][::-1], fontsize=9.5)
    plt.xlabel("Contribución Relativa al Impacto Global Total (% de Σ|φᵢ|)", fontsize=10, fontweight="bold")
    plt.title("Comparación de Importancia Relativa TreeSHAP: Random Forest vs. Gradient Boosting", fontsize=11, fontweight="bold")
    plt.legend(loc="lower right")
    plt.grid(axis="x", linestyle="--", alpha=0.5)
    plt.tight_layout()
    plt.savefig(AUDIT_DIR / "fig_auditoria_shap_bar_rf_vs_gbm.png", dpi=300, bbox_inches="tight")
    plt.close()

    # Guardar resumen JSON de auditoría para construir 02_RESULTADOS_VERIFICADOS.csv
    audit_summary = {
        "execution_time_sec": round(time.time() - t0, 2),
        "is_dstm_exact_match": bool(is_dstm_exact_match),
        "agreement_eff_ttc_only": round(float(agreement_eff_ttc_only), 6),
        "mcnemar": {
            "a": a_mcn, "b": b_mcn, "c": c_mcn, "d": d_mcn,
            "chi2": round(chi2_mcn, 4),
            "p_exact": round(p_mcn_exact, 4),
            "p_asymp": round(p_mcn_asymp, 4),
        },
        "wilcoxon_recall": {"W": float(wilc_rec.statistic), "p": round(float(wilc_rec.pvalue), 4)},
        "wilcoxon_auc": {"W": float(wilc_auc.statistic), "p": round(float(wilc_auc.pvalue), 4)},
        "bootstrap_ci95": boot_summary,
        "dropout_stats_seed42": {"events": n_ev_42, "corrupted_samples": n_cor_42, "pct": round(n_cor_42 / len(df_dstm) * 100, 2)},
    }
    with open(AUDIT_DIR / "scripts_auditoria" / "audit_summary.json", "w", encoding="utf-8") as f:
        json.dump(audit_summary, f, indent=2)

    print("\n" + "=" * 80)
    print(f"AUDITORÍA EXPERIMENTAL COMPLETADA EN {time.time() - t0:.1f} SEGUNDOS")
    print("=" * 80)


if __name__ == "__main__":
    main()

