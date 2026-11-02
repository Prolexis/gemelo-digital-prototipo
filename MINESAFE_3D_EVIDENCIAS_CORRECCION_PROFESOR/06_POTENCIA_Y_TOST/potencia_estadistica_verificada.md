# FASE V (Parte 1) — Análisis de Potencia Estadística y Sensibilidad para McNemar (`FON-05`)

## 1. Fundamento Matemático

En la prueba pareada de McNemar sobre $N$ muestras, la información inferencial reside exclusivamente en la tasa de pares discordantes $\psi = (b + c) / N$:
- **Para Exactitud Global ($N = 5,000$):** $n_{\text{disc}} = 40 + 52 = 92 \implies \hat{\psi}_{\text{acc}} = 92 / 5000 = 0.0184$ ($1.84\%$). La diferencia observada es $\hat{\Delta}_{\text{acc}} = (40 - 52)/5000 = -0.0024$ ($-0.24\%$, $\text{SE} = 0.001917$).
- **Para Sensibilidad / Recall en Positivos Reales ($N_+ = 2,677$):** $n_{\text{disc},+} = 20 + 30 = 50 \implies \hat{\psi}_{\text{rec}} = 50 / 2677 = 0.018678$ ($1.87\%$). La diferencia observada es $\hat{\Delta}_{\text{rec}} = (20 - 30)/2677 = -0.003736$ ($-0.37\%$, $\text{SE} = 0.002639$).

Debido a la altísima concordancia entre Random Forest y Gradient Boosting ($98.16\%$ de acuerdo global; $(4766+142)/5000 = 4908/5000$), el error estándar de la diferencia es muy pequeño ($0.19\%$ en Accuracy y $0.26\%$ en Recall).

## 2. Diferencia Mínima Detectable (MDE) con $\alpha = 0.05$ Bilateral

| Métrica Pareada | Tamaño Muestral ($N$) | Discordantes Observados ($n_{\text{disc}}$) | Tasa de Discordancia ($\hat{\psi}$) | MDE al 80% de Potencia (Incondicional Connor / Condicional Exacta) | MDE al 90% de Potencia (Incondicional Connor / Condicional Exacta) |
|---|---:|---:|---:|:---:|:---:|
| **Exactitud Global (Accuracy)** | $5,000$ | $92$ | $1.84\%$ | **$0.54\%$ / $0.56\%$** ($\approx 27$–$28$ muestras) | **$0.62\%$ / $0.63\%$** ($\approx 31$ muestras) |
| **Sensibilidad (Recall, $y=1$)** | $2,677$ | $50$ | $1.87\%$ | **$0.74\%$ / $0.79\%$** ($\approx 20$–$21$ positivos) | **$0.86\%$ / $0.88\%$** ($\approx 23$ positivos) |

## 3. Interpretación Científica

1. El diseño experimental ($N = 5,000$) **posee potencia estadística alta ($\ge 80\%$) para detectar cualquier diferencia de exactitud $\ge 0.56\%$ y cualquier diferencia de sensibilidad (Recall) $\ge 0.79\%$**.
2. La potencia post-hoc para las diferencias minúsculas observadas en la muestra ($|\hat{\Delta}_{\text{acc}}| = 0.24\%$ y $|\hat{\Delta}_{\text{rec}}| = 0.37\%$) es baja ($\approx 21\%$–$28\%$) **no por falta de tamaño muestral**, sino porque el tamaño del efecto real entre ambos ensambles de árboles sobre este conjunto de datos es cercanísimo a cero ($< 0.4\%$).
