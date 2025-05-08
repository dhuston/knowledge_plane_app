"""
Tenant middleware for FastAPI.
Extracts tenant information from requests and sets up the tenant context.
"""
import logging
from typing import Optional, Callable
from uuid import UUID
from fastapi import FastAPI, Request, Depends
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.token import get_tenant_id_from_token
from app.core.tenant_service import tenant_context, TenantContext

logger = logging.getLogger(__name__)


async def tenant_context_middleware(request: Request, call_next):
    """
    Middleware to extract tenant information from JWT tokens.
    Sets up the tenant context for the request.
    """
    # Reset tenant context at the start of each request
    tenant_context.reset()
    
    # Extract Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split("Bearer ")[1]
        
        # Extract tenant ID from token
        tenant_id = get_tenant_id_from_token(token)
        if tenant_id:
            # Set tenant ID in context
            tenant_context.tenant_id = tenant_id
            tenant_context.initialized = True
            logger.debug(f"Tenant context initialized with tenant_id: {tenant_id}")
    
    # Process the request
    response = await call_next(request)
    
    # Reset tenant context at the end of the request
    tenant_context.reset()
    
    return response


def configure_tenant_middleware(app: FastAPI):
    """
    Configure tenant middleware for FastAPI app.
    
    Args:
        app: FastAPI application instance
    """
    app.add_middleware(BaseHTTPMiddleware, dispatch=tenant_context_middleware)
    logger.info("Tenant middleware configured")


def get_tenant_context() -> TenantContext:
    """
    FastAPI dependency to get current tenant context.
    
    Returns:
        TenantContext: Current tenant context
    """
    return tenant_context


def tenant_required(tenant_context: TenantContext = Depends(get_tenant_context)) -> UUID:
    """
    FastAPI dependency to require a tenant context.
    
    Args:
        tenant_context: Current tenant context
        
    Returns:
        UUID: Current tenant ID
        
    Raises:
        HTTPException: If no tenant context is available
    """
    if not tenant_context.initialized:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for this operation",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return tenant_context.tenant_id