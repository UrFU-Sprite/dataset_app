# Dataset App

Monorepo with:
- `backend` - Django REST Framework API
- `frontend` - React + TypeScript + Webpack + SCSS

## Run with Docker Compose

From the repository root:

```bash
docker compose up --build
```

Available services:
- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8000`
- Swagger: `http://localhost:8000/swagger/`

Frontend is configured to call backend using `/api/v1/...` through Nginx proxy.
