import os
import json
from typing import Optional, Set, Dict, List, Tuple, Any
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

# Spatial caching functions
async def cache_nodes_spatial(tenant_id: UUID, nodes: List[Dict[str, Any]], ttl: int = 3600):
    """
    Cache node positions for spatial queries
    
    Args:
        tenant_id: The tenant ID
        nodes: List of node data dictionaries with id, x, y coordinates
        ttl: Cache TTL in seconds
    """
    if not nodes:
        return
        
    client = await _get_client()
    pipeline = client.pipeline()
    
    # Set spatial index by grid (simple spatial partitioning)
    grid_size = 100  # Grid size for spatial binning
    
    # Group nodes by grid cell
    grid_cells = {}
    for node in nodes:
        if 'id' in node and 'x' in node and 'y' in node:
            # Calculate grid cell
            grid_x = int(node['x'] // grid_size)
            grid_y = int(node['y'] // grid_size)
            cell_key = f"{grid_x}:{grid_y}"
            
            # Add to grid cell
            if cell_key not in grid_cells:
                grid_cells[cell_key] = []
            grid_cells[cell_key].append(node['id'])
    
    # Store nodes in grid cells
    for cell_key, node_ids in grid_cells.items():
        spatial_key = f"spatial:{tenant_id}:{cell_key}"
        # Use SET to store all node IDs in a cell with TTL
        pipeline.set(spatial_key, json.dumps(node_ids), ex=ttl)
    
    # Individual node positions
    for node in nodes:
        if 'id' in node and 'x' in node and 'y' in node:
            pos_key = f"pos:{tenant_id}:{node['id']}"
            pipeline.set(pos_key, json.dumps({"x": node['x'], "y": node['y']}), ex=ttl)
    
    await pipeline.execute()

async def get_nodes_in_area(tenant_id: UUID, min_x: float, min_y: float, 
                          max_x: float, max_y: float) -> List[str]:
    """
    Get node IDs within a rectangular area using the spatial cache
    
    Args:
        tenant_id: The tenant ID
        min_x: Minimum X coordinate
        min_y: Minimum Y coordinate
        max_x: Maximum X coordinate
        max_y: Maximum Y coordinate
        
    Returns:
        List of node IDs in the area
    """
    client = await _get_client()
    grid_size = 100  # Must match the grid size used in cache_nodes_spatial
    
    # Calculate grid cells that intersect with the query rectangle
    min_grid_x = int(min_x // grid_size)
    min_grid_y = int(min_y // grid_size)
    max_grid_x = int(max_x // grid_size)
    max_grid_y = int(max_y // grid_size)
    
    # Get all cells in the range
    pipeline = client.pipeline()
    for grid_x in range(min_grid_x, max_grid_x + 1):
        for grid_y in range(min_grid_y, max_grid_y + 1):
            cell_key = f"{grid_x}:{grid_y}"
            spatial_key = f"spatial:{tenant_id}:{cell_key}"
            pipeline.get(spatial_key)
    
    results = await pipeline.execute()
    
    # Collect node IDs
    node_ids = []
    for result in results:
        if result:
            nodes_in_cell = json.loads(result)
            node_ids.extend(nodes_in_cell)
    
    return node_ids 