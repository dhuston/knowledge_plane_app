#!/usr/bin/env python3
"""
fix_graph_data.py - Generate Graph Data from Entities

This script creates graph nodes and edges from existing entity tables,
supporting proper visualization in the living map.
"""

import asyncio
import json
import logging
from uuid import UUID, uuid4

import sys
import os
# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import engine
from app.models.tenant import Tenant

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Node type mapping
NODE_TYPES = {
    "user": "user",
    "team": "team",
    "project": "project",
    "goal": "goal",
    "department": "department",
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

async def execute_query(db: AsyncSession, query_text, params=None):
    """Execute a raw SQL query with parameters."""
    result = await db.execute(text(query_text), params or {})
    return result

async def sync_graph_data_for_tenant(db: AsyncSession, tenant_id: UUID):
    """Generate graph nodes and edges for a specific tenant using direct SQL."""
    logger.info(f"Syncing graph data for tenant {tenant_id}")
    
    # Dictionary to track created nodes
    node_map = {}
    
    # 1. Clear existing nodes and edges for this tenant (optional)
    # Uncomment these if you want to start fresh
    # await execute_query(db, "DELETE FROM edges WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
    # await execute_query(db, "DELETE FROM nodes WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
    
    # 2. Create nodes for users
    logger.info("Creating nodes for users")
    result = await execute_query(
        db,
        "SELECT id, name, email, title, team_id, manager_id FROM users WHERE tenant_id = :tenant_id",
        {"tenant_id": tenant_id}
    )
    users = result.fetchall()
    logger.info(f"Found {len(users)} users")
    
    for user in users:
        # Check if node already exists
        check = await execute_query(
            db,
            "SELECT id FROM nodes WHERE tenant_id = :tenant_id AND props->>'entity_id' = :entity_id AND type = :type",
            {
                "tenant_id": tenant_id,
                "entity_id": str(user.id),
                "type": "user"
            }
        )
        existing = check.fetchone()
        
        if existing:
            node_map[f"user:{user.id}"] = existing.id
            continue
            
        # Create node with proper JSON encoding and UUID for the id field
        props_json = json.dumps({
            "entity_id": str(user.id),
            "name": user.name,
            "email": user.email,
            "title": user.title
        })
        
        node_id = uuid4()
        
        node = await execute_query(
            db,
            """
            INSERT INTO nodes (id, tenant_id, type, props, x, y) 
            VALUES (:node_id, :tenant_id, :type, :props, random()*100, random()*100)
            RETURNING id
            """,
            {
                "node_id": node_id,
                "tenant_id": tenant_id,
                "type": "user",
                "props": props_json
            }
        )
        node_map[f"user:{user.id}"] = node_id
    
    # 3. Create nodes for teams
    logger.info("Creating nodes for teams")
    result = await execute_query(
        db,
        "SELECT id, name, description, lead_id, department_id FROM teams WHERE tenant_id = :tenant_id",
        {"tenant_id": tenant_id}
    )
    teams = result.fetchall()
    logger.info(f"Found {len(teams)} teams")
    
    for team in teams:
        # Check if node already exists
        check = await execute_query(
            db,
            "SELECT id FROM nodes WHERE tenant_id = :tenant_id AND props->>'entity_id' = :entity_id AND type = :type",
            {
                "tenant_id": tenant_id,
                "entity_id": str(team.id),
                "type": "team"
            }
        )
        existing = check.fetchone()
        
        if existing:
            node_map[f"team:{team.id}"] = existing.id
            continue
            
        # Create node with proper JSON encoding and UUID for the id field
        props_json = json.dumps({
            "entity_id": str(team.id),
            "name": team.name,
            "description": team.description
        })
        
        node_id = uuid4()
        
        node = await execute_query(
            db,
            """
            INSERT INTO nodes (id, tenant_id, type, props, x, y) 
            VALUES (:node_id, :tenant_id, :type, :props, random()*100, random()*100)
            RETURNING id
            """,
            {
                "node_id": node_id,
                "tenant_id": tenant_id,
                "type": "team",
                "props": props_json
            }
        )
        node_map[f"team:{team.id}"] = node_id
    
    # 4. Create nodes for projects
    logger.info("Creating nodes for projects")
    result = await execute_query(
        db,
        "SELECT id, name, description, status, owning_team_id, goal_id FROM projects WHERE tenant_id = :tenant_id",
        {"tenant_id": tenant_id}
    )
    projects = result.fetchall()
    logger.info(f"Found {len(projects)} projects")
    
    for project in projects:
        # Check if node already exists
        check = await execute_query(
            db,
            "SELECT id FROM nodes WHERE tenant_id = :tenant_id AND props->>'entity_id' = :entity_id AND type = :type",
            {
                "tenant_id": tenant_id,
                "entity_id": str(project.id),
                "type": "project"
            }
        )
        existing = check.fetchone()
        
        if existing:
            node_map[f"project:{project.id}"] = existing.id
            continue
            
        # Create node with proper JSON encoding and UUID for the id field
        props_json = json.dumps({
            "entity_id": str(project.id),
            "name": project.name,
            "description": project.description,
            "status": project.status
        })
        
        node_id = uuid4()
        
        node = await execute_query(
            db,
            """
            INSERT INTO nodes (id, tenant_id, type, props, x, y) 
            VALUES (:node_id, :tenant_id, :type, :props, random()*100, random()*100)
            RETURNING id
            """,
            {
                "node_id": node_id,
                "tenant_id": tenant_id,
                "type": "project",
                "props": props_json
            }
        )
        node_map[f"project:{project.id}"] = node_id
    
    # 5. Create nodes for goals
    logger.info("Creating nodes for goals")
    result = await execute_query(
        db,
        "SELECT id, title, description, type, progress, parent_id FROM goals WHERE tenant_id = :tenant_id",
        {"tenant_id": tenant_id}
    )
    goals = result.fetchall()
    logger.info(f"Found {len(goals)} goals")
    
    for goal in goals:
        # Check if node already exists
        check = await execute_query(
            db,
            "SELECT id FROM nodes WHERE tenant_id = :tenant_id AND props->>'entity_id' = :entity_id AND type = :type",
            {
                "tenant_id": tenant_id,
                "entity_id": str(goal.id),
                "type": "goal"
            }
        )
        existing = check.fetchone()
        
        if existing:
            node_map[f"goal:{goal.id}"] = existing.id
            continue
            
        # Create node with proper JSON encoding and UUID for the id field
        props_json = json.dumps({
            "entity_id": str(goal.id),
            "name": goal.title,
            "description": goal.description,
            "type": goal.type,
            "progress": goal.progress
        })
        
        node_id = uuid4()
        
        node = await execute_query(
            db,
            """
            INSERT INTO nodes (id, tenant_id, type, props, x, y) 
            VALUES (:node_id, :tenant_id, :type, :props, random()*100, random()*100)
            RETURNING id
            """,
            {
                "node_id": node_id,
                "tenant_id": tenant_id,
                "type": "goal",
                "props": props_json
            }
        )
        node_map[f"goal:{goal.id}"] = node_id
    
    # 6. Create nodes for departments (if they exist)
    try:
        logger.info("Creating nodes for departments")
        result = await execute_query(
            db,
            "SELECT id, name, description FROM departments WHERE tenant_id = :tenant_id",
            {"tenant_id": tenant_id}
        )
        departments = result.fetchall()
        logger.info(f"Found {len(departments)} departments")
        
        for dept in departments:
            # Check if node already exists
            check = await execute_query(
                db,
                "SELECT id FROM nodes WHERE tenant_id = :tenant_id AND props->>'entity_id' = :entity_id AND type = :type",
                {
                    "tenant_id": tenant_id,
                    "entity_id": str(dept.id),
                    "type": "department"
                }
            )
            existing = check.fetchone()
            
            if existing:
                node_map[f"department:{dept.id}"] = existing.id
                continue
                
            # Create node with proper JSON encoding and UUID for the id field
            props_json = json.dumps({
                "entity_id": str(dept.id),
                "name": dept.name,
                "description": dept.description
            })
            
            node_id = uuid4()
            
            node = await execute_query(
                db,
                """
                INSERT INTO nodes (id, tenant_id, type, props, x, y) 
                VALUES (:node_id, :tenant_id, :type, :props, random()*100, random()*100)
                RETURNING id
                """,
                {
                    "node_id": node_id,
                    "tenant_id": tenant_id,
                    "type": "department",
                    "props": props_json
                }
            )
            node_map[f"department:{dept.id}"] = node_id
    except Exception as e:
        logger.warning(f"Error creating department nodes: {e}")
    
    # 7. Create edges for relationships
    logger.info("Creating edges for relationships")
    
    # User -> Team edges (user is member of team)
    for user in users:
        if user.team_id:
            user_node_key = f"user:{user.id}"
            team_node_key = f"team:{user.team_id}"
            
            if user_node_key in node_map and team_node_key in node_map:
                src_id = node_map[user_node_key]
                dst_id = node_map[team_node_key]
                
                # Check if edge already exists
                check = await execute_query(
                    db,
                    """
                    SELECT id FROM edges 
                    WHERE tenant_id = :tenant_id 
                    AND src = :src_id 
                    AND dst = :dst_id 
                    AND label = :label
                    """,
                    {
                        "tenant_id": tenant_id,
                        "src_id": src_id,
                        "dst_id": dst_id,
                        "label": "MEMBER_OF"
                    }
                )
                
                if not check.fetchone():
                    edge_id = uuid4()
                    await execute_query(
                        db,
                        """
                        INSERT INTO edges (id, tenant_id, src, dst, label, props) 
                        VALUES (:edge_id, :tenant_id, :src_id, :dst_id, :label, :props)
                        """,
                        {
                            "edge_id": edge_id,
                            "tenant_id": tenant_id,
                            "src_id": src_id,
                            "dst_id": dst_id,
                            "label": "MEMBER_OF",
                            "props": "{}"
                        }
                    )
                    logger.info(f"Created edge: User {user.id} MEMBER_OF Team {user.team_id}")
    
    # User -> User edges (user reports to manager)
    for user in users:
        if user.manager_id:
            user_node_key = f"user:{user.id}"
            manager_node_key = f"user:{user.manager_id}"
            
            if user_node_key in node_map and manager_node_key in node_map:
                src_id = node_map[user_node_key]
                dst_id = node_map[manager_node_key]
                
                # Check if edge already exists
                check = await execute_query(
                    db,
                    """
                    SELECT id FROM edges 
                    WHERE tenant_id = :tenant_id 
                    AND src = :src_id 
                    AND dst = :dst_id 
                    AND label = :label
                    """,
                    {
                        "tenant_id": tenant_id,
                        "src_id": src_id,
                        "dst_id": dst_id,
                        "label": "REPORTS_TO"
                    }
                )
                
                if not check.fetchone():
                    edge_id = uuid4()
                    await execute_query(
                        db,
                        """
                        INSERT INTO edges (id, tenant_id, src, dst, label, props) 
                        VALUES (:edge_id, :tenant_id, :src_id, :dst_id, :label, :props)
                        """,
                        {
                            "edge_id": edge_id,
                            "tenant_id": tenant_id,
                            "src_id": src_id,
                            "dst_id": dst_id,
                            "label": "REPORTS_TO",
                            "props": "{}"
                        }
                    )
                    logger.info(f"Created edge: User {user.id} REPORTS_TO User {user.manager_id}")
    
    # Team -> User edges (team is led by user)
    for team in teams:
        if team.lead_id:
            team_node_key = f"team:{team.id}"
            lead_node_key = f"user:{team.lead_id}"
            
            if team_node_key in node_map and lead_node_key in node_map:
                src_id = node_map[team_node_key]
                dst_id = node_map[lead_node_key]
                
                # Check if edge already exists
                check = await execute_query(
                    db,
                    """
                    SELECT id FROM edges 
                    WHERE tenant_id = :tenant_id 
                    AND src = :src_id 
                    AND dst = :dst_id 
                    AND label = :label
                    """,
                    {
                        "tenant_id": tenant_id,
                        "src_id": src_id,
                        "dst_id": dst_id,
                        "label": "LEADS"
                    }
                )
                
                if not check.fetchone():
                    edge_id = uuid4()
                    await execute_query(
                        db,
                        """
                        INSERT INTO edges (id, tenant_id, src, dst, label, props) 
                        VALUES (:edge_id, :tenant_id, :src_id, :dst_id, :label, :props)
                        """,
                        {
                            "edge_id": edge_id,
                            "tenant_id": tenant_id,
                            "src_id": src_id,
                            "dst_id": dst_id,
                            "label": "LEADS",
                            "props": "{}"
                        }
                    )
                    logger.info(f"Created edge: Team {team.id} LEADS User {team.lead_id}")
    
    # Project -> Team edges (project is owned by team)
    for project in projects:
        if project.owning_team_id:
            team_node_key = f"team:{project.owning_team_id}"
            project_node_key = f"project:{project.id}"
            
            if team_node_key in node_map and project_node_key in node_map:
                src_id = node_map[team_node_key]
                dst_id = node_map[project_node_key]
                
                # Check if edge already exists
                check = await execute_query(
                    db,
                    """
                    SELECT id FROM edges 
                    WHERE tenant_id = :tenant_id 
                    AND src = :src_id 
                    AND dst = :dst_id 
                    AND label = :label
                    """,
                    {
                        "tenant_id": tenant_id,
                        "src_id": src_id,
                        "dst_id": dst_id,
                        "label": "OWNS"
                    }
                )
                
                if not check.fetchone():
                    edge_id = uuid4()
                    await execute_query(
                        db,
                        """
                        INSERT INTO edges (id, tenant_id, src, dst, label, props) 
                        VALUES (:edge_id, :tenant_id, :src_id, :dst_id, :label, :props)
                        """,
                        {
                            "edge_id": edge_id,
                            "tenant_id": tenant_id,
                            "src_id": src_id,
                            "dst_id": dst_id,
                            "label": "OWNS",
                            "props": "{}"
                        }
                    )
                    logger.info(f"Created edge: Team {project.owning_team_id} OWNS Project {project.id}")
    
    # Project -> Goal edges (project is aligned to goal)
    for project in projects:
        if project.goal_id:
            project_node_key = f"project:{project.id}"
            goal_node_key = f"goal:{project.goal_id}"
            
            if project_node_key in node_map and goal_node_key in node_map:
                src_id = node_map[project_node_key]
                dst_id = node_map[goal_node_key]
                
                # Check if edge already exists
                check = await execute_query(
                    db,
                    """
                    SELECT id FROM edges 
                    WHERE tenant_id = :tenant_id 
                    AND src = :src_id 
                    AND dst = :dst_id 
                    AND label = :label
                    """,
                    {
                        "tenant_id": tenant_id,
                        "src_id": src_id,
                        "dst_id": dst_id,
                        "label": "ALIGNED_TO"
                    }
                )
                
                if not check.fetchone():
                    edge_id = uuid4()
                    await execute_query(
                        db,
                        """
                        INSERT INTO edges (id, tenant_id, src, dst, label, props) 
                        VALUES (:edge_id, :tenant_id, :src_id, :dst_id, :label, :props)
                        """,
                        {
                            "edge_id": edge_id,
                            "tenant_id": tenant_id,
                            "src_id": src_id,
                            "dst_id": dst_id,
                            "label": "ALIGNED_TO",
                            "props": "{}"
                        }
                    )
                    logger.info(f"Created edge: Project {project.id} ALIGNED_TO Goal {project.goal_id}")
    
    # Goal -> Goal edges (goal is child of parent goal)
    for goal in goals:
        if goal.parent_id:
            goal_node_key = f"goal:{goal.id}"
            parent_node_key = f"goal:{goal.parent_id}"
            
            if goal_node_key in node_map and parent_node_key in node_map:
                src_id = node_map[goal_node_key]
                dst_id = node_map[parent_node_key]
                
                # Check if edge already exists
                check = await execute_query(
                    db,
                    """
                    SELECT id FROM edges 
                    WHERE tenant_id = :tenant_id 
                    AND src = :src_id 
                    AND dst = :dst_id 
                    AND label = :label
                    """,
                    {
                        "tenant_id": tenant_id,
                        "src_id": src_id,
                        "dst_id": dst_id,
                        "label": "PARENT_OF"
                    }
                )
                
                if not check.fetchone():
                    edge_id = uuid4()
                    await execute_query(
                        db,
                        """
                        INSERT INTO edges (id, tenant_id, src, dst, label, props) 
                        VALUES (:edge_id, :tenant_id, :src_id, :dst_id, :label, :props)
                        """,
                        {
                            "edge_id": edge_id,
                            "tenant_id": tenant_id,
                            "src_id": src_id,
                            "dst_id": dst_id,
                            "label": "PARENT_OF",
                            "props": "{}"
                        }
                    )
                    logger.info(f"Created edge: Goal {goal.id} PARENT_OF Goal {goal.parent_id}")
    
    # Get counts
    node_count = await execute_query(
        db,
        "SELECT COUNT(*) AS count FROM nodes WHERE tenant_id = :tenant_id",
        {"tenant_id": tenant_id}
    )
    edge_count = await execute_query(
        db,
        "SELECT COUNT(*) AS count FROM edges WHERE tenant_id = :tenant_id",
        {"tenant_id": tenant_id}
    )
    
    logger.info(f"Completed sync for tenant {tenant_id}")
    logger.info(f"Created/verified {node_count.fetchone().count} nodes and {edge_count.fetchone().count} edges")

async def sync_all_tenants():
    """Synchronize graph data for all tenants."""
    logger.info("Starting synchronization of graph data...")
    
    async with AsyncSession(engine) as db:
        # Get all active tenants
        result = await execute_query(db, "SELECT id, name FROM tenants WHERE is_active = TRUE")
        tenants = result.fetchall()
        
        logger.info(f"Found {len(tenants)} active tenants")
        
        # Process each tenant
        for tenant in tenants:
            logger.info(f"Processing tenant: {tenant.name} ({tenant.id})")
            await sync_graph_data_for_tenant(db, tenant.id)
            
        # Commit all changes
        await db.commit()

if __name__ == "__main__":
    """Run the graph data generation script directly."""
    logger.info("Running graph data generation script...")
    asyncio.run(sync_all_tenants())