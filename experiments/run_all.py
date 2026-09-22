"""
experiments/run_all.py
═══════════════════════════════════════════════════════════════════════════════
Script orquestador de un solo paso para reproducir TODO el pipeline experimental
MineSafe 3D de punta a punta:
1. Generación de Dataset sintético DSTM-MineSafe-2026 (n=5.000)
2. Entrenamiento formal con 5-Fold Stratified CV y persistencia de predicciones
3. Evaluación de Baselines físicos (TTC 3s y 5s) y estadísticos (Regresión Logística)
4. Explicabilidad aditiva global y local (TreeSHAP)
5. Validación Leave-One-Scenario-Out (LOSO) contra circularidad
6. Pruebas de estadística inferencial (McNemar, Wilcoxon, Bootstrap IC95%, PR curves)
═══════════════════════════════════════════════════════════════════════════════
"""

import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from experiments.src.data.generate_dataset import main as run_generate
from experiments.src.models.train import main as run_train
from experiments.src.models.baselines import main as run_baselines
from experiments.src.xai.shap_analysis import main as run_shap
from experiments.src.validation.leave_scenario_out import main as run_loso
from experiments.src.stats.inferential_tests import main as run_stats


def main():
    t_start = time.time()
    print("="*75)
    print("EJECUCIÓN DEL PIPELINE EXPERIMENTAL REPRODUCIBLE (ESTÁNDAR Q1)")
    print("Proyecto: MineSafe 3D — Gemelo Digital Explicable")
    print("="*75 + "\n")
    
    steps = [
        ("Fase 1.1: Generación de Dataset DSTM-MineSafe-2026", run_generate),
        ("Fase 1.2: Entrenamiento 5-Fold CV y Persistencia de Predicciones", run_train),
        ("Fase 1.3: Benchmarking de Baselines Físicos y Estadísticos", run_baselines),
        ("Fase 1.4: Análisis de Explicabilidad Aditiva TreeSHAP", run_shap),
        ("Fase 1.5: Validación Leave-One-Scenario-Out (LOSO)", run_loso),
        ("Fase 2.0: Pruebas de Estadística Inferencial y Curvas PR", run_stats),
    ]
    
    for i, (title, func) in enumerate(steps, 1):
        step_start = time.time()
        print(f"\n[{i}/{len(steps)}] INICIANDO: {title}")
        print("-" * 75)
        func()
        step_elapsed = time.time() - step_start
        print(f"--> Completado en {step_elapsed:.1f} segundos.\n")
        
    total_elapsed = time.time() - t_start
    print("="*75)
    print(f"PIPELINE COMPLETO EJECUTADO CON ÉXITO EN {total_elapsed:.1f} SEGUNDOS")
    print("Artefactos generados en 'experiments/results/' y 'experiments/data/'")
    print("="*75)


if __name__ == "__main__":
    main()
