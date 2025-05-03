"""Tests for the calendar API endpoints."""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch, MagicMock
from uuid import UUID, uuid4

from fastapi import status
from httpx import AsyncClient

from app.core.config import settings
from app.tests.utils.utils import get_token_headers


@pytest.fixture
def mock_google_events():
    """Return mock Google Calendar events."""
    return [
        {
            "id": "event1",
            "summary": "Team Meeting",
            "start": {"dateTime": "2023-07-14T09:00:00Z"},
            "end": {"dateTime": "2023-07-14T10:00:00Z"},
            "location": "Conference Room A",
            "attendees": [
                {"email": "user1@example.com", "displayName": "User One"},
                {"email": "user2@example.com", "displayName": "User Two"}
            ]
        },
        {
            "id": "event2",
            "summary": "Project Review",
            "start": {"dateTime": "2023-07-14T14:00:00Z"},
            "end": {"dateTime": "2023-07-14T15:30:00Z"},
            "location": "Virtual",
            "attendees": [
                {"email": "manager@example.com", "displayName": "Manager"}
            ]
        }
    ]


@pytest.fixture
def mock_microsoft_events():
    """Return mock Microsoft Outlook events."""
    return [
        {
            "id": "event3",
            "subject": "Teams Call",
            "start": {"dateTime": "2023-07-14T11:00:00Z"},
            "end": {"dateTime": "2023-07-14T12:00:00Z"},
            "location": {"displayName": "Microsoft Teams"},
            "attendees": [
                {
                    "emailAddress": {"address": "user3@example.com", "name": "User Three"},
                    "status": {"response": "accepted"}
                }
            ],
            "isOnlineMeeting": True,
            "onlineMeeting": {
                "joinUrl": "https://teams.microsoft.com/meeting/join/123"
            }
        }
    ]


@pytest.mark.asyncio
async def test_get_today_events_google(client: AsyncClient, mock_google_events):
    """Test getting today's events from Google Calendar."""
    # Arrange
    user_id = uuid4()
    
    with patch("app.api.deps.get_current_user") as mock_get_user, \
         patch("app.services.google_calendar.get_google_calendar_service") as mock_get_service, \
         patch("app.services.google_calendar.get_todays_calendar_events") as mock_get_events:
        
        # Setup mocks
        mock_user = MagicMock()
        mock_user.id = user_id
        mock_user.google_access_token = "google-token"
        mock_user.google_refresh_token = "google-refresh"
        mock_user.microsoft_access_token = None
        mock_user.microsoft_refresh_token = None
        
        mock_get_user.return_value = mock_user
        mock_get_service.return_value = AsyncMock()
        mock_get_events.return_value = mock_google_events
        
        # Act
        response = await client.get(
            f"{settings.API_V1_STR}/calendar/events/today",
            headers=get_token_headers()
        )
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        
        events = response.json()
        assert len(events) == 2
        assert events[0]["title"] == "Team Meeting"
        assert events[0]["startTime"] == "09:00"
        assert "location" in events[0]
        assert len(events[0]["attendees"]) == 2
        assert events[0]["source"] == "google"


@pytest.mark.asyncio
async def test_get_today_events_microsoft(client: AsyncClient, mock_microsoft_events):
    """Test getting today's events from Microsoft Outlook."""
    # Arrange
    user_id = uuid4()
    
    with patch("app.api.deps.get_current_user") as mock_get_user, \
         patch("app.services.microsoft_outlook_service.get_microsoft_outlook_service") as mock_get_service, \
         patch("app.services.microsoft_outlook_service.get_todays_calendar_events") as mock_get_events:
        
        # Setup mocks
        mock_user = MagicMock()
        mock_user.id = user_id
        mock_user.google_access_token = None
        mock_user.google_refresh_token = None
        mock_user.microsoft_access_token = "ms-token"
        mock_user.microsoft_refresh_token = "ms-refresh"
        
        mock_get_user.return_value = mock_user
        mock_get_service.return_value = AsyncMock()
        mock_get_events.return_value = mock_microsoft_events
        
        # Act
        response = await client.get(
            f"{settings.API_V1_STR}/calendar/events/today",
            headers=get_token_headers()
        )
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        
        events = response.json()
        assert len(events) == 1
        assert events[0]["title"] == "Teams Call"
        assert "isOnlineMeeting" in events[0]
        assert events[0]["isOnlineMeeting"] is True
        assert "onlineMeetingUrl" in events[0]
        assert events[0]["source"] == "microsoft"


@pytest.mark.asyncio
async def test_get_today_events_preferred_source(client: AsyncClient, mock_google_events, mock_microsoft_events):
    """Test getting today's events with preferred source parameter."""
    # Arrange
    user_id = uuid4()
    
    with patch("app.api.deps.get_current_user") as mock_get_user, \
         patch("app.services.google_calendar.get_google_calendar_service") as mock_get_google_service, \
         patch("app.services.google_calendar.get_todays_calendar_events") as mock_get_google_events, \
         patch("app.services.microsoft_outlook_service.get_microsoft_outlook_service") as mock_get_ms_service, \
         patch("app.services.microsoft_outlook_service.get_todays_calendar_events") as mock_get_ms_events:
        
        # Setup mocks
        mock_user = MagicMock()
        mock_user.id = user_id
        mock_user.google_access_token = "google-token"
        mock_user.google_refresh_token = "google-refresh"
        mock_user.microsoft_access_token = "ms-token"
        mock_user.microsoft_refresh_token = "ms-refresh"
        
        mock_get_user.return_value = mock_user
        
        mock_get_google_service.return_value = AsyncMock()
        mock_get_google_events.return_value = mock_google_events
        
        mock_get_ms_service.return_value = AsyncMock()
        mock_get_ms_events.return_value = mock_microsoft_events
        
        # Act - Request Microsoft explicitly
        response = await client.get(
            f"{settings.API_V1_STR}/calendar/events/today?source=microsoft",
            headers=get_token_headers()
        )
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        events = response.json()
        assert len(events) == 1
        assert events[0]["title"] == "Teams Call"
        assert events[0]["source"] == "microsoft"
        
        # Act - Request Google explicitly
        response = await client.get(
            f"{settings.API_V1_STR}/calendar/events/today?source=google",
            headers=get_token_headers()
        )
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        events = response.json()
        assert len(events) == 2
        assert events[0]["title"] == "Team Meeting"
        assert events[0]["source"] == "google"


@pytest.mark.asyncio
async def test_get_events_range(client: AsyncClient, mock_google_events):
    """Test getting events for a specific date range."""
    # Arrange
    user_id = uuid4()
    start_date = "2023-07-14"
    end_date = "2023-07-16"
    
    with patch("app.api.deps.get_current_user") as mock_get_user, \
         patch("app.services.google_calendar.get_google_calendar_service") as mock_get_service, \
         patch("app.services.google_calendar.get_calendar_events_range") as mock_get_events:
        
        # Setup mocks
        mock_user = MagicMock()
        mock_user.id = user_id
        mock_user.google_access_token = "google-token"
        mock_user.google_refresh_token = "google-refresh"
        
        mock_get_user.return_value = mock_user
        mock_get_service.return_value = AsyncMock()
        mock_get_events.return_value = mock_google_events
        
        # Act
        response = await client.get(
            f"{settings.API_V1_STR}/calendar/events/range?start_date={start_date}&end_date={end_date}",
            headers=get_token_headers()
        )
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        
        events = response.json()
        assert len(events) == 2
        assert mock_get_events.called
        assert start_date in mock_get_events.call_args[0][1].isoformat()
        assert end_date in mock_get_events.call_args[0][2].isoformat()


@pytest.mark.asyncio
async def test_get_events_no_calendar_source(client: AsyncClient):
    """Test getting events when user has no calendar source configured."""
    # Arrange
    user_id = uuid4()
    
    with patch("app.api.deps.get_current_user") as mock_get_user:
        # Setup mocks
        mock_user = MagicMock()
        mock_user.id = user_id
        mock_user.google_access_token = None
        mock_user.google_refresh_token = None
        mock_user.microsoft_access_token = None
        mock_user.microsoft_refresh_token = None
        
        mock_get_user.return_value = mock_user
        
        # Act
        response = await client.get(
            f"{settings.API_V1_STR}/calendar/events/today",
            headers=get_token_headers()
        )
        
        # Assert
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "detail" in data
        assert "No calendar provider" in data["detail"]


@pytest.mark.asyncio
async def test_get_events_authentication_required(client: AsyncClient):
    """Test authentication is required to access calendar endpoints."""
    # Act - Request without token
    response = await client.get(f"{settings.API_V1_STR}/calendar/events/today")
    
    # Assert
    assert response.status_code == status.HTTP_401_UNAUTHORIZED