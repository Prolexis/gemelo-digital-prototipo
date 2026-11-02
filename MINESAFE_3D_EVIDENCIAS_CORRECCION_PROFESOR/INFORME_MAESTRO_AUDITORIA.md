# INFORME MAESTRO DE AUDITORÍA, CORRECCIÓN Y REPRODUCIBILIDAD CIENTÍFICA — MINESAFE 3D

**Proyecto:** MineSafe 3D — Prototipo de Simulación y Banco Experimental Sintético para Evaluación de Riesgo de Colisión en Flotas Mixtas de Minería a Cielo Abierto  
**Revista destino:** *Acta Montanistica Slovaca (AMS)*  
**Objetivo:** Resolución técnica, estadística y documental de las observaciones del Informe de Revisión Académica del Grupo 26 (`FON-01` a `FON-08`, `FOR-01`, `FOR-02`)  
**Fecha de generación UTC:** `2026-11-02T04:35:04.633874+00:00`

---

## 1. Resumen Ejecutivo

Se ha ejecutado una auditoría forense y experimental de extremo a extremo sobre el repositorio `gemelo-digital-prototipo` sin alterar ningún archivo original del proyecto. Todas las verificaciones se han ejecutado desde cero con semilla controlada (`SEED = 42`) sobre el dataset primario `experiments/data/DSTM-MineSafe-2026.csv` ($N = 5,000$ registros, 5 escenarios operacionales A–E).

### Principales Conclusiones Verificadas:
1. **`FON-01` (Trazabilidad de Hiperparámetros — Resuelto con certeza del 100 %):**
   - La configuración que generó el 100 % de las predicciones out-of-fold (`predictions_fold_level.csv`), el modelo serializado (`final_rf_pipeline.joblib`) y todas las métricas publicadas en el artículo (`RF ROC-AUC = 0.9938, F1 = 0.9638`; `GBM ROC-AUC = 0.9943, F1 = 0.9660`) es **la Opción B definida en `experiments/config/config.yaml`** (`RF: n_estimators = 200, max_depth = 12, min_samples_leaf = 4, min_samples_split = 2`; `GBM: n_estimators = 150, learning_rate = 0.05, max_depth = 5, min_samples_leaf = 8, subsample = 0.85`).
   - La mención de `300` y `250` árboles en el texto del manuscrito fue un error de transcripción documental: al ejecutar `300/250` (Opción A), cambian 32 predicciones de RF y 30 de GBM. Por tanto, **se corrige el texto metodológico del artículo a `200 / 150` y todas las tablas numéricas quedan 100 % respaldadas**.
2. **`FON-03` (Conciliación exacta de McNemar — Resuelto con certeza del 100 %):**
   - Sobre los 5,000 registros OOF alineados, los conteos de concordancia son invariablemente **$a = 4,766$ (ambos aciertan), $b = 40$ (solo RF acierta), $c = 52$ (solo GBM acierta), $d = 142$ (ambos fallan)**, sumando $4,766 + 40 + 52 + 142 = 5,000$.
   - El valor $p$ exacto binomial bilateral (`scipy.stats.binomtest(40, n=92, p=0.5)`) es **`0.25132210`** (**`0.251322`** a 6 decimales; **`0.2513`** a 4 decimales). El estadístico $\chi^2$ con corrección de continuidad de Edwards es **`1.315217`** ($p = 0.251452$).
   - La aparición previa de `0.251283` en `resultados_reproducidos.csv` se debió a una cadena de texto literal codificada manualmente en la línea 811 de `ejecutar_verificacion_final.py`, mientras que `mcnemar_verificado.csv` utilizó el cálculo dinámico exacto (`0.251322`).
3. **`FON-02` (Circularidad de Constructo y Estudio de Ablación A–H):**
   - La inspección de `generate_dataset.py` (líneas 178–200) confirma que la etiqueta `collision_risk_label` se genera mediante la regla determinista `(effective_ttc_sec < 4.0) or (dist < 15 & speed > 15) or (dist < 8)` antes de añadir ruido Gaussiano observacional a las variables. La condición `effective_ttc_sec < 4.0` explica por sí sola **4,959 de las 5,000 etiquetas (`99.18 %`)**.
   - El estudio de ablación demuestra que al retirar `lidar_obstacle_dist_m` y `gnss_speed_kmh` (**Ablación D**), el `ROC-AUC` de RF cae de `0.9938` a **`0.5800`**. Al mismo tiempo, las variables humanas y ambientales (`op_perclos_score`, `gnss_ramp_grade`, `lidar_visibility_index`, `is_autonomous`) aportan una mejora de **`+1.87 %` en `F1`** (`0.9638` en Ablación A frente a `0.9451` en Ablación E) al resolver casos limítrofes en la frontera de transición.
4. **`FON-05` (Potencia Estadística y TOST Exploratorio Post-Hoc):**
   - Con $N = 5,000$ y una tasa de discordancia $\hat{\psi} = 1.84\%$ ($92/5000$), la prueba de McNemar tiene un **80 % de potencia para detectar diferencias de exactitud $\ge 0.54\%$** y **diferencias de Recall $\ge 0.74\%$**.
   - El análisis TOST debe reportarse explícitamente como **exploratorio post-hoc**: para un margen estricto de $\pm 0.50\%$ el resultado es **inconcluso** ($p_{\text{TOST}} = 0.0879$ en Accuracy; $p_{\text{TOST}} = 0.3161$ en Recall), mientras que para márgenes de $\pm 0.75\%$ y $\pm 1.00\%$ se cumple equivalencia práctica ($p_{\text{TOST}} < 0.01$).
5. **`FON-06` (Especificidad y Falsas Alarmas en LOSO):**
   - Evaluado frente al umbral físico independiente `TTC puro < 3.5 s`, RF alcanza `Recall = 100 %` (`0.9993` macro), pero una **Especificidad macro de `0.6440` (`FPR = 35.60 %`, `FDR = 43.65 %`)**, cayendo en el **Escenario B (Cargue y Pala)** a **`Especificidad = 0.3850` (`FPR = 61.50 %`, `Precisión = 0.3669`, `FDR = 63.31 %`)**.
   - Esto ocurre porque el modelo fue entrenado para alertar cuando `effective_ttc_sec < 4.0 s` ($\text{TTC}_{\text{puro}} \approx 4.5$–$6.5\text{ s}$). Frente a la etiqueta nominal, la especificidad en el Escenario B es **`0.9222`** (`F1 = 0.9590`) y la especificidad macro es **`0.9462`**.
6. **`FON-07` y `FON-08` (LOCF sobre Muestras Transversales y Protocolos de Ruido P1 vs. P2):**
   - El procedimiento LOCF en `noise_pilot.py` opera sobre filas Monte Carlo independientes de corte transversal (`9.62 %` de muestras afectadas), por lo que debe declararse como un ensayo de sustitución estocástica inter-muestra y no como retención de una trayectoria continua.
   - Los niveles de ruido del 2 %, 5 % y 10 % del rango operativo ($\sigma_{\text{dist}} = 4, 10, 20\text{ m}$) corresponden a **estrés ambiental extremo**, no al error nominal de sensores RTK-GNSS/LiDAR comerciales. En 10 semillas, el Recall de RF con 10 % de ruido es **`0.8510`** bajo el Protocolo P1 (reentrenado) y **`0.8226`** bajo el Protocolo P2 (entrenado en limpio); en condición combinada es **`0.8338`** (P1) y **`0.8069`** (P2).

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
