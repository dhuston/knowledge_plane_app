from typing import AsyncGenerator, Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app import models, schemas
from app.core.config import settings
from app.core.security import get_current_user
from app.db.session import get_db_session


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


async def get_db() -> AsyncGenerator:
    """
    Get database session.
    
    Yields:
        SQLAlchemy async database session
    """
    async for session in get_db_session():
        yield session


async def get_current_active_user(
    current_user: Annotated[models.User, Depends(get_current_user)]
) -> models.User:
    """
    Get current active user.
    
    Args:
        current_user: Current user from token
        
    Returns:
        User: Active user
        
    Raises:
        HTTPException: If user is inactive
    """
    # Check if the user has is_active attribute and if it's False
    if hasattr(current_user, 'is_active') and not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_active_superuser(
    current_user: Annotated[models.User, Depends(get_current_user)]
) -> models.User:
    """
    Get current active superuser.
    
    Args:
        current_user: Current user from token
        
    Returns:
        User: Active superuser
        
    Raises:
        HTTPException: If user is not superuser
    """
    # First check if user has is_admin flag set
    if hasattr(current_user, 'is_admin') and current_user.is_admin:
        return current_user
    
    # For backwards compatibility, also check is_superuser if it exists
    if hasattr(current_user, 'is_superuser') and current_user.is_superuser:
        return current_user
        
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="The user doesn't have enough privileges"
    )
    return current_user


def get_current_user_tenant_id(
    current_user: Annotated[models.User, Depends(get_current_user)]
) -> int:
    """
    Get the tenant ID for the current user.
    
    Args:
        current_user: Current user from token
        
    Returns:
        int: Tenant ID for the user
        
    Raises:
        HTTPException: If user has no tenant ID
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has no tenant association"
        )
    return current_user.tenant_id

# Alias for get_current_user_tenant_id to maintain backwards compatibility
# This ensures existing code using get_tenant_id continues to work
get_tenant_id = get_current_user_tenant_id