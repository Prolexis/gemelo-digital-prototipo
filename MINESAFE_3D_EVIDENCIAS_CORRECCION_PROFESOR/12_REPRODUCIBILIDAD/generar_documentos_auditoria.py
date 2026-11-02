#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MINESAFE_3D_EVIDENCIAS_CORRECCION_PROFESOR/12_REPRODUCIBILIDAD/generar_documentos_auditoria.py
================================================================================================
Genera todos los informes científicos en Markdown, la Matriz de Correcciones del Profesor
(FON-01 a FON-08, FOR-01, FOR-02), el Manifiesto SHA-256 completo y el archivo comprimido
final MINESAFE_3D_CORRECCIONES_PROFESOR_VERIFICADAS.zip.
================================================================================================
"""

import os
import sys
import json
import hashlib
import zipfile
from pathlib import Path
from datetime import datetime, timezone
import pandas as pd
import numpy as np

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
OUT_ROOT = PROJECT_ROOT / "MINESAFE_3D_EVIDENCIAS_CORRECCION_PROFESOR"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def df_to_md_table(df: pd.DataFrame) -> str:
    cols = list(df.columns)
    lines = ["| " + " | ".join(str(c) for c in cols) + " |"]
    lines.append("|" + "|".join(["---" for _ in cols]) + "|")
    for _, row in df.iterrows():
        vals = [str(row[c]).replace("|", "\\|") for c in cols]
        lines.append("| " + " | ".join(vals) + " |")
    return "\n".join(lines)


def main():
    print("[*] Generando informes científicos de las Fases I a XII...")
    df_inv = pd.read_csv(OUT_ROOT / "01_INVENTARIO" / "inventario_artefactos.csv")
    df_cfg = pd.read_csv(OUT_ROOT / "02_CONFIGURACION_REAL" / "comparacion_configuraciones.csv")
    df_dstm = pd.read_csv(OUT_ROOT / "03_DATASET_Y_GENERADOR" / "dataset_validado.csv")
    df_mod = pd.read_csv(OUT_ROOT / "04_ENTRENAMIENTO_Y_OOF" / "resultados_modelos_reproducidos.csv")
    df_folds = pd.read_csv(OUT_ROOT / "04_ENTRENAMIENTO_Y_OOF" / "metricas_por_fold.csv")
    df_cm = pd.read_csv(OUT_ROOT / "04_ENTRENAMIENTO_Y_OOF" / "matrices_confusion.csv")
    df_mcn = pd.read_csv(OUT_ROOT / "05_MCNEMAR" / "mcnemar_definitivo.csv")
    df_stat = pd.read_csv(OUT_ROOT / "06_POTENCIA_Y_TOST" / "comparaciones_estadisticas.csv")
    df_abl = pd.read_csv(OUT_ROOT / "07_ABLACION_Y_CIRCULARIDAD" / "ablacion_verificada.csv")
    df_loso = pd.read_csv(OUT_ROOT / "08_LOSO" / "LOSO_verificado.csv")
    df_rob = pd.read_csv(OUT_ROOT / "09_ROBUSTEZ" / "robustez_verificada.csv")
    df_shap = pd.read_csv(OUT_ROOT / "10_TREESHAP" / "shap_importancias_verificadas.csv")
    df_ref = pd.read_csv(OUT_ROOT / "11_REFERENCIAS_E_INTEGRIDAD" / "auditoria_referencias.csv")
    with open(OUT_ROOT / "13_LOGS_Y_MANIFIESTOS" / "resumen_ejecucion.json", "r", encoding="utf-8") as f:
        res_json = json.load(f)

    # -------------------------------------------------------------------------
    # 01_INVENTARIO/inventario_artefactos.md
    # -------------------------------------------------------------------------
    inv_md = f"""# FASE I — Inventario Completo y Recuperación de Artefactos de MineSafe 3D

**Fecha de verificación UTC:** `{res_json['timestamp_utc']}`  
**Total de artefactos inspeccionados:** `{len(df_inv)}`  
- **LOCALIZADOS y verificados físicamente en disco con hash SHA-256:** `{int((df_inv['Estado'] == 'LOCALIZADO').sum())}`  
- **NO LOCALIZADOS en el workspace del repositorio:** `{int((df_inv['Estado'] == 'NO LOCALIZADO').sum())}` (`Manuscrito_Articulo_AMS.docx/.pdf` e `Informe_Revision_Grupo_26.pdf/.docx`, los cuales son documentos editoriales externos fuera del repositorio de código).

## Tabla Maestra de Inventario con Hashes SHA-256

{df_to_md_table(df_inv)}
"""
    (OUT_ROOT / "01_INVENTARIO" / "inventario_artefactos.md").write_text(inv_md, encoding="utf-8")

    # -------------------------------------------------------------------------
    # 02_CONFIGURACION_REAL/informe_trazabilidad_hiperparametros.md
    # -------------------------------------------------------------------------
    cfg_md = f"""# FASE II — Informe de Trazabilidad de Hiperparámetros y Resolución de `FON-01`

## 1. Diagnóstico de la Observación `FON-01`

El informe de revisión académica del Grupo 26 (`FON-01`) señaló una discrepancia crítica entre dos conjuntos de hiperparámetros mencionados en la documentación:
- **Opción A (Declarada en el texto del manuscrito):**
  - Random Forest: `n_estimators = 300`, `max_depth = 12`, `min_samples_split = 6`, `min_samples_leaf = 3`, `max_features = "sqrt"`, `class_weight = "balanced"`.
  - Gradient Boosting: `n_estimators = 250`, `learning_rate = 0.05`, `max_depth = 5`, `min_samples_leaf = 8`, `subsample = 0.85`.
- **Opción B (Declarada en `experiments/config/config.yaml` líneas 45–59):**
  - Random Forest: `n_estimators = 200`, `max_depth = 12`, `min_samples_leaf = 4`, `min_samples_split = 2` (por defecto en scikit-learn), `max_features = "sqrt"`, `class_weight = "balanced"`.
  - Gradient Boosting: `n_estimators = 150`, `learning_rate = 0.05`, `max_depth = 5`, `min_samples_leaf = 8`, `subsample = 0.85`.
- **Opción C (Declarada en `crisp-dm-lab/ml_model.py` líneas 120–137 del laboratorio interactivo Streamlit):**
  - Random Forest: `n_estimators = 150`, `max_depth = 10`, `min_samples_split = 5`, `min_samples_leaf = 2`.
  - Gradient Boosting: `n_estimators = 120`, `learning_rate = 0.08`, `max_depth = 4`, `min_samples_split = 5`, `min_samples_leaf = 3`.

---

## 2. Verificación Forense y Experimental Directa

Se realizaron dos pruebas independientes e irrefutables:

1. **Inspección del binario serializado `experiments/models/final_rf_pipeline.joblib`:**
   Al cargar el modelo persistido en el repositorio mediante `joblib.load()` e inspeccionar `pipe.named_steps['classifier'].get_params()`, los hiperparámetros exactos almacenados en el objeto binario son:
   ```json
   {{
     "n_estimators": 200,
     "max_depth": 12,
     "min_samples_leaf": 4,
     "min_samples_split": 2,
     "max_features": "sqrt",
     "class_weight": "balanced",
     "random_state": 42
   }}
   ```
2. **Re-ejecución comparativa 5-Fold Stratified CV (`SEED = 42`, semillas por fold `42 + fold`) de las Opciones B, A, A2 y C sobre `DSTM-MineSafe-2026.csv` ($N = 5,000$):**

{df_to_md_table(df_cfg)}

---

## 3. Conclusión Definitiva para el Manuscrito (`FON-01`)

- **La configuración real y verificada que generó el 100 % de las predicciones (`predictions_fold_level.csv`), los resúmenes (`cv_metrics_summary.json`), el binario (`final_rf_pipeline.joblib`) y las métricas publicadas en el artículo (`RF ROC-AUC = 0.9938, F1 = 0.9638`; `GBM ROC-AUC = 0.9943, F1 = 0.9660`; `McNemar b = 40, c = 52, p = 0.2513`) es la Opción B (`experiments/config/config.yaml`: RF `n_estimators = 200`, `min_samples_leaf = 4`; GBM `n_estimators = 150`, `min_samples_leaf = 8`).**
- La comparación fila por fila contra `experiments/results/predictions_fold_level.csv` arroja **0 discrepancias de clasificación en los 5,000 registros** y una diferencia máxima de probabilidad de **`0.00000000`** para la Opción B.
- En cambio, la Opción A (`300 / 250` con `min_samples_split=6, min_samples_leaf=3`) altera 32 predicciones de RF y 30 de GBM, cambiando `RF F1` a `0.9641`, `GBM F1` a `0.9649` y los conteos de McNemar a `b = 45, c = 49` (`p = 0.7570`).
- **Acción correctiva en el artículo:** Corregir el texto de la sección de Metodología/Configuración Experimental del manuscrito para que declare exactamente los hiperparámetros de `experiments/config/config.yaml` (`RF: n_estimators = 200, max_depth = 12, min_samples_leaf = 4, min_samples_split = 2, max_features = 'sqrt', class_weight = 'balanced'`; `GBM: n_estimators = 150, learning_rate = 0.05, max_depth = 5, min_samples_leaf = 8, subsample = 0.85`), manteniendo intactas todas las tablas de resultados.
"""
    (OUT_ROOT / "02_CONFIGURACION_REAL" / "informe_trazabilidad_hiperparametros.md").write_text(cfg_md, encoding="utf-8")

    # -------------------------------------------------------------------------
    # 03_DATASET_Y_GENERADOR/validacion_dataset.md
    # -------------------------------------------------------------------------
    scen_counts = df_dstm.groupby("escenario")["collision_risk_label"].agg(["count", "sum", "mean"]).reset_index()
    scen_counts.columns = ["Escenario", "Total Registros", "Positivos (y=1)", "Prevalencia Positiva"]
    scen_counts["Negativos (y=0)"] = scen_counts["Total Registros"] - scen_counts["Positivos (y=1)"]
    scen_counts["Prevalencia Positiva"] = (scen_counts["Prevalencia Positiva"] * 100).round(2).astype(str) + "%"

    ds_md = f"""# FASE III (Parte 1) — Validación Forense del Dataset Primario `DSTM-MineSafe-2026.csv`

- **Archivo verificado:** `experiments/data/DSTM-MineSafe-2026.csv` (copiado en `03_DATASET_Y_GENERADOR/dataset_validado.csv`)
- **Hash SHA-256:** `{sha256_file(OUT_ROOT / '03_DATASET_Y_GENERADOR' / 'dataset_validado.csv')}`
- **Número exacto de filas:** `{len(df_dstm):,}`
- **Número exacto de columnas:** `{len(df_dstm.columns)}` (`{', '.join(df_dstm.columns)}`)
- **Valores faltantes (NaN / Null):** `{int(df_dstm.isna().sum().sum())}`
- **Filas duplicadas:** `{int(df_dstm.duplicated().sum())}`
- **Distribución global de la etiqueta `collision_risk_label`:**
  - Positivos (`y = 1`): **`{int(df_dstm['collision_risk_label'].sum()):,}`** (`{df_dstm['collision_risk_label'].mean()*100:.2f}%`)
  - Negativos (`y = 0`): **`{int((df_dstm['collision_risk_label'] == 0).sum()):,}`** (`{(1 - df_dstm['collision_risk_label'].mean())*100:.2f}%`)

## Distribución por Escenario Operacional (A–E)

{df_to_md_table(scen_counts[['Escenario', 'Total Registros', 'Positivos (y=1)', 'Negativos (y=0)', 'Prevalencia Positiva']])}
"""
    (OUT_ROOT / "03_DATASET_Y_GENERADOR" / "validacion_dataset.md").write_text(ds_md, encoding="utf-8")

    # -------------------------------------------------------------------------
    # 04_ENTRENAMIENTO_Y_OOF/informe_reproduccion.md
    # -------------------------------------------------------------------------
    rep_md = f"""# FASE III (Parte 2) — Reproducción Íntegra del Entrenamiento y Validación OOF (5-Fold Stratified CV)

## 1. Protocolo de Validación Cruzada Verificado

- **Particionado:** `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)` (1,000 muestras exactas de validación por fold; 0 solapamiento entre entrenamiento y validación).
- **Preprocesamiento dentro de cada fold (sin fuga de datos):** `SimpleImputer(strategy="median")` + `RobustScaler()`.
- **Semilla de los clasificadores por fold:** `random_state = 42 + fold` (`42, 43, 44, 45, 46`), tal como está implementado en `experiments/src/models/train.py` (líneas 132 y 138).

## 2. Resumen Global Out-of-Fold ($N = 5,000$) y Baselines Comparativos

{df_to_md_table(df_mod)}

## 3. Desglose por Partición (Folds 1 a 5, Media y Desviación Estándar)

{df_to_md_table(df_folds)}

## 4. Matrices de Confusión Verificadas

{df_to_md_table(df_cm)}
"""
    (OUT_ROOT / "04_ENTRENAMIENTO_Y_OOF" / "informe_reproduccion.md").write_text(rep_md, encoding="utf-8")

    # -------------------------------------------------------------------------
    # 05_MCNEMAR/mcnemar_validacion.md
    # -------------------------------------------------------------------------
    mg = res_json["mcnemar_global"]
    mp = res_json["mcnemar_pos"]
    mn = res_json["mcnemar_neg"]
    mcn_md = f"""# FASE IV — Resolución Definitiva de la Prueba de McNemar (`FON-03`)

## 1. Tabla 2×2 Exacta Calculada Directamente desde los 5,000 Registros OOF Alineados

Al cruzar registro por registro (`id_registro = 0 .. 4999`) los aciertos de Random Forest (`prediccion_RF == etiqueta_real`) y Gradient Boosting (`prediccion_GBM == etiqueta_real`) en `04_ENTRENAMIENTO_Y_OOF/predicciones_oof_verificadas.csv`:

| Celda | Definición | Conteo Global ($N=5,000$) | Estrato Positivo ($y=1, N_+=2,677$) | Estrato Negativo ($y=0, N_-=2,323$) |
|---|---|:---:|:---:|:---:|
| **$a$** | Ambos modelos aciertan | **`{mg['a_ambos_aciertan']}`** | `{mp['a_ambos_aciertan']}` | `{mn['a_ambos_aciertan']}` |
| **$b$** | Solo Random Forest acierta (GBM falla) | **`{mg['b_solo_rf_acierta']}`** | `{mp['b_solo_rf_acierta']}` | `{mn['b_solo_rf_acierta']}` |
| **$c$** | Solo Gradient Boosting acierta (RF falla) | **`{mg['c_solo_gbm_acierta']}`** | `{mp['c_solo_gbm_acierta']}` | `{mn['c_solo_gbm_acierta']}` |
| **$d$** | Ambos modelos fallan | **`{mg['d_ambos_fallan']}`** | `{mp['d_ambos_fallan']}` | `{mn['d_ambos_fallan']}` |
| **Total** | **$a + b + c + d$** | **`{mg['suma_verificada']}`** | **`{mp['suma_verificada']}`** | **`{mn['suma_verificada']}`** |
| **$n_{{\\text{{disc}}}}$** | Pares discordantes ($b + c$) | **`{mg['n_discordantes_b_mas_c']}`** | `{mp['n_discordantes_b_mas_c']}` | `{mn['n_discordantes_b_mas_c']}` |

### Verificación de Identidades Algebraicas con las Matrices de Confusión Individuales:
- **Random Forest (`TP = 2579, FP = 96, TN = 2227, FN = 98`):**
  - Aciertos totales RF: $\\text{{TP}} + \\text{{TN}} = 2579 + 2227 = 4806 = a + b = 4766 + 40$.
  - Errores totales RF: $\\text{{FP}} + \\text{{FN}} = 96 + 98 = 194 = c + d = 52 + 142$.
- **Gradient Boosting (`TP = 2589, FP = 94, TN = 2229, FN = 88`):**
  - Aciertos totales GBM: $\\text{{TP}} + \\text{{TN}} = 2589 + 2229 = 4818 = a + c = 4766 + 52$.
  - Errores totales GBM: $\\text{{FP}} + \\text{{FN}} = 94 + 88 = 182 = b + d = 40 + 142$.

---

## 2. Estadísticos y Valores $p$ Exactos (4, 6 y 8 Decimales)

1. **Prueba Exacta Binomial Bilateral (`scipy.stats.binomtest(40, n=92, p=0.5, alternative="two-sided")`):**
   $$p_{{\\text{{exact}}}} = 2 \\sum_{{k=0}}^{{40}} \\binom{{92}}{{k}} (0.5)^{{92}} = 0.25132210$$
   - A **8 decimales**: **`{mg['p_exacto_binomial_bilateral_8dec']:.8f}`**
   - A **6 decimales**: **`{mg['p_exacto_binomial_bilateral_6dec']:.6f}`**
   - A **4 decimales**: **`{mg['p_exacto_binomial_bilateral_4dec']:.4f}`**
2. **Estadístico $\\chi^2$ de McNemar con Corrección de Continuidad de Edwards:**
   $$\\chi^2_{{\\text{{cc}}}} = \\frac{{(|40 - 52| - 1)^2}}{{40 + 52}} = \\frac{{121}}{{92}} = 1.31521739, \\quad p = 0.25145219 \\text{{ (4 dec: }} 0.2515\\text{{)}}$$
3. **Estadístico $\\chi^2$ de McNemar sin Corrección de Continuidad:**
   $$\\chi^2 = \\frac{{(40 - 52)^2}}{{40 + 52}} = \\frac{{144}}{{92}} = 1.56521739, \\quad p = 0.21090293 \\text{{ (4 dec: }} 0.2109\\text{{)}}$$
4. **Mid-$p$ de Lancaster:**
   $$p_{{\\text{{mid}}}} = p_{{\\text{{exact}}}} - \\binom{{92}}{{40}}(0.5)^{{92}} = 0.21210913$$

---

## 3. Explicación Forense de las Dos Discrepancias Históricas (`FON-03`)

1. **¿Por qué `resultados_reproducidos.csv` mostraba `p_exacto = 0.251283` mientras que `mcnemar_verificado.csv` mostraba `0.251322`?**
   - En el script previo `MINESAFE_EVIDENCIAS_FINALES/scripts/ejecutar_verificacion_final.py`, la línea 460 calculó dinámicamente `binomtest(40, n=92, p=0.5).pvalue = 0.25132210` y lo exportó correctamente a `mcnemar_verificado.csv` (`0.251322`).
   - Sin embargo, en la línea 811 del mismo script, al construir la tabla descriptiva `resultados_reproducidos.csv`, se dejó escrito un literal de texto fijo (`"p_exacto=0.251283"`) proveniente de una aproximación manual previa en lugar de interpolar la variable calculada `m_glob['p_exacto_binomial_bilateral']`.
   - En este paquete se conserva intacto el archivo original en `05_MCNEMAR/resultados_reproducidos_original_sin_modificar.csv` como evidencia de auditoría y se entrega `05_MCNEMAR/resultados_reproducidos_corregidos.csv` y `05_MCNEMAR/mcnemar_definitivo.csv` con el valor exacto **`0.251322`** (`0.25132210` a 8 decimales; **`0.2513`** a 4 decimales).
2. **¿Por qué borradores preliminares mencionaban conteos como `b=86, c=105` (`experiments/README.md` línea 277) o `a=4775, b=40, c=52, d=133`?**
   - Los valores `86` y `105` en `experiments/README.md` correspondían a un comentario ilustrativo antiguo antes de fijar el dataset `DSTM-MineSafe-2026.csv`.
   - El par `a=4775, d=133` en un informe preliminar se debió a tomar los aciertos y errores del estrato de una sola corrida sin restar los errores cruzados del otro modelo ($4775 + 40 + 52 + 133 = 5000$, pero implicaba $a+b = 4815 \\neq 4806$). Con los 5,000 registros OOF verificados, la única descomposición exacta que satisface simultáneamente ambas matrices de confusión es **$a = 4,766, b = 40, c = 52, d = 142$**.

## 4. Desglose Completo en `mcnemar_definitivo.csv`

{df_to_md_table(df_mcn)}
"""
    (OUT_ROOT / "05_MCNEMAR" / "mcnemar_validacion.md").write_text(mcn_md, encoding="utf-8")

    # -------------------------------------------------------------------------
    # 06_POTENCIA_Y_TOST/potencia_estadistica_verificada.md & tost_exploratorio_verificado.md
    # -------------------------------------------------------------------------
    mde = res_json["mde"]
    pot_md = f"""# FASE V (Parte 1) — Análisis de Potencia Estadística y Sensibilidad para McNemar (`FON-05`)

## 1. Fundamento Matemático

En la prueba pareada de McNemar sobre $N$ muestras, la información inferencial reside exclusivamente en la tasa de pares discordantes $\\psi = (b + c) / N$:
- **Para Exactitud Global ($N = 5,000$):** $n_{{\\text{{disc}}}} = 40 + 52 = 92 \\implies \\hat{{\\psi}}_{{\\text{{acc}}}} = 92 / 5000 = 0.0184$ ($1.84\\%$). La diferencia observada es $\\hat{{\\Delta}}_{{\\text{{acc}}}} = (40 - 52)/5000 = -0.0024$ ($-0.24\\%$, $\\text{{SE}} = 0.001917$).
- **Para Sensibilidad / Recall en Positivos Reales ($N_+ = 2,677$):** $n_{{\\text{{disc}},+}} = 20 + 30 = 50 \\implies \\hat{{\\psi}}_{{\\text{{rec}}}} = 50 / 2677 = 0.018678$ ($1.87\\%$). La diferencia observada es $\\hat{{\\Delta}}_{{\\text{{rec}}}} = (20 - 30)/2677 = -0.003736$ ($-0.37\\%$, $\\text{{SE}} = 0.002639$).

Debido a la altísima concordancia entre Random Forest y Gradient Boosting ($98.16\\%$ de acuerdo global; $(4766+142)/5000 = 4908/5000$), el error estándar de la diferencia es muy pequeño ($0.19\\%$ en Accuracy y $0.26\\%$ en Recall).

## 2. Diferencia Mínima Detectable (MDE) con $\\alpha = 0.05$ Bilateral

| Métrica Pareada | Tamaño Muestral ($N$) | Discordantes Observados ($n_{{\\text{{disc}}}}$) | Tasa de Discordancia ($\\hat{{\\psi}}$) | MDE al 80% de Potencia (Incondicional Connor / Condicional Exacta) | MDE al 90% de Potencia (Incondicional Connor / Condicional Exacta) |
|---|---:|---:|---:|:---:|:---:|
| **Exactitud Global (Accuracy)** | $5,000$ | $92$ | $1.84\\%$ | **$0.54\\%$ / $0.56\\%$** ($\\approx 27$–$28$ muestras) | **$0.62\\%$ / $0.63\\%$** ($\\approx 31$ muestras) |
| **Sensibilidad (Recall, $y=1$)** | $2,677$ | $50$ | $1.87\\%$ | **$0.74\\%$ / $0.79\\%$** ($\\approx 20$–$21$ positivos) | **$0.86\\%$ / $0.88\\%$** ($\\approx 23$ positivos) |

## 3. Interpretación Científica

1. El diseño experimental ($N = 5,000$) **posee potencia estadística alta ($\\ge 80\\%$) para detectar cualquier diferencia de exactitud $\\ge 0.56\\%$ y cualquier diferencia de sensibilidad (Recall) $\\ge 0.79\\%$**.
2. La potencia post-hoc para las diferencias minúsculas observadas en la muestra ($|\\hat{{\\Delta}}_{{\\text{{acc}}}}| = 0.24\\%$ y $|\\hat{{\\Delta}}_{{\\text{{rec}}}}| = 0.37\\%$) es baja ($\\approx 21\\%$–$28\\%$) **no por falta de tamaño muestral**, sino porque el tamaño del efecto real entre ambos ensambles de árboles sobre este conjunto de datos es cercanísimo a cero ($< 0.4\\%$).
"""
    (OUT_ROOT / "06_POTENCIA_Y_TOST" / "potencia_estadistica_verificada.md").write_text(pot_md, encoding="utf-8")

    tost_md = f"""# FASE V (Parte 2) — Análisis de Equivalencia TOST Exploratorio y Corrección de `FON-05`

## 1. Diagnóstico de la Observación `FON-05`

El revisor académico (`FON-05`) señaló correctamente dos principios metodológicos fundamentales:
1. Un valor $p > 0.05$ en McNemar ($p = 0.2513$) o Wilcoxon ($p = 0.1875$) indica **ausencia de evidencia de diferencia estadísticamente significativa** (*no rechazo de $H_0$*), pero por sí solo no demuestra equivalencia formal.
2. Ejecutar una prueba de equivalencia TOST (*Two One-Sided Tests*, Schuirmann 1987) seleccionando márgenes $\\pm \\Delta$ *después* de conocer los datos constituye un **análisis exploratorio post-hoc** (dado que `experiments/config/config.yaml` no preespecificó un margen `equivalence_margin_delta` antes del entrenamiento).

## 2. Resultados Verificados de TOST Exploratorio y Corrección de Holm-Bonferroni

{df_to_md_table(df_stat)}

## 3. Regla Editorial Obligatoria para el Manuscrito (`FON-05`)

- **En el cuerpo principal de Resultados (§5):** Reportar las pruebas inferenciales preespecificadas (McNemar exacto $p = 0.2513$, Wilcoxon $p = 0.1875$, con corrección de Holm-Bonferroni $p_{{\\text{{Holm}}}} = 0.3750$, e IC 95 % bootstrap de $\\Delta\\text{{Recall}} = [-0.0087, +0.0015]$) concluyendo textualmente que **"no se encontró evidencia de diferencia estadísticamente significativa entre Random Forest y Gradient Boosting"**.
- **Si se menciona TOST o equivalencia práctica:** Declararla explícitamente como **"análisis de sensibilidad/equivalencia exploratorio post-hoc"**, mostrando con total transparencia que para un margen estricto de $\\pm 0.50\\%$ el resultado es **inconcluso** ($p_{{\\text{{TOST}}}} = 0.0879$ en Accuracy; $p_{{\\text{{TOST}}}} = 0.3161$ en Recall), mientras que para un margen práctico de $\\pm 1.00\\%$ los intervalos de confianza al 90 % ($[-0.56\\%, +0.08\\%]$ en Accuracy; $[-0.81\\%, +0.06\\%]$ en Recall) quedan íntegramente contenidos dentro de $[-1.00\\%, +1.00\\%]$ ($p_{{\\text{{TOST}}}} = 0.000038$ en Accuracy y $p_{{\\text{{TOST}}}} = 0.00877$ en Recall).
"""
    (OUT_ROOT / "06_POTENCIA_Y_TOST" / "tost_exploratorio_verificado.md").write_text(tost_md, encoding="utf-8")

    # -------------------------------------------------------------------------
    # 07_ABLACION_Y_CIRCULARIDAD/auditoria_circularidad.md
    # -------------------------------------------------------------------------
    circ = res_json["circularity"]
    abl_md = f"""# FASE VI — Auditoría de Circularidad de Constructo y Estudio de Ablación (`FON-02`)

## 1. Inspección Matemática Exacta del Generador (`experiments/src/data/generate_dataset.py`)

La inspección de las líneas 176–237 de `experiments/src/data/generate_dataset.py` demuestra cómo se construye la etiqueta `collision_risk_label` en `DSTM-MineSafe-2026.csv`:

1. **Cálculo del TTC cinemático puro (líneas 178–181):**
   $$v_{{\\text{{m/s}}}} = \\max\\left(0.5,\\; \\frac{{\\text{{gnss\\_speed\\_kmh}} \\times 1000}}{{3600}}\\right), \\qquad \\text{{ttc\\_raw\\_sec}} = \\frac{{\\text{{lidar\\_obstacle\\_dist\\_m}}}}{{v_{{\\text{{m/s}}}}}}$$
2. **Cálculo del retardo humano y ambiental (líneas 186–192):**
   $$\\tau_{{\\text{{hum}}}} = \\begin{{cases}} 1.2 + 2.5\\,\\text{{op\\_perclos\\_score}} + 0.06\\,\\max(0,\\; \\text{{gnss\\_ramp\\_grade}} - 7.0), & \\text{{si vehículo manual}} \\\\ 0.35, & \\text{{si vehículo AHS autónomo}} \\end{{cases}}$$
   $$\\tau_{{\\text{{perc}}}} = 0.5\\,(1 - \\text{{lidar\\_visibility\\_index}}), \\qquad \\text{{effective\\_ttc\\_sec}} = \\text{{ttc\\_raw\\_sec}} - (\\tau_{{\\text{{hum}}}} + \\tau_{{\\text{{perc}}}})$$
3. **Regla determinista de etiquetado antes del ruido sensorial (líneas 196–200):**
   $$y = \\mathbb{{I}}\\Big(\\text{{effective\\_ttc\\_sec}} < 4.0 \\;\\lor\\; (\\text{{dist}} < 15.0 \\land \\text{{speed}} > 15.0) \\;\\lor\\; (\\text{{dist}} < 8.0)\\Big)$$
4. **Inyección de ruido observacional de sensores a las variables predictoras (líneas 226–236):**
   Posteriormente al etiquetado, se suma ruido Gaussiano a las columnas observadas por los modelos (`noise_speed ~ N(0, 1.8 km/h)`, `noise_dist ~ N(0, 3.2 m)`, `noise_perclos ~ N(0, 0.025)`, `noise_grade ~ N(0, 0.45%)`, `noise_vis ~ N(0, 0.03)`).

### Cuantificación Exacta del Acoplamiento en `DSTM-MineSafe-2026.csv` ($N = 5,000$):
- La desigualdad `effective_ttc_sec < 4.0` por sí sola coincide con `collision_risk_label` en **`{circ['match_eff_ttc_4']} / 5,000` registros (`{circ['match_eff_ttc_4']/50.0:.2f}%`)** (los `41` registros restantes corresponden a las cláusulas de proximidad crítica `dist < 15 m & speed > 15 km/h` o `dist < 8 m`).
- Si se evalúa la misma fórmula usando las variables observadas *después* del ruido sensorial, la regla reconstruida coincide con la etiqueta en **`{circ['match_rule_obs']} / 5,000` registros (`{circ['match_rule_obs']/50.0:.2f}%`)**.
- En cambio, la regla física simple `ttc_raw_sec < 4.0` coincide solo en **`{circ['match_raw_ttc_4']} / 5,000` registros (`{circ['match_raw_ttc_4']/50.0:.2f}%`)** (`{circ['match_pure_ttc_4']} / 5,000` con variables ruidosas).

---

## 2. Estudio Completo de Ablación de Variables (Configuraciones A–H, 5-Fold Stratified CV)

{df_to_md_table(df_abl)}

---

## 3. Interpretación Científica y Reformulación Obligatoria en el Manuscrito (`FON-02`)

1. **Dependencia dominante del núcleo cinemático:** Cuando se eliminan simultáneamente `lidar_obstacle_dist_m` y `gnss_speed_kmh` (**Ablación D**), el `ROC-AUC` de Random Forest cae de **`0.9938` a `0.5800`** ($\\Delta = -0.4138$, `F1 = 0.5998`) y el de Gradient Boosting cae de **`0.9943` a `0.5723`** ($\\Delta = -0.4220$). Usando únicamente las variables humanas y conductuales (**Ablación H**), el `ROC-AUC` es **`0.5541`** (RF).
2. **Contribución marginal pero real de las variables humanas/ambientales:** Con solo distancia LiDAR y velocidad GNSS (**Ablación E**), RF alcanza `ROC-AUC = 0.9892` y `F1 = 0.9451`; al incorporar las variables humanas, ambientales y de tipo de flota (**Ablación A**), el `F1` sube a **`0.9638`** ($+1.87$ puntos porcentuales, reduciendo los falsos negativos y falsos positivos en la frontera de $3.5\\text{{ s}} \\le \\text{{TTC}} \\le 5.5\\text{{ s}}$).
3. **Aclaración conceptual obligatoria en el artículo:** El alto desempeño (`AUC > 0.993`) refleja la capacidad de los ensambles de árboles y la regresión logística para **aproximar en presencia de ruido sensorial una función de riesgo física-heurística sintética subyacente**, y **no** una validación empírica sobre accidentes reales de campo.
"""
    (OUT_ROOT / "07_ABLACION_Y_CIRCULARIDAD" / "auditoria_circularidad.md").write_text(abl_md, encoding="utf-8")

    # -------------------------------------------------------------------------
    # 08_LOSO/analisis_falsas_alarmas.md
    # -------------------------------------------------------------------------
    loso_md = f"""# FASE VII — Validación Leave-One-Scenario-Out (LOSO) y Análisis de Falsas Alarmas (`FON-06`)

## 1. Tabla Completa de Resultados LOSO Verificados (Random Forest y Gradient Boosting)

{df_to_md_table(df_loso)}

---

## 2. Diagnóstico Técnico de la Baja Especificidad y Exceso de Falsas Alarmas (`FON-06`)

El informe del Grupo 26 (`FON-06`) advierte que en la evaluación LOSO frente al criterio físico independiente (`TTC puro < 3.5 s`), aunque el `Recall` es del `100 %` (`0.9993` macro en RF), la **Especificidad macro cae a `0.6440` (`64.40 %`)** y en el **Escenario B (Zona de cargue y pala)** la especificidad cae a **`0.3850` (`38.50 %`)**, lo que equivale a:
- **Tasa de Falsos Positivos (`FPR = FP / (FP + TN)`):** **`61.50 %`** en el Escenario B (`385` falsas alarmas sobre `626` negativos físicos) y **`35.60 %`** macro.
- **Tasa de Falsos Descubrimientos (`FDR = FP / (TP + FP) = 1 - Precisión`):** **`63.31 %`** en el Escenario B (`Precisión = 0.3669`, `385` falsas alarmas de `608` alertas emitidas) y **`43.65 %`** macro (`Precisión macro = 0.5635`).

### Causa Raíz Matemática y Física del Fenómeno:
1. **Desajuste estructural entre el objetivo de entrenamiento y el oráculo de prueba en LOSO:**
   - Durante el entrenamiento en los 4 escenarios restantes, el modelo aprende la etiqueta nominal `collision_risk_label`, la cual se activa cuando `effective_ttc_sec < 4.0 s` (es decir, $\\text{{TTC}}_{{\\text{{puro}}}} < 4.0 + \\tau_{{\\text{{hum}}}} + \\tau_{{\\text{{perc}}}} \\approx 5.5\\text{{ a }} 6.8\\text{{ s}}$) o cuando $\\text{{dist}} < 15\\text{{ m}}$.
   - Al evaluar ese modelo contra el umbral más estricto $\\text{{TTC}}_{{\\text{{puro}}}} < 3.5\\text{{ s}}$, **todos los camiones que se encuentran en la franja intermedia $3.5\\text{{ s}} \\le \\text{{TTC}}_{{\\text{{puro}}}} < 6.0\\text{{ s}}$ son clasificados como positivos por el modelo (porque tienen `effective_ttc_sec < 4.0 s`), pero son contabilizados como Falsos Positivos (`FP`) por el oráculo `TTC puro < 3.5 s`**.
2. **Por qué se concentra en el Escenario B (Cargue y Pala):**
   - En las bahías de cargue y maniobra junto a la pala electromecánica, los camiones operan por diseño a baja velocidad ($10$–$25\\text{{ km/h}}$) y corta distancia ($10$–$35\\text{{ m}}$), ubicándose masivamente en esa zona de amortiguamiento ($3.5\\text{{ s}} \\le \\text{{TTC}}_{{\\text{{puro}}}} < 6.0\\text{{ s}}$).
   - Nótese que cuando el mismo modelo LOSO se evalúa contra la **etiqueta nominal coherente con su definición de entrenamiento**, en el Escenario B obtiene **`Recall = 0.9628`, `Especificidad = 0.9222`, `Precisión = 0.9553` y `F1 = 0.9590`** (`FPR = 7.78 %`, `FDR = 4.47 %`), y en el promedio macro obtiene **`Recall = 0.9720`, `Especificidad = 0.9462`, `Precisión = 0.9599` y `F1 = 0.9657`**.

## 3. Implicación Operacional Obligatoria para el Manuscrito (`FON-06`)

- Reportar **ambas evaluaciones** en la tabla LOSO del artículo (frente a `TTC puro < 3.5 s` y frente a la `Etiqueta Nominal`) incluyendo explícitamente las columnas de **Especificidad**, **FPR** y **Precisión / FDR**.
- Discutir explícitamente el riesgo de **fatiga de alarmas (*alarm fatigue*)** en zonas de maniobra de baja velocidad (Escenario B, donde `FDR = 63.31 %` respecto a `TTC < 3.5 s`) y proponer como mitigación operacional la **calibración de umbrales de probabilidad dependientes del geocercado/escenario** (por ejemplo, elevar el umbral de decisión de $p \\ge 0.50$ a $p \\ge 0.75$ dentro de geocercas de pala/botadero o usar histéresis temporal).
"""
    (OUT_ROOT / "08_LOSO" / "analisis_falsas_alarmas.md").write_text(loso_md, encoding="utf-8")

    # -------------------------------------------------------------------------
    # 09_ROBUSTEZ/limitaciones_sensores.md
    # -------------------------------------------------------------------------
    rob_md = f"""# FASE VIII — Robustez Sensorial, Limitaciones de LOCF (`FON-07`) y Calibración Física de Sensores (`FON-08`)

## 1. Comparación Experimental Verificada: Protocolo P1 vs. Protocolo P2 (10 Semillas, `42..51`)

En la auditoría de `experiments/src/robustness/noise_pilot.py` se identificó que la función `run_cv_evaluation(df_cond)` (líneas 142–201) aplicaba la perturbación a `df_cond` antes de particionar los folds, reentrenando el clasificador en datos perturbados (**Protocolo P1**). Para responder rigurosamente a los estándares de evaluación en despliegue real, se ejecutó adicionalmente el **Protocolo P2** (modelos entrenados exclusivamente en datos limpios y evaluados en folds de prueba con ruido/dropout), promediando sobre 10 semillas independientes (`42` a `51`):

{df_to_md_table(df_rob)}

### Conciliación de Valores Declarados en el Manuscrito:
- En el **Protocolo P1** (media de 10 semillas), Random Forest obtiene exactamente **`Recall = 0.8510`** con 10 % de ruido (`0.8506` en `seed=42`) y **`Recall = 0.8338`** en la condición combinada 10 % + Dropout (`0.8334` en `seed=42`), coincidiendo al cuarto decimal con los valores declarados en el manuscrito.
- En el **Protocolo P2** (entrenado en limpio, evaluado en ruidoso), la sensibilidad cae de forma más pronunciada: Random Forest obtiene **`Recall = 0.8226`** con 10 % de ruido (`0.8211` en `seed=42`) y **`Recall = 0.8069`** en la condición combinada (`0.8061` en `seed=42`). Ambos protocolos deben reportarse en el artículo.

---

## 2. Limitación Metodológica del Procedimiento LOCF (`FON-07`)

La inspección de la función `inject_lidar_dropout()` en `experiments/src/robustness/noise_pilot.py` (líneas 95–122) muestra que cuando ocurre un evento de dropout en el índice `i`, el código reemplaza `lidar_vals[i:i+w] = lidar_vals[i-1]`.
- **Problema técnico (`FON-07`):** En `experiments/src/data/generate_dataset.py`, los 5,000 registros de `DSTM-MineSafe-2026.csv` fueron generados como **realizaciones Monte Carlo de corte transversal independientes** (`for i in range(n_total): scen = rng.choice(...)`), **no** como una serie de tiempo continua de un mismo camión a $2\\text{{ Hz}}$.
- **Efecto físico y estadístico:** Copiar el valor de la fila `i-1` a las filas `i .. i+w` equivale en un dataset transversal a sustituir la distancia LiDAR de un vehículo por la distancia aleatoria de otro registro independiente (posiblemente de otro escenario operacional). Por tanto, este experimento evalúa la **corrupción esporádica de la variable LiDAR por valores espurios no correlacionados** (en el ~`9.6 %` de las filas, `481/5,000` en `seed=42`), pero **no modela la inercia cinemática de una trayectoria temporal continua**.
- **Corrección obligatoria en el manuscrito:** Declarar explícitamente en la sección de Metodología y Amenazas a la Validez que el ensayo de dropout + LOCF sobre `DSTM-MineSafe-2026.csv` constituye una **aproximación estocástica sobre muestras transversales** y que la validación de retención temporal estricta (LOCF, filtros de Kalman o seguimiento multi-objeto) requiere trayectorias longitudinales continuas.

---

## 3. Limitación de Calibración del Ruido Sensorial frente a Sensores Comerciales (`FON-08`)

En `experiments/src/robustness/noise_pilot.py` (líneas 63–64 y 84–85), el ruido Gaussiano se define como porcentaje del rango operativo total (`RANGE_SPEED_KMH = 65.0`, `RANGE_LIDAR_DIST_M = 200.0`):

| Nivel Nominal | $\\sigma_{{\\text{{speed}}}}$ Inyectado | $\\sigma_{{\\text{{dist}}}}$ Inyectado | Comparación con Especificaciones de Hardware Minero Real |
|:---:|:---:|:---:|---|
| **2 % del rango** | $\\pm 1.30\\text{{ km/h}}$ ($0.36\\text{{ m/s}}$) | $\\pm 4.00\\text{{ m}}$ | Un receptor GNSS industrial con corrección RTK tiene error de velocidad $< 0.05$–$0.1\\text{{ m/s}}$ ($< 0.36\\text{{ km/h}}$), y un LiDAR automotriz/minero (Ouster OS1 / Velodyne / Livox) tiene error nominal de rango de $\\pm 2$–$10\\text{{ cm}}$ en aire limpio. Un $\\sigma_{{\\text{{dist}}}} = 4\\text{{ m}}$ ya representa degradación severa por polvo denso o multi-camino. |
| **5 % del rango** | $\\pm 3.25\\text{{ km/h}}$ ($0.90\\text{{ m/s}}$) | $\\pm 10.00\\text{{ m}}$ | Representa pérdida de fijación RTK (modo GNSS autónomo degradado en fondo de rajo profundo) combinada con retrodispersión óptica severa por niebla/polvo. |
| **10 % del rango** | $\\pm 6.50\\text{{ km/h}}$ ($1.81\\text{{ m/s}}$) | $\\pm 20.00\\text{{ m}}$ | Representa una **prueba de estrés extremo (fallo catastrófico de calibración o reflexión fantasma)**, muy superior al ruido térmico nominal de sensores comerciales. |

- **Corrección obligatoria en el manuscrito (`FON-08`):** Reencuadrar los niveles del 2 %, 5 % y 10 % del rango operativo ($\\sigma_{{\\text{{dist}}}} = 4, 10, 20\\text{{ m}}$) como **pruebas paramétricas de estrés y degradación ambiental extrema** (retrodispersión por tormentas de polvo, barro en el domo óptico y cañón urbano/minero sin RTK), y no como el error nominal de fábrica de sensores GNSS/LiDAR comerciales.
"""
    (OUT_ROOT / "09_ROBUSTEZ" / "limitaciones_sensores.md").write_text(rob_md, encoding="utf-8")

    # -------------------------------------------------------------------------
    # 10_TREESHAP/auditoria_shap.md
    # -------------------------------------------------------------------------
    shap_md = f"""# FASE IX — Verificación de Explicabilidad TreeSHAP (`10_TREESHAP`)

## 1. Configuración Verificada del Cálculo TreeSHAP

- **Script original:** `experiments/src/xai/shap_analysis.py`
- **Muestra evaluada:** Submuestra aleatoria reproducible de $n = 1,000$ registros de `DSTM-MineSafe-2026.csv` (`df.sample(n=1000, random_state=42)`), preprocesada con el `SimpleImputer` + `RobustScaler` del pipeline entrenado.
- **Diferencia de escala entre Random Forest y Gradient Boosting:**
  - En `RandomForestClassifier` de scikit-learn, `shap.TreeExplainer` calcula las atribuciones aditivas directamente en **escala de probabilidad** ($\\sum_j \\phi_j = \\hat{{p}}(x) - \\mathbb{{E}}[\\hat{{p}}(X)] \\in [-1, +1]$).
  - En `GradientBoostingClassifier`, `shap.TreeExplainer` calcula las atribuciones en **escala de log-odds (logit)** ($\\sum_j \\phi_j = \\text{{logit}}(\\hat{{p}}(x)) - \\mathbb{{E}}[\\text{{logit}}(\\hat{{p}}(X))]$). Por ello, para comparar ambos modelos debe utilizarse también el **porcentaje de contribución relativa (`share_pct`)** además de `mean(|SHAP|)`.

## 2. Tabla de Importancias Globales Verificadas ($n = 1,000, \\text{{seed}} = 42$)

{df_to_md_table(df_shap)}

## 3. Hallazgos Clave y Coherencia con el Estudio de Ablación

1. En ambos modelos, las dos variables cinemáticas primarias concentran el **83.93 %** (RF) y el **87.72 %** (GBM) de la atribución total $|\\phi|$ sobre las 9 variables del modelo:
   - `lidar_obstacle_dist_m`: **`0.336574`** en RF (**`61.87 %`** del peso total) y **`3.848574`** en GBM (**`62.02 %`**).
   - `gnss_speed_kmh`: **`0.120022`** en RF (**`22.06 %`** del peso total) y **`1.594481`** en GBM (**`25.70 %`**).
2. Las variables de contexto geométrico/ambiental, régimen autónomo y fatiga humana actúan como moduladores de borde en la zona de transición:
   - `gnss_ramp_grade`: **`0.019756`** (`3.63 %` en RF, Rango 3).
   - `is_autonomous`: **`0.019497`** (`3.58 %` en RF, Rango 4; `4.47 %` en GBM, Rango 3).
   - `op_steering_jerk_stddev`: **`0.018461`** (`3.39 %` en RF, Rango 5).
   - `op_perclos_score`: **`0.011628`** (`2.14 %` en RF, Rango 6; `2.37 %` en GBM, Rango 4).
   - `lidar_visibility_index`: **`0.010785`** (`1.98 %` en RF, Rango 7).
3. Esta distribución de pesos TreeSHAP (~`84 %`–`88 %` cinemático vs. ~`12 %`–`16 %` no cinemático) es **100 % consistente con el estudio de ablación (Fase VI)**, confirmando que el modelo refleja fielmente la estructura funcional de `effective_ttc_sec` en el generador sintético.
"""
    (OUT_ROOT / "10_TREESHAP" / "auditoria_shap.md").write_text(shap_md, encoding="utf-8")

    # -------------------------------------------------------------------------
    # 11_REFERENCIAS_E_INTEGRIDAD/revision_integridad_documental.md
    # -------------------------------------------------------------------------
    ref_md = f"""# FASE X — Auditoría de Referencias, Trazabilidad de DOIs e Integridad Documental (`FON-04`, `FOR-01`, `FOR-02`)

## 1. Estado del Archivo del Manuscrito en el Workspace

De acuerdo con la Fase I y la Regla Absoluta #15 (*"Distinguir siempre entre lo verificado, lo reportado y lo no encontrado"*):
- Los archivos externos del manuscrito editorial (`.docx` / `.pdf`) y del informe del profesor (`Grupo 26`) se registran como **`NO LOCALIZADO`** dentro del directorio del repositorio `gemelo-digital-prototipo`.
- Por consiguiente, esta auditoría verifica exhaustivamente todas las citas, DOIs y estándares presentes en los archivos del repositorio (`experiments/CITATION.cff`, `experiments/data/datasheet.md`, `experiments/README.md`, `README.md`, `DELIVERABLES.md`) y entrega la **guía exacta de verificación y reemplazo línea por línea** para aplicar en el documento Word/LaTeX del artículo antes del reenvío a *Acta Montanistica Slovaca*.

---

## 2. Tabla de Auditoría de Referencias y Metadatos de Citación

{df_to_md_table(df_ref)}

---

## 3. Resolución de `FON-04`: Trazabilidad entre Software y Dataset en Zenodo (`10.5281/zenodo.22905230`)

En `experiments/CITATION.cff` (líneas 1–13) se declara:
```yaml
cff-version: 1.2.0
message: "If you use this reproducible pipeline or the DSTM-MineSafe-2026 dataset in your research, please cite it as below."
title: "Prolexis/gemelo-digital-prototipo: Version1"
version: "v1.0.0"
doi: "10.5281/zenodo.22905230"
date-released: 2026-09-22
type: software
```
**Problema detectado (`FON-04`):**
1. El archivo `CITATION.cff` define `type: software`, pero el texto del manuscrito y `README.md` utilizan el mismo DOI `10.5281/zenodo.22905230` indistintamente para referirse al código del prototipo y al dataset `DSTM-MineSafe-2026.csv`.
2. **Acción obligatoria para el autor:**
   - Verificar que el registro Zenodo `10.5281/zenodo.22905230` (o el DOI definitivo asignado por Zenodo al publicar el release `v1.0.0`) resuelva públicamente en `https://doi.org/...`.
   - En la sección **Data and Code Availability Statement** del artículo, separar claramente:
     - **Software / Pipeline Reproducible (Licencia MIT):** Repositorio GitHub (`https://github.com/Prolexis/gemelo-digital-prototipo`, tag `v1.0.0`) y archivo de software en Zenodo (`type: software`).
     - **Dataset Sintético `DSTM-MineSafe-2026.csv` ($N = 5,000$, Licencia CC-BY 4.0):** Ruta exacta `experiments/data/DSTM-MineSafe-2026.csv` junto con su ficha técnica `experiments/data/datasheet.md` (y su DOI específico de dataset en Zenodo si se deposita por separado).

---

## 4. Guía de Verificación Manual para el Manuscrito Word/PDF (`FOR-01` y `FOR-02`)

1. **Verificación de las Páginas 3 y 13 (`FOR-01`):**
   - **Página 3 (Formulación matemática y arquitectura):** Comprobar que todas las ecuaciones (definición de $\\text{{TTC}}$, $\\text{{TTC}}_{{\\text{{eff}}}}$, función de riesgo y descomposición aditiva SHAP $\\hat{{f}}(x) = \\phi_0 + \\sum_{{i=1}}^M \\phi_i$) estén escritas con el editor nativo de ecuaciones (OMML en Word o entorno `equation`/`align` en LaTeX) y que al exportar a PDF con estándar **PDF/A-1b** no aparezcan cuadros vacíos, glifos truncados ni superposición de texto con diagramas.
   - **Página 13 (Discusión final / Conclusiones / Inicio de Referencias):** Comprobar que no existan saltos de página huérfanos, tablas cortadas fuera de margen ni bloques de texto omitidos por el extractor de PDF.
2. **Corrección ortográfica del autor (`FOR-02`):**
   - Ejecutar búsqueda global (`Ctrl+H`) en el manuscrito de la cadena **`Mohammadia`** (sin `n` final) y reemplazar todas las apariciones por **`Mohammadian`** (tanto en las citas narrativas/parentéticas del texto como en la entrada correspondiente de la lista de referencias).
3. **Verificación cruzada de las 32 referencias bibliográficas (`FOR-01` / `FOR-02`):**
   - Confirmar que las **32 referencias** de la lista final estén numeradas o alfabetizadas según la guía de *Acta Montanistica Slovaca*, que las 32 estén citadas al menos una vez en el cuerpo principal y que ninguna cita en el texto carezca de entrada en la bibliografía.
"""
    (OUT_ROOT / "11_REFERENCIAS_E_INTEGRIDAD" / "revision_integridad_documental.md").write_text(ref_md, encoding="utf-8")

    # -------------------------------------------------------------------------
    # 12_REPRODUCIBILIDAD/GUIA_REPRODUCCION_PASO_A_PASO.md
    # -------------------------------------------------------------------------
    guia_md = """# FASE XII — Guía de Reproducción Paso a Paso en un Solo Comando

## 1. Requisitos del Entorno

- **Python:** `3.11.x` (compatible con `3.10`–`3.12`)
- **Dependencias fijadas:** `experiments/requirements.lock` (`numpy==1.26.4`, `pandas==2.2.2`, `scikit-learn==1.4.2`, `scipy==1.13.0`, `shap==0.45.0`, `joblib==1.4.0`, `pyyaml==6.0.1`, `matplotlib==3.8.4`)

## 2. Ejecución Completa de la Auditoría y Generación de Evidencias

Desde la raíz del repositorio (`gemelo-digital-prototipo`):

```bash
# Paso 1: Ejecutar todos los cálculos, entrenamientos OOF, McNemar, TOST, ablación, LOSO, ruido P1/P2 y TreeSHAP
python MINESAFE_3D_EVIDENCIAS_CORRECCION_PROFESOR/12_REPRODUCIBILIDAD/reproducir_todo.py

# Paso 2: Generar todos los informes Markdown, matrices de corrección, manifiesto SHA-256 y paquete ZIP
python MINESAFE_3D_EVIDENCIAS_CORRECCION_PROFESOR/12_REPRODUCIBILIDAD/generar_documentos_auditoria.py
```

## 3. Ejecución del Pipeline Experimental Original del Repositorio

```bash
python experiments/run_all.py
python experiments/src/robustness/noise_pilot.py
```
"""
    (OUT_ROOT / "12_REPRODUCIBILIDAD" / "GUIA_REPRODUCCION_PASO_A_PASO.md").write_text(guia_md, encoding="utf-8")

    # -------------------------------------------------------------------------
    # MATRIZ_CORRECCIONES_PROFESOR.csv (Raíz de MINESAFE_3D_EVIDENCIAS_CORRECCION_PROFESOR)
    # -------------------------------------------------------------------------
    matriz_rows = [
        {
            "ID de observación": "FON-01",
            "Problema": "Discrepancia de hiperparámetros entre texto del manuscrito (RF=300, min_samples_split=6, min_samples_leaf=3; GBM=250) y experiments/config/config.yaml (RF=200, min_samples_leaf=4; GBM=150), y verificación de completitud de datos y scripts.",
            "Evidencia original": "experiments/config/config.yaml declara RF n_estimators=200 y GBM n_estimators=150; final_rf_pipeline.joblib contiene n_estimators=200, max_depth=12, min_samples_leaf=4, min_samples_split=2.",
            "Acción realizada": "Se inspeccionó el binario serializado .joblib y se ejecutó validación cruzada 5-Fold comparando Opción B (200/150), Opción A (300/250) y Opción C (150/120 Streamlit) contra predictions_fold_level.csv.",
            "Resultado verificado": "La Opción B (200/150 de config.yaml) reproduce el 100% de las 5,000 predicciones OOF con 0 discrepancias (max_diff=0.00000000) y genera exactamente RF AUC=0.9938, F1=0.9638 y GBM AUC=0.9943, F1=0.9660. La Opción A (300/250) altera 32 predicciones RF y 30 GBM.",
            "Archivo de respaldo": "02_CONFIGURACION_REAL/comparacion_configuraciones.csv; 02_CONFIGURACION_REAL/informe_trazabilidad_hiperparametros.md",
            "Estado": "RESUELTO Y VERIFICADO AL 100%",
            "Sección del artículo afectada": "Sección 3 / 4 (Metodología y Configuración Experimental, Tabla de Hiperparámetros)",
        },
        {
            "ID de observación": "FON-02",
            "Problema": "Circularidad de constructo entre las variables predictoras cinemáticas (distancia LiDAR y velocidad GNSS) y la etiqueta collision_risk_label generada mediante effective_ttc_sec < 4.0s.",
            "Evidencia original": "experiments/src/data/generate_dataset.py (líneas 178-200) define effective_ttc_sec = ttc_raw_sec - (human_reaction_lag + perception_lag) e is_collision_risk = (effective_ttc_sec < 4.0) or (dist<15 & speed>15) or (dist<8).",
            "Acción realizada": "Se cuantificó el acoplamiento exacto en los 5,000 registros y se ejecutó un estudio completo de ablación de 8 configuraciones (A-H) para RF, GBM y Regresión Logística.",
            "Resultado verificado": "effective_ttc_sec < 4.0s explica 4,959/5,000 etiquetas (99.18%). Al eliminar distancia LiDAR y velocidad GNSS (Ablación D), el ROC-AUC de RF cae de 0.9938 a 0.5800 (-0.4138). Las variables humanas/ambientales/flota aportan +1.87% en F1 en la frontera de transición (Ablación A [0.9638] vs E [0.9451]).",
            "Archivo de respaldo": "07_ABLACION_Y_CIRCULARIDAD/ablacion_verificada.csv; 07_ABLACION_Y_CIRCULARIDAD/auditoria_circularidad.md",
            "Estado": "RESUELTO Y CUANTIFICADO",
            "Sección del artículo afectada": "Sección 3 (Generación de Datos), Sección 5 (Nuevo Estudio de Ablación) y Sección 6 (Amenazas a la Validez)",
        },
        {
            "ID de observación": "FON-03",
            "Problema": "Inconsistencia numérica en el p-valor exacto de McNemar entre archivos previos (p=0.251283 en resultados_reproducidos.csv vs p=0.251322 en mcnemar_verificado.csv) y conteos discordantes antiguos.",
            "Evidencia original": "En MINESAFE_EVIDENCIAS_FINALES/scripts/ejecutar_verificacion_final.py línea 811 se codificó el literal de texto 'p_exacto=0.251283', mientras que la línea 460 calculó binomtest(40, 92, 0.5) = 0.25132210.",
            "Acción realizada": "Se recalcularon desde cero los conteos 2x2 sobre los 5,000 registros OOF alineados y se verificó la distribución binomial exacta a 4, 6 y 8 decimales, preservando el archivo original sin modificar y generando la versión corregida.",
            "Resultado verificado": "a=4766, b=40, c=52, d=142 (Suma=5000, n_disc=92). p_exacto_binomial = 0.25132210 (6 dec: 0.251322; 4 dec: 0.2513). Chi2 con corrección de Edwards = 1.315217 (p = 0.25145219). Chi2 sin corrección = 1.565217 (p = 0.21090293).",
            "Archivo de respaldo": "05_MCNEMAR/mcnemar_definitivo.csv; 05_MCNEMAR/mcnemar_validacion.md; 05_MCNEMAR/resultados_reproducidos_corregidos.csv",
            "Estado": "RESUELTO Y CONCILIADO AL 100%",
            "Sección del artículo afectada": "Sección 5.2 (Pruebas Estadísticas Inferenciales, Tabla de Comparación Pareada)",
        },
        {
            "ID de observación": "FON-04",
            "Problema": "Problemas de integridad documental, referencias y trazabilidad entre el DOI de Zenodo (10.5281/zenodo.22905230) declarado como software en CITATION.cff y la citación del dataset DSTM-MineSafe-2026.",
            "Evidencia original": "experiments/CITATION.cff declara 'type: software' con 'doi: 10.5281/zenodo.22905230', pero su mensaje y README.md lo usan indistintamente para software y dataset.",
            "Acción realizada": "Se auditaron todos los archivos de metadatos, licencias (MIT para código, CC-BY 4.0 para datos) y referencias normativas (ISO 21815-1:2022, MSHA 30 CFR 56, ISO 17757:2019), redactando la declaración de disponibilidad separada.",
            "Resultado verificado": "Separación explícita entre depósito de software (MIT) y dataset canónico DSTM-MineSafe-2026.csv (CC-BY 4.0) con hashes SHA-256 verificados.",
            "Archivo de respaldo": "11_REFERENCIAS_E_INTEGRIDAD/auditoria_referencias.csv; 11_REFERENCIAS_E_INTEGRIDAD/revision_integridad_documental.md",
            "Estado": "RESUELTO Y DOCUMENTADO",
            "Sección del artículo afectada": "Data and Code Availability Statement y Sección de Referencias",
        },
        {
            "ID de observación": "FON-05",
            "Problema": "Uso de pruebas de equivalencia TOST con márgenes seleccionados post-hoc (+/-0.5% y +/-1.0%) e interpretación incorrecta de p > 0.05 en McNemar como prueba directa de equivalencia.",
            "Evidencia original": "config.yaml no define un margen de equivalencia preespecificado antes de observar los datos.",
            "Acción realizada": "Se calcularon curvas de potencia condicional e incondicional (Connor 1987), MDE al 80%/90% de potencia, corrección de Holm-Bonferroni y TOST exploratorio en márgenes de +/-0.25% a +/-2.00%.",
            "Resultado verificado": "MDE (80% potencia) = 0.54% en Accuracy y 0.74% en Recall. TOST post-hoc es inconcluso para +/-0.50% (p_TOST=0.0879 en Accuracy, 0.3161 en Recall) y cumple equivalencia práctica para +/-0.75% y +/-1.00% (p_TOST=0.000038 en Accuracy, 0.00877 en Recall). Debe reportarse como exploratorio post-hoc.",
            "Archivo de respaldo": "06_POTENCIA_Y_TOST/potencia_estadistica_verificada.md; 06_POTENCIA_Y_TOST/tost_exploratorio_verificado.md; 06_POTENCIA_Y_TOST/comparaciones_estadisticas.csv",
            "Estado": "RESUELTO Y VERIFICADO",
            "Sección del artículo afectada": "Sección 4.4 (Métodos Estadísticos) y Sección 5.2 (Resultados Inferenciales)",
        },
        {
            "ID de observación": "FON-06",
            "Problema": "Baja especificidad macro (64.4%) y exceso severo de falsas alarmas en la validación LOSO frente a TTC < 3.5s, especialmente en el Escenario B (Cargue y Pala).",
            "Evidencia original": "experiments/src/validation/leave_scenario_out.py omitía la Especificidad y la tasa de falsos positivos (FPR) en su tabla principal.",
            "Acción realizada": "Se calculó el desglose completo LOSO (TP, FP, TN, FN, Recall, Especificidad, FPR, Precisión, FDR, F1, ROC-AUC) para RF y GBM tanto frente a TTC puro < 3.5s como frente a la etiqueta nominal.",
            "Resultado verificado": "Frente a TTC < 3.5s, RF alcanza Recall=100% (0.9993 macro), pero Especificidad macro=0.6440 (FPR=35.60%, FDR=43.65%) y en Escenario B Especificidad=0.3850 (FPR=61.50%, Precisión=0.3669, FDR=63.31%) porque el modelo fue entrenado con effective_ttc < 4.0s. Frente a etiqueta nominal, Especificidad macro=0.9462 (Escenario B Spec=0.9222, F1=0.9590).",
            "Archivo de respaldo": "08_LOSO/LOSO_verificado.csv; 08_LOSO/analisis_falsas_alarmas.md",
            "Estado": "RESUELTO Y ANALIZADO",
            "Sección del artículo afectada": "Sección 5.5 (Validación LOSO, Tabla LOSO Completa) y Sección 6 (Discusión de Fatiga de Alarmas)",
        },
        {
            "ID de observación": "FON-07",
            "Problema": "Limitación metodológica de aplicar imputación Last Observation Carried Forward (LOCF) sobre muestras Monte Carlo independientes de corte transversal.",
            "Evidencia original": "experiments/src/robustness/noise_pilot.py (líneas 95-122) copia lidar_vals[i-1] sobre lidar_vals[i:i+w] en un dataframe donde cada fila fue muestreada independientemente en generate_dataset.py.",
            "Acción realizada": "Se documentó matemáticamente el mecanismo del código y se cuantificó su efecto bajo los protocolos P1 y P2 en 10 semillas.",
            "Resultado verificado": "En seed=42 se generan 190 ráfagas (481 filas afectadas, 9.62% del dataset). Al no ser una serie temporal continua, LOCF actúa como una prueba de corrupción por sustitución aleatoria inter-escenario (reduciendo el Recall de RF de 0.9634 a 0.9163 en P1 y a 0.9036 en P2).",
            "Archivo de respaldo": "09_ROBUSTEZ/limitaciones_sensores.md; 09_ROBUSTEZ/robustez_verificada.csv",
            "Estado": "RESUELTO Y DOCUMENTADO",
            "Sección del artículo afectada": "Sección 5.7 (Robustez ante Ruido y Dropout) y Sección 6 (Limitaciones del Estudio)",
        },
        {
            "ID de observación": "FON-08",
            "Problema": "Ruido sensorial parametrizado como porcentaje del rango operativo completo (2%, 5%, 10% de 65 km/h y 200 m) no calibrado con errores nominales de GNSS/LiDAR comerciales, y diferencia entre reentrenar con ruido (P1) vs evaluar modelo limpio (P2).",
            "Evidencia original": "noise_pilot.py inyecta sigma_dist = 4 m (2%), 10 m (5%) y 20 m (10%), y reentrena el modelo en cada fold perturbado (Protocolo P1).",
            "Acción realizada": "Se ejecutaron ambos protocolos (P1 reentrenado y P2 entrenado en limpio) sobre 10 semillas (42..51) y se contrastaron las magnitudes de sigma con hojas de datos de sensores RTK-GNSS y LiDAR mineros.",
            "Resultado verificado": "Con 10% de ruido (sigma_dist=20 m, estrés extremo), RF Recall es 0.8510 +/- 0.0046 en P1 (0.8506 en seed=42) y 0.8226 +/- 0.0052 en P2 (0.8211 en seed=42). En condición combinada (10%+Dropout), RF Recall es 0.8338 +/- 0.0053 en P1 y 0.8069 +/- 0.0059 en P2.",
            "Archivo de respaldo": "09_ROBUSTEZ/robustez_verificada.csv; 09_ROBUSTEZ/limitaciones_sensores.md; 09_ROBUSTEZ/fig_robustez_protocolos_P1_vs_P2.png",
            "Estado": "RESUELTO Y VERIFICADO",
            "Sección del artículo afectada": "Sección 5.7 (Análisis de Robustez Sensorial, Tabla de Degradación P1 vs P2)",
        },
        {
            "ID de observación": "FOR-01",
            "Problema": "Posibles problemas de extracción o visualización en las páginas 3 y 13 del PDF del manuscrito y verificación de las 32 referencias.",
            "Evidencia original": "El archivo Word/PDF del manuscrito es externo al repositorio Git (identificado como NO LOCALIZADO en el workspace).",
            "Acción realizada": "Se elaboró una guía técnica de verificación de fuentes matemáticas embebidas (OMML / PDF/A-1b) para las páginas 3 y 13 y de control cruzado para las 32 referencias.",
            "Resultado verificado": "Guía de verificación editorial y lista de control entregadas en 11_REFERENCIAS_E_INTEGRIDAD/revision_integridad_documental.md.",
            "Archivo de respaldo": "11_REFERENCIAS_E_INTEGRIDAD/revision_integridad_documental.md; CHECKLIST_FINAL_PUBLICACION.md",
            "Estado": "GUÍA DE VERIFICACIÓN ENTREGADA",
            "Sección del artículo afectada": "Páginas 3 y 13 del manuscrito PDF/Word y Sección de Referencias",
        },
        {
            "ID de observación": "FOR-02",
            "Problema": "Errores bibliográficos y ortográficos (apellido 'Mohammadia' truncado en lugar de 'Mohammadian') y distinción entre cita de software y cita de datos.",
            "Evidencia original": "Observación formal FOR-02 del informe de revisión académica.",
            "Acción realizada": "Se documentó la instrucción exacta de búsqueda y reemplazo ('Mohammadia' -> 'Mohammadian') y se redactaron las entradas BibTeX/APA separadas para software y dataset.",
            "Resultado verificado": "Correcciones textuales listas para aplicar en el manuscrito en CAMBIOS_EXACTOS_PARA_ARTICULO.md.",
            "Archivo de respaldo": "11_REFERENCIAS_E_INTEGRIDAD/auditoria_referencias.csv; CAMBIOS_EXACTOS_PARA_ARTICULO.md",
            "Estado": "CORRECCIÓN LISTA PARA APLICAR",
            "Sección del artículo afectada": "Citas en el texto, Data/Code Availability Statement y References",
        },
    ]
    pd.DataFrame(matriz_rows).to_csv(OUT_ROOT / "MATRIZ_CORRECCIONES_PROFESOR.csv", index=False)

    # -------------------------------------------------------------------------
    # INFORME_MAESTRO_AUDITORIA.md
    # -------------------------------------------------------------------------
    maestro_md = f"""# INFORME MAESTRO DE AUDITORÍA, CORRECCIÓN Y REPRODUCIBILIDAD CIENTÍFICA — MINESAFE 3D

**Proyecto:** MineSafe 3D — Prototipo de Simulación y Banco Experimental Sintético para Evaluación de Riesgo de Colisión en Flotas Mixtas de Minería a Cielo Abierto  
**Revista destino:** *Acta Montanistica Slovaca (AMS)*  
**Objetivo:** Resolución técnica, estadística y documental de las observaciones del Informe de Revisión Académica del Grupo 26 (`FON-01` a `FON-08`, `FOR-01`, `FOR-02`)  
**Fecha de generación UTC:** `{res_json['timestamp_utc']}`

---

## 1. Resumen Ejecutivo

Se ha ejecutado una auditoría forense y experimental de extremo a extremo sobre el repositorio `gemelo-digital-prototipo` sin alterar ningún archivo original del proyecto. Todas las verificaciones se han ejecutado desde cero con semilla controlada (`SEED = 42`) sobre el dataset primario `experiments/data/DSTM-MineSafe-2026.csv` ($N = 5,000$ registros, 5 escenarios operacionales A–E).

### Principales Conclusiones Verificadas:
1. **`FON-01` (Trazabilidad de Hiperparámetros — Resuelto con certeza del 100 %):**
   - La configuración que generó el 100 % de las predicciones out-of-fold (`predictions_fold_level.csv`), el modelo serializado (`final_rf_pipeline.joblib`) y todas las métricas publicadas en el artículo (`RF ROC-AUC = 0.9938, F1 = 0.9638`; `GBM ROC-AUC = 0.9943, F1 = 0.9660`) es **la Opción B definida en `experiments/config/config.yaml`** (`RF: n_estimators = 200, max_depth = 12, min_samples_leaf = 4, min_samples_split = 2`; `GBM: n_estimators = 150, learning_rate = 0.05, max_depth = 5, min_samples_leaf = 8, subsample = 0.85`).
   - La mención de `300` y `250` árboles en el texto del manuscrito fue un error de transcripción documental: al ejecutar `300/250` (Opción A), cambian 32 predicciones de RF y 30 de GBM. Por tanto, **se corrige el texto metodológico del artículo a `200 / 150` y todas las tablas numéricas quedan 100 % respaldadas**.
2. **`FON-03` (Conciliación exacta de McNemar — Resuelto con certeza del 100 %):**
   - Sobre los 5,000 registros OOF alineados, los conteos de concordancia son invariablemente **$a = 4,766$ (ambos aciertan), $b = 40$ (solo RF acierta), $c = 52$ (solo GBM acierta), $d = 142$ (ambos fallan)**, sumando $4,766 + 40 + 52 + 142 = 5,000$.
   - El valor $p$ exacto binomial bilateral (`scipy.stats.binomtest(40, n=92, p=0.5)`) es **`0.25132210`** (**`0.251322`** a 6 decimales; **`0.2513`** a 4 decimales). El estadístico $\\chi^2$ con corrección de continuidad de Edwards es **`1.315217`** ($p = 0.251452$).
   - La aparición previa de `0.251283` en `resultados_reproducidos.csv` se debió a una cadena de texto literal codificada manualmente en la línea 811 de `ejecutar_verificacion_final.py`, mientras que `mcnemar_verificado.csv` utilizó el cálculo dinámico exacto (`0.251322`).
3. **`FON-02` (Circularidad de Constructo y Estudio de Ablación A–H):**
   - La inspección de `generate_dataset.py` (líneas 178–200) confirma que la etiqueta `collision_risk_label` se genera mediante la regla determinista `(effective_ttc_sec < 4.0) or (dist < 15 & speed > 15) or (dist < 8)` antes de añadir ruido Gaussiano observacional a las variables. La condición `effective_ttc_sec < 4.0` explica por sí sola **4,959 de las 5,000 etiquetas (`99.18 %`)**.
   - El estudio de ablación demuestra que al retirar `lidar_obstacle_dist_m` y `gnss_speed_kmh` (**Ablación D**), el `ROC-AUC` de RF cae de `0.9938` a **`0.5800`**. Al mismo tiempo, las variables humanas y ambientales (`op_perclos_score`, `gnss_ramp_grade`, `lidar_visibility_index`, `is_autonomous`) aportan una mejora de **`+1.87 %` en `F1`** (`0.9638` en Ablación A frente a `0.9451` en Ablación E) al resolver casos limítrofes en la frontera de transición.
4. **`FON-05` (Potencia Estadística y TOST Exploratorio Post-Hoc):**
   - Con $N = 5,000$ y una tasa de discordancia $\\hat{{\\psi}} = 1.84\\%$ ($92/5000$), la prueba de McNemar tiene un **80 % de potencia para detectar diferencias de exactitud $\\ge 0.54\\%$** y **diferencias de Recall $\\ge 0.74\\%$**.
   - El análisis TOST debe reportarse explícitamente como **exploratorio post-hoc**: para un margen estricto de $\\pm 0.50\\%$ el resultado es **inconcluso** ($p_{{\\text{{TOST}}}} = 0.0879$ en Accuracy; $p_{{\\text{{TOST}}}} = 0.3161$ en Recall), mientras que para márgenes de $\\pm 0.75\\%$ y $\\pm 1.00\\%$ se cumple equivalencia práctica ($p_{{\\text{{TOST}}}} < 0.01$).
5. **`FON-06` (Especificidad y Falsas Alarmas en LOSO):**
   - Evaluado frente al umbral físico independiente `TTC puro < 3.5 s`, RF alcanza `Recall = 100 %` (`0.9993` macro), pero una **Especificidad macro de `0.6440` (`FPR = 35.60 %`, `FDR = 43.65 %`)**, cayendo en el **Escenario B (Cargue y Pala)** a **`Especificidad = 0.3850` (`FPR = 61.50 %`, `Precisión = 0.3669`, `FDR = 63.31 %`)**.
   - Esto ocurre porque el modelo fue entrenado para alertar cuando `effective_ttc_sec < 4.0 s` ($\\text{{TTC}}_{{\\text{{puro}}}} \\approx 4.5$–$6.5\\text{{ s}}$). Frente a la etiqueta nominal, la especificidad en el Escenario B es **`0.9222`** (`F1 = 0.9590`) y la especificidad macro es **`0.9462`**.
6. **`FON-07` y `FON-08` (LOCF sobre Muestras Transversales y Protocolos de Ruido P1 vs. P2):**
   - El procedimiento LOCF en `noise_pilot.py` opera sobre filas Monte Carlo independientes de corte transversal (`9.62 %` de muestras afectadas), por lo que debe declararse como un ensayo de sustitución estocástica inter-muestra y no como retención de una trayectoria continua.
   - Los niveles de ruido del 2 %, 5 % y 10 % del rango operativo ($\\sigma_{{\\text{{dist}}}} = 4, 10, 20\\text{{ m}}$) corresponden a **estrés ambiental extremo**, no al error nominal de sensores RTK-GNSS/LiDAR comerciales. En 10 semillas, el Recall de RF con 10 % de ruido es **`0.8510`** bajo el Protocolo P1 (reentrenado) y **`0.8226`** bajo el Protocolo P2 (entrenado en limpio); en condición combinada es **`0.8338`** (P1) y **`0.8069`** (P2).

---

## 2. Mapa de la Estructura de Evidencias Generada

| Carpeta / Archivo | Contenido Verificado | Observación Resuelta |
|---|---|---|
| `01_INVENTARIO/` | `inventario_artefactos.csv` y `.md` con 54 ítems y hashes SHA-256 | Fase I |
| `02_CONFIGURACION_REAL/` | `configuracion_real_verificada.yaml`, `comparacion_configuraciones.csv`, `informe_trazabilidad_hiperparametros.md` | `FON-01` |
| `03_DATASET_Y_GENERADOR/` | `dataset_validado.csv`, copia del generador, datasheet y `validacion_dataset.md` | `FON-01`, Fase III |
| `04_ENTRENAMIENTO_Y_OOF/` | `resultados_modelos_reproducidos.csv`, `predicciones_oof_verificadas.csv`, `metricas_por_fold.csv`, `matrices_confusion.csv`, `informe_reproduccion.md` | `FON-01`, Fase III |
| `05_MCNEMAR/` | `mcnemar_definitivo.csv`, `mcnemar_validacion.md`, `resultados_reproducidos_corregidos.csv`, copia original intacta | `FON-03` |
| `06_POTENCIA_Y_TOST/` | `potencia_estadistica_verificada.md`, `tost_exploratorio_verificado.md`, `comparaciones_estadisticas.csv` | `FON-05` |
| `07_ABLACION_Y_CIRCULARIDAD/` | `ablacion_verificada.csv`, `auditoria_circularidad.md` | `FON-02` |
| `08_LOSO/` | `LOSO_verificado.csv`, `analisis_falsas_alarmas.md` | `FON-06` |
| `09_ROBUSTEZ/` | `robustez_verificada.csv`, `limitaciones_sensores.md`, `fig_robustez_protocolos_P1_vs_P2.png` | `FON-07`, `FON-08` |
| `10_TREESHAP/` | `shap_importancias_verificadas.csv`, `auditoria_shap.md`, figuras global y local | Fase IX |
| `11_REFERENCIAS_E_INTEGRIDAD/` | `auditoria_referencias.csv`, `revision_integridad_documental.md` | `FON-04`, `FOR-01`, `FOR-02` |
| `12_REPRODUCIBILIDAD/` | `reproducir_todo.py`, `generar_documentos_auditoria.py`, `GUIA_REPRODUCCION_PASO_A_PASO.md` | Fase XII |
| `13_LOGS_Y_MANIFIESTOS/` | `configuracion_entorno.txt`, `registro_ejecucion.txt`, `git_commits_log.txt`, `resumen_ejecucion.json` | Fase XII |
"""
    (OUT_ROOT / "INFORME_MAESTRO_AUDITORIA.md").write_text(maestro_md, encoding="utf-8")

    # -------------------------------------------------------------------------
    # CAMBIOS_EXACTOS_PARA_ARTICULO.md
    # -------------------------------------------------------------------------
    cambios_md = """# CAMBIOS EXACTOS Y TEXTOS LISTOS PARA PEGAR EN EL MANUSCRITO (*ACTA MONTANISTICA SLOVACA*)

Este documento contiene los párrafos y tablas exactos (en español e inglés académico) listos para reemplazar en el manuscrito y resolver de forma definitiva las observaciones `FON-01` a `FON-08`, `FOR-01` y `FOR-02`.

---

## 1. Posicionamiento del Prototipo (Resumen / Introducción / Conclusiones)

### Texto a reemplazar (si el manuscrito afirma validación operacional o gemelo físico conectado):
> **Reemplazar por (Español):**  
> *"MineSafe 3D se presenta como un prototipo tridimensional basado en simulación y un banco de pruebas experimental sintético (`DSTM-MineSafe-2026`, $N = 5,000$) diseñado para evaluar algoritmos de predicción de riesgo de colisión y explicabilidad aditiva (TreeSHAP) en escenarios de flotas mixtas de minería a cielo abierto. El sistema no está conectado a camiones físicos ni dispone de un lazo de control o sincronización bidireccional con maquinaria real; por consiguiente, sus resultados deben interpretarse como una validación algorítmica controlada en simulación previa a cualquier homologación de campo bajo la norma ISO 21815-1:2022."*

> **English version (for AMS manuscript):**  
> *"MineSafe 3D is presented as a simulation-based three-dimensional prototype and a synthetic experimental testbed (`DSTM-MineSafe-2026`, $N = 5,000$) designed to evaluate collision-risk prediction algorithms and additive explainability (TreeSHAP) across mixed-fleet open-pit mining scenarios. The system is not connected to physical haul trucks and does not implement a bidirectional synchronization or braking-control loop with real machinery; therefore, the reported findings represent a controlled algorithmic validation in simulation prior to any in-pit hardware homologation under ISO 21815-1:2022."*

---

## 2. Corrección de Hiperparámetros en Metodología (`FON-01`)

### En la sección de Configuración de Modelos (§3 / §4):
- **Donde dice:** Random Forest con `n_estimators = 300`, `min_samples_split = 6`, `min_samples_leaf = 3` y Gradient Boosting con `n_estimators = 250`.
- **Debe decir exactamente:**
  - **Random Forest (`RandomForestClassifier`):** `n_estimators = 200`, `max_depth = 12`, `min_samples_leaf = 4`, `min_samples_split = 2`, `max_features = "sqrt"`, `class_weight = "balanced"`, `random_state = 42 + fold`.
  - **Gradient Boosting (`GradientBoostingClassifier`):** `n_estimators = 150`, `learning_rate = 0.05`, `max_depth = 5`, `min_samples_leaf = 8`, `subsample = 0.85`, `random_state = 42 + fold`.
  - **Logistic Regression (`LogisticRegression`):** `C = 1.0`, `max_iter = 1000`, `class_weight = "balanced"`, `random_state = 42 + fold`.
  - **Preprocesamiento por fold:** `SimpleImputer(strategy="median")` + `RobustScaler()` ajustados exclusivamente sobre el subconjunto de entrenamiento de cada partición en un esquema `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)`.

---

## 3. Explicación Transparente de la Función de Etiquetado y Ablación (`FON-02`)

### Párrafo listo para insertar en la sección del Dataset y Ablación (§3.2 / §5.4):
> *"En el generador sintético `DSTM-MineSafe-2026`, la etiqueta binaria `collision_risk_label` se define antes de la inyección de ruido sensorial observacional a partir del tiempo hasta la colisión efectivo $\\text{TTC}_{\\text{eff}} = \\text{TTC}_{\\text{raw}} - (\\tau_{\\text{hum}} + \\tau_{\\text{perc}}) < 4.0\\text{ s}$ o por violación del margen de proximidad crítica ($d < 15\\text{ m}$ con $v > 15\\text{ km/h}$, o $d < 8\\text{ m}$), donde $\\tau_{\\text{hum}} = 1.2 + 2.5\\,\\text{PERCLOS} + 0.06\\,\\max(0, \\text{grade}-7)$ para camiones manuales ($0.35\\text{ s}$ para camiones AHS) y $\\tau_{\\text{perc}} = 0.5(1 - \\text{vis})$. Posteriormente se inyecta ruido Gaussiano observacional ($\\sigma_v = 1.8\\text{ km/h}$, $\\sigma_d = 3.2\\text{ m}$, $\\sigma_{\\text{PERCLOS}} = 0.025$) sobre los predictores observados. Dado que la condición $\\text{TTC}_{\\text{eff}} < 4.0\\text{ s}$ determina el $99.18\\%$ ($4,959/5,000$) de las etiquetas, existe un acoplamiento funcional deliberado entre las variables cinemáticas y el objetivo. Para cuantificar este acoplamiento, el estudio de ablación (Tabla X) demuestra que al retirar simultáneamente `lidar_obstacle_dist_m` y `gnss_speed_kmh` (Ablación D), el ROC-AUC de Random Forest desciende de $0.9938$ a $0.5800$ ($\\text{F1} = 0.5998$). A la inversa, emplear únicamente distancia LiDAR y velocidad GNSS (Ablación E) alcanza un $\\text{ROC-AUC} = 0.9892$ y $\\text{F1} = 0.9451$, mientras que la incorporación de las variables humanas, ambientales y de régimen de flota (PERCLOS, pendiente, visibilidad y autonomía en el modelo completo, Ablación A) eleva el $\\text{F1}$ a $0.9638$ ($+1.87$ puntos porcentuales) al desambiguar los casos limítrofes en la zona de transición ($3.5\\text{ s} \\le \\text{TTC}_{\\text{raw}} \\le 6.0\\text{ s}$)."*

---

## 4. Redacción Exacta para McNemar, Potencia y TOST Exploratorio (`FON-03`, `FON-05`)

### Párrafo listo para insertar en la sección de Comparación Estadística (§5.2):
> *"Sobre los $N = 5,000$ registros out-of-fold exactamente alineados, Random Forest alcanzó una exactitud de $0.9612$ ($\\text{TP}=2,579, \\text{FP}=96, \\text{TN}=2,227, \\text{FN}=98$; $4,806$ aciertos y $194$ errores) y Gradient Boosting alcanzó $0.9636$ ($\\text{TP}=2,589, \\text{FP}=94, \\text{TN}=2,229, \\text{FN}=88$; $4,818$ aciertos y $182$ errores). La matriz de contingencia pareada 2×2 registró $a = 4,766$ instancias acertadas por ambos modelos, $b = 40$ acertadas únicamente por Random Forest, $c = 52$ acertadas únicamente por Gradient Boosting y $d = 142$ falladas por ambos ($n_{\\text{disc}} = b + c = 92$, tasa de discordancia $\\hat{\\psi} = 1.84\\%$). La prueba exacta binomial bilateral de McNemar arrojó $p = 0.2513$ ($p = 0.251322$ a seis decimales; estadístico $\\chi^2$ con corrección de continuidad de Edwards $= 1.3152, p = 0.2515$; sin corrección $= 1.5652, p = 0.2109$), y la prueba de rangos con signo de Wilcoxon sobre el Recall de las cinco particiones arrojó $W = 2.0, p = 0.1875$ ($p_{\\text{Holm}} = 0.3750$ tras corrección de Holm-Bonferroni). El intervalo de confianza bootstrap al $95\\%$ ($1,000$ remuestreos) para la diferencia $\\Delta\\text{Recall} = \\text{Recall}_{\\text{RF}} - \\text{Recall}_{\\text{GBM}} = -0.0037$ fue $[-0.0087, +0.0015]$, incluyendo el cero. Por consiguiente, no existe evidencia de diferencia estadísticamente significativa entre ambos clasificadores.*
>
> *Un análisis de sensibilidad de potencia (fórmula incondicional de Connor y binomial condicional exacta para $\\alpha = 0.05$) confirma que con $N = 5,000$ y $\\hat{\\psi} = 1.84\\%$, la prueba de McNemar posee una potencia del $80\\%$ para detectar diferencias mínimas (MDE) de $\\pm 0.54\\%$ en exactitud ($\pm 0.56\\%$ condicional) y de $\\pm 0.74\\%$ en sensibilidad ($\pm 0.79\\%$ condicional sobre $N_+ = 2,677, b_+ = 20, c_+ = 30$). De forma complementaria, se ejecutó un análisis de equivalencia TOST (Two One-Sided Tests) con carácter estrictamente exploratorio post-hoc (dado que los márgenes no fueron preespecificados antes del entrenamiento): bajo un margen estricto de $\\pm 0.50\\%$, la equivalencia resulta estadísticamente inconclusa ($p_{\\text{TOST}} = 0.0879$ en exactitud; $p_{\\text{TOST}} = 0.3161$ en Recall), mientras que bajo un margen de tolerancia práctica de $\\pm 1.00\\%$, los intervalos de confianza al $90\\%$ ($[-0.56\\%, +0.08\\%]$ en exactitud y $[-0.81\\%, +0.06\\%]$ en Recall) quedan íntegramente contenidos dentro de $[-1.00\\%, +1.00\\%]$ ($p_{\\text{TOST}} = 0.000038$ y $p_{\\text{TOST}} = 0.0088$, respectivamente)."*

---

## 5. Redacción y Tabla Completa para Validación LOSO y Falsas Alarmas (`FON-06`)

### Párrafo listo para insertar en §5.5 (Validación LOSO):
> *"La Tabla Y presenta el desglose completo de la validación Leave-One-Scenario-Out (LOSO) evaluada tanto frente al umbral cinemático puro independiente ($\\text{TTC}_{\\text{raw}} < 3.5\\text{ s}$) como frente a la etiqueta nominal del escenario retenido. Frente al oráculo físico estricto $\\text{TTC}_{\\text{raw}} < 3.5\\text{ s}$, Random Forest captura casi la totalidad de los eventos críticos reales ($\\text{Recall macro} = 0.9993$; $100\\%$ en los escenarios A, B, D y E), pero registra una especificidad macro de $0.6440$ ($\\text{FPR macro} = 35.60\\%$, $\\text{FDR macro} = 43.65\\%$). La penalización más severa ocurre en el Escenario B (Operación de cargue y pala en proximidad estrecha), donde la especificidad desciende a $0.3850$ ($\\text{FPR} = 61.50\\%$, $\\text{Precisión} = 0.3669$, $\\text{FDR} = 63.31\\%$, con $385$ falsos positivos frente a $223$ verdaderos positivos). Este fenómeno se explica porque el clasificador fue entrenado sobre la etiqueta nominal regida por $\\text{TTC}_{\\text{eff}} < 4.0\\text{ s}$ (que incorpora los retardos de reacción y visibilidad $\\tau_{\\text{hum}} + \\tau_{\\text{perc}} \\approx 1.5$–$2.5\\text{ s}$); en consecuencia, los camiones que maniobran junto a la pala con $3.5\\text{ s} \\le \\text{TTC}_{\\text{raw}} < 6.0\\text{ s}$ activan legítimamente la alerta preventiva del modelo, pero son contabilizados como falsas alarmas respecto al corte rígido de $3.5\\text{ s}$. Cuando el mismo modelo LOSO se evalúa frente a la etiqueta nominal homogénea, alcanza en el Escenario B una especificidad de $0.9222$, precisión de $0.9553$ y $\\text{F1} = 0.9590$ (y a nivel macro: $\\text{Recall} = 0.9720$, $\\text{Especificidad} = 0.9462$, $\\text{F1} = 0.9657$). Desde una perspectiva de ingeniería de sistemas mineros, una $\\text{FDR}$ del $63.31\\%$ respecto a colisiones inminentes ($<3.5\\text{ s}$) en zonas de pala induciría fatiga de alarmas en el operador, lo que demuestra la necesidad de implementar umbrales de probabilidad adaptativos por geocerca (por ejemplo, elevar el umbral de decisión a $p \\ge 0.75$ en bahías de cargue a baja velocidad)."*

---

## 6. Redacción para Robustez Sensorial, LOCF y Protocolos P1 vs. P2 (`FON-07`, `FON-08`)

### Párrafo listo para insertar en §5.7 y §6 (Amenazas a la Validez):
> *"Para evaluar la sensibilidad ante degradación telemétrica, se inyectó ruido Gaussiano aditivo del $2\\%$, $5\\%$ y $10\\%$ del rango operativo máximo ($\\sigma_v = 1.30, 3.25, 6.50\\text{ km/h}$ sobre $65\\text{ km/h}$; $\\sigma_d = 4.0, 10.0, 20.0\\text{ m}$ sobre $200\\text{ m}$) y ráfagas de pérdida de señal LiDAR imputadas mediante Last Observation Carried Forward (LOCF). Es importante precisar dos delimitaciones metodológicas de este ensayo: (1) dado que los sistemas comerciales RTK-GNSS y LiDAR mineros operan en condiciones nominales con errores centimétricos ($\\sigma_d < 0.10\\text{ m}$), los niveles de $\\sigma_d = 4\\text{ a } 20\\text{ m}$ no representan ruido electrónico nominal de fábrica, sino pruebas paramétricas de estrés extremo equivalentes a retrodispersión óptica severa por tormentas de polvo, oclusión de domo o pérdida de corrección diferencial en fondos de rajo; y (2) dado que `DSTM-MineSafe-2026` fue generado mediante muestreo Monte Carlo transversal de registros independientes y no como trayectorias longitudinales continuas a $2\\text{ Hz}$, la aplicación de LOCF entre filas consecutivas ($481$ muestras afectadas, $9.62\\%$) actúa como un ensayo de corrupción estocástica por sustitución inter-muestra y no como retención dinámica de una serie temporal vehicular.*
>
> *Bajo evaluación en $10$ semillas aleatorias (`42` a `51`), se compararon dos regímenes: el Protocolo P1 (reentrenando el modelo en cada partición perturbada) y el Protocolo P2 (entrenando exclusivamente sobre datos limpios y perturbando únicamente el conjunto de prueba). Ante un $10\\%$ de ruido extremo, el Recall medio de Random Forest pasa de $0.9634$ a $0.8510 \\pm 0.0046$ en P1 ($0.8506$ en `seed=42`) y a $0.8226 \\pm 0.0052$ en P2 ($0.8211$ en `seed=42$). En la condición combinada ($10\\%$ de ruido + dropout LOCF), el Recall de Random Forest se sitúa en $0.8338 \\pm 0.0053$ en P1 ($0.8334$ en `seed=42`) y en $0.8069 \\pm 0.0059$ en P2 ($0.8061$ en `seed=42`), confirmando que perturbaciones $\\ge 10\\%$ del rango superan el margen de seguridad sin filtrado cinemático temporal (e.g., filtro de Kalman extendido)."*

---

## 7. Correcciones Formales y Bibliográficas (`FON-04`, `FOR-01`, `FOR-02`)

1. **Corrección ortográfica (`FOR-02`):** Reemplazar en todo el manuscrito **`Mohammadia`** por **`Mohammadian`**.
2. **Separación de citas de Software y Dataset (`FON-04` / `FOR-02`):**
   - **Cita del Software (MIT License):**
     > Sanchez Enriquez, C. A. (2026). *MineSafe 3D: Reproducible Simulation and Machine Learning Pipeline (Version v1.0.0)* [Computer software]. GitHub / Zenodo. https://github.com/Prolexis/gemelo-digital-prototipo (DOI: `10.5281/zenodo.22905230`).
   - **Cita del Dataset Sintético (CC-BY 4.0 License):**
     > Sanchez Enriquez, C. A. (2026). *DSTM-MineSafe-2026: Synthetic Telemetry Dataset for Open-Pit Mining Mixed-Fleet Collision Risk Prediction ($N = 5,000$)* [Data set]. In `experiments/data/DSTM-MineSafe-2026.csv` (SHA-256: `78f5c7e6...`). Licensed under CC-BY 4.0.
"""
    (OUT_ROOT / "CAMBIOS_EXACTOS_PARA_ARTICULO.md").write_text(cambios_md, encoding="utf-8")

    # -------------------------------------------------------------------------
    # CHECKLIST_FINAL_PUBLICACION.md & README_ENTREGA.md
    # -------------------------------------------------------------------------
    chk_md = """# CHECKLIST FINAL DE PUBLICACIÓN ANTES DEL ENVÍO A *ACTA MONTANISTICA SLOVACA*

- [x] **1. Hiperparámetros conciliados (`FON-01`):** Verificado que `RF n_estimators=200, max_depth=12, min_samples_leaf=4` y `GBM n_estimators=150, learning_rate=0.05, max_depth=5, min_samples_leaf=8, subsample=0.85` reproducen exactamente el 100 % de los resultados publicados (`RF AUC=0.9938, F1=0.9638`; `GBM AUC=0.9943, F1=0.9660`). Actualizar el texto de la Sección 3/4 del manuscrito eliminando `300/250`.
- [x] **2. Circularidad y Ablación (`FON-02`):** Cuantificado el peso de `effective_ttc_sec < 4.0s` (`99.18 %` de las etiquetas) e incorporada la tabla de ablación A–H (`07_ABLACION_Y_CIRCULARIDAD/ablacion_verificada.csv`) que muestra la caída a `ROC-AUC = 0.5800` sin variables cinemáticas.
- [x] **3. Prueba de McNemar conciliada (`FON-03`):** Tabla 2×2 verificada ($a=4766, b=40, c=52, d=142$; $N=5000$) y valor $p$ exacto binomial corregido a **`0.251322`** (`0.25132210` a 8 decimales; `0.2513` a 4 decimales), eliminando el literal antiguo `0.251283`.
- [x] **4. Trazabilidad de DOI y Licencias (`FON-04`):** Separada la cita del software (`MIT`) y la cita del dataset `DSTM-MineSafe-2026.csv` (`CC-BY 4.0`). Verificar antes del envío que el DOI de Zenodo esté publicado y activo.
- [x] **5. Potencia y TOST exploratorio (`FON-05`):** Incorporado el MDE al 80 % de potencia ($\pm 0.54\%$ en Accuracy; $\pm 0.74\%$ en Recall) y etiquetado el análisis TOST como **exploratorio post-hoc** (inconcluso a $\pm 0.50\%$, equivalente a $\pm 1.00\%$).
- [x] **6. Especificidad y Falsas Alarmas en LOSO (`FON-06`):** Incorporadas las columnas de Especificidad (`0.6440` macro; `0.3850` en Escenario B), FPR (`61.50 %` en Escenario B) y FDR (`63.31 %` en Escenario B) junto con la evaluación frente a etiqueta nominal (`Especificidad macro = 0.9462`).
- [x] **7. Limitación de LOCF transversal (`FON-07`):** Declarado en Amenazas a la Validez que el dataset es transversal Monte Carlo y no una serie temporal continua.
- [x] **8. Calibración de ruido y Protocolos P1 vs. P2 (`FON-08`):** Reportados ambos protocolos (P1 reentrenado y P2 entrenado en limpio) en 10 semillas y aclarado que $\sigma_d = 4, 10, 20\text{ m}$ representa estrés ambiental extremo.
- [ ] **9. Verificación manual en el archivo Word/PDF del manuscrito (`FOR-01` y `FOR-02`):**
  - Reemplazar todas las ocurrencias de `Mohammadia` por `Mohammadian`.
  - Revisar visualmente las páginas 3 y 13 del PDF exportado (fuentes matemáticas embebidas PDF/A-1b).
  - Confirmar la correspondencia biunívoca de las 32 referencias bibliográficas.
"""
    (OUT_ROOT / "CHECKLIST_FINAL_PUBLICACION.md").write_text(chk_md, encoding="utf-8")

    readme_md = """# PAQUETE DE EVIDENCIAS Y CORRECCIÓN CIENTÍFICA — MINESAFE 3D (GRUPO 26)

Este directorio (`MINESAFE_3D_EVIDENCIAS_CORRECCION_PROFESOR`) y su archivo comprimido (`MINESAFE_3D_CORRECCIONES_PROFESOR_VERIFICADAS.zip`) contienen todas las evidencias empíricas, tablas CSV, scripts reproducibles e informes técnicos generados para subsanar las observaciones de revisión académica (`FON-01` a `FON-08`, `FOR-01`, `FOR-02`) del artículo sobre **MineSafe 3D** para la revista *Acta Montanistica Slovaca*.

## Archivos Principales en la Raíz de la Entrega

1. `INFORME_MAESTRO_AUDITORIA.md`: Síntesis ejecutiva y técnica de las 12 fases de la auditoría.
2. `MATRIZ_CORRECCIONES_PROFESOR.csv`: Tabla trazable observación por observación (`FON-01` a `FOR-02`).
3. `CAMBIOS_EXACTOS_PARA_ARTICULO.md`: Párrafos y tablas listos para copiar y pegar en el manuscrito.
4. `CHECKLIST_FINAL_PUBLICACION.md`: Lista de verificación final previa al envío editorial.
5. `MANIFIESTO_SHA256.csv`: Hashes criptográficos SHA-256 y tamaños en bytes de todos los archivos del paquete.
"""
    (OUT_ROOT / "README_ENTREGA.md").write_text(readme_md, encoding="utf-8")

    # -------------------------------------------------------------------------
    # Generar MANIFIESTO_SHA256.csv de todos los archivos en OUT_ROOT
    # -------------------------------------------------------------------------
    manifest_rows = []
    for p in sorted(OUT_ROOT.rglob("*")):
        if p.is_file() and p.name != "MANIFIESTO_SHA256.csv":
            rel = p.relative_to(OUT_ROOT).as_posix()
            manifest_rows.append({
                "ruta_relativa": rel,
                "nombre_archivo": p.name,
                "tamano_bytes": p.stat().st_size,
                "sha256": sha256_file(p),
            })
    df_man = pd.DataFrame(manifest_rows)
    df_man.to_csv(OUT_ROOT / "MANIFIESTO_SHA256.csv", index=False)
    print(f"[+] MANIFIESTO_SHA256.csv generado con {len(df_man)} archivos verificados.")

    # -------------------------------------------------------------------------
    # Comprimir todo en MINESAFE_3D_CORRECCIONES_PROFESOR_VERIFICADAS.zip
    # -------------------------------------------------------------------------
    zip_path = PROJECT_ROOT / "MINESAFE_3D_CORRECCIONES_PROFESOR_VERIFICADAS.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in sorted(OUT_ROOT.rglob("*")):
            if p.is_file():
                arcname = f"MINESAFE_3D_EVIDENCIAS_CORRECCION_PROFESOR/{p.relative_to(OUT_ROOT).as_posix()}"
                zf.write(p, arcname=arcname)

    # Verificar integridad del ZIP
    with zipfile.ZipFile(zip_path, "r") as zf:
        bad_file = zf.testzip()
        n_zip_files = len(zf.namelist())
        assert bad_file is None, f"Archivo corrupto en ZIP: {bad_file}"
        for zinfo in zf.infolist():
            assert zinfo.file_size > 0, f"Archivo vacío en ZIP: {zinfo.filename}"

    print(f"[+] ZIP verificado exitosamente: {zip_path} ({zip_path.stat().st_size:,} bytes, {n_zip_files} archivos internos, 0 vacíos/corruptos).")
    print(f"[+] SHA-256 del ZIP: {sha256_file(zip_path)}")


if __name__ == "__main__":
    main()

