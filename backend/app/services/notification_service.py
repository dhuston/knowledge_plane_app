import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.crud.crud_notification import notification, notification_preference
from app.models.notification import Notification
from app.core.delta_stream import delta_stream_service


class NotificationService:
    """
    Service for handling notification generation and delivery.
    
    This service provides high-level methods for creating and delivering
    notifications to users based on various events in the system.
    """
    
    def create_activity_notification(
        self,
        db: Session,
        *,
        tenant_id: uuid.UUID,
        actor_id: uuid.UUID,
        action: str,
        entity_type: str,
        entity_id: uuid.UUID,
        entity_name: str,
        recipient_ids: List[uuid.UUID]
    ) -> Notification:
        """
        Create a notification for an activity performed by a user.
        
        Args:
            db: Database session
            tenant_id: Tenant ID
            actor_id: User who performed the action
            action: Action performed (e.g., "created", "updated", "deleted")
            entity_type: Type of entity affected (e.g., "project", "team")
            entity_id: ID of the entity affected
            entity_name: Name of the entity affected
            recipient_ids: List of user IDs to receive the notification
            
        Returns:
            The created notification
        """
        # Get actor details
        actor = crud.user.get(db=db, id=actor_id)
        if not actor:
            raise ValueError(f"User with ID {actor_id} not found")
        
        # Create notification data
        notification_data = schemas.notification.NotificationCreate(
            type="activity",
            severity="info",
            title=f"{actor.full_name} {action} {entity_type}",
            message=f"{actor.full_name} {action} {entity_type} '{entity_name}'",
            entity_type=entity_type,
            entity_id=entity_id,
            action_url=f"/{entity_type}s/{entity_id}"
        )
        
        # Create notification and assign recipients
        notification_obj = notification.create_with_recipients(
            db=db,
            obj_in=notification_data,
            tenant_id=tenant_id,
            recipient_ids=recipient_ids
        )
        
        # Send real-time notifications via WebSocket
        self._send_realtime_notification(
            db=db,
            notification_obj=notification_obj,
            recipient_ids=recipient_ids
        )
        
        return notification_obj
    
    def create_insight_notification(
        self,
        db: Session,
        *,
        tenant_id: uuid.UUID,
        title: str,
        message: str,
        severity: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[uuid.UUID] = None,
        action_url: Optional[str] = None,
        recipient_ids: List[uuid.UUID]
    ) -> Notification:
        """
        Create a notification for an AI-generated insight.
        
        Args:
            db: Database session
            tenant_id: Tenant ID
            title: Insight title
            message: Insight details
            severity: Severity level ("info", "warning", "critical")
            entity_type: Type of entity related to the insight
            entity_id: ID of the entity related to the insight
            action_url: URL to link for more details
            recipient_ids: List of user IDs to receive the notification
            
        Returns:
            The created notification
        """
        # Create notification data
        notification_data = schemas.notification.NotificationCreate(
            type="insight",
            severity=severity,
            title=title,
            message=message,
            entity_type=entity_type,
            entity_id=entity_id,
            action_url=action_url
        )
        
        # Create notification and assign recipients
        notification_obj = notification.create_with_recipients(
            db=db,
            obj_in=notification_data,
            tenant_id=tenant_id,
            recipient_ids=recipient_ids
        )
        
        # Send real-time notifications via WebSocket
        self._send_realtime_notification(
            db=db,
            notification_obj=notification_obj,
            recipient_ids=recipient_ids
        )
        
        return notification_obj
    
    def create_system_notification(
        self,
        db: Session,
        *,
        tenant_id: uuid.UUID,
        title: str,
        message: str,
        severity: str = "info",
        action_url: Optional[str] = None,
        expires_at: Optional[datetime] = None,
        recipient_ids: List[uuid.UUID]
    ) -> Notification:
        """
        Create a system notification.
        
        Args:
            db: Database session
            tenant_id: Tenant ID
            title: Notification title
            message: Notification details
            severity: Severity level ("info", "warning", "critical")
            action_url: URL to link for more details
            expires_at: When the notification should expire
            recipient_ids: List of user IDs to receive the notification
            
        Returns:
            The created notification
        """
        # Create notification data
        notification_data = schemas.notification.NotificationCreate(
            type="system",
            severity=severity,
            title=title,
            message=message,
            action_url=action_url,
            expires_at=expires_at
        )
        
        # Create notification and assign recipients
        notification_obj = notification.create_with_recipients(
            db=db,
            obj_in=notification_data,
            tenant_id=tenant_id,
            recipient_ids=recipient_ids
        )
        
        # Send real-time notifications via WebSocket
        self._send_realtime_notification(
            db=db,
            notification_obj=notification_obj,
            recipient_ids=recipient_ids
        )
        
        return notification_obj
    
    def create_mention_notification(
        self,
        db: Session,
        *,
        tenant_id: uuid.UUID,
        actor_id: uuid.UUID,
        mentioned_user_id: uuid.UUID,
        source_type: str,
        source_id: uuid.UUID,
        source_name: str,
        excerpt: str
    ) -> Optional[Notification]:
        """
        Create a notification for when a user is mentioned.
        
        Args:
            db: Database session
            tenant_id: Tenant ID
            actor_id: User who mentioned someone
            mentioned_user_id: User who was mentioned
            source_type: Where the mention occurred (e.g., "note", "comment")
            source_id: ID of the source
            source_name: Name or title of the source
            excerpt: Text excerpt containing the mention
            
        Returns:
            The created notification, or None if user doesn't want mention notifications
        """
        # Check if the mentioned user wants to receive mention notifications
        user_pref = notification_preference.get_or_create(
            db=db,
            user_id=mentioned_user_id,
            notification_type="mention"
        )
        
        if not user_pref.enabled:
            return None  # User has disabled mention notifications
        
        # Get actor details
        actor = crud.user.get(db=db, id=actor_id)
        if not actor:
            raise ValueError(f"User with ID {actor_id} not found")
        
        # Create notification data
        notification_data = schemas.notification.NotificationCreate(
            type="mention",
            severity="info",
            title=f"{actor.full_name} mentioned you",
            message=f"{actor.full_name} mentioned you in {source_type} '{source_name}': \"{excerpt}\"",
            entity_type=source_type,
            entity_id=source_id,
            action_url=f"/{source_type}s/{source_id}"
        )
        
        # Create notification for the mentioned user
        notification_obj = notification.create_with_recipients(
            db=db,
            obj_in=notification_data,
            tenant_id=tenant_id,
            recipient_ids=[mentioned_user_id]
        )
        
        # Send real-time notification via WebSocket
        self._send_realtime_notification(
            db=db,
            notification_obj=notification_obj,
            recipient_ids=[mentioned_user_id]
        )
        
        return notification_obj
    
    def _send_realtime_notification(
        self,
        db: Session,
        notification_obj: Notification,
        recipient_ids: List[uuid.UUID]
    ) -> None:
        """
        Send real-time notification to recipients via WebSocket.
        
        Args:
            db: Database session
            notification_obj: Notification to send
            recipient_ids: List of user IDs to receive the notification
        """
        for user_id in recipient_ids:
            # Check if user has this notification type enabled
            user_pref = notification_preference.get_or_create(
                db=db,
                user_id=user_id,
                notification_type=notification_obj.type
            )
            
            if not user_pref.enabled:
                continue  # Skip users who have disabled this notification type
            
            # Get recipient data
            recipient = db.query(models.notification.NotificationRecipient).filter(
                models.notification.NotificationRecipient.notification_id == notification_obj.id,
                models.notification.NotificationRecipient.user_id == user_id
            ).first()
            
            if not recipient:
                continue  # Skip if recipient not found
                
            # Create notification response
            notification_data = {
                "id": str(notification_obj.id),
                "type": notification_obj.type,
                "severity": notification_obj.severity,
                "title": notification_obj.title,
                "message": notification_obj.message,
                "created_at": notification_obj.created_at.isoformat(),
                "read_at": recipient.read_at.isoformat() if recipient.read_at else None,
                "dismissed_at": recipient.dismissed_at.isoformat() if recipient.dismissed_at else None,
                "entity_type": notification_obj.entity_type,
                "entity_id": str(notification_obj.entity_id) if notification_obj.entity_id else None,
                "action_url": notification_obj.action_url
            }
            
            # Send via delta stream
            delta_stream_service.send_to_user(
                user_id=user_id,
                data_type="notification",
                data=notification_data,
                operation="create"
            )
    
    def cleanup_expired_notifications(
        self,
        db: Session,
        *,
        tenant_id: Optional[uuid.UUID] = None
    ) -> int:
        """
        Clean up expired notifications.
        
        Args:
            db: Database session
            tenant_id: Optional tenant ID to limit cleanup
            
        Returns:
            Number of notifications removed
        """
        return notification.clean_expired_notifications(
            db=db,
            tenant_id=tenant_id
        )


notification_service = NotificationService()