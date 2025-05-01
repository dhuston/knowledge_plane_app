import uuid
from datetime import datetime, timedelta
from typing import Dict

import pytest
from fastapi.testclient import TestClient

from app.models.notification import Notification, NotificationRecipient, NotificationPreference
from app.models.user import User
from app.models.tenant import Tenant
from app.core.config import settings


class TestNotificationsAPI:
    """Tests for the notifications endpoints."""

    def test_get_notifications(self, client: TestClient, superuser_token_headers: Dict[str, str], db_session) -> None:
        """Test retrieving user's notifications."""
        # Create test tenant
        tenant = Tenant(
            id=uuid.uuid4(),
            name="Test Tenant",
            domain="test.example.com"
        )
        db_session.add(tenant)
        db_session.commit()
        
        # Create test user (superuser)
        superuser_id = uuid.UUID(settings.FIRST_SUPERUSER_ID)
        superuser = db_session.query(User).filter(User.id == superuser_id).first()
        
        if not superuser:
            superuser = User(
                id=superuser_id,
                tenant_id=tenant.id,
                email=settings.FIRST_SUPERUSER,
                hashed_password="dummy_hashed_password",
                is_superuser=True,
                full_name="Super User"
            )
            db_session.add(superuser)
            db_session.flush()
        
        # Create test notifications
        notification1 = Notification(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            type="system",
            severity="info",
            title="Test Notification 1",
            message="This is test notification 1"
        )
        
        notification2 = Notification(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            type="activity",
            severity="warning",
            title="Test Notification 2",
            message="This is test notification 2"
        )
        
        db_session.add_all([notification1, notification2])
        db_session.flush()
        
        # Create notification recipients
        recipient1 = NotificationRecipient(
            notification_id=notification1.id,
            user_id=superuser.id
        )
        
        recipient2 = NotificationRecipient(
            notification_id=notification2.id,
            user_id=superuser.id
        )
        
        db_session.add_all([recipient1, recipient2])
        db_session.commit()
        
        # Make API request
        response = client.get(
            f"{settings.API_V1_STR}/notifications/",
            headers=superuser_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response data
        assert isinstance(data, list)
        assert len(data) == 2
        
        # Check notification fields
        notification_ids = [n["id"] for n in data]
        assert str(notification1.id) in notification_ids
        assert str(notification2.id) in notification_ids
        
        # Check that notifications have correct properties
        for notification in data:
            assert "id" in notification
            assert "type" in notification
            assert "severity" in notification
            assert "title" in notification
            assert "message" in notification
            assert "created_at" in notification
            assert "read_at" in notification  # Should be included but null
            assert notification["read_at"] is None  # Should be unread

    def test_mark_notification_as_read(self, client: TestClient, superuser_token_headers: Dict[str, str], db_session) -> None:
        """Test marking a notification as read."""
        # Create test tenant
        tenant = Tenant(
            id=uuid.uuid4(),
            name="Test Tenant",
            domain="test.example.com"
        )
        db_session.add(tenant)
        db_session.commit()
        
        # Get or create superuser
        superuser_id = uuid.UUID(settings.FIRST_SUPERUSER_ID)
        superuser = db_session.query(User).filter(User.id == superuser_id).first()
        
        if not superuser:
            superuser = User(
                id=superuser_id,
                tenant_id=tenant.id,
                email=settings.FIRST_SUPERUSER,
                hashed_password="dummy_hashed_password",
                is_superuser=True,
                full_name="Super User"
            )
            db_session.add(superuser)
            db_session.flush()
        
        # Create test notification
        notification_id = uuid.uuid4()
        notification = Notification(
            id=notification_id,
            tenant_id=tenant.id,
            type="system",
            severity="info",
            title="Read Test",
            message="This notification should be marked as read"
        )
        db_session.add(notification)
        db_session.flush()
        
        # Create notification recipient
        recipient = NotificationRecipient(
            notification_id=notification.id,
            user_id=superuser.id
        )
        db_session.add(recipient)
        db_session.commit()
        
        # Make API request to mark as read
        response = client.patch(
            f"{settings.API_V1_STR}/notifications/{notification_id}/read",
            headers=superuser_token_headers
        )
        
        assert response.status_code == 200
        
        # Verify notification is marked as read in database
        updated_recipient = db_session.query(NotificationRecipient).filter(
            NotificationRecipient.notification_id == notification_id,
            NotificationRecipient.user_id == superuser.id
        ).first()
        
        assert updated_recipient is not None
        assert updated_recipient.read_at is not None
    
    def test_dismiss_notification(self, client: TestClient, superuser_token_headers: Dict[str, str], db_session) -> None:
        """Test dismissing a notification."""
        # Create test tenant
        tenant = Tenant(
            id=uuid.uuid4(),
            name="Test Tenant",
            domain="test.example.com"
        )
        db_session.add(tenant)
        db_session.commit()
        
        # Get or create superuser
        superuser_id = uuid.UUID(settings.FIRST_SUPERUSER_ID)
        superuser = db_session.query(User).filter(User.id == superuser_id).first()
        
        if not superuser:
            superuser = User(
                id=superuser_id,
                tenant_id=tenant.id,
                email=settings.FIRST_SUPERUSER,
                hashed_password="dummy_hashed_password",
                is_superuser=True,
                full_name="Super User"
            )
            db_session.add(superuser)
            db_session.flush()
        
        # Create test notification
        notification_id = uuid.uuid4()
        notification = Notification(
            id=notification_id,
            tenant_id=tenant.id,
            type="system",
            severity="info",
            title="Dismiss Test",
            message="This notification should be dismissed"
        )
        db_session.add(notification)
        db_session.flush()
        
        # Create notification recipient
        recipient = NotificationRecipient(
            notification_id=notification.id,
            user_id=superuser.id
        )
        db_session.add(recipient)
        db_session.commit()
        
        # Make API request to dismiss
        response = client.delete(
            f"{settings.API_V1_STR}/notifications/{notification_id}",
            headers=superuser_token_headers
        )
        
        assert response.status_code == 200
        
        # Verify notification is dismissed in database
        updated_recipient = db_session.query(NotificationRecipient).filter(
            NotificationRecipient.notification_id == notification_id,
            NotificationRecipient.user_id == superuser.id
        ).first()
        
        assert updated_recipient is not None
        assert updated_recipient.dismissed_at is not None
    
    def test_mark_all_as_read(self, client: TestClient, superuser_token_headers: Dict[str, str], db_session) -> None:
        """Test marking all notifications as read."""
        # Create test tenant
        tenant = Tenant(
            id=uuid.uuid4(),
            name="Test Tenant",
            domain="test.example.com"
        )
        db_session.add(tenant)
        db_session.commit()
        
        # Get or create superuser
        superuser_id = uuid.UUID(settings.FIRST_SUPERUSER_ID)
        superuser = db_session.query(User).filter(User.id == superuser_id).first()
        
        if not superuser:
            superuser = User(
                id=superuser_id,
                tenant_id=tenant.id,
                email=settings.FIRST_SUPERUSER,
                hashed_password="dummy_hashed_password",
                is_superuser=True,
                full_name="Super User"
            )
            db_session.add(superuser)
            db_session.flush()
        
        # Create test notifications
        notification1 = Notification(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            type="system",
            severity="info",
            title="Batch Read Test 1",
            message="This notification should be marked as read in batch"
        )
        
        notification2 = Notification(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            type="activity",
            severity="warning",
            title="Batch Read Test 2",
            message="This notification should also be marked as read in batch"
        )
        
        db_session.add_all([notification1, notification2])
        db_session.flush()
        
        # Create notification recipients
        recipient1 = NotificationRecipient(
            notification_id=notification1.id,
            user_id=superuser.id
        )
        
        recipient2 = NotificationRecipient(
            notification_id=notification2.id,
            user_id=superuser.id
        )
        
        db_session.add_all([recipient1, recipient2])
        db_session.commit()
        
        # Make API request to mark all as read
        response = client.post(
            f"{settings.API_V1_STR}/notifications/read-all",
            headers=superuser_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 2
        
        # Verify notifications are marked as read in database
        recipients = db_session.query(NotificationRecipient).filter(
            NotificationRecipient.user_id == superuser.id
        ).all()
        
        assert len(recipients) == 2
        assert all(r.read_at is not None for r in recipients)
    
    def test_get_notification_preferences(self, client: TestClient, superuser_token_headers: Dict[str, str], db_session) -> None:
        """Test retrieving notification preferences."""
        # Create test tenant
        tenant = Tenant(
            id=uuid.uuid4(),
            name="Test Tenant",
            domain="test.example.com"
        )
        db_session.add(tenant)
        db_session.commit()
        
        # Get or create superuser
        superuser_id = uuid.UUID(settings.FIRST_SUPERUSER_ID)
        superuser = db_session.query(User).filter(User.id == superuser_id).first()
        
        if not superuser:
            superuser = User(
                id=superuser_id,
                tenant_id=tenant.id,
                email=settings.FIRST_SUPERUSER,
                hashed_password="dummy_hashed_password",
                is_superuser=True,
                full_name="Super User"
            )
            db_session.add(superuser)
            db_session.flush()
        
        # Create test preferences
        pref1 = NotificationPreference(
            user_id=superuser.id,
            notification_type="activity",
            enabled=True,
            email_enabled=False
        )
        
        pref2 = NotificationPreference(
            user_id=superuser.id,
            notification_type="system",
            enabled=False,
            email_enabled=False
        )
        
        db_session.add_all([pref1, pref2])
        db_session.commit()
        
        # Make API request
        response = client.get(
            f"{settings.API_V1_STR}/notifications/preferences",
            headers=superuser_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "preferences" in data
        preferences = data["preferences"]
        
        # Check that both preferences are returned
        assert len(preferences) >= 2  # May include default preferences
        
        # Find our specific preferences in the response
        activity_pref = next((p for p in preferences if p["notification_type"] == "activity"), None)
        system_pref = next((p for p in preferences if p["notification_type"] == "system"), None)
        
        assert activity_pref is not None
        assert system_pref is not None
        
        # Check preference values
        assert activity_pref["enabled"] is True
        assert activity_pref["email_enabled"] is False
        
        assert system_pref["enabled"] is False
        assert system_pref["email_enabled"] is False
    
    def test_update_notification_preferences(self, client: TestClient, superuser_token_headers: Dict[str, str], db_session) -> None:
        """Test updating notification preferences."""
        # Create test tenant
        tenant = Tenant(
            id=uuid.uuid4(),
            name="Test Tenant",
            domain="test.example.com"
        )
        db_session.add(tenant)
        db_session.commit()
        
        # Get or create superuser
        superuser_id = uuid.UUID(settings.FIRST_SUPERUSER_ID)
        superuser = db_session.query(User).filter(User.id == superuser_id).first()
        
        if not superuser:
            superuser = User(
                id=superuser_id,
                tenant_id=tenant.id,
                email=settings.FIRST_SUPERUSER,
                hashed_password="dummy_hashed_password",
                is_superuser=True,
                full_name="Super User"
            )
            db_session.add(superuser)
            db_session.flush()
        
        # Create test preference
        pref = NotificationPreference(
            user_id=superuser.id,
            notification_type="activity",
            enabled=True,
            email_enabled=False
        )
        
        db_session.add(pref)
        db_session.commit()
        
        # Make API request to update preferences
        response = client.put(
            f"{settings.API_V1_STR}/notifications/preferences",
            headers=superuser_token_headers,
            json={
                "notification_type": "activity",
                "enabled": False,
                "email_enabled": True
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check updated values in response
        assert data["notification_type"] == "activity"
        assert data["enabled"] is False
        assert data["email_enabled"] is True
        
        # Verify database was updated
        updated_pref = db_session.query(NotificationPreference).filter(
            NotificationPreference.user_id == superuser.id,
            NotificationPreference.notification_type == "activity"
        ).first()
        
        assert updated_pref is not None
        assert updated_pref.enabled is False
        assert updated_pref.email_enabled is True