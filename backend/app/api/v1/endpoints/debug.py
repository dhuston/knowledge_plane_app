"""
Debug API endpoints for development and troubleshooting
"""

import logging
import os
from datetime import datetime
from typing import Dict, Any, List
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, Response, Request, status, Depends
from pydantic import BaseModel

# Configure logger
logger = logging.getLogger("debug_api")
logger.setLevel(logging.DEBUG)

# Create auth debug file handler
auth_debug_file = "auth_debug.log"
auth_file_handler = logging.FileHandler(auth_debug_file)
auth_file_handler.setLevel(logging.DEBUG)

# Add formatter to auth file handler
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
auth_file_handler.setFormatter(formatter)

# Add handlers to logger
logger.addHandler(auth_file_handler)

# Define the router
router = APIRouter(
    # No prefix - prefix is added in api.py
    tags=["debug"],
    responses={404: {"description": "Not found"}},
)

class AuthLogEntry(BaseModel):
    """
    Model for auth log entries from frontend
    """
    timestamp: str
    level: str
    component: str
    event: str
    details: Dict[str, Any] = None
    sessionId: str
    location: str = None

@router.post("/auth-log", status_code=status.HTTP_201_CREATED)
async def log_auth_event(log_entry: AuthLogEntry):
    """
    Receive and log authentication events from frontend for debugging purposes
    
    This endpoint accepts debug information from the frontend auth flow and logs
    it to a dedicated log file for analysis.
    
    Note: This endpoint is available without authentication for debugging purposes.
    """
    # Format the log entry for storage
    formatted_entry = f"[{log_entry.level}] [{log_entry.sessionId}] [{log_entry.component}] {log_entry.event}"
    
    # Add details if available
    if log_entry.details:
        details_str = json.dumps(log_entry.details)
        formatted_entry += f" - {details_str}"
    
    # Log based on level
    if log_entry.level == "ERROR":
        logger.error(formatted_entry)
    elif log_entry.level == "WARN":
        logger.warning(formatted_entry)
    else:
        logger.info(formatted_entry)
    
    return {"logged": True}

@router.get("/token-debug-info")
async def get_token_debug_info(token: str):
    """
    Validate and inspect a token for debugging
    
    This endpoint decodes a JWT token and returns debugging information about it
    without validating the token with the database.
    """
    from jose import jwt, JWTError
    from app.core.config import settings
    
    try:
        # Attempt to decode the token
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM],
            options={"verify_signature": True}  # Verify signature but not claims
        )
        
        # Extract expiration information
        exp = payload.get("exp", None)
        now_timestamp = int(datetime.now().timestamp())
        
        # Calculate expiration status
        is_expired = False
        time_to_expiry = None
        expiry_time = None
        
        if exp:
            is_expired = exp < now_timestamp
            time_to_expiry = max(0, exp - now_timestamp)
            expiry_time = datetime.fromtimestamp(exp).isoformat()
        
        # Return structured debug info
        return {
            "valid": True,
            "decoded": True,
            "user_id": payload.get("sub"),
            "tenant_id": payload.get("tenant_id"),
            "is_expired": is_expired,
            "time_to_expiry_seconds": time_to_expiry,
            "expires_at": expiry_time,
            "token_claims": payload
        }
    except JWTError as e:
        return {
            "valid": False,
            "decoded": False,
            "error": str(e)
        }

@router.get("/auth-logs")
async def get_auth_logs(lines: int = 100):
    """
    Get the most recent auth debug logs
    
    This endpoint returns the most recent lines from the auth debug log file for
    analysis in the debug console.
    """
    try:
        log_path = Path(auth_debug_file)
        
        if not log_path.exists():
            return {"logs": [], "message": "No log file found"}
        
        # Read last N lines of file
        with open(log_path, 'r') as f:
            # Efficient way to get last N lines
            recent_logs = []
            for line in f:
                recent_logs.append(line.strip())
                if len(recent_logs) > lines:
                    recent_logs.pop(0)
        
        return {"logs": recent_logs}
    except Exception as e:
        return {"logs": [], "error": str(e)}


@router.get("/feature-flags-status")
async def get_feature_flags_status():
    """
    Debug endpoint to check the status of the feature flags system.
    This is a public endpoint that doesn't require authentication, used for debugging.
    """
    from app.api.v1.endpoints.admin import _feature_flags, DEFAULT_FEATURE_FLAGS
    from app.core.config import settings
    import logging
    
    # Get logger
    logger = logging.getLogger(__name__)
    logger.info("Feature flags status endpoint accessed")
    
    try:
        # Count the number of tenants with feature flags
        tenant_count = len(_feature_flags)
        
        # Get the number of default flags
        default_flag_count = len(DEFAULT_FEATURE_FLAGS)
        
        # Get the actual endpoint paths
        api_prefix = settings.API_V1_STR
        
        # Provide helpful diagnostic information
        return {
            "status": "operational",
            "tenant_count": tenant_count,
            "default_flags": list(DEFAULT_FEATURE_FLAGS.keys()),
            "default_flag_count": default_flag_count,
            "api_prefix": api_prefix,  # Will be "/api/v1"
            "admin_endpoint": f"{api_prefix}/admin/feature-flags",
            "public_endpoint": f"{api_prefix}/debug/public-feature-flags",
            "feature_flags_implementation": "in-memory dict",
            "auth_required": True,
            "superuser_required": True,
            "debug_info": {
                "tenant_ids_with_flags": list(str(tid) for tid in _feature_flags.keys()) if _feature_flags else [],
                "timestamp": str(datetime.now())
            }
        }
    except Exception as e:
        logger.error(f"Error getting feature flags status: {e}")
        return {
            "status": "error",
            "message": "An error occurred while retrieving feature flags status",
            "error_type": str(type(e).__name__),
            "timestamp": str(datetime.now())
        }

@router.get("/public-feature-flags")
async def get_public_feature_flags():
    """
    Public endpoint to get default feature flags.
    Does not require authentication - intended for fallback use.
    
    Returns all the default feature flags as a simplified boolean dictionary.
    """
    from app.api.v1.endpoints.admin import DEFAULT_FEATURE_FLAGS
    import logging
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi import Request, Response
    
    # Get logger
    logger = logging.getLogger(__name__)
    logger.info("Public feature flags endpoint accessed")
    
    try:
        # Create a simplified flags dictionary with just boolean values
        simple_flags = {}
        for key, flag_obj in DEFAULT_FEATURE_FLAGS.items():
            simple_flags[key] = flag_obj.enabled
        
        return {
            "flags": simple_flags,
            "source": "default",
            "requires_auth": False,
            "timestamp": str(datetime.now())
        }
    except Exception as e:
        logger.error(f"Error getting public feature flags: {e}")
        # Return a minimal response with default values if we encounter any error
        return {
            "flags": {
                "enableDeltaStream": True,
                "enableIntegrations": True,
                "enableAnalytics": True,
                "enableSuggestions": True,
                "enableActivityTimeline": True,
                "enableTeamClustering": True,
                "enableHierarchyNavigator": True
            },
            "source": "fallback",
            "error": True,
            "timestamp": str(datetime.now())
        }