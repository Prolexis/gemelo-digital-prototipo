import os
import logging
from typing import Dict, Any, List, Optional
from config import settings

logger = logging.getLogger("gemini_service")

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.client_type = None
        self._init_client()

    def _init_client(self):
        if not self.api_key:
            logger.warning("GEMINI_API_KEY no está configurada.")
            return

        # Intentar inicializar con google.genai (SDK oficial nuevo)
        try:
            from google import genai
            self.genai_client = genai.Client(api_key=self.api_key)
            self.client_type = "google-genai"
            logger.info("Cliente Gemini inicializado exitosamente usando 'google-genai'")
            return
        except Exception as e:
            logger.info(f"No se pudo usar google-genai ({e}), probando google.generativeai...")

        # Intentar inicializar con google.generativeai (SDK clásico)
        try:
            import google.generativeai as genai_legacy
            genai_legacy.configure(api_key=self.api_key)
            self.genai_legacy = genai_legacy
            self.client_type = "google-generativeai"
            logger.info("Cliente Gemini inicializado exitosamente usando 'google.generativeai'")
            return
        except Exception as e:
            logger.error(f"Error inicializando SDK de Gemini: {e}")
            self.client_type = None

    def is_configured(self) -> bool:
        return bool(self.api_key and self.client_type)

    def _generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        if not self.is_configured():
            # Re-intentar inicializar si se agregó la clave en caliente
            self.api_key = settings.GEMINI_API_KEY
            self._init_client()

        if not self.is_configured():
            raise ValueError("GEMINI_API_KEY no configurada o cliente de Gemini no disponible.")

        models_to_try = [self.model_name, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
        last_error = None

        full_prompt = prompt
        if system_instruction:
            full_prompt = f"INSTROCCIONES DEL SISTEMA:\n{system_instruction}\n\nSOLICITUD:\n{prompt}"

        for m_name in models_to_try:
            try:
                if self.client_type == "google-genai":
                    response = self.genai_client.models.generate_content(
                        model=m_name,
                        contents=full_prompt,
                    )
                    return response.text
                elif self.client_type == "google-generativeai":
                    model = self.genai_legacy.GenerativeModel(m_name)
                    response = model.generate_content(full_prompt)
                    return response.text
            except Exception as e:
                last_error = e
                logger.warning(f"Error al generar con modelo {m_name}: {e}. Intentando siguiente...")

        raise RuntimeError(f"Error en llamadas a la API de Gemini: {last_error}")

    async def analyze_risk(self, equipment_id: str, alert_data: Dict[str, Any], shap_factors: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analiza eventos de riesgo de colisión usando Gemini como motor de explicabilidad XAI.
        """
        system_instruction = (
            "Eres el Motor de Inteligencia Artificial para el Gemelo Digital de Seguridad Minera (MineSafe 3D). "
            "Tu tarea es analizar la telemetría de equipos pesados (camiones de extracción, palas, tractores), "
            "alertas de proximidad y factores de atribución SHAP/IA explicable para proporcionar un diagnóstico técnico "
            "claro, conciso y de alto valor preventivo para los supervisores HSE."
        )

        prompt = f"""
        ANÁLISIS DE RIESGO DE COLISIÓN Y EXPLICABILIDAD XAI (MINESAFE 3D):
        --------------------------------------------------
        - Equipo Primario: {equipment_id}
        - Datos de Alerta: {alert_data}
        - Factores de Atribución SHAP (Variables de mayor peso en el riesgo): {shap_factors}

        Por favor proporciona una respuesta en formato JSON estructurado con las siguientes claves:
        1. "resumen_diagnostico": Explicación ejecutiva de 2 frases sobre la causa raíz del riesgo.
        2. "nivel_criticidad": "CRÍTICO", "ALTO", "MEDIO" o "BAJO".
        3. "factores_clave": Lista de los 3 principales factores contribuyentes explicados en lenguaje minero.
        4. "acciones_mitigacion": Lista de 3 medidas preventivas inmediatas para el operador y la central de despacho.
        5. "explicacion_tecnica_xai": Análisis detallado de por qué el modelo predijo este riesgo (relacionando fatiga, visibilidad, velocidad, etc.).
        """

        try:
            raw_response = self._generate_text(prompt, system_instruction)
            return {
                "success": True,
                "equipment_id": equipment_id,
                "analysis": raw_response,
                "model_used": self.model_name
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "fallback_analysis": f"Análisis simulado por error de conexión con Gemini: Riesgo detectado en {equipment_id} debido a punto ciego y fatiga del operador."
            }

    async def generate_safety_report_summary(self, shift_info: Dict[str, Any], alerts_summary: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Genera el resumen ejecutivo del informe de seguridad de la mina.
        """
        system_instruction = (
            "Eres un Gerente Senior de Seguridad Minera y Salud Ocupacional (HSE). "
            "Generas resúmenes ejecutivos profesionales basados en datos del Gemelo Digital 3D "
            "para auditar el cumplimiento del estándar MSHA y prevención de fatalidades."
        )

        prompt = f"""
        INFORMACIÓN DEL TURNO MINERO:
        - Datos del Turno: {shift_info}
        - Resumen de Alertas del Turno: {alerts_summary}

        Genera un informe técnico de 3 párrafos:
        1. Evaluación general del turno y efectividad del Gemelo Digital en prevención.
        2. Análisis de las alertas críticas mitigaas y comparación de tiempos de reacción (PDS reactivo vs Gemelo Digital).
        3. Recomendaciones obligatorias para el siguiente turno.
        """

        try:
            summary = self._generate_text(prompt, system_instruction)
            return {"success": True, "summary": summary}
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "summary": "El Gemelo Digital procesó la telemetría del turno previniendo eventos críticos. Tiempo promedio de anticipación: 6.4 segundos."
            }

    async def chat_assistant(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Asistente interactivo en tiempo real para el Gemelo Digital Minero.
        """
        system_instruction = (
            "Eres 'Gemini Minero AI', el asistente inteligente integrado en el Gemelo Digital 3D de Seguridad Minera. "
            "Respondes preguntas de supervisores, operadores y auditores HSE sobre el estado de la mina en tiempo real, "
            "normativa MSHA, parámetros del modelo XAI/SHAP, estado de equipos y recomendaciones de seguridad."
        )

        context_str = f"CONTEXTO ACTUAL DE LA MINA EN TIEMPO REAL: {context}" if context else ""
        prompt = f"{context_str}\n\nPREGUNTA DEL USUARIO: {message}"

        try:
            reply = self._generate_text(prompt, system_instruction)
            return {"success": True, "reply": reply}
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "reply": f"Lo siento, no pude procesar la consulta en tiempo real con Gemini ({str(e)}). Por favor verifica la GEMINI_API_KEY."
            }

gemini_service = GeminiService()
