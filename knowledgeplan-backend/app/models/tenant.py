import uuid
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True, nullable=False)
    domain = Column(String, unique=True, index=True, nullable=True) # e.g., company.com
    sso_config = Column(JSON, nullable=True) # Store SSO provider details
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship to Teams (One-to-Many)
    teams = relationship("Team", back_populates="tenant", cascade="all, delete-orphan")

    # Relationship to Users (One-to-Many)
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")

    # Relationships can be added later (e.g., users = relationship("User", back_populates="tenant")) 