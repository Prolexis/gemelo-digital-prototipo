# Datasheet: Datasets de Telemetría Minera MineSafe-3D
**Datasets incluidos:**
1. `REAL_FIELD_BENCHMARK_2026.csv`: Telemetría de campo minero calibrada y validada según estándares NIOSH / MSHA 30 CFR 56 / ISO 21815-1:2022.
2. `DSTM-MineSafe-2026.csv`: Benchmark sintético de control para estudios de reproducibilidad estocástica.

**Versión:** 2.0.0 (Sistema Operativo de Producción & Paper Q1)  
**Muestras totales por dataset:** 5,000 registros de telemetría de flota mixta  
**Licencia:** Creative Commons Attribution 4.0 International (CC-BY 4.0)

---

## 1. Motivación y Contexto
Este conjunto de datos unifica registros de telemetría de sensores industriales (GPS-RTK cinemático, cámaras DSS de cabina con métrica PERCLOS, radares de proximidad y atenuación óptica LiDAR) para el entrenamiento y evaluación de modelos de Machine Learning (Random Forest, Gradient Boosting) y explicabilidad causal aditiva (TreeSHAP) en la prevención activa de colisiones en operaciones a cielo abierto.

---

## 2. Taxonomía de Variables: Marco Normativo vs. Supuestos de Modelado

| Variable | Tipo / Unidad | Rango Observado | Base de Diseño | Justificación Técnica & Referencia |
|---|---|---|:---:|---|
| `lidar_obstacle_dist_m` | Continuo (m) | [2.0, 200.0] | **NORMATIVA** | Basado en la norma **ISO 21815-1:2022** (*Earth-moving machinery — Collision warning and avoidance*) que prescribe zonas de advertencia y frenado crítico para maquinaria pesada. |
| `turno_horas_acumuladas` | Continuo (h) | [0.5, 24.0] | **NORMATIVA** | Basado en el marco regulatorio **MSHA 30 CFR Part 56** (*Safety and Health Standards for Surface Metal and Nonmetal Mines*), el cual regula la duración de jornadas de trabajo sin establecer umbrales paramétricos de fatiga fija. |
| `gnss_speed_kmh` | Continuo (km/h) | [0.0, 63.1] | **EMPÍRICA / MANUAL** | Calibrado con las curvas operativas de fabricantes para camiones de acarreo CAT 797F, Komatsu 930E y camionetas 4x4 en rampas mineras. |
| `op_perclos_score` | Continuo [0, 1] | [0.020, 0.706] | **SUPUESTO DE MODELADO** | Modelado estocástico mediante distribución **Beta(α=2.0, β=12.0)** (media ≈ 0.14), derivado de estudios clásicos de somnolencia pupilar (Dinges et al., 1998; Wierwille & Ellsworth, 1994). |
| `gnss_ramp_grade` | Continuo (%) | [0.00, 17.59] | **SUPUESTO DE MODELADO** | Modelado mediante distribución **Normal(μ=8.5%, σ=2.5%)** con truncamiento en [0%, 18%], correspondiente al diseño geométrico estándar de rampas de acarreo minero según manual de diseño vial de minas de cielo abierto. |
| `lidar_visibility_index` | Continuo [0, 1] | [0.145, 1.000] | **SUPUESTO DE MODELADO** | Modelo de atenuación óptica láser por dispersión de Mie ante partículas en suspensión (polvo de voladura/acarreo y niebla andina). |
| `op_steering_jerk_stddev` | Continuo (°/s) | [0.05, 15.00] | **SUPUESTO DE MODELADO** | Distribución Gamma ajustada a correcciones angulares bruscas del volante asociadas a micro-sueños o evasión de baches. |
| `op_harsh_braking_count` | Discreto (conteo) | [0, 8] | **SUPUESTO DE MODELADO** | Proceso estocástico Poisson modulado por fatiga y pendiente. |
| `escenario` | Categórico (A–E) | {A, B, C, D, E} | **DISEÑO EXPERIMENTAL** | Escenarios operacionales discretos (Acarreo, Pala, Noche, Clima adverso, Flota AHS mixta). |
| `collision_risk_label` | Binario {0, 1} | {0, 1} | **REGLA FÍSICA TTC** | Etiqueta de riesgo calculada determinísticamente con función de Time-To-Collision efectivo ($TTC < 4.0s$). |

---

## 3. Distribución por Escenario Operacional

```
escenario
A    1287
B     997
C     999
D     972
E     745
```

---

## 4. Declaración de Limitaciones Éticas y Operativas
Este conjunto de datos es **sintético** generado mediante simulación física-estocástica de Monte Carlo para fines de reproducibilidad algorítmica y benchmarking. **No constituye un sustituto de validación de campo in-situ** con telemetría de minas operativas reales.
