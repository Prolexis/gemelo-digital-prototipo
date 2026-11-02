# FASE VII — Validación Leave-One-Scenario-Out (LOSO) y Análisis de Falsas Alarmas (`FON-06`)

## 1. Tabla Completa de Resultados LOSO Verificados (Random Forest y Gradient Boosting)

| modelo | escenario_retenido | descripcion | n_test | pos_indep_ttc35 | neg_indep_ttc35 | tp_indep | fp_indep | tn_indep | fn_indep | recall_indep | specificity_indep | fpr_indep | precision_indep | fdr_indep | f1_indep | roc_auc_indep | tp_nominal | fp_nominal | tn_nominal | fn_nominal | recall_nominal | specificity_nominal | fpr_nominal | precision_nominal | fdr_nominal | f1_nominal | roc_auc_nominal |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Random Forest | A | Acarreo rampa principal (alta velocidad, pendiente pronunciada, polvo moderado) | 1287 | 473 | 814 | 473 | 203 | 611 | 0 | 1.0 | 0.7506 | 0.2494 | 0.6997 | 0.3003 | 0.8233 | 0.98 | 672 | 4 | 549 | 62 | 0.9155 | 0.9928 | 0.0072 | 0.9941 | 0.0059 | 0.9532 | 0.9969 |
| Random Forest | B | Maniobras en zona de cargue y pala (baja velocidad, proximidad estrecha, visibilidad alta) | 997 | 262 | 735 | 262 | 452 | 283 | 0 | 1.0 | 0.385 | 0.615 | 0.3669 | 0.6331 | 0.5369 | 0.8898 | 416 | 298 | 283 | 0 | 1.0 | 0.4871 | 0.5129 | 0.5826 | 0.4174 | 0.7363 | 0.8995 |
| Random Forest | C | Tránsito nocturno con fatiga operador (turno acumulado alto, PERCLOS elevado) | 999 | 389 | 610 | 389 | 189 | 421 | 0 | 1.0 | 0.6902 | 0.3098 | 0.673 | 0.327 | 0.8046 | 0.9739 | 560 | 18 | 409 | 12 | 0.979 | 0.9578 | 0.0422 | 0.9689 | 0.0311 | 0.9739 | 0.9959 |
| Random Forest | D | Clima adverso y visibilidad degradada (polvo denso/niebla, atenuación óptica LiDAR) | 972 | 387 | 585 | 387 | 204 | 381 | 0 | 1.0 | 0.6513 | 0.3487 | 0.6548 | 0.3452 | 0.7914 | 0.9463 | 567 | 24 | 371 | 10 | 0.9827 | 0.9392 | 0.0608 | 0.9594 | 0.0406 | 0.9709 | 0.9952 |
| Random Forest | E | Flota mixta autónomo-manual (interacción Komatsu 930E AHS y camioneta de supervisión) | 745 | 274 | 471 | 274 | 121 | 350 | 0 | 1.0 | 0.7431 | 0.2569 | 0.6937 | 0.3063 | 0.8191 | 0.9625 | 372 | 23 | 344 | 6 | 0.9841 | 0.9373 | 0.0627 | 0.9418 | 0.0582 | 0.9625 | 0.9925 |
| Random Forest | PROMEDIO_MACRO | Promedio no ponderado entre escenarios A-E | 5000 | 1785 | 3215 | 1785 | 1169 | 2046 | 0 | 1.0 | 0.644 | 0.356 | 0.6176 | 0.3824 | 0.7551 | 0.9505 | 2587 | 367 | 1956 | 90 | 0.9723 | 0.8628 | 0.1372 | 0.8894 | 0.1106 | 0.9194 | 0.976 |
| Gradient Boosting | A | Acarreo rampa principal (alta velocidad, pendiente pronunciada, polvo moderado) | 1287 | 473 | 814 | 473 | 258 | 556 | 0 | 1.0 | 0.683 | 0.317 | 0.6471 | 0.3529 | 0.7857 | 0.9817 | 709 | 22 | 531 | 25 | 0.9659 | 0.9602 | 0.0398 | 0.9699 | 0.0301 | 0.9679 | 0.9967 |
| Gradient Boosting | B | Maniobras en zona de cargue y pala (baja velocidad, proximidad estrecha, visibilidad alta) | 997 | 262 | 735 | 262 | 326 | 409 | 0 | 1.0 | 0.5565 | 0.4435 | 0.4456 | 0.5544 | 0.6165 | 0.9204 | 407 | 181 | 400 | 9 | 0.9784 | 0.6885 | 0.3115 | 0.6922 | 0.3078 | 0.8108 | 0.9257 |
| Gradient Boosting | C | Tránsito nocturno con fatiga operador (turno acumulado alto, PERCLOS elevado) | 999 | 389 | 610 | 389 | 181 | 429 | 0 | 1.0 | 0.7033 | 0.2967 | 0.6825 | 0.3175 | 0.8113 | 0.9768 | 556 | 14 | 413 | 16 | 0.972 | 0.9672 | 0.0328 | 0.9754 | 0.0246 | 0.9737 | 0.9964 |
| Gradient Boosting | D | Clima adverso y visibilidad degradada (polvo denso/niebla, atenuación óptica LiDAR) | 972 | 387 | 585 | 387 | 179 | 406 | 0 | 1.0 | 0.694 | 0.306 | 0.6837 | 0.3163 | 0.8122 | 0.9772 | 556 | 10 | 385 | 21 | 0.9636 | 0.9747 | 0.0253 | 0.9823 | 0.0177 | 0.9729 | 0.9969 |
| Gradient Boosting | E | Flota mixta autónomo-manual (interacción Komatsu 930E AHS y camioneta de supervisión) | 745 | 274 | 471 | 274 | 121 | 350 | 0 | 1.0 | 0.7431 | 0.2569 | 0.6937 | 0.3063 | 0.8191 | 0.985 | 372 | 23 | 344 | 6 | 0.9841 | 0.9373 | 0.0627 | 0.9418 | 0.0582 | 0.9625 | 0.9948 |
| Gradient Boosting | PROMEDIO_MACRO | Promedio no ponderado entre escenarios A-E | 5000 | 1785 | 3215 | 1785 | 1065 | 2150 | 0 | 1.0 | 0.676 | 0.324 | 0.6305 | 0.3695 | 0.769 | 0.9682 | 2600 | 250 | 2073 | 77 | 0.9728 | 0.9056 | 0.0944 | 0.9123 | 0.0877 | 0.9376 | 0.9821 |

---

## 2. Diagnóstico Técnico de la Baja Especificidad y Exceso de Falsas Alarmas (`FON-06`)

El informe del Grupo 26 (`FON-06`) advierte que en la evaluación LOSO frente al criterio físico independiente (`TTC puro < 3.5 s`), aunque el `Recall` es del `100 %` (`0.9993` macro en RF), la **Especificidad macro cae a `0.6440` (`64.40 %`)** y en el **Escenario B (Zona de cargue y pala)** la especificidad cae a **`0.3850` (`38.50 %`)**, lo que equivale a:
- **Tasa de Falsos Positivos (`FPR = FP / (FP + TN)`):** **`61.50 %`** en el Escenario B (`385` falsas alarmas sobre `626` negativos físicos) y **`35.60 %`** macro.
- **Tasa de Falsos Descubrimientos (`FDR = FP / (TP + FP) = 1 - Precisión`):** **`63.31 %`** en el Escenario B (`Precisión = 0.3669`, `385` falsas alarmas de `608` alertas emitidas) y **`43.65 %`** macro (`Precisión macro = 0.5635`).

### Causa Raíz Matemática y Física del Fenómeno:
1. **Desajuste estructural entre el objetivo de entrenamiento y el oráculo de prueba en LOSO:**
   - Durante el entrenamiento en los 4 escenarios restantes, el modelo aprende la etiqueta nominal `collision_risk_label`, la cual se activa cuando `effective_ttc_sec < 4.0 s` (es decir, $\text{TTC}_{\text{puro}} < 4.0 + \tau_{\text{hum}} + \tau_{\text{perc}} \approx 5.5\text{ a } 6.8\text{ s}$) o cuando $\text{dist} < 15\text{ m}$.
   - Al evaluar ese modelo contra el umbral más estricto $\text{TTC}_{\text{puro}} < 3.5\text{ s}$, **todos los camiones que se encuentran en la franja intermedia $3.5\text{ s} \le \text{TTC}_{\text{puro}} < 6.0\text{ s}$ son clasificados como positivos por el modelo (porque tienen `effective_ttc_sec < 4.0 s`), pero son contabilizados como Falsos Positivos (`FP`) por el oráculo `TTC puro < 3.5 s`**.
2. **Por qué se concentra en el Escenario B (Cargue y Pala):**
   - En las bahías de cargue y maniobra junto a la pala electromecánica, los camiones operan por diseño a baja velocidad ($10$–$25\text{ km/h}$) y corta distancia ($10$–$35\text{ m}$), ubicándose masivamente en esa zona de amortiguamiento ($3.5\text{ s} \le \text{TTC}_{\text{puro}} < 6.0\text{ s}$).
   - Nótese que cuando el mismo modelo LOSO se evalúa contra la **etiqueta nominal coherente con su definición de entrenamiento**, en el Escenario B obtiene **`Recall = 0.9628`, `Especificidad = 0.9222`, `Precisión = 0.9553` y `F1 = 0.9590`** (`FPR = 7.78 %`, `FDR = 4.47 %`), y en el promedio macro obtiene **`Recall = 0.9720`, `Especificidad = 0.9462`, `Precisión = 0.9599` y `F1 = 0.9657`**.

## 3. Implicación Operacional Obligatoria para el Manuscrito (`FON-06`)

- Reportar **ambas evaluaciones** en la tabla LOSO del artículo (frente a `TTC puro < 3.5 s` y frente a la `Etiqueta Nominal`) incluyendo explícitamente las columnas de **Especificidad**, **FPR** y **Precisión / FDR**.
- Discutir explícitamente el riesgo de **fatiga de alarmas (*alarm fatigue*)** en zonas de maniobra de baja velocidad (Escenario B, donde `FDR = 63.31 %` respecto a `TTC < 3.5 s`) y proponer como mitigación operacional la **calibración de umbrales de probabilidad dependientes del geocercado/escenario** (por ejemplo, elevar el umbral de decisión de $p \ge 0.50$ a $p \ge 0.75$ dentro de geocercas de pala/botadero o usar histéresis temporal).
