from enum import Enum
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from app.core.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    SAFETY_SUPERVISOR = "SAFETY_SUPERVISOR"
    OPERATOR = "OPERATOR"
    DATA_ANALYST = "DATA_ANALYST"
    AUDITOR = "AUDITOR"

async def get_current_user_token_payload(token: Optional[str] = Depends(oauth2_scheme)) -> dict:
    """Extrae el payload del token del usuario autenticado."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de autenticación no proporcionadas.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido para esta operación (se requiere token de acceso).",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado o inválido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_roles(allowed_roles: List[UserRole]):
    """Dependencia factory para RBAC en endpoints."""
    def role_checker(payload: dict = Depends(get_current_user_token_payload)) -> dict:
        user_role = payload.get("role")
        if not user_role or user_role not in [r.value for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permiso denegado. Rol requerido: {[r.value for r in allowed_roles]}, rol actual: {user_role}",
            )
        return payload
    return role_checker
