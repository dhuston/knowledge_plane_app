"""
Core authentication functionality that handles user authentication processes.
Focused on password verification and authentication modes.
"""
from typing import Optional, Tuple, Dict, Any, Union
import logging
import os
from uuid import UUID
import json

from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import EmailStr

from app.core.config import settings
from app.models.user import User as UserModel
from app.schemas.user import UserCreate
from app.schemas.token import Token
from app.schemas.auth import AuthMode
from app.crud.crud_user import user as user_crud
from app.crud.crud_tenant import tenant as tenant_crud
from app.core.token import create_access_token

# Set up logging
logger = logging.getLogger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthError(Exception):
    """Custom exception for authentication errors."""
    def __init__(self, message: str, status_code: int = 401):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


def get_auth_mode() -> AuthMode:
    """
    Determine the authentication mode based on environment and settings.
    
    Returns:
        AuthMode object with the current configuration
    """
    # Read mode from environment or config
    mode = os.getenv("AUTH_MODE", "demo" if settings.DISABLE_OAUTH else "production")
    
    # Check if OAuth is enabled
    oauth_enabled = not settings.DISABLE_OAUTH and settings.GOOGLE_CLIENT_ID is not None
    
    # Password auth is always enabled in demo mode, and optionally in production
    password_auth_enabled = mode == "demo" or os.getenv("ENABLE_PASSWORD_AUTH", "false").lower() == "true"
    
    return AuthMode(
        mode=mode,
        oauth_enabled=oauth_enabled,
        password_auth_enabled=password_auth_enabled
    )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.
    
    Args:
        plain_password: The plain text password
        hashed_password: The hashed password to compare against
        
    Returns:
        True if the password matches the hash, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: The plain text password to hash
        
    Returns:
        The hashed password
    """
    return pwd_context.hash(password)


async def authenticate_password(
    db: AsyncSession, 
    email: EmailStr, 
    password: str
) -> Tuple[UserModel, Token]:
    """
    Authenticate a user with email and password.
    
    Args:
        db: Database session
        email: User email
        password: User password
        
    Returns:
        Tuple containing the user model and tokens
        
    Raises:
        AuthError: If authentication fails
    """
    # Check if password auth is enabled
    auth_mode = get_auth_mode()
    if not auth_mode.password_auth_enabled:
        logger.warning("Password authentication attempted but not enabled")
        raise AuthError("Password authentication is not enabled")
    
    # Get user by email
    user = await user_crud.get_by_email(db, email=email)
    if not user:
        logger.warning(f"Login attempt for non-existent user: {email}")
        # Use same error message to avoid leaking user existence
        raise AuthError("Incorrect email or password")
    
    # Check if user has a password (might be OAuth-only)
    if not hasattr(user, 'hashed_password') or not user.hashed_password:
        logger.warning(f"Login attempt for OAuth-only user: {email}")
        raise AuthError("This account doesn't support password login")
    
    # Verify password
    if not verify_password(password, user.hashed_password):
        logger.warning(f"Failed password login attempt for user: {email}")
        raise AuthError("Incorrect email or password")
    
    # Password is correct, generate tokens from token module
    from app.core.token import create_access_token
    from datetime import timedelta
    
    access_token = create_access_token(user_id=user.id, tenant_id=user.tenant_id)
    refresh_token = create_access_token(
        user_id=user.id,
        tenant_id=user.tenant_id,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    
    # Update last login timestamp
    await user_crud.update_last_login(db, user_id=user.id)
    
    return user, Token(
        access_token=access_token,
        token_type="bearer",
        refresh_token=refresh_token
    )


async def create_demo_user(
    db: AsyncSession,
    email: EmailStr,
    password: str,
    name: str,
    tenant_name: Optional[str] = None,
    **additional_fields
) -> UserModel:
    """
    Create a demo user with password authentication.
    
    Args:
        db: Database session
        email: User email
        password: User password
        name: User name
        tenant_name: Optional tenant name (defaults to email domain)
        additional_fields: Additional user fields
        
    Returns:
        The created user model
    """
    # Check if we're in demo mode
    auth_mode = get_auth_mode()
    if auth_mode.mode != "demo" and not os.getenv("ALLOW_DEMO_USER_CREATION", "false").lower() == "true":
        logger.warning("Demo user creation attempted but not in demo mode")
        raise AuthError("Demo user creation is not allowed in production mode", 403)
    
    # Hash the password
    hashed_password = get_password_hash(password)
    
    # Extract domain from email or use provided tenant name
    if tenant_name:
        # Find or create tenant by name
        tenant = await tenant_crud.get_by_name(db, name=tenant_name)
        if not tenant:
            tenant = await tenant_crud.create_demo_tenant(db, name=tenant_name)
    else:
        # Use email domain to find/create tenant
        email_domain = email.split('@')[-1] if '@' in email else "demo.local"
        tenant = await tenant_crud.get_by_domain(db, domain=email_domain)
        if not tenant:
            tenant_name = email_domain.split('.')[0].capitalize()
            tenant = await tenant_crud.create_demo_tenant(
                db, name=f"{tenant_name} Demo", domain=email_domain
            )
            
    # Create the user object
    user_data = {
        "email": email,
        "name": name,
        "hashed_password": hashed_password,
        "auth_provider": "password",
        **additional_fields
    }
    user_create = UserCreate(**user_data)
    
    # Create the user
    return await user_crud.create(db, obj_in=user_create, tenant_id=tenant.id)


async def get_demo_login_token(db: AsyncSession, tenant_id: Optional[UUID] = None) -> Token:
    """
    Create or get a demo user and return login tokens.
    Used for quick demo access without requiring login.
    
    Args:
        db: Database session
        tenant_id: Optional UUID for specific tenant to login to
        
    Returns:
        Token object with access and refresh tokens
    """
    try:
        # Check if we're in demo mode
        auth_mode = get_auth_mode()
        if auth_mode.mode != "demo":
            logger.warning("Demo auto-login attempted but not in demo mode")
            raise AuthError("Auto-login is only available in demo mode", 403)
        
        logger.info("Starting demo login process")
        
        # Get or create tenant based on tenant_id if provided
        demo_tenant = None
        
        if tenant_id:
            logger.info(f"Using provided tenant ID: {tenant_id}")
            
            # Debug: List all tenants to check what's available
            from sqlalchemy import select
            from app.models.tenant import Tenant
            
            stmt = select(Tenant)
            result = await db.execute(stmt)
            all_tenants = result.scalars().all()
            tenant_ids = [str(t.id) for t in all_tenants]
            logger.info(f"DEBUG: Available tenants in DB: {len(all_tenants)} - IDs: {tenant_ids}")
            
            demo_tenant = await tenant_crud.get(db, id=tenant_id)
            if not demo_tenant:
                logger.warning(f"Tenant with ID {tenant_id} not found. Available tenant IDs: {tenant_ids}")
                # Check authentication mode
                auth_mode_info = get_auth_mode()
                logger.warning(f"Current auth mode: {auth_mode_info.mode}, OAuth enabled: {auth_mode_info.oauth_enabled}")
                raise AuthError(f"Tenant with ID {tenant_id} not found", 404)
        else:
            # Use default tenant
            logger.info("No tenant ID provided, finding or creating default tenant")
            demo_tenant = await tenant_crud.get_by_name(db, name="Biosphere Alpha")
            if not demo_tenant:
                logger.info("Creating new demo tenant")
                demo_tenant = await tenant_crud.create_demo_tenant(db, name="Biosphere Alpha")
        
        # Get or create demo user for this tenant
        email_username = demo_tenant.domain.split('.')[0] if demo_tenant.domain else "demo"
        demo_email = f"{email_username}@example.com"
        
        logger.info(f"Finding or creating demo user for tenant: {demo_tenant.name}")
        demo_user = await user_crud.get_by_email_and_tenant(db, email=demo_email, tenant_id=demo_tenant.id)
        
        if not demo_user:
            # Create a demo user with a standard password
            logger.info(f"Creating new demo user for tenant: {demo_tenant.name}")
            user_create = UserCreate(
                email=demo_email,
                name=f"{demo_tenant.name} Demo User",
                hashed_password=get_password_hash("demo12345"),
                auth_provider="password",
                title="Product Manager",
                avatar_url=f"https://i.pravatar.cc/150?u={demo_email}"
            )
            demo_user = await user_crud.create(db, obj_in=user_create, tenant_id=demo_tenant.id)
        
        # Generate tokens using the token module
        from datetime import timedelta
        
        logger.info("Generating tokens for demo user")
        access_token = create_access_token(user_id=demo_user.id, tenant_id=demo_user.tenant_id)
        refresh_token = create_access_token(
            user_id=demo_user.id,
            tenant_id=demo_user.tenant_id,
            expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        
        # Update last login timestamp
        logger.info("Updating last login timestamp")
        await user_crud.update_last_login(db, user_id=demo_user.id)
        
        logger.info(f"Demo login process completed successfully for tenant: {demo_tenant.name}")
        return Token(
            access_token=access_token,
            token_type="bearer",
            refresh_token=refresh_token
        )
    except Exception as e:
        # Enhanced error logging
        logger.error(f"Error in get_demo_login_token: {str(e)}")
        if hasattr(e, "__cause__") and e.__cause__:
            logger.error(f"Caused by: {str(e.__cause__)}")
        
        # Re-raise with a more specific error message
        if "relation" in str(e) and "does not exist" in str(e):
            logger.error("Database schema is not initialized. Run migrations first.")
            raise AuthError("Database schema not initialized. Please run migrations.", 500)
        
        # Re-raise the exception
        raise