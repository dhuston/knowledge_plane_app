#!/usr/bin/env python3
"""
Script to create a tech company tenant in Biosphere Alpha.
"""

import asyncio
import json
import uuid
from datetime import datetime, timedelta

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Define tenant details
TENANT_NAME = "Tech Innovations Inc."
TENANT_DOMAIN = "techinnovations.com"
TENANT_ID = str(uuid.uuid4())

# Database connection from config
DATABASE_URL = "postgresql+asyncpg://postgres:password@db:5432/knowledgeplan_dev"

# Create async engine
engine = create_async_engine(DATABASE_URL)
async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def execute_query(session, query, params=None):
    """Execute a raw SQL query with parameters."""
    result = await session.execute(text(query), params)
    return result

async def create_tech_tenant():
    """Create the tech company tenant and related entities."""
    async with async_session() as session:
        # 1. Create the tenant
        tenant_query = """
        INSERT INTO tenants (id, name, domain, settings, created_at, updated_at, is_active)
        VALUES (:tenant_id, :name, :domain, :settings, :created_at, :updated_at, TRUE)
        RETURNING id;
        """
        
        tenant_settings = {
            "features": {
                "advanced_analytics": True,
                "collaboration": True,
                "integration_framework": True,
                "knowledge_management": True
            },
            "branding": {
                "primary_color": "#4285F4",  # Google blue
                "secondary_color": "#34A853",  # Google green
                "logo_url": "https://placeholder.com/logo.png"
            },
            "company": {
                "type": "Technology",
                "industry": "Software",
                "size": "Medium Enterprise",
                "founded": 2010,
                "headquarters": "San Francisco, CA"
            }
        }
        
        now = datetime.utcnow()
        
        tenant_params = {
            "tenant_id": TENANT_ID,
            "name": TENANT_NAME,
            "domain": TENANT_DOMAIN,
            "settings": json.dumps(tenant_settings),
            "created_at": now,
            "updated_at": now
        }
        
        await execute_query(session, tenant_query, tenant_params)
        print(f"Created tenant: {TENANT_NAME} with ID {TENANT_ID}")
        
        # 2. Create departments
        departments = [
            {"name": "Engineering", "description": "Software development and infrastructure"},
            {"name": "Product", "description": "Product management and design"},
            {"name": "Marketing", "description": "Marketing and communications"},
            {"name": "Sales", "description": "Sales and business development"},
            {"name": "Operations", "description": "Business operations and finance"},
            {"name": "Research", "description": "Advanced research and innovation"}
        ]
        
        department_ids = {}
        for dept in departments:
            dept_id = str(uuid.uuid4())
            dept_query = """
            INSERT INTO departments (id, tenant_id, name, description, created_at, updated_at)
            VALUES (:dept_id, :tenant_id, :name, :description, :created_at, :updated_at)
            RETURNING id;
            """
            
            dept_params = {
                "dept_id": dept_id,
                "tenant_id": TENANT_ID,
                "name": dept["name"],
                "description": dept["description"],
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, dept_query, dept_params)
            department_ids[dept["name"]] = dept_id
            print(f"Created department: {dept['name']}")
        
        # 3. Create teams
        teams = [
            {"name": "Frontend", "description": "Frontend development", "department": "Engineering"},
            {"name": "Backend", "description": "Backend services and APIs", "department": "Engineering"},
            {"name": "DevOps", "description": "Infrastructure and deployment", "department": "Engineering"},
            {"name": "Mobile", "description": "Mobile app development", "department": "Engineering"},
            {"name": "Data Science", "description": "ML and data analytics", "department": "Engineering"},
            {"name": "QA", "description": "Quality assurance and testing", "department": "Engineering"},
            {"name": "UX/UI", "description": "User experience and design", "department": "Product"},
            {"name": "Product Management", "description": "Product vision and roadmaps", "department": "Product"},
            {"name": "Digital Marketing", "description": "Online marketing campaigns", "department": "Marketing"},
            {"name": "Content", "description": "Content creation and management", "department": "Marketing"},
            {"name": "Sales Development", "description": "Lead generation and qualification", "department": "Sales"},
            {"name": "Account Management", "description": "Client relationship management", "department": "Sales"},
            {"name": "Finance", "description": "Accounting and financial planning", "department": "Operations"},
            {"name": "HR", "description": "Human resources and talent acquisition", "department": "Operations"},
            {"name": "AI Research", "description": "Advanced AI research", "department": "Research"},
            {"name": "Quantum Computing", "description": "Quantum computing applications", "department": "Research"}
        ]
        
        team_ids = {}
        for team in teams:
            team_id = str(uuid.uuid4())
            dept_id = department_ids[team["department"]]
            
            team_query = """
            INSERT INTO teams (id, tenant_id, name, description, department_id, created_at, updated_at)
            VALUES (:team_id, :tenant_id, :name, :description, :dept_id, :created_at, :updated_at)
            RETURNING id;
            """
            
            team_params = {
                "team_id": team_id,
                "tenant_id": TENANT_ID,
                "name": team["name"],
                "description": team["description"],
                "dept_id": dept_id,
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, team_query, team_params)
            team_ids[team["name"]] = team_id
            print(f"Created team: {team['name']} in {team['department']}")
        
        # 4. Create admin user
        admin_id = str(uuid.uuid4())
        admin_query = """
        INSERT INTO users (
            id, tenant_id, name, email, title, 
            auth_provider, auth_provider_id, created_at, updated_at
        )
        VALUES (
            :user_id, :tenant_id, :name, :email, :title,
            'mock', :auth_provider_id, :created_at, :updated_at
        )
        RETURNING id;
        """
        
        admin_params = {
            "user_id": admin_id,
            "tenant_id": TENANT_ID,
            "name": "Tech Admin",
            "email": f"admin@{TENANT_DOMAIN}",
            "title": "System Administrator",
            "auth_provider_id": f"tech-admin-{uuid.uuid4()}",
            "created_at": now,
            "updated_at": now
        }
        
        await execute_query(session, admin_query, admin_params)
        print(f"Created admin user: admin@{TENANT_DOMAIN}")
        
        # 5. Create regular users
        users_data = [
            {"name": "Sarah Chen", "email": f"sarah.chen@{TENANT_DOMAIN}", "title": "Frontend Engineer", "team": "Frontend"},
            {"name": "Michael Rodriguez", "email": f"michael.r@{TENANT_DOMAIN}", "title": "Backend Engineer", "team": "Backend"},
            {"name": "Raj Patel", "email": f"raj.patel@{TENANT_DOMAIN}", "title": "DevOps Engineer", "team": "DevOps"},
            {"name": "Emily Watson", "email": f"emily.w@{TENANT_DOMAIN}", "title": "UX Designer", "team": "UX/UI"},
            {"name": "Alex Johnson", "email": f"alex.j@{TENANT_DOMAIN}", "title": "Product Manager", "team": "Product Management"},
            {"name": "Sophia Kim", "email": f"sophia.k@{TENANT_DOMAIN}", "title": "Marketing Specialist", "team": "Digital Marketing"},
            {"name": "David Thompson", "email": f"david.t@{TENANT_DOMAIN}", "title": "Sales Representative", "team": "Sales Development"},
            {"name": "Lisa Garcia", "email": f"lisa.g@{TENANT_DOMAIN}", "title": "Financial Analyst", "team": "Finance"},
            {"name": "Kevin Lee", "email": f"kevin.l@{TENANT_DOMAIN}", "title": "AI Researcher", "team": "AI Research"},
            {"name": "Priya Sharma", "email": f"priya.s@{TENANT_DOMAIN}", "title": "Quantum Engineer", "team": "Quantum Computing"},
            {"name": "James Wilson", "email": f"james.w@{TENANT_DOMAIN}", "title": "Mobile Developer", "team": "Mobile"},
            {"name": "Zoe Martinez", "email": f"zoe.m@{TENANT_DOMAIN}", "title": "Data Scientist", "team": "Data Science"},
            {"name": "Tyler Brown", "email": f"tyler.b@{TENANT_DOMAIN}", "title": "QA Engineer", "team": "QA"},
            {"name": "Hannah Miller", "email": f"hannah.m@{TENANT_DOMAIN}", "title": "Content Creator", "team": "Content"},
            {"name": "Chris Taylor", "email": f"chris.t@{TENANT_DOMAIN}", "title": "Account Manager", "team": "Account Management"},
            {"name": "Olivia White", "email": f"olivia.w@{TENANT_DOMAIN}", "title": "HR Manager", "team": "HR"}
        ]
        
        # Create a user per team to be the team lead
        user_ids = {}
        for user_data in users_data:
            user_id = str(uuid.uuid4())
            team_id = team_ids[user_data["team"]]
            
            user_query = """
            INSERT INTO users (
                id, tenant_id, name, email, title, 
                team_id, auth_provider, auth_provider_id, created_at, updated_at
            )
            VALUES (
                :user_id, :tenant_id, :name, :email, :title, 
                :team_id, 'mock', :auth_provider_id, :created_at, :updated_at
            )
            RETURNING id;
            """
            
            user_params = {
                "user_id": user_id,
                "tenant_id": TENANT_ID,
                "name": user_data["name"],
                "email": user_data["email"],
                "title": user_data["title"],
                "team_id": team_id,
                "auth_provider_id": f"tech-user-{user_data['name'].replace(' ', '-').lower()}-{uuid.uuid4()}",
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, user_query, user_params)
            user_ids[user_data["email"]] = user_id
            print(f"Created user: {user_data['name']}")
        
        # 6. Update teams with lead_id (first user in each team becomes the lead)
        for team in teams:
            team_id = team_ids[team["name"]]
            # Find a user in this team
            for user_data in users_data:
                if user_data["team"] == team["name"]:
                    lead_id = user_ids[user_data["email"]]
                    
                    update_team_query = """
                    UPDATE teams SET lead_id = :lead_id WHERE id = :team_id
                    """
                    
                    update_params = {
                        "lead_id": lead_id,
                        "team_id": team_id
                    }
                    
                    await execute_query(session, update_team_query, update_params)
                    print(f"Set {user_data['name']} as team lead for {team['name']}")
                    break  # Only set the first user as lead
        
        # 7. Create some projects
        projects = [
            {"name": "Cloud Platform Redesign", "description": "Redesign of our cloud computing platform", "status": "in_progress"},
            {"name": "Mobile App v2", "description": "Next generation mobile application", "status": "planning"},
            {"name": "AI Integration", "description": "Integrate AI capabilities into core products", "status": "in_progress"},
            {"name": "Quantum Algorithm Research", "description": "Research into quantum algorithms for optimization", "status": "active"}
        ]
        
        for project in projects:
            project_id = str(uuid.uuid4())
            
            project_query = """
            INSERT INTO projects (
                id, tenant_id, name, description, status, created_at, updated_at, properties
            )
            VALUES (
                :project_id, :tenant_id, :name, :description, :status, :created_at, :updated_at, :properties
            )
            RETURNING id;
            """
            
            # Set project properties with dates
            properties = {
                "start_date": (now - timedelta(days=30)).isoformat(),
                "target_date": (now + timedelta(days=90)).isoformat()
            }
            
            project_params = {
                "project_id": project_id,
                "tenant_id": TENANT_ID,
                "name": project["name"],
                "description": project["description"],
                "status": project["status"],
                "properties": json.dumps(properties),
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, project_query, project_params)
            print(f"Created project: {project['name']}")
        
        # 8. Create a few goals
        goals = [
            {"name": "Increase Platform Usage", "description": "Increase daily active users by 30%", "status": "in_progress"},
            {"name": "Launch New Product Line", "description": "Complete development of next-gen products", "status": "active"},
            {"name": "Optimize Infrastructure", "description": "Reduce cloud costs by 20%", "status": "active"}
        ]
        
        for goal in goals:
            goal_id = str(uuid.uuid4())
            
            goal_query = """
            INSERT INTO goals (
                id, tenant_id, title, description, status, type, created_at, updated_at
            )
            VALUES (
                :goal_id, :tenant_id, :title, :description, :status, :type, :created_at, :updated_at
            )
            RETURNING id;
            """
            
            goal_params = {
                "goal_id": goal_id,
                "tenant_id": TENANT_ID,
                "title": goal["name"],
                "description": goal["description"],
                "status": goal["status"],
                "type": "ENTERPRISE",
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, goal_query, goal_params)
            print(f"Created goal: {goal['name']}")
        
        # Commit all changes
        await session.commit()
        
        print("\n--- Tech Company Tenant Created Successfully ---")
        print(f"Tenant: {TENANT_NAME} ({TENANT_DOMAIN})")
        print(f"Departments: {len(departments)}")
        print(f"Teams: {len(teams)}")
        print(f"Users: {len(users_data) + 1}")  # +1 for admin
        print(f"Projects: {len(projects)}")
        print(f"Goals: {len(goals)}")
        print("\nAdmin User:")
        print(f"  Email: admin@{TENANT_DOMAIN}")
        print("  Password: password123 (default mock password)")

async def main():
    try:
        await create_tech_tenant()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())