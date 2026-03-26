from minio import Minio
from minio.error import S3Error
from typing import Optional, BinaryIO
from loguru import logger
import asyncio
from io import BytesIO

class MinIOManager:
    def __init__(self):
        self.client: Optional[Minio] = None
        self.bucket_name: Optional[str] = None
    
    async def connect(self, endpoint: str, access_key: str, secret_key: str, bucket: str, secure: bool = False):
        """Установка соединения с MinIO"""
        try:
            self.client = Minio(
                endpoint,
                access_key=access_key,
                secret_key=secret_key,
                secure=secure
            )
            self.bucket_name = bucket
            
            logger.info(f"Connected to MinIO at {endpoint}")
            
        except Exception as e:
            logger.error(f"Failed to connect to MinIO: {e}")
            raise
    
    async def disconnect(self):
        """Закрытие соединения"""
        # MinIO клиент не требует явного закрытия
        logger.info("Disconnected from MinIO")
    
    async def create_bucket_if_not_exists(self):
        """Создание bucket если не существует"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created bucket: {self.bucket_name}")
            else:
                logger.info(f"Bucket already exists: {self.bucket_name}")
        except S3Error as e:
            logger.error(f"Failed to create bucket: {e}")
            raise
    
    async def upload_file(self, file_path: str, file_content: BinaryIO, content_type: str = "application/octet-stream") -> str:
        """Загрузка файла в MinIO"""
        try:
            # Получение размера файла
            file_content.seek(0, 2)
            file_size = file_content.tell()
            file_content.seek(0)
            
            # Загрузка
            self.client.put_object(
                self.bucket_name,
                file_path,
                file_content,
                file_size,
                content_type=content_type
            )
            
            # Возвращаем путь к файлу
            return f"{self.bucket_name}/{file_path}"
            
        except S3Error as e:
            logger.error(f"Failed to upload file {file_path}: {e}")
            raise
    
    async def download_file(self, file_path: str) -> BytesIO:
        """Скачивание файла из MinIO"""
        try:
            response = self.client.get_object(self.bucket_name, file_path)
            data = response.read()
            response.close()
            response.release_conn()
            
            return BytesIO(data)
            
        except S3Error as e:
            logger.error(f"Failed to download file {file_path}: {e}")
            raise
    
    async def delete_file(self, file_path: str):
        """Удаление файла из MinIO"""
        try:
            self.client.remove_object(self.bucket_name, file_path)
            logger.info(f"Deleted file: {file_path}")
        except S3Error as e:
            logger.error(f"Failed to delete file {file_path}: {e}")
            raise
    
    async def get_file_url(self, file_path: str, expires: int = 3600) -> str:
        """Получение временной ссылки на файл"""
        try:
            url = self.client.presigned_get_object(
                self.bucket_name,
                file_path,
                expires=expires
            )
            return url
        except S3Error as e:
            logger.error(f"Failed to get URL for {file_path}: {e}")
            raise

# Глобальный экземпляр
minio_manager = MinIOManager()
