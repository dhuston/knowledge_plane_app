#!/usr/bin/env python3
"""
Script to add visualization data (nodes and edges) to tenant data.

This script creates nodes and edges for each department, team, user, project, and goal
in the tenant to provide a rich visualization in the Living Map.
"""

import sys
import os
import asyncio
import logging
import random
import math
import json
from uuid import UUID
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple

# Add parent directory to path for importing app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import SessionLocal
from app.models.tenant import Tenant
from app.models.department import Department
from app.models.team import Team
from app.models.user import User
from app.models.project import Project
from app.models.goal import Goal
from app.models.node import Node
from app.models.edge import Edge

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants for visualization layout
LAYOUT_CENTER_X = 0
LAYOUT_CENTER_Y = 0
LAYOUT_RADIUS = 500  # Base radius for layout
DEPT_RADIUS = LAYOUT_RADIUS * 0.8
TEAM_RADIUS = LAYOUT_RADIUS * 0.6
USER_RADIUS = LAYOUT_RADIUS * 0.4
PROJECT_RADIUS = LAYOUT_RADIUS * 0.5
GOAL_RADIUS = LAYOUT_RADIUS * 0.7

# Dictionary to track entity positions to avoid overlap
positions = {}

# Tenant IDs from our analysis
TENANT_IDS = {
    "financial": UUID("1cb10e3e-8996-4b96-a31b-cc1ee62a5574"),  # Global Financial Group
    "manufacturing": UUID("6a3a3662-52e9-4dd4-972c-9f87e7c9940f"),  # Advanced Manufacturing Corp
    "education": UUID("c089973e-d3b4-43d8-9642-4bfa5a12b348"),  # University Research Alliance
    "health": UUID("e40a2e09-4af1-436b-b4bb-4826c866b199"),  # Metropolitan Health System
    "pharma": UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6"),  # Pharma AI Demo
}

async def get_tenant_info(session: AsyncSession) -> Dict[UUID, Dict]:
    """Get basic info about all tenants."""
    stmt = select(Tenant)
    result = await session.execute(stmt)
    tenants = result.scalars().all()
    
    return {tenant.id: {
        "name": tenant.name,
        "domain": tenant.domain
    } for tenant in tenants}

async def get_entity_count(session: AsyncSession, tenant_id: UUID) -> Dict[str, int]:
    """Get count of entities by type for a tenant."""
    # Count departments
    dept_stmt = select(func.count()).select_from(Department).where(Department.tenant_id == tenant_id)
    dept_count = await session.execute(dept_stmt)
    
    # Count teams
    team_stmt = select(func.count()).select_from(Team).where(Team.tenant_id == tenant_id)
    team_count = await session.execute(team_stmt)
    
    # Count users
    user_stmt = select(func.count()).select_from(User).where(User.tenant_id == tenant_id)
    user_count = await session.execute(user_stmt)
    
    # Count projects
    project_stmt = select(func.count()).select_from(Project).where(Project.tenant_id == tenant_id)
    project_count = await session.execute(project_stmt)
    
    # Count goals
    goal_stmt = select(func.count()).select_from(Goal).where(Goal.tenant_id == tenant_id)
    goal_count = await session.execute(goal_stmt)
    
    # Count existing nodes
    node_stmt = select(func.count()).select_from(Node).where(Node.tenant_id == tenant_id)
    node_count = await session.execute(node_stmt)
    
    # Count existing edges
    edge_stmt = select(func.count()).select_from(Edge).where(Edge.tenant_id == tenant_id)
    edge_count = await session.execute(edge_stmt)
    
    return {
        "departments": dept_count.scalar_one() or 0,
        "teams": team_count.scalar_one() or 0,
        "users": user_count.scalar_one() or 0,
        "projects": project_count.scalar_one() or 0,
        "goals": goal_count.scalar_one() or 0,
        "nodes": node_count.scalar_one() or 0,
        "edges": edge_count.scalar_one() or 0,
    }

def calculate_position(entity_type: str, index: int, total: int) -> Tuple[float, float]:
    """Calculate a position for an entity on the map based on its type and index."""
    # If we've already calculated a position for this entity, return it
    entity_key = f"{entity_type}_{index}"
    if entity_key in positions:
        return positions[entity_key]
    
    # Calculate radius based on entity type
    if entity_type == "department":
        radius = DEPT_RADIUS
    elif entity_type == "team":
        radius = TEAM_RADIUS
    elif entity_type == "user":
        radius = USER_RADIUS
    elif entity_type == "project":
        radius = PROJECT_RADIUS
    elif entity_type == "goal":
        radius = GOAL_RADIUS
    else:
        radius = LAYOUT_RADIUS * (0.3 + random.random() * 0.3)  # Random radius between 0.3 and 0.6
    
    # Add some randomness to the radius (±10%)
    radius *= (0.9 + random.random() * 0.2)
    
    if total <= 1:
        # If there's only one entity, place it at the center
        angle = random.random() * 2 * math.pi
    else:
        # Distribute entities evenly around the circle
        angle = (index / total) * 2 * math.pi
    
    # Add a small random offset to the angle to avoid perfect symmetry
    angle += random.random() * 0.2 - 0.1
    
    # Calculate x and y coordinates
    x = LAYOUT_CENTER_X + radius * math.cos(angle)
    y = LAYOUT_CENTER_Y + radius * math.sin(angle)
    
    # Store the position for future reference
    positions[entity_key] = (x, y)
    
    return (x, y)

async def get_entities(session: AsyncSession, tenant_id: UUID) -> Dict[str, List[Dict]]:
    """Get all entities for a tenant."""
    entities = {
        "departments": [],
        "teams": [],
        "users": [],
        "projects": [],
        "goals": [],
    }
    
    # Get departments
    dept_stmt = select(Department).where(Department.tenant_id == tenant_id)
    dept_result = await session.execute(dept_stmt)
    entities["departments"] = [
        {
            "id": dept.id,
            "name": dept.name,
            "description": dept.description,
            "created_at": dept.created_at,
        }
        for dept in dept_result.scalars().all()
    ]
    
    # Get teams with department info
    team_stmt = select(Team).where(Team.tenant_id == tenant_id)
    team_result = await session.execute(team_stmt)
    entities["teams"] = [
        {
            "id": team.id,
            "name": team.name,
            "description": team.description,
            "department_id": team.department_id,
            "created_at": team.created_at,
        }
        for team in team_result.scalars().all()
    ]
    
    # Get users
    user_stmt = select(User).where(User.tenant_id == tenant_id)
    user_result = await session.execute(user_stmt)
    entities["users"] = [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "title": user.title,
            "team_id": user.team_id,
            "created_at": user.created_at,
        }
        for user in user_result.scalars().all()
    ]
    
    # Get projects
    project_stmt = select(Project).where(Project.tenant_id == tenant_id)
    project_result = await session.execute(project_stmt)
    entities["projects"] = [
        {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "status": project.status,
            "created_at": project.created_at,
        }
        for project in project_result.scalars().all()
    ]
    
    # Get goals
    goal_stmt = select(Goal).where(Goal.tenant_id == tenant_id)
    goal_result = await session.execute(goal_stmt)
    entities["goals"] = [
        {
            "id": goal.id,
            "name": goal.name,
            "description": goal.description,
            "status": goal.status,
            "created_at": goal.created_at,
        }
        for goal in goal_result.scalars().all()
    ]
    
    return entities

async def create_nodes_for_entities(
    session: AsyncSession, tenant_id: UUID, entities: Dict[str, List[Dict]]
) -> Dict[str, Dict[UUID, UUID]]:
    """Create nodes for all entities and return mapping of entity ID to node ID."""
    # Dictionary to map entity IDs to node IDs
    entity_node_map = {
        "departments": {},
        "teams": {},
        "users": {},
        "projects": {},
        "goals": {},
    }
    
    # Create nodes for departments
    for i, dept in enumerate(entities["departments"]):
        x, y = calculate_position("department", i, len(entities["departments"]))
        
        # Create a props dictionary with nested hierarchyData
        props = {
            "name": dept["name"],
            "description": dept.get("description", ""),
            "type": "department",
            "entity_id": str(dept["id"]),
            "created_at": dept["created_at"].isoformat() if dept.get("created_at") else None,
            "hierarchyData": {
                "type": "department",
                "name": dept["name"],
                "id": str(dept["id"]),
                "children": []  # Will be populated by teams
            }
        }
        
        node = Node(
            tenant_id=tenant_id,
            type="department",
            props=props,
            x=x,
            y=y
        )
        session.add(node)
        await session.flush()
        entity_node_map["departments"][dept["id"]] = node.id
    
    # Create nodes for teams
    for i, team in enumerate(entities["teams"]):
        x, y = calculate_position("team", i, len(entities["teams"]))
        
        # Create props with hierarchyData
        props = {
            "name": team["name"],
            "description": team.get("description", ""),
            "type": "team",
            "entity_id": str(team["id"]),
            "department_id": str(team["department_id"]) if team.get("department_id") else None,
            "created_at": team["created_at"].isoformat() if team.get("created_at") else None,
            "hierarchyData": {
                "type": "team",
                "name": team["name"],
                "id": str(team["id"]),
                "departmentId": str(team["department_id"]) if team.get("department_id") else None,
                "children": []  # Will be populated by users
            }
        }
        
        node = Node(
            tenant_id=tenant_id,
            type="team",
            props=props,
            x=x,
            y=y
        )
        session.add(node)
        await session.flush()
        entity_node_map["teams"][team["id"]] = node.id
    
    # Create nodes for users
    for i, user in enumerate(entities["users"]):
        x, y = calculate_position("user", i, len(entities["users"]))
        
        props = {
            "name": user["name"],
            "title": user.get("title", ""),
            "type": "user",
            "entity_id": str(user["id"]),
            "email": user["email"],
            "team_id": str(user["team_id"]) if user.get("team_id") else None,
            "created_at": user["created_at"].isoformat() if user.get("created_at") else None,
            "hierarchyData": {
                "type": "user",
                "name": user["name"],
                "id": str(user["id"]),
                "title": user.get("title", ""),
                "teamId": str(user["team_id"]) if user.get("team_id") else None,
            }
        }
        
        node = Node(
            tenant_id=tenant_id,
            type="user",
            props=props,
            x=x,
            y=y
        )
        session.add(node)
        await session.flush()
        entity_node_map["users"][user["id"]] = node.id
    
    # Create nodes for projects
    for i, project in enumerate(entities["projects"]):
        x, y = calculate_position("project", i, len(entities["projects"]))
        
        props = {
            "name": project["name"],
            "description": project.get("description", ""),
            "type": "project",
            "entity_id": str(project["id"]),
            "status": project.get("status", "active"),
            "created_at": project["created_at"].isoformat() if project.get("created_at") else None,
        }
        
        node = Node(
            tenant_id=tenant_id,
            type="project",
            props=props,
            x=x,
            y=y
        )
        session.add(node)
        await session.flush()
        entity_node_map["projects"][project["id"]] = node.id
    
    # Create nodes for goals
    for i, goal in enumerate(entities["goals"]):
        x, y = calculate_position("goal", i, len(entities["goals"]))
        
        props = {
            "name": goal["name"],
            "description": goal.get("description", ""),
            "type": "goal",
            "entity_id": str(goal["id"]),
            "status": goal.get("status", "in_progress"),
            "created_at": goal["created_at"].isoformat() if goal.get("created_at") else None,
        }
        
        node = Node(
            tenant_id=tenant_id,
            type="goal",
            props=props,
            x=x,
            y=y
        )
        session.add(node)
        await session.flush()
        entity_node_map["goals"][goal["id"]] = node.id
    
    # Commit all nodes
    await session.commit()
    return entity_node_map

async def build_hierarchy_relationships(
    session: AsyncSession,
    tenant_id: UUID,
    entities: Dict[str, List[Dict]]
) -> None:
    """Build hierarchical relationships for the hierarchy navigator."""
    # Build a department -> teams mapping
    department_teams = {}
    for team in entities["teams"]:
        if team.get("department_id"):
            dept_id = team["department_id"]
            if dept_id not in department_teams:
                department_teams[dept_id] = []
            department_teams[dept_id].append(team["id"])
    
    # Build a team -> users mapping
    team_users = {}
    for user in entities["users"]:
        if user.get("team_id"):
            team_id = user["team_id"]
            if team_id not in team_users:
                team_users[team_id] = []
            team_users[team_id].append(user["id"])
    
    # Update department nodes to include team references in hierarchyData
    for dept in entities["departments"]:
        dept_id = dept["id"]
        if dept_id in department_teams:
            # Find the node for this department
            stmt = select(Node).where(
                Node.tenant_id == tenant_id,
                Node.type == "department",
                Node.props["entity_id"].astext == str(dept_id)
            )
            result = await session.execute(stmt)
            dept_node = result.scalar_one_or_none()
            
            if dept_node:
                # Add team references to hierarchyData
                props = dept_node.props
                team_children = []
                
                for team_id in department_teams[dept_id]:
                    # Find team node to get name
                    team = next((t for t in entities["teams"] if t["id"] == team_id), None)
                    if team:
                        team_children.append({
                            "type": "team",
                            "name": team["name"],
                            "id": str(team_id),
                        })
                
                props["hierarchyData"]["children"] = team_children
                dept_node.props = props
    
    # Update team nodes to include user references in hierarchyData
    for team in entities["teams"]:
        team_id = team["id"]
        if team_id in team_users:
            # Find the node for this team
            stmt = select(Node).where(
                Node.tenant_id == tenant_id,
                Node.type == "team",
                Node.props["entity_id"].astext == str(team_id)
            )
            result = await session.execute(stmt)
            team_node = result.scalar_one_or_none()
            
            if team_node:
                # Add user references to hierarchyData
                props = team_node.props
                user_children = []
                
                for user_id in team_users[team_id]:
                    # Find user node to get name and title
                    user = next((u for u in entities["users"] if u["id"] == user_id), None)
                    if user:
                        user_children.append({
                            "type": "user",
                            "name": user["name"],
                            "id": str(user_id),
                            "title": user.get("title", "")
                        })
                
                props["hierarchyData"]["children"] = user_children
                team_node.props = props
    
    # Commit the changes
    await session.commit()

async def create_edges_for_relationships(
    session: AsyncSession,
    tenant_id: UUID,
    entities: Dict[str, List[Dict]],
    entity_node_map: Dict[str, Dict[UUID, UUID]],
) -> int:
    """Create edges between nodes based on relationships."""
    edges_to_create = []
    
    # Team -> Department edges
    for team in entities["teams"]:
        if team.get("department_id") and team["department_id"] in entity_node_map["departments"]:
            team_node_id = entity_node_map["teams"][team["id"]]
            department_node_id = entity_node_map["departments"][team["department_id"]]
            edges_to_create.append({
                "source_id": team_node_id,
                "target_id": department_node_id,
                "relationship_type": "belongs_to",
                "name": "belongs to",
                "description": f"{team['name']} belongs to {entities['departments'][next((i for i, d in enumerate(entities['departments']) if d['id'] == team['department_id']), 0)]['name']}",
            })
    
    # User -> Team edges
    for user in entities["users"]:
        if user.get("team_id") and user["team_id"] in entity_node_map["teams"]:
            user_node_id = entity_node_map["users"][user["id"]]
            team_node_id = entity_node_map["teams"][user["team_id"]]
            edges_to_create.append({
                "source_id": user_node_id,
                "target_id": team_node_id,
                "relationship_type": "member_of",
                "name": "member of",
                "description": f"{user['name']} is a member of {entities['teams'][next((i for i, t in enumerate(entities['teams']) if t['id'] == user['team_id']), 0)]['name']}",
            })
    
    # Connect some users to projects (create random assignments)
    users_by_team = {}
    for user in entities["users"]:
        team_id = user.get("team_id")
        if team_id:
            if team_id not in users_by_team:
                users_by_team[team_id] = []
            users_by_team[team_id].append(user)
    
    # Assign users to projects based on their teams
    for project in entities["projects"]:
        # Randomly select 1-3 teams to work on this project
        num_teams = min(1 + int(random.random() * 2), len(entities["teams"]))
        if num_teams > 0:
            team_indices = random.sample(range(len(entities["teams"])), num_teams)
            for idx in team_indices:
                team = entities["teams"][idx]
                # If the team has users, assign 1-3 of them to the project
                if team["id"] in users_by_team and users_by_team[team["id"]]:
                    num_users = min(1 + int(random.random() * 2), len(users_by_team[team["id"]]))
                    assigned_users = random.sample(users_by_team[team["id"]], num_users)
                    
                    for user in assigned_users:
                        user_node_id = entity_node_map["users"][user["id"]]
                        project_node_id = entity_node_map["projects"][project["id"]]
                        edges_to_create.append({
                            "source_id": user_node_id,
                            "target_id": project_node_id,
                            "relationship_type": "works_on",
                            "name": "works on",
                            "description": f"{user['name']} works on {project['name']}",
                        })
    
    # Connect some projects to goals (create random alignments)
    for project in entities["projects"]:
        # Randomly select 1-2 goals for this project
        num_goals = min(1 + int(random.random() * 1), len(entities["goals"]))
        if num_goals > 0 and entities["goals"]:
            goal_indices = random.sample(range(len(entities["goals"])), num_goals)
            for idx in goal_indices:
                goal = entities["goals"][idx]
                project_node_id = entity_node_map["projects"][project["id"]]
                goal_node_id = entity_node_map["goals"][goal["id"]]
                edges_to_create.append({
                    "source_id": project_node_id,
                    "target_id": goal_node_id,
                    "relationship_type": "contributes_to",
                    "name": "contributes to",
                    "description": f"{project['name']} contributes to {goal['name']}",
                })
    
    # Create all edges in the database
    for edge_data in edges_to_create:
        edge = Edge(
            tenant_id=tenant_id,
            source_id=edge_data["source_id"],
            target_id=edge_data["target_id"],
            type=edge_data["relationship_type"],  # Type instead of relationship_type
            props={
                "name": edge_data["name"],
                "description": edge_data["description"],
                "weight": 1.0,  # Default weight
            }
        )
        session.add(edge)
    
    # Commit all edges
    await session.commit()
    return len(edges_to_create)

async def process_tenant(session: AsyncSession, tenant_id: UUID, tenant_name: str) -> None:
    """Process a single tenant to add visualization data."""
    logger.info(f"Processing tenant: {tenant_name} ({tenant_id})")
    
    # Get current entity counts
    entity_counts = await get_entity_count(session, tenant_id)
    logger.info(f"Current entity counts for {tenant_name}: {entity_counts}")
    
    # Check if we already have sufficient visualization data
    if entity_counts["nodes"] > 20 and entity_counts["edges"] > 20:
        logger.info(f"Tenant {tenant_name} already has sufficient visualization data. Skipping.")
        return
    
    # Clear the existing nodes and edges for this tenant
    if entity_counts["nodes"] > 0:
        del_nodes_stmt = text(f"DELETE FROM nodes WHERE tenant_id = '{tenant_id}'")
        await session.execute(del_nodes_stmt)
        
    if entity_counts["edges"] > 0:
        del_edges_stmt = text(f"DELETE FROM edges WHERE tenant_id = '{tenant_id}'")
        await session.execute(del_edges_stmt)
    
    await session.commit()
    logger.info(f"Cleared existing visualization data for {tenant_name}")
    
    # Reset position tracker
    global positions
    positions = {}
    
    # Get all entities for this tenant
    logger.info(f"Fetching entities for {tenant_name}")
    entities = await get_entities(session, tenant_id)
    
    # If we have entities, create nodes and edges
    if sum(len(entity_list) for entity_list in entities.values()) > 0:
        # Create nodes for all entities
        logger.info(f"Creating nodes for {tenant_name}")
        entity_node_map = await create_nodes_for_entities(session, tenant_id, entities)
        
        # Build hierarchy relationships for the hierarchy navigator
        logger.info(f"Building hierarchy relationships for {tenant_name}")
        await build_hierarchy_relationships(session, tenant_id, entities)
        
        # Create edges for relationships
        logger.info(f"Creating edges for {tenant_name}")
        edge_count = await create_edges_for_relationships(session, tenant_id, entities, entity_node_map)
        
        # Get updated counts
        updated_counts = await get_entity_count(session, tenant_id)
        logger.info(f"Created {updated_counts['nodes']} nodes and {updated_counts['edges']} edges for {tenant_name}")
    else:
        logger.warning(f"No entities found for tenant {tenant_name}")

async def main():
    """Main function to add visualization data to tenants."""
    logger.info("Starting visualization data addition script")
    
    # Create a session using the SessionLocal factory
    session = SessionLocal()
    try:
        # Get info about all tenants
        tenants = await get_tenant_info(session)
        
        # Process tenants that need visualization data
        for tenant_id_name, tenant_id in TENANT_IDS.items():
            if tenant_id in tenants:
                await process_tenant(session, tenant_id, tenants[tenant_id]["name"])
            else:
                logger.warning(f"Tenant ID {tenant_id} ({tenant_id_name}) not found")
        
        logger.info("Visualization data addition complete")
    except Exception as e:
        logger.error(f"Error adding visualization data: {e}")
        await session.rollback()
        raise
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(main())