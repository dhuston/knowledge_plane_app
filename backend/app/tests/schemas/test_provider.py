import pytest
from app.schemas.provider import (
    OAuthProviderBase, 
    OAuthProviderCreate, 
    OAuthProviderUpdate,
    OAuthProviderRead
)

def test_oauth_provider_base_schema():
    """Test that the OAuthProviderBase schema works correctly."""
    # Minimal valid data
    data = {
        "name": "google",
        "display_name": "Google"
    }
    
    provider = OAuthProviderBase(**data)
    assert provider.name == "google"
    assert provider.display_name == "Google"
    assert provider.enabled is True
    assert provider.description is None
    assert provider.icon_url is None
    
    # Full data
    data = {
        "name": "github",
        "display_name": "GitHub",
        "description": "Sign in with GitHub",
        "icon_url": "https://example.com/github.png",
        "enabled": False
    }
    
    provider = OAuthProviderBase(**data)
    assert provider.name == "github"
    assert provider.display_name == "GitHub"
    assert provider.description == "Sign in with GitHub"
    assert provider.icon_url == "https://example.com/github.png"
    assert provider.enabled is False

def test_oauth_provider_create_schema():
    """Test that the OAuthProviderCreate schema works correctly."""
    # Minimal valid data
    data = {
        "name": "google",
        "display_name": "Google",
        "client_id": "test_client_id",
        "client_secret": "test_client_secret",
        "server_metadata_url": "https://accounts.google.com/.well-known/openid-configuration",
        "scopes": ["openid", "email", "profile"]
    }
    
    provider = OAuthProviderCreate(**data)
    assert provider.name == "google"
    assert provider.display_name == "Google"
    assert provider.client_id == "test_client_id"
    assert provider.client_secret == "test_client_secret"
    assert provider.server_metadata_url == "https://accounts.google.com/.well-known/openid-configuration"
    assert provider.scopes == ["openid", "email", "profile"]
    assert provider.additional_params == {}
    
    # With additional params
    data["additional_params"] = {"prompt": "consent"}
    provider = OAuthProviderCreate(**data)
    assert provider.additional_params == {"prompt": "consent"}

def test_oauth_provider_update_schema():
    """Test that the OAuthProviderUpdate schema works correctly."""
    # Empty update
    data = {}
    update = OAuthProviderUpdate(**data)
    assert update.display_name is None
    assert update.client_id is None
    
    # Partial update
    data = {
        "display_name": "Updated Google",
        "enabled": False
    }
    update = OAuthProviderUpdate(**data)
    assert update.display_name == "Updated Google"
    assert update.enabled is False
    assert update.client_id is None
    
    # Full update
    data = {
        "display_name": "Updated Google",
        "description": "Sign in with Google",
        "icon_url": "https://example.com/google.png",
        "enabled": False,
        "client_id": "new_client_id",
        "client_secret": "new_client_secret",
        "server_metadata_url": "https://accounts.google.com/.well-known/openid-configuration",
        "scopes": ["openid", "email"],
        "additional_params": {"access_type": "offline"}
    }
    update = OAuthProviderUpdate(**data)
    assert update.display_name == "Updated Google"
    assert update.description == "Sign in with Google"
    assert update.enabled is False
    assert update.client_id == "new_client_id"
    assert update.client_secret == "new_client_secret"
    assert update.scopes == ["openid", "email"]
    assert update.additional_params == {"access_type": "offline"}

def test_oauth_provider_read_schema():
    """Test that the OAuthProviderRead schema works correctly."""
    # Create provider data
    data = {
        "name": "google",
        "display_name": "Google",
        "client_id": "test_client_id",
        "client_secret": "test_client_secret",
        "server_metadata_url": "https://accounts.google.com/.well-known/openid-configuration",
        "scopes": ["openid", "email", "profile"]
    }
    
    # Create model from data
    provider = OAuthProviderRead(**data)
    
    # For now, client_secret is not hidden in model_dump directly, but will be hidden in JSON output
    # Check essential fields
    assert provider.name == "google"
    assert provider.display_name == "Google"
    assert provider.client_id == "test_client_id"
    assert provider.server_metadata_url == "https://accounts.google.com/.well-known/openid-configuration"
    assert provider.scopes == ["openid", "email", "profile"]