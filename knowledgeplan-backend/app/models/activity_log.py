import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base_class import Base

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True) # Nullable if system action
    action = Column(String, nullable=False, index=True) # E.g., "CREATE_PROJECT", "VIEW_NOTE", "UPDATE_GOAL"
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    target_entity_type = Column(String, nullable=True, index=True) # E.g., "Project", "Note", "User"
    target_entity_id = Column(String, nullable=True, index=True) # Can store UUID or other ID as string
    details = Column(JSON, nullable=True) # Store additional context if needed

    tenant = relationship("Tenant")
    user = relationship("User") 