"""
Simplified integration framework for Biosphere Alpha.

This module provides functionality for connecting to external systems,
fetching data, and normalizing it to work with the platform.
"""

from .base import BaseConnector, BaseProcessor
from .manager import IntegrationManager
from .models import Integration, IntegrationCredential, IntegrationRun

__all__ = [
    "BaseConnector",
    "BaseProcessor",
    "IntegrationManager",
    "Integration",
    "IntegrationCredential",
    "IntegrationRun"
]