import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from typing import Dict, Any, AsyncIterator, Optional

from app.integrations.base_connector import BaseConnector
from app.integrations.exceptions import ConnectionError, AuthenticationError

class MockConnector(BaseConnector):
    """Mock connector for testing the BaseConnector abstract class."""
    
    def __init__(self, config: Dict[str, Any], credentials: Dict[str, Any]):
        super().__init__(config, credentials)
        self.connected = False
        self.mock_data = []
    
    async def _connect(self) -> bool:
        """Mock implementation of connect method."""
        if self.config.get("fail_connection", False):
            raise ConnectionError("Connection failed")
        if self.credentials.get("invalid", False):
            raise AuthenticationError("Invalid credentials")
        self.connected = True
        return True
    
    async def _test_connection(self) -> Dict[str, Any]:
        """Mock implementation of test_connection method."""
        if not self.connected:
            return {
                "status": "error",
                "message": "Not connected"
            }
        return {
            "status": "success",
            "message": "Connection successful"
        }
    
    async def _fetch_data(self, entity_type: str, last_sync: Optional[datetime] = None) -> AsyncIterator[Dict[str, Any]]:
        """Mock implementation of fetch_data method."""
        if not self.connected:
            raise ConnectionError("Not connected")
        
        for item in self.mock_data:
            if item["entity_type"] == entity_type:
                yield item["data"]


@pytest.fixture
def valid_config():
    return {
        "url": "https://api.example.com",
        "timeout": 30
    }


@pytest.fixture
def valid_credentials():
    return {
        "api_key": "test_api_key",
        "username": "test_user"
    }


@pytest.mark.asyncio
async def test_connect_success(valid_config, valid_credentials):
    """Test successful connection."""
    connector = MockConnector(valid_config, valid_credentials)
    result = await connector.connect()
    
    assert result is True
    assert connector.connected is True


@pytest.mark.asyncio
async def test_connect_failure(valid_credentials):
    """Test failed connection."""
    config = {"fail_connection": True}
    connector = MockConnector(config, valid_credentials)
    
    with pytest.raises(ConnectionError) as excinfo:
        await connector.connect()
    
    assert "Connection failed" in str(excinfo.value)
    assert connector.connected is False


@pytest.mark.asyncio
async def test_connect_auth_error(valid_config):
    """Test authentication error during connection."""
    credentials = {"invalid": True}
    connector = MockConnector(valid_config, credentials)
    
    with pytest.raises(AuthenticationError) as excinfo:
        await connector.connect()
    
    assert "Invalid credentials" in str(excinfo.value)
    assert connector.connected is False


@pytest.mark.asyncio
async def test_test_connection(valid_config, valid_credentials):
    """Test the test_connection method."""
    connector = MockConnector(valid_config, valid_credentials)
    
    # Not connected yet
    result = await connector.test_connection()
    assert result["status"] == "error"
    
    # After successful connection
    await connector.connect()
    result = await connector.test_connection()
    assert result["status"] == "success"
    assert result["message"] == "Connection successful"


@pytest.mark.asyncio
async def test_fetch_data(valid_config, valid_credentials):
    """Test fetching data."""
    connector = MockConnector(valid_config, valid_credentials)
    connector.mock_data = [
        {"entity_type": "user", "data": {"id": 1, "name": "User 1"}},
        {"entity_type": "user", "data": {"id": 2, "name": "User 2"}},
        {"entity_type": "project", "data": {"id": 1, "name": "Project 1"}}
    ]
    
    await connector.connect()
    results = []
    async for item in connector.fetch_data("user"):
        results.append(item)
    
    assert len(results) == 2
    assert results[0]["id"] == 1
    assert results[1]["name"] == "User 2"


@pytest.mark.asyncio
async def test_fetch_data_not_connected(valid_config, valid_credentials):
    """Test fetching data when not connected."""
    connector = MockConnector(valid_config, valid_credentials)
    
    with pytest.raises(ConnectionError):
        async for _ in connector.fetch_data("user"):
            pass


@pytest.mark.asyncio
async def test_retry_policy(valid_config, valid_credentials):
    """Test the retry policy for connect method."""
    connector = MockConnector(valid_config, valid_credentials)
    
    # Mock the _connect method to fail twice then succeed
    original_connect = connector._connect
    connect_mock = AsyncMock(side_effect=[
        ConnectionError("Temporary failure"),
        ConnectionError("Temporary failure"),
        True
    ])
    connector._connect = connect_mock
    
    # Configure retry policy
    connector.retry_attempts = 3
    connector.retry_delay = 0.1
    
    result = await connector.connect()
    
    assert result is True
    assert connect_mock.call_count == 3
    
    # Restore original method
    connector._connect = original_connect


@pytest.mark.asyncio
async def test_connection_timeout(valid_config, valid_credentials):
    """Test connection timeout."""
    connector = MockConnector(valid_config, valid_credentials)
    
    # Mock _connect to simulate timeout
    async def delayed_connect():
        await asyncio.sleep(0.5)
        return True
    
    connector._connect = delayed_connect
    connector.timeout = 0.1
    
    with pytest.raises(ConnectionError) as excinfo:
        await connector.connect()
    
    assert "Connection timeout" in str(excinfo.value)