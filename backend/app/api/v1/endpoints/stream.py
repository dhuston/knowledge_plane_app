from fastapi import APIRouter, WebSocket, Depends
from jose import jwt, JWTError
from app.core.config import settings
from starlette import status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db_session
from app.crud.crud_user import user as crud_user
from uuid import UUID
import logging

from app.core.delta_stream import register, unregister

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/ws/delta")
async def delta_ws(ws: WebSocket):
    """Authenticated delta WebSocket endpoint.

    Clients must provide a valid JWT access token via the `token` query parameter
    (e.g.  /api/v1/ws/delta?token=eyJhbGciOi...).  If the token is missing or invalid
    the connection is closed with 1008 (Policy Violation).
    """

    # 1. Extract token from query params
    token = ws.query_params.get("token")
    if not token:
        logger.warning("WebSocket connection attempt with missing token")
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. Validate / decode token -> obtain user id
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        tenant_id_str = payload.get("tenant_id")
        
        if not user_id_str:
            logger.warning(f"WebSocket token missing 'sub' claim")
            raise JWTError()
            
        logger.info(f"WebSocket connection with token for user {user_id_str} and tenant {tenant_id_str}")
        
        # Accept the test/dev user without additional checks
        if user_id_str == "11111111-1111-1111-1111-111111111111":
            logger.info("Accepting WebSocket connection for dev user")
            await ws.accept()  # Accept the connection before registering
            await register(ws)
            try:
                while True:
                    # Keep the connection alive – content is ignored.
                    await ws.receive_text()
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
            finally:
                await unregister(ws)
            return
                
        # For other users, validate against DB (optional enhancement)
        # We *could* check the user exists in DB here with a db session
    except JWTError as e:
        logger.warning(f"WebSocket token validation error: {e}")
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    except Exception as e:
        logger.error(f"Unexpected error in WebSocket connection: {e}")
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 3. Accept connection & register
    await ws.accept()  # Explicitly accept the connection before registering
    await register(ws)
    try:
        while True:
            # Keep the connection alive – content is ignored.
            await ws.receive_text()
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await unregister(ws)