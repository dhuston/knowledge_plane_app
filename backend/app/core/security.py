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
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")

# Pydantic model for data stored in the JWT token
class TokenData(BaseModel):
    sub: Optional[UUID] = None
    tenant_id: Optional[UUID] = None

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
    import json
    import traceback
    from datetime import datetime, timezone

    credentials_exception = CREDENTIALS_EXCEPTION
    
    # Create a dedicated auth debug logger
    auth_debug_logger = logging.getLogger("auth_debug")
    
    # Create comprehensive debug entry
    debug_entry = {
        "component": "security.get_current_user",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "token_provided": bool(token),
        "token_length": len(token) if token else 0
    }

    try:
        # Start token validation process
        debug_entry["process"] = "token_validation_started"
        
        # Log token analysis start
        auth_debug_logger.info(f"TOKEN_VALIDATION_START: {json.dumps({'token_length': len(token) if token else 0})}")
        
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        
        user_id_str: Optional[str] = payload.get("sub")
        tenant_id_str: Optional[str] = payload.get("tenant_id")
        
        # Add token payload details to debug entry
        debug_entry["token_payload"] = {
            "user_id": user_id_str,
            "tenant_id": tenant_id_str,
            "iat": payload.get("iat"),
            "exp": payload.get("exp"),
            "expires_at": datetime.fromtimestamp(payload.get("exp", 0)).isoformat() if payload.get("exp") else None,
            "is_expired": payload.get("exp", 0) < datetime.now().timestamp() if payload.get("exp") else None,
            "time_to_expiry_mins": round((payload.get("exp", 0) - datetime.now().timestamp()) / 60, 1) if payload.get("exp") else None,
            "token_fields": list(payload.keys())
        }
        
        if user_id_str is None:
            error_msg = "No user_id (sub) in token payload"
            logger.error(error_msg)
            debug_entry["error"] = error_msg
            debug_entry["status"] = "failed"
            auth_debug_logger.error(f"TOKEN_VALIDATION_ERROR: {json.dumps(debug_entry)}")
            raise credentials_exception
            
        try:
            user_id = UUID(user_id_str)
            tenant_id = UUID(tenant_id_str) if tenant_id_str else None
            
            debug_entry["parsed_ids"] = {
                "user_id": str(user_id),
                "tenant_id": str(tenant_id) if tenant_id else None
            }
        except ValueError as e:
            error_msg = f"Invalid UUID format: {e}"
            logger.error(error_msg)
            debug_entry["error"] = error_msg
            debug_entry["status"] = "failed"
            debug_entry["invalid_format"] = {
                "user_id_str": user_id_str,
                "tenant_id_str": tenant_id_str
            }
            auth_debug_logger.error(f"TOKEN_UUID_ERROR: {json.dumps(debug_entry)}")
            raise credentials_exception
            
        token_data = TokenData(sub=user_id, tenant_id=tenant_id)
        debug_entry["token_data_parsed"] = True
        
    except JWTError as e:
        error_msg = f"JWT decoding error: {e}"
        logger.error(error_msg)
        debug_entry["error"] = error_msg
        debug_entry["status"] = "failed"
        debug_entry["jwt_error"] = str(e)
        debug_entry["traceback"] = traceback.format_exc()
        auth_debug_logger.error(f"TOKEN_JWT_ERROR: {json.dumps(debug_entry)}")
        raise credentials_exception
        
    # Log detailed info about token validation
    logger.info(f"[AUTH DEBUG] Validating token for user ID: {token_data.sub}, tenant: {token_data.tenant_id}")
    debug_entry["status"] = "token_valid"
    auth_debug_logger.info(f"TOKEN_VALID: {json.dumps(debug_entry)}")
    
    # Set up new debug entry for user lookup
    user_lookup_entry = {
        "component": "security.get_current_user.user_lookup",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_id": str(token_data.sub),
        "tenant_id": str(token_data.tenant_id) if token_data.tenant_id else None
    }
    
    # Check if the user exists
    try:
        user = await crud_user.get(db, id=token_data.sub)
        
        if user is None:
            logger.error(f"[AUTH DEBUG] User with ID {token_data.sub} not found in database")
            user_lookup_entry["status"] = "user_not_found"
            user_lookup_entry["error"] = f"User with ID {token_data.sub} not found in database"
            
            # Query database directly to double check
            from sqlalchemy.future import select
            from app.models.user import User
            stmt = select(User).where(User.id == token_data.sub)
            result = await db.execute(stmt)
            direct_user = result.scalar_one_or_none()
            
            if direct_user:
                # Critical issue: User found with direct query but not with crud_user.get
                error_msg = f"CRITICAL: User found with direct query but not with crud_user.get! Email: {direct_user.email}"
                logger.error(f"[AUTH DEBUG] {error_msg}")
                
                user_lookup_entry["status"] = "critical_inconsistency"
                user_lookup_entry["error"] = error_msg
                user_lookup_entry["direct_query_user"] = {
                    "id": str(direct_user.id),
                    "email": direct_user.email,
                    "tenant_id": str(direct_user.tenant_id) if direct_user.tenant_id else None
                }
                
                auth_debug_logger.error(f"USER_LOOKUP_INCONSISTENCY: {json.dumps(user_lookup_entry)}")
            else:
                # User truly doesn't exist
                logger.error(f"[AUTH DEBUG] Confirmed user {token_data.sub} does not exist in database")
                
                # List available users for debugging
                stmt = select(User.id, User.email, User.tenant_id).limit(5)
                result = await db.execute(stmt)
                users = result.fetchall()
                if users:
                    logger.info(f"[AUTH DEBUG] Sample users in database: {users}")
                    user_lookup_entry["sample_users"] = [
                        {"id": str(u.id), "email": u.email, "tenant_id": str(u.tenant_id) if u.tenant_id else None}
                        for u in users
                    ]
                
                # Check if it's our demo user ID
                if str(token_data.sub) == "11111111-1111-1111-1111-111111111111":
                    critical_msg = "The missing user is our demo user - should have been created!"
                    logger.error(f"[AUTH DEBUG] {critical_msg}")
                    user_lookup_entry["critical_issue"] = critical_msg
                
                auth_debug_logger.error(f"USER_NOT_FOUND: {json.dumps(user_lookup_entry)}")
                
            raise credentials_exception
    except Exception as e:
        error_msg = f"Error during user lookup: {str(e)}"
        logger.error(f"[AUTH DEBUG] {error_msg}")
        
        user_lookup_entry["status"] = "database_error"
        user_lookup_entry["error"] = error_msg
        user_lookup_entry["traceback"] = traceback.format_exc()
        
        auth_debug_logger.error(f"USER_LOOKUP_ERROR: {json.dumps(user_lookup_entry)}")
        raise credentials_exception
    
    # Validate that user belongs to the tenant specified in the token
    if token_data.tenant_id and user.tenant_id and token_data.tenant_id != user.tenant_id:
        # Set up tenant mismatch debug entry
        tenant_mismatch_entry = {
            "component": "security.get_current_user.tenant_mismatch",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": str(user.id),
            "user_email": user.email,
            "user_tenant_id": str(user.tenant_id),
            "token_tenant_id": str(token_data.tenant_id),
            "auth_provider": user.auth_provider
        }
        
        logger.warning(f"[AUTH DEBUG] Token tenant_id {token_data.tenant_id} doesn't match user's tenant {user.tenant_id}")
        logger.warning(f"[AUTH DEBUG] User details - ID: {user.id}, Email: {user.email}, Provider: {user.auth_provider}")
        
        # Log token payload details for debugging
        token_debug = {key: str(value) for key, value in payload.items()}
        logger.warning(f"[AUTH DEBUG] Token raw data: {token_debug}")
        tenant_mismatch_entry["token_payload"] = token_debug
        
        # Query database to check if token's tenant exists
        from sqlalchemy.ext.asyncio import AsyncSession
        from sqlalchemy.future import select
        from app.db.session import AsyncSessionLocal
        from app.models.tenant import Tenant
        
        # Flag to track if we should allow this mismatch
        allow_mismatch = False
        tenant_name = "Unknown"
        update_user_tenant = False
        
        async with AsyncSessionLocal() as session:
            # Check if token's tenant exists
            stmt = select(Tenant.id, Tenant.name).where(Tenant.id == token_data.tenant_id)
            result = await session.execute(stmt)
            tenant = result.first()
            if tenant:
                logger.warning(f"[AUTH DEBUG] Token tenant exists in DB: {tenant.name} ({tenant.id})")
                tenant_name = tenant.name
                tenant_mismatch_entry["token_tenant_name"] = tenant.name
                tenant_mismatch_entry["token_tenant_exists"] = True
            else:
                error_msg = f"Token tenant {token_data.tenant_id} DOES NOT EXIST in database!"
                logger.error(f"[AUTH DEBUG] {error_msg}")
                tenant_mismatch_entry["token_tenant_exists"] = False
                tenant_mismatch_entry["error"] = error_msg
                
            # Check if this is a demo user
            # If it's a demo user ID, we'll be more lenient with tenant mismatches
            from hashlib import md5
            is_demo_user = False
            demo_user_reasons = []
            
            # Check if it's the default demo user
            if str(user.id) == "11111111-1111-1111-1111-111111111111":
                is_demo_user = True
                demo_user_reasons.append("standard_demo_id")
            
            # Check if it's a tenant-specific demo user (created by our fix)
            if user.auth_provider == "demo":
                is_demo_user = True
                demo_user_reasons.append("demo_provider")
            
            if user.email.startswith("demo-"):
                is_demo_user = True
                demo_user_reasons.append("demo_email")
            
            if user.name and "Demo User" in user.name:
                is_demo_user = True
                demo_user_reasons.append("demo_name")
            
            tenant_mismatch_entry["is_demo_user"] = is_demo_user
            if is_demo_user:
                tenant_mismatch_entry["demo_user_reasons"] = demo_user_reasons
            
            # For demo users, we'll automatically update their tenant to match the token
            if is_demo_user:
                logger.warning(f"[AUTH DEBUG] This is a demo user, will update tenant_id")
                allow_mismatch = True
                update_user_tenant = True
                tenant_mismatch_entry["action"] = "update_tenant"
            # For development mode, log but don't deny access
            elif getattr(settings, "DEBUG", False):
                logger.warning(f"[AUTH DEBUG] DEBUG mode enabled, allowing mismatched tenant")
                allow_mismatch = True
                tenant_mismatch_entry["action"] = "allow_due_to_debug_mode"
            
            # If we're allowing the mismatch and want to update the user's tenant
            if update_user_tenant:
                try:
                    # Update the user's tenant_id to match the token
                    from app.models.user import User
                    from sqlalchemy import update
                    update_stmt = update(User).where(User.id == user.id).values(tenant_id=token_data.tenant_id)
                    await session.execute(update_stmt)
                    await session.commit()
                    
                    # Also update the current user object to avoid future errors in this request
                    user.tenant_id = token_data.tenant_id
                    
                    logger.warning(f"[AUTH DEBUG] Updated demo user tenant from {user.tenant_id} to {token_data.tenant_id}")
                    tenant_mismatch_entry["tenant_updated"] = True
                    tenant_mismatch_entry["new_tenant_id"] = str(token_data.tenant_id)
                    
                    # Update the user's name to include the tenant name
                    if tenant_name != "Unknown":
                        from datetime import datetime, timezone
                        name_prefix = "Demo User"
                        if user.name and user.name.startswith(name_prefix):
                            update_stmt = update(User).where(User.id == user.id).values(
                                name=f"{name_prefix} ({tenant_name})",
                                last_login_at=datetime.now(timezone.utc)
                            )
                            await session.execute(update_stmt)
                            await session.commit()
                            logger.warning(f"[AUTH DEBUG] Updated user name to include tenant")
                            tenant_mismatch_entry["name_updated"] = True
                            tenant_mismatch_entry["new_name"] = f"{name_prefix} ({tenant_name})"
                except Exception as e:
                    error_msg = f"Error updating user tenant: {str(e)}"
                    logger.error(f"[AUTH DEBUG] {error_msg}")
                    tenant_mismatch_entry["tenant_update_error"] = error_msg
                    tenant_mismatch_entry["update_error_traceback"] = traceback.format_exc()
        
        # Decide whether to allow or reject the authentication
        if allow_mismatch:
            logger.warning(f"[AUTH DEBUG] Allowing mismatched tenant for user")
            tenant_mismatch_entry["decision"] = "allowed"
            auth_debug_logger.warning(f"TENANT_MISMATCH_ALLOWED: {json.dumps(tenant_mismatch_entry)}")
        else:
            error_msg = "REJECTING authentication due to tenant mismatch"
            logger.error(f"[AUTH DEBUG] {error_msg}")
            tenant_mismatch_entry["decision"] = "rejected"
            tenant_mismatch_entry["error"] = error_msg
            auth_debug_logger.error(f"TENANT_MISMATCH_REJECTED: {json.dumps(tenant_mismatch_entry)}")
            raise credentials_exception
    
    return user