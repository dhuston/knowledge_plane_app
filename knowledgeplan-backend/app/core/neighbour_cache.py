import os
import json
from typing import Optional, Set, Dict
from uuid import UUID

import redis.asyncio as redis_async

_REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

_redis_client: Optional[redis_async.Redis] = None

async def _get_client() -> redis_async.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis_async.from_url(_REDIS_URL, encoding="utf-8", decode_responses=True)
    return _redis_client

async def set_neighbors(tenant_id: UUID, node_id: UUID, depth: int, data: Dict[str, Set[str]], ttl: int = 3600):
    client = await _get_client()
    key = f"nbr:{tenant_id}:{node_id}:{depth}"
    await client.set(key, json.dumps({k:list(v) for k,v in data.items()}), ex=ttl)

async def get_neighbors(tenant_id: UUID, node_id: UUID, depth: int) -> Optional[Dict[str, Set[UUID]]]:
    client = await _get_client()
    key = f"nbr:{tenant_id}:{node_id}:{depth}"
    val = await client.get(key)
    if not val:
        return None
    raw = json.loads(val)
    return {k:set(UUID(x) for x in lst) for k,lst in raw.items()} 