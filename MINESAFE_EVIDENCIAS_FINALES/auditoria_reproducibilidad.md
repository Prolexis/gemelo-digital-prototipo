# AUDITORÍA DE REPRODUCIBILIDAD E INTEGRIDAD EXPERIMENTAL (TAREA 3)

**Proyecto:** MineSafe 3D — *Acta Montanistica Slovaca (AMS)*  
**Repositorio Auditado:** `c:\Users\Usuario\Documents\ghitub\gemelo-digital-prototipo`  
**Fecha de Verificación UTC:** `2026-10-30T02:32:50Z`  
**Estado de los Datos Originales:** **INTACTOS (0 bytes modificados en el dataset y scripts originales)**

---

## 1. LOCALIZACIÓN Y VERIFICACIÓN CRIPTOGRÁFICA DE DATOS Y SCRIPTS ORIGINALES (TAREA 3.1)

Se verificó la existencia e integridad de todos los archivos originales del pipeline experimental:

| Componente | Ruta Relativa en el Repositorio | Tamaño (Bytes) | Hash SHA-256 Verificado | Estado |
| :--- | :--- | :---: | :--- | :--- |
| **Dataset Principal** | `experiments/data/DSTM-MineSafe-2026.csv` | `421,038` | `d0ed1d7ca0a9a0c7b2225ba44fee3d16fd92ad8dbfc37a46c85d93ed5b9095c2` | **VERIFICADO INTACTO** |
| **Predicciones OOF Originales** | `experiments/results/predictions_fold_level.csv` | `204,904` | `5d19af32f6a99df85d3c6513a0e4eb5b6c16fa3616b61b82cb160582fc42402b` | **VERIFICADO INTACTO** |
| **Configuración YAML** | `experiments/config/config.yaml` | `2,776` | `f6a75152de5285bb5cb7c16a93287773f5d459f30a678838514338a54fdee84b` | **VERIFICADO (Ver Nota 1)** |
| **Generador de Datos** | `experiments/src/data/generate_dataset.py` | `16,873` | `e52dde27341de899871191d87a267c719c7ad1175ebf634a28c5030e2565c623` | **REPRODUCE 100 % EL CSV** |
| **Entrenamiento CV (RF/GBM)** | `experiments/src/models/train.py` | `7,942` | `9ef8663164d13b46421d06d0c0ee3f94bf2e792fb621e0f4ed74ee21b0961266` | **REPRODUCE 100 % OOF** |
| **Baselines (TTC y LogReg)** | `experiments/src/models/baselines.py` | `6,342` | `95c48bd74d2c7145cb1e640b181762a3ef50339971001c790d62ed18bc229111` | **VERIFICADO FUNCIONAL** |
| **Validación LOSO** | `experiments/src/validation/leave_scenario_out.py` | `5,834` | `4c830479fb2051961d4ca10b0528eb3805be183440d0f3ee5a0bc04bb5ee55be` | **VERIFICADO FUNCIONAL** |
| **Piloto Robustez Sensorial** | `experiments/src/robustness/noise_pilot.py` | `8,546` | `d1e6c90bc124c28d8d615c00208c2051b2c0a1fc2414eb13049c9607314ef864` | **VERIFICADO FUNCIONAL** |
| **Pruebas Inferenciales** | `experiments/src/stats/inferential_tests.py` | `13,816` | `078bc2961266464cf59676bf796d3a0400dc5ca40f40f0f8f4f9e22f0a54be62` | **VERIFICADO FUNCIONAL** |
| **Explicabilidad TreeSHAP** | `experiments/src/xai/shap_analysis.py` | `5,112` | `6814c8f1df1f92a35455d17207f669054fc1c09b32fd9e577e973fa3700e7fc9` | **VERIFICADO FUNCIONAL** |

> **Nota 1 sobre `experiments/config/config.yaml`:** El archivo `config.yaml` en el repositorio contiene actualmente en su línea 24 la ruta `output_csv: "experiments/data/REAL_FIELD_BENCHMARK_2026.csv"` (modificada el `2026-09-29` tras ejecutarse el script `generate_real_dataset.js`). Todos los resultados reportados en el manuscrito y en `experiments/results/` (fechados el `2026-09-22`) provienen de `experiments/data/DSTM-MineSafe-2026.csv`. Antes de publicar el repositorio definitivo, la línea 24 de `config.yaml` debe apuntar a `"experiments/data/DSTM-MineSafe-2026.csv"`.

---

## 2. VERIFICACIÓN DE MODELOS, MATRICES DE CONFUSIÓN, LOSO, ABLACIÓN, TREESHAP Y ROBUSTEZ (TAREA 3.2 Y 3.3)

### 2.1. Re-ejecución de Random Forest, Gradient Boosting y Regresión Logística (5-Fold Stratified OOF)
Al ejecutar `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)` sobre `DSTM-MineSafe-2026.csv`:
* **Alineación OOF:** Las 5,000 predicciones generadas por la re-ejecución coinciden en el **100 % de las filas** (`0` discrepancias en `prediccion_RF` y `0` discrepancias en `prediccion_GBM`, diferencia máxima de probabilidad $= 0.00000000$) con el archivo original `experiments/results/predictions_fold_level.csv`.
* **Random Forest (`seed = 42 + fold`):**
  * $\text{ROC-AUC} = 0.993844$ (Media 5-fold: $0.993856 \pm 0.001080$), $\text{PR-AUC} = 0.994757$.
  * $\text{Precision} = 0.964112$, $\text{Recall} = 0.963392$, $\text{Specificity} = 0.958674$, $\text{F1-score} = 0.963752$, $\text{Accuracy} = 0.961200$.
  * Matriz de confusión OOF: $\text{TP} = 2,579$, $\text{FP} = 96$, $\text{TN} = 2,227$, $\text{FN} = 98$ ($\text{Aciertos} = 4,806$, $\text{Errores} = 194$).
* **Gradient Boosting (`seed = 42 + fold`):**
  * $\text{ROC-AUC} = 0.994252$ (Media 5-fold: $0.994265 \pm 0.001250$), $\text{PR-AUC} = 0.995242$.
  * $\text{Precision} = 0.964965$, $\text{Recall} = 0.967127$, $\text{Specificity} = 0.959535$, $\text{F1-score} = 0.966045$, $\text{Accuracy} = 0.963600$.
  * Matriz de confusión OOF: $\text{TP} = 2,589$, $\text{FP} = 94$, $\text{TN} = 2,229$, $\text{FN} = 88$ ($\text{Aciertos} = 4,818$, $\text{Errores} = 182$).
* **Regresión Logística (`seed = 42`):**
  * $\text{ROC-AUC} = 0.995651$, $\text{PR-AUC} = 0.996316$, $\text{Precision} = 0.965043$, $\text{Recall} = 0.969369$, $\text{Specificity} = 0.959535$, $\text{F1-score} = 0.967201$, $\text{Accuracy} = 0.964800$.
  * Matriz de confusión OOF: $\text{TP} = 2,595$, $\text{FP} = 94$, $\text{TN} = 2,229$, $\text{FN} = 82$.

### 2.2. Síntesis de Verificación de LOSO, Ablación, TreeSHAP y Robustez Sensorial
Los resultados completos se encuentran en la subcarpeta `MINESAFE_EVIDENCIAS_FINALES/resultados_detallados/`:
1. **Validación LOSO (`04_RESULTADOS_LOSO.csv`):**
   * Frente a $\text{TTC}_{\text{puro}} < 3.5\text{ s}$: $\text{Recall} = 100.00\,\%$ ($1,785/1,785$, $\text{FN}=0$) tanto en RF como en GBM; $\text{Especificidad}_{\text{macro}} = 64.40\,\%$ en RF ($67.60\,\%$ en GBM). En el Escenario B (zona de cargue), la especificidad de RF cae a $38.50\,\%$ ($\text{FPR} = 61.50\,\%$, proporción de falsas alertas $\text{FDR} = 63.31\,\%$).
   * Frente a la etiqueta nominal (`collision_risk_label`): $\text{Recall}_{\text{macro}} = 97.23\,\%$ en RF ($\text{Recall}_{\text{micro}} = 96.64\,\%$) y $\text{Especificidad}_{\text{macro}} = 86.29\,\%$ ($90.56\,\%$ en GBM).
2. **Ablación y Circularidad (`05_ANALISIS_CIRCULARIDAD.csv`):**
   * Modelo Completo (A, 9 vars): RF $\text{ROC-AUC} = 0.9938$, $\text{F1} = 0.9638$.
   * Solo Distancia LiDAR + Velocidad GNSS (H, 2 vars): RF $\text{ROC-AUC} = 0.9892$, $\text{F1} = 0.9451$.
   * Sin Velocidad GNSS (C, 8 vars): RF $\text{ROC-AUC} = 0.9585$, $\text{F1} = 0.8964$.
   * Sin Distancia LiDAR (B, 8 vars): RF $\text{ROC-AUC} = 0.6412$, $\text{F1} = 0.6643$.
   * Sin Distancia LiDAR ni Velocidad GNSS (D, 7 vars): RF $\text{ROC-AUC} = 0.5800$, $\text{F1} = 0.5998$.
   * Solo Comportamiento del Operador (E1, 4 vars): RF $\text{ROC-AUC} = 0.5541$, $\text{F1} = 0.5850$.
3. **Robustez Sensorial (`06_ROBUSTEZ_SENSORES.csv`):**
   * Protocolo 1 (Reentrenado por fold en CV, `seed=42`, igual al script `noise_pilot.py`): RF Recall con 10 % de ruido $= \mathbf{0.8510}$ (10 semillas: $0.8536 \pm 0.0047$); RF Recall en condición combinada (10 % ruido + Dropout LiDAR con LOCF) $= \mathbf{0.8338}$ (10 semillas: $0.8297 \pm 0.0058$).
   * Protocolo 2 (Entrenado en datos limpios y solo evaluado en datos ruidosos, `seed=42`): RF Recall con 10 % de ruido $= \mathbf{0.8226}$ (10 semillas: $0.8287 \pm 0.0054$); RF Recall en condición combinada $= \mathbf{0.8069}$ (10 semillas: $0.8069 \pm 0.0075$).
4. **Explicabilidad TreeSHAP (`07_IMPORTANCIA_SHAP.csv`):**
   * En RF ($n = 1,000, \text{seed}=42$): 1.º `lidar_obstacle_dist_m` ($0.3366$, $61.87\,\%$), 2.º `gnss_speed_kmh` ($0.1200$, $22.06\,\%$), 3.º `gnss_ramp_grade` ($0.0198$, $3.63\,\%$), 4.º `is_autonomous` ($0.0195$, $3.58\,\%$), 5.º `op_steering_jerk_stddev` ($0.0185$, $3.39\,\%$), 6.º `op_perclos_score` ($0.0116$, $2.14\,\%$), 7.º `lidar_visibility_index` ($0.0108$, $1.98\,\%$), 8.º `turno_horas_acumuladas` ($0.0043$, $0.79\,\%$), 9.º `op_harsh_braking_count` ($0.0030$, $0.55\,\%$).

---

## 3. REGISTRO DE SEMILLAS, VERSIONES, CONFIGURACIONES Y COMANDOS (TAREA 3.4)

* **Entorno de ejecución:** Windows 11 (`10.0.26200`), Python `3.11.9` (`AMD64`).
* **Librerías exactas:** `numpy==2.4.2`, `pandas==2.3.3`, `scikit-learn==1.8.0`, `scipy==1.17.1`, `shap==0.51.0`, `joblib==1.5.3`, `PyYAML==6.0.3`, `matplotlib==3.10.8`. (Listado completo de `pip freeze` en `configuracion_entorno.txt`).
* **Semillas aleatorias registradas:**
  * Generador `generate_dataset.py`: `np.random.default_rng(42)`.
  * Partición CV `StratifiedKFold`: `n_splits=5, shuffle=True, random_state=42`.
  * Clasificadores por fold (`train.py`): `random_state = 42 + fold` (`42, 43, 44, 45, 46`).
  * Modelo final para TreeSHAP (`shap_analysis.py`): `random_state = 42` y submuestra `np.random.seed(42)`.
  * Bootstrap no paramétrico (`inferential_tests.py`): `np.random.default_rng(42)`.
* **Comando único para reproducir toda la verificación final desde la raíz del proyecto:**
  ```powershell
  python "MINESAFE_EVIDENCIAS_FINALES/scripts/ejecutar_verificacion_final.py"
  ```

---

## 4. TABLA COMPARATIVA RESUMEN: VALORES DEL ARTÍCULO VS. RESULTADOS REPRODUCIDOS (TAREA 3.5)

La tabla completa en formato CSV se encuentra en `MINESAFE_EVIDENCIAS_FINALES/resultados_reproducidos.csv`:

| Métrica / Resultado | Valor en el Manuscrito | Valor Reproducido Exacto (`DSTM-MineSafe-2026.csv`) | Diferencia | Estado |
| :--- | :---: | :---: | :---: | :--- |
| **RF ROC-AUC (OOF)** | $0.9938$ | $0.993844$ | $+0.000044$ | **IDÉNTICO A 4 DECIMALES** |
| **RF F1-score (OOF)** | $0.9638$ | $0.963752$ ($\text{Prec}=0.964112, \text{Rec}=0.963392$) | $-0.000048$ | **IDÉNTICO A 4 DECIMALES** |
| **RF Matriz de Confusión** | $\text{TP}=2579, \text{FP}=96, \text{TN}=2227, \text{FN}=98$ | $\text{TP}=2579, \text{FP}=96, \text{TN}=2227, \text{FN}=98$ | $0$ | **IDÉNTICO EXACTO** |
| **GBM ROC-AUC (OOF)** | $0.9943$ | $0.994252$ | $-0.000048$ | **IDÉNTICO A 4 DECIMALES** |
| **GBM F1-score (OOF)** | $0.9660$ | $0.966045$ ($\text{Prec}=0.964965, \text{Rec}=0.967127$) | $+0.000045$ | **IDÉNTICO A 4 DECIMALES** |
| **GBM Matriz de Confusión** | $\text{TP}=2589, \text{FP}=94, \text{TN}=2229, \text{FN}=88$ | $\text{TP}=2589, \text{FP}=94, \text{TN}=2229, \text{FN}=88$ | $0$ | **IDÉNTICO EXACTO** |
| **McNemar ($a, b, c, d$ y $p$)** | $b=40, c=52, \chi^2=1.3152, p=0.2513$ | $a=4766, b=40, c=52, d=142, \chi^2_{\text{cc}}=1.315217, p_{\text{exact}}=0.251322$ | $0.0000$ | **IDÉNTICO Y CONCILIADO AL 100 %** |
| **Wilcoxon Recall (5 folds)** | $W=2.00, p=0.1875$ | $W=2.0000, p=0.187500$ | $0.0000$ | **IDÉNTICO EXACTO** |
| **LOSO Recall ($\text{TTC}<3.5\text{ s}$)** | $100\,\%$ | $100.00\,\%$ ($1,785/1,785$) | $0.00\,\%$ | **IDÉNTICO EXACTO** |
| **LOSO Recall (Nominal)** | $97.2\,\%$ | $97.23\,\%$ macro ($96.64\,\%$ micro) | $+0.03\,\%$ | **IDÉNTICO A 1 DECIMAL** |
| **LOSO Especificidad ($\text{TTC}<3.5\text{ s}$)** | $64.4\,\%$ | $64.40\,\%$ macro ($63.64\,\%$ micro) | $0.00\,\%$ | **IDÉNTICO EXACTO** |
| **RF 10 % Ruido (Recall)** | $0.8510$ | $0.8510$ (reentrenado, `seed=42`) \| $0.8226$ (solo evaluación, `seed=42`) | $0.0000$ / $-0.0284$ | **REPRODUCIDO (PROTOCOLO DUAL)** |
| **RF Combinado (Recall)** | $0.8338$ | $0.8338$ (reentrenado, `seed=42`) \| $0.8069$ (solo evaluación, `seed=42`) | $0.0000$ / $-0.0269$ | **REPRODUCIDO (PROTOCOLO DUAL)** |

