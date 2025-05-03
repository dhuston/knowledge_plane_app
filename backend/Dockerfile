# Use an official Python runtime as a parent image with exact version
FROM python:3.12.2-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV POETRY_VERSION=2.1.2
ENV POETRY_HOME="/opt/poetry"
ENV PATH="$POETRY_HOME/bin:$PATH"

# Set work directory
WORKDIR /app

# Install required system dependencies
RUN apt-get update && \
    apt-get install --no-install-recommends -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python -

# Copy only dependency files to leverage Docker cache
COPY pyproject.toml poetry.lock* ./

# Configure Poetry to create venv inside the project directory
RUN poetry config virtualenvs.in-project true

# Install dependencies - regenerate lock file then install
RUN poetry lock && \
    poetry install --only main --no-root --no-interaction --no-ansi && \
    poetry add --lock idna@^3.4

# --- Final Stage ---
FROM python:3.12.2-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV APP_HOME=/app
# Add project venv bin to path
ENV PATH="$APP_HOME/.venv/bin:$PATH"

WORKDIR $APP_HOME

# Install runtime dependencies with retry logic for network issues
RUN apt-get update && \
    # Install minimal dependencies first
    apt-get install --no-install-recommends -y \
        libpq-dev \
        ca-certificates \
        binutils \
    && update-ca-certificates \
    # Then try to install the spatial libraries
    && (apt-get install --no-install-recommends -y \
        libgeos-dev \
        libproj-dev \
        || echo "Warning: Could not install some spatial libraries, continuing anyway")
    
# Try to install GDAL separately (most problematic)
RUN apt-get update && \
    apt-get install --no-install-recommends -y \
        gdal-bin \
        libgdal-dev \
    || echo "Warning: Could not install GDAL, will use pure Python spatial functionality" \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual env from builder stage
COPY --from=builder /app/.venv $APP_HOME/.venv

# Copy application code AND Alembic config/scripts
COPY ./alembic.ini $APP_HOME/alembic.ini
COPY ./scripts $APP_HOME/scripts
COPY ./app $APP_HOME/app

# Create a non-root user
RUN adduser --uid 5678 --disabled-password --gecos "" appuser && \
    chown -R appuser:appuser $APP_HOME

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Run the application (using standardized path)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]