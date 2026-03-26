from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def health_check():
    # Keep it lightweight; the app itself also exposes GET /health.
    return {"status": "ok"}

