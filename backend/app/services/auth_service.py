import logging
import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token

logger = logging.getLogger("auth_service")

class AuthService:
    @staticmethod
    async def register(session: AsyncSession, data: RegisterRequest) -> User:
        # Verificar si el email ya existe
        stmt = select(User).where(User.email == data.email)
        result = await session.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya está registrado."
            )
        
        user_id = f"usr-{uuid.uuid4().hex[:8]}"
        hashed_pwd = get_password_hash(data.password)
        
        user = User(
            id=user_id,
            email=data.email,
            full_name=data.full_name,
            hashed_password=hashed_pwd,
            role=data.role or "OPERATOR",
            is_active=True
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user

    @staticmethod
    async def login(session: AsyncSession, data: LoginRequest) -> TokenResponse:
        stmt = select(User).where(User.email == data.email)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas (correo o contraseña no válidos)."
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="La cuenta de usuario se encuentra inactiva."
            )

        token_payload = {
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name
        }
        access_token = create_access_token(token_payload)
        refresh_token = create_refresh_token(token_payload)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role
        )

    @staticmethod
    async def refresh_token(session: AsyncSession, data: RefreshRequest) -> TokenResponse:
        try:
            payload = decode_token(data.refresh_token)
            if payload.get("type") != "refresh":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token no válido como refresh token."
                )
            user_id = payload.get("sub")
            stmt = select(User).where(User.id == user_id)
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()
            if not user or not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuario inexistente o inactivo."
                )

            new_payload = {
                "sub": user.id,
                "email": user.email,
                "role": user.role,
                "full_name": user.full_name
            }
            new_access_token = create_access_token(new_payload)
            new_refresh_token = create_refresh_token(new_payload)

            return TokenResponse(
                access_token=new_access_token,
                refresh_token=new_refresh_token,
                token_type="bearer",
                user_id=user.id,
                email=user.email,
                full_name=user.full_name,
                role=user.role
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token inválido o expirado."
            )
