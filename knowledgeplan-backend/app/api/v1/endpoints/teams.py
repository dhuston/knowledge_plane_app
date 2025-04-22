from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app import models, schemas, crud
from app.core import security
from app.db.session import get_db_session

router = APIRouter()

@router.get("/{team_id}", response_model=schemas.TeamRead)
async def read_team(
    team_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user), # Ensure requester is authenticated
) -> models.Team:
    """Gets a specific team's details by its ID."""
    # TODO: Add authorization logic - should user be in the same tenant?
    team = await crud.team.get(db, id=team_id)
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    # Optional: Check if team is in the same tenant as current_user
    # if team.tenant_id != current_user.tenant_id:
    #     raise HTTPException(status_code=403, detail="Not authorized to access this team")
    return team

# --- New Endpoints for Related Items --- 

@router.get("/{team_id}/projects", response_model=List[schemas.ProjectRead])
async def read_team_projects(
    team_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user),
):
    """Retrieve projects owned by a specific team."""
    # Verify team exists and is in the same tenant (optional but good practice)
    team = await crud.team.get(db, id=team_id)
    if not team or team.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Team not found or not authorized")

    # Fetch projects using the CRUD function from crud_project
    projects = await crud.project.get_projects_by_team(
        db=db, team_id=team_id, tenant_id=current_user.tenant_id
    )
    return projects

@router.get("/{team_id}/goals", response_model=List[schemas.GoalReadMinimal])
async def read_team_goals(
    team_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user),
):
    """Retrieve goals linked to projects owned by a specific team."""
    # Verify team exists and is in the same tenant
    team = await crud.team.get(db, id=team_id)
    if not team or team.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Team not found or not authorized")

    # Fetch goals using the CRUD function from crud_goal
    goals = await crud.goal.get_multi_by_owning_team(
        db=db, team_id=team_id, tenant_id=current_user.tenant_id
    )
    return goals # Pydantic will validate Row objects against GoalReadMinimal

# Add POST endpoint for creating teams later if needed 