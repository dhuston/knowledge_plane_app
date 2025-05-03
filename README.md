# Biosphere Alpha (KnowledgePlane AI)

A multi-tenant SaaS platform that creates an adaptive organization fabric & living map to visualize the true emergent structure of how work gets done in organizations.

## Overview

Biosphere Alpha (KnowledgePlane AI) helps organizations get on the same page by enabling seamless collaboration, alignment, and adaptation. The platform creates a dynamic network view of people, teams, projects, goals, and knowledge flows rather than relying on static org charts.

### Core Features

- **Living Map Visualization:** Interactive network visualization of the organization's work fabric
- **Emergent Organizational Model:** Continuously builds and refines the underlying data model
- **Integration Framework:** Connects with existing tools to leverage data and workflows
- **Adaptive Intelligence:** Provides contextual insights based on organizational dynamics

## Architecture

- **Backend:** Python/FastAPI modular monolith with clear domain boundaries
- **Frontend:** React/TypeScript with Chakra UI components
- **Database:** PostgreSQL for structured data
- **Deployment:** Multi-tenant SaaS hosted on AWS
- **Authentication:** JWT-based with support for OAuth providers

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+
- Docker & Docker Compose (for local development)
- PostgreSQL 13+

### Backend Setup

To install the backend for development:

```bash
cd backend
# Add the current directory to PYTHONPATH
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Install dependencies with Poetry
poetry install

# Set up environment variables (copy .env.example to .env and edit)

# Run the application
poetry run uvicorn app.main:app --reload
```

This will enable imports like `from app.models.user import User` to work correctly in your backend Python code.

### Frontend Setup

The frontend is a React application using TypeScript and Vite.

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

- `/backend/` - FastAPI backend service
  - `/app/` - Application code
    - `/api/` - API routes and endpoints
    - `/core/` - Core functionality and configuration
    - `/crud/` - Database operations
    - `/db/` - Database session management
    - `/models/` - SQLAlchemy models
    - `/schemas/` - Pydantic schemas
    - `/services/` - Business logic services
    - `/integrations/` - External service integrations
- `/frontend/` - React/TypeScript frontend
  - `/src/components/` - UI components
  - `/src/hooks/` - Custom React hooks
  - `/src/context/` - React context providers
  - `/src/types/` - TypeScript type definitions
- `/docs/` - Documentation
  - `/adr/` - Architecture Decision Records
  - `/implementations/` - Implementation plans
  - `/epics/` - Epic specifications

## Code Style

### Python Import Structure

When importing modules in your Python code, follow this structure:

```python
# Import standard Python modules first
import os
import sys
from typing import List, Optional

# Import third-party modules
import fastapi
from sqlalchemy import Column, Integer, String
from pydantic import BaseModel

# Import local modules
from app.core import security
from app.models.user import User
from app.schemas.user import UserCreate
```

### Running Linting

To run linting and formatting:

```bash
# Run the formatting script
./scripts/format-and-lint.sh all check  # Check mode
./scripts/format-and-lint.sh all fix    # Fix mode
```

### Frontend Linting and Formatting

```bash
# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

## Testing

### Backend Tests

```bash
cd backend
poetry run python -m pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Docker Deployment

For Docker deployment:

```bash
# Build images
docker-compose build

# Run development environment
docker-compose -f docker-compose.dev.yml up

# Run production environment
docker-compose -f docker-compose.prod.yml up
```

## Contributing

1. Follow the established code style and naming conventions
2. Write tests for new functionality
3. Document your changes
4. Make sure all tests pass before submitting a PR

## License

Proprietary - All rights reserved