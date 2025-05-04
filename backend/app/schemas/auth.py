from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, validator


class PasswordLoginRequest(BaseModel):
    """Schema for password-based login requests."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    tenant_id: Optional[UUID] = None  # Optional tenant ID for multi-tenant selection


class DemoUserCreate(BaseModel):
    """Schema for creating demo users with passwords."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str
    title: Optional[str] = None
    avatar_url: Optional[str] = None
    team_id: Optional[str] = None
    manager_id: Optional[str] = None


class PasswordResetRequest(BaseModel):
    """Schema for password reset requests."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Schema for confirming password resets."""
    token: str
    new_password: str = Field(..., min_length=8)
    
    @validator('new_password')
    def validate_password_strength(cls, v):
        """Ensures password meets minimum security requirements."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        # Add more validation as needed (uppercase, lowercase, numbers, symbols)
        return v


class AuthMode(BaseModel):
    """Schema for checking authentication mode configuration."""
    mode: str  # 'demo' or 'production'
    oauth_enabled: bool
    password_auth_enabled: bool