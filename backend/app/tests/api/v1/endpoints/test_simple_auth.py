import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4

from app.api.v1.endpoints import simple_auth
from app.api.simple_deps import get_db, get_current_user
from app.models.user import User
from app.models.tenant import Tenant
from app.services.simple_auth_service import SimpleAuthService
from app.schemas.user import UserRead
from app.core.config import settings


@pytest.fixture
def app():
    app = FastAPI()
    app.include_router(simple_auth.router)
    
    # Override dependencies
    async def override_get_db():
        return AsyncMock(spec=AsyncSession)
    
    app.dependency_overrides[get_db] = override_get_db
    
    return app


@pytest.fixture
def client(app):
    return TestClient(app)


@pytest.fixture
def mock_user():
    user = MagicMock(spec=User)
    user.id = uuid4()
    user.email = "test@example.com"
    user.name = "Test User"
    user.tenant_id = uuid4()
    user.is_active = True
    user.verify_password = AsyncMock(return_value=True)
    
    # Add any additional attributes needed for UserRead response model
    user_dict = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "tenant_id": user.tenant_id,
        "is_active": user.is_active,
        # Add other required fields from UserRead model
    }
    
    # Make user.dict() return the user_dict
    user.dict = MagicMock(return_value=user_dict)
    
    return user


@pytest.fixture
def mock_tenant():
    tenant = MagicMock(spec=Tenant)
    tenant.id = uuid4()
    tenant.name = "Test Tenant"
    tenant.is_active = True
    
    tenant_dict = {
        "id": tenant.id,
        "name": tenant.name,
        "is_active": tenant.is_active,
    }
    
    tenant.dict = MagicMock(return_value=tenant_dict)
    
    return tenant


class TestSimpleAuthAPI:

    def test_login(self, client, mock_user):
        # Mock the authenticate_user method
        with patch('app.api.v1.endpoints.simple_auth.SimpleAuthService.authenticate_user', 
                  new_callable=AsyncMock) as mock_authenticate:
            mock_authenticate.return_value = (True, mock_user)
            
            # Mock the create_token method
            with patch('app.api.v1.endpoints.simple_auth.SimpleAuthService.create_token', 
                      return_value="test_token") as mock_create_token:
                
                # Send login request
                response = client.post(
                    "/login",
                    data={"username": "test@example.com", "password": "password"},
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                
                # Assert successful response
                assert response.status_code == 200
                assert response.json() == {
                    "access_token": "test_token",
                    "token_type": "bearer"
                }
                
                # Verify mocks were called
                mock_authenticate.assert_called_once()
                mock_create_token.assert_called_once_with(
                    user_id=mock_user.id, 
                    tenant_id=mock_user.tenant_id
                )

    def test_login_invalid_credentials(self, client):
        # Mock the authenticate_user method to return authentication failure
        with patch('app.api.v1.endpoints.simple_auth.SimpleAuthService.authenticate_user', 
                  new_callable=AsyncMock) as mock_authenticate:
            mock_authenticate.return_value = (False, None)
            
            # Send login request with invalid credentials
            response = client.post(
                "/login",
                data={"username": "test@example.com", "password": "wrong_password"},
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            # Assert unauthorized response
            assert response.status_code == 401
            assert "Incorrect email or password" in response.json()["detail"]
            
            # Verify mock was called
            mock_authenticate.assert_called_once()

    def test_demo_login(self, client, mock_tenant, mock_user):
        tenant_id = mock_tenant.id
        
        # Mock the get_tenant_by_id method
        with patch('app.crud.crud_tenant.get', 
                  new_callable=AsyncMock) as mock_get_tenant:
            mock_get_tenant.return_value = mock_tenant
            
            # Mock the get_admin_user method
            with patch('app.crud.crud_user.get_admin_user', 
                      new_callable=AsyncMock) as mock_get_admin:
                mock_get_admin.return_value = mock_user
                
                # Mock the create_token method
                with patch('app.api.v1.endpoints.simple_auth.SimpleAuthService.create_token', 
                          return_value="test_token") as mock_create_token:
                    
                    # Send demo login request
                    response = client.post(
                        "/demo-login",
                        json={"tenant_id": str(tenant_id)}
                    )
                    
                    # Assert successful response
                    assert response.status_code == 200
                    assert response.json() == {
                        "access_token": "test_token",
                        "token_type": "bearer"
                    }
                    
                    # Verify mocks were called
                    mock_get_tenant.assert_called_once()
                    mock_get_admin.assert_called_once()
                    mock_create_token.assert_called_once_with(
                        user_id=mock_user.id, 
                        tenant_id=tenant_id
                    )

    def test_demo_login_tenant_not_found(self, client):
        tenant_id = uuid4()
        
        # Mock the get_tenant_by_id method to return None
        with patch('app.crud.crud_tenant.get', 
                  new_callable=AsyncMock) as mock_get_tenant:
            mock_get_tenant.return_value = None
            
            # Send demo login request with invalid tenant
            response = client.post(
                "/demo-login",
                json={"tenant_id": str(tenant_id)}
            )
            
            # Assert not found response
            assert response.status_code == 404
            assert "Tenant not found" in response.json()["detail"]
            
            # Verify mock was called
            mock_get_tenant.assert_called_once()

    def test_me_endpoint(self, client, mock_user):
        # Override the get_current_user dependency
        def override_get_current_user():
            return mock_user
        
        client.app.dependency_overrides[get_current_user] = override_get_current_user
        
        # Send request to /me endpoint
        response = client.get("/me")
        
        # Assert successful response
        assert response.status_code == 200
        user_data = response.json()
        assert user_data["email"] == mock_user.email
        assert user_data["id"] == str(mock_user.id)
        
        # Clean up
        del client.app.dependency_overrides[get_current_user]

    def test_logout(self, client):
        # Send request to /logout endpoint
        response = client.post("/logout")
        
        # Assert successful response
        assert response.status_code == 200
        assert response.json() == {"message": "Successfully logged out"}