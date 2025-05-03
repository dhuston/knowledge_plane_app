# Performance Testing Suite

This directory contains the performance testing suite for the Biosphere Alpha application. The tests are designed to measure, benchmark, and optimize the performance of both backend components.

## Available Tests

### Redis Cache Performance Tests

Tests the performance and effectiveness of Redis caching for map-related operations:

```bash
poetry run pytest test_redis_cache_performance.py -v
```

### Database Query Performance Tests

Tests and optimizes database query performance:

```bash
poetry run pytest test_db_query_performance.py -v
```

### Locust Load Tests

Simulates user traffic and measures API performance:

```bash
# Run with UI
poetry run locust -f locustfile_map_cache.py

# Run headless
poetry run locust -f locustfile_map_cache.py --headless -u 10 -r 1 --run-time 30s
```

## Running All Tests

To run all performance tests and generate a comprehensive report:

```bash
poetry run python run_performance_tests.py
```

Options:
- `--skip-locust`: Skip Locust load tests (can be time-consuming)
- `--skip-cache`: Skip Redis cache performance tests
- `--skip-db`: Skip database query performance tests

## Test Metrics and Thresholds

The tests measure the following metrics:

### API Response Times
- Target: < 200ms for simple queries
- Target: < 800ms for complex map queries
- Critical: > 2000ms for any query

### Cache Effectiveness
- Target cache hit rate: > 80%
- Target cache hit response time: < 50ms
- Target cache miss response time: < 300ms

### Database Performance
- Spatial queries should be at least 2x faster than equivalent relational queries
- Keyset pagination should be at least 2x faster than offset pagination for deep result sets

## Adding New Tests

When adding new performance tests:

1. Create a new test file in this directory
2. Use pytest fixtures for setting up test data
3. Implement time measurement using the `time` module
4. Define clear thresholds in assertions
5. Add the test to `run_performance_tests.py` if applicable