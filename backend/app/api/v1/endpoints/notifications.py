from datetime import datetime
import uuid
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.core.permissions import check_tenant_permissions
from app.crud.crud_notification import notification, notification_preference


router = APIRouter()


@router.get("/", response_model=List[schemas.notification.NotificationResponse])
def get_notifications(
    *,
    db: Session = Depends(deps.get_db),
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
    # Get notifications
    notifications_with_recipients = notification.get_user_notifications(
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


@router.patch("/{notification_id}/read", response_model=schemas.notification.NotificationResponse)
def mark_notification_as_read(
    *,
    db: Session = Depends(deps.get_db),
    notification_id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    Mark a notification as read.
    """
    # Get the notification
    notification_obj = notification.get(db=db, notification_id=notification_id)
    if not notification_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Check tenant permissions
    check_tenant_permissions(current_user.tenant_id, notification_obj.tenant_id)
    
    # Mark as read
    recipient = notification.mark_as_read(
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


@router.delete("/{notification_id}", response_model=schemas.notification.NotificationResponse)
def dismiss_notification(
    *,
    db: Session = Depends(deps.get_db),
    notification_id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    Dismiss a notification.
    """
    # Get the notification
    notification_obj = notification.get(db=db, notification_id=notification_id)
    if not notification_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Check tenant permissions
    check_tenant_permissions(current_user.tenant_id, notification_obj.tenant_id)
    
    # Dismiss
    recipient = notification.dismiss(
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


@router.post("/read-all", response_model=dict)
def mark_all_as_read(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    Mark all notifications as read.
    """
    count = notification.mark_all_as_read(
        db=db,
        user_id=current_user.id,
        tenant_id=current_user.tenant_id
    )
    
    return {
        "success": True,
        "count": count,
        "message": f"Marked {count} notifications as read"
    }


@router.post("/dismiss-all", response_model=dict)
def dismiss_all_notifications(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    Dismiss all notifications.
    """
    count = notification.dismiss_all(
        db=db,
        user_id=current_user.id,
        tenant_id=current_user.tenant_id
    )
    
    return {
        "success": True,
        "count": count,
        "message": f"Dismissed {count} notifications"
    }


@router.get("/preferences", response_model=schemas.notification.UserNotificationSettings)
def get_notification_preferences(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    Get user's notification preferences.
    """
    # Get preferences or create defaults if none exist
    prefs = notification_preference.get_all_for_user(db=db, user_id=current_user.id)
    
    # If no preferences exist yet, create defaults
    if not prefs:
        prefs = notification_preference.set_defaults_for_user(db=db, user_id=current_user.id)
    
    # Convert to response schema
    pref_responses = [
        schemas.notification.NotificationPreferenceResponse(
            user_id=p.user_id,
            notification_type=p.notification_type,
            enabled=p.enabled,
            email_enabled=p.email_enabled
        ) for p in prefs
    ]
    
    return schemas.notification.UserNotificationSettings(
        preferences=pref_responses
    )


@router.put(
    "/preferences",
    response_model=schemas.notification.NotificationPreferenceResponse
)
def update_notification_preference(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    preference_in: schemas.notification.NotificationPreferenceCreate
) -> Any:
    """
    Update a notification preference.
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
    
    return schemas.notification.NotificationPreferenceResponse(
        user_id=updated_preference.user_id,
        notification_type=updated_preference.notification_type,
        enabled=updated_preference.enabled,
        email_enabled=updated_preference.email_enabled
    )


@router.post("/test", response_model=schemas.notification.NotificationResponse, status_code=status.HTTP_201_CREATED)
def send_test_notification(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    Send a test notification to the current user.
    
    This endpoint is for development/testing purposes only.
    """
    # Create test notification
    notification_data = schemas.notification.NotificationCreate(
        type="system",
        severity="info",
        title="Test Notification",
        message=f"This is a test notification generated at {datetime.utcnow().isoformat()}",
        action_url="/notifications"
    )
    
    # Create notification with current user as recipient
    notification_obj = notification.create_with_recipients(
        db=db,
        obj_in=notification_data,
        tenant_id=current_user.tenant_id,
        recipient_ids=[current_user.id]
    )
    
    # Get recipient data
    recipient = db.query(models.notification.NotificationRecipient).filter(
        models.notification.NotificationRecipient.notification_id == notification_obj.id,
        models.notification.NotificationRecipient.user_id == current_user.id
    ).first()
    
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