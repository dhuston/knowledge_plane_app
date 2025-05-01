"""Google Calendar connector implementation."""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, AsyncIterator, Optional, List

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request as GoogleAuthRequest

from app.integrations.base_connector import BaseConnector
from app.integrations.exceptions import ConnectionError, AuthenticationError

logger = logging.getLogger(__name__)


class GoogleCalendarConnector(BaseConnector):
    """
    Connector for Google Calendar API.
    
    This connector provides access to Google Calendar events and other calendar data.
    
    Attributes:
        INTEGRATION_TYPE: The integration type identifier
        SUPPORTED_ENTITY_TYPES: The entity types supported by this connector
    """
    
    INTEGRATION_TYPE = "google_calendar"
    SUPPORTED_ENTITY_TYPES = ["calendar_event"]
    
    def __init__(self, config: Dict[str, Any], credentials: Dict[str, Any]):
        """
        Initialize the Google Calendar connector.
        
        Args:
            config: Configuration parameters including client_id and client_secret
            credentials: Authentication credentials including access_token and refresh_token
        """
        super().__init__(config, credentials)
        self.service = None
    
    async def _connect(self) -> bool:
        """
        Establish connection to Google Calendar API.
        
        Returns:
            True if connection was successful
            
        Raises:
            ConnectionError: If connection cannot be established
            AuthenticationError: If authentication fails
        """
        try:
            access_token = self.credentials.get("access_token")
            refresh_token = self.credentials.get("refresh_token")
            
            if not access_token and not refresh_token:
                raise AuthenticationError("No access token or refresh token provided")
            
            # If we have a refresh token but no access token (or it's expired),
            # try to refresh the token
            if refresh_token and (not access_token or self.credentials.get("token_expired", False)):
                client_id = self.config.get("client_id")
                client_secret = self.config.get("client_secret")
                
                if not client_id or not client_secret:
                    raise AuthenticationError("Client ID and secret are required for token refresh")
                
                # Create credentials for token refresh
                creds = Credentials(
                    token=None,
                    refresh_token=refresh_token,
                    client_id=client_id,
                    client_secret=client_secret,
                    token_uri="https://oauth2.googleapis.com/token"
                )
                
                # Refresh the token
                def refresh_token_sync():
                    creds.refresh(GoogleAuthRequest())
                    return creds.token, creds.expiry
                
                access_token, expiry = await asyncio.to_thread(refresh_token_sync)
                
                # Update credentials with new token
                self.credentials["access_token"] = access_token
                self.credentials["expiry"] = expiry.isoformat() if expiry else None
                self.credentials["token_expired"] = False
            
            # Create service object
            def build_service():
                creds = Credentials(token=self.credentials["access_token"])
                return build('calendar', 'v3', credentials=creds, cache_discovery=False)
            
            self.service = await asyncio.to_thread(build_service)
            return True
        
        except Exception as e:
            if "invalid_grant" in str(e).lower():
                raise AuthenticationError(f"Invalid or expired credentials: {e}")
            elif "invalid_client" in str(e).lower():
                raise AuthenticationError(f"Invalid client configuration: {e}")
            else:
                raise ConnectionError(f"Failed to connect to Google Calendar: {e}")
    
    async def _test_connection(self) -> Dict[str, Any]:
        """
        Test if the connection to Google Calendar is working.
        
        Returns:
            Dict containing status and message about the connection
        """
        if not self.service:
            try:
                await self._connect()
            except Exception as e:
                return {
                    "status": "error",
                    "message": str(e)
                }
        
        try:
            # Try to fetch calendar list to verify connection
            def list_calendars():
                return self.service.calendarList().list(maxResults=1).execute()
            
            result = await asyncio.to_thread(list_calendars)
            
            return {
                "status": "success",
                "message": f"Successfully connected to Google Calendar API",
                "details": {
                    "calendar_count": len(result.get('items', [])),
                    "kind": result.get('kind')
                }
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error testing Google Calendar connection: {e}"
            }
    
    async def _fetch_data(self, entity_type: str, last_sync: Optional[datetime] = None) -> AsyncIterator[Dict[str, Any]]:
        """
        Fetch calendar data from Google Calendar.
        
        Args:
            entity_type: Type of entity to fetch (must be "calendar_event")
            last_sync: Optional timestamp of last synchronization for incremental sync
            
        Returns:
            AsyncIterator yielding calendar events
            
        Raises:
            ConnectionError: If not connected or connection fails
        """
        if not self.service:
            await self._connect()
        
        if entity_type != "calendar_event":
            logger.warning(f"Unsupported entity type for Google Calendar: {entity_type}")
            return
        
        # Calculate time range for events
        if last_sync:
            time_min = last_sync.isoformat()
        else:
            # Default to fetching the last 30 days of events
            time_min = (datetime.now() - timedelta(days=30)).isoformat()
        
        # Fetch events for the next 30 days by default
        time_max = (datetime.now() + timedelta(days=30)).isoformat()
        
        try:
            # Get list of calendars
            def list_calendars():
                return self.service.calendarList().list().execute()
            
            calendars_result = await asyncio.to_thread(list_calendars)
            calendars = calendars_result.get('items', [])
            
            for calendar in calendars:
                calendar_id = calendar.get('id')
                calendar_summary = calendar.get('summary', 'Unknown Calendar')
                
                # Use pagination to fetch all events
                page_token = None
                while True:
                    try:
                        def list_events():
                            return self.service.events().list(
                                calendarId=calendar_id,
                                timeMin=time_min,
                                timeMax=time_max,
                                maxResults=100,
                                singleEvents=True,
                                orderBy='startTime',
                                pageToken=page_token
                            ).execute()
                        
                        events_result = await asyncio.to_thread(list_events)
                        
                        events = events_result.get('items', [])
                        
                        for event in events:
                            yield {
                                "id": event.get('id'),
                                "calendar_id": calendar_id,
                                "calendar_name": calendar_summary,
                                "summary": event.get('summary', 'No Title'),
                                "description": event.get('description'),
                                "start": event.get('start'),
                                "end": event.get('end'),
                                "attendees": event.get('attendees', []),
                                "location": event.get('location'),
                                "organizer": event.get('organizer'),
                                "recurrence": event.get('recurrence'),
                                "status": event.get('status'),
                                "source": "google_calendar",
                                "raw_data": event
                            }
                        
                        page_token = events_result.get('nextPageToken')
                        if not page_token:
                            break
                    
                    except Exception as e:
                        logger.error(f"Error fetching events for calendar {calendar_id}: {e}")
                        # Continue to next calendar on error
                        break
        
        except Exception as e:
            logger.error(f"Error fetching calendar data: {e}")
            raise ConnectionError(f"Error fetching calendar data: {e}")