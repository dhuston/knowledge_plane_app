"""Processor registry for the integration framework."""

import logging
import importlib
import inspect
from typing import Dict, Any, Type, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.base_processor import BaseProcessor
from app.integrations.default_processor import DefaultProcessor
from app.integrations.exceptions import ProcessingError

# Import specialized processors
try:
    from app.integrations.processors.research_paper_processor import ResearchPaperProcessor
    from app.integrations.processors.calendar_processor import CalendarEventProcessor
except ImportError:
    # Fall back to default processor if specialized ones are not available
    pass

logger = logging.getLogger(__name__)


class ProcessorRegistry:
    """
    Registry for processor classes.
    
    This class maintains a registry of available processor implementations
    and provides methods to discover, register, and instantiate processors.
    """
    
    def __init__(self):
        """Initialize the processor registry."""
        self._processors = {}
        self._entity_processors = {}
        self._register_default_processors()
    
    def _register_default_processors(self):
        """Register the built-in processors."""
        # Register default processor
        self.register_processor("default", DefaultProcessor)
        
        # Register specialized processors if available
        if 'ResearchPaperProcessor' in globals():
            self.register_processor("research_paper", ResearchPaperProcessor)
            self.register_entity_processor("research_paper", "ResearchPaperProcessor")
        
        if 'CalendarEventProcessor' in globals():
            self.register_processor("calendar", CalendarEventProcessor)
            self.register_entity_processor("calendar_event", "CalendarEventProcessor")
    
    def register_processor(self, processor_type: str, processor_class: Type[BaseProcessor]) -> None:
        """
        Register a processor class for a specific type.
        
        Args:
            processor_type: Type of processor (e.g., "research_paper", "calendar")
            processor_class: Processor class to register
        """
        if not issubclass(processor_class, BaseProcessor):
            raise TypeError(f"Processor class must inherit from BaseProcessor: {processor_class}")
        
        logger.info(f"Registering processor for type: {processor_type}")
        self._processors[processor_type] = processor_class
    
    def register_entity_processor(self, entity_type: str, processor_type: str) -> None:
        """
        Register a processor type for a specific entity type.
        
        Args:
            entity_type: Type of entity (e.g., "research_paper", "calendar_event")
            processor_type: Type of processor to use for this entity type
        """
        logger.info(f"Registering processor type {processor_type} for entity type: {entity_type}")
        self._entity_processors[entity_type] = processor_type
    
    def get_processor_class(self, processor_type: str) -> Type[BaseProcessor]:
        """
        Get processor class for a specific processor type.
        
        Args:
            processor_type: Type of processor
            
        Returns:
            Processor class
            
        Raises:
            ProcessingError: If no processor is registered for the type
        """
        processor_class = self._processors.get(processor_type)
        if not processor_class:
            # Fall back to default processor
            logger.warning(f"No processor registered for type: {processor_type}. Using default processor.")
            processor_class = self._processors.get("default")
            
            if not processor_class:
                raise ProcessingError(f"No processor found for type: {processor_type}")
        
        return processor_class
    
    def get_processor_for_entity(self, entity_type: str, db: AsyncSession, tenant_id: UUID) -> BaseProcessor:
        """
        Get an appropriate processor instance for an entity type.
        
        Args:
            entity_type: Type of entity to process
            db: Database session
            tenant_id: Tenant ID
            
        Returns:
            Processor instance
        """
        # Get the registered processor type for this entity type
        processor_type = self._entity_processors.get(entity_type, "default")
        
        # Get the processor class
        processor_class = self.get_processor_class(processor_type)
        
        # Create and return an instance
        return processor_class(db=db, tenant_id=tenant_id)
    
    def get_processor_for_integration(self, integration_type: str, db: AsyncSession, tenant_id: UUID) -> BaseProcessor:
        """
        Get an appropriate processor instance for an integration type.
        
        Args:
            integration_type: Type of integration
            db: Database session
            tenant_id: Tenant ID
            
        Returns:
            Processor instance
        """
        # Map integration types to processor types
        integration_to_processor = {
            "pubmed": "research_paper",
            "google_calendar": "calendar",
            "microsoft_outlook": "calendar",
        }
        
        processor_type = integration_to_processor.get(integration_type, "default")
        processor_class = self.get_processor_class(processor_type)
        
        return processor_class(db=db, tenant_id=tenant_id)
    
    def available_processors(self) -> Dict[str, Type[BaseProcessor]]:
        """
        Get a dictionary of all registered processors.
        
        Returns:
            Dictionary mapping processor types to processor classes
        """
        return self._processors.copy()
    
    def discover_processors(self, package_path: str = "app.integrations.processors") -> None:
        """
        Discover processor classes from a package.
        
        This method dynamically imports all modules in the specified package
        and registers any BaseProcessor subclasses found in them.
        
        Args:
            package_path: Dot-separated path to the package containing processor modules
        """
        logger.info(f"Discovering processors in package: {package_path}")
        try:
            package = importlib.import_module(package_path)
            for _, name, is_pkg in pkgutil.iter_modules(package.__path__, package.__name__ + "."):
                if not is_pkg:
                    try:
                        module = importlib.import_module(name)
                        for item_name, item in inspect.getmembers(module, inspect.isclass):
                            if (issubclass(item, BaseProcessor) and 
                                item is not BaseProcessor and
                                hasattr(item, "PROCESSOR_TYPE")):
                                processor_type = getattr(item, "PROCESSOR_TYPE")
                                self.register_processor(processor_type, item)
                                
                                # Register entity types if provided
                                if hasattr(item, "ENTITY_TYPES"):
                                    entity_types = getattr(item, "ENTITY_TYPES")
                                    for entity_type in entity_types:
                                        self.register_entity_processor(entity_type, processor_type)
                    except Exception as e:
                        logger.error(f"Error loading processor module {name}: {e}")
        except ImportError as e:
            logger.warning(f"Could not import processor package {package_path}: {e}")
        except Exception as e:
            logger.error(f"Error discovering processors: {e}")


# Singleton instance of the processor registry
processor_registry = ProcessorRegistry()