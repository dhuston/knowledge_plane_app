#!/usr/bin/env python3
"""
Script to create edge connections between teams and projects in the Tech Innovations Inc. tenant.
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

async def create_team_project_edges():
    """Create edges between teams and projects in Tech Innovations Inc."""
    async with async_session() as session:
        try:
            # 1. Get tenant ID
            tenant_query = """
            SELECT id FROM tenants WHERE domain = :domain;
            """
            tenant_result = await execute_query(session, tenant_query, {"domain": TENANT_DOMAIN})
            tenant_id = tenant_result.scalar_one()
            print(f"Found tenant ID: {tenant_id}")
            
            # 2. Get team assignments for projects
            # Assign projects to teams manually for the demo
            project_team_assignments = [
                {"project_name": "NextGen Cloud Platform", "team_name": "Backend"},
                {"project_name": "Mobile App v3.0", "team_name": "Mobile"},
                {"project_name": "Developer Productivity Toolkit", "team_name": "DevOps"},
                {"project_name": "Customer Data Platform Integration", "team_name": "Data Science"},
                {"project_name": "AI Assistant Product Feature", "team_name": "Data Science"}
            ]
            
            # 3. Create edges for each assignment
            for assignment in project_team_assignments:
                # Get team node
                team_node_query = """
                SELECT n.id FROM nodes n
                JOIN teams t ON n.props->>'entity_id' = t.id::text
                WHERE n.tenant_id = :tenant_id 
                AND n.type = 'team'
                AND t.name = :team_name;
                """
                team_result = await execute_query(
                    session, 
                    team_node_query, 
                    {"tenant_id": tenant_id, "team_name": assignment["team_name"]}
                )
                team_node_id = team_result.scalar()
                
                # Get project node
                project_node_query = """
                SELECT n.id FROM nodes n
                WHERE n.tenant_id = :tenant_id 
                AND n.type = 'project'
                AND n.props->>'name' = :project_name;
                """
                project_result = await execute_query(
                    session, 
                    project_node_query, 
                    {"tenant_id": tenant_id, "project_name": assignment["project_name"]}
                )
                project_node_id = project_result.scalar()
                
                if not team_node_id:
                    print(f"Team node not found for: {assignment['team_name']}")
                    continue
                
                if not project_node_id:
                    print(f"Project node not found for: {assignment['project_name']}")
                    continue
                
                # Check if edge already exists
                check_query = """
                SELECT id FROM edges 
                WHERE tenant_id = :tenant_id AND src = :src AND dst = :dst AND label = 'OWNS';
                """
                check_result = await execute_query(
                    session, 
                    check_query, 
                    {"tenant_id": tenant_id, "src": team_node_id, "dst": project_node_id}
                )
                existing_edge = check_result.scalar()
                
                if existing_edge:
                    print(f"Edge already exists between {assignment['team_name']} and {assignment['project_name']}")
                    continue
                
                # Create edge
                edge_query = """
                INSERT INTO edges (id, tenant_id, src, dst, label, props, created_at, updated_at)
                VALUES (:id, :tenant_id, :src, :dst, :label, :props, :created_at, :updated_at);
                """
                edge_id = uuid.uuid4()
                now = datetime.now(timezone.utc)
                edge_props = {}
                
                await execute_query(
                    session,
                    edge_query,
                    {
                        "id": edge_id,
                        "tenant_id": tenant_id,
                        "src": team_node_id,
                        "dst": project_node_id,
                        "label": "OWNS",
                        "props": json.dumps(edge_props),
                        "created_at": now,
                        "updated_at": now
                    }
                )
                
                print(f"Created edge: {assignment['team_name']} OWNS {assignment['project_name']}")
            
            # Commit the transaction
            await session.commit()
            print("Team-project edge creation completed successfully")
            
        except Exception as e:
            print(f"Error creating team-project edges: {str(e)}")
            await session.rollback()
            raise

async def main():
    """Main function."""
    await create_team_project_edges()

if __name__ == "__main__":
    asyncio.run(main())