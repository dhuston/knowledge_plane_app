from typing import Any, Dict, List, Optional, Union, Tuple
from uuid import UUID, uuid4
import asyncio
import logging
import os

logger = logging.getLogger(__name__)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func

# Check if spatial features are enabled
USE_SPATIAL = os.environ.get("USE_SPATIAL_FEATURES", "true").lower() in ("true", "1", "yes")
GEOMETRY_AVAILABLE = False

try:
    logger.info("Attempting to import GeoAlchemy2 in crud_node...")
    from geoalchemy2 import Geometry
    from geoalchemy2.functions import ST_MakePoint, ST_SetSRID, ST_DWithin, ST_Distance, ST_AsGeoJSON
    GEOMETRY_AVAILABLE = True
    logger.info("GeoAlchemy2 imported successfully in crud_node")
except ImportError as e:
    logger.warning(f"Error importing GeoAlchemy2 in crud_node: {str(e)}")
    logger.warning("Spatial query functions will be disabled")
    
    # Create dummy functions that raise exceptions when called
    def dummy_function(*args, **kwargs):
        raise RuntimeError("Spatial features are disabled. Install geoalchemy2 and set USE_SPATIAL_FEATURES=true to enable.")
        
    # Create dummy class/functions
    ST_MakePoint = dummy_function
    ST_SetSRID = dummy_function
    ST_DWithin = dummy_function
    ST_Distance = dummy_function
    ST_AsGeoJSON = dummy_function
    
    if USE_SPATIAL:
        logger.error("Spatial features requested but GeoAlchemy2 not available. Spatial queries will fail.")
        # Don't raise error here to allow app to start, but operations will fail

from app.models.node import Node, GEOMETRY_AVAILABLE as NODE_GEOMETRY_AVAILABLE
from app.schemas import map as map_schemas

# Make sure we're consistent about geometry availability
GEOMETRY_AVAILABLE = GEOMETRY_AVAILABLE and NODE_GEOMETRY_AVAILABLE

class CRUDNode:
    async def create(self, db: AsyncSession, *, tenant_id: UUID, node_type: str, 
                     props: Optional[Dict[str, Any]] = None,
                     x: Optional[float] = None, 
                     y: Optional[float] = None) -> Node:
        """
        Create a new node, optionally with spatial coordinates.
        
        Args:
            db: Database session
            tenant_id: ID of the tenant
            node_type: Type of the node
            props: Optional properties dictionary
            x: Optional X coordinate
            y: Optional Y coordinate
            
        Returns:
            The created Node object
        """
        # Create node with coordinates if provided
        db_obj = Node(
            id=uuid4(), 
            tenant_id=tenant_id, 
            type=node_type, 
            props=props or {},
            x=x,
            y=y
        )
        
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)

        # emit delta event
        try:
            from app.core.kafka_producer import publish
            delta_data = {
                "type": "node_created",
                "node": {
                    "id": str(db_obj.id), 
                    "type": db_obj.type, 
                    "props": db_obj.props
                }
            }
            # Include position data if available
            if x is not None and y is not None:
                delta_data["node"]["position"] = {"x": x, "y": y}
                
            asyncio.create_task(publish("graph-delta", delta_data))
        except ImportError:
            pass

        return db_obj

    async def get(self, db: AsyncSession, *, id: UUID) -> Optional[Node]:
        """Get a node by ID"""
        stmt = select(Node).where(Node.id == id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_multi_by_ids(self, db: AsyncSession, *, ids: List[UUID]) -> List[Node]:
        """Get multiple nodes by their IDs"""
        stmt = select(Node).where(Node.id.in_(ids))
        result = await db.execute(stmt)
        return result.scalars().all()

    async def update_props(self, db: AsyncSession, *, id: UUID, props: Dict[str, Any]) -> Optional[Node]:
        """Update just the properties field of a node"""
        stmt = (
            update(Node)
            .where(Node.id == id)
            .values(props=props)
            .execution_options(synchronize_session="fetch")
        )
        await db.execute(stmt)
        await db.commit()
        return await self.get(db, id=id)
    
    async def update_position(self, db: AsyncSession, *, id: UUID, x: float, y: float) -> Optional[Node]:
        """Update the spatial position of a node"""
        stmt = (
            update(Node)
            .where(Node.id == id)
            .values(x=x, y=y)
            .execution_options(synchronize_session="fetch")
        )
        await db.execute(stmt)
        await db.commit()
        return await self.get(db, id=id)

    async def remove(self, db: AsyncSession, *, id: UUID) -> None:
        """Delete a node by ID"""
        stmt = delete(Node).where(Node.id == id)
        await db.execute(stmt)
        await db.commit()
    
    async def get_nodes_in_radius(
        self, 
        db: AsyncSession, 
        *, 
        tenant_id: UUID,
        center_x: float, 
        center_y: float, 
        radius: float,
        node_types: Optional[List[str]] = None,
        limit: int = 100
    ) -> List[Node]:
        """
        Get nodes within a specified radius from a center point.
        
        Args:
            db: Database session
            tenant_id: ID of the tenant
            center_x: X coordinate of center point
            center_y: Y coordinate of center point
            radius: Radius in coordinate units
            node_types: Optional list of node types to filter by
            limit: Maximum number of nodes to return
            
        Returns:
            List of Node objects within the radius
        """
        if not GEOMETRY_AVAILABLE:
            logger.warning("Spatial query requested but GeoAlchemy2 not available. Using fallback method.")
            # Fallback to rectangular search if spatial features not available
            # This is an approximation and not as accurate as a proper radius search
            approx_radius = radius  # This assumes the units are approximately the same
            return await self.get_nodes_in_viewport(
                db, 
                tenant_id=tenant_id,
                min_x=center_x - approx_radius,
                min_y=center_y - approx_radius,
                max_x=center_x + approx_radius,
                max_y=center_y + approx_radius,
                node_types=node_types,
                limit=limit
            )
            
        try:
            center_point = ST_SetSRID(ST_MakePoint(center_x, center_y), 4326)
            
            # Start building the query
            query = select(Node).where(
                Node.tenant_id == tenant_id,
                Node.position.isnot(None),  # Only nodes with position data
                ST_DWithin(Node.position, center_point, radius)
            )
            
            # Add node type filter if provided
            if node_types:
                query = query.where(Node.type.in_(node_types))
                
            # Order by distance from center point (closest first)
            query = query.order_by(ST_Distance(Node.position, center_point))
            
            # Apply limit
            query = query.limit(limit)
            
            result = await db.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error in spatial query: {str(e)}")
            # Fall back to simpler query
            return await self.get_nodes_in_viewport(
                db, 
                tenant_id=tenant_id,
                min_x=center_x - radius,
                min_y=center_y - radius,
                max_x=center_x + radius,
                max_y=center_y + radius,
                node_types=node_types,
                limit=limit
            )
    
    async def get_nodes_in_viewport(
        self, 
        db: AsyncSession, 
        *, 
        tenant_id: UUID,
        min_x: float, 
        min_y: float,
        max_x: float,
        max_y: float,
        node_types: Optional[List[str]] = None,
        limit: int = 100
    ) -> List[Node]:
        """
        Get nodes within a rectangular viewport.
        
        Args:
            db: Database session
            tenant_id: ID of the tenant
            min_x: Minimum X coordinate
            min_y: Minimum Y coordinate
            max_x: Maximum X coordinate
            max_y: Maximum Y coordinate
            node_types: Optional list of node types to filter by
            limit: Maximum number of nodes to return
            
        Returns:
            List of Node objects within the viewport
        """
        # Start building the query
        query = select(Node).where(
            Node.tenant_id == tenant_id,
            Node.x.isnot(None),
            Node.y.isnot(None),
            Node.x >= min_x,
            Node.x <= max_x,
            Node.y >= min_y,
            Node.y <= max_y
        )
        
        # Add node type filter if provided
        if node_types:
            query = query.where(Node.type.in_(node_types))
            
        # Apply limit
        query = query.limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_node_nearest_to(
        self, 
        db: AsyncSession, 
        *, 
        tenant_id: UUID,
        x: float, 
        y: float,
        node_type: Optional[str] = None
    ) -> Optional[Tuple[Node, float]]:
        """
        Get the node nearest to a specified point, optionally of a specific type.
        Also returns the distance to that node.
        
        Args:
            db: Database session
            tenant_id: ID of the tenant
            x: X coordinate
            y: Y coordinate
            node_type: Optional node type to filter by
            
        Returns:
            Tuple of (Node, distance) for the nearest node, or None if no node found
        """
        if not GEOMETRY_AVAILABLE:
            logger.warning("Spatial nearest query requested but GeoAlchemy2 not available. Using fallback method.")
            # Fallback using simple x,y coordinates and Euclidean distance
            # Start with basic query
            query = select(
                Node,
                (func.pow(Node.x - x, 2) + func.pow(Node.y - y, 2)).label("distance_squared")
            ).where(
                Node.tenant_id == tenant_id,
                Node.x.isnot(None),
                Node.y.isnot(None)
            )
            
            # Add node type filter if provided
            if node_type:
                query = query.where(Node.type == node_type)
                
            # Order by squared distance and get the closest one (we use squared distance to avoid sqrt calculation)
            query = query.order_by("distance_squared")
            query = query.limit(1)
            
            result = await db.execute(query)
            row = result.first()
            
            if row:
                # Calculate actual distance (Euclidean)
                distance = ((row[0].x - x) ** 2 + (row[0].y - y) ** 2) ** 0.5
                return (row[0], distance)
            return None
        
        try:
            point = ST_SetSRID(ST_MakePoint(x, y), 4326)
            
            # Start building the query
            query = select(
                Node, 
                func.ST_Distance(Node.position, point).label("distance")
            ).where(
                Node.tenant_id == tenant_id,
                Node.position.isnot(None)
            )
            
            # Add node type filter if provided
            if node_type:
                query = query.where(Node.type == node_type)
                
            # Order by distance and get the closest one
            query = query.order_by("distance")
            query = query.limit(1)
            
            result = await db.execute(query)
            row = result.first()
            
            if row:
                return (row[0], row[1])  # Node object and distance
            return None
        except Exception as e:
            logger.error(f"Error in spatial nearest query: {str(e)}")
            # Fall back to simple method
            query = select(
                Node,
                (func.pow(Node.x - x, 2) + func.pow(Node.y - y, 2)).label("distance_squared")
            ).where(
                Node.tenant_id == tenant_id,
                Node.x.isnot(None),
                Node.y.isnot(None)
            )
            
            # Add node type filter if provided
            if node_type:
                query = query.where(Node.type == node_type)
                
            # Order by squared distance and get the closest one
            query = query.order_by("distance_squared")
            query = query.limit(1)
            
            result = await db.execute(query)
            row = result.first()
            
            if row:
                # Calculate actual distance (Euclidean)
                distance = ((row[0].x - x) ** 2 + (row[0].y - y) ** 2) ** 0.5
                return (row[0], distance)
            return None


node = CRUDNode() 