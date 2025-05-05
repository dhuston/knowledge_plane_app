import uuid
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from typing import TYPE_CHECKING
from app.db.base_class import Base
from .project import project_participants # Assuming project.py is where it's defined

if TYPE_CHECKING:
    from .tenant import Tenant  # noqa: F401
    from .notification import NotificationRecipient  # noqa: F401

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    online_status = Column(Boolean(), default=False)
    is_admin = Column(Boolean(), default=False, index=True)

    # Authentication
    auth_provider = Column(String, nullable=True) # e.g., 'google', 'microsoft', 'password'
    auth_provider_id = Column(String, unique=True, index=True, nullable=True) # ID from provider
    hashed_password = Column(Text, nullable=True) # For password-based authentication
    password_reset_token = Column(String, nullable=True) # For password resets
    password_reset_expires = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True) # Self-referencing FK
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True) # Link to team (Could be FK later if teams are in DB)
    
    # OAuth Tokens (Store securely later!)
    google_access_token = Column(Text, nullable=True) # TODO: Encrypt this
    google_refresh_token = Column(Text, nullable=True) # TODO: Encrypt this
    google_token_expiry = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Define relationships (optional but useful)
    tenant = relationship("Tenant", back_populates="users")
    manager = relationship("User", remote_side=[id], back_populates="direct_reports")
    direct_reports = relationship("User", back_populates="manager")
    team = relationship("Team", back_populates="members", foreign_keys=[team_id])
    
    # Add relationship to projects via association table
    projects = relationship(
        "Project",
        secondary=project_participants,
        back_populates="participants"
    )
    
    # Add relationship to notifications
    notifications = relationship("NotificationRecipient", back_populates="user")
    notification_preferences = relationship("NotificationPreference", back_populates="user")

    def __repr__(self):
        # Ensure correct indentation
        return f"<User(id={self.id}, email='{self.email}')>" # Use existing repr content