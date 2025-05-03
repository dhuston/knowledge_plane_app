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
        lsb-release \
        python3-pip \
        procps \
    || echo "Warning: Could not install GDAL, will use pure Python spatial functionality" && \
    # Print diagnostic information
    echo "=== SYSTEM INFORMATION ===" && \
    lsb_release -a && \
    echo "=== INSTALLED SYSTEM PACKAGES ===" && \
    dpkg -l | grep -E 'libgeos|libproj|libgdal' && \
    echo "=== SYSTEM LIBRARY PATHS ===" && \
    ldconfig -p | grep -E 'libgeos|libproj|libgdal' && \
    # Explicitly install GeoAlchemy2
    /app/.venv/bin/pip install --no-cache-dir geoalchemy2 && \
    echo "=== INSTALLED PYTHON PACKAGES ===" && \
    /app/.venv/bin/pip list | grep -E 'geoalchemy|SQLAlchemy|shapely|GDAL' && \
    # Cleanup
    rm -rf /var/lib/apt/lists/*

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

# Create dependency check script
RUN echo '#!/usr/bin/env python3' > /app/check_deps.py && \
    echo 'import sys; print("Python:", sys.version)' >> /app/check_deps.py && \
    echo 'import importlib.util; print("GeoAlchemy2 available:", importlib.util.find_spec("geoalchemy2") is not None)' >> /app/check_deps.py && \
    echo 'import os; sys.path.append("/app/.venv/lib/python3.12/site-packages")' >> /app/check_deps.py && \
    echo 'try: import geoalchemy2; print("GeoAlchemy2 version:", getattr(geoalchemy2, "__version__", "unknown")); print("GeoAlchemy2 path:", geoalchemy2.__file__)' >> /app/check_deps.py && \
    echo 'except ImportError as e: print("GeoAlchemy2 import error:", e)' >> /app/check_deps.py && \
    echo 'try: import shapely; print("Shapely version:", shapely.__version__)' >> /app/check_deps.py && \
    echo 'except ImportError as e: print("Shapely import error:", e)' >> /app/check_deps.py && \
    chmod +x /app/check_deps.py

# Run dependency check and then start the application
CMD python3 /app/check_deps.py && uvicorn app.main:app --host 0.0.0.0 --port 8000