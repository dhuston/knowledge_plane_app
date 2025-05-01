from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple, Dict
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.crud_activity_log import activity_log as crud_activity_log # Use specific import
from app import models, schemas # Keep models import if needed elsewhere
from app.services.llm_service import llm_service
from app.services.google_calendar import get_todays_calendar_events as get_calendar_events
from app.services.google_calendar import get_google_calendar_service
from app.services.entity_recognition_service import entity_recognition_service

logger = logging.getLogger(__name__)

class BriefingService:

    async def get_daily_briefing(self, db: AsyncSession, user: models.User) -> Tuple[str, List[schemas.HighlightedTextSegment]]:
        """
        Generates a daily briefing summary for the user with entity highlighting.

        Returns:
            Tuple of (plain_text_summary, highlighted_summary_segments)
        """

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
            prompt_context += "No recent activity found.\n\n"

        # 2. Construct Prompt
        prompt = (
            f"{prompt_context}"
            f"Based on this information, provide a concise (2-3 sentences) daily briefing summary. "
            f"Highlight key meetings for today and mention recent actions. "
            f"Focus on actionable items or important context for today. "
            f"NEVER mention IDs or ID numbers in your response. "
            f"Always use the full name of entities (projects, teams, people) instead of their IDs. "
            f"For example, say 'the Clinical Trial Analysis project was updated' instead of 'Project b4018e7c was updated'. "
        )

        # 3. Call LLM Service
        summary = await llm_service.generate_summary(prompt=prompt, max_tokens=200, temperature=0.5)

        # 4. Process the summary with entity recognition
        try:
            highlighted_summary = await entity_recognition_service.process_text(summary, db, user)
        except Exception as e:
            logger.error(f"Error processing summary with entity recognition: {e}")
            # If entity recognition fails, return a simple text segment
            highlighted_summary = [schemas.HighlightedTextSegment(type="text", content=summary)]

        return summary, highlighted_summary

    async def _get_calendar_summary(self, user: models.User) -> Optional[str]:
        """Fetches and summarizes today's calendar events."""
        try:
            # First, get the calendar service object
            service = await get_google_calendar_service(user=user, db=None)

            if not service:
                return None

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
            logger.error(f"Failed to get calendar summary for user {user.id}: {e}")
            return None

    async def _get_activity_summary(self, db: AsyncSession, user: models.User) -> Optional[str]:
        """Fetches and summarizes recent user activity."""
        try:
            # Get the 5 most recent activities
            recent_activities = await crud_activity_log.get_multi_by_user(
                db=db, user_id=user.id, tenant_id=user.tenant_id, limit=5
            )

            if not recent_activities:
                return None

            # Format activities into a simple list string - without showing IDs
            activity_lines = []
            for activity in recent_activities:
                # Get a more user-friendly description without IDs
                if activity.target_entity_type and activity.target_entity_id:
                    # Just mention the entity type without the ID
                    target_info = f" on a {activity.target_entity_type}"
                else:
                    target_info = ""

                activity_lines.append(f"- {activity.action}{target_info}")

            return "\n".join(activity_lines)
        except Exception as e:
            logger.error(f"Failed to get activity summary for user {user.id}: {e}")
            return None

# Instantiate the service once
briefing_service = BriefingService()