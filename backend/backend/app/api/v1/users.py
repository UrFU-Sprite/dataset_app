from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from loguru import logger

from app.api.dependencies import get_current_user, get_user_service
from app.models.schemas import UserCreate, UserResponse

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
async def register(
    data: UserCreate,
    service=Depends(get_user_service),
):
    try:
        created = await service.register_user(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return created


@router.post("/login")
async def login(
    data: LoginRequest,
    service=Depends(get_user_service),
):
    try:
        auth = await service.authenticate(data.email, data.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    return auth


@router.get("/me", response_model=UserResponse)
async def me(
    current_user: dict = Depends(get_current_user),
):
    # For demo we only return id/role; email not stored in JWT.
    return {
        "id": current_user["id"],
        "email": "",
        "role": current_user.get("role", "customer"),
        "full_name": None,
        "created_at": datetime.utcnow(),
    }

