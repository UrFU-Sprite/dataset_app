from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.api.dependencies import get_analytics_service, get_current_user
from app.config import settings

router = APIRouter()

def _require_pipeline_enabled() -> None:
    if not settings.PIPELINE_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Assignment #1 only: labeling/quality/recommendations are disabled by default.",
        )


class PredictRequest(BaseModel):
    model_type: str = Field("logreg", description="Labeling pipeline/model type")
    items: List[Dict[str, Any]] = Field(..., description="Items containing at least {task_id, data}")


@router.post("/labeling/predict")
async def predict_labeling(
    data: PredictRequest,
    service=Depends(get_analytics_service),
):
    _require_pipeline_enabled()
    return await service.predict_labels(items=data.items, model_type=data.model_type)


@router.post("/labeling/active-learning/next")
async def active_learning_next(
    project_id: str = Query(...),
    num_tasks: int = Query(5, ge=1, le=50),
    model_type: str = Query("logreg"),
    annotator_id: Optional[int] = Query(None, description="Optional annotator id for personalization"),
    service=Depends(get_analytics_service),
):
    _require_pipeline_enabled()
    return await service.active_learning_next(
        project_id=project_id,
        num_tasks=num_tasks,
        model_type=model_type,
        annotator_id=annotator_id,
    )


@router.get("/quality/metrics")
async def quality_metrics(
    project_id: str = Query(...),
    annotator_a: int = Query(...),
    annotator_b: int = Query(...),
    service=Depends(get_analytics_service),
):
    _require_pipeline_enabled()
    metrics = await service.quality_metrics(project_id=project_id, annotator_a=annotator_a, annotator_b=annotator_b)
    return metrics


@router.post("/quality/integrity-check")
async def integrity_check(
    project_id: str,
    service=Depends(get_analytics_service),
):
    _require_pipeline_enabled()
    return await service.integrity_check(project_id=project_id)


@router.get("/recommendations/annotators")
async def rank_annotators(
    project_id: str = Query(...),
    limit: int = Query(10, ge=1, le=50),
    service=Depends(get_analytics_service),
):
    _require_pipeline_enabled()
    return await service.rank_annotators(project_id=project_id, limit=limit)


@router.get("/progress/project")
async def project_progress(
    project_id: str = Query(...),
    service=Depends(get_analytics_service),
):
    _require_pipeline_enabled()
    return await service.project_progress(project_id=project_id)


@router.get("/notifications")
async def notifications(
    current_user: dict = Depends(get_current_user),
    service=Depends(get_analytics_service),
    limit: int = Query(20, ge=1, le=100),
):
    _require_pipeline_enabled()
    return await service.list_notifications(user_id=current_user["id"], limit=limit)

