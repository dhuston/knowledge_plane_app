#!/usr/bin/env python3
"""
Script to create a manufacturing tenant in Biosphere Alpha.
"""

import asyncio
import uuid
from datetime import datetime, timedelta

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Define tenant details
TENANT_NAME = "Advanced Manufacturing Corp"
TENANT_DOMAIN = "advancedmfg.com"
TENANT_ID = str(uuid.uuid4())

# Database connection from config
DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/biosphere"

# Create async engine
engine = create_async_engine(DATABASE_URL)
async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def execute_query(session, query, params=None):
    """Execute a raw SQL query with parameters."""
    result = await session.execute(text(query), params)
    return result

async def create_manufacturing_tenant():
    """Create the manufacturing tenant and related entities."""
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
                "primary_color": "#E67E22",  # Orange
                "secondary_color": "#34495E",  # Dark blue
                "logo_url": "https://placeholder.com/manufacturing-logo.png"
            },
            "company": {
                "type": "Manufacturing",
                "industry": "Advanced Manufacturing & Engineering",
                "size": "Large Enterprise",
                "founded": 1978,
                "headquarters": "Detroit, MI",
                "facilities": 12,
                "employees": 15000,
                "annual_production": "350,000 units"
            }
        }
        
        now = datetime.utcnow()
        
        tenant_params = {
            "tenant_id": TENANT_ID,
            "name": TENANT_NAME,
            "domain": TENANT_DOMAIN,
            "settings": tenant_settings,
            "created_at": now,
            "updated_at": now
        }
        
        await execute_query(session, tenant_query, tenant_params)
        print(f"Created tenant: {TENANT_NAME} with ID {TENANT_ID}")
        
        # 2. Create departments
        departments = [
            {"name": "Engineering", "description": "Product design and engineering"},
            {"name": "Production", "description": "Manufacturing operations and assembly"},
            {"name": "Quality Assurance", "description": "Quality control and testing"},
            {"name": "Supply Chain", "description": "Procurement and logistics"},
            {"name": "Research & Development", "description": "New product development and innovation"},
            {"name": "Maintenance", "description": "Equipment maintenance and facilities"},
            {"name": "Safety & Compliance", "description": "Safety protocols and regulatory compliance"},
            {"name": "Operations", "description": "Business operations and administration"}
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
            {"name": "Mechanical Engineering", "description": "Mechanical design and testing", "department": "Engineering"},
            {"name": "Electrical Engineering", "description": "Electrical systems design", "department": "Engineering"},
            {"name": "Software Engineering", "description": "Embedded systems and software", "department": "Engineering"},
            
            {"name": "Assembly Line A", "description": "Main assembly line operations", "department": "Production"},
            {"name": "Assembly Line B", "description": "Secondary assembly line", "department": "Production"},
            {"name": "Machining", "description": "Precision machining operations", "department": "Production"},
            {"name": "Finishing", "description": "Product finishing and painting", "department": "Production"},
            
            {"name": "Testing", "description": "Product testing and validation", "department": "Quality Assurance"},
            {"name": "Inspection", "description": "Component and assembly inspection", "department": "Quality Assurance"},
            {"name": "Quality Systems", "description": "Quality management systems", "department": "Quality Assurance"},
            
            {"name": "Procurement", "description": "Materials and component sourcing", "department": "Supply Chain"},
            {"name": "Logistics", "description": "Shipping and distribution", "department": "Supply Chain"},
            {"name": "Inventory Management", "description": "Warehouse and inventory control", "department": "Supply Chain"},
            
            {"name": "Product Innovation", "description": "Next-generation product development", "department": "Research & Development"},
            {"name": "Materials Research", "description": "Advanced materials research", "department": "Research & Development"},
            {"name": "Process Innovation", "description": "Manufacturing process improvements", "department": "Research & Development"},
            
            {"name": "Equipment Maintenance", "description": "Machine repair and maintenance", "department": "Maintenance"},
            {"name": "Facilities Management", "description": "Building and infrastructure", "department": "Maintenance"},
            
            {"name": "Safety Operations", "description": "Safety protocols and training", "department": "Safety & Compliance"},
            {"name": "Environmental Compliance", "description": "Environmental regulations and sustainability", "department": "Safety & Compliance"},
            
            {"name": "Planning", "description": "Production planning and scheduling", "department": "Operations"},
            {"name": "Business Intelligence", "description": "Data analytics and reporting", "department": "Operations"},
            {"name": "Digital Transformation", "description": "Industry 4.0 and smart factory initiatives", "department": "Operations"}
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
            id, tenant_id, name, email, title, is_active, is_admin,
            auth_provider, auth_provider_id, created_at, updated_at
        )
        VALUES (
            :user_id, :tenant_id, :name, :email, :title, TRUE, TRUE,
            'mock', :auth_provider_id, :created_at, :updated_at
        )
        RETURNING id;
        """
        
        admin_params = {
            "user_id": admin_id,
            "tenant_id": TENANT_ID,
            "name": "Operations Director",
            "email": f"admin@{TENANT_DOMAIN}",
            "title": "Chief Operations Officer",
            "auth_provider_id": f"mock-{uuid.uuid4()}",
            "created_at": now,
            "updated_at": now
        }
        
        await execute_query(session, admin_query, admin_params)
        print(f"Created admin user: admin@{TENANT_DOMAIN}")
        
        # 5. Create executives and team leads
        users_data = [
            {"name": "Robert Chen", "email": f"r.chen@{TENANT_DOMAIN}", "title": "Chief Engineering Officer", "team": "Mechanical Engineering"},
            {"name": "Michelle Rodriguez", "email": f"m.rodriguez@{TENANT_DOMAIN}", "title": "VP of Production", "team": "Assembly Line A"},
            {"name": "David Kim", "email": f"d.kim@{TENANT_DOMAIN}", "title": "Quality Director", "team": "Quality Systems"},
            {"name": "Sarah Johnson", "email": f"s.johnson@{TENANT_DOMAIN}", "title": "Supply Chain Director", "team": "Procurement"},
            {"name": "Mark Wilson", "email": f"m.wilson@{TENANT_DOMAIN}", "title": "Head of R&D", "team": "Product Innovation"},
            {"name": "Jennifer Lopez", "email": f"j.lopez@{TENANT_DOMAIN}", "title": "Maintenance Director", "team": "Equipment Maintenance"},
            {"name": "Thomas Wright", "email": f"t.wright@{TENANT_DOMAIN}", "title": "Safety Director", "team": "Safety Operations"},
            {"name": "Kimberly Taylor", "email": f"k.taylor@{TENANT_DOMAIN}", "title": "VP of Operations", "team": "Planning"},
            
            # Team leads
            {"name": "James Patterson", "email": f"j.patterson@{TENANT_DOMAIN}", "title": "Electrical Engineering Lead", "team": "Electrical Engineering"},
            {"name": "Lisa Wang", "email": f"l.wang@{TENANT_DOMAIN}", "title": "Software Engineering Lead", "team": "Software Engineering"},
            {"name": "Carlos Gutierrez", "email": f"c.gutierrez@{TENANT_DOMAIN}", "title": "Assembly B Supervisor", "team": "Assembly Line B"},
            {"name": "Emma Martinez", "email": f"e.martinez@{TENANT_DOMAIN}", "title": "Machining Supervisor", "team": "Machining"},
            {"name": "John Davis", "email": f"j.davis@{TENANT_DOMAIN}", "title": "Finishing Manager", "team": "Finishing"},
            {"name": "Amanda Lee", "email": f"a.lee@{TENANT_DOMAIN}", "title": "Testing Manager", "team": "Testing"},
            {"name": "Brian Wilson", "email": f"b.wilson@{TENANT_DOMAIN}", "title": "Inspection Lead", "team": "Inspection"},
            {"name": "Nicole Adams", "email": f"n.adams@{TENANT_DOMAIN}", "title": "Logistics Manager", "team": "Logistics"},
            {"name": "Ryan Murphy", "email": f"r.murphy@{TENANT_DOMAIN}", "title": "Inventory Control Manager", "team": "Inventory Management"},
            {"name": "Diana Patel", "email": f"d.patel@{TENANT_DOMAIN}", "title": "Materials Research Lead", "team": "Materials Research"},
            {"name": "Kevin Johnston", "email": f"k.johnston@{TENANT_DOMAIN}", "title": "Process Innovation Lead", "team": "Process Innovation"},
            {"name": "Lawrence Garcia", "email": f"l.garcia@{TENANT_DOMAIN}", "title": "Facilities Director", "team": "Facilities Management"},
            {"name": "Maria Sanchez", "email": f"m.sanchez@{TENANT_DOMAIN}", "title": "Environmental Compliance Manager", "team": "Environmental Compliance"},
            {"name": "Paul Anderson", "email": f"p.anderson@{TENANT_DOMAIN}", "title": "BI Team Lead", "team": "Business Intelligence"},
            {"name": "Sophia Williams", "email": f"s.williams@{TENANT_DOMAIN}", "title": "Digital Transformation Lead", "team": "Digital Transformation"}
        ]
        
        user_ids = {}
        for user_data in users_data:
            user_id = str(uuid.uuid4())
            team_id = team_ids[user_data["team"]]
            
            user_query = """
            INSERT INTO users (
                id, tenant_id, name, email, title, is_active, is_admin,
                team_id, auth_provider, auth_provider_id, created_at, updated_at
            )
            VALUES (
                :user_id, :tenant_id, :name, :email, :title, TRUE, FALSE,
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
                "auth_provider_id": f"mock-{uuid.uuid4()}",
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, user_query, user_params)
            user_ids[user_data["email"]] = user_id
            print(f"Created user: {user_data['name']}")
            
        # 6. Update teams with lead_id
        for team in teams:
            team_id = team_ids[team["name"]]
            # Find a user in this team to be lead
            lead_user = next((u for u in users_data if u["team"] == team["name"]), None)
            
            if lead_user:
                lead_id = user_ids[lead_user["email"]]
                
                update_team_query = """
                UPDATE teams SET lead_id = :lead_id WHERE id = :team_id
                """
                
                update_params = {
                    "lead_id": lead_id,
                    "team_id": team_id
                }
                
                await execute_query(session, update_team_query, update_params)
                print(f"Set {lead_user['name']} as team lead for {team['name']}")
        
        # 7. Create production and innovation projects
        projects = [
            {"name": "Smart Factory Initiative", "description": "Implementation of Industry 4.0 technologies across production", "status": "in_progress"},
            {"name": "Assembly Line Automation", "description": "Advanced robotics for assembly line optimization", "status": "active"},
            {"name": "Predictive Maintenance System", "description": "IoT sensors and predictive analytics for equipment maintenance", "status": "planning"},
            {"name": "New Product Line Development", "description": "Next generation product line design and prototyping", "status": "active"},
            {"name": "Supply Chain Optimization", "description": "Streamlining procurement and logistics processes", "status": "in_progress"},
            {"name": "Quality Control Automation", "description": "AI-powered vision systems for quality inspection", "status": "planning"},
            {"name": "Carbon Footprint Reduction", "description": "Sustainability initiatives to reduce environmental impact", "status": "active"},
            {"name": "Digital Twin Implementation", "description": "Virtual modeling of production processes and facilities", "status": "planning"}
        ]
        
        for project in projects:
            project_id = str(uuid.uuid4())
            
            project_query = """
            INSERT INTO projects (
                id, tenant_id, name, description, status, start_date, target_date, created_at, updated_at
            )
            VALUES (
                :project_id, :tenant_id, :name, :description, :status, :start_date, :target_date, :created_at, :updated_at
            )
            RETURNING id;
            """
            
            # Set random start and target dates
            start_date = now - timedelta(days=90)
            target_date = now + timedelta(days=365)
            
            project_params = {
                "project_id": project_id,
                "tenant_id": TENANT_ID,
                "name": project["name"],
                "description": project["description"],
                "status": project["status"],
                "start_date": start_date,
                "target_date": target_date,
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, project_query, project_params)
            print(f"Created project: {project['name']}")
        
        # 8. Create strategic goals
        goals = [
            {"name": "Operational Efficiency", "description": "Increase overall equipment effectiveness by 15%", "status": "active"},
            {"name": "Quality Excellence", "description": "Reduce defect rates to under 0.01%", "status": "active"},
            {"name": "Digital Transformation", "description": "Implement smart factory technologies across all facilities", "status": "in_progress"},
            {"name": "Innovation Leadership", "description": "Develop 5 new patentable technologies this year", "status": "active"},
            {"name": "Sustainability", "description": "Reduce carbon footprint by 30% over 3 years", "status": "in_progress"},
            {"name": "Supply Chain Resilience", "description": "Establish redundant supply sources for critical components", "status": "active"},
            {"name": "Workforce Development", "description": "Train 100% of workforce on advanced manufacturing skills", "status": "in_progress"}
        ]
        
        for goal in goals:
            goal_id = str(uuid.uuid4())
            
            goal_query = """
            INSERT INTO goals (
                id, tenant_id, name, description, status, priority, created_at, updated_at
            )
            VALUES (
                :goal_id, :tenant_id, :name, :description, :status, :priority, :created_at, :updated_at
            )
            RETURNING id;
            """
            
            goal_params = {
                "goal_id": goal_id,
                "tenant_id": TENANT_ID,
                "name": goal["name"],
                "description": goal["description"],
                "status": goal["status"],
                "priority": "high",
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, goal_query, goal_params)
            print(f"Created goal: {goal['name']}")
        
        # Commit all changes
        await session.commit()
        
        print("\n--- Manufacturing Tenant Created Successfully ---")
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
        await create_manufacturing_tenant()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())