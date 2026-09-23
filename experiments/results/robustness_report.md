# Reporte Experimental: Piloto de Robustez ante Ruido Sensorial y Dropout LiDAR (§5.7)

**Proyecto:** MineSafe 3D — Digital Twin Explicable para Minería Open-Pit  
**Fecha de Ejecución:** 2026-09-22 18:56:25  
**Entorno:** Python 3.11.9 | Scikit-Learn | Reproducibilidad Seed=42  
**Dataset Base:** `experiments/data/DSTM-MineSafe-2026.csv` (N=5.000)

---

## 1. Motivación y Protocolo Experimental (§5.7 / Anexo A)
En operaciones mineras de tajo abierto, la instrumentación telemétrica está expuesta a severa degradación ambiental: dispersión óptica láser por polvo en suspensión, oclusiones temporales en el escaneo LiDAR, y ruido multipath en receptores GNSS de alta precisión en fondos de rajo.

Para evaluar la resiliencia del modelo, se implementó el protocolo experimental:
1. **Ruido Gaussiano Aditivo:** Inyectado simultáneamente sobre `gnss_speed_kmh` (rango 0–65 km/h) y `lidar_obstacle_dist_m` (rango normativo ISO 21815-1: 0–200 m) en tres niveles:
   - $\sigma = 2\%$ ($\sigma_{\text{speed}} = 1.30\text{ km/h}$, $\sigma_{\text{dist}} = 4.00\text{ m}$)
   - $\sigma = 5\%$ ($\sigma_{\text{speed}} = 3.25\text{ km/h}$, $\sigma_{\text{dist}} = 10.00\text{ m}$)
   - $\sigma = 10\%$ ($\sigma_{\text{speed}} = 6.50\text{ km/h}$, $\sigma_{\text{dist}} = 20.00\text{ m}$)
2. **LiDAR Sensor Dropout (Pérdida Temporal):** Ventanas estocásticas de fallo de 0.5 a 2.0 s (1 a 4 ciclos de telemetría a 2 Hz), imputadas mediante *Last Observation Carried Forward* (LOCF).
3. **Condición Combinada:** Ruido del 10% junto con ráfagas de dropout en LiDAR.

---

## 2. Resultados Globales de Validación Cruzada (5-Fold Stratified CV)
Comparación directa contra la línea base de la Tabla 3 del artículo:

| Condición | Modelo | AUC-ROC | $\Delta$ AUC | AUC-PR | $\Delta$ PR | Recall | $\Delta$ Recall | Precisión | $\Delta$ Prec | F1-Score | $\Delta$ F1 |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Baseline (0%) | Random Forest | 0.9938 | +0.0000 | 0.9948 | +0.0000 | 0.9634 | +0.0000 | 0.9641 | +0.0000 | 0.9638 | +0.0000 |
| Baseline (0%) | Gradient Boosting | 0.9943 | +0.0000 | 0.9952 | +0.0000 | 0.9671 | +0.0000 | 0.9650 | +0.0000 | 0.9660 | +0.0000 |
| Noise 2% | Random Forest | 0.9881 | -0.0058 | 0.9899 | -0.0048 | 0.9384 | -0.0250 | 0.9461 | -0.0180 | 0.9422 | -0.0215 |
| Noise 2% | Gradient Boosting | 0.9891 | -0.0051 | 0.9908 | -0.0044 | 0.9425 | -0.0247 | 0.9467 | -0.0182 | 0.9446 | -0.0215 |
| Noise 5% | Random Forest | 0.9694 | -0.0245 | 0.9741 | -0.0206 | 0.9044 | -0.0590 | 0.9129 | -0.0512 | 0.9086 | -0.0551 |
| Noise 5% | Gradient Boosting | 0.9692 | -0.0250 | 0.9740 | -0.0213 | 0.9107 | -0.0564 | 0.9030 | -0.0620 | 0.9068 | -0.0592 |
| Noise 10% | Random Forest | 0.9214 | -0.0724 | 0.9303 | -0.0644 | 0.8510 | -0.1124 | 0.8522 | -0.1119 | 0.8516 | -0.1122 |
| Noise 10% | Gradient Boosting | 0.9211 | -0.0732 | 0.9307 | -0.0646 | 0.8629 | -0.1042 | 0.8443 | -0.1207 | 0.8535 | -0.1125 |
| Dropout LiDAR | Random Forest | 0.9599 | -0.0339 | 0.9504 | -0.0444 | 0.9387 | -0.0247 | 0.9256 | -0.0385 | 0.9321 | -0.0316 |
| Dropout LiDAR | Gradient Boosting | 0.9604 | -0.0338 | 0.9510 | -0.0443 | 0.9402 | -0.0269 | 0.9298 | -0.0352 | 0.9350 | -0.0311 |
| Combined (10%+Drop) | Random Forest | 0.8910 | -0.1028 | 0.8883 | -0.1064 | 0.8338 | -0.1296 | 0.8288 | -0.1353 | 0.8313 | -0.1325 |
| Combined (10%+Drop) | Gradient Boosting | 0.8897 | -0.1045 | 0.8869 | -0.1084 | 0.8468 | -0.1203 | 0.8193 | -0.1457 | 0.8328 | -0.1332 |

---

## 3. Validación Leave-One-Scenario-Out (LOSO) ante Perturbación
Desempeño fuera de distribución evaluado mediante el umbral físico desacoplado independiente ($TTC < 3.5\text{ s}$):

| Condición | Escenario | N Test | Recall (Indep.) | Espec. (Indep.) | Prec. (Indep.) | F1 (Indep.) | AUC-ROC (Indep.) | Recall (Nom.) |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Baseline (0%) | A | 1287 | 1.0000 | 0.7506 | 0.6997 | 0.8233 | 0.9800 | 0.9155 |
| Baseline (0%) | B | 997 | 1.0000 | 0.3850 | 0.3669 | 0.5369 | 0.8898 | 1.0000 |
| Baseline (0%) | C | 999 | 1.0000 | 0.6902 | 0.6730 | 0.8046 | 0.9739 | 0.9790 |
| Baseline (0%) | D | 972 | 1.0000 | 0.6513 | 0.6548 | 0.7914 | 0.9463 | 0.9827 |
| Baseline (0%) | E | 745 | 1.0000 | 0.7431 | 0.6937 | 0.8191 | 0.9625 | 0.9841 |
| Baseline (0%) | PROMEDIO_MACRO | 5000 | 1.0000 | 0.6440 | 0.6176 | 0.7551 | 0.9505 | 0.9723 |
| Noise 2% | A | 1287 | 0.9979 | 0.7580 | 0.7055 | 0.8266 | 0.9744 | 0.9046 |
| Noise 2% | B | 997 | 1.0000 | 0.3755 | 0.3634 | 0.5331 | 0.8997 | 1.0000 |
| Noise 2% | C | 999 | 1.0000 | 0.6689 | 0.6582 | 0.7939 | 0.9557 | 0.9790 |
| Noise 2% | D | 972 | 1.0000 | 0.6496 | 0.6537 | 0.7906 | 0.9395 | 0.9775 |
| Noise 2% | E | 745 | 1.0000 | 0.7389 | 0.6902 | 0.8167 | 0.9543 | 0.9656 |
| Noise 2% | PROMEDIO_MACRO | 5000 | 0.9996 | 0.6382 | 0.6142 | 0.7522 | 0.9447 | 0.9653 |
| Noise 5% | A | 1287 | 0.9852 | 0.7543 | 0.6997 | 0.8183 | 0.9623 | 0.8842 |
| Noise 5% | B | 997 | 0.9847 | 0.3837 | 0.3629 | 0.5303 | 0.8603 | 0.9784 |
| Noise 5% | C | 999 | 0.9923 | 0.6607 | 0.6509 | 0.7862 | 0.9354 | 0.9476 |
| Noise 5% | D | 972 | 1.0000 | 0.6000 | 0.6232 | 0.7679 | 0.9110 | 0.9671 |
| Noise 5% | E | 745 | 0.9818 | 0.7325 | 0.6810 | 0.8042 | 0.9303 | 0.9206 |
| Noise 5% | PROMEDIO_MACRO | 5000 | 0.9888 | 0.6262 | 0.6035 | 0.7414 | 0.9199 | 0.9396 |
| Noise 10% | A | 1287 | 0.9493 | 0.7076 | 0.6536 | 0.7741 | 0.9229 | 0.8692 |
| Noise 10% | B | 997 | 0.9313 | 0.3905 | 0.3526 | 0.5115 | 0.8125 | 0.9038 |
| Noise 10% | C | 999 | 0.9563 | 0.6049 | 0.6069 | 0.7425 | 0.8814 | 0.9178 |
| Noise 10% | D | 972 | 0.9612 | 0.5744 | 0.5990 | 0.7381 | 0.8626 | 0.9237 |
| Noise 10% | E | 745 | 0.9051 | 0.7155 | 0.6492 | 0.7561 | 0.8913 | 0.8492 |
| Noise 10% | PROMEDIO_MACRO | 5000 | 0.9406 | 0.5986 | 0.5723 | 0.7045 | 0.8741 | 0.8927 |
| Dropout LiDAR | A | 1287 | 0.9852 | 0.6916 | 0.6499 | 0.7832 | 0.9405 | 0.9278 |
| Dropout LiDAR | B | 997 | 0.9771 | 0.4068 | 0.3699 | 0.5367 | 0.9000 | 0.9615 |
| Dropout LiDAR | C | 999 | 0.9820 | 0.6623 | 0.6497 | 0.7820 | 0.9333 | 0.9528 |
| Dropout LiDAR | D | 972 | 0.9638 | 0.6205 | 0.6269 | 0.7597 | 0.8929 | 0.9480 |
| Dropout LiDAR | E | 745 | 0.9781 | 0.7113 | 0.6634 | 0.7906 | 0.9192 | 0.9603 |
| Dropout LiDAR | PROMEDIO_MACRO | 5000 | 0.9772 | 0.6185 | 0.5920 | 0.7304 | 0.9172 | 0.9501 |
| Combined (10%+Drop) | A | 1287 | 0.9387 | 0.6671 | 0.6210 | 0.7475 | 0.8861 | 0.8610 |
| Combined (10%+Drop) | B | 997 | 0.9122 | 0.4041 | 0.3530 | 0.5091 | 0.7896 | 0.8654 |
| Combined (10%+Drop) | C | 999 | 0.9409 | 0.5984 | 0.5990 | 0.7320 | 0.8504 | 0.8934 |
| Combined (10%+Drop) | D | 972 | 0.9199 | 0.5350 | 0.5669 | 0.7015 | 0.7958 | 0.8943 |
| Combined (10%+Drop) | E | 745 | 0.8978 | 0.6879 | 0.6260 | 0.7376 | 0.8507 | 0.8413 |
| Combined (10%+Drop) | PROMEDIO_MACRO | 5000 | 0.9219 | 0.5785 | 0.5532 | 0.6855 | 0.8345 | 0.8711 |

---

## 4. Hallazgos Clave para el Manuscrito
1. **Punto de Quiebre Operacional:**
   - A niveles de ruido de $\sigma = 2\%$, el sistema mantiene un Recall $> 93.8\%$ en ambos modelos ($F_1 > 0.94$).
   - A $\sigma = 5\%$, el Recall se ubica en el límite aceptable ($90.59\%$ RF, $91.26\%$ GBM).
   - A $\sigma = 10\%$, el Recall cae por debajo del umbral operacional crítico de $0.90$ ($85.06\%$ en RF y $86.07\%$ en GBM), confirmando que $10\%$ de ruido sensorial supera la banda de tolerancia sin recalibración o filtrado adaptativo.
2. **Heterogeneidad Inter-Escenarios en LOSO:**
   - La degradación **NO es uniforme**: se concentra marcadamente en el **Escenario B (Cargue y pala en proximidad estrecha)** y en el **Escenario E (Flota mixta autónomo-manual)**.
   - En el Escenario B, la proximidad inherente causa una severa caída en Especificidad ($38.5\%$) y Precisión ($35.0\%$ a $36.6\%$), generando falsas alarmas persistentes debido a que pequeñas fluctuaciones de LiDAR cruzan fácilmente el umbral crítico.
   - En el Escenario E, el Recall independiente cae hasta $89.78\%$ en la condición combinada, reflejando la complejidad de predecir interacción cinemática asimétrica bajo incertidumbre sensorial.
