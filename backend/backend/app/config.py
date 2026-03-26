from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = "development"
    
    # MongoDB
    MONGO_URI: str = "mongodb://admin:admin123@localhost:27017"
    MONGO_DB: str = "datalake"
    
    # PostgreSQL
    POSTGRES_URI: str = "postgresql://postgres:postgres123@localhost:5432/datalake"
    
    # ClickHouse
    CLICKHOUSE_HOST: str = "localhost"
    CLICKHOUSE_PORT: int = 9000
    CLICKHOUSE_USER: str = "default"
    CLICKHOUSE_PASSWORD: str = "clickhouse123"
    CLICKHOUSE_DB: str = "datalake"
    
    # MinIO
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    MINIO_BUCKET: str = "datalake-files"
    MINIO_SECURE: bool = False
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_SECRET_KEY: str = "jwt-secret-key-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Monitoring
    PROMETHEUS_ENABLED: bool = True

    # Course demo: only assignment #1 should be active by default.
    # Other subsystems (ML labeling, QA metrics, recommendations, monetization, notifications) must not run
    # unless explicitly enabled.
    PIPELINE_ENABLED: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
