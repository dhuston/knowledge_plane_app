from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class OAuthProviderBase(BaseModel):
    """Base model for OAuth provider configuration."""
    name: str
    display_name: str
    description: Optional[str] = None
    icon_url: Optional[str] = None
    enabled: bool = True

class OAuthProviderCreate(OAuthProviderBase):
    """Schema for creating a new OAuth provider configuration."""
    client_id: str
    client_secret: str
    server_metadata_url: str
    scopes: List[str]
    additional_params: Dict[str, Any] = Field(default_factory=dict)

class OAuthProviderUpdate(BaseModel):
    """Schema for updating an OAuth provider configuration."""
    display_name: Optional[str] = None
    description: Optional[str] = None
    icon_url: Optional[str] = None
    enabled: Optional[bool] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    server_metadata_url: Optional[str] = None
    scopes: Optional[List[str]] = None
    additional_params: Optional[Dict[str, Any]] = None

class OAuthProviderRead(OAuthProviderBase):
    """Schema for reading an OAuth provider configuration."""
    client_id: str
    server_metadata_url: str
    scopes: List[str]

    # Add exclude in model_config
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "exclude": {"client_secret"}
        }
    }