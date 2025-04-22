from pydantic import BaseModel, EmailStr, UUID4, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

# Base properties shared by DB model and API schemas
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    title: Optional[str] = None
    avatar_url: Optional[str] = None
    online_status: Optional[bool] = False

# Properties to receive via API on creation or initial OAuth callback
class UserCreate(UserBase):
    email: EmailStr
    name: str
    auth_provider: Optional[str] = None
    auth_provider_id: Optional[str] = None
    manager_id: Optional[UUID4] = None
    team_id: Optional[UUID4] = None
    # Add OAuth fields needed during creation/upsert
    google_access_token: Optional[str] = None
    google_refresh_token: Optional[str] = None
    google_token_expiry: Optional[datetime] = None
    last_login_at: Optional[datetime] = None

# Properties to receive via API on update (more restricted)
class UserUpdate(UserBase):
    # Allow updating only specific fields via API later?
    # For now, keep token fields for the auth callback logic, though maybe upsert handles it better
    google_access_token: Optional[str] = None
    google_refresh_token: Optional[str] = None
    google_token_expiry: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    manager_id: Optional[UUID4] = None
    team_id: Optional[UUID4] = None
    name: Optional[str] = None
    title: Optional[str] = None
    avatar_url: Optional[str] = None

# Base schema for properties stored in DB, used for inheritance
class UserInDBBase(UserBase):
    id: UUID4
    tenant_id: UUID4
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    team_id: Optional[UUID4] = None
    manager_id: Optional[UUID4] = None
    auth_provider: Optional[str] = None
    auth_provider_id: Optional[str] = None
    google_access_token: Optional[str] = None
    google_refresh_token: Optional[str] = None
    google_token_expiry: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
    }

# Schema for returning user data to the client (API response model)
class UserRead(UserInDBBase):
    model_config = {
        "fields": {
            'google_access_token': {'exclude': True},
            'google_refresh_token': {'exclude': True},
            'google_token_expiry': {'exclude': True}
        }
    }

# --- New Basic Schema --- 
# Basic schema for representing a user minimally (e.g., in relationships)
class UserReadBasic(BaseModel):
    id: UUID

    class Config:
        from_attributes = True # Enable ORM mode


# Properties stored in DB (including hashed password if we add it)
class UserInDB(UserInDBBase):
    hashed_password: str 