# FASE III (Parte 1) — Validación Forense del Dataset Primario `DSTM-MineSafe-2026.csv`

- **Archivo verificado:** `experiments/data/DSTM-MineSafe-2026.csv` (copiado en `03_DATASET_Y_GENERADOR/dataset_validado.csv`)
- **Hash SHA-256:** `d0ed1d7ca0a9a0c7b2225ba44fee3d16fd92ad8dbfc37a46c85d93ed5b9095c2`
- **Número exacto de filas:** `5,000`
- **Número exacto de columnas:** `15` (`sample_id, escenario, vehicle_type, is_autonomous, gnss_speed_kmh, gnss_ramp_grade, lidar_obstacle_dist_m, lidar_visibility_index, op_perclos_score, turno_horas_acumuladas, op_steering_jerk_stddev, op_harsh_braking_count, ttc_raw_sec, effective_ttc_sec, collision_risk_label`)
- **Valores faltantes (NaN / Null):** `0`
- **Filas duplicadas:** `0`
- **Distribución global de la etiqueta `collision_risk_label`:**
  - Positivos (`y = 1`): **`2,677`** (`53.54%`)
  - Negativos (`y = 0`): **`2,323`** (`46.46%`)

## Distribución por Escenario Operacional (A–E)

| Escenario | Total Registros | Positivos (y=1) | Negativos (y=0) | Prevalencia Positiva |
|---|---|---|---|---|
| A | 1287 | 734 | 553 | 57.03% |
| B | 997 | 416 | 581 | 41.73% |
| C | 999 | 572 | 427 | 57.26% |
| D | 972 | 577 | 395 | 59.36% |
| E | 745 | 378 | 367 | 50.74% |
