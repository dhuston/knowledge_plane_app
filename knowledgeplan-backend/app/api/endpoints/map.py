from typing import Any, List, Optional, Set
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
# Eager loading for relationships
from sqlalchemy.orm import selectinload 

from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("/data", response_model=schemas.MapData)
async def get_map_data(
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    types: Optional[str] = Query(None, description="Comma-separated list of node types to include (e.g., user,project,goal)"),
    # Add other filtering parameters later (e.g., center_node_id, depth)
) -> Any:
    """
    Retrieve nodes and edges for the Living Map visualization,
    centered around the current user's context, with optional type filtering.
    """
    nodes: List[schemas.MapNode] = []
    edges: List[schemas.MapEdge] = []
    node_ids = set()
    
    # Parse included types filter
    included_types: Optional[Set[schemas.MapNodeTypeEnum]] = None
    if types:
        try:
            included_types = {schemas.MapNodeTypeEnum(t.strip()) for t in types.split(',') if t.strip()}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid node type specified in 'types' parameter: {e}")

    # --- Helper function to add nodes/edges safely ---
    async def add_node_if_allowed(entity: Any, entity_type: schemas.MapNodeTypeEnum, data_override: dict = None) -> bool:
        """Adds node if type is allowed and not already added. Returns True if added."""
        if included_types is not None and entity_type not in included_types:
            return False
            
        node_id_str = str(entity.id)
        if node_id_str not in node_ids:
            node_data = {
                "name": getattr(entity, 'name', None),
                "title": getattr(entity, 'title', None),
                "status": getattr(entity, 'status', None),
                "type": getattr(entity, 'type', None),
                "avatar_url": getattr(entity, 'avatar_url', None),
            }
            if data_override:
                node_data.update(data_override)
            
            filtered_data = {k: v for k, v in node_data.items() if v is not None}

            nodes.append(schemas.MapNode(
                id=node_id_str,
                type=entity_type,
                label=getattr(entity, 'name', getattr(entity, 'title', node_id_str)),
                data=filtered_data
            ))
            node_ids.add(node_id_str)
            return True
        return False # Already added

    def add_edge_if_allowed(source_id: UUID, target_id: UUID, edge_type: schemas.MapEdgeTypeEnum, label: str = None):
        """Adds edge only if both source and target nodes are present in the map."""
        source_str = str(source_id)
        target_str = str(target_id)
        if source_str in node_ids and target_str in node_ids:
            edge_id = f"{source_str}_{edge_type.value}_{target_str}"
            # Basic duplicate check for edges
            if not any(e.id == edge_id for e in edges):
                edges.append(schemas.MapEdge(
                    id=edge_id,
                    source=source_str,
                    target=target_str,
                    type=edge_type,
                    label=label
                ))

    # --- Fetch and process data --- 
    fetched_entities = {} # Cache fetched entities to avoid redundant DB calls

    async def get_entity(entity_id: UUID, crud_repo: Any):
        if entity_id not in fetched_entities:
             entity = await crud_repo.get(db=db, id=entity_id)
             if entity and entity.tenant_id == current_user.tenant_id:
                 fetched_entities[entity_id] = entity
             else:
                 fetched_entities[entity_id] = None # Mark as checked but invalid/not found
        return fetched_entities.get(entity_id)

    # 1. Add current user
    await add_node_if_allowed(current_user, schemas.MapNodeTypeEnum.USER)
    fetched_entities[current_user.id] = current_user # Pre-populate cache

    # 2. Add user's manager
    if current_user.manager_id:
        manager = await get_entity(current_user.manager_id, crud.user)
        if manager:
            await add_node_if_allowed(manager, schemas.MapNodeTypeEnum.USER)
            add_edge_if_allowed(current_user.id, manager.id, schemas.MapEdgeTypeEnum.REPORTS_TO)

    # 3. Add user's team and lead
    if current_user.team_id:
        team = await get_entity(current_user.team_id, crud.team)
        if team:
            await add_node_if_allowed(team, schemas.MapNodeTypeEnum.TEAM)
            add_edge_if_allowed(current_user.id, team.id, schemas.MapEdgeTypeEnum.MEMBER_OF)
            if team.lead_id:
                team_lead = await get_entity(team.lead_id, crud.user)
                if team_lead:
                     await add_node_if_allowed(team_lead, schemas.MapNodeTypeEnum.USER)
                     add_edge_if_allowed(team.id, team_lead.id, schemas.MapEdgeTypeEnum.LEADS)

    # --- Fetch initial set of Projects and Goals --- 
    # Still using example fetching logic - TODO: Improve context-based fetching
    projects_to_process = []
    if included_types is None or schemas.MapNodeTypeEnum.PROJECT in included_types:
        projects_to_process = await crud.project.get_multi_by_tenant(db, tenant_id=current_user.tenant_id, limit=10)

    goals_to_process = []
    if included_types is None or schemas.MapNodeTypeEnum.GOAL in included_types:
        # Use eager loading for parent/children if needed frequently
        goals_to_process = await crud.goal.get_multi_by_tenant(db, tenant_id=current_user.tenant_id, limit=10)

    # --- Process Projects --- 
    for project in projects_to_process:
        project_added = await add_node_if_allowed(project, schemas.MapNodeTypeEnum.PROJECT)
        if project_added:
            fetched_entities[project.id] = project # Cache it
            # Link project to its owning team
            if project.owning_team_id:
                owning_team = await get_entity(project.owning_team_id, crud.team)
                if owning_team:
                    await add_node_if_allowed(owning_team, schemas.MapNodeTypeEnum.TEAM) # Ensure team node exists if allowed
                    add_edge_if_allowed(project.owning_team_id, project.id, schemas.MapEdgeTypeEnum.OWNS)
            
            # Link project to its goal
            if project.goal_id:
                goal = await get_entity(project.goal_id, crud.goal)
                if goal:
                    goal_added = await add_node_if_allowed(goal, schemas.MapNodeTypeEnum.GOAL)
                    add_edge_if_allowed(project.id, goal.id, schemas.MapEdgeTypeEnum.ALIGNED_TO)
                    # If goal was newly added, process its relationships too (basic hierarchy here)
                    if goal_added and goal.parent_id:
                        parent_goal = await get_entity(goal.parent_id, crud.goal)
                        if parent_goal:
                           await add_node_if_allowed(parent_goal, schemas.MapNodeTypeEnum.GOAL)
                           add_edge_if_allowed(goal.id, parent_goal.id, schemas.MapEdgeTypeEnum.ALIGNED_TO, label="Child Of")

    # --- Process Goals --- 
    # This ensures goals are processed even if not linked from fetched projects initially
    for goal in goals_to_process:
         goal_added = await add_node_if_allowed(goal, schemas.MapNodeTypeEnum.GOAL)
         if goal_added:
            fetched_entities[goal.id] = goal # Cache it
            # Link goal to its parent
            if goal.parent_id:
                parent_goal = await get_entity(goal.parent_id, crud.goal)
                if parent_goal:
                   await add_node_if_allowed(parent_goal, schemas.MapNodeTypeEnum.GOAL)
                   add_edge_if_allowed(goal.id, parent_goal.id, schemas.MapEdgeTypeEnum.ALIGNED_TO, label="Child Of")
            
            # Link goal to its projects (using relationship - might need eager loading)
            # NOTE: This might require fetching the goal with relationships loaded if not already done
            # For simplicity, we rely on projects already fetched and cached or fetched via project processing above.
            # A more robust solution might load goal.projects here if the goal node was added.
            # Example placeholder: Assume projects are in fetched_entities if relevant
            # related_projects = await crud.project.get_multi_by_goal(db, goal_id=goal.id, tenant_id=...) # Need specific CRUD
            # for proj in related_projects:
            #    if await add_node_if_allowed(proj, schemas.MapNodeTypeEnum.PROJECT):
            #        fetched_entities[proj.id] = proj
            #    add_edge_if_allowed(proj.id, goal.id, schemas.MapEdgeTypeEnum.ALIGNED_TO)

    return schemas.MapData(nodes=nodes, edges=edges) 