import os
import logging
import httpx
from typing import Dict, Any, Optional

logger = logging.getLogger("langflow_service")

class LangflowService:
    """
    Servicio de integración con el microservicio Langflow (Orquestador de Agentes IA).
    Permite enviar payloads de telemetría y factores SHAP al grafo visual de Langflow.
    """
    def __init__(self):
        # URL del contenedor Langflow en la red de Docker Compose
        self.base_url = os.getenv("LANGFLOW_URL", "http://langflow:7860")
        self.local_url = "http://localhost:7860"
        self.flow_endpoint = os.getenv("LANGFLOW_FLOW_ID", "triaje-minero-xai")
        self.timeout = 5.0

    async def check_health(self) -> Dict[str, Any]:
        """Verifica la salud y accesibilidad de la API REST de Langflow."""
        for target in [self.base_url, self.local_url]:
            try:
                async with httpx.AsyncClient(timeout=2.0) as client:
                    resp = await client.get(f"{target}/health")
                    if resp.status_code == 200 or resp.status_code == 404:
                        return {"status": "online", "url": target, "langflow_ready": True}
            except Exception:
                continue
        return {"status": "offline", "url": self.base_url, "langflow_ready": False}

    async def run_triaje_flow(
        self, equipment_id: str, alert_data: Dict[str, Any], shap_factors: list
    ) -> Optional[Dict[str, Any]]:
        """
        Ejecuta el flujo de triaje XAI en Langflow.
        Retorna un diccionario con la respuesta procesada por el agente o None si no está disponible.
        """
        shap_summary = ", ".join(
            [f"{f.get('feature', 'Factor')}: {float(f.get('impact', 0))*100:.0f}%" for f in shap_factors]
        ) if shap_factors else "Sin factores de riesgo especificados"

        input_text = (
            f"Equipo: {equipment_id} | Severidad: {alert_data.get('severity', 'ALTA')} | "
            f"Zona: {alert_data.get('zone', 'Tajo Central')} | Factores SHAP: {shap_summary}"
        )

        payload = {
            "input_value": input_text,
            "output_type": "chat",
            "input_type": "chat",
            "tweaks": {
                "PromptComponent-prompt": f"Eres el Agente de Triaje Minero Langflow. Analiza:\n{input_text}"
            }
        }

        for target_host in [self.base_url, "http://localhost:7860", "http://127.0.0.1:7860"]:
            try:
                url = f"{target_host}/api/v1/run/{self.flow_endpoint}"
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        result_text = data.get("outputs", [{}])[0].get("outputs", [{}])[0].get("results", {}).get("message", {}).get("text", "")
                        if result_text:
                            logger.info(f"✅ Respuesta exitosa recibida desde Langflow ({target_host})")
                            return {
                                "success": True,
                                "analysis": result_text,
                                "source": "LANGFLOW_AGENT_FLOW",
                                "flow_id": self.flow_endpoint
                            }
            except Exception as err:
                logger.debug(f"Langflow no respondió en {target_host}: {err}")
                continue

        return None

langflow_service = LangflowService()
