from uuid import uuid4

from sqlalchemy import Column, String, JSON, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID

from app.db.base_class import Base

class Edge(Base):
    """Directed property-graph edge."""
    __tablename__ = "edges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    src = Column(UUID(as_uuid=True), nullable=False, index=True)
    dst = Column(UUID(as_uuid=True), nullable=False, index=True)
    label = Column(String, nullable=False, index=True)
    props = Column(JSON, nullable=True)

    __table_args__ = (
        Index("ix_edges_src", "tenant_id", "src"),
        Index("ix_edges_dst", "tenant_id", "dst"),
        Index("ix_edges_label", "tenant_id", "label"),
    )

    def __repr__(self):
        return f"<Edge {self.src}->{self.dst} ({self.label})>" 