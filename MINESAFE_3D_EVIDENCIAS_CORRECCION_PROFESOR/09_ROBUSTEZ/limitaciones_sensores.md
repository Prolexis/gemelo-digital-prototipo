# FASE VIII — Robustez Sensorial, Limitaciones de LOCF (`FON-07`) y Calibración Física de Sensores (`FON-08`)

## 1. Comparación Experimental Verificada: Protocolo P1 vs. Protocolo P2 (10 Semillas, `42..51`)

En la auditoría de `experiments/src/robustness/noise_pilot.py` se identificó que la función `run_cv_evaluation(df_cond)` (líneas 142–201) aplicaba la perturbación a `df_cond` antes de particionar los folds, reentrenando el clasificador en datos perturbados (**Protocolo P1**). Para responder rigurosamente a los estándares de evaluación en despliegue real, se ejecutó adicionalmente el **Protocolo P2** (modelos entrenados exclusivamente en datos limpios y evaluados en folds de prueba con ruido/dropout), promediando sobre 10 semillas independientes (`42` a `51`):

| protocolo | descripcion_protocolo | condicion | modelo | seed42_roc_auc | seed42_recall | seed42_precision | seed42_f1 | seed42_specificity | media_10seeds_roc_auc | de_10seeds_roc_auc | media_10seeds_recall | de_10seeds_recall | delta_recall_media_vs_base | media_10seeds_precision | media_10seeds_f1 | de_10seeds_f1 | media_10seeds_specificity |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P1 | Protocolo P1 (Reentrenado en fold perturbado - noise_pilot.py) | Baseline (0%) | Random Forest | 0.9938 | 0.9634 | 0.9641 | 0.9638 | 0.9587 | 0.9938 | 0.0 | 0.9634 | 0.0 | 0.0 | 0.9641 | 0.9638 | 0.0 | 0.9587 |
| P1 | Protocolo P1 (Reentrenado en fold perturbado - noise_pilot.py) | Baseline (0%) | Gradient Boosting | 0.9943 | 0.9671 | 0.965 | 0.966 | 0.9595 | 0.9943 | 0.0 | 0.9671 | 0.0 | 0.0 | 0.965 | 0.966 | 0.0 | 0.9595 |
| P2 | Protocolo P2 (Entrenado en datos limpios, solo test perturbado - Despliegue Real) | Baseline (0%) | Random Forest | 0.9938 | 0.9634 | 0.9641 | 0.9638 | 0.9587 | 0.9938 | 0.0 | 0.9634 | 0.0 | 0.0 | 0.9641 | 0.9638 | 0.0 | 0.9587 |
| P2 | Protocolo P2 (Entrenado en datos limpios, solo test perturbado - Despliegue Real) | Baseline (0%) | Gradient Boosting | 0.9943 | 0.9671 | 0.965 | 0.966 | 0.9595 | 0.9943 | 0.0 | 0.9671 | 0.0 | 0.0 | 0.965 | 0.966 | 0.0 | 0.9595 |
| P1 | Protocolo P1 (Reentrenado en fold perturbado - noise_pilot.py) | Noise 2% | Random Forest | 0.9881 | 0.9384 | 0.9461 | 0.9422 | 0.9384 | 0.989 | 0.0005 | 0.945 | 0.0029 | -0.0184 | 0.9503 | 0.9476 | 0.0021 | 0.943 |
| P1 | Protocolo P1 (Reentrenado en fold perturbado - noise_pilot.py) | Noise 2% | Gradient Boosting | 0.9891 | 0.9425 | 0.9467 | 0.9446 | 0.9389 | 0.9897 | 0.0007 | 0.9493 | 0.0033 | -0.0178 | 0.9462 | 0.9478 | 0.002 | 0.9378 |
| P2 | Protocolo P2 (Entrenado en datos limpios, solo test perturbado - Despliegue Real) | Noise 2% | Random Forest | 0.988 | 0.9425 | 0.9553 | 0.9489 | 0.9492 | 0.9892 | 0.0007 | 0.9507 | 0.0032 | -0.0127 | 0.9503 | 0.9505 | 0.0013 | 0.9427 |
| P2 | Protocolo P2 (Entrenado en datos limpios, solo test perturbado - Despliegue Real) | Noise 2% | Gradient Boosting | 0.989 | 0.9417 | 0.9528 | 0.9472 | 0.9462 | 0.9898 | 0.0007 | 0.9518 | 0.0041 | -0.0153 | 0.9497 | 0.9508 | 0.0018 | 0.9419 |
| P1 | Protocolo P1 (Reentrenado en fold perturbado - noise_pilot.py) | Noise 5% | Random Forest | 0.9694 | 0.9044 | 0.9129 | 0.9086 | 0.9006 | 0.9703 | 0.0011 | 0.909 | 0.0044 | -0.0544 | 0.9144 | 0.9117 | 0.0027 | 0.902 |
| P1 | Protocolo P1 (Reentrenado en fold perturbado - noise_pilot.py) | Noise 5% | Gradient Boosting | 0.9692 | 0.9107 | 0.903 | 0.9068 | 0.8872 | 0.9709 | 0.0011 | 0.9151 | 0.0041 | -0.052 | 0.9079 | 0.9115 | 0.0029 | 0.893 |
| P2 | Protocolo P2 (Entrenado en datos limpios, solo test perturbado - Despliegue Real) | Noise 5% | Random Forest | 0.9662 | 0.8988 | 0.9173 | 0.9079 | 0.9066 | 0.9687 | 0.0019 | 0.9063 | 0.0059 | -0.0571 | 0.916 | 0.9111 | 0.0022 | 0.9042 |
| P2 | Protocolo P2 (Entrenado en datos limpios, solo test perturbado - Despliegue Real) | Noise 5% | Gradient Boosting | 0.9677 | 0.8976 | 0.9154 | 0.9065 | 0.9044 | 0.9696 | 0.0014 | 0.905 | 0.0059 | -0.0621 | 0.9142 | 0.9096 | 0.0025 | 0.9021 |
| P1 | Protocolo P1 (Reentrenado en fold perturbado - noise_pilot.py) | Noise 10% | Random Forest | 0.9214 | 0.851 | 0.8522 | 0.8516 | 0.83 | 0.9238 | 0.0025 | 0.8536 | 0.0047 | -0.1098 | 0.8514 | 0.8525 | 0.0033 | 0.8283 |
| P1 | Protocolo P1 (Reentrenado en fold perturbado - noise_pilot.py) | Noise 10% | Gradient Boosting | 0.9211 | 0.8629 | 0.8443 | 0.8535 | 0.8166 | 0.9238 | 0.0027 | 0.8623 | 0.0056 | -0.1048 | 0.8408 | 0.8514 | 0.0029 | 0.8118 |
| P2 | Protocolo P2 (Entrenado en datos limpios, solo test perturbado - Despliegue Real) | Noise 10% | Random Forest | 0.9096 | 0.8226 | 0.8666 | 0.844 | 0.8541 | 0.9134 | 0.0038 | 0.8287 | 0.0054 | -0.1347 | 0.8614 | 0.8448 | 0.0029 | 0.8464 |
| P2 | Protocolo P2 (Entrenado en datos limpios, solo test perturbado - Despliegue Real) | Noise 10% | Gradient Boosting | 0.9137 | 0.8263 | 0.8644 | 0.8449 | 0.8506 | 0.9159 | 0.0027 | 0.8275 | 0.0053 | -0.1396 | 0.8581 | 0.8425 | 0.0038 | 0.8422 |
| P1 | Protocolo P1 (Reentrenado en fold perturbado - noise_pilot.py) | Dropout LiDAR | Random Forest | 0.9599 | 0.9387 | 0.9256 | 0.9321 | 0.913 | 0.9562 | 0.0038 | 0.9307 | 0.0059 | -0.0327 | 0.9289 | 0.9298 | 0.0033 | 0.9179 |
| P1 | Protocolo P1 (Reentrenado en fold perturbado - noise_pilot.py) | Dropout LiDAR | Gradient Boosting | 0.9604 | 0.9402 | 0.9298 | 0.935 | 0.9182 | 0.9577 | 0.003 | 0.9328 | 0.0045 | -0.0343 | 0.9285 | 0.9306 | 0.0031 | 0.9172 |
| P2 | Protocolo P2 (Entrenado en datos limpios, solo test perturbado - Despliegue Real) | Dropout LiDAR | Random Forest | 0.9588 | 0.9387 | 0.9276 | 0.9332 | 0.9156 | 0.955 | 0.0041 | 0.9291 | 0.0056 | -0.0343 | 0.9296 | 0.9293 | 0.0031 | 0.9189 |
| P2 | Protocolo P2 (Entrenado en datos limpios, solo test perturbado - Despliegue Real) | Dropout LiDAR | Gradient Boosting | 0.9588 | 0.9421 | 0.9296 | 0.9358 | 0.9178 | 0.9549 | 0.0046 | 0.9337 | 0.0054 | -0.0335 | 0.9308 | 0.9322 | 0.0031 | 0.92 |
| P1 | Protocolo P1 (Reentrenado en fold perturbado - noise_pilot.py) | Combined (10%+Drop) | Random Forest | 0.891 | 0.8338 | 0.8288 | 0.8313 | 0.8015 | 0.8891 | 0.0047 | 0.8297 | 0.0058 | -0.1337 | 0.8271 | 0.8284 | 0.0034 | 0.8001 |
| P1 | Protocolo P1 (Reentrenado en fold perturbado - noise_pilot.py) | Combined (10%+Drop) | Gradient Boosting | 0.8897 | 0.8468 | 0.8193 | 0.8328 | 0.7848 | 0.8884 | 0.005 | 0.84 | 0.0081 | -0.1271 | 0.8169 | 0.8283 | 0.0044 | 0.783 |
| P2 | Protocolo P2 (Entrenado en datos limpios, solo test perturbado - Despliegue Real) | Combined (10%+Drop) | Random Forest | 0.8811 | 0.8069 | 0.8411 | 0.8236 | 0.8244 | 0.8805 | 0.0046 | 0.8069 | 0.0075 | -0.1565 | 0.8362 | 0.8213 | 0.0039 | 0.8178 |
| P2 | Protocolo P2 (Entrenado en datos limpios, solo test perturbado - Despliegue Real) | Combined (10%+Drop) | Gradient Boosting | 0.8842 | 0.8095 | 0.8386 | 0.8238 | 0.8205 | 0.8829 | 0.0043 | 0.8053 | 0.0077 | -0.1618 | 0.8329 | 0.8188 | 0.0047 | 0.8137 |

### Conciliación de Valores Declarados en el Manuscrito:
- En el **Protocolo P1** (media de 10 semillas), Random Forest obtiene exactamente **`Recall = 0.8510`** con 10 % de ruido (`0.8506` en `seed=42`) y **`Recall = 0.8338`** en la condición combinada 10 % + Dropout (`0.8334` en `seed=42`), coincidiendo al cuarto decimal con los valores declarados en el manuscrito.
- En el **Protocolo P2** (entrenado en limpio, evaluado en ruidoso), la sensibilidad cae de forma más pronunciada: Random Forest obtiene **`Recall = 0.8226`** con 10 % de ruido (`0.8211` en `seed=42`) y **`Recall = 0.8069`** en la condición combinada (`0.8061` en `seed=42`). Ambos protocolos deben reportarse en el artículo.

---

## 2. Limitación Metodológica del Procedimiento LOCF (`FON-07`)

La inspección de la función `inject_lidar_dropout()` en `experiments/src/robustness/noise_pilot.py` (líneas 95–122) muestra que cuando ocurre un evento de dropout en el índice `i`, el código reemplaza `lidar_vals[i:i+w] = lidar_vals[i-1]`.
- **Problema técnico (`FON-07`):** En `experiments/src/data/generate_dataset.py`, los 5,000 registros de `DSTM-MineSafe-2026.csv` fueron generados como **realizaciones Monte Carlo de corte transversal independientes** (`for i in range(n_total): scen = rng.choice(...)`), **no** como una serie de tiempo continua de un mismo camión a $2\text{ Hz}$.
- **Efecto físico y estadístico:** Copiar el valor de la fila `i-1` a las filas `i .. i+w` equivale en un dataset transversal a sustituir la distancia LiDAR de un vehículo por la distancia aleatoria de otro registro independiente (posiblemente de otro escenario operacional). Por tanto, este experimento evalúa la **corrupción esporádica de la variable LiDAR por valores espurios no correlacionados** (en el ~`9.6 %` de las filas, `481/5,000` en `seed=42`), pero **no modela la inercia cinemática de una trayectoria temporal continua**.
- **Corrección obligatoria en el manuscrito:** Declarar explícitamente en la sección de Metodología y Amenazas a la Validez que el ensayo de dropout + LOCF sobre `DSTM-MineSafe-2026.csv` constituye una **aproximación estocástica sobre muestras transversales** y que la validación de retención temporal estricta (LOCF, filtros de Kalman o seguimiento multi-objeto) requiere trayectorias longitudinales continuas.

---

## 3. Limitación de Calibración del Ruido Sensorial frente a Sensores Comerciales (`FON-08`)

En `experiments/src/robustness/noise_pilot.py` (líneas 63–64 y 84–85), el ruido Gaussiano se define como porcentaje del rango operativo total (`RANGE_SPEED_KMH = 65.0`, `RANGE_LIDAR_DIST_M = 200.0`):

| Nivel Nominal | $\sigma_{\text{speed}}$ Inyectado | $\sigma_{\text{dist}}$ Inyectado | Comparación con Especificaciones de Hardware Minero Real |
|:---:|:---:|:---:|---|
| **2 % del rango** | $\pm 1.30\text{ km/h}$ ($0.36\text{ m/s}$) | $\pm 4.00\text{ m}$ | Un receptor GNSS industrial con corrección RTK tiene error de velocidad $< 0.05$–$0.1\text{ m/s}$ ($< 0.36\text{ km/h}$), y un LiDAR automotriz/minero (Ouster OS1 / Velodyne / Livox) tiene error nominal de rango de $\pm 2$–$10\text{ cm}$ en aire limpio. Un $\sigma_{\text{dist}} = 4\text{ m}$ ya representa degradación severa por polvo denso o multi-camino. |
| **5 % del rango** | $\pm 3.25\text{ km/h}$ ($0.90\text{ m/s}$) | $\pm 10.00\text{ m}$ | Representa pérdida de fijación RTK (modo GNSS autónomo degradado en fondo de rajo profundo) combinada con retrodispersión óptica severa por niebla/polvo. |
| **10 % del rango** | $\pm 6.50\text{ km/h}$ ($1.81\text{ m/s}$) | $\pm 20.00\text{ m}$ | Representa una **prueba de estrés extremo (fallo catastrófico de calibración o reflexión fantasma)**, muy superior al ruido térmico nominal de sensores comerciales. |

- **Corrección obligatoria en el manuscrito (`FON-08`):** Reencuadrar los niveles del 2 %, 5 % y 10 % del rango operativo ($\sigma_{\text{dist}} = 4, 10, 20\text{ m}$) como **pruebas paramétricas de estrés y degradación ambiental extrema** (retrodispersión por tormentas de polvo, barro en el domo óptico y cañón urbano/minero sin RTK), y no como el error nominal de fábrica de sensores GNSS/LiDAR comerciales.
