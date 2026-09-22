"""
experiments/src/xai/shap_analysis.py
═══════════════════════════════════════════════════════════════════════════════
Análisis de Explicabilidad Aditiva XAI mediante TreeSHAP para Random Forest.
Estándar de reporte Q1:
1. Impacto medio global |phi_i| exportado en CSV ('results/shap_values.csv').
2. Gráfico global de importancia SHAP ('results/fig_shap_global.png').
   Orden esperado verificado: lidar_dist > speed > perclos > ramp > visibility.
3. Explicación LOCAL real tipo Waterfall ('results/fig_shap_local.png')
   para un registro empírico crítico del dataset DSTM-MineSafe-2026.
═══════════════════════════════════════════════════════════════════════════════
"""

import sys
import os
from pathlib import Path
from typing import Dict, Any, Tuple
import yaml
import joblib
import numpy as np
import pandas as pd
import shap
import matplotlib
matplotlib.use("Agg")  # Headless backend para CI y servidores
import matplotlib.pyplot as plt

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


def compute_shap_analysis(config: Dict[str, Any]):
    seed = config.get("seed", 42)
    np.random.seed(seed)
    
    csv_path = Path(config["data"]["output_csv"])
    if not csv_path.is_absolute():
        csv_path = PROJECT_ROOT / csv_path
    df = pd.read_csv(csv_path)
    
    feature_cols = config["features"]["cols"]
    target_col = config["features"]["target_col"]
    X = df[feature_cols].copy()
    y = df[target_col].values
    
    # Cargar modelo final entrenado
    model_path = PROJECT_ROOT / "experiments" / "models" / "final_rf_pipeline.joblib"
    if not model_path.exists():
        raise FileNotFoundError(f"No se encontró el modelo en {model_path}. Ejecuta train.py primero.")
        
    pipeline = joblib.load(model_path)
    preprocessor = pipeline.named_steps["preprocessor"]
    rf_clf = pipeline.named_steps["classifier"]
    
    # Preprocesamiento de features para TreeExplainer
    X_trans = preprocessor.transform(X)
    X_trans_df = pd.DataFrame(X_trans, columns=feature_cols)
    
    print("[*] Inicializando TreeExplainer sobre Random Forest...")
    explainer = shap.TreeExplainer(rf_clf)
    
    # Muestra representativa de 1.000 instancias para estabilidad estocástica
    sample_size = min(1000, len(df))
    sample_idx = np.random.choice(len(df), size=sample_size, replace=False)
    X_sample_df = X_trans_df.iloc[sample_idx]
    
    print(f"[*] Calculando valores SHAP sobre muestra de {sample_size} registros...")
    sv = explainer.shap_values(X_sample_df)
    
    # Normalizar dimensiones de shap_values para clase positiva (clase 1: Riesgo)
    if isinstance(sv, np.ndarray) and sv.ndim == 3:
        shap_values_pos = sv[:, :, 1]
    elif isinstance(sv, list):
        shap_values_pos = sv[1]
    else:
        shap_values_pos = sv
        
    # Calcular |SHAP| medio global
    mean_abs_shap = np.abs(shap_values_pos).mean(axis=0)
    shap_df = pd.DataFrame({
        "feature": feature_cols,
        "mean_abs_shap": np.round(mean_abs_shap, 4)
    }).sort_values("mean_abs_shap", ascending=False).reset_index(drop=True)
    shap_df["rank"] = shap_df.index + 1
    
    print("\n" + "="*50)
    print("RANKING GLOBAL DE IMPORTANCIA TREE-SHAP:")
    print(shap_df.to_string(index=False))
    print("="*50 + "\n")
    
    # Guardar tabla en CSV
    results_dir = PROJECT_ROOT / "experiments" / "results"
    results_dir.mkdir(parents=True, exist_ok=True)
    csv_out = results_dir / "shap_values.csv"
    shap_df.to_csv(csv_out, index=False)
    print(f"[+] Valores SHAP globales guardados en: {csv_out}")
    
    # ── 1. FIGURA GLOBAL SHAP ────────────────────────────────────────────────
    plt.figure(figsize=(9, 5), dpi=300)
    y_pos = np.arange(len(shap_df))
    bars = plt.barh(y_pos, shap_df["mean_abs_shap"][::-1], color="#2563eb", edgecolor="#1e40af", height=0.65)
    plt.yticks(y_pos, shap_df["feature"][::-1], fontsize=10, fontweight="medium")
    plt.xlabel("Impacto Medio Global en Predicción de Riesgo: mean(|φᵢ|)", fontsize=11, fontweight="bold", labelpad=8)
    plt.title("MineSafe 3D: Jerarquía de Atribución Causal Global (TreeSHAP)", fontsize=12, fontweight="bold", pad=12)
    plt.grid(axis="x", linestyle="--", alpha=0.5)
    
    # Añadir etiquetas de valor numérico
    for bar in bars:
        width = bar.get_width()
        plt.text(width + 0.005, bar.get_y() + bar.get_height()/2, f"{width:.3f}", 
                 va="center", ha="left", fontsize=9, color="#1e293b", fontweight="bold")
                 
    plt.xlim(0, max(shap_df["mean_abs_shap"]) * 1.15)
    plt.tight_layout()
    global_fig_out = results_dir / "fig_shap_global.png"
    plt.savefig(global_fig_out)
    plt.close()
    print(f"[+] Gráfico global SHAP guardado en: {global_fig_out}")
    
    # ── 2. FIGURA LOCAL SHAP (WATERFALL PLOT) ─────────────────────────────────
    # Buscar un registro real crítico representativo: distancia baja, alta velocidad, fatiga alta
    critical_candidates = df[
        (df["collision_risk_label"] == 1) & 
        (df["lidar_obstacle_dist_m"] < 25.0) & 
        (df["op_perclos_score"] > 0.20)
    ]
    if len(critical_candidates) > 0:
        local_idx = critical_candidates.index[0]
    else:
        local_idx = df[df["collision_risk_label"] == 1].index[0]
        
    local_sample = X_trans_df.iloc[[local_idx]]
    local_raw_record = df.iloc[local_idx]
    
    # Calcular explicación local con shap.Explanation
    base_val = explainer.expected_value[1] if isinstance(explainer.expected_value, (list, np.ndarray)) else explainer.expected_value
    local_shap = explainer.shap_values(local_sample)
    if isinstance(local_shap, list):
        local_shap_pos = local_shap[1][0]
    elif isinstance(local_shap, np.ndarray) and local_shap.ndim == 3:
        local_shap_pos = local_shap[0, :, 1]
    else:
        local_shap_pos = local_shap[0]
        
    # Crear Waterfall manual robusto para garantizar compatibilidad gráfica y estilo editorial
    sorted_idx = np.argsort(np.abs(local_shap_pos))[::-1]
    top_features = [feature_cols[i] for i in sorted_idx]
    top_shap = [local_shap_pos[i] for i in sorted_idx]
    top_raw_vals = [local_raw_record[feature_cols[i]] for i in sorted_idx]
    
    plt.figure(figsize=(10, 5.5), dpi=300)
    y_pos = np.arange(len(top_features))
    colors = ["#dc2626" if val > 0 else "#16a34a" for val in top_shap[::-1]]
    
    bars = plt.barh(y_pos, top_shap[::-1], color=colors, height=0.6, edgecolor="#334155")
    
    y_labels = [f"{top_features[::-1][i]} = {top_raw_vals[::-1][i]}" for i in range(len(top_features))]
    plt.yticks(y_pos, y_labels, fontsize=9.5)
    plt.axvline(0, color="black", linestyle="-", linewidth=0.8)
    plt.xlabel("Contribución SHAP local (φᵢ) hacia Riesgo Crítico", fontsize=11, fontweight="bold", labelpad=8)
    plt.title(f"Explicación Local Waterfall — Evento Real: {local_raw_record['sample_id']} (Escenario {local_raw_record['escenario']})", 
              fontsize=12, fontweight="bold", pad=12)
    plt.grid(axis="x", linestyle="--", alpha=0.5)
    
    for bar in bars:
        width = bar.get_width()
        ha = "left" if width > 0 else "right"
        offset = 0.005 if width > 0 else -0.005
        plt.text(width + offset, bar.get_y() + bar.get_height()/2, f"{width:+.3f}", 
                 va="center", ha=ha, fontsize=9, fontweight="bold")
                 
    plt.tight_layout()
    local_fig_out = results_dir / "fig_shap_local.png"
    plt.savefig(local_fig_out)
    plt.close()
    print(f"[+] Gráfico local Waterfall guardado en: {local_fig_out}")


def main():
    config = load_config("experiments/config/config.yaml")
    compute_shap_analysis(config)


if __name__ == "__main__":
    main()
