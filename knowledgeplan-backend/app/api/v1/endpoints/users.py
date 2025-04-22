from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app import schemas, crud # Import top-level packages
from app import models # Import models module
from app.core import security # Import security module for dependency
from app.db.session import get_db_session

router = APIRouter()

@router.get("/me", response_model=schemas.UserRead)
async def read_users_me(
    current_user: models.User = Depends(security.get_current_user)
):
    """Fetch the current logged in user."""
    # The dependency already fetched the user from DB
    return current_user

# Endpoint to get a specific user by ID
@router.get("/{user_id}", response_model=schemas.UserRead)
async def read_user(
    user_id: UUID, 
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user), # Ensure requester is authenticated
) -> models.User:
    """Gets a specific user's details by their ID."""
    # TODO: Add authorization logic - should any user be able to fetch any other user?
    # Maybe only within the same tenant? Or only managers?
    user = await crud.user.get(db, id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    # Optional: Check if requested user is in the same tenant as current_user
    # if user.tenant_id != current_user.tenant_id:
    #     raise HTTPException(status_code=403, detail="Not authorized to access this user")
    return user

# --- New Endpoints for Related Items --- 

@router.get("/{user_id}/projects", response_model=List[schemas.ProjectRead])
async def read_user_projects(
    user_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user),
):
    """Retrieve projects associated with a specific user (owned by their team)."""
    # Verify the target user exists and is in the same tenant
    target_user = await crud.user.get(db, id=user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this user's projects")

    # Fetch projects using the CRUD method, passing the target user's team_id
    projects = await crud.user.get_projects(
        db=db, 
        user_id=user_id, 
        tenant_id=current_user.tenant_id, 
        user_team_id=target_user.team_id # Pass user's team_id
    )
    return projects

@router.get("/{user_id}/goals", response_model=List[schemas.GoalReadMinimal])
async def read_user_goals(
    user_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user),
):
    """Retrieve goals associated with a specific user (linked to projects owned by their team)."""
    # Verify the target user exists and is in the same tenant
    target_user = await crud.user.get(db, id=user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this user's goals")

    # Fetch goals using the CRUD method (returns Rows matching GoalReadMinimal)
    goals = await crud.user.get_goals(
        db=db, 
        user_id=user_id, 
        tenant_id=current_user.tenant_id,
        user_team_id=target_user.team_id 
    )
    return goals # Pydantic will validate the Row objects against GoalReadMinimal


# Add other user endpoints later (e.g., update user) 