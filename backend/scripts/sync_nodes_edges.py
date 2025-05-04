#!/usr/bin/env python3
"""
sync_nodes_edges.py - Synchronize Nodes and Edges from Entity Tables

This script creates corresponding nodes and edges in the graph database tables
for all entities in the regular tables (users, teams, projects, goals, etc.)
It maintains proper tenant isolation to ensure each tenant sees only their data.

Usage:
  python -m scripts.sync_nodes_edges

Requirements:
  - asyncpg: pip install asyncpg
"""

# Check for required packages
try:
    import asyncpg
except ImportError:
    print("\nERROR: Missing required package 'asyncpg'")
    print("Please install it first:\n")
    print("    pip install asyncpg\n")
    import sys
    sys.exit(1)

import asyncio
import logging
import os
import sys
from uuid import UUID

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

# Import the session engine more carefully
try:
    from app.db.session import engine, get_db_session
except ImportError as e:
    print(f"\nError importing database session: {e}")
    print("This often means you need to install additional dependencies.")
    print("Try running: pip install -r requirements.txt\n")
    sys.exit(1)
from app.models.tenant import Tenant
from app.models.user import User
from app.models.team import Team
from app.models.project import Project
from app.models.goal import Goal
from app.models.department import Department
from app.models.node import Node
from app.models.edge import Edge

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
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

async def create_node_if_not_exists(db: AsyncSession, entity, tenant_id: UUID):
    """Create a node for an entity if it doesn't already exist."""
    entity_id = entity.id
    entity_type = NODE_TYPES.get(type(entity))
    
    if not entity_type:
        logger.warning(f"Unknown entity type: {type(entity)}")
        return None
    
    # Check if node already exists
    stmt = select(Node).where(
        Node.tenant_id == tenant_id,
        Node.props["entity_id"].astext == str(entity_id),
        Node.type == entity_type
    )
    result = await db.execute(stmt)
    existing_node = result.scalar_one_or_none()
    
    if existing_node:
        return existing_node
    
    # Create props based on entity type
    props = {
        "entity_id": str(entity_id),
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
        # Add some randomization for visualization
        x=0.0,  # Will be updated with layout algorithm
        y=0.0   # Will be updated with layout algorithm
    )
    
    db.add(node)
    await db.flush()
    logger.info(f"Created node for {entity_type} {entity_id}")
    
    return node

async def create_edge_if_not_exists(db: AsyncSession, src_node: Node, dst_node: Node, 
                                   edge_type: str, tenant_id: UUID):
    """Create an edge between two nodes if it doesn't already exist."""
    # Check if edge already exists
    stmt = select(Edge).where(
        Edge.tenant_id == tenant_id,
        Edge.src == src_node.id,
        Edge.dst == dst_node.id,
        Edge.label == edge_type
    )
    result = await db.execute(stmt)
    existing_edge = result.scalar_one_or_none()
    
    if existing_edge:
        return existing_edge
    
    # Create edge
    edge = Edge(
        tenant_id=tenant_id,
        src=src_node.id,
        dst=dst_node.id,
        label=edge_type,
        props={}
    )
    
    db.add(edge)
    await db.flush()
    logger.info(f"Created edge {edge_type} from {src_node.type} to {dst_node.type}")
    
    return edge

async def sync_entities_for_tenant(db: AsyncSession, tenant_id: UUID):
    """Synchronize nodes and edges for a specific tenant."""
    logger.info(f"Syncing entities for tenant {tenant_id}")
    
    # Dictionary to keep track of created nodes by entity ID
    nodes_by_entity = {}
    
    # Get users for the tenant
    stmt = select(User).where(User.tenant_id == tenant_id)
    result = await db.execute(stmt)
    users = result.scalars().all()
    logger.info(f"Found {len(users)} users for tenant {tenant_id}")
    
    # Create nodes for all users
    for user in users:
        node = await create_node_if_not_exists(db, user, tenant_id)
        nodes_by_entity[(NODE_TYPES[User], user.id)] = node
    
    # Get teams for the tenant
    stmt = select(Team).where(Team.tenant_id == tenant_id)
    result = await db.execute(stmt)
    teams = result.scalars().all()
    logger.info(f"Found {len(teams)} teams for tenant {tenant_id}")
    
    # Create nodes for all teams
    for team in teams:
        node = await create_node_if_not_exists(db, team, tenant_id)
        nodes_by_entity[(NODE_TYPES[Team], team.id)] = node
    
    # Get projects for the tenant
    stmt = select(Project).where(Project.tenant_id == tenant_id)
    result = await db.execute(stmt)
    projects = result.scalars().all()
    logger.info(f"Found {len(projects)} projects for tenant {tenant_id}")
    
    # Create nodes for all projects
    for project in projects:
        node = await create_node_if_not_exists(db, project, tenant_id)
        nodes_by_entity[(NODE_TYPES[Project], project.id)] = node
    
    # Get goals for the tenant
    stmt = select(Goal).where(Goal.tenant_id == tenant_id)
    result = await db.execute(stmt)
    goals = result.scalars().all()
    logger.info(f"Found {len(goals)} goals for tenant {tenant_id}")
    
    # Create nodes for all goals
    for goal in goals:
        node = await create_node_if_not_exists(db, goal, tenant_id)
        nodes_by_entity[(NODE_TYPES[Goal], goal.id)] = node
    
    # Get departments for the tenant if they exist
    try:
        stmt = select(Department).where(Department.tenant_id == tenant_id)
        result = await db.execute(stmt)
        departments = result.scalars().all()
        logger.info(f"Found {len(departments)} departments for tenant {tenant_id}")
        
        # Create nodes for all departments
        for department in departments:
            node = await create_node_if_not_exists(db, department, tenant_id)
            nodes_by_entity[(NODE_TYPES[Department], department.id)] = node
    except Exception as e:
        logger.warning(f"Error fetching departments: {e}")
    
    # Create edges for relationships
    logger.info("Creating edges for entity relationships...")
    
    # User -> Team edges (user is member of team)
    for user in users:
        if user.team_id and (NODE_TYPES[User], user.id) in nodes_by_entity and (NODE_TYPES[Team], user.team_id) in nodes_by_entity:
            user_node = nodes_by_entity[(NODE_TYPES[User], user.id)]
            team_node = nodes_by_entity[(NODE_TYPES[Team], user.team_id)]
            await create_edge_if_not_exists(db, user_node, team_node, EDGE_TYPES["team_member"], tenant_id)
    
    # User -> User edges (user reports to manager)
    for user in users:
        if user.manager_id and (NODE_TYPES[User], user.id) in nodes_by_entity and (NODE_TYPES[User], user.manager_id) in nodes_by_entity:
            user_node = nodes_by_entity[(NODE_TYPES[User], user.id)]
            manager_node = nodes_by_entity[(NODE_TYPES[User], user.manager_id)]
            await create_edge_if_not_exists(db, user_node, manager_node, EDGE_TYPES["user_manager"], tenant_id)
    
    # Team -> User edges (team is led by user)
    for team in teams:
        if team.lead_id and (NODE_TYPES[Team], team.id) in nodes_by_entity and (NODE_TYPES[User], team.lead_id) in nodes_by_entity:
            team_node = nodes_by_entity[(NODE_TYPES[Team], team.id)]
            lead_node = nodes_by_entity[(NODE_TYPES[User], team.lead_id)]
            await create_edge_if_not_exists(db, team_node, lead_node, EDGE_TYPES["team_lead"], tenant_id)
    
    # Project -> Team edges (project is owned by team)
    for project in projects:
        if project.owning_team_id and (NODE_TYPES[Project], project.id) in nodes_by_entity and (NODE_TYPES[Team], project.owning_team_id) in nodes_by_entity:
            project_node = nodes_by_entity[(NODE_TYPES[Project], project.id)]
            team_node = nodes_by_entity[(NODE_TYPES[Team], project.owning_team_id)]
            await create_edge_if_not_exists(db, team_node, project_node, EDGE_TYPES["project_team"], tenant_id)
    
    # Project -> Goal edges (project is aligned to goal)
    for project in projects:
        if project.goal_id and (NODE_TYPES[Project], project.id) in nodes_by_entity and (NODE_TYPES[Goal], project.goal_id) in nodes_by_entity:
            project_node = nodes_by_entity[(NODE_TYPES[Project], project.id)]
            goal_node = nodes_by_entity[(NODE_TYPES[Goal], project.goal_id)]
            await create_edge_if_not_exists(db, project_node, goal_node, EDGE_TYPES["project_goal"], tenant_id)
    
    # Goal -> Goal edges (goal is child of parent goal)
    for goal in goals:
        if goal.parent_id and (NODE_TYPES[Goal], goal.id) in nodes_by_entity and (NODE_TYPES[Goal], goal.parent_id) in nodes_by_entity:
            goal_node = nodes_by_entity[(NODE_TYPES[Goal], goal.id)]
            parent_node = nodes_by_entity[(NODE_TYPES[Goal], goal.parent_id)]
            await create_edge_if_not_exists(db, goal_node, parent_node, EDGE_TYPES["goal_parent"], tenant_id)
    
    logger.info(f"Completed sync for tenant {tenant_id}")

async def sync_all_tenants():
    """Synchronize nodes and edges for all tenants."""
    logger.info("Starting synchronization of nodes and edges...")
    
    async with AsyncSession(engine) as db:
        # Get all tenants
        stmt = select(Tenant)
        result = await db.execute(stmt)
        tenants = result.scalars().all()
        
        logger.info(f"Found {len(tenants)} tenants")
        
        # Process each tenant
        for tenant in tenants:
            await sync_entities_for_tenant(db, tenant.id)
            
        # Commit all changes
        await db.commit()
        
        # Verify the number of nodes and edges created
        node_count = await db.execute(select(func.count(Node.id)))
        edge_count = await db.execute(select(func.count(Edge.id)))
        
        logger.info(f"Synchronization complete. Created {node_count.scalar_one()} nodes and {edge_count.scalar_one()} edges.")

def add_to_startup():
    """Add a hook to run this script during application startup."""
    logger.info("Adding sync mechanism to application startup...")
    # Implementation to integrate with app startup events
    pass

if __name__ == "__main__":
    """Run the synchronization script directly."""
    logger.info("Running node/edge synchronization script...")
    asyncio.run(sync_all_tenants())