# FASE IX — Verificación de Explicabilidad TreeSHAP (`10_TREESHAP`)

## 1. Configuración Verificada del Cálculo TreeSHAP

- **Script original:** `experiments/src/xai/shap_analysis.py`
- **Muestra evaluada:** Submuestra aleatoria reproducible de $n = 1,000$ registros de `DSTM-MineSafe-2026.csv` (`df.sample(n=1000, random_state=42)`), preprocesada con el `SimpleImputer` + `RobustScaler` del pipeline entrenado.
- **Diferencia de escala entre Random Forest y Gradient Boosting:**
  - En `RandomForestClassifier` de scikit-learn, `shap.TreeExplainer` calcula las atribuciones aditivas directamente en **escala de probabilidad** ($\sum_j \phi_j = \hat{p}(x) - \mathbb{E}[\hat{p}(X)] \in [-1, +1]$).
  - En `GradientBoostingClassifier`, `shap.TreeExplainer` calcula las atribuciones en **escala de log-odds (logit)** ($\sum_j \phi_j = \text{logit}(\hat{p}(x)) - \mathbb{E}[\text{logit}(\hat{p}(X))]$). Por ello, para comparar ambos modelos debe utilizarse también el **porcentaje de contribución relativa (`share_pct`)** además de `mean(|SHAP|)`.

## 2. Tabla de Importancias Globales Verificadas ($n = 1,000, \text{seed} = 42$)

| feature | rf_mean_abs_shap_prob_scale | rf_sd_abs_shap_prob_scale | rf_share_pct | gbm_mean_abs_shap_logodds_scale | gbm_sd_abs_shap_logodds_scale | gbm_share_pct | rf_rank | gbm_rank |
|---|---|---|---|---|---|---|---|---|
| lidar_obstacle_dist_m | 0.336574 | 0.15224 | 61.87 | 3.848574 | 2.002984 | 62.02 | 1 | 1 |
| gnss_speed_kmh | 0.120022 | 0.1159 | 22.06 | 1.594481 | 1.4378 | 25.7 | 2 | 2 |
| gnss_ramp_grade | 0.019756 | 0.017135 | 3.63 | 0.092098 | 0.084476 | 1.48 | 3 | 6 |
| is_autonomous | 0.019497 | 0.019446 | 3.58 | 0.277529 | 0.275374 | 4.47 | 4 | 3 |
| op_steering_jerk_stddev | 0.018461 | 0.018518 | 3.39 | 0.071848 | 0.079167 | 1.16 | 5 | 7 |
| op_perclos_score | 0.011628 | 0.00978 | 2.14 | 0.146938 | 0.119153 | 2.37 | 6 | 4 |
| lidar_visibility_index | 0.010785 | 0.009151 | 1.98 | 0.108298 | 0.131076 | 1.75 | 7 | 5 |
| turno_horas_acumuladas | 0.004289 | 0.004232 | 0.79 | 0.040855 | 0.045938 | 0.66 | 8 | 8 |
| op_harsh_braking_count | 0.002971 | 0.002776 | 0.55 | 0.024691 | 0.026438 | 0.4 | 9 | 9 |

## 3. Hallazgos Clave y Coherencia con el Estudio de Ablación

1. En ambos modelos, las dos variables cinemáticas primarias concentran el **83.93 %** (RF) y el **87.72 %** (GBM) de la atribución total $|\phi|$ sobre las 9 variables del modelo:
   - `lidar_obstacle_dist_m`: **`0.336574`** en RF (**`61.87 %`** del peso total) y **`3.848574`** en GBM (**`62.02 %`**).
   - `gnss_speed_kmh`: **`0.120022`** en RF (**`22.06 %`** del peso total) y **`1.594481`** en GBM (**`25.70 %`**).
2. Las variables de contexto geométrico/ambiental, régimen autónomo y fatiga humana actúan como moduladores de borde en la zona de transición:
   - `gnss_ramp_grade`: **`0.019756`** (`3.63 %` en RF, Rango 3).
   - `is_autonomous`: **`0.019497`** (`3.58 %` en RF, Rango 4; `4.47 %` en GBM, Rango 3).
   - `op_steering_jerk_stddev`: **`0.018461`** (`3.39 %` en RF, Rango 5).
   - `op_perclos_score`: **`0.011628`** (`2.14 %` en RF, Rango 6; `2.37 %` en GBM, Rango 4).
   - `lidar_visibility_index`: **`0.010785`** (`1.98 %` en RF, Rango 7).
3. Esta distribución de pesos TreeSHAP (~`84 %`–`88 %` cinemático vs. ~`12 %`–`16 %` no cinemático) es **100 % consistente con el estudio de ablación (Fase VI)**, confirmando que el modelo refleja fielmente la estructura funcional de `effective_ttc_sec` en el generador sintético.
