import logging
import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleRead
from app.services.simulator_service import simulator_service

logger = logging.getLogger("vehicle_service")

class VehicleService:
    @staticmethod
    async def get_all_vehicles(session: AsyncSession) -> List[VehicleRead]:
        """Obtiene la lista de vehículos desde BD o desde el simulador si la BD está vacía."""
        try:
            stmt = select(Vehicle)
            result = await session.execute(stmt)
            vehicles = result.scalars().all()
            if vehicles:
                return [VehicleRead.model_validate(v) for v in vehicles]
        except Exception as e:
            logger.warning(f"Error consultando vehículos en BD: {e}. Usando datos de simulador.")

        # Fallback a estado del simulador
        fleet = simulator_service.get_current_fleet()
        result_list = []
        for eq in fleet:
            pos = eq.get("position", {})
            pred = eq.get("currentPrediction", {})
            result_list.append(VehicleRead(
                id=eq["id"],
                code=eq["code"],
                name=eq["name"],
                type=eq["type"],
                model=eq["model"],
                is_autonomous=eq.get("isAutonomous", False),
                current_zone=eq["currentZone"],
                current_bench=eq["currentBench"],
                status=eq["status"],
                payload_tons=eq.get("payloadTons", 0.0),
                max_speed_kmh=eq.get("maxSpeedKmh", 45.0),
                last_easting=pos.get("easting", 0.0),
                last_northing=pos.get("northing", 0.0),
                last_elevation=pos.get("elevation", 3200.0),
                last_speed=pos.get("speedKmh", 0.0),
                last_heading=pos.get("headingDeg", 0.0),
                last_risk_score=pred.get("overallRiskScore", 0.0),
                last_risk_level=pred.get("riskLevel", "LOW")
            ))
        return result_list

    @staticmethod
    async def create_vehicle(session: AsyncSession, data: VehicleCreate) -> Vehicle:
        vehicle_id = data.id or f"eq-{data.code.lower().replace(' ', '-')}-{uuid.uuid4().hex[:4]}"
        
        # Verificar código único
        stmt = select(Vehicle).where(Vehicle.code == data.code)
        result = await session.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un vehículo con el código {data.code}."
            )

        vehicle = Vehicle(
            id=vehicle_id,
            code=data.code,
            name=data.name,
            type=data.type,
            model=data.model,
            is_autonomous=data.is_autonomous,
            current_zone=data.current_zone,
            current_bench=data.current_bench,
            status=data.status,
            payload_tons=data.payload_tons,
            max_speed_kmh=data.max_speed_kmh
        )
        session.add(vehicle)
        await session.commit()
        await session.refresh(vehicle)
        return vehicle
