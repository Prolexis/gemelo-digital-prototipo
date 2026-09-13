from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.vehicle import VehicleCreate, VehicleRead
from app.services.vehicle_service import VehicleService
from app.core.rbac import require_roles, UserRole

router = APIRouter(prefix="/api/v1/vehicles", tags=["Vehículos & Flota"])

@router.get("", response_model=List[VehicleRead])
async def list_vehicles(db: AsyncSession = Depends(get_db)):
    """Obtiene el listado completo de vehículos de la flota minera con su último estado."""
    vehicles = await VehicleService.get_all_vehicles(db)
    return vehicles

@router.post("", response_model=VehicleRead, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    vehicle_in: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.SAFETY_SUPERVISOR]))
):
    """Agrega un nuevo vehículo a la flota. Requiere rol ADMIN o SAFETY_SUPERVISOR."""
    created = await VehicleService.create_vehicle(db, vehicle_in)
    return VehicleRead.model_validate(created)
