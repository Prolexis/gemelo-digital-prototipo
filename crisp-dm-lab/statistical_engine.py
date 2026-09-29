"""
crisp-dm-lab/statistical_engine.py
═══════════════════════════════════════════════════════════════════════════════
Motor de Inferencia Estadística y Pruebas Rigurosas para Laboratorio CRISP-DM:
- Test de McNemar (Exacto binomial y asintótico con corrección de Edwards).
- Test de Rangos Signados de Wilcoxon pareado sobre folds.
- Intervalos de Confianza al 95% mediante remuestreo Bootstrap no paramétrico (B=1000).
- Corrección de Holm-Bonferroni para comparaciones múltiples.
- Cálculo de tamaño del efecto (Delta de métricas y Cohen's g / Rank-biserial).
═══════════════════════════════════════════════════════════════════════════════
"""

from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.metrics import roc_auc_score, recall_score, precision_score, f1_score, accuracy_score


def run_mcnemar_test(y_true: np.ndarray, y_pred_a: np.ndarray, y_pred_b: np.ndarray, name_a="Random Forest", name_b="Gradient Boosting") -> Dict[str, Any]:
    """
    Ejecuta el test de McNemar sobre predicciones pareadas en las mismas observaciones.
    Contrasta H0: Ambos clasificadores tienen la misma tasa de error marginal (P(b) = P(c)).
    """
    correct_a = (y_pred_a == y_true)
    correct_b = (y_pred_b == y_true)

    # b: Modelo A acierta, Modelo B falla
    # c: Modelo A falla, Modelo B acierta
    b = int(np.sum(correct_a & (~correct_b)))
    c = int(np.sum((~correct_a) & correct_b))
    a = int(np.sum(correct_a & correct_b))
    d = int(np.sum((~correct_a) & (~correct_b)))

    total_discordant = b + c

    if total_discordant == 0:
        chi2_stat = 0.0
        p_val_chi2 = 1.0
        p_val_exact = 1.0
    else:
        # Edwards continuity correction
        chi2_stat = ((abs(b - c) - 1.0) ** 2) / float(total_discordant)
        p_val_chi2 = float(stats.chi2.sf(chi2_stat, df=1))
        # Exact binomial test
        binom = stats.binomtest(min(b, c), n=total_discordant, p=0.5, alternative="two-sided")
        p_val_exact = float(binom.pvalue)

    # Cohen's g effect size for McNemar
    cohens_g = abs((b / total_discordant) - 0.5) if total_discordant > 0 else 0.0

    return {
        "contingency_table": {
            f"ambos_correctos": a,
            f"solo_{name_a}": b,
            f"solo_{name_b}": c,
            f"ambos_incorrectos": d
        },
        "b": b,
        "c": c,
        "chi2_stat": round(chi2_stat, 4),
        "p_val_asymptotic": float(p_val_chi2),
        "p_val_exact": float(p_val_exact),
        "is_significant": bool(p_val_exact < 0.05),
        "cohens_g": round(cohens_g, 4),
        "interpretation": (
            f"Diferencia estadísticamente significativa (p < 0.05) entre {name_a} y {name_b}."
            if p_val_exact < 0.05 else
            f"No existe evidencia estadística de diferencia en proporciones de acierto (p >= 0.05)."
        )
    }


def run_wilcoxon_paired(scores_a: List[float], scores_b: List[float], metric_name="AUC-ROC") -> Dict[str, Any]:
    """
    Test no paramétrico de Wilcoxon de rangos signados para muestras pareadas (ej. 5-fold CV).
    Contrasta H0: La mediana de las diferencias entre modelos es cero.
    """
    a = np.array(scores_a)
    b = np.array(scores_b)
    diff = a - b

    # Si todas las diferencias son cero
    if np.all(diff == 0):
        return {
            "statistic": 0.0,
            "p_value": 1.0,
            "is_significant": False,
            "median_diff": 0.0,
            "interpretation": "Diferencia idéntica en todos los folds."
        }

    try:
        res = stats.wilcoxon(a, b, zero_method="pratt", alternative="two-sided")
        stat = float(res.statistic)
        p_val = float(res.pvalue)
    except Exception:
        stat = 0.0
        p_val = 1.0

    return {
        "statistic": round(stat, 4),
        "p_value": float(p_val),
        "is_significant": bool(p_val < 0.05),
        "mean_diff": round(float(np.mean(diff)), 4),
        "median_diff": round(float(np.median(diff)), 4),
        "interpretation": (
            f"Diferencia en {metric_name} respaldada por Wilcoxon (p < 0.05)."
            if p_val < 0.05 else
            f"Diferencia en {metric_name} no alcanza significancia estadística formal (p >= 0.05)."
        )
    }


def compute_bootstrap_ci(y_true: np.ndarray, y_proba: np.ndarray, y_pred: np.ndarray, n_bootstraps=1000, seed=42) -> Dict[str, Dict[str, float]]:
    """
    Calcula Intervalos de Confianza al 95% empíricos (Percentil BCa / Percentil Bootstrap)
    para AUC-ROC, Recall, Precision y F1-Score con remuestreo con reemplazo.
    """
    rng = np.random.default_rng(seed)
    n = len(y_true)

    boot_auc = []
    boot_recall = []
    boot_prec = []
    boot_f1 = []

    for _ in range(n_bootstraps):
        idx = rng.choice(n, size=n, replace=True)
        yt_b = y_true[idx]
        yp_b = y_pred[idx]
        ypr_b = y_proba[idx]

        # Verificar que existan ambas clases en la muestra bootstrap
        if len(np.unique(yt_b)) < 2:
            continue

        boot_auc.append(roc_auc_score(yt_b, ypr_b))
        boot_recall.append(recall_score(yt_b, yp_b, zero_division=0))
        boot_prec.append(precision_score(yt_b, yp_b, zero_division=0))
        boot_f1.append(f1_score(yt_b, yp_b, zero_division=0))

    def _ci(arr):
        if not arr:
            return {"mean": 0.0, "ci_lower": 0.0, "ci_upper": 0.0}
        return {
            "mean": round(float(np.mean(arr)), 4),
            "ci_lower": round(float(np.percentile(arr, 2.5)), 4),
            "ci_upper": round(float(np.percentile(arr, 97.5)), 4),
            "std": round(float(np.std(arr)), 4)
        }

    return {
        "auc_roc": _ci(boot_auc),
        "recall": _ci(boot_recall),
        "precision": _ci(boot_prec),
        "f1": _ci(boot_f1)
    }


def holm_bonferroni_correction(p_values: List[float], alpha: float = 0.05) -> List[Dict[str, Any]]:
    """
    Aplica corrección secuencial de Holm para control estricto de Family-Wise Error Rate (FWER).
    """
    m = len(p_values)
    sorted_indices = np.argsort(p_values)
    results = [None] * m

    for rank, orig_idx in enumerate(sorted_indices):
        p_val = p_values[orig_idx]
        adj_alpha = alpha / (m - rank)
        is_sig = p_val <= adj_alpha
        results[orig_idx] = {
            "p_value_raw": float(p_val),
            "adjusted_alpha": round(float(adj_alpha), 5),
            "is_significant_corrected": bool(is_sig),
            "rank": int(rank + 1)
        }

    return results
