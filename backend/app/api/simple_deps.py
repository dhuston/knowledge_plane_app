from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.services.simple_auth_service import simple_auth_service
from app.models.user import User


# Configure OAuth2 password bearer with the correct endpoint for simple-auth
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/simple-auth/login")


async def get_db() -> AsyncSession:
    """Get a database session."""
    async for session in get_db_session():
        yield session


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get the current user from the token.
    
    Args:
        token: JWT token from authorization header
        db: Database session
        
    Returns:
        User: Current authenticated user
        
    Raises:
        HTTPException: If authentication fails
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    success, user, error = await simple_auth_service.get_user_from_token(db, token)
    
    if not success or not user:
        # Log the error reason for debugging
        print(f"Authentication failed: {error}")
        raise credentials_exception
        
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Ensure the current user is active.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User: Current active user
        
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Ensure the current user is a superuser.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User: Current active superuser
        
    Raises:
        HTTPException: If user is not a superuser
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    return current_user


def get_tenant_id(
    current_user: User = Depends(get_current_user),
):
    """
    Get the tenant ID for the current user.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        UUID: Tenant ID
        
    Raises:
        HTTPException: If user has no tenant association
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=400,
            detail="User has no tenant association"
        )
    return current_user.tenant_id