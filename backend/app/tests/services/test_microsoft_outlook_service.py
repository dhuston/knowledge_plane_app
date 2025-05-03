"""Tests for the Microsoft Outlook calendar service."""

import pytest
import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
import json
from typing import Dict, Any, Optional

from app.models.user import User
from app.services.microsoft_outlook_service import (
    refresh_microsoft_token, 
    get_microsoft_outlook_service,
    get_todays_calendar_events,
    get_calendar_events_range,
    MicrosoftTokenRefreshError
)


class MockResponse:
    """Mock for aiohttp ClientResponse"""
    def __init__(self, status: int, data: Dict[str, Any]):
        self.status = status
        self._data = data

    async def json(self):
        return self._data

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        return None

    async def __aenter__(self):
        return self


@pytest.fixture
def mock_user():
    """Create a mock user with Microsoft tokens."""
    return User(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        microsoft_access_token="mock-access-token",
        microsoft_refresh_token="mock-refresh-token",
        microsoft_token_expiry=datetime.now(timezone.utc) + timedelta(hours=1)
    )


@pytest.fixture
def expired_token_user():
    """Create a mock user with expired Microsoft token."""
    return User(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        microsoft_access_token="expired-token",
        microsoft_refresh_token="mock-refresh-token",
        microsoft_token_expiry=datetime.now(timezone.utc) - timedelta(hours=1)
    )


@pytest.fixture
def mock_client():
    """Create a mock aiohttp client session."""
    mock = AsyncMock()
    mock.closed = False
    return mock


@pytest.mark.asyncio
async def test_refresh_microsoft_token_success():
    """Test successful token refresh."""
    # Arrange
    user = User(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        microsoft_refresh_token="mock-refresh-token"
    )
    
    mock_token_response = {
        "access_token": "new-access-token",
        "expires_in": 3600
    }
    
    with patch("aiohttp.ClientSession.post") as mock_post:
        mock_post.return_value = MockResponse(200, mock_token_response)
        
        # Act
        new_token, expiry = await refresh_microsoft_token(user)
        
        # Assert
        assert new_token == "new-access-token"
        assert expiry is not None
        assert expiry > datetime.now(timezone.utc)
        mock_post.assert_called_once()


@pytest.mark.asyncio
async def test_refresh_microsoft_token_failure():
    """Test token refresh failure."""
    # Arrange
    user = User(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        microsoft_refresh_token="invalid-refresh-token"
    )
    
    mock_error_response = {
        "error": "invalid_grant",
        "error_description": "The refresh token is invalid"
    }
    
    with patch("aiohttp.ClientSession.post") as mock_post:
        mock_post.return_value = MockResponse(400, mock_error_response)
        
        # Act & Assert
        with pytest.raises(MicrosoftTokenRefreshError):
            await refresh_microsoft_token(user)


@pytest.mark.asyncio
async def test_refresh_microsoft_token_no_refresh_token():
    """Test token refresh with missing refresh token."""
    # Arrange
    user = User(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        microsoft_refresh_token=None
    )
    
    # Act & Assert
    with pytest.raises(MicrosoftTokenRefreshError) as excinfo:
        await refresh_microsoft_token(user)
    
    assert "No refresh token available" in str(excinfo.value)


@pytest.mark.asyncio
async def test_get_microsoft_outlook_service_with_valid_token(mock_user, mock_client):
    """Test getting service with valid token."""
    # Arrange
    mock_db = AsyncMock()
    
    with patch("aiohttp.ClientSession", return_value=mock_client) as mock_session:
        # Need to mock the get method specifically
        mock_client.get.return_value = MockResponse(200, {"displayName": "Test User"})
        
        # Act
        service = await get_microsoft_outlook_service(mock_user, mock_db)
        
        # Assert
        assert service is not None
        mock_session.assert_called_once()
        # Should not have tried to refresh the token
        mock_db.add.assert_not_called()
        mock_db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_get_microsoft_outlook_service_with_expired_token(expired_token_user, mock_client):
    """Test getting service with expired token that needs refresh."""
    # Arrange
    mock_db = AsyncMock()
    
    with patch("aiohttp.ClientSession", return_value=mock_client), \
         patch("app.services.microsoft_outlook_service.refresh_microsoft_token") as mock_refresh:
        
        mock_refresh.return_value = ("new-access-token", datetime.now(timezone.utc) + timedelta(hours=1))
        mock_client.get.return_value = MockResponse(200, {"displayName": "Test User"})
        
        # Act
        service = await get_microsoft_outlook_service(expired_token_user, mock_db)
        
        # Assert
        assert service is not None
        mock_refresh.assert_called_once_with(expired_token_user)
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_get_microsoft_outlook_service_failed_auth(mock_user, mock_client):
    """Test service creation with failed authentication."""
    # Arrange
    mock_db = AsyncMock()
    
    with patch("aiohttp.ClientSession", return_value=mock_client):
        # Mock a 401 error from the API
        mock_client.get.return_value = MockResponse(401, {
            "error": {
                "code": "InvalidAuthenticationToken",
                "message": "The access token is invalid."
            }
        })
        
        # Act
        service = await get_microsoft_outlook_service(mock_user, mock_db)
        
        # Assert
        assert service is None


@pytest.mark.asyncio
async def test_get_todays_calendar_events_success(mock_client):
    """Test successful retrieval of today's calendar events."""
    # Arrange
    today = datetime.now(timezone.utc)
    tomorrow = today + timedelta(days=1)
    
    events = [
        {
            "id": "event1",
            "subject": "Team Meeting",
            "start": {
                "dateTime": today.replace(hour=10, minute=0).isoformat(),
                "timeZone": "UTC"
            },
            "end": {
                "dateTime": today.replace(hour=11, minute=0).isoformat(),
                "timeZone": "UTC"
            },
            "location": {
                "displayName": "Conference Room"
            },
            "attendees": [
                {
                    "emailAddress": {
                        "name": "John Doe",
                        "address": "john@example.com"
                    },
                    "status": {
                        "response": "accepted"
                    }
                }
            ],
            "isOnlineMeeting": True,
            "onlineMeeting": {
                "joinUrl": "https://teams.microsoft.com/meeting/join/123"
            }
        }
    ]
    
    mock_response = {
        "value": events
    }
    
    with patch("app.services.microsoft_outlook_service._get_calendar_events") as mock_get_events:
        mock_get_events.return_value = mock_response["value"]
        
        # Act
        result = await get_todays_calendar_events(mock_client)
        
        # Assert
        assert len(result) == 1
        assert result[0]["id"] == "event1"
        assert result[0]["subject"] == "Team Meeting"
        assert "start" in result[0]
        assert "isOnlineMeeting" in result[0]
        assert result[0]["onlineMeeting"]["joinUrl"] == "https://teams.microsoft.com/meeting/join/123"
        mock_get_events.assert_called_once()


@pytest.mark.asyncio
async def test_get_todays_calendar_events_empty(mock_client):
    """Test retrieval of calendar events when there are none."""
    # Arrange
    with patch("app.services.microsoft_outlook_service._get_calendar_events") as mock_get_events:
        mock_get_events.return_value = []
        
        # Act
        result = await get_todays_calendar_events(mock_client)
        
        # Assert
        assert result == []


@pytest.mark.asyncio
async def test_get_calendar_events_range(mock_client):
    """Test retrieval of calendar events within a date range."""
    # Arrange
    start_date = datetime.now(timezone.utc)
    end_date = start_date + timedelta(days=7)
    
    with patch("app.services.microsoft_outlook_service._get_calendar_events") as mock_get_events:
        mock_get_events.return_value = [{"id": "event1"}, {"id": "event2"}]
        
        # Act
        result = await get_calendar_events_range(mock_client, start_date, end_date)
        
        # Assert
        assert len(result) == 2
        mock_get_events.assert_called_once_with(
            mock_client,
            start_date.isoformat(), 
            end_date.isoformat()
        )


@pytest.mark.asyncio
async def test_get_calendar_events_error_handling(mock_client):
    """Test error handling during calendar events retrieval."""
    # Arrange
    with patch("app.services.microsoft_outlook_service._get_calendar_events") as mock_get_events:
        mock_get_events.side_effect = Exception("API Error")
        
        # Act
        result = await get_todays_calendar_events(mock_client)
        
        # Assert
        assert result == []  # Should return empty list on error