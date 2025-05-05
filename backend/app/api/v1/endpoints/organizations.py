from typing import Dict, List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.core.security import get_current_user
from app.db.session import get_db_session

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/structure", response_model=Dict[str, Any])
async def get_organization_structure(
    db: AsyncSession = Depends(get_db_session),
    current_user: Any = Depends(get_current_user),
):
    """
    Get the complete organizational structure for the current user's tenant.
    
    Returns a hierarchical view of the organization with departments, teams, and users,
    along with path information for navigation.
    """
    logger.info(f"Generating organization structure for user {current_user.name} in tenant {current_user.tenant_id}")
    
    # Get tenant name to customize the organization
    tenant_name = getattr(current_user, 'tenant_name', None)
    if not tenant_name and hasattr(current_user, 'tenant'):
        tenant_name = getattr(current_user.tenant, 'name', None)
    
    # Set organization name based on tenant if available
    org_name = tenant_name if tenant_name else "Biosphere Corporation"
    
    # Get IDs from current user for hierarchy
    user_id = str(current_user.id)
    team_id = str(current_user.team_id) if current_user.team_id else None
    
    # Set up industry-specific data based on tenant name
    is_pharma = "pharma" in org_name.lower() if org_name else False
    is_tech = "tech" in org_name.lower() or "innovation" in org_name.lower() if org_name else False
    is_healthcare = "health" in org_name.lower() or "medical" in org_name.lower() if org_name else False
    is_financial = "financial" in org_name.lower() or "bank" in org_name.lower() if org_name else False
    is_manufacturing = "manufacturing" in org_name.lower() if org_name else False
    is_education = "university" in org_name.lower() or "education" in org_name.lower() if org_name else False
    
    # Default to tech if no industry detected
    if not any([is_pharma, is_tech, is_healthcare, is_financial, is_manufacturing, is_education]):
        is_tech = True
    
    # Start building hierarchy
    path = []
    units = {}
    
    # Add organization level
    organization_id = "org-1"
    path.append(organization_id)
    
    # Select industry-specific organization details
    if is_pharma:
        units[organization_id] = {
            "id": organization_id,
            "type": "organization",
            "name": org_name or "Pharma AI Research",
            "description": "Pharmaceutical research and innovation leader",
            "level": 0,
            "path": [organization_id]
        }
    elif is_healthcare:
        units[organization_id] = {
            "id": organization_id,
            "type": "organization",
            "name": org_name or "Metropolitan Health System",
            "description": "Integrated healthcare services provider",
            "level": 0,
            "path": [organization_id]
        }
    elif is_financial:
        units[organization_id] = {
            "id": organization_id,
            "type": "organization",
            "name": org_name or "Global Financial Group",
            "description": "Global financial services organization",
            "level": 0,
            "path": [organization_id]
        }
    elif is_manufacturing:
        units[organization_id] = {
            "id": organization_id,
            "type": "organization",
            "name": org_name or "Advanced Manufacturing Corp",
            "description": "Innovative manufacturing solutions",
            "level": 0,
            "path": [organization_id]
        }
    elif is_education:
        units[organization_id] = {
            "id": organization_id,
            "type": "organization",
            "name": org_name or "University Research Alliance",
            "description": "Higher education and research institution",
            "level": 0,
            "path": [organization_id]
        }
    else:
        # Default to tech
        units[organization_id] = {
            "id": organization_id,
            "type": "organization",
            "name": org_name or "Tech Innovations Inc.",
            "description": "Global technology and innovation leader",
            "level": 0,
            "path": [organization_id]
        }
    
    # Add divisions (customize based on industry)
    if is_pharma:
        # Pharma divisions
        divisions = [
            {"id": "div-1", "name": "Research & Development", "description": "Pharmaceutical research and drug discovery"},
            {"id": "div-2", "name": "Clinical Operations", "description": "Clinical trials and regulatory affairs"},
            {"id": "div-3", "name": "Commercial", "description": "Sales, marketing, and commercial operations"},
            {"id": "div-4", "name": "Manufacturing", "description": "Pharmaceutical manufacturing and supply chain"}
        ]
    elif is_healthcare:
        # Healthcare divisions
        divisions = [
            {"id": "div-1", "name": "Clinical Services", "description": "Patient care and medical services"},
            {"id": "div-2", "name": "Operations", "description": "Hospital operations and facilities management"},
            {"id": "div-3", "name": "Medical Research", "description": "Clinical research and innovation"},
            {"id": "div-4", "name": "Administration", "description": "Healthcare administration and finance"}
        ]
    elif is_financial:
        # Financial services divisions
        divisions = [
            {"id": "div-1", "name": "Investment Banking", "description": "Corporate finance and advisory services"},
            {"id": "div-2", "name": "Asset Management", "description": "Investment management and advisory"},
            {"id": "div-3", "name": "Retail Banking", "description": "Consumer banking services"},
            {"id": "div-4", "name": "Technology", "description": "Financial technology and operations"}
        ]
    elif is_manufacturing:
        # Manufacturing divisions
        divisions = [
            {"id": "div-1", "name": "Production", "description": "Manufacturing operations"},
            {"id": "div-2", "name": "Engineering", "description": "Product design and engineering"},
            {"id": "div-3", "name": "Supply Chain", "description": "Procurement and logistics"},
            {"id": "div-4", "name": "Quality & Compliance", "description": "Quality assurance and regulatory compliance"}
        ]
    elif is_education:
        # Education divisions
        divisions = [
            {"id": "div-1", "name": "Academic Affairs", "description": "Teaching and academic programs"},
            {"id": "div-2", "name": "Research", "description": "Research programs and grants"},
            {"id": "div-3", "name": "Student Services", "description": "Student support and administration"},
            {"id": "div-4", "name": "Administration", "description": "University operations and management"}
        ]
    else:
        # Default Tech divisions
        divisions = [
            {"id": "div-1", "name": "Engineering", "description": "Software engineering and product development"},
            {"id": "div-2", "name": "Operations", "description": "Business operations and infrastructure"},
            {"id": "div-3", "name": "Product", "description": "Product management and design"},
            {"id": "div-4", "name": "Sales & Marketing", "description": "Client acquisition and growth"}
        ]
    
    # Add all divisions to the hierarchy
    primary_division_id = "div-1"  # Default to first division
    for division in divisions:
        div_id = division["id"]
        
        # First division is part of the user's path
        if div_id == primary_division_id:
            path.append(div_id)
        
        # Add division to units
        units[div_id] = {
            "id": div_id,
            "type": "division", 
            "name": division["name"],
            "description": division["description"],
            "parentId": organization_id,
            "level": 1,
            "path": [organization_id, div_id]
        }
    
    # Add departments for each division
    departments = {}
    
    # Engineering/R&D division departments
    departments["div-1"] = [
        {"id": "dept-1", "name": "AI Department", "description": "Artificial intelligence research and development"},
        {"id": "dept-2", "name": "Data Science", "description": "Advanced data analytics and machine learning"},
        {"id": "dept-3", "name": "Platform Engineering", "description": "Core platform development"},
    ]
    
    # Operations division departments
    departments["div-2"] = [
        {"id": "dept-4", "name": "IT Operations", "description": "IT infrastructure and support"},
        {"id": "dept-5", "name": "Finance", "description": "Financial operations and planning"},
        {"id": "dept-6", "name": "Human Resources", "description": "HR operations and talent development"},
    ]
    
    # Product/Commercial division departments
    departments["div-3"] = [
        {"id": "dept-7", "name": "Product Management", "description": "Product strategy and roadmap"},
        {"id": "dept-8", "name": "User Experience", "description": "UX design and research"},
        {"id": "dept-9", "name": "Customer Success", "description": "Customer support and services"},
    ]
    
    # Sales/Manufacturing division departments
    departments["div-4"] = [
        {"id": "dept-10", "name": "Marketing", "description": "Brand and marketing initiatives"},
        {"id": "dept-11", "name": "Sales", "description": "Sales and business development"},
        {"id": "dept-12", "name": "Supply Chain", "description": "Supply chain management"},
    ]
    
    # Primary department for the user's path
    department_id = "dept-1"
    path.append(department_id)
    
    # Add all departments to the hierarchy
    for div_id, dept_list in departments.items():
        for dept in dept_list:
            dept_id = dept["id"]
            
            # Add department to units
            units[dept_id] = {
                "id": dept_id,
                "type": "department",
                "name": dept["name"],
                "description": dept["description"],
                "parentId": div_id,
                "level": 2,
                "path": [organization_id, div_id, dept_id]
            }
    
    # Add teams for each department
    teams = {}
    
    # Teams for AI Department
    teams["dept-1"] = [
        {"id": "team-1", "name": "Knowledge Engine Team", "description": "Building next-generation knowledge management solutions"},
        {"id": "team-2", "name": "NLP Research", "description": "Natural language processing research team"},
        {"id": "team-3", "name": "Computer Vision", "description": "Computer vision and image processing team"},
    ]
    
    # Teams for Data Science
    teams["dept-2"] = [
        {"id": "team-4", "name": "Data Platform", "description": "Enterprise data platform development"},
        {"id": "team-5", "name": "ML Ops", "description": "Machine learning operations and infrastructure"},
        {"id": "team-6", "name": "Analytics", "description": "Business analytics and insights"},
    ]
    
    # Teams for Platform Engineering
    teams["dept-3"] = [
        {"id": "team-7", "name": "Backend Services", "description": "Core backend services development"},
        {"id": "team-8", "name": "Frontend", "description": "User interface development"},
        {"id": "team-9", "name": "DevOps", "description": "Development operations and infrastructure"},
    ]
    
    # Add selected teams to other departments
    teams["dept-4"] = [
        {"id": "team-10", "name": "System Administration", "description": "IT systems management"},
        {"id": "team-11", "name": "Network Operations", "description": "Network infrastructure management"},
    ]
    
    teams["dept-7"] = [
        {"id": "team-12", "name": "Product Strategy", "description": "Product vision and strategy"},
        {"id": "team-13", "name": "Product Operations", "description": "Product delivery and operations"},
    ]
    
    teams["dept-8"] = [
        {"id": "team-14", "name": "Design Systems", "description": "Design system development"},
        {"id": "team-15", "name": "User Research", "description": "User testing and research"},
    ]
    
    # Use team_id if available, otherwise default to team-1
    user_team_id = team_id if team_id else "team-1"
    path.append(user_team_id)
    
    # Add all teams to the hierarchy
    for dept_id, team_list in teams.items():
        for team in team_list:
            team_id = team["id"]
            
            # Add team to units
            units[team_id] = {
                "id": team_id,
                "type": "team",
                "name": team["name"],
                "description": team["description"],
                "parentId": dept_id,
                "level": 3,
                "path": [organization_id, primary_division_id, dept_id, team_id]
            }
    
    # Add user to their team
    path.append(user_id)
    units[user_id] = {
        "id": user_id,
        "type": "user",
        "name": current_user.name,
        "title": current_user.title or "Software Engineer",
        "description": "Team member",
        "parentId": user_team_id,
        "level": 4,
        "path": [organization_id, primary_division_id, department_id, user_team_id, user_id]
    }
    
    # Add other users for each team
    # Just add a few sample users to the current user's team
    user_team = units.get(user_team_id, {})
    if user_team:
        sample_users = [
            {"id": f"user-{i}", "name": f"Team Member {i}", "title": "Software Engineer"} 
            for i in range(1, 5)
        ]
        
        # Add leadership
        sample_users.append({"id": "user-lead", "name": "Team Lead", "title": "Engineering Manager"})
        
        # Add users to their team
        for sample_user in sample_users:
            if sample_user["id"] != user_id:  # Skip if this is the current user
                uid = sample_user["id"]
                units[uid] = {
                    "id": uid,
                    "type": "user",
                    "name": sample_user["name"],
                    "title": sample_user["title"],
                    "description": "Team member",
                    "parentId": user_team_id,
                    "level": 4,
                    "path": [organization_id, primary_division_id, department_id, user_team_id, uid]
                }
    
    # Build the complete structure with relationships
    structure = {
        "id": organization_id,
        "path": path,
        "units": units
    }
    
    logger.info(f"Generated organization structure with {len(units)} units")
    
    return {
        "structure": structure,
        "units": units
    }

@router.get("/unit/{unit_id}", response_model=Dict[str, Any])
async def get_organization_unit(
    unit_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: Any = Depends(get_current_user),
    children_only: bool = Query(False, description="If true, returns only the children of the unit")
):
    """
    Get details about a specific unit in the organization hierarchy with its children.
    
    Parameters:
    - unit_id: ID of the unit to fetch details for
    - children_only: If true, returns only the children of the unit
    
    Returns:
    - Details about the unit and its immediate children
    """
    logger.info(f"Fetching organization unit {unit_id} for user {current_user.name}")
    
    # First check for common unit IDs (organization, divisions, departments)
    
    # Get tenant name to customize the organization
    tenant_name = getattr(current_user, 'tenant_name', None)
    if not tenant_name and hasattr(current_user, 'tenant'):
        tenant_name = getattr(current_user.tenant, 'name', None)
    
    # Set organization name based on tenant if available
    org_name = tenant_name if tenant_name else "Biosphere Corporation"
    is_tech = True  # Default to tech industry
    
    # Check the industry from the organization name
    if tenant_name:
        is_pharma = "pharma" in org_name.lower() if org_name else False
        is_tech = "tech" in org_name.lower() or "innovation" in org_name.lower() if org_name else True
        is_healthcare = "health" in org_name.lower() or "medical" in org_name.lower() if org_name else False
        is_financial = "financial" in org_name.lower() or "bank" in org_name.lower() if org_name else False
        is_manufacturing = "manufacturing" in org_name.lower() if org_name else False
        is_education = "university" in org_name.lower() or "education" in org_name.lower() if org_name else False
    
    # Get structure data for the requested unit
    # Note: In a real implementation, we would query this from a database
    # Here we're generating a consistent structure on-the-fly
    
    # Organization level
    if unit_id == "org-1":
        # Set appropriate name based on industry
        org_description = "Global technology and innovation leader"
        if is_pharma:
            org_name = org_name or "Pharma AI Research"
            org_description = "Pharmaceutical research and innovation leader"
        elif is_healthcare:
            org_name = org_name or "Metropolitan Health System"
            org_description = "Integrated healthcare services provider"
        elif is_financial:
            org_name = org_name or "Global Financial Group"
            org_description = "Global financial services organization"
        elif is_manufacturing:
            org_name = org_name or "Advanced Manufacturing Corp"
            org_description = "Innovative manufacturing solutions"
        elif is_education:
            org_name = org_name or "University Research Alliance"
            org_description = "Higher education and research institution"
        else:
            org_name = org_name or "Tech Innovations Inc."
        
        unit = {
            "id": "org-1",
            "type": "organization",
            "name": org_name,
            "description": org_description,
            "level": 0,
            "path": ["org-1"]
        }
        
        # Add appropriate divisions based on industry
        if is_pharma:
            children = [
                {
                    "id": "div-1",
                    "type": "division",
                    "name": "Research & Development",
                    "description": "Pharmaceutical research and drug discovery",
                    "parentId": "org-1",
                    "level": 1,
                    "path": ["org-1", "div-1"]
                },
                {
                    "id": "div-2",
                    "type": "division",
                    "name": "Clinical Operations",
                    "description": "Clinical trials and regulatory affairs",
                    "parentId": "org-1",
                    "level": 1,
                    "path": ["org-1", "div-2"]
                },
                {
                    "id": "div-3",
                    "type": "division",
                    "name": "Commercial",
                    "description": "Sales, marketing, and commercial operations",
                    "parentId": "org-1",
                    "level": 1,
                    "path": ["org-1", "div-3"]
                },
                {
                    "id": "div-4",
                    "type": "division",
                    "name": "Manufacturing",
                    "description": "Pharmaceutical manufacturing and supply chain",
                    "parentId": "org-1",
                    "level": 1,
                    "path": ["org-1", "div-4"]
                }
            ]
        elif is_healthcare:
            children = [
                {
                    "id": "div-1",
                    "type": "division",
                    "name": "Clinical Services",
                    "description": "Patient care and medical services",
                    "parentId": "org-1",
                    "level": 1,
                    "path": ["org-1", "div-1"]
                },
                {
                    "id": "div-2", 
                    "type": "division",
                    "name": "Operations",
                    "description": "Hospital operations and facilities management",
                    "parentId": "org-1",
                    "level": 1,
                    "path": ["org-1", "div-2"]
                },
                {
                    "id": "div-3",
                    "type": "division",
                    "name": "Medical Research",
                    "description": "Clinical research and innovation",
                    "parentId": "org-1",
                    "level": 1, 
                    "path": ["org-1", "div-3"]
                },
                {
                    "id": "div-4",
                    "type": "division",
                    "name": "Administration",
                    "description": "Healthcare administration and finance",
                    "parentId": "org-1",
                    "level": 1,
                    "path": ["org-1", "div-4"]
                }
            ]
        else:
            # Default to tech structure
            children = [
                {
                    "id": "div-1",
                    "type": "division",
                    "name": "Engineering",
                    "description": "Software engineering and product development",
                    "parentId": "org-1",
                    "level": 1,
                    "path": ["org-1", "div-1"]
                },
                {
                    "id": "div-2",
                    "type": "division",
                    "name": "Operations",
                    "description": "Business operations and infrastructure",
                    "parentId": "org-1", 
                    "level": 1,
                    "path": ["org-1", "div-2"]
                },
                {
                    "id": "div-3",
                    "type": "division",
                    "name": "Product",
                    "description": "Product management and design",
                    "parentId": "org-1",
                    "level": 1,
                    "path": ["org-1", "div-3"]
                },
                {
                    "id": "div-4",
                    "type": "division",
                    "name": "Sales & Marketing",
                    "description": "Client acquisition and growth",
                    "parentId": "org-1",
                    "level": 1,
                    "path": ["org-1", "div-4"]
                }
            ]
        
        if children_only:
            return {"children": children}
        else:
            return {"unit": unit, "children": children}
    
    # Division level
    elif unit_id.startswith("div-"):
        # Basic division info (will customize based on ID)
        div_info = {
            "div-1": {
                "name": "Engineering" if is_tech else "Research & Development",
                "description": "Software engineering and product development" if is_tech else "Research and development"
            },
            "div-2": {
                "name": "Operations",
                "description": "Business operations and infrastructure"
            },
            "div-3": {
                "name": "Product" if is_tech else "Commercial",
                "description": "Product management and design" if is_tech else "Commercial operations"
            },
            "div-4": {
                "name": "Sales & Marketing",
                "description": "Client acquisition and growth"
            }
        }
        
        # Get info for this specific division
        div_data = div_info.get(unit_id, {
            "name": f"Division {unit_id.split('-')[1]}",
            "description": "Organizational division"
        })
        
        unit = {
            "id": unit_id, 
            "type": "division",
            "name": div_data["name"],
            "description": div_data["description"],
            "parentId": "org-1",
            "level": 1,
            "path": ["org-1", unit_id]
        }
        
        # Generate departments based on division ID
        if unit_id == "div-1":  # Engineering/R&D
            children = [
                {
                    "id": "dept-1",
                    "type": "department",
                    "name": "AI Department", 
                    "description": "Artificial intelligence research and development",
                    "parentId": unit_id,
                    "level": 2,
                    "path": ["org-1", unit_id, "dept-1"]
                },
                {
                    "id": "dept-2", 
                    "type": "department",
                    "name": "Data Science",
                    "description": "Advanced data analytics and machine learning",
                    "parentId": unit_id,
                    "level": 2,
                    "path": ["org-1", unit_id, "dept-2"]
                },
                {
                    "id": "dept-3", 
                    "type": "department",
                    "name": "Platform Engineering",
                    "description": "Core platform development",
                    "parentId": unit_id,
                    "level": 2,
                    "path": ["org-1", unit_id, "dept-3"]
                }
            ]
        elif unit_id == "div-2":  # Operations
            children = [
                {
                    "id": "dept-4",
                    "type": "department",
                    "name": "IT Operations", 
                    "description": "IT infrastructure and support",
                    "parentId": unit_id,
                    "level": 2,
                    "path": ["org-1", unit_id, "dept-4"]
                },
                {
                    "id": "dept-5", 
                    "type": "department",
                    "name": "Finance",
                    "description": "Financial operations and planning",
                    "parentId": unit_id,
                    "level": 2,
                    "path": ["org-1", unit_id, "dept-5"]
                },
                {
                    "id": "dept-6", 
                    "type": "department",
                    "name": "Human Resources",
                    "description": "HR operations and talent development",
                    "parentId": unit_id,
                    "level": 2,
                    "path": ["org-1", unit_id, "dept-6"]
                }
            ]
        elif unit_id == "div-3":  # Product/Commercial
            children = [
                {
                    "id": "dept-7",
                    "type": "department",
                    "name": "Product Management", 
                    "description": "Product strategy and roadmap",
                    "parentId": unit_id,
                    "level": 2,
                    "path": ["org-1", unit_id, "dept-7"]
                },
                {
                    "id": "dept-8", 
                    "type": "department",
                    "name": "User Experience",
                    "description": "UX design and research",
                    "parentId": unit_id,
                    "level": 2,
                    "path": ["org-1", unit_id, "dept-8"]
                },
                {
                    "id": "dept-9", 
                    "type": "department",
                    "name": "Customer Success",
                    "description": "Customer support and services",
                    "parentId": unit_id,
                    "level": 2,
                    "path": ["org-1", unit_id, "dept-9"]
                }
            ]
        else:  # div-4 or other (Sales/Manufacturing/etc.)
            children = [
                {
                    "id": "dept-10",
                    "type": "department",
                    "name": "Marketing", 
                    "description": "Brand and marketing initiatives",
                    "parentId": unit_id,
                    "level": 2,
                    "path": ["org-1", unit_id, "dept-10"]
                },
                {
                    "id": "dept-11", 
                    "type": "department",
                    "name": "Sales",
                    "description": "Sales and business development",
                    "parentId": unit_id,
                    "level": 2,
                    "path": ["org-1", unit_id, "dept-11"]
                },
                {
                    "id": "dept-12", 
                    "type": "department",
                    "name": "Supply Chain",
                    "description": "Supply chain management",
                    "parentId": unit_id,
                    "level": 2,
                    "path": ["org-1", unit_id, "dept-12"]
                }
            ]
        
        if children_only:
            return {"children": children}
        else:
            return {"unit": unit, "children": children}
    
    # Department level
    elif unit_id.startswith("dept-"):
        # Get division ID based on department ID
        div_id = None
        dept_num = int(unit_id.split("-")[1]) if unit_id.split("-")[1].isdigit() else 1
        
        if dept_num <= 3:
            div_id = "div-1"
        elif dept_num <= 6:
            div_id = "div-2"
        elif dept_num <= 9:
            div_id = "div-3"
        else:
            div_id = "div-4"
            
        # Department names based on ID
        dept_names = {
            "dept-1": {"name": "AI Department", "description": "Artificial intelligence research and development"},
            "dept-2": {"name": "Data Science", "description": "Advanced data analytics and machine learning"},
            "dept-3": {"name": "Platform Engineering", "description": "Core platform development"},
            "dept-4": {"name": "IT Operations", "description": "IT infrastructure and support"},
            "dept-5": {"name": "Finance", "description": "Financial operations and planning"},
            "dept-6": {"name": "Human Resources", "description": "HR operations and talent development"},
            "dept-7": {"name": "Product Management", "description": "Product strategy and roadmap"},
            "dept-8": {"name": "User Experience", "description": "UX design and research"},
            "dept-9": {"name": "Customer Success", "description": "Customer support and services"},
            "dept-10": {"name": "Marketing", "description": "Brand and marketing initiatives"},
            "dept-11": {"name": "Sales", "description": "Sales and business development"},
            "dept-12": {"name": "Supply Chain", "description": "Supply chain management"},
        }
        
        # Get info for this specific department
        dept_data = dept_names.get(unit_id, {
            "name": f"Department {unit_id.split('-')[1]}",
            "description": "Organizational department"
        })
        
        unit = {
            "id": unit_id,
            "type": "department",
            "name": dept_data["name"],
            "description": dept_data["description"],
            "parentId": div_id, 
            "level": 2,
            "path": ["org-1", div_id, unit_id]
        }
        
        # Teams based on department
        if unit_id == "dept-1":  # AI Department
            children = [
                {
                    "id": "team-1",
                    "type": "team",
                    "name": "Knowledge Engine Team",
                    "description": "Building next-generation knowledge management solutions",
                    "parentId": unit_id,
                    "level": 3,
                    "path": ["org-1", div_id, unit_id, "team-1"]
                },
                {
                    "id": "team-2",
                    "type": "team",
                    "name": "NLP Research",
                    "description": "Natural language processing research team",
                    "parentId": unit_id,
                    "level": 3,
                    "path": ["org-1", div_id, unit_id, "team-2"]
                },
                {
                    "id": "team-3",
                    "type": "team",
                    "name": "Computer Vision", 
                    "description": "Computer vision and image processing team",
                    "parentId": unit_id,
                    "level": 3,
                    "path": ["org-1", div_id, unit_id, "team-3"]
                }
            ]
        elif unit_id == "dept-2":  # Data Science
            children = [
                {
                    "id": "team-4",
                    "type": "team",
                    "name": "Data Platform",
                    "description": "Enterprise data platform development",
                    "parentId": unit_id,
                    "level": 3,
                    "path": ["org-1", div_id, unit_id, "team-4"]
                },
                {
                    "id": "team-5",
                    "type": "team",
                    "name": "ML Ops",
                    "description": "Machine learning operations and infrastructure",
                    "parentId": unit_id,
                    "level": 3,
                    "path": ["org-1", div_id, unit_id, "team-5"]
                },
                {
                    "id": "team-6",
                    "type": "team",
                    "name": "Analytics",
                    "description": "Business analytics and insights", 
                    "parentId": unit_id,
                    "level": 3,
                    "path": ["org-1", div_id, unit_id, "team-6"]
                }
            ]
        elif unit_id == "dept-3":  # Platform Engineering
            children = [
                {
                    "id": "team-7",
                    "type": "team",
                    "name": "Backend Services",
                    "description": "Core backend services development",
                    "parentId": unit_id,
                    "level": 3,
                    "path": ["org-1", div_id, unit_id, "team-7"]
                },
                {
                    "id": "team-8",
                    "type": "team",
                    "name": "Frontend",
                    "description": "User interface development",
                    "parentId": unit_id,
                    "level": 3,
                    "path": ["org-1", div_id, unit_id, "team-8"]
                },
                {
                    "id": "team-9",
                    "type": "team",
                    "name": "DevOps",
                    "description": "Development operations and infrastructure",
                    "parentId": unit_id,
                    "level": 3,
                    "path": ["org-1", div_id, unit_id, "team-9"]
                }
            ]
        else:
            # Generic teams for other departments
            dept_num = int(unit_id.split("-")[1]) if unit_id.split("-")[1].isdigit() else 0
            base_team_num = (dept_num - 1) * 3 + 1
            
            children = [
                {
                    "id": f"team-{base_team_num}",
                    "type": "team",
                    "name": f"Team {dept_data['name']} 1",
                    "description": f"Team in {dept_data['name']}",
                    "parentId": unit_id,
                    "level": 3,
                    "path": ["org-1", div_id, unit_id, f"team-{base_team_num}"]
                },
                {
                    "id": f"team-{base_team_num + 1}",
                    "type": "team",
                    "name": f"Team {dept_data['name']} 2",
                    "description": f"Team in {dept_data['name']}",
                    "parentId": unit_id,
                    "level": 3,
                    "path": ["org-1", div_id, unit_id, f"team-{base_team_num + 1}"]
                }
            ]
        
        if children_only:
            return {"children": children}
        else:
            return {"unit": unit, "children": children}
    
    # Team level
    elif unit_id.startswith("team-"):
        # Find the parent department based on team ID
        team_num = int(unit_id.split("-")[1]) if unit_id.split("-")[1].isdigit() else 1
        
        dept_id = "dept-1"  # Default
        div_id = "div-1"  # Default
        
        if team_num <= 3:
            dept_id = "dept-1"
            div_id = "div-1"
        elif team_num <= 6:
            dept_id = "dept-2"
            div_id = "div-1"
        elif team_num <= 9:
            dept_id = "dept-3"
            div_id = "div-1"
        elif team_num <= 12:
            dept_id = "dept-4"
            div_id = "div-2"
        else:
            dept_id = "dept-7"
            div_id = "div-3"
            
        # Team names based on ID
        team_names = {
            "team-1": {"name": "Knowledge Engine Team", "description": "Building next-generation knowledge management solutions"},
            "team-2": {"name": "NLP Research", "description": "Natural language processing research team"},
            "team-3": {"name": "Computer Vision", "description": "Computer vision and image processing team"},
            "team-4": {"name": "Data Platform", "description": "Enterprise data platform development"},
            "team-5": {"name": "ML Ops", "description": "Machine learning operations and infrastructure"},
            "team-6": {"name": "Analytics", "description": "Business analytics and insights"},
            "team-7": {"name": "Backend Services", "description": "Core backend services development"},
            "team-8": {"name": "Frontend", "description": "User interface development"},
            "team-9": {"name": "DevOps", "description": "Development operations and infrastructure"},
            "team-10": {"name": "System Administration", "description": "IT systems management"},
            "team-11": {"name": "Network Operations", "description": "Network infrastructure management"},
            "team-12": {"name": "Product Strategy", "description": "Product vision and strategy"},
            "team-13": {"name": "Product Operations", "description": "Product delivery and operations"},
            "team-14": {"name": "Design Systems", "description": "Design system development"},
            "team-15": {"name": "User Research", "description": "User testing and research"},
        }
        
        # Get info for this specific team
        team_data = team_names.get(unit_id, {
            "name": f"Team {unit_id.split('-')[1]}",
            "description": "Organizational team"
        })
        
        unit = {
            "id": unit_id,
            "type": "team", 
            "name": team_data["name"],
            "description": team_data["description"],
            "parentId": dept_id,
            "level": 3,
            "path": ["org-1", div_id, dept_id, unit_id]
        }
        
        # Add current user to team if this is their team
        user_team_id = str(current_user.team_id) if current_user.team_id else "team-1"
        
        # Generate team members
        children = []
        
        # Always add current user to their team
        if unit_id == user_team_id:
            children.append({
                "id": str(current_user.id),
                "type": "user",
                "name": current_user.name,
                "title": current_user.title or "Software Engineer",
                "description": "Team member",
                "parentId": unit_id,
                "level": 4,
                "path": ["org-1", div_id, dept_id, unit_id, str(current_user.id)]
            })
        
        # Add other team members (4-6 per team)
        member_count = 5  # Default
        
        # Add team lead
        children.append({
            "id": f"{unit_id}-lead",
            "type": "user",
            "name": f"{team_data['name']} Lead",
            "title": "Engineering Manager",
            "description": "Team manager",
            "parentId": unit_id,
            "level": 4,
            "path": ["org-1", div_id, dept_id, unit_id, f"{unit_id}-lead"]
        })
        
        # Add regular team members
        for i in range(1, member_count):
            member_id = f"{unit_id}-member-{i}"
            if member_id != str(current_user.id):  # Skip if this would be the current user
                children.append({
                    "id": member_id, 
                    "type": "user",
                    "name": f"Team Member {i}",
                    "title": "Software Engineer",
                    "description": "Team member",
                    "parentId": unit_id,
                    "level": 4,
                    "path": ["org-1", div_id, dept_id, unit_id, member_id]
                })
        
        if children_only:
            return {"children": children}
        else:
            return {"unit": unit, "children": children}
    
    # User level (current user)
    elif unit_id == str(current_user.id) or unit_id.endswith("-lead") or unit_id.endswith("-member-1") or unit_id.endswith("-member-2"):
        # For simplicity, we'll handle several common user IDs
        user_team_id = str(current_user.team_id) if current_user.team_id else "team-1"
        
        # Determine the team if not the current user
        if unit_id != str(current_user.id):
            # Extract team ID from user ID (team-X-lead or team-X-member-Y)
            parts = unit_id.split('-')
            if len(parts) >= 2:
                if parts[0] == "team":
                    user_team_id = f"team-{parts[1]}"
        
        # Find department and division based on team
        team_num = int(user_team_id.split("-")[1]) if user_team_id.split("-")[1].isdigit() else 1
        
        dept_id = "dept-1"  # Default
        div_id = "div-1"  # Default
        
        if team_num <= 3:
            dept_id = "dept-1"
            div_id = "div-1"
        elif team_num <= 6:
            dept_id = "dept-2"
            div_id = "div-1"
        elif team_num <= 9:
            dept_id = "dept-3"
            div_id = "div-1"
        elif team_num <= 12:
            dept_id = "dept-4"
            div_id = "div-2"
        else:
            dept_id = "dept-7"
            div_id = "div-3"
        
        # Customize title based on user ID pattern
        user_title = "Software Engineer"  # Default
        user_name = current_user.name     # Default to current user
        
        if unit_id.endswith("-lead"):
            user_title = "Engineering Manager"
            user_name = "Team Lead"
        elif unit_id.endswith("-member-1"):
            user_title = "Senior Software Engineer" 
            user_name = "Team Member 1"
        elif unit_id.endswith("-member-2"):
            user_title = "Software Engineer"
            user_name = "Team Member 2"
            
        # For current user, use their actual data
        if unit_id == str(current_user.id):
            user_title = current_user.title or "Software Engineer"
            user_name = current_user.name
        
        unit = {
            "id": unit_id,
            "type": "user",
            "name": user_name, 
            "title": user_title,
            "description": "Team member",
            "parentId": user_team_id,
            "level": 4,
            "path": ["org-1", div_id, dept_id, user_team_id, unit_id]
        }
        
        # Users don't have children
        children = []
        
        if children_only:
            return {"children": children}
        else:
            return {"unit": unit, "children": children}
    
    # Handle any unit ID that matches our pattern but wasn't explicitly handled
    elif unit_id.startswith("div-") or unit_id.startswith("dept-") or unit_id.startswith("team-") or unit_id.startswith("user-"):
        # Generate a placeholder unit
        unit_type = unit_id.split("-")[0]
        unit_level = {
            "org": 0,
            "div": 1,
            "dept": 2,
            "team": 3,
            "user": 4
        }.get(unit_type, 0)
        
        unit = {
            "id": unit_id,
            "type": unit_type,
            "name": f"{unit_type.capitalize()} {unit_id.split('-')[1]}", 
            "description": f"Organizational {unit_type}",
            "level": unit_level,
            "path": ["org-1"]  # Simplified path
        }
        
        # Generic children based on type
        if unit_type == "div":
            children = [{"id": f"dept-{i}", "type": "department", "name": f"Department {i}", "parentId": unit_id, "level": 2} for i in range(1, 4)]
        elif unit_type == "dept":
            children = [{"id": f"team-{i}", "type": "team", "name": f"Team {i}", "parentId": unit_id, "level": 3} for i in range(1, 4)]
        elif unit_type == "team":
            children = [{"id": f"user-{i}", "type": "user", "name": f"User {i}", "parentId": unit_id, "level": 4} for i in range(1, 4)]
        else:
            children = []
        
        if children_only:
            return {"children": children}
        else:
            return {"unit": unit, "children": children}
    
    # Unit not found
    logger.warning(f"Organization unit not found: {unit_id}")
    raise HTTPException(status_code=404, detail=f"Organization unit not found: {unit_id}")