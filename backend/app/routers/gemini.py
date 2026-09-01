from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from app.services.gemini_service import gemini_service
from config import settings

router = APIRouter(prefix="/api/gemini", tags=["Gemini Engine"])

class RiskAnalysisRequest(BaseModel):
    equipment_id: str
    alert_data: Dict[str, Any]
    shap_factors: List[Dict[str, Any]] = []

class SafetyReportSummaryRequest(BaseModel):
    shift_info: Dict[str, Any]
    alerts_summary: List[Dict[str, Any]] = []

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

@router.get("/health")
async def check_gemini_status():
    """
    Verifica la conexión y configuración de la API de Gemini como motor backend.
    """
    is_configured = gemini_service.is_configured()
    key_snippet = f"...{settings.GEMINI_API_KEY[-6:]}" if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 6 else "No configurada"
    
    return {
        "status": "online" if is_configured else "needs_configuration",
        "gemini_api_key_configured": is_configured,
        "key_snippet": key_snippet,
        "model": settings.GEMINI_MODEL,
        "engine": "FastAPI + Google Gemini API",
        "client_sdk": gemini_service.client_type or "Desconectado"
    }

@router.post("/analyze-risk")
async def analyze_risk_endpoint(request: RiskAnalysisRequest):
    """
    Endpoint para análisis de riesgo y generación de explicaciones XAI con Gemini.
    """
    result = await gemini_service.analyze_risk(
        equipment_id=request.equipment_id,
        alert_data=request.alert_data,
        shap_factors=request.shap_factors
    )
    return result

@router.post("/generate-summary")
async def generate_summary_endpoint(request: SafetyReportSummaryRequest):
    """
    Endpoint para generar resúmenes ejecutivos de seguridad minera en PDF e informes HSE.
    """
    result = await gemini_service.generate_safety_report_summary(
        shift_info=request.shift_info,
        alerts_summary=request.alerts_summary
    )
    return result

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Endpoint para interactuar con el Asistente AI de Gemelo Digital Minero impulsado por Gemini.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío.")

    result = await gemini_service.chat_assistant(
        message=request.message,
        context=request.context
    )
    return result
