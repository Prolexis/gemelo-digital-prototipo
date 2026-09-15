import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings

# Routers REST & WebSockets
from app.routers.gemini import router as gemini_router
from app.routers.auth import router as auth_router
from app.routers.vehicles import router as vehicles_router
from app.routers.alerts import router as alerts_router
from app.routers.analytics import router as analytics_router
from app.routers.ml import router as ml_router
from app.ws.telemetry_ws import router as telemetry_ws_router
from app.ws.alerts_ws import router as alerts_ws_router
from app.ws.connection_manager import ws_manager

# Servicios de base de datos, Redis y simulador
from app.db.session import init_db
from app.services.redis_service import redis_service
from app.services.simulator_service import simulator_service
from app.services.ml_model_service import ml_model_service

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("fastapi_main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida de la aplicación: inicialización de BD, Redis y Simulador industrial."""
    logger.info("Iniciando Motor Backend de Gemelo Digital Minero (FastAPI + XAI + Redis + PostgreSQL)...")
    
    # 1. Inicializar esquemas y datos semilla en PostgreSQL
    await init_db()

    # 2. Conectar a Redis 7.0 Pub/Sub
    await redis_service.connect()

    # 3. Cargar modelos ML del CRISP-DM Lab (si ya fueron exportados)
    ml_model_service.load(settings.ML_MODELS_DIR)

    # 3. Vincular escuchas de Redis Pub/Sub con WebSocket Manager
    async def on_telemetry_msg(data: dict):
        await ws_manager.broadcast_telemetry(data)

    async def on_alert_msg(data: dict):
        await ws_manager.broadcast_alert(data)

    telemetry_sub_task = asyncio.create_task(
        redis_service.subscribe("mining:telemetry", on_telemetry_msg)
    )
    alerts_sub_task = asyncio.create_task(
        redis_service.subscribe("mining:alerts", on_alert_msg)
    )

    # 4. Iniciar simulador de flota a 1 Hz
    await simulator_service.start()

    logger.info("Motor de producción activo y transmitiendo telemetría a 1 Hz.")
    yield

    # Limpieza en apagado
    logger.info("Deteniendo servicios en background...")
    await simulator_service.stop()
    telemetry_sub_task.cancel()
    alerts_sub_task.cancel()
    await redis_service.disconnect()
    logger.info("Servicios detenidos limpiamente.")

app = FastAPI(
    title="MineSafe 3D - Motor de Producción de Seguridad Minera e IA Explicable",
    description="API Backend industrial en FastAPI con PostgreSQL, Redis Pub/Sub, WebSockets 1 Hz, XAI TreeSHAP y Motor Google Gemini.",
    version="2.0.0",
    lifespan=lifespan
)

# Configuración CORS para conexión con Frontend React / Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Routers de Google Gemini (Existente e intacto)
app.include_router(gemini_router)

# 2. Routers REST v1 (Nuevos: Auth, Vehículos, Alertas, Analytics, ML)
app.include_router(auth_router)
app.include_router(vehicles_router)
app.include_router(alerts_router)
app.include_router(analytics_router)
app.include_router(ml_router)

# 3. WebSockets (Telemetría y Alertas en tiempo real)
app.include_router(telemetry_ws_router)
app.include_router(alerts_ws_router)

@app.get("/")
async def root():
    return {
        "message": "Bienvenido al Motor de Producción MineSafe 3D",
        "gemini_engine": "Conectado",
        "realtime_websockets": ["/ws/telemetry", "/ws/alerts"],
        "docs_url": "/docs",
        "gemini_health": "/api/gemini/health",
        "api_v1": {
            "auth": "/api/v1/auth",
            "vehicles": "/api/v1/vehicles",
            "alerts": "/api/v1/alerts",
            "analytics": "/api/v1/analytics/kpis",
            "ml_status": "/api/v1/ml/status",
            "ml_reload": "/api/v1/ml/reload"
        }
    }

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "MineSafe 3D Production Engine",
        "version": "2.0.0",
        "simulator_active": simulator_service.is_running
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
