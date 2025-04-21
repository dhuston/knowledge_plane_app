from typing import Any
from datetime import timedelta, timezone, datetime

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm # If we ever add password flow
from sqlalchemy.ext.asyncio import AsyncSession
from authlib.integrations.starlette_client import OAuthError
from uuid import UUID
import logging
from pydantic import BaseModel # Import BaseModel from pydantic

from app import crud, models, schemas
from app.core import security
from app.core.config import settings
from app.core.security import oauth # Import oauth client
from app.core.security import create_access_token, get_current_user
from app.db.session import get_db_session
from app.schemas import UserCreate, UserUpdate, TenantCreate
from app.crud import user as crud_user, tenant as crud_tenant

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
    # Ensure GOOGLE_CLIENT_ID is set
    if not settings.GOOGLE_CLIENT_ID:
        logger.error("GOOGLE_CLIENT_ID not configured.")
        return {"error": "Google OAuth Client ID not configured"} # Or raise exception
    
    # Authlib expects Starlette Request, FastAPI Request is compatible
    logger.debug(f"Redirecting to Google with redirect_uri: {GOOGLE_REDIRECT_URI}")
    return await oauth.google.authorize_redirect(request, GOOGLE_REDIRECT_URI)


@router.get("/callback/google")
async def callback_google(request: Request, db: AsyncSession = Depends(get_db_session)):
    """Handles the callback from Google after authentication."""
    logger.info("Received callback from Google.")
    try:
        logger.debug("Attempting to authorize access token...")
        token_data = await oauth.google.authorize_access_token(request)
        logger.info("Access token authorized successfully.")
        logger.debug(f"Token data received: {token_data}")

        logger.debug("Attempting to fetch user info from Google...")
        user_info_google = await oauth.google.userinfo(token=token_data)
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
        logger.debug(f"Generating JWT for user ID: {db_user.id}")
        jwt_token = create_access_token(subject=db_user.id)
        logger.info("JWT generated successfully.")
        # ---------------------
        
        frontend_redirect_url = f"http://localhost:5173/auth/callback?token={jwt_token}"
        logger.info(f"Redirecting user to frontend: {frontend_redirect_url.split('?')[0]}?token=..." ) # Avoid logging token in URL
        return RedirectResponse(url=frontend_redirect_url)
    
    except Exception as e:
        logger.error(f"Error during Google OAuth callback: {e}", exc_info=True) # Log exception info
        error_redirect_url = "http://localhost:5173/login?error=auth_failed"
        logger.info(f"Redirecting user to frontend login with error.")
        return RedirectResponse(url=error_redirect_url)


@router.post("/refresh-token", response_model=schemas.Token)
async def refresh_token(
    *, # Enforce keyword-only arguments after this
    db: AsyncSession = Depends(get_db_session),
    refresh_request: RefreshTokenRequest, # Receive refresh token in body
    # Alternatively, could try extracting from HttpOnly cookie if implemented
) -> Any:
    """
    OAuth2 refresh token flow.
    Uses the provided refresh token to issue a new access token.
    """
    logger.info("Received request for /refresh-token") # Add log
    
    refresh_token = refresh_request.refresh_token
    if not refresh_token:
        logger.error("Refresh token not provided in request body.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token not provided",
        )

    # 1. Find user by refresh token
    logger.debug(f"Looking up user by refresh token: ...{refresh_token[-6:]}") # Log partial token
    user = await crud_user.get_by_refresh_token(db, refresh_token=refresh_token)
    if not user:
        logger.warning(f"Invalid refresh token provided: ...{refresh_token[-6:]}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    logger.info(f"Found user {user.email} for refresh token.")

    # 2. TODO: Use the refresh token to get a NEW access token from Google
    if not user.google_refresh_token: # Basic check if refresh token exists in DB
         logger.error(f"User {user.email} found, but no Google refresh token stored in DB.")
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="No valid refresh token found for user",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # --- Placeholder --- 
    logger.warning("Google token refresh logic not implemented yet.")
    # --- End Placeholder --- 

    # 3. Generate NEW JWT access token for our API
    logger.debug(f"Generating new JWT access token for user {user.id}")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        subject=user.id, 
        # tenant_id=user.tenant_id, # Re-add tenant_id if needed in your JWT payload
        expires_delta=access_token_expires
    )
    logger.info(f"Generated new access token for user {user.email}")

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
    } 