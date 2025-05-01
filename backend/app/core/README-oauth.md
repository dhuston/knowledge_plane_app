# OAuth Provider System

## Overview

This document describes the OAuth Provider System implementation in KnowledgePlane AI. The system provides a flexible and extensible way to manage authentication with various OAuth providers (Google, GitHub, Microsoft, etc.).

## Key Components

### `oauth_provider.py`

This module contains the core components for managing OAuth providers:

- **OAuthProviderConfig**: A Pydantic model that defines the configuration for an OAuth provider.
- **OAuthProvider**: A class that represents an OAuth provider and provides methods for registering it with the OAuth library.
- **OAuthProviderRegistry**: A registry for managing multiple OAuth providers in a centralized location.
- **get_oauth_registry()**: Returns a singleton instance of the provider registry.
- **register_oauth_provider()**: Adds a new provider to the registry.

### `security.py`

The security module integrates with the OAuth provider system:

- **initialize_oauth()**: Initializes the OAuth providers from the registry and registers them with the OAuth library.
- **get_oauth_client()**: Returns an OAuth client for a specific provider.

### `provider.py` Schemas

The schemas module defines Pydantic models for OAuth providers:

- **OAuthProviderBase**: Base model with display information (name, display name, etc.).
- **OAuthProviderCreate**: Model for creating a new provider with credentials.
- **OAuthProviderUpdate**: Model for updating an existing provider.
- **OAuthProviderRead**: Model for returning provider information (excluding secrets).

## Usage

### Registering a Provider

```python
from app.core.oauth_provider import OAuthProviderConfig, register_oauth_provider

# Create provider configuration
google_config = OAuthProviderConfig(
    name="google",
    client_id="your_client_id",
    client_secret="your_client_secret",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    scopes=["openid", "email", "profile"]
)

# Register the provider
provider = register_oauth_provider(google_config)
```

### Using a Provider in Routes

```python
from app.core.security import get_oauth_client

@router.get("/login/provider/{provider_name}")
async def login_with_provider(provider_name: str, request: Request):
    try:
        # Get the OAuth client
        client = await get_oauth_client(provider_name)
        
        # Redirect to the provider's authorization page
        redirect_uri = f"http://your-app.com/api/v1/auth/callback/{provider_name}"
        return await client.authorize_redirect(request, redirect_uri)
    except ValueError as e:
        # Handle provider not found
        return {"error": str(e)}
```

## Initializing the System

The OAuth provider system is automatically initialized when the application starts up. The `startup_event()` function in `main.py` calls `initialize_oauth()`, which sets up all registered providers.

## Adding New Providers

To add a new OAuth provider:

1. Register it in the registry using `register_oauth_provider()`.
2. Create routes for login and callback.
3. Handle provider-specific user data mapping in the callback.

## Security Considerations

- Provider credentials are not exposed in API responses.
- Client secrets should be stored securely (environment variables or secret management).
- Token storage should be encrypted (TODO).

## Future Enhancements

- Add database storage for provider configurations
- Implement token rotation for refresh tokens
- Add admin interface for managing providers
- Support for more authentication methods (OIDC, SAML)