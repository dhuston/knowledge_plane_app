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
- `tests/`: Test suites
  - `api/`: API endpoint tests
  - `core/`: Core functionality tests
  - `models/`: Model tests
  - `performance/`: Performance and benchmarking tests
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

## Performance Testing

The application includes comprehensive performance testing tools for benchmarking and optimizing API performance.

### Redis Cache Performance Testing

Test the performance of Redis caching for map-related operations:

```bash
cd backend
poetry run python -m pytest tests/performance/test_redis_cache_performance.py -v
```

### Database Query Performance Testing

Test and optimize database query performance:

```bash
cd backend
poetry run python -m pytest tests/performance/test_db_query_performance.py -v
```

### Load Testing with Locust

Run load tests to simulate user traffic and measure API performance:

```bash
cd backend
poetry run locust -f tests/performance/locustfile_map_cache.py
```

Then open http://localhost:8089 in your browser to view the Locust UI.

For headless testing:

```bash
cd backend
poetry run locust -f tests/performance/locustfile_map_cache.py --headless -u 10 -r 1 --run-time 30s
```

### Running All Performance Tests

To run the complete performance test suite:

```bash
cd backend
poetry run python tests/performance/run_performance_tests.py
```

This will execute all tests and generate a comprehensive performance report in `performance_report.md` with visualizations in the `performance_results` directory.

Options:
- `--skip-locust`: Skip Locust load tests (can be time-consuming)
- `--skip-cache`: Skip Redis cache performance tests
- `--skip-db`: Skip database query performance tests