import uuid
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .user import User  # noqa: F401
    from .project import Project # noqa: F401
    from .team import Team # noqa: F401
    from .department import Department # Add Department import for TYPE_CHECKING

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True, index=True)
    domain = Column(String(255), nullable=True, unique=True, index=True) # e.g., company.com
    sso_config = Column(JSON, nullable=True) # Store SSO provider details
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship to Teams (One-to-Many)
    teams = relationship("Team", back_populates="tenant", cascade="all, delete-orphan")

    # Relationship to Users (One-to-Many)
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")

    # Relationship to Projects (One-to-Many)
    projects = relationship("Project", back_populates="tenant", cascade="all, delete-orphan")

    # Relationship to Departments (One-to-Many) - ADDED
    departments = relationship("Department", back_populates="tenant", cascade="all, delete-orphan")

    # Relationships can be added later (e.g., users = relationship("User", back_populates="tenant")) 

    def __repr__(self):
        return f"<Tenant(id={self.id}, name='{self.name}')>" 