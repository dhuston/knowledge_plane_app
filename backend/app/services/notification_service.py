import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.crud.crud_notification import notification, notification_preference
from app.models.notification import Notification
from app.core.delta_stream import delta_stream_service
from app.schemas.notification import NotificationType, NotificationPriority


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
    
    def create_strategic_alignment_notification(
        self,
        db: Session,
        *,
        tenant_id: uuid.UUID,
        notification_type: str,  # "misalignment", "recommendation", "impact"
        title: str,
        message: str,
        severity: str,
        entity_type: str,
        entity_id: uuid.UUID,
        action_url: str,
        metadata: Optional[Dict[str, Any]] = None,
        recipient_ids: List[uuid.UUID]
    ) -> Notification:
        """
        Create a notification for strategic alignment events.
        
        Args:
            db: Database session
            tenant_id: Tenant ID
            notification_type: Type of strategic alignment notification
            title: Notification title
            message: Notification message
            severity: Severity level
            entity_type: Type of entity
            entity_id: ID of the entity
            action_url: URL for action
            metadata: Additional metadata
            recipient_ids: List of user IDs to receive the notification
            
        Returns:
            Created notification
        """
        # Create notification data
        notification_data = schemas.notification.NotificationCreate(
            type="strategic_alignment",
            subtype=notification_type,
            severity=severity,
            title=title,
            message=message,
            entity_type=entity_type,
            entity_id=entity_id,
            action_url=action_url,
            metadata=metadata or {}
        )
        
        # Create notification and assign recipients
        notification_obj = notification.create_with_recipients(
            db=db,
            obj_in=notification_data,
            tenant_id=tenant_id,
            recipient_ids=recipient_ids
        )
        
        # Send real-time notification via WebSocket
        self._send_realtime_notification(
            db=db,
            notification_obj=notification_obj,
            recipient_ids=recipient_ids
        )
        
        return notification_obj
    
    def create_misalignment_notification(
        self,
        db: Session,
        *,
        tenant_id: uuid.UUID,
        misalignment_id: int,
        misalignment_type: str,
        description: str,
        severity: str,
        affected_entities: Dict[str, List[int]],
        recipient_ids: List[uuid.UUID]
    ) -> Notification:
        """
        Create a notification for misalignment detection.
        
        Args:
            db: Database session
            tenant_id: Tenant ID
            misalignment_id: The ID of the misalignment
            misalignment_type: The type of misalignment
            description: The description of the misalignment
            severity: The severity of the misalignment
            affected_entities: The affected entities
            recipient_ids: List of user IDs to receive the notification
            
        Returns:
            Created notification
        """
        # Map misalignment type to title
        title_map = {
            "unaligned_project": "Unaligned Project Detected",
            "conflicting_goals": "Conflicting Goals Detected",
            "resource_misallocation": "Resource Misallocation Detected",
            "strategic_gap": "Strategic Gap Detected",
            "duplicated_effort": "Duplicated Effort Detected"
        }
        
        # Create notification
        return self.create_strategic_alignment_notification(
            db=db,
            tenant_id=tenant_id,
            notification_type="misalignment",
            title=title_map.get(misalignment_type, "Strategic Misalignment Detected"),
            message=description,
            severity=severity,
            entity_type="misalignment",
            entity_id=misalignment_id,
            action_url=f"/dashboard/strategic-alignment/misalignments/{misalignment_id}",
            metadata={
                "misalignment_type": misalignment_type,
                "severity": severity,
                "affected_entities": affected_entities
            },
            recipient_ids=recipient_ids
        )
    
    def create_recommendation_notification(
        self,
        db: Session,
        *,
        tenant_id: uuid.UUID,
        recommendation_id: int,
        recommendation_type: str,
        title: str,
        description: str,
        difficulty: str,
        project_id: Optional[int] = None,
        recipient_ids: List[uuid.UUID]
    ) -> Notification:
        """
        Create a notification for strategic recommendations.
        
        Args:
            db: Database session
            tenant_id: Tenant ID
            recommendation_id: The ID of the recommendation
            recommendation_type: The type of recommendation
            title: The recommendation title
            description: The recommendation description
            difficulty: The difficulty of implementing the recommendation
            project_id: Optional related project ID
            recipient_ids: List of user IDs to receive the notification
            
        Returns:
            Created notification
        """
        # Map severity based on difficulty
        severity_map = {
            "easy": "info",
            "medium": "warning",
            "hard": "critical"
        }
        
        # Build action link
        action_url = f"/dashboard/strategic-alignment/recommendations/{recommendation_id}"
        if project_id:
            action_url = f"/dashboard/projects/{project_id}/recommendations/{recommendation_id}"
        
        # Create notification
        return self.create_strategic_alignment_notification(
            db=db,
            tenant_id=tenant_id,
            notification_type="recommendation",
            title=f"New Recommendation: {title}",
            message=description,
            severity=severity_map.get(difficulty, "warning"),
            entity_type="recommendation",
            entity_id=recommendation_id,
            action_url=action_url,
            metadata={
                "recommendation_type": recommendation_type,
                "difficulty": difficulty,
                "project_id": project_id
            },
            recipient_ids=recipient_ids
        )
    
    def notify_management_about_misalignment(
        self,
        db: Session,
        *,
        tenant_id: uuid.UUID,
        misalignment_id: int,
        misalignment_type: str,
        description: str,
        severity: str,
        affected_entities: Dict[str, List[int]]
    ) -> List[Notification]:
        """
        Notify relevant managers about a misalignment.
        
        Args:
            db: Database session
            tenant_id: Tenant ID
            misalignment_id: The ID of the misalignment
            misalignment_type: The type of misalignment
            description: The description of the misalignment
            severity: The severity of the misalignment
            affected_entities: The affected entities
            
        Returns:
            List of created notifications
        """
        notifications_created = []
        notified_users = set()
        
        # Find managers for affected projects
        if "projects" in affected_entities and affected_entities["projects"]:
            for project_id in affected_entities["projects"]:
                # Find project owner
                project = crud.project.get(db=db, id=project_id)
                if project and project.owner_id and project.owner_id not in notified_users:
                    # Create notification for project owner
                    notification_obj = self.create_misalignment_notification(
                        db=db,
                        tenant_id=tenant_id,
                        misalignment_id=misalignment_id,
                        misalignment_type=misalignment_type,
                        description=description,
                        severity=severity,
                        affected_entities=affected_entities,
                        recipient_ids=[project.owner_id]
                    )
                    notifications_created.append(notification_obj)
                    notified_users.add(project.owner_id)
        
        # Find managers for affected teams
        if "teams" in affected_entities and affected_entities["teams"]:
            for team_id in affected_entities["teams"]:
                # Find team lead
                team = crud.team.get(db=db, id=team_id)
                if team and team.lead_id and team.lead_id not in notified_users:
                    # Create notification for team lead
                    notification_obj = self.create_misalignment_notification(
                        db=db,
                        tenant_id=tenant_id,
                        misalignment_id=misalignment_id,
                        misalignment_type=misalignment_type,
                        description=description,
                        severity=severity,
                        affected_entities=affected_entities,
                        recipient_ids=[team.lead_id]
                    )
                    notifications_created.append(notification_obj)
                    notified_users.add(team.lead_id)
        
        # If critical severity, notify tenant admins
        if severity.lower() == "critical":
            admin_users = crud.user.get_tenant_admins(db=db, tenant_id=tenant_id)
            admin_ids = [
                admin.id for admin in admin_users 
                if admin.id not in notified_users
            ]
            
            if admin_ids:
                notification_obj = self.create_misalignment_notification(
                    db=db,
                    tenant_id=tenant_id,
                    misalignment_id=misalignment_id,
                    misalignment_type=misalignment_type,
                    description=description,
                    severity=severity,
                    affected_entities=affected_entities,
                    recipient_ids=admin_ids
                )
                notifications_created.append(notification_obj)
                notified_users.update(admin_ids)
        
        return notifications_created
    
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
                "subtype": notification_obj.subtype,
                "severity": notification_obj.severity,
                "title": notification_obj.title,
                "message": notification_obj.message,
                "created_at": notification_obj.created_at.isoformat(),
                "read_at": recipient.read_at.isoformat() if recipient.read_at else None,
                "dismissed_at": recipient.dismissed_at.isoformat() if recipient.dismissed_at else None,
                "entity_type": notification_obj.entity_type,
                "entity_id": str(notification_obj.entity_id) if notification_obj.entity_id else None,
                "action_url": notification_obj.action_url,
                "metadata": notification_obj.metadata
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