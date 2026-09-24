import os
import logging
import httpx
from typing import Dict, Any, Optional

logger = logging.getLogger("langflow_service")

class LangflowService:
    """
    Servicio de integración con el microservicio Langflow (Orquestador de Agentes IA).
    Descubre automáticamente el ID del flujo activo en Langflow y ejecuta la inferencia.
    """
    def __init__(self):
        self.base_url = os.getenv("LANGFLOW_URL", "http://langflow:7860")
        self.local_url = "http://localhost:7860"
        self.flow_endpoint = os.getenv("LANGFLOW_FLOW_ID", "triaje-minero-xai")
        self.username = os.getenv("LANGFLOW_SUPERUSER_USERNAME", "admin")
        self.password = os.getenv("LANGFLOW_SUPERUSER_PASSWORD", "admin")
        self.timeout = 15.0
        self._access_token: Optional[str] = None

    async def _get_auth_headers(self, client: httpx.AsyncClient, target_host: str) -> Dict[str, str]:
        """Obtiene o reutiliza el token de autenticación Bearer de Langflow."""
        if self._access_token:
            return {"Authorization": f"Bearer {self._access_token}"}
        
        try:
            # 1. Probar auto_login de Langflow
            auto_resp = await client.get(f"{target_host}/api/v1/auto_login")
            if auto_resp.status_code == 200:
                data = auto_resp.json()
                self._access_token = data.get("access_token")
                if self._access_token:
                    logger.info("🔑 Autenticación exitosa con Langflow vía auto_login")
                    return {"Authorization": f"Bearer {self._access_token}"}
        except Exception:
            pass

        try:
            # 2. Intentar login clásico con superuser
            login_url = f"{target_host}/api/v1/login"
            resp = await client.post(
                login_url,
                data={"username": self.username, "password": self.password},
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            if resp.status_code == 200:
                data = resp.json()
                self._access_token = data.get("access_token")
                logger.info("🔑 Autenticación exitosa con Langflow vía superuser")
                return {"Authorization": f"Bearer {self._access_token}"}
        except Exception as e:
            logger.debug(f"No se pudo autenticar en Langflow ({target_host}): {e}")
        
        return {}

    async def check_health(self) -> Dict[str, Any]:
        """Verifica la salud y accesibilidad de la API REST de Langflow."""
        for target in [self.base_url, self.local_url]:
            try:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    resp = await client.get(f"{target}/health")
                    if resp.status_code in (200, 404):
                        return {"status": "online", "url": target, "langflow_ready": True}
            except Exception:
                continue
        return {"status": "offline", "url": self.base_url, "langflow_ready": False}

    async def run_triaje_flow(
        self, equipment_id: str, alert_data: Dict[str, Any], shap_factors: list
    ) -> Optional[Dict[str, Any]]:
        """
        Descubre el ID del flujo creado en la interfaz de Langflow y ejecuta el triaje.
        """
        shap_summary = ", ".join(
            [f"{f.get('feature', 'Factor')}: {float(f.get('impact', 0))*100:.0f}%" for f in shap_factors]
        ) if shap_factors else "Sin factores de riesgo especificativos"

        input_text = (
            f"Equipo: {equipment_id} | Severidad: {alert_data.get('severity', 'CRITICAL')} | "
            f"Zona: {alert_data.get('zone', 'Rampa Este Banco 3200')} | Factores SHAP: {shap_summary}"
        )

        if alert_data.get("message"):
            input_text = f"{alert_data.get('message')} | {input_text}"

        payload = {
            "input_value": input_text,
            "output_type": "chat",
            "input_type": "chat"
        }

        for target_host in [self.base_url, "http://localhost:7860", "http://127.0.0.1:7860"]:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    headers = await self._get_auth_headers(client, target_host)

                    # 1. Obtener la lista de flujos creados en la interfaz de Langflow
                    target_flow_id = self.flow_endpoint
                    flows_resp = await client.get(f"{target_host}/api/v1/flows/", headers=headers)
                    
                    if flows_resp.status_code == 200:
                        flows_data = flows_resp.json()
                        flows_list = []
                        if isinstance(flows_data, list):
                            flows_list = flows_data
                        elif isinstance(flows_data, dict):
                            flows_list = flows_data.get("flows", []) or flows_data.get("data", []) or []

                        if flows_list and len(flows_list) > 0:
                            # Tomar el ID real del primer flujo activo creado en Langflow UI
                            target_flow_id = flows_list[0].get("id") or flows_list[0].get("endpoint_name") or target_flow_id
                            logger.info(f"🔍 Flujo de Langflow detectado con ID: {target_flow_id}")

                    # 2. Ejecutar la inferencia en el flujo detectado
                    url = f"{target_host}/api/v1/run/{target_flow_id}"
                    resp = await client.post(url, json=payload, headers=headers)
                    
                    if resp.status_code == 200:
                        data = resp.json()
                        # Extraer respuesta del mensaje de salida de Langflow
                        result_text = ""
                        try:
                            outputs = data.get("outputs", [])
                            if outputs and len(outputs) > 0:
                                sub_outputs = outputs[0].get("outputs", [])
                                if sub_outputs and len(sub_outputs) > 0:
                                    res_node = sub_outputs[0]
                                    results = res_node.get("results", {})
                                    artifacts = res_node.get("artifacts", {})
                                    
                                    if "message" in results:
                                        msg_obj = results["message"]
                                        if isinstance(msg_obj, dict):
                                            result_text = msg_obj.get("text", "") or msg_obj.get("data", {}).get("text", "")
                                        else:
                                            result_text = str(msg_obj)
                                    elif "text" in results:
                                        result_text = str(results["text"])
                                    elif artifacts and "text" in artifacts:
                                        result_text = str(artifacts["text"])
                                    elif artifacts and "message" in artifacts:
                                        result_text = str(artifacts["message"])
                        except Exception as parse_err:
                            logger.debug(f"Error parseando estructura de salida: {parse_err}")

                        if not result_text:
                            result_text = f"Respuesta procesada por el Agente Langflow en el flujo '{target_flow_id}'."

                        logger.info(f"✅ Respuesta exitosa recibida desde Langflow ({target_host})")
                        return {
                            "success": True,
                            "analysis": result_text,
                            "source": "LANGFLOW_AGENT_FLOW",
                            "flow_id": target_flow_id
                        }
            except Exception as err:
                logger.debug(f"Langflow no respondió en {target_host}: {err}")
                continue

        return None

langflow_service = LangflowService()

