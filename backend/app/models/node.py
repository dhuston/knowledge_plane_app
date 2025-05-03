from uuid import uuid4
import logging

logger = logging.getLogger(__name__)

from sqlalchemy import Column, String, JSON, ForeignKey, Float, Index
from sqlalchemy.dialects.postgresql import UUID

try:
    logger.info("Attempting to import GeoAlchemy2...")
    from geoalchemy2 import Geometry
    logger.info("GeoAlchemy2 imported successfully")
except ImportError as e:
    logger.error(f"Error importing GeoAlchemy2: {str(e)}")
    raise

from app.db.base_class import Base

class Node(Base):
    """Generic graph node record (property-graph style)."""
    __tablename__ = "nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    type = Column(String, nullable=False, index=True)
    props = Column(JSON, nullable=True)
    
    # Spatial coordinates
    x = Column(Float, nullable=True)
    y = Column(Float, nullable=True)
    # Spatial point geometry (automatically updated by trigger)
    position = Column(Geometry('POINT', srid=4326), nullable=True)

    __table_args__ = (
        # Add composite index on x,y for faster 2D queries
        Index("ix_nodes_xy", "x", "y"),
    )
    
    def __repr__(self):
        coords = f", pos=({self.x},{self.y})" if self.x is not None and self.y is not None else ""
        return f"<Node {self.id} ({self.type}){coords}>" 