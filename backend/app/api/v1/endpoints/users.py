from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app.crud.crud_user import user as crud_user # Specific imports
from app import models, schemas
from app.core import security # Import security module for dependency
from app.db.session import get_db_session

router = APIRouter()

@router.options("/me", status_code=200)
async def options_read_users_me():
    """Handle OPTIONS requests for /me endpoint"""
    from fastapi.responses import JSONResponse
    response = JSONResponse({})
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
    return response

@router.get("/me")
async def read_users_me(
    current_user: models.User = Depends(security.get_current_user)
):
    """Fetch the current logged in user."""
    # The dependency already fetched the user from DB
    from fastapi.responses import JSONResponse
    
    # Skip Pydantic validation which is causing issues with UUID4 validation
    # Create a simple dict with the user data directly
    user_data = {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.name,
        "title": current_user.title,
        "avatar_url": current_user.avatar_url,
        "online_status": current_user.online_status or False,
        "tenant_id": str(current_user.tenant_id),
        "team_id": str(current_user.team_id) if current_user.team_id else None,
        "manager_id": str(current_user.manager_id) if current_user.manager_id else None,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "updated_at": current_user.updated_at.isoformat() if current_user.updated_at else None,
        "auth_provider": current_user.auth_provider,
        "auth_provider_id": current_user.auth_provider_id
    }
    
    # Create custom response with CORS headers
    response = JSONResponse(content=user_data)
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173" 
    response.headers["Access-Control-Allow-Credentials"] = "true"
    
    return response

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