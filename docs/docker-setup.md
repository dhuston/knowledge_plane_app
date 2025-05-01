# Docker Setup for KnowledgePlane AI

This document provides information about the Docker configuration for KnowledgePlane AI, including instructions for development and production deployments.

## Docker Files Structure

- `Dockerfile` - Root Dockerfile for containerizing the entire application
- `backend/Dockerfile` - Backend-specific Dockerfile for the FastAPI service
- `docker-compose.yml` - Default Docker Compose configuration
- `docker-compose.dev.yml` - Development-specific Docker Compose configuration
- `docker-compose.prod.yml` - Production-specific Docker Compose configuration
- `.dockerignore` - Specifies files and directories to be excluded from Docker builds

## Development Setup

For local development, use the development configuration:

```bash
# Copy the example environment file and customize it
cp backend/.env.example backend/.env

# Start the development environment
docker compose -f docker-compose.dev.yml up

# Rebuild images if needed
docker compose -f docker-compose.dev.yml build
```

The development setup includes:
- Hot-reloading for both frontend and backend
- Exposed ports for direct access
- Volume mounts for live code editing
- Debug mode enabled

## Production Setup

For production deployment:

```bash
# Create and customize the production environment file
cp backend/.env.example backend/.env
# Edit with production values and ensure proper secrets

# Start the production environment
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

The production setup includes:
- Optimized builds without development dependencies
- Proper restart policies
- Resource limits
- No exposed database ports
- No volume mounts for application code (all baked into images)

## Environment Variables

The application uses environment variables for configuration. See `.env.example` files in respective directories for required variables.

Key environment variables:
- `POSTGRES_USER` - Database username
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DB` - Database name
- `SECRET_KEY` - Application secret key
- `ENVIRONMENT` - Application environment (development/production)
- `DEBUG` - Enable debug mode

## Container Structure

The application consists of the following containers:

1. **Backend** - FastAPI server providing the REST API
   - Uses Python 3.12
   - Runs as non-root user for security
   - Configurable via environment variables

2. **Frontend** - React application serving the user interface
   - Development: Direct React development server
   - Production: Optimized build served by Nginx

3. **Database** - PostgreSQL database
   - Uses persistent volume for data storage
   - Configurable via environment variables

## Security Considerations

- All containers run as non-root users
- No default passwords in production
- Database is not exposed in production
- Environment variables used for sensitive configuration

## Troubleshooting

**Database Connection Issues**
- Check if the database container is healthy: `docker compose ps`
- Verify environment variables are correctly set
- Check logs: `docker compose logs db`

**Backend Startup Issues**
- View backend logs: `docker compose logs backend`
- Check if database migrations have run successfully
- Verify environment variables are correctly set

**Frontend Connectivity Issues**
- Check if backend is accessible
- Verify API URL configuration