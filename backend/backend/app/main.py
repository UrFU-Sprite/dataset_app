from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from loguru import logger
import time
from sqlalchemy import text

from app.config import settings
from app.database.mongodb import mongodb_manager
from app.database.postgres import postgres_manager
from app.database.clickhouse import clickhouse_manager
from app.database.minio import minio_manager
from app.api.v1 import projects, tasks, users, finance, analytics, health

# Настройка логирования
logger.add(
    "logs/datalake.log",
    rotation="500 MB",
    retention="10 days",
    format="{time} | {level} | {message}"
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Управление жизненным циклом приложения"""
    # Startup
    logger.info("Starting DataLake Platform...")
    
    connected = {"mongodb": False, "postgresql": False, "clickhouse": False, "minio": False}

    # Инициализация подключений к БД (делаем graceful-degradation для локальных запусков).
    try:
        await mongodb_manager.connect(settings.MONGO_URI)
        connected["mongodb"] = True
    except Exception as e:
        logger.warning(f"MongoDB connection failed (non-fatal): {e}")

    try:
        await postgres_manager.connect(settings.POSTGRES_URI)
        connected["postgresql"] = True
    except Exception as e:
        logger.warning(f"PostgreSQL connection failed (non-fatal): {e}")

    try:
        await clickhouse_manager.connect(
            host=settings.CLICKHOUSE_HOST,
            port=settings.CLICKHOUSE_PORT,
            user=settings.CLICKHOUSE_USER,
            password=settings.CLICKHOUSE_PASSWORD,
        )
        connected["clickhouse"] = True
    except Exception as e:
        logger.warning(f"ClickHouse connection failed (non-fatal): {e}")

    try:
        await minio_manager.connect(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            bucket=settings.MINIO_BUCKET,
        )
        # Создание bucket если не существует
        await minio_manager.create_bucket_if_not_exists()
        connected["minio"] = True
    except Exception as e:
        logger.warning(f"MinIO connection failed (non-fatal): {e}")

    app.state.services_connected = connected
    logger.info(f"Startup connections: {connected}")
    yield
    
    # Shutdown
    logger.info("Shutting down DataLake Platform...")
    await mongodb_manager.disconnect()
    await postgres_manager.disconnect()
    await clickhouse_manager.disconnect()
    logger.info("All connections closed")

# Создание приложения
app = FastAPI(
    title="DataLake Platform API",
    version="1.0.0",
    description="Centralized Data Lake with distributed architecture",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware для логирования
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.3f}s"
    )
    
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Подключение роутеров
app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["tasks"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(finance.router, prefix="/api/v1/finance", tags=["finance"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])

@app.get("/")
async def root():
    connected = getattr(app.state, "services_connected", {}) or {}
    return {
        "name": "DataLake Platform",
        "version": "1.0.0",
        "status": "running",
        "services": {
            "mongodb": "connected" if connected.get("mongodb") else "unknown",
            "postgresql": "connected" if connected.get("postgresql") else "unknown",
            "clickhouse": "connected" if connected.get("clickhouse") else "unknown",
            "minio": "connected" if connected.get("minio") else "unknown",
        }
    }

@app.get("/health")
async def health_check():
    """Проверка здоровья всех сервисов"""
    health_status = {
        "status": "healthy",
        "services": {}
    }
    
    # Проверка MongoDB
    try:
        await mongodb_manager.db.command("ping")
        health_status["services"]["mongodb"] = "healthy"
    except Exception as e:
        health_status["services"]["mongodb"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    # Проверка PostgreSQL
    try:
        session = await postgres_manager.get_session()
        try:
            await session.execute(text("SELECT 1"))
        finally:
            await session.close()
        health_status["services"]["postgresql"] = "healthy"
    except Exception as e:
        health_status["services"]["postgresql"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    # Проверка ClickHouse
    try:
        await clickhouse_manager.execute("SELECT 1")
        health_status["services"]["clickhouse"] = "healthy"
    except Exception as e:
        health_status["services"]["clickhouse"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    # Проверка MinIO
    try:
        # MinIO python client is synchronous; do not await.
        minio_manager.client.list_buckets()
        health_status["services"]["minio"] = "healthy"
    except Exception as e:
        health_status["services"]["minio"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    return health_status
