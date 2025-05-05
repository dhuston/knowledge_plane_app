from datetime import datetime
import uuid
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.core.permissions import check_tenant_permissions
from app.crud.crud_notification import notification, notification_preference
from app.models.notification import NotificationPreference


router = APIRouter()


@router.get("/", response_model=List[schemas.notification.NotificationResponse])
async def get_notifications(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
    include_read: bool = False,
    include_dismissed: bool = False,
    types: List[str] = None,
) -> Any:
    """
    Retrieve notifications for the current user.
    """
    try:
        # Check if db is an AsyncSession and use appropriate query method
        # Get notifications with compatibility for AsyncSession
        notifications_with_recipients = await notification.get_user_notifications_async(
            db=db,
            user_id=current_user.id,
            tenant_id=current_user.tenant_id,
            skip=skip,
            limit=limit,
            include_read=include_read,
            include_dismissed=include_dismissed,
            types=types
        )
        
        # Format response
        result = []
        for notification_obj, recipient in notifications_with_recipients:
            # Create base notification response with recipient data
            notification_data = schemas.notification.NotificationResponse(
                id=notification_obj.id,
                tenant_id=notification_obj.tenant_id,
                type=notification_obj.type,
                severity=notification_obj.severity,
                title=notification_obj.title,
                message=notification_obj.message,
                entity_type=notification_obj.entity_type,
                entity_id=notification_obj.entity_id,
                action_url=notification_obj.action_url,
                expires_at=notification_obj.expires_at,
                created_at=notification_obj.created_at,
                read_at=recipient.read_at,
                dismissed_at=recipient.dismissed_at
            )
            result.append(notification_data)
        
        return result
    except Exception as e:
        # Return empty list on error to prevent breaking the UI
        print(f"Error fetching notifications: {e}")
        return []


@router.patch("/{notification_id}/read", response_model=schemas.notification.NotificationResponse)
async def mark_notification_as_read(
    *,
    db: AsyncSession = Depends(deps.get_db),
    notification_id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    Mark a notification as read.
    """
    try:
        # Get the notification
        notification_obj = await notification.get_async(db=db, notification_id=notification_id)
        if not notification_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        # Check tenant permissions
        check_tenant_permissions(current_user.tenant_id, notification_obj.tenant_id)
        
        # Mark as read
        recipient = await notification.mark_as_read_async(
            db=db,
            notification_id=notification_id,
            user_id=current_user.id
        )
        
        if not recipient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="You are not a recipient of this notification"
            )
        
        # Return updated notification
        return schemas.notification.NotificationResponse(
            id=notification_obj.id,
            tenant_id=notification_obj.tenant_id,
            type=notification_obj.type,
            severity=notification_obj.severity,
            title=notification_obj.title,
            message=notification_obj.message,
            entity_type=notification_obj.entity_type,
            entity_id=notification_obj.entity_id,
            action_url=notification_obj.action_url,
            expires_at=notification_obj.expires_at,
            created_at=notification_obj.created_at,
            read_at=recipient.read_at,
            dismissed_at=recipient.dismissed_at
        )
    except Exception as e:
        # Log the error and re-raise as HTTP exception
        print(f"Error marking notification as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error marking notification as read: {str(e)}"
        )


@router.delete("/{notification_id}", response_model=schemas.notification.NotificationResponse)
async def dismiss_notification(
    *,
    db: AsyncSession = Depends(deps.get_db),
    notification_id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    Dismiss a notification.
    """
    try:
        # Get the notification
        notification_obj = await notification.get_async(db=db, notification_id=notification_id)
        if not notification_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        # Check tenant permissions
        check_tenant_permissions(current_user.tenant_id, notification_obj.tenant_id)
        
        # Dismiss
        recipient = await notification.dismiss_async(
            db=db,
            notification_id=notification_id,
            user_id=current_user.id
        )
        
        if not recipient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="You are not a recipient of this notification"
            )
        
        # Return updated notification
        return schemas.notification.NotificationResponse(
            id=notification_obj.id,
            tenant_id=notification_obj.tenant_id,
            type=notification_obj.type,
            severity=notification_obj.severity,
            title=notification_obj.title,
            message=notification_obj.message,
            entity_type=notification_obj.entity_type,
            entity_id=notification_obj.entity_id,
            action_url=notification_obj.action_url,
            expires_at=notification_obj.expires_at,
            created_at=notification_obj.created_at,
            read_at=recipient.read_at,
            dismissed_at=recipient.dismissed_at
        )
    except Exception as e:
        # Log the error and re-raise as HTTP exception
        print(f"Error dismissing notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error dismissing notification: {str(e)}"
        )


@router.post("/read-all", response_model=dict)
async def mark_all_as_read(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    Mark all notifications as read.
    """
    try:
        count = await notification.mark_all_as_read_async(
            db=db,
            user_id=current_user.id,
            tenant_id=current_user.tenant_id
        )
        
        return {
            "success": True,
            "count": count,
            "message": f"Marked {count} notifications as read"
        }
    except Exception as e:
        # Log the error and return a safe response
        print(f"Error marking all notifications as read: {e}")
        return {
            "success": False,
            "count": 0,
            "message": f"Error marking notifications as read: {str(e)}"
        }


@router.post("/dismiss-all", response_model=dict)
async def dismiss_all_notifications(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    Dismiss all notifications.
    """
    try:
        count = await notification.dismiss_all_async(
            db=db,
            user_id=current_user.id,
            tenant_id=current_user.tenant_id
        )
        
        return {
            "success": True,
            "count": count,
            "message": f"Dismissed {count} notifications"
        }
    except Exception as e:
        # Log the error and return a safe response
        print(f"Error dismissing all notifications: {e}")
        return {
            "success": False,
            "count": 0,
            "message": f"Error dismissing notifications: {str(e)}"
        }


@router.get("/preferences", response_model=schemas.notification.UserNotificationSettings)
async def get_notification_preferences(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
) -> schemas.notification.UserNotificationSettings:  # Explicitly return the expected type
    """
    Get user's notification preferences.
    """
    try:
        # Get preferences or create defaults if none exist
        prefs = await notification_preference.get_all_for_user_async(db=db, user_id=current_user.id)
        
        # If no preferences exist yet, create defaults
        if not prefs or len(prefs) == 0:
            print(f"No preferences found for user {current_user.id}, creating defaults")
            prefs = await notification_preference.set_defaults_for_user_async(db=db, user_id=current_user.id)
        
        # Ensure we have preferences after trying to create defaults
        if not prefs or len(prefs) == 0:
            print(f"Warning: Still no preferences for user {current_user.id} after creating defaults")
            # Create default preferences in memory as fallback
            default_types = ["activity", "insight", "reminder", "system", "mention", "relationship"]
            prefs = []
            for notification_type in default_types:
                # For activity and system, email is disabled by default
                email_enabled = notification_type not in ["activity", "system"]
                prefs.append(
                    NotificationPreference(
                        user_id=current_user.id,
                        notification_type=notification_type,
                        enabled=True,
                        email_enabled=email_enabled
                    )
                )
        
        # Convert to response schema with null safety
        pref_responses = []
        for p in prefs:
            if p is not None:  # Skip any null preferences
                pref_responses.append(
                    schemas.notification.NotificationPreferenceResponse(
                        user_id=p.user_id,
                        notification_type=p.notification_type,
                        enabled=p.enabled,
                        email_enabled=p.email_enabled
                    )
                )
        
        # Ensure we always return a properly structured response
        response = schemas.notification.UserNotificationSettings(preferences=pref_responses)
        
        # Log the response structure for debugging
        print(f"Returning notification preferences response: {response}")
        
        # Ensure the response has the expected structure with a preferences array
        if not hasattr(response, 'dict'):
            print("Warning: response doesn't have dict() method")
            # Create a dict manually as fallback
            return {"preferences": pref_responses}
            
        response_dict = response.dict()
        if "preferences" not in response_dict or not isinstance(response_dict["preferences"], list):
            print("Warning: response is missing preferences array, fixing structure")
            return {"preferences": pref_responses}
            
        return response
    except Exception as e:
        # Log the detailed error
        print(f"Error fetching notification preferences: {e}")
        import traceback
        traceback.print_exc()
        
        # Return default preferences matching frontend expectations
        default_types = ["activity", "insight", "reminder", "system", "mention", "relationship"]
        default_prefs = []
        for notification_type in default_types:
            # For activity and system, email is disabled by default
            email_enabled = notification_type not in ["activity", "system"]
            default_prefs.append(
                schemas.notification.NotificationPreferenceResponse(
                    user_id=current_user.id,
                    notification_type=notification_type,
                    enabled=True,
                    email_enabled=email_enabled
                )
            )
        
        # Create a properly structured response with default values
        response = schemas.notification.UserNotificationSettings(preferences=default_prefs)
        
        # Log that we're returning fallback preferences
        print(f"Returning fallback notification preferences: {response}")
        
        # Ensure we're returning a dictionary with preferences key to match frontend expectations
        return {"preferences": default_prefs}


@router.put(
    "/preferences",
    response_model=schemas.notification.NotificationPreferenceResponse
)
async def update_notification_preference(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    preference_in: schemas.notification.NotificationPreferenceCreate
) -> Any:
    """
    Update a notification preference.
    """
    try:
        # Get or create the preference
        preference = await notification_preference.get_or_create_async(
            db=db,
            user_id=current_user.id,
            notification_type=preference_in.notification_type
        )
        
        # Update with new values
        updated_preference = await notification_preference.update_async(
            db=db,
            db_obj=preference,
            enabled=preference_in.enabled,
            email_enabled=preference_in.email_enabled
        )
        
        return schemas.notification.NotificationPreferenceResponse(
            user_id=updated_preference.user_id,
            notification_type=updated_preference.notification_type,
            enabled=updated_preference.enabled,
            email_enabled=updated_preference.email_enabled
        )
    except Exception as e:
        # Log the error and re-raise as HTTP exception
        print(f"Error updating notification preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating notification preference: {str(e)}"
        )


@router.post("/test", response_model=schemas.notification.NotificationResponse, status_code=status.HTTP_201_CREATED)
async def send_test_notification(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    Send a test notification to the current user.
    
    This endpoint is for development/testing purposes only.
    """
    try:
        # Create test notification
        notification_data = schemas.notification.NotificationCreate(
            type="system",
            severity="info",
            title="Test Notification",
            message=f"This is a test notification generated at {datetime.utcnow().isoformat()}",
            action_url="/notifications"
        )
        
        # Create notification with current user as recipient
        notification_obj = await notification.create_with_recipients_async(
            db=db,
            obj_in=notification_data,
            tenant_id=current_user.tenant_id,
            recipient_ids=[current_user.id]
        )
        
        # Get recipient data using SQL Alchemy 2.0 style for AsyncSession
        from sqlalchemy import select
        from sqlalchemy.orm import joinedload
        
        stmt = select(models.notification.NotificationRecipient).where(
            models.notification.NotificationRecipient.notification_id == notification_obj.id,
            models.notification.NotificationRecipient.user_id == current_user.id
        )
        result = await db.execute(stmt)
        recipient = result.scalars().first()
        
        # Return notification with recipient data
        return schemas.notification.NotificationResponse(
            id=notification_obj.id,
            tenant_id=notification_obj.tenant_id,
            type=notification_obj.type,
            severity=notification_obj.severity,
            title=notification_obj.title,
            message=notification_obj.message,
            entity_type=notification_obj.entity_type,
            entity_id=notification_obj.entity_id,
            action_url=notification_obj.action_url,
            expires_at=notification_obj.expires_at,
            created_at=notification_obj.created_at,
            read_at=recipient.read_at if recipient else None,
            dismissed_at=recipient.dismissed_at if recipient else None
        )
    except Exception as e:
        # Log the error and re-raise as HTTP exception
        print(f"Error creating test notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating test notification: {str(e)}"
        )