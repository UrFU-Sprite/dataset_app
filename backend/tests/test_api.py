import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_root():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        assert response.json()["status"] == "running"

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert "services" in response.json()

@pytest.mark.asyncio
async def test_create_project():
    async with AsyncClient(app=app, base_url="http://test") as client:
        project_data = {
            "name": "Test Project",
            "type": "classification",
            "config": {"classes": ["test"]}
        }
        response = await client.post("/api/v1/projects/", json=project_data)
        # Без аутентификации должен вернуть 401
        assert response.status_code == 401
