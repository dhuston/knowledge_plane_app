"""Base connector interface for external system integrations."""

import asyncio
import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, Any, AsyncIterator, Optional, List

from app.integrations.exceptions import ConnectionError, AuthenticationError

logger = logging.getLogger(__name__)


class BaseConnector(ABC):
    """
    Base abstract class for all integration connectors.
    
    This class defines the interface that all connectors must implement
    to integrate with external systems. It provides common functionality
    like connection management, retry logic, and error handling.
    
    Attributes:
        retry_attempts (int): Number of connection retry attempts
        retry_delay (float): Delay in seconds between retry attempts
        timeout (float): Timeout in seconds for connection attempts
    """
    
    def __init__(self, config: Dict[str, Any], credentials: Dict[str, Any]):
        """
        Initialize the connector with configuration and credentials.
        
        Args:
            config: Configuration parameters for the connector
            credentials: Authentication credentials for the external system
        """
        self.config = config or {}
        self.credentials = credentials or {}
        self.retry_attempts = self.config.get("retry_attempts", 3)
        self.retry_delay = self.config.get("retry_delay", 1.0)
        self.timeout = self.config.get("timeout", 30.0)
    
    async def connect(self) -> bool:
        """
        Establish connection to the external system with retry logic.
        
        Returns:
            bool: True if connection was successful
            
        Raises:
            ConnectionError: If connection cannot be established
            AuthenticationError: If authentication fails
        """
        attempt = 0
        last_error = None
        
        while attempt < self.retry_attempts:
            try:
                logger.debug(f"Connection attempt {attempt + 1} of {self.retry_attempts}")
                
                # Wrap connection with timeout
                try:
                    async with asyncio.timeout(self.timeout):
                        return await self._connect()
                except asyncio.TimeoutError:
                    raise ConnectionError(f"Connection timeout after {self.timeout} seconds")
                
            except AuthenticationError as auth_err:
                # Don't retry authentication failures
                logger.error(f"Authentication error: {auth_err}")
                raise
            except Exception as e:
                attempt += 1
                last_error = e
                logger.warning(f"Connection attempt {attempt} failed: {e}")
                
                if attempt < self.retry_attempts:
                    await asyncio.sleep(self.retry_delay)
        
        # All retry attempts failed
        logger.error(f"Connection failed after {self.retry_attempts} attempts. Last error: {last_error}")
        raise ConnectionError(f"Connection failed after {self.retry_attempts} attempts: {last_error}")
    
    async def test_connection(self) -> Dict[str, Any]:
        """
        Test if the connection to the external system is working.
        
        Returns:
            Dict containing status and message about the connection
        """
        try:
            return await self._test_connection()
        except Exception as e:
            logger.error(f"Test connection failed: {e}")
            return {
                "status": "error",
                "message": f"Connection test failed: {str(e)}"
            }
    
    async def fetch_data(self, entity_type: str, last_sync: Optional[datetime] = None) -> AsyncIterator[Dict[str, Any]]:
        """
        Fetch data from the external system.
        
        Args:
            entity_type: Type of entity to fetch (e.g., "user", "project")
            last_sync: Optional timestamp of last synchronization for incremental sync
            
        Returns:
            AsyncIterator yielding data items from the external system
            
        Raises:
            ConnectionError: If not connected or connection fails
        """
        try:
            async for item in self._fetch_data(entity_type, last_sync):
                yield item
        except Exception as e:
            logger.error(f"Error fetching data: {e}")
            raise ConnectionError(f"Error fetching data: {e}")
    
    @abstractmethod
    async def _connect(self) -> bool:
        """
        Implementation-specific connection logic.
        
        Returns:
            bool: True if connection was successful
            
        Raises:
            ConnectionError: If connection cannot be established
            AuthenticationError: If authentication fails
        """
        pass
    
    @abstractmethod
    async def _test_connection(self) -> Dict[str, Any]:
        """
        Implementation-specific connection test logic.
        
        Returns:
            Dict containing status and message about the connection
        """
        pass
    
    @abstractmethod
    async def _fetch_data(self, entity_type: str, last_sync: Optional[datetime] = None) -> AsyncIterator[Dict[str, Any]]:
        """
        Implementation-specific data fetching logic.
        
        Args:
            entity_type: Type of entity to fetch (e.g., "user", "project")
            last_sync: Optional timestamp of last synchronization for incremental sync
            
        Returns:
            AsyncIterator yielding data items from the external system
        """
        pass