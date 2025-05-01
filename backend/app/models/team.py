import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base
from app.models.user import User # Import User directly for foreign_keys

if TYPE_CHECKING:
    from .tenant import Tenant  # noqa: F401
    # from .user import User  # No longer needed here
    from .project import Project # noqa: F401
    from .department import Department # noqa: F401 # Uncommented


class Team(Base):
    __tablename__ = "teams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True, index=True) # Changed from dept_id

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="teams")
    lead = relationship("User", foreign_keys=[lead_id]) # One-to-one with lead user? Or just FK?
    members = relationship("User", back_populates="team", foreign_keys="User.team_id")
    owned_projects = relationship("Project", back_populates="owner_team") # One-to-many: Team owns many Projects
    department = relationship("Department", back_populates="teams") # Uncommented

    def __repr__(self):
        return f"<Team(id={self.id}, name='{self.name}', tenant_id={self.tenant_id})>" 