"""
Simple WebSocket-based delta stream for real-time updates.
This is a streamlined version that handles WebSocket connections without external dependencies.
"""
from __future__ import annotations

import json
import logging
from typing import Set, Dict, Any

from fastapi import WebSocket

# Set up logger
logger = logging.getLogger(__name__)

# Store active WebSocket connections
_connected: Set[WebSocket] = set()

async def register(ws: WebSocket):
    """Register a new WebSocket connection"""
    _connected.add(ws)
    logger.debug(f"WebSocket registered. Active connections: {len(_connected)}")

async def unregister(ws: WebSocket):
    """Unregister a WebSocket connection"""
    _connected.discard(ws)
    logger.debug(f"WebSocket unregistered. Active connections: {len(_connected)}")

async def broadcast(message: Dict[str, Any]):
    """Broadcast a message to all connected WebSocket clients"""
    if not _connected:
        return
    
    data = json.dumps(message)
    to_remove = []
    
    for ws in _connected:
        try:
            await ws.send_text(data)
        except Exception as e:
            logger.warning(f"Error broadcasting to WebSocket: {e}")
            to_remove.append(ws)
    
    # Clean up any disconnected WebSockets
    for ws in to_remove:
        await unregister(ws)