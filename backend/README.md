# KnowledgePlan Backend

This directory contains the FastAPI backend service for the KnowledgePlane application. It exposes the REST API, manages database migrations, and contains core business logic.

The application is packaged with Poetry and deployed via Docker.

## Directory Structure

- `app/`: Contains the FastAPI application code
  - `api/`: API routes and endpoints
  - `core/`: Core functionality and configuration
  - `crud/`: Database CRUD operations
  - `db/`: Database session management
  - `models/`: SQLAlchemy models
  - `schemas/`: Pydantic schemas for request/response
  - `services/`: Business logic services
  - `tasks/`: Background tasks
- `scripts/`: Utility scripts for development and deployment
- `typescript-backend/`: Alternative TypeScript implementation (for reference only)

## Getting Started

1. Install dependencies with Poetry:
   ```bash
   poetry install
   ```

2. Set up environment variables (copy .env.example to .env and edit)

3. Run the application:
   ```bash
   poetry run uvicorn app.main:app --reload
   ```

4. For Docker deployment:
   ```bash
   docker build -t backend .
   docker run -p 8000:8000 backend
   ```