from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from bson import ObjectId
from loguru import logger

from app.core.security import create_access_token, hash_password, verify_password
from app.database.mongodb import mongodb_manager
from app.models.schemas import UserCreate, UserRole


class UserService:
    """User management (educational, JWT-based)."""

    async def register_user(self, data: UserCreate) -> Dict[str, Any]:
        users = await mongodb_manager.get_collection("users")
        now = datetime.utcnow()

        existing = await users.find_one({"email": data.email})
        if existing:
            raise ValueError("Email already registered")

        password_hash = hash_password(data.password)

        doc = {
            "email": data.email,
            "password_hash": password_hash,
            "role": data.role.value,
            "full_name": data.full_name,
            "created_at": now,
        }
        result = await users.insert_one(doc)
        doc_id = result.inserted_id
        user_id = abs(hash(str(doc_id))) % (10**9)

        # Persist numeric user id for consistent profile updates.
        await users.update_one({"_id": doc_id}, {"$set": {"user_id": user_id}})

        # Create/update profile.
        profile = await mongodb_manager.get_collection("users_profile")
        await profile.update_one(
            {"user_id": user_id},
            {
                "$setOnInsert": {
                    "user_id": user_id,
                    "skills": [],
                    "rating": 0.0,
                    "total_earned": 0.0,
                    "tasks_completed": 0,
                }
            },
            upsert=True,
        )

        token = create_access_token(subject=user_id, role=data.role.value)

        return {"user_id": user_id, "token": token}

    async def authenticate(self, email: str, password: str) -> Dict[str, Any]:
        users = await mongodb_manager.get_collection("users")
        doc = await users.find_one({"email": email})
        if not doc:
            raise ValueError("Invalid credentials")

        if not verify_password(password, doc["password_hash"]):
            raise ValueError("Invalid credentials")

        role = doc.get("role", UserRole.CUSTOMER.value)
        user_id = int(doc.get("user_id") or (abs(hash(str(doc["_id"]))) % (10**9)))
        token = create_access_token(subject=user_id, role=role)
        return {"user_id": user_id, "token": token, "role": role}

