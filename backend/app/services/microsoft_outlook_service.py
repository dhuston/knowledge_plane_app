"""Microsoft Outlook calendar service for fetching calendar events."""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Tuple, Union

# Using httpx instead of aiohttp for better compatibility
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user import User

# Configure logger for this module
logger = logging.getLogger(__name__)

# Microsoft Graph API endpoints
MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
MICROSOFT_GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0"


class MicrosoftTokenRefreshError(Exception):
    """Exception raised when token refresh fails."""
    pass


async def refresh_microsoft_token(user: User) -> Tuple[str, datetime]:
    """
    Refresh Microsoft access token using the stored refresh token.
    
    Args:
        user: User model with Microsoft refresh token
        
    Returns:
        Tuple of (new_access_token, expiry_datetime)
        
    Raises:
        MicrosoftTokenRefreshError: If the token refresh fails
    """
    if not user.microsoft_refresh_token:
        logger.error(f"No Microsoft refresh token available for user {user.id}")
        raise MicrosoftTokenRefreshError("No refresh token available for user")
    
    logger.info(f"Refreshing Microsoft token for user {user.id}")
    
    try:
        # Prepare the token refresh request
        refresh_data = {
            "client_id": settings.MICROSOFT_CLIENT_ID,
            "client_secret": settings.MICROSOFT_CLIENT_SECRET,
            "refresh_token": user.microsoft_refresh_token,
            "grant_type": "refresh_token",
            "scope": "https://graph.microsoft.com/.default"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                MICROSOFT_TOKEN_URL, 
                data=refresh_data,
                timeout=30.0  # Set a reasonable timeout
            )
            
            if response.status_code != 200:
                error_data = response.json()
                logger.error(f"Microsoft token refresh failed for user {user.id}: {error_data}")
                raise MicrosoftTokenRefreshError(f"Microsoft API error: {error_data}")
            
            token_data = response.json()
            
            # Extract the new token and expiry time
            new_token = token_data.get("access_token")
            expires_in = token_data.get("expires_in", 3600)  # Default to 1 hour
            expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            
            logger.info(f"Successfully refreshed Microsoft token for user {user.id}, expires at {expiry}")
            return new_token, expiry
    
    except Exception as e:
        logger.exception(f"Unexpected error refreshing Microsoft token for user {user.id}: {e}")
        raise MicrosoftTokenRefreshError(f"Unexpected error during refresh: {e}") from e


async def get_microsoft_outlook_service(user: User, db: AsyncSession = None) -> Optional[aiohttp.ClientSession]:
    """
    Create a Microsoft Graph API client session with authenticated headers.
    
    Args:
        user: User model with Microsoft tokens
        db: Optional database session for updating tokens
        
    Returns:
        Authenticated aiohttp.ClientSession or None if authentication fails
    """
    logger.info(f"Creating Microsoft Outlook service for user {user.id}")
    
    # Check if we need to refresh the token
    needs_refresh = (
        not user.microsoft_access_token or
        (user.microsoft_token_expiry and user.microsoft_token_expiry < datetime.now(timezone.utc))
    )
    
    if needs_refresh:
        logger.info(f"Microsoft access token missing or expired for user {user.id}")
        try:
            new_token, expiry = await refresh_microsoft_token(user)
            
            # Update user with new token
            user.microsoft_access_token = new_token
            user.microsoft_token_expiry = expiry
            
            # Persist changes if DB session provided
            if db:
                db.add(user)
                await db.commit()
                await db.refresh(user)
                logger.info(f"Updated Microsoft tokens in DB for user {user.id}")
        
        except MicrosoftTokenRefreshError as e:
            logger.error(f"Failed to refresh Microsoft token: {e}")
            return None
    
    # Check if we have a valid token now
    if not user.microsoft_access_token:
        logger.error(f"No valid Microsoft access token for user {user.id}")
        return None
    
    # Create authenticated client session
    client = aiohttp.ClientSession(headers={
        "Authorization": f"Bearer {user.microsoft_access_token}",
        "Content-Type": "application/json"
    })
    
    # Test that the token works
    try:
        async with client.get(f"{MICROSOFT_GRAPH_BASE_URL}/me") as response:
            if response.status != 200:
                error_text = await response.text()
                logger.error(f"Microsoft authentication failed: {response.status} - {error_text}")
                await client.close()
                return None
            
            me_data = await response.json()
            logger.info(f"Successfully authenticated as {me_data.get('displayName')} ({me_data.get('userPrincipalName')})")
    
    except Exception as e:
        logger.exception(f"Error testing Microsoft API connection: {e}")
        await client.close()
        return None
    
    return client


async def _get_calendar_events(
    client: aiohttp.ClientSession,
    start_time: str = None,
    end_time: str = None
) -> List[Dict[str, Any]]:
    """
    Internal function to fetch calendar events from Microsoft Graph API.
    
    Args:
        client: Authenticated client session
        start_time: ISO format start time string
        end_time: ISO format end time string
        
    Returns:
        List of calendar events
    """
    try:
        # Build query parameters
        query_params = []
        if start_time and end_time:
            query_params.append(f"startDateTime={start_time}")
            query_params.append(f"endDateTime={end_time}")
        
        # Add select fields to reduce response size
        select_fields = [
            "id", "subject", "bodyPreview", "importance", "start", "end", 
            "location", "isOnlineMeeting", "onlineMeeting", "organizer", 
            "attendees"
        ]
        query_params.append(f"$select={','.join(select_fields)}")
        
        # Order by start time
        query_params.append("$orderby=start/dateTime")
        
        # Build URL with query parameters
        url = f"{MICROSOFT_GRAPH_BASE_URL}/me/calendarView"
        if query_params:
            url += "?" + "&".join(query_params)
        
        logger.debug(f"Fetching calendar events from: {url}")
        
        # Fetch events
        async with client.get(url) as response:
            if response.status != 200:
                logger.error(f"Failed to get calendar events: {response.status}")
                return []
            
            data = await response.json()
            events = data.get("value", [])
            logger.info(f"Retrieved {len(events)} calendar events")
            return events
    
    except Exception as e:
        logger.exception(f"Error fetching calendar events: {e}")
        return []


async def get_todays_calendar_events(client: aiohttp.ClientSession) -> List[Dict[str, Any]]:
    """
    Get today's calendar events for the authenticated user.
    
    Args:
        client: Authenticated client session
        
    Returns:
        List of calendar events for today
    """
    try:
        # Calculate today's date range
        today = datetime.now(timezone.utc)
        start_of_day = today.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = today.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Get events for today
        events = await _get_calendar_events(
            client=client,
            start_time=start_of_day.isoformat(),
            end_time=end_of_day.isoformat()
        )
        
        return events
    
    except Exception as e:
        logger.exception(f"Error getting today's calendar events: {e}")
        return []


async def get_calendar_events_range(
    client: aiohttp.ClientSession,
    start_date: datetime,
    end_date: datetime
) -> List[Dict[str, Any]]:
    """
    Get calendar events within a specific date range.
    
    Args:
        client: Authenticated client session
        start_date: Start date and time
        end_date: End date and time
        
    Returns:
        List of calendar events in the specified range
    """
    try:
        # Get events for the specified range
        events = await _get_calendar_events(
            client=client,
            start_time=start_date.isoformat(),
            end_time=end_date.isoformat()
        )
        
        return events
    
    except Exception as e:
        logger.exception(f"Error getting calendar events for date range: {e}")
        return []