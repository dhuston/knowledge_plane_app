from typing import Any, List, Optional, Set, Dict, Tuple, TypeVar, Generic
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
# Eager loading for relationships
from sqlalchemy.orm import selectinload 
from sqlalchemy import select

from app.crud.crud_user import user as crud_user # Specific imports
from app.crud.crud_team import team as crud_team
from app.crud.crud_project import project as crud_project
from app.crud.crud_goal import goal as crud_goal
from app import models, schemas, crud
# Removed: from app.api import deps
# Import dependencies directly
from app.db.session import get_db_session
from app.core.security import get_current_user # Use get_current_user for now
from app.models.project import project_participants
from app.core.neighbour_cache import get_neighbors, set_neighbors

router = APIRouter()

# Helper function to get the appropriate repository based on entity type
def get_entity_repository(entity_type: schemas.MapNodeTypeEnum) -> Any:
    """
    Returns the appropriate CRUD repository based on the entity type.
    
    Args:
        entity_type: The type of entity (user, team, project, goal, etc.)
        
    Returns:
        The corresponding CRUD repository or None if not found
    """
    repo_map = {
        schemas.MapNodeTypeEnum.USER: crud_user,
        schemas.MapNodeTypeEnum.TEAM: crud_team,
        schemas.MapNodeTypeEnum.PROJECT: crud_project,
        schemas.MapNodeTypeEnum.GOAL: crud_goal,
        # Add other entity types as needed
    }
    return repo_map.get(entity_type)

# Helper function to determine entity type from model instance
def get_entity_type_from_model(entity: Any) -> Optional[schemas.MapNodeTypeEnum]:
    """
    Determines the MapNodeTypeEnum value based on the entity model class.
    
    Args:
        entity: The entity model instance
        
    Returns:
        The corresponding MapNodeTypeEnum value or None if not recognized
    """
    if isinstance(entity, models.User): 
        return schemas.MapNodeTypeEnum.USER
    elif isinstance(entity, models.Team): 
        return schemas.MapNodeTypeEnum.TEAM
    elif isinstance(entity, models.Project): 
        return schemas.MapNodeTypeEnum.PROJECT
    elif isinstance(entity, models.Goal): 
        return schemas.MapNodeTypeEnum.GOAL
    elif isinstance(entity, models.Department):
        return schemas.MapNodeTypeEnum.DEPARTMENT
    elif isinstance(entity, models.KnowledgeAsset):
        return schemas.MapNodeTypeEnum.KNOWLEDGE_ASSET
    # Add other entity types as needed
    return None

# Helper function to add an entity to the appropriate fetch set based on its type
def add_entity_to_fetch_sets(
    entity_id: UUID, 
    entity_type: schemas.MapNodeTypeEnum,
    user_ids: Set[UUID],
    team_ids: Set[UUID],
    project_ids: Set[UUID],
    goal_ids: Set[UUID]
) -> None:
    """
    Adds an entity ID to the appropriate fetch set based on its type.
    
    Args:
        entity_id: The ID of the entity
        entity_type: The type of the entity
        user_ids: Set of user IDs to fetch
        team_ids: Set of team IDs to fetch
        project_ids: Set of project IDs to fetch
        goal_ids: Set of goal IDs to fetch
    """
    if entity_type == schemas.MapNodeTypeEnum.USER:
        user_ids.add(entity_id)
    elif entity_type == schemas.MapNodeTypeEnum.TEAM:
        team_ids.add(entity_id)
    elif entity_type == schemas.MapNodeTypeEnum.PROJECT:
        project_ids.add(entity_id)
    elif entity_type == schemas.MapNodeTypeEnum.GOAL:
        goal_ids.add(entity_id)
    # Add other entity types as needed

# Helper function to check if an entity passes the filters
def passes_filters(entity: Any, entity_type: schemas.MapNodeTypeEnum, 
                  included_types: Optional[Set[schemas.MapNodeTypeEnum]] = None,
                  included_statuses: Optional[Set[str]] = None) -> bool:
    """
    Checks if an entity passes the specified filters.
    
    Args:
        entity: The entity to check
        entity_type: The type of the entity
        included_types: Set of entity types to include (if None, include all)
        included_statuses: Set of statuses to include (if None, include all)
        
    Returns:
        True if the entity passes all filters, False otherwise
    """
    # Check type filter first
    if included_types is not None and entity_type not in included_types:
        return False
        
    # Check status filter for Projects and Goals
    if included_statuses is not None and entity_type in [schemas.MapNodeTypeEnum.PROJECT, schemas.MapNodeTypeEnum.GOAL]:
        entity_status = getattr(entity, 'status', None)
        if not entity_status or entity_status.lower() not in included_statuses:
            return False
    
    return True

# --- Helper Function to Get 1-Hop Neighbors --- 
async def get_neighbor_ids(node_id: UUID, node_type: schemas.MapNodeTypeEnum, db: AsyncSession) -> Dict[str, Set[UUID]]:
    """Given a node ID and type, find the IDs of its direct neighbors."""
    # check redis cache first
    cached = await get_neighbors(node_id=node_id, tenant_id=UUID(int=0), depth=1)  # tenant handling later
    if cached:
        return cached
    
    neighbors = {
        "user": set(),
        "team": set(),
        "project": set(),
        "goal": set(),
    }
    
    # Need to import models/crud/association table within the function scope if not globally available
    from app import models, crud
    from app.models.project import project_participants
    from sqlalchemy import select # Ensure select is imported

    entity = await get_entity_internal(node_id, node_type, db) # Need internal fetch helper
    if not entity:
        return neighbors # Return empty if entity not found/accessible

    # Logic based on the entity type (similar to the previous centered view logic)
    if node_type == schemas.MapNodeTypeEnum.USER:
        user = entity
        if user.manager_id: neighbors["user"].add(user.manager_id)
        if user.team_id: neighbors["team"].add(user.team_id)
        # Direct reports
        reports_stmt = select(models.User.id).where(models.User.manager_id == user.id)
        report_ids = (await db.execute(reports_stmt)).scalars().all()
        neighbors["user"].update(report_ids)
        # Participating projects
        participating_project_ids = await crud.user.get_participating_project_ids(db=db, user_id=user.id)
        neighbors["project"].update(participating_project_ids)
        
    elif node_type == schemas.MapNodeTypeEnum.TEAM:
        team = entity
        if team.lead_id: neighbors["user"].add(team.lead_id)
        # Members
        member_ids = await crud.team.get_member_ids(db=db, team_id=team.id)
        neighbors["user"].update(member_ids)
        # Owned projects
        owned_project_ids = await crud.project.get_ids_by_owning_team(db=db, team_id=team.id)
        neighbors["project"].update(owned_project_ids)
        
    elif node_type == schemas.MapNodeTypeEnum.PROJECT:
        project = entity
        if project.owning_team_id: neighbors["team"].add(project.owning_team_id)
        if project.goal_id: neighbors["goal"].add(project.goal_id)
        # Participants 
        participants_stmt = select(project_participants.c.user_id).where(project_participants.c.project_id == project.id)
        participant_ids = (await db.execute(participants_stmt)).scalars().all()
        neighbors["user"].update(participant_ids)

    elif node_type == schemas.MapNodeTypeEnum.GOAL:
        goal = entity
        if goal.parent_id: neighbors["goal"].add(goal.parent_id)
        # Child goals
        child_goals_stmt = select(models.Goal.id).where(models.Goal.parent_id == goal.id)
        child_goal_ids = (await db.execute(child_goals_stmt)).scalars().all()
        neighbors["goal"].update(child_goal_ids)
        # Aligned projects
        aligned_projects_stmt = select(models.Project.id).where(models.Project.goal_id == goal.id)
        aligned_project_ids = (await db.execute(aligned_projects_stmt)).scalars().all()
        neighbors["project"].update(aligned_project_ids)
        
    # Remove the original node_id from the neighbor sets if present
    if node_type == schemas.MapNodeTypeEnum.USER: neighbors["user"].discard(node_id)
    elif node_type == schemas.MapNodeTypeEnum.TEAM: neighbors["team"].discard(node_id)
    elif node_type == schemas.MapNodeTypeEnum.PROJECT: neighbors["project"].discard(node_id)
    elif node_type == schemas.MapNodeTypeEnum.GOAL: neighbors["goal"].discard(node_id)
        
    await set_neighbors(UUID(int=0), node_id, 1, {k: {str(x) for x in v} for k,v in neighbors.items()})
    return neighbors

# Internal helper to fetch entity without using the main cache (to avoid side effects within neighbor calculation)
# This needs access to current_user for tenant check
# Or, it assumes node_id provided is already validated for tenant access
async def get_entity_internal(node_id: UUID, node_type: schemas.MapNodeTypeEnum, db: AsyncSession) -> Any:
    """
    Internal helper to fetch entity without using the main cache.
    Uses the entity repository lookup helper to get the appropriate repository.
    
    Args:
        node_id: The ID of the entity to fetch
        node_type: The type of the entity (user, team, project, goal, etc.)
        db: The database session
        
    Returns:
        The entity if found, None otherwise
    """
    repo = get_entity_repository(node_type)
    
    if repo:
        # Assuming crud.get methods handle not found appropriately (return None)
        # We might need tenant check here depending on how crud methods work
        return await repo.get(db=db, id=node_id)
    return None

@router.get("/data", response_model=schemas.MapData)
async def get_map_data(
    db: AsyncSession = Depends(get_db_session), # Use get_db_session
    # Use get_current_user for now, needs active check later
    current_user: models.User = Depends(get_current_user), 
    types: Optional[str] = Query(None, description="Comma-separated list of node types to include (e.g., user,project,goal)"),
    center_node_id: Optional[UUID] = Query(None, description="ID of the node to center the map view on."),
    depth: int = Query(1, description="Depth of relationships to fetch from the center node (1 or 2).", ge=1, le=2), # Allow depth 1 or 2
    # Add status filter parameter
    statuses: Optional[str] = Query(None, description="Comma-separated list of statuses to include (e.g., active,planning). Applies to Projects/Goals."),
    # Add cluster_teams parameter
    cluster_teams: bool = Query(False, description="Whether to cluster users under their team nodes."),
    # Add pagination parameters
    page: int = Query(1, description="Page number for pagination", ge=1),
    limit: int = Query(100, description="Maximum number of nodes per page", ge=10, le=1000),
    # Add viewport parameters for Level-of-Detail (LOD) rendering
    view_x: Optional[float] = Query(None, description="X coordinate of the viewport center"),
    view_y: Optional[float] = Query(None, description="Y coordinate of the viewport center"),
    view_ratio: Optional[float] = Query(None, description="Camera ratio (zoom level) of the viewport"),
) -> Any:
    """
    Retrieve nodes and edges for the Living Map visualization,
    centered around the current user's context, with optional type filtering.
    """
    nodes: List[schemas.MapNode] = []
    edges: List[schemas.MapEdge] = []
    node_ids = set() # Tracks IDs of nodes *actually added* to the response
    fetched_entities = {} # Cache fetched entities to avoid redundant DB calls
    
    # --- Parse included types filter ---
    included_types: Optional[Set[schemas.MapNodeTypeEnum]] = None
    if types:
        try:
            included_types = {schemas.MapNodeTypeEnum(t.strip()) for t in types.split(',') if t.strip()}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid node type specified in 'types' parameter: {e}")

    # --- Parse included statuses filter --- 
    included_statuses: Optional[Set[str]] = None
    if statuses:
        # Normalize to lowercase for case-insensitive matching
        included_statuses = {s.strip().lower() for s in statuses.split(',') if s.strip()}

    # --- Helper function to fetch entity if not already cached (ensures tenant isolation) ---
    async def get_entity(entity_id: UUID, crud_repo: Any) -> Any:
        if entity_id in fetched_entities:
            return fetched_entities[entity_id]
            
        # Assume tenant_id check happens if required by the specific crud repo's get method
        # (e.g., crud_project.get requires it)
        # But crud.project.get *does* use it. Needs consistency check or conditional passing.
        # Need to pass tenant_id conditionally if the method accepts it
        if crud_repo == crud_project:
            entity = await crud_repo.get(db=db, id=entity_id, tenant_id=current_user.tenant_id)
        else:
            entity = await crud_repo.get(db=db, id=entity_id) # Assume other gets don't need tenant_id
        
        if entity and hasattr(entity, 'tenant_id') and entity.tenant_id == current_user.tenant_id:
            fetched_entities[entity_id] = entity
            return entity
        else:
            # Handle cases where entity doesn't have tenant_id or it doesn't match
            fetched_entities[entity_id] = None # Cache miss/invalid
            return None

    # --- Helper function to add nodes (if allowed by type AND status filter) ---
    async def add_node_if_allowed(entity: Any, entity_type: schemas.MapNodeTypeEnum) -> bool:
        # Check type filter first
        if included_types is not None and entity_type not in included_types:
            return False
            
        # Check status filter for Projects and Goals
        if included_statuses is not None and entity_type in [schemas.MapNodeTypeEnum.PROJECT, schemas.MapNodeTypeEnum.GOAL]:
            entity_status = getattr(entity, 'status', None)
            if not entity_status or entity_status.lower() not in included_statuses:
                return False # Don't add if status doesn't match

        # Existing checks: check if entity is valid and not already added
        if not entity:
             return False
        node_id_str = str(entity.id)
        if node_id_str not in node_ids:
            node_data = { # Extract relevant fields for frontend display
                "name": getattr(entity, 'name', None),
                "title": getattr(entity, 'title', None),
                "status": getattr(entity, 'status', None),
                "type": getattr(entity, 'type', None), # Ensure Goal type is included if exists
                "avatar_url": getattr(entity, 'avatar_url', None),
                 # Add team_id for User nodes specifically
                "team_id": getattr(entity, 'team_id', None) if isinstance(entity, models.User) else None,
                # Include due_date (for Goal or other entities that define it)
                "due_date": getattr(entity, 'due_date', None).isoformat() if getattr(entity, 'due_date', None) is not None else None,
            }
            filtered_data = {k: v for k, v in node_data.items() if v is not None}
            nodes.append(schemas.MapNode(
                id=node_id_str,
                type=entity_type,
                label=getattr(entity, 'name', getattr(entity, 'title', node_id_str)),
                data=filtered_data
            ))
            node_ids.add(node_id_str)
            return True
            
        return False # Already added or not allowed by filters

    # --- Helper function to add edges (only if both nodes were added) ---
    def add_edge_if_allowed(source_id: Optional[UUID], target_id: Optional[UUID], edge_type: schemas.MapEdgeTypeEnum, label: str = None):
        if not source_id or not target_id: return # Skip if source or target ID is missing
        source_str = str(source_id)
        target_str = str(target_id)
        if source_str in node_ids and target_str in node_ids:
            edge_id = f"{source_str}_{edge_type.value}_{target_str}"
            if not any(e.id == edge_id for e in edges):
                edges.append(schemas.MapEdge(
                    id=edge_id, source=source_str, target=target_str, type=edge_type, label=label
                ))

    # --- Processing starts below ---

    # --- 1. Identify the core set of entity IDs --- 
    user_ids_to_fetch = set()
    team_ids_to_fetch = set()
    project_ids_to_fetch = set()
    goal_ids_to_fetch = set()
    parent_goal_ids_to_fetch = set()
    
    # Track viewport parameters for LOD-aware loading
    viewport_details = None
    if view_x is not None and view_y is not None and view_ratio is not None:
        viewport_details = {
            "x": view_x,
            "y": view_y,
            "ratio": view_ratio,
            # Calculate viewport bounds for spatial queries
            "radius": 1000 / view_ratio  # Larger radius when zoomed out
        }
        print(f"Using viewport-based filtering: center=({view_x}, {view_y}), zoom={view_ratio}")

    if center_node_id:
        # --- Centered View Logic --- 
        print(f"Fetching centered view for node: {center_node_id}, depth: {depth}")
        
        # Determine center node type using our helper function
        center_node = None
        center_node_type = None
        
        # Try each possible node type using the entity repository helper
        for node_type in [schemas.MapNodeTypeEnum.USER, schemas.MapNodeTypeEnum.TEAM, 
                          schemas.MapNodeTypeEnum.PROJECT, schemas.MapNodeTypeEnum.GOAL]:
            repo = get_entity_repository(node_type)
            # Use the main get_entity helper which uses cache and checks tenant
            entity = await get_entity(center_node_id, repo) 
            if entity:
                center_node = entity
                center_node_type = node_type
                break
                
        if not center_node or not center_node_type:
             raise HTTPException(status_code=404, detail=f"Center node with ID {center_node_id} not found or not accessible.")

        # Add center node to fetch sets using our helper function
        add_entity_to_fetch_sets(
            center_node_id, 
            center_node_type,
            user_ids_to_fetch,
            team_ids_to_fetch,
            project_ids_to_fetch,
            goal_ids_to_fetch
        )

        # Get depth 1 neighbors using the helper
        depth1_neighbors = await get_neighbor_ids(center_node_id, center_node_type, db)
        depth1_neighbor_tuples = set() # Store as (id, type) tuples
        
        # Add depth 1 neighbors to fetch sets and tuple list
        for user_id in depth1_neighbors.get("user", set()):
            user_ids_to_fetch.add(user_id)
            depth1_neighbor_tuples.add((user_id, schemas.MapNodeTypeEnum.USER))
        for team_id in depth1_neighbors.get("team", set()):
            team_ids_to_fetch.add(team_id)
            depth1_neighbor_tuples.add((team_id, schemas.MapNodeTypeEnum.TEAM))
        for project_id in depth1_neighbors.get("project", set()):
            project_ids_to_fetch.add(project_id)
            depth1_neighbor_tuples.add((project_id, schemas.MapNodeTypeEnum.PROJECT))
        for goal_id in depth1_neighbors.get("goal", set()):
            goal_ids_to_fetch.add(goal_id)
            depth1_neighbor_tuples.add((goal_id, schemas.MapNodeTypeEnum.GOAL))

        # If depth is 2, get neighbors of depth 1 neighbors
        if depth == 2:
            print(f"Fetching depth 2 neighbors...")
            for neighbor_id, neighbor_type in depth1_neighbor_tuples:
                depth2_neighbors = await get_neighbor_ids(neighbor_id, neighbor_type, db)
                # Add depth 2 neighbors to fetch sets
                user_ids_to_fetch.update(depth2_neighbors.get("user", set()))
                team_ids_to_fetch.update(depth2_neighbors.get("team", set()))
                project_ids_to_fetch.update(depth2_neighbors.get("project", set()))
                goal_ids_to_fetch.update(depth2_neighbors.get("goal", set()))

    else:
        # --- User-Centric Context or Viewport-Based Logic ---
        if viewport_details:
            # Use viewport for LOD-based loading when available
            print(f"Fetching viewport-centered view at ({viewport_details['x']}, {viewport_details['y']}), zoom ratio: {viewport_details['ratio']}")
            
            # Logic for viewport-based filtering:
            # 1. Start with the user's immediate context
            # 2. Add entities based on viewport (with spatial indexing if available)
            # 3. Apply LOD based on zoom level
            
            # Load fewer entities when zoomed out
            max_entities_per_type = min(50, int(500 / (viewport_details['ratio'] + 0.1)))
            print(f"Using LOD with max {max_entities_per_type} entities per type")
            
            # Always include the user's immediate context
            user_ids_to_fetch.add(current_user.id)
            if current_user.team_id:
                team_ids_to_fetch.add(current_user.team_id)
            
            # Fetch spatial data (would be optimized with spatial indexing in a real implementation)
            # For now, we'll just use pagination as approximation
            
            # Include important relationships like manager/team even when zoomed out
            if current_user.manager_id:
                user_ids_to_fetch.add(current_user.manager_id)
            
            # When zoomed in, show more detail
            if viewport_details['ratio'] < 0.8:  # More zoomed in
                if current_user.team_id:
                    # Show team members when zoomed in
                    member_ids = await crud.team.get_member_ids(db=db, team_id=current_user.team_id)
                    user_ids_to_fetch.update(member_ids)
                
                # Add user's projects
                participating_project_ids = await crud.user.get_participating_project_ids(
                    db=db, user_id=current_user.id)
                project_ids_to_fetch.update(participating_project_ids)
                
                if project_ids_to_fetch:
                    # Add goals related to those projects
                    linked_goal_ids = await crud.project.get_goal_ids_for_projects(
                        db=db, project_ids=list(project_ids_to_fetch))
                    goal_ids_to_fetch.update(linked_goal_ids)
        else:
            # --- Standard User-Centric Context Logic --- 
            print(f"Fetching user-centric view for user: {current_user.id}")
            user_ids_to_fetch.add(current_user.id)
            if current_user.manager_id:
                user_ids_to_fetch.add(current_user.manager_id)
            user_team_id = current_user.team_id 
            if user_team_id:
                team_ids_to_fetch.add(user_team_id)
                team_obj_for_lead = await crud.team.get(db=db, id=user_team_id)
                if team_obj_for_lead and team_obj_for_lead.lead_id:
                    user_ids_to_fetch.add(team_obj_for_lead.lead_id)
                member_ids = await crud.team.get_member_ids(db=db, team_id=user_team_id)
                user_ids_to_fetch.update(member_ids)
            participating_project_ids = await crud.user.get_participating_project_ids(db=db, user_id=current_user.id)
            project_ids_to_fetch.update(participating_project_ids)
            if user_team_id:
                team_owned_project_ids = await crud.project.get_ids_by_owning_team(db=db, team_id=user_team_id)
                project_ids_to_fetch.update(team_owned_project_ids)
            if project_ids_to_fetch:
                linked_goal_ids = await crud.project.get_goal_ids_for_projects(db=db, project_ids=list(project_ids_to_fetch))
                goal_ids_to_fetch.update(linked_goal_ids)
    
    # --- Apply pagination limits ---
    
    # Helper function to prioritize and limit entity sets based on page and limit
    def apply_pagination_to_entities(entity_sets, page, per_page_limit):
        total_entities = sum(len(entity_set) for entity_set in entity_sets)
        if total_entities <= per_page_limit:
            # No need to paginate if we have fewer entities than the limit
            return entity_sets
        
        # Calculate how many entities we can include per type
        entities_per_type = max(1, per_page_limit // len(entity_sets))
        
        # Apply pagination offset
        offset = (page - 1) * per_page_limit
        
        # Skip whole entity types if we're on a later page
        remaining_offset = offset
        result_sets = []
        
        for entity_set in entity_sets:
            if remaining_offset >= len(entity_set):
                # Skip this entire set
                remaining_offset -= len(entity_set)
                result_sets.append(set())
            else:
                # Take a portion of this set
                sorted_entities = sorted(entity_set)  # Sort for deterministic pagination
                if remaining_offset > 0:
                    # Skip some entities in this set
                    take_count = min(entities_per_type, len(entity_set) - remaining_offset)
                    result_sets.append(set(sorted_entities[remaining_offset:remaining_offset+take_count]))
                    remaining_offset = 0
                else:
                    # Take entities up to the per-type limit
                    result_sets.append(set(sorted_entities[:entities_per_type]))
        
        return result_sets
    
    # Apply pagination to limit the number of entities we fetch
    if page > 1 or len(user_ids_to_fetch) + len(team_ids_to_fetch) + len(project_ids_to_fetch) + len(goal_ids_to_fetch) > limit:
        print(f"Applying pagination: page={page}, limit={limit}")
        entity_sets = [user_ids_to_fetch, team_ids_to_fetch, project_ids_to_fetch, goal_ids_to_fetch]
        paginated_sets = apply_pagination_to_entities(entity_sets, page, limit)
        
        user_ids_to_fetch, team_ids_to_fetch, project_ids_to_fetch, goal_ids_to_fetch = paginated_sets
        
    # --- 2. Fetch all identified entities (using cache) ---
    # Fetch Users
    for user_id in user_ids_to_fetch:
        if user_id not in fetched_entities:
            await get_entity(user_id, crud_user)
    # Fetch Teams
    for team_id in team_ids_to_fetch:
        if team_id not in fetched_entities:
            await get_entity(team_id, crud_team)
    # Fetch Projects (requires tenant_id)
    for project_id in project_ids_to_fetch:
        if project_id not in fetched_entities:
            await get_entity(project_id, crud_project)
    # Fetch Goals
    for goal_id in goal_ids_to_fetch:
        if goal_id not in fetched_entities:
            await get_entity(goal_id, crud_goal)

    # --- 3/4. Process fetched entities into Nodes and Edges (Clustered or Unclustered) ---
    MIN_MEMBERS_FOR_CLUSTER = 4 # Define threshold
    processed_user_ids = set() # Keep track of users processed (clustered or added individually)
    final_nodes_map = {} # Use dict for easier node lookup {node_id_str: node_object}

    if cluster_teams:
        # --- Simplified Clustered Processing --- 
        print(f"Processing CLUSTERED map data (threshold: {MIN_MEMBERS_FOR_CLUSTER})...")
        users_by_team: Dict[UUID, List[models.User]] = {}
        teams_to_cluster: Set[UUID] = set()

        # First pass: Group users and identify teams large enough to cluster
        for entity_id, entity in fetched_entities.items():
            if isinstance(entity, models.User) and entity.team_id:
                team_id = entity.team_id
                if team_id not in users_by_team: users_by_team[team_id] = []
                users_by_team[team_id].append(entity)
        
        for team_id, members in users_by_team.items():
            if len(members) >= MIN_MEMBERS_FOR_CLUSTER:
                teams_to_cluster.add(team_id)
                processed_user_ids.update(member.id for member in members)

        # Second pass: Add nodes to final_nodes_map
        for entity_id, entity in fetched_entities.items():
            if not entity: continue
            node_id_str = str(entity.id)
            node_type_enum = None
            should_add = True

            if isinstance(entity, models.User):
                if entity.id in processed_user_ids:
                    should_add = False # Skip users who are part of a cluster
                else:
                    node_type_enum = schemas.MapNodeTypeEnum.USER
            elif isinstance(entity, models.Team):
                if entity.id in teams_to_cluster:
                    node_type_enum = schemas.MapNodeTypeEnum.TEAM_CLUSTER
                else:
                    node_type_enum = schemas.MapNodeTypeEnum.TEAM
            elif isinstance(entity, models.Project):
                node_type_enum = schemas.MapNodeTypeEnum.PROJECT
            elif isinstance(entity, models.Goal):
                node_type_enum = schemas.MapNodeTypeEnum.GOAL
            # Add other types here
            else: # Skip unknown types
                 should_add = False 

            # Check type filter
            if included_types is not None and node_type_enum not in included_types:
                should_add = False
                
            # Check status filter for Projects and Goals
            if included_statuses is not None and node_type_enum in [schemas.MapNodeTypeEnum.PROJECT, schemas.MapNodeTypeEnum.GOAL]:
                 entity_status = getattr(entity, 'status', None)
                 if not entity_status or entity_status.lower() not in included_statuses:
                     should_add = False
            
            if should_add:
                 node_data = { # Extract common data
                     "name": getattr(entity, 'name', None),
                     "title": getattr(entity, 'title', None),
                     "status": getattr(entity, 'status', None),
                     "type": getattr(entity, 'type', None),
                     "avatar_url": getattr(entity, 'avatar_url', None),
                     "team_id": getattr(entity, 'team_id', None) if isinstance(entity, models.User) else None,
                     # Include due_date (for Goal or other entities that define it)
                     "due_date": getattr(entity, 'due_date', None).isoformat() if getattr(entity, 'due_date', None) is not None else None,
                 }
                 # Add member count for clusters
                 if node_type_enum == schemas.MapNodeTypeEnum.TEAM_CLUSTER:
                     node_data["memberCount"] = len(users_by_team.get(entity.id, []))
                     
                 filtered_data = {k: v for k, v in node_data.items() if v is not None}
                 final_nodes_map[node_id_str] = schemas.MapNode(
                     id=node_id_str,
                     type=node_type_enum,
                     label=getattr(entity, 'name', getattr(entity, 'title', node_id_str)),
                     data=filtered_data
                 )

        # --- Add Edges (Simplified Re-routing) --- 
        for entity_id, entity in fetched_entities.items():
            if not entity: continue
            source_id = entity.id
            source_id_str = str(source_id)

            # Determine the effective source ID (might be the cluster ID)
            effective_source_id_str = source_id_str
            if isinstance(entity, models.User) and entity.id in processed_user_ids:
                 effective_source_id_str = str(entity.team_id) # Use team ID as source if user is clustered
            elif isinstance(entity, models.Team) and entity.id in teams_to_cluster:
                 effective_source_id_str = source_id_str # Source is the cluster itself
            
            # Skip if the effective source node wasn't actually added
            if effective_source_id_str not in final_nodes_map: continue

            # --- Define potential targets based on entity type --- 
            potential_targets: List[Tuple[Optional[UUID], schemas.MapEdgeTypeEnum, Optional[str]]] = []
            if isinstance(entity, models.User) and entity.id not in processed_user_ids: # Only add edges for non-clustered users
                potential_targets.append((entity.manager_id, schemas.MapEdgeTypeEnum.REPORTS_TO, None))
                potential_targets.append((entity.team_id, schemas.MapEdgeTypeEnum.MEMBER_OF, None))
                # Participation
                participated_in_ids = await crud_user.get_participating_project_ids(db=db, user_id=entity.id)
                for proj_id in participated_in_ids:
                    potential_targets.append((proj_id, schemas.MapEdgeTypeEnum.PARTICIPATES_IN, None))
                # Direct Reports (reverse edge)
                reports_stmt = select(models.User.id).where(models.User.manager_id == entity.id)
                report_ids = (await db.execute(reports_stmt)).scalars().all()
                for report_id in report_ids:
                    # Add edge FROM report TO this user (manager)
                    potential_targets.append((report_id, schemas.MapEdgeTypeEnum.REPORTS_TO, f"target:{entity.id}")) # Special marker
            
            elif isinstance(entity, models.Team):
                # Edges from Team/Cluster node
                is_cluster = entity.id in teams_to_cluster
                if entity.lead_id: potential_targets.append((entity.lead_id, schemas.MapEdgeTypeEnum.LEADS, None))
                # Owned projects edge (Project -> Team/Cluster)
                owned_project_ids = await crud_project.get_ids_by_owning_team(db=db, team_id=entity.id)
                for proj_id in owned_project_ids:
                    potential_targets.append((proj_id, schemas.MapEdgeTypeEnum.OWNS, f"source:{entity.id}")) # Special marker
                # Member edges are handled via User
            
            elif isinstance(entity, models.Project):
                # Owning team edge handled via Team loop
                potential_targets.append((entity.goal_id, schemas.MapEdgeTypeEnum.ALIGNED_TO, None))
                # Participant edges handled via User loop
            
            elif isinstance(entity, models.Goal):
                potential_targets.append((entity.parent_id, schemas.MapEdgeTypeEnum.ALIGNED_TO, "Child Of"))
                # Child goal edges (reverse)
                child_goals_stmt = select(models.Goal.id).where(models.Goal.parent_id == entity.id)
                child_goal_ids = (await db.execute(child_goals_stmt)).scalars().all()
                for child_id in child_goal_ids:
                    potential_targets.append((child_id, schemas.MapEdgeTypeEnum.ALIGNED_TO, f"target:{entity.id},Child Of")) # Special marker
                # Aligned project edges handled via Project loop

            # --- Process potential target edges --- 
            for target_data in potential_targets:
                target_id = target_data[0]
                if not target_id: continue # Skip if target ID is null
                # Determine edge type based on relationship and label hint
                base_edge_type = target_data[1]
                edge_type = base_edge_type
                if base_edge_type == schemas.MapEdgeTypeEnum.ALIGNED_TO and target_data[2] == "Child Of":
                    edge_type = schemas.MapEdgeTypeEnum.PARENT_OF

                label_info = target_data[2]
                label = None
                edge_source_id_str = effective_source_id_str # Start with effective source
                edge_target_id_str = str(target_id) # Start with direct target

                # Handle special markers for reversed edges
                if label_info and label_info.startswith("target:"):
                    parts = label_info.split(",", 1)
                    edge_target_id_str = parts[0].split(":")[1]
                    edge_source_id_str = str(target_id) # The original target becomes the source
                    label = parts[1] if len(parts) > 1 else None
                    # Ensure correct edge type for reversed parent-child
                    if base_edge_type == schemas.MapEdgeTypeEnum.ALIGNED_TO and label == "Child Of":
                        edge_type = schemas.MapEdgeTypeEnum.PARENT_OF
                elif label_info and label_info.startswith("source:"):
                    edge_source_id_str = label_info.split(":")[1]
                    edge_target_id_str = str(source_id) # The original source becomes the target
                    label = None # Label usually not needed for OWNS
                else:
                    label = label_info # Use label directly if no marker

                # Clear the specific label hint used for type determination
                if label == "Child Of":
                    label = None

                # Determine effective target ID (might be a cluster)
                target_entity = fetched_entities.get(UUID(edge_target_id_str)) if edge_target_id_str else None
                effective_target_id_str = edge_target_id_str
                if isinstance(target_entity, models.User) and target_entity.team_id:
                    target_team_id = target_entity.team_id
                    if target_team_id in teams_to_cluster:
                        effective_target_id_str = str(target_team_id)
                
                # Add edge if both effective source/target nodes exist
                if effective_source_id_str in final_nodes_map and effective_target_id_str in final_nodes_map:
                     # Check for self-loops again after re-routing
                     if effective_source_id_str != effective_target_id_str:
                        # Use add_edge_if_allowed (needs slight modification to work with dict)
                        _add_edge_if_allowed_simplified(final_nodes_map, edges, effective_source_id_str, effective_target_id_str, edge_type, label)

    else:
        # --- Unclustered Processing --- 
        print("Processing UNCLUSTERED map data...")
        for entity_id, entity in fetched_entities.items():
            if not entity: continue 
            
            # Use a helper function to determine entity type based on class
            node_type_enum = get_entity_type_from_model(entity)
            
            if node_type_enum:
                # Use simplified node adding to map
                 _add_node_if_allowed_simplified(final_nodes_map, entity, node_type_enum, included_types, included_statuses)
        
        # Add edges between added nodes (Simplified)
        for entity_id, entity in fetched_entities.items():
            if not entity or str(entity.id) not in final_nodes_map: continue
            # Use simplified edge adding
            _add_unclustered_edges_for_entity(final_nodes_map, edges, entity, db) 
            
    # Convert final_nodes_map values to list
    final_nodes_list = list(final_nodes_map.values())

    return schemas.MapData(nodes=final_nodes_list, edges=edges)

# --- Simplified Helper Functions for Node/Edge Adding (Internal to get_map_data) ---
# These are needed because the original helpers relied on the global nodes/edges/node_ids lists

def _add_node_if_allowed_simplified(nodes_map: Dict[str, schemas.MapNode], entity: Any, entity_type: schemas.MapNodeTypeEnum, included_types: Optional[Set[schemas.MapNodeTypeEnum]], included_statuses: Optional[Set[str]]):
    """
    Simplified helper to add a node to the map if it passes all filters.
    Uses the passes_filters helper to check if the entity should be added.
    
    Args:
        nodes_map: Dictionary mapping node IDs to MapNode objects
        entity: The entity to potentially add as a node
        entity_type: The type of the entity
        included_types: Set of entity types to include (if None, include all)
        included_statuses: Set of statuses to include (if None, include all)
        
    Returns:
        True if the node was added, False otherwise
    """
    entity_id_str = str(entity.id)
    entity_label = getattr(entity, 'name', getattr(entity, 'title', entity_id_str))
    
    # Use our centralized filter checking logic
    if not passes_filters(entity, entity_type, included_types, included_statuses):
        filter_type = "TYPE" if included_types is not None and entity_type not in included_types else "STATUS"
        entity_status = getattr(entity, 'status', None)
        print(f"[Map Endpoint] Skipping node {entity_id_str} ({entity_label}) due to {filter_type} filter. Status: {entity_status}")
        return False
            
    node_id_str = str(entity.id) # Renamed from entity_id_str above, corrected here
    if node_id_str not in nodes_map:
        node_data = { 
            "name": getattr(entity, 'name', None), "title": getattr(entity, 'title', None),
            "status": getattr(entity, 'status', None), "type": getattr(entity, 'type', None),
            "avatar_url": getattr(entity, 'avatar_url', None),
            "team_id": getattr(entity, 'team_id', None) if isinstance(entity, models.User) else None,
            # Include due_date (for Goal or other entities that define it)
            "due_date": getattr(entity, 'due_date', None).isoformat() if getattr(entity, 'due_date', None) is not None else None,
        }
        filtered_data = {k: v for k, v in node_data.items() if v is not None}
        nodes_map[node_id_str] = schemas.MapNode(
            id=node_id_str, type=entity_type,
            label=getattr(entity, 'name', getattr(entity, 'title', node_id_str)),
            data={k: v for k, v in filtered_data.items() if v is not None}
        )
        return True
    # else: # Log if already added (optional)
        # print(f"[Map Endpoint] Node {entity_id_str} ({entity_label}) already added.")
    return False

def _add_edge_if_allowed_simplified(nodes_map: Dict[str, schemas.MapNode], edges: List[schemas.MapEdge], source_id_str: str, target_id_str: str, edge_type: schemas.MapEdgeTypeEnum, label: Optional[str] = None):
    if source_id_str in nodes_map and target_id_str in nodes_map:
        edge_id = f"{source_id_str}_{edge_type.value}_{target_id_str}"
        if not any(e.id == edge_id for e in edges):
            edges.append(schemas.MapEdge(
                id=edge_id, source=source_id_str, target=target_id_str, type=edge_type, label=label
            ))

async def _add_unclustered_edges_for_entity(nodes_map: Dict[str, schemas.MapNode], edges: List[schemas.MapEdge], entity: Any, db: AsyncSession):
    # Simplified edge logic from previous unclustered version
    from app.models.project import project_participants # Need import here
    from sqlalchemy import select
    
    source_id_str = str(entity.id)
    if source_id_str not in nodes_map: return

    if isinstance(entity, models.User):
        if entity.manager_id: _add_edge_if_allowed_simplified(nodes_map, edges, source_id_str, str(entity.manager_id), schemas.MapEdgeTypeEnum.REPORTS_TO)
        if entity.team_id: _add_edge_if_allowed_simplified(nodes_map, edges, source_id_str, str(entity.team_id), schemas.MapEdgeTypeEnum.MEMBER_OF)
        stmt = select(project_participants.c.project_id).where(project_participants.c.user_id == entity.id)
        p_ids = (await db.execute(stmt)).scalars().all()
        for p_id in p_ids: _add_edge_if_allowed_simplified(nodes_map, edges, source_id_str, str(p_id), schemas.MapEdgeTypeEnum.PARTICIPATES_IN)
        r_stmt = select(models.User.id).where(models.User.manager_id == entity.id)
        r_ids = (await db.execute(r_stmt)).scalars().all()
        for r_id in r_ids: _add_edge_if_allowed_simplified(nodes_map, edges, str(r_id), source_id_str, schemas.MapEdgeTypeEnum.REPORTS_TO)
    elif isinstance(entity, models.Team):
        if entity.lead_id: _add_edge_if_allowed_simplified(nodes_map, edges, source_id_str, str(entity.lead_id), schemas.MapEdgeTypeEnum.LEADS)
        # Owned projects
        owned_p_ids = await crud.project.get_ids_by_owning_team(db=db, team_id=entity.id)
        for p_id in owned_p_ids: _add_edge_if_allowed_simplified(nodes_map, edges, source_id_str, str(p_id), schemas.MapEdgeTypeEnum.OWNS)
    elif isinstance(entity, models.Project):
        # Owning team edge added via Team loop
        if entity.goal_id: _add_edge_if_allowed_simplified(nodes_map, edges, source_id_str, str(entity.goal_id), schemas.MapEdgeTypeEnum.ALIGNED_TO)
    elif isinstance(entity, models.Goal):
        if entity.parent_id: _add_edge_if_allowed_simplified(nodes_map, edges, source_id_str, str(entity.parent_id), schemas.MapEdgeTypeEnum.PARENT_OF)
        # Child goals
        c_stmt = select(models.Goal.id).where(models.Goal.parent_id == entity.id)
        c_ids = (await db.execute(c_stmt)).scalars().all()
        for c_id in c_ids: 
            # Edge from child to parent is PARENT_OF
            _add_edge_if_allowed_simplified(nodes_map, edges, str(c_id), source_id_str, schemas.MapEdgeTypeEnum.PARENT_OF) 