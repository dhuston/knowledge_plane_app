"""Tests for the briefing service with support for multiple calendar providers."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch, ANY
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from app.services.briefing_service import BriefingService
from app.models.user import User


@pytest.fixture
def mock_user_google():
    """Create a mock user with Google calendar tokens."""
    return User(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        google_access_token="google-token",
        google_refresh_token="google-refresh-token",
        google_token_expiry=datetime.now(timezone.utc) + timedelta(hours=1)
    )


@pytest.fixture
def mock_user_microsoft():
    """Create a mock user with Microsoft calendar tokens."""
    return User(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        microsoft_access_token="microsoft-token",
        microsoft_refresh_token="microsoft-refresh-token",
        microsoft_token_expiry=datetime.now(timezone.utc) + timedelta(hours=1)
    )


@pytest.fixture
def mock_user_both_providers():
    """Create a mock user with both calendar providers."""
    return User(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        google_access_token="google-token",
        google_refresh_token="google-refresh-token",
        google_token_expiry=datetime.now(timezone.utc) + timedelta(hours=1),
        microsoft_access_token="microsoft-token",
        microsoft_refresh_token="microsoft-refresh-token",
        microsoft_token_expiry=datetime.now(timezone.utc) + timedelta(hours=1)
    )


@pytest.fixture
def mock_user_no_provider():
    """Create a mock user with no calendar provider."""
    return User(
        id=uuid4(),
        email="test@example.com",
        name="Test User"
    )


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    return AsyncMock()


@pytest.fixture
def mock_llm_service():
    """Create a mock LLM service."""
    mock = AsyncMock()
    mock.generate_summary = AsyncMock(return_value="Daily briefing summary.")
    return mock


@pytest.fixture
def mock_entity_recognition_service():
    """Create a mock entity recognition service."""
    mock = AsyncMock()
    mock.process_text = AsyncMock(return_value=[{"type": "text", "content": "Daily briefing summary."}])
    return mock


@pytest.mark.asyncio
async def test_get_available_calendar_sources_google_only(mock_user_google):
    """Test detecting Google calendar as the only available source."""
    # Arrange
    service = BriefingService()
    
    # Act
    sources = await service._get_available_calendar_sources(mock_user_google)
    
    # Assert
    assert sources == ["google"]


@pytest.mark.asyncio
async def test_get_available_calendar_sources_microsoft_only(mock_user_microsoft):
    """Test detecting Microsoft calendar as the only available source."""
    # Arrange
    service = BriefingService()
    
    # Act
    sources = await service._get_available_calendar_sources(mock_user_microsoft)
    
    # Assert
    assert sources == ["microsoft"]


@pytest.mark.asyncio
async def test_get_available_calendar_sources_both(mock_user_both_providers):
    """Test detecting both calendar providers available."""
    # Arrange
    service = BriefingService()
    
    # Act
    sources = await service._get_available_calendar_sources(mock_user_both_providers)
    
    # Assert
    assert set(sources) == set(["google", "microsoft"])
    # Google should be the default primary source (first in list)
    assert sources[0] == "google"


@pytest.mark.asyncio
async def test_get_available_calendar_sources_none(mock_user_no_provider):
    """Test when no calendar providers are available."""
    # Arrange
    service = BriefingService()
    
    # Act
    sources = await service._get_available_calendar_sources(mock_user_no_provider)
    
    # Assert
    assert sources == []


@pytest.mark.asyncio
async def test_get_calendar_summary_google(mock_user_google, mock_db):
    """Test getting calendar summary from Google."""
    # Arrange
    service = BriefingService()
    mock_events = [
        {
            "summary": "Google Meeting",
            "start": {"dateTime": "2023-01-01T09:00:00Z"},
            "end": {"dateTime": "2023-01-01T10:00:00Z"}
        }
    ]
    
    with patch('app.services.google_calendar.get_google_calendar_service', return_value=AsyncMock()) as mock_get_service:
        with patch('app.services.google_calendar.get_todays_calendar_events', return_value=mock_events):
            # Act
            summary = await service._get_calendar_summary(mock_user_google)
            
            # Assert
            assert summary is not None
            assert "Google Meeting" in summary
            mock_get_service.assert_called_once()


@pytest.mark.asyncio
async def test_get_calendar_summary_microsoft(mock_user_microsoft, mock_db):
    """Test getting calendar summary from Microsoft."""
    # Arrange
    service = BriefingService()
    mock_events = [
        {
            "subject": "Microsoft Teams Meeting",
            "start": {"dateTime": "2023-01-01T14:00:00Z"},
            "end": {"dateTime": "2023-01-01T15:00:00Z"}
        }
    ]
    
    with patch('app.services.microsoft_outlook_service.get_microsoft_outlook_service', return_value=AsyncMock()) as mock_get_service:
        with patch('app.services.microsoft_outlook_service.get_todays_calendar_events', return_value=mock_events):
            # Act
            summary = await service._get_calendar_summary(mock_user_microsoft)
            
            # Assert
            assert summary is not None
            assert "Microsoft Teams Meeting" in summary
            mock_get_service.assert_called_once()


@pytest.mark.asyncio
async def test_get_calendar_summary_preferred_source(mock_user_both_providers, mock_db):
    """Test using the preferred calendar source when both are available."""
    # Arrange
    service = BriefingService()
    
    # Create mock return values for both providers
    ms_mock_events = [{"subject": "Microsoft Meeting"}]
    google_mock_events = [{"summary": "Google Meeting"}]
    
    # Setup mocks with different implementations
    with patch('app.services.microsoft_outlook_service.get_microsoft_outlook_service') as mock_ms_service, \
         patch('app.services.microsoft_outlook_service.get_todays_calendar_events') as mock_ms_events, \
         patch('app.services.google_calendar.get_google_calendar_service') as mock_google_service, \
         patch('app.services.google_calendar.get_todays_calendar_events') as mock_google_events:
        
        mock_ms_service.return_value = AsyncMock()
        mock_ms_events.return_value = ms_mock_events
        mock_google_service.return_value = AsyncMock()
        mock_google_events.return_value = google_mock_events
            
        # Act - use Microsoft as preferred source
        ms_summary = await service._get_calendar_summary(mock_user_both_providers, preferred_source="microsoft")
        
        # Act - use Google as preferred source
        google_summary = await service._get_calendar_summary(mock_user_both_providers, preferred_source="google")
        
        # Assert
        assert ms_summary is not None
        assert "Microsoft Meeting" in ms_summary
        assert google_summary is not None
        assert "Google Meeting" in google_summary


@pytest.mark.asyncio
async def test_get_calendar_summary_fallback(mock_user_both_providers, mock_db):
    """Test fallback to secondary provider when primary fails."""
    # Arrange
    service = BriefingService()
    google_mock_events = [{"summary": "Google Meeting"}]
    
    # Setup mocks - Microsoft fails, Google succeeds
    with patch('app.services.microsoft_outlook_service.get_microsoft_outlook_service', return_value=None), \
         patch('app.services.google_calendar.get_google_calendar_service', return_value=AsyncMock()) as mock_google_service, \
         patch('app.services.google_calendar.get_todays_calendar_events') as mock_google_events:
        
        mock_google_events.return_value = google_mock_events
            
        # Act - prefer Microsoft but it should fall back to Google
        summary = await service._get_calendar_summary(mock_user_both_providers, preferred_source="microsoft")
        
        # Assert - should have Google data
        assert summary is not None
        assert "Google Meeting" in summary
        mock_google_service.assert_called_once()


@pytest.mark.asyncio
async def test_get_daily_briefing_with_calendar_data(mock_user_both_providers, mock_db):
    """Test the complete daily briefing with calendar data."""
    # Arrange
    service = BriefingService()
    
    # Mock calendar and activity data
    with patch.object(service, '_get_calendar_summary', return_value="Meeting at 10 AM with Team"), \
         patch.object(service, '_get_activity_summary', return_value="Updated Project Doc"), \
         patch('app.services.llm_service.llm_service.generate_summary', return_value="You have a team meeting at 10 AM today."), \
         patch('app.services.entity_recognition_service.entity_recognition_service.process_text', 
               return_value=[{"type": "text", "content": "You have a team meeting at 10 AM today."}]):
        
        # Act
        summary, highlighted = await service.get_daily_briefing(mock_db, mock_user_both_providers)
        
        # Assert
        assert summary == "You have a team meeting at 10 AM today."
        assert len(highlighted) > 0
        assert highlighted[0]["content"] == "You have a team meeting at 10 AM today."