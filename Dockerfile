# Multi-stage build: Builder stage
FROM python:3.12.2-alpine AS builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache \
    build-base \
    gcc \
    musl-dev

# Copy and install requirements first (for better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.12.2-alpine

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV APP_HOME=/app

WORKDIR ${APP_HOME}

# Install runtime dependencies
RUN apk add --no-cache \
    postgresql-dev \
    ca-certificates \
    && update-ca-certificates

# Copy installed packages from builder stage
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . ${APP_HOME}

# Expose port
EXPOSE 8000

# Create a non-root user
RUN adduser -D -u 5678 appuser && \
    chown -R appuser:appuser ${APP_HOME}

# Switch to non-root user
USER appuser

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "-k", "uvicorn.workers.UvicornWorker", "backend.app.main:app"]