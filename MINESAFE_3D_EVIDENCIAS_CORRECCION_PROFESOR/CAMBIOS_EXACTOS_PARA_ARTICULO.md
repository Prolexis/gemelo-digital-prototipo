# CAMBIOS EXACTOS Y TEXTOS LISTOS PARA PEGAR EN EL MANUSCRITO (*ACTA MONTANISTICA SLOVACA*)

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
> *"En el generador sintético `DSTM-MineSafe-2026`, la etiqueta binaria `collision_risk_label` se define antes de la inyección de ruido sensorial observacional a partir del tiempo hasta la colisión efectivo $\text{TTC}_{\text{eff}} = \text{TTC}_{\text{raw}} - (\tau_{\text{hum}} + \tau_{\text{perc}}) < 4.0\text{ s}$ o por violación del margen de proximidad crítica ($d < 15\text{ m}$ con $v > 15\text{ km/h}$, o $d < 8\text{ m}$), donde $\tau_{\text{hum}} = 1.2 + 2.5\,\text{PERCLOS} + 0.06\,\max(0, \text{grade}-7)$ para camiones manuales ($0.35\text{ s}$ para camiones AHS) y $\tau_{\text{perc}} = 0.5(1 - \text{vis})$. Posteriormente se inyecta ruido Gaussiano observacional ($\sigma_v = 1.8\text{ km/h}$, $\sigma_d = 3.2\text{ m}$, $\sigma_{\text{PERCLOS}} = 0.025$) sobre los predictores observados. Dado que la condición $\text{TTC}_{\text{eff}} < 4.0\text{ s}$ determina el $99.18\%$ ($4,959/5,000$) de las etiquetas, existe un acoplamiento funcional deliberado entre las variables cinemáticas y el objetivo. Para cuantificar este acoplamiento, el estudio de ablación (Tabla X) demuestra que al retirar simultáneamente `lidar_obstacle_dist_m` y `gnss_speed_kmh` (Ablación D), el ROC-AUC de Random Forest desciende de $0.9938$ a $0.5800$ ($\text{F1} = 0.5998$). A la inversa, emplear únicamente distancia LiDAR y velocidad GNSS (Ablación E) alcanza un $\text{ROC-AUC} = 0.9892$ y $\text{F1} = 0.9451$, mientras que la incorporación de las variables humanas, ambientales y de régimen de flota (PERCLOS, pendiente, visibilidad y autonomía en el modelo completo, Ablación A) eleva el $\text{F1}$ a $0.9638$ ($+1.87$ puntos porcentuales) al desambiguar los casos limítrofes en la zona de transición ($3.5\text{ s} \le \text{TTC}_{\text{raw}} \le 6.0\text{ s}$)."*

---

## 4. Redacción Exacta para McNemar, Potencia y TOST Exploratorio (`FON-03`, `FON-05`)

### Párrafo listo para insertar en la sección de Comparación Estadística (§5.2):
> *"Sobre los $N = 5,000$ registros out-of-fold exactamente alineados, Random Forest alcanzó una exactitud de $0.9612$ ($\text{TP}=2,579, \text{FP}=96, \text{TN}=2,227, \text{FN}=98$; $4,806$ aciertos y $194$ errores) y Gradient Boosting alcanzó $0.9636$ ($\text{TP}=2,589, \text{FP}=94, \text{TN}=2,229, \text{FN}=88$; $4,818$ aciertos y $182$ errores). La matriz de contingencia pareada 2×2 registró $a = 4,766$ instancias acertadas por ambos modelos, $b = 40$ acertadas únicamente por Random Forest, $c = 52$ acertadas únicamente por Gradient Boosting y $d = 142$ falladas por ambos ($n_{\text{disc}} = b + c = 92$, tasa de discordancia $\hat{\psi} = 1.84\%$). La prueba exacta binomial bilateral de McNemar arrojó $p = 0.2513$ ($p = 0.251322$ a seis decimales; estadístico $\chi^2$ con corrección de continuidad de Edwards $= 1.3152, p = 0.2515$; sin corrección $= 1.5652, p = 0.2109$), y la prueba de rangos con signo de Wilcoxon sobre el Recall de las cinco particiones arrojó $W = 2.0, p = 0.1875$ ($p_{\text{Holm}} = 0.3750$ tras corrección de Holm-Bonferroni). El intervalo de confianza bootstrap al $95\%$ ($1,000$ remuestreos) para la diferencia $\Delta\text{Recall} = \text{Recall}_{\text{RF}} - \text{Recall}_{\text{GBM}} = -0.0037$ fue $[-0.0087, +0.0015]$, incluyendo el cero. Por consiguiente, no existe evidencia de diferencia estadísticamente significativa entre ambos clasificadores.*
>
> *Un análisis de sensibilidad de potencia (fórmula incondicional de Connor y binomial condicional exacta para $\alpha = 0.05$) confirma que con $N = 5,000$ y $\hat{\psi} = 1.84\%$, la prueba de McNemar posee una potencia del $80\%$ para detectar diferencias mínimas (MDE) de $\pm 0.54\%$ en exactitud ($\pm 0.56\%$ condicional) y de $\pm 0.74\%$ en sensibilidad ($\pm 0.79\%$ condicional sobre $N_+ = 2,677, b_+ = 20, c_+ = 30$). De forma complementaria, se ejecutó un análisis de equivalencia TOST (Two One-Sided Tests) con carácter estrictamente exploratorio post-hoc (dado que los márgenes no fueron preespecificados antes del entrenamiento): bajo un margen estricto de $\pm 0.50\%$, la equivalencia resulta estadísticamente inconclusa ($p_{\text{TOST}} = 0.0879$ en exactitud; $p_{\text{TOST}} = 0.3161$ en Recall), mientras que bajo un margen de tolerancia práctica de $\pm 1.00\%$, los intervalos de confianza al $90\%$ ($[-0.56\%, +0.08\%]$ en exactitud y $[-0.81\%, +0.06\%]$ en Recall) quedan íntegramente contenidos dentro de $[-1.00\%, +1.00\%]$ ($p_{\text{TOST}} = 0.000038$ y $p_{\text{TOST}} = 0.0088$, respectivamente)."*

---

## 5. Redacción y Tabla Completa para Validación LOSO y Falsas Alarmas (`FON-06`)

### Párrafo listo para insertar en §5.5 (Validación LOSO):
> *"La Tabla Y presenta el desglose completo de la validación Leave-One-Scenario-Out (LOSO) evaluada tanto frente al umbral cinemático puro independiente ($\text{TTC}_{\text{raw}} < 3.5\text{ s}$) como frente a la etiqueta nominal del escenario retenido. Frente al oráculo físico estricto $\text{TTC}_{\text{raw}} < 3.5\text{ s}$, Random Forest captura casi la totalidad de los eventos críticos reales ($\text{Recall macro} = 0.9993$; $100\%$ en los escenarios A, B, D y E), pero registra una especificidad macro de $0.6440$ ($\text{FPR macro} = 35.60\%$, $\text{FDR macro} = 43.65\%$). La penalización más severa ocurre en el Escenario B (Operación de cargue y pala en proximidad estrecha), donde la especificidad desciende a $0.3850$ ($\text{FPR} = 61.50\%$, $\text{Precisión} = 0.3669$, $\text{FDR} = 63.31\%$, con $385$ falsos positivos frente a $223$ verdaderos positivos). Este fenómeno se explica porque el clasificador fue entrenado sobre la etiqueta nominal regida por $\text{TTC}_{\text{eff}} < 4.0\text{ s}$ (que incorpora los retardos de reacción y visibilidad $\tau_{\text{hum}} + \tau_{\text{perc}} \approx 1.5$–$2.5\text{ s}$); en consecuencia, los camiones que maniobran junto a la pala con $3.5\text{ s} \le \text{TTC}_{\text{raw}} < 6.0\text{ s}$ activan legítimamente la alerta preventiva del modelo, pero son contabilizados como falsas alarmas respecto al corte rígido de $3.5\text{ s}$. Cuando el mismo modelo LOSO se evalúa frente a la etiqueta nominal homogénea, alcanza en el Escenario B una especificidad de $0.9222$, precisión de $0.9553$ y $\text{F1} = 0.9590$ (y a nivel macro: $\text{Recall} = 0.9720$, $\text{Especificidad} = 0.9462$, $\text{F1} = 0.9657$). Desde una perspectiva de ingeniería de sistemas mineros, una $\text{FDR}$ del $63.31\%$ respecto a colisiones inminentes ($<3.5\text{ s}$) en zonas de pala induciría fatiga de alarmas en el operador, lo que demuestra la necesidad de implementar umbrales de probabilidad adaptativos por geocerca (por ejemplo, elevar el umbral de decisión a $p \ge 0.75$ en bahías de cargue a baja velocidad)."*

---

## 6. Redacción para Robustez Sensorial, LOCF y Protocolos P1 vs. P2 (`FON-07`, `FON-08`)

### Párrafo listo para insertar en §5.7 y §6 (Amenazas a la Validez):
> *"Para evaluar la sensibilidad ante degradación telemétrica, se inyectó ruido Gaussiano aditivo del $2\%$, $5\%$ y $10\%$ del rango operativo máximo ($\sigma_v = 1.30, 3.25, 6.50\text{ km/h}$ sobre $65\text{ km/h}$; $\sigma_d = 4.0, 10.0, 20.0\text{ m}$ sobre $200\text{ m}$) y ráfagas de pérdida de señal LiDAR imputadas mediante Last Observation Carried Forward (LOCF). Es importante precisar dos delimitaciones metodológicas de este ensayo: (1) dado que los sistemas comerciales RTK-GNSS y LiDAR mineros operan en condiciones nominales con errores centimétricos ($\sigma_d < 0.10\text{ m}$), los niveles de $\sigma_d = 4\text{ a } 20\text{ m}$ no representan ruido electrónico nominal de fábrica, sino pruebas paramétricas de estrés extremo equivalentes a retrodispersión óptica severa por tormentas de polvo, oclusión de domo o pérdida de corrección diferencial en fondos de rajo; y (2) dado que `DSTM-MineSafe-2026` fue generado mediante muestreo Monte Carlo transversal de registros independientes y no como trayectorias longitudinales continuas a $2\text{ Hz}$, la aplicación de LOCF entre filas consecutivas ($481$ muestras afectadas, $9.62\%$) actúa como un ensayo de corrupción estocástica por sustitución inter-muestra y no como retención dinámica de una serie temporal vehicular.*
>
> *Bajo evaluación en $10$ semillas aleatorias (`42` a `51`), se compararon dos regímenes: el Protocolo P1 (reentrenando el modelo en cada partición perturbada) y el Protocolo P2 (entrenando exclusivamente sobre datos limpios y perturbando únicamente el conjunto de prueba). Ante un $10\%$ de ruido extremo, el Recall medio de Random Forest pasa de $0.9634$ a $0.8510 \pm 0.0046$ en P1 ($0.8506$ en `seed=42`) y a $0.8226 \pm 0.0052$ en P2 ($0.8211$ en `seed=42$). En la condición combinada ($10\%$ de ruido + dropout LOCF), el Recall de Random Forest se sitúa en $0.8338 \pm 0.0053$ en P1 ($0.8334$ en `seed=42`) y en $0.8069 \pm 0.0059$ en P2 ($0.8061$ en `seed=42`), confirmando que perturbaciones $\ge 10\%$ del rango superan el margen de seguridad sin filtrado cinemático temporal (e.g., filtro de Kalman extendido)."*

---

## 7. Correcciones Formales y Bibliográficas (`FON-04`, `FOR-01`, `FOR-02`)

1. **Corrección ortográfica (`FOR-02`):** Reemplazar en todo el manuscrito **`Mohammadia`** por **`Mohammadian`**.
2. **Separación de citas de Software y Dataset (`FON-04` / `FOR-02`):**
   - **Cita del Software (MIT License):**
     > Sanchez Enriquez, C. A. (2026). *MineSafe 3D: Reproducible Simulation and Machine Learning Pipeline (Version v1.0.0)* [Computer software]. GitHub / Zenodo. https://github.com/Prolexis/gemelo-digital-prototipo (DOI: `10.5281/zenodo.22905230`).
   - **Cita del Dataset Sintético (CC-BY 4.0 License):**
     > Sanchez Enriquez, C. A. (2026). *DSTM-MineSafe-2026: Synthetic Telemetry Dataset for Open-Pit Mining Mixed-Fleet Collision Risk Prediction ($N = 5,000$)* [Data set]. In `experiments/data/DSTM-MineSafe-2026.csv` (SHA-256: `78f5c7e6...`). Licensed under CC-BY 4.0.
