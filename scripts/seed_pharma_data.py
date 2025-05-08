#!/usr/bin/env python3
"""
Database seeding script for Pharma AI Demo tenant
This script creates a complete dataset for the Pharma Research and Development tenant
including departments, teams, users, projects, goals, knowledge assets, and graph nodes/edges.
"""

import os
import sys
import uuid
import random
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Tuple, Any

# Add the parent directory to sys.path to import app modules
sys.path.append('/app')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.session import get_engine
from app.models.tenant import Tenant 
from app.models.department import Department
from app.models.team import Team
from app.models.user import User
from app.models.project import Project
from app.models.goal import Goal
from app.models.knowledge_asset import KnowledgeAsset
from app.models.node import Node
from app.models.edge import Edge
from app.schemas.goal import GoalTypeEnum
from app.schemas.knowledge_asset import KnowledgeAssetTypeEnum

# Constants
TENANT_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"  # The UUID of the Pharma AI Demo tenant
ADMIN_USER_ID = "00000000-0000-0000-0000-000000000001"  # Admin user ID

# Helper functions
def generate_uuid():
    return str(uuid.uuid4())

def random_date(start_date, end_date):
    time_between_dates = end_date - start_date
    days_between_dates = time_between_dates.days
    random_days = random.randrange(days_between_dates)
    return start_date + timedelta(days=random_days)

def random_future_date():
    start_date = datetime.now().date()
    end_date = start_date + timedelta(days=365)
    return random_date(start_date, end_date)

# Mock data generators
def generate_departments():
    """Generate pharma research departments"""
    departments = [
        {
            "id": generate_uuid(),
            "name": "Drug Discovery",
            "description": "Identifies and validates novel therapeutic targets and develops molecules against these targets."
        },
        {
            "id": generate_uuid(),
            "name": "Clinical Development",
            "description": "Plans and conducts clinical trials to test drug safety and efficacy."
        },
        {
            "id": generate_uuid(),
            "name": "Regulatory Affairs",
            "description": "Ensures compliance with regulatory requirements for drug approval and marketing."
        },
        {
            "id": generate_uuid(),
            "name": "Biostatistics",
            "description": "Applies statistical methods to analyze clinical trial data and support regulatory submissions."
        },
        {
            "id": generate_uuid(),
            "name": "Manufacturing",
            "description": "Responsible for the production and quality control of pharmaceutical products."
        },
        {
            "id": generate_uuid(),
            "name": "R&D Operations",
            "description": "Provides operational support for research and development activities."
        },
        {
            "id": generate_uuid(),
            "name": "Data Science",
            "description": "Applies data science and AI to accelerate drug discovery and development."
        },
        {
            "id": generate_uuid(),
            "name": "Medical Affairs",
            "description": "Communicates clinical data to healthcare professionals and manages post-approval studies."
        },
    ]
    return departments

def generate_teams(departments_map):
    """Generate research teams within departments"""
    teams = []
    
    # Drug Discovery teams
    drug_discovery_id = departments_map["Drug Discovery"]
    teams.extend([
        {
            "id": generate_uuid(),
            "name": "Target Identification",
            "description": "Identifies and validates novel therapeutic targets",
            "department_id": drug_discovery_id
        },
        {
            "id": generate_uuid(),
            "name": "Medicinal Chemistry",
            "description": "Designs and synthesizes novel drug compounds",
            "department_id": drug_discovery_id
        },
        {
            "id": generate_uuid(),
            "name": "ADME",
            "description": "Evaluates absorption, distribution, metabolism, and excretion properties of compounds",
            "department_id": drug_discovery_id
        }
    ])
    
    # Clinical Development teams
    clinical_dev_id = departments_map["Clinical Development"]
    teams.extend([
        {
            "id": generate_uuid(),
            "name": "Phase I Trials",
            "description": "Conducts early-stage clinical trials to test safety",
            "department_id": clinical_dev_id
        },
        {
            "id": generate_uuid(),
            "name": "Phase II Trials",
            "description": "Conducts mid-stage clinical trials to test efficacy",
            "department_id": clinical_dev_id
        },
        {
            "id": generate_uuid(),
            "name": "Phase III Trials",
            "description": "Conducts late-stage clinical trials to confirm efficacy and safety in large populations",
            "department_id": clinical_dev_id
        }
    ])
    
    # Regulatory Affairs teams
    regulatory_id = departments_map["Regulatory Affairs"]
    teams.extend([
        {
            "id": generate_uuid(),
            "name": "FDA Submissions",
            "description": "Prepares and manages regulatory submissions to the FDA",
            "department_id": regulatory_id
        },
        {
            "id": generate_uuid(),
            "name": "Global Regulatory Strategy",
            "description": "Develops global regulatory strategies for drug approval",
            "department_id": regulatory_id
        }
    ])
    
    # Biostatistics teams
    biostat_id = departments_map["Biostatistics"]
    teams.extend([
        {
            "id": generate_uuid(),
            "name": "Clinical Trial Statistics",
            "description": "Designs and analyzes clinical trial data",
            "department_id": biostat_id
        },
        {
            "id": generate_uuid(),
            "name": "Statistical Programming",
            "description": "Develops statistical programs and models for data analysis",
            "department_id": biostat_id
        }
    ])
    
    # Manufacturing teams
    manufacturing_id = departments_map["Manufacturing"]
    teams.extend([
        {
            "id": generate_uuid(),
            "name": "Process Development",
            "description": "Develops and scales up manufacturing processes",
            "department_id": manufacturing_id
        },
        {
            "id": generate_uuid(),
            "name": "Quality Control",
            "description": "Ensures product quality through testing",
            "department_id": manufacturing_id
        }
    ])
    
    # R&D Operations teams
    rd_ops_id = departments_map["R&D Operations"]
    teams.extend([
        {
            "id": generate_uuid(),
            "name": "Project Management",
            "description": "Manages drug development projects and timelines",
            "department_id": rd_ops_id
        },
        {
            "id": generate_uuid(),
            "name": "R&D Analytics",
            "description": "Analyzes R&D performance and provides insights",
            "department_id": rd_ops_id
        }
    ])
    
    # Data Science teams
    data_science_id = departments_map["Data Science"]
    teams.extend([
        {
            "id": generate_uuid(),
            "name": "Machine Learning",
            "description": "Develops ML models for drug discovery and development",
            "department_id": data_science_id
        },
        {
            "id": generate_uuid(),
            "name": "Bioinformatics",
            "description": "Applies computational methods to biological data",
            "department_id": data_science_id
        },
        {
            "id": generate_uuid(),
            "name": "Clinical Data Science",
            "description": "Analyzes clinical trial data using advanced analytics",
            "department_id": data_science_id
        }
    ])
    
    # Medical Affairs teams
    medical_affairs_id = departments_map["Medical Affairs"]
    teams.extend([
        {
            "id": generate_uuid(),
            "name": "Medical Communications",
            "description": "Develops and disseminates scientific and medical information",
            "department_id": medical_affairs_id
        },
        {
            "id": generate_uuid(),
            "name": "Medical Education",
            "description": "Educates healthcare professionals about new treatments",
            "department_id": medical_affairs_id
        }
    ])
    
    return teams

def generate_job_titles(department_name):
    """Generate job titles based on department name"""
    titles_by_dept = {
        "Drug Discovery": [
            "Research Scientist", "Senior Scientist", "Principal Scientist",
            "Lab Technician", "Research Associate", "Team Lead",
            "Director of Discovery Research", "Assay Development Specialist"
        ],
        "Clinical Development": [
            "Clinical Research Associate", "Clinical Trial Manager", "Medical Director",
            "Clinical Operations Specialist", "Patient Recruitment Coordinator",
            "Protocol Developer", "Clinical Data Manager"
        ],
        "Regulatory Affairs": [
            "Regulatory Affairs Specialist", "Regulatory Strategist",
            "Submission Manager", "Regulatory Writer", "Compliance Officer",
            "Global Regulatory Director"
        ],
        "Biostatistics": [
            "Biostatistician", "Statistical Programmer", "Data Scientist",
            "Clinical Data Analyst", "Statistical Consultant", "SAS Programmer"
        ],
        "Manufacturing": [
            "Process Engineer", "Quality Specialist", "Manufacturing Scientist",
            "Validation Engineer", "Production Manager", "Formulation Scientist"
        ],
        "R&D Operations": [
            "Project Manager", "Portfolio Analyst", "Resource Coordinator",
            "Operations Director", "Finance Analyst", "Strategic Planner"
        ],
        "Data Science": [
            "Data Scientist", "Machine Learning Engineer", "Bioinformatician",
            "Computational Biologist", "AI Research Scientist", "Data Engineer"
        ],
        "Medical Affairs": [
            "Medical Science Liaison", "Medical Communications Specialist",
            "Medical Education Manager", "Scientific Advisor", "Publication Manager"
        ]
    }
    
    return titles_by_dept.get(department_name, ["Scientist", "Researcher", "Analyst"])

def generate_users(teams_map, departments_map):
    """Generate users for each team"""
    users = []
    team_to_dept_map = {}
    
    # First, create a mapping from team to department
    for dept_name, dept_id in departments_map.items():
        for team in teams_map:
            if team["department_id"] == dept_id:
                team_to_dept_map[team["id"]] = dept_name
    
    # Now create users for each team
    user_count = 0
    for team in teams_map:
        team_id = team["id"]
        team_name = team["name"]
        dept_name = team_to_dept_map[team_id]
        job_titles = generate_job_titles(dept_name)
        
        # Create a team leader
        leader_id = generate_uuid()
        users.append({
            "id": leader_id,
            "tenant_id": TENANT_ID,
            "name": f"{team_name} Lead",
            "email": f"{team_name.lower().replace(' ', '.')}.lead@pharma-demo.ai",
            "title": "Team Lead",
            "team_id": team_id,
            "manager_id": None  # Team leads report to department heads (added later)
        })
        user_count += 1
        
        # Create team members (5-15 per team)
        member_count = random.randint(5, 15)
        for i in range(member_count):
            title = random.choice(job_titles)
            user_id = generate_uuid()
            users.append({
                "id": user_id,
                "tenant_id": TENANT_ID,
                "name": f"User {user_count + i}",
                "email": f"user{user_count + i}@pharma-demo.ai",
                "title": title,
                "team_id": team_id,
                "manager_id": leader_id  # Team members report to team lead
            })
        user_count += member_count
    
    print(f"Generated {user_count} users across {len(teams_map)} teams")
    return users

def generate_goals():
    """Generate strategic and tactical goals"""
    goals = []
    
    # Enterprise Goals (Strategic)
    enterprise_goals = [
        {
            "id": generate_uuid(),
            "title": "Accelerate Drug Discovery Pipeline",
            "description": "Improve efficiency of drug discovery process to bring promising candidates to clinic faster",
            "type": GoalTypeEnum.ENTERPRISE,
            "status": "on_track",
            "progress": 45,
            "due_date": random_future_date(),
            "tenant_id": TENANT_ID
        },
        {
            "id": generate_uuid(),
            "title": "Enhance Clinical Trial Success Rate",
            "description": "Implement strategies to increase the probability of success in clinical trials",
            "type": GoalTypeEnum.ENTERPRISE,
            "status": "on_track",
            "progress": 30,
            "due_date": random_future_date(),
            "tenant_id": TENANT_ID
        },
        {
            "id": generate_uuid(),
            "title": "Expand Therapeutic Areas",
            "description": "Strategically expand into new therapeutic areas through internal research and partnerships",
            "type": GoalTypeEnum.ENTERPRISE,
            "status": "at_risk",
            "progress": 20,
            "due_date": random_future_date(),
            "tenant_id": TENANT_ID
        }
    ]
    goals.extend(enterprise_goals)
    
    # Department Goals (linked to enterprise goals)
    department_goals = [
        # Drug Discovery department goals
        {
            "id": generate_uuid(),
            "title": "Implement AI-Driven Target Discovery",
            "description": "Leverage AI technologies to identify novel therapeutic targets",
            "type": GoalTypeEnum.DEPARTMENT,
            "status": "on_track",
            "progress": 65,
            "due_date": random_future_date(),
            "parent_id": enterprise_goals[0]["id"],
            "tenant_id": TENANT_ID
        },
        
        # Clinical Development department goals
        {
            "id": generate_uuid(),
            "title": "Optimize Patient Selection Criteria",
            "description": "Develop biomarker-based patient selection strategies to improve trial outcomes",
            "type": GoalTypeEnum.DEPARTMENT,
            "status": "on_track",
            "progress": 40,
            "due_date": random_future_date(),
            "parent_id": enterprise_goals[1]["id"],
            "tenant_id": TENANT_ID
        },
        
        # Data Science department goals
        {
            "id": generate_uuid(),
            "title": "Develop Digital Biomarkers Platform",
            "description": "Create a platform for developing and validating digital biomarkers",
            "type": GoalTypeEnum.DEPARTMENT,
            "status": "behind",
            "progress": 25,
            "due_date": random_future_date(),
            "parent_id": enterprise_goals[1]["id"],
            "tenant_id": TENANT_ID
        }
    ]
    goals.extend(department_goals)
    
    # Team Goals (linked to department goals)
    team_goals = [
        {
            "id": generate_uuid(),
            "title": "Deploy Deep Learning for Target Validation",
            "description": "Implement deep learning algorithms to prioritize and validate drug targets",
            "type": GoalTypeEnum.TEAM,
            "status": "on_track",
            "progress": 70,
            "due_date": random_future_date(),
            "parent_id": department_goals[0]["id"],
            "tenant_id": TENANT_ID
        },
        {
            "id": generate_uuid(),
            "title": "Establish Biomarker Database",
            "description": "Create a comprehensive database linking biomarkers to patient outcomes",
            "type": GoalTypeEnum.TEAM,
            "status": "behind",
            "progress": 35,
            "due_date": random_future_date(),
            "parent_id": department_goals[1]["id"],
            "tenant_id": TENANT_ID
        }
    ]
    goals.extend(team_goals)
    
    return goals

def generate_projects(teams_map, goals_map):
    """Generate research projects"""
    projects = []
    
    # Get team IDs as a list for random assignment
    team_ids = [team["id"] for team in teams_map]
    goal_ids = list(goals_map.values())
    
    # Research project names and descriptions
    project_templates = [
        # Discovery projects
        {
            "name": "Novel Target Identification for Oncology",
            "description": "Identifying and validating novel targets for cancer therapy using AI/ML approaches",
            "status": "active"
        },
        {
            "name": "Protein Degrader Platform Development",
            "description": "Developing a platform for targeted protein degradation therapies",
            "status": "active"
        },
        {
            "name": "Antibody-Drug Conjugate Research",
            "description": "Researching novel antibody-drug conjugate technologies for targeted therapy",
            "status": "active"
        },
        {
            "name": "RNA-Based Therapeutic Platform",
            "description": "Developing an RNA-based therapeutic platform for rare genetic diseases",
            "status": "active"
        },
        {
            "name": "Blood-Brain Barrier Penetration Technology",
            "description": "Developing technologies for enhanced drug delivery across the blood-brain barrier",
            "status": "on_hold"
        },
        
        # Clinical projects
        {
            "name": "Phase I Trial for Compound XR-24",
            "description": "First-in-human safety and PK/PD study for novel oncology compound",
            "status": "active"
        },
        {
            "name": "Phase II Trial for NP-789",
            "description": "Efficacy study of our lead neurodegenerative disease compound",
            "status": "active"
        },
        {
            "name": "Phase III Multinational Trial for CD-562",
            "description": "Pivotal trial for our breakthrough cardiovascular therapy",
            "status": "active"
        },
        
        # Platform/technology projects
        {
            "name": "Next-Gen Screening Platform",
            "description": "Development of high-throughput cell-based screening platform",
            "status": "active"
        },
        {
            "name": "Digital Biomarker Initiative",
            "description": "Creating digital biomarkers for neurological disease progression",
            "status": "active"
        },
        {
            "name": "AI-Powered Molecular Design",
            "description": "Using artificial intelligence to optimize molecule design",
            "status": "active"
        },
        {
            "name": "Clinical Trial Design Optimization",
            "description": "Implementing adaptive trial designs and simulation-based optimization",
            "status": "active"
        }
    ]
    
    # Generate 100 projects
    for i in range(100):
        # Select a template (repeat templates as needed)
        template_idx = i % len(project_templates)
        template = project_templates[template_idx]
        
        # Generate project with unique ID
        project_id = generate_uuid()
        team_id = random.choice(team_ids)
        goal_id = random.choice(goal_ids) if random.random() > 0.2 else None  # 80% have goals
        
        # Add sequence number for projects from the same template
        sequence_num = i // len(project_templates) + 1
        project_name = template["name"]
        if sequence_num > 1:
            project_name += f" ({sequence_num})"
        
        project = {
            "id": project_id,
            "tenant_id": TENANT_ID,
            "name": project_name,
            "description": template["description"],
            "status": template["status"],
            "owning_team_id": team_id,
            "goal_id": goal_id
        }
        
        projects.append(project)
    
    return projects

def generate_knowledge_assets(user_ids, project_ids):
    """Generate knowledge assets including documents, notes, etc."""
    knowledge_assets = []
    
    # Asset type distribution
    asset_types = [
        (KnowledgeAssetTypeEnum.NOTE, 0.3),          # 30% are notes
        (KnowledgeAssetTypeEnum.DOCUMENT, 0.3),      # 30% are documents
        (KnowledgeAssetTypeEnum.REPORT, 0.15),       # 15% are reports
        (KnowledgeAssetTypeEnum.MEETING, 0.1),       # 10% are meeting notes
        (KnowledgeAssetTypeEnum.PRESENTATION, 0.1),  # 10% are presentations
        (KnowledgeAssetTypeEnum.SUBMISSION, 0.05)    # 5% are submissions
    ]
    
    # Content templates by type
    content_templates = {
        KnowledgeAssetTypeEnum.NOTE: [
            "Key observations from the experiment include {result}. Follow-up studies should focus on {focus}.",
            "Team discussion on {topic} revealed important considerations for {consideration}.",
            "Initial data analysis shows {finding}. Need to investigate {investigation} further.",
            "Literature review findings: {literature_finding} may impact our approach to {approach}."
        ],
        KnowledgeAssetTypeEnum.DOCUMENT: [
            "Protocol for {experiment_type} experiment to evaluate {evaluation}.",
            "Standard operating procedure for {procedure} in {context}.",
            "Regulatory documentation for {regulatory_aspect} of {project_aspect}.",
            "Technical specification for {technical_component} used in {usage_context}."
        ],
        KnowledgeAssetTypeEnum.REPORT: [
            "Quarterly progress report on {project_aspect} showing {progress_summary}.",
            "Analytical report of {analysis_subject} with key findings on {findings}.",
            "Safety monitoring report indicating {safety_status} for {trial_phase}.",
            "Data quality assessment report for {data_source} with recommendations for {recommendations}."
        ],
        KnowledgeAssetTypeEnum.MEETING: [
            "Project team meeting discussed {discussion_points} and decided on {decisions}.",
            "Cross-functional alignment meeting on {alignment_topic} with action items for {action_owner}.",
            "Expert advisory board provided insights on {insights_topic} and recommended {recommendations}.",
            "Regulatory strategy meeting outlined approach for {regulatory_approach} based on {regulatory_considerations}."
        ],
        KnowledgeAssetTypeEnum.PRESENTATION: [
            "Research update presentation on {research_topic} highlighting {highlights}.",
            "Executive summary of {project_name} status, challenges, and next steps.",
            "Pipeline review presentation focusing on {pipeline_aspect} and strategy for {strategy_focus}.",
            "Technology platform overview demonstrating capabilities for {capabilities}."
        ],
        KnowledgeAssetTypeEnum.SUBMISSION: [
            "Regulatory submission package for {submission_type} including {submission_components}.",
            "Grant proposal for {research_area} with emphasis on {emphasis_area}.",
            "Patent application for {invention_description} with claims covering {claims_scope}.",
            "Clinical trial authorization application for {trial_description}."
        ]
    }
    
    # Fill-in variables for templates
    variable_options = {
        "result": ["positive efficacy signals", "improved target engagement", "reduced off-target effects", 
                   "enhanced bioavailability", "unexpected metabolite profile", "promising safety data"],
        "focus": ["dose optimization", "mechanism of action", "biomarker development", 
                  "combination strategies", "patient stratification", "formulation improvements"],
        "topic": ["target validation", "clinical strategy", "biomarker selection", 
                  "manufacturing scale-up", "regulatory approach", "patient recruitment"],
        "consideration": ["timing of next milestone", "resource allocation", "risk mitigation", 
                          "competitive landscape", "partnership opportunities", "go/no-go decision criteria"],
        "finding": ["dose-dependent response", "unexpected pathway activation", "novel biomarker correlation", 
                    "potential predictive signature", "pharmacokinetic variability", "drug-drug interaction potential"],
        "investigation": ["subpopulation effects", "alternative dosing regimens", "mechanism of resistance", 
                          "long-term safety", "combination effects", "biomarker validation"],
        "literature_finding": ["recently published clinical data", "new target biology insights", "competitive molecule profiles", 
                              "emerging safety concerns", "novel biomarker approaches", "regulatory precedents"],
        "approach": ["patient selection", "endpoint definition", "dosing strategy", 
                     "combination rationale", "development timeline", "regulatory strategy"],
        "experiment_type": ["in vitro binding", "cellular potency", "in vivo efficacy", "toxicology", 
                           "bioanalytical method validation", "biomarker analysis"],
        "evaluation": ["target engagement", "dose-response relationship", "safety margin", 
                       "biomarker modulation", "combination effects", "mechanism of action"],
        "procedure": ["sample preparation", "analytical testing", "data management", 
                      "equipment qualification", "stability testing", "release testing"],
        "context": ["GLP studies", "GMP manufacturing", "clinical sample analysis", 
                    "regulatory submissions", "technology transfer", "method validation"],
        "regulatory_aspect": ["CMC documentation", "nonclinical data package", "clinical protocol", 
                             "pediatric investigation plan", "orphan drug designation", "breakthrough therapy designation"],
        "project_aspect": ["manufacturing process", "analytical methods", "clinical program", 
                          "nonclinical studies", "regulatory strategy", "formulation development"],
        "technical_component": ["bioanalytical method", "drug product formulation", "clinical database", 
                               "manufacturing process", "companion diagnostic", "drug delivery system"],
        "usage_context": ["Phase 1 studies", "pivotal trials", "stability testing", 
                         "commercial manufacturing", "technology transfer", "regulatory submissions"],
        "progress_summary": ["accelerated timeline", "on-track milestones", "resource constraints", 
                            "technical challenges", "positive preliminary data", "strategy adjustments"],
        "analysis_subject": ["PK/PD relationship", "biomarker data", "clinical outcomes", 
                            "manufacturing process parameters", "stability trends", "safety signals"],
        "findings": ["exposure-response correlation", "predictive biomarkers", "patient subpopulations", 
                     "process optimization opportunities", "root causes of variability", "risk factors"],
        "safety_status": ["no significant safety concerns", "emerging safety signal", "expected adverse event profile", 
                          "favorable benefit-risk assessment", "monitoring recommendations", "risk mitigation strategies"],
        "trial_phase": ["Phase 1 dose escalation", "Phase 2 proof-of-concept", "pivotal Phase 3", 
                       "long-term extension study", "special population study", "post-marketing surveillance"],
        "data_source": ["clinical database", "manufacturing records", "stability data", 
                        "bioanalytical results", "safety database", "patient registries"],
        "recommendations": ["additional quality controls", "process adjustments", "monitoring parameters", 
                           "analysis methodology", "data integration approach", "reporting frequency"],
        "discussion_points": ["clinical development strategy", "manufacturing readiness", "regulatory feedback", 
                             "resource allocation", "timeline adjustments", "risk assessment"],
        "decisions": ["adjusting project timeline", "modifying clinical endpoints", "adding patient cohorts", 
                      "implementing risk mitigation", "pursuing alternative strategy", "allocating additional resources"],
        "alignment_topic": ["development milestones", "regulatory strategy", "resource prioritization", 
                           "technical approach", "data interpretation", "submission planning"],
        "action_owner": ["clinical team", "regulatory affairs", "biostatistics", "manufacturing", 
                         "project management", "quality assurance"],
        "insights_topic": ["patient selection strategy", "endpoint selection", "dosing approach", 
                          "combination rationale", "biomarker strategy", "regulatory positioning"],
        "recommendations": ["focusing on specific biomarkers", "adjusting inclusion criteria", "considering alternative endpoints", 
                           "exploring additional indications", "addressing specific safety concerns", "enhancing monitoring strategy"],
        "regulatory_approach": ["accelerated approval pathway", "breakthrough designation", "special protocol assessment", 
                               "pediatric investigation plan", "orphan drug designation", "priority review"],
        "regulatory_considerations": ["recent precedents", "agency guidance", "advisory committee feedback", 
                                     "international harmonization", "post-approval commitments", "labeling strategy"],
        "research_topic": ["mechanism of action studies", "biomarker validation", "patient stratification", 
                          "resistance mechanisms", "combination rationale", "translational findings"],
        "highlights": ["positive efficacy signals", "target engagement confirmation", "promising safety profile", 
                       "biomarker correlations", "differentiation from competitors", "potential expanded indications"],
        "project_name": ["XR-24 Development", "NP-789 Clinical Program", "CD-562 Registration Strategy", 
                        "Next-Gen Platform Implementation", "AI-Driven Discovery", "Digital Biomarker Initiative"],
        "pipeline_aspect": ["early-stage projects", "late-stage development", "life cycle management", 
                           "external collaborations", "technology platforms", "indication expansion"],
        "strategy_focus": ["accelerating development", "risk mitigation", "portfolio prioritization", 
                          "maximizing commercial potential", "leveraging partnerships", "resource optimization"],
        "capabilities": ["target identification", "lead optimization", "translational research", 
                        "predictive analytics", "patient stratification", "real-world evidence generation"],
        "submission_type": ["IND application", "NDA", "clinical trial application", "marketing authorization", 
                           "orphan designation", "breakthrough therapy designation"],
        "submission_components": ["CMC documentation", "nonclinical study reports", "clinical study reports", 
                                 "integrated summaries", "risk management plan", "pediatric investigation plan"],
        "research_area": ["novel target validation", "biomarker development", "drug delivery technology", 
                         "AI-driven drug design", "patient stratification methods", "combination therapy approaches"],
        "emphasis_area": ["precision medicine applications", "unmet medical need", "innovative technology", 
                         "translation potential", "clinical impact", "commercial opportunity"],
        "invention_description": ["novel molecular scaffold", "drug delivery system", "biomarker detection method", 
                                "manufacturing process", "combination therapy approach", "diagnostic algorithm"],
        "claims_scope": ["composition of matter", "methods of use", "formulation", "process", "diagnostic applications", "combination treatments"],
        "trial_description": ["first-in-human study", "proof-of-concept trial", "pivotal Phase 3 study", 
                             "special population investigation", "real-world evidence generation", "post-marketing study"]
    }
    
    # Generate a weighted distribution of asset types
    asset_type_distribution = []
    for asset_type, weight in asset_types:
        count = int(500 * weight)  # Total of 500 assets
        asset_type_distribution.extend([asset_type] * count)
    
    # Fill in any remaining spots to reach 500
    while len(asset_type_distribution) < 500:
        asset_type_distribution.append(KnowledgeAssetTypeEnum.NOTE)
    
    # Shuffle to randomize
    random.shuffle(asset_type_distribution)
    
    # Generate 500 knowledge assets
    for i in range(500):
        asset_type = asset_type_distribution[i]
        user_id = random.choice(user_ids)
        project_id = random.choice(project_ids)
        
        # Select a random template for this asset type
        template = random.choice(content_templates[asset_type])
        
        # Fill in the template with random variables
        content = template
        for var_name, options in variable_options.items():
            if "{" + var_name + "}" in content:
                content = content.replace("{" + var_name + "}", random.choice(options))
        
        # Create title based on content
        title = content.split(".")[0][:50] + "..." if len(content.split(".")[0]) > 50 else content.split(".")[0]
        
        # Create the knowledge asset
        asset = {
            "id": generate_uuid(),
            "tenant_id": TENANT_ID,
            "title": title,
            "type": asset_type,
            "source": "Biosphere Alpha",
            "content": content,
            "project_id": project_id,
            "created_by_user_id": user_id
        }
        
        knowledge_assets.append(asset)
    
    return knowledge_assets

def generate_nodes_and_edges(departments, teams, users, projects, goals):
    """Generate graph nodes and edges based on the entities"""
    nodes = []
    edges = []
    
    # Create a node for each department
    for dept in departments:
        node_id = generate_uuid()
        nodes.append({
            "id": node_id,
            "tenant_id": TENANT_ID,
            "type": "department",
            "props": {
                "name": dept["name"],
                "description": dept["description"],
                "entity_id": dept["id"]
            },
            "x": random.uniform(-100, 100),
            "y": random.uniform(-100, 100)
        })
    
    # Create a node for each team
    for team in teams:
        node_id = generate_uuid()
        nodes.append({
            "id": node_id,
            "tenant_id": TENANT_ID,
            "type": "team",
            "props": {
                "name": team["name"],
                "description": team["description"],
                "entity_id": team["id"]
            },
            "x": random.uniform(-80, 80),
            "y": random.uniform(-80, 80)
        })
    
    # Create a node for each user
    for user in users:
        node_id = generate_uuid()
        nodes.append({
            "id": node_id,
            "tenant_id": TENANT_ID,
            "type": "user",
            "props": {
                "name": user["name"],
                "email": user["email"],
                "title": user["title"],
                "entity_id": user["id"]
            },
            "x": random.uniform(-60, 60),
            "y": random.uniform(-60, 60)
        })
    
    # Create a node for each project
    for project in projects:
        node_id = generate_uuid()
        nodes.append({
            "id": node_id,
            "tenant_id": TENANT_ID,
            "type": "project",
            "props": {
                "name": project["name"],
                "description": project["description"],
                "status": project["status"],
                "entity_id": project["id"]
            },
            "x": random.uniform(-40, 40),
            "y": random.uniform(-40, 40)
        })
    
    # Create a node for each goal
    for goal in goals:
        node_id = generate_uuid()
        nodes.append({
            "id": node_id,
            "tenant_id": TENANT_ID,
            "type": "goal",
            "props": {
                "title": goal["title"],
                "description": goal["description"],
                "type": goal["type"].value,
                "status": goal["status"],
                "entity_id": goal["id"]
            },
            "x": random.uniform(-20, 20),
            "y": random.uniform(-20, 20)
        })
    
    # Create edges between nodes
    
    # Department to team edges
    for team in teams:
        if "department_id" in team and team["department_id"]:
            # Find the nodes for this team and department
            team_node = next((n for n in nodes if n["type"] == "team" and n["props"]["entity_id"] == team["id"]), None)
            dept_node = next((n for n in nodes if n["type"] == "department" and n["props"]["entity_id"] == team["department_id"]), None)
            
            if team_node and dept_node:
                edge_id = generate_uuid()
                edges.append({
                    "id": edge_id,
                    "tenant_id": TENANT_ID,
                    "src": dept_node["id"],
                    "dst": team_node["id"],
                    "label": "HAS_TEAM",
                    "props": {}
                })
    
    # User to team edges
    for user in users:
        if "team_id" in user and user["team_id"]:
            # Find the nodes for this user and team
            user_node = next((n for n in nodes if n["type"] == "user" and n["props"]["entity_id"] == user["id"]), None)
            team_node = next((n for n in nodes if n["type"] == "team" and n["props"]["entity_id"] == user["team_id"]), None)
            
            if user_node and team_node:
                edge_id = generate_uuid()
                edges.append({
                    "id": edge_id,
                    "tenant_id": TENANT_ID,
                    "src": team_node["id"],
                    "dst": user_node["id"],
                    "label": "HAS_MEMBER",
                    "props": {}
                })
    
    # Manager to direct report edges
    for user in users:
        if "manager_id" in user and user["manager_id"]:
            # Find the nodes for this user and manager
            user_node = next((n for n in nodes if n["type"] == "user" and n["props"]["entity_id"] == user["id"]), None)
            manager_node = next((n for n in nodes if n["type"] == "user" and n["props"]["entity_id"] == user["manager_id"]), None)
            
            if user_node and manager_node:
                edge_id = generate_uuid()
                edges.append({
                    "id": edge_id,
                    "tenant_id": TENANT_ID,
                    "src": manager_node["id"],
                    "dst": user_node["id"],
                    "label": "MANAGES",
                    "props": {}
                })
    
    # Project to team edges
    for project in projects:
        if "owning_team_id" in project and project["owning_team_id"]:
            # Find the nodes for this project and team
            project_node = next((n for n in nodes if n["type"] == "project" and n["props"]["entity_id"] == project["id"]), None)
            team_node = next((n for n in nodes if n["type"] == "team" and n["props"]["entity_id"] == project["owning_team_id"]), None)
            
            if project_node and team_node:
                edge_id = generate_uuid()
                edges.append({
                    "id": edge_id,
                    "tenant_id": TENANT_ID,
                    "src": team_node["id"],
                    "dst": project_node["id"],
                    "label": "OWNS_PROJECT",
                    "props": {}
                })
    
    # Project to goal edges
    for project in projects:
        if "goal_id" in project and project["goal_id"]:
            # Find the nodes for this project and goal
            project_node = next((n for n in nodes if n["type"] == "project" and n["props"]["entity_id"] == project["id"]), None)
            goal_node = next((n for n in nodes if n["type"] == "goal" and n["props"]["entity_id"] == project["goal_id"]), None)
            
            if project_node and goal_node:
                edge_id = generate_uuid()
                edges.append({
                    "id": edge_id,
                    "tenant_id": TENANT_ID,
                    "src": project_node["id"],
                    "dst": goal_node["id"],
                    "label": "ALIGNS_WITH",
                    "props": {}
                })
    
    # Goal hierarchy edges
    for goal in goals:
        if "parent_id" in goal and goal["parent_id"]:
            # Find the nodes for this goal and its parent
            goal_node = next((n for n in nodes if n["type"] == "goal" and n["props"]["entity_id"] == goal["id"]), None)
            parent_node = next((n for n in nodes if n["type"] == "goal" and n["props"]["entity_id"] == goal["parent_id"]), None)
            
            if goal_node and parent_node:
                edge_id = generate_uuid()
                edges.append({
                    "id": edge_id,
                    "tenant_id": TENANT_ID,
                    "src": parent_node["id"],
                    "dst": goal_node["id"],
                    "label": "HAS_SUBGOAL",
                    "props": {}
                })
    
    # Add some additional edges between users for collaboration
    # (randomly connect some users who are not in the same team)
    team_members = {}
    for user in users:
        team_id = user.get("team_id")
        if team_id:
            if team_id not in team_members:
                team_members[team_id] = []
            team_members[team_id].append(user["id"])
    
    # Create some cross-team collaborations
    collaboration_count = int(len(users) * 0.2)  # 20% of users get cross-team collaborations
    for _ in range(collaboration_count):
        # Pick two random teams
        if len(team_members.keys()) < 2:
            continue
        
        team1_id, team2_id = random.sample(list(team_members.keys()), 2)
        
        # Pick random users from each team
        if not team_members[team1_id] or not team_members[team2_id]:
            continue
            
        user1_id = random.choice(team_members[team1_id])
        user2_id = random.choice(team_members[team2_id])
        
        # Find the nodes for these users
        user1_node = next((n for n in nodes if n["type"] == "user" and n["props"]["entity_id"] == user1_id), None)
        user2_node = next((n for n in nodes if n["type"] == "user" and n["props"]["entity_id"] == user2_id), None)
        
        if user1_node and user2_node:
            edge_id = generate_uuid()
            edges.append({
                "id": edge_id,
                "tenant_id": TENANT_ID,
                "src": user1_node["id"],
                "dst": user2_node["id"],
                "label": "COLLABORATES_WITH",
                "props": {}
            })
    
    return nodes, edges

def main():
    """Main function to seed the database with pharma data"""
    try:
        # Get database engine
        database_url = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@db/biosphere_alpha")
        engine = create_engine(database_url)
        
        # Create database session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            print("Starting to seed pharma tenant data...")
            
            # Check if the tenant exists
            tenant = db.query(Tenant).filter(Tenant.id == TENANT_ID).first()
            if not tenant:
                tenant = Tenant(
                    id=TENANT_ID,
                    name="Pharma AI Demo",
                    domain="pharmademo.biosphere.ai",
                    is_active=True
                )
                db.add(tenant)
                db.commit()
                print(f"Created tenant: {tenant.name}")
            else:
                print(f"Using existing tenant: {tenant.name}")
            
            # Clear existing data for this tenant
            print("Clearing existing tenant data...")
            db.execute(text(f"DELETE FROM edges WHERE tenant_id = '{TENANT_ID}'"))
            db.execute(text(f"DELETE FROM nodes WHERE tenant_id = '{TENANT_ID}'"))
            db.execute(text(f"DELETE FROM knowledge_assets WHERE tenant_id = '{TENANT_ID}'"))
            db.execute(text(f"DELETE FROM project_participants WHERE project_id IN (SELECT id FROM projects WHERE tenant_id = '{TENANT_ID}')"))
            db.execute(text(f"DELETE FROM projects WHERE tenant_id = '{TENANT_ID}'"))
            db.execute(text(f"DELETE FROM goals WHERE tenant_id = '{TENANT_ID}'"))
            db.execute(text(f"DELETE FROM users WHERE tenant_id = '{TENANT_ID}' AND id != '{ADMIN_USER_ID}'"))
            db.execute(text(f"DELETE FROM teams WHERE tenant_id = '{TENANT_ID}'"))
            db.execute(text(f"DELETE FROM departments WHERE tenant_id = '{TENANT_ID}'"))
            db.commit()
            
            # Generate and insert departments
            print("Generating departments...")
            departments = generate_departments()
            for dept in departments:
                db.add(Department(
                    id=dept["id"],
                    tenant_id=TENANT_ID,
                    name=dept["name"],
                    description=dept["description"]
                ))
            db.commit()
            
            # Create department name to id mapping for reference
            departments_map = {dept["name"]: dept["id"] for dept in departments}
            print(f"Created {len(departments)} departments")
            
            # Generate and insert teams
            print("Generating teams...")
            teams = generate_teams(departments_map)
            for team in teams:
                db.add(Team(
                    id=team["id"],
                    tenant_id=TENANT_ID,
                    name=team["name"],
                    description=team["description"]
                ))
            db.commit()
            print(f"Created {len(teams)} teams")
            
            # Generate and insert users
            print("Generating users...")
            users = generate_users(teams, departments_map)
            for user in users:
                db.add(User(
                    id=user["id"],
                    tenant_id=user["tenant_id"],
                    name=user["name"],
                    email=user["email"],
                    title=user["title"],
                    team_id=user["team_id"],
                    manager_id=user["manager_id"]
                ))
            db.commit()
            print(f"Created {len(users)} users")
            
            # Generate and insert goals
            print("Generating goals...")
            goals = generate_goals()
            for goal in goals:
                db.add(Goal(
                    id=goal["id"],
                    tenant_id=goal["tenant_id"],
                    title=goal["title"],
                    description=goal["description"],
                    type=goal["type"],
                    status=goal["status"],
                    progress=goal["progress"],
                    due_date=goal["due_date"],
                    parent_id=goal.get("parent_id")
                ))
            db.commit()
            print(f"Created {len(goals)} goals")
            
            # Create goal name to id mapping for reference
            goals_map = {goal["title"]: goal["id"] for goal in goals}
            
            # Generate and insert projects
            print("Generating projects...")
            projects = generate_projects(teams, goals_map)
            for project in projects:
                db.add(Project(
                    id=project["id"],
                    tenant_id=project["tenant_id"],
                    name=project["name"],
                    description=project["description"],
                    status=project["status"],
                    owning_team_id=project["owning_team_id"],
                    goal_id=project["goal_id"]
                ))
            db.commit()
            print(f"Created {len(projects)} projects")
            
            # Generate and insert knowledge assets
            print("Generating knowledge assets...")
            user_ids = [user["id"] for user in users]
            project_ids = [project["id"] for project in projects]
            knowledge_assets = generate_knowledge_assets(user_ids, project_ids)
            
            # Batch insert knowledge assets to avoid memory issues
            batch_size = 50
            for i in range(0, len(knowledge_assets), batch_size):
                batch = knowledge_assets[i:i+batch_size]
                for asset in batch:
                    db.add(KnowledgeAsset(
                        id=asset["id"],
                        tenant_id=asset["tenant_id"],
                        title=asset["title"],
                        type=asset["type"],
                        source=asset["source"],
                        content=asset["content"],
                        project_id=asset["project_id"],
                        created_by_user_id=asset["created_by_user_id"]
                    ))
                db.commit()
                print(f"Created knowledge assets batch {i//batch_size + 1}/{(len(knowledge_assets)+batch_size-1)//batch_size}")
            
            print(f"Created {len(knowledge_assets)} knowledge assets")
            
            # Generate and insert nodes and edges for the graph
            print("Generating graph nodes and edges...")
            nodes, edges = generate_nodes_and_edges(departments, teams, users, projects, goals)
            
            # Batch insert nodes
            batch_size = 50
            for i in range(0, len(nodes), batch_size):
                batch = nodes[i:i+batch_size]
                for node in batch:
                    db.add(Node(
                        id=node["id"],
                        tenant_id=node["tenant_id"],
                        type=node["type"],
                        props=node["props"],
                        x=node["x"],
                        y=node["y"]
                    ))
                db.commit()
                print(f"Created nodes batch {i//batch_size + 1}/{(len(nodes)+batch_size-1)//batch_size}")
            
            print(f"Created {len(nodes)} nodes")
            
            # Batch insert edges
            batch_size = 50
            for i in range(0, len(edges), batch_size):
                batch = edges[i:i+batch_size]
                for edge in batch:
                    db.add(Edge(
                        id=edge["id"],
                        tenant_id=edge["tenant_id"],
                        src=edge["src"],
                        dst=edge["dst"],
                        label=edge["label"],
                        props=edge["props"]
                    ))
                db.commit()
                print(f"Created edges batch {i//batch_size + 1}/{(len(edges)+batch_size-1)//batch_size}")
            
            print(f"Created {len(edges)} edges")
            
            print("Data seeding completed successfully!")
            
        finally:
            db.close()
    
    except Exception as e:
        print(f"Error seeding database: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()