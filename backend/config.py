import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Google Gemini Settings (Preserved)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    FALLBACK_MODEL: str = os.getenv("FALLBACK_MODEL", "gemini-flash-latest")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # ML Models Directory — ruta donde Streamlit exporta los modelos entrenados
    # Por defecto: carpeta models/ dentro de crisp-dm-lab (desarrollo local)
    ML_MODELS_DIR: Path = Path(
        os.getenv(
            "ML_MODELS_DIR",
            str(Path(__file__).parent.parent / "crisp-dm-lab" / "models")
        )
    )
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    # Database Settings (SQLAlchemy 2.0 Async + asyncpg)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/minesafe"
    )

    # Redis Settings (Pub/Sub)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Security & JWT Settings
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "minesafe-super-secret-production-key-2026-change-in-production"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

settings = Settings()
