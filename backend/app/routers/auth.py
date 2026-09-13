from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, UserRead
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["Autenticación & RBAC"])

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Registra un nuevo usuario con credenciales seguras (Argon2) y rol asignado."""
    user = await AuthService.register(db, request)
    return user

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Inicia sesión y devuelve Access Token y Refresh Token JWT."""
    tokens = await AuthService.login(db, request)
    return tokens

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Renueva el token de acceso mediante el refresh token."""
    tokens = await AuthService.refresh_token(db, request)
    return tokens
