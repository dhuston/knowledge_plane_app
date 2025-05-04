#!/usr/bin/env python3
"""
Script to create a healthcare system tenant in Biosphere Alpha.
"""

import asyncio
import json
import uuid
from datetime import datetime, timedelta

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Define tenant details
TENANT_NAME = "Metropolitan Health System"
TENANT_DOMAIN = "metrohealth.org"
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

async def create_healthcare_tenant():
    """Create the healthcare system tenant and related entities."""
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
                "primary_color": "#0077B6",  # Medical blue
                "secondary_color": "#48CAE4",  # Light blue
                "logo_url": "https://placeholder.com/healthcare-logo.png"
            },
            "company": {
                "type": "Healthcare",
                "industry": "Hospital System",
                "size": "Large Enterprise",
                "founded": 1978,
                "headquarters": "Chicago, IL",
                "beds": 1200,
                "patients_annual": 250000
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
            {"name": "Internal Medicine", "description": "Medical specialty dealing with prevention, diagnosis, and treatment of adult diseases"},
            {"name": "Surgery", "description": "Surgical specialties and operating theaters"},
            {"name": "Pediatrics", "description": "Healthcare for infants, children, and adolescents"},
            {"name": "Oncology", "description": "Cancer diagnosis and treatment"},
            {"name": "Cardiology", "description": "Heart diseases and cardiovascular system"},
            {"name": "Emergency Medicine", "description": "Acute care and emergency treatments"},
            {"name": "Neurology", "description": "Disorders of the nervous system"},
            {"name": "Radiology", "description": "Medical imaging and diagnostics"},
            {"name": "Research", "description": "Clinical research and trials"},
            {"name": "Administration", "description": "Hospital management and operations"}
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
            {"name": "General Medicine", "description": "Primary care physicians", "department": "Internal Medicine"},
            {"name": "Gastroenterology", "description": "Digestive system specialists", "department": "Internal Medicine"},
            {"name": "Endocrinology", "description": "Hormone and metabolism specialists", "department": "Internal Medicine"},
            
            {"name": "General Surgery", "description": "Broad surgical procedures", "department": "Surgery"},
            {"name": "Orthopedic Surgery", "description": "Bone and joint specialists", "department": "Surgery"},
            {"name": "Neurosurgery", "description": "Brain and nervous system surgery", "department": "Surgery"},
            
            {"name": "Neonatal", "description": "Newborn intensive care", "department": "Pediatrics"},
            {"name": "Adolescent Medicine", "description": "Teen healthcare", "department": "Pediatrics"},
            
            {"name": "Medical Oncology", "description": "Cancer treatment specialists", "department": "Oncology"},
            {"name": "Radiation Oncology", "description": "Radiation therapy", "department": "Oncology"},
            
            {"name": "Interventional Cardiology", "description": "Cardiac procedures", "department": "Cardiology"},
            {"name": "Electrophysiology", "description": "Heart rhythm specialists", "department": "Cardiology"},
            
            {"name": "Trauma", "description": "Critical injury treatment", "department": "Emergency Medicine"},
            {"name": "Acute Care", "description": "Urgent medical care", "department": "Emergency Medicine"},
            
            {"name": "MRI", "description": "Magnetic resonance imaging", "department": "Radiology"},
            {"name": "CT Scan", "description": "Computed tomography", "department": "Radiology"},
            
            {"name": "Clinical Trials", "description": "Patient study coordination", "department": "Research"},
            {"name": "Medical Research", "description": "Discovery and innovation", "department": "Research"},
            
            {"name": "Hospital Operations", "description": "Day-to-day management", "department": "Administration"},
            {"name": "Finance", "description": "Budget and financial planning", "department": "Administration"},
            {"name": "Human Resources", "description": "Staff management", "department": "Administration"}
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
            "name": "Medical Director",
            "email": f"admin@{TENANT_DOMAIN}",
            "title": "Chief Medical Officer",
            "auth_provider_id": f"health-admin-{uuid.uuid4()}",
            "created_at": now,
            "updated_at": now
        }
        
        await execute_query(session, admin_query, admin_params)
        print(f"Created admin user: admin@{TENANT_DOMAIN}")
        
        # 5. Create department chiefs and team leads
        users_data = [
            {"name": "Dr. Lisa Chen", "email": f"l.chen@{TENANT_DOMAIN}", "title": "Chief of Internal Medicine", "team": "General Medicine"},
            {"name": "Dr. Michael Rodriguez", "email": f"m.rodriguez@{TENANT_DOMAIN}", "title": "Chief Surgical Officer", "team": "General Surgery"},
            {"name": "Dr. Sarah Johnson", "email": f"s.johnson@{TENANT_DOMAIN}", "title": "Head of Pediatrics", "team": "Neonatal"},
            {"name": "Dr. James Williams", "email": f"j.williams@{TENANT_DOMAIN}", "title": "Oncology Director", "team": "Medical Oncology"},
            {"name": "Dr. Emily Patel", "email": f"e.patel@{TENANT_DOMAIN}", "title": "Cardiology Director", "team": "Interventional Cardiology"},
            {"name": "Dr. Robert Kim", "email": f"r.kim@{TENANT_DOMAIN}", "title": "ER Director", "team": "Trauma"},
            {"name": "Dr. David Lee", "email": f"d.lee@{TENANT_DOMAIN}", "title": "Neurology Chief", "team": "Neurosurgery"},
            {"name": "Dr. Maria Garcia", "email": f"m.garcia@{TENANT_DOMAIN}", "title": "Radiology Director", "team": "MRI"},
            {"name": "Dr. Thomas Wilson", "email": f"t.wilson@{TENANT_DOMAIN}", "title": "Research Director", "team": "Clinical Trials"},
            {"name": "Katherine Brown", "email": f"k.brown@{TENANT_DOMAIN}", "title": "Hospital Administrator", "team": "Hospital Operations"},
            
            # Team leads
            {"name": "Dr. Jennifer Smith", "email": f"j.smith@{TENANT_DOMAIN}", "title": "Gastroenterology Lead", "team": "Gastroenterology"},
            {"name": "Dr. Daniel Park", "email": f"d.park@{TENANT_DOMAIN}", "title": "Endocrinology Lead", "team": "Endocrinology"},
            {"name": "Dr. Kevin Taylor", "email": f"k.taylor@{TENANT_DOMAIN}", "title": "Orthopedic Lead", "team": "Orthopedic Surgery"},
            {"name": "Dr. Rachel Green", "email": f"r.green@{TENANT_DOMAIN}", "title": "Adolescent Medicine Lead", "team": "Adolescent Medicine"},
            {"name": "Dr. Joseph Martin", "email": f"j.martin@{TENANT_DOMAIN}", "title": "Radiation Oncology Lead", "team": "Radiation Oncology"},
            {"name": "Dr. Samantha White", "email": f"s.white@{TENANT_DOMAIN}", "title": "Electrophysiology Lead", "team": "Electrophysiology"},
            {"name": "Dr. Andrew Davis", "email": f"a.davis@{TENANT_DOMAIN}", "title": "Acute Care Lead", "team": "Acute Care"},
            {"name": "Dr. Michelle Thompson", "email": f"m.thompson@{TENANT_DOMAIN}", "title": "CT Scanning Lead", "team": "CT Scan"},
            {"name": "Dr. Rebecca Nelson", "email": f"r.nelson@{TENANT_DOMAIN}", "title": "Medical Research Lead", "team": "Medical Research"},
            {"name": "Jonathan Clark", "email": f"j.clark@{TENANT_DOMAIN}", "title": "Finance Director", "team": "Finance"},
            {"name": "Elizabeth Moore", "email": f"e.moore@{TENANT_DOMAIN}", "title": "HR Director", "team": "Human Resources"}
        ]
        
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
                "auth_provider_id": f"health-user-{user_data['name'].replace(' ', '-').lower()}-{uuid.uuid4()}",
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
        
        # 7. Create key hospital initiatives (projects)
        projects = [
            {"name": "Electronic Health Records Modernization", "description": "Upgrade EHR system hospital-wide", "status": "in_progress"},
            {"name": "Cardiac Center Expansion", "description": "Expand cardiac treatment facilities and services", "status": "planning"},
            {"name": "Telehealth Implementation", "description": "Implement comprehensive telehealth services", "status": "in_progress"},
            {"name": "Emergency Department Renovation", "description": "Renovate and expand emergency facilities", "status": "active"},
            {"name": "AI Diagnostic Imaging Project", "description": "Implement AI for radiology diagnostics", "status": "planning"},
            {"name": "Pediatric Cancer Center", "description": "New specialized treatment center for pediatric oncology", "status": "active"}
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
                "start_date": (now - timedelta(days=90)).isoformat(),
                "target_date": (now + timedelta(days=270)).isoformat()
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
        
        # 8. Create strategic goals
        goals = [
            {"name": "Improve Patient Outcomes", "description": "Reduce readmission rates and improve patient care metrics", "status": "active"},
            {"name": "Expand Specialty Services", "description": "Add new specialties and service lines", "status": "active"},
            {"name": "Achieve HIMSS Stage 7", "description": "Reach highest level of electronic medical record adoption", "status": "in_progress"},
            {"name": "Increase Research Funding", "description": "Secure additional grants and research partnerships", "status": "active"},
            {"name": "Enhance Patient Experience", "description": "Improve satisfaction scores and care experience", "status": "in_progress"}
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
        
        print("\n--- Healthcare System Tenant Created Successfully ---")
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
        await create_healthcare_tenant()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())