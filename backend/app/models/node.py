from uuid import uuid4
import logging
import os

logger = logging.getLogger(__name__)

from sqlalchemy import Column, String, JSON, ForeignKey, Float, Index
from sqlalchemy.dialects.postgresql import UUID

# Check if we want to use spatial features or run in compatibility mode
USE_SPATIAL = os.environ.get("USE_SPATIAL_FEATURES", "true").lower() in ("true", "1", "yes")
GEOMETRY_AVAILABLE = False

try:
    logger.info("Attempting to import GeoAlchemy2...")
    from geoalchemy2 import Geometry
    logger.info("GeoAlchemy2 imported successfully")
    GEOMETRY_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Error importing GeoAlchemy2: {str(e)}")
    logger.warning("Spatial features will be disabled - the position column will not be available")
    
    # Create a dummy Geometry class that just returns None
    class DummyGeometry:
        def __call__(self, *args, **kwargs):
            return None
    
    # Use our dummy implementation if the real one isn't available
    if USE_SPATIAL:
        logger.error("Spatial features requested but GeoAlchemy2 not available. Aborting startup.")
        raise ImportError(f"GeoAlchemy2 required but not available: {str(e)}")
    else:
        Geometry = DummyGeometry()

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
    
    # Use conditional logic to create the full table definition
    if GEOMETRY_AVAILABLE:
        # Spatial point geometry (automatically updated by trigger)
        position = Column(Geometry('POINT', srid=4326), nullable=True)
        logger.info("Node model configured with spatial geometry column")
    else:
        logger.warning("Node model configured WITHOUT spatial geometry column")

    __table_args__ = (
        # Add composite index on x,y for faster 2D queries
        Index("ix_nodes_xy", "x", "y"),
    )
    
    def __repr__(self):
        coords = f", pos=({self.x},{self.y})" if self.x is not None and self.y is not None else ""
        return f"<Node {self.id} ({self.type}){coords}>" 