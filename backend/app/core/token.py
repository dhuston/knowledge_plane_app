"""
Token management module for JWT token creation, validation, and decoding.
Centralizes all token-related functionality.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
from uuid import UUID
import logging

from jose import jwt, JWTError
from pydantic import ValidationError

from app.core.config import settings

# Set up logging
logger = logging.getLogger(__name__)

# JWT Constants
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
SECRET_KEY = settings.SECRET_KEY


def create_access_token(
    user_id: Union[str, UUID],
    tenant_id: Optional[Union[str, UUID]] = None,
    expires_delta: Optional[timedelta] = None,
    additional_data: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Create JWT access token with user_id, tenant_id, and optional additional data.

    Args:
        user_id: User ID to include in token
        tenant_id: Tenant ID to include in token (for multi-tenancy)
        expires_delta: Custom expiration time
        additional_data: Additional claims to include in the token

    Returns:
        str: Encoded JWT token
    """
    # Convert IDs to strings if they're UUID objects
    user_id_str = str(user_id)
    tenant_id_str = str(tenant_id) if tenant_id else None

    # Determine when the token should expire
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # Build token data with required fields
    token_data = {"sub": user_id_str, "exp": expire}

    # Add tenant ID if provided
    if tenant_id_str:
        token_data["tenant_id"] = tenant_id_str

    # Add any additional data to the token
    if additional_data:
        for key, value in additional_data.items():
            if key not in token_data:  # Don't overwrite standard claims
                token_data[key] = value

    # Create the token
    return jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a JWT token.

    Args:
        token: JWT token to decode

    Returns:
        Dict containing the token claims if valid, None otherwise
    """
    try:
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.debug(f"Invalid token: {str(e)}")
        return None
    except Exception as e:
        logger.warning(f"Unexpected error decoding token: {str(e)}")
        return None


def get_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract user ID from a token.

    Args:
        token: JWT token to extract user ID from

    Returns:
        User ID as string if token is valid, None otherwise
    """
    payload = decode_token(token)
    if not payload:
        return None

    user_id = payload.get("sub")
    return user_id


def get_tenant_id_from_token(token: str) -> Optional[str]:
    """
    Extract tenant ID from a token.

    Args:
        token: JWT token to extract tenant ID from

    Returns:
        Tenant ID as string if present in token, None otherwise
    """
    payload = decode_token(token)
    if not payload:
        return None

    tenant_id = payload.get("tenant_id")
    return tenant_id


def is_token_expired(token: str) -> bool:
    """
    Check if a token is expired.

    Args:
        token: JWT token to check

    Returns:
        True if token is expired or invalid, False otherwise
    """
    payload = decode_token(token)
    if not payload:
        return True

    try:
        exp = payload.get("exp")
        if not exp:
            return True

        # Check if expiration time is in the past
        now = datetime.now(timezone.utc).timestamp()
        return exp < now
    except (ValidationError, JWTError):
        return True