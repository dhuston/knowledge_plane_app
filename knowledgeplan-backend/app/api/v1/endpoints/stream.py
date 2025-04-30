from fastapi import APIRouter, WebSocket, Depends
from jose import jwt, JWTError
from app.core.config import settings
from starlette import status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db_session
from app.crud.crud_user import user as crud_user

from app.core.delta_stream import register, unregister

router = APIRouter()

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
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. Validate / decode token -> obtain user id
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise JWTError()
        # We *could* check the user exists in DB here, but for now just accept.
    except JWTError:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 3. Accept connection & register
    await register(ws)
    try:
        while True:
            # Keep the connection alive – content is ignored.
            await ws.receive_text()
    except Exception:
        pass
    finally:
        await unregister(ws) 