"""
ml.py — MineSafe 3D Backend
Router para gestion del modelo ML (CRISP-DM Lab integration).

Endpoints:
  GET  /api/v1/ml/status   — Estado del modelo (cargado o no)
  POST /api/v1/ml/reload   — Recarga el modelo desde disco tras exportar desde Streamlit
"""

from fastapi import APIRouter, HTTPException

from app.services.ml_model_service import ml_model_service

router = APIRouter(prefix="/api/v1/ml", tags=["ML Model"])


@router.get("/status", summary="Estado del modelo ML")
async def get_ml_status():
    """
    Retorna si el modelo ML entrenado por el CRISP-DM Lab esta cargado
    y siendo usado por el motor de riesgo.

    Cuando model_loaded=false, el motor usa formulas analiticas como fallback.
    Para activar el ML: entrena en Streamlit (:8501) y llama POST /reload.
    """
    return ml_model_service.get_status()


@router.post("/reload", summary="Recargar modelo ML desde disco")
async def reload_ml_model():
    """
    Recarga los archivos rf_model.joblib y gbm_model.joblib desde el
    directorio ML_MODELS_DIR configurado. Util despues de exportar un
    nuevo modelo desde el CRISP-DM Lab de Streamlit.
    """
    success = ml_model_service.reload()
    if not success:
        raise HTTPException(
            status_code=404,
            detail=(
                "No se encontraron modelos en el directorio configurado. "
                "Asegurate de entrenar y exportar el modelo desde Streamlit (:8501) primero."
            )
        )
    return {
        "success": True,
        "message": "Modelo ML recargado exitosamente.",
        "status": ml_model_service.get_status(),
    }
