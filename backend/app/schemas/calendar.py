"""Schemas for calendar events."""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum


class CalendarEventType(str, Enum):
    """Types of calendar events."""
    DEFAULT = "default"
    MEETING = "meeting"
    APPOINTMENT = "appointment"
    OUT_OF_OFFICE = "out_of_office"
    TASK = "task"
    REMINDER = "reminder"
    OTHER = "other"


class CalendarEvent(BaseModel):
    """
    Schema for a calendar event returned by the API.
    
    This schema is used to normalize events from different providers (Google Calendar, Microsoft Outlook)
    into a consistent format for the frontend.
    """
    id: str
    title: str
    startTime: str
    endTime: str
    location: str = ""
    attendees: List[str] = []
    summary: str = ""
    description: str = ""
    isAllDay: bool = False
    isOnlineMeeting: bool = False
    onlineMeetingUrl: Optional[str] = None
    organizerName: Optional[str] = None
    organizerEmail: Optional[str] = None
    source: str = "default"  # Source of the calendar event (google, microsoft, etc.)
    eventType: CalendarEventType = CalendarEventType.DEFAULT
    
    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "id": "event123",
                "title": "Weekly Team Meeting",
                "startTime": "09:30",
                "endTime": "10:30",
                "location": "Conference Room A",
                "attendees": ["John Doe", "Jane Smith", "Bob Johnson"],
                "summary": "Weekly team meeting to discuss project progress and roadmap.",
                "isAllDay": False,
                "isOnlineMeeting": True,
                "onlineMeetingUrl": "https://teams.microsoft.com/meeting/123",
                "organizerName": "Jane Smith",
                "organizerEmail": "jane.smith@example.com",
                "source": "microsoft",
                "eventType": "meeting"
            }
        }


class CalendarSourceStatus(BaseModel):
    """Status of a calendar source connection."""
    connected: bool
    authenticated: bool
    errorMessage: Optional[str] = None
    lastSyncTime: Optional[datetime] = None