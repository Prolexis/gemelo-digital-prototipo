import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import gemini
from config import settings

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("fastapi_main")

app = FastAPI(
    title="Gemelo Digital Minero - Gemini Backend Engine",
    description="API Backend en FastAPI que conecta el Gemelo Digital 3D con Google Gemini API para XAI, Análisis de Riesgo y Asistencia Operacional.",
    version="1.0.0"
)

# Configuración CORS para conexión con Frontend React / Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar Routers
app.include_router(gemini.router)

@app.get("/")
async def root():
    return {
        "message": "Bienvenido al Motor Backend FastAPI de Gemelo Digital Minero",
        "gemini_engine": "Conectado",
        "docs_url": "/docs",
        "health_url": "/api/gemini/health"
    }

@app.get("/health")
async def health():
    return {"status": "ok", "service": "FastAPI Gemini Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
