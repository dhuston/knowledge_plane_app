"""
Graph Synchronization Service

This service maintains synchronization between regular entity tables 
and the graph tables (nodes and edges). It provides functions to create
nodes and edges when entities are created or updated.
"""

import logging
from typing import Dict, Any, Optional, Union, List, Tuple
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.models.node import Node
from app.models.edge import Edge
from app.models.user import User
from app.models.team import Team
from app.models.project import Project
from app.models.goal import Goal
from app.models.department import Department

logger = logging.getLogger(__name__)

# Node type mapping
NODE_TYPES = {
    User: "user",
    Team: "team",
    Project: "project",
    Goal: "goal",
    Department: "department",
}

# Edge type mapping
EDGE_TYPES = {
    "team_member": "MEMBER_OF",
    "team_lead": "LEADS",
    "project_team": "OWNS", 
    "project_goal": "ALIGNED_TO",
    "goal_parent": "PARENT_OF",
    "user_manager": "REPORTS_TO",
}

async def create_node_for_entity(
    db: AsyncSession,
    entity: Union[User, Team, Project, Goal, Department],
    tenant_id: UUID,
    x: Optional[float] = None,
    y: Optional[float] = None
) -> Optional[Node]:
    """
    Create a node in the graph database for an entity.
    
    Args:
        db: Database session
        entity: The entity to create a node for
        tenant_id: The tenant ID
        x: Optional X coordinate
        y: Optional Y coordinate
        
    Returns:
        The created node or None if the entity type isn't supported
    """
    entity_type = NODE_TYPES.get(type(entity))
    if not entity_type:
        logger.warning(f"Unsupported entity type for node creation: {type(entity)}")
        return None
    
    # Check if node already exists
    stmt = select(Node).where(
        Node.tenant_id == tenant_id,
        Node.props["entity_id"].astext == str(entity.id),
        Node.type == entity_type
    )
    result = await db.execute(stmt)
    existing_node = result.scalar_one_or_none()
    
    if existing_node:
        logger.debug(f"Node already exists for {entity_type} {entity.id}")
        return existing_node
    
    # Create props based on entity type
    props = {
        "entity_id": str(entity.id),
    }
    
    # Add entity-specific properties
    if hasattr(entity, "name"):
        props["name"] = entity.name
    if hasattr(entity, "title"):
        props["title"] = entity.title
    if hasattr(entity, "email"):
        props["email"] = entity.email
    if hasattr(entity, "status"):
        props["status"] = entity.status
    
    # Create node
    node = Node(
        tenant_id=tenant_id,
        type=entity_type,
        props=props,
        x=x,
        y=y
    )
    
    db.add(node)
    await db.flush()
    logger.info(f"Created node for {entity_type} {entity.id}: {node.id}")
    
    return node

async def create_edge_for_relationship(
    db: AsyncSession,
    source_entity: Union[User, Team, Project, Goal, Department],
    target_entity: Union[User, Team, Project, Goal, Department],
    relationship_type: str,
    tenant_id: UUID
) -> Optional[Edge]:
    """
    Create an edge between nodes for two entities.
    
    Args:
        db: Database session
        source_entity: The source entity
        target_entity: The target entity
        relationship_type: Type of relationship (from EDGE_TYPES)
        tenant_id: The tenant ID
        
    Returns:
        The created edge or None if either node doesn't exist
    """
    # Get nodes for both entities
    source_node = await get_node_for_entity(db, source_entity, tenant_id)
    target_node = await get_node_for_entity(db, target_entity, tenant_id)
    
    if not source_node or not target_node:
        logger.warning(f"Cannot create edge: source or target node doesn't exist")
        return None
    
    # Check if edge already exists
    stmt = select(Edge).where(
        Edge.tenant_id == tenant_id,
        Edge.src == source_node.id,
        Edge.dst == target_node.id,
        Edge.label == relationship_type
    )
    result = await db.execute(stmt)
    existing_edge = result.scalar_one_or_none()
    
    if existing_edge:
        logger.debug(f"Edge already exists from {source_node.id} to {target_node.id}")
        return existing_edge
    
    # Create edge
    edge = Edge(
        tenant_id=tenant_id,
        src=source_node.id,
        dst=target_node.id,
        label=relationship_type,
        props={}
    )
    
    db.add(edge)
    await db.flush()
    logger.info(f"Created edge {relationship_type} from {source_node.id} to {target_node.id}")
    
    return edge

async def get_node_for_entity(
    db: AsyncSession,
    entity: Union[User, Team, Project, Goal, Department],
    tenant_id: UUID
) -> Optional[Node]:
    """
    Get the node for an entity, creating it if it doesn't exist.
    
    Args:
        db: Database session
        entity: The entity
        tenant_id: The tenant ID
        
    Returns:
        The node or None if the entity type isn't supported
    """
    entity_type = NODE_TYPES.get(type(entity))
    if not entity_type:
        logger.warning(f"Unsupported entity type for node lookup: {type(entity)}")
        return None
    
    # Check if node already exists
    stmt = select(Node).where(
        Node.tenant_id == tenant_id,
        Node.props["entity_id"].astext == str(entity.id),
        Node.type == entity_type
    )
    result = await db.execute(stmt)
    existing_node = result.scalar_one_or_none()
    
    if existing_node:
        return existing_node
    
    # Create node if it doesn't exist
    return await create_node_for_entity(db, entity, tenant_id)

async def sync_entity_relationships(
    db: AsyncSession,
    entity: Union[User, Team, Project, Goal, Department],
    tenant_id: UUID
) -> List[Edge]:
    """
    Synchronize relationships for an entity.
    
    Args:
        db: Database session
        entity: The entity
        tenant_id: The tenant ID
        
    Returns:
        List of edges created
    """
    edges = []
    
    # Handle entity-specific relationships
    if isinstance(entity, User):
        # User -> Team edge
        if entity.team_id:
            team = await db.get(Team, entity.team_id)
            if team:
                edge = await create_edge_for_relationship(
                    db, entity, team, EDGE_TYPES["team_member"], tenant_id
                )
                if edge:
                    edges.append(edge)
        
        # User -> User (manager) edge
        if entity.manager_id:
            manager = await db.get(User, entity.manager_id)
            if manager:
                edge = await create_edge_for_relationship(
                    db, entity, manager, EDGE_TYPES["user_manager"], tenant_id
                )
                if edge:
                    edges.append(edge)
    
    elif isinstance(entity, Team):
        # Team -> User (lead) edge
        if entity.lead_id:
            lead = await db.get(User, entity.lead_id)
            if lead:
                edge = await create_edge_for_relationship(
                    db, entity, lead, EDGE_TYPES["team_lead"], tenant_id
                )
                if edge:
                    edges.append(edge)
    
    elif isinstance(entity, Project):
        # Project -> Team edge
        if entity.owning_team_id:
            team = await db.get(Team, entity.owning_team_id)
            if team:
                edge = await create_edge_for_relationship(
                    db, team, entity, EDGE_TYPES["project_team"], tenant_id
                )
                if edge:
                    edges.append(edge)
        
        # Project -> Goal edge
        if entity.goal_id:
            goal = await db.get(Goal, entity.goal_id)
            if goal:
                edge = await create_edge_for_relationship(
                    db, entity, goal, EDGE_TYPES["project_goal"], tenant_id
                )
                if edge:
                    edges.append(edge)
    
    elif isinstance(entity, Goal):
        # Goal -> Goal (parent) edge
        if entity.parent_id:
            parent = await db.get(Goal, entity.parent_id)
            if parent:
                edge = await create_edge_for_relationship(
                    db, entity, parent, EDGE_TYPES["goal_parent"], tenant_id
                )
                if edge:
                    edges.append(edge)
    
    return edges

# Function to handle entity creation in an event handler
async def handle_entity_created(db: AsyncSession, entity, tenant_id: UUID):
    """
    Handle entity creation event by creating a node and relationships.
    
    Args:
        db: Database session
        entity: The created entity
        tenant_id: The tenant ID
    """
    # Create node for entity
    node = await create_node_for_entity(db, entity, tenant_id)
    
    if node:
        # Create edges for relationships
        await sync_entity_relationships(db, entity, tenant_id)

# Function to handle entity update
async def handle_entity_updated(db: AsyncSession, entity, tenant_id: UUID):
    """
    Handle entity update event by updating node and relationships.
    
    Args:
        db: Database session
        entity: The updated entity
        tenant_id: The tenant ID
    """
    # Get existing node
    node = await get_node_for_entity(db, entity, tenant_id)
    
    if node:
        # Update node properties
        if hasattr(entity, "name"):
            node.props["name"] = entity.name
        if hasattr(entity, "title"):
            node.props["title"] = entity.title
        if hasattr(entity, "email"):
            node.props["email"] = entity.email
        if hasattr(entity, "status"):
            node.props["status"] = entity.status
        
        db.add(node)
        await db.flush()
        
        # Update relationships
        await sync_entity_relationships(db, entity, tenant_id)