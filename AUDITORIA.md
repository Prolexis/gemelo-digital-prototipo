# AUDITORÍA DE REPRODUCIBILIDAD ACADÉMICA (ESTÁNDAR Q1)
## Proyecto: MineSafe 3D — Gemelo Digital Explicable para Predicción de Riesgo de Colisión
**Fecha de auditoría:** 2026-09-22  
**Auditor:** Ingeniero Senior de ML/MLOps & Revisor de Reproducibilidad Académica  
**Alcance:** Workspace integral del repositorio `gemelo-digital-prototipo`

---

### 1. Resumen Ejecutivo de la Auditoría

El proyecto **MineSafe 3D** cuenta con una base de ingeniería sólida para su despliegue operativo en tiempo real (arquitectura de 3 capas: React 19/Three.js + FastAPI/Gemini + PostgreSQL/Redis/Docker Compose y un prototipo interactivo Streamlit en `crisp-dm-lab/`). 

Sin embargo, desde la perspectiva de **reproducibilidad científica para revistas indexadas Q1** (e.g., IEEE Transactions, Nature Scientific Data, Elsevier Reliability Engineering & System Safety), el pipeline experimental presenta **gaps críticos y bloqueantes** que justificaron el rechazo editorial:
1. **Ausencia de persistencia de predicciones a nivel de fold**: El script `crisp-dm-lab/ml_model.py` entrena los modelos pero no guarda `predictions_fold_level.csv`, imposibilitando la verificación inferencial pareada (McNemar, Wilcoxon, Bootstrap IC95%).
2. **Baselines no científicos**: El baseline de detección de proximidad (PDS) en `evaluation.py` fue simulado artificialmente con una curva estática potencial ($y = x^{0.52}$), careciendo del baseline físico exigido (regla TTC con umbrales de 3s y 5s) y de un baseline estadístico formal (Regresión Logística).
3. **Ausencia del dataset canónico y documentación normativa**: No existe el archivo CSV físico `DSTM-MineSafe-2026.csv` con $n=5.000$ y partición formal por escenarios (A–E), ni un *datasheet* que clasifique variables normativas (ISO 21815-1:2022, 30 CFR 56) frente a supuestos de modelado.
4. **Acoplamiento al laboratorio interactivo**: El código de entrenamiento existente está fuertemente acoplado a Streamlit y rutas relativas ad-hoc, sin un módulo independiente `experiments/` ejecutable de punta a punta en CLI o Docker.

---

### 2. Matriz de Auditoría de Componentes

| # | Componente | Existe (Sí/No) | Estado | Severidad | Gaps Detectados | Acción Requerida |
|---|---|:---:|:---:|:---:|---|---|
| **1** | **Dataset Canónico (`DSTM-MineSafe-2026`)** | No (Parcial) | Incompleto | **Bloqueante** | Existe generador en `crisp-dm-lab/data_generator.py` para $n=1.200$, pero no genera los 5 escenarios discretos (A–E) con $n=5.000$. No existe el archivo CSV físico persistido ni el datasheet que distinga fuentes normativas vs. supuestos. | **Crear** `experiments/src/data/generate_dataset.py`, generar `experiments/data/DSTM-MineSafe-2026.csv` y `experiments/data/datasheet.md`. Reusar distribuciones matemáticas de `data_generator.py`. |
| **2** | **Configuración Centralizada de Semillas** | No | Incompleto | **Bloqueante** | Semilla `SEED = 42` dispersa y hardcodeada en scripts sin archivo de configuración YAML formal. | **Crear** `experiments/config/config.yaml` con parámetros de semilla, dataset, hiperparámetros de modelos y umbrales. |
| **3** | **Entrenamiento y Validación Cruzada** | Sí | Incompleto | **Bloqueante** | `crisp-dm-lab/ml_model.py` ejecuta StratifiedKFold(5) pero descarta las predicciones out-of-fold. No genera `predictions_fold_level.csv`. | **Crear** `experiments/src/models/train.py` exportando `experiments/results/predictions_fold_level.csv` con (index, fold, escenario, y_true, proba_rf, proba_gbm, y_pred_rf, y_pred_gbm). |
| **4** | **Baselines Comparativos** | Sí (Débil) | Roto | **Bloqueante** | `crisp-dm-lab/evaluation.py` implementa un "baseline PDS" ficticio mediante fórmula sintética. No existen baselines físicos de TTC deterministas (3s, 5s) ni baseline estadístico (Regresión Logística). | **Crear** `experiments/src/models/baselines.py` con regla física de TTC paramétrica y Regresión Logística, generando tabla comparativa formal. |
| **5** | **Explicabilidad XAI (TreeSHAP)** | Sí | Incompleto | **Bloqueante** | `ml_model.py` ejecuta TreeExplainer pero no exporta los artefactos de publicación (`shap_values.csv`, `fig_shap_global.png`). La explicación local es efímera en la UI; falta `fig_shap_local.png` con un caso real. | **Crear** `experiments/src/xai/shap_analysis.py` generando los artefactos vectoriales/gráficos y valores SHAP reproducibles. |
| **6** | **Mitigación de Circularidad (LOSO)** | No | Ausente | **Bloqueante** | No se evalúa la generalización Leave-One-Scenario-Out (LOSO) para descartar sobreajuste y verificar la independencia de las reglas de etiquetado vs. características. | **Crear** `experiments/src/validation/leave_scenario_out.py`. |
| **7** | **Pruebas de Estadística Inferencial** | No | Ausente | **Bloqueante** | Cero pruebas inferenciales: no hay McNemar exacto, Wilcoxon por fold, Bootstrap IC95% (≥1.000 remuestreos), tamaño de efecto (Δrecall) ni corrección Holm-Bonferroni. Causa principal del rechazo. | **Crear** `experiments/src/stats/inferential_tests.py` produciendo `results/statistical_tests.md` en formato APA y `results/fig_pr_curves.png`. |
| **8** | **Documentación de Reproducibilidad Q1** | No | Incompleto | **Bloqueante** | Los README existentes cubren arquitectura y Streamlit, pero no hay un `experiments/README.md` con mapa de tablas/figuras del paper, disclaimers éticos ni guía de un solo comando. | **Crear** `experiments/README.md`, `CITATION.cff`, `LICENSE` (MIT) y `experiments/data/LICENSE-DATA` (CC-BY 4.0). |
| **9** | **Gestión de Entorno y Lockfile** | Sí | Incompleto | **Bloqueante** | Requerimientos existentes usan versiones abiertas (`>=`), lo que no garantiza determinismo en dependencias numéricas críticas (`numpy`, `scipy`, `scikit-learn`, `shap`). | **Crear** `experiments/requirements.txt` y congelar `experiments/requirements.lock` con versiones exactas. |
| **10** | **Contenedorización para Reproducibilidad** | No (Parcial) | Incompleto | **Bloqueante** | Docker-compose existente levanta infraestructura web de producción (Postgres, Redis, Backend, Frontend), no un runner científico autónomo. | **Crear** `experiments/Dockerfile` (python:3.11-slim) y `experiments/docker-compose.yml` para ejecutar todo el pipeline de punta a punta con un comando. |
| **11** | **Integración Continua (CI Reproducibility)** | No | Ausente | **Bloqueante** | No existe pipeline de GitHub Actions para verificar la regeneración automática de resultados y comprobación de artefactos. | **Crear** `.github/workflows/reproduce.yml`. |
| **12** | **Capa 2: API FastAPI de Producción** | Sí | Funcional | No bloqueante | Backend estructurado con routers, servicios, WebSocket y Gemini. | **Preservar intacto**. El submódulo experimental importará o tomará de referencia definiciones compartidas sin tocar la API operativa. |
| **13** | **Capa 1: Frontend React / Three.js** | Sí | Funcional | No bloqueante | Gemelo digital 3D operativo. | **Preservar intacto**. |
| **14** | **Capa 1: Crisp-DM Lab (Streamlit)** | Sí | Funcional | No bloqueante | Laboratorio visual con fines demostrativos. | **Preservar intacto**. Sirve como antecedente visual y prototipo. |

---

### 3. Plan de Acción y Arquitectura del Submódulo `experiments/`

Para subsanar las deficiencias sin alterar el sistema en producción ni violar las reglas de aislamiento, la estructura completa a implementar en la **Fase 1**, **Fase 2** y **Fase 3** se organizará bajo la raíz `experiments/`:

```
experiments/
├── config/
│   └── config.yaml                     # Semilla única SEED=42, parámetros, umbrales TTC, modelos
├── data/
│   ├── DSTM-MineSafe-2026.csv          # Dataset canónico n=5.000 con escenarios A-E
│   ├── datasheet.md                    # Datasheet: normativa (ISO/CFR) vs supuestos
│   └── LICENSE-DATA                    # CC-BY 4.0
├── src/
│   ├── data/
│   │   └── generate_dataset.py         # Generación sintética determinista con escenarios
│   ├── models/
│   │   ├── train.py                    # 5-fold CV guardando predictions_fold_level.csv
│   │   └── baselines.py                # Regla física TTC (3s, 5s) + Regresión Logística
│   ├── xai/
│   │   └── shap_analysis.py            # TreeExplainer, shap global y waterfall local
│   ├── validation/
│   │   └── leave_scenario_out.py       # Leave-one-scenario-out (mitigación circularidad)
│   └── stats/
│       └── inferential_tests.py        # McNemar, Wilcoxon, Bootstrap IC95%, PR curves
├── results/
│   ├── predictions_fold_level.csv      # Predicciones por fold (CRÍTICO para inferencial)
│   ├── shap_values.csv                 # Valores SHAP exportados
│   ├── fig_shap_global.png             # Gráfico global resumen SHAP
│   ├── fig_shap_local.png              # Explicación local waterfall registro real
│   ├── fig_pr_curves.png               # Curvas Precision-Recall RF vs GBM
│   └── statistical_tests.md            # Reporte inferencial formato APA para el paper
├── Dockerfile                          # python:3.11-slim para runner autónomo
├── docker-compose.yml                  # Servicio único ejecutable con `docker compose up`
├── requirements.txt                    # Dependencias mínimas fijadas
├── requirements.lock                   # Lockfile exacto
├── CITATION.cff                        # Metadatos de citación académica
├── LICENSE                             # Licencia MIT para código
└── README.md                           # Guía completa de reproducción, mapeo tablas/figuras
```

---
*Fin del reporte de Auditoría — Fase 0 completada. Esperando confirmación para proceder con la ejecución de la Fase 1.*
