# FASE XII — Guía de Reproducción Paso a Paso en un Solo Comando

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
