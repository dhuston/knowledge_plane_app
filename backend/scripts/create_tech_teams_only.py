#!/usr/bin/env python3
"""
Script to create just teams for the Tech Innovations Inc. tenant in Biosphere Alpha.
"""

import asyncio
import uuid
from datetime import datetime

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Define tenant details - these should match existing tenant
TENANT_NAME = "Tech Innovations Inc."
TENANT_DOMAIN = "techinnovations.com"

# Database connection
DATABASE_URL = "postgresql+asyncpg://postgres:password@db:5432/knowledgeplan_dev"

# Create async engine
engine = create_async_engine(DATABASE_URL)
async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

# Use naive datetime - no timezone for compatibility
now = datetime.utcnow()

async def execute_query(session, query, params=None):
    """Execute a raw SQL query with parameters."""
    result = await session.execute(text(query), params)
    return result

async def create_tech_teams():
    """Create teams for Tech Innovations Inc."""
    async with async_session() as session:
        try:
            # 1. Get tenant ID
            tenant_query = """
            SELECT id FROM tenants WHERE domain = :domain;
            """
            tenant_result = await execute_query(session, tenant_query, {"domain": TENANT_DOMAIN})
            tenant_id = tenant_result.scalar_one()
            print(f"Found tenant ID: {tenant_id}")
                
            # 2. Create teams
            teams = [
                {"name": "Frontend", "description": "Frontend development"},
                {"name": "Backend", "description": "Backend services and APIs"},
                {"name": "DevOps", "description": "Infrastructure and deployment"},
                {"name": "Mobile", "description": "Mobile app development"},
                {"name": "Data Science", "description": "ML and data analytics"}
            ]
            
            for team in teams:
                team_check_query = """
                SELECT id FROM teams 
                WHERE tenant_id = :tenant_id AND name = :name;
                """
                team_result = await execute_query(session, 
                                            team_check_query, 
                                            {"tenant_id": tenant_id, "name": team["name"]})
                team_id = team_result.scalar()
                
                if not team_id:
                    team_id = str(uuid.uuid4())
                    
                    team_query = """
                    INSERT INTO teams (id, tenant_id, name, description, created_at, updated_at)
                    VALUES (:team_id, :tenant_id, :name, :description, :created_at, :updated_at)
                    RETURNING id;
                    """
                    
                    team_params = {
                        "team_id": team_id,
                        "tenant_id": tenant_id,
                        "name": team["name"],
                        "description": team["description"],
                        "created_at": now,
                        "updated_at": now
                    }
                    
                    await execute_query(session, team_query, team_params)
                    print(f"Created team: {team['name']}")
                else:
                    print(f"Team already exists: {team['name']}")
                
            # Commit all changes
            await session.commit()
            
            print("\n--- Tech Company Teams Created Successfully ---")
            print(f"Created {len(teams)} teams")
            
        except Exception as e:
            print(f"Error creating teams: {e}")
            # Roll back the transaction
            await session.rollback()
            raise

async def main():
    try:
        await create_tech_teams()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())