from __future__ import annotations

from datetime import datetime
from typing import Optional

from loguru import logger
from sqlalchemy import Column, DateTime, Float, Integer, String, func
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Wallet(Base):
    __tablename__ = "wallets"

    user_id = Column(Integer, primary_key=True, index=True)
    balance = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String(length=64), nullable=False)
    status = Column(String(length=64), nullable=False)
    reference_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())


class PostgreSQLManager:
    def __init__(self):
        self.engine: Optional[AsyncEngine] = None
        self.async_session: Optional[async_sessionmaker] = None
    
    async def connect(self, uri: str):
        """Установка соединения с PostgreSQL"""
        try:
            # Конвертация sync URI в async
            async_uri = uri.replace("postgresql://", "postgresql+asyncpg://")
            
            self.engine = create_async_engine(
                async_uri,
                echo=False,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True
            )
            
            self.async_session = async_sessionmaker(
                self.engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
            
            # Создание таблиц
            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            
            logger.info("Connected to PostgreSQL")
            
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            raise
    
    async def disconnect(self):
        """Закрытие соединения"""
        if self.engine:
            await self.engine.dispose()
            logger.info("Disconnected from PostgreSQL")
    
    async def get_session(self) -> AsyncSession:
        """Получение сессии для работы с БД"""
        if not self.async_session:
            raise RuntimeError("Database not connected")
        return self.async_session()
    
    def get_connection(self):
        """Получение соединения (контекстный менеджер)"""
        if not self.async_session:
            raise RuntimeError("Database not connected")
        return self.async_session()

# Глобальный экземпляр
postgres_manager = PostgreSQLManager()
