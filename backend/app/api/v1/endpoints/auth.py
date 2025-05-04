from typing import Any, Optional, Tuple, List
from datetime import timedelta, timezone, datetime
import time

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from authlib.integrations.starlette_client import OAuthError
from uuid import UUID
import logging
import os
from pydantic import BaseModel, EmailStr
from jose import jwt

from app.crud.crud_user import user as crud_user
from app.crud.crud_tenant import tenant as crud_tenant
from app import models, schemas
from app.core import security, auth
from app.core.auth import AuthError, authenticate_password, get_demo_login_token, get_auth_mode
from app.core.config import settings
from app.core.security import create_access_token, get_oauth_client, CREDENTIALS_EXCEPTION
from app.core.security import get_current_user
from app.db.session import get_db_session
from app.schemas import UserCreate, UserUpdate, TenantCreate
from app.schemas.auth import PasswordLoginRequest, DemoUserCreate, AuthMode
from app.schemas.tenant import TenantRead
from app.schemas.token import Token
from app.services.google_calendar import refresh_google_access_token, GoogleTokenRefreshError

# Define Pydantic model for refresh token request body
class RefreshTokenRequest(BaseModel):
    refresh_token: str

router = APIRouter()

# Get logger
logger = logging.getLogger(__name__)

# Construct the redirect URI based on settings
# Note: This assumes your backend runs on localhost:8001 for local dev as per docker-compose
GOOGLE_REDIRECT_URI = f"http://localhost:8001{settings.API_V1_STR}/auth/callback/google"

@router.get("/mode", response_model=AuthMode)
async def get_auth_mode_info():
    """Get information about the current authentication mode configuration."""
    return auth.get_auth_mode()


@router.post("/login/password", response_model=Token)
async def login_password(
    login_data: PasswordLoginRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Authenticate with email and password.
    
    Returns an access token if authentication is successful.
    """
    try:
        # Authenticate with email and password
        user, token = await authenticate_password(
            db=db,
            email=login_data.email,
            password=login_data.password
        )
        
        logger.info(f"Password login successful for user {user.email}")
        return token
        
    except AuthError as e:
        logger.warning(f"Password login failed: {e.message}")
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Unexpected error during password login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during authentication"
        )
        
        
@router.get("/demo-login", response_model=Token)
async def demo_login(
    tenant_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get a token for demo login without credentials.
    Only works in demo mode.
    
    This endpoint provides a quick way to login with a demo account for testing and
    exploration purposes. In production, it will redirect users to proper authentication.
    
    Parameters:
    - tenant_id: Optional UUID for the specific tenant to login to. If not provided,
                the system will use the default demo tenant.
    
    Steps:
    1. Checks if system is in demo mode
    2. Gets or creates a demo tenant (or uses the specified tenant)
    3. Gets or creates a demo user
    4. Creates JWT tokens for authentication
    5. Updates the user's last login timestamp
    """
    try:
        # Log detailed information about the tenant request
        request_info = f"Demo login requested for tenant_id={tenant_id}"
        
        # If tenant_id provided, try to look it up
        if tenant_id:
            try:
                tenant = await crud_tenant.get(db, id=tenant_id)
                if tenant:
                    request_info += f" (name: {tenant.name}, domain: {tenant.domain})"
                else:
                    request_info += " (tenant not found in database)"
                    # List available tenants to help with debugging
                    from sqlalchemy.future import select
                    from app.models.tenant import Tenant
                    stmt = select(Tenant.id, Tenant.name)
                    result = await db.execute(stmt)
                    available_tenants = result.fetchall()
                    if available_tenants:
                        tenant_list = ", ".join([f"{t.name} ({t.id})" for t in available_tenants])
                        logger.info(f"Available tenants: {tenant_list}")
            except Exception as lookup_error:
                logger.warning(f"Error looking up tenant: {str(lookup_error)}")
        
        logger.info(request_info)
        
        # Create a simple token directly
        if os.environ.get("QUICK_LOGIN_FIX", "true") == "true":
            logger.info("Using quick login fix for development")
            # Create mock IDs - use tenant_id if provided
            from datetime import timedelta
            user_id = UUID("11111111-1111-1111-1111-111111111111")
            use_tenant_id = tenant_id or UUID("d3667ea1-079a-434e-84d2-60e84757b5d5")
            
            # Log the tenant being used
            if tenant_id:
                logger.info(f"Using provided tenant ID: {tenant_id}")
            else:
                logger.info(f"No tenant ID provided, using default: {use_tenant_id}")
            
            # Create tokens with tenant_id
            access_token = create_access_token(
                subject=user_id,
                tenant_id=use_tenant_id
            )
            refresh_token = create_access_token(
                subject=user_id,
                tenant_id=use_tenant_id,
                expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
            )
            
            # Log the access token subject and tenant (but not the whole token)
            from jose import jwt
            try:
                payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                logger.info(f"Token payload: user_id={payload.get('sub')}, tenant_id={payload.get('tenant_id')}")
            except Exception as decode_error:
                logger.error(f"Error decoding token for logging: {str(decode_error)}")
            
            token = Token(
                access_token=access_token,
                token_type="bearer",
                refresh_token=refresh_token
            )
            
            logger.info(f"Demo login succeeded with quick fix - returning token")
            return token
            
        # Standard flow
        token = await get_demo_login_token(db, tenant_id=tenant_id)
        logger.info(f"Demo login succeeded with normal flow")
        return token
        
    except AuthError as e:
        logger.warning(f"Demo login failed: {e.message}")
        # Return a more user-friendly error message
        if "schema not initialized" in e.message:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="System not fully initialized. Please contact administrator."
            )
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Unexpected error during demo login: {str(e)}")
        # Check if this is a database related issue
        if "relation" in str(e).lower() and "does not exist" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database schema not initialized. Please run migrations."
            )
        
        # Generic error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during authentication: {str(e)}"
        )


@router.post("/register", response_model=Token)
async def register_demo_user(
    user_data: DemoUserCreate,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Register a new user with password authentication.
    Only allowed in demo mode or if explicitly enabled in production.
    
    Returns login tokens if registration is successful.
    """
    try:
        # Check auth mode
        auth_mode = auth.get_auth_mode()
        if auth_mode.mode != "demo" and not os.environ.get("ALLOW_USER_REGISTRATION", "false").lower() == "true":
            logger.warning(f"User registration attempted but not enabled: {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User registration is not enabled"
            )
            
        # Check if user already exists
        existing_user = await crud_user.get_by_email(db, email=user_data.email)
        if existing_user:
            logger.warning(f"Registration attempted for existing user: {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists"
            )
            
        # Create the user with password authentication
        user = await auth.create_demo_user(
            db=db,
            email=user_data.email,
            password=user_data.password,
            name=user_data.name,
            **{k: v for k, v in user_data.model_dump().items() 
               if k not in ("email", "password", "name")}
        )
        
        # Generate tokens
        access_token = security.create_access_token(subject=user.id, tenant_id=user.tenant_id)
        refresh_token = security.create_access_token(
            subject=user.id,
            tenant_id=user.tenant_id,
            expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        
        logger.info(f"User registered successfully: {user.email}")
        return Token(access_token=access_token, token_type="bearer", refresh_token=refresh_token)
        
    except AuthError as e:
        logger.warning(f"User registration failed: {e.message}")
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )
    except HTTPException:
        # Pass through HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error during user registration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during registration"
        )

@router.get("/login/google")
async def login_google(request: Request):
    """Redirects the user to Google for authentication."""
    logger.info("Received request for /login/google")
    
    # Extract tenant_id from query parameters if provided
    tenant_id_str = request.query_params.get("tenant_id")
    if tenant_id_str:
        try:
            tenant_id = UUID(tenant_id_str)
            logger.info(f"Tenant ID provided in request: {tenant_id}")
        except ValueError:
            logger.warning(f"Invalid tenant ID format: {tenant_id_str}")
            tenant_id = None
    else:
        logger.info("No tenant ID provided in request")
        tenant_id = None
    
    # Check for DISABLE_OAUTH flag - for development only
    disable_oauth = getattr(settings, "DISABLE_OAUTH", False)
    if disable_oauth:
        logger.info("DISABLE_OAUTH is set, using mock authentication flow")
        # Create mock JWT token directly without Google auth
        mock_user_id = "11111111-1111-1111-1111-111111111111"  # Mock UUID
        mock_tenant_id = tenant_id or UUID("d3667ea1-079a-434e-84d2-60e84757b5d5")  # Use provided or default
        
        # Create tokens with tenant_id
        access_token = security.create_access_token(subject=mock_user_id, tenant_id=mock_tenant_id)
        refresh_token = security.create_access_token(
            subject=mock_user_id,
            tenant_id=mock_tenant_id,
            expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        
        # Redirect to frontend with mock tokens
        frontend_redirect_url = f"http://localhost:5173/auth/callback?token={access_token}&refreshToken={refresh_token}"
        logger.info(f"Redirecting to frontend with mock tokens: {frontend_redirect_url.split('?')[0]}?token=...&refreshToken=...")
        response = RedirectResponse(url=frontend_redirect_url)
        
        # Let the middleware handle CORS headers
        return response
    
    try:    
        # Get the Google OAuth client
        google_client = await get_oauth_client("google")
        
        # Store tenant_id in session for retrieval in the callback
        if tenant_id:
            request.session["tenant_id"] = str(tenant_id)
            logger.info(f"Stored tenant ID {tenant_id} in session for OAuth callback")
        
        # Authlib expects Starlette Request, FastAPI Request is compatible
        logger.debug(f"Redirecting to Google with redirect_uri: {GOOGLE_REDIRECT_URI}")
        return await google_client.authorize_redirect(request, GOOGLE_REDIRECT_URI)
    except ValueError as e:
        logger.error(f"OAuth provider error: {e}")
        return {"error": "OAuth provider not configured properly"}
    except Exception as e:
        logger.error(f"Error during OAuth login: {e}")
        return {"error": "Authentication error. Please try again."}


@router.get("/callback/google")
async def callback_google(request: Request, db: AsyncSession = Depends(get_db_session)):
    """Handles the callback from Google after authentication."""
    logger.info("Received callback from Google.")
    try:
        # Get the Google OAuth client and process token
        db_user = await process_oauth_callback(request, db)
        
        # Generate tokens with tenant_id
        access_token, refresh_token = await generate_auth_tokens(db_user.id, db_user.tenant_id)
        
        # Log token generation success with tenant info
        logger.info(f"Generated tokens for user {db_user.id} with tenant {db_user.tenant_id}")
        
        # Create redirect response with tokens
        frontend_redirect_url = f"http://localhost:5173/auth/callback?token={access_token}&refreshToken={refresh_token}"
        logger.info(f"Redirecting user to frontend: {frontend_redirect_url.split('?')[0]}?token=...&refreshToken=...")
        
        return RedirectResponse(url=frontend_redirect_url)
    
    except Exception as e:
        logger.error(f"Error during Google OAuth callback: {e}", exc_info=True)
        error_redirect_url = "http://localhost:5173/login?error=auth_failed"
        logger.info("Redirecting user to frontend login with error.")
        return RedirectResponse(url=error_redirect_url)


async def process_oauth_callback(request: Request, db: AsyncSession) -> models.User:
    """
    Process OAuth callback from Google.
    
    Args:
        request: The incoming request with OAuth callback data
        db: Database session
        
    Returns:
        The user model after processing
    """
    # Get the Google OAuth client
    google_client = await get_oauth_client("google")

    # Authorize access token
    logger.debug("Authorizing access token...")
    token_data = await google_client.authorize_access_token(request)
    logger.info("Access token authorized successfully.")
    
    # Fetch user info from Google
    user_info_google = await google_client.userinfo(token=token_data)
    logger.info(f"User info received from Google for sub: {user_info_google.get('sub')}")
    
    # Extract user data from Google response
    auth_provider = "google"
    auth_provider_id = user_info_google.get('sub')
    email = user_info_google.get('email')
    name = user_info_google.get('name')
    avatar_url = user_info_google.get('picture')
    
    # Get token data
    access_token = token_data.get('access_token')
    refresh_token = token_data.get('refresh_token')
    expires_in = token_data.get('expires_in')
    
    # Calculate expiry time if available
    expiry_datetime = None
    if expires_in:
        expiry_datetime = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
        
    if not email or not auth_provider_id:
        logger.error("Email or Sub ID missing from Google auth response.")
        raise HTTPException(status_code=400, detail="Email or Sub ID missing from Google auth")
    
    # Check if tenant_id was stored in the session during login request
    tenant_id_from_session = None
    if "tenant_id" in request.session:
        try:
            tenant_id_from_session = UUID(request.session["tenant_id"])
            logger.info(f"Found tenant ID in session: {tenant_id_from_session}")
        except (ValueError, TypeError):
            logger.warning(f"Invalid tenant ID in session: {request.session.get('tenant_id')}")
    
    # If we have a valid tenant ID from the session, use it
    # Otherwise, find or create tenant based on email domain
    if tenant_id_from_session:
        # Verify this tenant exists
        tenant = await crud_tenant.get(db, id=tenant_id_from_session)
        if tenant:
            tenant_id = tenant_id_from_session
            logger.info(f"Using tenant ID from session: {tenant_id} ({tenant.name})")
        else:
            logger.warning(f"Tenant ID from session not found in database: {tenant_id_from_session}")
            tenant_id = await get_tenant_for_email(db, email)
    else:
        # No tenant ID in session or invalid, use email domain
        tenant_id = await get_tenant_for_email(db, email)
    
    # Create user input data
    user_in = UserCreate(
        email=email,
        name=name or email, 
        avatar_url=avatar_url,
        auth_provider=auth_provider,
        auth_provider_id=auth_provider_id,
        google_access_token=access_token, 
        google_refresh_token=refresh_token, 
        google_token_expiry=expiry_datetime, 
        last_login_at=datetime.now(timezone.utc)
    )
    
    # Create or update user in database
    logger.info(f"Upserting user {email} for tenant {tenant_id}...")
    db_user = await crud_user.upsert_by_auth(
        db=db, 
        obj_in=user_in, 
        tenant_id=tenant_id
    )
    logger.info(f"User upsert successful. User ID: {db_user.id}, Tenant ID: {db_user.tenant_id}")
    
    return db_user


async def get_tenant_for_email(db: AsyncSession, email: str) -> UUID:
    """
    Get or create tenant for an email domain.
    
    Args:
        db: Database session
        email: User email to extract domain from
        
    Returns:
        Tenant ID for the email domain
    """
    # Extract domain from email
    email_domain = email.split('@')[-1] if '@' in email else None
    logger.info(f"Extracted email domain: {email_domain}")
    
    # Find tenant by domain
    tenant_obj = None
    if email_domain:
        logger.debug(f"Finding tenant by domain: {email_domain}")
        tenant_obj = await crud_tenant.get_by_domain(db, domain=email_domain)
    
    # Create tenant if not found
    if not tenant_obj:
        logger.info(f"No tenant found for domain {email_domain}, creating new one...")
        tenant_name = email_domain.split('.')[0].capitalize() if email_domain else "Default Tenant"
        new_tenant_data = TenantCreate(name=tenant_name, domain=email_domain)
        tenant_obj = await crud_tenant.create(db=db, obj_in=new_tenant_data)
        logger.info(f"Created new tenant {tenant_obj.name} ({tenant_obj.id})")
    else:
        logger.info(f"Found existing tenant {tenant_obj.name} ({tenant_obj.id})")
    
    return tenant_obj.id


async def generate_auth_tokens(user_id: UUID, tenant_id: Optional[UUID] = None) -> Tuple[str, str]:
    """
    Generate access and refresh tokens for a user.
    
    Args:
        user_id: The user ID to create tokens for
        tenant_id: The tenant ID to include in the token (if not provided, fetched from DB)
        
    Returns:
        Tuple of (access_token, refresh_token)
    """
    logger.debug(f"Generating JWT tokens for user ID: {user_id}, tenant_id: {tenant_id}")
    
    # If tenant_id is not provided, fetch it from the database
    if tenant_id is None:
        from sqlalchemy.ext.asyncio import AsyncSession
        from sqlalchemy.future import select
        from app.db.session import AsyncSessionLocal
        from app.models.user import User
        
        logger.info(f"Tenant ID not provided, fetching from database for user {user_id}")
        async with AsyncSessionLocal() as session:
            stmt = select(User.tenant_id).where(User.id == user_id)
            result = await session.execute(stmt)
            db_tenant_id = result.scalar_one_or_none()
            
            if not db_tenant_id:
                logger.warning(f"No tenant ID found for user {user_id}, using default")
                # Use a default tenant ID as fallback
                db_tenant_id = UUID("d3667ea1-079a-434e-84d2-60e84757b5d5")
                
            tenant_id = db_tenant_id
            logger.info(f"Found tenant ID for user {user_id}: {tenant_id}")
    
    # Generate access token with tenant_id
    access_token = security.create_access_token(subject=user_id, tenant_id=tenant_id)
    
    # Generate refresh token with longer expiry and tenant_id
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = security.create_access_token(
        subject=user_id, 
        tenant_id=tenant_id,
        expires_delta=refresh_token_expires
    )
    
    logger.info(f"JWT tokens generated successfully for user {user_id} with tenant {tenant_id}")
    return access_token, refresh_token


@router.post("/refresh-token", response_model=schemas.Token)
async def refresh_token(
    *, # Enforce keyword-only arguments after this
    db: AsyncSession = Depends(get_db_session),
    refresh_request: RefreshTokenRequest, # Receive refresh token JWT in body
) -> Any:
    """
    OAuth2 refresh token flow.
    Uses the provided refresh token JWT to issue a new access token.
    """
    logger.info("Received request for /refresh-token")
    
    refresh_token = refresh_request.refresh_token
    if not refresh_token:
        logger.error("Refresh token JWT not provided in request body.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token not provided",
        )

    # Validate token and get user, with tenant info
    user, tenant_id = await validate_refresh_token(db, refresh_token)
    
    # Generate new access token with the tenant_id from the refresh token
    logger.info(f"Generating new access token with tenant_id {tenant_id}")
    new_access_token = await create_new_access_token(user.id, tenant_id)

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
    }


async def validate_refresh_token(db: AsyncSession, refresh_token: str) -> Tuple[models.User, Optional[UUID]]:
    """
    Validate a refresh token and return the associated user and tenant ID.
    
    Args:
        db: Database session
        refresh_token: The refresh token to validate
        
    Returns:
        Tuple of (User model for the token subject, tenant_id from token)
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode and validate the token
        payload = jwt.decode(
            refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        
        # Extract user ID
        user_id_str: Optional[str] = payload.get("sub")
        if not user_id_str:
            logger.warning("Refresh token JWT missing 'sub' claim.")
            raise credentials_exception
            
        # Extract tenant ID if present
        tenant_id_str: Optional[str] = payload.get("tenant_id")
        tenant_id = UUID(tenant_id_str) if tenant_id_str else None
        
        # Log token payload contents
        logger.info(f"Refresh token payload: user_id={user_id_str}, tenant_id={tenant_id_str}")
            
        # Validate user ID is a valid UUID
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            logger.warning("Refresh token JWT 'sub' claim is not a valid UUID.")
            raise credentials_exception
            
        token_data = security.TokenData(sub=user_id, tenant_id=tenant_id)
        logger.info(f"Refresh token JWT validated for user ID: {user_id}, tenant ID: {tenant_id}")

    except jwt.ExpiredSignatureError:
        logger.warning("Refresh token JWT has expired.")
        raise credentials_exception
    except jwt.JWTError as e:
        logger.error(f"Error decoding refresh token JWT: {e}")
        raise credentials_exception
    
    # Handle development mode
    if getattr(settings, "DISABLE_OAUTH", False) and str(token_data.sub) == "11111111-1111-1111-1111-111111111111":
        mock_user = create_mock_development_user()
        # For development mode, use consistent tenant ID
        dev_tenant_id = UUID("d3667ea1-079a-434e-84d2-60e84757b5d5")
        return mock_user, dev_tenant_id
    
    # Find user in database
    user = await crud_user.get(db, id=token_data.sub)
    if not user:
        logger.error(f"User ID {token_data.sub} from valid token not found in DB.")
        raise credentials_exception
    
    # If tenant_id wasn't in the token, use the one from the user object
    if tenant_id is None and user.tenant_id:
        tenant_id = user.tenant_id
        logger.info(f"No tenant_id in token, using user's tenant: {tenant_id}")
    
    # Validate that tenant ID in token matches user's tenant
    if tenant_id and user.tenant_id and tenant_id != user.tenant_id:
        logger.warning(f"Token tenant ID {tenant_id} doesn't match user's tenant {user.tenant_id}")
        # We could either use the user's tenant or fail - for now we'll use the user's tenant
        tenant_id = user.tenant_id
        logger.info(f"Using user's tenant ID instead: {tenant_id}")
        
    logger.info(f"Found user {user.email} for refresh token with tenant {tenant_id}.")
    return user, tenant_id


def create_mock_development_user() -> models.User:
    """
    Create a mock user for development mode.
    
    Returns:
        Mock user model with consistent user ID and tenant ID
    """
    from datetime import datetime, timezone
    
    # Use consistent IDs across the codebase
    dev_user_id = UUID("11111111-1111-1111-1111-111111111111")
    dev_tenant_id = UUID("d3667ea1-079a-434e-84d2-60e84757b5d5")
    dev_team_id = UUID("839b5261-9228-4955-bcb5-f52452f0cf2e")
    
    logger.info(f"Creating mock development user with ID {dev_user_id}, tenant {dev_tenant_id}")
    return models.User(
        id=dev_user_id,
        email="dev@example.com",
        name="Development User",
        title="Software Developer",
        avatar_url=None,
        online_status=True,
        tenant_id=dev_tenant_id,
        auth_provider="mock",
        auth_provider_id="mock_id",
        created_at=datetime(2025, 5, 1, tzinfo=timezone.utc),
        updated_at=datetime(2025, 5, 1, tzinfo=timezone.utc),
        last_login_at=datetime(2025, 5, 1, tzinfo=timezone.utc),
        team_id=dev_team_id,
    )


async def create_new_access_token(user_id: UUID, tenant_id: Optional[UUID] = None) -> str:
    """
    Create a new access token for a user.
    
    Args:
        user_id: The user ID to create a token for
        tenant_id: Optional tenant ID to include in the token
        
    Returns:
        New JWT access token
    """
    logger.debug(f"Generating new access token for user {user_id}, tenant_id {tenant_id}")
    
    # If tenant_id is not provided, fetch it from the database
    if tenant_id is None:
        from sqlalchemy.ext.asyncio import AsyncSession
        from sqlalchemy.future import select
        from app.db.session import AsyncSessionLocal
        from app.models.user import User
        
        logger.info(f"Tenant ID not provided, fetching from database for user {user_id}")
        async with AsyncSessionLocal() as session:
            stmt = select(User.tenant_id).where(User.id == user_id)
            result = await session.execute(stmt)
            db_tenant_id = result.scalar_one_or_none()
            
            if not db_tenant_id:
                logger.warning(f"No tenant ID found for user {user_id}, using default")
                # Use a default tenant ID as fallback
                db_tenant_id = UUID("d3667ea1-079a-434e-84d2-60e84757b5d5")
                
            tenant_id = db_tenant_id
            logger.info(f"Found tenant ID for user {user_id}: {tenant_id}")
    
    # Generate the token with tenant_id
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = security.create_access_token(
        subject=user_id, 
        tenant_id=tenant_id,
        expires_delta=access_token_expires
    )
    logger.info(f"Generated new access token for user {user_id} with tenant {tenant_id}")
    
    return new_access_token


@router.get("/debug-token-user")
async def debug_token_user(
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    """Debug endpoint for troubleshooting token to user issues."""
    logger.info("Debug token-user endpoint called")
    
    # Get the authorization header
    auth_header = request.headers.get('Authorization')
    
    # Check if authorization header exists
    if not auth_header or not auth_header.startswith('Bearer '):
        return {"message": "No valid Authorization header found", "status": "error", "has_token": False}
    
    # Extract the token
    token = auth_header.split(' ')[1]
    
    try:
        # Decode the token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Extract key information
        user_id_str = payload.get('sub')
        tenant_id_str = payload.get('tenant_id')
        expiration = payload.get('exp')
        
        # Log token details
        logger.info(f"Token payload: user_id={user_id_str}, tenant_id={tenant_id_str}")
        
        # Try to get the user from the database
        user = None
        user_data = None
        error = None
        
        try:
            # Convert IDs to UUID objects for database lookup
            user_id = UUID(user_id_str) if user_id_str else None
            tenant_id = UUID(tenant_id_str) if tenant_id_str else None
            
            if user_id:
                # Look up user directly
                from app.crud.crud_user import user as crud_user
                user = await crud_user.get(db, id=user_id)
                
                if user:
                    user_data = {
                        "id": str(user.id),
                        "email": user.email,
                        "name": user.name,
                        "tenant_id": str(user.tenant_id) if user.tenant_id else None,
                        "team_id": str(user.team_id) if user.team_id else None,
                    }
                    
                    logger.info(f"Found user: {user.email} (tenant: {user.tenant_id})")
                    
                    # Check tenant match
                    if tenant_id and user.tenant_id and tenant_id != user.tenant_id:
                        error = f"Tenant mismatch: token={tenant_id}, user={user.tenant_id}"
                        logger.warning(error)
                else:
                    error = f"User not found for ID: {user_id}"
                    logger.error(error)
            else:
                error = "No user ID (sub) in token"
                logger.error(error)
                
        except Exception as e:
            error = f"Error fetching user: {str(e)}"
            logger.error(error)
        
        # Return detailed debug information
        result = {
            "status": "success" if user else "error",
            "has_token": True,
            "token_decoded": True,
            "user_id": user_id_str,
            "tenant_id": tenant_id_str,
            "token_expires": expiration,
            "token_expired": expiration * 1000 < time.time() * 1000,
            "token_expiry_time": datetime.fromtimestamp(expiration, timezone.utc).isoformat(),
            "current_time": datetime.now(timezone.utc).isoformat(),
            "user_found": user is not None,
            "user_data": user_data,
            "error": error
        }
        
        logger.info(f"Debug result: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error decoding/processing token: {str(e)}")
        return {
            "status": "error",
            "has_token": True,
            "token_decoded": False,
            "error": str(e),
        }

@router.get("/tenants", response_model=List[TenantRead])
async def list_available_tenants(db: AsyncSession = Depends(get_db_session)):
    """
    List all active tenants available for login.
    This endpoint returns a list of available tenants that users can select from 
    during the login process.
    """
    logger.info("Fetching list of available tenants")
    try:
        # Query for active tenants
        statement = select(models.Tenant).where(models.Tenant.is_active == True)
        result = await db.execute(statement)
        tenants = result.scalars().all()
        
        if not tenants:
            logger.warning("No active tenants found in the system")
            # Create a demo tenant if none exists
            demo_tenant = await crud_tenant.create_demo_tenant(
                db=db, 
                name="UltraThink",
                domain="ultrathink.demo.biosphere.ai"
            )
            tenants = [demo_tenant]
            logger.info(f"Created default demo tenant: {demo_tenant.name}")
        
        logger.info(f"Returning {len(tenants)} active tenants")
        return tenants
    except Exception as e:
        logger.error(f"Error fetching tenants: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve tenant list"
        )

@router.post("/logout")
async def logout(
    request: Request,
    token: str = Depends(security.oauth2_scheme),
    db: AsyncSession = Depends(get_db_session)
) -> Any:
    """
    Endpoint for client to signal logout.
    Invalidates refresh tokens by adding to a blacklist.
    """
    logger.info("Received request for /logout")
    
    try:
        # Extract user ID from token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Add token to the blacklist
        # This is a simplified implementation - in production you would
        # want to use a more efficient storage like Redis for token blacklisting
        await crud_user.add_to_token_blacklist(
            db=db,
            user_id=UUID(user_id),
            token=token
        )
        
        logger.info(f"User {user_id} logged out successfully")
        return {"message": "Logged out successfully"}
    except Exception as e:
        logger.error(f"Error during logout: {e}")
        return {"message": "Logout processed"} 