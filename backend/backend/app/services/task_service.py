from __future__ import annotations

import json
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from bson import ObjectId
from loguru import logger

from app.config import settings
from app.database.clickhouse import clickhouse_manager
from app.database.mongodb import mongodb_manager
from app.models.schemas import TaskCreate, TaskStatus, TaskUpdate


class TaskService:
    """CRUD for tasks + annotation submission tracking."""

    def __init__(self) -> None:
        self._tasks_collection = None
        self._task_annotations_collection = None

    async def _get_tasks_collection(self):
        if self._tasks_collection is None:
            self._tasks_collection = await mongodb_manager.get_collection("tasks")
        return self._tasks_collection

    async def _get_task_annotations_collection(self):
        if self._task_annotations_collection is None:
            self._task_annotations_collection = await mongodb_manager.get_collection("task_annotations")
        return self._task_annotations_collection

    @staticmethod
    def _normalize_task(doc: Dict[str, Any]) -> Dict[str, Any]:
        doc = dict(doc)
        doc["id"] = str(doc.pop("_id"))
        # Normalize enum values to plain strings for API responses.
        if "status" in doc and isinstance(doc["status"], TaskStatus):
            doc["status"] = doc["status"].value
        if "assigned_to" in doc and doc["assigned_to"] is not None:
            try:
                doc["assigned_to"] = int(doc["assigned_to"])
            except Exception:
                pass
        return doc

    async def create_task(self, task_data: TaskCreate, user_id: int) -> Dict[str, Any]:
        collection = await self._get_tasks_collection()
        now = datetime.utcnow()

        task = {
            "project_id": task_data.project_id,
            "data": task_data.data,
            "metadata": task_data.metadata,
            "status": TaskStatus.PENDING.value,
            "assigned_to": None,
            "annotations": None,
            "created_by": user_id,
            "created_at": now,
            "updated_at": now,
        }
        result = await collection.insert_one(task)
        task["_id"] = result.inserted_id

        # Notifications are part of assignment #3 and must be disabled for assignment #1 only.
        if settings.PIPELINE_ENABLED:
            try:
                notifications = await mongodb_manager.get_collection("notifications")
                await notifications.insert_one(
                    {
                        "user_id": user_id,
                        "kind": "task_created",
                        "message": f"Task created for project {task_data.project_id}",
                        "created_at": now,
                    }
                )
            except Exception as e:
                logger.debug(f"Notification write failed (non-fatal): {e}")

        return self._normalize_task(task)

    async def get_tasks(
        self,
        project_id: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        collection = await self._get_tasks_collection()

        query: Dict[str, Any] = {}
        if project_id:
            query["project_id"] = project_id
        if status:
            query["status"] = status

        if user_id is not None:
            # For educational purposes: tasks are visible to creator and assignee.
            query = {
                "$and": [
                    query if query else {"$exists": True},
                    {"$or": [{"created_by": user_id}, {"assigned_to": user_id}]},
                ]
            }

        cursor = collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        tasks: List[Dict[str, Any]] = []
        async for doc in cursor:
            tasks.append(self._normalize_task(doc))
        return tasks

    async def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        collection = await self._get_tasks_collection()
        try:
            doc = await collection.find_one({"_id": ObjectId(task_id)})
        except Exception:
            return None
        if not doc:
            return None
        return self._normalize_task(doc)

    async def update_task(self, task_id: str, task_data: TaskUpdate, user_id: int) -> Optional[Dict[str, Any]]:
        collection = await self._get_tasks_collection()
        now = datetime.utcnow()

        update_data = task_data.dict(exclude_unset=True)
        update_data["updated_at"] = now

        if not update_data:
            return await self.get_task(task_id)

        # Basic authorization: creator can update status/assignment; assignee can submit.
        filter_doc: Dict[str, Any] = {"_id": ObjectId(task_id)}
        filter_doc["$or"] = [{"created_by": user_id}]

        try:
            result = await collection.update_one(filter_doc, {"$set": update_data})
        except Exception as e:
            logger.error(f"Failed to update task: {e}")
            return None

        if result.modified_count == 0:
            return None
        return await self.get_task(task_id)

    async def update_task_data(self, task_id: str, data_patch: Dict[str, Any]) -> None:
        collection = await self._get_tasks_collection()
        doc = await self.get_task(task_id)
        if not doc:
            return
        merged = dict(doc.get("data") or {})
        merged.update(data_patch)
        await collection.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": {"data": merged, "updated_at": datetime.utcnow()}},
        )

    @staticmethod
    def _project_id_to_uint(project_id: Any) -> int:
        # ClickHouse schema expects UInt32. We keep compatibility by hashing.
        try:
            return abs(hash(str(project_id))) % (2**32)
        except Exception:
            return 0

    async def submit_task(self, task_id: str, annotations: dict, user_id: int) -> Dict[str, Any]:
        # Assignment #1 focuses on data lake storage; labeling/QA pipeline must be disabled by default.
        if not settings.PIPELINE_ENABLED:
            raise NotImplementedError("Data labeling pipeline disabled for assignment #1")

        collection = await self._get_tasks_collection()
        annotations_collection = await self._get_task_annotations_collection()

        started = time.time()
        task = await self.get_task(task_id)
        if not task:
            raise ValueError("Task not found")

        now = datetime.utcnow()
        submitted_at_ms = int((time.time() - started) * 1000)

        # Store annotations for cross-checking/quality metrics.
        await annotations_collection.insert_one(
            {
                "task_id": task_id,
                "project_id": task["project_id"],
                "user_id": user_id,
                "annotations": annotations,
                "created_at": now,
            }
        )

        # Update task.
        await collection.update_one(
            {"_id": ObjectId(task_id)},
            {
                "$set": {
                    "annotations": annotations,
                    "status": TaskStatus.VERIFIED.value,
                    "assigned_to": user_id,
                    "updated_at": now,
                }
            },
        )

        # Write event to ClickHouse (quality dashboards, annotator stats).
        try:
            await clickhouse_manager.insert(
                "annotation_events",
                [
                    {
                        "event_id": str(uuid.uuid4()),
                        "task_id": task_id,
                        "user_id": int(user_id),
                        "project_id": self._project_id_to_uint(task["project_id"]),
                        "action_type": "submit",
                        "annotation_data": json.dumps(annotations, ensure_ascii=False),
                        "latency_ms": max(1, int(submitted_at_ms)),
                        "event_time": now,
                    }
                ],
            )
        except Exception as e:
            logger.warning(f"ClickHouse write failed (non-fatal): {e}")

        # Update simple user profile stats in MongoDB.
        try:
            profile = await mongodb_manager.get_collection("users_profile")
            await profile.update_one(
                {"user_id": user_id},
                {
                    "$setOnInsert": {"user_id": user_id, "skills": [], "rating": 0.0, "total_earned": 0.0, "tasks_completed": 0},
                    "$inc": {"tasks_completed": 1, "rating": 0.05},
                },
                upsert=True,
            )
        except Exception as e:
            logger.warning(f"users_profile update failed (non-fatal): {e}")

        # Notifications: both submitter and project owner (creator) if available.
        try:
            notifications = await mongodb_manager.get_collection("notifications")
            owner_id = int(task.get("created_by")) if task.get("created_by") is not None else None
            await notifications.insert_one(
                {
                    "user_id": user_id,
                    "kind": "task_submitted",
                    "message": f"Task {task_id} submitted and verified",
                    "created_at": now,
                }
            )
            if owner_id is not None and owner_id != user_id:
                await notifications.insert_one(
                    {
                        "user_id": owner_id,
                        "kind": "task_submitted",
                        "message": f"Task {task_id} was submitted by user {user_id}",
                        "created_at": now,
                    }
                )
        except Exception as e:
            logger.debug(f"Notification write failed (non-fatal): {e}")

        # Bonus award (stub) - non-fatal if Postgres is not available.
        try:
            from app.services.finance_service import FinanceService

            finance = FinanceService()
            await finance.bonus(amount=0.5, user_id=user_id, reference_id=None)
        except Exception as e:
            logger.debug(f"Bonus award skipped: {e}")

        return {"task_id": task_id, "status": TaskStatus.VERIFIED.value, "message": "Submission recorded"}

