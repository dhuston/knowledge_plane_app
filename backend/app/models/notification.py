import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class Notification(Base):
    """
    Notification model for storing system notifications.
    
    Notifications can be linked to specific entities (users, teams, projects, etc.)
    and have various types and severities.
    """
    __tablename__ = "notifications"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID, ForeignKey("tenants.id"), nullable=False)
    
    # Notification classification
    type = Column(String(50), nullable=False)  # activity, insight, reminder, system, mention, relationship
    severity = Column(String(20), nullable=False)  # info, warning, critical
    
    # Notification content
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    
    # Related entity (optional)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(UUID, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    
    # Action link (optional)
    action_url = Column(String(500), nullable=True)
    
    # Relationships
    recipients = relationship("NotificationRecipient", back_populates="notification", cascade="all, delete")
    
    # Tenant relationship
    tenant = relationship("Tenant", back_populates="notifications")


class NotificationRecipient(Base):
    """
    Tracks notification delivery to specific users and their interaction with the notification.
    
    A notification can be sent to multiple users, and this model tracks which users
    have received, read, and dismissed each notification.
    """
    __tablename__ = "notification_recipients"

    notification_id = Column(UUID, ForeignKey("notifications.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(UUID, ForeignKey("users.id"), primary_key=True)
    
    # Interaction tracking
    read_at = Column(DateTime, nullable=True)
    dismissed_at = Column(DateTime, nullable=True)
    
    # Relationships
    notification = relationship("Notification", back_populates="recipients")
    user = relationship("User", back_populates="notifications")


class NotificationPreference(Base):
    """
    Stores user preferences for different notification types.
    
    Users can control which notifications they receive and through which channels
    (in-app, email, etc.) based on notification type.
    """
    __tablename__ = "notification_preferences"
    
    user_id = Column(UUID, ForeignKey("users.id"), primary_key=True)
    notification_type = Column(String(50), primary_key=True)
    
    # Preference settings
    enabled = Column(Boolean, default=True, nullable=False)
    email_enabled = Column(Boolean, default=False, nullable=False)
    
    # Relationship
    user = relationship("User", back_populates="notification_preferences")