"""Base data processor for external system integrations."""

import uuid
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.node import Node
from app.models.edge import Edge
from app.integrations.exceptions import ProcessingError

logger = logging.getLogger(__name__)


class BaseProcessor(ABC):
    """
    Base abstract class for all data processors.
    
    This class defines the interface that all processors must implement
    to transform external data into internal entities and relationships.
    
    Attributes:
        _db: Database session for persisting transformed data
        _tenant_id: ID of the current tenant
    """
    
    def __init__(self, db: AsyncSession, tenant_id: UUID):
        """
        Initialize the processor with database session and tenant ID.
        
        Args:
            db: Database session for persisting transformed data
            tenant_id: ID of the current tenant
        """
        self._db = db
        self._tenant_id = tenant_id
    
    async def process_entity(self, raw_data: Dict[str, Any], entity_type: str) -> Optional[Dict[str, Any]]:
        """
        Process raw data from an external system into an internal entity.
        
        Args:
            raw_data: Raw data from the external system
            entity_type: Type of entity to process
            
        Returns:
            Processed entity data or None if not applicable
            
        Raises:
            ProcessingError: If processing fails
        """
        try:
            logger.debug(f"Processing {entity_type} entity")
            entity_data = await self._process_entity(raw_data, entity_type)
            
            if entity_data is None:
                return None
            
            # Create or update node in database
            existing_node = await self.find_existing_entity(entity_data)
            
            if existing_node:
                # Update existing node
                existing_node.props.update(entity_data.get("props", {}))
                self._db.add(existing_node)
                entity_data["id"] = existing_node.id
            else:
                # Create new node
                node = self.create_node_from_entity(entity_data)
                self._db.add(node)
                entity_data["id"] = node.id
            
            await self._db.commit()
            return entity_data
            
        except Exception as e:
            logger.error(f"Error processing entity: {e}")
            await self._db.rollback()
            raise ProcessingError(f"Error processing entity: {e}")
    
    async def process_relationship(self, source_entity: Dict[str, Any], target_entity: Dict[str, Any], relationship_type: str = None) -> Optional[Dict[str, Any]]:
        """
        Process relationship between two entities.
        
        Args:
            source_entity: Source entity data
            target_entity: Target entity data
            relationship_type: Type of relationship
            
        Returns:
            Processed relationship data or None if not applicable
            
        Raises:
            ProcessingError: If processing fails
        """
        try:
            logger.debug(f"Processing relationship {relationship_type or 'unknown'} between entities")
            
            relationship_data = await self._process_relationship(
                source_entity, target_entity, relationship_type
            )
            
            if relationship_data is None:
                return None
            
            # Check if relationship already exists
            existing_edge = await self.find_existing_relationship(
                relationship_data["src"],
                relationship_data["dst"],
                relationship_data["label"]
            )
            
            if existing_edge:
                # Update existing edge
                existing_edge.props.update(relationship_data.get("props", {}))
                self._db.add(existing_edge)
                relationship_data["id"] = existing_edge.id
            else:
                # Create new edge
                edge = self.create_edge_from_relationship(relationship_data)
                self._db.add(edge)
                relationship_data["id"] = edge.id
            
            await self._db.commit()
            return relationship_data
            
        except Exception as e:
            logger.error(f"Error processing relationship: {e}")
            await self._db.rollback()
            raise ProcessingError(f"Error processing relationship: {e}")
    
    async def find_existing_entity(self, entity_data: Dict[str, Any]) -> Optional[Node]:
        """
        Find an existing entity in the database.
        
        Args:
            entity_data: Entity data with type and identification properties
            
        Returns:
            Existing node or None if not found
        """
        entity_type = entity_data.get("type")
        external_id = entity_data.get("external_id") or entity_data.get("props", {}).get("external_id")
        
        if not entity_type or not external_id:
            return None
        
        query = select(Node).where(
            and_(
                Node.tenant_id == self._tenant_id,
                Node.type == entity_type,
                Node.props["external_id"].astext == str(external_id)
            )
        )
        
        result = await self._db.execute(query)
        return result.scalar_one_or_none()
    
    async def find_existing_relationship(self, src: UUID, dst: UUID, label: str) -> Optional[Edge]:
        """
        Find an existing relationship in the database.
        
        Args:
            src: Source node ID
            dst: Destination node ID
            label: Relationship label
            
        Returns:
            Existing edge or None if not found
        """
        query = select(Edge).where(
            and_(
                Edge.tenant_id == self._tenant_id,
                Edge.src == src,
                Edge.dst == dst,
                Edge.label == label
            )
        )
        
        result = await self._db.execute(query)
        return result.scalar_one_or_none()
    
    def create_node_from_entity(self, entity_data: Dict[str, Any]) -> Node:
        """
        Create a Node instance from entity data.
        
        Args:
            entity_data: Processed entity data
            
        Returns:
            Node instance ready to be added to the database
        """
        node_id = entity_data.get("id", uuid4())
        
        return Node(
            id=node_id,
            tenant_id=self._tenant_id,
            type=entity_data["type"],
            props=entity_data.get("props", {})
        )
    
    def create_edge_from_relationship(self, relationship_data: Dict[str, Any]) -> Edge:
        """
        Create an Edge instance from relationship data.
        
        Args:
            relationship_data: Processed relationship data
            
        Returns:
            Edge instance ready to be added to the database
        """
        edge_id = relationship_data.get("id", uuid4())
        
        return Edge(
            id=edge_id,
            tenant_id=self._tenant_id,
            src=relationship_data["src"],
            dst=relationship_data["dst"],
            label=relationship_data["label"],
            props=relationship_data.get("props", {})
        )
    
    @abstractmethod
    async def _process_entity(self, raw_data: Dict[str, Any], entity_type: str) -> Optional[Dict[str, Any]]:
        """
        Implementation-specific entity processing logic.
        
        Args:
            raw_data: Raw data from the external system
            entity_type: Type of entity to process
            
        Returns:
            Processed entity data or None if not applicable
        """
        pass
    
    @abstractmethod
    async def _process_relationship(self, source_entity: Dict[str, Any], target_entity: Dict[str, Any], relationship_type: str = None) -> Optional[Dict[str, Any]]:
        """
        Implementation-specific relationship processing logic.
        
        Args:
            source_entity: Source entity data
            target_entity: Target entity data
            relationship_type: Type of relationship
            
        Returns:
            Processed relationship data or None if not applicable
        """
        pass