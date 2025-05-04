#!/usr/bin/env python3
"""
Script to create graph nodes for existing departments in the Tech Innovations Inc. tenant.
"""
import asyncio
import uuid
from datetime import datetime, timezone
import json
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import text

# Database connection settings
DATABASE_URL = "postgresql+asyncpg://postgres:password@db:5432/knowledgeplan_dev"

# Create engine and session
engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Tenant domain
TENANT_DOMAIN = "techinnovations.com"

async def execute_query(session, query, params=None):
    """Execute a raw SQL query and return the result."""
    if params is None:
        params = {}
    result = await session.execute(text(query), params)
    return result

async def create_department_nodes():
    """Create graph nodes for existing departments in Tech Innovations Inc."""
    async with async_session() as session:
        try:
            # 1. Get tenant ID
            tenant_query = """
            SELECT id FROM tenants WHERE domain = :domain;
            """
            tenant_result = await execute_query(session, tenant_query, {"domain": TENANT_DOMAIN})
            tenant_id = tenant_result.scalar_one()
            print(f"Found tenant ID: {tenant_id}")
            
            # 2. Get existing departments
            departments_query = """
            SELECT id, name, description FROM departments WHERE tenant_id = :tenant_id;
            """
            departments_result = await execute_query(session, departments_query, {"tenant_id": tenant_id})
            departments = departments_result.fetchall()
            print(f"Found {len(departments)} departments")
            
            # 3. Create nodes for each department
            for dept in departments:
                dept_id = dept[0]
                dept_name = dept[1]
                dept_description = dept[2] or ""
                
                # Check if node already exists
                check_query = """
                SELECT id FROM nodes 
                WHERE tenant_id = :tenant_id AND props->>'entity_id' = :entity_id AND type = 'department';
                """
                check_result = await execute_query(
                    session, 
                    check_query, 
                    {"tenant_id": tenant_id, "entity_id": str(dept_id)}
                )
                existing_node = check_result.scalar()
                
                if existing_node:
                    print(f"Node already exists for department: {dept_name}")
                    continue
                
                # Generate random coordinates for the department
                import random
                x = random.uniform(-200, 200)
                y = random.uniform(-200, 200)
                
                # Create node properties
                node_props = {
                    "name": dept_name,
                    "description": dept_description,
                    "entity_id": str(dept_id),
                    "entity_type": "department"
                }
                
                # Create node
                node_query = """
                INSERT INTO nodes (id, tenant_id, type, props, x, y, created_at, updated_at)
                VALUES (:id, :tenant_id, :type, :props, :x, :y, :created_at, :updated_at);
                """
                node_id = uuid.uuid4()
                now = datetime.now(timezone.utc)
                
                await execute_query(
                    session,
                    node_query,
                    {
                        "id": node_id,
                        "tenant_id": tenant_id,
                        "type": "department",
                        "props": json.dumps(node_props),
                        "x": x,
                        "y": y,
                        "created_at": now,
                        "updated_at": now
                    }
                )
                
                print(f"Created node for department: {dept_name}")
            
            # 4. Create department-team edges
            teams_depts_query = """
            SELECT t.id as team_id, d.id as dept_id, t.name as team_name, d.name as dept_name
            FROM teams t JOIN departments d ON t.department_id = d.id
            WHERE t.tenant_id = :tenant_id;
            """
            teams_depts_result = await execute_query(session, teams_depts_query, {"tenant_id": tenant_id})
            team_dept_pairs = teams_depts_result.fetchall()
            
            for pair in team_dept_pairs:
                team_id = pair[0]
                dept_id = pair[1]
                team_name = pair[2]
                dept_name = pair[3]
                
                # Get department node ID
                dept_node_query = """
                SELECT id FROM nodes 
                WHERE tenant_id = :tenant_id AND props->>'entity_id' = :entity_id AND type = 'department';
                """
                dept_node_result = await execute_query(
                    session, 
                    dept_node_query, 
                    {"tenant_id": tenant_id, "entity_id": str(dept_id)}
                )
                dept_node_id = dept_node_result.scalar()
                
                # Get team node ID
                team_node_query = """
                SELECT id FROM nodes 
                WHERE tenant_id = :tenant_id AND props->>'entity_id' = :entity_id AND type = 'team';
                """
                team_node_result = await execute_query(
                    session, 
                    team_node_query, 
                    {"tenant_id": tenant_id, "entity_id": str(team_id)}
                )
                team_node_id = team_node_result.scalar()
                
                if not dept_node_id:
                    print(f"Department node not found for: {dept_name}")
                    continue
                
                if not team_node_id:
                    print(f"Team node not found for: {team_name}")
                    continue
                
                # Check if edge already exists
                check_edge_query = """
                SELECT id FROM edges 
                WHERE tenant_id = :tenant_id AND src = :src AND dst = :dst AND label = 'HAS_TEAM';
                """
                check_edge_result = await execute_query(
                    session, 
                    check_edge_query, 
                    {"tenant_id": tenant_id, "src": dept_node_id, "dst": team_node_id}
                )
                existing_edge = check_edge_result.scalar()
                
                if existing_edge:
                    print(f"Edge already exists between {dept_name} and {team_name}")
                    continue
                
                # Create edge
                edge_query = """
                INSERT INTO edges (id, tenant_id, src, dst, label, props, created_at, updated_at)
                VALUES (:id, :tenant_id, :src, :dst, :label, :props, :created_at, :updated_at);
                """
                edge_id = uuid.uuid4()
                now = datetime.now(timezone.utc)
                
                await execute_query(
                    session,
                    edge_query,
                    {
                        "id": edge_id,
                        "tenant_id": tenant_id,
                        "src": dept_node_id,
                        "dst": team_node_id,
                        "label": "HAS_TEAM",
                        "props": json.dumps({}),
                        "created_at": now,
                        "updated_at": now
                    }
                )
                
                print(f"Created edge: {dept_name} HAS_TEAM {team_name}")
            
            # Commit the transaction
            await session.commit()
            print("Department nodes and edges creation completed successfully")
            
        except Exception as e:
            print(f"Error creating department nodes and edges: {str(e)}")
            await session.rollback()
            raise

async def main():
    """Main function."""
    await create_department_nodes()

if __name__ == "__main__":
    asyncio.run(main())