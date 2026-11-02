# ANÁLISIS DE POTENCIA ESTADÍSTICA Y SENSIBILIDAD PARA EL TEST DE MCNEMAR (MINESAFE 3D)

**Proyecto:** MineSafe 3D — *Acta Montanistica Slovaca (AMS)*  
**Muestra evaluada:** Predicciones Out-of-Fold (5-Fold Stratified CV) sobre `DSTM-MineSafe-2026.csv` ($N = 5,000$; Positivos reales $N_{\text{pos}} = 2,677$; Negativos reales $N_{\text{neg}} = 2,323$)  
**Archivo de origen verificado:** `MINESAFE_EVIDENCIAS_FINALES/predicciones_oof.csv` y `MINESAFE_EVIDENCIAS_FINALES/mcnemar_verificado.csv`

---

## 1. VERIFICACIÓN DE CONTEOS PAREADOS Y CONCILIACIÓN EXHAUSTIVA CON LAS MATRICES DE CONFUSIÓN (TAREA 1)

### 1.1. Tabla $2 \times 2$ de Concordancia Global ($N = 5,000$) y Desglose por Clase Real

A partir del cruce registro a registro (`id_registro` $0 \dots 4,999$) entre `etiqueta_real`, `prediccion_RF` y `prediccion_GBM` en `predicciones_oof.csv`, los cuatro conteos de concordancia son:

| Estrato Evaluado | Tamaño ($N$) | $a$ (Ambos Aciertan) | $b$ (Solo RF Acierta / GBM Falla) | $c$ (Solo GBM Acierta / RF Falla) | $d$ (Ambos Fallan) | Pares Discordantes ($n_d = b+c$) | Tasa de Discordancia ($\hat{\psi} = \frac{b+c}{N}$) | Aciertos RF ($a+b$) | Errores RF ($c+d$) | Aciertos GBM ($a+c$) | Errores GBM ($b+d$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Global OOF ($y \in \{0,1\}$)** | **5,000** | **4,766** | **40** | **52** | **142** | **92** | **1.8400 %** ($0.018400$) | **4,806** ($96.12\,\%$) | **194** ($3.88\,\%$) | **4,818** ($96.36\,\%$) | **182** ($3.64\,\%$) |
| **Clase Positiva ($y = 1$, Recall)** | **2,677** | **2,559** ($\text{TP}_{11}$) | **20** ($\text{TP}_{\text{RF}},\text{FN}_{\text{GBM}}$) | **30** ($\text{FN}_{\text{RF}},\text{TP}_{\text{GBM}}$) | **68** ($\text{FN}_{00}$) | **50** | **1.8678 %** ($0.018678$) | **2,579** ($\text{TP}_{\text{RF}}$) | **98** ($\text{FN}_{\text{RF}}$) | **2,589** ($\text{TP}_{\text{GBM}}$) | **88** ($\text{FN}_{\text{GBM}}$) |
| **Clase Negativa ($y = 0$, Specificity)**| **2,323** | **2,207** ($\text{TN}_{11}$) | **20** ($\text{TN}_{\text{RF}},\text{FP}_{\text{GBM}}$) | **22** ($\text{FP}_{\text{RF}},\text{TN}_{\text{GBM}}$) | **74** ($\text{FP}_{00}$) | **42** | **1.8080 %** ($0.018080$) | **2,227** ($\text{TN}_{\text{RF}}$) | **96** ($\text{FP}_{\text{RF}}$) | **2,229** ($\text{TN}_{\text{GBM}}$) | **94** ($\text{FP}_{\text{GBM}}$) |

### 1.2. Comprobación Algebraica de Identidades Marginales frente a las Matrices de Confusión

Las matrices de confusión individuales out-of-fold son:
* **Random Forest:** $\text{TP}_{\text{RF}} = 2,579$, $\text{FP}_{\text{RF}} = 96$, $\text{TN}_{\text{RF}} = 2,227$, $\text{FN}_{\text{RF}} = 98$.
* **Gradient Boosting:** $\text{TP}_{\text{GBM}} = 2,589$, $\text{FP}_{\text{GBM}} = 94$, $\text{TN}_{\text{GBM}} = 2,229$, $\text{FN}_{\text{GBM}} = 88$.

Se verifican las 8 identidades marginales obligatorias sin error alguno:
1. $\text{TP}_{\text{RF}} = a_{\text{pos}} + b_{\text{pos}} = 2,559 + 20 = \mathbf{2,579}$.
2. $\text{FN}_{\text{RF}} = c_{\text{pos}} + d_{\text{pos}} = 30 + 68 = \mathbf{98}$.
3. $\text{TN}_{\text{RF}} = a_{\text{neg}} + b_{\text{neg}} = 2,207 + 20 = \mathbf{2,227}$.
4. $\text{FP}_{\text{RF}} = c_{\text{neg}} + d_{\text{neg}} = 22 + 74 = \mathbf{96}$.
5. $\text{Aciertos Totales RF} = \text{TP}_{\text{RF}} + \text{TN}_{\text{RF}} = 2,579 + 2,227 = \mathbf{4,806} = a + b = 4,766 + 40$.
6. $\text{Errores Totales RF} = \text{FP}_{\text{RF}} + \text{FN}_{\text{RF}} = 96 + 98 = \mathbf{194} = c + d = 52 + 142$.
7. $\text{Aciertos Totales GBM} = \text{TP}_{\text{GBM}} + \text{TN}_{\text{GBM}} = 2,589 + 2,229 = \mathbf{4,818} = a + c = 4,766 + 52$.
8. $\text{Errores Totales GBM} = \text{FP}_{\text{GBM}} + \text{FN}_{\text{GBM}} = 94 + 88 = \mathbf{182} = b + d = 40 + 142$.

### 1.3. Explicación de la Inconsistencia en el Informe Preliminar Anterior (Tarea 1.6)

* **Origen de la discrepancia:** El reporte original del repositorio (`experiments/results/statistical_tests.md`, línea 13) imprimió únicamente los conteos discordantes ($b = 40, c = 52$) y el total $N = 5,000$, omitiendo imprimir las celdas concordantes $a$ y $d$. Durante la redacción preliminar de `02_RESULTADOS_VERIFICADOS.csv` (antes de que finalizara la exportación de `audit_summary.json`), se anotaron manualmente en el texto descriptivo los valores $a = 4,775$ y $d = 133$.
* **Por qué era inconsistente con las matrices de confusión:** Aunque $4,775 + 40 + 52 + 133 = 5,000$ conservaba la suma total $N = 5,000$ y no alteraba en absoluto el estadístico $\chi^2$ ni el $p$-valor de McNemar (los cuales dependen exclusivamente de $b = 40$ y $c = 52$), un desplazamiento de $+9$ unidades en $a$ y $-9$ unidades en $d$ implicaba que los aciertos de RF serían $a + b = 4,815 \neq 4,806$ ($\text{TP}_{\text{RF}} + \text{TN}_{\text{RF}}$) y los de GBM serían $a + c = 4,827 \neq 4,818$ ($\text{TP}_{\text{GBM}} + \text{TN}_{\text{GBM}}$).
* **Resolución definitiva:** Tanto el archivo JSON generado por el script de auditoría (`audit_summary.json`, líneas 6–9) como la verificación directa sobre `predicciones_oof.csv` confirman que los conteos reales exactos son **$a = 4,766$, $b = 40$, $c = 52$ y $d = 142$**, eliminando toda discrepancia.

### 1.4. Resultados de las Variantes del Test de McNemar

| Variante de la Prueba de McNemar | Fórmula / Método | Estadístico | Valor $p$ Exacto (6 dec.) | Valor $p$ Redondeado (4 dec., Manuscrito) |
| :--- | :--- | :---: | :---: | :---: |
| **McNemar Exacto Bilateral (Binomial)** | $2 \sum_{k=0}^{\min(b,c)} \binom{b+c}{k} 0.5^{b+c}$ con $b=40, n_d=92$ | $b = 40, c = 52$ | **$0.251322$** | **$0.2513$** |
| **McNemar con Corrección de Continuidad (Edwards, 1948)** | $\chi^2_{\text{cc}} = \frac{(|b - c| - 1)^2}{b + c} = \frac{11^2}{92} = \frac{121}{92}$ | $\chi^2(1) = \mathbf{1.315217}$ | **$0.251452$** | **$0.2515$** ($\chi^2 = 1.3152$) |
| **McNemar Asintótico sin Corrección** | $\chi^2 = \frac{(b - c)^2}{b + c} = \frac{(-12)^2}{92} = \frac{144}{92}$ | $\chi^2(1) = \mathbf{1.565217}$ | **$0.210903$** | **$0.2109$** |
| **McNemar Mid-$p$ de Lancaster (1961)** | $p_{\text{exact}} - \binom{92}{40} 0.5^{92}$ | — | **$0.213153$** | **$0.2132$** |

---

## 2. ANÁLISIS DE POTENCIA ESTADÍSTICA Y CURVA DE SENSIBILIDAD (TAREA 2.1 Y 2.2)

### 2.1. Marco Matemático y Supuestos Explícitos

En una comparación pareada de dos clasificadores sobre $N$ instancias, la potencia del test de McNemar depende fundamentalmente de **dos parámetros poblacionales**:
1. **La diferencia neta de rendimiento ($\Delta = p_{10} - p_{01}$):** donde $p_{10} = P(\text{RF acierta, GBM falla})$ y $p_{01} = P(\text{RF falla, GBM acierta})$.
2. **La proporción total de pares discordantes ($\psi = p_{10} + p_{01}$, con cota matemática $\psi \ge |\Delta|$):** A menor tasa de discordancia $\psi$ (es decir, cuando ambos modelos aciertan o fallan simultáneamente en la gran mayoría de las muestras), **menor es la varianza de la diferencia $\text{Var}(\hat{\Delta}) = \frac{\psi - \Delta^2}{N}$** y **mayor es la potencia estadística** para detectar una diferencia $\Delta$ dada.

Se evaluaron dos formulaciones complementarias a nivel de significancia bilateral $\alpha = 0.05$:
* **Potencia Condicional Exacta (condicionada a $n_d = b + c$ observado):** Dado $n_d = 92$ (en Accuracy global) o $n_{d,\text{pos}} = 50$ (en Recall sobre positivos reales), bajo la hipótesis alternativa $p_b = \frac{p_{10}}{\psi} = \frac{1}{2} + \frac{|\Delta|}{2\psi}$, se suma la probabilidad binomial exacta $\sum_{k \in R_\alpha} \binom{n_d}{k} p_b^k (1-p_b)^{n_d-k}$ sobre la región crítica exacta $R_\alpha = \{k : p_{\text{binom}}(k, n_d) < 0.05\}$. Para $n_d = 92$, la región crítica exacta bilateral a $\alpha = 0.05$ es $b \le 35$ o $b \ge 57$.
* **Potencia Incondicional de Connor (1987) / Lachin (1992):** Evalúa la potencia sobre el tamaño muestral completo $N$ integrando la variabilidad de $\psi$:
  $$1 - \beta = \Phi\left(\frac{\sqrt{N}|\Delta| - z_{1-\alpha/2}\sqrt{\psi}}{\sqrt{\psi - \Delta^2}}\right) + \Phi\left(\frac{-\sqrt{N}|\Delta| - z_{1-\alpha/2}\sqrt{\psi}}{\sqrt{\psi - \Delta^2}}\right)$$
  donde se analiza tanto la tasa de discordancia empírica observada ($\hat{\psi}_{\text{Acc}} = 92/5000 = 0.0184$ y $\hat{\psi}_{\text{Rec}} = 50/2677 = 0.018678$) como escenarios conservadores de mayor discordancia ($\psi \in \{0.025, 0.035, 0.050\}$).

---

### 2.2. Diferencia Mínima Detectable (MDE) al 80 % y 90 % de Potencia ($\alpha = 0.05$)

| Métrica Evaluada | Tamaño Muestral ($N$) | Tasa de Discordancia Observada ($\hat{\psi}$) | MDE al **80 % de Potencia** (Incondicional / Condicional Exacta) | MDE al **90 % de Potencia** (Incondicional / Condicional Exacta) | Equivalencia en Número Neto de Instancias Discordantes ($|b - c|$) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Exactitud Global ($\Delta\text{Accuracy}$)** | $N = 5,000$ | $1.840\,\%$ ($n_d = 92$) | **$\pm 0.54\,\%$** ($0.0054$) / **$\pm 0.53\,\%$** ($0.0053$) | **$\pm 0.62\,\%$** ($0.0062$) / **$\pm 0.61\,\%$** ($0.0061$) | $27$ muestras (al 80 %) / $31$ muestras (al 90 %) sobre $5,000$ |
| **Sensibilidad / Recall ($\Delta\text{Recall}$)** | $N_{\text{pos}} = 2,677$ | $1.868\,\%$ ($n_{d,\text{pos}} = 50$) | **$\pm 0.74\,\%$** ($0.0074$) / **$\pm 0.76\,\%$** ($0.0076$) | **$\pm 0.86\,\%$** ($0.0086$) / **$\pm 0.86\,\%$** ($0.0086$) | $20$ positivos (al 80 %) / $23$ positivos (al 90 %) sobre $2,677$ |

---

### 2.3. Curva de Sensibilidad de Potencia para Exactitud Global ($\Delta\text{Accuracy}$, $N = 5,000$)

| Diferencia Absoluta $|\Delta\text{Acc}|$ | Diferencia en % | Diferencia en Muestras ($N=5,000$) | $p_b$ Condicional ($\psi=1.84\,\%$) | Odds Ratio Discordante ($\text{OR} = p_{10}/p_{01}$) | Potencia Condicional Exacta ($n_d=92$) | Potencia Incondicional ($\psi = 1.84\,\%$ obs.) | Potencia Incondicional ($\psi = 2.50\,\%$) | Potencia Incondicional ($\psi = 3.50\,\%$) | Potencia Incondicional ($\psi = 5.00\,\%$) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| $0.0010$ | $0.10\,\%$ | $5.0$ | $0.5272$ | $1.11$ | $7.75\,\%$ | $8.17\,\%$ | $7.32\,\%$ | $6.65\,\%$ | $6.15\,\%$ |
| $0.0020$ | $0.20\,\%$ | $10.0$ | $0.5543$ | $1.24$ | $17.40\,\%$ | $18.08\,\%$ | $14.55\,\%$ | $11.76\,\%$ | $9.69\,\%$ |
| **$0.0024$ (Obs.)** | **$0.24\,\%$ (Obs.)** | **$12.0$** | **$0.5652$** | **$1.30$** | **$23.22\,\%$** | **$23.98\,\%$** | **$18.88\,\%$** | **$14.83\,\%$** | **$11.81\,\%$** |
| $0.0030$ | $0.30\,\%$ | $15.0$ | $0.5815$ | $1.39$ | $33.83\,\%$ | $34.62\,\%$ | $26.86\,\%$ | $20.53\,\%$ | $15.77\,\%$ |
| $0.0040$ | $0.40\,\%$ | $20.0$ | $0.6087$ | $1.56$ | $54.56\,\%$ | $54.99\,\%$ | $43.21\,\%$ | $32.73\,\%$ | $24.41\,\%$ |
| $0.0050$ | $0.50\,\%$ | $25.0$ | $0.6359$ | $1.75$ | $74.39\,\%$ | $74.12\,\%$ | $60.88\,\%$ | $47.21\,\%$ | $35.26\,\%$ |
| **$0.0054$ (MDE 80%)** | **$0.54\,\%$** | **$27.0$** | **$0.6467$** | **$1.83$** | **$80.92\,\%$** | **$80.39\,\%$** | $67.55\,\%$ | $53.23\,\%$ | $40.05\,\%$ |
| **$0.0062$ (MDE 90%)** | **$0.62\,\%$** | **$31.0$** | **$0.6685$** | **$2.02$** | **$90.67\,\%$** | **$89.86\,\%$** | $79.20\,\%$ | $64.94\,\%$ | $50.03\,\%$ |
| $0.0075$ | $0.75\,\%$ | $37.5$ | $0.7038$ | $2.38$ | $98.07\,\%$ | $97.46\,\%$ | $91.86\,\%$ | $80.93\,\%$ | $65.98\,\%$ |
| **$0.0100$** | **$1.00\,\%$** | **$50.0$** | **$0.7717$** | **$3.38$** | **$99.99\,\%$** | **$99.94\,\%$** | **$99.41\,\%$** | **$96.58\,\%$** | **$88.56\,\%$** |
| **$0.0150$** | **$1.50\,\%$** | **$75.0$** | **$0.9076$** | **$9.82$** | **$100.00\,\%$** | **$100.00\,\%$** | **$100.00\,\%$** | **$99.99\,\%$** | **$99.74\,\%$** |

---

### 2.4. Curva de Sensibilidad de Potencia para Sensibilidad / Recall ($\Delta\text{Recall}$, $N_{\text{pos}} = 2,677$)

| Diferencia Absoluta $|\Delta\text{Recall}|$ | Diferencia en % | Diferencia en Positivos ($N_{\text{pos}}=2,677$) | $p_b$ Condicional ($\psi_{\text{pos}}=1.87\,\%$) | Odds Ratio Discordante ($\text{OR}$) | Potencia Condicional Exacta ($n_{d,\text{pos}}=50$) | Potencia Incondicional ($\psi_{\text{pos}}=1.87\,\%$ obs.) | Potencia Incondicional ($\psi_{\text{pos}}=3.50\,\%$) | Potencia Incondicional ($\psi_{\text{pos}}=5.00\,\%$) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| $0.0020$ | $0.20\,\%$ | $5.4$ | $0.5535$ | $1.24$ | $8.59\,\%$ | $11.78\,\%$ | $8.57\,\%$ | $7.49\,\%$ |
| **$0.003736$ (Obs.)** | **$0.374\,\%$ (Obs.)** | **$10.0$** | **$0.6000$** | **$1.50$** | **$23.71\,\%$** | **$29.30\,\%$** | **$17.84\,\%$** | **$13.90\,\%$** |
| $0.0050$ | $0.50\,\%$ | $13.4$ | $0.6338$ | $1.73$ | $41.13\,\%$ | $47.33\,\%$ | $28.23\,\%$ | $21.18\,\%$ |
| $0.0075$ | $0.75\,\%$ | $20.1$ | $0.7008$ | $2.34$ | $78.58\,\%$ | $81.08\,\%$ | $54.55\,\%$ | $41.12\,\%$ |
| **$0.0081$** | **$0.81\,\%$** | **$21.7$** | **$0.7168$** | **$2.53$** | **$85.26\,\%$** | **$86.62\,\%$** | $61.04\,\%$ | $46.59\,\%$ |
| **$0.0093$** | **$0.93\,\%$** | **$24.9$** | **$0.7490$** | **$2.98$** | **$94.29\,\%$** | **$94.11\,\%$** | $73.00\,\%$ | $57.62\,\%$ |
| **$0.0100$** | **$1.00\,\%$** | **$26.8$** | **$0.7677$** | **$3.30$** | **$97.16\,\%$** | **$96.64\,\%$** | **$79.01\,\%$** | $63.84\,\%$ |
| **$0.0150$** | **$1.50\,\%$** | **$40.2$** | **$0.9015$** | **$9.16$** | **$100.00\,\%$** | **$99.99\,\%$** | **$98.59\,\%$** | **$93.50\,\%$** |

---

### 2.5. Interpretación Científica frente a Diferencias Operacionalmente Relevantes

1. **Alta potencia frente a diferencias científicamente relevantes ($\ge 1.0\,\%$):** En sistemas de prevención de colisiones mineras, una diferencia clínicamente u operacionalmente relevante entre dos arquitecturas algorítmicas suele situarse en $\ge 1.0\,\%$ ($0.0100$) de exactitud o sensibilidad. Para detectar $|\Delta\text{Accuracy}| = 1.0\,\%$, el diseño experimental de MineSafe 3D ($N = 5,000, \hat{\psi} = 1.84\,\%$) posee una **potencia estadística del $99.94\,\%$ (incondicional) y $99.99\,\%$ (condicional exacta)**. Asimismo, para detectar $|\Delta\text{Recall}| = 1.0\,\%$ sobre los $2,677$ eventos de riesgo positivo, la potencia es del **$96.64\,\%$ (incondicional) y $97.16\,\%$ (condicional exacta)**. Incluso para una diferencia sutil de $\mathbf{0.75\,\%}$, la potencia es del **$97.46\,\%$ en Accuracy y $81.08\,\%$ en Recall**.
2. **Por qué la potencia observada para el efecto empírico ($\Delta\text{Acc} = -0.24\,\%$) es baja ($23.98\,\%$):** La diferencia observada entre RF y GBM es de apenas $12$ instancias sobre $5,000$ ($-0.24\,\%$) en Accuracy y $10$ instancias sobre $2,677$ ($-0.374\,\%$) en Recall. Como ocurre universalmente en estadística inferencial (Hoenig & Heisey, 2001), cuando la diferencia verdadera entre dos modelos tiende a cero, la "potencia post-hoc" evaluada en el tamaño de efecto puntual observado tiende al nivel $\alpha = 0.05$. Por ello, la ausencia de diferencia significativa no se debe a un tamaño muestral insuficiente (ya que la MDE al $80\,\%$ de potencia es de apenas $0.54\,\%$ en Accuracy y $0.74\,\%$ en Recall), sino a que la discrepancia entre ambos modelos es inferior a medio punto porcentual.

