from fastapi import APIRouter, Depends, HTTPException, Path, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Dict, Any

from app.crud.crud_user import user as crud_user
from app import models, schemas
from app.core import security
from app.db.session import get_db_session

router = APIRouter()

@router.get("/me", response_model=schemas.UserRead)
async def read_users_me(
    current_user: models.User = Depends(security.get_current_user),
    request: Request = None,
) -> models.User:
    """Fetch the current logged in user."""
    import logging
    import json
    import traceback
    from datetime import datetime, timezone
    
    # Regular logger
    logger = logging.getLogger(__name__)
    
    # Auth debug logger - dedicated for auth debugging
    auth_debug_logger = logging.getLogger("auth_debug")
    
    # Create a comprehensive debug log entry
    debug_entry = {
        "endpoint": "/users/me",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "has_current_user": current_user is not None,
        "request_info": {
            "headers": {},
            "client_host": str(request.client.host) if request and hasattr(request, 'client') and request.client else "unknown"
        }
    }
    
    # Add key headers for debugging
    if request:
        for header in ["user-agent", "referer", "origin", "x-forwarded-for", "accept"]:
            if header in request.headers:
                debug_entry["request_info"]["headers"][header] = request.headers[header]
    
    # Log detailed user info
    if current_user:
        logger.info(f"[USER INFO] /users/me endpoint accessed by authenticated user: {current_user.email}")
        logger.info(f"[USER INFO] User details - ID: {current_user.id}, Tenant: {current_user.tenant_id}")
        
        # Add user details to debug entry
        debug_entry["user"] = {
            "id": str(current_user.id),
            "email": current_user.email,
            "name": current_user.name,
            "tenant_id": str(current_user.tenant_id) if current_user.tenant_id else None,
            "team_id": str(current_user.team_id) if current_user.team_id else None,
            "auth_provider": current_user.auth_provider,
            "last_login": current_user.last_login_at.isoformat() if current_user.last_login_at else None
        }
        
        # Get auth token from request if available
        token = None
        if request and "Authorization" in request.headers:
            auth_header = request.headers.get("Authorization")
            if auth_header.startswith("Bearer "):
                token = auth_header.replace("Bearer ", "")
                debug_entry["has_token"] = True
                debug_entry["token_length"] = len(token)
                
                # Parse token for debugging
                from jose import jwt
                from app.core.config import settings
                try:
                    payload = jwt.decode(
                        token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
                    )
                    logger.info(f"[USER INFO] Token payload: user_id={payload.get('sub')}, tenant_id={payload.get('tenant_id')}")
                    
                    # Add token details to debug entry
                    debug_entry["token"] = {
                        "user_id": payload.get('sub'),
                        "tenant_id": str(payload.get('tenant_id')) if payload.get('tenant_id') else None,
                        "issued_at": datetime.fromtimestamp(payload.get('iat', 0)).isoformat() if payload.get('iat') else None,
                        "expires_at": datetime.fromtimestamp(payload.get('exp', 0)).isoformat() if payload.get('exp') else None,
                        "time_to_expiry_mins": round((payload.get('exp', 0) - datetime.now().timestamp()) / 60, 1) if payload.get('exp') else None,
                        "is_expired": payload.get('exp', 0) < datetime.now().timestamp() if payload.get('exp') else True,
                    }
                    
                    # Check if token user ID matches current user
                    token_user_id = payload.get('sub')
                    if token_user_id != str(current_user.id):
                        mismatch_msg = f"Token user_id {token_user_id} doesn't match current_user.id {current_user.id}"
                        logger.error(f"[USER INFO] MISMATCH: {mismatch_msg}")
                        debug_entry["user_id_mismatch"] = True
                        debug_entry["mismatch_details"] = mismatch_msg
                except Exception as e:
                    error_msg = f"Error decoding token: {str(e)}"
                    logger.error(f"[USER INFO] {error_msg}")
                    debug_entry["token_error"] = error_msg
                    debug_entry["token_error_traceback"] = traceback.format_exc()
        else:
            debug_entry["has_token"] = False
            logger.warning("[USER INFO] No Authorization header found in request")
    else:
        error_msg = "/users/me called but current_user is None! This shouldn't happen."
        logger.error(f"[USER INFO] {error_msg}")
        debug_entry["error"] = error_msg
        debug_entry["status"] = "error"
        
        # Try to get more info about the failed auth
        if request and "Authorization" in request.headers:
            auth_header = request.headers.get("Authorization")
            debug_entry["auth_header_present"] = True
            debug_entry["auth_header_type"] = auth_header.split()[0] if " " in auth_header else "unknown"
            
            # Try to decode the token if present
            if auth_header.startswith("Bearer "):
                token = auth_header.replace("Bearer ", "")
                debug_entry["token_length"] = len(token)
                
                # Just try to decode without verification to see what's in it
                try:
                    from jose import jwt
                    import base64
                    
                    parts = token.split('.')
                    if len(parts) == 3:
                        # Pad the payload part if needed
                        payload_part = parts[1]
                        padding = len(payload_part) % 4
                        if padding > 0:
                            payload_part += '=' * (4 - padding)
                            
                        try:
                            payload_bytes = base64.b64decode(payload_part)
                            payload_text = payload_bytes.decode('utf-8')
                            payload = json.loads(payload_text)
                            
                            debug_entry["raw_token_contents"] = {
                                "user_id": payload.get('sub'),
                                "tenant_id": str(payload.get('tenant_id')) if payload.get('tenant_id') else None,
                                "issued_at": datetime.fromtimestamp(payload.get('iat', 0)).isoformat() if payload.get('iat') else None,
                                "expires_at": datetime.fromtimestamp(payload.get('exp', 0)).isoformat() if payload.get('exp') else None,
                                "is_expired": payload.get('exp', 0) < datetime.now().timestamp() if payload.get('exp') else True,
                            }
                        except Exception as decode_err:
                            debug_entry["raw_token_decode_error"] = str(decode_err)
                except Exception as e:
                    debug_entry["token_analysis_error"] = str(e)
    
    # Log the comprehensive debug entry
    auth_debug_logger.info(f"USER_ME_REQUEST: {json.dumps(debug_entry)}")
    
    return current_user

@router.get("/{user_id}", response_model=schemas.UserRead)
async def read_user(
    user_id: UUID, 
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user),
) -> models.User:
    """Gets a specific user's details by their ID."""
    user = await crud_user.get(db, id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    # Ensure requested user is in the same tenant as current_user
    if user.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this user")
    return user

@router.put("/me", response_model=schemas.UserRead)
async def update_user_me(
    user_update: schemas.UserUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user),
) -> models.User:
    """Update current user profile."""
    updated_user = await crud_user.update(
        db, 
        db_obj=current_user, 
        obj_in=user_update
    )
    return updated_user