from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from loguru import logger

class MongoDBManager:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
    
    async def connect(self, uri: str, db_name: str = "datalake"):
        """Установка соединения с MongoDB"""
        try:
            self.client = AsyncIOMotorClient(uri)
            self.db = self.client[db_name]
            
            # Проверка соединения
            await self.client.admin.command("ping")
            logger.info(f"Connected to MongoDB: {db_name}")
            
            # Создание индексов
            try:
                await self._create_indexes()
            except Exception as e:
                # Index creation is best-effort for this educational project:
                # a failing index must not prevent app startup.
                logger.warning(f"MongoDB index creation failed (non-fatal): {e}")
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    async def disconnect(self):
        """Закрытие соединения"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def _create_indexes(self):
        """Создание индексов для коллекций"""
        # Индексы для проектов
        await self.db.projects.create_index("name")
        await self.db.projects.create_index("status")
        await self.db.projects.create_index("created_by")
        await self.db.projects.create_index([("created_at", -1)])
        
        # Индексы для задач
        await self.db.tasks.create_index("project_id")
        await self.db.tasks.create_index("status")
        await self.db.tasks.create_index("assigned_to")
        await self.db.tasks.create_index([("created_at", -1)])
        await self.db.tasks.create_index(
            [("project_id", 1), ("status", 1), ("assigned_to", 1)]
        )
        
        # Индексы для пользовательских профилей
        await self.db.users_profile.create_index("user_id", unique=True)
        await self.db.users_profile.create_index("rating", -1)
        
        # Индексы для сессий
        await self.db.sessions.create_index("session_id", unique=True)
        await self.db.sessions.create_index("expires_at", expireAfterSeconds=0)
        
        logger.info("MongoDB indexes created")
    
    async def get_collection(self, collection_name: str):
        """Получение коллекции"""
        if not self.db:
            raise RuntimeError("Database not connected")
        return self.db[collection_name]

# Глобальный экземпляр
mongodb_manager = MongoDBManager()
