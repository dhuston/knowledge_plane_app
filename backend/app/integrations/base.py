"""
Base connector interface for the simplified integration framework.
"""

import abc
from typing import Any, AsyncGenerator, Dict, List, Optional
from datetime import datetime
from uuid import UUID


class BaseConnector(abc.ABC):
    """
    Base class for all integration connectors.
    
    A connector is responsible for:
    1. Connecting to an external system
    2. Authenticating with that system
    3. Fetching data from the system
    4. Processing basic conversion to system-agnostic format
    """
    
    # Class-level constants
    CONNECTOR_TYPE: str = "base"
    SUPPORTED_ENTITY_TYPES: List[str] = ["default"]
    
    def __init__(self, config: Dict[str, Any], credentials: Dict[str, Any]):
        """
        Initialize connector with configuration and credentials.
        
        Args:
            config: Configuration dictionary
            credentials: Authentication credentials
        """
        self.config = config or {}
        self.credentials = credentials or {}
        self.is_connected = False
    
    @abc.abstractmethod
    async def connect(self) -> bool:
        """
        Establish connection to the external system.
        
        Returns:
            True if connection successful, False otherwise
        """
        pass
    
    @abc.abstractmethod
    async def fetch_data(
        self, 
        entity_type: str,
        last_sync_time: Optional[datetime] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Fetch data from the external system.
        
        Args:
            entity_type: Type of entity to fetch
            last_sync_time: Optional timestamp for incremental sync
            
        Yields:
            Raw data dictionaries from the external system
        """
        pass
    
    async def process_entity(self, data: Dict[str, Any], entity_type: str) -> Dict[str, Any]:
        """
        Process entity data into a normalized format.
        
        Args:
            data: Raw data from external system
            entity_type: Type of entity
            
        Returns:
            Normalized entity data
        """
        # Default implementation just passes through the data
        return data
    
    async def disconnect(self) -> None:
        """Close connection to external system."""
        self.is_connected = False
    
    @classmethod
    def get_supported_entity_types(cls) -> List[str]:
        """
        Get list of entity types this connector supports.
        
        Returns:
            List of supported entity type names
        """
        return cls.SUPPORTED_ENTITY_TYPES


class BaseProcessor:
    """
    Base class for entity processors.
    
    A processor takes raw data from a connector and:
    1. Transforms it to match internal data models
    2. Stores it in the database or other storage
    3. Creates relationships between entities
    """
    
    def __init__(self, db_session: Any, tenant_id: UUID):
        """
        Initialize processor with database session and tenant ID.
        
        Args:
            db_session: Database session
            tenant_id: Current tenant ID
        """
        self.db = db_session
        self.tenant_id = tenant_id
    
    async def process_entity(self, data: Dict[str, Any], entity_type: str) -> Optional[Dict[str, Any]]:
        """
        Process an entity from raw data.
        
        Args:
            data: Raw entity data
            entity_type: Type of entity
            
        Returns:
            Processed entity data or None if entity should be skipped
        """
        # Default implementation just passes through the data
        return data