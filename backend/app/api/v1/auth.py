"""
Authentication endpoints and middleware for admin access
"""
import hashlib
import hmac
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import jwt, JWTError

from app.core.config import settings

router = APIRouter()
security = HTTPBearer()


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Admin credentials from config/env vars
ADMIN_USERNAME = getattr(settings, 'ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = getattr(settings, 'ADMIN_PASSWORD', 'movemaster2026')


def _verify_password(plain_password: str, expected_password: str) -> bool:
    """Constant-time password comparison to prevent timing attacks"""
    return hmac.compare_digest(
        plain_password.encode('utf-8'),
        expected_password.encode('utf-8')
    )


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Dependency that verifies JWT token and returns payload"""
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Admin login endpoint"""
    if request.username != ADMIN_USERNAME or not _verify_password(request.password, ADMIN_PASSWORD):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültige Anmeldedaten"
        )

    access_token = create_access_token(data={"sub": request.username})
    return TokenResponse(access_token=access_token)


@router.get("/me")
async def get_current_user(payload: dict = Depends(verify_token)):
    """Get current authenticated user"""
    return {"username": payload.get("sub")}
