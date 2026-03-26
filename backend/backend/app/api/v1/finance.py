from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.dependencies import get_current_user, get_finance_service
from app.models.schemas import TransactionCreate, TransactionResponse
from app.config import settings

router = APIRouter()

def _require_pipeline_enabled() -> None:
    if not settings.PIPELINE_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Assignment #1 only: monetization/ledger endpoints are disabled by default.",
        )


@router.post("/deposit", response_model=TransactionResponse)
async def deposit(
    data: TransactionCreate,
    current_user: dict = Depends(get_current_user),
    service=Depends(get_finance_service),
):
    _require_pipeline_enabled()
    try:
        return await service.deposit(data, current_user["id"])
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


class BonusRequest(BaseModel):
    amount: float = Field(..., gt=0)
    reference_id: Optional[int] = None


@router.post("/bonus", response_model=TransactionResponse)
async def bonus(
    data: BonusRequest,
    current_user: dict = Depends(get_current_user),
    service=Depends(get_finance_service),
):
    _require_pipeline_enabled()
    # In a real system bonus would be calculated/verified by QA pipeline.
    return await service.bonus(amount=data.amount, user_id=current_user["id"], reference_id=data.reference_id)


@router.get("/transactions", response_model=List[TransactionResponse])
async def list_transactions(
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    user_id: Optional[int] = None,
    service=Depends(get_finance_service),
):
    _require_pipeline_enabled()
    target_user_id = current_user["id"]
    if current_user.get("role") == "admin" and user_id is not None:
        target_user_id = user_id
    return await service.list_transactions(target_user_id, skip=skip, limit=limit)

