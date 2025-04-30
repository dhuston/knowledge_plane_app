from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app.crud.crud_user import user as crud_user # Specific imports
from app import models, schemas
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
    user = await crud_user.get(db, id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    # Ensure requested user is in the same tenant as current_user
    if user.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this user")
    return user

# Removed /projects and /goals endpoints from here, they belong under /teams or global /projects /goals

# Add PUT for updating user profiles later
# Add DELETE for deleting users later 