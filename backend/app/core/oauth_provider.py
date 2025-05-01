from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import logging
from authlib.integrations.starlette_client import OAuth

# Get logger
logger = logging.getLogger(__name__)

class OAuthProviderConfig(BaseModel):
    """Configuration for an OAuth provider."""
    name: str
    client_id: str
    client_secret: str
    server_metadata_url: str
    scopes: List[str]
    additional_params: Dict[str, Any] = {}

class OAuthProvider:
    """Class representing an OAuth provider."""
    def __init__(self, config: OAuthProviderConfig):
        self.name = config.name
        self.config = config
        
    async def register(self, oauth: OAuth) -> None:
        """Register this provider with the OAuth instance."""
        logger.info(f"Registering OAuth provider: {self.name}")
        
        # Construct client kwargs dict
        client_kwargs = {
            "scope": " ".join(self.config.scopes)
        }
        
        # Add any additional params
        client_kwargs.update(self.config.additional_params)
        
        # Register the provider
        oauth.register(
            name=self.name,
            client_id=self.config.client_id,
            client_secret=self.config.client_secret,
            server_metadata_url=self.config.server_metadata_url,
            client_kwargs=client_kwargs
        )
        
        logger.info(f"Successfully registered OAuth provider: {self.name}")

class OAuthProviderRegistry:
    """Registry for OAuth providers."""
    def __init__(self):
        self.providers: Dict[str, OAuthProvider] = {}
        
    def add_provider(self, provider: OAuthProvider) -> None:
        """Add a provider to the registry."""
        self.providers[provider.name] = provider
        logger.info(f"Added OAuth provider to registry: {provider.name}")
        
    def get_provider(self, name: str) -> OAuthProvider:
        """Get a provider from the registry."""
        if name not in self.providers:
            raise KeyError(f"OAuth provider not found: {name}")
        return self.providers[name]
    
    async def register_all(self, oauth: OAuth) -> None:
        """Register all providers with the OAuth instance."""
        logger.info(f"Registering all OAuth providers: {list(self.providers.keys())}")
        for provider in self.providers.values():
            await provider.register(oauth)
        logger.info("Successfully registered all OAuth providers")

# Create a singleton registry
_registry: Optional[OAuthProviderRegistry] = None

def get_oauth_registry() -> OAuthProviderRegistry:
    """Get the singleton registry instance."""
    global _registry
    if _registry is None:
        _registry = OAuthProviderRegistry()
    return _registry

def register_oauth_provider(config: OAuthProviderConfig) -> OAuthProvider:
    """Register an OAuth provider with the registry."""
    registry = get_oauth_registry()
    provider = OAuthProvider(config=config)
    registry.add_provider(provider)
    return provider