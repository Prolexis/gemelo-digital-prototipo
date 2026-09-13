from app.routers.gemini import router as gemini_router
from app.routers.auth import router as auth_router
from app.routers.vehicles import router as vehicles_router
from app.routers.alerts import router as alerts_router
from app.routers.analytics import router as analytics_router

__all__ = [
    "gemini_router",
    "auth_router",
    "vehicles_router",
    "alerts_router",
    "analytics_router"
]
