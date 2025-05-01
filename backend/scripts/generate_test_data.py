#!/usr/bin/env python
"""
generate_test_data.py - Test Data Generator for KnowledgePlane AI

This script generates a large volume of test data by making API calls to the backend.
It creates teams, users, projects, goals, and knowledge assets to test the 
performance optimizations in the Living Map visualization.

Usage:
  python generate_test_data.py

Requirements:
  - requests package: pip install requests
"""

import requests
import random
import time
import json
import sys
from datetime import datetime, timedelta

# Configuration
API_BASE_URL = "http://localhost:8001/api/v1"  # Update if your API port is different
EMAIL = "drhuston1@gmail.com"  # Replace with your login email
PASSWORD = "password123"  # Replace with your login password

# Scale factors
SCALE_TEAMS = 30
SCALE_USERS = 300
SCALE_PROJECTS = 100
SCALE_GOALS = 60
SCALE_KNOWLEDGE_ASSETS = 500

# Sample data
TEAM_NAMES = [
    "Research & Development", "Product Innovation", "Clinical Operations",
    "Regulatory Affairs", "Market Access", "Commercial Strategy",
    "Data Science", "Medical Affairs", "Quality Assurance",
    "Digital Innovation", "Portfolio Management", "Patient Solutions",
    "Business Development", "Corporate Strategy", "Marketing",
    "Sales Operations", "Supply Chain", "External Affairs",
    "Genomics Research", "Safety & Risk", "Global Expansion"
]

PROJECT_PREFIXES = [
    "Development", "Optimization", "Research", "Innovation", "Implementation",
    "Clinical Trial", "Platform", "Strategic", "Accelerated", "Technical",
    "Market Launch", "Analysis", "Digital Transformation", "Integration"
]

PROJECT_AREAS = [
    "Oncology", "Immunology", "Neuroscience", "Cardiovascular", "Metabolism",
    "Digital Health", "Pipeline", "Analytics", "Precision Medicine", "AI/ML",
    "Patient Journey", "Operational Excellence", "Market Expansion", "Data Science"
]

PROJECT_STATUSES = ["Planning", "Active", "Completed", "On Hold", "Archived"]

GOAL_PREFIXES = [
    "Increase", "Optimize", "Achieve", "Establish", "Develop", 
    "Reduce", "Transform", "Enhance", "Launch", "Accelerate",
    "Strengthen", "Expand", "Improve", "Secure", "Deliver"
]

GOAL_METRICS = [
    "by 20% year-over-year", "across all global markets", "with 90% compliance",
    "by Q4 2025", "within 12 months", "through digital transformation",
    "while reducing costs by 15%", "to industry-leading levels", "with 3 key innovations",
    "achieving 95% adoption rate", "supporting 500K+ patients", "to $100M ARR"
]

class TestDataGenerator:
    def __init__(self, api_url=API_BASE_URL, email=EMAIL, password=PASSWORD):
        self.api_url = api_url
        self.email = email
        self.password = password
        self.token = None
        self.headers = {"Content-Type": "application/json"}
        self.teams = []
        self.users = []
        self.projects = []
        self.goals = []
        self.assets = []
        self.existing_teams = {}  # name -> id
        self.existing_users = {}  # email -> id
        self.existing_projects = {}  # name -> id
        self.existing_goals = {}  # title -> id
        
    def login(self):
        """Authenticate and get access token"""
        print("Logging in...")
        try:
            response = requests.post(
                f"{self.api_url}/auth/token", 
                data={"username": self.email, "password": self.password}, 
            )
            response.raise_for_status()
            data = response.json()
            self.token = data["access_token"]
            self.headers["Authorization"] = f"Bearer {self.token}"
            print("Login successful")
        except Exception as e:
            print(f"Login failed: {e}")
            sys.exit(1)
            
    def fetch_existing_entities(self):
        """Fetch existing entities to avoid duplicates"""
        print("\nFetching existing entities...")
        
        # Fetch existing teams
        try:
            response = requests.get(f"{self.api_url}/teams/", headers=self.headers)
            response.raise_for_status()
            teams = response.json()
            self.existing_teams = {team["name"]: team["id"] for team in teams}
            print(f"Found {len(self.existing_teams)} existing teams")
        except Exception as e:
            print(f"Failed to fetch teams: {e}")
            
        # Fetch existing users
        try:
            response = requests.get(f"{self.api_url}/users/", headers=self.headers)
            response.raise_for_status()
            users = response.json()
            self.existing_users = {user["email"]: user["id"] for user in users}
            print(f"Found {len(self.existing_users)} existing users")
        except Exception as e:
            print(f"Failed to fetch users: {e}")
            
        # Fetch existing projects
        try:
            response = requests.get(f"{self.api_url}/projects/", headers=self.headers)
            response.raise_for_status()
            projects = response.json()
            self.existing_projects = {project["name"]: project["id"] for project in projects}
            print(f"Found {len(self.existing_projects)} existing projects")
        except Exception as e:
            print(f"Failed to fetch projects: {e}")
            
        # Fetch existing goals
        try:
            response = requests.get(f"{self.api_url}/goals/", headers=self.headers)
            response.raise_for_status()
            goals = response.json()
            self.existing_goals = {goal["title"]: goal["id"] for goal in goals}
            print(f"Found {len(self.existing_goals)} existing goals")
        except Exception as e:
            print(f"Failed to fetch goals: {e}")
    
    def create_teams(self, count=SCALE_TEAMS):
        """Create teams"""
        print(f"\nCreating {count} teams...")
        created_count = 0
        
        for i in range(count):
            if i < len(TEAM_NAMES):
                name = TEAM_NAMES[i]
            else:
                name = f"Team {i+1}"
                
            # Check if team already exists
            if name in self.existing_teams:
                team_id = self.existing_teams[name]
                print(f"Team '{name}' already exists with ID {team_id}")
                # Fetch and add to our collection
                try:
                    response = requests.get(f"{self.api_url}/teams/{team_id}", headers=self.headers)
                    response.raise_for_status()
                    team = response.json()
                    self.teams.append(team)
                except Exception as e:
                    print(f"Failed to fetch existing team: {e}")
                continue
                
            data = {
                "name": name,
                "description": f"Team focused on {name.lower()} activities"
            }
            
            try:
                response = requests.post(
                    f"{self.api_url}/teams/", 
                    headers=self.headers,
                    json=data
                )
                response.raise_for_status()
                team = response.json()
                self.teams.append(team)
                self.existing_teams[name] = team["id"]  # Update existing teams map
                created_count += 1
                print(f"Created team: {team['name']}")
            except Exception as e:
                print(f"Failed to create team: {e}")
            
            # Rate limiting
            if i % 5 == 4:
                time.sleep(1)
                
        print(f"Created {created_count} new teams (total: {len(self.teams)})")
    
    def create_users(self, count=SCALE_USERS):
        """Create users and assign to teams"""
        if not self.teams:
            print("No teams available. Please create teams first.")
            return
            
        print(f"\nCreating {count} users...")
        created_count = 0
        
        for i in range(count):
            team = random.choice(self.teams)
            user_num = i + 1
            email = f"user{user_num}@example.com"
            
            # Check if user already exists
            if email in self.existing_users:
                user_id = self.existing_users[email]
                print(f"User with email '{email}' already exists with ID {user_id}")
                # Fetch and add to our collection
                try:
                    response = requests.get(f"{self.api_url}/users/{user_id}", headers=self.headers)
                    response.raise_for_status()
                    user = response.json()
                    self.users.append(user)
                except Exception as e:
                    print(f"Failed to fetch existing user: {e}")
                continue
            
            data = {
                "name": f"User {user_num}",
                "email": email,
                "title": f"Member, {team['name']}",
                "team_id": team['id']
            }
            
            try:
                response = requests.post(
                    f"{self.api_url}/users/", 
                    headers=self.headers,
                    json=data
                )
                response.raise_for_status()
                user = response.json()
                self.users.append(user)
                self.existing_users[email] = user["id"]  # Update existing users map
                created_count += 1
                
                # Update progress periodically
                if created_count % 20 == 0:
                    print(f"Created {created_count} new users so far...")
            except Exception as e:
                print(f"Failed to create user: {e}")
            
            # Rate limiting
            if i % 10 == 9:
                time.sleep(1)
                
        print(f"Created {created_count} new users (total: {len(self.users)})")
    
    def create_goals(self, count=SCALE_GOALS):
        """Create goals with hierarchy"""
        print(f"\nCreating {count} goals...")
        enterprise_created = 0
        total_created = 0
        
        # Create enterprise goals (about 10% of total)
        enterprise_count = max(3, count // 10)
        for i in range(enterprise_count):
            prefix = random.choice(GOAL_PREFIXES)
            area = random.choice(PROJECT_AREAS)
            metric = random.choice(GOAL_METRICS)
            title = f"[Enterprise] {prefix} {area} capabilities {metric}"
            
            # Check if goal already exists
            if title in self.existing_goals:
                goal_id = self.existing_goals[title]
                print(f"Goal '{title}' already exists with ID {goal_id}")
                # Fetch and add to our collection
                try:
                    response = requests.get(f"{self.api_url}/goals/{goal_id}", headers=self.headers)
                    response.raise_for_status()
                    goal = response.json()
                    self.goals.append(goal)
                except Exception as e:
                    print(f"Failed to fetch existing goal: {e}")
                continue
            
            data = {
                "title": title,
                "description": f"Enterprise objective to {prefix.lower()} our {area.lower()} capabilities {metric}.",
                "type": "ENTERPRISE",
                "progress": random.randint(0, 100)
            }
            
            try:
                response = requests.post(
                    f"{self.api_url}/goals/", 
                    headers=self.headers,
                    json=data
                )
                response.raise_for_status()
                goal = response.json()
                self.goals.append(goal)
                self.existing_goals[title] = goal["id"]  # Update existing goals map
                enterprise_created += 1
                total_created += 1
            except Exception as e:
                print(f"Failed to create enterprise goal: {e}")
                
        print(f"Created {enterprise_created} new enterprise goals")
        
        # Create department/team goals (linked to enterprise goals)
        remaining = count - enterprise_count
        for i in range(remaining):
            # 30% chance of being department goal, 70% team goal
            if i < remaining * 0.3:
                goal_type = "DEPARTMENT"
                parent_chance = 0.7  # 70% chance to link to enterprise goal
            else:
                goal_type = "TEAM"
                parent_chance = 0.8  # 80% chance to link to another goal
            
            prefix = random.choice(GOAL_PREFIXES)
            area = random.choice(PROJECT_AREAS)
            metric = random.choice(GOAL_METRICS)
            
            if goal_type == "DEPARTMENT":
                entity_name = f"Department {i+1}"
            else:
                team = random.choice(self.teams)
                entity_name = team["name"]
                
            title = f"[{entity_name}] {prefix} {area} capabilities {metric}"
            
            # Check if goal already exists
            if title in self.existing_goals:
                goal_id = self.existing_goals[title]
                print(f"Goal '{title[:30]}...' already exists with ID {goal_id}")
                # Fetch and add to our collection
                try:
                    response = requests.get(f"{self.api_url}/goals/{goal_id}", headers=self.headers)
                    response.raise_for_status()
                    goal = response.json()
                    self.goals.append(goal)
                except Exception as e:
                    print(f"Failed to fetch existing goal: {e}")
                continue
            
            data = {
                "title": title,
                "description": f"{goal_type.capitalize()} objective to {prefix.lower()} {area.lower()} capabilities {metric}.",
                "type": goal_type,
                "progress": random.randint(0, 100)
            }
            
            # Link to parent goal if specified
            if self.goals and random.random() < parent_chance:
                potential_parents = [g for g in self.goals 
                                    if g["type"] == "ENTERPRISE" or 
                                       (g["type"] == "DEPARTMENT" and goal_type == "TEAM")]
                if potential_parents:
                    parent = random.choice(potential_parents)
                    data["parent_id"] = parent["id"]
            
            try:
                response = requests.post(
                    f"{self.api_url}/goals/", 
                    headers=self.headers,
                    json=data
                )
                response.raise_for_status()
                goal = response.json()
                self.goals.append(goal)
                self.existing_goals[title] = goal["id"]  # Update existing goals map
                total_created += 1
                
                # Update progress periodically
                if total_created % 10 == 0:
                    print(f"Created {total_created} new goals so far...")
            except Exception as e:
                print(f"Failed to create goal: {e}")
            
            # Rate limiting
            if i % 5 == 4:
                time.sleep(1)
        
        print(f"Created {total_created} new goals (total: {len(self.goals)})")
        
    def create_projects(self, count=SCALE_PROJECTS):
        """Create projects and assign goals and team members"""
        if not self.teams:
            print("No teams available. Please create teams first.")
            return
            
        if not self.users:
            print("No users available. Please create users first.")
            return
            
        print(f"\nCreating {count} projects...")
        created_count = 0
        
        for i in range(count):
            team = random.choice(self.teams)
            prefix = random.choice(PROJECT_PREFIXES)
            area = random.choice(PROJECT_AREAS)
            project_id = f"PRJ-{i+1000}"
            name = f"{prefix}: {area} {project_id}"
            
            # Check if project already exists
            if name in self.existing_projects:
                project_id = self.existing_projects[name]
                print(f"Project '{name}' already exists with ID {project_id}")
                # Fetch and add to our collection
                try:
                    response = requests.get(f"{self.api_url}/projects/{project_id}", headers=self.headers)
                    response.raise_for_status()
                    project = response.json()
                    self.projects.append(project)
                except Exception as e:
                    print(f"Failed to fetch existing project: {e}")
                continue
            
            data = {
                "name": name,
                "description": f"{prefix} project focused on {area.lower()}.",
                "status": random.choice(PROJECT_STATUSES),
                "owning_team_id": team["id"]
            }
            
            # Link to goal if available (80% chance)
            if self.goals and random.random() < 0.8:
                goal = random.choice(self.goals)
                data["goal_id"] = goal["id"]
            
            try:
                response = requests.post(
                    f"{self.api_url}/projects/", 
                    headers=self.headers,
                    json=data
                )
                response.raise_for_status()
                project = response.json()
                self.projects.append(project)
                self.existing_projects[name] = project["id"]  # Update existing projects map
                created_count += 1
                
                # Add participants (3-8 per project)
                participant_count = random.randint(3, min(8, len(self.users)))
                team_users = [u for u in self.users if u.get("team_id") == team["id"]]
                participants = []
                
                # Prefer users from same team, but fall back to any users if needed
                if len(team_users) >= participant_count:
                    participants = random.sample(team_users, participant_count)
                else:
                    participants = team_users + random.sample(
                        [u for u in self.users if u.get("team_id") != team["id"]],
                        participant_count - len(team_users)
                    )
                
                # Add participants
                for user in participants:
                    try:
                        response = requests.post(
                            f"{self.api_url}/projects/{project['id']}/participants",
                            headers=self.headers,
                            json={"user_id": user["id"]}
                        )
                    except Exception as e:
                        print(f"Failed to add participant to project: {e}")
                
                # Update progress periodically
                if created_count % 10 == 0:
                    print(f"Created {created_count} new projects so far...")
            except Exception as e:
                print(f"Failed to create project: {e}")
            
            # Rate limiting
            if i % 5 == 4:
                time.sleep(1)
                
        print(f"Created {created_count} new projects (total: {len(self.projects)})")
    
    def create_knowledge_assets(self, count=SCALE_KNOWLEDGE_ASSETS):
        """Create knowledge assets linked to projects"""
        if not self.projects:
            print("No projects available. Please create projects first.")
            return
            
        if not self.users:
            print("No users available. Please create users first.")
            return
            
        print(f"\nCreating {count} knowledge assets...")
        created_count = 0
        
        # Mapping to track existing assets (simple key to avoid duplicates)
        existing_assets = {}
        
        # First check for existing assets
        try:
            response = requests.get(f"{self.api_url}/knowledge-assets/", headers=self.headers)
            response.raise_for_status()
            assets = response.json()
            for asset in assets:
                key = f"{asset.get('title', '')}:{asset.get('project_id', '')}"
                existing_assets[key] = asset["id"]
            print(f"Found {len(existing_assets)} existing knowledge assets")
        except Exception as e:
            print(f"Failed to fetch existing assets: {e}")
        
        asset_types = ["DOCUMENT", "NOTE", "MEETING"]
        
        for i in range(count):
            project = random.choice(self.projects)
            asset_type = random.choice(asset_types)
            user = random.choice(self.users)
            
            # Generate creation date (within last year)
            days_ago = random.randint(1, 365)
            created_date = (datetime.utcnow() - timedelta(days=days_ago)).strftime("%Y-%m-%dT%H:%M:%S")
            
            if asset_type == "NOTE":
                title = f"Note: {project['name']} update {i}"
                content = f"Update on {project['name']} progress from {created_date}."
            elif asset_type == "DOCUMENT":
                title = f"Document: {project['name']} - Technical Specification {i}"
                content = f"Technical specifications for {project['name']}."
            elif asset_type == "MEETING":
                title = f"Meeting: {project['name']} Status Review {i}"
                content = f"Team status review for {project['name']} held on {created_date}."
            
            # Check if asset already exists
            asset_key = f"{title}:{project['id']}"
            if asset_key in existing_assets:
                asset_id = existing_assets[asset_key]
                if i % 50 == 0:  # Only log occasionally to avoid flooding output
                    print(f"Asset '{title[:30]}...' already exists with ID {asset_id}")
                continue
            
            data = {
                "title": title,
                "content": content,
                "type": asset_type,
                "project_id": project["id"],
                "created_by_user_id": user["id"]
            }
            
            try:
                response = requests.post(
                    f"{self.api_url}/knowledge-assets/", 
                    headers=self.headers,
                    json=data
                )
                response.raise_for_status()
                asset = response.json()
                self.assets.append(asset)
                existing_assets[asset_key] = asset["id"]  # Update tracking
                created_count += 1
                
                # Update progress periodically
                if created_count % 50 == 0:
                    print(f"Created {created_count} new knowledge assets so far...")
            except Exception as e:
                print(f"Failed to create knowledge asset: {e}")
            
            # Rate limiting
            if i % 10 == 9:
                time.sleep(1)
                
        print(f"Created {created_count} new knowledge assets (total: {len(existing_assets)})")
    
    def generate_all(self):
        """Run the complete data generation process"""
        self.login()
        self.fetch_existing_entities()  # First fetch existing entities to prevent duplicates
        self.create_teams()
        self.create_users()
        self.create_goals()
        self.create_projects()
        self.create_knowledge_assets()
        
        print("\n--- Data Generation Complete ---")
        print(f"Current dataset size:")
        print(f"  - {len(self.teams)} teams")
        print(f"  - {len(self.users)} users")
        print(f"  - {len(self.goals)} goals")
        print(f"  - {len(self.projects)} projects")
        print(f"  - {len(self.assets)} knowledge assets (loaded during this run)")
        
        print("\nYou can now test the Living Map visualization with this dataset!")

if __name__ == "__main__":
    print("=== KnowledgePlane AI - Test Data Generator ===")
    print("This script will generate a large dataset for testing the Living Map visualization.")
    print("Note: This should only be run in a development environment!\n")
    
    confirmation = input("Continue? (y/n): ")
    if confirmation.lower() != 'y':
        print("Operation cancelled.")
        sys.exit(0)
    
    generator = TestDataGenerator()
    generator.generate_all()