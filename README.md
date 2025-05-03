# Biosphere Alpha

## Developer Setup

### Backend

To install the backend for development:

```bash
cd backend
# Add the current directory to PYTHONPATH
export PYTHONPATH=$PYTHONPATH:$(pwd)
```

This will enable imports like `from app.models.user import User` to work correctly in your backend Python code.

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

## Frontend

The frontend is a React application using TypeScript and Vite.

### Development Server

```bash
cd frontend
npm install
npm run dev
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```