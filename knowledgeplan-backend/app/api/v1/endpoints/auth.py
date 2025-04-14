from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID # Import UUID
from datetime import datetime, timedelta, timezone # Add timezone

from app.core.config import settings
from app.core.security import oauth, create_access_token # Import configured OAuth object and create_access_token
from app.db.session import get_db_session
from app.schemas import UserCreate, UserUpdate, TenantCreate # Import schemas
from app.crud import user as crud_user, tenant as crud_tenant # Import CRUD operations

router = APIRouter()

# Construct the redirect URI based on settings
# Note: This assumes your backend runs on localhost:8001 for local dev as per docker-compose
GOOGLE_REDIRECT_URI = f"http://localhost:8001{settings.API_V1_STR}/auth/callback/google"

@router.get("/login/google")
async def login_google(request: Request):
    """Redirects the user to Google for authentication."""
    # Ensure GOOGLE_CLIENT_ID is set
    if not settings.GOOGLE_CLIENT_ID:
        return {"error": "Google OAuth Client ID not configured"} # Or raise exception
    
    # Authlib expects Starlette Request, FastAPI Request is compatible
    return await oauth.google.authorize_redirect(request, GOOGLE_REDIRECT_URI)


@router.get("/callback/google")
async def callback_google(request: Request, db: AsyncSession = Depends(get_db_session)):
    """Handles the callback from Google after authentication."""
    try:
        token_data = await oauth.google.authorize_access_token(request)
        user_info_google = await oauth.google.userinfo(token=token_data)
        
        print("Google user info:", user_info_google)
        
        auth_provider = "google"
        auth_provider_id = user_info_google.get('sub')
        email = user_info_google.get('email')
        name = user_info_google.get('name')
        avatar_url = user_info_google.get('picture')
        # Extract token details
        access_token = token_data.get('access_token')
        refresh_token = token_data.get('refresh_token')
        expires_in = token_data.get('expires_in')
        expiry_datetime = None
        if expires_in:
            expiry_datetime = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
            
        if not email or not auth_provider_id:
            raise HTTPException(status_code=400, detail="Email or Sub ID missing from Google auth")

        # --- Tenant Logic ---
        email_domain = email.split('@')[-1] if '@' in email else None
        tenant_obj = None
        if email_domain:
            tenant_obj = await crud_tenant.get_by_domain(db, domain=email_domain)
        
        if not tenant_obj:
            # Create a new tenant if one doesn't exist for this domain
            # Use the domain as the initial tenant name, or derive it differently
            tenant_name = email_domain.split('.')[0].capitalize() if email_domain else "Default Tenant"
            new_tenant_data = TenantCreate(name=tenant_name, domain=email_domain)
            tenant_obj = await crud_tenant.create(db=db, obj_in=new_tenant_data)
            print(f"Created new tenant for domain {email_domain}: {tenant_obj.id}")
        else:
            print(f"Found existing tenant for domain {email_domain}: {tenant_obj.id}")
        
        tenant_id = tenant_obj.id
        # ----------------------------------

        # Use UserCreate schema for upsert, including token details
        user_in = UserCreate(
            email=email,
            name=name or email, 
            avatar_url=avatar_url,
            auth_provider=auth_provider,
            auth_provider_id=auth_provider_id,
            google_access_token=access_token, # Include token
            google_refresh_token=refresh_token, # Include refresh token
            google_token_expiry=expiry_datetime, # Include expiry
            last_login_at=datetime.now(timezone.utc) # Include login time
            # manager_id and team_id are not set here
        )
        
        # Upsert user using auth provider details and new data
        db_user = await crud_user.upsert_by_auth(
            db=db, 
            obj_in=user_in, 
            tenant_id=tenant_id
        )
        
        # --- JWT Generation --- 
        jwt_token = create_access_token(subject=db_user.id)
        # ---------------------
        
        # Redirect back to frontend with token
        frontend_redirect_url = f"http://localhost:5173/auth/callback?token={jwt_token}"
        return RedirectResponse(url=frontend_redirect_url)
    
    except Exception as e:
        print(f"Error during Google OAuth callback: {e}")
        # Redirect to frontend login page with error message?
        error_redirect_url = "http://localhost:5173/login?error=auth_failed"
        # Optionally include more error details for debugging if desired
        # error_redirect_url = f"http://localhost:5173/login?error=auth_failed&detail={str(e)[:100]}"
        return RedirectResponse(url=error_redirect_url) 