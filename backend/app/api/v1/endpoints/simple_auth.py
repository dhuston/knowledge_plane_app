from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import simple_deps
from app.schemas.token import Token
from app.schemas.user import UserRead  # Changed from User to UserRead
from app.services.simple_auth_service import simple_auth_service
from app.core.config import settings


router = APIRouter()


@router.post("/login", response_model=Token)
async def login_access_token(
    response: Response,
    db: AsyncSession = Depends(simple_deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    # Authenticate user
    success, user = await simple_auth_service.authenticate_user(
        db, form_data.username, form_data.password
    )
    
    if not success or not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = simple_auth_service.create_token(
        user_id=user.id,
        tenant_id=user.tenant_id
    )
    
    # Set cookie for token (optional, can be used with token in header)
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=60 * 60 * 24,  # 1 day
        secure=not settings.DEBUG,
        samesite="lax" if settings.DEBUG else "strict"
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(response: Response) -> dict:
    """
    Logout endpoint to clear cookies.
    """
    response.delete_cookie(key="access_token")
    
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserRead)  # Changed from User to UserRead
async def read_users_me(
    current_user = Depends(simple_deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user


# Special demo login endpoint for tenant-based login
@router.post("/demo-login", response_model=Token)
async def demo_login(
    response: Response,
    tenant_id: str,
    db: AsyncSession = Depends(simple_deps.get_db),
) -> Any:
    """
    Demo login endpoint that creates a token for a demo user in the specified tenant.
    This is used for demonstration purposes only.
    """
    from app.crud.crud_user import user as crud_user
    from app.crud.crud_tenant import tenant as crud_tenant
    from uuid import UUID
    import logging
    
    logger = logging.getLogger("app.api.auth.demo-login")
    
    try:
        # Validate tenant ID format
        try:
            tenant_uuid = UUID(tenant_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid tenant ID format: {tenant_id}"
            )
        
        # Check if tenant exists
        tenant = await crud_tenant.get(db, id=tenant_uuid)
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant not found: {tenant_id}"
            )
        
        # Find or create the demo user for this tenant
        demo_user = await crud_user.get_admin_user(db, tenant_id=tenant_uuid)
        
        # If no demo user exists, use the first active user or create one
        if not demo_user:
            logger.warning(f"No admin user found for tenant {tenant.name} ({tenant_id}), looking for any active user")
            demo_user = await crud_user.get_first_active_user(db, tenant_id=tenant_uuid)
            
            if not demo_user:
                logger.warning(f"No active user found for tenant {tenant.name} ({tenant_id}), creating one")
                from app.schemas.user import UserCreate
                demo_user_data = UserCreate(
                    email=f"demo-user@{tenant.name.lower().replace(' ', '-')}.com",
                    name=f"Demo User ({tenant.name})",
                )
                demo_user = await crud_user.create_with_tenant(
                    db, obj_in=demo_user_data, tenant_id=tenant_uuid, 
                    is_demo=True, auth_provider="demo"
                )
        
        # Create access token for demo user
        access_token = simple_auth_service.create_token(
            user_id=demo_user.id,
            tenant_id=tenant_uuid
        )
        
        # Set cookie
        response.set_cookie(
            key="access_token",
            value=f"Bearer {access_token}",
            httponly=True,
            max_age=60 * 60 * 24,  # 1 day
            secure=not settings.DEBUG,
            samesite="lax" if settings.DEBUG else "strict"
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
        }
        
    except Exception as e:
        logger.error(f"Error in demo-login: {str(e)}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing demo login: {str(e)}"
        )