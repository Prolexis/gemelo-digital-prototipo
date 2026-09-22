# Resumen Final de Entregables (DELIVERABLES)
## MineSafe 3D: Paquete de Reproducibilidad Científica e Inferencia Estadística (Estándar Q1)
**Fecha:** 2026-09-22  
**Autor:** Ingeniero de ML/MLOps Senior y Revisor de Reproducibilidad Académica

---

### 1. Árbol Completo de Archivos Creados

```text
gemelo-digital-prototipo/
├── AUDITORIA.md                                    # [Fase 0] Auditoría completa inicial de componentes y gaps
├── MISMATCH_REPORT.md                              # [Fase 4] Comparación métricas reportadas vs reproducidas (|Δ| > 0.01)
├── DELIVERABLES.md                                 # [Fase 4] Este archivo: inventario, comandos y checklist
├── .github/
│   └── workflows/
│       └── reproduce.yml                           # [Fase 3] GitHub Action para CI continuo con validación de artefactos
└── experiments/                                    # [Fase 1-3] Submódulo experimental aislado y autónomo
    ├── Dockerfile                                  # [Fase 3] Imagen Docker (python:3.11-slim) para runner hermético
    ├── docker-compose.yml                          # [Fase 3] Orquestación de servicio único con volumen persistente
    ├── LICENSE                                     # [Fase 3] Licencia MIT para código del experimento
    ├── CITATION.cff                                # [Fase 3] Metadatos de citación académica para el software
    ├── requirements.txt                            # [Fase 3] Dependencias con rangos controlados
    ├── requirements.lock                           # [Fase 3] Lockfile exacto de versiones deterministas
    ├── run_all.py                                  # [Fase 3] Orquestador de ejecución completa en 1 solo comando
    ├── README.md                                   # [Fase 3] Guía completa, mapeo Tablas/Figuras del paper y disclaimer
    ├── config/
    │   └── config.yaml                             # [Fase 1] Configuración central: SEED=42, umbrales TTC, modelos
    ├── data/
    │   ├── DSTM-MineSafe-2026.csv                  # [Fase 1] Dataset canónico n=5.000, 5 escenarios (A–E)
    │   ├── datasheet.md                            # [Fase 1] Datasheet con separación Normativa (ISO/MSHA) vs. Supuestos
    │   └── LICENSE-DATA                            # [Fase 3] Licencia Creative Commons Attribution 4.0 (CC-BY 4.0)
    ├── models/
    │   └── final_rf_pipeline.joblib                # [Fase 1] Pipeline final entrenado de Random Forest
    ├── src/
    │   ├── data/
    │   │   └── generate_dataset.py                 # [Fase 1.1] Generador de telemetría determinista y escenarios A-E
    │   ├── models/
    │   │   ├── train.py                            # [Fase 1.2] Stratified 5-Fold CV y persistencia de predicciones
    │   │   └── baselines.py                        # [Fase 1.3] Baselines físicos TTC (3s, 5s) y Regresión Logística
    │   ├── xai/
    │   │   └── shap_analysis.py                    # [Fase 1.4] TreeExplainer, valores SHAP, resumen global y waterfall
    │   ├── validation/
    │   │   └── leave_scenario_out.py               # [Fase 1.5] Leave-one-scenario-out contra circularidad analítica
    │   └── stats/
    │       └── inferential_tests.py                # [Fase 2.0] McNemar, Wilcoxon, Bootstrap IC95%, PR curves, APA
    └── results/
        ├── predictions_fold_level.csv              # [CRÍTICO] Predicciones out-of-fold completas (5.000 filas)
        ├── cv_metrics_summary.json                 # Resumen numérico JSON de métricas por fold
        ├── baselines_comparison.csv                # Tabla comparativa de baselines (CSV)
        ├── baselines_comparison.md                 # Tabla comparativa de baselines (Markdown para manuscrito)
        ├── shap_values.csv                         # Valores medios globales |φᵢ| de TreeSHAP
        ├── fig_shap_global.png                     # [Figura 4] Gráfico de barras de importancia global SHAP
        ├── fig_shap_local.png                      # [Figura 5] Explicación local Waterfall de colisión crítica real
        ├── loso_validation.csv                     # Métricas de generalización Leave-One-Scenario-Out
        ├── loso_validation.md                      # Reporte de generalización y mitigación de circularidad
        ├── fig_pr_curves.png                       # [Figura 6] Curvas Precision-Recall comparativas RF vs. GBM
        └── statistical_tests.md                    # Reporte inferencial APA listo para pegar en el artículo
```

---

### 2. Comandos de Ejecución por Etapa

| Etapa / Módulo | Comando de Ejecución (desde raíz del proyecto) | Artefacto Principal Producido |
|---|---|---|
| **Pipeline Completo (Un solo paso)** | `python experiments/run_all.py` | Ejecuta de la fase 1.1 a la 2.0 en < 40 segundos |
| **Pipeline Containerizado (Docker)** | `docker compose -f experiments/docker-compose.yml up --build` | Contenedor aislado hermético |
| **1.1 Generación de Dataset** | `python experiments/src/data/generate_dataset.py` | `experiments/data/DSTM-MineSafe-2026.csv` & `datasheet.md` |
| **1.2 Entrenamiento 5-Fold CV** | `python experiments/src/models/train.py` | `experiments/results/predictions_fold_level.csv` |
| **1.3 Baselines (TTC 3s/5s + Logística)** | `python experiments/src/models/baselines.py` | `experiments/results/baselines_comparison.md` & `.csv` |
| **1.4 Explicabilidad TreeSHAP** | `python experiments/src/xai/shap_analysis.py` | `fig_shap_global.png`, `fig_shap_local.png`, `shap_values.csv` |
| **1.5 Validación Anti-Circularidad (LOSO)** | `python experiments/src/validation/leave_scenario_out.py` | `experiments/results/loso_validation.md` & `.csv` |
| **2.0 Estadística Inferencial** | `python experiments/src/stats/inferential_tests.py` | `experiments/results/statistical_tests.md` & `fig_pr_curves.png` |

---

### 3. Checklist de Tareas Fuera de Alcance (Acciones Humanas del Autor)

Los siguientes pasos deben ser realizados por el autor antes del reenvío formal a la revista científica:

- [x] **Subir los cambios al Repositorio de GitHub**:
  - Repositorio oficial y público: [https://github.com/Prolexis/gemelo-digital-prototipo](https://github.com/Prolexis/gemelo-digital-prototipo).
  - Release oficial inmutable: [Tag v1.0.0](https://github.com/Prolexis/gemelo-digital-prototipo/releases/tag/v1.0.0).
- [x] **Subir Dataset Canónico y Código a Zenodo**:
  - Depósito oficial completado por el autor con DOI persistente:
  - **DOI:** [`10.5281/zenodo.22905230`](https://doi.org/10.5281/zenodo.22905230)
  - **Cita Software:** *Cristhian Alexis Sanchez Enriquez. (2026). Prolexis/gemelo-digital-prototipo: Version1 (Version v1.0.0) [Computer software]. Zenodo.*
  - Vinculado en `README.md`, `experiments/README.md`, `experiments/CITATION.cff` y en el *Data/Code Availability Statement*.
- [ ] **Actualizar el Manuscrito del Artículo (Sección Resultados y Discusión)**:
  - Copiar el párrafo en formato APA generado en [`experiments/results/statistical_tests.md`](./experiments/results/statistical_tests.md) directamente a la sección de resultados estadísticos.
  - Insertar la Tabla Comparativa de Baselines desde [`experiments/results/baselines_comparison.md`](./experiments/results/baselines_comparison.md).
  - Sustituir las figuras preliminares por las nuevas figuras vectoriales generadas:
    - Figura 4: [`experiments/results/fig_shap_global.png`](./experiments/results/fig_shap_global.png)
    - Figura 5: [`experiments/results/fig_shap_local.png`](./experiments/results/fig_shap_local.png)
    - Figura 6: [`experiments/results/fig_pr_curves.png`](./experiments/results/fig_pr_curves.png)
  - Actualizar los valores métricos con base en [`MISMATCH_REPORT.md`](./MISMATCH_REPORT.md), explicando que la equivalencia estadística entre RF y GBM ($p = 0,251$) orienta la selección de Random Forest por criterios de latencia en tiempo real ($<15\text{ ms}$) y robustez de interpretabilidad analítica.
