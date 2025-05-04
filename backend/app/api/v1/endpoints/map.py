from typing import Dict, List, Optional, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db_session
from app import schemas

router = APIRouter()

@router.get("/path", response_model=Dict[str, Any])
async def get_hierarchy_path(
    db: AsyncSession = Depends(get_db_session),
    current_user: Any = Depends(get_current_user),
):
    """
    Get the organizational hierarchy path for the current user.
    
    Returns a path from the user up through teams, departments, and the organization,
    along with information about each entity in the path.
    """
    # This is where we would fetch the actual hierarchy data from the database
    # For now, we'll return a structured response with the user's position in the hierarchy
    
    # Get IDs from current user for hierarchy
    user_id = str(current_user.id)
    team_id = str(current_user.team_id) if current_user.team_id else None
    
    # Build the path
    path = []
    units = {}
    
    # Initialize with organization level
    organization_id = "org-1"
    path.append(organization_id)
    units[organization_id] = {
        "id": organization_id,
        "type": "organization",
        "name": "Biosphere Corporation",
        "level": 0,
        "path": [organization_id]
    }
    
    # Add division level if applicable
    if team_id:
        division_id = "div-1"
        path.append(division_id)
        units[division_id] = {
            "id": division_id,
            "type": "division", 
            "name": "Research & Development",
            "parentId": organization_id,
            "level": 1,
            "path": [organization_id, division_id]
        }
        
        # Add department level if applicable
        department_id = "dept-1"
        path.append(department_id)
        units[department_id] = {
            "id": department_id,
            "type": "department",
            "name": "AI Department",
            "parentId": division_id,
            "level": 2,
            "path": [organization_id, division_id, department_id]
        }
        
        # Add team level
        path.append(team_id)
        units[team_id] = {
            "id": team_id,
            "type": "team",
            "name": "Knowledge Engine Team",
            "parentId": department_id,
            "level": 3,
            "path": [organization_id, division_id, department_id, team_id]
        }
    
    # Add user level
    path.append(user_id)
    units[user_id] = {
        "id": user_id,
        "type": "user",
        "name": current_user.name,
        "parentId": team_id,
        "level": 4,
        "path": [organization_id, division_id, department_id, team_id, user_id] if team_id else [organization_id, user_id]
    }
    
    return {
        "path": path,
        "units": units
    }

@router.get("/unit/{unit_id}", response_model=Dict[str, Any])
async def get_hierarchy_unit(
    unit_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: Any = Depends(get_current_user),
):
    """
    Get details about a specific unit in the hierarchy with its children.
    
    Parameters:
    - unit_id: ID of the unit to fetch details for
    
    Returns:
    - Details about the unit and its immediate children
    """
    # Mock data - in a real implementation, this would fetch from database
    
    # Organization level
    if unit_id == "org-1":
        return {
            "unit": {
                "id": "org-1",
                "type": "organization",
                "name": "Biosphere Corporation",
                "level": 0,
                "path": ["org-1"]
            },
            "children": [
                {
                    "id": "div-1",
                    "type": "division",
                    "name": "Research & Development",
                    "parentId": "org-1",
                    "level": 1,
                    "path": ["org-1", "div-1"]
                },
                {
                    "id": "div-2",
                    "type": "division",
                    "name": "Operations",
                    "parentId": "org-1", 
                    "level": 1,
                    "path": ["org-1", "div-2"]
                }
            ]
        }
    
    # Division level
    elif unit_id == "div-1":
        return {
            "unit": {
                "id": "div-1", 
                "type": "division",
                "name": "Research & Development",
                "parentId": "org-1",
                "level": 1,
                "path": ["org-1", "div-1"]
            },
            "children": [
                {
                    "id": "dept-1",
                    "type": "department",
                    "name": "AI Department", 
                    "parentId": "div-1",
                    "level": 2,
                    "path": ["org-1", "div-1", "dept-1"]
                },
                {
                    "id": "dept-2", 
                    "type": "department",
                    "name": "Data Science",
                    "parentId": "div-1",
                    "level": 2,
                    "path": ["org-1", "div-1", "dept-2"]
                }
            ]
        }
    
    # Department level
    elif unit_id == "dept-1":
        return {
            "unit": {
                "id": "dept-1",
                "type": "department",
                "name": "AI Department",
                "parentId": "div-1", 
                "level": 2,
                "path": ["org-1", "div-1", "dept-1"]
            },
            "children": [
                {
                    "id": str(current_user.team_id) if current_user.team_id else "team-1",
                    "type": "team",
                    "name": "Knowledge Engine Team",
                    "parentId": "dept-1",
                    "level": 3,
                    "path": ["org-1", "div-1", "dept-1", str(current_user.team_id) if current_user.team_id else "team-1"]
                }
            ]
        }
    
    # Team level
    elif unit_id == str(current_user.team_id):
        return {
            "unit": {
                "id": str(current_user.team_id),
                "type": "team", 
                "name": "Knowledge Engine Team",
                "parentId": "dept-1",
                "level": 3,
                "path": ["org-1", "div-1", "dept-1", str(current_user.team_id)]
            },
            "children": [
                {
                    "id": str(current_user.id),
                    "type": "user",
                    "name": current_user.name,
                    "parentId": str(current_user.team_id),
                    "level": 4,
                    "path": ["org-1", "div-1", "dept-1", str(current_user.team_id), str(current_user.id)]
                }
            ]
        }
    
    # User level
    elif unit_id == str(current_user.id):
        return {
            "unit": {
                "id": str(current_user.id),
                "type": "user",
                "name": current_user.name,
                "title": current_user.title,
                "parentId": str(current_user.team_id) if current_user.team_id else None,
                "level": 4,
                "path": ["org-1", "div-1", "dept-1", str(current_user.team_id), str(current_user.id)] if current_user.team_id else ["org-1", str(current_user.id)]
            },
            "children": []
        }
    
    # Unit not found
    raise HTTPException(status_code=404, detail="Hierarchy unit not found")

@router.get("/search", response_model=List[Dict[str, Any]])
async def search_hierarchy(
    query: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: Any = Depends(get_current_user),
    type: Optional[str] = None,
):
    """
    Search for units in the hierarchy by name.
    
    Parameters:
    - query: Search query string
    - type: Optional filter for unit type (organization, division, department, team, user)
    
    Returns:
    - List of matching units
    """
    # Mock implementation - in a real system this would query the database
    results = []
    
    # Add mock results based on query
    if "ai" in query.lower():
        results.append({
            "id": "dept-1",
            "type": "department",
            "name": "AI Department",
            "level": 2,
            "parentId": "div-1",
            "path": ["org-1", "div-1", "dept-1"]
        })
    
    if "knowledge" in query.lower():
        results.append({
            "id": str(current_user.team_id) if current_user.team_id else "team-1",
            "type": "team", 
            "name": "Knowledge Engine Team",
            "level": 3,
            "parentId": "dept-1",
            "path": ["org-1", "div-1", "dept-1", str(current_user.team_id) if current_user.team_id else "team-1"]
        })
    
    if "research" in query.lower():
        results.append({
            "id": "div-1",
            "type": "division",
            "name": "Research & Development",
            "level": 1,
            "parentId": "org-1",
            "path": ["org-1", "div-1"]
        })
    
    # Add current user if query matches
    if query.lower() in current_user.name.lower():
        results.append({
            "id": str(current_user.id),
            "type": "user",
            "name": current_user.name,
            "level": 4,
            "parentId": str(current_user.team_id) if current_user.team_id else None,
            "path": ["org-1", "div-1", "dept-1", str(current_user.team_id), str(current_user.id)] if current_user.team_id else ["org-1", str(current_user.id)]
        })
    
    # Filter by type if specified
    if type:
        results = [r for r in results if r["type"] == type]
    
    return results