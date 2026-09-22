# Paquete de Reproducibilidad Científica (Estándar Q1)
## MineSafe 3D: Gemelo Digital Explicable para Predicción de Riesgo de Colisión en Flotas Mineras Mixtas

[![CI Reproducibility](https://img.shields.io/badge/CI-Reproducibility%20Verified-brightgreen?style=for-the-badge&logo=githubactions)](../.github/workflows/reproduce.yml)
[![Release: v1.0.0](https://img.shields.io/badge/Release-v1.0.0-blue?style=for-the-badge&logo=github)](https://github.com/Prolexis/gemelo-digital-prototipo/releases/tag/v1.0.0)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.22905230.svg)](https://doi.org/10.5281/zenodo.22905230)
[![License: MIT](https://img.shields.io/badge/Code%20License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)
[![Data License: CC BY 4.0](https://img.shields.io/badge/Data%20License-CC%20BY%204.0-lightgrey.svg?style=for-the-badge)](./data/LICENSE-DATA)

---

## 1. Descripción Breve del Proyecto

**MineSafe 3D** es una arquitectura de Gemelo Digital predictivo y explicable diseñada para prevenir colisiones vehiculares en explotaciones mineras a cielo abierto con flotas mixtas (camiones de extracción de 400t tripulados manualmente y camiones autónomos AHS).

Este paquete experimental contiene el pipeline científico **completamente desacoplado, determinista y autónomo** para reproducir de forma independiente todos los datos sintéticos, modelos de Machine Learning (Random Forest y Gradient Boosting), baselines deterministas de física vehicular (Time-To-Collision), atribuciones causales (TreeSHAP global y local) y pruebas de hipótesis de estadística inferencial (McNemar, Wilcoxon y remuestreo Bootstrap) reportados en el artículo de revista.

---

## 2. Requisitos del Sistema

* **Versión de Python:** Python `3.11.x` recomendada (compatible con Python $\ge 3.10$ y $\le 3.12$).
* **Sistema Operativo Recomendado:**
  * Linux: Ubuntu 22.04 LTS o superior (probado en CI de GitHub Actions).
  * Windows: Windows 10 / 11 (PowerShell o CMD).
  * macOS: Sonoma / Ventura (arquitectura Apple Silicon o Intel x86_64).
* **Dependencias Principales y Versiones Fijadas:**
  * `numpy == 1.26.4`
  * `pandas == 2.2.2`
  * `scikit-learn == 1.4.2`
  * `scipy == 1.13.0`
  * `statsmodels == 0.14.2`
  * `shap == 0.45.0`
  * `matplotlib == 3.8.4`
  * `joblib == 1.4.0`
  * `pyyaml == 6.0.1`
* **Entorno Containerizado (Opcional):**
  * Docker Engine versión `24.0+`
  * Docker Compose versión `v2.20+`

---

## 3. Estructura de Carpetas del Proyecto

```text
experiments/
├── config/
│   └── config.yaml                     # Configuración centralizada: SEED=42, n=5000, hiperparámetros
├── data/
│   ├── DSTM-MineSafe-2026.csv          # Dataset canónico n=5.000 con escenarios A–E
│   ├── datasheet.md                    # Datasheet: taxonomía normativa ISO 21815 vs. supuestos
│   └── LICENSE-DATA                    # Licencia Creative Commons CC-BY 4.0
├── src/
│   ├── data/
│   │   └── generate_dataset.py         # Generación sintética física Monte Carlo (SEED=42)
│   ├── models/
│   │   ├── train.py                    # 5-Fold Stratified CV, exporta predictions_fold_level.csv
│   │   └── baselines.py                # Regla física TTC (3s, 5s) + Regresión Logística
│   ├── xai/
│   │   └── shap_analysis.py            # TreeExplainer, ranking global y waterfall local
│   ├── validation/
│   │   └── leave_scenario_out.py       # Validación LOSO con umbral TTC independiente (3.5s)
│   └── stats/
│       └── inferential_tests.py        # McNemar exacto, Wilcoxon, Bootstrap IC95%, curvas PR
├── results/
│   ├── predictions_fold_level.csv      # Predicciones OOF fold a fold (5.000 filas)
│   ├── cv_metrics_summary.json         # Métricas agregadas y por fold (JSON estructurado)
│   ├── baselines_comparison.md         # Tabla de comparación con baselines físicos
│   ├── baselines_comparison.csv        # Métricas de baselines en formato CSV
│   ├── shap_values.csv                 # Matriz de valores SHAP por feature
│   ├── fig_shap_global.png             # Figura: Importancia global TreeSHAP (mean |SHAP|)
│   ├── fig_shap_local.png              # Figura: Waterfall plot de un evento crítico representativo
│   ├── loso_validation.md              # Tabla de validación Leave-One-Scenario-Out (LOSO)
│   ├── loso_validation.csv             # Métricas de generalización OOD en CSV
│   ├── fig_pr_curves.png               # Figura: Curvas Precision-Recall comparativas RF vs. GBM
│   └── statistical_tests.md            # Reporte formal de significancia en formato APA
├── run_all.py                          # Runner orquestador en un solo comando de todo el pipeline
├── requirements.txt                    # Lista de dependencias directas
├── requirements.lock                   # Lockfile exacto con hashes y versiones fijas
├── Dockerfile                          # Imagen aislada python:3.11-slim
├── docker-compose.yml                  # Orquestación del runner en contenedor
├── CITATION.cff                        # Metadatos de citación académica (CFF v1.2.0)
├── LICENSE                             # Licencia MIT para código
└── README.md                           # Guía completa de reproducción
```

---

## 4. Instalación Paso a Paso

### Opción A: Entorno Virtual Local de Python (Recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/Prolexis/gemelo-digital-prototipo.git
cd gemelo-digital-prototipo

# 2. Crear y activar el entorno virtual
# En Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# En Windows (PowerShell):
python -m venv venv
.\venv\Scripts\Activate.ps1

# En Windows (CMD):
python -m venv venv
venv\Scripts\activate.bat

# 3. Instalar las dependencias fijadas
pip install --upgrade pip
pip install -r experiments/requirements.lock
```

### Opción B: Reproducción Aislada mediante Docker

No requiere instalar Python ni dependencias en el sistema host, únicamente Docker:

```bash
docker compose -f experiments/docker-compose.yml up --build
```

---

## 5. Comando EXACTO para Ejecutar Todo el Pipeline

Para ejecutar de punta a punta todas las fases experimentales (generación de datos, entrenamiento 5-fold, baselines físicos, SHAP, LOSO y pruebas inferenciales):

### Desde la raíz del repositorio:
```bash
python experiments/run_all.py
```

### Desde dentro del directorio `experiments/`:
```bash
cd experiments
python run_all.py
```

> **Tiempo de ejecución observado:** $\approx 40 - 55$ segundos en una CPU estándar de 8 núcleos.

---

## 6. Comandos Individuales por Fase Experimental

Si deseas auditar o reproducir fases específicas de forma granular:

| Fase Experimental | Comando de Ejecución (desde la raíz) | Artefacto Generado |
|---|---|---|
| **1. Generar Dataset** | `python experiments/src/data/generate_dataset.py` | `experiments/data/DSTM-MineSafe-2026.csv`<br>`experiments/data/datasheet.md` |
| **2. Entrenar Modelos & OOF** | `python experiments/src/models/train.py` | `experiments/results/predictions_fold_level.csv`<br>`experiments/results/cv_metrics_summary.json` |
| **3. Baselines Físicos & Reg. Log.** | `python experiments/src/models/baselines.py` | `experiments/results/baselines_comparison.md`<br>`experiments/results/baselines_comparison.csv` |
| **4. Explicabilidad TreeSHAP** | `python experiments/src/xai/shap_analysis.py` | `experiments/results/shap_values.csv`<br>`experiments/results/fig_shap_global.png`<br>`experiments/results/fig_shap_local.png` |
| **5. Validación LOSO** | `python experiments/src/validation/leave_scenario_out.py` | `experiments/results/loso_validation.md`<br>`experiments/results/loso_validation.csv` |
| **6. Pruebas Inferenciales & Curvas PR** | `python experiments/src/stats/inferential_tests.py` | `experiments/results/statistical_tests.md`<br>`experiments/results/fig_pr_curves.png` |

---

## 7. Dónde Quedan Guardados los Resultados

Todos los resultados se escriben en rutas relativas deterministas:

1. **Datos Canónicos:** `experiments/data/`
   * `DSTM-MineSafe-2026.csv`: 5.000 filas de telemetría física calibrada.
   * `datasheet.md`: Declaración taxonómica basada en ISO 21815-1:2022 y MSHA 30 CFR 56.
2. **Resultados Cuantitativos y Gráficos:** `experiments/results/`
   * Métricas y comparaciones en Markdown (`.md`) y tablas legibles por máquina (`.csv` y `.json`).
   * Figuras de alta resolución en formato PNG (`300 DPI`).

---

## 8. Semillas Aleatorias (Seeds)

* **Semilla Global:** `SEED = 42`
* La semilla se encuentra declarada en [`experiments/config/config.yaml`](./config/config.yaml) y se propaga explícitamente en:
  * Generación de números aleatorios: `np.random.seed(42)` y `random.seed(42)`.
  * Particionado de validación cruzada: `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)`.
  * Estimadores: `RandomForestClassifier(random_state=42)`, `GradientBoostingClassifier(random_state=42)`, `LogisticRegression(random_state=42)`.
  * Remuestreo Bootstrap no paramétrico: `rng = np.random.default_rng(42)`.

---

## 9. Reproducción Específica de las Tablas Principales del Artículo

### Tabla 1: Desempeño Comparativo 5-Fold CV (RF vs. GBM vs. Baselines)
* **Comando:**
  ```bash
  python experiments/src/models/baselines.py
  ```
* **Archivo de salida:** [`experiments/results/baselines_comparison.md`](./results/baselines_comparison.md)
* **Contenido reproducido:**
  * Regla física TTC $< 3.0\text{s}$ (Recall: 56.5%, Precisión: 99.9%, F1: 72.2%)
  * Regla física TTC $< 5.0\text{s}$ (Recall: 88.7%, Precisión: 97.3%, F1: 92.8%)
  * Regresión Logística (Recall: 96.9%, Precisión: 96.5%, AUC: 0.996)
  * Random Forest OOF (Recall: 96.3%, Precisión: 96.4%, AUC: 0.994)
  * Gradient Boosting OOF (Recall: 96.7%, Precisión: 96.5%, AUC: 0.994)

### Tabla 2: Pruebas Estadísticas Inferenciales
* **Comando:**
  ```bash
  python experiments/src/stats/inferential_tests.py
  ```
* **Archivo de salida:** [`experiments/results/statistical_tests.md`](./results/statistical_tests.md)
* **Contenido reproducido:**
  * Prueba de McNemar exacto con corrección de Edwards: $\chi^2 = 1.3152, p = 0.2513$.
  * Prueba de rangos con signo de Wilcoxon sobre 5 folds: $W = 2.0, p = 0.1875$.
  * Remuestreo Bootstrap ($B=1.000$) para $\Delta\text{Recall}$: $[-0.0087, +0.0015]$ (el intervalo contiene el cero $\rightarrow$ equivalencia estadística confirmada).

### Tabla 3: Validación OOD Leave-One-Scenario-Out (LOSO)
* **Comando:**
  ```bash
  python experiments/src/validation/leave_scenario_out.py
  ```
* **Archivo de salida:** [`experiments/results/loso_validation.md`](./results/loso_validation.md)
* **Contenido reproducido:**
  * Exclusión sucesiva de escenarios A, B, C, D y E evaluados contra umbral físico de TTC independiente ($3.5\text{s}$), demostrando Recall del 100% en condiciones críticas no vistas en entrenamiento.

---

## 10. Reproducción Específica de las Figuras Principales del Artículo

### Figura 4: Jerarquía Global de Importancia TreeSHAP ($|\phi|$)
* **Comando:**
  ```bash
  python experiments/src/xai/shap_analysis.py
  ```
* **Archivo de salida:** [`experiments/results/fig_shap_global.png`](./results/fig_shap_global.png)
* **Comprobación:** Verifica que la distancia LiDAR (`lidar_obstacle_dist_m`, mean $|\phi| \approx 0.337$) sea el factor dominante, seguido de velocidad (`gnss_speed_kmh`, $\approx 0.120$), pendiente (`gnss_ramp_grade`, $\approx 0.020$) y fatiga (`op_perclos_score`, $\approx 0.012$).

### Figura 5: Explicación Local Waterfall de un Caso Crítico
* **Comando:**
  ```bash
  python experiments/src/xai/shap_analysis.py
  ```
* **Archivo de salida:** [`experiments/results/fig_shap_local.png`](./results/fig_shap_local.png)
* **Comprobación:** Gráfico waterfall centrado en el evento crítico de la fila 0 del dataset de prueba.

### Figura 6: Curvas Precision-Recall (AUC-PR)
* **Comando:**
  ```bash
  python experiments/src/stats/inferential_tests.py
  ```
* **Archivo de salida:** [`experiments/results/fig_pr_curves.png`](./results/fig_pr_curves.png)
* **Comprobación:** Curvas escalonadas con AUC-PR de 0.995 (RF) y 0.995 (GBM) vs. línea base de prevalencia (0.535).

---

## 11. Expected Results (Resultados Esperados y Tolerancia)

Al ejecutar `python experiments/run_all.py` con las dependencias fijadas en `requirements.lock`, los valores deben coincidir con la siguiente tabla de referencia:

| Métrica / Prueba | Valor Nominal Esperado | Tolerancia Aceptable | Justificación de Variación |
|---|:---:|:---:|---|
| **RF AUC-ROC (OOF)** | `0.9938` | $\pm 0.005$ | Diferencias menores de precisión en CPU BLAS/LAPACK |
| **RF Recall (OOF)** | `0.9634` | $\pm 0.005$ | Variaciones de redondeo en probabilidades de corte |
| **RF Precisión (OOF)** | `0.9641` | $\pm 0.005$ | Variaciones de redondeo |
| **RF F1-Score (OOF)** | `0.9638` | $\pm 0.005$ | Variaciones de redondeo |
| **GBM AUC-ROC (OOF)** | `0.9943` | $\pm 0.005$ | Convergencia de gradient boosting en distintas arquitecturas |
| **Baseline TTC < 3.0s (Recall)** | `0.5648` | Exacto ($\pm 0.000$) | Regla física determinista |
| **Baseline TTC < 5.0s (Recall)** | `0.8872` | Exacto ($\pm 0.000$) | Regla física determinista |
| **Prueba de McNemar ($p$-value)** | `0.2513` | $\pm 0.010$ | Conteo de matriz de contingencia OOF ($b=86, c=105$) |
| **Prueba de Wilcoxon ($p$-value)** | `0.1875` | $\pm 0.010$ | Rangos sobre los 5 folds |
| **Bootstrap IC 95% ($\Delta\text{Recall}$)** | `[-0.0087, +0.0015]` | Cruza el cero | Confirmación de no significancia estadística ($p > 0.05$) |
| **SHAP Ranking Top-1** | `lidar_obstacle_dist_m` | Invariante | Distancia LiDAR siempre es el factor principal ($>0.30$) |
| **SHAP Ranking Top-2** | `gnss_speed_kmh` | Invariante | Velocidad siempre es el factor secundario ($>0.10$) |

---

## 12. Troubleshooting (Resolución de Problemas Frecuentes)

### 1. `ModuleNotFoundError: No module named 'experiments'`
* **Causa:** El script se ejecutó desde una subcarpeta sin tener la raíz del proyecto en el `PYTHONPATH`.
* **Solución:** Ejecuta siempre los scripts desde la raíz del repositorio:
  ```bash
  cd gemelo-digital-prototipo
  python experiments/run_all.py
  ```
  O exporta la variable de entorno en Linux/macOS:
  ```bash
  export PYTHONPATH=.
  ```
  O en Windows PowerShell:
  ```powershell
  $env:PYTHONPATH = "."
  ```

### 2. `UnicodeEncodeError: 'charmap' codec can't encode characters` en Windows
* **Causa:** La consola estándar de Windows CMD o PowerShell utiliza codificación heredada `CP1252` que no soporta caracteres UTF-8 extendidos.
* **Solución:**
  * Los scripts del repositorio ya implementan `sys.stdout.reconfigure(encoding="utf-8")`.
  * Si la consola de Windows persiste con el error, ejecuta previamente:
    ```cmd
    chcp 65001
    set PYTHONIOENCODING=utf-8
    ```

### 3. Conflicto de Versiones o Error al Instalar `shap` con Numba
* **Causa:** En algunas distribuciones de Linux o versiones de Python 3.12, la compilación de C++ para `shap` puede requerir encabezados de desarrollo de Python.
* **Solución:**
  * Utiliza Python 3.11.x y el archivo `requirements.lock`, el cual instala wheels binarios precompilados sin necesidad de compilador C++:
    ```bash
    pip install -r experiments/requirements.lock
    ```
  * En Ubuntu/Debian, si instalas desde código fuente:
    ```bash
    sudo apt-get install python3-dev build-essential
    ```

### 4. Advertencia de Matplotlib `findfont: Failed to find font`
* **Causa:** Matplotlib busca fuentes vectoriales estándar de publicación y recurre a la fuente tipográfica por defecto.
* **Impacto:** Ninguno. Las figuras PNG se generan correctamente con texto legible a 300 DPI.

---

## 13. Cómo Citar este Trabajo

```bibtex
@software{sanchez_enriquez_2026_zenodo,
  author    = {Sanchez Enriquez, Cristhian Alexis},
  title     = {Prolexis/gemelo-digital-prototipo: Version1 (Version v1.0.0)},
  month     = sep,
  year      = {2026},
  publisher = {Zenodo},
  version   = {v1.0.0},
  doi       = {10.5281/zenodo.22905230},
  url       = {https://doi.org/10.5281/zenodo.22905230}
}
```
Para metadatos adicionales, consulta el archivo [`CITATION.cff`](./CITATION.cff).
