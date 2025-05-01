import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


# Base schemas for notification
class NotificationBase(BaseModel):
    """Base schema for notification data."""
    type: str
    severity: str
    title: str
    message: str
    entity_type: Optional[str] = None
    entity_id: Optional[uuid.UUID] = None
    action_url: Optional[str] = None
    expires_at: Optional[datetime] = None


class NotificationCreate(NotificationBase):
    """Schema for creating a new notification."""
    pass


class NotificationUpdate(BaseModel):
    """Schema for updating an existing notification."""
    type: Optional[str] = None
    severity: Optional[str] = None
    title: Optional[str] = None
    message: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[uuid.UUID] = None
    action_url: Optional[str] = None
    expires_at: Optional[datetime] = None


class NotificationInDB(NotificationBase):
    """Schema for notification as stored in the database."""
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime

    class Config:
        orm_mode = True


# Base schemas for notification recipient
class NotificationRecipientBase(BaseModel):
    """Base schema for notification recipient data."""
    notification_id: uuid.UUID
    user_id: uuid.UUID


class NotificationRecipientCreate(NotificationRecipientBase):
    """Schema for creating a new notification recipient."""
    pass


class NotificationRecipientUpdate(BaseModel):
    """Schema for updating notification recipient status."""
    read_at: Optional[datetime] = None
    dismissed_at: Optional[datetime] = None


class NotificationRecipientInDB(NotificationRecipientBase):
    """Schema for notification recipient as stored in the database."""
    read_at: Optional[datetime] = None
    dismissed_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# Base schemas for notification preference
class NotificationPreferenceBase(BaseModel):
    """Base schema for notification preference data."""
    notification_type: str
    enabled: bool
    email_enabled: bool


class NotificationPreferenceCreate(NotificationPreferenceBase):
    """Schema for creating a new notification preference."""
    pass


class NotificationPreferenceUpdate(BaseModel):
    """Schema for updating notification preferences."""
    enabled: Optional[bool] = None
    email_enabled: Optional[bool] = None


class NotificationPreferenceInDB(NotificationPreferenceBase):
    """Schema for notification preference as stored in the database."""
    user_id: uuid.UUID

    class Config:
        orm_mode = True


# Public response schemas
class NotificationResponse(NotificationInDB):
    """Schema for returning notification data to the client."""
    read_at: Optional[datetime] = None
    dismissed_at: Optional[datetime] = None


class NotificationPreferenceResponse(NotificationPreferenceInDB):
    """Schema for returning notification preference data to the client."""
    pass


class UserNotificationSettings(BaseModel):
    """User's complete notification settings."""
    preferences: List[NotificationPreferenceResponse]