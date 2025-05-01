"""Connector registry for the integration framework."""

import importlib
import inspect
import logging
import pkgutil
from typing import Dict, Any, Type, Optional

from app.integrations.base_connector import BaseConnector
from app.integrations.exceptions import UnsupportedIntegrationTypeError

logger = logging.getLogger(__name__)


class ConnectorRegistry:
    """
    Registry for connector classes.
    
    This class maintains a registry of available connector implementations
    and provides methods to discover, register, and instantiate connectors.
    """
    
    def __init__(self):
        """Initialize the connector registry."""
        self._connectors = {}
    
    def register_connector(self, integration_type: str, connector_class: Type[BaseConnector]) -> None:
        """
        Register a connector class for a specific integration type.
        
        Args:
            integration_type: Type of integration (e.g., "google_calendar")
            connector_class: Connector class to register
        """
        if not issubclass(connector_class, BaseConnector):
            raise TypeError(f"Connector class must inherit from BaseConnector: {connector_class}")
        
        logger.info(f"Registering connector for integration type: {integration_type}")
        self._connectors[integration_type] = connector_class
    
    def get_connector_class(self, integration_type: str) -> Type[BaseConnector]:
        """
        Get connector class for a specific integration type.
        
        Args:
            integration_type: Type of integration
            
        Returns:
            Connector class for the requested integration type
            
        Raises:
            UnsupportedIntegrationTypeError: If no connector is registered for the integration type
        """
        connector_class = self._connectors.get(integration_type)
        if not connector_class:
            raise UnsupportedIntegrationTypeError(f"No connector found for integration type: {integration_type}")
        
        return connector_class
    
    def create_connector(self, integration_type: str, config: Dict[str, Any], credentials: Dict[str, Any]) -> BaseConnector:
        """
        Create a connector instance for a specific integration type.
        
        Args:
            integration_type: Type of integration
            config: Configuration parameters for the connector
            credentials: Authentication credentials for the external system
            
        Returns:
            Connector instance
            
        Raises:
            UnsupportedIntegrationTypeError: If no connector is registered for the integration type
        """
        connector_class = self.get_connector_class(integration_type)
        return connector_class(config, credentials)
    
    def available_connectors(self) -> Dict[str, Type[BaseConnector]]:
        """
        Get a dictionary of all registered connectors.
        
        Returns:
            Dictionary mapping integration types to connector classes
        """
        return self._connectors.copy()
    
    def discover_connectors(self, package_path: str = "app.integrations.connectors") -> None:
        """
        Discover connector classes from a package.
        
        This method dynamically imports all modules in the specified package
        and registers any BaseConnector subclasses found in them.
        
        Args:
            package_path: Dot-separated path to the package containing connector modules
        """
        logger.info(f"Discovering connectors in package: {package_path}")
        try:
            package = importlib.import_module(package_path)
            for _, name, is_pkg in pkgutil.iter_modules(package.__path__, package.__name__ + "."):
                if not is_pkg:
                    try:
                        module = importlib.import_module(name)
                        for item_name, item in inspect.getmembers(module, inspect.isclass):
                            if (issubclass(item, BaseConnector) and 
                                item is not BaseConnector and
                                hasattr(item, "INTEGRATION_TYPE")):
                                integration_type = getattr(item, "INTEGRATION_TYPE")
                                self.register_connector(integration_type, item)
                    except Exception as e:
                        logger.error(f"Error loading connector module {name}: {e}")
        except ImportError as e:
            logger.warning(f"Could not import connector package {package_path}: {e}")
        except Exception as e:
            logger.error(f"Error discovering connectors: {e}")


# Singleton instance of the connector registry
connector_registry = ConnectorRegistry()