# Biosphere Alpha

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

## Environment Setup

The project now uses a consolidated environment variable approach:

1. Copy `.env.example` to `.env` in the project root
2. Customize variables as needed

For Docker Compose development, only the root `.env` file is required as variables are passed to containers.

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Docker & Docker Compose (for local development)
- PostgreSQL 15+

### Running with Docker Compose

```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up backend
```

### Backend Setup

To run the backend locally for development:

```bash
cd backend
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .

# Run the application
uvicorn app.main:app --reload
```

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

## Testing

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

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

## License

Proprietary - All rights reserved
