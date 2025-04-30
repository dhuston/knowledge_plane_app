from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app import crud, models, schemas
from app.db.session import get_db_session
from app.core.security import get_current_user
from app.models.user import User as UserModel
from app.models.goal import Goal as GoalModel
from app.schemas.goal import GoalRead, GoalCreate, GoalUpdate
from app.crud import crud_goal

router = APIRouter()

@router.post("/", response_model=GoalRead, status_code=status.HTTP_201_CREATED)
async def create_new_goal(
    *, 
    db: AsyncSession = Depends(get_db_session),
    goal_in: GoalCreate,
    current_user: UserModel = Depends(get_current_user)
):
    """
    Create a new goal.
    """
    # Pass tenant_id from the current user
    goal = await crud_goal.create_goal(db=db, goal_in=goal_in, tenant_id=current_user.tenant_id)
    return goal

@router.get("/{goal_id}", response_model=GoalRead)
async def read_goal_by_id(
    *, 
    db: AsyncSession = Depends(get_db_session),
    goal_id: UUID,
    current_user: UserModel = Depends(get_current_user) # Ensures user is logged in
):
    """
    Get a specific goal by ID.
    Ensures the goal belongs to the user's tenant.
    """
    goal = await crud_goal.get_goal(db=db, goal_id=goal_id, tenant_id=current_user.tenant_id)
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Goal not found or not part of your tenant."
        )
    # TODO: Add more granular access control later
    return goal

# Optional: Add listing endpoint later
# @router.get("/", response_model=List[GoalRead])
# async def read_goals(...):
#     """Retrieve goals relevant to the current user or tenant."""
#     # Logic to fetch goals for the tenant
#     pass

# Optional: Add update endpoint later
# @router.put("/{goal_id}", response_model=GoalRead)
# async def update_existing_goal(...):
#     """Update a goal."""
#     pass

# Optional: Add delete endpoint later
# @router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_existing_goal(...):
#     """Delete a goal."""
#     pass 