# Use an official Python runtime as a parent image
FROM python:3.12-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV POETRY_VERSION=2.1.2
ENV POETRY_HOME="/opt/poetry"
ENV PATH="$POETRY_HOME/bin:$PATH"

# Set work directory
WORKDIR /app

# Install Poetry
RUN apt-get update && apt-get install --no-install-recommends -y curl && \
    curl -sSL https://install.python-poetry.org | python -

# Copy only dependency files to leverage Docker cache
COPY pyproject.toml poetry.lock* ./

# Configure Poetry to create venv inside the project directory
RUN poetry config virtualenvs.in-project true

# Install ONLY main production dependencies, excluding the project itself
RUN poetry install --only main --no-root --no-interaction --no-ansi

# --- Final Stage ---
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV APP_HOME=/app
# Add project venv bin to path
ENV PATH="$APP_HOME/.venv/bin:$PATH"

WORKDIR $APP_HOME

# Install runtime dependencies (libpq-dev might still be needed for psycopg2/asyncpg)
RUN apt-get update && apt-get install --no-install-recommends -y libpq-dev && rm -rf /var/lib/apt/lists/*

# Copy virtual env from builder stage (from the project dir)
COPY --from=builder /app/.venv $APP_HOME/.venv

# Copy application code AND Alembic config/scripts
COPY ./alembic.ini $APP_HOME/alembic.ini
COPY ./scripts $APP_HOME/scripts
COPY ./app $APP_HOME/app

# Expose port
EXPOSE 8000

# Run the application (uvicorn should now be in the PATH)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]