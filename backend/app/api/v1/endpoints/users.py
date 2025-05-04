from fastapi import APIRouter, Depends, HTTPException, Path, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Dict, Any

from app.crud.crud_user import user as crud_user
from app import models, schemas
from app.core import security
from app.db.session import get_db_session

router = APIRouter()

@router.get("/me", response_model=schemas.UserRead)
async def read_users_me(
    current_user: models.User = Depends(security.get_current_user)
) -> models.User:
    """Fetch the current logged in user."""
    return current_user

@router.get("/{user_id}", response_model=schemas.UserRead)
async def read_user(
    user_id: UUID, 
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user),
) -> models.User:
    """Gets a specific user's details by their ID."""
    user = await crud_user.get(db, id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    # Ensure requested user is in the same tenant as current_user
    if user.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this user")
    return user

@router.put("/me", response_model=schemas.UserRead)
async def update_user_me(
    user_update: schemas.UserUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user),
) -> models.User:
    """Update current user profile."""
    updated_user = await crud_user.update(
        db, 
        db_obj=current_user, 
        obj_in=user_update
    )
    return updated_user