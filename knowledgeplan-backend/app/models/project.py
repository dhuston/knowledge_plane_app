import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from .tenant import Tenant  # noqa: F401
    from .team import Team  # noqa: F401
    from .goal import Goal # noqa: F401 # Added Goal
    from .knowledge_asset import KnowledgeAsset # noqa: F401
    from .user import User # noqa: F401 # Uncomment User import

# Define Association Table for Project <-> User (Participants)
project_participants = Table(
    "project_participants",
    Base.metadata,
    Column("project_id", UUID(as_uuid=True), ForeignKey("projects.id"), primary_key=True),
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True),
)

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=True, default="active")
    owning_team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True, index=True)
    goal_id = Column(UUID(as_uuid=True), ForeignKey("goals.id"), nullable=True, index=True) # Added goal relationship
    properties = Column(JSON, nullable=True)  # For flexible attributes (budget, risk, etc.)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="projects")
    owner_team = relationship("Team", back_populates="owned_projects")
    goal = relationship("Goal", back_populates="projects") # Added goal relationship
    notes = relationship("KnowledgeAsset", back_populates="project", cascade="all, delete-orphan")

    # Uncomment and define participants relationship
    participants = relationship(
        "User",
        secondary=project_participants,
        back_populates="projects"
    )

    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}', tenant_id={self.tenant_id})>"

# Add back-population to Tenant model:
# projects = relationship("Project", back_populates="tenant", cascade="all, delete-orphan")

# Add back-population to Team model:
# owned_projects = relationship("Project", back_populates="owner_team")

# Define ProjectParticipants association table later if needed - REMOVED OLD COMMENTED CLASS
# class ProjectParticipants(Base):
#     __tablename__ = 'project_participants'
#     project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), primary_key=True)
#     user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True) 