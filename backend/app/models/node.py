from uuid import uuid4

from sqlalchemy import Column, String, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.db.base_class import Base

class Node(Base):
    """Generic graph node record (property-graph style)."""
    __tablename__ = "nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    type = Column(String, nullable=False, index=True)
    props = Column(JSON, nullable=True)

    def __repr__(self):
        return f"<Node {self.id} ({self.type})>" 