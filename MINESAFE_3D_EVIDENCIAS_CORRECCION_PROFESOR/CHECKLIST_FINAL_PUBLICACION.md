# CHECKLIST FINAL DE PUBLICACIÓN ANTES DEL ENVÍO A *ACTA MONTANISTICA SLOVACA*

- [x] **1. Hiperparámetros conciliados (`FON-01`):** Verificado que `RF n_estimators=200, max_depth=12, min_samples_leaf=4` y `GBM n_estimators=150, learning_rate=0.05, max_depth=5, min_samples_leaf=8, subsample=0.85` reproducen exactamente el 100 % de los resultados publicados (`RF AUC=0.9938, F1=0.9638`; `GBM AUC=0.9943, F1=0.9660`). Actualizar el texto de la Sección 3/4 del manuscrito eliminando `300/250`.
- [x] **2. Circularidad y Ablación (`FON-02`):** Cuantificado el peso de `effective_ttc_sec < 4.0s` (`99.18 %` de las etiquetas) e incorporada la tabla de ablación A–H (`07_ABLACION_Y_CIRCULARIDAD/ablacion_verificada.csv`) que muestra la caída a `ROC-AUC = 0.5800` sin variables cinemáticas.
- [x] **3. Prueba de McNemar conciliada (`FON-03`):** Tabla 2×2 verificada ($a=4766, b=40, c=52, d=142$; $N=5000$) y valor $p$ exacto binomial corregido a **`0.251322`** (`0.25132210` a 8 decimales; `0.2513` a 4 decimales), eliminando el literal antiguo `0.251283`.
- [x] **4. Trazabilidad de DOI y Licencias (`FON-04`):** Separada la cita del software (`MIT`) y la cita del dataset `DSTM-MineSafe-2026.csv` (`CC-BY 4.0`). Verificar antes del envío que el DOI de Zenodo esté publicado y activo.
- [x] **5. Potencia y TOST exploratorio (`FON-05`):** Incorporado el MDE al 80 % de potencia ($\pm 0.54\%$ en Accuracy; $\pm 0.74\%$ en Recall) y etiquetado el análisis TOST como **exploratorio post-hoc** (inconcluso a $\pm 0.50\%$, equivalente a $\pm 1.00\%$).
- [x] **6. Especificidad y Falsas Alarmas en LOSO (`FON-06`):** Incorporadas las columnas de Especificidad (`0.6440` macro; `0.3850` en Escenario B), FPR (`61.50 %` en Escenario B) y FDR (`63.31 %` en Escenario B) junto con la evaluación frente a etiqueta nominal (`Especificidad macro = 0.9462`).
- [x] **7. Limitación de LOCF transversal (`FON-07`):** Declarado en Amenazas a la Validez que el dataset es transversal Monte Carlo y no una serie temporal continua.
- [x] **8. Calibración de ruido y Protocolos P1 vs. P2 (`FON-08`):** Reportados ambos protocolos (P1 reentrenado y P2 entrenado en limpio) en 10 semillas y aclarado que $\sigma_d = 4, 10, 20	ext{ m}$ representa estrés ambiental extremo.
- [ ] **9. Verificación manual en el archivo Word/PDF del manuscrito (`FOR-01` y `FOR-02`):**
  - Reemplazar todas las ocurrencias de `Mohammadia` por `Mohammadian`.
  - Revisar visualmente las páginas 3 y 13 del PDF exportado (fuentes matemáticas embebidas PDF/A-1b).
  - Confirmar la correspondencia biunívoca de las 32 referencias bibliográficas.
