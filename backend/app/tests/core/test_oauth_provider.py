import pytest
from unittest.mock import MagicMock, patch
import pytest_asyncio
from typing import Dict, Any, List, Optional

from app.core.oauth_provider import (
    OAuthProvider,
    OAuthProviderConfig,
    OAuthProviderRegistry,
    get_oauth_registry,
    register_oauth_provider,
)

# Test the OAuthProviderConfig model
def test_oauth_provider_config_creation():
    """Test that OAuthProviderConfig can be created with required parameters."""
    config = OAuthProviderConfig(
        name="test_provider",
        client_id="test_client_id",
        client_secret="test_client_secret",
        server_metadata_url="https://test.com/.well-known/openid-configuration",
        scopes=["openid", "email", "profile"]
    )
    
    assert config.name == "test_provider"
    assert config.client_id == "test_client_id"
    assert config.client_secret == "test_client_secret"
    assert config.server_metadata_url == "https://test.com/.well-known/openid-configuration"
    assert config.scopes == ["openid", "email", "profile"]
    assert config.additional_params == {}

def test_oauth_provider_config_with_additional_params():
    """Test that OAuthProviderConfig can be created with additional params."""
    config = OAuthProviderConfig(
        name="test_provider",
        client_id="test_client_id",
        client_secret="test_client_secret",
        server_metadata_url="https://test.com/.well-known/openid-configuration",
        scopes=["openid", "email", "profile"],
        additional_params={"prompt": "consent"}
    )
    
    assert config.name == "test_provider"
    assert config.additional_params == {"prompt": "consent"}

# Test the OAuthProvider class
def test_oauth_provider_creation():
    """Test that OAuthProvider can be created with a configuration."""
    config = OAuthProviderConfig(
        name="test_provider",
        client_id="test_client_id",
        client_secret="test_client_secret",
        server_metadata_url="https://test.com/.well-known/openid-configuration",
        scopes=["openid", "email", "profile"]
    )
    
    provider = OAuthProvider(config=config)
    
    assert provider.name == "test_provider"
    assert provider.config == config

@pytest.mark.asyncio
async def test_oauth_provider_register():
    """Test that OAuthProvider registers with the OAuth library."""
    config = OAuthProviderConfig(
        name="test_provider",
        client_id="test_client_id",
        client_secret="test_client_secret",
        server_metadata_url="https://test.com/.well-known/openid-configuration",
        scopes=["openid", "email", "profile"]
    )
    
    # Create a mock OAuth object
    mock_oauth = MagicMock()
    
    # Create the provider with the mock OAuth
    provider = OAuthProvider(config=config)
    
    # Register the provider
    await provider.register(oauth=mock_oauth)
    
    # Check that the OAuth register method was called with the expected arguments
    mock_oauth.register.assert_called_once_with(
        name="test_provider",
        client_id="test_client_id",
        client_secret="test_client_secret",
        server_metadata_url="https://test.com/.well-known/openid-configuration",
        client_kwargs={
            "scope": "openid email profile"
        }
    )

@pytest.mark.asyncio
async def test_oauth_provider_register_with_additional_params():
    """Test that OAuthProvider registers with additional params."""
    config = OAuthProviderConfig(
        name="test_provider",
        client_id="test_client_id",
        client_secret="test_client_secret",
        server_metadata_url="https://test.com/.well-known/openid-configuration",
        scopes=["openid", "email", "profile"],
        additional_params={"prompt": "consent"}
    )
    
    # Create a mock OAuth object
    mock_oauth = MagicMock()
    
    # Create the provider with the mock OAuth
    provider = OAuthProvider(config=config)
    
    # Register the provider
    await provider.register(oauth=mock_oauth)
    
    # Check that the OAuth register method was called with the additional params
    mock_oauth.register.assert_called_once_with(
        name="test_provider",
        client_id="test_client_id",
        client_secret="test_client_secret",
        server_metadata_url="https://test.com/.well-known/openid-configuration",
        client_kwargs={
            "scope": "openid email profile",
            "prompt": "consent"
        }
    )

# Test the OAuthProviderRegistry class
def test_oauth_provider_registry_creation():
    """Test that OAuthProviderRegistry can be created."""
    registry = OAuthProviderRegistry()
    
    assert len(registry.providers) == 0

def test_oauth_provider_registry_add_provider():
    """Test that providers can be added to the registry."""
    registry = OAuthProviderRegistry()
    
    config = OAuthProviderConfig(
        name="test_provider",
        client_id="test_client_id",
        client_secret="test_client_secret",
        server_metadata_url="https://test.com/.well-known/openid-configuration",
        scopes=["openid", "email", "profile"]
    )
    
    provider = OAuthProvider(config=config)
    
    registry.add_provider(provider)
    
    assert len(registry.providers) == 1
    assert "test_provider" in registry.providers
    assert registry.providers["test_provider"] == provider

def test_oauth_provider_registry_get_provider():
    """Test that providers can be retrieved from the registry."""
    registry = OAuthProviderRegistry()
    
    config = OAuthProviderConfig(
        name="test_provider",
        client_id="test_client_id",
        client_secret="test_client_secret",
        server_metadata_url="https://test.com/.well-known/openid-configuration",
        scopes=["openid", "email", "profile"]
    )
    
    provider = OAuthProvider(config=config)
    
    registry.add_provider(provider)
    
    retrieved_provider = registry.get_provider("test_provider")
    
    assert retrieved_provider == provider

def test_oauth_provider_registry_get_nonexistent_provider():
    """Test that getting a non-existent provider raises an exception."""
    registry = OAuthProviderRegistry()
    
    with pytest.raises(KeyError):
        registry.get_provider("nonexistent_provider")

@pytest.mark.asyncio
async def test_oauth_provider_registry_register_all():
    """Test that all providers in the registry can be registered with OAuth."""
    registry = OAuthProviderRegistry()
    
    # Create two providers
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
    
    # Create a mock OAuth object
    mock_oauth = MagicMock()
    
    # Register all providers
    await registry.register_all(oauth=mock_oauth)
    
    # Check that register was called for both providers
    assert mock_oauth.register.call_count == 2

# Test the module-level functions
def test_get_oauth_registry():
    """Test that get_oauth_registry returns a singleton instance."""
    registry1 = get_oauth_registry()
    registry2 = get_oauth_registry()
    
    assert registry1 is registry2
    assert isinstance(registry1, OAuthProviderRegistry)

def test_register_oauth_provider():
    """Test that register_oauth_provider adds a provider to the registry."""
    # Clear the registry first
    registry = get_oauth_registry()
    registry.providers.clear()
    
    # Register a provider
    config = OAuthProviderConfig(
        name="test_provider",
        client_id="test_client_id",
        client_secret="test_client_secret",
        server_metadata_url="https://test.com/.well-known/openid-configuration",
        scopes=["openid", "email", "profile"]
    )
    
    register_oauth_provider(config)
    
    # Get the registry and check that the provider was added
    registry = get_oauth_registry()
    
    assert len(registry.providers) == 1
    assert "test_provider" in registry.providers
    assert registry.providers["test_provider"].name == "test_provider"