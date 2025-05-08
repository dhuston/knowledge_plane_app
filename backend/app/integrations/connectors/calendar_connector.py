"""
Unified calendar connector for both Google Calendar and Microsoft Outlook.
"""

import abc
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional, Type
from datetime import datetime, timedelta
import json

from app.integrations.base import BaseConnector

logger = logging.getLogger(__name__)


class BaseCalendarConnector(BaseConnector):
    """Base class for all calendar-based connectors."""
    
    CONNECTOR_TYPE = "calendar"
    SUPPORTED_ENTITY_TYPES = ["event", "calendar", "meeting"]
    
    def __init__(self, config: Dict[str, Any], credentials: Dict[str, Any]):
        super().__init__(config, credentials)
        self.user_email = config.get("user_email")
        self.sync_window_days = config.get("sync_window_days", 30)  # Default 30 days
    
    async def process_entity(self, data: Dict[str, Any], entity_type: str) -> Dict[str, Any]:
        """Process a calendar entity into a standardized format."""
        if entity_type == "event":
            return {
                "id": data.get("id"),
                "title": data.get("summary", data.get("subject", "Untitled Event")),
                "description": data.get("description", data.get("body", "")),
                "start_time": data.get("start", {}).get("dateTime", data.get("start", {}).get("date")),
                "end_time": data.get("end", {}).get("dateTime", data.get("end", {}).get("date")),
                "location": data.get("location", ""),
                "attendees": [
                    {"email": a.get("email", a.get("emailAddress", {}).get("address")),
                     "name": a.get("displayName", a.get("emailAddress", {}).get("name", "")),
                     "response_status": a.get("responseStatus", a.get("status", {}).get("response", "none"))}
                    for a in data.get("attendees", [])
                ],
                "organizer": data.get("organizer", {}).get("email", 
                             data.get("organizer", {}).get("emailAddress", {}).get("address", "")),
                "is_all_day": data.get("start", {}).get("date") is not None,
                "recurrence": data.get("recurrence", []),
                "status": data.get("status", "confirmed"),
                "created": data.get("created"),
                "updated": data.get("updated"),
                "source": self.CONNECTOR_TYPE,
                "raw_data": json.dumps(data)  # Store original data for reference
            }
        return data


class GoogleCalendarConnector(BaseCalendarConnector):
    """Google Calendar specific implementation."""
    
    CONNECTOR_TYPE = "google_calendar"
    
    async def connect(self) -> bool:
        """Connect to Google Calendar API."""
        try:
            # Here we would implement actual Google OAuth connection
            # For now, just log and return success
            logger.info(f"Connecting to Google Calendar for {self.user_email}")
            self.is_connected = True
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Google Calendar: {e}")
            self.is_connected = False
            return False
    
    async def fetch_data(
        self, 
        entity_type: str,
        last_sync_time: Optional[datetime] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Fetch calendar data from Google Calendar."""
        if not self.is_connected:
            await self.connect()
        
        if entity_type != "event":
            logger.warning(f"Unsupported entity type for Google Calendar: {entity_type}")
            return
        
        # Calculate time window for sync
        now = datetime.now()
        time_min = last_sync_time or (now - timedelta(days=self.sync_window_days))
        time_max = now + timedelta(days=self.sync_window_days)
        
        # This would be an actual API call to Google Calendar
        # For this example, we'll just yield some mock data
        
        # Sample mock data representing the structure from Google Calendar API
        mock_events = [
            {
                "id": "event123",
                "summary": "Weekly Team Meeting",
                "description": "Regular sync-up with the team",
                "start": {"dateTime": "2025-05-10T10:00:00", "timeZone": "UTC"},
                "end": {"dateTime": "2025-05-10T11:00:00", "timeZone": "UTC"},
                "location": "Conference Room A",
                "attendees": [
                    {"email": "teammate1@example.com", "displayName": "Teammate 1", "responseStatus": "accepted"},
                    {"email": "teammate2@example.com", "displayName": "Teammate 2", "responseStatus": "tentative"}
                ],
                "organizer": {"email": "manager@example.com", "displayName": "Manager"},
                "created": "2025-05-01T09:00:00Z",
                "updated": "2025-05-01T09:30:00Z",
                "status": "confirmed"
            }
        ]
        
        for event in mock_events:
            yield event
            
        logger.info(f"Fetched {len(mock_events)} events from Google Calendar")


class MicrosoftOutlookConnector(BaseCalendarConnector):
    """Microsoft Outlook Calendar specific implementation."""
    
    CONNECTOR_TYPE = "microsoft_outlook"
    
    async def connect(self) -> bool:
        """Connect to Microsoft Graph API."""
        try:
            # Here we would implement actual Microsoft OAuth connection
            # For now, just log and return success
            logger.info(f"Connecting to Microsoft Outlook Calendar for {self.user_email}")
            self.is_connected = True
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Microsoft Outlook: {e}")
            self.is_connected = False
            return False
    
    async def fetch_data(
        self, 
        entity_type: str,
        last_sync_time: Optional[datetime] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Fetch calendar data from Microsoft Outlook."""
        if not self.is_connected:
            await self.connect()
        
        if entity_type != "event":
            logger.warning(f"Unsupported entity type for Microsoft Outlook: {entity_type}")
            return
        
        # Calculate time window for sync
        now = datetime.now()
        time_min = last_sync_time or (now - timedelta(days=self.sync_window_days))
        time_max = now + timedelta(days=self.sync_window_days)
        
        # This would be an actual API call to Microsoft Graph API
        # For this example, we'll just yield some mock data
        
        # Sample mock data representing the structure from Microsoft Graph API
        mock_events = [
            {
                "id": "AAMkAGVmMDEzMTM4LTZmYWUtNDdkNC1hMDZiLTU1OGY5OTZhYmY4OABGAAAAAAAiQ8W967B7TKBjgx9rVEURBwAiIsqMbYjsT5e-T7KzowPTAAAAAAENAAAiIsqMbYjsT5e-T7KzowPTAAAYbvZyAAA=",
                "subject": "Product Strategy Meeting",
                "body": {"contentType": "text", "content": "Discuss Q3 product roadmap"},
                "start": {"dateTime": "2025-05-15T14:00:00", "timeZone": "UTC"},
                "end": {"dateTime": "2025-05-15T15:30:00", "timeZone": "UTC"},
                "location": {"displayName": "Executive Briefing Center"},
                "attendees": [
                    {
                        "emailAddress": {"address": "product@example.com", "name": "Product Team"},
                        "status": {"response": "accepted"}
                    },
                    {
                        "emailAddress": {"address": "engineering@example.com", "name": "Engineering Team"},
                        "status": {"response": "tentative"}
                    }
                ],
                "organizer": {"emailAddress": {"address": "cpo@example.com", "name": "Chief Product Officer"}},
                "created": "2025-05-05T10:00:00Z",
                "lastModifiedDateTime": "2025-05-05T10:30:00Z"
            }
        ]
        
        for event in mock_events:
            yield event
            
        logger.info(f"Fetched {len(mock_events)} events from Microsoft Outlook")


def get_calendar_connector(provider: str, config: Dict[str, Any], credentials: Dict[str, Any]) -> BaseCalendarConnector:
    """
    Factory function to get the appropriate calendar connector.
    
    Args:
        provider: Provider name ('google_calendar' or 'microsoft_outlook')
        config: Configuration dictionary
        credentials: Authentication credentials
        
    Returns:
        Initialized connector instance
    """
    connector_classes: Dict[str, Type[BaseCalendarConnector]] = {
        "google_calendar": GoogleCalendarConnector,
        "microsoft_outlook": MicrosoftOutlookConnector,
    }
    
    connector_class = connector_classes.get(provider.lower())
    if not connector_class:
        raise ValueError(f"Unsupported calendar provider: {provider}")
    
    return connector_class(config, credentials)