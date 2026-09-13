# ⛏️ MineSafe 3D — Laboratorio CRISP-DM

> **Laboratorio de validación del motor de predicción de riesgo XAI**, implementado con Python + Streamlit siguiendo la metodología **CRISP-DM** (Cross-Industry Standard Process for Data Mining).

Este repositorio es independiente del sistema de producción MineSafe 3D y está diseñado para **presentaciones académicas, validación del modelo y exploración interactiva**.

---

## 📂 Estructura del Laboratorio

```
crisp-dm-lab/
├── app.py              # 🚀 Aplicación Streamlit principal (punto de entrada)
├── data_generator.py   # 📊 Generador de dataset sintético de telemetría minera
├── risk_engine.py      # 🧠 Motor de riesgo XAI (espejo del backend de producción)
├── evaluation.py       # 📈 Métricas de evaluación (ROC, Confusión, TTC vs PDS)
├── requirements.txt    # 📦 Dependencias Python
└── README.md           # 📖 Este archivo
```

---

## 🚀 Cómo ejecutar

### 1. Crear entorno virtual (recomendado)

```bash
cd crisp-dm-lab
python -m venv venv

# Windows:
venv\Scripts\activate

# Linux / macOS:
source venv/bin/activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Lanzar la aplicación

```bash
streamlit run app.py
```

La app se abrirá en **http://localhost:8501** automáticamente.

---

## 🗺️ Fases CRISP-DM Implementadas

| # | Fase | Contenido |
|---|------|-----------|
| 1 | **Business Understanding** | Problema de negocio (PDS reactivo vs MineSafe 3D predictivo), KPIs, Hipótesis H1/H2, flota mixta |
| 2 | **Data Understanding** | Dataset sintético de 1.200 registros, estadísticas descriptivas, histogramas, matriz de correlación |
| 3 | **Data Preparation** | Limpieza, detección de outliers IQR, Min-Max scaling, ingeniería de features (`risk_factor_combinado`) |
| 4 | **Modeling** | Motor XAI de 5 capas con sliders interactivos, gauge de riesgo, barras SHAP en vivo |
| 5 | **Evaluation** | Distribución de severidades, curva ROC (AUC-ROC), matriz de confusión, comparación TTC vs baseline PDS |
| 6 | **Deployment** | Diagrama de flujo Laboratorio→FastAPI→WebSocket→React, checklist de producción |

---

## 🔗 Relación con el sistema de producción MineSafe 3D

```
crisp-dm-lab/risk_engine.py
        ↕ (misma lógica de 5 capas)
backend/app/services/risk_engine_service.py  ← FastAPI + Google Gemini AI
        ↕ WebSocket
src/services/backendWsService.ts             ← Frontend React 19 + Three.js
```

El motor de riesgo (`risk_engine.py`) es un **espejo fiel** del servicio de producción `risk_engine_service.py`. Cualquier cambio en los pesos de fusión o umbrales se valida primero aquí antes de ser promovido al backend.

---

## 📊 Variables del Dataset Sintético

| Feature | Unidad | Descripción |
|---------|--------|-------------|
| `gnss_speed_kmh` | km/h | Velocidad del vehículo (GNSS) |
| `gnss_ramp_grade` | % | Pendiente de la rampa de acarreo |
| `lidar_obstacle_dist_m` | m | Distancia LiDAR al obstáculo más próximo |
| `lidar_visibility_index` | 0-1 | Índice de visibilidad óptica (1=máxima) |
| `op_perclos_score` | 0-1 | PERCLOS (% cierre ocular → somnolencia) |
| `op_shift_hours` | h | Horas acumuladas en turno |
| `op_steering_jerk_stddev` | °/s | Desviación estándar del jerk de volante |
| `overall_risk_score` | 0-1 | Score de riesgo de colisión |
| `severity` | LOW/MEDIUM/HIGH/CRITICAL | Clasificación de severidad |
| `ttc_sec` | s | Time-To-Collision proyectado |

---

## 🧠 Motor de Riesgo — 5 Capas XAI

```python
# Capa 1: Percepción LiDAR
perception_risk = dist_factor × 0.70 + vis_degradation × 0.30

# Capa 2: Comportamiento Operador
behavior_risk = perclos_impact + shift_impact + jerk_impact + braking × 0.05

# Capa 3: Cinemática GNSS
speed_risk = min(0.90, (speed_kmh / 45) × 0.60)
ttc_sec    = obstacle_dist_m / (relative_speed_ms)

# Capa 4: Fusión Multi-Modal (Flota Manual)
risk_score = behavior × 0.45 + speed × 0.30 + perception × 0.25

# Capa 5: XAI — TreeSHAP Proxy
shap_factors = [fatiga_PERCLOS, cinematica_GNSS, LiDAR_proximidad, geometria_tajo]
```

---

## 📈 Métricas Objetivo (Hipótesis H1)

| Métrica | MineSafe 3D | Baseline PDS | Mejora |
|---------|------------|-------------|--------|
| AUC-ROC | **≥ 0.92** | 0.71 | +29.6% |
| TTC Medio | **≥ 6.4 s** | 1.8 s | +255% |
| FPR | **< 5%** | 24.2% | -79.3% |

---

## ⚙️ Requisitos del Sistema

- Python **3.11+**
- Streamlit **1.38+**
- No requiere Docker, base de datos ni autenticación

---

*Desarrollado como parte del proyecto MineSafe 3D — Gemelo Digital XAI para Seguridad Minera. © 2026 Prolexis Mining Systems.*
