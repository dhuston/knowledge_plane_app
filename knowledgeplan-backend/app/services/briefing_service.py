from datetime import datetime, timedelta
from typing import List, Optional
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.crud_activity_log import activity_log as crud_activity_log # Use specific import
from app import models # Keep models import if needed elsewhere
from app.services.llm_service import llm_service
from app.services.google_calendar import get_todays_calendar_events as get_calendar_events
from app.services.google_calendar import get_google_calendar_service

logger = logging.getLogger(__name__)

class BriefingService:

    async def get_daily_briefing(self, db: AsyncSession, user: models.User) -> str:
        """Generates a daily briefing summary for the user."""
        
        # 1. Fetch Input Data
        calendar_summary = await self._get_calendar_summary(user)
        activity_summary = await self._get_activity_summary(db, user)
        
        # Combine data for the prompt
        prompt_context = "Here is information about my day:\n\n"
        if calendar_summary:
            prompt_context += f"Calendar Events Today:\n{calendar_summary}\n\n"
        else:
            prompt_context += "No upcoming calendar events found.\n\n"
            
        if activity_summary:
            prompt_context += f"Recent Activity Log:\n{activity_summary}\n\n"
        else:
            prompt_context += "No recent relevant activity found.\n\n"
            
        # TODO: Add project/goal status updates later

        # 2. Construct Prompt
        prompt = (
            f"{prompt_context}"
            f"Based on the calendar and activity, provide a concise (2-3 sentences) daily briefing summary. "
            f"Highlight key meetings and mention recent actions like notes created or items updated. "
            f"Focus on actionable items or important context for the day."
        )

        logger.info(f"Generating daily briefing for user {user.id} with prompt context length: {len(prompt_context)}")
        # logger.debug(f"Briefing Prompt: {prompt}") # Optional: log full prompt if needed

        # 3. Call LLM Service
        summary = await llm_service.generate_summary(prompt=prompt, max_tokens=200, temperature=0.5)
        
        return summary

    async def _get_calendar_summary(self, user: models.User) -> Optional[str]:
        """Fetches and summarizes today's calendar events."""
        try:
            # First, get the calendar service object
            # Passing db=None as briefing service doesn't have direct access to it
            # If token refresh fails & needs DB save, it won't persist here.
            # Consider refactoring to pass db session if needed.
            service = await get_google_calendar_service(user=user, db=None)
            
            if not service:
                logger.warning(f"Could not get Google Calendar service for user {user.id}")
                return "(Could not connect to Google Calendar)"
            
            # Now pass the service object to fetch events
            events = await get_calendar_events(service=service)
            
            if not events:
                return None # No events today

            # Format events into a simple list string
            event_lines = []
            for event in events[:5]: # Limit number of events shown
                start_time_str = event.get('start', {}).get('dateTime', event.get('start', {}).get('date'))
                summary = event.get('summary', '(No Title)')
                time_str = "All-day" if 'date' in event.get('start', {}) else datetime.fromisoformat(start_time_str).strftime('%I:%M %p')
                event_lines.append(f"- {time_str}: {summary}")
            
            return "\n".join(event_lines)
        except Exception as e:
            logger.error(f"Failed to get calendar summary for user {user.id}: {e}", exc_info=True)
            return "(Error fetching calendar events)"

    async def _get_activity_summary(self, db: AsyncSession, user: models.User) -> Optional[str]:
        """Fetches and summarizes recent user activity."""
        try:
            recent_activities = await crud_activity_log.get_multi_by_user(
                db=db, user_id=user.id, tenant_id=user.tenant_id, limit=5
            )
            
            if not recent_activities:
                return None

            # Format activities into a simple list string
            activity_lines = []
            for activity in recent_activities:
                target_info = f" on {activity.target_entity_type} ({activity.target_entity_id[:8]}...)" if activity.target_entity_type and activity.target_entity_id else ""
                activity_lines.append(f"- Action: {activity.action}{target_info}")
            
            return "\n".join(activity_lines)
        except Exception as e:
            logger.error(f"Failed to get activity summary for user {user.id}: {e}", exc_info=True)
            return "(Error fetching activity log)"

# Instantiate the service once
briefing_service = BriefingService() 