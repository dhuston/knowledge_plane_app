# Use an official Python runtime as a parent image
FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV POETRY_VERSION=2.1.2
ENV POETRY_HOME="/opt/poetry"
ENV POETRY_VENV="/opt/poetry/.venv"
ENV POETRY_CACHE_DIR=\'/opt/.cache'

# Set work directory
WORKDIR /app

# Install Poetry
RUN apt-get update && apt-get install --no-install-recommends -y curl && \
    curl -sSL https://install.python-poetry.org | python - && \
    cd /usr/local/bin && \
    ln -s /opt/poetry/bin/poetry && \
    poetry config virtualenvs.create false

# Copy only dependency files to leverage Docker cache
COPY pyproject.toml poetry.lock* ./

# Install dependencies
# --no-root: installs only dependencies, not the project itself
# --only main: installs only main dependencies (adjust if needed for prod/dev stages)
RUN poetry install --no-interaction --no-ansi --no-root --only main

# --- Final Stage ---
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV APP_HOME=/app

WORKDIR $APP_HOME

# Install runtime dependencies
RUN apt-get update && apt-get install --no-install-recommends -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Copy virtual env from builder stage
COPY --from=builder /opt/.cache /opt/.cache
COPY --from=builder $APP_HOME $APP_HOME

# Copy application code
COPY ./app ./app

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"] 