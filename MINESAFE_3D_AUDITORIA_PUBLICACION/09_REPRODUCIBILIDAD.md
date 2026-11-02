# 09. AUDITORÍA DE REPRODUCIBILIDAD CIENTÍFICA Y PASOS DE EJECUCIÓN

**Proyecto:** MineSafe 3D  
**Estándar de Evaluación:** Reproducibilidad Computacional Independiente para Revistas Indexadas (*Acta Montanistica Slovaca*).

---

## 1. Matriz de Verificación de Artefactos de Reproducibilidad

| Elemento Auditado | ¿Existe? | Ruta en el Workspace | Consistencia / Estado | Hallazgos de Auditoría |
|---|:---:|---|---:|---|
| **README Principal** | SÍ | `README.md` | ⚠️ **Inconsistente con el paper** | En la tabla de la línea 36 reporta métricas antiguas/distintas (`AUC-ROC = 0.942`, `FPR = 4.8%`) que no coinciden con el pipeline experimental de `experiments/` (`AUC-ROC = 0.9938`). Además, en la línea 124 cita una URL distinta (`github.com/Prolexis/MineSafe-3D.git`) frente a la línea 242 (`github.com/Prolexis/gemelo-digital-prototipo`). |
| **README Experimental** | SÍ | `experiments/README.md` | ⚠️ **Discrepancia menor en versiones** | Documenta de forma excelente los comandos y tablas, pero en las líneas 28–36 declara versiones (`numpy==1.26.4`, `scikit-learn==1.4.2`, `shap==0.45.0`) distintas a las congeladas realmente en `experiments/requirements.lock` (`numpy==2.4.6`, `scikit-learn==1.9.0`, `shap==0.51.0`). Asimismo, en la línea 277 menciona `$b=86, c=105$` para McNemar, mientras que `statistical_tests.md` y el cálculo real arrojan `$b=40, c=52$`. |
| **Instrucciones de Instalación** | SÍ | `experiments/README.md`, `crisp-dm-lab/README.md` | ✅ **Completas** | Incluye instrucciones paso a paso para entorno virtual Python (Windows/Linux/macOS) y para contenedor Docker (`docker compose -f experiments/docker-compose.yml up --build`). |
| **Versiones de Python y Librerías** | SÍ | `experiments/requirements.txt`, `experiments/requirements.lock`, `backend/requirements.txt`, `crisp-dm-lab/requirements.txt` | ✅ **Verificadas en entorno activo** | Entorno activo verificado: `Python 3.11.9`, `numpy 2.4.6`, `pandas 3.0.5`, `scikit-learn 1.9.0`, `scipy 1.17.1`, `shap 0.51.0`, `joblib 1.5.3`, `PyYAML 6.0.3`, `matplotlib 3.11.0`, `statsmodels 0.14.6`. No existe archivo `pyproject.toml` en la raíz (se usa `package.json` para frontend y `requirements.txt`/`.lock` para Python). |
| **Semillas Aleatorias (`SEED`)** | SÍ | `experiments/config/config.yaml` (`seed: 42`) | ⚠️ **Mayormente determinista (con 2 excepciones)** | `SEED = 42` controla `generate_dataset.py`, `train.py`, `baselines.py`, `leave_scenario_out.py`, `inferential_tests.py`, `noise_pilot.py` y `shap_analysis.py`. **Excepción 1 (Crítica):** El script alternativo `experiments/src/data/generate_real_dataset.js` usa `Math.random()` de JavaScript sin semilla, por lo que no es reproducible. **Excepción 2:** En `train.py` y `leave_scenario_out.py`, el fold $k$ usa `random_state = 42 + fold` para RF/GBM. |
| **Configuración YAML** | SÍ | `experiments/config/config.yaml` | ❌ **BUG CRÍTICO DE RUTA** | **Hallazgo bloqueante:** En la línea 24 de `experiments/config/config.yaml`, la clave `output_csv` fue cambiada a `"experiments/data/REAL_FIELD_BENCHMARK_2026.csv"`, dejando `"experiments/data/DSTM-MineSafe-2026.csv"` como `synthetic_fallback_csv`. Como todos los scripts (`train.py`, `baselines.py`, `leave_scenario_out.py`, `noise_pilot.py`, `shap_analysis.py`) leen `config["data"]["output_csv"]`, si un investigador ejecuta hoy `train.py` sin regenerar datos, entrenará sobre `REAL_FIELD_BENCHMARK_2026.csv` (obteniendo `AUC = 0.9990`, `F1 = 0.9614` en lugar de `0.9938` y `0.9638`). Y si ejecuta `generate_dataset.py`, sobrescribirá `REAL_FIELD_BENCHMARK_2026.csv` con los datos sintéticos de `DSTM-MineSafe-2026`! |
| **Dataset Canónico y Generador** | SÍ | `experiments/data/DSTM-MineSafe-2026.csv`, `experiments/src/data/generate_dataset.py` | ✅ **100% Reproducible** | Al ejecutar `generate_dstm_dataset(config)` con `seed=42`, el DataFrame resultante coincide **exactamente** (`df.equals() == True`, diferencia numérica máxima = `0.0`) con el archivo `experiments/data/DSTM-MineSafe-2026.csv` ($N = 5,000$, 15 columnas). |
| **Segundo Dataset (`REAL_FIELD_BENCHMARK_2026.csv`)** | SÍ | `experiments/data/REAL_FIELD_BENCHMARK_2026.csv`, `experiments/src/data/generate_real_dataset.js`, `experiments/src/data/ingest_real_telemetry.py` | ❌ **Engañoso / Sintético no semillado** | A pesar de su nombre (`REAL_FIELD_BENCHMARK_2026.csv`) y de que `crisp-dm-lab/app.py` lo muestra como *"DATASET REAL DE CAMPO"*, fue generado sintéticamente con `Math.random()` por `experiments/src/data/generate_real_dataset.js` (se verifica por el prefijo `REAL-FIELD-00001` y los valores `999` en `ttc_raw_sec`). **No debe presentarse como telemetría real de campo en ninguna publicación.** |
| **Scripts de Entrenamiento y Evaluación** | SÍ | `experiments/src/models/{train,baselines,benchmark_latency}.py`, `experiments/src/validation/leave_scenario_out.py`, `experiments/src/stats/inferential_tests.py`, `experiments/src/robustness/noise_pilot.py`, `experiments/src/xai/shap_analysis.py` | ✅ **Funcionales y verificados** | Cuando apuntan a `experiments/data/DSTM-MineSafe-2026.csv`, reproducen con exactitud de 4 decimales todos los resultados declarados en el manuscrito. |
| **Gráficos Generados** | SÍ | `experiments/results/{fig_pr_curves,fig_robustness_degradation,fig_shap_global,fig_shap_local,fig_architecture}.png` | ✅ **Existentes y regenerables** | Todos los gráficos PNG a 300 DPI existen en `experiments/results/` y fueron verificados. |
| **Licencias** | SÍ | `LICENSE` (MIT), `experiments/LICENSE` (MIT), `experiments/data/LICENSE-DATA` (CC BY 4.0) | ✅ **Completas** | Doble licenciamiento claro: MIT para software y CC-BY 4.0 para datos. |
| **Repositorio y DOI Declarados** | SÍ | `README.md`, `experiments/README.md`, `experiments/CITATION.cff`, `DELIVERABLES.md` | ⚠️ **Requiere Verificación Externa del Autor** | El repositorio declara la URL `https://github.com/Prolexis/gemelo-digital-prototipo` y el DOI de Zenodo `10.5281/zenodo.22905230` (con fecha de release `2026-09-22`). Como la auditoría se ejecuta en un entorno local aislado sin verificación externa del registro de Zenodo, el autor debe confirmar que el DOI `10.5281/zenodo.22905230` resuelva públicamente antes del envío a *Acta Montanistica Slovaca*. |

---

## 2. Corrección Requerida en `experiments/config/config.yaml` para Reproducibilidad Directa

Para que cualquier revisor externo que ejecute `python experiments/run_all.py` o los scripts individuales reproduzca directamente el artículo sobre `DSTM-MineSafe-2026.csv`, la línea 24 de `experiments/config/config.yaml` debe apuntar a:

```yaml
  output_csv: "experiments/data/DSTM-MineSafe-2026.csv"
```

*(Nota: En cumplimiento estricto de las reglas de esta auditoría, no se ha modificado `experiments/config/config.yaml` ni ningún archivo original; la corrección queda documentada para autorización del autor).*

---

## 3. Pasos Exactos para Reproducir los Experimentos Auditados

### Paso 1: Verificar el entorno Python (Windows PowerShell / Linux Bash)

```powershell
python --version
# Salida verificada: Python 3.11.9

pip install -r experiments/requirements.lock
```

### Paso 2: Ejecutar el Script Maestro de Auditoría y Nuevos Experimentos (Sin alterar archivos originales)

Este comando ejecuta la verificación completa de reproducción, análisis de circularidad (ablaciones A–H), validación LOSO completa (RF y GBM, nominal e independiente), piloto de robustez (reentrenado vs. operacional sin reentrenar + 10 semillas) y auditoría TreeSHAP (RF y GBM):

```powershell
python MINESAFE_3D_AUDITORIA_PUBLICACION/scripts_auditoria/run_audit_experiments.py
```

**Artefactos generados automáticamente en `MINESAFE_3D_AUDITORIA_PUBLICACION/`:**
* `02_RESULTADOS_VERIFICADOS.csv`
* `03_METRICAS_MODELOS.csv`
* `04_RESULTADOS_LOSO.csv`
* `05_ANALISIS_CIRCULARIDAD.csv`
* `06_ROBUSTEZ_SENSORES.csv`
* `07_IMPORTANCIA_SHAP.csv`
* `fig_auditoria_shap_beeswarm_rf.png`
* `fig_auditoria_shap_bar_rf_vs_gbm.png`
* `12_LOG_EJECUCION.txt`

### Paso 3: Ejecutar los Scripts Originales del Repositorio (Una vez corregido `output_csv` en `config.yaml`)

```powershell
# 1. Generar / verificar el dataset canónico DSTM-MineSafe-2026 (n=5,000, seed=42)
python experiments/src/data/generate_dataset.py

# 2. Entrenar RF y GBM con 5-Fold Stratified CV y exportar predicciones OOF
python experiments/src/models/train.py

# 3. Evaluar baselines físicos (TTC < 3.0s y < 5.0s) y Regresión Logística
python experiments/src/models/baselines.py

# 4. Calcular explicabilidad TreeSHAP global y local
python experiments/src/xai/shap_analysis.py

# 5. Ejecutar validación Leave-One-Scenario-Out (LOSO)
python experiments/src/validation/leave_scenario_out.py

# 6. Ejecutar pruebas inferenciales (McNemar, Wilcoxon, Bootstrap B=1,000)
python experiments/src/stats/inferential_tests.py

# 7. Ejecutar piloto de robustez ante ruido GNSS/LiDAR y dropout LOCF
python experiments/src/robustness/noise_pilot.py

# 8. Ejecutar benchmark de latencia computacional
python experiments/src/models/benchmark_latency.py
```

