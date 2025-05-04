#!/usr/bin/env python3
"""
Script to create an education tenant in Biosphere Alpha.
"""

import asyncio
import json
import uuid
from datetime import datetime, timedelta

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Define tenant details
TENANT_NAME = "University Research Alliance"
TENANT_DOMAIN = "uniresearch.edu"
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

async def create_education_tenant():
    """Create the education tenant and related entities."""
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
                "primary_color": "#3498DB",  # Blue
                "secondary_color": "#2ECC71",  # Green
                "logo_url": "https://placeholder.com/education-logo.png"
            },
            "company": {
                "type": "Education",
                "industry": "Higher Education & Research",
                "size": "Large Institution",
                "founded": 1892,
                "location": "Cambridge, MA",
                "students": 28000,
                "faculty": 2000,
                "research_funding": "$1.2 billion annually"
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
        
        # 2. Create departments (academic colleges/units)
        departments = [
            {"name": "College of Science", "description": "Natural and physical sciences"},
            {"name": "College of Engineering", "description": "Engineering disciplines and applied sciences"},
            {"name": "College of Liberal Arts", "description": "Humanities, arts and social sciences"},
            {"name": "College of Business", "description": "Business and management studies"},
            {"name": "College of Medicine", "description": "Medical education and research"},
            {"name": "Information Technology", "description": "IT infrastructure and services"},
            {"name": "Research Administration", "description": "Research support and grant management"},
            {"name": "University Administration", "description": "Central administration and operations"}
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
        
        # 3. Create teams (academic departments/units)
        teams = [
            {"name": "Physics Department", "description": "Physics research and teaching", "department": "College of Science"},
            {"name": "Chemistry Department", "description": "Chemistry research and teaching", "department": "College of Science"},
            {"name": "Biology Department", "description": "Biology research and teaching", "department": "College of Science"},
            {"name": "Mathematics Department", "description": "Mathematics research and teaching", "department": "College of Science"},
            
            {"name": "Mechanical Engineering", "description": "Mechanical engineering research and teaching", "department": "College of Engineering"},
            {"name": "Computer Science", "description": "Computer science research and teaching", "department": "College of Engineering"},
            {"name": "Electrical Engineering", "description": "Electrical engineering research and teaching", "department": "College of Engineering"},
            {"name": "Civil Engineering", "description": "Civil engineering research and teaching", "department": "College of Engineering"},
            
            {"name": "History Department", "description": "Historical studies", "department": "College of Liberal Arts"},
            {"name": "English Department", "description": "English literature and composition", "department": "College of Liberal Arts"},
            {"name": "Psychology Department", "description": "Psychological research and teaching", "department": "College of Liberal Arts"},
            {"name": "Economics Department", "description": "Economics research and teaching", "department": "College of Liberal Arts"},
            
            {"name": "Finance Department", "description": "Finance studies", "department": "College of Business"},
            {"name": "Marketing Department", "description": "Marketing research and teaching", "department": "College of Business"},
            {"name": "Management Department", "description": "Management studies", "department": "College of Business"},
            
            {"name": "Medical Research", "description": "Clinical and translational research", "department": "College of Medicine"},
            {"name": "Neuroscience", "description": "Neuroscience research and teaching", "department": "College of Medicine"},
            {"name": "Public Health", "description": "Public health research and programs", "department": "College of Medicine"},
            
            {"name": "Infrastructure", "description": "Network and system infrastructure", "department": "Information Technology"},
            {"name": "Educational Technology", "description": "Learning technology support", "department": "Information Technology"},
            
            {"name": "Grant Management", "description": "Research grant administration", "department": "Research Administration"},
            {"name": "Research Compliance", "description": "Regulatory compliance for research", "department": "Research Administration"},
            
            {"name": "Student Affairs", "description": "Student services and support", "department": "University Administration"},
            {"name": "HR", "description": "Human resources", "department": "University Administration"}
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
            "name": "University Provost",
            "email": f"admin@{TENANT_DOMAIN}",
            "title": "University Provost",
            "auth_provider_id": f"edu-admin-{uuid.uuid4()}",
            "created_at": now,
            "updated_at": now
        }
        
        await execute_query(session, admin_query, admin_params)
        print(f"Created admin user: admin@{TENANT_DOMAIN}")
        
        # 5. Create faculty and admin users
        users_data = [
            {"name": "Dr. Richard Thompson", "email": f"r.thompson@{TENANT_DOMAIN}", "title": "Dean of Science", "team": "Physics Department"},
            {"name": "Dr. Elena Martinez", "email": f"e.martinez@{TENANT_DOMAIN}", "title": "Dean of Engineering", "team": "Computer Science"},
            {"name": "Dr. James Wilson", "email": f"j.wilson@{TENANT_DOMAIN}", "title": "Dean of Liberal Arts", "team": "History Department"},
            {"name": "Dr. Sarah Chang", "email": f"s.chang@{TENANT_DOMAIN}", "title": "Dean of Business", "team": "Finance Department"},
            {"name": "Dr. Michael Chen", "email": f"m.chen@{TENANT_DOMAIN}", "title": "Dean of Medicine", "team": "Medical Research"},
            {"name": "Robert Davis", "email": f"r.davis@{TENANT_DOMAIN}", "title": "CIO", "team": "Infrastructure"},
            {"name": "Dr. Amanda Garcia", "email": f"a.garcia@{TENANT_DOMAIN}", "title": "VP of Research", "team": "Grant Management"},
            {"name": "Katherine Johnson", "email": f"k.johnson@{TENANT_DOMAIN}", "title": "VP of Student Affairs", "team": "Student Affairs"},
            
            # Department chairs and faculty
            {"name": "Dr. David Lee", "email": f"d.lee@{TENANT_DOMAIN}", "title": "Chair of Physics", "team": "Physics Department"},
            {"name": "Dr. Marie Curie", "email": f"m.curie@{TENANT_DOMAIN}", "title": "Chair of Chemistry", "team": "Chemistry Department"},
            {"name": "Dr. Charles Darwin", "email": f"c.darwin@{TENANT_DOMAIN}", "title": "Chair of Biology", "team": "Biology Department"},
            {"name": "Dr. Ada Lovelace", "email": f"a.lovelace@{TENANT_DOMAIN}", "title": "Chair of Mathematics", "team": "Mathematics Department"},
            
            {"name": "Dr. Nikola Tesla", "email": f"n.tesla@{TENANT_DOMAIN}", "title": "Chair of Electrical Engineering", "team": "Electrical Engineering"},
            {"name": "Dr. Grace Hopper", "email": f"g.hopper@{TENANT_DOMAIN}", "title": "Chair of Computer Science", "team": "Computer Science"},
            {"name": "Dr. Leonardo DaVinci", "email": f"l.davinci@{TENANT_DOMAIN}", "title": "Chair of Mechanical Engineering", "team": "Mechanical Engineering"},
            {"name": "Dr. Emily Roebling", "email": f"e.roebling@{TENANT_DOMAIN}", "title": "Chair of Civil Engineering", "team": "Civil Engineering"},
            
            {"name": "Dr. Howard Zinn", "email": f"h.zinn@{TENANT_DOMAIN}", "title": "Chair of History", "team": "History Department"},
            {"name": "Dr. Jane Austen", "email": f"j.austen@{TENANT_DOMAIN}", "title": "Chair of English", "team": "English Department"},
            {"name": "Dr. Sigmund Freud", "email": f"s.freud@{TENANT_DOMAIN}", "title": "Chair of Psychology", "team": "Psychology Department"},
            {"name": "Dr. Adam Smith", "email": f"a.smith@{TENANT_DOMAIN}", "title": "Chair of Economics", "team": "Economics Department"},
            
            {"name": "Dr. Warren Buffett", "email": f"w.buffett@{TENANT_DOMAIN}", "title": "Chair of Finance", "team": "Finance Department"},
            {"name": "Dr. Philip Kotler", "email": f"p.kotler@{TENANT_DOMAIN}", "title": "Chair of Marketing", "team": "Marketing Department"},
            {"name": "Dr. Peter Drucker", "email": f"p.drucker@{TENANT_DOMAIN}", "title": "Chair of Management", "team": "Management Department"},
            
            {"name": "Dr. Jonas Salk", "email": f"j.salk@{TENANT_DOMAIN}", "title": "Director of Medical Research", "team": "Medical Research"},
            {"name": "Dr. Oliver Sacks", "email": f"o.sacks@{TENANT_DOMAIN}", "title": "Chair of Neuroscience", "team": "Neuroscience"},
            {"name": "Dr. Anthony Fauci", "email": f"a.fauci@{TENANT_DOMAIN}", "title": "Chair of Public Health", "team": "Public Health"},
            
            {"name": "Thomas Anderson", "email": f"t.anderson@{TENANT_DOMAIN}", "title": "IT Infrastructure Director", "team": "Infrastructure"},
            {"name": "Maria Rodriguez", "email": f"m.rodriguez@{TENANT_DOMAIN}", "title": "Educational Technology Director", "team": "Educational Technology"},
            
            {"name": "Jennifer Smith", "email": f"j.smith@{TENANT_DOMAIN}", "title": "Director of Grant Management", "team": "Grant Management"},
            {"name": "William Brown", "email": f"w.brown@{TENANT_DOMAIN}", "title": "Director of Research Compliance", "team": "Research Compliance"},
            
            {"name": "Laura White", "email": f"l.white@{TENANT_DOMAIN}", "title": "HR Director", "team": "HR"}
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
                "auth_provider_id": f"edu-user-{user_data['name'].replace(' ', '-').lower()}-{uuid.uuid4()}",
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
        
        # 7. Create research projects and initiatives
        projects = [
            {"name": "Quantum Computing Research", "description": "Advanced quantum computing algorithms and applications", "status": "active"},
            {"name": "Climate Science Initiative", "description": "Interdisciplinary research on climate change", "status": "in_progress"},
            {"name": "AI Ethics Center", "description": "Ethical implications of artificial intelligence", "status": "planning"},
            {"name": "Digital Learning Initiative", "description": "Next-generation online education platform", "status": "in_progress"},
            {"name": "Smart Campus Project", "description": "IoT and data analytics for campus management", "status": "active"},
            {"name": "Urban Sustainability Lab", "description": "Sustainable urban development research", "status": "in_progress"},
            {"name": "Genomic Medicine Project", "description": "Applications of genomics to personalized medicine", "status": "active"},
            {"name": "Global Studies Program", "description": "Cross-cultural research and education programs", "status": "planning"},
            {"name": "Neuroscience of Learning", "description": "Brain-based approaches to education", "status": "in_progress"}
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
                "start_date": (now - timedelta(days=180)).isoformat(),
                "target_date": (now + timedelta(days=730)).isoformat()  # ~2 years
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
            {"name": "Research Excellence", "description": "Increase research output and impact metrics by 25%", "status": "active"},
            {"name": "Educational Innovation", "description": "Develop and implement next-generation teaching methods", "status": "active"},
            {"name": "Global Partnerships", "description": "Establish 10 new international research partnerships", "status": "in_progress"},
            {"name": "Diversity and Inclusion", "description": "Improve representation and inclusion across all programs", "status": "active"},
            {"name": "Sustainability Leadership", "description": "Become carbon-neutral by 2030", "status": "in_progress"},
            {"name": "Technology Integration", "description": "Modernize technology infrastructure and digital capabilities", "status": "active"},
            {"name": "Community Engagement", "description": "Increase impact of university work in local communities", "status": "in_progress"},
            {"name": "Financial Sustainability", "description": "Diversify revenue sources and optimize resource allocation", "status": "active"}
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
        
        print("\n--- Education Tenant Created Successfully ---")
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
        await create_education_tenant()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())