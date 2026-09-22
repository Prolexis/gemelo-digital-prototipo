"""
experiments/src/models/train.py
═══════════════════════════════════════════════════════════════════════════════
Entrenamiento y validación cruzada estratificada (5-Fold Stratified CV)
de Random Forest y Gradient Boosting sobre DSTM-MineSafe-2026.

CRÍTICO:
Genera y guarda 'experiments/results/predictions_fold_level.csv' con:
(index, fold, escenario, y_true, proba_rf, proba_gbm, y_pred_rf, y_pred_gbm).
Este archivo habilita todos los tests de estadística inferencial de la Fase 2.
═══════════════════════════════════════════════════════════════════════════════
"""

import sys
import os
import json
from pathlib import Path
from typing import Dict, Any, List, Tuple
import yaml
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import (
    roc_auc_score, accuracy_score, precision_score, recall_score, f1_score,
    average_precision_score, confusion_matrix
)
from sklearn.preprocessing import RobustScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def load_config(config_path: str = "experiments/config/config.yaml") -> Dict[str, Any]:
    path = Path(config_path)
    if not path.exists():
        path = PROJECT_ROOT / config_path
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def build_pipeline(model_type: str, model_params: Dict[str, Any], seed: int) -> Pipeline:
    """Construye un Pipeline de Scikit-learn robusto (Imputador + RobustScaler + Clasificador)."""
    preprocessor = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", RobustScaler()),
    ])
    
    params = model_params.copy()
    params["random_state"] = seed
    
    if model_type == "rf":
        clf = RandomForestClassifier(**params)
    elif model_type == "gbm":
        clf = GradientBoostingClassifier(**params)
    else:
        raise ValueError(f"Tipo de modelo no soportado: {model_type}")
        
    return Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", clf)
    ])


def evaluate_predictions(y_true: np.ndarray, y_pred: np.ndarray, y_proba: np.ndarray) -> Dict[str, float]:
    """Calcula métricas estándar de evaluación binaria."""
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
    return {
        "auc_roc": float(roc_auc_score(y_true, y_proba)),
        "auc_pr": float(average_precision_score(y_true, y_proba)),
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "tp": int(tp), "fp": int(fp), "fn": int(fn), "tn": int(tn)
    }


def train_and_cross_validate(config: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Ejecuta Stratified 5-Fold Cross-Validation, registrando predicciones a nivel de muestra
    para cada fold de validación out-of-fold.
    """
    seed = config.get("seed", 42)
    np.random.seed(seed)
    
    # Cargar datos
    csv_path = Path(config["data"]["output_csv"])
    if not csv_path.is_absolute():
        csv_path = PROJECT_ROOT / csv_path
    if not csv_path.exists():
        raise FileNotFoundError(f"No se encontró el dataset en {csv_path}. Ejecuta generate_dataset.py primero.")
        
    df = pd.read_csv(csv_path)
    feature_cols = config["features"]["cols"]
    target_col = config["features"]["target_col"]
    
    X = df[feature_cols].copy()
    y = df[target_col].values
    
    n_splits = config["training"]["n_splits"]
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=seed)
    
    rf_params = config["training"]["random_forest"]
    gbm_params = config["training"]["gradient_boosting"]
    
    # Contenedores para almacenar predicciones de todos los folds
    fold_predictions = []
    fold_metrics_rf = []
    fold_metrics_gbm = []
    
    print(f"[*] Iniciando {n_splits}-Fold Stratified Cross Validation...")
    print(f"    Features: {feature_cols}")
    print(f"    Muestras: {len(df)} | Positivos: {y.sum()} ({y.mean():.2%})\n")
    
    for fold, (train_idx, val_idx) in enumerate(skf.split(X, y)):
        X_train, y_train = X.iloc[train_idx], y[train_idx]
        X_val, y_val = X.iloc[val_idx], y[val_idx]
        
        # Entrenar Random Forest
        rf_pipe = build_pipeline("rf", rf_params, seed + fold)
        rf_pipe.fit(X_train, y_train)
        proba_rf = rf_pipe.predict_proba(X_val)[:, 1]
        pred_rf = (proba_rf >= 0.5).astype(int)
        
        # Entrenar Gradient Boosting
        gbm_pipe = build_pipeline("gbm", gbm_params, seed + fold)
        gbm_pipe.fit(X_train, y_train)
        proba_gbm = gbm_pipe.predict_proba(X_val)[:, 1]
        pred_gbm = (proba_gbm >= 0.5).astype(int)
        
        # Guardar predicciones de este fold
        for i, original_idx in enumerate(val_idx):
            fold_predictions.append({
                "index": int(original_idx),
                "fold": fold,
                "escenario": df.iloc[original_idx]["escenario"],
                "y_true": int(y_val[i]),
                "proba_rf": float(np.round(proba_rf[i], 5)),
                "proba_gbm": float(np.round(proba_gbm[i], 5)),
                "y_pred_rf": int(pred_rf[i]),
                "y_pred_gbm": int(pred_gbm[i]),
            })
            
        m_rf = evaluate_predictions(y_val, pred_rf, proba_rf)
        m_gbm = evaluate_predictions(y_val, pred_gbm, proba_gbm)
        
        fold_metrics_rf.append(m_rf)
        fold_metrics_gbm.append(m_gbm)
        
        print(f"  Fold {fold+1}/{n_splits} | "
              f"RF  AUC: {m_rf['auc_roc']:.4f} Rec: {m_rf['recall']:.4f} Prec: {m_rf['precision']:.4f} F1: {m_rf['f1']:.4f} | "
              f"GBM AUC: {m_gbm['auc_roc']:.4f} Rec: {m_gbm['recall']:.4f} Prec: {m_gbm['precision']:.4f} F1: {m_gbm['f1']:.4f}")
              
    pred_df = pd.DataFrame(fold_predictions).sort_values("index").reset_index(drop=True)
    
    # Métricas agregadas globales sobre las predicciones out-of-fold
    global_rf = evaluate_predictions(pred_df["y_true"].values, pred_df["y_pred_rf"].values, pred_df["proba_rf"].values)
    global_gbm = evaluate_predictions(pred_df["y_true"].values, pred_df["y_pred_gbm"].values, pred_df["proba_gbm"].values)
    
    # Rangos min-max de AUC por fold
    auc_rf_folds = [m["auc_roc"] for m in fold_metrics_rf]
    auc_gbm_folds = [m["auc_roc"] for m in fold_metrics_gbm]
    
    print("\n" + "="*70)
    print("RESUMEN AGREGADO OUT-OF-FOLD (5-FOLD CV):")
    print(f"  RF:  AUC={global_rf['auc_roc']:.3f} | Prec={global_rf['precision']:.3f} | Recall={global_rf['recall']:.3f} | F1={global_rf['f1']:.3f} | CV AUC [{min(auc_rf_folds):.3f} - {max(auc_rf_folds):.3f}]")
    print(f"  GBM: AUC={global_gbm['auc_roc']:.3f} | Prec={global_gbm['precision']:.3f} | Recall={global_gbm['recall']:.3f} | F1={global_gbm['f1']:.3f} | CV AUC [{min(auc_gbm_folds):.3f} - {max(auc_gbm_folds):.3f}]")
    print("="*70 + "\n")
    
    # Entrenar y persistir modelo final en todo el dataset para SHAP y despliegue
    print("[*] Entrenando modelo final RF en dataset completo...")
    final_rf = build_pipeline("rf", rf_params, seed)
    final_rf.fit(X, y)
    
    models_dir = PROJECT_ROOT / "experiments" / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(final_rf, models_dir / "final_rf_pipeline.joblib")
    
    summary = {
        "global_rf": global_rf,
        "global_gbm": global_gbm,
        "fold_metrics_rf": fold_metrics_rf,
        "fold_metrics_gbm": fold_metrics_gbm,
        "cv_auc_rf_range": [min(auc_rf_folds), max(auc_rf_folds)],
        "cv_auc_gbm_range": [min(auc_gbm_folds), max(auc_gbm_folds)],
    }
    
    return pred_df, summary


def main():
    config = load_config("experiments/config/config.yaml")
    pred_df, summary = train_and_cross_validate(config)
    
    out_csv = Path(config["paths"]["predictions_csv"])
    if not out_csv.is_absolute():
        out_csv = PROJECT_ROOT / out_csv
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    
    pred_df.to_csv(out_csv, index=False)
    print(f"[+] Predicciones guardadas exitosamente en: {out_csv} ({len(pred_df)} filas)")
    
    summary_path = out_csv.parent / "cv_metrics_summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"[+] Resumen métricas guardado en: {summary_path}")


if __name__ == "__main__":
    main()
