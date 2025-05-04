#!/usr/bin/env python3
"""
Script to create node entries for existing teams in the Tech Innovations Inc. tenant.
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

async def create_team_nodes():
    """Create graph nodes for existing teams in Tech Innovations Inc."""
    async with async_session() as session:
        try:
            # 1. Get tenant ID
            tenant_query = """
            SELECT id FROM tenants WHERE domain = :domain;
            """
            tenant_result = await execute_query(session, tenant_query, {"domain": TENANT_DOMAIN})
            tenant_id = tenant_result.scalar_one()
            print(f"Found tenant ID: {tenant_id}")
            
            # 2. Get existing teams
            teams_query = """
            SELECT id, name, description FROM teams WHERE tenant_id = :tenant_id;
            """
            teams_result = await execute_query(session, teams_query, {"tenant_id": tenant_id})
            teams = teams_result.fetchall()
            print(f"Found {len(teams)} teams")
            
            # 3. Create nodes for each team
            for team in teams:
                team_id = team[0]
                team_name = team[1]
                team_description = team[2] or ""
                
                # Check if node already exists
                check_query = """
                SELECT id FROM nodes 
                WHERE tenant_id = :tenant_id AND props->>'entity_id' = :entity_id AND type = 'team';
                """
                check_result = await execute_query(
                    session, 
                    check_query, 
                    {"tenant_id": tenant_id, "entity_id": str(team_id)}
                )
                existing_node = check_result.scalar()
                
                if existing_node:
                    print(f"Node already exists for team: {team_name}")
                    continue
                
                # Generate random coordinates for the team
                import random
                x = random.uniform(-100, 100)
                y = random.uniform(-100, 100)
                
                # Create node properties
                node_props = {
                    "name": team_name,
                    "description": team_description,
                    "entity_id": str(team_id),
                    "entity_type": "team"
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
                        "type": "team",
                        "props": json.dumps(node_props),
                        "x": x,
                        "y": y,
                        "created_at": now,
                        "updated_at": now
                    }
                )
                
                print(f"Created node for team: {team_name}")
            
            # Commit the transaction
            await session.commit()
            print("Team nodes creation completed successfully")
            
        except Exception as e:
            print(f"Error creating team nodes: {str(e)}")
            await session.rollback()
            raise

async def main():
    """Main function."""
    await create_team_nodes()

if __name__ == "__main__":
    asyncio.run(main())