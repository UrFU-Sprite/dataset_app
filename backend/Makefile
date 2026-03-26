.PHONY: help build up down logs clean test shell

help:
	@echo "Available commands:"
	@echo "  make build    - Build Docker images"
	@echo "  make up       - Start all services"
	@echo "  make down     - Stop all services"
	@echo "  make logs     - Show logs"
	@echo "  make clean    - Remove containers and volumes"
	@echo "  make test     - Run tests"
	@echo "  make shell    - Enter backend container shell"

build:
	docker-compose build

up:
	docker-compose up -d
	@echo "Services started. API available at http://localhost:8000"
	@echo "MinIO Console: http://localhost:9001"
	@echo "Grafana: http://localhost:3000"
	@echo "Prometheus: http://localhost:9090"

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	rm -rf backend/__pycache__

test:
	docker-compose exec backend pytest tests/

shell:
	docker-compose exec backend /bin/bash

init-db:
	docker-compose exec backend python scripts/init_db.py

migrate:
	docker-compose exec backend alembic upgrade head

create-migration:
	docker-compose exec backend alembic revision --autogenerate -m "$(message)"
