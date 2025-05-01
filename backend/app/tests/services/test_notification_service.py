import uuid
from datetime import datetime
from unittest.mock import patch, MagicMock

import pytest
from sqlalchemy.orm import Session

from app.services.notification_service import notification_service
from app.models.notification import Notification, NotificationRecipient
from app.models.user import User
from app.models.tenant import Tenant


class TestNotificationService:
    """Test suite for the NotificationService"""
    
    def test_create_activity_notification(self, db_session: Session) -> None:
        """Test creating an activity notification"""
        # Create test tenant and user
        tenant_id = uuid.uuid4()
        tenant = Tenant(
            id=tenant_id,
            name="Test Tenant",
            domain="test.example.com"
        )
        
        actor_id = uuid.uuid4()
        actor = User(
            id=actor_id,
            tenant_id=tenant_id,
            email="actor@example.com",
            hashed_password="notarealhash",
            full_name="Actor User"
        )
        
        recipient_id = uuid.uuid4()
        recipient = User(
            id=recipient_id,
            tenant_id=tenant_id,
            email="recipient@example.com",
            hashed_password="notarealhash",
            full_name="Recipient User"
        )
        
        db_session.add_all([tenant, actor, recipient])
        db_session.commit()
        
        # Mock the WebSocket service
        with patch('app.services.notification_service.delta_stream_service.send_to_user') as mock_send:
            # Create activity notification
            entity_id = uuid.uuid4()
            notification = notification_service.create_activity_notification(
                db=db_session,
                tenant_id=tenant_id,
                actor_id=actor_id,
                action="created",
                entity_type="project",
                entity_id=entity_id,
                entity_name="Test Project",
                recipient_ids=[recipient_id]
            )
            
            # Check notification was created with correct fields
            assert notification is not None
            assert notification.tenant_id == tenant_id
            assert notification.type == "activity"
            assert notification.severity == "info"
            assert notification.title == "Actor User created project"
            assert notification.message == "Actor User created project 'Test Project'"
            assert notification.entity_type == "project"
            assert notification.entity_id == entity_id
            assert notification.action_url == f"/projects/{entity_id}"
            
            # Check recipient was added
            recipient_obj = db_session.query(NotificationRecipient).filter(
                NotificationRecipient.notification_id == notification.id,
                NotificationRecipient.user_id == recipient_id
            ).first()
            
            assert recipient_obj is not None
            assert recipient_obj.read_at is None
            assert recipient_obj.dismissed_at is None
            
            # Check WebSocket notification was sent
            assert mock_send.called
            mock_send.assert_called_with(
                user_id=recipient_id,
                data_type="notification",
                data=dict(
                    id=str(notification.id),
                    type="activity",
                    severity="info",
                    title="Actor User created project",
                    message="Actor User created project 'Test Project'",
                    created_at=notification.created_at.isoformat(),
                    read_at=None,
                    dismissed_at=None,
                    entity_type="project",
                    entity_id=str(entity_id),
                    action_url=f"/projects/{entity_id}"
                ),
                operation="create"
            )
    
    def test_create_insight_notification(self, db_session: Session) -> None:
        """Test creating an insight notification"""
        # Create test tenant and user
        tenant_id = uuid.uuid4()
        tenant = Tenant(
            id=tenant_id,
            name="Test Tenant",
            domain="test.example.com"
        )
        
        recipient_id = uuid.uuid4()
        recipient = User(
            id=recipient_id,
            tenant_id=tenant_id,
            email="recipient@example.com",
            hashed_password="notarealhash",
            full_name="Recipient User"
        )
        
        db_session.add_all([tenant, recipient])
        db_session.commit()
        
        # Mock the WebSocket service
        with patch('app.services.notification_service.delta_stream_service.send_to_user') as mock_send:
            # Create insight notification
            notification = notification_service.create_insight_notification(
                db=db_session,
                tenant_id=tenant_id,
                title="Team Collaboration Alert",
                message="Detected reduced collaboration between Teams A and B",
                severity="warning",
                entity_type="team",
                entity_id=uuid.uuid4(),
                action_url="/insights/123",
                recipient_ids=[recipient_id]
            )
            
            # Check notification was created with correct fields
            assert notification is not None
            assert notification.tenant_id == tenant_id
            assert notification.type == "insight"
            assert notification.severity == "warning"
            assert notification.title == "Team Collaboration Alert"
            assert notification.message == "Detected reduced collaboration between Teams A and B"
            
            # Check recipient was added
            recipient_obj = db_session.query(NotificationRecipient).filter(
                NotificationRecipient.notification_id == notification.id,
                NotificationRecipient.user_id == recipient_id
            ).first()
            
            assert recipient_obj is not None
            
            # Check WebSocket notification was sent
            assert mock_send.called
    
    def test_create_mention_notification(self, db_session: Session) -> None:
        """Test creating a mention notification"""
        # Create test tenant and users
        tenant_id = uuid.uuid4()
        tenant = Tenant(
            id=tenant_id,
            name="Test Tenant",
            domain="test.example.com"
        )
        
        actor_id = uuid.uuid4()
        actor = User(
            id=actor_id,
            tenant_id=tenant_id,
            email="actor@example.com",
            hashed_password="notarealhash",
            full_name="Actor User"
        )
        
        mentioned_id = uuid.uuid4()
        mentioned = User(
            id=mentioned_id,
            tenant_id=tenant_id,
            email="mentioned@example.com",
            hashed_password="notarealhash",
            full_name="Mentioned User"
        )
        
        db_session.add_all([tenant, actor, mentioned])
        db_session.commit()
        
        # Create notification preference for the mentioned user
        from app.crud.crud_notification import notification_preference
        notification_preference.create(
            db=db_session,
            user_id=mentioned_id,
            notification_type="mention",
            enabled=True,
            email_enabled=False
        )
        
        # Mock the WebSocket service
        with patch('app.services.notification_service.delta_stream_service.send_to_user') as mock_send:
            # Create mention notification
            note_id = uuid.uuid4()
            notification = notification_service.create_mention_notification(
                db=db_session,
                tenant_id=tenant_id,
                actor_id=actor_id,
                mentioned_user_id=mentioned_id,
                source_type="note",
                source_id=note_id,
                source_name="Project Notes",
                excerpt="We should ask @Mentioned User about this."
            )
            
            # Check notification was created with correct fields
            assert notification is not None
            assert notification.tenant_id == tenant_id
            assert notification.type == "mention"
            assert notification.severity == "info"
            assert notification.title == "Actor User mentioned you"
            assert "mentioned you in note" in notification.message
            assert notification.entity_type == "note"
            assert notification.entity_id == note_id
            
            # Check WebSocket notification was sent
            assert mock_send.called
    
    def test_mention_notification_respects_preferences(self, db_session: Session) -> None:
        """Test that mention notifications respect user preferences"""
        # Create test tenant and users
        tenant_id = uuid.uuid4()
        tenant = Tenant(
            id=tenant_id,
            name="Test Tenant",
            domain="test.example.com"
        )
        
        actor_id = uuid.uuid4()
        actor = User(
            id=actor_id,
            tenant_id=tenant_id,
            email="actor@example.com",
            hashed_password="notarealhash",
            full_name="Actor User"
        )
        
        mentioned_id = uuid.uuid4()
        mentioned = User(
            id=mentioned_id,
            tenant_id=tenant_id,
            email="mentioned@example.com",
            hashed_password="notarealhash",
            full_name="Mentioned User"
        )
        
        db_session.add_all([tenant, actor, mentioned])
        db_session.commit()
        
        # Create notification preference with mentions disabled
        from app.crud.crud_notification import notification_preference
        notification_preference.create(
            db=db_session,
            user_id=mentioned_id,
            notification_type="mention",
            enabled=False,
            email_enabled=False
        )
        
        # Mock the WebSocket service
        with patch('app.services.notification_service.delta_stream_service.send_to_user') as mock_send:
            # Create mention notification
            note_id = uuid.uuid4()
            notification = notification_service.create_mention_notification(
                db=db_session,
                tenant_id=tenant_id,
                actor_id=actor_id,
                mentioned_user_id=mentioned_id,
                source_type="note",
                source_id=note_id,
                source_name="Project Notes",
                excerpt="We should ask @Mentioned User about this."
            )
            
            # Check notification was NOT created due to disabled preference
            assert notification is None
            
            # Check WebSocket notification was NOT sent
            assert not mock_send.called
    
    def test_cleanup_expired_notifications(self, db_session: Session) -> None:
        """Test cleaning up expired notifications"""
        # Create test tenant
        tenant_id = uuid.uuid4()
        tenant = Tenant(
            id=tenant_id,
            name="Test Tenant",
            domain="test.example.com"
        )
        db_session.add(tenant)
        db_session.commit()
        
        # Create expired notification
        expired_notification = Notification(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            type="system",
            severity="info",
            title="Expired Notification",
            message="This notification has expired",
            expires_at=datetime(2020, 1, 1)  # Expired date
        )
        
        # Create active notification
        active_notification = Notification(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            type="system",
            severity="info",
            title="Active Notification",
            message="This notification is still active",
            expires_at=datetime(2099, 1, 1)  # Future date
        )
        
        # Create notification with no expiry
        no_expiry_notification = Notification(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            type="system",
            severity="info",
            title="No Expiry Notification",
            message="This notification has no expiry",
            expires_at=None
        )
        
        db_session.add_all([expired_notification, active_notification, no_expiry_notification])
        db_session.commit()
        
        # Run cleanup
        count = notification_service.cleanup_expired_notifications(
            db=db_session,
            tenant_id=tenant_id
        )
        
        # Check that only expired notification was removed
        assert count == 1
        
        # Check that expired notification is gone
        expired_check = db_session.query(Notification).filter(
            Notification.id == expired_notification.id
        ).first()
        assert expired_check is None
        
        # Check that other notifications still exist
        assert db_session.query(Notification).filter(
            Notification.id == active_notification.id
        ).first() is not None
        
        assert db_session.query(Notification).filter(
            Notification.id == no_expiry_notification.id
        ).first() is not None