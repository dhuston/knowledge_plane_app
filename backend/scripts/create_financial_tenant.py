#!/usr/bin/env python3
"""
Script to create a financial services tenant in Biosphere Alpha.
"""

import asyncio
import json
import uuid
from datetime import datetime, timedelta

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Define tenant details
TENANT_NAME = "Global Financial Group"
TENANT_DOMAIN = "globalfingroup.com"
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

async def create_financial_tenant():
    """Create the financial services tenant and related entities."""
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
                "primary_color": "#0F4C81",  # Deep blue
                "secondary_color": "#6E9BC5",  # Light blue
                "logo_url": "https://placeholder.com/financial-logo.png"
            },
            "company": {
                "type": "Financial Services",
                "industry": "Banking & Investment",
                "size": "Large Enterprise",
                "founded": 1953,
                "headquarters": "New York, NY",
                "aum": "$1.2 trillion",  # Assets under management
                "global_offices": 45
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
            {"name": "Investment Banking", "description": "Corporate finance and advisory services"},
            {"name": "Asset Management", "description": "Investment products and portfolio management"},
            {"name": "Retail Banking", "description": "Consumer banking services and products"},
            {"name": "Risk Management", "description": "Enterprise risk assessment and mitigation"},
            {"name": "Technology", "description": "IT systems and technology innovation"},
            {"name": "Operations", "description": "Back-office and administrative functions"},
            {"name": "Compliance", "description": "Regulatory compliance and legal affairs"},
            {"name": "Marketing", "description": "Brand management and client acquisition"}
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
            {"name": "M&A Advisory", "description": "Mergers and acquisitions advisory", "department": "Investment Banking"},
            {"name": "Capital Markets", "description": "Equity and debt capital markets", "department": "Investment Banking"},
            {"name": "Equity Research", "description": "Equity analysis and research", "department": "Investment Banking"},
            
            {"name": "Fixed Income", "description": "Fixed income investment strategies", "department": "Asset Management"},
            {"name": "Equity Funds", "description": "Equity fund management", "department": "Asset Management"},
            {"name": "Alternative Investments", "description": "Private equity and hedge funds", "department": "Asset Management"},
            
            {"name": "Consumer Banking", "description": "Personal banking services", "department": "Retail Banking"},
            {"name": "Wealth Management", "description": "High net-worth client services", "department": "Retail Banking"},
            {"name": "Mortgage Services", "description": "Home loans and financing", "department": "Retail Banking"},
            
            {"name": "Market Risk", "description": "Trading and market risk analysis", "department": "Risk Management"},
            {"name": "Credit Risk", "description": "Credit risk assessment", "department": "Risk Management"},
            {"name": "Operational Risk", "description": "Process and operational risk", "department": "Risk Management"},
            
            {"name": "Core Banking Systems", "description": "Banking platform development", "department": "Technology"},
            {"name": "Digital Channels", "description": "Mobile and web applications", "department": "Technology"},
            {"name": "Data Analytics", "description": "Business intelligence and analytics", "department": "Technology"},
            {"name": "Cybersecurity", "description": "Security operations and controls", "department": "Technology"},
            
            {"name": "Trade Operations", "description": "Trade execution and settlement", "department": "Operations"},
            {"name": "Client Services", "description": "Client support and onboarding", "department": "Operations"},
            
            {"name": "Regulatory Affairs", "description": "Regulatory compliance monitoring", "department": "Compliance"},
            {"name": "AML", "description": "Anti-money laundering compliance", "department": "Compliance"},
            
            {"name": "Digital Marketing", "description": "Online marketing and campaigns", "department": "Marketing"},
            {"name": "Brand Strategy", "description": "Brand positioning and management", "department": "Marketing"}
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
            "name": "Financial Admin",
            "email": f"admin@{TENANT_DOMAIN}",
            "title": "Chief Administrative Officer",
            "auth_provider_id": f"finance-admin-{uuid.uuid4()}",
            "created_at": now,
            "updated_at": now
        }
        
        await execute_query(session, admin_query, admin_params)
        print(f"Created admin user: admin@{TENANT_DOMAIN}")
        
        # 5. Create executives and team leads
        users_data = [
            {"name": "Robert Mitchell", "email": f"r.mitchell@{TENANT_DOMAIN}", "title": "Chief Investment Officer", "team": "Equity Funds"},
            {"name": "Jennifer Blackwell", "email": f"j.blackwell@{TENANT_DOMAIN}", "title": "Head of Investment Banking", "team": "M&A Advisory"},
            {"name": "Michael Wei", "email": f"m.wei@{TENANT_DOMAIN}", "title": "Head of Retail Banking", "team": "Consumer Banking"},
            {"name": "Sarah Johnson", "email": f"s.johnson@{TENANT_DOMAIN}", "title": "Chief Risk Officer", "team": "Market Risk"},
            {"name": "David Rodriguez", "email": f"d.rodriguez@{TENANT_DOMAIN}", "title": "Chief Technology Officer", "team": "Core Banking Systems"},
            {"name": "Lisa Thompson", "email": f"l.thompson@{TENANT_DOMAIN}", "title": "Head of Operations", "team": "Trade Operations"},
            {"name": "Thomas Patel", "email": f"t.patel@{TENANT_DOMAIN}", "title": "Chief Compliance Officer", "team": "Regulatory Affairs"},
            {"name": "Christine Park", "email": f"c.park@{TENANT_DOMAIN}", "title": "Chief Marketing Officer", "team": "Brand Strategy"},
            
            # Team leads
            {"name": "Andrew Wilson", "email": f"a.wilson@{TENANT_DOMAIN}", "title": "Director, Capital Markets", "team": "Capital Markets"},
            {"name": "Emma Garcia", "email": f"e.garcia@{TENANT_DOMAIN}", "title": "Lead Analyst, Equity Research", "team": "Equity Research"},
            {"name": "Daniel Lee", "email": f"d.lee@{TENANT_DOMAIN}", "title": "Director, Fixed Income", "team": "Fixed Income"},
            {"name": "Sophia Chen", "email": f"s.chen@{TENANT_DOMAIN}", "title": "VP, Alternative Investments", "team": "Alternative Investments"},
            {"name": "James Brown", "email": f"j.brown@{TENANT_DOMAIN}", "title": "Director, Wealth Management", "team": "Wealth Management"},
            {"name": "Olivia Smith", "email": f"o.smith@{TENANT_DOMAIN}", "title": "Head of Mortgage Services", "team": "Mortgage Services"},
            {"name": "Benjamin Nguyen", "email": f"b.nguyen@{TENANT_DOMAIN}", "title": "Director, Credit Risk", "team": "Credit Risk"},
            {"name": "William Taylor", "email": f"w.taylor@{TENANT_DOMAIN}", "title": "VP, Operational Risk", "team": "Operational Risk"},
            {"name": "Ava Martinez", "email": f"a.martinez@{TENANT_DOMAIN}", "title": "Head of Digital Channels", "team": "Digital Channels"},
            {"name": "Lucas Anderson", "email": f"l.anderson@{TENANT_DOMAIN}", "title": "Chief Security Officer", "team": "Cybersecurity"},
            {"name": "Noah Kim", "email": f"n.kim@{TENANT_DOMAIN}", "title": "VP, Data Analytics", "team": "Data Analytics"},
            {"name": "Isabella Wright", "email": f"i.wright@{TENANT_DOMAIN}", "title": "Director, Client Services", "team": "Client Services"},
            {"name": "Ethan Miller", "email": f"e.miller@{TENANT_DOMAIN}", "title": "Head of AML", "team": "AML"},
            {"name": "Mia Davis", "email": f"m.davis@{TENANT_DOMAIN}", "title": "Director, Digital Marketing", "team": "Digital Marketing"}
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
                "auth_provider_id": f"finance-user-{user_data['name'].replace(' ', '-').lower()}-{uuid.uuid4()}",
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
        
        # 7. Create strategic projects
        projects = [
            {"name": "Digital Banking Transformation", "description": "Complete overhaul of digital banking platforms", "status": "in_progress"},
            {"name": "Wealth Tech Platform", "description": "New wealth management technology platform", "status": "planning"},
            {"name": "ESG Investment Framework", "description": "Environmental, Social, and Governance investment framework", "status": "in_progress"},
            {"name": "Risk Analytics Modernization", "description": "Advanced risk modeling and analytics capabilities", "status": "active"},
            {"name": "Client 360 Initiative", "description": "Unified client data and relationship management", "status": "planning"},
            {"name": "Regulatory Reporting Automation", "description": "Automated compliance reporting system", "status": "active"},
            {"name": "AI-Powered Advisory", "description": "AI-based investment recommendation engine", "status": "planning"}
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
                "start_date": (now - timedelta(days=60)).isoformat(),
                "target_date": (now + timedelta(days=300)).isoformat()
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
            {"name": "Digital Transformation", "description": "Transform client experience through digital channels", "status": "active"},
            {"name": "Operational Excellence", "description": "Optimize processes and reduce operational costs", "status": "in_progress"},
            {"name": "Product Innovation", "description": "Launch new financial products and services", "status": "active"},
            {"name": "Regulatory Compliance", "description": "Ensure 100% compliance with regulatory requirements", "status": "active"},
            {"name": "Market Expansion", "description": "Enter new markets and increase market share", "status": "in_progress"},
            {"name": "Talent Development", "description": "Enhance employee skills and organizational capabilities", "status": "active"}
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
        
        print("\n--- Financial Services Tenant Created Successfully ---")
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
        await create_financial_tenant()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())