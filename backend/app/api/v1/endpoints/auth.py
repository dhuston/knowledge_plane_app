from typing import Any, Optional, Tuple
from datetime import timedelta, timezone, datetime

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm # If we ever add password flow
from sqlalchemy.ext.asyncio import AsyncSession
from authlib.integrations.starlette_client import OAuthError
from uuid import UUID
import logging
from pydantic import BaseModel # Import BaseModel from pydantic
from jose import jwt

from app.crud.crud_user import user as crud_user
from app.crud.crud_tenant import tenant as crud_tenant
from app import models, schemas
from app.core import security
from app.core.config import settings
from app.core.security import create_access_token, get_oauth_client, CREDENTIALS_EXCEPTION # Updated imports
from app.core.security import get_current_user
from app.db.session import get_db_session
from app.schemas import UserCreate, UserUpdate, TenantCreate
from app.services.google_calendar import refresh_google_access_token, GoogleTokenRefreshError

# Define Pydantic model for refresh token request body
class RefreshTokenRequest(BaseModel): # Inherit from pydantic.BaseModel
    refresh_token: str

router = APIRouter()

# Get logger
logger = logging.getLogger(__name__)

# Construct the redirect URI based on settings
# Note: This assumes your backend runs on localhost:8001 for local dev as per docker-compose
GOOGLE_REDIRECT_URI = f"http://localhost:8001{settings.API_V1_STR}/auth/callback/google"

@router.get("/login/google")
async def login_google(request: Request):
    """Redirects the user to Google for authentication."""
    logger.info("Received request for /login/google")
    
    # Check for DISABLE_OAUTH flag - for development only
    disable_oauth = getattr(settings, "DISABLE_OAUTH", False)
    if disable_oauth:
        logger.info("DISABLE_OAUTH is set, using mock authentication flow")
        # Create mock JWT token directly without Google auth
        mock_user_id = "11111111-1111-1111-1111-111111111111"  # Mock UUID
        access_token = security.create_access_token(subject=mock_user_id)
        refresh_token = security.create_access_token(
            subject=mock_user_id,
            expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        
        # Redirect to frontend with mock tokens
        frontend_redirect_url = f"http://localhost:5173/auth/callback?token={access_token}&refreshToken={refresh_token}"
        logger.info(f"Redirecting to frontend with mock tokens: {frontend_redirect_url}")
        response = RedirectResponse(url=frontend_redirect_url)
        
        # Add CORS headers to the redirect response
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        
        return response
    
    try:    
        # Get the Google OAuth client
        google_client = await get_oauth_client("google")
        
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
        # Get the Google OAuth client
        google_client = await get_oauth_client("google")
    
        logger.debug("Attempting to authorize access token...")
        token_data = await google_client.authorize_access_token(request)
        logger.info("Access token authorized successfully.")
        logger.debug(f"Token data received: {token_data}")

        logger.debug("Attempting to fetch user info from Google...")
        user_info_google = await google_client.userinfo(token=token_data)
        logger.info(f"User info received from Google for sub: {user_info_google.get('sub')}")
        logger.debug(f"Google user info: {user_info_google}")
        
        auth_provider = "google"
        auth_provider_id = user_info_google.get('sub')
        email = user_info_google.get('email')
        name = user_info_google.get('name')
        avatar_url = user_info_google.get('picture')
        access_token = token_data.get('access_token')
        refresh_token = token_data.get('refresh_token')
        expires_in = token_data.get('expires_in')
        expiry_datetime = None
        if expires_in:
            expiry_datetime = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
            
        if not email or not auth_provider_id:
            logger.error("Email or Sub ID missing from Google auth response.")
            raise HTTPException(status_code=400, detail="Email or Sub ID missing from Google auth")

        # --- Tenant Logic ---
        email_domain = email.split('@')[-1] if '@' in email else None
        logger.info(f"Extracted email domain: {email_domain}")
        tenant_obj = None
        if email_domain:
            logger.debug(f"Attempting to find tenant by domain: {email_domain}")
            tenant_obj = await crud_tenant.get_by_domain(db, domain=email_domain)
        
        if not tenant_obj:
            logger.info(f"No tenant found for domain {email_domain}, creating new one...")
            tenant_name = email_domain.split('.')[0].capitalize() if email_domain else "Default Tenant"
            new_tenant_data = TenantCreate(name=tenant_name, domain=email_domain)
            tenant_obj = await crud_tenant.create(db=db, obj_in=new_tenant_data)
            logger.info(f"Created new tenant {tenant_obj.name} ({tenant_obj.id}) for domain {email_domain}")
        else:
            logger.info(f"Found existing tenant {tenant_obj.name} ({tenant_obj.id}) for domain {email_domain}")
        
        tenant_id = tenant_obj.id
        # ----------------------------------

        logger.debug("Preparing UserCreate schema for upsert...")
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
        logger.debug(f"UserCreate data: {user_in.model_dump(exclude={'google_access_token', 'google_refresh_token'})}") # Avoid logging tokens
        
        logger.info(f"Attempting to upsert user {email} for tenant {tenant_id}...")
        db_user = await crud_user.upsert_by_auth(
            db=db, 
            obj_in=user_in, 
            tenant_id=tenant_id # Pass tenant_id explicitly
        )
        logger.info(f"User upsert successful. User ID: {db_user.id}")
        
        # --- JWT Generation --- 
        logger.debug(f"Generating JWT access token for user ID: {db_user.id}")
        access_token = security.create_access_token(subject=db_user.id) # Use security directly
        logger.info("JWT access token generated successfully.")

        logger.debug(f"Generating JWT refresh token for user ID: {db_user.id}")
        # Use a much longer expiry for refresh tokens
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS) 
        refresh_token = security.create_access_token( # Reuse create_access_token
            subject=db_user.id, 
            expires_delta=refresh_token_expires
        )
        logger.info("JWT refresh token generated successfully.")
        # ---------------------
        
        # Pass both tokens to the frontend
        frontend_redirect_url = f"http://localhost:5173/auth/callback?token={access_token}&refreshToken={refresh_token}"
        logger.info(f"Redirecting user to frontend: {frontend_redirect_url.split('?')[0]}?token=...&refreshToken=..." ) # Avoid logging tokens
        
        response = RedirectResponse(url=frontend_redirect_url)
        
        # Add CORS headers to the redirect response
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        
        return response
    
    except Exception as e:
        logger.error(f"Error during Google OAuth callback: {e}", exc_info=True) # Log exception info
        error_redirect_url = "http://localhost:5173/login?error=auth_failed"
        logger.info(f"Redirecting user to frontend login with error.")
        response = RedirectResponse(url=error_redirect_url)
        
        # Add CORS headers to the redirect response
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        
        return response


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

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 1. Validate the refresh token JWT itself
    try:
        payload = jwt.decode(
            refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id_str: Optional[str] = payload.get("sub")
        if user_id_str is None:
            logger.warning("Refresh token JWT missing 'sub' claim.")
            raise credentials_exception
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            logger.warning("Refresh token JWT 'sub' claim is not a valid UUID.")
            raise credentials_exception
        token_data = security.TokenData(sub=user_id) # Use TokenData from security
        logger.info(f"Refresh token JWT validated successfully for user ID: {user_id}")

    except jwt.ExpiredSignatureError:
        logger.warning("Refresh token JWT has expired.")
        raise credentials_exception
    except jwt.JWTError as e:
        logger.error(f"Error decoding refresh token JWT: {e}")
        raise credentials_exception
        
    # 2. Find user by ID from the validated refresh token
    user = await crud_user.get(db, id=token_data.sub)
    if not user:
        logger.error(f"User ID {token_data.sub} from valid refresh token not found in DB.")
        raise credentials_exception 
    
    logger.info(f"Found user {user.email} from refresh token JWT.")

    # Optional: Add token blacklist check here if implemented later

    # 3. Generate NEW access token for our API
    logger.debug(f"Generating new access token for user {user.id}")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = security.create_access_token(
        subject=user.id, 
        expires_delta=access_token_expires
    )
    logger.info(f"Generated new access token for user {user.email}")

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
    }


# TODO: Add endpoint to logout (potentially blacklist tokens)

@router.post("/logout")
async def logout(
    # Optional: Could take the token to blacklist it if needed
    # response: Response # If needing to clear HttpOnly cookies
) -> Any:
    """
    Endpoint for client to signal logout.
    Currently does nothing on the backend, but could be extended
    to invalidate refresh tokens (e.g., add to a blacklist).
    """
    logger.info("Received request for /logout")
    # No action needed on backend for simple JWT invalidation (client deletes)
    # If using server-side refresh token invalidation, implement logic here.
    return {"message": "Logout endpoint called"} 