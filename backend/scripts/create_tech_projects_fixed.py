#!/usr/bin/env python3
"""
Script to create projects for the Tech Innovations Inc. tenant in Biosphere Alpha.
"""

import asyncio
import json
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
past_month = now.replace(day=1)  # Just use a simple past date
future_month = now.replace(day=28)  # Simple future date

async def execute_query(session, query, params=None):
    """Execute a raw SQL query with parameters."""
    result = await session.execute(text(query), params)
    return result

async def create_tech_projects():
    """Create projects for Tech Innovations Inc."""
    async with async_session() as session:
        try:
            # 1. Get tenant ID
            tenant_query = """
            SELECT id FROM tenants WHERE domain = :domain;
            """
            tenant_result = await execute_query(session, tenant_query, {"domain": TENANT_DOMAIN})
            tenant_id = tenant_result.scalar_one()
            print(f"Found tenant ID: {tenant_id}")
            
            # Get demo user ID to use as project owner
            user_query = """
            SELECT id FROM users WHERE tenant_id = :tenant_id LIMIT 1;
            """
            user_result = await execute_query(session, user_query, {"tenant_id": tenant_id})
            owner_id = user_result.scalar_one()
            print(f"Using user ID as owner: {owner_id}")
                
            # 2. Create projects
            projects = [
                {
                    "name": "NextGen Cloud Platform", 
                    "description": "Complete redesign of our cloud computing platform with containerization, microservices, and serverless capabilities",
                    "status": "in_progress"
                },
                {
                    "name": "Mobile App v3.0", 
                    "description": "Major update to our mobile application with AI-powered features, improved UI, and faster performance",
                    "status": "active"
                },
                {
                    "name": "Developer Productivity Toolkit", 
                    "description": "Internal tooling improvements for developer workflows including automated testing, CI/CD enhancements, and code quality checks",
                    "status": "planning"
                },
                {
                    "name": "Customer Data Platform Integration", 
                    "description": "Integration of marketing, sales and product data to create a unified customer data platform",
                    "status": "active"
                },
                {
                    "name": "AI Assistant Product Feature", 
                    "description": "Development of an AI assistant feature for our core product to provide contextual help and automate routine tasks",
                    "status": "in_progress"
                }
            ]
            
            for project in projects:
                project_check_query = """
                SELECT id FROM projects 
                WHERE tenant_id = :tenant_id AND name = :name;
                """
                project_result = await execute_query(session, 
                                                project_check_query, 
                                                {"tenant_id": tenant_id, "name": project["name"]})
                project_id = project_result.scalar()
                
                if not project_id:
                    project_id = str(uuid.uuid4())
                    
                    # Set project properties - convert UUID to string
                    properties = {
                        "start_date": past_month.isoformat(),
                        "target_date": future_month.isoformat(),
                        "priority": "HIGH",
                        "owner_id": str(owner_id)  # Convert UUID to string
                    }
                    
                    project_query = """
                    INSERT INTO projects (
                        id, tenant_id, name, description, status, properties,
                        created_at, updated_at
                    )
                    VALUES (
                        :project_id, :tenant_id, :name, :description, :status, :properties,
                        :created_at, :updated_at
                    )
                    RETURNING id;
                    """
                    
                    project_params = {
                        "project_id": project_id,
                        "tenant_id": tenant_id,
                        "name": project["name"],
                        "description": project["description"],
                        "status": project["status"],
                        "properties": json.dumps(properties),
                        "created_at": now,
                        "updated_at": now
                    }
                    
                    await execute_query(session, project_query, project_params)
                    print(f"Created project: {project['name']}")

                    # Create project node for graph visualization
                    project_node_id = str(uuid.uuid4())
                    project_node_query = """
                    INSERT INTO nodes (id, tenant_id, type, props)
                    VALUES (:node_id, :tenant_id, 'project', :props)
                    RETURNING id;
                    """
                    
                    project_props = {
                        "entity_id": project_id,
                        "name": project["name"],
                        "label": project["name"],
                        "status": project["status"]
                    }
                    
                    project_node_params = {
                        "node_id": project_node_id,
                        "tenant_id": tenant_id,
                        "props": json.dumps(project_props)
                    }
                    
                    await execute_query(session, project_node_query, project_node_params)
                    print(f"Created node for project: {project['name']}")
                else:
                    print(f"Project already exists: {project['name']}")
                
            # Commit all changes
            await session.commit()
            
            print("\n--- Tech Company Projects Created Successfully ---")
            print(f"Created {len(projects)} projects")
            
        except Exception as e:
            print(f"Error creating projects: {e}")
            # Roll back the transaction
            await session.rollback()
            raise

async def main():
    try:
        await create_tech_projects()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())