# Paquete de Reproducibilidad Científica (Estándar Q1)
## MineSafe 3D: Gemelo Digital Explicable para Predicción de Riesgo de Colisión en Flotas Mineras Mixtas

[![CI Reproducibility](https://img.shields.io/badge/CI-Reproducibility%20Verified-brightgreen?style=for-the-badge&logo=githubactions)](../.github/workflows/reproduce.yml)
[![License: MIT](https://img.shields.io/badge/Code%20License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)
[![Data License: CC BY 4.0](https://img.shields.io/badge/Data%20License-CC%20BY%204.0-lightgrey.svg?style=for-the-badge)](./data/LICENSE-DATA)
[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.placeholder-blue?style=for-the-badge)](https://doi.org/10.5281/zenodo.placeholder)

Este directorio contiene el submódulo **completamente desacoplado y autónomo** para reproducir de forma determinista todos los datos, entrenamientos, baselines, explicabilidad TreeSHAP y pruebas de estadística inferencial reportados en el artículo de investigación.

---

## 1. Requisitos del Sistema

- **Python:** Versión `3.11` (recomendada) o superior.
- **Sistemas Operativos:** Linux (Ubuntu 22.04+), macOS (Apple Silicon / Intel), Windows 10/11.
- **Opcional (Containerizado):** Docker Engine 24+ y Docker Compose v2+.

---

## 2. Reproducción Rápida en un Solo Comando

### Opción A: Entorno Virtual Local (Recomendado para desarrollo/análisis)

```bash
# 1. Crear y activar entorno virtual
python -m venv venv
source venv/bin/activate        # En Windows: venv\Scripts\activate

# 2. Instalar dependencias fijadas
pip install -r experiments/requirements.lock

# 3. Ejecutar TODO el pipeline en un solo paso
python experiments/run_all.py
```

### Opción B: Reproducción 100% Hermética con Docker

```bash
# Levantar el runner científico aislado que autoejecuta el pipeline completo
docker compose -f experiments/docker-compose.yml up --build
```

---

## 3. Mapeo Formal de Tablas y Figuras del Artículo de Revista

Cada resultado cuantitativo y visual presentado en el manuscrito está respaldado por un script independiente y verificable:

| Elemento en el Artículo | Descripción del Contenido | Script Generador | Ubicación del Artefacto Producido |
|---|---|---|---|
| **Tabla 1 (Datasheet)** | Taxonomía de variables: Normativa (ISO 21815 / 30 CFR 56) vs. Supuestos | `experiments/src/data/generate_dataset.py` | [`experiments/data/datasheet.md`](./data/datasheet.md) |
| **Tabla 4 (Métricas ML)** | Desempeño 5-Fold Stratified CV (AUC-ROC, Precisión, Recall, F1, Rangos) | `experiments/src/models/train.py` | [`experiments/results/predictions_fold_level.csv`](./results/predictions_fold_level.csv) & `cv_metrics_summary.json` |
| **Tabla 5 (Baselines)** | Comparativa vs. Regla Física TTC (3s, 5s) y Regresión Logística | `experiments/src/models/baselines.py` | [`experiments/results/baselines_comparison.md`](./results/baselines_comparison.md) & `.csv` |
| **Figura 4 (XAI Global)** | Jerarquía de atribución causal global de TreeSHAP ($|\phi_i|$) | `experiments/src/xai/shap_analysis.py` | [`experiments/results/fig_shap_global.png`](./results/fig_shap_global.png) & `shap_values.csv` |
| **Figura 5 (XAI Local)** | Explicación local Waterfall de un evento de colisión crítico real | `experiments/src/xai/shap_analysis.py` | [`experiments/results/fig_shap_local.png`](./results/fig_shap_local.png) |
| **Figura 6 (Curvas PR)** | Curvas Precision-Recall (AUC-PR) comparativas RF vs. GBM | `experiments/src/stats/inferential_tests.py` | [`experiments/results/fig_pr_curves.png`](./results/fig_pr_curves.png) |
| **Sección Estadística** | McNemar exacto, Wilcoxon por fold, Bootstrap 95% CI de $\Delta\text{recall}$ (APA) | `experiments/src/stats/inferential_tests.py` | [`experiments/results/statistical_tests.md`](./results/statistical_tests.md) |
| **Sección Robustez** | Validación Leave-One-Scenario-Out (LOSO) contra circularidad | `experiments/src/validation/leave_scenario_out.py` | [`experiments/results/loso_validation.md`](./results/loso_validation.md) |

---

## 4. Estructura de Directorios del Submódulo

```text
experiments/
├── config/
│   └── config.yaml                     # Configuración central (SEED=42, hiperparámetros, umbrales)
├── data/
│   ├── DSTM-MineSafe-2026.csv          # Dataset canónico n=5.000 con escenarios A-E
│   ├── datasheet.md                    # Datasheet: normativa vs supuestos
│   └── LICENSE-DATA                    # Licencia Creative Commons CC-BY 4.0
├── src/
│   ├── data/
│   │   └── generate_dataset.py         # Generación sintética determinista
│   ├── models/
│   │   ├── train.py                    # 5-fold CV guardando predictions_fold_level.csv
│   │   └── baselines.py                # Regla física TTC (3s, 5s) + Regresión Logística
│   ├── xai/
│   │   └── shap_analysis.py            # TreeExplainer, SHAP global y waterfall local
│   ├── validation/
│   │   └── leave_scenario_out.py       # Leave-one-scenario-out (mitigación circularidad)
│   └── stats/
│       └── inferential_tests.py        # McNemar, Wilcoxon, Bootstrap IC95%, PR curves
├── results/
│   ├── predictions_fold_level.csv      # Predicciones por fold (CRÍTICO para inferencial)
│   ├── baselines_comparison.md         # Tabla de baselines comparativos
│   ├── shap_values.csv                 # Valores SHAP exportados
│   ├── fig_shap_global.png             # Gráfico global resumen SHAP
│   ├── fig_shap_local.png              # Explicación local waterfall registro real
│   ├── fig_pr_curves.png               # Curvas Precision-Recall RF vs GBM
│   ├── statistical_tests.md            # Reporte inferencial formato APA para el paper
│   └── loso_validation.md              # Resultados de generalización out-of-distribution
├── run_all.py                          # Runner de un solo comando para todo el pipeline
├── Dockerfile                          # Contenedor python:3.11-slim aislado
├── docker-compose.yml                  # Orquestador del runner en Docker
├── requirements.txt                    # Dependencias científicas
├── requirements.lock                   # Lockfile exacto con versiones fijadas
├── CITATION.cff                        # Metadatos de citación académica
├── LICENSE                             # Licencia MIT para código
└── README.md                           # Este documento
```

---

## 5. Declaración Ética y Disclaimer de Datos Sintéticos

> [!CAUTION]
> **Aviso de Validación:** El conjunto de datos `DSTM-MineSafe-2026` es un dataset **sintético calibrado estocásticamente** mediante simulación física y modelos de fatiga de la literatura (Dinges et al., 1998; ISO 21815-1:2022; MSHA 30 CFR 56). Su propósito es permitir el benchmarking algorítmico objetivo, la trazabilidad de explicabilidad aditiva y la reproducibilidad académica. **No representa mediciones directas de campo in-situ en una mina comercial activa**, ni debe utilizarse como sistema de seguridad primario en operaciones reales sin previa homologación y pruebas con telemetría GNSS/LiDAR de grado industrial.

---

## 6. Cómo Citar

Si utilizas este software o el dataset en tu investigación, cita según la siguiente referencia bibliográfica:

```bibtex
@article{minesafe3d_2026,
  author    = {MineSafe 3D Research Consortium},
  title     = {MineSafe 3D: Explainable Digital Twin for Predictive Collision Prevention in Mixed Open-Pit Mining Fleets},
  journal   = {Preprint / Submitted for Peer Review (Under Revision)},
  year      = {2026},
  doi       = {10.5281/zenodo.placeholder},
  url       = {https://github.com/Prolexis/gemelo-digital-prototipo}
}
```
O consulta el archivo [`CITATION.cff`](./CITATION.cff) para formatos CFF/BibTeX adicionales.
