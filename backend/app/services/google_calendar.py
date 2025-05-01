from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import datetime, time, timezone
import googleapiclient.errors # Import errors for specific handling
import asyncio # Import asyncio for running blocking IO in threads
from google.auth.transport.requests import Request as GoogleAuthRequest  # For refreshing tokens
from google.auth.exceptions import RefreshError # Import RefreshError
import logging # Use logging

# DB
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings

from app.models.user import User as UserModel

# Get logger for this module
logger = logging.getLogger(__name__)

class GoogleTokenRefreshError(Exception):
    "Custom exception for Google token refresh failures."
    pass

# Renamed to make it importable from other modules
async def refresh_google_access_token(user: UserModel) -> tuple[str, datetime | None]:
    """Attempts to refresh the Google access token using the stored refresh token.

    Returns a tuple of (new_access_token, expiry_datetime).
    Raises GoogleTokenRefreshError if refresh fails.
    """
    if not user.google_refresh_token:
        logger.warning(f"No Google refresh token available for user {user.id}. Cannot refresh.")
        raise GoogleTokenRefreshError("No refresh token available for user.")

    def _do_refresh(refresh_token: str):
        creds = Credentials(
            token=None,
            refresh_token=refresh_token,
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            token_uri="https://oauth2.googleapis.com/token",
        )
        creds.refresh(GoogleAuthRequest())
        return creds.token, creds.expiry

    try:
        new_token, expiry = await asyncio.to_thread(_do_refresh, user.google_refresh_token)
        logger.info(f"Successfully refreshed Google token for user {user.id}. New expiry at {expiry}.")
        return new_token, expiry
    except RefreshError as e:
        logger.error(f"Failed to refresh Google token for user {user.id} due to RefreshError: {e}")
        raise GoogleTokenRefreshError(f"Google API RefreshError: {e}") from e
    except Exception as e:
        logger.exception(f"Unexpected error during Google token refresh for user {user.id}: {e}") # Use logger.exception
        raise GoogleTokenRefreshError(f"Unexpected error during refresh: {e}") from e


async def get_google_calendar_service(user: UserModel, db: AsyncSession | None = None):
    """Builds the Google Calendar API service client using stored user credentials.

    If the access token is expired, this function will attempt to refresh it using the stored
    refresh token. If a new access token is obtained, the user record is updated in the database.
    """
    print(f"[Calendar Service] Attempting to build service for user {user.id}")

    # Refresh token if expired or missing access token
    needs_refresh = (
        (not user.google_access_token) or
        (user.google_token_expiry and user.google_token_expiry < datetime.now(timezone.utc))
    )

    if needs_refresh:
        print(f"[Calendar Service] Access token missing or expired for user {user.id}. Attempting refresh...")
        new_token, expiry = await refresh_google_access_token(user)

        if new_token:
            user.google_access_token = new_token
            user.google_token_expiry = expiry

            # Persist changes if DB session provided
            if db is not None:
                try:
                    db.add(user)
                    await db.commit()
                    await db.refresh(user)
                    print(f"[Calendar Service] Updated user {user.id} tokens in DB.")
                except Exception as e:
                    print(f"[Calendar Service] Failed to save refreshed token for user {user.id}: {e}")
        else:
            print(f"[Calendar Service] Could not refresh token for user {user.id}.")

    # Still no access token? give up
    if not user.google_access_token:
        print(f"[Calendar Service] No valid access token available for user {user.id} even after refresh.")
        return None

    try:
        creds = Credentials(token=user.google_access_token)
        service = build('calendar', 'v3', credentials=creds, cache_discovery=False)
        print(f"[Calendar Service] Service built successfully for user {user.id}")
        return service
    except googleapiclient.errors.HttpError as http_err:
        print(f"[Calendar Service] HTTP Error building service for user {user.id}: {http_err}")
        if http_err.resp.status in [401, 403]:
            print("[Calendar Service] Token might be invalid or revoked.")
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