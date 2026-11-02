# FASE VI — Auditoría de Circularidad de Constructo y Estudio de Ablación (`FON-02`)

## 1. Inspección Matemática Exacta del Generador (`experiments/src/data/generate_dataset.py`)

La inspección de las líneas 176–237 de `experiments/src/data/generate_dataset.py` demuestra cómo se construye la etiqueta `collision_risk_label` en `DSTM-MineSafe-2026.csv`:

1. **Cálculo del TTC cinemático puro (líneas 178–181):**
   $$v_{\text{m/s}} = \max\left(0.5,\; \frac{\text{gnss\_speed\_kmh} \times 1000}{3600}\right), \qquad \text{ttc\_raw\_sec} = \frac{\text{lidar\_obstacle\_dist\_m}}{v_{\text{m/s}}}$$
2. **Cálculo del retardo humano y ambiental (líneas 186–192):**
   $$\tau_{\text{hum}} = \begin{cases} 1.2 + 2.5\,\text{op\_perclos\_score} + 0.06\,\max(0,\; \text{gnss\_ramp\_grade} - 7.0), & \text{si vehículo manual} \\ 0.35, & \text{si vehículo AHS autónomo} \end{cases}$$
   $$\tau_{\text{perc}} = 0.5\,(1 - \text{lidar\_visibility\_index}), \qquad \text{effective\_ttc\_sec} = \text{ttc\_raw\_sec} - (\tau_{\text{hum}} + \tau_{\text{perc}})$$
3. **Regla determinista de etiquetado antes del ruido sensorial (líneas 196–200):**
   $$y = \mathbb{I}\Big(\text{effective\_ttc\_sec} < 4.0 \;\lor\; (\text{dist} < 15.0 \land \text{speed} > 15.0) \;\lor\; (\text{dist} < 8.0)\Big)$$
4. **Inyección de ruido observacional de sensores a las variables predictoras (líneas 226–236):**
   Posteriormente al etiquetado, se suma ruido Gaussiano a las columnas observadas por los modelos (`noise_speed ~ N(0, 1.8 km/h)`, `noise_dist ~ N(0, 3.2 m)`, `noise_perclos ~ N(0, 0.025)`, `noise_grade ~ N(0, 0.45%)`, `noise_vis ~ N(0, 0.03)`).

### Cuantificación Exacta del Acoplamiento en `DSTM-MineSafe-2026.csv` ($N = 5,000$):
- La desigualdad `effective_ttc_sec < 4.0` por sí sola coincide con `collision_risk_label` en **`4959 / 5,000` registros (`99.18%`)** (los `41` registros restantes corresponden a las cláusulas de proximidad crítica `dist < 15 m & speed > 15 km/h` o `dist < 8 m`).
- Si se evalúa la misma fórmula usando las variables observadas *después* del ruido sensorial, la regla reconstruida coincide con la etiqueta en **`4835 / 5,000` registros (`96.70%`)**.
- En cambio, la regla física simple `ttc_raw_sec < 4.0` coincide solo en **`4348 / 5,000` registros (`86.96%`)** (`4338 / 5,000` con variables ruidosas).

---

## 2. Estudio Completo de Ablación de Variables (Configuraciones A–H, 5-Fold Stratified CV)

| configuracion_ablacion | n_variables | variables_incluidas | modelo | roc_auc | delta_roc_auc | pr_auc | precision | recall | delta_recall | f1 | delta_f1 | specificity | accuracy |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Ablación A (Modelo Completo - 8 variables) | 9 | lidar_obstacle_dist_m, gnss_speed_kmh, op_perclos_score, gnss_ramp_grade, lidar_visibility_index, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count, is_autonomous | Random Forest | 0.9938 | -0.0 | 0.9948 | 0.9641 | 0.9634 | 0.0 | 0.9638 | 0.0 | 0.9587 | 0.9612 |
| Ablación A (Modelo Completo - 8 variables) | 9 | lidar_obstacle_dist_m, gnss_speed_kmh, op_perclos_score, gnss_ramp_grade, lidar_visibility_index, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count, is_autonomous | Gradient Boosting | 0.9943 | 0.0 | 0.9952 | 0.965 | 0.9671 | 0.0 | 0.966 | 0.0 | 0.9595 | 0.9636 |
| Ablación A (Modelo Completo - 8 variables) | 9 | lidar_obstacle_dist_m, gnss_speed_kmh, op_perclos_score, gnss_ramp_grade, lidar_visibility_index, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count, is_autonomous | Regresión Logística | 0.9957 | -0.0 | 0.9963 | 0.965 | 0.9694 | 0.0 | 0.9672 | 0.0 | 0.9595 | 0.9648 |
| Ablación B (Sin Distancia LiDAR - 7 variables) | 8 | gnss_speed_kmh, op_perclos_score, gnss_ramp_grade, lidar_visibility_index, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count, is_autonomous | Random Forest | 0.6412 | -0.3526 | 0.6397 | 0.6261 | 0.7075 | -0.2559 | 0.6643 | -0.2994 | 0.5131 | 0.6172 |
| Ablación B (Sin Distancia LiDAR - 7 variables) | 8 | gnss_speed_kmh, op_perclos_score, gnss_ramp_grade, lidar_visibility_index, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count, is_autonomous | Gradient Boosting | 0.6352 | -0.3591 | 0.6331 | 0.6138 | 0.7385 | -0.2286 | 0.6704 | -0.2956 | 0.4645 | 0.6112 |
| Ablación B (Sin Distancia LiDAR - 7 variables) | 8 | gnss_speed_kmh, op_perclos_score, gnss_ramp_grade, lidar_visibility_index, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count, is_autonomous | Regresión Logística | 0.6542 | -0.3415 | 0.6522 | 0.6298 | 0.6959 | -0.2734 | 0.6612 | -0.306 | 0.5286 | 0.6182 |
| Ablación C (Sin Velocidad GNSS - 7 variables) | 8 | lidar_obstacle_dist_m, op_perclos_score, gnss_ramp_grade, lidar_visibility_index, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count, is_autonomous | Random Forest | 0.9585 | -0.0353 | 0.962 | 0.8867 | 0.9062 | -0.0572 | 0.8964 | -0.0674 | 0.8666 | 0.8878 |
| Ablación C (Sin Velocidad GNSS - 7 variables) | 8 | lidar_obstacle_dist_m, op_perclos_score, gnss_ramp_grade, lidar_visibility_index, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count, is_autonomous | Gradient Boosting | 0.9595 | -0.0348 | 0.9636 | 0.8845 | 0.9096 | -0.0575 | 0.8969 | -0.0692 | 0.8631 | 0.888 |
| Ablación C (Sin Velocidad GNSS - 7 variables) | 8 | lidar_obstacle_dist_m, op_perclos_score, gnss_ramp_grade, lidar_visibility_index, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count, is_autonomous | Regresión Logística | 0.9437 | -0.052 | 0.9478 | 0.8605 | 0.9006 | -0.0687 | 0.8801 | -0.0871 | 0.8317 | 0.8686 |
| Ablación D (Sin Distancia LiDAR ni Velocidad GNSS - 6 variables no cinemáticas) | 7 | op_perclos_score, gnss_ramp_grade, lidar_visibility_index, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count, is_autonomous | Random Forest | 0.58 | -0.4138 | 0.6008 | 0.591 | 0.6089 | -0.3545 | 0.5998 | -0.3639 | 0.5144 | 0.565 |
| Ablación D (Sin Distancia LiDAR ni Velocidad GNSS - 6 variables no cinemáticas) | 7 | op_perclos_score, gnss_ramp_grade, lidar_visibility_index, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count, is_autonomous | Gradient Boosting | 0.5723 | -0.422 | 0.5907 | 0.5824 | 0.6638 | -0.3033 | 0.6205 | -0.3456 | 0.4516 | 0.5652 |
| Ablación D (Sin Distancia LiDAR ni Velocidad GNSS - 6 variables no cinemáticas) | 7 | op_perclos_score, gnss_ramp_grade, lidar_visibility_index, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count, is_autonomous | Regresión Logística | 0.6002 | -0.3955 | 0.6084 | 0.5955 | 0.7068 | -0.2626 | 0.6464 | -0.3208 | 0.4468 | 0.586 |
| Ablación E (Solo Distancia LiDAR + Velocidad GNSS - 2 variables cinemáticas) | 2 | lidar_obstacle_dist_m, gnss_speed_kmh | Random Forest | 0.9892 | -0.0046 | 0.9898 | 0.9451 | 0.9451 | -0.0183 | 0.9451 | -0.0187 | 0.9367 | 0.9412 |
| Ablación E (Solo Distancia LiDAR + Velocidad GNSS - 2 variables cinemáticas) | 2 | lidar_obstacle_dist_m, gnss_speed_kmh | Gradient Boosting | 0.9898 | -0.0045 | 0.9914 | 0.944 | 0.9503 | -0.0168 | 0.9471 | -0.0189 | 0.935 | 0.9432 |
| Ablación E (Solo Distancia LiDAR + Velocidad GNSS - 2 variables cinemáticas) | 2 | lidar_obstacle_dist_m, gnss_speed_kmh | Regresión Logística | 0.9901 | -0.0055 | 0.9915 | 0.9419 | 0.9511 | -0.0183 | 0.9465 | -0.0207 | 0.9324 | 0.9424 |
| Ablación F (Sin Variables Humanas/Conductuales - 4 variables) | 4 | gnss_speed_kmh, gnss_ramp_grade, lidar_obstacle_dist_m, lidar_visibility_index | Random Forest | 0.9897 | -0.0042 | 0.9911 | 0.9471 | 0.9488 | -0.0146 | 0.9479 | -0.0158 | 0.9389 | 0.9442 |
| Ablación F (Sin Variables Humanas/Conductuales - 4 variables) | 4 | gnss_speed_kmh, gnss_ramp_grade, lidar_obstacle_dist_m, lidar_visibility_index | Gradient Boosting | 0.9897 | -0.0045 | 0.9914 | 0.9475 | 0.9514 | -0.0157 | 0.9495 | -0.0166 | 0.9393 | 0.9458 |
| Ablación F (Sin Variables Humanas/Conductuales - 4 variables) | 4 | gnss_speed_kmh, gnss_ramp_grade, lidar_obstacle_dist_m, lidar_visibility_index | Regresión Logística | 0.9901 | -0.0055 | 0.9915 | 0.9412 | 0.9507 | -0.0187 | 0.9459 | -0.0213 | 0.9316 | 0.9418 |
| Ablación G (Sin Variables Ambientales/Geométricas Pendiente y Visibilidad - 6 variables) | 7 | lidar_obstacle_dist_m, gnss_speed_kmh, op_perclos_score, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count, is_autonomous | Random Forest | 0.9932 | -0.0007 | 0.9942 | 0.9612 | 0.9619 | -0.0015 | 0.9615 | -0.0022 | 0.9552 | 0.9588 |
| Ablación G (Sin Variables Ambientales/Geométricas Pendiente y Visibilidad - 6 variables) | 7 | lidar_obstacle_dist_m, gnss_speed_kmh, op_perclos_score, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count, is_autonomous | Gradient Boosting | 0.9941 | -0.0001 | 0.9951 | 0.9657 | 0.9664 | -0.0007 | 0.966 | -0.0 | 0.9604 | 0.9636 |
| Ablación G (Sin Variables Ambientales/Geométricas Pendiente y Visibilidad - 6 variables) | 7 | lidar_obstacle_dist_m, gnss_speed_kmh, op_perclos_score, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count, is_autonomous | Regresión Logística | 0.9953 | -0.0003 | 0.996 | 0.9596 | 0.9664 | -0.003 | 0.963 | -0.0042 | 0.9531 | 0.9602 |
| Ablación H (Solo Variables Humanas y Conductuales - 4 variables) | 4 | op_perclos_score, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count | Random Forest | 0.5541 | -0.4398 | 0.5714 | 0.5681 | 0.6029 | -0.3605 | 0.585 | -0.3788 | 0.4718 | 0.542 |
| Ablación H (Solo Variables Humanas y Conductuales - 4 variables) | 4 | op_perclos_score, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count | Gradient Boosting | 0.5484 | -0.4459 | 0.5685 | 0.5666 | 0.6892 | -0.2779 | 0.6219 | -0.3441 | 0.3926 | 0.5514 |
| Ablación H (Solo Variables Humanas y Conductuales - 4 variables) | 4 | op_perclos_score, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count | Regresión Logística | 0.5606 | -0.4351 | 0.5769 | 0.5707 | 0.7594 | -0.2099 | 0.6517 | -0.3155 | 0.3418 | 0.5654 |

---

## 3. Interpretación Científica y Reformulación Obligatoria en el Manuscrito (`FON-02`)

1. **Dependencia dominante del núcleo cinemático:** Cuando se eliminan simultáneamente `lidar_obstacle_dist_m` y `gnss_speed_kmh` (**Ablación D**), el `ROC-AUC` de Random Forest cae de **`0.9938` a `0.5800`** ($\Delta = -0.4138$, `F1 = 0.5998`) y el de Gradient Boosting cae de **`0.9943` a `0.5723`** ($\Delta = -0.4220$). Usando únicamente las variables humanas y conductuales (**Ablación H**), el `ROC-AUC` es **`0.5541`** (RF).
2. **Contribución marginal pero real de las variables humanas/ambientales:** Con solo distancia LiDAR y velocidad GNSS (**Ablación E**), RF alcanza `ROC-AUC = 0.9892` y `F1 = 0.9451`; al incorporar las variables humanas, ambientales y de tipo de flota (**Ablación A**), el `F1` sube a **`0.9638`** ($+1.87$ puntos porcentuales, reduciendo los falsos negativos y falsos positivos en la frontera de $3.5\text{ s} \le \text{TTC} \le 5.5\text{ s}$).
3. **Aclaración conceptual obligatoria en el artículo:** El alto desempeño (`AUC > 0.993`) refleja la capacidad de los ensambles de árboles y la regresión logística para **aproximar en presencia de ruido sensorial una función de riesgo física-heurística sintética subyacente**, y **no** una validación empírica sobre accidentes reales de campo.
