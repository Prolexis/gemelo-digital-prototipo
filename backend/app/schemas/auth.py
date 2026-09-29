from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class RegisterRequest(BaseModel):
    email: EmailStr = Field(default="operador@minesafe.com", description="Correo institucional")
    password: str = Field(default="MineroSeguro2026!", description="Contraseña de acceso")
    full_name: str = Field(default="Juan Pérez Operador", description="Nombre completo")
    role: Optional[str] = Field(default="OPERATOR", description="Rol en el sistema")

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "operador@minesafe.com",
                "password": "MineroSeguro2026!",
                "full_name": "Juan Pérez Operador",
                "role": "OPERATOR"
            }
        }
    }

class LoginRequest(BaseModel):
    email: EmailStr = Field(default="operador@minesafe.com", description="Correo institucional")
    password: str = Field(default="MineroSeguro2026!", description="Contraseña de acceso")

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "operador@minesafe.com",
                "password": "MineroSeguro2026!"
            }
        }
    }

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: str
    role: str

class RefreshRequest(BaseModel):
    refresh_token: str

class UserRead(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
