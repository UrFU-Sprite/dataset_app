from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verify bcrypt password hash."""
    return pwd_context.verify(password, password_hash)


def create_access_token(subject: int, role: str, expires_minutes: int | None = None) -> str:
    """Create JWT access token."""
    if expires_minutes is None:
        expires_minutes = settings.JWT_EXPIRES_MINUTES

    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=expires_minutes)

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }

    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate JWT token payload."""
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    return payload


def safe_decode_token(token: str) -> Dict[str, Any] | None:
    """Decode token; return None on invalid/expired tokens."""
    try:
        return decode_token(token)
    except JWTError:
        return None

