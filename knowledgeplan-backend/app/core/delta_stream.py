from __future__ import annotations

import asyncio
import json
from typing import Set, Dict, Any

from fastapi import WebSocket

_connected: Set[WebSocket] = set()

async def register(ws: WebSocket):
    await ws.accept()
    _connected.add(ws)

async def unregister(ws: WebSocket):
    _connected.discard(ws)

async def broadcast(message: Dict[str, Any]):
    if not _connected:
        return
    data = json.dumps(message)
    to_remove = []
    for ws in _connected:
        try:
            await ws.send_text(data)
        except Exception:
            to_remove.append(ws)
    for ws in to_remove:
        await unregister(ws) 