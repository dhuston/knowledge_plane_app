from uuid import uuid4
import logging
import os
import sys
import subprocess

logger = logging.getLogger(__name__)

# Enhanced diagnostic logging for dependency issues
logger.info("Python version: %s", sys.version)
logger.info("Python executable: %s", sys.executable)
logger.info("Python path: %s", sys.path)
logger.info("Environment: %s", {k: v for k, v in os.environ.items() if k.startswith(("PYTHONPATH", "PATH", "LD_LIBRARY"))})

# Check if geoalchemy2 is installed
try:
    import pkg_resources
    installed_packages = {pkg.key: pkg.version for pkg in pkg_resources.working_set}
    spatial_packages = {k: v for k, v in installed_packages.items() if k in ['geoalchemy2', 'sqlalchemy', 'shapely', 'pygeos', 'gdal']}
    logger.info("Installed spatial packages: %s", spatial_packages)
    
    if 'geoalchemy2' not in spatial_packages:
        logger.error("GeoAlchemy2 package is not installed")
        
        # Check if pip finds the package
        try:
            pip_result = subprocess.run(
                [sys.executable, "-m", "pip", "show", "geoalchemy2"],
                capture_output=True,
                text=True
            )
            if pip_result.returncode == 0:
                logger.info(f"GeoAlchemy2 is installed but not detected by pkg_resources: \n{pip_result.stdout}")
            else:
                logger.error(f"GeoAlchemy2 not found by pip: \n{pip_result.stderr}")
        except Exception as pip_err:
            logger.error(f"Error checking pip for geoalchemy2: {pip_err}")
            
        # Check the actual python path for the package
        try:
            for path in sys.path:
                if os.path.exists(os.path.join(path, "geoalchemy2")):
                    logger.info(f"Found geoalchemy2 directory at {os.path.join(path, 'geoalchemy2')}")
        except Exception as path_err:
            logger.error(f"Error checking path for geoalchemy2: {path_err}")
except Exception as e:
    logger.error(f"Error checking installed packages: {str(e)}")

# Check if system libraries are available
try:
    # Find shared libraries
    try:
        ldd_output = subprocess.check_output("ldconfig -p | grep -E 'libgeos|libproj|libgdal'", shell=True).decode()
        logger.info("Available system libraries: %s", ldd_output.strip())
    except subprocess.CalledProcessError as e:
        logger.warning(f"Could not check system libraries: {str(e)}")
    
    # Alternative: Check if ctypes can load them
    try:
        import ctypes
        for lib_name in ["libgeos_c.so", "libproj.so", "libgdal.so"]:
            try:
                lib = ctypes.cdll.LoadLibrary(lib_name)
                logger.info(f"Successfully loaded system library: {lib_name}")
            except Exception as e:
                logger.warning(f"Failed to load system library {lib_name}: {str(e)}")
    except Exception as e:
        logger.error(f"Error checking system libraries with ctypes: {str(e)}")
except Exception as e:
    logger.error(f"Error running system checks: {str(e)}")

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