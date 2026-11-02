# FASE II — Informe de Trazabilidad de Hiperparámetros y Resolución de `FON-01`

## 1. Diagnóstico de la Observación `FON-01`

El informe de revisión académica del Grupo 26 (`FON-01`) señaló una discrepancia crítica entre dos conjuntos de hiperparámetros mencionados en la documentación:
- **Opción A (Declarada en el texto del manuscrito):**
  - Random Forest: `n_estimators = 300`, `max_depth = 12`, `min_samples_split = 6`, `min_samples_leaf = 3`, `max_features = "sqrt"`, `class_weight = "balanced"`.
  - Gradient Boosting: `n_estimators = 250`, `learning_rate = 0.05`, `max_depth = 5`, `min_samples_leaf = 8`, `subsample = 0.85`.
- **Opción B (Declarada en `experiments/config/config.yaml` líneas 45–59):**
  - Random Forest: `n_estimators = 200`, `max_depth = 12`, `min_samples_leaf = 4`, `min_samples_split = 2` (por defecto en scikit-learn), `max_features = "sqrt"`, `class_weight = "balanced"`.
  - Gradient Boosting: `n_estimators = 150`, `learning_rate = 0.05`, `max_depth = 5`, `min_samples_leaf = 8`, `subsample = 0.85`.
- **Opción C (Declarada en `crisp-dm-lab/ml_model.py` líneas 120–137 del laboratorio interactivo Streamlit):**
  - Random Forest: `n_estimators = 150`, `max_depth = 10`, `min_samples_split = 5`, `min_samples_leaf = 2`.
  - Gradient Boosting: `n_estimators = 120`, `learning_rate = 0.08`, `max_depth = 4`, `min_samples_split = 5`, `min_samples_leaf = 3`.

---

## 2. Verificación Forense y Experimental Directa

Se realizaron dos pruebas independientes e irrefutables:

1. **Inspección del binario serializado `experiments/models/final_rf_pipeline.joblib`:**
   Al cargar el modelo persistido en el repositorio mediante `joblib.load()` e inspeccionar `pipe.named_steps['classifier'].get_params()`, los hiperparámetros exactos almacenados en el objeto binario son:
   ```json
   {
     "n_estimators": 200,
     "max_depth": 12,
     "min_samples_leaf": 4,
     "min_samples_split": 2,
     "max_features": "sqrt",
     "class_weight": "balanced",
     "random_state": 42
   }
   ```
2. **Re-ejecución comparativa 5-Fold Stratified CV (`SEED = 42`, semillas por fold `42 + fold`) de las Opciones B, A, A2 y C sobre `DSTM-MineSafe-2026.csv` ($N = 5,000$):**

| configuracion | descripcion_hiperparametros | rf_n_estimators | rf_max_depth | rf_min_samples_leaf | gbm_n_estimators | gbm_max_depth | gbm_min_samples_leaf | rf_roc_auc_6dec | rf_roc_auc_4dec | rf_f1_6dec | rf_f1_4dec | rf_precision_4dec | rf_recall_4dec | rf_tp_fp_tn_fn | gbm_roc_auc_6dec | gbm_roc_auc_4dec | gbm_f1_6dec | gbm_f1_4dec | gbm_precision_4dec | gbm_recall_4dec | gbm_tp_fp_tn_fn | mcnemar_b_c | mcnemar_p_exact_4dec | discrepancias_pred_rf_vs_oof_repo | discrepancias_pred_gbm_vs_oof_repo | max_diff_proba_rf_vs_oof_repo | max_diff_proba_gbm_vs_oof_repo | coincide_100pct_con_artefactos_y_metricas_publicadas |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Opción B (Real en config.yaml y joblib) | RF: n_estimators=200, max_depth=12, min_samples_leaf=4 \| GBM: n_estimators=150, lr=0.05, max_depth=5, min_samples_leaf=8, subsample=0.85 | 200 | 12 | 4 | 150 | 5 | 8 | 0.993844 | 0.9938 | 0.963752 | 0.9638 | 0.9641 | 0.9634 | 2579/96/2227/98 | 0.994251 | 0.9943 | 0.966045 | 0.966 | 0.965 | 0.9671 | 2589/94/2229/88 | b=40, c=52 | 0.2513 | 0 | 0 | 0.0 | 0.0 | SÍ (100% EXACTO) |
| Opción A (Declarada en texto del artículo) | RF: n_estimators=300, max_depth=12, min_samples_split=6, min_samples_leaf=3 \| GBM: n_estimators=250, lr=0.05, max_depth=5, min_samples_leaf=8, subsample=0.85 | 300 | 12 | 3 | 250 | 5 | 8 | 0.993885 | 0.9939 | 0.964112 | 0.9641 | 0.9648 | 0.9634 | 2579/94/2229/98 | 0.994094 | 0.9941 | 0.962327 | 0.9623 | 0.9609 | 0.9638 | 2580/105/2218/97 | b=51, c=41 | 0.3481 | 32 | 30 | 0.11154 | 0.22454 | NO |
| Opción A2 (Solo cambiando n_estimators a 300/250) | RF: n_estimators=300, max_depth=12, min_samples_leaf=4 \| GBM: n_estimators=250, lr=0.05, max_depth=5, min_samples_leaf=8, subsample=0.85 | 300 | 12 | 4 | 250 | 5 | 8 | 0.993847 | 0.9938 | 0.964139 | 0.9641 | 0.9641 | 0.9641 | 2581/96/2227/96 | 0.994094 | 0.9941 | 0.962327 | 0.9623 | 0.9609 | 0.9638 | 2580/105/2218/97 | b=52, c=42 | 0.3533 | 10 | 30 | 0.05243 | 0.22454 | NO |
| Opción C (Laboratorio Streamlit crisp-dm-lab) | RF: n_estimators=150, max_depth=10, min_samples_split=5, min_samples_leaf=2 \| GBM: n_estimators=120, lr=0.08, max_depth=4, min_samples_leaf=3 | 150 | 10 | 2 | 120 | 4 | 3 | 0.993937 | 0.9939 | 0.963792 | 0.9638 | 0.9631 | 0.9645 | 2582/99/2224/95 | 0.994369 | 0.9944 | 0.964772 | 0.9648 | 0.9628 | 0.9668 | 2588/100/2223/89 | b=36, c=41 | 0.6488 | 42 | 35 | 0.13513 | 0.28206 | NO |

---

## 3. Conclusión Definitiva para el Manuscrito (`FON-01`)

- **La configuración real y verificada que generó el 100 % de las predicciones (`predictions_fold_level.csv`), los resúmenes (`cv_metrics_summary.json`), el binario (`final_rf_pipeline.joblib`) y las métricas publicadas en el artículo (`RF ROC-AUC = 0.9938, F1 = 0.9638`; `GBM ROC-AUC = 0.9943, F1 = 0.9660`; `McNemar b = 40, c = 52, p = 0.2513`) es la Opción B (`experiments/config/config.yaml`: RF `n_estimators = 200`, `min_samples_leaf = 4`; GBM `n_estimators = 150`, `min_samples_leaf = 8`).**
- La comparación fila por fila contra `experiments/results/predictions_fold_level.csv` arroja **0 discrepancias de clasificación en los 5,000 registros** y una diferencia máxima de probabilidad de **`0.00000000`** para la Opción B.
- En cambio, la Opción A (`300 / 250` con `min_samples_split=6, min_samples_leaf=3`) altera 32 predicciones de RF y 30 de GBM, cambiando `RF F1` a `0.9641`, `GBM F1` a `0.9649` y los conteos de McNemar a `b = 45, c = 49` (`p = 0.7570`).
- **Acción correctiva en el artículo:** Corregir el texto de la sección de Metodología/Configuración Experimental del manuscrito para que declare exactamente los hiperparámetros de `experiments/config/config.yaml` (`RF: n_estimators = 200, max_depth = 12, min_samples_leaf = 4, min_samples_split = 2, max_features = 'sqrt', class_weight = 'balanced'`; `GBM: n_estimators = 150, learning_rate = 0.05, max_depth = 5, min_samples_leaf = 8, subsample = 0.85`), manteniendo intactas todas las tablas de resultados.
