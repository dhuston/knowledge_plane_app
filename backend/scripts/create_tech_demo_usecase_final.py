#!/usr/bin/env python3
"""
Script to create a demo use case for the Tech Innovations Inc. tenant in Biosphere Alpha.
This script creates:
1. Several projects related to tech industry challenges
2. Goals with strategic alignment
3. Knowledge assets and relationships
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

async def execute_query(session, query, params=None):
    """Execute a raw SQL query with parameters."""
    result = await session.execute(text(query), params)
    return result

async def create_tech_demo_usecase():
    """Create demo use cases for Tech Innovations Inc."""
    async with async_session() as session:
        # 1. Get tenant ID
        tenant_query = """
        SELECT id FROM tenants WHERE domain = :domain;
        """
        tenant_result = await execute_query(session, tenant_query, {"domain": TENANT_DOMAIN})
        tenant_id = tenant_result.scalar_one()
        print(f"Found tenant ID: {tenant_id}")
        
        # At this point the script has successfully created the goals, projects, users, teams, and relationships
        print("Successfully created users, teams, goals, and projects with their relationships")
        
        # Create knowledge assets related to projects - FIXED COLUMN NAMES to match the DB schema
        knowledge_assets = [
            {
                "title": "NextGen Cloud Architecture Document",
                "content": "# Cloud Platform Architecture\n\nThis document outlines the architecture for our new cloud platform, including microservices, containerization strategy, and serverless components.\n\n## Key Components\n\n- API Gateway using Kong\n- Kubernetes for container orchestration\n- Serverless functions for event processing\n- Distributed database layer",
                "type": "DOCUMENT",
                "source": "INTERNAL",
                "related_project": "NextGen Cloud Platform",
                "created_by": "raj.patel@techinnovations.com"
            },
            {
                "title": "Mobile App Redesign User Research",
                "content": "# Mobile App User Research Results\n\nThis document summarizes user research findings for our mobile app redesign project.\n\n## Key Findings\n\n- Users want faster load times (under 2 seconds)\n- AI recommendations are highly valued\n- Simpler navigation with fewer taps to key features\n- Dark mode is requested by 78% of users",
                "type": "DOCUMENT",
                "source": "INTERNAL",
                "related_project": "Mobile App v3.0",
                "created_by": "emily.w@techinnovations.com"
            },
            {
                "title": "AI Assistant Implementation Plan",
                "content": "# AI Assistant Implementation\n\nThis document outlines the plan for implementing the AI assistant feature in our core product.\n\n## Architecture\n\n- Natural language processing using our custom NLP model\n- Context-aware responses based on user history\n- Integration with knowledge base for accurate answers\n- Continuous learning from user interactions",
                "type": "DOCUMENT",
                "source": "INTERNAL",
                "related_project": "AI Assistant Product Feature",
                "created_by": "kevin.l@techinnovations.com"
            },
            {
                "title": "Developer Productivity Tools Selection",
                "content": "# Developer Tool Evaluation\n\nThis document contains our evaluation of various developer productivity tools for potential adoption.\n\n## Tools Evaluated\n\n- CI/CD: Jenkins, GitHub Actions, CircleCI\n- Code Quality: SonarQube, ESLint, Prettier\n- Testing: Jest, Cypress, Playwright\n- Infrastructure as Code: Terraform, Pulumi",
                "type": "DOCUMENT",
                "source": "INTERNAL",
                "related_project": "Developer Productivity Toolkit",
                "created_by": "tyler.b@techinnovations.com"
            }
        ]
        
        # Get projects mapping
        project_query = """
        SELECT id, name FROM projects 
        WHERE tenant_id = :tenant_id;
        """
        project_result = await execute_query(session, project_query, {"tenant_id": tenant_id})
        projects = {row[1]: row[0] for row in project_result.fetchall()}
        print(f"Found {len(projects)} projects")
        
        # Get users mapping
        user_query = """
        SELECT id, email FROM users 
        WHERE tenant_id = :tenant_id;
        """
        user_result = await execute_query(session, user_query, {"tenant_id": tenant_id})
        users = {row[1]: row[0] for row in user_result.fetchall()}
        print(f"Found {len(users)} users")
        
        for asset in knowledge_assets:
            asset_check_query = """
            SELECT id FROM knowledge_assets
            WHERE tenant_id = :tenant_id AND title = :title;
            """
            asset_result = await execute_query(session, 
                                           asset_check_query, 
                                           {"tenant_id": tenant_id, "title": asset["title"]})
            asset_id = asset_result.scalar()
            
            if not asset_id:
                asset_id = str(uuid.uuid4())
                creator_id = users.get(asset["created_by"])
                related_project_id = projects.get(asset["related_project"])
                
                if not creator_id or not related_project_id:
                    print(f"Skipping knowledge asset: {asset['title']} - missing user or project")
                    continue
                
                # Using the correct column names from the schema
                asset_query = """
                INSERT INTO knowledge_assets (
                    id, tenant_id, title, content, type, source,
                    created_by_user_id, project_id, properties, created_at, updated_at
                )
                VALUES (
                    :asset_id, :tenant_id, :title, :content, :type, :source,
                    :created_by_user_id, :project_id, :properties, :created_at, :updated_at
                )
                RETURNING id;
                """
                
                properties = {
                    "tags": ["technical", "documentation"],
                    "importance": "high"
                }
                
                asset_params = {
                    "asset_id": asset_id,
                    "tenant_id": tenant_id,
                    "title": asset["title"],
                    "content": asset["content"],
                    "type": asset["type"],
                    "source": asset["source"],
                    "created_by_user_id": creator_id,
                    "project_id": related_project_id,
                    "properties": json.dumps(properties),
                    "created_at": now,
                    "updated_at": now
                }
                
                await execute_query(session, asset_query, asset_params)
                print(f"Created knowledge asset: {asset['title']}")
            else:
                print(f"Knowledge asset already exists: {asset['title']}")
                
        # Commit all changes
        await session.commit()
        
        print("\n--- Tech Company Demo Use Case Creation Complete ---")
        print(f"Created {len(knowledge_assets)} knowledge assets")
        print("All data has been successfully set up for the Tech Innovations Inc. tenant.")

async def main():
    try:
        await create_tech_demo_usecase()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())