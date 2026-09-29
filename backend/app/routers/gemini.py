from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from app.services.gemini_service import gemini_service
from config import settings

router = APIRouter(prefix="/api/gemini", tags=["Gemini Engine"])

class RiskAnalysisRequest(BaseModel):
    equipment_id: str = Field(
        default="eq-ht-104", 
        description="ID del equipo minero a analizar"
    )
    alert_data: Dict[str, Any] = Field(
        default={
            "severity": "CRITICAL",
            "time_to_collision": 6.2,
            "zone": "RAMPA_ESTE_SECTOR_4"
        },
        description="Datos de la alerta activa"
    )
    shap_factors: List[Dict[str, Any]] = Field(
        default=[
            {"feature": "Fatiga Biológica (PERCLOS)", "impact": 0.42},
            {"feature": "Punto Ciego Ángulo Muerto", "impact": 0.28}
        ],
        description="Factores de atribución SHAP"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "equipment_id": "eq-ht-104",
                "alert_data": {
                    "severity": "CRITICAL",
                    "time_to_collision": 6.2,
                    "zone": "RAMPA_ESTE_SECTOR_4"
                },
                "shap_factors": [
                    {"feature": "Fatiga Biológica (PERCLOS)", "impact": 0.42},
                    {"feature": "Punto Ciego Ángulo Muerto", "impact": 0.28}
                ]
            }
        }
    }

class SafetyReportSummaryRequest(BaseModel):
    shift_info: Dict[str, Any] = Field(
        default={
            "shift_name": "Guardia A - Turno Día",
            "supervisor": "Ing. Carlos Mendoza",
            "date": "2026-09-28",
            "total_equipment": 28
        },
        description="Metadatos del turno de guardia"
    )
    alerts_summary: List[Dict[str, Any]] = Field(
        default=[
            {
                "severity": "CRITICAL",
                "type": "Colisión Inminente",
                "equipment": "CAEX-104",
                "count": 1
            },
            {
                "severity": "WARNING",
                "type": "Somnolencia PERCLOS > 0.35",
                "equipment": "CAEX-108",
                "count": 3
            }
        ],
        description="Resumen de alertas del turno"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "shift_info": {
                    "shift_name": "Guardia A - Turno Día",
                    "supervisor": "Ing. Carlos Mendoza",
                    "date": "2026-09-28",
                    "total_equipment": 28
                },
                "alerts_summary": [
                    {
                        "severity": "CRITICAL",
                        "type": "Colisión Inminente",
                        "equipment": "CAEX-104",
                        "count": 1
                    }
                ]
            }
        }
    }

class ChatRequest(BaseModel):
    message: str = Field(
        default="¿Cuál es el protocolo de seguridad ante una alerta de colisión crítica en la rampa sur?",
        description="Pregunta o mensaje para el asistente"
    )
    context: Optional[Dict[str, Any]] = Field(
        default={
            "shift": "Noche",
            "active_trucks": 12,
            "last_alert": "CRITICAL"
        },
        description="Contexto opcional de la mina"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "message": "¿Cuál es el protocolo de seguridad ante una alerta de colisión crítica en la rampa sur?",
                "context": {
                    "shift": "Noche",
                    "active_trucks": 12,
                    "last_alert": "CRITICAL"
                }
            }
        }
    }

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

from app.services.langflow_service import langflow_service

@router.get("/langflow/health")
async def check_langflow_status():
    """
    Verifica la accesibilidad del orquestador visual Langflow (Puerto 7860).
    """
    return await langflow_service.check_health()

@router.post("/analyze-risk")
async def analyze_risk_endpoint(request: RiskAnalysisRequest):
    """
    Endpoint para análisis de riesgo y generación de explicaciones XAI.
    Prioriza la ejecución mediante el grafo visual de Langflow (si está activo),
    con fallback automático a Gemini Direct SDK.
    """
    # 1. Intentar procesamiento con Langflow Agent Flow
    langflow_res = await langflow_service.run_triaje_flow(
        equipment_id=request.equipment_id,
        alert_data=request.alert_data,
        shap_factors=request.shap_factors
    )
    if langflow_res:
        return {
            "success": True,
            "equipment_id": request.equipment_id,
            "analysis": langflow_res.get("analysis"),
            "engine": "Langflow Agent Flow (Visual DAG)",
            "langflow_executed": True
        }

    # 2. Fallback transparente a Gemini Direct Engine
    result = await gemini_service.analyze_risk(
        equipment_id=request.equipment_id,
        alert_data=request.alert_data,
        shap_factors=request.shap_factors
    )
    result["langflow_executed"] = False
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
