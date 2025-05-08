"""
Security module focused on authorization, user verification, and dependency injection.
Handles current user retrieval, permission checking, and security dependencies.
"""
import logging
from typing import Any, Optional, Tuple
from uuid import UUID

from jose import JWTError
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db_session
from app.models.user import User as UserModel
from app.crud.crud_user import user as user_crud
from app.core.oauth_provider import get_oauth_registry
from app.core.token import decode_token

# Get logger
logger = logging.getLogger(__name__)

# Reusable HTTPException for credential errors
CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

# Define the OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")

# Pydantic model for data stored in the JWT token
class TokenData(BaseModel):
    sub: Optional[UUID] = None
    tenant_id: Optional[UUID] = None


async def initialize_oauth() -> None:
    """
    Initialize OAuth providers from configuration.
    """
    try:
        # Register all configured OAuth providers
        registry = get_oauth_registry()
        
        # Log available providers
        logger.info(f"Initializing OAuth providers")
        for provider in registry.providers.values():
            logger.info(f"OAuth provider registered: {provider.name}")
            
        logger.info("OAuth initialization complete")
    except Exception as e:
        logger.error(f"Error initializing OAuth: {str(e)}")
        # We log but don't raise - let the application continue even if OAuth fails
        # This allows the system to work with password auth even if OAuth is misconfigured


def get_tenant_id_from_token(token: str) -> Optional[UUID]:
    """
    Extract tenant ID from JWT token.
    
    Args:
        token: JWT token
        
    Returns:
        UUID: Tenant ID if present in token, None otherwise
    """
    payload = decode_token(token)
    if not payload:
        return None
        
    tenant_id_str = payload.get("tenant_id")
    if not tenant_id_str:
        return None
        
    try:
        return UUID(tenant_id_str)
    except ValueError:
        logger.warning(f"Invalid tenant_id in token: {tenant_id_str}")
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db_session)
) -> UserModel:
    """
    Get the current authenticated user based on the JWT token.
    
    Args:
        token: JWT token from request
        db: Database session
        
    Returns:
        User: The authenticated user
        
    Raises:
        HTTPException: If authentication fails
    """
    # Enhanced debugging for token verification
    logger.debug('Token received: %s', token[:10] + '...' if token else 'None')
    
    try:
        # Decode the token
        logger.debug('Attempting to decode token')
        payload = decode_token(token)
        if not payload:
            logger.warning('Token decode failed, no payload returned')
            raise CREDENTIALS_EXCEPTION
            
        # Extract user ID
        user_id_str = payload.get("sub")
        if not user_id_str:
            logger.warning('No subject claim (sub) in token payload')
            raise CREDENTIALS_EXCEPTION
        
        logger.debug('Token subject: %s', user_id_str)
            
        # Parse UUID
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            logger.warning(f"Invalid UUID format for user_id in token: {user_id_str}")
            raise CREDENTIALS_EXCEPTION
            
        # Create token data
        token_data = TokenData(sub=user_id)
        
        # Extract tenant ID if present
        tenant_id_str = payload.get("tenant_id")
        if tenant_id_str:
            try:
                token_data.tenant_id = UUID(tenant_id_str)
                logger.debug('Token tenant_id: %s', tenant_id_str)
            except ValueError:
                logger.warning(f"Invalid tenant_id in token: {tenant_id_str}")
                # Continue without tenant ID rather than failing auth completely
        else:
            logger.warning("No tenant_id claim in token payload")
        
        # Get user from database
        logger.debug('Attempting to retrieve user %s from database', user_id)
        user = None
        async for session in db:
            user = await user_crud.get(session, id=token_data.sub)
            break
            
        if not user:
            logger.warning(f"User {token_data.sub} from token not found in database")
            raise CREDENTIALS_EXCEPTION
        
        logger.debug('User found: %s (id=%s, tenant_id=%s)', user.email, user.id, user.tenant_id)
            
        # Validate tenant if present in both token and user
        if token_data.tenant_id and user.tenant_id and token_data.tenant_id != user.tenant_id:
            logger.warning(f"Token tenant_id {token_data.tenant_id} doesn't match user tenant_id {user.tenant_id}")
            if not settings.DEBUG:
                raise CREDENTIALS_EXCEPTION
            # In debug mode we log but allow the mismatch
            logger.warning("Allowing tenant mismatch in DEBUG mode")
            
        logger.debug('Authentication successful for user %s', user.email)
        return user
        
    except JWTError as je:
        logger.warning("JWT validation error: %s", str(je))
        raise CREDENTIALS_EXCEPTION
    except Exception as e:
        # Log unexpected errors but don't expose details to client
        logger.error(f"Unexpected error in get_current_user: {str(e)}")
        # Log full traceback for debugging
        import traceback
        logger.error(traceback.format_exc())
        raise CREDENTIALS_EXCEPTION


async def get_current_active_user(
    current_user: UserModel = Depends(get_current_user),
) -> UserModel:
    """
    Verify the current user is active.
    
    Args:
        current_user: User from get_current_user dependency
        
    Returns:
        User: The current active user
        
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_admin_user(
    current_user: UserModel = Depends(get_current_user),
) -> UserModel:
    """
    Verify the current user is an admin.
    
    Args:
        current_user: User from get_current_user dependency
        
    Returns:
        User: The current admin user
        
    Raises:
        HTTPException: If user is not an admin
    """
    # Check if user has is_admin flag set
    if hasattr(current_user, 'is_admin') and current_user.is_admin:
        return current_user
    
    # For backwards compatibility, also check is_superuser
    if hasattr(current_user, 'is_superuser') and current_user.is_superuser:
        return current_user
        
    # Not an admin
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="The user doesn't have admin privileges"
    )