from __future__ import annotations

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from app.core.security import decode_token
from app.services.project_service import ProjectService
from app.config import settings

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """Return current user from Bearer JWT.

    For this educational project we keep the payload minimal: {id, role}.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    token = credentials.credentials
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    sub = payload.get("sub")
    if sub is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    try:
        user_id = int(sub)
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    return {
        "id": user_id,
        "role": payload.get("role", "customer"),
    }


async def get_task_service() -> TaskService:
    from app.services.task_service import TaskService

    return TaskService()


async def get_storage_service() -> StorageService:
    from app.services.storage_service import StorageService

    return StorageService()


async def get_project_service() -> ProjectService:
    return ProjectService()


async def get_user_service():
    # import inside to avoid cycles during app startup
    from app.services.user_service import UserService

    return UserService()


async def get_finance_service() -> FinanceService:
    if not settings.PIPELINE_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Assignment #1 only: finance endpoints are disabled by default.",
        )
    from app.services.finance_service import FinanceService

    return FinanceService()


async def get_analytics_service() -> AnalyticsService:
    if not settings.PIPELINE_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Assignment #1 only: labeling/quality/recommendations are disabled by default.",
        )
    from app.services.analytics_service import AnalyticsService

    return AnalyticsService()

