import uuid
from datetime import datetime, date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Integer, Date, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base
from app.schemas.goal import GoalTypeEnum # Import the enum

if TYPE_CHECKING:
    from .tenant import Tenant  # noqa: F401
    from .project import Project # noqa: F401
    # from .user import User # noqa: F401 # If goals can be assigned to users


class Goal(Base):
    __tablename__ = "goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    type = Column(Enum(GoalTypeEnum), nullable=False, index=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("goals.id"), nullable=True, index=True)
    status = Column(String(50), nullable=True, default="on_track")
    progress = Column(Integer, nullable=True, default=0)
    due_date = Column(Date, nullable=True)
    properties = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tenant = relationship("Tenant") # Simplified relationship for now

    # Self-referential relationship for hierarchy
    parent = relationship("Goal", remote_side=[id], back_populates="children")
    children = relationship("Goal", back_populates="parent", cascade="all, delete-orphan")

    # Relationship to projects aligned with this goal
    projects = relationship("Project", back_populates="goal")

    def __repr__(self):
        return f"<Goal(id={self.id}, title='{self.title}', tenant_id={self.tenant_id})>"

# Add back-population to Project model:
# goal = relationship("Goal", back_populates="projects")
# goal_id = Column(UUID(as_uuid=True), ForeignKey("goals.id"), nullable=True, index=True) 