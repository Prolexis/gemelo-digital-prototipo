# Caracterización de Hardware, Software y Latencia Computacional (Estándar Q1)

## 1. Banco de Pruebas de Hardware
- **Procesador (CPU):** AMD Ryzen 7 5700U with Radeon Graphics
- **Núcleos / Hilos:** 8 núcleos físicos / 16 hilos lógicos
- **Frecuencia Base:** 1.8 GHz
- **Memoria RAM:** 24.0 GB
- **Aceleración Gráfica (GPU):** AMD Radeon Graphics (iGPU integrada; inferencia ejecutada 100% en CPU)
- **Sistema Operativo:** Microsoft Windows 11 Pro (10.0.26200 64-bit)

## 2. Entorno de Software
- **Python:** 3.11.9
- **scikit-learn:** 1.9.0
- **pandas:** 3.0.5
- **numpy:** 2.4.6
- **scipy:** 1.17.1
- **shap:** 0.51.0
- **joblib:** 1.5.3
- **Docker:** Docker 29.4.0 (Docker Compose v5.1.2)

## 3. Resultados Empíricos de Latencia (N = 1.000 iteraciones tras warmup)

| Componente Medido | Incluye Preproc. | Media (ms) | Desv. Est. (ms) | Mediana (ms) | P95 (ms) | P99 (ms) | Rango [Min - Max] |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Preprocesamiento (SimpleImputer + RobustScaler) | Sí | 1.76 | 2.01 | 1.49 | 2.87 | 7.05 | [1.00 - 56.00] |
| Inferencia Scikit-Learn RF (200 árboles, n_jobs=1) | No | 17.37 | 7.73 | 14.83 | 29.47 | 51.80 | [12.10 - 109.44] |
| **Pipeline Completo End-to-End (Preproc + RF)** | **Sí** | **18.86** | **7.75** | **16.36** | **32.43** | **56.72** | **[13.18 - 83.00]** |
| Motor Analítico Multi-Modal (Lógica de Fusión) | N/A | 0.022 | 0.002 | 0.022 | 0.023 | 0.030 | [0.021 - 0.041] |

## 4. Análisis de Viabilidad Operacional a 2 Hz (Presupuesto de 500 ms)

- **Presupuesto temporal por ciclo de telemetría (2 Hz):** 500.0 ms
- **Tiempo medio insumido por el pipeline:** 18.86 ms (3.77% del ciclo)
- **Margen de seguridad remanente:** 96.23%
- **Dictamen para el Manuscrito:** APROBADO — La latencia promedio de 20 ms consume únicamente el 4% del ciclo disponible de 500 ms a 2 Hz.
