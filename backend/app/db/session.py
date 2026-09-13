import logging
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select
from config import settings
from app.db.base import Base
# Import models to ensure they are registered with Base.metadata
import app.models # noqa: F401
from app.models.user import User
from app.models.vehicle import Vehicle
from app.core.security import get_password_hash

logger = logging.getLogger("db_session")

# Configurar motor asíncrono con pool robusto
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Inyección de dependencias para sesiones de base de datos en FastAPI."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db(max_retries: int = 5, retry_delay: int = 2) -> None:
    """Inicializa esquemas de base de datos y datos semilla (seeders) con reintentos."""
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Conectando a base de datos PostgreSQL (intento {attempt}/{max_retries})...")
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Esquemas de base de datos validados / creados con éxito.")
            break
        except Exception as e:
            logger.warning(f"Error conectando a BD en intento {attempt}: {e}")
            if attempt < max_retries:
                await asyncio.sleep(retry_delay)
            else:
                logger.error("No se pudo conectar a la base de datos tras múltiples intentos. Continuando en modo degradado.")
                return

    # Poblado inicial (Seeding)
    try:
        async with async_session_factory() as session:
            # 1. Semilla de Usuarios
            user_stmt = select(User).limit(1)
            result = await session.execute(user_stmt)
            if not result.scalar_one_or_none():
                logger.info("Poblando usuarios iniciales (RBAC)...")
                initial_users = [
                    User(
                        id="usr-admin-01",
                        email="admin@minesafe.cl",
                        full_name="Administrador General de Seguridad",
                        hashed_password=get_password_hash("Admin123!"),
                        role="ADMIN",
                        is_active=True
                    ),
                    User(
                        id="usr-hse-02",
                        email="supervisor.hse@mineraesperanza.cl",
                        full_name="Ing. Patricia Valenzuela (Supervisor HSE)",
                        hashed_password=get_password_hash("Supervisor123!"),
                        role="SAFETY_SUPERVISOR",
                        is_active=True
                    ),
                    User(
                        id="usr-op-03",
                        email="carlos.morales@mineraesperanza.cl",
                        full_name="Carlos M. Morales (Operador CAT 797F)",
                        hashed_password=get_password_hash("Operador123!"),
                        role="OPERATOR",
                        is_active=True
                    ),
                    User(
                        id="usr-ds-04",
                        email="analyst.data@minesafe.cl",
                        full_name="Dr. Alex Rivera (Data Scientist)",
                        hashed_password=get_password_hash("Analyst123!"),
                        role="DATA_ANALYST",
                        is_active=True
                    ),
                    User(
                        id="usr-aud-05",
                        email="auditor.msha@sernageomin.gob.cl",
                        full_name="Inspector Sernageomin / MSHA",
                        hashed_password=get_password_hash("Auditor123!"),
                        role="AUDITOR",
                        is_active=True
                    )
                ]
                session.add_all(initial_users)
                await session.commit()
                logger.info("Usuarios iniciales creados exitosamente.")

            # 2. Semilla de Vehículos de Flota Mixta
            veh_stmt = select(Vehicle).limit(1)
            veh_result = await session.execute(veh_stmt)
            if not veh_result.scalar_one_or_none():
                logger.info("Poblando flota inicial de vehículos mineros...")
                initial_vehicles = [
                    Vehicle(
                        id="eq-ht-104",
                        code="HT-104",
                        name="Caterpillar 797F (Manual)",
                        type="HAUL_TRUCK_MANUAL",
                        model="CAT 797F Ultra Class (400 Ton)",
                        is_autonomous=False,
                        current_zone="Rampa Este - Curva Ciega Banco 3200",
                        current_bench="Banco 3200 msnm",
                        status="ACTIVE_HAULING",
                        payload_tons=385.0,
                        max_speed_kmh=45.0,
                        last_easting=250.0,
                        last_northing=120.0,
                        last_elevation=3205.0,
                        last_speed=34.2,
                        last_heading=135.0,
                        last_risk_score=0.88,
                        last_risk_level="CRITICAL"
                    ),
                    Vehicle(
                        id="eq-ahs-02",
                        code="AHS-02",
                        name="Komatsu 930E FrontRunner (Autónomo)",
                        type="HAUL_TRUCK_AHS",
                        model="Komatsu 930E-5 AHS Autonomous System",
                        is_autonomous=True,
                        current_zone="Rampa Este - Curva Ciega Banco 3200",
                        current_bench="Banco 3200 msnm",
                        status="ACTIVE_HAULING",
                        payload_tons=360.0,
                        max_speed_kmh=35.0,
                        last_easting=275.0,
                        last_northing=105.0,
                        last_elevation=3205.0,
                        last_speed=28.0,
                        last_heading=315.0,
                        last_risk_score=0.76,
                        last_risk_level="HIGH"
                    ),
                    Vehicle(
                        id="eq-sh-01",
                        code="PALA-01",
                        name="Pala Eléctrica de Cable P&H 4100XPC",
                        type="SHOVEL",
                        model="Komatsu / P&H 4100XPC Electric Rope Shovel",
                        is_autonomous=False,
                        current_zone="Frente de Carguío - Banco 3400 Norte",
                        current_bench="Banco 3400 msnm",
                        status="LOADING",
                        payload_tons=0.0,
                        max_speed_kmh=2.0,
                        last_easting=-150.0,
                        last_northing=280.0,
                        last_elevation=3400.0,
                        last_speed=0.0,
                        last_heading=90.0,
                        last_risk_score=0.22,
                        last_risk_level="LOW"
                    ),
                    Vehicle(
                        id="eq-lv-05",
                        code="CAM-05",
                        name="Camioneta de Supervisión HSE (Toyota Hilux)",
                        type="LIGHT_VEHICLE",
                        model="Toyota Hilux 4x4 Mining Spec (Pértiga LED 4.2m)",
                        is_autonomous=False,
                        current_zone="Rampa Central - Acceso Banco 3300",
                        current_bench="Banco 3300 msnm",
                        status="ACTIVE_HAULING",
                        payload_tons=1.2,
                        max_speed_kmh=55.0,
                        last_easting=80.0,
                        last_northing=50.0,
                        last_elevation=3300.0,
                        last_speed=38.0,
                        last_heading=45.0,
                        last_risk_score=0.15,
                        last_risk_level="LOW"
                    ),
                    Vehicle(
                        id="eq-ht-108",
                        code="HT-108",
                        name="Caterpillar 797F (Manual)",
                        type="HAUL_TRUCK_MANUAL",
                        model="CAT 797F Ultra Class (400 Ton)",
                        is_autonomous=False,
                        current_zone="Botadero Principal Sur - Descarga",
                        current_bench="Banco 3600 msnm",
                        status="DUMPING",
                        payload_tons=390.0,
                        max_speed_kmh=45.0,
                        last_easting=380.0,
                        last_northing=-220.0,
                        last_elevation=3602.0,
                        last_speed=4.5,
                        last_heading=180.0,
                        last_risk_score=0.35,
                        last_risk_level="MEDIUM"
                    )
                ]
                session.add_all(initial_vehicles)
                await session.commit()
                logger.info("Flota inicial de vehículos creada exitosamente.")
    except Exception as e:
        logger.error(f"Error durante el seed inicial de BD: {e}")
