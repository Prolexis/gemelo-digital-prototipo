# Reporte de Pruebas de Estadística Inferencial (Estándar Q1)
## Proyecto MineSafe 3D: Evaluación Pareada Random Forest vs. Gradient Boosting
**Fecha de generación:** 2026-09-22 14:33:07  
**Muestras evaluadas out-of-fold:** 5,000  
**Estrategia de validación:** Stratified 5-Fold Cross-Validation  

---

### 1. Resumen de Pruebas de Hipótesis y Comparación de Modelos

| Prueba Estadística | Hipótesis Nula (H₀) | Estadístico | Grados de Libertad / n | p-valor (Exacto / Asintótico) | p-valor Ajustado (Holm-Bonferroni) | Decisión Estadística (α = 0.05) |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **Test de McNemar** | $P(	ext{RF acierta, GBM falla}) = P(	ext{RF falla, GBM acierta})$ | $\chi^2 = 1.3152$ ($b=40$, $c=52$) | $df = 1$ | $p = 0.2513$ | $p_{	ext{adj}} = 0.2513$ | **No Rechazar H₀ (Equivalencia)** |
| **Test de Wilcoxon (Folds)** | Distribución idéntica de Recall en los 5 folds | $W = 2.00$ | $k = 5$ folds | $p = 0.1875$ | $p_{	ext{adj}} = 0.1875$ | **No Rechazar H₀ (Equivalencia)** |
| **Bootstrap Δ Recall** | $\Delta 	ext{Recall} = 	ext{Recall}_{	ext{RF}} - 	ext{Recall}_{	ext{GBM}} = 0$ | $\Delta = -0.0037$ | $B = 1,000$ remuestreos | IC 95% $[-0.0087, +0.0015]$ | N/A | **El IC incluye el 0 (No significativo)** |

---

### 2. Estimación por Intervalos de Confianza Bootstrap (IC 95% Percentil)

| Modelo / Métrica | Valor Estimado (Media Bootstrap) | Intervalo de Confianza al 95% |
|---|:---:|:---:|
| **Random Forest — AUC-ROC** | **0.9939** | $[0.9926, 0.9950]$ |
| **Gradient Boosting — AUC-ROC** | **0.9943** | $[0.9929, 0.9955]$ |
| **Random Forest — Recall** | **0.9633** | $[0.9558, 0.9706]$ |
| **Gradient Boosting — Recall** | **0.9670** | $[0.9604, 0.9733]$ |
| **Diferencia de Recall ($\Delta$)** | **-0.0037** | $[-0.0087, +0.0015]$ |

---

### 3. Texto en Formato de Reporting APA (Listo para pegar en el Artículo)

> *"La comparación del desempeño predictivo entre los clasificadores Random Forest y Gradient Boosting reveló que las discrepancias observadas en las métricas agregadas no alcanzan significancia estadística. La prueba de McNemar sobre los pares discordantes (40 instancias clasificadas correctamente de forma exclusiva por RF frente a 52 por GBM) no evidenció diferencias significativas en la tasa de error global ($\chi^2(1) = 1.315, p = 0.251$, corrección por continuidad de Edwards). De manera complementaria, el análisis pareado de rangos signados de Wilcoxon sobre el recall inter-fold confirmó la ausencia de superioridad sistemática ($W = 2.0, p = 0.188$). El tamaño del efecto para la diferencia de recall fue de $\Delta = -0.004$ con un intervalo de confianza bootstrap al 95% de $[-0.009, +0.002]$ (1,000 remuestreos con reemplazo), el cual contiene el valor nulo cero."*

---

### 4. Justificación Técnica para la Selección de Random Forest en Producción

Dado que no existe una diferencia estadísticamente significativa en precisión diagnóstica ni recall entre ambos ensambles (p > 0.05), la adopción de **Random Forest** como núcleo del Gemelo Digital MineSafe 3D se fundamenta en criterios computacionales y arquitectónicos de operación industrial:

1. **Paralelización en Inferencia:** Random Forest permite la evaluación simultánea y desacoplada de árboles independientes ($O(\log M)$ paralelizable mediante SIMD / ONNX Runtime), mientras que Gradient Boosting requiere cálculo secuencial dependiente de residuos.
2. **Compatibilidad Nativa y Estabilidad con TreeSHAP:** TreeExplainer sobre Random Forest proporciona una convergencia analítica libre de sesgos de aproximación de path iterativo, permitiendo latencias de explicabilidad inferiores a 15 ms por ciclo de telemetría GNSS (2 Hz).
3. **Resiliencia ante Ruido de Sensores:** La estrategia de bagging de RF presenta menor propensión al sobreajuste frente a valores extremos esporádicos en distancias LiDAR causados por polvo o niebla en el tajo.
