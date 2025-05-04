"""
Notifications Router - aggregates the notifications endpoints
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Any, List, Optional

from app.api.v1.endpoints import notifications
from app.api import deps
from app.models.user import User
from app.schemas.notification import UserNotificationSettings, NotificationPreferenceCreate, NotificationPreferenceResponse
from app.crud.crud_notification import notification_preference

router = APIRouter()

# Include the v1 notifications endpoints
router.include_router(notifications.router)

# Add convenience route at the top level to handle potential API calls
@router.get("/preferences", response_model=UserNotificationSettings)
def get_preferences(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Get user's notification preferences.
    This is a convenience endpoint that directly uses the crud operations.
    """
    # Get preferences or create defaults if none exist
    prefs = notification_preference.get_all_for_user(db=db, user_id=current_user.id)
    
    # If no preferences exist yet, create defaults
    if not prefs:
        prefs = notification_preference.set_defaults_for_user(db=db, user_id=current_user.id)
    
    # Return using the same schema as the main endpoint
    return UserNotificationSettings(preferences=prefs)

@router.put("/preferences", response_model=NotificationPreferenceResponse)
def update_preferences(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    preference_in: NotificationPreferenceCreate
) -> Any:
    """
    Update a notification preference.
    This is a convenience endpoint that mirrors the behavior of the main endpoint.
    """
    # Get or create the preference
    preference = notification_preference.get_or_create(
        db=db,
        user_id=current_user.id,
        notification_type=preference_in.notification_type
    )
    
    # Update with new values
    updated_preference = notification_preference.update(
        db=db,
        db_obj=preference,
        enabled=preference_in.enabled,
        email_enabled=preference_in.email_enabled
    )
    
    return NotificationPreferenceResponse(
        user_id=updated_preference.user_id,
        notification_type=updated_preference.notification_type,
        enabled=updated_preference.enabled,
        email_enabled=updated_preference.email_enabled
    )