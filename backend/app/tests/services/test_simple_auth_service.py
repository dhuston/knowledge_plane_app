import pytest
from datetime import datetime, timedelta
from uuid import UUID, uuid4
from unittest.mock import AsyncMock, patch, MagicMock
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.simple_auth_service import SimpleAuthService
from app.models.user import User
from app.core.config import settings


@pytest.fixture
def simple_auth_service():
    return SimpleAuthService(
        secret_key=settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
        token_expire_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )


@pytest.fixture
def mock_user_data():
    return {
        "id": uuid4(),
        "email": "test@example.com",
        "tenant_id": uuid4(),
        "is_active": True,
    }


@pytest.fixture
def mock_user(mock_user_data):
    user = MagicMock(spec=User)
    user.id = mock_user_data["id"]
    user.email = mock_user_data["email"]
    user.tenant_id = mock_user_data["tenant_id"]
    user.is_active = mock_user_data["is_active"]
    user.verify_password = AsyncMock(return_value=True)
    return user


class TestSimpleAuthService:

    def test_create_token(self, simple_auth_service, mock_user_data):
        # Test token creation with user ID only
        user_id = mock_user_data["id"]
        token = simple_auth_service.create_token(user_id=user_id)
        
        # Decode and verify token
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        
        assert payload["sub"] == str(user_id)
        assert "tenant_id" not in payload
        assert datetime.fromtimestamp(payload["exp"]) > datetime.utcnow()
    
    def test_create_token_with_tenant(self, simple_auth_service, mock_user_data):
        # Test token creation with user ID and tenant ID
        user_id = mock_user_data["id"]
        tenant_id = mock_user_data["tenant_id"]
        token = simple_auth_service.create_token(user_id=user_id, tenant_id=tenant_id)
        
        # Decode and verify token
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        
        assert payload["sub"] == str(user_id)
        assert payload["tenant_id"] == str(tenant_id)
        assert datetime.fromtimestamp(payload["exp"]) > datetime.utcnow()
    
    def test_validate_token_valid(self, simple_auth_service, mock_user_data):
        # Create a valid token
        user_id = mock_user_data["id"]
        token = simple_auth_service.create_token(user_id=user_id)
        
        # Validate the token
        payload = simple_auth_service.validate_token(token)
        
        assert payload is not None
        assert payload["sub"] == str(user_id)
    
    def test_validate_token_expired(self, simple_auth_service, mock_user_data):
        # Create an expired token
        user_id = mock_user_data["id"]
        
        # Create token with negative expiration time
        with patch.object(simple_auth_service, 'token_expire_minutes', -5):
            token = simple_auth_service.create_token(user_id=user_id)
        
        # Validate the token
        payload = simple_auth_service.validate_token(token)
        
        assert payload is None
    
    def test_validate_token_invalid(self, simple_auth_service):
        # Test with invalid token
        invalid_token = "invalid.token.format"
        payload = simple_auth_service.validate_token(invalid_token)
        assert payload is None

    @pytest.mark.asyncio
    async def test_authenticate_user_valid(self, simple_auth_service, mock_user):
        # Mock the database session and get_by_email
        db = AsyncMock(spec=AsyncSession)
        
        with patch('app.crud.crud_user.get_by_email', new_callable=AsyncMock) as mock_get_by_email:
            mock_get_by_email.return_value = mock_user
            
            # Authenticate with correct credentials
            authenticated, user = await simple_auth_service.authenticate_user(
                db=db,
                email="test@example.com",
                password="correct_password"
            )
            
            # Verify authentication success
            assert authenticated is True
            assert user is mock_user
            mock_user.verify_password.assert_called_once_with("correct_password")
    
    @pytest.mark.asyncio
    async def test_authenticate_user_invalid_password(self, simple_auth_service, mock_user):
        # Set up mock to return False for verify_password
        mock_user.verify_password = AsyncMock(return_value=False)
        
        # Mock the database session and get_by_email
        db = AsyncMock(spec=AsyncSession)
        
        with patch('app.crud.crud_user.get_by_email', new_callable=AsyncMock) as mock_get_by_email:
            mock_get_by_email.return_value = mock_user
            
            # Authenticate with incorrect password
            authenticated, user = await simple_auth_service.authenticate_user(
                db=db,
                email="test@example.com",
                password="wrong_password"
            )
            
            # Verify authentication failure
            assert authenticated is False
            assert user is mock_user
            mock_user.verify_password.assert_called_once_with("wrong_password")
    
    @pytest.mark.asyncio
    async def test_authenticate_user_not_found(self, simple_auth_service):
        # Mock the database session and get_by_email
        db = AsyncMock(spec=AsyncSession)
        
        with patch('app.crud.crud_user.get_by_email', new_callable=AsyncMock) as mock_get_by_email:
            mock_get_by_email.return_value = None
            
            # Authenticate with non-existent user
            authenticated, user = await simple_auth_service.authenticate_user(
                db=db,
                email="nonexistent@example.com",
                password="any_password"
            )
            
            # Verify authentication failure
            assert authenticated is False
            assert user is None
    
    @pytest.mark.asyncio
    async def test_get_user_from_token_valid(self, simple_auth_service, mock_user, mock_user_data):
        # Create a valid token
        user_id = mock_user_data["id"]
        token = simple_auth_service.create_token(user_id=user_id)
        
        # Mock the database session and get
        db = AsyncMock(spec=AsyncSession)
        
        with patch('app.crud.crud_user.get', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_user
            
            # Get user from token
            success, user, error = await simple_auth_service.get_user_from_token(
                db=db,
                token=token
            )
            
            # Verify success
            assert success is True
            assert user is mock_user
            assert error is None
            mock_get.assert_called_once_with(db, UUID(str(user_id)))
    
    @pytest.mark.asyncio
    async def test_get_user_from_token_invalid(self, simple_auth_service):
        # Invalid token
        token = "invalid.token.format"
        
        # Mock the database session
        db = AsyncMock(spec=AsyncSession)
        
        # Get user from invalid token
        success, user, error = await simple_auth_service.get_user_from_token(
            db=db,
            token=token
        )
        
        # Verify failure
        assert success is False
        assert user is None
        assert error == "Invalid token"
    
    @pytest.mark.asyncio
    async def test_get_user_from_token_user_not_found(self, simple_auth_service, mock_user_data):
        # Create a valid token
        user_id = mock_user_data["id"]
        token = simple_auth_service.create_token(user_id=user_id)
        
        # Mock the database session and get
        db = AsyncMock(spec=AsyncSession)
        
        with patch('app.crud.crud_user.get', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = None
            
            # Get user from token
            success, user, error = await simple_auth_service.get_user_from_token(
                db=db,
                token=token
            )
            
            # Verify failure
            assert success is False
            assert user is None
            assert error == "User not found"
            mock_get.assert_called_once_with(db, UUID(str(user_id)))