from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
from uuid import UUID
import logging

from jose import jwt
from passlib.context import CryptContext
from authlib.integrations.starlette_client import OAuth
from app.core.config import settings
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, UUID4
from sqlalchemy.ext.asyncio import AsyncSession

# Import DB session and user CRUD/model
from app.db.session import get_db_session
from app.models.user import User as UserModel
from app.core.oauth_provider import (
    OAuthProviderConfig,
    OAuthProvider,
    get_oauth_registry
)

# Get logger
logger = logging.getLogger(__name__)

# Password hashing context (if using password auth later)
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configure Authlib OAuth client
oauth = OAuth()

# Reusable HTTPException for credential errors
CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
SECRET_KEY = settings.SECRET_KEY

# Define the OAuth2 scheme
# The tokenUrl should point to where a user would theoretically get a token
# (e.g., a password login endpoint, which we don't have yet for JWT directly).
# For now, we get tokens via Google OAuth callback.
# The /api/v1 prefix comes from main.py where the router is included.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token") # Placeholder URL

# Pydantic model for data stored in the JWT token
class TokenData(BaseModel):
    sub: Optional[UUID] = None  # Use UUID instead of UUID4 for flexibility
    tenant_id: Optional[UUID] = None  # Tenant ID for isolation

async def initialize_oauth() -> None:
    """Initialize OAuth providers from the registry."""
    logger.info("Initializing OAuth providers")
    
    # Register Google provider if enabled
    if not getattr(settings, "DISABLE_OAUTH", False) and settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
        logger.info("Registering Google OAuth provider")
        
        # Check if the provider is already registered
        registry = get_oauth_registry()
        if "google" not in registry.providers:
            logger.debug("Creating Google OAuth provider config")
            google_config = OAuthProviderConfig(
                name="google",
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
                server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
                scopes=["openid", "email", "profile", "https://www.googleapis.com/auth/calendar.events.readonly"]
            )
            
            provider = OAuthProvider(config=google_config)
            registry.add_provider(provider)
    
    # Register all providers with the OAuth instance
    try:
        registry = get_oauth_registry()
        logger.info(f"Registering {len(registry.providers)} OAuth providers")
        await registry.register_all(oauth)
        logger.info("OAuth providers registered successfully")
    except Exception as e:
        logger.error(f"Error registering OAuth providers: {e}")
        # In development mode, this is not fatal
        if not getattr(settings, "DISABLE_OAUTH", False):
            raise

async def get_oauth_client(provider_name: str) -> Any:
    """Get an OAuth client by name."""
    # Make sure the provider exists in the registry
    registry = get_oauth_registry()
    if provider_name not in registry.providers:
        raise ValueError(f"OAuth provider not found: {provider_name}")
        
    # Make sure the OAuth client is available
    if not hasattr(oauth, provider_name):
        raise ValueError(f"OAuth client not initialized: {provider_name}")
        
    return getattr(oauth, provider_name)

def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None, tenant_id: Optional[Union[UUID, str]] = None
) -> str:
    """
    Creates a JWT access token.
    
    Args:
        subject: The subject (user ID) for the token
        expires_delta: Optional custom expiration time
        tenant_id: Optional tenant ID to include in the token
        
    Returns:
        str: The encoded JWT token
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    # Create token payload
    to_encode = {"exp": expire, "sub": str(subject)}
    
    # Add tenant_id if provided
    if tenant_id:
        to_encode["tenant_id"] = str(tenant_id)
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    db: AsyncSession = Depends(get_db_session),
    token: str = Depends(oauth2_scheme)
) -> UserModel:
    """Dependency to verify JWT and return the current user."""
    from app.crud.crud_user import user as crud_user
    from jose import JWTError

    credentials_exception = CREDENTIALS_EXCEPTION
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id_str: Optional[str] = payload.get("sub")
        tenant_id_str: Optional[str] = payload.get("tenant_id")
        
        if user_id_str is None:
            raise credentials_exception
            
        try:
            user_id = UUID(user_id_str)
            tenant_id = UUID(tenant_id_str) if tenant_id_str else None
        except ValueError:
            raise credentials_exception
            
        token_data = TokenData(sub=user_id, tenant_id=tenant_id)
    except JWTError as e:
        raise credentials_exception
        
    # Check for development mode with disabled OAuth
    if getattr(settings, "DISABLE_OAUTH", False) and user_id_str == "11111111-1111-1111-1111-111111111111":
        # Create a complete mock user for development purposes with all required fields
        from datetime import datetime, timezone
        mock_user = UserModel(
            id=UUID("11111111-1111-1111-1111-111111111111"),
            email="dev@example.com",
            name="Development User",
            title="Software Developer",
            avatar_url=None,
            online_status=True,
            tenant_id=UUID("22222222-2222-2222-2222-222222222222"),
            auth_provider="mock",
            auth_provider_id="mock_id",
            created_at=datetime(2025, 5, 1, tzinfo=timezone.utc),
            updated_at=datetime(2025, 5, 1, tzinfo=timezone.utc),
            last_login_at=datetime(2025, 5, 1, tzinfo=timezone.utc),
            team_id=UUID("22222222-2222-2222-2222-222222222222"),
        )
        return mock_user
        
    user = await crud_user.get(db, id=token_data.sub)
    if user is None:
        raise credentials_exception
    
    return user


# This function is no longer needed as we're using proper database authentication
# It has been kept in the codebase but renamed to indicate it shouldn't be used
async def _deprecated_get_current_user_or_dev(
    db: AsyncSession = Depends(get_db_session),
    token: str = Depends(oauth2_scheme)
) -> UserModel:
    """
    DEPRECATED: Use get_current_user instead. 
    This function is kept for reference but should not be used in production code.
    """
    # Just delegate to the standard user authentication
    logger.info("Using standard authentication path")
    return await get_current_user(db, token)