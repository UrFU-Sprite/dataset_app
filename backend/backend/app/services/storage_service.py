from __future__ import annotations

from io import BytesIO
from typing import BinaryIO, Optional

from app.database.minio import minio_manager


class StorageService:
    """High-level storage abstraction over MinIO."""

    async def upload_file(self, file_path: str, file_content: BinaryIO, content_type: str) -> str:
        return await minio_manager.upload_file(file_path, file_content, content_type=content_type)

    async def download_file(self, file_path: str) -> BytesIO:
        return await minio_manager.download_file(file_path)

    async def delete_file(self, file_path: str) -> None:
        await minio_manager.delete_file(file_path)

    async def get_file_url(self, file_path: str, expires: int = 3600) -> str:
        return await minio_manager.get_file_url(file_path, expires=expires)

