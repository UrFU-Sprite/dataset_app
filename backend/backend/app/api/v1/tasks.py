from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from typing import List, Optional
from loguru import logger

from app.models.schemas import (
    TaskCreate, TaskUpdate, TaskResponse
)
from app.services.task_service import TaskService
from app.services.storage_service import StorageService
from app.api.dependencies import get_current_user, get_task_service, get_storage_service

router = APIRouter()

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    current_user: dict = Depends(get_current_user),
    service: TaskService = Depends(get_task_service)
):
    """Создание новой задачи"""
    task = await service.create_task(task_data, current_user["id"])
    logger.info(f"Task created: {task.get('id')}")
    return task

@router.post("/{task_id}/upload-file")
async def upload_task_file(
    task_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage_service),
    task_service: TaskService = Depends(get_task_service)
):
    """Загрузка файла для задачи"""
    # Сохраняем файл в MinIO
    file_path = f"tasks/{task_id}/{file.filename}"
    file_content = await file.read()
    
    from io import BytesIO
    file_url = await storage_service.upload_file(
        file_path,
        BytesIO(file_content),
        file.content_type
    )
    
    # Обновляем данные задачи
    await task_service.update_task_data(task_id, {"file_url": file_url})
    
    return {"file_url": file_url, "message": "File uploaded successfully"}

@router.get("/", response_model=List[TaskResponse])
async def list_tasks(
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    service: TaskService = Depends(get_task_service)
):
    """Получение списка задач"""
    tasks = await service.get_tasks(
        project_id=project_id,
        status=status,
        skip=skip,
        limit=limit,
        user_id=current_user["id"]
    )
    return tasks

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: dict = Depends(get_current_user),
    service: TaskService = Depends(get_task_service)
):
    """Получение задачи по ID"""
    task = await service.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    current_user: dict = Depends(get_current_user),
    service: TaskService = Depends(get_task_service)
):
    """Обновление задачи"""
    task = await service.update_task(
        task_id=task_id,
        task_data=task_data,
        user_id=current_user["id"]
    )
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return task

@router.post("/{task_id}/submit")
async def submit_task(
    task_id: str,
    annotations: dict,
    current_user: dict = Depends(get_current_user),
    service: TaskService = Depends(get_task_service)
):
    """Сдача выполненной задачи"""
    try:
        return await service.submit_task(
            task_id=task_id,
            annotations=annotations,
            user_id=current_user["id"],
        )
    except NotImplementedError as e:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(e))
