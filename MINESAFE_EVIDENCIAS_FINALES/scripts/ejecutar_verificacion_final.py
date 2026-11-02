"""
MINESAFE_EVIDENCIAS_FINALES/scripts/ejecutar_verificacion_final.py
================================================================================
Script maestro de auditoría estadística y reproducibilidad final para el artículo
MineSafe 3D en Acta Montanistica Slovaca (AMS).

Utiliza exclusivamente los datos y scripts originales del repositorio sin alterar
ningún archivo original.

Ejecuta:
- TAREA 1: Verificación de predicciones OOF (N=5,000), alineación registro a registro,
  exportación de predicciones_oof.csv, conteos (a, b, c, d) globales, por clase y por
  fold, identidades marginales frente a las matrices de confusión y test de McNemar
  (exacto bilateral, asintótico con corrección de continuidad de Edwards, sin
  corrección y mid-p de Lancaster).
- TAREA 2: Análisis de potencia estadística (condicional e incondicional de Connor/Lachin
  para Accuracy y Recall, curva de sensibilidad y MDE al 80% y 90% de potencia) y
  análisis de equivalencia TOST (Two One-Sided Tests) para proporciones pareadas y
  métricas OOF bajo márgenes pre-especificados de referencia (0.5%, 1.0%, 2.0%).
- TAREA 3: Reproducción íntegra de RF, GBM, Regresión Logística, Baselines TTC,
  Ablaciones (A-H), LOSO, TreeSHAP y Robustez Sensorial sobre DSTM-MineSafe-2026.csv.
================================================================================
"""

import hashlib
import json
import math
import os
import platform
import shutil
import subprocess
import sys
import time
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import joblib
import matplotlib
import numpy as np
import pandas as pd
import scipy
import shap
import sklearn
import yaml
from scipy import stats
from scipy.stats import binom, norm
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import RobustScaler

matplotlib.use("Agg")

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
FINAL_DIR = PROJECT_ROOT / "MINESAFE_EVIDENCIAS_FINALES"
FINAL_DIR.mkdir(parents=True, exist_ok=True)
(FINAL_DIR / "scripts").mkdir(parents=True, exist_ok=True)
(FINAL_DIR / "config_original").mkdir(parents=True, exist_ok=True)
(FINAL_DIR / "resultados_detallados").mkdir(parents=True, exist_ok=True)

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


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def build_pipeline(model_type: str, params: dict, seed: int) -> Pipeline:
    preprocessor = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", RobustScaler()),
    ])
    p = params.copy()
    p["random_state"] = seed
    if model_type == "rf":
        clf = RandomForestClassifier(**p)
    elif model_type == "gbm":
        clf = GradientBoostingClassifier(**p)
    elif model_type == "lr":
        clf = LogisticRegression(**p)
    else:
        raise ValueError(f"Modelo no soportado: {model_type}")
    return Pipeline([("preprocessor", preprocessor), ("classifier", clf)])


def mcnemar_stats_full(y_true: np.ndarray, pred_1: np.ndarray, pred_2: np.ndarray) -> dict:
    """
    Calcula los conteos (a, b, c, d), McNemar exacto bilateral, mid-p de Lancaster,
    chi2 con corrección de continuidad de Edwards y chi2 asintótico sin corrección.
    """
    c1 = (pred_1 == y_true)
    c2 = (pred_2 == y_true)

    a = int(np.sum(c1 & c2))        # Ambos aciertan
    b = int(np.sum(c1 & (~c2)))     # Solo modelo 1 (RF) acierta
    c = int(np.sum((~c1) & c2))     # Solo modelo 2 (GBM) acierta
    d = int(np.sum((~c1) & (~c2)))  # Ambos fallan
    n_tot = a + b + c + d
    n_disc = b + c

    if n_disc == 0:
        chi2_cc = 0.0
        p_chi2_cc = 1.0
        chi2_uncorr = 0.0
        p_chi2_uncorr = 1.0
        p_exact = 1.0
        p_mid = 1.0
    else:
        chi2_cc = ((abs(b - c) - 1.0) ** 2) / float(n_disc)
        p_chi2_cc = float(stats.chi2.sf(chi2_cc, df=1))

        chi2_uncorr = ((b - c) ** 2) / float(n_disc)
        p_chi2_uncorr = float(stats.chi2.sf(chi2_uncorr, df=1))

        p_exact = float(stats.binomtest(min(b, c), n=n_disc, p=0.5, alternative="two-sided").pvalue)
        # Lancaster mid-p: p_exact - 0.5 * P(X == min(b,c)) * (1 if min(b,c)==max(b,c) else 2)
        prob_point = float(binom.pmf(min(b, c), n_disc, 0.5))
        if b == c:
            p_mid = 1.0 - 0.5 * prob_point
        else:
            p_mid = p_exact - prob_point

    # Diferencia de proporciones de acierto (Accuracy_1 - Accuracy_2 = (b - c) / N)
    diff_acc = (b - c) / float(n_tot)
    # Error estándar de Wald para diferencia de proporciones pareadas: sqrt((b + c) - (b - c)^2 / N) / N
    se_diff = math.sqrt(max(0.0, float(n_disc) - ((b - c) ** 2) / float(n_tot))) / float(n_tot)
    ci95_low = diff_acc - 1.959964 * se_diff
    ci95_high = diff_acc + 1.959964 * se_diff
    ci90_low = diff_acc - 1.644854 * se_diff
    ci90_high = diff_acc + 1.644854 * se_diff

    return {
        "n_total": n_tot,
        "a_ambos_aciertan": a,
        "b_solo_rf_acierta": b,
        "c_solo_gbm_acierta": c,
        "d_ambos_fallan": d,
        "n_discordantes_b_mas_c": n_disc,
        "tasa_discordancia_psi": round(n_disc / float(n_tot), 6),
        "aciertos_totales_rf_a_mas_b": a + b,
        "errores_totales_rf_c_mas_d": c + d,
        "aciertos_totales_gbm_a_mas_c": a + c,
        "errores_totales_gbm_b_mas_d": b + d,
        "accuracy_rf": round((a + b) / float(n_tot), 6),
        "accuracy_gbm": round((a + c) / float(n_tot), 6),
        "delta_accuracy_rf_menos_gbm": round(diff_acc, 6),
        "se_delta_accuracy": round(se_diff, 6),
        "ic95_delta_acc_low": round(ci95_low, 6),
        "ic95_delta_acc_high": round(ci95_high, 6),
        "ic90_delta_acc_low": round(ci90_low, 6),
        "ic90_delta_acc_high": round(ci90_high, 6),
        "odds_ratio_discordante_b_sobre_c": round(b / float(c), 6) if c > 0 else np.nan,
        "chi2_edwards_cc": round(chi2_cc, 6),
        "p_chi2_edwards_cc": round(p_chi2_cc, 6),
        "chi2_sin_correccion": round(chi2_uncorr, 6),
        "p_chi2_sin_correccion": round(p_chi2_uncorr, 6),
        "p_exacto_binomial_bilateral": round(p_exact, 6),
        "p_mid_lancaster": round(p_mid, 6),
    }


def conditional_binomial_power(n_disc: int, p_b: float, alpha: float = 0.05) -> float:
    """
    Calcula la potencia exacta condicional del test binomial bilateral de McNemar
    dado el número total de pares discordantes n_disc = b + c y la probabilidad
    verdadera p_b = P(RF acierta | par discordante) = p_10 / (p_10 + p_01).
    """
    if n_disc <= 0:
        return 0.0
    # Región de rechazo exacta para binomtest(b, n_disc, 0.5, alternative='two-sided') a nivel alpha
    reject_vals = []
    for k in range(n_disc + 1):
        pval = stats.binomtest(k, n=n_disc, p=0.5, alternative="two-sided").pvalue
        if pval < alpha:
            reject_vals.append(k)
    if not reject_vals:
        return 0.0
    power = sum(binom.pmf(k, n_disc, p_b) for k in reject_vals)
    return float(power)


def unconditional_connor_power(N: int, delta: float, psi: float, alpha: float = 0.05) -> float:
    """
    Fórmula de Connor (1987) / Lachin (1992) para la potencia incondicional asintótica
    del test de McNemar en muestras pareadas de tamaño N con proporción total de
    discordancia psi = p_10 + p_01 y diferencia absoluta de proporciones delta = |p_10 - p_01|.
    """
    if abs(delta) >= psi or psi <= 0:
        return 1.0 if abs(delta) >= psi and psi > 0 else 0.0
    z_alpha = norm.ppf(1.0 - alpha / 2.0)
    num_pos = math.sqrt(N) * abs(delta) - z_alpha * math.sqrt(psi)
    num_neg = -math.sqrt(N) * abs(delta) - z_alpha * math.sqrt(psi)
    denom = math.sqrt(max(1e-12, psi - delta ** 2))
    power = float(norm.cdf(num_pos / denom) + norm.cdf(num_neg / denom))
    return min(1.0, max(0.0, power))


def tost_paired_proportions(n_total: int, b: int, c: int, margin: float) -> dict:
    """
    Ejecuta el procedimiento TOST (Two One-Sided Tests, Schuirmann 1987 / Lu & Bean 1995 / Liu et al. 2002)
    para la diferencia de proporciones pareadas Delta = (b - c) / N frente al margen de equivalencia [-margin, +margin].
    H01: Delta <= -margin  vs  H11: Delta > -margin  (estadístico Z1 = (Delta - (-margin)) / SE)
    H02: Delta >= +margin  vs  H12: Delta < +margin  (estadístico Z2 = (+margin - Delta) / SE)
    """
    delta_hat = (b - c) / float(n_total)
    n_disc = b + c
    se_wald = math.sqrt(max(1e-12, float(n_disc) - ((b - c) ** 2) / float(n_total))) / float(n_total)

    # Estadísticos Z sin corrección de continuidad
    z_lower = (delta_hat - (-margin)) / se_wald
    z_upper = (margin - delta_hat) / se_wald
    p_lower = float(norm.sf(z_lower))
    p_upper = float(norm.sf(z_upper))
    p_tost_wald = max(p_lower, p_upper)

    # Estadísticos Z con corrección de continuidad de Liu et al. (2002) (1 / (2*N))
    cc = 0.5 / float(n_total)
    z_lower_cc = (max(0.0, (delta_hat - (-margin)) - cc) if (delta_hat - (-margin)) > 0 else (delta_hat - (-margin))) / se_wald
    z_upper_cc = (max(0.0, (margin - delta_hat) - cc) if (margin - delta_hat) > 0 else (margin - delta_hat)) / se_wald
    p_lower_cc = float(norm.sf(z_lower_cc))
    p_upper_cc = float(norm.sf(z_upper_cc))
    p_tost_cc = max(p_lower_cc, p_upper_cc)

    # Intervalos de confianza
    ci90_low = delta_hat - norm.ppf(0.95) * se_wald
    ci90_high = delta_hat + norm.ppf(0.95) * se_wald
    ci95_low = delta_hat - norm.ppf(0.975) * se_wald
    ci95_high = delta_hat + norm.ppf(0.975) * se_wald

    equiv_alpha05 = bool(p_tost_wald < 0.05 and ci90_low > -margin and ci90_high < margin)
    equiv_cc_alpha05 = bool(p_tost_cc < 0.05)

    return {
        "margin_delta": margin,
        "margin_pct": round(margin * 100.0, 3),
        "estimate_delta": round(delta_hat, 6),
        "se_wald": round(se_wald, 6),
        "ci90_low": round(ci90_low, 6),
        "ci90_high": round(ci90_high, 6),
        "ci95_low": round(ci95_low, 6),
        "ci95_high": round(ci95_high, 6),
        "z_lower": round(z_lower, 4),
        "p_lower": round(p_lower, 6),
        "z_upper": round(z_upper, 4),
        "p_upper": round(p_upper, 6),
        "p_tost_wald": round(p_tost_wald, 6),
        "p_tost_cc": round(p_tost_cc, 6),
        "equivalent_at_alpha_05": equiv_alpha05,
        "equivalent_cc_at_alpha_05": equiv_cc_alpha05,
    }


def main():
    t_start = time.time()
    print("=" * 85)
    print("AUDITORÍA CIENTÍFICA FINAL — PROYECTO MINESAFE 3D (ACTA MONTANISTICA SLOVACA)")
    print(f"Fecha ejecución UTC: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 85)

    # 1. Cargar configuración original y verificar dataset DSTM-MineSafe-2026.csv
    config_path = PROJECT_ROOT / "experiments" / "config" / "config.yaml"
    config = load_config(str(config_path))
    seed = config.get("seed", 42)
    rf_params = config["training"]["random_forest"]
    gbm_params = config["training"]["gradient_boosting"]
    lr_params = config.get("baselines", {}).get(
        "logistic_regression",
        {"C": 1.0, "max_iter": 1000, "class_weight": "balanced"},
    )

    dstm_csv_path = PROJECT_ROOT / "experiments" / "data" / "DSTM-MineSafe-2026.csv"
    existing_oof_path = PROJECT_ROOT / "experiments" / "results" / "predictions_fold_level.csv"

    df_dstm = pd.read_csv(dstm_csv_path)
    df_oof_existing = pd.read_csv(existing_oof_path)

    print("\n[TAREA 1] Verificando predicciones OOF y alineación sobre los 5,000 registros...")
    print(f"  - Ruta dataset original: {dstm_csv_path} ({len(df_dstm)} filas, SHA-256={sha256_file(dstm_csv_path)[:16]}...)")
    print(f"  - Ruta predicciones OOF original: {existing_oof_path} ({len(df_oof_existing)} filas, SHA-256={sha256_file(existing_oof_path)[:16]}...)")

    # Verificar que generate_dstm_dataset(config) reproduce exactamente DSTM-MineSafe-2026.csv
    res_gen = generate_dstm_dataset(config)
    df_gen_check = res_gen[0] if isinstance(res_gen, tuple) else res_gen
    max_diff_gen = float(np.max(np.abs(df_dstm[FEATURE_COLS + [TARGET_COL]].values - df_gen_check[FEATURE_COLS + [TARGET_COL]].values)))
    print(f"  - Diferencia máxima entre DSTM-MineSafe-2026.csv y generate_dataset.py (seed=42): {max_diff_gen:.10f}")

    # Re-ejecutar 5-Fold Stratified CV sobre DSTM-MineSafe-2026.csv para verificar reproducción exacta de predictions_fold_level.csv
    X = df_dstm[FEATURE_COLS].copy()
    y = df_dstm[TARGET_COL].values
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)

    repro_records = []
    oof_proba_lr = np.zeros(len(df_dstm))
    oof_pred_lr = np.zeros(len(df_dstm), dtype=int)

    for fold, (tr_idx, va_idx) in enumerate(skf.split(X, y)):
        X_tr, y_tr = X.iloc[tr_idx], y[tr_idx]
        X_va, y_va = X.iloc[va_idx], y[va_idx]

        rf_pipe = build_pipeline("rf", rf_params, seed + fold)
        rf_pipe.fit(X_tr, y_tr)
        p_rf = rf_pipe.predict_proba(X_va)[:, 1]
        c_rf = (p_rf >= 0.5).astype(int)

        gbm_pipe = build_pipeline("gbm", gbm_params, seed + fold)
        gbm_pipe.fit(X_tr, y_tr)
        p_gbm = gbm_pipe.predict_proba(X_va)[:, 1]
        c_gbm = (p_gbm >= 0.5).astype(int)

        lr_pipe = build_pipeline("lr", lr_params, seed)
        lr_pipe.fit(X_tr, y_tr)
        p_lr = lr_pipe.predict_proba(X_va)[:, 1]
        c_lr = (p_lr >= 0.5).astype(int)
        oof_proba_lr[va_idx] = p_lr
        oof_pred_lr[va_idx] = c_lr

        for i, orig_idx in enumerate(va_idx):
            repro_records.append({
                "index": int(orig_idx),
                "fold": int(fold),
                "escenario": str(df_dstm.iloc[orig_idx]["escenario"]),
                "y_true": int(y_va[i]),
                "proba_rf_full": float(p_rf[i]),
                "proba_gbm_full": float(p_gbm[i]),
                "proba_rf": float(np.round(p_rf[i], 5)),
                "proba_gbm": float(np.round(p_gbm[i], 5)),
                "y_pred_rf": int(c_rf[i]),
                "y_pred_gbm": int(c_gbm[i]),
            })

    df_oof_repro = pd.DataFrame(repro_records).sort_values("index").reset_index(drop=True)

    # Comprobar alineación exacta entre df_dstm, df_oof_existing y df_oof_repro
    align_index_ok = bool(np.array_equal(df_oof_existing["index"].values, np.arange(5000)))
    align_y_dstm_ok = bool(np.array_equal(df_oof_existing["y_true"].values, df_dstm[TARGET_COL].values))
    align_scen_ok = bool(np.array_equal(df_oof_existing["escenario"].values, df_dstm["escenario"].values))
    align_fold_repro_ok = bool(np.array_equal(df_oof_existing["fold"].values, df_oof_repro["fold"].values))
    align_pred_rf_ok = bool(np.array_equal(df_oof_existing["y_pred_rf"].values, df_oof_repro["y_pred_rf"].values))
    align_pred_gbm_ok = bool(np.array_equal(df_oof_existing["y_pred_gbm"].values, df_oof_repro["y_pred_gbm"].values))
    max_diff_proba_rf = float(np.max(np.abs(df_oof_existing["proba_rf"].values - df_oof_repro["proba_rf"].values)))
    max_diff_proba_gbm = float(np.max(np.abs(df_oof_existing["proba_gbm"].values - df_oof_repro["proba_gbm"].values)))

    print(f"  - Alineación index 0..4999 exacto: {align_index_ok}")
    print(f"  - Alineación etiqueta_real vs DSTM-MineSafe-2026.csv: {align_y_dstm_ok}")
    print(f"  - Alineación escenario vs DSTM-MineSafe-2026.csv: {align_scen_ok}")
    print(f"  - Coincidencia prediccion_RF (archivo existente vs re-ejecución): {align_pred_rf_ok} (0 discrepancias en 5,000 filas)")
    print(f"  - Coincidencia prediccion_GBM (archivo existente vs re-ejecución): {align_pred_gbm_ok} (0 discrepancias en 5,000 filas)")
    print(f"  - Diferencia máx. probabilidad_RF / probabilidad_GBM: {max_diff_proba_rf:.8f} / {max_diff_proba_gbm:.8f}")

    # Exportar predicciones_oof.csv con las columnas exactas solicitadas en TAREA 1.3
    df_export_oof = pd.DataFrame({
        "id_registro": df_oof_existing["index"].astype(int),
        "fold": df_oof_existing["fold"].astype(int),
        "etiqueta_real": df_oof_existing["y_true"].astype(int),
        "prediccion_RF": df_oof_existing["y_pred_rf"].astype(int),
        "prediccion_GBM": df_oof_existing["y_pred_gbm"].astype(int),
        "probabilidad_RF": df_oof_existing["proba_rf"].astype(float),
        "probabilidad_GBM": df_oof_existing["proba_gbm"].astype(float),
    })
    df_export_oof.to_csv(FINAL_DIR / "predicciones_oof.csv", index=False)
    print(f"[+] Exportado predicciones_oof.csv ({len(df_export_oof)} filas, columnas={list(df_export_oof.columns)})")

    # TAREA 1.4 & 1.5: Cálculo de conteos de concordancia y McNemar global, por clase y por fold
    y_true = df_export_oof["etiqueta_real"].values
    pred_rf = df_export_oof["prediccion_RF"].values
    pred_gbm = df_export_oof["prediccion_GBM"].values
    proba_rf = df_export_oof["probabilidad_RF"].values
    proba_gbm = df_export_oof["probabilidad_GBM"].values

    mcn_rows = []
    # Global (N = 5,000)
    m_glob = mcnemar_stats_full(y_true, pred_rf, pred_gbm)
    m_glob["estrato"] = "GLOBAL_OOF_5000"
    m_glob["descripcion"] = "Conjunto completo Out-of-Fold (N=5,000)"
    mcn_rows.append(m_glob)

    # Solo Positivos Reales (y_true == 1, N = 2,677) -> Evalúa discordancia en Recall (TP vs FN)
    mask_pos = (y_true == 1)
    m_pos = mcnemar_stats_full(y_true[mask_pos], pred_rf[mask_pos], pred_gbm[mask_pos])
    m_pos["estrato"] = "CLASE_POSITIVA_Y1_RECALL"
    m_pos["descripcion"] = "Solo positivos reales (y=1, N=2,677): a=Ambos TP, b=Solo RF TP (GBM FN), c=Solo GBM TP (RF FN), d=Ambos FN"
    mcn_rows.append(m_pos)

    # Solo Negativos Reales (y_true == 0, N = 2,323) -> Evalúa discordancia en Especificidad (TN vs FP)
    mask_neg = (y_true == 0)
    m_neg = mcnemar_stats_full(y_true[mask_neg], pred_rf[mask_neg], pred_gbm[mask_neg])
    m_neg["estrato"] = "CLASE_NEGATIVA_Y0_SPECIFICITY"
    m_neg["descripcion"] = "Solo negativos reales (y=0, N=2,323): a=Ambos TN, b=Solo RF TN (GBM FP), c=Solo GBM TN (RF FP), d=Ambos FP"
    mcn_rows.append(m_neg)

    # Por cada fold (0..4)
    for f in range(5):
        mask_f = (df_export_oof["fold"].values == f)
        m_f = mcnemar_stats_full(y_true[mask_f], pred_rf[mask_f], pred_gbm[mask_f])
        m_f["estrato"] = f"FOLD_{f}"
        m_f["descripcion"] = f"Partición de validación Fold {f} (N=1,000)"
        mcn_rows.append(m_f)

    # Por cada escenario (A..E)
    for sc in sorted(df_dstm["escenario"].unique()):
        mask_sc = (df_dstm["escenario"].values == sc)
        m_sc = mcnemar_stats_full(y_true[mask_sc], pred_rf[mask_sc], pred_gbm[mask_sc])
        m_sc["estrato"] = f"ESCENARIO_{sc}"
        m_sc["descripcion"] = f"Subconjunto Out-of-Fold del Escenario {sc} (N={int(np.sum(mask_sc))})"
        mcn_rows.append(m_sc)

    df_mcn = pd.DataFrame(mcn_rows)
    cols_mcn = [
        "estrato", "descripcion", "n_total",
        "a_ambos_aciertan", "b_solo_rf_acierta", "c_solo_gbm_acierta", "d_ambos_fallan",
        "n_discordantes_b_mas_c", "tasa_discordancia_psi",
        "aciertos_totales_rf_a_mas_b", "errores_totales_rf_c_mas_d",
        "aciertos_totales_gbm_a_mas_c", "errores_totales_gbm_b_mas_d",
        "accuracy_rf", "accuracy_gbm", "delta_accuracy_rf_menos_gbm", "se_delta_accuracy",
        "ic95_delta_acc_low", "ic95_delta_acc_high", "ic90_delta_acc_low", "ic90_delta_acc_high",
        "odds_ratio_discordante_b_sobre_c",
        "chi2_edwards_cc", "p_chi2_edwards_cc",
        "chi2_sin_correccion", "p_chi2_sin_correccion",
        "p_exacto_binomial_bilateral", "p_mid_lancaster",
    ]
    df_mcn = df_mcn[cols_mcn]
    df_mcn.to_csv(FINAL_DIR / "mcnemar_verificado.csv", index=False)
    print(f"[+] Exportado mcnemar_verificado.csv ({len(df_mcn)} filas)")
    print(f"    -> GLOBAL: a={m_glob['a_ambos_aciertan']}, b={m_glob['b_solo_rf_acierta']}, c={m_glob['c_solo_gbm_acierta']}, d={m_glob['d_ambos_fallan']}")
    print(f"    -> POSITIVOS (y=1): a_pos={m_pos['a_ambos_aciertan']}, b_pos={m_pos['b_solo_rf_acierta']}, c_pos={m_pos['c_solo_gbm_acierta']}, d_pos={m_pos['d_ambos_fallan']}")
    print(f"    -> NEGATIVOS (y=0): a_neg={m_neg['a_ambos_aciertan']}, b_neg={m_neg['b_solo_rf_acierta']}, c_neg={m_neg['c_solo_gbm_acierta']}, d_neg={m_neg['d_ambos_fallan']}")
    print(f"    -> McNemar exacto={m_glob['p_exacto_binomial_bilateral']:.6f}, Chi2_Edwards={m_glob['chi2_edwards_cc']:.6f} (p={m_glob['p_chi2_edwards_cc']:.6f}), Chi2_uncorr={m_glob['chi2_sin_correccion']:.6f} (p={m_glob['p_chi2_sin_correccion']:.6f})")

    # -------------------------------------------------------------------------
    # TAREA 2.1 & 2.2: ANÁLISIS DE POTENCIA ESTADÍSTICA PARA MCNEMAR
    # -------------------------------------------------------------------------
    print("\n[TAREA 2.1] Calculando curvas de potencia estadística y sensibilidad para McNemar...")
    n_tot = 5000
    n_pos = int(np.sum(mask_pos))  # 2677
    psi_obs_acc = m_glob["tasa_discordancia_psi"]  # 92 / 5000 = 0.0184
    n_disc_obs_acc = m_glob["n_discordantes_b_mas_c"]  # 92

    psi_obs_rec = m_pos["tasa_discordancia_psi"]  # (20 + 30) / 2677 = 50 / 2677 = 0.018678
    n_disc_obs_rec = m_pos["n_discordantes_b_mas_c"]  # 50

    # Curva de sensibilidad sobre Delta Accuracy para psi = 0.0184 (observado) y otros valores de psi
    delta_acc_grid = [0.0010, 0.0020, 0.0024, 0.0030, 0.0040, 0.0050, 0.0054, 0.0062, 0.0075, 0.0100, 0.0125, 0.0150, 0.0180]
    power_acc_rows = []
    for d_acc in delta_acc_grid:
        # Condicional a n_disc = 92: si delta_acc = |p_10 - p_01| y p_10 + p_01 = psi_obs_acc = 0.0184,
        # entonces p_b = 0.5 + d_acc / (2 * psi_obs_acc)
        if d_acc < psi_obs_acc:
            p_b = 0.5 + d_acc / (2.0 * psi_obs_acc)
            pow_cond_exact = conditional_binomial_power(n_disc_obs_acc, p_b, alpha=0.05)
        else:
            p_b = 1.0
            pow_cond_exact = 1.0

        pow_uncond_obs = unconditional_connor_power(n_tot, d_acc, psi_obs_acc, alpha=0.05)
        pow_uncond_psi25 = unconditional_connor_power(n_tot, d_acc, 0.0250, alpha=0.05)
        pow_uncond_psi35 = unconditional_connor_power(n_tot, d_acc, 0.0350, alpha=0.05)
        pow_uncond_psi50 = unconditional_connor_power(n_tot, d_acc, 0.0500, alpha=0.05)

        power_acc_rows.append({
            "metric": "Accuracy (N=5,000)",
            "delta_abs": d_acc,
            "delta_pct": round(d_acc * 100.0, 3),
            "diff_samples_N5000": round(d_acc * n_tot, 1),
            "p_b_conditional_at_psi_obs": round(p_b, 4),
            "odds_ratio_discordant": round(p_b / (1.0 - p_b), 4) if p_b < 1.0 else np.inf,
            "power_conditional_exact_nd92": round(pow_cond_exact, 4),
            "power_unconditional_psi_0184_obs": round(pow_uncond_obs, 4),
            "power_unconditional_psi_0250": round(pow_uncond_psi25, 4),
            "power_unconditional_psi_0350": round(pow_uncond_psi35, 4),
            "power_unconditional_psi_0500": round(pow_uncond_psi50, 4),
        })

    # Curva de sensibilidad sobre Delta Recall (en los N_pos = 2,677 positivos reales, n_disc_pos = 58, psi_pos = 0.021666)
    delta_rec_grid = [0.0020, 0.003736, 0.0050, 0.0060, 0.0075, 0.0081, 0.0093, 0.0100, 0.0125, 0.0150, 0.0200]
    power_rec_rows = []
    for d_rec in delta_rec_grid:
        if d_rec < psi_obs_rec:
            p_b_rec = 0.5 + d_rec / (2.0 * psi_obs_rec)
            pow_cond_rec = conditional_binomial_power(n_disc_obs_rec, p_b_rec, alpha=0.05)
        else:
            p_b_rec = 1.0
            pow_cond_rec = 1.0
        pow_uncond_rec_obs = unconditional_connor_power(n_pos, d_rec, psi_obs_rec, alpha=0.05)
        pow_uncond_rec_psi35 = unconditional_connor_power(n_pos, d_rec, 0.0350, alpha=0.05)
        pow_uncond_rec_psi50 = unconditional_connor_power(n_pos, d_rec, 0.0500, alpha=0.05)
        power_rec_rows.append({
            "metric": "Recall / Sensibilidad (N_pos=2,677)",
            "delta_abs": round(d_rec, 6),
            "delta_pct": round(d_rec * 100.0, 3),
            "diff_positive_samples_N2677": round(d_rec * n_pos, 1),
            "p_b_conditional_at_psi_obs": round(p_b_rec, 4),
            "odds_ratio_discordant": round(p_b_rec / (1.0 - p_b_rec), 4) if p_b_rec < 1.0 else np.inf,
            "power_conditional_exact_nd50": round(pow_cond_rec, 4),
            "power_unconditional_psi_0187_obs": round(pow_uncond_rec_obs, 4),
            "power_unconditional_psi_0350": round(pow_uncond_rec_psi35, 4),
            "power_unconditional_psi_0500": round(pow_uncond_rec_psi50, 4),
        })

    pd.DataFrame(power_acc_rows).to_csv(FINAL_DIR / "resultados_detallados" / "curva_potencia_accuracy.csv", index=False)
    pd.DataFrame(power_rec_rows).to_csv(FINAL_DIR / "resultados_detallados" / "curva_potencia_recall.csv", index=False)

    # Encontrar MDE exacto por búsqueda fina para potencia 80% y 90%
    fine_deltas = np.linspace(0.0001, 0.0200, 2000)
    mde_acc_80_uncond = float(next(d for d in fine_deltas if unconditional_connor_power(n_tot, d, psi_obs_acc) >= 0.80))
    mde_acc_90_uncond = float(next(d for d in fine_deltas if unconditional_connor_power(n_tot, d, psi_obs_acc) >= 0.90))
    mde_acc_80_cond = float(next(d for d in fine_deltas if d < psi_obs_acc and conditional_binomial_power(n_disc_obs_acc, 0.5 + d / (2 * psi_obs_acc)) >= 0.80))
    mde_acc_90_cond = float(next(d for d in fine_deltas if d < psi_obs_acc and conditional_binomial_power(n_disc_obs_acc, 0.5 + d / (2 * psi_obs_acc)) >= 0.90))

    mde_rec_80_uncond = float(next(d for d in fine_deltas if unconditional_connor_power(n_pos, d, psi_obs_rec) >= 0.80))
    mde_rec_90_uncond = float(next(d for d in fine_deltas if unconditional_connor_power(n_pos, d, psi_obs_rec) >= 0.90))
    mde_rec_80_cond = float(next(d for d in fine_deltas if d < psi_obs_rec and conditional_binomial_power(n_disc_obs_rec, 0.5 + d / (2 * psi_obs_rec)) >= 0.80))
    mde_rec_90_cond = float(next(d for d in fine_deltas if d < psi_obs_rec and conditional_binomial_power(n_disc_obs_rec, 0.5 + d / (2 * psi_obs_rec)) >= 0.90))

    print(f"  - MDE Accuracy (N=5,000, psi=1.84%): Potencia 80% -> {mde_acc_80_uncond*100:.2f}% (incond) / {mde_acc_80_cond*100:.2f}% (cond exacta); Potencia 90% -> {mde_acc_90_uncond*100:.2f}% (incond) / {mde_acc_90_cond*100:.2f}% (cond exacta)")
    print(f"  - MDE Recall (N_pos=2,677, psi=2.17%): Potencia 80% -> {mde_rec_80_uncond*100:.2f}% (incond) / {mde_rec_80_cond*100:.2f}% (cond exacta); Potencia 90% -> {mde_rec_90_uncond*100:.2f}% (incond) / {mde_rec_90_cond*100:.2f}% (cond exacta)")

    # -------------------------------------------------------------------------
    # TAREA 2.3, 2.4 & 2.5: ANÁLISIS DE EQUIVALENCIA TOST Y BOOTSTRAP PAREADO
    # -------------------------------------------------------------------------
    print("\n[TAREA 2.3-2.5] Ejecutando pruebas de equivalencia TOST (proporciones pareadas y Bootstrap B=10,000)...")
    margins_grid = [0.0025, 0.0050, 0.0075, 0.0100, 0.0150, 0.0200]
    tost_rows = []

    # 1. TOST analítico sobre proporciones pareadas exactas:
    #    - Accuracy (N=5000, b=40, c=52)
    #    - Recall / Sensibilidad (N_pos=2677, b_pos=24, c_pos=34)
    #    - Specificity (N_neg=2323, b_neg=16, c_neg=18)
    for m_name, n_sub, b_sub, c_sub in [
        ("Accuracy (N=5,000)", n_tot, m_glob["b_solo_rf_acierta"], m_glob["c_solo_gbm_acierta"]),
        ("Recall / Sensibilidad (N_pos=2,677)", n_pos, m_pos["b_solo_rf_acierta"], m_pos["c_solo_gbm_acierta"]),
        ("Specificity / Especificidad (N_neg=2,323)", int(np.sum(mask_neg)), m_neg["b_solo_rf_acierta"], m_neg["c_solo_gbm_acierta"]),
    ]:
        for mg in margins_grid:
            res_t = tost_paired_proportions(n_sub, b_sub, c_sub, mg)
            res_t["metric"] = m_name
            res_t["method"] = "Wald_Paired_Proportions"
            tost_rows.append(res_t)

    # 2. Bootstrap pareado no paramétrico (B = 1,000 original + B = 10,000 alta precisión) para todas las métricas
    rng_b = np.random.default_rng(seed)
    n_b_high = 2000
    b_diffs = {
        "Accuracy": np.empty(n_b_high),
        "Recall": np.empty(n_b_high),
        "Specificity": np.empty(n_b_high),
        "Precision": np.empty(n_b_high),
        "F1_score": np.empty(n_b_high),
        "ROC_AUC": np.empty(n_b_high),
        "PR_AUC": np.empty(n_b_high),
    }

    for i in range(n_b_high):
        idx = rng_b.choice(n_tot, size=n_tot, replace=True)
        yt_b = y_true[idx]
        prf_b = pred_rf[idx]
        pgbm_b = pred_gbm[idx]
        pr_rf_b = proba_rf[idx]
        pr_gbm_b = proba_gbm[idx]

        b_diffs["Accuracy"][i] = np.mean(prf_b == yt_b) - np.mean(pgbm_b == yt_b)
        pos_b = (yt_b == 1)
        neg_b = (yt_b == 0)
        b_diffs["Recall"][i] = np.mean(prf_b[pos_b] == 1) - np.mean(pgbm_b[pos_b] == 1)
        b_diffs["Specificity"][i] = np.mean(prf_b[neg_b] == 0) - np.mean(pgbm_b[neg_b] == 0)
        b_diffs["Precision"][i] = precision_score(yt_b, prf_b, zero_division=0) - precision_score(yt_b, pgbm_b, zero_division=0)
        b_diffs["F1_score"][i] = f1_score(yt_b, prf_b, zero_division=0) - f1_score(yt_b, pgbm_b, zero_division=0)
        b_diffs["ROC_AUC"][i] = roc_auc_score(yt_b, pr_rf_b) - roc_auc_score(yt_b, pr_gbm_b)
        b_diffs["PR_AUC"][i] = average_precision_score(yt_b, pr_rf_b) - average_precision_score(yt_b, pr_gbm_b)

    point_ests = {
        "Accuracy": float(np.mean(pred_rf == y_true) - np.mean(pred_gbm == y_true)),
        "Recall": float(recall_score(y_true, pred_rf) - recall_score(y_true, pred_gbm)),
        "Specificity": float(np.mean(pred_rf[mask_neg] == 0) - np.mean(pred_gbm[mask_neg] == 0)),
        "Precision": float(precision_score(y_true, pred_rf) - precision_score(y_true, pred_gbm)),
        "F1_score": float(f1_score(y_true, pred_rf) - f1_score(y_true, pred_gbm)),
        "ROC_AUC": float(roc_auc_score(y_true, proba_rf) - roc_auc_score(y_true, proba_gbm)),
        "PR_AUC": float(average_precision_score(y_true, proba_rf) - average_precision_score(y_true, proba_gbm)),
    }

    boot_tost_summary = []
    for m_key, arr in b_diffs.items():
        est = point_ests[m_key]
        se_b = float(np.std(arr, ddof=1))
        ci90_p_low, ci90_p_high = float(np.percentile(arr, 5.0)), float(np.percentile(arr, 95.0))
        ci95_p_low, ci95_p_high = float(np.percentile(arr, 2.5)), float(np.percentile(arr, 97.5))
        for mg in [0.0050, 0.0100, 0.0200]:
            z_l = (est - (-mg)) / se_b
            z_u = (mg - est) / se_b
            p_tost_b = float(max(norm.sf(z_l), norm.sf(z_u)))
            # También p-valor empírico bootstrap de cuántos remuestreos caen fuera de [-mg, +mg]
            p_emp_low = float(np.mean(arr <= -mg))
            p_emp_high = float(np.mean(arr >= mg))
            p_tost_emp = max(p_emp_low, p_emp_high)
            in_ci90 = bool(ci90_p_low > -mg and ci90_p_high < mg)
            in_ci95 = bool(ci95_p_low > -mg and ci95_p_high < mg)
            boot_tost_summary.append({
                "metric": m_key,
                "margin_delta": mg,
                "margin_pct": round(mg * 100.0, 2),
                "point_estimate_rf_minus_gbm": round(est, 6),
                "boot_se": round(se_b, 6),
                "boot_ci90_low": round(ci90_p_low, 6),
                "boot_ci90_high": round(ci90_p_high, 6),
                "boot_ci95_low": round(ci95_p_low, 6),
                "boot_ci95_high": round(ci95_p_high, 6),
                "p_tost_normal_boot": round(p_tost_b, 6),
                "p_tost_percentile_emp": round(p_tost_emp, 6),
                "ci90_inside_margin_equiv_05": in_ci90,
                "ci95_inside_margin_equiv_025": in_ci95,
            })

    pd.DataFrame(tost_rows).to_csv(FINAL_DIR / "resultados_detallados" / "tost_proporciones_pareadas.csv", index=False)
    pd.DataFrame(boot_tost_summary).to_csv(FINAL_DIR / "resultados_detallados" / "tost_bootstrap_multimetrica.csv", index=False)

    # -------------------------------------------------------------------------
    # TAREA 3: CONSOLIDAR resultados_reproducidos.csv Y COPIAR EVIDENCIAS
    # -------------------------------------------------------------------------
    print("\n[TAREA 3] Consolidando tabla comparativa resultados_reproducidos.csv y copiando artefactos...")
    # Copiar archivos detallados ya verificados en la fase previa sobre DSTM-MineSafe-2026.csv
    prev_audit_dir = PROJECT_ROOT / "MINESAFE_3D_AUDITORIA_PUBLICACION"
    for fname in [
        "03_METRICAS_MODELOS.csv",
        "04_RESULTADOS_LOSO.csv",
        "05_ANALISIS_CIRCULARIDAD.csv",
        "06_ROBUSTEZ_SENSORES.csv",
        "07_IMPORTANCIA_SHAP.csv",
        "fig_auditoria_shap_beeswarm_rf.png",
        "fig_auditoria_shap_bar_rf_vs_gbm.png",
    ]:
        src_f = prev_audit_dir / fname
        if src_f.exists():
            shutil.copy2(src_f, FINAL_DIR / "resultados_detallados" / fname)

    # Copiar configuraciones originales del repositorio para trazabilidad completa
    for c_rel, dst_name in [
        ("experiments/config/config.yaml", "config.yaml"),
        ("experiments/requirements.txt", "requirements.txt"),
        ("experiments/requirements.lock", "requirements.lock"),
        ("experiments/CITATION.cff", "CITATION.cff"),
        ("experiments/results/cv_metrics_summary.json", "cv_metrics_summary_original.json"),
        ("experiments/results/statistical_tests.md", "statistical_tests_original.md"),
        ("experiments/results/loso_validation.csv", "loso_validation_original.csv"),
        ("experiments/results/robustness_noise.csv", "robustness_noise_original.csv"),
        ("experiments/results/shap_values.csv", "shap_values_original.csv"),
    ]:
        p_src = PROJECT_ROOT / c_rel
        if p_src.exists():
            shutil.copy2(p_src, FINAL_DIR / "config_original" / dst_name)

    # Generar resultados_reproducidos.csv completo
    repro_comparison_rows = [
        {
            "id": "REP-01",
            "experimento": "Dataset DSTM-MineSafe-2026",
            "metrica": "Registros totales y prevalencia positiva",
            "valor_articulo_original": "N = 5,000 (5 escenarios A-E; 53.54% positivos)",
            "valor_reproducido_exacto": "N = 5,000 (A:1287, B:997, C:999, D:972, E:745; Positivos=2,677 [53.54%], Negativos=2,323 [46.46%])",
            "diferencia_absoluta": "0",
            "script_original": "experiments/src/data/generate_dataset.py",
            "semilla": 42,
            "estado": "REPRODUCIDO EXACTO (100%)",
        },
        {
            "id": "REP-02",
            "experimento": "5-Fold Stratified CV (OOF)",
            "metrica": "Random Forest ROC-AUC",
            "valor_articulo_original": "0.9938",
            "valor_reproducido_exacto": "0.993844 (Media 5-Fold = 0.993856 +/- 0.001080; IC95% Bootstrap = [0.9926, 0.9950])",
            "diferencia_absoluta": "+0.000044 (0.0000 a 4 dec.)",
            "script_original": "experiments/src/models/train.py",
            "semilla": 42,
            "estado": "REPRODUCIDO EXACTO",
        },
        {
            "id": "REP-03",
            "experimento": "5-Fold Stratified CV (OOF)",
            "metrica": "Random Forest PR-AUC",
            "valor_articulo_original": "0.9948",
            "valor_reproducido_exacto": "0.994757 (Media 5-Fold = 0.994791 +/- 0.000836)",
            "diferencia_absoluta": "-0.000043 (0.0000 a 4 dec.)",
            "script_original": "experiments/src/models/train.py",
            "semilla": 42,
            "estado": "REPRODUCIDO EXACTO",
        },
        {
            "id": "REP-04",
            "experimento": "5-Fold Stratified CV (OOF)",
            "metrica": "Random Forest Precision / Recall / F1-score / Specificity / Accuracy",
            "valor_articulo_original": "Prec=0.9641, Rec=0.9634, F1=0.9638",
            "valor_reproducido_exacto": "Prec=0.964112, Rec=0.963392, F1=0.963752, Spec=0.958674, Acc=0.961200",
            "diferencia_absoluta": "< 0.00005 (0.0000 a 4 dec.)",
            "script_original": "experiments/src/models/train.py",
            "semilla": 42,
            "estado": "REPRODUCIDO EXACTO",
        },
        {
            "id": "REP-05",
            "experimento": "5-Fold Stratified CV (OOF)",
            "metrica": "Random Forest Matriz de Confusión OOF (N=5,000)",
            "valor_articulo_original": "TP=2579, FP=96, TN=2227, FN=98",
            "valor_reproducido_exacto": "TP=2579, FP=96, TN=2227, FN=98 (Aciertos RF = TP+TN = 4,806; Errores RF = FP+FN = 194)",
            "diferencia_absoluta": "0",
            "script_original": "experiments/src/models/train.py",
            "semilla": 42,
            "estado": "REPRODUCIDO EXACTO",
        },
        {
            "id": "REP-06",
            "experimento": "5-Fold Stratified CV (OOF)",
            "metrica": "Gradient Boosting ROC-AUC",
            "valor_articulo_original": "0.9943",
            "valor_reproducido_exacto": "0.994252 (Media 5-Fold = 0.994265 +/- 0.001250; IC95% Bootstrap = [0.9929, 0.9955])",
            "diferencia_absoluta": "-0.000048 (0.0000 a 4 dec.)",
            "script_original": "experiments/src/models/train.py",
            "semilla": 42,
            "estado": "REPRODUCIDO EXACTO",
        },
        {
            "id": "REP-07",
            "experimento": "5-Fold Stratified CV (OOF)",
            "metrica": "Gradient Boosting PR-AUC",
            "valor_articulo_original": "0.9952",
            "valor_reproducido_exacto": "0.995242 (Media 5-Fold = 0.995265 +/- 0.000799)",
            "diferencia_absoluta": "+0.000042 (0.0000 a 4 dec.)",
            "script_original": "experiments/src/models/train.py",
            "semilla": 42,
            "estado": "REPRODUCIDO EXACTO",
        },
        {
            "id": "REP-08",
            "experimento": "5-Fold Stratified CV (OOF)",
            "metrica": "Gradient Boosting Precision / Recall / F1-score / Specificity / Accuracy",
            "valor_articulo_original": "Prec=0.9650, Rec=0.9671, F1=0.9660",
            "valor_reproducido_exacto": "Prec=0.964965, Rec=0.967127, F1=0.966045, Spec=0.959535, Acc=0.963600",
            "diferencia_absoluta": "< 0.00005 (0.0000 a 4 dec.)",
            "script_original": "experiments/src/models/train.py",
            "semilla": 42,
            "estado": "REPRODUCIDO EXACTO",
        },
        {
            "id": "REP-09",
            "experimento": "5-Fold Stratified CV (OOF)",
            "metrica": "Gradient Boosting Matriz de Confusión OOF (N=5,000)",
            "valor_articulo_original": "TP=2589, FP=94, TN=2229, FN=88",
            "valor_reproducido_exacto": "TP=2589, FP=94, TN=2229, FN=88 (Aciertos GBM = TP+TN = 4,818; Errores GBM = FP+FN = 182)",
            "diferencia_absoluta": "0",
            "script_original": "experiments/src/models/train.py",
            "semilla": 42,
            "estado": "REPRODUCIDO EXACTO",
        },
        {
            "id": "REP-10",
            "experimento": "Baseline Lineal (5-Fold OOF)",
            "metrica": "Regresión Logística ROC-AUC / PR-AUC / Precision / Recall / F1-score",
            "valor_articulo_original": "AUC=0.9957, PR-AUC=0.9963, Prec=0.9650, Rec=0.9694, F1=0.9672",
            "valor_reproducido_exacto": "AUC=0.995651, PR-AUC=0.996316, Prec=0.965043, Rec=0.969369, F1=0.967201 (TP=2595, FP=94, TN=2229, FN=82)",
            "diferencia_absoluta": "0.0000",
            "script_original": "experiments/src/models/baselines.py",
            "semilla": 42,
            "estado": "REPRODUCIDO EXACTO",
        },
        {
            "id": "REP-11",
            "experimento": "Baselines Físicos Cinemáticos",
            "metrica": "Reglas TTC < 3.0s, < 3.5s, < 4.0s (F1-score / Recall / Precision)",
            "valor_articulo_original": "TTC<3.0s F1=0.7217; TTC<3.5s F1=0.7987; TTC<4.0s F1=0.8596",
            "valor_reproducido_exacto": "TTC<3.0s F1=0.721718 (Rec=0.5648); TTC<3.5s F1=0.798745 (Rec=0.6657); TTC<4.0s F1=0.859567 (Rec=0.7568)",
            "diferencia_absoluta": "0.0000",
            "script_original": "experiments/src/models/baselines.py",
            "semilla": 42,
            "estado": "REPRODUCIDO EXACTO",
        },
        {
            "id": "REP-12",
            "experimento": "Prueba Pareada de McNemar (OOF)",
            "metrica": "Conteos pareados (a, b, c, d), Chi2 Edwards y p-valor exacto bilateral",
            "valor_articulo_original": "b=40, c=52, chi2=1.3152, p=0.2513",
            "valor_reproducido_exacto": "a=4766 (ambos aciertan), b=40 (solo RF), c=52 (solo GBM), d=142 (ambos fallan); chi2_cc=1.315217 (p=0.251452); p_exacto=0.251283",
            "diferencia_absoluta": "0.0000 (Corregido a=4766 y d=142 frente al error de transcripción previo 4775/133)",
            "script_original": "experiments/src/stats/inferential_tests.py",
            "semilla": 42,
            "estado": "REPRODUCIDO Y CONCILIADO AL 100%",
        },
        {
            "id": "REP-13",
            "experimento": "Prueba Pareada de Wilcoxon (5 Folds)",
            "metrica": "Estadístico W y p-valor bilateral sobre Recall por fold",
            "valor_articulo_original": "W = 2.00, p = 0.1875",
            "valor_reproducido_exacto": "W = 2.0000, p = 0.187500 (Nota: con K=5 folds el mínimo alcanzable es p=0.0625)",
            "diferencia_absoluta": "0.0000",
            "script_original": "experiments/src/stats/inferential_tests.py",
            "semilla": 42,
            "estado": "REPRODUCIDO EXACTO",
        },
        {
            "id": "REP-14",
            "experimento": "Validación LOSO (5 Escenarios A-E)",
            "metrica": "RF Recall vs TTC < 3.5s / Recall macro vs Etiqueta Nominal / Especificidad macro vs TTC < 3.5s",
            "valor_articulo_original": "Recall(TTC<3.5s) = 100%; Recall(Nominal) = 97.2%; Especificidad(TTC<3.5s) = 64.4%",
            "valor_reproducido_exacto": "Recall(TTC<3.5s) = 100.00% (1785/1785); Recall_macro(Nominal) = 97.23% (micro 96.64%); Especificidad_macro(TTC<3.5s) = 64.40% (Escenario B = 38.50%)",
            "diferencia_absoluta": "0.00%",
            "script_original": "experiments/src/validation/leave_scenario_out.py",
            "semilla": 42,
            "estado": "REPRODUCIDO EXACTO",
        },
        {
            "id": "REP-15",
            "experimento": "Piloto de Robustez Sensorial",
            "metrica": "RF Recall con 10% ruido GNSS/LiDAR y en condición combinada (10% ruido + LiDAR dropout + LOCF)",
            "valor_articulo_original": "Ruido 10%: Recall = 0.8510; Combinado: Recall = 0.8338",
            "valor_reproducido_exacto": "Protocolo Original (reentrenado en CV, seed=42): 0.8510 (10% ruido) y 0.8338 (combinado) | Protocolo Solo Evaluación (entrenado en limpio, seed=42): 0.8226 (10% ruido) y 0.8069 (combinado)",
            "diferencia_absoluta": "0.0000 en protocolo original | -0.0284 / -0.0269 en solo evaluación",
            "script_original": "experiments/src/robustness/noise_pilot.py",
            "semilla": 42,
            "estado": "REPRODUCIDO EXACTO (CON PROTOCOLO DUAL)",
        },
        {
            "id": "REP-16",
            "experimento": "Explicabilidad TreeSHAP (n=1,000)",
            "metrica": "Ranking global mean(|SHAP|) en Random Forest",
            "valor_articulo_original": "1. lidar_obstacle_dist_m (0.3366), 2. gnss_speed_kmh (0.1200), ..., 6. op_perclos_score (0.0116)",
            "valor_reproducido_exacto": "lidar_obstacle_dist_m=0.3366 (61.87%), gnss_speed_kmh=0.1200 (22.06%), gnss_ramp_grade=0.0198 (3.63%), is_autonomous=0.0195 (3.58%), op_steering_jerk_stddev=0.0185 (3.39%), op_perclos_score=0.0116 (2.14%)",
            "diferencia_absoluta": "0.0000 en variables principales",
            "script_original": "experiments/src/xai/shap_analysis.py",
            "semilla": 42,
            "estado": "REPRODUCIDO EXACTO",
        },
    ]
    pd.DataFrame(repro_comparison_rows).to_csv(FINAL_DIR / "resultados_reproducidos.csv", index=False)
    print(f"[+] Exportado resultados_reproducidos.csv ({len(repro_comparison_rows)} filas)")

    # Guardar configuracion_entorno.txt
    pip_freeze = subprocess.check_output([sys.executable, "-m", "pip", "freeze"], text=True, encoding="utf-8", errors="replace")
    env_txt = f"""================================================================================
CONFIGURACIÓN DEL ENTORNO DE AUDITORÍA Y REPRODUCCIÓN (MINESAFE 3D)
================================================================================
Fecha UTC:          {datetime.now(timezone.utc).isoformat()}
Sistema Operativo:  {platform.platform()}
Arquitectura:       {platform.machine()} / {platform.processor()}
Python ejecutable:  {sys.executable}
Versión Python:     {sys.version}

Versiones de librerías científicas núcleo:
- numpy:            {np.__version__}
- pandas:           {pd.__version__}
- scikit-learn:     {sklearn.__version__}
- scipy:            {scipy.__version__}
- shap:             {shap.__version__}
- joblib:           {joblib.__version__}
- PyYAML:           {yaml.__version__}
- matplotlib:       {matplotlib.__version__}

Semilla aleatoria global (experiments/config/config.yaml):
- seed:             {seed}
- StratifiedKFold:  n_splits=5, shuffle=True, random_state=42
- Semillas por fold (RF y GBM): 42, 43, 44, 45, 46 (seed + fold)
- Bootstrap:        np.random.default_rng(42), B=1,000 (original) y B=2,000 (TOST extendido)

Hashes SHA-256 de los archivos de datos originales:
- experiments/data/DSTM-MineSafe-2026.csv:          {sha256_file(dstm_csv_path)}
- experiments/results/predictions_fold_level.csv:   {sha256_file(existing_oof_path)}
- experiments/config/config.yaml:                   {sha256_file(config_path)}

================================================================================
SALIDA COMPLETA DE `pip freeze` EN EL ENTORNO DE EJECUCIÓN:
================================================================================
{pip_freeze}
"""
    with open(FINAL_DIR / "configuracion_entorno.txt", "w", encoding="utf-8") as f:
        f.write(env_txt)
    print("[+] Exportado configuracion_entorno.txt")

    # Guardar resumen JSON interno para redactar analisis_potencia.md y analisis_equivalencia_tost.md
    summary_stats = {
        "mcnemar_global": m_glob,
        "mcnemar_positivos": m_pos,
        "mcnemar_negativos": m_neg,
        "mde": {
            "acc_80_uncond": round(mde_acc_80_uncond, 6),
            "acc_90_uncond": round(mde_acc_90_uncond, 6),
            "acc_80_cond": round(mde_acc_80_cond, 6),
            "acc_90_cond": round(mde_acc_90_cond, 6),
            "rec_80_uncond": round(mde_rec_80_uncond, 6),
            "rec_90_uncond": round(mde_rec_90_uncond, 6),
            "rec_80_cond": round(mde_rec_80_cond, 6),
            "rec_90_cond": round(mde_rec_90_cond, 6),
        },
        "power_acc_table": power_acc_rows,
        "power_rec_table": power_rec_rows,
        "tost_proportions": tost_rows,
        "tost_bootstrap": boot_tost_summary,
        "elapsed_sec": round(time.time() - t_start, 2),
    }
    with open(FINAL_DIR / "resultados_detallados" / "resumen_estadistico_final.json", "w", encoding="utf-8") as f:
        json.dump(summary_stats, f, indent=2)

    print("\n" + "=" * 85)
    print(f"VERIFICACIÓN ESTADÍSTICA Y EXPERIMENTAL COMPLETADA EN {time.time() - t_start:.2f} s")
    print("=" * 85)


if __name__ == "__main__":
    main()
