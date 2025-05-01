"""
Integration Framework for KnowledgePlane.

This package provides a flexible framework for integrating with external systems
to fetch and synchronize data with the KnowledgePlane platform.
"""

from app.integrations.base_connector import BaseConnector
from app.integrations.base_processor import BaseProcessor
from app.integrations.manager import IntegrationManager
from app.integrations.exceptions import (
    IntegrationError,
    ConnectionError,
    AuthenticationError,
    ProcessingError,
    IntegrationNotFoundError
)

__all__ = [
    "BaseConnector",
    "BaseProcessor",
    "IntegrationManager",
    "IntegrationError",
    "ConnectionError",
    "AuthenticationError",
    "ProcessingError",
    "IntegrationNotFoundError"
]