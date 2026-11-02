# FASE V (Parte 2) — Análisis de Equivalencia TOST Exploratorio y Corrección de `FON-05`

## 1. Diagnóstico de la Observación `FON-05`

El revisor académico (`FON-05`) señaló correctamente dos principios metodológicos fundamentales:
1. Un valor $p > 0.05$ en McNemar ($p = 0.2513$) o Wilcoxon ($p = 0.1875$) indica **ausencia de evidencia de diferencia estadísticamente significativa** (*no rechazo de $H_0$*), pero por sí solo no demuestra equivalencia formal.
2. Ejecutar una prueba de equivalencia TOST (*Two One-Sided Tests*, Schuirmann 1987) seleccionando márgenes $\pm \Delta$ *después* de conocer los datos constituye un **análisis exploratorio post-hoc** (dado que `experiments/config/config.yaml` no preespecificó un margen `equivalence_margin_delta` antes del entrenamiento).

## 2. Resultados Verificados de TOST Exploratorio y Corrección de Holm-Bonferroni

| categoria | prueba_o_margen | estimacion_puntual | error_estandar | ic_90_pct | ic_95_pct | estadistico | p_valor | p_ajustado_holm | conclusion |
|---|---|---|---|---|---|---|---|---|---|
| Prueba de Diferencia (Superioridad) | McNemar Exacto Bilateral (Accuracy N=5,000; b=40, c=52) | -0.0024 | 0.001918 | [-0.005555, +0.000755] | [-0.006159, +0.001359] | b=40, c=52 (n_disc=92) | 0.251322 | 0.375 | No se rechaza H0 (p = 0.251322 > 0.05) |
| Prueba de Diferencia (Superioridad) | McNemar Chi2 con Corrección de Edwards (N=5,000) | -0.0024 | 0.001918 | [-0.005555, +0.000755] | [-0.006159, +0.001359] | chi2_cc = 1.3152 | 0.251452 | 0.502904 | No se rechaza H0 (p = 0.251452 > 0.05) |
| Prueba de Diferencia (Superioridad) | McNemar Exacto Bilateral en Positivos Reales (Recall N_+=2,677; b_+=20, c_+=30) | -0.003736 | 0.00264 | [-0.008079, +0.000608] | [-0.008911, +0.001440] | b_+=20, c_+=30 (n_disc_+=50) | 0.202639 | 0.202639 | No se rechaza H0 (p = 0.202639 > 0.05) |
| Prueba No Paramétrica por Fold | Wilcoxon Rangos Signados sobre Recall (5 Folds) | -0.003735 | 0.002131 | N/A (k=5 folds) | N/A (k=5 folds) | W = 2.00 | 0.1875 | 0.375 | No se rechaza H0 (p = 0.187500 > 0.05) |
| Remuestreo Bootstrap (B=1,000, seed=42) | Delta Recall (RF - GBM) | -0.003658 | 0.002682 | [-0.007934, +0.000748] | [-0.008734, +0.001501] | Percentil no paramétrico | nan | nan | IC95% [-0.0087, +0.0015] incluye el 0 |
| TOST Exploratorio Post-Hoc (Accuracy N=5,000) | Margen Delta = +/- 0.25% (+/- 0.0025) | -0.0024 | 0.001918 | [-0.005555, +0.000755] | [-0.006159, +0.001359] | Z1=0.052, Z2=2.555 | 0.47921 | nan | Inconcluso para este margen (p_TOST >= 0.05) |
| TOST Exploratorio Post-Hoc (Recall N_+=2,677) | Margen Delta = +/- 0.25% (+/- 0.0025) | -0.003736 | 0.00264 | [-0.008079, +0.000608] | [-0.008911, +0.001440] | Z1=-0.468, Z2=2.362 | 0.680081 | nan | Inconcluso para este margen (p_TOST >= 0.05) |
| TOST Exploratorio Post-Hoc (Accuracy N=5,000) | Margen Delta = +/- 0.50% (+/- 0.0050) | -0.0024 | 0.001918 | [-0.005555, +0.000755] | [-0.006159, +0.001359] | Z1=1.356, Z2=3.858 | 0.08762 | nan | Inconcluso para este margen (p_TOST >= 0.05) |
| TOST Exploratorio Post-Hoc (Recall N_+=2,677) | Margen Delta = +/- 0.50% (+/- 0.0050) | -0.003736 | 0.00264 | [-0.008079, +0.000608] | [-0.008911, +0.001440] | Z1=0.479, Z2=3.308 | 0.316008 | nan | Inconcluso para este margen (p_TOST >= 0.05) |
| TOST Exploratorio Post-Hoc (Accuracy N=5,000) | Margen Delta = +/- 0.75% (+/- 0.0075) | -0.0024 | 0.001918 | [-0.005555, +0.000755] | [-0.006159, +0.001359] | Z1=2.659, Z2=5.162 | 0.003919 | nan | Equivalencia exploratoria cumplida (p_TOST < 0.05) |
| TOST Exploratorio Post-Hoc (Recall N_+=2,677) | Margen Delta = +/- 0.75% (+/- 0.0075) | -0.003736 | 0.00264 | [-0.008079, +0.000608] | [-0.008911, +0.001440] | Z1=1.426, Z2=4.255 | 0.076977 | nan | Inconcluso para este margen (p_TOST >= 0.05) |
| TOST Exploratorio Post-Hoc (Accuracy N=5,000) | Margen Delta = +/- 1.00% (+/- 0.0100) | -0.0024 | 0.001918 | [-0.005555, +0.000755] | [-0.006159, +0.001359] | Z1=3.962, Z2=6.465 | 3.7e-05 | nan | Equivalencia exploratoria cumplida (p_TOST < 0.05) |
| TOST Exploratorio Post-Hoc (Recall N_+=2,677) | Margen Delta = +/- 1.00% (+/- 0.0100) | -0.003736 | 0.00264 | [-0.008079, +0.000608] | [-0.008911, +0.001440] | Z1=2.373, Z2=5.202 | 0.008834 | nan | Equivalencia exploratoria cumplida (p_TOST < 0.05) |
| TOST Exploratorio Post-Hoc (Accuracy N=5,000) | Margen Delta = +/- 1.50% (+/- 0.0150) | -0.0024 | 0.001918 | [-0.005555, +0.000755] | [-0.006159, +0.001359] | Z1=6.569, Z2=9.072 | 0.0 | nan | Equivalencia exploratoria cumplida (p_TOST < 0.05) |
| TOST Exploratorio Post-Hoc (Recall N_+=2,677) | Margen Delta = +/- 1.50% (+/- 0.0150) | -0.003736 | 0.00264 | [-0.008079, +0.000608] | [-0.008911, +0.001440] | Z1=4.266, Z2=7.096 | 1e-05 | nan | Equivalencia exploratoria cumplida (p_TOST < 0.05) |
| TOST Exploratorio Post-Hoc (Accuracy N=5,000) | Margen Delta = +/- 2.00% (+/- 0.0200) | -0.0024 | 0.001918 | [-0.005555, +0.000755] | [-0.006159, +0.001359] | Z1=9.176, Z2=11.679 | 0.0 | nan | Equivalencia exploratoria cumplida (p_TOST < 0.05) |
| TOST Exploratorio Post-Hoc (Recall N_+=2,677) | Margen Delta = +/- 2.00% (+/- 0.0200) | -0.003736 | 0.00264 | [-0.008079, +0.000608] | [-0.008911, +0.001440] | Z1=6.160, Z2=8.989 | 0.0 | nan | Equivalencia exploratoria cumplida (p_TOST < 0.05) |

## 3. Regla Editorial Obligatoria para el Manuscrito (`FON-05`)

- **En el cuerpo principal de Resultados (§5):** Reportar las pruebas inferenciales preespecificadas (McNemar exacto $p = 0.2513$, Wilcoxon $p = 0.1875$, con corrección de Holm-Bonferroni $p_{\text{Holm}} = 0.3750$, e IC 95 % bootstrap de $\Delta\text{Recall} = [-0.0087, +0.0015]$) concluyendo textualmente que **"no se encontró evidencia de diferencia estadísticamente significativa entre Random Forest y Gradient Boosting"**.
- **Si se menciona TOST o equivalencia práctica:** Declararla explícitamente como **"análisis de sensibilidad/equivalencia exploratorio post-hoc"**, mostrando con total transparencia que para un margen estricto de $\pm 0.50\%$ el resultado es **inconcluso** ($p_{\text{TOST}} = 0.0879$ en Accuracy; $p_{\text{TOST}} = 0.3161$ en Recall), mientras que para un margen práctico de $\pm 1.00\%$ los intervalos de confianza al 90 % ($[-0.56\%, +0.08\%]$ en Accuracy; $[-0.81\%, +0.06\%]$ en Recall) quedan íntegramente contenidos dentro de $[-1.00\%, +1.00\%]$ ($p_{\text{TOST}} = 0.000038$ en Accuracy y $p_{\text{TOST}} = 0.00877$ en Recall).
