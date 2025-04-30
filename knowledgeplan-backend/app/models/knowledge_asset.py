import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base
from app.schemas.knowledge_asset import KnowledgeAssetTypeEnum

if TYPE_CHECKING:
    from .tenant import Tenant  # noqa: F401
    from .project import Project # noqa: F401
    from .user import User # noqa: F401


class KnowledgeAsset(Base):
    __tablename__ = "knowledge_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    title = Column(String(255), nullable=True, index=True)
    type = Column(Enum(KnowledgeAssetTypeEnum), nullable=False, index=True)
    source = Column(String(100), nullable=True)
    link = Column(Text, nullable=True) # Use Text for potentially long URLs
    content = Column(Text, nullable=True) # For native notes
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True, index=True)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    properties = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tenant = relationship("Tenant") # Simplified
    project = relationship("Project", back_populates="notes")
    created_by = relationship("User") # Simplified

    def __repr__(self):
        return f"<KnowledgeAsset(id={self.id}, type='{self.type}', tenant_id={self.tenant_id})>"

# Add back-population to Project model:
# notes = relationship("KnowledgeAsset", back_populates="project", cascade="all, delete-orphan") 