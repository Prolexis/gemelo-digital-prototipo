# 01. INFORME MAESTRO DE AUDITORÍA CIENTÍFICA, ESTADÍSTICA Y EXPERIMENTAL — PROYECTO MINESAFE 3D

**Título del Proyecto Auditado:** MineSafe 3D — *Explainable Digital Twin Prototype for Collision Risk Prediction in Mixed Open-Pit Mining Fleets*  
**Revista Destino:** *Acta Montanistica Slovaca (AMS)*  
**Repositorio Local Auditado:** `c:\Users\Usuario\Documents\ghitub\gemelo-digital-prototipo`  
**Dataset Principal:** `experiments/data/DSTM-MineSafe-2026.csv` ($N = 5,000$ registros, 5 escenarios operacionales A–E)  
**Veredicto Global de Auditoría:** **REPRODUCIBLE EN SUS MÉTRICAS NUMÉRICAS DECLARADAS SOBRE `DSTM-MineSafe-2026.csv`, PERO CON CINCO VULNERABILIDADES METODOLÓGICAS CRÍTICAS QUE REQUIEREN CORRECCIÓN ANTES DEL ENVÍO A *ACTA MONTANISTICA SLOVACA***

---

## RESUMEN EJECUTIVO DEL DIAGNÓSTICO

1. **Verificación de Resultados Declarados (Fase 2):** Todos los indicadores cuantitativos citados en el borrador del manuscrito fueron reproducidos con exactitud matemática a 4 decimales sobre el dataset `experiments/data/DSTM-MineSafe-2026.csv`:
   * **Random Forest (5-Fold Stratified OOF):** $\text{ROC-AUC} = 0.9938$ (`0.993844`, IC 95 % Bootstrap: $[0.9923, 0.9951]$), $\text{PR-AUC} = 0.9948$, $\text{F1} = 0.9638$ (`0.963752`), $\text{Precision} = 0.9641$, $\text{Recall} = 0.9634$.
   * **Gradient Boosting (5-Fold Stratified OOF):** $\text{ROC-AUC} = 0.9943$ (`0.994252`, IC 95 % Bootstrap: $[0.9929, 0.9953]$), $\text{PR-AUC} = 0.9952$, $\text{F1} = 0.9660$ (`0.966045`), $\text{Precision} = 0.9650$, $\text{Recall} = 0.9671$.
   * **Pruebas Estadísticas Inferenciales:** McNemar exacta $p = 0.2513$ ($\chi^2_{\text{cc}} = 1.3152$, $b = 40, c = 52$); Wilcoxon de rangos con signo sobre Recall por fold $p = 0.1875$ ($W = 2.0000$).
   * **Validación Leave-One-Scenario-Out (LOSO):** En Random Forest, $\text{Recall} = 100\,\%$ (`1.0000`) frente al criterio físico independiente $\text{TTC} < 3.5\text{ s}$ ($1,785/1,785$ colisiones críticas detectadas) y $\text{Recall}_{\text{macro}} = 97.23\,\%$ (`0.972270`) frente a las etiquetas nominales del dataset; $\text{Especificidad}_{\text{macro}} = 64.40\,\%$ (`0.644039`) frente a $\text{TTC} < 3.5\text{ s}$.
   * **Piloto de Robustez Sensorial:** En Random Forest (protocolo original con reentrenamiento por fold, `seed=42`), con 10 % de ruido gaussiano $\text{Recall} = 0.8510$ y en condición combinada (10 % de ruido + LiDAR dropout con imputación LOCF) $\text{Recall} = 0.8338$.
2. **Hallazgos Críticos que Comprometen la Validez Científica si no se Declaran y Corrigen:**
   * **Hallazgo Crítico 1 — Circularidad Determinista de la Etiqueta (*Target-Feature Circularity*):** La etiqueta `collision_risk_label` en `experiments/src/data/generate_dataset.py` (líneas 178–200) se construye determinísticamente a partir de `effective_ttc_sec < 4.0` antes de sumar un ruido gaussiano moderado ($\sigma_v = 1.8\text{ km/h}$, $\sigma_d = 3.2\text{ m}$). Un modelo lineal simple (**Regresión Logística**) alcanza $\text{ROC-AUC} = 0.9957$ y $\text{F1} = 0.9672$, **superando ligeramente tanto a Random Forest como a Gradient Boosting**. Al eliminar las dos variables cinemáticas directas (`lidar_obstacle_dist_m` y `gnss_speed_kmh`), el ROC-AUC cae abruptamente de **0.9938 a 0.5800** en RF ($\Delta = -0.4138$) y de **0.9943 a 0.5723** en GBM ($\Delta = -0.4220$). Con solo variables de comportamiento del operador (`op_perclos_score`, `turno_horas_acumuladas`, `op_steering_jerk_stddev`, `op_harsh_braking_count`), el ROC-AUC cae a **0.5541** (cercano al azar de 0.50).
   * **Hallazgo Crítico 2 — Defecto Metodológico en `noise_pilot.py` (Reentrenamiento en Datos Ruidosos e Imputación LOCF Atemporal):** El script `noise_pilot.py` inyecta ruido sobre el dataframe completo y ejecuta `.fit(X_train, y_train)` dentro de cada fold CV. Es decir, **reentrena los clasificadores sobre datos ruidosos** en vez de evaluar clasificadores entrenados en limpio frente a degradación sensorial sobrevenida en operación. Cuando se evalúa el modelo entrenado en datos limpios sin reentrenar (*Train-on-Clean, Evaluate-on-Noisy*), el Recall de RF bajo 10 % de ruido cae más severamente: a **0.8226** (`seed=42`; media 10 semillas: **0.8287 ± 0.0054**, frente a **0.8510** con reentrenamiento), y en la condición combinada cae a **0.8069** (`seed=42`; media 10 semillas: **0.8069 ± 0.0075**, frente a **0.8338** con reentrenamiento). Además, el método LOCF copia valores entre filas consecutivas de un dataset transversal Monte Carlo sin continuidad temporal.
   * **Hallazgo Crítico 3 — Ruptura de Reproducibilidad en `experiments/config/config.yaml`:** El archivo `config.yaml` apunta actualmente a `experiments/data/REAL_FIELD_BENCHMARK_2026.csv` (creado el 2026-09-29 mediante `generate_real_dataset.js` con `Math.random()` sin semilla en Node.js y 20.46 % de positivos). Su nombre sugiere erróneamente datos reales de campo y su activación en `config.yaml` impide reproducir las tablas del manuscrito al ejecutar `run_all.py` sin modificar la configuración.
   * **Hallazgo Crítico 4 — Fatiga Severa por Falsas Alarmas en el Escenario B (LOSO) y Ausencia de Timestamps:** En el Escenario B (maniobras de baja velocidad y alta proximidad en zona de cargue y pala, $N = 997$), la especificidad de RF frente a $\text{TTC} < 3.5\text{ s}$ cae a **38.50 %** ($\text{FPR} = 61.50\,\%$) y la **Proporción de Falsas Alertas ($\text{FDR} = \text{FP}/(\text{TP}+\text{FP})$) alcanza el 63.31 %** (452 falsas alarmas de 714 alertas emitidas). Adicionalmente, dado que `DSTM-MineSafe-2026.csv` carece de columna temporal (`timestamp`), **no es científicamente válido estimar una tasa de alertas por hora**.
   * **Hallazgo Crítico 5 — Contradicción entre TreeSHAP y la Hipótesis H2 sobre Fatiga (`op_perclos_score`), y Sobre-declaración de "Digital Twin":** Las variables `lidar_obstacle_dist_m` (61.87 % en RF) y `gnss_speed_kmh` (22.06 % en RF) concentran el **83.93 %** de la atribución total $|\text{SHAP}|$. La variable `op_perclos_score` ocupa el **6.º lugar** en RF ($\text{mean}(|\text{SHAP}|) = 0.0116$, **2.14 %**), contradiciendo los comentarios del código que la sitúan en el Top-3. Asimismo, al no existir enlace con sensores físicos reales ni actuación bidireccional, el sistema debe clasificarse como un **"Simulation-based explainable 3D risk-prediction prototype"** (o *"Simulation-based digital-twin prototype"*).

---

## FASE 1. INVENTARIO EXHAUSTIVO DEL PROYECTO

La siguiente tabla documenta todos los activos localizados en el workspace `c:\Users\Usuario\Documents\ghitub\gemelo-digital-prototipo`, diferenciando explícitamente entre componentes **IMPLEMENTADOS Y FUNCIONALES**, **PARCIALMENTE IMPLEMENTADOS (CON LIMITACIONES)** y **SOLO DOCUMENTADOS / SIMULADOS**.

| # | Categoría | Ruta Relativa Completa | Propósito | Estado de Implementación | Dependencias Clave | Evidencia de Existencia y Observaciones |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Dataset Principal | `experiments/data/DSTM-MineSafe-2026.csv` | Dataset sintético principal del manuscrito ($N=5,000$, 12 columnas, 5 escenarios A–E, 53.54 % positivos). | **IMPLEMENTADO Y VERIFICADO** | Generado por `generate_dataset.py` (`seed=42`) | Tamaño: 423,413 bytes (2026-09-22). Reproducido byte a byte en auditoría. |
| 2 | Dataset Secundario | `experiments/data/REAL_FIELD_BENCHMARK_2026.csv` | Segundo dataset sintético ($N=5,000$, 12 columnas, 20.46 % positivos) mal etiquetado como "real field benchmark". | **IMPLEMENTADO PERO METODOLÓGICAMENTE PROBLEMÁTICO** | Generado por `generate_real_dataset.js` (Node.js `Math.random()`) | Tamaño: 332,331 bytes (2026-09-29). **No contiene datos reales de campo** y no es reproducible por carecer de semilla PRNG. |
| 3 | Configuración | `experiments/config/config.yaml` | Hiperparámetros de generación, preprocesamiento, RF, GBM y rutas de salida. | **IMPLEMENTADO (CON BUG DE RUTA)** | `pyyaml` | En L24 apunta a `REAL_FIELD_BENCHMARK_2026.csv` en lugar de `DSTM-MineSafe-2026.csv`. |
| 4 | Generador Python | `experiments/src/data/generate_dataset.py` | Generador Monte Carlo reproducible de `DSTM-MineSafe-2026.csv`. | **IMPLEMENTADO Y FUNCIONAL** | `numpy`, `pandas`, `pyyaml` | Usa `np.random.default_rng(42)`. Define la ecuación determinista `effective_ttc_sec < 4.0`. |
| 5 | Generador JS | `experiments/src/data/generate_real_dataset.js` | Script Node.js que sobrescribió el CSV el 2026-09-29. | **IMPLEMENTADO (NO REPRODUCIBLE)** | Node.js estándar (`fs`, `path`) | Usa `Math.random()` sin semilla fija. |
| 6 | Ingesta Telemetría | `experiments/src/data/ingest_real_telemetry.py` | Script para mapear logs FMS/telemetría externos al esquema de 9 variables. | **PARCIALMENTE IMPLEMENTADO (PLANTILLA)** | `pandas`, `numpy` | Si no encuentra `raw_Creator_telemetry.csv`, invoca `generate_dataset.py` como fallback. |
| 7 | Entrenamiento CV | `experiments/src/models/train.py` | Entrenamiento 5-Fold Stratified CV de RF y GBM, cálculo de predicciones OOF y curvas ROC/PR/CM. | **IMPLEMENTADO Y FUNCIONAL** | `scikit-learn`, `matplotlib`, `seaborn` | Genera `cv_metrics_summary.json` y figuras en `experiments/results/figures/`. **No guarda las predicciones OOF crudas a disco**. |
| 8 | Baselines | `experiments/src/models/baselines.py` | Evaluación de reglas cinemáticas ($\text{TTC} < 3.0, 3.5, 4.0\text{ s}$) y Regresión Logística en 5-Fold CV. | **IMPLEMENTADO Y FUNCIONAL** | `scikit-learn`, `pandas`, `numpy` | Genera `experiments/results/baselines_comparison.md`. |
| 9 | Validación LOSO | `experiments/src/validation/leave_scenario_out.py` | Validación Leave-One-Scenario-Out (5 particiones A–E) para RF frente a $\text{TTC} < 3.5\text{ s}$ y etiqueta nominal. | **IMPLEMENTADO (SOLO RF)** | `scikit-learn`, `pandas`, `numpy` | Genera `loso_validation.csv` y `loso_validation.md`. No evaluaba GBM ni reportaba TP/FP/TN/FN/FPR/FDR. |
| 10 | Piloto Robustez | `experiments/src/robustness/noise_pilot.py` | Inyección de ruido gaussiano (2 %, 5 %, 10 %), LiDAR dropout + LOCF y condición combinada. | **IMPLEMENTADO CON DEFECTO METODOLÓGICO** | `scikit-learn`, `pandas`, `numpy` | Reentrena los modelos en datos ruidosos dentro del CV (`seed=42`) y aplica LOCF sobre muestras independientes sin tiempo. |
| 11 | Pruebas Estadísticas | `experiments/src/stats/inferential_tests.py` | Prueba de McNemar OOF, Wilcoxon por fold (5 folds) y Bootstrap ($B=1,000$, IC 95 %). | **IMPLEMENTADO Y FUNCIONAL** | `scipy.stats`, `scikit-learn` | Genera `experiments/results/statistical_tests.md`. |
| 12 | Explicabilidad XAI | `experiments/src/xai/shap_analysis.py` | Cálculo de TreeSHAP sobre submuestra aleatoria de $n=1,000$ registros para RF. | **IMPLEMENTADO (SOLO RF)** | `shap`, `matplotlib`, `scikit-learn` | Genera `shap_values.csv`, `fig4_shap_summary.png` y `fig5_shap_bar.png`. |
| 13 | Orquestador | `experiments/run_all.py` | Ejecución secuencial de los 6 módulos experimentales y benchmark de latencia de inferencia. | **IMPLEMENTADO Y FUNCIONAL** | Python `subprocess`, `joblib` | Genera `latency_benchmark.md` (RF: 19.65 ms/1k muestras; GBM: 2.13 ms/1k muestras). |
| 14 | Resultados Previos | `experiments/results/*` | Métricas JSON, reportes Markdown, CSVs (`loso_validation.csv`, `robustness_noise.csv`, `shap_values.csv`) y 6 figuras PNG/PDF. | **IMPLEMENTADO (MEZCLA DE FECHAS)** | Generados por scripts de `experiments/` | Archivos del 2026-09-22 corresponden a `DSTM-MineSafe-2026.csv`; `shap_values.csv` fue re-ejecutado el 2026-09-29. |
| 15 | Laboratorio CRISP-DM | `crisp-dm-lab/{app,data_loader,data_generator,ml_model,evaluation,risk_engine,statistical_engine}.py` | Aplicación interactiva Streamlit que implementa las 6 fases CRISP-DM con persistencia en `crisp-dm-lab/models/`. | **IMPLEMENTADO Y FUNCIONAL** | `streamlit`, `plotly`, `shap`, `scikit-learn` | Único módulo que serializa modelos `.pkl` reales (`rf_model.pkl`, `gb_model.pkl`). |
| 16 | Visor 3D Frontend | `src/components/3d/Mine3DViewer.tsx` y `src/services/riskEngine.ts` | Escena 3D de mina a cielo abierto con 5 vehículos en trayectorias elípticas y HUD de telemetría. | **IMPLEMENTADO (SIMULACIÓN DETERMINISTA)** | `react`, `three`, `@react-three/fiber`, `lucide-react` | Usa cinemática paramétrica (`Math.cos/sin`) y un motor de riesgo heurístico local en TypeScript. |
| 17 | Backend API | `backend/main.py` y `backend/app/services/*` | Servidor FastAPI con endpoints REST, WebSockets (`/ws/{client_id}`), simulador en memoria e integración opcional con Redis/PostGIS/Gemini/Langflow. | **PARCIALMENTE IMPLEMENTADO (CON FALLBACKS)** | `fastapi`, `sqlalchemy`, `geoalchemy2`, `redis`, `google-generativeai` | `ml_model_service.py` busca `model.pkl` inexistente y cae en fallback determinista (`risk_engine_service.py`). |
| 18 | Entorno y Reproducibilidad | `experiments/requirements.txt`, `experiments/requirements.lock`, `CITATION.cff`, `docker-compose.yml`, `.github/workflows/reproduce.yml` | Definición de dependencias, contenedorización y CI/CD de reproducción. | **IMPLEMENTADO (CON OMISIONES)** | Docker, GitHub Actions, `pip` | `experiments/requirements.txt` omite `joblib`; no existen `LICENSE`, `pyproject.toml` ni DOI en `CITATION.cff`. |

---

## FASE 2. REPRODUCCIÓN DE RESULTADOS Y VERIFICACIÓN DEL DATASET

### 2.1. Auditoría de Integridad de Datos (`DSTM-MineSafe-2026.csv` vs. `REAL_FIELD_BENCHMARK_2026.csv`)

Se inspeccionaron programáticamente ambos archivos CSV presentes en `experiments/data/` y se contrastó `DSTM-MineSafe-2026.csv` contra la salida fresca de `generate_dstm_dataset(config)` con `seed = 42`:

* **`experiments/data/DSTM-MineSafe-2026.csv` (Dataset del Manuscrito):**
  * **Dimensiones:** Exactamente $5,000$ filas y $12$ columnas ($9$ predictores numéricos/binarios, $1$ variable objetivo `collision_risk_label`, $1$ variable de agrupación `escenario` y $1$ variable auxiliar `pure_ttc_sec`).
  * **Valores faltantes (NaN/null):** $0$ en las 12 columnas.
  * **Registros duplicados:** $0$ filas duplicadas.
  * **Reproducibilidad del generador:** Al ejecutar `generate_dstm_dataset(config)` con `seed = 42`, la diferencia máxima absoluta entre el archivo en disco y el dataframe recién generado es $0.00000000$ (**coincidencia exacta al 100 %**).
  * **Distribución por escenario y prevalencia de clase:**
    * **Escenario A** (Acarreo rampa principal): $1,287$ muestras ($25.74\,\%$), $734$ positivos ($57.03\,\%$) y $553$ negativos ($42.97\,\%$).
    * **Escenario B** (Zona de cargue y pala): $997$ muestras ($19.94\,\%$), $416$ positivos ($41.73\,\%$) y $581$ negativos ($58.27\,\%$).
    * **Escenario C** (Tránsito nocturno con fatiga): $999$ muestras ($19.98\,\%$), $572$ positivos ($57.26\,\%$) y $427$ negativos ($42.74\,\%$).
    * **Escenario D** (Clima adverso y polvo denso): $972$ muestras ($19.44\,\%$), $577$ positivos ($59.36\,\%$) y $395$ negativos ($40.64\,\%$).
    * **Escenario E** (Flota mixta autónomo-manual): $745$ muestras ($14.90\,\%$), $378$ positivos ($50.74\,\%$) y $367$ negativos ($49.26\,\%$).
    * **Total Global:** $5,000$ muestras, **$2,677$ positivos ($53.54\,\%$)** y **$2,323$ negativos ($46.46\,\%$)**.
* **Separación de Folds y Prevención de Fuga de Preprocesamiento (*Data Leakage*):**
  * En `train.py` se utiliza `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)`. Cada fold contiene exactamente $4,000$ muestras de entrenamiento y $1,000$ de validación ($535\text{–}536$ positivos y $464\text{–}465$ negativos por fold).
  * El imputador (`SimpleImputer(strategy="median")`) y el escalador (`RobustScaler()`) están encapsulados dentro de un objeto `sklearn.pipeline.Pipeline`, por lo que `.fit(X_train, y_train)` calcula la mediana y el rango intercuartílico **exclusivamente sobre el subconjunto de entrenamiento de cada fold**. No existe fuga de estadísticas de preprocesamiento entre entrenamiento y prueba.
  * Tampoco se incluye `pure_ttc_sec` ni `escenario` dentro de `FEATURE_COLS` durante el entrenamiento.

### 2.2. Tabla Maestra de Verificación de Resultados Declarados (`02_RESULTADOS_VERIFICADOS.csv`)

| Métrica / Afirmación del Manuscrito | Valor Declarado | Valor Reproducido (`DSTM-MineSafe-2026.csv`) | Diferencia | Script de Origen | Estado de Verificación |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Registros, variables, clases y escenarios** | $5,000$ reg., 5 escenarios | $5,000$ reg., 9 predictores, 2 clases (53.54 % pos.), 5 escenarios (A–E) | $0$ | `experiments/src/data/generate_dataset.py` | **VERIFICADO EXACTO** |
| **RF ROC-AUC (5-Fold OOF)** | $0.9938$ | $0.993844$ (IC 95 %: $[0.9923, 0.9951]$; Media CV: $0.993856 \pm 0.001080$) | $+0.000044$ | `experiments/src/models/train.py` | **VERIFICADO EXACTO** |
| **RF F1-score (5-Fold OOF)** | $0.9638$ | $0.963752$ (IC 95 %: $[0.9565, 0.9708]$; Media CV: $0.963765 \pm 0.006646$) | $-0.000048$ | `experiments/src/models/train.py` | **VERIFICADO EXACTO** |
| **RF Precision / Recall / PR-AUC (OOF)** | $0.9641$ / $0.9634$ / $0.9948$ | $\text{Prec}=0.964112$, $\text{Rec}=0.963392$, $\text{PR-AUC}=0.994757$ ($\text{TP}=2579, \text{FP}=96, \text{TN}=2227, \text{FN}=98$) | $< 0.00005$ | `experiments/src/models/train.py` | **VERIFICADO EXACTO** |
| **GBM ROC-AUC (5-Fold OOF)** | $0.9943$ | $0.994252$ (IC 95 %: $[0.9929, 0.9953]$; Media CV: $0.994265 \pm 0.001250$) | $-0.000048$ | `experiments/src/models/train.py` | **VERIFICADO EXACTO** |
| **GBM F1-score (5-Fold OOF)** | $0.9660$ | $0.966045$ (IC 95 %: $[0.9591, 0.9729]$; Media CV: $0.966052 \pm 0.002806$) | $+0.000045$ | `experiments/src/models/train.py` | **VERIFICADO EXACTO** |
| **GBM Precision / Recall / PR-AUC (OOF)** | $0.9650$ / $0.9671$ / $0.9952$ | $\text{Prec}=0.964965$, $\text{Rec}=0.967127$, $\text{PR-AUC}=0.995242$ ($\text{TP}=2589, \text{FP}=94, \text{TN}=2229, \text{FN}=88$) | $< 0.00005$ | `experiments/src/models/train.py` | **VERIFICADO EXACTO** |
| **Prueba de McNemar (RF vs. GBM OOF)** | $p = 0.2513$ | $p_{\text{exact}} = 0.251322$ ($\chi^2_{\text{cc}} = 1.315217$, $p_{\chi^2} = 0.251452$; $a=4766, b=40, c=52, d=142$) | $+0.000022$ | `experiments/src/stats/inferential_tests.py` | **VERIFICADO EXACTO** |
| **Prueba de Wilcoxon (Recall en 5 folds)** | $p = 0.1875$ | $p = 0.187500$ ($W = 2.0000$; en ROC-AUC $W = 4.0000, p = 0.4375$) | $0.000000$ | `experiments/src/stats/inferential_tests.py` | **VERIFICADO (NOTA: $p_{\min}=0.0625$ con $K=5$)** |
| **LOSO Recall vs. $\text{TTC} < 3.5\text{ s}$** | $100\,\%$ | $100.00\,\%$ ($1.000000$) en los 5 escenarios A–E tanto en RF como en GBM ($\text{TP}=1785, \text{FN}=0$) | $0.00\,\%$ | `experiments/src/validation/leave_scenario_out.py` | **VERIFICADO EXACTO** |
| **LOSO Recall vs. Etiquetas Nominales** | $97.2\,\%$ | $97.23\,\%$ ($0.972270$ macro en RF; $96.64\,\%$ micro global con $\text{TP}=2587, \text{FN}=90$) | $+0.03\,\%$ | `experiments/src/validation/leave_scenario_out.py` | **VERIFICADO EXACTO** |
| **LOSO Especificidad Macro vs. $\text{TTC} < 3.5\text{ s}$** | $64.4\,\%$ | $64.40\,\%$ ($0.644039$ macro en RF; $63.64\,\%$ micro global con $\text{TN}=2046, \text{FP}=1169$) | $+0.004\,\%$ | `experiments/src/validation/leave_scenario_out.py` | **VERIFICADO (COLAPSO EN ESCENARIO B: 38.50 %)** |
| **RF con 10 % de ruido GNSS/LiDAR (Recall)** | $0.8510$ | $0.851000$ (Reentrenado en CV, `seed=42`; 10 semillas: $0.8536 \pm 0.0047$) \| **$0.822600$ (Entrenado en limpio, solo evaluado en ruido, `seed=42`; 10 semillas: $0.8287 \pm 0.0054$)** | $0.0000$ (reentrenado) / $-0.0284$ (solo eval.) | `experiments/src/robustness/noise_pilot.py` | **VERIFICADO CON DEFECTO METODOLÓGICO** |
| **RF en condición combinada (10 % + Dropout)** | $0.8338$ | $0.833800$ (Reentrenado en CV, `seed=42`; 10 semillas: $0.8297 \pm 0.0058$) \| **$0.806900$ (Entrenado en limpio, solo evaluado en ruido, `seed=42`; 10 semillas: $0.8069 \pm 0.0075$)** | $0.0000$ (reentrenado) / $-0.0269$ (solo eval.) | `experiments/src/robustness/noise_pilot.py` | **VERIFICADO CON DEFECTO METODOLÓGICO** |

---

## FASE 3. ANÁLISIS DE CIRCULARIDAD Y LABEL LEAKAGE

### 3.1. Disección Matemática de la Construcción de la Variable Objetivo (`collision_risk_label`)

La inspección del código fuente en `experiments/src/data/generate_dataset.py` (líneas 163–209) demuestra que la etiqueta binaria `collision_risk_label` **no proviene de simulaciones físicas de cuerpos rígidos ni de registros de incidentes históricos**, sino de una regla algebraica cerrada evaluada sobre las variables latentes pre-ruido:

1. **Cálculo del TTC cinemático latente (sin ruido):**
   $$\text{TTC}_{\text{puro}} = \frac{d_{\text{LiDAR, base}}}{\max\left(\frac{v_{\text{GNSS, base}} \times 1000}{3600},\; 0.5\right)}$$
2. **Modulación determinista por tiempo de reacción y percepción (`effective_ttc_sec`):**
   $$\Delta t_{\text{humano}} = \begin{cases} 1.2 + 2.5 \cdot \text{op\_perclos\_score} + 0.06 \cdot \max(0,\; \text{gnss\_ramp\_grade} - 7.0), & \text{si } \text{is\_autonomous} = 0 \\ 0.35, & \text{si } \text{is\_autonomous} = 1 \end{cases}$$
   $$\Delta t_{\text{percepción}} = 0.5 \cdot (1.0 - \text{lidar\_visibility\_index})$$
   $$\text{TTC}_{\text{efectivo}} = \text{TTC}_{\text{puro}} - (\Delta t_{\text{humano}} + \Delta t_{\text{percepción}})$$
3. **Regla de etiquetado (`collision_risk_label`):**
   $$y = \mathbb{I}\Big(\underbrace{\text{TTC}_{\text{efectivo}} < 4.0\text{ s}}_{\text{99.18 \% de concordancia}} \;\lor\; (d_{\text{LiDAR, base}} < 15.0\text{ m} \land v_{\text{GNSS, base}} > 15.0\text{ km/h}) \;\lor\; (d_{\text{LiDAR, base}} < 8.0\text{ m})\Big)$$
4. **Adición post-hoc de ruido gaussiano a dos predictores:**
   $$v_{\text{GNSS, obs}} = \max(0,\; v_{\text{GNSS, base}} + \mathcal{N}(0, 1.8^2)), \qquad d_{\text{LiDAR, obs}} = \max(0.5,\; d_{\text{LiDAR, base}} + \mathcal{N}(0, 3.2^2))$$

**Diagnóstico de Circularidad:**
* La condición $\text{TTC}_{\text{efectivo}} < 4.0\text{ s}$ por sí sola explica el **99.18 %** ($4,959/5,000$) de las etiquetas del dataset.
* Tres de las nueve variables (`turno_horas_acumuladas`, `op_steering_jerk_stddev` y `op_harsh_braking_count`) **no aparecen en absoluto en la ecuación generadora de la etiqueta**. Su única relación con `collision_risk_label` es espuria/indirecta a través de las distribuciones paramétricas de cada escenario (por ejemplo, el Escenario C tiene mayor media de `turno_horas_acumuladas` y una prevalencia positiva de 57.26 % frente al 41.73 % del Escenario B).
* Al evaluar la ecuación exacta del generador directamente sobre las variables ruidosas observadas (Experimento `F_Oraculo_Formula_Generador_Ruidosa`), se obtiene **$\text{F1} = 0.9691$ y $\text{Accuracy} = 96.70\,\%$**, superando tanto a Random Forest ($\text{F1} = 0.9638$) como a Gradient Boosting ($\text{F1} = 0.9660$). Esto demuestra que el techo teórico de Bayes en este dataset sintético (~96.9 % F1) está determinado exclusivamente por la varianza del ruido gaussiano ($\sigma_v = 1.8\text{ km/h}, \sigma_d = 3.2\text{ m}$) inyectado tras definir la etiqueta.

### 3.2. Resultados de los Experimentos de Ablación y Baselines (A–H) (`05_ANALISIS_CIRCULARIDAD.csv`)

Todos los modelos fueron evaluados bajo las **mismas particiones exactas de validación cruzada estratificada de 5 folds (`seed=42`)** sin ajustar hiperparámetros sobre los conjuntos de prueba:

| ID Experimento | Configuración de Variables ($p$) | Modelo | ROC-AUC | $\Delta\text{AUC}$ vs. A | PR-AUC | Precision | Recall | Especificidad | F1-score | $\Delta\text{F1}$ vs. A | FPR | FDR (Falsas Alertas) |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **F (TTC < 3.0 s)** | $p=2$: `dist`, `speed` | Regla Física ($\text{TTC}<3.0\text{ s}$) | $0.9868$ | $-0.0071$ | $0.9896$ | $0.9993$ | $0.5648$ | $0.9996$ | $0.7217$ | $-0.2420$ | $0.04\,\%$ | $0.07\,\%$ |
| **F (TTC < 3.5 s)** | $p=2$: `dist`, `speed` | Regla Física ($\text{TTC}<3.5\text{ s}$) | $0.9868$ | $-0.0071$ | $0.9896$ | $0.9983$ | $0.6657$ | $0.9987$ | $0.7987$ | $-0.1650$ | $0.13\,\%$ | $0.17\,\%$ |
| **F (TTC < 4.0 s)** | $p=2$: `dist`, `speed` | Regla Física ($\text{TTC}<4.0\text{ s}$) | $0.9868$ | $-0.0071$ | $0.9896$ | $0.9946$ | $0.7568$ | $0.9953$ | $0.8596$ | $-0.1042$ | $0.47\,\%$ | $0.54\,\%$ |
| **F (TTC < 5.0 s)** | $p=2$: `dist`, `speed` | Regla Física ($\text{TTC}<5.0\text{ s}$) | $0.9868$ | $-0.0071$ | $0.9896$ | $0.9734$ | $0.8872$ | $0.9720$ | $0.9283$ | $-0.0355$ | $2.80\,\%$ | $2.66\,\%$ |
| **F (Oráculo Gen.)** | $p=6$: Ecuación del generador | Fórmula Generador (Inputs Ruidosos) | $0.9918$ | $-0.0020$ | $0.9940$ | $0.9725$ | $0.9656$ | $0.9686$ | **$0.9691$** | **$+0.0053$** | $3.14\,\%$ | $2.75\,\%$ |
| **A (Completo)** | $p=9$: Todas las variables | **Random Forest** | $0.9938$ | $0.0000$ | $0.9948$ | $0.9641$ | $0.9634$ | $0.9587$ | $0.9638$ | $0.0000$ | $4.13\,\%$ | $3.59\,\%$ |
| **A (Completo)** | $p=9$: Todas las variables | **Gradient Boosting** | $0.9943$ | $0.0000$ | $0.9952$ | $0.9650$ | $0.9671$ | $0.9595$ | $0.9660$ | $0.0000$ | $4.05\,\%$ | $3.50\,\%$ |
| **G-A (Completo)** | $p=9$: Todas las variables | **Logistic Regression** | **$0.9957$** | **$+0.0018$** | **$0.9963$** | **$0.9650$** | **$0.9694$** | **$0.9595$** | **$0.9672$** | **$+0.0034$** | $4.05\,\%$ | $3.50\,\%$ |
| **H (Solo TTC vars)** | $p=2$: Solo `dist` + `speed` | **Random Forest** | $0.9892$ | $-0.0046$ | $0.9898$ | $0.9451$ | $0.9451$ | $0.9367$ | $0.9451$ | $-0.0187$ | $6.33\,\%$ | $5.49\,\%$ |
| **H (Solo TTC vars)** | $p=2$: Solo `dist` + `speed` | **Gradient Boosting** | $0.9898$ | $-0.0045$ | $0.9914$ | $0.9440$ | $0.9503$ | $0.9350$ | $0.9471$ | $-0.0189$ | $6.50\,\%$ | $5.60\,\%$ |
| **G-H (Solo TTC)** | $p=2$: Solo `dist` + `speed` | **Logistic Regression** | $0.9901$ | $-0.0055$ | $0.9915$ | $0.9419$ | $0.9511$ | $0.9324$ | $0.9465$ | $-0.0207$ | $6.76\,\%$ | $5.81\,\%$ |
| **C (Sin Velocidad)** | $p=8$: Sin `gnss_speed_kmh` | **Random Forest** | $0.9585$ | $-0.0353$ | $0.9620$ | $0.8867$ | $0.9062$ | $0.8666$ | $0.8964$ | $-0.0674$ | $13.34\,\%$ | $11.33\,\%$ |
| **C (Sin Velocidad)** | $p=8$: Sin `gnss_speed_kmh` | **Gradient Boosting** | $0.9595$ | $-0.0348$ | $0.9636$ | $0.8845$ | $0.9096$ | $0.8631$ | $0.8969$ | $-0.0692$ | $13.69\,\%$ | $11.55\,\%$ |
| **G-C (Sin Veloc.)** | $p=8$: Sin `gnss_speed_kmh` | **Logistic Regression** | $0.9437$ | $-0.0520$ | $0.9478$ | $0.8605$ | $0.9006$ | $0.8317$ | $0.8801$ | $-0.0871$ | $16.83\,\%$ | $13.95\,\%$ |
| **B (Sin Distancia)** | $p=8$: Sin `lidar_obstacle_dist_m` | **Random Forest** | $0.6412$ | $-0.3526$ | $0.6397$ | $0.6261$ | $0.7075$ | $0.5131$ | $0.6643$ | $-0.2994$ | $48.69\,\%$ | $37.39\,\%$ |
| **B (Sin Distancia)** | $p=8$: Sin `lidar_obstacle_dist_m` | **Gradient Boosting** | $0.6352$ | $-0.3591$ | $0.6331$ | $0.6138$ | $0.7385$ | $0.4645$ | $0.6704$ | $-0.2956$ | $53.55\,\%$ | $38.62\,\%$ |
| **G-B (Sin Dist.)** | $p=8$: Sin `lidar_obstacle_dist_m` | **Logistic Regression** | $0.6542$ | $-0.3415$ | $0.6522$ | $0.6298$ | $0.6959$ | $0.5286$ | $0.6612$ | $-0.3060$ | $47.14\,\%$ | $37.02\,\%$ |
| **D (Sin Dist. ni Vel.)**| $p=7$: Sin `dist` ni `speed` | **Random Forest** | **$0.5800$** | **$-0.4138$** | $0.6008$ | $0.5910$ | $0.6089$ | $0.5144$ | **$0.5998$** | **$-0.3639$** | $48.56\,\%$ | $40.90\,\%$ |
| **D (Sin Dist. ni Vel.)**| $p=7$: Sin `dist` ni `speed` | **Gradient Boosting** | **$0.5723$** | **$-0.4220$** | $0.5907$ | $0.5824$ | $0.6638$ | $0.4516$ | **$0.6205$** | **$-0.3456$** | $54.84\,\%$ | $41.76\,\%$ |
| **G-D (Sin Dist/Vel)**| $p=7$: Sin `dist` ni `speed` | **Logistic Regression** | $0.6002$ | $-0.3955$ | $0.6084$ | $0.5955$ | $0.7068$ | $0.4468$ | $0.6464$ | $-0.3208$ | $55.32\,\%$ | $40.45\,\%$ |
| **E1 (Solo Operador)** | $p=4$: `perclos`, `turno`, `jerk`, `frenadas` | **Random Forest** | **$0.5541$** | **$-0.4398$** | $0.5714$ | $0.5681$ | $0.6029$ | $0.4718$ | **$0.5850$** | **$-0.3788$** | $52.82\,\%$ | $43.19\,\%$ |
| **E1 (Solo Operador)** | $p=4$: `perclos`, `turno`, `jerk`, `frenadas` | **Gradient Boosting** | **$0.5484$** | **$-0.4459$** | $0.5686$ | $0.5666$ | $0.6892$ | $0.3926$ | $0.6219$ | $-0.3441$ | $60.74\,\%$ | $43.34\,\%$ |
| **E2 (Oper. + Autón.)**| $p=5$: E1 + `is_autonomous` | **Random Forest** | $0.5533$ | $-0.4405$ | $0.5727$ | $0.5642$ | $0.6070$ | $0.4598$ | $0.5848$ | $-0.3789$ | $54.03\,\%$ | $43.58\,\%$ |

**Conclusiones Científicas de la Fase 3:**
1. **Con solo 2 variables (`lidar_obstacle_dist_m` y `gnss_speed_kmh`, Experimento H), Random Forest ya alcanza $\text{ROC-AUC} = 0.9892$ y $\text{F1} = 0.9451$.** Las 7 variables restantes aportan únicamente $+0.0046$ en ROC-AUC y $+0.0187$ en F1-score (correspondiente al ajuste del retardo humano y de visibilidad cerca de la frontera $\text{TTC} \approx 4.0\text{ s}$).
2. **Al retirar `lidar_obstacle_dist_m` (Experimento B), el ROC-AUC colapsa en $-35.26$ puntos porcentuales (de $0.9938$ a $0.6412$).** Al retirar tanto distancia como velocidad (Experimento D), el modelo pierde toda capacidad discriminativa útil ($\text{ROC-AUC} = 0.5800$, especificidad $= 51.44\,\%$).
3. **La Regresión Logística ($\text{ROC-AUC} = 0.9957$, $\text{F1} = 0.9672$) supera ligeramente a RF y GBM en el modelo completo.** ¿Por qué? Porque la condición generadora $d / (v/3.6) - \text{lag}(\text{PERCLOS}, \text{grade}, \text{vis}, \text{auto}) < 4.0$ es equivalente, para velocidades positivas, a la desigualdad estrictamente lineal en los predictores:
   $$d_{\text{LiDAR}} - \frac{v_{\text{GNSS}}}{3.6}\Big(4.0 + \text{lag}(\text{PERCLOS}, \text{grade}, \text{vis}, \text{auto})\Big) < 0$$
   Por tanto, un hiperplano lineal aproxima de forma casi óptima la frontera suave inducida por el ruido gaussiano, mientras que los árboles de decisión ortogonales (axis-aligned splits) de RF y GBM sufren un ligero sesgo de escalonamiento al aproximar una frontera oblicua.

---

## FASE 4. GENERALIZACIÓN LEAVE-ONE-SCENARIO-OUT (LOSO) Y ANÁLISIS DE FALSAS ALARMAS

### 4.1. Desglose Completo por Escenario para Random Forest y Gradient Boosting (`04_RESULTADOS_LOSO.csv`)

A continuación se presenta la matriz completa de resultados LOSO diferenciando rigurosamente entre la evaluación frente al **criterio cinemático independiente ($\text{TTC}_{\text{puro}} < 3.5\text{ s}$)** y frente a la **etiqueta nominal del dataset (`collision_risk_label`)**, así como entre **False Positive Rate ($\text{FPR} = \text{FP}/(\text{FP}+\text{TN})$)** y **Proporción de Falsas Alertas / False Discovery Rate ($\text{FDR} = \text{FP}/(\text{TP}+\text{FP})$)**:

#### A. Evaluación frente al Criterio Físico Independiente ($\text{TTC}_{\text{puro}} < 3.5\text{ s}$)

| Modelo | Escenario | $N$ Prueba | Positivos Reales | Negativos Reales | TP | FP | TN | FN | Alertas ($\text{TP}+\text{FP}$) | Precision | Recall | Specificity | F1-score | ROC-AUC | FPR ($\frac{\text{FP}}{\text{FP}+\text{TN}}$) | Proporción Falsas Alertas ($\frac{\text{FP}}{\text{TP}+\text{FP}}$) | FNR |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **RF** | **A** (Rampa alta vel.) | $1,287$ | $473$ | $814$ | $473$ | $203$ | $611$ | $0$ | $676$ | $0.6997$ | **$1.0000$** | $0.7506$ | $0.8233$ | $0.9800$ | $24.94\,\%$ | $30.03\,\%$ | $0.00\,\%$ |
| **RF** | **B** (Zona cargue/pala) | $997$ | $262$ | $735$ | $262$ | **$452$** | $283$ | $0$ | **$714$** | **$0.3669$** | **$1.0000$** | **$0.3850$** | **$0.5369$** | $0.8898$ | **$61.50\,\%$** | **$63.31\,\%$** | $0.00\,\%$ |
| **RF** | **C** (Nocturno/fatiga) | $999$ | $389$ | $610$ | $389$ | $189$ | $421$ | $0$ | $578$ | $0.6730$ | **$1.0000$** | $0.6902$ | $0.8046$ | $0.9739$ | $30.98\,\%$ | $32.70\,\%$ | $0.00\,\%$ |
| **RF** | **D** (Clima adverso) | $972$ | $387$ | $585$ | $387$ | $204$ | $381$ | $0$ | $591$ | $0.6548$ | **$1.0000$** | $0.6513$ | $0.7914$ | $0.9463$ | $34.87\,\%$ | $34.52\,\%$ | $0.00\,\%$ |
| **RF** | **E** (Flota mixta) | $745$ | $274$ | $471$ | $274$ | $121$ | $350$ | $0$ | $395$ | $0.6937$ | **$1.0000$** | $0.7431$ | $0.8191$ | $0.9625$ | $25.69\,\%$ | $30.63\,\%$ | $0.00\,\%$ |
| **RF** | **PROMEDIO MACRO** | $5,000$ | $1,785$ | $3,215$ | $1,785$ | $1,169$ | $2,046$ | $0$ | $2,954$ | $0.6176$ | **$1.0000$** | **$0.6440$** | $0.7551$ | $0.9505$ | $35.60\,\%$ | $38.24\,\%$ | $0.00\,\%$ |
| **RF** | **MICRO GLOBAL** | $5,000$ | $1,785$ | $3,215$ | $1,785$ | $1,169$ | $2,046$ | $0$ | $2,954$ | $0.6043$ | **$1.0000$** | $0.6364$ | $0.7533$ | $0.9568$ | $36.36\,\%$ | $39.57\,\%$ | $0.00\,\%$ |
| **GBM** | **PROMEDIO MACRO** | $5,000$ | $1,785$ | $3,215$ | $1,785$ | $1,065$ | $2,150$ | $0$ | $2,850$ | $0.6305$ | **$1.0000$** | **$0.6760$** | $0.7690$ | $0.9682$ | $32.40\,\%$ | $36.95\,\%$ | $0.00\,\%$ |

#### B. Evaluación frente a la Etiqueta Nominal del Dataset (`collision_risk_label`)

| Modelo | Escenario | $N$ Prueba | Positivos Reales | Negativos Reales | TP | FP | TN | FN | Alertas ($\text{TP}+\text{FP}$) | Precision | Recall | Specificity | F1-score | ROC-AUC | FPR ($\frac{\text{FP}}{\text{FP}+\text{TN}}$) | Proporción Falsas Alertas ($\frac{\text{FP}}{\text{TP}+\text{FP}}$) | FNR |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **RF** | **A** (Rampa alta vel.) | $1,287$ | $734$ | $553$ | $672$ | $4$ | $549$ | $62$ | $676$ | $0.9941$ | $0.9155$ | $0.9928$ | $0.9532$ | $0.9969$ | $0.72\,\%$ | $0.59\,\%$ | $8.45\,\%$ |
| **RF** | **B** (Zona cargue/pala) | $997$ | $416$ | $581$ | $416$ | **$298$** | $283$ | $0$ | **$714$** | **$0.5826$** | **$1.0000$** | **$0.4871$** | **$0.7363$** | $0.8995$ | **$51.29\,\%$** | **$41.74\,\%$** | $0.00\,\%$ |
| **RF** | **C** (Nocturno/fatiga) | $999$ | $572$ | $427$ | $560$ | $18$ | $409$ | $12$ | $578$ | $0.9689$ | $0.9790$ | $0.9578$ | $0.9739$ | $0.9959$ | $4.22\,\%$ | $3.11\,\%$ | $2.10\,\%$ |
| **RF** | **D** (Clima adverso) | $972$ | $577$ | $395$ | $567$ | $24$ | $371$ | $10$ | $591$ | $0.9594$ | $0.9827$ | $0.9392$ | $0.9709$ | $0.9952$ | $6.08\,\%$ | $4.06\,\%$ | $1.73\,\%$ |
| **RF** | **E** (Flota mixta) | $745$ | $378$ | $367$ | $372$ | $23$ | $344$ | $6$ | $395$ | $0.9418$ | $0.9841$ | $0.9373$ | $0.9625$ | $0.9925$ | $6.27\,\%$ | $5.82\,\%$ | $1.59\,\%$ |
| **RF** | **PROMEDIO MACRO** | $5,000$ | $2,677$ | $2,323$ | $2,587$ | $367$ | $1,956$ | $90$ | $2,954$ | $0.8893$ | **$0.9723$** | $0.8629$ | $0.9194$ | $0.9760$ | $13.71\,\%$ | $11.07\,\%$ | $2.77\,\%$ |
| **RF** | **MICRO GLOBAL** | $5,000$ | $2,677$ | $2,323$ | $2,587$ | $367$ | $1,956$ | $90$ | $2,954$ | $0.8758$ | $0.9664$ | $0.8420$ | $0.9188$ | $0.9813$ | $15.80\,\%$ | $12.42\,\%$ | $3.36\,\%$ |
| **GBM** | **PROMEDIO MACRO** | $5,000$ | $2,677$ | $2,323$ | $2,600$ | $250$ | $2,073$ | $77$ | $2,850$ | $0.9123$ | **$0.9728$** | **$0.9056$** | **$0.9376$** | $0.9821$ | $9.44\,\%$ | $8.77\,\%$ | $2.72\,\%$ |

### 4.2. Diagnóstico Operacional del Escenario B y Validez de la Tasa Temporal de Alertas

1. **Imposibilidad Científica de Estimar "Alertas por Hora":**
   * Se verificó que `DSTM-MineSafe-2026.csv` **no contiene ninguna columna de tiempo (`timestamp`, `dt`, ni identificador de viaje/vehículo)**. Sus $5,000$ registros son realizaciones Monte Carlo independientes e idénticamente distribuidas (i.i.d.) sin frecuencia de muestreo asociada. Por consiguiente, **cualquier intento de convertir las $2,954$ alertas LOSO en una tasa de "alertas por hora" carece de validez científica** y no debe incluirse en el manuscrito.
2. **Causas del Colapso de Especificidad en el Escenario B (Fatiga por Alarmas):**
   * En los escenarios A, C, D y E (donde se entrena el modelo cuando se deja fuera B), las distancias LiDAR cortas ($d < 25\text{ m}$) ocurren casi exclusivamente a velocidades medias/altas ($25\text{–}48\text{ km/h}$), lo que implica colisión inminente.
   * En cambio, el **Escenario B** modela maniobras en la zona de cargue y pala con velocidades muy bajas ($\mu_v = 11.5\text{ km/h}$) y proximidad estrecha ($\mu_d = 16.0\text{ m}$). Como los árboles de Random Forest entrenados en $\{\text{A, C, D, E}\}$ asignaron un peso dominante a las particiones de distancia corta ($d < 20\text{ m}$), al ser evaluados en el Escenario B disparan **714 alertas en 997 observaciones (71.6 % del tiempo)**.
   * Frente al umbral físico $\text{TTC} < 3.5\text{ s}$, **el 63.31 % de todas las alertas en el Escenario B son falsas alarmas ($\text{FDR} = 452/714$)** y el **61.50 % de las maniobras seguras generan una alarma espuria ($\text{FPR} = 452/735$)**. Incluso frente a la etiqueta nominal del generador, el **41.74 % de las alertas en B son falsas ($\text{FDR} = 298/714$, $\text{FPR} = 51.29\,\%$)**. En una operación minera real, esto induciría **fatiga aguda por alarmas (*alarm fatigue*)**, llevando al operador de pala/camión a ignorar o desactivar el sistema CAS (*Collision Avoidance System*).
   * Además, parte de la caída de especificidad frente a $\text{TTC} < 3.5\text{ s}$ en todos los escenarios se debe a un **desajuste de definición de objetivo (*target mismatch*)**: el modelo fue entrenado para predecir $\text{TTC}_{\text{efectivo}} < 4.0\text{ s}$ (que incluye retardos humanos de $1.2\text{–}2.5\text{ s}$, equivalente a $\text{TTC}_{\text{puro}} \lesssim 5.2\text{–}6.5\text{ s}$), pero en LOSO se evalúa contra $\text{TTC}_{\text{puro}} < 3.5\text{ s}$. Toda instancia con $3.5\text{ s} \le \text{TTC}_{\text{puro}} < 5.5\text{ s}$ es clasificada correctamente como positiva según la ley de entrenamiento, pero contabilizada como Falso Positivo frente a $\text{TTC}_{\text{puro}} < 3.5\text{ s}$.

---

## FASE 5. ROBUSTEZ ANTE FALLOS DE SENSORES

### 5.1. Respuestas Técnicas a los 8 Puntos de Auditoría de Robustez

1. **Variables alteradas:** En `experiments/src/robustness/noise_pilot.py`, el ruido gaussiano altera únicamente **4 de las 9 variables**: `gnss_speed_kmh` y `gnss_ramp_grade` (grupo GNSS), y `lidar_obstacle_dist_m` y `lidar_visibility_index` (grupo LiDAR). El evento de *LiDAR dropout* altera exclusivamente **2 variables**: `lidar_obstacle_dist_m` y `lidar_visibility_index`. Las 5 variables restantes (`op_perclos_score`, `turno_horas_acumuladas`, `op_steering_jerk_stddev`, `op_harsh_braking_count`, `is_autonomous`) permanecen intactas.
2. **Distribución de ruido utilizada:** Ruido gaussiano aditivo independiente $\epsilon_j \sim \mathcal{N}(0, \sigma_j^2)$ con recorte físico posterior (`np.clip`): velocidades $\ge 0$, pendientes $\in [-20, 20]$, distancias LiDAR $\ge 0.1\text{ m}$ e índice de visibilidad $\in [0, 1]$.
3. **Cálculo de la magnitud del ruido:** La desviación estándar inyectada se calcula como porcentaje del **rango empírico $(\max - \min)$ de cada variable en el dataset completo**:
   $$\sigma_j = \left(\frac{\text{noise\_pct}}{100}\right) \times (\max(X_j) - \min(X_j))$$
   En `DSTM-MineSafe-2026.csv`, los rangos empíricos son:
   * `gnss_speed_kmh` ($\text{rango} = 62.66\text{ km/h}$): $\sigma_{2\%} = 1.25\text{ km/h}$, $\sigma_{5\%} = 3.13\text{ km/h}$, $\sigma_{10\%} = 6.27\text{ km/h}$.
   * `gnss_ramp_grade` ($\text{rango} = 15.86\,\%$): $\sigma_{2\%} = 0.32\,\%$, $\sigma_{5\%} = 0.79\,\%$, $\sigma_{10\%} = 1.59\,\%$.
   * `lidar_obstacle_dist_m` ($\text{rango} = 136.68\text{ m}$): $\sigma_{2\%} = 2.73\text{ m}$, $\sigma_{5\%} = 6.83\text{ m}$, $\sigma_{10\%} = 13.67\text{ m}$.
   * `lidar_visibility_index` ($\text{rango} = 0.90$): $\sigma_{2\%} = 0.018$, $\sigma_{5\%} = 0.045$, $\sigma_{10\%} = 0.090$.
4. **Número de repeticiones ejecutadas en el estudio original:** **Una sola ejecución (`seed = 42`)** sin estimación de varianza inter-semilla. En esta auditoría ejecutamos **10 repeticiones independientes (`seeds = 42..51`)**.
5. **¿Se reentrenaron los modelos o solo se evaluaron? (Hallazgo Metodológico Clave):**
   * En el script original `noise_pilot.py` (líneas 74–120), la función `evaluate_condition(df_cond, ...)` recibe el dataframe **ya contaminado con ruido** y ejecuta `rf_pipe.fit(X_train, y_train)` y `gbm_pipe.fit(X_train, y_train)` dentro de cada fold CV. Es decir, **los modelos fueron reentrenados sobre datos ruidosos** en cada condición.
   * En un escenario real de fallo sensorial en mina, el modelo en producción fue entrenado previamente con datos nominales calibrados y sufre degradación sobrevenida durante la inferencia (**Solo Evaluación / *Train-on-Clean, Evaluate-on-Noisy***).
6. **Cambio en el Recall (Reentrenado vs. Solo Evaluación):**
   * Bajo el protocolo original (**Reentrenado en ruido**, `seed=42`), el Recall de RF baja de $0.9634$ a **$0.9384$ (2 %)**, **$0.9044$ (5 %)**, **$0.8510$ (10 %)**, **$0.9387$ (Dropout LiDAR)** y **$0.8338$ (Combinado 10 % + Dropout)**.
   * Bajo el protocolo operacional realista (**Entrenado en limpio, solo evaluado en ruido**, `seed=42`), la caída de Recall en 10 % de ruido y condición combinada es **2.84 y 2.69 puntos porcentuales más severa**: baja a **$0.8226$ (10 % de ruido; media 10 semillas: $0.8287 \pm 0.0054$)** y a **$0.8069$ (Combinado; media 10 semillas: $0.8069 \pm 0.0075$)**. Esto ocurre porque al no reentrenarse con ruido, los umbrales de distancia aprendidos en limpio quedan sesgados frente a la dispersión adicional de $\sigma_d = 13.67\text{ m}$.
   * *Nota sobre discrepancia interna del código:* En `noise_pilot.py` (línea 156), un texto hardcodeado afirma que el Recall de RF es `90.59% (5% noise) and 85.06% (10% noise)`, contradiciendo su propia tabla generada (`90.44%` y `85.10%`).
7. **Cambio en la Precisión:**
   * En el protocolo reentrenado (`seed=42`), la Precisión de RF cae de $0.9641$ a **$0.9461$ (2 %)**, **$0.9129$ (5 %)**, **$0.8522$ (10 %)**, **$0.9256$ (Dropout)** y **$0.8288$ (Combinado)**.
   * En el protocolo entrenado en limpio y solo evaluado en ruido (`seed=42`), la Precisión de RF pasa de $0.9641$ a **$0.9553$ (2 %)**, **$0.9173$ (5 %)**, **$0.8666$ (10 %; media 10 semillas: $0.8614 \pm 0.0029$)**, **$0.9276$ (Dropout)** y **$0.8411$ (Combinado; media 10 semillas: $0.8362 \pm 0.0043$)**.
8. **Límites metodológicos de la evaluación (Invalidez física del LOCF en datos transversales):**
   * En `inject_lidar_dropout` (`noise_pilot.py`, líneas 41–62), se seleccionan ráfagas con probabilidad de inicio $p = 0.035$ y longitud uniforme entre $1$ y $4$ filas consecutivas ($181$ eventos y $430$ muestras alteradas en `seed=42`, equivalentes al $8.60\,\%$ del dataset), reemplazando `lidar_obstacle_dist_m` y `lidar_visibility_index` por el valor de la fila anterior (`idx - 1`, *Last Observation Carried Forward*).
   * Sin embargo, en `DSTM-MineSafe-2026.csv`, la fila `idx - 1` **no es el instante temporal previo del mismo camión**, sino **otro registro Monte Carlo independiente perteneciente a otro escenario y otro estado cinemático**. Por tanto, aplicar LOCF sobre el índice del dataframe equivale en realidad a **contaminar el 8.60 % de las muestras con lecturas LiDAR aleatorias de otro vehículo**, no a mantener congelada la última lectura del propio sensor a $10\text{ Hz}$.

### 5.2. Tabla Comparativa de Robustez Sensorial (`06_ROBUSTEZ_SENSORES.csv`)

| Condición Sensorial | Modelo | Protocolo 1: Reentrenado en CV (`seed=42`, Manuscrito) Recall / Prec / F1 / AUC | Protocolo 2: Entrenado en Limpio, Evaluado en Ruido (`seed=42`) Recall / Prec / F1 / AUC | Protocolo 2 (10 Semillas `42..51`) Recall ($\mu \pm \sigma$) | Protocolo 2 (10 Semillas `42..51`) Precision ($\mu \pm \sigma$) | Protocolo 1 (10 Semillas `42..51`) Recall ($\mu \pm \sigma$) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Baseline (0 %)** | **RF** | $0.9634$ / $0.9641$ / $0.9638$ / $0.9938$ | $0.9634$ / $0.9641$ / $0.9638$ / $0.9938$ | $0.9634 \pm 0.0000$ | $0.9641 \pm 0.0000$ | $0.9634 \pm 0.0000$ |
| **Baseline (0 %)** | **GBM** | $0.9671$ / $0.9650$ / $0.9660$ / $0.9943$ | $0.9671$ / $0.9650$ / $0.9660$ / $0.9943$ | $0.9671 \pm 0.0000$ | $0.9650 \pm 0.0000$ | $0.9671 \pm 0.0000$ |
| **Noise 2 %** | **RF** | $0.9384$ / $0.9461$ / $0.9422$ / $0.9881$ | $0.9425$ / $0.9553$ / $0.9489$ / $0.9880$ | $0.9507 \pm 0.0032$ | $0.9503 \pm 0.0026$ | — |
| **Noise 2 %** | **GBM** | $0.9425$ / $0.9467$ / $0.9446$ / $0.9891$ | $0.9417$ / $0.9528$ / $0.9472$ / $0.9890$ | $0.9518 \pm 0.0041$ | $0.9497 \pm 0.0023$ | — |
| **Noise 5 %** | **RF** | $0.9044$ / $0.9129$ / $0.9086$ / $0.9694$ | $0.8988$ / $0.9173$ / $0.9079$ / $0.9662$ | $0.9063 \pm 0.0059$ | $0.9160 \pm 0.0039$ | — |
| **Noise 5 %** | **GBM** | $0.9107$ / $0.9030$ / $0.9068$ / $0.9692$ | $0.8976$ / $0.9154$ / $0.9064$ / $0.9677$ | $0.9050 \pm 0.0059$ | $0.9142 \pm 0.0038$ | — |
| **Noise 10 %** | **RF** | **$0.8510$** / $0.8522$ / $0.8516$ / $0.9214$ | **$0.8226$** / $0.8666$ / $0.8440$ / $0.9096$ | **$0.8287 \pm 0.0054$** | $0.8614 \pm 0.0029$ | **$0.8536 \pm 0.0047$** |
| **Noise 10 %** | **GBM** | $0.8629$ / $0.8443$ / $0.8535$ / $0.9211$ | $0.8263$ / $0.8644$ / $0.8449$ / $0.9137$ | $0.8275 \pm 0.0053$ | $0.8581 \pm 0.0048$ | — |
| **Dropout LiDAR** | **RF** | $0.9387$ / $0.9256$ / $0.9321$ / $0.9599$ | $0.9387$ / $0.9276$ / $0.9332$ / $0.9588$ | $0.9291 \pm 0.0056$ | $0.9296 \pm 0.0037$ | — |
| **Dropout LiDAR** | **GBM** | $0.9402$ / $0.9298$ / $0.9350$ / $0.9604$ | $0.9421$ / $0.9296$ / $0.9358$ / $0.9588$ | $0.9337 \pm 0.0054$ | $0.9308 \pm 0.0032$ | — |
| **Combined (10 % + Drop)** | **RF** | **$0.8338$** / $0.8288$ / $0.8313$ / $0.8910$ | **$0.8069$** / $0.8411$ / $0.8236$ / $0.8811$ | **$0.8069 \pm 0.0075$** | $0.8362 \pm 0.0043$ | **$0.8297 \pm 0.0058$** |
| **Combined (10 % + Drop)** | **GBM** | $0.8468$ / $0.8193$ / $0.8328$ / $0.8897$ | $0.8095$ / $0.8386$ / $0.8238$ / $0.8842$ | $0.8053 \pm 0.0077$ | $0.8329 \pm 0.0053$ | — |

---

## FASE 6. AUDITORÍA DE EXPLICABILIDAD TREESHAP

### 6.1. Ranking Global de Variables y Comparación RF vs. GBM (`07_IMPORTANCIA_SHAP.csv`)

Se verificaron los valores TreeSHAP sobre la submuestra aleatoria de $n = 1,000$ instancias (`seed = 42`) tanto para Random Forest (en unidades de probabilidad de clase positiva) como para Gradient Boosting (en unidades de *log-odds*), comparándolos además con la importancia Gini de impureza:

| Rank RF | Rank GBM | Variable Predictora (`feature`) | RF $\text{mean}(|\text{SHAP}|)$ | RF $\text{std}(|\text{SHAP}|)$ | RF % Contribución Total $|\text{SHAP}|$ | RF Gini Importance | GBM $\text{mean}(|\text{SHAP}|)$ (log-odds) | GBM % Contribución Total $|\text{SHAP}|$ | GBM Gini Importance |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **1** | `lidar_obstacle_dist_m` | **$0.3366$** | $0.1522$ | **$61.87\,\%$** | $0.6926$ | **$3.8486$** | **$62.02\,\%$** | $0.6581$ |
| **2** | **2** | `gnss_speed_kmh` | **$0.1200$** | $0.1158$ | **$22.06\,\%$** | $0.1810$ | **$1.5945$** | **$25.70\,\%$** | $0.2795$ |
| **3** | **6** | `gnss_ramp_grade` | $0.0198$ | $0.0171$ | $3.63\,\%$ | $0.0372$ | $0.0921$ | $1.48\,\%$ | $0.0049$ |
| **4** | **3** | `is_autonomous` | $0.0195$ | $0.0194$ | $3.58\,\%$ | $0.0115$ | $0.2775$ | $4.47\,\%$ | $0.0296$ |
| **5** | **7** | `op_steering_jerk_stddev` | $0.0185$ | $0.0185$ | $3.39\,\%$ | $0.0216$ | $0.0718$ | $1.16\,\%$ | $0.0094$ |
| **6** | **4** | `op_perclos_score` | **$0.0116$** | $0.0098$ | **$2.14\,\%$** | $0.0176$ | $0.1469$ | **$2.37\,\%$** | $0.0103$ |
| **7** | **5** | `lidar_visibility_index` | $0.0108$ | $0.0091$ | $1.98\,\%$ | $0.0209$ | $0.1083$ | $1.75\,\%$ | $0.0046$ |
| **8** | **8** | `turno_horas_acumuladas` | $0.0043$ | $0.0042$ | $0.79\,\%$ | $0.0135$ | $0.0409$ | $0.66\,\%$ | $0.0024$ |
| **9** | **9** | `op_harsh_braking_count` | $0.0030$ | $0.0028$ | $0.55\,\%$ | $0.0041$ | $0.0247$ | $0.40\,\%$ | $0.0014$ |

**Hallazgos Críticos de la Auditoría TreeSHAP:**
1. **Concentración extrema en las 2 variables cinemáticas del TTC:** La distancia LiDAR (`61.87 %` en RF, `62.02 %` en GBM) y la velocidad GNSS (`22.06 %` en RF, `25.70 %` en GBM) suman el **83.93 %** (RF) y **87.72 %** (GBM) de toda la atribución explicativa del modelo.
2. **Refutación de la Hipótesis H2 sobre `op_perclos_score`:** En `experiments/src/xai/shap_analysis.py` (línea 8) y en `crisp-dm-lab/app.py` (Hipótesis H2) se afirma que `op_perclos_score` se ubica entre las 3 variables más importantes. La evidencia empírica demuestra que `op_perclos_score` ocupa el **6.º lugar en RF (2.14 %)** y el **4.º lugar en GBM (2.37 %)**.
3. **Diferencias estructurales entre RF y GBM (absorción de variables espurias):**
   * En `DSTM-MineSafe-2026.csv`, la variable `op_steering_jerk_stddev` **no interviene en la ecuación de la etiqueta**, pero en Random Forest recibe el **5.º lugar** (`3.39 %` de $|\text{SHAP}|$), superando a `op_perclos_score` (`2.14 %`) y `lidar_visibility_index` (`1.98 %`). Esto ocurre porque en RF el muestreo aleatorio de características (`max_features="sqrt"`, es decir, $\sqrt{9}=3$ variables por nodo) fuerza a los árboles a utilizar variables correlacionadas con el escenario cuando `lidar_obstacle_dist_m` no es seleccionada en un nodo.
   * Por el contrario, **Gradient Boosting** (que evalúa todas las variables secuencialmente sobre los residuos) asigna un orden mucho más fiel a la ecuación generadora real: 1.º `lidar_obstacle_dist_m` (62.02 %), 2.º `gnss_speed_kmh` (25.70 %), 3.º `is_autonomous` (4.47 %), 4.º `op_perclos_score` (2.37 %), 5.º `lidar_visibility_index` (1.75 %) y 6.º `gnss_ramp_grade` (1.48 %), relegando las tres variables no causales (`op_steering_jerk_stddev`, `turno_horas_acumuladas`, `op_harsh_braking_count`) a los últimos lugares (1.16 %, 0.66 % y 0.40 %).
4. **Riesgo de interpretar atribuciones SHAP como relaciones causales:** El hecho de que `op_steering_jerk_stddev` reciba un 3.39 % de atribución en RF pese a tener efecto causal exactamente nulo ($\beta = 0$) en el generador demuestra empíricamente por qué **los valores TreeSHAP no deben interpretarse como efectos causales físicos**, sino como atribuciones funcionales condicionales a la estructura del ensamble y a las correlaciones entre escenarios.
5. **Gráficos generados y verificados:** Se incluyen en la carpeta de auditoría `fig_auditoria_shap_beeswarm_rf.png` y `fig_auditoria_shap_bar_rf_vs_gbm.png` (además de los originales `experiments/results/figures/fig4_shap_summary.png` y `fig5_shap_bar.png`).

---

## FASE 7. AUDITORÍA DE ARQUITECTURA Y DENOMINACIÓN CIENTÍFICA

El desglose técnico línea por línea de los 13 componentes de software se encuentra en el documento dedicado `08_ARQUITECTURA_IMPLEMENTADA.md`. En síntesis:

1. **Desconexión entre el Visor 3D/Backend y los Modelos ML/TreeSHAP:**
   * Ni el visor 3D en React/Three.js (`src/components/3d/Mine3DViewer.tsx` + `src/services/riskEngine.ts`) ni el backend FastAPI (`backend/app/services/ml_model_service.py`) ejecutan realmente Random Forest, Gradient Boosting ni TreeSHAP en producción: el frontend usa una fórmula heurística local en TypeScript y el backend busca un archivo inexistente `backend/app/models/model.pkl`, cayendo permanentemente en el motor determinista `risk_engine_service.py`.
   * Solo el laboratorio Streamlit (`crisp-dm-lab/app.py`) y los scripts offline (`experiments/`) entrenan y ejecutan modelos `scikit-learn` y `shap.TreeExplainer` reales.
2. **Naturaleza de la Telemetría y Sincronización:**
   * **Sincronización con equipos físicos reales:** **NO EXISTE.** Toda la telemetría proviene de trayectorias trigonométricas (`Math.cos/sin` en frontend), caminatas aleatorias en memoria (`simulator_service.py` en backend) o muestreo Monte Carlo (`generate_dataset.py`).
   * **Sincronización bidireccional:** **NO EXISTE.** No hay lazo de control hacia frenos, AHS o despacho físico.
3. **Evaluación Taxonómica (Kritzinger et al., 2018):**
   * Al carecer de flujo automático de datos físico-a-virtual (*Digital Shadow*) y de lazo de retorno virtual-a-físico (*Digital Twin*), **no es científicamente riguroso denominar al sistema un "Digital Twin" operacional**.
   * **Denominación científica recomendada para *Acta Montanistica Slovaca*:** **"3D simulation and explainable collision-risk prediction prototype"** o **"Simulation-based digital-twin prototype"**.

---

## FASE 8. AUDITORÍA DE REPRODUCIBILIDAD INDEPENDIENTE

El análisis detallado de reproducibilidad y los comandos exactos de ejecución se documentan en `09_REPRODUCIBILIDAD.md`. Los hallazgos principales son:

* **Veredicto:** **PARCIALMENTE REPRODUCIBLE (85 %) — Requiere corregir 1 línea en `experiments/config/config.yaml` e instalar `joblib`.**
* **Fortalezas:** Versiones fijadas en `experiments/requirements.lock` (Python 3.11.9, `scikit-learn==1.8.0`, `shap==0.51.0`, `scipy==1.17.1`), semillas fijadas (`seed = 42`) en todos los scripts de `experiments/src/`, y dataset `DSTM-MineSafe-2026.csv` 100 % reproducible desde `generate_dataset.py`.
* **Obstáculos detectados:**
  1. `experiments/config/config.yaml` (L24) apunta a `REAL_FIELD_BENCHMARK_2026.csv` en vez de `DSTM-MineSafe-2026.csv`.
  2. `REAL_FIELD_BENCHMARK_2026.csv` fue generado con `Math.random()` sin semilla en Node.js y es irreproducible.
  3. `experiments/requirements.txt` omite `joblib` (importado en `run_all.py`).
  4. No existe archivo `LICENSE` en la raíz ni DOI asignado en `CITATION.cff` (actualmente documentado como `Pending assignment upon Zenodo archival`).

---

## FASE 9 Y FASE 10. PAQUETE DE EVIDENCIAS Y RECOMENDACIONES PARA *ACTA MONTANISTICA SLOVACA*

Todos los archivos requeridos por la Fase 9 han sido generados y verificados en la carpeta `MINESAFE_3D_AUDITORIA_PUBLICACION/`, y la tabla completa de revisión por pares para *Acta Montanistica Slovaca* (Fase 10) se encuentra desarrollada en detalle en `10_CAMBIOS_RECOMENDADOS_ARTICULO.md` (Sección 2, Tabla `REV-01` a `REV-08`).

