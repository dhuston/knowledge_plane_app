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
    dpkg -l | grep -E 'libgeos|libproj|libgdal' || echo "No spatial libraries found" && \
    echo "=== SYSTEM LIBRARY PATHS ===" && \
    ldconfig -p | grep -E 'libgeos|libproj|libgdal' || echo "No spatial libraries in path" && \
    # Cleanup
    rm -rf /var/lib/apt/lists/*

# Copy virtual env from builder stage
COPY --from=builder /app/.venv $APP_HOME/.venv

# Install geoalchemy2 explicitly in our venv now that it's available
RUN $APP_HOME/.venv/bin/pip install --no-cache-dir geoalchemy2 shapely && \
    echo "=== INSTALLED PYTHON PACKAGES ===" && \
    $APP_HOME/.venv/bin/pip list | grep -E 'geoalchemy|SQLAlchemy|shapely|GDAL' || echo "No spatial Python packages found"

# Copy application code AND Alembic config/scripts
COPY ./alembic.ini $APP_HOME/alembic.ini
COPY ./scripts $APP_HOME/scripts
COPY ./app $APP_HOME/app

# Create a more reliable dependency check script
COPY <<'EOF' /app/check_deps.py
#!/usr/bin/env python3
import sys
import os
import site
import importlib.util
import subprocess

# Add the venv site-packages to path to make sure we find the right packages
venv_paths = ["/app/.venv/lib/python3.12/site-packages", 
             "/app/.venv/lib/site-packages"]

for path in venv_paths:
    if os.path.exists(path) and path not in sys.path:
        sys.path.insert(0, path)
        print(f"Added path: {path}")

# Print Python version and environment
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")
print(f"sys.path: {sys.path}")

# Check critical packages
packages = ["geoalchemy2", "sqlalchemy", "shapely", "alembic"]
for pkg in packages:
    spec = importlib.util.find_spec(pkg)
    if spec:
        try:
            module = importlib.import_module(pkg)
            version = getattr(module, "__version__", "unknown")
            location = getattr(module, "__file__", "unknown")
            print(f"✓ {pkg}: version={version}, location={location}")
        except Exception as e:
            print(f"✗ Error importing {pkg}: {str(e)}")
    else:
        print(f"✗ {pkg} not found in sys.path")

# Check system libraries
try:
    print("\nSystem libraries:")
    subprocess.run(["ldconfig", "-p"], check=False)
except Exception as e:
    print(f"Error checking system libraries: {str(e)}")

# Try importing GeoAlchemy2 components
print("\nGeoAlchemy2 components:")
try:
    import geoalchemy2
    from geoalchemy2 import Geometry
    print("✓ Successfully imported GeoAlchemy2 Geometry")
except Exception as e:
    print(f"✗ Failed to import GeoAlchemy2 Geometry: {str(e)}")
EOF

# Set execute permission on the script
RUN chmod +x /app/check_deps.py

# Create a non-root user
RUN adduser --uid 5678 --disabled-password --gecos "" appuser && \
    chown -R appuser:appuser $APP_HOME

# Expose port
EXPOSE 8000

# Switch to non-root user
USER appuser

# Run dependency check and then start the application
CMD /app/.venv/bin/python /app/check_deps.py && \
    /app/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000