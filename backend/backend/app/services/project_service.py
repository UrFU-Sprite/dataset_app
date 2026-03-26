from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from loguru import logger

from app.database.mongodb import mongodb_manager
from app.database.postgres import postgres_manager
from app.models.schemas import ProjectCreate, ProjectUpdate
from app.config import settings

class ProjectService:
    def __init__(self):
        self.collection = None
    
    async def _get_collection(self):
        if not self.collection:
            self.collection = await mongodb_manager.get_collection("projects")
        return self.collection
    
    async def create_project(self, project_data: ProjectCreate, user_id: int) -> Dict[str, Any]:
        """Создание нового проекта"""
        collection = await self._get_collection()
        
        project = {
            "name": project_data.name,
            "type": project_data.type.value,
            "config": project_data.config,
            "description": project_data.description,
            "tags": project_data.tags,
            "status": "draft",
            "created_by": user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await collection.insert_one(project)
        project["id"] = str(result.inserted_id)
        
        # ClickHouse event logging belongs to assignment #3 (progress/analytics) and is disabled by default.
        if settings.PIPELINE_ENABLED:
            from app.database.clickhouse import clickhouse_manager

            await clickhouse_manager.insert(
                "task_events_log",
                [
                    {
                        "task_id": str(result.inserted_id),
                        "project_id": 0,
                        "event_type": "project_created",
                        "user_id": user_id,
                        "timestamp": datetime.utcnow(),
                    }
                ],
            )

        # Notifications are part of assignment #3 and must be disabled for assignment #1 only.
        if settings.PIPELINE_ENABLED:
            try:
                notifications = await mongodb_manager.get_collection("notifications")
                await notifications.insert_one(
                    {
                        "user_id": user_id,
                        "kind": "project_created",
                        "message": f"Project '{project_data.name}' created",
                        "created_at": datetime.utcnow(),
                    }
                )
            except Exception as e:
                logger.debug(f"Notification write failed (non-fatal): {e}")
        
        return project
    
    async def get_projects(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Получение списка проектов"""
        collection = await self._get_collection()
        
        query = {}
        if status:
            query["status"] = status
        if user_id:
            query["created_by"] = user_id
        
        cursor = collection.find(query).skip(skip).limit(limit)
        projects = []
        
        async for project in cursor:
            project["id"] = str(project["_id"])
            project.pop("_id", None)
            projects.append(project)
        
        return projects
    
    async def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Получение проекта по ID"""
        collection = await self._get_collection()
        
        try:
            project = await collection.find_one({"_id": ObjectId(project_id)})
            if project:
                project["id"] = str(project["_id"])
                project.pop("_id", None)
            return project
        except Exception as e:
            logger.error(f"Failed to get project {project_id}: {e}")
            return None
    
    async def update_project(
        self,
        project_id: str,
        project_data: ProjectUpdate,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        """Обновление проекта"""
        collection = await self._get_collection()
        
        update_data = project_data.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        try:
            result = await collection.update_one(
                {"_id": ObjectId(project_id)},
                {"$set": {k: (v.value if hasattr(v, "value") else v) for k, v in update_data.items()}}
            )
            
            if result.modified_count:
                return await self.get_project(project_id)
            return None
            
        except Exception as e:
            logger.error(f"Failed to update project {project_id}: {e}")
            return None
    
    async def delete_project(self, project_id: str) -> bool:
        """Удаление проекта"""
        collection = await self._get_collection()
        
        try:
            result = await collection.delete_one({"_id": ObjectId(project_id)})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Failed to delete project {project_id}: {e}")
            return False
