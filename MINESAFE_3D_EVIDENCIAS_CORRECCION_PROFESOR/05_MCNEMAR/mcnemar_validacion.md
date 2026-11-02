# FASE IV — Resolución Definitiva de la Prueba de McNemar (`FON-03`)

## 1. Tabla 2×2 Exacta Calculada Directamente desde los 5,000 Registros OOF Alineados

Al cruzar registro por registro (`id_registro = 0 .. 4999`) los aciertos de Random Forest (`prediccion_RF == etiqueta_real`) y Gradient Boosting (`prediccion_GBM == etiqueta_real`) en `04_ENTRENAMIENTO_Y_OOF/predicciones_oof_verificadas.csv`:

| Celda | Definición | Conteo Global ($N=5,000$) | Estrato Positivo ($y=1, N_+=2,677$) | Estrato Negativo ($y=0, N_-=2,323$) |
|---|---|:---:|:---:|:---:|
| **$a$** | Ambos modelos aciertan | **`4766`** | `2559` | `2207` |
| **$b$** | Solo Random Forest acierta (GBM falla) | **`40`** | `20` | `20` |
| **$c$** | Solo Gradient Boosting acierta (RF falla) | **`52`** | `30` | `22` |
| **$d$** | Ambos modelos fallan | **`142`** | `68` | `74` |
| **Total** | **$a + b + c + d$** | **`5000`** | **`2677`** | **`2323`** |
| **$n_{\text{disc}}$** | Pares discordantes ($b + c$) | **`92`** | `50` | `42` |

### Verificación de Identidades Algebraicas con las Matrices de Confusión Individuales:
- **Random Forest (`TP = 2579, FP = 96, TN = 2227, FN = 98`):**
  - Aciertos totales RF: $\text{TP} + \text{TN} = 2579 + 2227 = 4806 = a + b = 4766 + 40$.
  - Errores totales RF: $\text{FP} + \text{FN} = 96 + 98 = 194 = c + d = 52 + 142$.
- **Gradient Boosting (`TP = 2589, FP = 94, TN = 2229, FN = 88`):**
  - Aciertos totales GBM: $\text{TP} + \text{TN} = 2589 + 2229 = 4818 = a + c = 4766 + 52$.
  - Errores totales GBM: $\text{FP} + \text{FN} = 94 + 88 = 182 = b + d = 40 + 142$.

---

## 2. Estadísticos y Valores $p$ Exactos (4, 6 y 8 Decimales)

1. **Prueba Exacta Binomial Bilateral (`scipy.stats.binomtest(40, n=92, p=0.5, alternative="two-sided")`):**
   $$p_{\text{exact}} = 2 \sum_{k=0}^{40} \binom{92}{k} (0.5)^{92} = 0.25132210$$
   - A **8 decimales**: **`0.25132210`**
   - A **6 decimales**: **`0.251322`**
   - A **4 decimales**: **`0.2513`**
2. **Estadístico $\chi^2$ de McNemar con Corrección de Continuidad de Edwards:**
   $$\chi^2_{\text{cc}} = \frac{(|40 - 52| - 1)^2}{40 + 52} = \frac{121}{92} = 1.31521739, \quad p = 0.25145219 \text{ (4 dec: } 0.2515\text{)}$$
3. **Estadístico $\chi^2$ de McNemar sin Corrección de Continuidad:**
   $$\chi^2 = \frac{(40 - 52)^2}{40 + 52} = \frac{144}{92} = 1.56521739, \quad p = 0.21090293 \text{ (4 dec: } 0.2109\text{)}$$
4. **Mid-$p$ de Lancaster:**
   $$p_{\text{mid}} = p_{\text{exact}} - \binom{92}{40}(0.5)^{92} = 0.21210913$$

---

## 3. Explicación Forense de las Dos Discrepancias Históricas (`FON-03`)

1. **¿Por qué `resultados_reproducidos.csv` mostraba `p_exacto = 0.251283` mientras que `mcnemar_verificado.csv` mostraba `0.251322`?**
   - En el script previo `MINESAFE_EVIDENCIAS_FINALES/scripts/ejecutar_verificacion_final.py`, la línea 460 calculó dinámicamente `binomtest(40, n=92, p=0.5).pvalue = 0.25132210` y lo exportó correctamente a `mcnemar_verificado.csv` (`0.251322`).
   - Sin embargo, en la línea 811 del mismo script, al construir la tabla descriptiva `resultados_reproducidos.csv`, se dejó escrito un literal de texto fijo (`"p_exacto=0.251283"`) proveniente de una aproximación manual previa en lugar de interpolar la variable calculada `m_glob['p_exacto_binomial_bilateral']`.
   - En este paquete se conserva intacto el archivo original en `05_MCNEMAR/resultados_reproducidos_original_sin_modificar.csv` como evidencia de auditoría y se entrega `05_MCNEMAR/resultados_reproducidos_corregidos.csv` y `05_MCNEMAR/mcnemar_definitivo.csv` con el valor exacto **`0.251322`** (`0.25132210` a 8 decimales; **`0.2513`** a 4 decimales).
2. **¿Por qué borradores preliminares mencionaban conteos como `b=86, c=105` (`experiments/README.md` línea 277) o `a=4775, b=40, c=52, d=133`?**
   - Los valores `86` y `105` en `experiments/README.md` correspondían a un comentario ilustrativo antiguo antes de fijar el dataset `DSTM-MineSafe-2026.csv`.
   - El par `a=4775, d=133` en un informe preliminar se debió a tomar los aciertos y errores del estrato de una sola corrida sin restar los errores cruzados del otro modelo ($4775 + 40 + 52 + 133 = 5000$, pero implicaba $a+b = 4815 \neq 4806$). Con los 5,000 registros OOF verificados, la única descomposición exacta que satisface simultáneamente ambas matrices de confusión es **$a = 4,766, b = 40, c = 52, d = 142$**.

## 4. Desglose Completo en `mcnemar_definitivo.csv`

| estrato | n_total | a_ambos_aciertan | b_solo_rf_acierta | c_solo_gbm_acierta | d_ambos_fallan | suma_verificada | aciertos_rf_a_mas_b | errores_rf_c_mas_d | aciertos_gbm_a_mas_c | errores_gbm_b_mas_d | n_discordantes_b_mas_c | tasa_discordancia_psi | diferencia_proporciones_rf_menos_gbm | se_diferencia | ic95_diff_bajo | ic95_diff_alto | ic90_diff_bajo | ic90_diff_alto | chi2_edwards_cc | p_chi2_edwards_cc | chi2_sin_correccion | p_chi2_sin_correccion | p_exacto_binomial_bilateral_8dec | p_exacto_binomial_bilateral_6dec | p_exacto_binomial_bilateral_4dec | p_mid_lancaster | odds_ratio_b_sobre_c |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GLOBAL_OOF_N5000 | 5000 | 4766 | 40 | 52 | 142 | 5000 | 4806 | 194 | 4818 | 182 | 92 | 0.0184 | -0.0024 | 0.001918 | -0.006159 | 0.001359 | -0.005555 | 0.000755 | 1.315217 | 0.25145219 | 1.565217 | 0.21090293 | 0.2513221 | 0.251322 | 0.2513 | 0.213153 | 0.769231 |
| POSITIVOS_REALES_y1_N2677 (Sensibilidad / Recall) | 2677 | 2559 | 20 | 30 | 68 | 2677 | 2579 | 98 | 2589 | 88 | 50 | 0.018678 | -0.003736 | 0.00264 | -0.008911 | 0.00144 | -0.008079 | 0.000608 | 1.62 | 0.20309179 | 2.0 | 0.15729921 | 0.20263875 | 0.202639 | 0.2026 | 0.1607796 | 0.666667 |
| NEGATIVOS_REALES_y0_N2323 (Especificidad) | 2323 | 2207 | 20 | 22 | 74 | 2323 | 2227 | 96 | 2229 | 94 | 42 | 0.01808 | -0.000861 | 0.00279 | -0.006329 | 0.004607 | -0.00545 | 0.003728 | 0.02381 | 0.87737056 | 0.095238 | 0.75762072 | 0.87761433 | 0.877614 | 0.8776 | 0.76079164 | 0.909091 |
| FOLD_1_N1000 | 1000 | 953 | 5 | 10 | 32 | 1000 | 958 | 42 | 963 | 37 | 15 | 0.015 | -0.005 | 0.00387 | -0.012585 | 0.002585 | -0.011365 | 0.001365 | 1.066667 | 0.30169958 | 1.666667 | 0.1967056 | 0.30175781 | 0.301758 | 0.3018 | 0.21011353 | 0.5 |
| FOLD_2_N1000 | 1000 | 948 | 7 | 15 | 30 | 1000 | 955 | 45 | 963 | 37 | 22 | 0.022 | -0.008 | 0.004684 | -0.01718 | 0.00118 | -0.015704 | -0.000296 | 2.227273 | 0.135593 | 2.909091 | 0.08808151 | 0.13380051 | 0.133801 | 0.1338 | 0.09313965 | 0.466667 |
| FOLD_3_N1000 | 1000 | 958 | 14 | 9 | 19 | 1000 | 972 | 28 | 967 | 33 | 23 | 0.023 | 0.005 | 0.004793 | -0.004395 | 0.014395 | -0.002884 | 0.012884 | 0.695652 | 0.40424849 | 1.086957 | 0.29714653 | 0.40487289 | 0.404873 | 0.4049 | 0.30745625 | 1.555556 |
| FOLD_4_N1000 | 1000 | 959 | 6 | 7 | 28 | 1000 | 965 | 35 | 966 | 34 | 13 | 0.013 | -0.001 | 0.003605 | -0.008066 | 0.006066 | -0.00693 | 0.00493 | 0.0 | 1.0 | 0.076923 | 0.78151129 | 1.0 | 1.0 | 1.0 | 0.79052734 | 0.857143 |
| FOLD_5_N1000 | 1000 | 948 | 8 | 11 | 33 | 1000 | 956 | 44 | 959 | 41 | 19 | 0.019 | -0.003 | 0.004358 | -0.011541 | 0.005541 | -0.010168 | 0.004168 | 0.210526 | 0.6463552 | 0.473684 | 0.49129712 | 0.6476059 | 0.647606 | 0.6476 | 0.50344467 | 0.727273 |
| ESCENARIO_A_N1287 | 1287 | 1240 | 7 | 15 | 25 | 1287 | 1247 | 40 | 1255 | 32 | 22 | 0.017094 | -0.006216 | 0.00364 | -0.013351 | 0.000919 | -0.012204 | -0.000228 | 2.227273 | 0.135593 | 2.909091 | 0.08808151 | 0.13380051 | 0.133801 | 0.1338 | 0.09313965 | 0.466667 |
| ESCENARIO_B_N997 | 997 | 920 | 11 | 15 | 51 | 997 | 931 | 66 | 935 | 62 | 26 | 0.026078 | -0.004012 | 0.005113 | -0.014033 | 0.006009 | -0.012422 | 0.004398 | 0.346154 | 0.55629846 | 0.615385 | 0.43276758 | 0.55719709 | 0.557197 | 0.5572 | 0.44206834 | 0.733333 |
| ESCENARIO_C_N999 | 999 | 965 | 4 | 9 | 21 | 999 | 969 | 30 | 974 | 25 | 13 | 0.013013 | -0.005005 | 0.003606 | -0.012072 | 0.002062 | -0.010936 | 0.000926 | 1.230769 | 0.26725749 | 1.923077 | 0.16551786 | 0.2668457 | 0.266846 | 0.2668 | 0.17956543 | 0.444444 |
| ESCENARIO_D_N972 | 972 | 935 | 9 | 8 | 20 | 972 | 944 | 28 | 943 | 29 | 17 | 0.01749 | 0.001029 | 0.004242 | -0.007285 | 0.009342 | -0.005948 | 0.008006 | 0.0 | 1.0 | 0.058824 | 0.80836516 | 1.0 | 1.0 | 1.0 | 0.81452942 | 1.125 |
| ESCENARIO_E_N745 | 745 | 706 | 9 | 5 | 25 | 745 | 715 | 30 | 711 | 34 | 14 | 0.018792 | 0.005369 | 0.005019 | -0.004467 | 0.015205 | -0.002886 | 0.013624 | 0.642857 | 0.42267807 | 1.142857 | 0.28504941 | 0.4239502 | 0.42395 | 0.424 | 0.30175781 | 1.8 |
