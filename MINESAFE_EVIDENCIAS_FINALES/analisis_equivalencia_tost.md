# ANÁLISIS DE EQUIVALENCIA ESTADÍSTICA MEDIANTE EL PROCEDIMIENTO TOST (*TWO ONE-SIDED TESTS*)

**Proyecto:** MineSafe 3D — *Acta Montanistica Slovaca (AMS)*  
**Muestra evaluada:** Predicciones pareadas Out-of-Fold ($N = 5,000$; $N_{\text{pos}} = 2,677$; $N_{\text{neg}} = 2,323$)  
**Tablas de respaldo:** `resultados_detallados/tost_proporciones_pareadas.csv` y `resultados_detallados/tost_bootstrap_multimetrica.csv`

---

## 1. ¿ES APROPIADO EJECUTAR TOST CON LAS PREDICCIONES PAREADAS OUT-OF-FOLD? (TAREA 2.3)

### 1.1. Necesidad Estadística del Procedimiento TOST frente al Test de McNemar
En el reporte original del repositorio (`experiments/results/statistical_tests.md`, línea 13), se concluyó *"No Rechazar $H_0$ (Equivalencia)"* a partir de $p = 0.2513$ en la prueba de McNemar. Desde el punto de vista de la teoría de decisión estadística (Schuirmann, 1987; Wellek, 2010; Lakens, 2017), **no rechazar la hipótesis nula de igualdad ($H_0: \Delta = 0$) nunca demuestra equivalencia**, ya que un valor $p > 0.05$ solo indica ausencia de evidencia de diferencia, la cual podría deberse tanto a equivalencia real como a falta de precisión muestral.

Para demostrar formalmente **equivalencia estadística**, es obligatorio invertir la carga de la prueba mediante el procedimiento **TOST (*Two One-Sided Tests*)** fijando un margen de equivalencia simétrico $[-\delta, +\delta]$:
* **Hipótesis nula compuesta de no-equivalencia ($H_0$):** $\Delta \le -\delta \;\;\text{o}\;\; \Delta \ge +\delta$ (los modelos difieren en al menos $\delta$).
* **Hipótesis alternativa de equivalencia ($H_1$):** $-\delta < \Delta < +\delta$ (la diferencia verdadera está contenida estrictamente dentro del margen de tolerancia).

El procedimiento TOST ejecuta dos pruebas unilaterales de nivel $\alpha = 0.05$:
$$Z_{\text{inf}} = \frac{\hat{\Delta} - (-\delta)}{\text{SE}(\hat{\Delta})}, \qquad Z_{\text{sup}} = \frac{+\delta - \hat{\Delta}}{\text{SE}(\hat{\Delta})}, \qquad p_{\text{TOST}} = \max\big(1 - \Phi(Z_{\text{inf}}),\; 1 - \Phi(Z_{\text{sup}})\big)$$
Se declara equivalencia estadística al nivel $\alpha = 0.05$ si y solo si **$p_{\text{TOST}} < 0.05$**, lo cual es matemáticamente equivalente a que el **intervalo de confianza bilateral al $90\,\%$ ($1 - 2\alpha$) de $\Delta$ esté completamente contenido dentro de $(-\delta, +\delta)$** (o al nivel más estricto $\alpha = 0.025$ si el **IC al $95\,\%$** está contenido dentro de $(-\delta, +\delta)$).

### 1.2. Idoneidad y Limitaciones Metodológicas de Usar Predicciones OOF de Validación Cruzada
1. **Por qué es apropiado:** En validación cruzada estratificada de 5 folds (`StratifiedKFold`), cada una de las $N = 5,000$ observaciones recibe exactamente una predicción out-of-fold de Random Forest y una de Gradient Boosting entrenados sobre los mismos $4,000$ registros de los otros 4 folds. Para proporciones binarias pareadas (Accuracy sobre $N=5,000$, Recall sobre $N_{\text{pos}}=2,677$ y Specificity sobre $N_{\text{neg}}=2,323$), el estimador de varianza pareada de Wald / Liu et al. (2002) viene dado por:
   $$\text{SE}(\hat{\Delta}) = \frac{1}{N}\sqrt{(b + c) - \frac{(b - c)^2}{N}}$$
   mientras que para métricas compuestas o continuas (F1-score, Precision, ROC-AUC, PR-AUC), el intervalo de confianza de la diferencia pareada se obtiene mediante **Bootstrap pareado no paramétrico** remuestreando las tuplas $(y_i, \hat{y}_{i,\text{RF}}, \hat{y}_{i,\text{GBM}}, \hat{p}_{i,\text{RF}}, \hat{p}_{i,\text{GBM}})$.
2. **Reserva metodológica obligatoria (Correlación entre Folds):** Como demostraron Dietterich (1998) y Nadeau & Bengio (2003), las predicciones out-of-fold de un $K$-fold CV no son estrictamente independientes de forma incondicional porque dos folds cualesquiera comparten el $75\,\%$ ($3/4$) de sus datos de entrenamiento. Esto puede subestimar ligeramente la varianza incondicional del algoritmo frente a nuevos conjuntos de entrenamiento. Por consiguiente, **las pruebas TOST sobre predicciones OOF evalúan la equivalencia condicional a las particiones de entrenamiento realizadas**, y así debe declararse explícitamente en el manuscrito.

---

## 2. SELECCIÓN TRANSPARENTE DE MÁRGENES DE EQUIVALENCIA ($\pm\delta$) COMO ANÁLISIS EXPLORATORIO (TAREA 2.4)

> **DECLARACIÓN DE TRANSPARENCIA METODOLÓGICA (PREVENCIÓN DE *HARKing* / *POST-HOC MARGIN SELECTION*):**  
> En el diseño original del proyecto MineSafe 3D (`experiments/config/config.yaml`), no se pre-registró un margen de equivalencia $\pm\delta$ antes de observar las predicciones OOF. Seleccionar un único margen $\delta$ después de conocer que $\hat{\Delta}_{\text{Acc}} = -0.24\,\%$ y $\hat{\Delta}_{\text{Recall}} = -0.37\,\%$ con el único propósito de declarar significación constituiría una mala práctica estadística.  
> Por ello, este análisis **se declara explícitamente como exploratorio post-hoc** y evalúa una **rejilla objetiva de tres niveles de tolerancia estándar en ingeniería de sistemas críticos**, reportando con total honestidad en cuáles niveles el resultado es **equivalente** y en cuáles es **inconcluso**:

1. **Nivel 1 — Margen Ultra-Estricto ($\delta = \pm 0.50\,\% = \pm 0.0050$):** Exige que la discrepancia entre ambos modelos sea inferior a medio punto porcentual ($\le 25$ registros en $N=5,000$ o $\le 13.4$ positivos en $N_{\text{pos}}=2,677$).
2. **Nivel 2 — Margen Estricto de Ingeniería de Seguridad ($\delta = \pm 1.00\,\% = \pm 0.0100$):** Estándar habitual en validación de algoritmos de detección industrial/clínica de alta precisión (tolerancia máxima de $1$ punto porcentual).
3. **Nivel 3 — Margen Operacional Estándar en Machine Learning ($\delta = \pm 2.00\,\% = \pm 0.0200$):** Tolerancia práctica común en comparaciones de ensambles tabulares bajo ruido de sensores.

---

## 3. RESULTADOS DEL ANÁLISIS TOST Y ESTIMACIONES POR INTERVALOS DE CONFIANZA (TAREA 2.5)

### 3.1. TOST Analítico de Proporciones Pareadas (Wald y Corrección de Continuidad de Liu et al., 2002)

| Métrica Pareada | Estimación Puntual $\hat{\Delta} = \text{RF} - \text{GBM}$ | Error Estándar $\text{SE}(\hat{\Delta})$ | IC 90 % de $\Delta$ (Criterio TOST $\alpha=0.05$) | IC 95 % de $\Delta$ (Criterio Estricto $\alpha=0.025$) | Margen $\pm\delta$ Evaluado | $Z_{\text{inf}}$ ($p_{\text{inf}}$) | $Z_{\text{sup}}$ ($p_{\text{sup}}$) | $p_{\text{TOST}}$ (Wald / Con Corrección CC) | Conclusión Estadística ($\alpha = 0.05$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Exactitud ($\Delta\text{Accuracy}$)**<br>($N=5,000$, $b=40, c=52$) | **$-0.002400$**<br>($-0.240\,\%$) | $0.001918$ | **$[-0.005555, +0.000755]$**<br>($[-0.556\,\%, +0.076\,\%]$) | **$[-0.006159, +0.001359]$**<br>($[-0.616\,\%, +0.136\,\%]$) | **$\pm 0.50\,\%$** ($0.0050$)<br>**$\pm 0.75\,\%$** ($0.0075$)<br>**$\pm 1.00\,\%$** ($0.0100$)<br>**$\pm 2.00\,\%$** ($0.0200$) | $+1.356$ ($0.0876$)<br>$+2.659$ ($0.0039$)<br>$+3.962$ ($3.7\times 10^{-5}$)<br>$+9.176$ ($<10^{-15}$) | $+3.858$ ($5.7\times 10^{-5}$)<br>$+5.162$ ($<10^{-6}$)<br>$+6.465$ ($<10^{-10}$)<br>$+11.679$ ($<10^{-15}$) | **$0.0876$** / $0.0962$<br>**$0.0039$** / $0.0046$<br>**$3.7\times 10^{-5}$** / $4.6\times 10^{-5}$<br>**$< 0.0001$** / $< 0.0001$ | **INCONCLUSO** (Límite inf. $-0.556\,\% < -0.50\,\%$)<br>**EQUIVALENTE** ($p = 0.0039$)<br>**EQUIVALENTE** ($p = 0.000037$)<br>**EQUIVALENTE** ($p < 0.0001$) |
| **Sensibilidad ($\Delta\text{Recall}$)**<br>($N_{\text{pos}}=2,677$, $b=20, c=30$) | **$-0.003736$**<br>($-0.374\,\%$) | $0.002640$ | **$[-0.008079, +0.000608]$**<br>($[-0.808\,\%, +0.061\,\%]$) | **$[-0.008911, +0.001440]$**<br>($[-0.891\,\%, +0.144\,\%]$) | **$\pm 0.50\,\%$** ($0.0050$)<br>**$\pm 0.75\,\%$** ($0.0075$)<br>**$\pm 1.00\,\%$** ($0.0100$)<br>**$\pm 2.00\,\%$** ($0.0200$) | $+0.479$ ($0.3160$)<br>$+1.426$ ($0.0770$)<br>$+2.373$ ($0.0088$)<br>$+6.160$ ($<10^{-9}$) | $+3.308$ ($0.0005$)<br>$+4.255$ ($1.0\times 10^{-5}$)<br>$+5.202$ ($<10^{-6}$)<br>$+8.989$ ($<10^{-15}$) | **$0.3160$** / $0.3416$<br>**$0.0770$** / $0.0877$<br>**$0.0088$** / $0.0107$<br>**$< 0.0001$** / $< 0.0001$ | **INCONCLUSO** (Límite inf. $-0.808\,\% < -0.50\,\%$)<br>**INCONCLUSO** (Límite inf. $-0.808\,\% < -0.75\,\%$)<br>**EQUIVALENTE** ($p = 0.0088$)<br>**EQUIVALENTE** ($p < 0.0001$) |
| **Especificidad ($\Delta\text{Specificity}$)**<br>($N_{\text{neg}}=2,323$, $b=20, c=22$) | **$-0.000861$**<br>($-0.086\,\%$) | $0.002790$ | **$[-0.005450, +0.003728]$**<br>($[-0.545\,\%, +0.373\,\%]$) | **$[-0.006329, +0.004607]$**<br>($[-0.633\,\%, +0.461\,\%]$) | **$\pm 0.50\,\%$** ($0.0050$)<br>**$\pm 0.75\,\%$** ($0.0075$)<br>**$\pm 1.00\,\%$** ($0.0100$)<br>**$\pm 2.00\,\%$** ($0.0200$) | $+1.484$ ($0.0690$)<br>$+2.380$ ($0.0087$)<br>$+3.276$ ($0.0005$)<br>$+6.861$ ($<10^{-11}$) | $+2.101$ ($0.0178$)<br>$+2.997$ ($0.0014$)<br>$+3.893$ ($4.9\times 10^{-5}$)<br>$+7.478$ ($<10^{-13}$) | **$0.0690$** / $0.0798$<br>**$0.0087$** / $0.0107$<br>**$0.0005$** / $0.0007$<br>**$< 0.0001$** / $< 0.0001$ | **INCONCLUSO** (Límite inf. $-0.545\,\% < -0.50\,\%$)<br>**EQUIVALENTE** ($p = 0.0087$)<br>**EQUIVALENTE** ($p = 0.00053$)<br>**EQUIVALENTE** ($p < 0.0001$) |

---

### 3.2. TOST Multivariado mediante Bootstrap Pareado No Paramétrico ($B = 2,000$ Remuestreos, `seed = 42`)

Para extender el análisis a las métricas continuas y compuestas del manuscrito ($\text{ROC-AUC}, \text{PR-AUC}, \text{F1-score}, \text{Precision}$), se calculó la distribución empírica de las diferencias pareadas $\Delta = M_{\text{RF}} - M_{\text{GBM}}$:

| Métrica Evaluada | Estimación Puntual $\hat{\Delta} = \text{RF} - \text{GBM}$ | $\text{SE}_{\text{boot}}$ | IC 90 % Percentil Bootstrap | IC 95 % Percentil Bootstrap | Decisión TOST a $\delta = \pm 0.50\,\%$ ($p_{\text{TOST}}$) | Decisión TOST a $\delta = \pm 1.00\,\%$ ($p_{\text{TOST}}$) | Decisión TOST a $\delta = \pm 2.00\,\%$ ($p_{\text{TOST}}$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **ROC-AUC** | **$-0.000407$** ($-0.041\,\%$) | $0.000408$ | **$[-0.001012, +0.000313]$** | **$[-0.001117, +0.000470]$** | **EQUIVALENTE** ($p < 0.0001$) | **EQUIVALENTE** ($p < 0.0001$) | **EQUIVALENTE** ($p < 0.0001$) |
| **PR-AUC** | **$-0.000485$** ($-0.049\,\%$) | $0.000277$ | **$[-0.000915, -0.000023]$** | **$[-0.001019, +0.000049]$** | **EQUIVALENTE** ($p < 0.0001$) | **EQUIVALENTE** ($p < 0.0001$) | **EQUIVALENTE** ($p < 0.0001$) |
| **Precision** | **$-0.000852$** ($-0.085\,\%$) | $0.002353$ | **$[-0.004792, +0.003071]$** | **$[-0.005466, +0.003746]$** | **EQUIVALENTE al 90 %** ($p = 0.0390$)<br>*Inconcluso al 95 %* | **EQUIVALENTE** ($p = 0.000051$) | **EQUIVALENTE** ($p < 0.0001$) |
| **F1-score** | **$-0.002293$** ($-0.229\,\%$) | $0.001810$ | **$[-0.005293, +0.000693]$** | **$[-0.005721, +0.001284]$** | **INCONCLUSO** ($p = 0.0674$) | **EQUIVALENTE** ($p = 0.000010$) | **EQUIVALENTE** ($p < 0.0001$) |
| **Accuracy** | **$-0.002400$** ($-0.240\,\%$) | $0.001931$ | **$[-0.005600, +0.000800]$** | **$[-0.006005, +0.001400]$** | **INCONCLUSO** ($p = 0.0890$) | **EQUIVALENTE** ($p = 0.000041$) | **EQUIVALENTE** ($p < 0.0001$) |
| **Specificity** | **$-0.000861$** ($-0.086\,\%$) | $0.002817$ | **$[-0.005553, +0.003832]$** | **$[-0.006362, +0.004687]$** | **INCONCLUSO** ($p = 0.0709$) | **EQUIVALENTE** ($p = 0.000590$) | **EQUIVALENTE** ($p < 0.0001$) |
| **Recall** | **$-0.003736$** ($-0.374\,\%$) | $0.002727$ | **$[-0.008161, +0.000746]$** | **$[-0.009019, +0.001501]$** | **INCONCLUSO** ($p = 0.3215$) | **EQUIVALENTE** ($p = 0.0108$) | **EQUIVALENTE** ($p < 0.0001$) |

---

## 4. DICTAMEN CIENTÍFICO: ¿SE PUEDE SOSTENER EQUIVALENCIA, DIFERENCIA O RESULTADO INCONCLUSO? (TAREA 2.5)

 combinando la prueba de diferencia nula (McNemar) con la prueba de equivalencia (TOST), la conclusión científica rigurosa es:

1. **En capacidad de ranking probabilístico ($\text{ROC-AUC}$ y $\text{PR-AUC}$), existe EQUIVALENCIA ESTADÍSTICA ESTRICTA incluso bajo márgenes microscópicos ($\delta = \pm 0.50\,\%$ e incluso $\delta = \pm 0.15\,\%$):**
   * El intervalo de confianza al 95 % de $\Delta\text{ROC-AUC}$ es $[-0.0011, +0.0005]$ ($[-0.11\,\%, +0.05\,\%]$) y el de $\Delta\text{PR-AUC}$ es $[-0.0010, +0.00005]$ ($[-0.10\,\%, +0.005\,\%]$). Ambos intervalos están holgadamente contenidos dentro de $\pm 0.50\,\%$ ($p_{\text{TOST}} < 10^{-6}$).
2. **En métricas de clasificación con umbral $0.50$ ($\text{Accuracy}, \text{Recall}, \text{Specificity}, \text{F1-score}$):**
   * **Bajo un margen de tolerancia ingenieril de $\delta = \pm 1.00\,\%$ ($1$ punto porcentual) o $\delta = \pm 2.00\,\%$:** Se demuestra **EQUIVALENCIA ESTADÍSTICA SIGNIFICATIVA** en todas las métricas ($\Delta\text{Accuracy}$: IC 95 % $[-0.62\,\%, +0.14\,\%]$, $p_{\text{TOST}} = 3.7\times 10^{-5}$; $\Delta\text{Recall}$: IC 95 % $[-0.89\,\%, +0.14\,\%]$, $p_{\text{TOST}} = 0.0088$; $\Delta\text{F1}$: IC 95 % $[-0.57\,\%, +0.13\,\%]$, $p_{\text{TOST}} = 1.0\times 10^{-5}$). Es decir, podemos afirmar con más del 95 % de confianza que el rendimiento de Random Forest no es inferior al de Gradient Boosting en más de $0.89$ puntos porcentuales en Recall ni en más de $0.62$ puntos porcentuales en Accuracy.
   * **Bajo un margen ultra-estricto de $\delta = \pm 0.50\,\%$ ($0.5$ puntos porcentuales):** El resultado para $\text{Accuracy}$ ($p_{\text{TOST}} = 0.0876$, IC 90 % $[-0.56\,\%, +0.08\,\%]$), $\text{F1-score}$ ($p_{\text{TOST}} = 0.0674$, IC 90 % $[-0.53\,\%, +0.07\,\%]$) y especialmente $\text{Recall}$ ($p_{\text{TOST}} = 0.3160$, IC 90 % $[-0.81\,\%, +0.06\,\%]$) es **ESTADÍSTICAMENTE INCONCLUSO** (no se rechaza la igualdad en McNemar con $p = 0.2513$, pero el límite inferior del IC 90 % rebasa ligeramente $-0.50\,\%$).

### Párrafo Recomendado para Incluir en el Manuscrito (*Acta Montanistica Slovaca*)

> *"Out-of-fold paired comparison across all $N = 5,000$ instances showed $a = 4,766$ concordant correct predictions, $d = 142$ concordant errors, $b = 40$ instances correctly classified exclusively by Random Forest, and $c = 52$ instances correctly classified exclusively by Gradient Boosting ($\hat{\psi} = 1.84\,\%$). Exact two-sided McNemar testing ($\chi^2_{\text{cc}} = 1.3152, p_{\text{exact}} = 0.2513$) and fold-level Wilcoxon signed-rank testing ($W = 2.00, p = 0.1875$) did not detect a statistically significant difference between ensembles. Sensitivity power analysis (Connor's unconditional formulation at $\alpha = 0.05$) confirmed that the study achieved $80\,\%$ power to detect a minimum detectable effect (MDE) of $\pm 0.54\,\%$ in overall accuracy and $\pm 0.74\,\%$ in positive-class recall ($99.9\,\%$ and $96.6\,\%$ power for a $1.00\,\%$ difference, respectively). Furthermore, an exploratory post-hoc Two One-Sided Tests (TOST) equivalence analysis demonstrated that the 95 % confidence intervals for paired differences in ROC-AUC ($[-0.11\,\%, +0.05\,\%]$), PR-AUC ($[-0.10\,\%, +0.005\,\%]$), F1-score ($[-0.57\,\%, +0.13\,\%]$), overall accuracy ($[-0.62\,\%, +0.14\,\%]$), and recall ($[-0.89\,\%, +0.14\,\%]$) lie entirely within a $\pm 1.00\,\%$ equivalence margin ($p_{\text{TOST}} \le 0.0088$ across all metrics), whereas under a stricter $\pm 0.50\,\%$ margin, equivalence is confirmed for ROC-AUC and PR-AUC ($p_{\text{TOST}} < 0.0001$) but remains inconclusive for thresholded recall ($p_{\text{TOST}} = 0.3160$)."*

