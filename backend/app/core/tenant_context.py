from typing import Optional, Union
import uuid
from uuid import UUID
from fastapi import Request, Depends, HTTPException, status, FastAPI
from jose import jwt, JWTError

from app.core.config import settings

class TenantContext:
    """
    A class to hold tenant information throughout a request context.
    Used for tenant data isolation and scoping queries.
    """
    
    def __init__(
        self, 
        tenant_id: Optional[UUID] = None, 
        tenant_name: Optional[str] = None
    ):
        self.tenant_id = tenant_id
        self.tenant_name = tenant_name
        self.initialized = tenant_id is not None
    
    def reset(self):
        """Reset context to uninitialized state."""
        self.tenant_id = None
        self.tenant_name = None
        self.initialized = False


async def get_tenant_context(request: Request) -> TenantContext:
    """
    FastAPI dependency to extract tenant context from request.
    If tenant_context is not set on request.state, returns an uninitialized context.
    """
    if hasattr(request.state, "tenant_context"):
        return request.state.tenant_context
    return TenantContext()


def tenant_required(tenant_context: TenantContext = Depends(get_tenant_context)) -> TenantContext:
    """
    FastAPI dependency that ensures a tenant context is initialized.
    Raises 403 Forbidden if tenant context is not initialized.
    """
    if not tenant_context.initialized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant context required for this operation"
        )
    return tenant_context


async def tenant_context_middleware(request: Request, call_next, app: FastAPI):
    """
    Middleware to extract tenant information from JWT token and set on request.
    This middleware should be registered early in the middleware chain.
    """
    # Create default uninitialized tenant context
    tenant_context = TenantContext()
    
    # Extract tenant from JWT token if present
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        try:
            # Decode JWT token and extract tenant_id if present
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            
            # Get tenant_id from token if available
            if "tenant_id" in payload and payload["tenant_id"]:
                try:
                    tenant_id = UUID(payload["tenant_id"])
                    tenant_context = TenantContext(tenant_id=tenant_id)
                except (ValueError, TypeError):
                    # Invalid UUID format, leave context uninitialized
                    pass
                    
        except Exception:
            # Invalid token or any other error, leave context uninitialized
            pass
    
    # Set tenant context in request state
    request.state.tenant_context = tenant_context
    
    # Continue request processing
    response = await call_next(request)
    return response


def configure_tenant_middleware(app: FastAPI):
    """
    Configure the FastAPI application with tenant middleware.
    Call this function at application startup.
    """
    @app.middleware("http")
    async def add_tenant_middleware(request: Request, call_next):
        """Register the tenant middleware with FastAPI."""
        return await tenant_context_middleware(request, call_next, app)