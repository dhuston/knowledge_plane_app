import pytest
from unittest.mock import MagicMock, patch
import pytest_asyncio
from typing import Dict, Any, List, Optional

from app.core.oauth_provider import OAuthProviderConfig, OAuthProvider, get_oauth_registry
from app.core.security import initialize_oauth, oauth, get_oauth_client

@pytest.mark.asyncio
async def test_initialize_oauth():
    """Test that initialize_oauth registers providers from the registry."""
    # Clear the registry first
    registry = get_oauth_registry()
    registry.providers.clear()
    
    # Create a mock OAuth object
    mock_oauth = MagicMock()
    
    # Create test providers
    config1 = OAuthProviderConfig(
        name="test_provider1",
        client_id="test_client_id1",
        client_secret="test_client_secret1",
        server_metadata_url="https://test1.com/.well-known/openid-configuration",
        scopes=["openid", "email", "profile"]
    )
    
    config2 = OAuthProviderConfig(
        name="test_provider2",
        client_id="test_client_id2",
        client_secret="test_client_secret2",
        server_metadata_url="https://test2.com/.well-known/openid-configuration",
        scopes=["openid", "email"]
    )
    
    provider1 = OAuthProvider(config=config1)
    provider2 = OAuthProvider(config=config2)
    
    registry.add_provider(provider1)
    registry.add_provider(provider2)
    
    # Call initialize_oauth with the mock OAuth
    with patch("app.core.security.oauth", mock_oauth):
        await initialize_oauth()
    
    # Check that register was called for both providers
    assert mock_oauth.register.call_count == 2

@pytest.mark.asyncio
async def test_get_oauth_client_success():
    """Test that get_oauth_client returns the correct client."""
    # Clear the registry first
    registry = get_oauth_registry()
    registry.providers.clear()
    
    # Create a mock OAuth object with mock clients
    mock_oauth = MagicMock()
    mock_client = MagicMock()
    mock_oauth.google = mock_client
    
    # Set up the registry with a test provider
    config = OAuthProviderConfig(
        name="google",
        client_id="test_client_id",
        client_secret="test_client_secret",
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        scopes=["openid", "email", "profile"]
    )
    provider = OAuthProvider(config=config)
    registry.add_provider(provider)
    
    # Call get_oauth_client with the mock OAuth
    with patch("app.core.security.oauth", mock_oauth):
        client = await get_oauth_client("google")
    
    # Check that the correct client was returned
    assert client == mock_client

@pytest.mark.asyncio
async def test_get_oauth_client_not_found():
    """Test that get_oauth_client raises an exception for unknown providers."""
    # Clear the registry first
    registry = get_oauth_registry()
    registry.providers.clear()
    
    # Create a mock OAuth object with no clients
    mock_oauth = MagicMock()
    mock_oauth.google = None
    
    # Call get_oauth_client with the mock OAuth
    with patch("app.core.security.oauth", mock_oauth):
        with pytest.raises(ValueError, match="OAuth provider not found: unknown_provider"):
            await get_oauth_client("unknown_provider")