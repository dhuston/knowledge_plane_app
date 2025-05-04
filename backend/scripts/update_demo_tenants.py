#!/usr/bin/env python3
"""
Script to update all demo tenants with complete data.
This script handles existing tenants and updates/adds data as needed.
"""

import asyncio
import json
import uuid
from datetime import datetime, timedelta

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

# Database connection from config
DATABASE_URL = "postgresql+asyncpg://postgres:password@db:5432/knowledgeplan_dev"

# Create async engine
engine = create_async_engine(DATABASE_URL)
async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

# Utility functions
async def execute_query(session, query, params=None):
    """Execute a raw SQL query with parameters."""
    result = await session.execute(text(query), params)
    return result

async def get_tenant_id(session, tenant_domain):
    """Get tenant ID by domain."""
    tenant_query = """
    SELECT id FROM tenants WHERE domain = :domain;
    """
    result = await execute_query(session, tenant_query, {"domain": tenant_domain})
    return result.scalar_one_or_none()

async def update_tech_tenant():
    """Update the Tech Innovations Inc. tenant."""
    tenant_domain = "techinnovations.com"
    tenant_name = "Tech Innovations Inc."
    
    async with async_session() as session:
        # Get existing tenant ID
        tenant_id = await get_tenant_id(session, tenant_domain)
        if not tenant_id:
            print(f"Tenant {tenant_name} not found, skipping.")
            return
        
        print(f"Updating tenant: {tenant_name} (ID: {tenant_id})")
        now = datetime.now()
        
        # First, delete users (except admin) to avoid foreign key constraint issues
        await execute_query(
            session, 
            "DELETE FROM users WHERE tenant_id = :tenant_id AND email != :admin_email",
            {"tenant_id": tenant_id, "admin_email": f"admin@{tenant_domain}"}
        )
        print("Cleared existing users except admin")
        
        # Then delete teams
        await execute_query(session, "DELETE FROM teams WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing teams")
        
        # Then, clear existing departments
        await execute_query(session, "DELETE FROM departments WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing departments")
        
        # Create departments
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
                "tenant_id": tenant_id,
                "name": dept["name"],
                "description": dept["description"],
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, dept_query, dept_params)
            department_ids[dept["name"]] = dept_id
            print(f"Created department: {dept['name']}")
        
        # Teams already cleared earlier
        
        # Create teams
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
                "tenant_id": tenant_id,
                "name": team["name"],
                "description": team["description"],
                "dept_id": dept_id,
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, team_query, team_params)
            team_ids[team["name"]] = team_id
            print(f"Created team: {team['name']} in {team['department']}")
        
        # Clear existing users except admin
        await execute_query(
            session, 
            "DELETE FROM users WHERE tenant_id = :tenant_id AND email != :admin_email",
            {"tenant_id": tenant_id, "admin_email": f"admin@{tenant_domain}"}
        )
        print("Cleared existing users except admin")
        
        # Create regular users
        users_data = [
            {"name": "Sarah Chen", "email": f"sarah.chen@{tenant_domain}", "title": "Frontend Engineer", "team": "Frontend"},
            {"name": "Michael Rodriguez", "email": f"michael.r@{tenant_domain}", "title": "Backend Engineer", "team": "Backend"},
            {"name": "Raj Patel", "email": f"raj.patel@{tenant_domain}", "title": "DevOps Engineer", "team": "DevOps"},
            {"name": "Emily Watson", "email": f"emily.w@{tenant_domain}", "title": "UX Designer", "team": "UX/UI"},
            {"name": "Alex Johnson", "email": f"alex.j@{tenant_domain}", "title": "Product Manager", "team": "Product Management"},
            {"name": "Sophia Kim", "email": f"sophia.k@{tenant_domain}", "title": "Marketing Specialist", "team": "Digital Marketing"},
            {"name": "David Thompson", "email": f"david.t@{tenant_domain}", "title": "Sales Representative", "team": "Sales Development"},
            {"name": "Lisa Garcia", "email": f"lisa.g@{tenant_domain}", "title": "Financial Analyst", "team": "Finance"},
            {"name": "Kevin Lee", "email": f"kevin.l@{tenant_domain}", "title": "AI Researcher", "team": "AI Research"},
            {"name": "Priya Sharma", "email": f"priya.s@{tenant_domain}", "title": "Quantum Engineer", "team": "Quantum Computing"},
            {"name": "James Wilson", "email": f"james.w@{tenant_domain}", "title": "Mobile Developer", "team": "Mobile"},
            {"name": "Zoe Martinez", "email": f"zoe.m@{tenant_domain}", "title": "Data Scientist", "team": "Data Science"},
            {"name": "Tyler Brown", "email": f"tyler.b@{tenant_domain}", "title": "QA Engineer", "team": "QA"},
            {"name": "Hannah Miller", "email": f"hannah.m@{tenant_domain}", "title": "Content Creator", "team": "Content"},
            {"name": "Chris Taylor", "email": f"chris.t@{tenant_domain}", "title": "Account Manager", "team": "Account Management"},
            {"name": "Olivia White", "email": f"olivia.w@{tenant_domain}", "title": "HR Manager", "team": "HR"}
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
                "tenant_id": tenant_id,
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
        
        # Update teams with lead_id
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
        
        # Clear existing projects
        await execute_query(session, "DELETE FROM projects WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing projects")
        
        # Create projects
        projects = [
            {"name": "Cloud Platform Redesign", "description": "Redesign of our cloud computing platform", "status": "in_progress"},
            {"name": "Mobile App v2", "description": "Next generation mobile application", "status": "planning"},
            {"name": "AI Integration", "description": "Integrate AI capabilities into core products", "status": "in_progress"},
            {"name": "Quantum Algorithm Research", "description": "Research into quantum algorithms for optimization", "status": "active"}
        ]
        
        project_ids = {}
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
                "tenant_id": tenant_id,
                "name": project["name"],
                "description": project["description"],
                "status": project["status"],
                "properties": json.dumps(properties),
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, project_query, project_params)
            project_ids[project["name"]] = project_id
            print(f"Created project: {project['name']}")
        
        # Clear existing goals
        await execute_query(session, "DELETE FROM goals WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing goals")
        
        # Create goals
        goals = [
            {"name": "Increase Platform Usage", "description": "Increase daily active users by 30%", "status": "in_progress"},
            {"name": "Launch New Product Line", "description": "Complete development of next-gen products", "status": "active"},
            {"name": "Optimize Infrastructure", "description": "Reduce cloud costs by 20%", "status": "active"}
        ]
        
        goal_ids = {}
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
                "tenant_id": tenant_id,
                "title": goal["name"],
                "description": goal["description"],
                "status": goal["status"],
                "type": "ENTERPRISE",
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, goal_query, goal_params)
            goal_ids[goal["name"]] = goal_id
            print(f"Created goal: {goal['name']}")
        
        # Create nodes for visualization
        # Clear existing nodes
        await execute_query(session, "DELETE FROM nodes WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing nodes")
        
        # Create department nodes
        for dept_name, dept_id in department_ids.items():
            node_id = str(uuid.uuid4())
            x_pos = (hash(dept_name) % 200) - 100  # Deterministic but random-looking position
            y_pos = (hash(dept_name + "y") % 200) - 100
            
            node_query = """
            INSERT INTO nodes (id, tenant_id, type, props, x, y, created_at, updated_at)
            VALUES (:node_id, :tenant_id, 'department', :props, :x, :y, :created_at, :updated_at);
            """
            
            props = {
                "name": dept_name,
                "entity_id": dept_id,
                "entity_type": "department"
            }
            
            node_params = {
                "node_id": node_id,
                "tenant_id": tenant_id,
                "props": json.dumps(props),
                "x": x_pos,
                "y": y_pos,
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, node_query, node_params)
            print(f"Created node for department: {dept_name}")
        
        # Create team nodes
        for team_name, team_id in team_ids.items():
            node_id = str(uuid.uuid4())
            x_pos = (hash(team_name) % 200) - 100
            y_pos = (hash(team_name + "y") % 200) - 100
            
            node_query = """
            INSERT INTO nodes (id, tenant_id, type, props, x, y, created_at, updated_at)
            VALUES (:node_id, :tenant_id, 'team', :props, :x, :y, :created_at, :updated_at);
            """
            
            props = {
                "name": team_name,
                "entity_id": team_id,
                "entity_type": "team"
            }
            
            node_params = {
                "node_id": node_id,
                "tenant_id": tenant_id,
                "props": json.dumps(props),
                "x": x_pos,
                "y": y_pos,
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, node_query, node_params)
            print(f"Created node for team: {team_name}")
        
        # Create project nodes
        for project_name, project_id in project_ids.items():
            node_id = str(uuid.uuid4())
            x_pos = (hash(project_name) % 200) - 100
            y_pos = (hash(project_name + "y") % 200) - 100
            
            node_query = """
            INSERT INTO nodes (id, tenant_id, type, props, x, y, created_at, updated_at)
            VALUES (:node_id, :tenant_id, 'project', :props, :x, :y, :created_at, :updated_at);
            """
            
            props = {
                "name": project_name,
                "entity_id": project_id,
                "entity_type": "project"
            }
            
            node_params = {
                "node_id": node_id,
                "tenant_id": tenant_id,
                "props": json.dumps(props),
                "x": x_pos,
                "y": y_pos,
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, node_query, node_params)
            print(f"Created node for project: {project_name}")
        
        # Create user nodes
        for user_data in users_data:
            user_id = user_ids[user_data["email"]]
            node_id = str(uuid.uuid4())
            x_pos = (hash(user_data["name"]) % 200) - 100
            y_pos = (hash(user_data["name"] + "y") % 200) - 100
            
            node_query = """
            INSERT INTO nodes (id, tenant_id, type, props, x, y, created_at, updated_at)
            VALUES (:node_id, :tenant_id, 'user', :props, :x, :y, :created_at, :updated_at);
            """
            
            props = {
                "name": user_data["name"],
                "entity_id": user_id,
                "entity_type": "user",
                "title": user_data["title"]
            }
            
            node_params = {
                "node_id": node_id,
                "tenant_id": tenant_id,
                "props": json.dumps(props),
                "x": x_pos,
                "y": y_pos,
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, node_query, node_params)
            print(f"Created node for user: {user_data['name']}")
        
        # Clear existing edges
        await execute_query(session, "DELETE FROM edges WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing edges")
        
        # Create edges between teams and departments
        for team in teams:
            team_id = team_ids[team["name"]]
            dept_id = department_ids[team["department"]]
            edge_id = str(uuid.uuid4())
            
            edge_query = """
            INSERT INTO edges (id, tenant_id, src, dst, label, props, created_at, updated_at)
            VALUES (:edge_id, :tenant_id, :src, :dst, :label, :props, :created_at, :updated_at);
            """
            
            edge_params = {
                "edge_id": edge_id,
                "tenant_id": tenant_id,
                "src": dept_id,
                "dst": team_id,
                "label": "CONTAINS",
                "props": json.dumps({"type": "organizational"}),
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, edge_query, edge_params)
            print(f"Created edge: Department {team['department']} -> Team {team['name']}")
        
        # Create edges between users and teams
        for user_data in users_data:
            user_id = user_ids[user_data["email"]]
            team_id = team_ids[user_data["team"]]
            edge_id = str(uuid.uuid4())
            
            edge_query = """
            INSERT INTO edges (id, tenant_id, src, dst, label, props, created_at, updated_at)
            VALUES (:edge_id, :tenant_id, :src, :dst, :label, :props, :created_at, :updated_at);
            """
            
            edge_params = {
                "edge_id": edge_id,
                "tenant_id": tenant_id,
                "src": team_id,
                "dst": user_id,
                "label": "MEMBER",
                "props": json.dumps({"type": "membership"}),
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, edge_query, edge_params)
            print(f"Created edge: Team {user_data['team']} -> User {user_data['name']}")
        
        # Create project relationships (assign projects to teams)
        project_team_assignments = [
            {"project": "Cloud Platform Redesign", "teams": ["Frontend", "Backend", "DevOps"]},
            {"project": "Mobile App v2", "teams": ["Mobile", "UX/UI", "Product Management"]},
            {"project": "AI Integration", "teams": ["Data Science", "AI Research", "Backend"]},
            {"project": "Quantum Algorithm Research", "teams": ["Quantum Computing", "AI Research"]}
        ]
        
        for assignment in project_team_assignments:
            project_id = project_ids[assignment["project"]]
            
            for team_name in assignment["teams"]:
                team_id = team_ids[team_name]
                edge_id = str(uuid.uuid4())
                
                edge_query = """
                INSERT INTO edges (id, tenant_id, src, dst, label, props, created_at, updated_at)
                VALUES (:edge_id, :tenant_id, :src, :dst, :label, :props, :created_at, :updated_at);
                """
                
                edge_params = {
                    "edge_id": edge_id,
                    "tenant_id": tenant_id,
                    "src": team_id,
                    "dst": project_id,
                    "label": "OWNS",
                    "props": json.dumps({"type": "ownership"}),
                    "created_at": now,
                    "updated_at": now
                }
                
                await execute_query(session, edge_query, edge_params)
                print(f"Created edge: Team {team_name} -> Project {assignment['project']}")
        
        # Commit all changes
        await session.commit()
        
        print(f"\n--- {tenant_name} Updated Successfully ---")
        print(f"Departments: {len(departments)}")
        print(f"Teams: {len(teams)}")
        print(f"Users: {len(users_data)}")
        print(f"Projects: {len(projects)}")
        print(f"Goals: {len(goals)}")

async def update_healthcare_tenant():
    """Update the Metropolitan Health System tenant."""
    tenant_domain = "metrohealth.org"
    tenant_name = "Metropolitan Health System"
    
    async with async_session() as session:
        # Get existing tenant ID
        tenant_id = await get_tenant_id(session, tenant_domain)
        if not tenant_id:
            print(f"Tenant {tenant_name} not found, skipping.")
            return
        
        print(f"Updating tenant: {tenant_name} (ID: {tenant_id})")
        now = datetime.now()
        
        # First, delete users (except admin) to avoid foreign key constraint issues
        await execute_query(
            session, 
            "DELETE FROM users WHERE tenant_id = :tenant_id AND email != :admin_email",
            {"tenant_id": tenant_id, "admin_email": f"admin@{tenant_domain}"}
        )
        print("Cleared existing users except admin")
        
        # Then delete teams
        await execute_query(session, "DELETE FROM teams WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing teams")
        
        # Then, clear existing departments
        await execute_query(session, "DELETE FROM departments WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing departments")
        
        # Create departments
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
                "tenant_id": tenant_id,
                "name": dept["name"],
                "description": dept["description"],
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, dept_query, dept_params)
            department_ids[dept["name"]] = dept_id
            print(f"Created department: {dept['name']}")
        
        # Teams already cleared earlier
        
        # Create teams
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
                "tenant_id": tenant_id,
                "name": team["name"],
                "description": team["description"],
                "dept_id": dept_id,
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, team_query, team_params)
            team_ids[team["name"]] = team_id
            print(f"Created team: {team['name']} in {team['department']}")
        
        # Clear existing users except admin
        await execute_query(
            session, 
            "DELETE FROM users WHERE tenant_id = :tenant_id AND email != :admin_email",
            {"tenant_id": tenant_id, "admin_email": f"admin@{tenant_domain}"}
        )
        print("Cleared existing users except admin")
        
        # Create department chiefs and team leads
        users_data = [
            {"name": "Dr. Lisa Chen", "email": f"l.chen@{tenant_domain}", "title": "Chief of Internal Medicine", "team": "General Medicine"},
            {"name": "Dr. Michael Rodriguez", "email": f"m.rodriguez@{tenant_domain}", "title": "Chief Surgical Officer", "team": "General Surgery"},
            {"name": "Dr. Sarah Johnson", "email": f"s.johnson@{tenant_domain}", "title": "Head of Pediatrics", "team": "Neonatal"},
            {"name": "Dr. James Williams", "email": f"j.williams@{tenant_domain}", "title": "Oncology Director", "team": "Medical Oncology"},
            {"name": "Dr. Emily Patel", "email": f"e.patel@{tenant_domain}", "title": "Cardiology Director", "team": "Interventional Cardiology"},
            {"name": "Dr. Robert Kim", "email": f"r.kim@{tenant_domain}", "title": "ER Director", "team": "Trauma"},
            {"name": "Dr. David Lee", "email": f"d.lee@{tenant_domain}", "title": "Neurology Chief", "team": "Neurosurgery"},
            {"name": "Dr. Maria Garcia", "email": f"m.garcia@{tenant_domain}", "title": "Radiology Director", "team": "MRI"},
            {"name": "Dr. Thomas Wilson", "email": f"t.wilson@{tenant_domain}", "title": "Research Director", "team": "Clinical Trials"},
            {"name": "Katherine Brown", "email": f"k.brown@{tenant_domain}", "title": "Hospital Administrator", "team": "Hospital Operations"},
            
            # Team leads
            {"name": "Dr. Jennifer Smith", "email": f"j.smith@{tenant_domain}", "title": "Gastroenterology Lead", "team": "Gastroenterology"},
            {"name": "Dr. Daniel Park", "email": f"d.park@{tenant_domain}", "title": "Endocrinology Lead", "team": "Endocrinology"},
            {"name": "Dr. Kevin Taylor", "email": f"k.taylor@{tenant_domain}", "title": "Orthopedic Lead", "team": "Orthopedic Surgery"},
            {"name": "Dr. Rachel Green", "email": f"r.green@{tenant_domain}", "title": "Adolescent Medicine Lead", "team": "Adolescent Medicine"},
            {"name": "Dr. Joseph Martin", "email": f"j.martin@{tenant_domain}", "title": "Radiation Oncology Lead", "team": "Radiation Oncology"},
            {"name": "Dr. Samantha White", "email": f"s.white@{tenant_domain}", "title": "Electrophysiology Lead", "team": "Electrophysiology"},
            {"name": "Dr. Andrew Davis", "email": f"a.davis@{tenant_domain}", "title": "Acute Care Lead", "team": "Acute Care"},
            {"name": "Dr. Michelle Thompson", "email": f"m.thompson@{tenant_domain}", "title": "CT Scanning Lead", "team": "CT Scan"},
            {"name": "Dr. Rebecca Nelson", "email": f"r.nelson@{tenant_domain}", "title": "Medical Research Lead", "team": "Medical Research"},
            {"name": "Jonathan Clark", "email": f"j.clark@{tenant_domain}", "title": "Finance Director", "team": "Finance"},
            {"name": "Elizabeth Moore", "email": f"e.moore@{tenant_domain}", "title": "HR Director", "team": "Human Resources"}
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
                "tenant_id": tenant_id,
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
        
        # Update teams with lead_id
        for team in teams:
            team_id = team_ids[team["name"]]
            # Find a user in this team to be lead
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
        
        # Clear existing projects
        await execute_query(session, "DELETE FROM projects WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing projects")
        
        # Create projects
        projects = [
            {"name": "Electronic Health Records Modernization", "description": "Upgrade EHR system hospital-wide", "status": "in_progress"},
            {"name": "Cardiac Center Expansion", "description": "Expand cardiac treatment facilities and services", "status": "planning"},
            {"name": "Telehealth Implementation", "description": "Implement comprehensive telehealth services", "status": "in_progress"},
            {"name": "Emergency Department Renovation", "description": "Renovate and expand emergency facilities", "status": "active"},
            {"name": "AI Diagnostic Imaging Project", "description": "Implement AI for radiology diagnostics", "status": "planning"},
            {"name": "Pediatric Cancer Center", "description": "New specialized treatment center for pediatric oncology", "status": "active"}
        ]
        
        project_ids = {}
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
                "tenant_id": tenant_id,
                "name": project["name"],
                "description": project["description"],
                "status": project["status"],
                "properties": json.dumps(properties),
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, project_query, project_params)
            project_ids[project["name"]] = project_id
            print(f"Created project: {project['name']}")
        
        # Clear existing goals
        await execute_query(session, "DELETE FROM goals WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing goals")
        
        # Create goals
        goals = [
            {"name": "Improve Patient Outcomes", "description": "Reduce readmission rates and improve patient care metrics", "status": "active"},
            {"name": "Expand Specialty Services", "description": "Add new specialties and service lines", "status": "active"},
            {"name": "Achieve HIMSS Stage 7", "description": "Reach highest level of electronic medical record adoption", "status": "in_progress"},
            {"name": "Increase Research Funding", "description": "Secure additional grants and research partnerships", "status": "active"},
            {"name": "Enhance Patient Experience", "description": "Improve satisfaction scores and care experience", "status": "in_progress"}
        ]
        
        goal_ids = {}
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
                "tenant_id": tenant_id,
                "title": goal["name"],
                "description": goal["description"],
                "status": goal["status"],
                "type": "ENTERPRISE",
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, goal_query, goal_params)
            goal_ids[goal["name"]] = goal_id
            print(f"Created goal: {goal['name']}")
        
        # Clear existing nodes
        await execute_query(session, "DELETE FROM nodes WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing nodes")
        
        # Create department nodes
        for dept_name, dept_id in department_ids.items():
            node_id = str(uuid.uuid4())
            x_pos = (hash(dept_name) % 200) - 100
            y_pos = (hash(dept_name + "y") % 200) - 100
            
            node_query = """
            INSERT INTO nodes (id, tenant_id, type, props, x, y, created_at, updated_at)
            VALUES (:node_id, :tenant_id, 'department', :props, :x, :y, :created_at, :updated_at);
            """
            
            props = {
                "name": dept_name,
                "entity_id": dept_id,
                "entity_type": "department"
            }
            
            node_params = {
                "node_id": node_id,
                "tenant_id": tenant_id,
                "props": json.dumps(props),
                "x": x_pos,
                "y": y_pos,
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, node_query, node_params)
            print(f"Created node for department: {dept_name}")
        
        # Create nodes for teams, projects, users and edges for visualization in a similar way to tech tenant
        
        # Clear existing edges
        await execute_query(session, "DELETE FROM edges WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing edges")
        
        # Create edges between departments and teams
        for team in teams:
            team_id = team_ids[team["name"]]
            dept_id = department_ids[team["department"]]
            edge_id = str(uuid.uuid4())
            
            edge_query = """
            INSERT INTO edges (id, tenant_id, src, dst, label, props, created_at, updated_at)
            VALUES (:edge_id, :tenant_id, :src, :dst, :label, :props, :created_at, :updated_at);
            """
            
            edge_params = {
                "edge_id": edge_id,
                "tenant_id": tenant_id,
                "src": dept_id,
                "dst": team_id,
                "label": "CONTAINS",
                "props": json.dumps({"type": "organizational"}),
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, edge_query, edge_params)
            print(f"Created edge: Department {team['department']} -> Team {team['name']}")
        
        # Commit all changes
        await session.commit()
        
        print(f"\n--- {tenant_name} Updated Successfully ---")
        print(f"Departments: {len(departments)}")
        print(f"Teams: {len(teams)}")
        print(f"Users: {len(users_data)}")
        print(f"Projects: {len(projects)}")
        print(f"Goals: {len(goals)}")

async def update_financial_tenant():
    """Update the Global Financial Group tenant with comprehensive data."""
    tenant_domain = "globalfingroup.com"
    tenant_name = "Global Financial Group"
    
    async with async_session() as session:
        # Get existing tenant ID
        tenant_id = await get_tenant_id(session, tenant_domain)
        if not tenant_id:
            print(f"Tenant {tenant_name} not found, skipping.")
            return
        
        print(f"Updating tenant: {tenant_name} (ID: {tenant_id})")
        now = datetime.now()
        
        # First, delete users (except admin) to avoid foreign key constraint issues
        await execute_query(
            session, 
            "DELETE FROM users WHERE tenant_id = :tenant_id AND email != :admin_email",
            {"tenant_id": tenant_id, "admin_email": f"admin@{tenant_domain}"}
        )
        print("Cleared existing users except admin")
        
        # Then delete teams
        await execute_query(session, "DELETE FROM teams WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing teams")
        
        # Then, clear existing departments
        await execute_query(session, "DELETE FROM departments WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing departments")
        
        # Create departments
        departments = [
            {"name": "Investment Banking", "description": "Corporate finance and advisory services"},
            {"name": "Asset Management", "description": "Investment and portfolio management"},
            {"name": "Retail Banking", "description": "Consumer banking services"},
            {"name": "Risk Management", "description": "Risk assessment and mitigation"},
            {"name": "Technology", "description": "IT infrastructure and development"},
            {"name": "Operations", "description": "Business operations and support"},
            {"name": "Compliance", "description": "Regulatory compliance and legal"},
            {"name": "Marketing", "description": "Brand and marketing initiatives"}
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
                "tenant_id": tenant_id,
                "name": dept["name"],
                "description": dept["description"],
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, dept_query, dept_params)
            department_ids[dept["name"]] = dept_id
            print(f"Created department: {dept['name']}")
        
        # Create teams
        teams = [
            {"name": "M&A Advisory", "description": "Mergers and acquisitions", "department": "Investment Banking"},
            {"name": "Debt Capital Markets", "description": "Debt offerings and restructuring", "department": "Investment Banking"},
            {"name": "Equity Capital Markets", "description": "IPOs and equity offerings", "department": "Investment Banking"},
            
            {"name": "Fixed Income", "description": "Bond and fixed income investments", "department": "Asset Management"},
            {"name": "Equities", "description": "Stock portfolio management", "department": "Asset Management"},
            {"name": "Alternative Investments", "description": "Private equity, real estate, etc.", "department": "Asset Management"},
            
            {"name": "Private Banking", "description": "High net worth client services", "department": "Retail Banking"},
            {"name": "Consumer Lending", "description": "Personal loans and mortgages", "department": "Retail Banking"},
            {"name": "Branch Operations", "description": "Physical branch management", "department": "Retail Banking"},
            
            {"name": "Credit Risk", "description": "Credit analysis and risk assessment", "department": "Risk Management"},
            {"name": "Market Risk", "description": "Market volatility risk management", "department": "Risk Management"},
            {"name": "Operational Risk", "description": "Business process risk assessment", "department": "Risk Management"},
            
            {"name": "FinTech Innovation", "description": "Financial technology innovation", "department": "Technology"},
            {"name": "Infrastructure", "description": "IT systems and infrastructure", "department": "Technology"},
            {"name": "Cybersecurity", "description": "Security and threat protection", "department": "Technology"},
            
            {"name": "Trade Operations", "description": "Trade settlement and processing", "department": "Operations"},
            {"name": "Client Services", "description": "Client support and onboarding", "department": "Operations"},
            {"name": "Facilities", "description": "Physical facilities management", "department": "Operations"},
            
            {"name": "Regulatory Affairs", "description": "Regulatory liaison and reporting", "department": "Compliance"},
            {"name": "Legal", "description": "Legal counsel and contracts", "department": "Compliance"},
            
            {"name": "Digital Marketing", "description": "Online marketing and social media", "department": "Marketing"},
            {"name": "Brand Management", "description": "Corporate branding and identity", "department": "Marketing"}
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
                "tenant_id": tenant_id,
                "name": team["name"],
                "description": team["description"],
                "dept_id": dept_id,
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, team_query, team_params)
            team_ids[team["name"]] = team_id
            print(f"Created team: {team['name']} in {team['department']}")
        
        # Create some key projects and goals
        
        # Clear existing projects
        await execute_query(session, "DELETE FROM projects WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing projects")
        
        # Create projects
        projects = [
            {"name": "Wealth Tech Platform", "description": "Develop a new digital wealth management platform", "status": "in_progress"},
            {"name": "AI-Powered Advisory", "description": "Implement AI for investment recommendations", "status": "planning"},
            {"name": "Regulatory Compliance System", "description": "Enhance compliance monitoring and reporting", "status": "active"},
            {"name": "Mobile Banking Redesign", "description": "Redesign mobile banking applications", "status": "in_progress"},
            {"name": "ESG Investment Framework", "description": "Develop ESG investment analysis tools", "status": "planning"},
            {"name": "Digital Identity Verification", "description": "Implement enhanced digital ID verification", "status": "active"},
            {"name": "Data Lake Implementation", "description": "Centralize data management and analytics", "status": "in_progress"}
        ]
        
        project_ids = {}
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
                "start_date": (now - timedelta(days=60)).isoformat(),
                "target_date": (now + timedelta(days=180)).isoformat()
            }
            
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
            project_ids[project["name"]] = project_id
            print(f"Created project: {project['name']}")
        
        # Commit all changes
        await session.commit()
        
        print(f"\n--- {tenant_name} Updated Successfully ---")
        print(f"Departments: {len(departments)}")
        print(f"Teams: {len(teams)}")
        print(f"Projects: {len(projects)}")

async def update_manufacturing_tenant():
    """Update the Advanced Manufacturing Corp tenant with comprehensive data."""
    tenant_domain = "advancedmfg.com"
    tenant_name = "Advanced Manufacturing Corp"
    
    async with async_session() as session:
        # Get existing tenant ID
        tenant_id = await get_tenant_id(session, tenant_domain)
        if not tenant_id:
            print(f"Tenant {tenant_name} not found, skipping.")
            return
        
        print(f"Updating tenant: {tenant_name} (ID: {tenant_id})")
        now = datetime.now()
        
        # First, delete users (except admin) to avoid foreign key constraint issues
        await execute_query(
            session, 
            "DELETE FROM users WHERE tenant_id = :tenant_id AND email != :admin_email",
            {"tenant_id": tenant_id, "admin_email": f"admin@{tenant_domain}"}
        )
        print("Cleared existing users except admin")
        
        # Then delete teams
        await execute_query(session, "DELETE FROM teams WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing teams")
        
        # Then, clear existing departments
        await execute_query(session, "DELETE FROM departments WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing departments")
        
        # Create departments
        departments = [
            {"name": "Engineering", "description": "Product design and engineering"},
            {"name": "Production", "description": "Manufacturing operations"},
            {"name": "Quality Assurance", "description": "Quality testing and assurance"},
            {"name": "Supply Chain", "description": "Materials and logistics management"},
            {"name": "Research & Development", "description": "New product development"},
            {"name": "Maintenance", "description": "Equipment maintenance and reliability"},
            {"name": "Safety & Compliance", "description": "Safety and regulatory compliance"},
            {"name": "Operations", "description": "Business operations and management"}
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
                "tenant_id": tenant_id,
                "name": dept["name"],
                "description": dept["description"],
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, dept_query, dept_params)
            department_ids[dept["name"]] = dept_id
            print(f"Created department: {dept['name']}")
        
        # Create key manufacturing projects
        await execute_query(session, "DELETE FROM projects WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing projects")
        
        # Create projects
        projects = [
            {"name": "Smart Factory Initiative", "description": "IoT-enabled manufacturing systems", "status": "in_progress"},
            {"name": "Digital Twin Implementation", "description": "Digital replicas of physical systems", "status": "planning"},
            {"name": "Automated Production Line", "description": "New robotic assembly line implementation", "status": "active"},
            {"name": "Predictive Maintenance System", "description": "AI-based equipment monitoring", "status": "in_progress"},
            {"name": "Supply Chain Optimization", "description": "Streamlining procurement and logistics", "status": "planning"},
            {"name": "Zero-Waste Manufacturing", "description": "Sustainable manufacturing practices", "status": "active"},
            {"name": "Advanced Materials Testing", "description": "R&D on next-gen materials", "status": "in_progress"},
            {"name": "Quality Control AI", "description": "Computer vision for defect detection", "status": "planning"}
        ]
        
        project_ids = {}
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
                "start_date": (now - timedelta(days=45)).isoformat(),
                "target_date": (now + timedelta(days=200)).isoformat()
            }
            
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
            project_ids[project["name"]] = project_id
            print(f"Created project: {project['name']}")
        
        # Commit all changes
        await session.commit()
        
        print(f"\n--- {tenant_name} Updated Successfully ---")
        print(f"Departments: {len(departments)}")
        print(f"Projects: {len(projects)}")

async def update_education_tenant():
    """Update the University Research Alliance tenant with comprehensive data."""
    tenant_domain = "uniresearch.edu"
    tenant_name = "University Research Alliance"
    
    async with async_session() as session:
        # Get existing tenant ID
        tenant_id = await get_tenant_id(session, tenant_domain)
        if not tenant_id:
            print(f"Tenant {tenant_name} not found, skipping.")
            return
        
        print(f"Updating tenant: {tenant_name} (ID: {tenant_id})")
        now = datetime.now()
        
        # First, delete users (except admin) to avoid foreign key constraint issues
        await execute_query(
            session, 
            "DELETE FROM users WHERE tenant_id = :tenant_id AND email != :admin_email",
            {"tenant_id": tenant_id, "admin_email": f"admin@{tenant_domain}"}
        )
        print("Cleared existing users except admin")
        
        # Then delete teams
        await execute_query(session, "DELETE FROM teams WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing teams")
        
        # Then, clear existing departments
        await execute_query(session, "DELETE FROM departments WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing departments")
        
        # Create departments (colleges)
        departments = [
            {"name": "College of Science", "description": "Natural sciences and mathematics"},
            {"name": "College of Engineering", "description": "Engineering disciplines"},
            {"name": "College of Liberal Arts", "description": "Humanities and social sciences"},
            {"name": "College of Business", "description": "Business and economics"},
            {"name": "College of Medicine", "description": "Medical sciences and healthcare"},
            {"name": "Information Technology", "description": "University IT services"},
            {"name": "Research Administration", "description": "Research support and grants"},
            {"name": "University Administration", "description": "Central university administration"}
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
                "tenant_id": tenant_id,
                "name": dept["name"],
                "description": dept["description"],
                "created_at": now,
                "updated_at": now
            }
            
            await execute_query(session, dept_query, dept_params)
            department_ids[dept["name"]] = dept_id
            print(f"Created department: {dept['name']}")
        
        # Create projects (research initiatives)
        await execute_query(session, "DELETE FROM projects WHERE tenant_id = :tenant_id", {"tenant_id": tenant_id})
        print("Cleared existing projects")
        
        # Create projects
        projects = [
            {"name": "Quantum Computing Research", "description": "Advanced quantum computing algorithms", "status": "active"},
            {"name": "Climate Science Initiative", "description": "Climate change impact research", "status": "in_progress"},
            {"name": "Neuroscience Collaborative", "description": "Brain function and cognition research", "status": "active"},
            {"name": "AI Ethics and Society", "description": "Ethical implications of AI", "status": "planning"},
            {"name": "Urban Sustainability Project", "description": "Sustainable urban development", "status": "in_progress"},
            {"name": "Renewable Energy Materials", "description": "Novel materials for energy storage", "status": "active"},
            {"name": "Genomic Medicine Initiative", "description": "Precision medicine applications", "status": "planning"},
            {"name": "Economic Policy Research", "description": "Macroeconomic policy analysis", "status": "in_progress"},
            {"name": "Digital Humanities Laboratory", "description": "Computational methods in humanities", "status": "active"}
        ]
        
        project_ids = {}
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
                "start_date": (now - timedelta(days=120)).isoformat(),
                "target_date": (now + timedelta(days=365)).isoformat(),
                "grant_amount": f"${1000000 + hash(project['name']) % 9000000:,}"
            }
            
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
            project_ids[project["name"]] = project_id
            print(f"Created project: {project['name']}")
        
        # Commit all changes
        await session.commit()
        
        print(f"\n--- {tenant_name} Updated Successfully ---")
        print(f"Departments: {len(departments)}")
        print(f"Projects: {len(projects)}")

async def main():
    """Update all demo tenants."""
    try:
        print("\n=== Updating Tech Innovations Inc. ===\n")
        await update_tech_tenant()
        
        print("\n=== Updating Metropolitan Health System ===\n")
        await update_healthcare_tenant()
        
        print("\n=== Updating Global Financial Group ===\n")
        await update_financial_tenant()
        
        print("\n=== Updating Advanced Manufacturing Corp ===\n")
        await update_manufacturing_tenant()
        
        print("\n=== Updating University Research Alliance ===\n")
        await update_education_tenant()
        
        print("\n=== All Demo Tenant Updates Complete ===")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())