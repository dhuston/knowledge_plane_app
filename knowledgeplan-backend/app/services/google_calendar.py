from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import datetime, time, timezone
import googleapiclient.errors # Import errors for specific handling
import asyncio # Import asyncio

from app.models.user import User as UserModel

# TODO: Proper error handling, credential refresh logic

async def get_google_calendar_service(user: UserModel):
    """Builds the Google Calendar API service client using stored user credentials."""
    print(f"[Calendar Service] Attempting to build service for user {user.id}")
    if not user.google_access_token:
        print(f"[Calendar Service] User {user.id} has no Google access token stored.")
        return None

    # Basic expiry check (needs proper refresh logic later)
    if user.google_token_expiry and user.google_token_expiry < datetime.now(timezone.utc):
        print(f"[Calendar Service] Token for user {user.id} appears expired ({user.google_token_expiry}). Refresh needed.")
        # TODO: Implement refresh logic using user.google_refresh_token
        return None # Cannot proceed with expired token without refresh

    creds = Credentials(token=user.google_access_token)
    try:
        # Consider adding discovery service URL if cache issues persist
        # discoveryServiceUrl='https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
        service = build('calendar', 'v3', credentials=creds, cache_discovery=False)
        print(f"[Calendar Service] Service built successfully for user {user.id}")
        return service
    except googleapiclient.errors.HttpError as http_err:
        print(f"[Calendar Service] HTTP Error building service for user {user.id}: {http_err}")
        # Common issue: 401/403 if token is invalid/revoked
        if http_err.resp.status in [401, 403]:
            print("[Calendar Service] Token might be invalid or revoked.")
            # TODO: Clear the invalid token from the user record?
        return None
    except Exception as e:
        print(f"[Calendar Service] Unexpected Error building service for user {user.id}: {e}")
        return None

async def get_todays_calendar_events(service) -> list:
    """Fetches calendar events for today for the authenticated user."""
    if not service:
        print("[Calendar Service] Cannot fetch events, service object is None.")
        return []
        
    try:
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start.replace(hour=23, minute=59, second=59, microsecond=999999)
        time_min = today_start.isoformat()
        time_max = today_end.isoformat()

        print(f"[Calendar Service] Fetching events between {time_min} and {time_max}")

        # Define the synchronous function call
        def list_events():
            return service.events().list(
                calendarId='primary', 
                timeMin=time_min,
                timeMax=time_max,
                maxResults=10, 
                singleEvents=True,
                orderBy='startTime'
            ).execute()

        # Run the blocking call in a separate thread
        events_result = await asyncio.to_thread(list_events)
        
        events = events_result.get('items', [])
        print(f"[Calendar Service] Google API returned {len(events)} events.")
        # Log raw events for debugging if needed
        # print("[Calendar Service] Raw events:", events)
        
        # Simplify event data
        simple_events = [
            {
                "summary": event.get('summary', 'No Title'),
                "start": event.get('start', {}).get('dateTime') or event.get('start', {}).get('date'),
                "end": event.get('end', {}).get('dateTime') or event.get('end', {}).get('date')
            }
            for event in events
        ]
        return simple_events

    except googleapiclient.errors.HttpError as http_err:
        print(f"[Calendar Service] HTTP Error fetching events: {http_err.resp.status} - {http_err}")
        # Handle specific errors like 401/403 (bad token), 404 (calendar not found)
        return [] # Return empty on error for now
    except Exception as e:
        print(f"[Calendar Service] Unexpected Error fetching events: {e}")
        return [] 