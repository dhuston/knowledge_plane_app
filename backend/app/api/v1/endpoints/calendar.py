"""API endpoints for calendar data."""

from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_active_user
from app.models.user import User
from app.schemas.calendar import CalendarEvent
from app.services.google_calendar import get_google_calendar_service, get_todays_calendar_events as get_google_todays_events
from app.services.microsoft_outlook_service import get_microsoft_outlook_service, get_todays_calendar_events as get_microsoft_todays_events
from app.services.microsoft_outlook_service import get_calendar_events_range as get_microsoft_events_range
from app.services.briefing_service import BriefingService

router = APIRouter()


async def _get_available_calendar_sources(user: User) -> List[str]:
    """
    Determine which calendar sources are available for the user.
    
    Args:
        user: User model with potential calendar tokens
        
    Returns:
        List of available sources in order of preference
    """
    sources = []
    
    # Check for Google Calendar credentials
    if user.google_access_token and user.google_refresh_token:
        sources.append("google")
        
    # Check for Microsoft Outlook credentials
    if user.microsoft_access_token and user.microsoft_refresh_token:
        sources.append("microsoft")
    
    return sources


async def _normalize_google_event(event: Dict[str, Any]) -> CalendarEvent:
    """Normalize a Google Calendar event to our schema."""
    # Extract start and end times
    start_time_str = event.get('start', {}).get('dateTime', event.get('start', {}).get('date'))
    end_time_str = event.get('end', {}).get('dateTime', event.get('end', {}).get('date'))
    
    # Format times for display
    start_time = "All-day"
    end_time = "All-day"
    if 'dateTime' in event.get('start', {}):
        start_dt = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
        start_time = start_dt.strftime('%H:%M')
    if 'dateTime' in event.get('end', {}):
        end_dt = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
        end_time = end_dt.strftime('%H:%M')
    
    # Extract attendees
    attendees = []
    for attendee in event.get('attendees', []):
        name = attendee.get('displayName', attendee.get('email', ''))
        if name:
            attendees.append(name)
    
    # Extract other details
    return CalendarEvent(
        id=event.get('id', ''),
        title=event.get('summary', '(No Title)'),
        startTime=start_time,
        endTime=end_time,
        location=event.get('location', ''),
        attendees=attendees,
        isAllDay='date' in event.get('start', {}),
        isOnlineMeeting=False,  # Google doesn't have this flag explicitly
        onlineMeetingUrl=event.get('hangoutLink', None),
        description=event.get('description', ''),
        summary=event.get('description', '')[:100] if event.get('description') else '',
        source="google"
    )


async def _normalize_microsoft_event(event: Dict[str, Any]) -> CalendarEvent:
    """Normalize a Microsoft Outlook event to our schema."""
    # Extract start and end times
    start_time_str = event.get('start', {}).get('dateTime')
    end_time_str = event.get('end', {}).get('dateTime')
    
    # Format times for display
    start_time = "All-day"
    end_time = "All-day"
    if start_time_str:
        start_dt = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
        start_time = start_dt.strftime('%H:%M')
    if end_time_str:
        end_dt = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
        end_time = end_dt.strftime('%H:%M')
    
    # Extract attendees
    attendees = []
    for attendee in event.get('attendees', []):
        email_address = attendee.get('emailAddress', {})
        name = email_address.get('name', email_address.get('address', ''))
        if name:
            attendees.append(name)
    
    # Extract location
    location = event.get('location', {}).get('displayName', '')
    
    # Check for online meeting
    is_online = event.get('isOnlineMeeting', False)
    online_url = event.get('onlineMeeting', {}).get('joinUrl', None)
    
    return CalendarEvent(
        id=event.get('id', ''),
        title=event.get('subject', '(No Title)'),
        startTime=start_time,
        endTime=end_time,
        location=location,
        attendees=attendees,
        isAllDay=False,  # Microsoft events use dateTime with specific time for all-day events
        isOnlineMeeting=is_online,
        onlineMeetingUrl=online_url,
        description=event.get('bodyPreview', ''),
        summary=event.get('bodyPreview', '')[:100] if event.get('bodyPreview') else '',
        source="microsoft"
    )


@router.get("/events/today", response_model=List[CalendarEvent])
async def get_today_events(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
    source: Optional[str] = Query(None, description="Preferred calendar source (google or microsoft)")
):
    """
    Get today's calendar events.
    
    Returns events from the specified source if available, or from any available source.
    """
    # Determine available calendar sources
    available_sources = await _get_available_calendar_sources(current_user)
    
    if not available_sources:
        raise HTTPException(
            status_code=400, 
            detail="No calendar provider configured. Please connect to Google Calendar or Microsoft Outlook."
        )
    
    # If source is specified, check if it's available
    if source and source not in available_sources:
        raise HTTPException(
            status_code=400, 
            detail=f"Calendar source '{source}' not available for this user. Available sources: {', '.join(available_sources)}"
        )
    
    # If source is specified and available, use that first
    if source and source in available_sources:
        # Move preferred source to the front
        available_sources = [s for s in available_sources if s != source]
        available_sources.insert(0, source)
    
    # Try sources in order until one succeeds
    events = []
    for source in available_sources:
        try:
            if source == "google":
                # Try Google Calendar
                service = await get_google_calendar_service(user=current_user, db=db)
                if service:
                    google_events = await get_google_todays_events(service=service)
                    if google_events:
                        for event in google_events:
                            events.append(await _normalize_google_event(event))
                        break  # Success, no need to try other sources
            
            elif source == "microsoft":
                # Try Microsoft Outlook
                service = await get_microsoft_outlook_service(user=current_user, db=db)
                if service:
                    ms_events = await get_microsoft_todays_events(service)
                    if ms_events:
                        for event in ms_events:
                            events.append(await _normalize_microsoft_event(event))
                        break  # Success, no need to try other sources
        
        except Exception as e:
            # Log error but continue with next source
            print(f"Error fetching calendar events from {source}: {e}")
            continue
    
    # Sort by start time
    events.sort(key=lambda x: x.startTime if x.startTime != "All-day" else "00:00")
    
    return events


@router.get("/events/range", response_model=List[CalendarEvent])
async def get_events_range(
    start_date: str,
    end_date: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
    source: Optional[str] = Query(None, description="Preferred calendar source (google or microsoft)")
):
    """
    Get calendar events within a date range.
    
    Args:
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
        source: Optional preferred calendar source
    
    Returns:
        List of calendar events in the specified date range
    """
    # Validate date format
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        end = end.replace(hour=23, minute=59, second=59)  # End of day
    except ValueError:
        raise HTTPException(
            status_code=400, 
            detail="Invalid date format. Please use YYYY-MM-DD."
        )
    
    # Determine available calendar sources
    available_sources = await _get_available_calendar_sources(current_user)
    
    if not available_sources:
        raise HTTPException(
            status_code=400, 
            detail="No calendar provider configured. Please connect to Google Calendar or Microsoft Outlook."
        )
    
    # If source is specified, check if it's available
    if source and source not in available_sources:
        raise HTTPException(
            status_code=400, 
            detail=f"Calendar source '{source}' not available for this user. Available sources: {', '.join(available_sources)}"
        )
    
    # If source is specified and available, use that first
    if source and source in available_sources:
        # Move preferred source to the front
        available_sources = [s for s in available_sources if s != source]
        available_sources.insert(0, source)
    
    # Try sources in order until one succeeds
    events = []
    for source in available_sources:
        try:
            if source == "google":
                # Currently Google API doesn't have a separate range method implemented
                # We would add this functionality in the google_calendar.py service
                # For now, just get today's events
                service = await get_google_calendar_service(user=current_user, db=db)
                if service:
                    # This would be replaced with a proper date range function
                    google_events = await get_google_todays_events(service=service)
                    if google_events:
                        for event in google_events:
                            events.append(await _normalize_google_event(event))
                        break  # Success, no need to try other sources
            
            elif source == "microsoft":
                # Microsoft has a proper date range function
                service = await get_microsoft_outlook_service(user=current_user, db=db)
                if service:
                    ms_events = await get_microsoft_events_range(service, start, end)
                    if ms_events:
                        for event in ms_events:
                            events.append(await _normalize_microsoft_event(event))
                        break  # Success, no need to try other sources
        
        except Exception as e:
            # Log error but continue with next source
            print(f"Error fetching calendar events from {source}: {e}")
            continue
    
    # Sort by start time
    events.sort(key=lambda x: x.startTime if x.startTime != "All-day" else "00:00")
    
    return events


@router.get("/sources", response_model=Dict[str, bool])
async def get_calendar_sources(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get available calendar sources for the current user.
    
    Returns a dictionary with source names as keys and boolean values indicating if they're available.
    """
    # Check for Google Calendar
    has_google = bool(current_user.google_access_token and current_user.google_refresh_token)
    
    # Check for Microsoft Outlook
    has_microsoft = bool(current_user.microsoft_access_token and current_user.microsoft_refresh_token)
    
    return {
        "google": has_google,
        "microsoft": has_microsoft
    }