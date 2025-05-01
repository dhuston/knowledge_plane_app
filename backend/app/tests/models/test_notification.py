import uuid
from datetime import datetime, timedelta

import pytest
from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationRecipient, NotificationPreference
from app.models.user import User
from app.models.tenant import Tenant


class TestNotificationModel:
    """Test suite for the Notification model"""

    def test_create_notification(self, db_session: Session) -> None:
        """Test notification creation with valid data"""
        # Create a tenant for the notification
        tenant = Tenant(
            id=uuid.uuid4(),
            name="Test Tenant",
            domain="test.example.com"
        )
        db_session.add(tenant)
        db_session.flush()

        # Create a notification with required fields
        notification_id = uuid.uuid4()
        notification = Notification(
            id=notification_id,
            tenant_id=tenant.id,
            type="activity",
            severity="info",
            title="Test Notification",
            message="This is a test notification message"
        )
        db_session.add(notification)
        db_session.commit()
        
        # Retrieve the notification and verify fields
        saved_notification = db_session.query(Notification).filter(Notification.id == notification_id).first()
        assert saved_notification is not None
        assert saved_notification.tenant_id == tenant.id
        assert saved_notification.type == "activity"
        assert saved_notification.severity == "info"
        assert saved_notification.title == "Test Notification"
        assert saved_notification.message == "This is a test notification message"
        assert saved_notification.created_at is not None
        assert saved_notification.expires_at is None
        assert saved_notification.entity_type is None
        assert saved_notification.entity_id is None
        assert saved_notification.action_url is None

    def test_notification_with_entity(self, db_session: Session) -> None:
        """Test notification with associated entity"""
        # Create tenant
        tenant = Tenant(id=uuid.uuid4(), name="Test Tenant", domain="test.example.com")
        db_session.add(tenant)
        db_session.flush()
        
        # Create a notification with entity reference
        notification = Notification(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            type="insight",
            severity="warning",
            title="Entity Test",
            message="Notification with entity reference",
            entity_type="project",
            entity_id=uuid.uuid4()
        )
        db_session.add(notification)
        db_session.commit()
        
        # Retrieve and verify
        saved = db_session.query(Notification).filter(Notification.title == "Entity Test").first()
        assert saved.entity_type == "project"
        assert isinstance(saved.entity_id, uuid.UUID)

    def test_notification_expiry(self, db_session: Session) -> None:
        """Test notification with expiry date"""
        # Create tenant
        tenant = Tenant(id=uuid.uuid4(), name="Test Tenant", domain="test.example.com")
        db_session.add(tenant)
        db_session.flush()
        
        # Set expiry date for tomorrow
        expires_at = datetime.utcnow() + timedelta(days=1)
        
        # Create notification with expiry
        notification = Notification(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            type="system",
            severity="info",
            title="Expiring Notification",
            message="This notification will expire",
            expires_at=expires_at
        )
        db_session.add(notification)
        db_session.commit()
        
        # Verify expiry date was saved correctly
        saved = db_session.query(Notification).filter(Notification.title == "Expiring Notification").first()
        assert saved.expires_at is not None
        assert abs((saved.expires_at - expires_at).total_seconds()) < 1  # Allow for small DB rounding differences

    def test_notification_with_action_url(self, db_session: Session) -> None:
        """Test notification with action URL"""
        # Create tenant
        tenant = Tenant(id=uuid.uuid4(), name="Test Tenant", domain="test.example.com")
        db_session.add(tenant)
        db_session.flush()
        
        # Create notification with action URL
        notification = Notification(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            type="activity",
            severity="info",
            title="Action URL Test",
            message="This notification has an action URL",
            action_url="/projects/123"
        )
        db_session.add(notification)
        db_session.commit()
        
        # Verify action URL
        saved = db_session.query(Notification).filter(Notification.title == "Action URL Test").first()
        assert saved.action_url == "/projects/123"


class TestNotificationRecipientModel:
    """Test suite for the NotificationRecipient model"""

    def test_create_notification_recipient(self, db_session: Session) -> None:
        """Test creating notification recipients"""
        # Create tenant
        tenant = Tenant(id=uuid.uuid4(), name="Test Tenant", domain="test.example.com")
        db_session.add(tenant)
        db_session.flush()
        
        # Create users
        user1 = User(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            email="user1@example.com",
            hashed_password="notarealhash",
            full_name="Test User 1"
        )
        user2 = User(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            email="user2@example.com",
            hashed_password="notarealhash",
            full_name="Test User 2" 
        )
        db_session.add_all([user1, user2])
        db_session.flush()
        
        # Create notification
        notification = Notification(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            type="activity",
            severity="info",
            title="Multi-recipient Test",
            message="This notification goes to multiple users"
        )
        db_session.add(notification)
        db_session.flush()
        
        # Create recipients
        recipient1 = NotificationRecipient(
            notification_id=notification.id,
            user_id=user1.id
        )
        recipient2 = NotificationRecipient(
            notification_id=notification.id,
            user_id=user2.id,
            read_at=datetime.utcnow()  # Second user has already read it
        )
        db_session.add_all([recipient1, recipient2])
        db_session.commit()
        
        # Verify recipients
        recipients = db_session.query(NotificationRecipient).filter(
            NotificationRecipient.notification_id == notification.id
        ).all()
        
        assert len(recipients) == 2
        
        # Find user1's notification
        user1_recipient = next((r for r in recipients if r.user_id == user1.id), None)
        assert user1_recipient is not None
        assert user1_recipient.read_at is None
        assert user1_recipient.dismissed_at is None
        
        # Find user2's notification
        user2_recipient = next((r for r in recipients if r.user_id == user2.id), None)
        assert user2_recipient is not None
        assert user2_recipient.read_at is not None
        assert user2_recipient.dismissed_at is None

    def test_mark_notification_read(self, db_session: Session) -> None:
        """Test marking a notification as read"""
        # Create tenant
        tenant = Tenant(id=uuid.uuid4(), name="Test Tenant", domain="test.example.com")
        db_session.add(tenant)
        db_session.flush()
        
        # Create user
        user = User(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            email="user@example.com",
            hashed_password="notarealhash",
            full_name="Test User"
        )
        db_session.add(user)
        db_session.flush()
        
        # Create notification
        notification = Notification(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            type="activity",
            severity="info",
            title="Read Status Test",
            message="Testing read status updates"
        )
        db_session.add(notification)
        db_session.flush()
        
        # Create recipient
        recipient = NotificationRecipient(
            notification_id=notification.id,
            user_id=user.id
        )
        db_session.add(recipient)
        db_session.flush()
        
        # Verify initially unread
        saved = db_session.query(NotificationRecipient).filter(
            NotificationRecipient.notification_id == notification.id,
            NotificationRecipient.user_id == user.id
        ).first()
        assert saved.read_at is None
        
        # Mark as read
        now = datetime.utcnow()
        saved.read_at = now
        db_session.commit()
        
        # Verify read status
        updated = db_session.query(NotificationRecipient).filter(
            NotificationRecipient.notification_id == notification.id,
            NotificationRecipient.user_id == user.id
        ).first()
        assert updated.read_at is not None
        assert abs((updated.read_at - now).total_seconds()) < 1

    def test_dismiss_notification(self, db_session: Session) -> None:
        """Test dismissing a notification"""
        # Create tenant
        tenant = Tenant(id=uuid.uuid4(), name="Test Tenant", domain="test.example.com")
        db_session.add(tenant)
        db_session.flush()
        
        # Create user
        user = User(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            email="user@example.com",
            hashed_password="notarealhash",
            full_name="Test User"
        )
        db_session.add(user)
        db_session.flush()
        
        # Create notification
        notification = Notification(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            type="activity",
            severity="info",
            title="Dismiss Test",
            message="Testing notification dismissal"
        )
        db_session.add(notification)
        db_session.flush()
        
        # Create recipient
        recipient = NotificationRecipient(
            notification_id=notification.id,
            user_id=user.id
        )
        db_session.add(recipient)
        db_session.flush()
        
        # Verify initially not dismissed
        saved = db_session.query(NotificationRecipient).filter(
            NotificationRecipient.notification_id == notification.id,
            NotificationRecipient.user_id == user.id
        ).first()
        assert saved.dismissed_at is None
        
        # Dismiss notification
        now = datetime.utcnow()
        saved.dismissed_at = now
        db_session.commit()
        
        # Verify dismissed status
        updated = db_session.query(NotificationRecipient).filter(
            NotificationRecipient.notification_id == notification.id,
            NotificationRecipient.user_id == user.id
        ).first()
        assert updated.dismissed_at is not None
        assert abs((updated.dismissed_at - now).total_seconds()) < 1


class TestNotificationPreferenceModel:
    """Test suite for the NotificationPreference model"""

    def test_create_notification_preferences(self, db_session: Session) -> None:
        """Test creating notification preferences"""
        # Create tenant
        tenant = Tenant(id=uuid.uuid4(), name="Test Tenant", domain="test.example.com")
        db_session.add(tenant)
        db_session.flush()
        
        # Create user
        user = User(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            email="user@example.com",
            hashed_password="notarealhash",
            full_name="Test User"
        )
        db_session.add(user)
        db_session.flush()
        
        # Create preferences for different notification types
        activity_pref = NotificationPreference(
            user_id=user.id,
            notification_type="activity",
            enabled=True,
            email_enabled=False
        )
        
        insight_pref = NotificationPreference(
            user_id=user.id,
            notification_type="insight", 
            enabled=True,
            email_enabled=True
        )
        
        system_pref = NotificationPreference(
            user_id=user.id,
            notification_type="system",
            enabled=False,
            email_enabled=False
        )
        
        db_session.add_all([activity_pref, insight_pref, system_pref])
        db_session.commit()
        
        # Verify preferences saved correctly
        prefs = db_session.query(NotificationPreference).filter(
            NotificationPreference.user_id == user.id
        ).all()
        
        assert len(prefs) == 3
        
        activity = next((p for p in prefs if p.notification_type == "activity"), None)
        assert activity is not None
        assert activity.enabled is True
        assert activity.email_enabled is False
        
        insight = next((p for p in prefs if p.notification_type == "insight"), None)
        assert insight is not None
        assert insight.enabled is True
        assert insight.email_enabled is True
        
        system = next((p for p in prefs if p.notification_type == "system"), None)
        assert system is not None
        assert system.enabled is False
        assert system.email_enabled is False

    def test_update_notification_preferences(self, db_session: Session) -> None:
        """Test updating notification preferences"""
        # Create tenant
        tenant = Tenant(id=uuid.uuid4(), name="Test Tenant", domain="test.example.com")
        db_session.add(tenant)
        db_session.flush()
        
        # Create user
        user = User(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            email="user@example.com",
            hashed_password="notarealhash",
            full_name="Test User"
        )
        db_session.add(user)
        db_session.flush()
        
        # Create preference
        pref = NotificationPreference(
            user_id=user.id,
            notification_type="activity",
            enabled=True,
            email_enabled=False
        )
        db_session.add(pref)
        db_session.commit()
        
        # Get preference and update it
        saved_pref = db_session.query(NotificationPreference).filter(
            NotificationPreference.user_id == user.id,
            NotificationPreference.notification_type == "activity"
        ).first()
        
        saved_pref.enabled = False
        saved_pref.email_enabled = True
        db_session.commit()
        
        # Verify updates
        updated_pref = db_session.query(NotificationPreference).filter(
            NotificationPreference.user_id == user.id,
            NotificationPreference.notification_type == "activity"
        ).first()
        
        assert updated_pref.enabled is False
        assert updated_pref.email_enabled is True