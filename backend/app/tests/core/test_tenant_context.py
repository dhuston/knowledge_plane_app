import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest_asyncio
from fastapi import FastAPI, Depends, Request, Response
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.tenant_context import TenantContext, get_tenant_context, tenant_context_middleware, tenant_required
from app.models.tenant import Tenant

# Test the TenantContext class
def test_tenant_context_creation():
    """Test that TenantContext can be created with a tenant_id."""
    tenant_id = uuid.uuid4()
    context = TenantContext(tenant_id=tenant_id)
    
    assert context.tenant_id == tenant_id
    assert context.initialized is True
    assert context.tenant_name is None

def test_tenant_context_creation_with_name():
    """Test that TenantContext can be created with additional tenant info."""
    tenant_id = uuid.uuid4()
    tenant_name = "Test Tenant"
    context = TenantContext(tenant_id=tenant_id, tenant_name=tenant_name)
    
    assert context.tenant_id == tenant_id
    assert context.initialized is True
    assert context.tenant_name == tenant_name

def test_tenant_context_uninitialized():
    """Test that TenantContext can be created uninitialized."""
    context = TenantContext()
    
    assert context.tenant_id is None
    assert context.initialized is False
    assert context.tenant_name is None

def test_tenant_context_reset():
    """Test that TenantContext can be reset."""
    tenant_id = uuid.uuid4()
    context = TenantContext(tenant_id=tenant_id)
    
    context.reset()
    
    assert context.tenant_id is None
    assert context.initialized is False
    assert context.tenant_name is None

# Test the get_tenant_context dependency
@pytest.mark.asyncio
async def test_get_tenant_context():
    """Test that get_tenant_context returns the request's tenant context."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    # Create a mock request with the tenant_context in state
    request = MagicMock()
    request.state.tenant_context = tenant_context
    
    # Call the dependency
    result = await get_tenant_context(request)
    
    assert result == tenant_context
    assert result.tenant_id == tenant_id

@pytest.mark.asyncio
async def test_get_tenant_context_uninitialized():
    """Test that get_tenant_context returns an uninitialized context if not in request."""
    # Create a mock request without tenant_context in state
    request = MagicMock()
    request.state = MagicMock()
    delattr(request.state, 'tenant_context')
    
    # Call the dependency
    result = await get_tenant_context(request)
    
    assert isinstance(result, TenantContext)
    assert result.initialized is False
    assert result.tenant_id is None

# Test the tenant_context_middleware
@pytest.mark.asyncio
async def test_tenant_context_middleware_with_token():
    """Test that middleware extracts tenant from token."""
    # Create mock request with auth header
    request = MagicMock()
    request.headers = {"Authorization": "Bearer mock_token"}
    
    # Mock decoded token with tenant_id
    mock_tenant_id = uuid.uuid4()
    mock_decode = MagicMock(return_value={"sub": "user_id", "tenant_id": str(mock_tenant_id)})
    
    # Call middleware with mocked jwt decode
    with patch("app.core.tenant_context.jwt.decode", mock_decode):
        response = Response()
        app = MagicMock()
        
        call_next = AsyncMock(return_value=response)
        result = await tenant_context_middleware(request, call_next, app)
    
    # Check that tenant context was set on request state
    assert hasattr(request.state, "tenant_context")
    assert request.state.tenant_context.tenant_id == mock_tenant_id
    assert request.state.tenant_context.initialized is True
    assert result == response

@pytest.mark.asyncio
async def test_tenant_context_middleware_without_token():
    """Test that middleware handles missing token."""
    # Create mock request without auth header
    request = MagicMock()
    request.headers = {}
    
    # Call middleware
    response = Response()
    app = MagicMock()
    call_next = AsyncMock(return_value=response)
    result = await tenant_context_middleware(request, call_next, app)
    
    # Check that tenant context was created but not initialized
    assert hasattr(request.state, "tenant_context")
    assert request.state.tenant_context.tenant_id is None
    assert request.state.tenant_context.initialized is False
    assert result == response

@pytest.mark.asyncio
async def test_tenant_context_middleware_with_invalid_token():
    """Test that middleware handles invalid token."""
    # Create mock request with auth header
    request = MagicMock()
    request.headers = {"Authorization": "Bearer invalid_token"}
    
    # Mock jwt decode to raise exception
    mock_decode = MagicMock(side_effect=Exception("Invalid token"))
    
    # Call middleware with mocked jwt decode
    with patch("app.core.tenant_context.jwt.decode", mock_decode):
        response = Response()
        app = MagicMock()
        call_next = AsyncMock(return_value=response)
        result = await tenant_context_middleware(request, call_next, app)
    
    # Check that tenant context was created but not initialized
    assert hasattr(request.state, "tenant_context")
    assert request.state.tenant_context.tenant_id is None
    assert request.state.tenant_context.initialized is False
    assert result == response

# Test the tenant_required dependency
@pytest.mark.asyncio
async def test_tenant_required_with_tenant():
    """Test that tenant_required passes with initialized context."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    # Call the dependency
    result = tenant_required(tenant_context)
    
    assert result == tenant_context

@pytest.mark.asyncio
async def test_tenant_required_without_tenant():
    """Test that tenant_required raises exception without initialized context."""
    tenant_context = TenantContext()  # Uninitialized
    
    with pytest.raises(Exception):
        tenant_required(tenant_context)

# Integration tests using FastAPI TestClient
def test_endpoint_with_tenant_context():
    """Test an endpoint that uses tenant context."""
    app = FastAPI()
    
    @app.middleware("http")
    async def add_tenant_middleware(request: Request, call_next):
        # Simplified middleware for testing
        tenant_id = uuid.uuid4()
        request.state.tenant_context = TenantContext(tenant_id=tenant_id)
        return await call_next(request)
    
    @app.get("/test")
    async def test_endpoint(tenant_context: TenantContext = Depends(get_tenant_context)):
        return {"tenant_id": str(tenant_context.tenant_id)}
    
    client = TestClient(app)
    response = client.get("/test")
    
    assert response.status_code == 200
    assert "tenant_id" in response.json()
    assert uuid.UUID(response.json()["tenant_id"])

def test_endpoint_with_tenant_required():
    """Test an endpoint that requires tenant context."""
    app = FastAPI()
    
    @app.middleware("http")
    async def add_tenant_middleware(request: Request, call_next):
        # Simplified middleware for testing
        tenant_id = uuid.uuid4()
        request.state.tenant_context = TenantContext(tenant_id=tenant_id)
        return await call_next(request)
    
    @app.get("/test-required")
    async def test_required_endpoint(tenant_context: TenantContext = Depends(tenant_required)):
        return {"tenant_id": str(tenant_context.tenant_id)}
    
    client = TestClient(app)
    response = client.get("/test-required")
    
    assert response.status_code == 200
    assert "tenant_id" in response.json()

def test_endpoint_with_tenant_required_missing():
    """Test an endpoint that requires tenant context but doesn't have it."""
    app = FastAPI()
    
    @app.middleware("http")
    async def empty_middleware(request: Request, call_next):
        # No tenant context added
        return await call_next(request)
    
    @app.get("/test-required-missing")
    async def test_required_endpoint(tenant_context: TenantContext = Depends(tenant_required)):
        return {"tenant_id": str(tenant_context.tenant_id)}
    
    client = TestClient(app)
    response = client.get("/test-required-missing")
    
    assert response.status_code == 403  # Should return forbidden