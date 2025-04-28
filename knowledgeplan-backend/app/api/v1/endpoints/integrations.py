from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel

from app import models
from app.core import security
from app.db.session import get_db_session
from app.services import google_calendar # Import the service

router = APIRouter()

# Define a simple response model (adjust as needed)
class CalendarEvent(BaseModel):
    summary: str
    start: Optional[str] = None
    end: Optional[str] = None

@router.get("/google/calendar/events", response_model=List[CalendarEvent])
async def get_google_calendar_events_today(
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user)
):
    """Fetches today's Google Calendar events for the current user."""
    
    # Build the service client using stored credentials
    # Note: Google API calls might block, consider running in threadpool later
    service = await google_calendar.get_google_calendar_service(current_user, db)
    
    if not service:
        # Could indicate no token or error building service
        # Return empty list or specific error
        # raise HTTPException(status_code=400, detail="Google Calendar not connected or token invalid")
        return []

    # Fetch events
    events = await google_calendar.get_todays_calendar_events(service)
    return events 