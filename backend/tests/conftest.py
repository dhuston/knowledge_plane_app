import pytest
import sys
import os
from unittest.mock import MagicMock

# Add the backend directory to the path so imports work
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))

@pytest.fixture
def mock_db():
    """Provides a mock database session."""
    return MagicMock()

@pytest.fixture
def mock_tenant_id():
    """Provides a mock tenant ID."""
    return 1