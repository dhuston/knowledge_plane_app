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
from datetime import datetime, timedelta, timezone

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

# Use proper UTC time - no deprecation warnings
now = datetime.now(timezone.utc)

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
          
        # 2. Create teams
        teams = [
            {"name": "Frontend", "description": "Frontend development"},
            {"name": "Backend", "description": "Backend services and APIs"},
            {"name": "DevOps", "description": "Infrastructure and deployment"},
            {"name": "Mobile", "description": "Mobile app development"},
            {"name": "Data Science", "description": "ML and data analytics"},
            {"name": "QA", "description": "Quality assurance and testing"},
            {"name": "UX/UI", "description": "User experience and design"},
            {"name": "Product Management", "description": "Product vision and roadmaps"},
            {"name": "Digital Marketing", "description": "Online marketing campaigns"},
            {"name": "Content", "description": "Content creation and management"},
            {"name": "Sales Development", "description": "Lead generation and qualification"},
            {"name": "Account Management", "description": "Client relationship management"},
            {"name": "Finance", "description": "Accounting and financial planning"},
            {"name": "HR", "description": "Human resources and talent acquisition"},
            {"name": "AI Research", "description": "Advanced AI research"},
            {"name": "Quantum Computing", "description": "Quantum computing applications"}
        ]
        
        team_ids = {}
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
                team_id = str(team_id)
                
            team_ids[team["name"]] = team_id
            
        # 3. Create regular users
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
            user_check_query = """
            SELECT id FROM users 
            WHERE tenant_id = :tenant_id AND email = :email;
            """
            user_result = await execute_query(session, 
                                          user_check_query, 
                                          {"tenant_id": tenant_id, "email": user_data["email"]})
            user_id = user_result.scalar()
            
            if not user_id:
                user_id = str(uuid.uuid4())
                team_id = team_ids[user_data["team"]]
                
                user_query = """
                INSERT INTO users (
                    id, tenant_id, name, email, title, 
                    team_id, auth_provider, auth_provider_id, created_at, updated_at,
                    hashed_password
                )
                VALUES (
                    :user_id, :tenant_id, :name, :email, :title, 
                    :team_id, 'password', :auth_provider_id, :created_at, :updated_at,
                    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'
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
                print(f"Created user: {user_data['name']}")
            else:
                print(f"User already exists: {user_data['name']}")
                user_id = str(user_id)
                
            user_ids[user_data["email"]] = user_id

        # 4. Update teams with lead_id (first user in each team becomes the lead)
        for team in teams:
            team_id = team_ids[team["name"]]
            # Find a user in this team
            for user_data in users_data:
                if user_data["team"] == team["name"]:
                    lead_id = user_ids[user_data["email"]]
                    
                    # Check if lead is already set
                    lead_check_query = """
                    SELECT lead_id FROM teams 
                    WHERE id = :team_id;
                    """
                    lead_result = await execute_query(session, lead_check_query, {"team_id": team_id})
                    existing_lead_id = lead_result.scalar()
                    
                    if not existing_lead_id:
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
                    
        # 5. Create goals with strategic alignment focus
        goals = [
            {
                "name": "AI-Driven Product Innovation", 
                "description": "Integrate advanced AI capabilities into all products to drive innovation and competitive advantage", 
                "status": "in_progress",
                "type": "ENTERPRISE",
                "priority": "HIGH",
                "target_date": (now + timedelta(days=180)).isoformat(),
                "teams": ["AI Research", "Product Management", "Backend"]
            },
            {
                "name": "Cloud Infrastructure Modernization", 
                "description": "Update our cloud infrastructure to improve scalability, security, and reduce operational costs", 
                "status": "active",
                "type": "DEPARTMENT",
                "priority": "HIGH",
                "target_date": (now + timedelta(days=90)).isoformat(),
                "teams": ["DevOps", "Backend", "QA"]
            },
            {
                "name": "Improve Developer Experience", 
                "description": "Streamline development workflows and tooling to increase engineering productivity", 
                "status": "planning",
                "type": "DEPARTMENT",
                "priority": "MEDIUM",
                "target_date": (now + timedelta(days=120)).isoformat(),
                "teams": ["Frontend", "Backend", "DevOps", "Mobile"]
            },
            {
                "name": "Customer Acquisition Growth", 
                "description": "Increase new customer acquisition by 30% through improved marketing and sales alignment", 
                "status": "active",
                "type": "ENTERPRISE",
                "priority": "HIGH",
                "target_date": (now + timedelta(days=90)).isoformat(),
                "teams": ["Digital Marketing", "Sales Development", "Content"]
            },
            {
                "name": "Mobile App Redesign", 
                "description": "Complete redesign of mobile app to improve user experience and increase user engagement", 
                "status": "in_progress",
                "type": "TEAM",
                "priority": "HIGH",
                "target_date": (now + timedelta(days=60)).isoformat(),
                "teams": ["Mobile", "UX/UI", "Product Management"]
            }
        ]
        
        goal_ids = {}
        for goal in goals:
            goal_check_query = """
            SELECT id FROM goals 
            WHERE tenant_id = :tenant_id AND title = :title;
            """
            goal_result = await execute_query(session, 
                                         goal_check_query, 
                                         {"tenant_id": tenant_id, "title": goal["name"]})
            goal_id = goal_result.scalar()
            
            if not goal_id:
                goal_id = str(uuid.uuid4())
                
                goal_query = """
                INSERT INTO goals (
                    id, tenant_id, title, description, status, type, 
                    created_at, updated_at, properties
                )
                VALUES (
                    :goal_id, :tenant_id, :title, :description, :status, :type,
                    :created_at, :updated_at, :properties
                )
                RETURNING id;
                """
                
                properties = {
                    "priority": goal["priority"],
                    "target_date": goal["target_date"],
                    "progress": 25 if goal["status"] == "in_progress" else (0 if goal["status"] == "planning" else 50)
                }
                
                goal_params = {
                    "goal_id": goal_id,
                    "tenant_id": tenant_id,
                    "title": goal["name"],
                    "description": goal["description"],
                    "status": goal["status"],
                    "type": goal["type"],
                    "properties": json.dumps(properties),
                    "created_at": now,
                    "updated_at": now
                }
                
                await execute_query(session, goal_query, goal_params)
                print(f"Created goal: {goal['name']}")
                
                # Add team associations for this goal
                for team_name in goal["teams"]:
                    team_id = team_ids[team_name]
                    
                    # Create nodes for teams and goals if they don't exist
                    # Check if team node exists
                    team_node_query = """
                    SELECT id FROM nodes 
                    WHERE tenant_id = :tenant_id AND props->>'entity_id' = :entity_id AND type = 'team';
                    """
                    team_node_result = await execute_query(session, 
                                                      team_node_query, 
                                                      {"tenant_id": tenant_id, "entity_id": team_id})
                    team_node_id = team_node_result.scalar()
                    
                    if not team_node_id:
                        team_node_id = str(uuid.uuid4())
                        team_node_query = """
                        INSERT INTO nodes (id, tenant_id, type, props)
                        VALUES (:node_id, :tenant_id, 'team', :props)
                        RETURNING id;
                        """
                        
                        team_props = {
                            "entity_id": team_id,
                            "name": team_name,
                            "label": team_name
                        }
                        
                        team_node_params = {
                            "node_id": team_node_id,
                            "tenant_id": tenant_id,
                            "props": json.dumps(team_props)
                        }
                        
                        await execute_query(session, team_node_query, team_node_params)
                        print(f"Created node for team: {team_name}")
                    else:
                        team_node_id = str(team_node_id)
                    
                    # Check if goal node exists
                    goal_node_query = """
                    SELECT id FROM nodes 
                    WHERE tenant_id = :tenant_id AND props->>'entity_id' = :entity_id AND type = 'goal';
                    """
                    goal_node_result = await execute_query(session, 
                                                      goal_node_query, 
                                                      {"tenant_id": tenant_id, "entity_id": goal_id})
                    goal_node_id = goal_node_result.scalar()
                    
                    if not goal_node_id:
                        goal_node_id = str(uuid.uuid4())
                        goal_node_query = """
                        INSERT INTO nodes (id, tenant_id, type, props)
                        VALUES (:node_id, :tenant_id, 'goal', :props)
                        RETURNING id;
                        """
                        
                        goal_props = {
                            "entity_id": goal_id,
                            "name": goal["name"],
                            "label": goal["name"],
                            "status": goal["status"]
                        }
                        
                        goal_node_params = {
                            "node_id": goal_node_id,
                            "tenant_id": tenant_id,
                            "props": json.dumps(goal_props)
                        }
                        
                        await execute_query(session, goal_node_query, goal_node_params)
                        print(f"Created node for goal: {goal['name']}")
                    else:
                        goal_node_id = str(goal_node_id)
                    
                    # Create edge from team to goal
                    edge_id = str(uuid.uuid4())
                    edge_query = """
                    INSERT INTO edges (id, tenant_id, source, target, type, props)
                    VALUES (:edge_id, :tenant_id, :source, :target, :type, :props)
                    ON CONFLICT DO NOTHING
                    RETURNING id;
                    """
                    
                    edge_props = {
                        "relationship": "aligned_with",
                        "strength": 0.8,
                        "created_at": now.isoformat()
                    }
                    
                    edge_params = {
                        "edge_id": edge_id,
                        "tenant_id": tenant_id,
                        "source": team_node_id,
                        "target": goal_node_id,
                        "type": "ALIGNED_WITH",
                        "props": json.dumps(edge_props)
                    }
                    
                    await execute_query(session, edge_query, edge_params)
                    print(f"Created alignment between {team_name} and goal: {goal['name']}")
            else:
                print(f"Goal already exists: {goal['name']}")
                goal_id = str(goal_id)
                
            goal_ids[goal["name"]] = goal_id

        # 6. Create projects with real-world technology use cases
        projects = [
            {
                "name": "NextGen Cloud Platform", 
                "description": "Complete redesign of our cloud computing platform with containerization, microservices, and serverless capabilities",
                "status": "in_progress",
                "start_date": (now - timedelta(days=60)).isoformat(),
                "target_date": (now + timedelta(days=120)).isoformat(),
                "teams": ["Backend", "DevOps", "QA"],
                "goals": ["Cloud Infrastructure Modernization"],
                "owner": "michael.r@techinnovations.com"
            },
            {
                "name": "Mobile App v3.0", 
                "description": "Major update to our mobile application with AI-powered features, improved UI, and faster performance",
                "status": "active",
                "start_date": (now - timedelta(days=30)).isoformat(),
                "target_date": (now + timedelta(days=90)).isoformat(),
                "teams": ["Mobile", "UX/UI", "Frontend"],
                "goals": ["Mobile App Redesign", "AI-Driven Product Innovation"],
                "owner": "james.w@techinnovations.com"
            },
            {
                "name": "Developer Productivity Toolkit", 
                "description": "Internal tooling improvements for developer workflows including automated testing, CI/CD enhancements, and code quality checks",
                "status": "planning",
                "start_date": (now - timedelta(days=15)).isoformat(),
                "target_date": (now + timedelta(days=75)).isoformat(),
                "teams": ["DevOps", "QA", "Backend", "Frontend"],
                "goals": ["Improve Developer Experience"],
                "owner": "raj.patel@techinnovations.com"
            },
            {
                "name": "Customer Data Platform Integration", 
                "description": "Integration of marketing, sales and product data to create a unified customer data platform",
                "status": "active",
                "start_date": (now - timedelta(days=45)).isoformat(),
                "target_date": (now + timedelta(days=30)).isoformat(),
                "teams": ["Data Science", "Backend", "Sales Development"],
                "goals": ["Customer Acquisition Growth"],
                "owner": "zoe.m@techinnovations.com"
            },
            {
                "name": "AI Assistant Product Feature", 
                "description": "Development of an AI assistant feature for our core product to provide contextual help and automate routine tasks",
                "status": "in_progress",
                "start_date": (now - timedelta(days=75)).isoformat(),
                "target_date": (now + timedelta(days=45)).isoformat(),
                "teams": ["AI Research", "Backend", "UX/UI"],
                "goals": ["AI-Driven Product Innovation"],
                "owner": "kevin.l@techinnovations.com"
            }
        ]
        
        project_ids = {}
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
                
                # Get owner user ID
                owner_id = user_ids.get(project["owner"])
                
                # Set project properties
                properties = {
                    "start_date": project["start_date"],
                    "target_date": project["target_date"],
                    "priority": "HIGH",
                    "owner_id": owner_id
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
                
                # Add team associations
                for team_name in project["teams"]:
                    team_id = team_ids[team_name]
                    
                    # Get team node ID
                    team_node_query = """
                    SELECT id FROM nodes 
                    WHERE tenant_id = :tenant_id AND props->>'entity_id' = :entity_id AND type = 'team';
                    """
                    team_node_result = await execute_query(session, 
                                                      team_node_query, 
                                                      {"tenant_id": tenant_id, "entity_id": team_id})
                    team_node_id = team_node_result.scalar()
                    
                    if team_node_id:
                        # Create edge from team to project
                        edge_id = str(uuid.uuid4())
                        edge_query = """
                        INSERT INTO edges (id, tenant_id, source, target, type, props)
                        VALUES (:edge_id, :tenant_id, :source, :target, :type, :props)
                        ON CONFLICT DO NOTHING
                        RETURNING id;
                        """
                        
                        edge_props = {
                            "relationship": "works_on",
                            "strength": 0.9,
                            "created_at": now.isoformat()
                        }
                        
                        edge_params = {
                            "edge_id": edge_id,
                            "tenant_id": tenant_id,
                            "source": team_node_id,
                            "target": project_node_id,
                            "type": "WORKS_ON",
                            "props": json.dumps(edge_props)
                        }
                        
                        await execute_query(session, edge_query, edge_params)
                        print(f"Created connection between {team_name} and project: {project['name']}")
                
                # Connect projects to goals
                for goal_name in project["goals"]:
                    goal_id = goal_ids.get(goal_name)
                    if goal_id:
                        # Get goal node ID
                        goal_node_query = """
                        SELECT id FROM nodes 
                        WHERE tenant_id = :tenant_id AND props->>'entity_id' = :entity_id AND type = 'goal';
                        """
                        goal_node_result = await execute_query(session, 
                                                          goal_node_query, 
                                                          {"tenant_id": tenant_id, "entity_id": goal_id})
                        goal_node_id = goal_node_result.scalar()
                        
                        if goal_node_id:
                            # Create edge from project to goal
                            edge_id = str(uuid.uuid4())
                            edge_query = """
                            INSERT INTO edges (id, tenant_id, source, target, type, props)
                            VALUES (:edge_id, :tenant_id, :source, :target, :type, :props)
                            ON CONFLICT DO NOTHING
                            RETURNING id;
                            """
                            
                            edge_props = {
                                "relationship": "contributes_to",
                                "strength": 0.85,
                                "created_at": now.isoformat()
                            }
                            
                            edge_params = {
                                "edge_id": edge_id,
                                "tenant_id": tenant_id,
                                "source": project_node_id,
                                "target": goal_node_id,
                                "type": "CONTRIBUTES_TO",
                                "props": json.dumps(edge_props)
                            }
                            
                            await execute_query(session, edge_query, edge_params)
                            print(f"Created connection between project: {project['name']} and goal: {goal_name}")
            else:
                print(f"Project already exists: {project['name']}")
                project_id = str(project_id)
                
            project_ids[project["name"]] = project_id
            
        # Create knowledge assets related to projects
        knowledge_assets = [
            {
                "title": "NextGen Cloud Architecture Document",
                "content": "# Cloud Platform Architecture\n\nThis document outlines the architecture for our new cloud platform, including microservices, containerization strategy, and serverless components.\n\n## Key Components\n\n- API Gateway using Kong\n- Kubernetes for container orchestration\n- Serverless functions for event processing\n- Distributed database layer",
                "type": "DOCUMENT",
                "asset_type": "architecture_document",
                "related_project": "NextGen Cloud Platform",
                "created_by": "raj.patel@techinnovations.com"
            },
            {
                "title": "Mobile App Redesign User Research",
                "content": "# Mobile App User Research Results\n\nThis document summarizes user research findings for our mobile app redesign project.\n\n## Key Findings\n\n- Users want faster load times (under 2 seconds)\n- AI recommendations are highly valued\n- Simpler navigation with fewer taps to key features\n- Dark mode is requested by 78% of users",
                "type": "DOCUMENT",
                "asset_type": "research",
                "related_project": "Mobile App v3.0",
                "created_by": "emily.w@techinnovations.com"
            },
            {
                "title": "AI Assistant Implementation Plan",
                "content": "# AI Assistant Implementation\n\nThis document outlines the plan for implementing the AI assistant feature in our core product.\n\n## Architecture\n\n- Natural language processing using our custom NLP model\n- Context-aware responses based on user history\n- Integration with knowledge base for accurate answers\n- Continuous learning from user interactions",
                "type": "DOCUMENT",
                "asset_type": "technical_specification",
                "related_project": "AI Assistant Product Feature",
                "created_by": "kevin.l@techinnovations.com"
            },
            {
                "title": "Developer Productivity Tools Selection",
                "content": "# Developer Tool Evaluation\n\nThis document contains our evaluation of various developer productivity tools for potential adoption.\n\n## Tools Evaluated\n\n- CI/CD: Jenkins, GitHub Actions, CircleCI\n- Code Quality: SonarQube, ESLint, Prettier\n- Testing: Jest, Cypress, Playwright\n- Infrastructure as Code: Terraform, Pulumi",
                "type": "DOCUMENT",
                "asset_type": "evaluation",
                "related_project": "Developer Productivity Toolkit",
                "created_by": "tyler.b@techinnovations.com"
            }
        ]
        
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
                creator_id = user_ids.get(asset["created_by"])
                related_project_id = project_ids.get(asset["related_project"])
                
                asset_query = """
                INSERT INTO knowledge_assets (
                    id, tenant_id, title, content, type, asset_type,
                    created_by, created_at, updated_at, metadata
                )
                VALUES (
                    :asset_id, :tenant_id, :title, :content, :type, :asset_type,
                    :created_by, :created_at, :updated_at, :metadata
                )
                RETURNING id;
                """
                
                metadata = {
                    "project_id": related_project_id,
                    "tags": ["technical", "documentation"],
                    "importance": "high"
                }
                
                asset_params = {
                    "asset_id": asset_id,
                    "tenant_id": tenant_id,
                    "title": asset["title"],
                    "content": asset["content"],
                    "type": asset["type"],
                    "asset_type": asset["asset_type"],
                    "created_by": creator_id,
                    "created_at": now,
                    "updated_at": now,
                    "metadata": json.dumps(metadata)
                }
                
                await execute_query(session, asset_query, asset_params)
                print(f"Created knowledge asset: {asset['title']}")
                
        # Commit all changes
        await session.commit()
        
        print("\n--- Tech Company Demo Use Case Created Successfully ---")
        print(f"Created {len(projects)} projects")
        print(f"Created {len(goals)} goals")
        print(f"Created {len(knowledge_assets)} knowledge assets")
        print(f"Created team and goal alignments")

async def main():
    try:
        await create_tech_demo_usecase()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())