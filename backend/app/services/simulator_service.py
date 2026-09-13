import asyncio
import logging
import math
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.services.risk_engine_service import RiskEngineService
from app.services.redis_service import redis_service

logger = logging.getLogger("simulator_service")

# Estado base de la flota mixta industrial
DEFAULT_FLEET: List[Dict[str, Any]] = [
    {
        "id": "eq-ht-104",
        "code": "HT-104",
        "name": "Caterpillar 797F (Manual)",
        "type": "HAUL_TRUCK_MANUAL",
        "model": "CAT 797F Ultra Class (400 Ton)",
        "isAutonomous": False,
        "assignedOperator": {
            "operatorId": "op-9821",
            "operatorName": "Carlos M. Morales",
            "shiftHoursAccumulated": 10.8,
            "perclosScore": 0.34,
            "distractionLevel": 0.42,
            "steeringJerkStdDev": 4.8,
            "harshBrakingCountLastHour": 3,
            "accelerationVariability": 0.38,
            "heartRateBpm": 64,
            "isFatigued": True,
            "hasInformedConsent": True,
            "anonymizedId": "OP_ANON_8f3a91c"
        },
        "currentZone": "Rampa Este - Curva Ciega Banco 3200",
        "currentBench": "Banco 3200 msnm",
        "status": "ACTIVE_HAULING",
        "payloadTons": 385.0,
        "maxSpeedKmh": 45.0,
        "position": {
            "latitude": -22.3145,
            "longitude": -68.9032,
            "altitude": 3205.4,
            "easting": 250.0,
            "northing": 120.0,
            "elevation": 3205.0,
            "speedKmh": 34.2,
            "headingDeg": 135.0,
            "accuracyM": 0.08,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        "lidarFeatures": {
            "nearestObstacleDistM": 32.5,
            "relativeVelocityKmh": 42.1,
            "obstacleType": "VEHICLE",
            "obstacleBoundingBox": {"x": 265.0, "y": 110.0, "z": 3205.0, "width": 9.8, "height": 7.6, "depth": 15.2},
            "pointCloudDensity": 480.0,
            "visibilityIndex": 0.58,
            "groundConfidence": 0.94,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        "trajectoryHistory": [
            [230.0, 140.0, 3215.0],
            [238.0, 132.0, 3211.0],
            [245.0, 125.0, 3208.0],
            [250.0, 120.0, 3205.0]
        ]
    },
    {
        "id": "eq-ahs-02",
        "code": "AHS-02",
        "name": "Komatsu 930E FrontRunner (Autónomo)",
        "type": "HAUL_TRUCK_AHS",
        "model": "Komatsu 930E-5 AHS Autonomous System",
        "isAutonomous": True,
        "assignedOperator": None,
        "currentZone": "Rampa Este - Curva Ciega Banco 3200",
        "currentBench": "Banco 3200 msnm",
        "status": "ACTIVE_HAULING",
        "payloadTons": 360.0,
        "maxSpeedKmh": 35.0,
        "position": {
            "latitude": -22.3149,
            "longitude": -68.9028,
            "altitude": 3205.2,
            "easting": 275.0,
            "northing": 105.0,
            "elevation": 3205.0,
            "speedKmh": 28.0,
            "headingDeg": 315.0,
            "accuracyM": 0.03,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        "lidarFeatures": {
            "nearestObstacleDistM": 32.5,
            "relativeVelocityKmh": 42.1,
            "obstacleType": "VEHICLE",
            "obstacleBoundingBox": {"x": 250.0, "y": 120.0, "z": 3205.0, "width": 10.2, "height": 7.8, "depth": 15.5},
            "pointCloudDensity": 650.0,
            "visibilityIndex": 0.65,
            "groundConfidence": 0.98,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        "trajectoryHistory": [
            [295.0, 85.0, 3195.0],
            [288.0, 92.0, 3198.0],
            [280.0, 100.0, 3202.0],
            [275.0, 105.0, 3205.0]
        ]
    },
    {
        "id": "eq-sh-01",
        "code": "PALA-01",
        "name": "Pala Eléctrica de Cable P&H 4100XPC",
        "type": "SHOVEL",
        "model": "Komatsu / P&H 4100XPC Electric Rope Shovel",
        "isAutonomous": False,
        "assignedOperator": {
            "operatorId": "op-4412",
            "operatorName": "Rodrigo S. Fuentes",
            "shiftHoursAccumulated": 4.2,
            "perclosScore": 0.08,
            "distractionLevel": 0.05,
            "steeringJerkStdDev": 0.8,
            "harshBrakingCountLastHour": 0,
            "accelerationVariability": 0.12,
            "heartRateBpm": 72,
            "isFatigued": False,
            "hasInformedConsent": True,
            "anonymizedId": "OP_ANON_3c7b11d"
        },
        "currentZone": "Frente de Carguío - Banco 3400 Norte",
        "currentBench": "Banco 3400 msnm",
        "status": "LOADING",
        "payloadTons": 0.0,
        "maxSpeedKmh": 2.0,
        "position": {
            "latitude": -22.3112,
            "longitude": -68.9085,
            "altitude": 3400.0,
            "easting": -150.0,
            "northing": 280.0,
            "elevation": 3400.0,
            "speedKmh": 0.0,
            "headingDeg": 90.0,
            "accuracyM": 0.02,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        "lidarFeatures": {
            "nearestObstacleDistM": 14.2,
            "relativeVelocityKmh": 3.5,
            "obstacleType": "VEHICLE",
            "obstacleBoundingBox": {"x": -138.0, "y": 280.0, "z": 3400.0, "width": 9.8, "height": 7.6, "depth": 15.2},
            "pointCloudDensity": 920.0,
            "visibilityIndex": 0.82,
            "groundConfidence": 0.99,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        "trajectoryHistory": [
            [-150.0, 280.0, 3400.0],
            [-150.0, 280.0, 3400.0]
        ]
    },
    {
        "id": "eq-lv-05",
        "code": "CAM-05",
        "name": "Camioneta de Supervisión HSE (Toyota Hilux)",
        "type": "LIGHT_VEHICLE",
        "model": "Toyota Hilux 4x4 Mining Spec (Pértiga LED 4.2m)",
        "isAutonomous": False,
        "assignedOperator": {
            "operatorId": "op-3309",
            "operatorName": "Ing. Patricia Valenzuela",
            "shiftHoursAccumulated": 3.1,
            "perclosScore": 0.05,
            "distractionLevel": 0.02,
            "steeringJerkStdDev": 0.5,
            "harshBrakingCountLastHour": 0,
            "accelerationVariability": 0.08,
            "heartRateBpm": 68,
            "isFatigued": False,
            "hasInformedConsent": True,
            "anonymizedId": "OP_ANON_e901b54"
        },
        "currentZone": "Rampa Central - Acceso Banco 3300",
        "currentBench": "Banco 3300 msnm",
        "status": "ACTIVE_HAULING",
        "payloadTons": 1.2,
        "maxSpeedKmh": 55.0,
        "position": {
            "latitude": -22.3160,
            "longitude": -68.9050,
            "altitude": 3300.0,
            "easting": 80.0,
            "northing": 50.0,
            "elevation": 3300.0,
            "speedKmh": 38.0,
            "headingDeg": 45.0,
            "accuracyM": 0.05,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        "lidarFeatures": {
            "nearestObstacleDistM": 48.0,
            "relativeVelocityKmh": 12.0,
            "obstacleType": "VEHICLE",
            "obstacleBoundingBox": {"x": 90.0, "y": 60.0, "z": 3300.0, "width": 2.5, "height": 1.9, "depth": 5.3},
            "pointCloudDensity": 850.0,
            "visibilityIndex": 0.90,
            "groundConfidence": 0.98,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        "trajectoryHistory": [
            [60.0, 30.0, 3300.0],
            [70.0, 40.0, 3300.0],
            [80.0, 50.0, 3300.0]
        ]
    },
    {
        "id": "eq-ht-108",
        "code": "HT-108",
        "name": "Caterpillar 797F (Manual)",
        "type": "HAUL_TRUCK_MANUAL",
        "model": "CAT 797F Ultra Class (400 Ton)",
        "isAutonomous": False,
        "assignedOperator": {
            "operatorId": "op-1123",
            "operatorName": "Manuel E. Soto",
            "shiftHoursAccumulated": 6.5,
            "perclosScore": 0.18,
            "distractionLevel": 0.15,
            "steeringJerkStdDev": 1.9,
            "harshBrakingCountLastHour": 1,
            "accelerationVariability": 0.18,
            "heartRateBpm": 74,
            "isFatigued": False,
            "hasInformedConsent": True,
            "anonymizedId": "OP_ANON_a19f4e2"
        },
        "currentZone": "Botadero Principal Sur - Descarga",
        "currentBench": "Banco 3600 msnm",
        "status": "DUMPING",
        "payloadTons": 390.0,
        "maxSpeedKmh": 45.0,
        "position": {
            "latitude": -22.3188,
            "longitude": -68.8995,
            "altitude": 3602.0,
            "easting": 380.0,
            "northing": -220.0,
            "elevation": 3602.0,
            "speedKmh": 4.5,
            "headingDeg": 180.0,
            "accuracyM": 0.05,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        "lidarFeatures": {
            "nearestObstacleDistM": 18.5,
            "relativeVelocityKmh": 4.5,
            "obstacleType": "BERM",
            "obstacleBoundingBox": {"x": 380.0, "y": -238.0, "z": 3602.0, "width": 25.0, "height": 2.2, "depth": 3.0},
            "pointCloudDensity": 780.0,
            "visibilityIndex": 0.90,
            "groundConfidence": 0.97,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        "trajectoryHistory": [
            [380.0, -190.0, 3602.0],
            [380.0, -205.0, 3602.0],
            [380.0, -220.0, 3602.0]
        ]
    }
]

class SimulatorService:
    def __init__(self):
        self.fleet: List[Dict[str, Any]] = [dict(v) for v in DEFAULT_FLEET]
        self.is_running = False
        self._task: Optional[asyncio.Task] = None
        self.latest_alerts: List[Dict[str, Any]] = []
        self._step_counter = 0

    def get_current_fleet(self) -> List[Dict[str, Any]]:
        """Retorna el estado más reciente de la flota evaluada."""
        return self.fleet

    def get_latest_alerts(self) -> List[Dict[str, Any]]:
        """Retorna las alertas generadas más recientes."""
        return self.latest_alerts

    def acknowledge_alert(self, alert_id: str, supervisor_name: str) -> Optional[Dict[str, Any]]:
        for a in self.latest_alerts:
            if a.get("id") == alert_id or a.get("alertCode") == alert_id:
                a["isAcknowledged"] = True
                a["acknowledgedBy"] = supervisor_name
                a["status"] = "RESOLVED"
                return a
        return None

    async def start(self):
        """Inicia el ciclo continuo de simulación a 1 Hz."""
        if self.is_running:
            return
        self.is_running = True
        self._task = asyncio.create_task(self._simulation_loop())
        logger.info("Simulador de flota mixta minera a 1 Hz iniciado.")

    async def stop(self):
        """Detiene el simulador."""
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Simulador de flota detenido.")

    async def _simulation_loop(self):
        # Inicializar predicciones iniciales
        self._recalculate_all_risks()

        while self.is_running:
            start_time = time.time()
            self._step_counter += 1

            try:
                # 1. Avanzar cinemática vehicular
                for eq in self.fleet:
                    if eq["status"] == "ACTIVE_HAULING":
                        pos = eq["position"]
                        heading_rad = (-pos["headingDeg"] * math.pi) / 180.0
                        step = (pos["speedKmh"] / 40.0) * 0.8

                        # Si se aproxima a extremos de la rampa, hacer viraje suave
                        if pos["easting"] > 320.0:
                            pos["headingDeg"] = (pos["headingDeg"] + 180) % 360
                        elif pos["easting"] < 180.0:
                            pos["headingDeg"] = (pos["headingDeg"] + 180) % 360

                        new_easting = pos["easting"] + math.sin(heading_rad) * step
                        new_northing = pos["northing"] + math.cos(heading_rad) * step

                        pos["easting"] = round(new_easting, 2)
                        pos["northing"] = round(new_northing, 2)
                        pos["timestamp"] = datetime.now(timezone.utc).isoformat()

                        # Actualizar historial de trayectoria (últimas 10 coordenadas)
                        hist = eq.get("trajectoryHistory", [])
                        hist.append([pos["easting"], pos["northing"], pos["elevation"]])
                        if len(hist) > 10:
                            hist.pop(0)
                        eq["trajectoryHistory"] = hist

                # 2. Recalcular predicción de riesgo y SHAP para cada equipo con el motor industrial
                self._recalculate_all_risks()

                # 3. Detectar alertas críticas y emitir por Redis
                self._process_active_alerts()

                # 4. Publicar toda la flota en Redis Pub/Sub canal 'mining:telemetry'
                telemetry_payload = {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "fleetSize": len(self.fleet),
                    "equipments": self.fleet
                }
                await redis_service.publish("mining:telemetry", telemetry_payload)

            except Exception as e:
                logger.error(f"Error en bucle de simulación: {e}", exc_info=True)

            # Mantener cadencia estricta de 1 Hz (1 segundo por tick)
            elapsed = time.time() - start_time
            sleep_time = max(0.1, 1.0 - elapsed)
            await asyncio.sleep(sleep_time)

    def _recalculate_all_risks(self):
        for eq in self.fleet:
            # Encontrar el vehículo objetivo más cercano
            target_eq = None
            min_dist = 999999.0
            pos = eq["position"]

            for other in self.fleet:
                if other["id"] == eq["id"]:
                    continue
                opos = other["position"]
                dx = pos["easting"] - opos["easting"]
                dy = pos["northing"] - opos["northing"]
                dz = pos["elevation"] - opos["elevation"]
                d = math.sqrt(dx * dx + dy * dy + dz * dz)
                if d < min_dist:
                    min_dist = d
                    target_eq = other

            # Si hay objetivo cercano (<80m), calibrar distancia LiDAR
            if target_eq and min_dist < 80.0:
                eq["lidarFeatures"]["nearestObstacleDistM"] = round(min_dist, 1)

            # Ejecutar motor de riesgo en 5 capas
            prediction = RiskEngineService.calculate_risk(
                source_vehicle=eq,
                target_vehicle=target_eq if min_dist < 80.0 else None,
                environmental_context={"road_grade": 8.5, "visibility_factor": eq["lidarFeatures"]["visibilityIndex"]}
            )
            eq["currentPrediction"] = prediction

    def _process_active_alerts(self):
        now_iso = datetime.now(timezone.utc).isoformat()
        
        for eq in self.fleet:
            pred = eq.get("currentPrediction", {})
            risk_score = pred.get("overallRiskScore", 0.0)
            level = pred.get("riskLevel", "LOW")

            if risk_score >= 0.60: # HIGH o CRITICAL
                alert_code = f"ALT-{eq['code']}-{now_iso[11:19].replace(':', '')}"
                alert_id = f"alert-{eq['id']}-{self._step_counter}"
                
                alert_data = {
                    "id": alert_id,
                    "alertCode": alert_code,
                    "timestamp": now_iso,
                    "severity": "CRITICAL" if level == "CRITICAL" else "WARNING",
                    "sourceEquipmentId": eq["id"],
                    "sourceEquipmentCode": eq["code"],
                    "targetEquipmentId": pred.get("targetEquipmentId"),
                    "targetEquipmentCode": "AHS-02" if eq["id"] == "eq-ht-104" else "HT-104",
                    "zone": eq["currentZone"],
                    "riskScore": risk_score,
                    "timeToCollision": pred.get("timeToCollisionSec", 4.5),
                    "earlyWarningAnticipationSec": 6.4,
                    "primaryFactor": pred.get("primaryRiskDriver", "Cinemática de convergencia"),
                    "shapExplanationSummary": pred.get("counterfactualRecommendation", "Acción preventiva requerida."),
                    "recommendedAction": pred.get("counterfactualRecommendation", "Detención controlada."),
                    "isAcknowledged": False,
                    "acknowledgedBy": None,
                    "status": "ACTIVE"
                }

                # Evitar duplicados inmediatos en la lista en memoria
                if not any(a["sourceEquipmentId"] == eq["id"] and not a["isAcknowledged"] for a in self.latest_alerts):
                    self.latest_alerts.insert(0, alert_data)
                    if len(self.latest_alerts) > 20:
                        self.latest_alerts.pop()
                    
                    # Emitir a Redis canal 'mining:alerts'
                    asyncio.create_task(redis_service.publish("mining:alerts", alert_data))

simulator_service = SimulatorService()
