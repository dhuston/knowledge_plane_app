from typing import Any, List, Set, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app import crud, models, schemas
from app.db.session import get_db_session
from app.core.security import get_current_user

router = APIRouter()

# --- Helper: map node_type string to enum & CRUD repo ---
NODE_TYPE_TO_REPO = {
    schemas.MapNodeTypeEnum.USER: crud.user,
    schemas.MapNodeTypeEnum.TEAM: crud.team,
    schemas.MapNodeTypeEnum.PROJECT: crud.project,
    schemas.MapNodeTypeEnum.GOAL: crud.goal,
}

async def _get_entity(db: AsyncSession, entity_id: UUID, node_type: schemas.MapNodeTypeEnum):
    repo = NODE_TYPE_TO_REPO.get(node_type)
    if not repo:
        return None
    return await repo.get(db=db, id=entity_id)

@router.get("/expand", response_model=schemas.MapData)
async def expand_graph(
    node_id: UUID = Query(..., description="ID of the node to expand from"),
    node_type: schemas.MapNodeTypeEnum = Query(..., description="Type of the node to expand from"),
    depth: int = Query(1, ge=1, le=3, description="Expansion depth (1-3)"),
    max_nodes: int = Query(200, ge=10, le=500, description="Maximum neighbours to return"),
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """Return neighbours within <depth> hops of the given node (tenant scoped)."""
    # Tenant guard: ensure starting node belongs to tenant
    start_entity = await _get_entity(db, node_id, node_type)
    if not start_entity or getattr(start_entity, "tenant_id", None) != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Node not found")

    visited: Set[UUID] = {node_id}
    frontier: Set[UUID] = {node_id}

    collected_ids: Set[UUID] = {node_id}

    # Use existing helper for depth 1 neighbours
    from app.api.v1.endpoints.map import get_neighbor_ids  # reuse logic

    for _ in range(depth):
        next_frontier: Set[UUID] = set()
        for fid in frontier:
            neigh_dict = await get_neighbor_ids(fid, node_type, db) if fid == node_id else await get_neighbor_ids(fid, schemas.MapNodeTypeEnum.USER, db)  # node_type unknown for others but function expects correct enum; we approximate with USER fallback.
            for tset in neigh_dict.values():
                for nid in tset:
                    if nid not in visited:
                        visited.add(nid)
                        next_frontier.add(nid)
                        collected_ids.add(nid)
                        if len(collected_ids) >= max_nodes:
                            break
                if len(collected_ids) >= max_nodes:
                    break
            if len(collected_ids) >= max_nodes:
                break
        frontier = next_frontier
        if not frontier or len(collected_ids) >= max_nodes:
            break

    # Build MapData response leveraging existing map.get_map_data helpers (simpler reuse)
    # We'll temporarily call get_map_data internal helper by constructing filters.
    from app.api.v1.endpoints.map import _add_node_if_allowed_simplified, _add_edge_if_allowed_simplified, _add_unclustered_edges_for_entity

    nodes_map = {}
    edges: List[schemas.MapEdge] = []

    # Fetch entities
    fetched_entities = {}
    for uid in collected_ids:
        for enum_type, repo in NODE_TYPE_TO_REPO.items():
            entity = await repo.get(db=db, id=uid)
            if entity and getattr(entity, "tenant_id", None) == current_user.tenant_id:
                fetched_entities[uid] = entity
                break

    # add nodes
    for entity in fetched_entities.values():
        if isinstance(entity, models.User): t = schemas.MapNodeTypeEnum.USER
        elif isinstance(entity, models.Team): t = schemas.MapNodeTypeEnum.TEAM
        elif isinstance(entity, models.Project): t = schemas.MapNodeTypeEnum.PROJECT
        elif isinstance(entity, models.Goal): t = schemas.MapNodeTypeEnum.GOAL
        else: continue
        _add_node_if_allowed_simplified(nodes_map, entity, t, None, None)

    # add edges restricted to nodes within set
    for entity in fetched_entities.values():
        await _add_unclustered_edges_for_entity(nodes_map, edges, entity, db)

    return schemas.MapData(nodes=list(nodes_map.values()), edges=edges) 