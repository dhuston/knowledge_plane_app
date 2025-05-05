from typing import Dict, List, Optional, Any, Set
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func

from app.core.security import get_current_user
from app.db.session import get_db_session
from app import schemas, models, crud
from app.models.node import Node
from app.models.edge import Edge
from app.core.neighbour_cache import get_neighbors, set_neighbors

router = APIRouter()

@router.get("/health", response_model=Dict[str, Any])
async def map_health_check():
    """
    Health check endpoint for the map service.
    Returns status 200 if the map service is working.
    """
    return {
        "status": "ok",
        "service": "map",
        "timestamp": datetime.now().isoformat(),
    }

# Helper functions that appear to be missing but are used by graph.py
def get_entity_repository(entity_type: schemas.MapNodeTypeEnum):
    """Get the CRUD repository for a given entity type."""
    if entity_type == schemas.MapNodeTypeEnum.USER:
        return crud.user
    elif entity_type == schemas.MapNodeTypeEnum.TEAM:
        return crud.team
    elif entity_type == schemas.MapNodeTypeEnum.PROJECT:
        return crud.project
    elif entity_type == schemas.MapNodeTypeEnum.GOAL:
        return crud.goal
    return None

def get_entity_type_from_model(entity: Any) -> Optional[schemas.MapNodeTypeEnum]:
    """Get the entity type from a model instance."""
    if isinstance(entity, models.User):
        return schemas.MapNodeTypeEnum.USER
    elif isinstance(entity, models.Team):
        return schemas.MapNodeTypeEnum.TEAM
    elif isinstance(entity, models.Project):
        return schemas.MapNodeTypeEnum.PROJECT
    elif isinstance(entity, models.Goal):
        return schemas.MapNodeTypeEnum.GOAL
    return None

def passes_filters(
    entity: Any,
    entity_type: schemas.MapNodeTypeEnum,
    included_types: Optional[Set[schemas.MapNodeTypeEnum]] = None,
    included_statuses: Optional[Set[str]] = None
) -> bool:
    """Check if an entity passes the type and status filters."""
    # Type filter
    if included_types and entity_type not in included_types:
        return False
    
    # Status filter
    if included_statuses:
        if entity_type in [schemas.MapNodeTypeEnum.PROJECT, schemas.MapNodeTypeEnum.GOAL]:
            if hasattr(entity, "status") and entity.status not in included_statuses:
                return False
    
    return True

async def get_entity_internal(
    entity_id: UUID,
    entity_type: schemas.MapNodeTypeEnum,
    db: AsyncSession
) -> Optional[Any]:
    """Get an entity from the database using the appropriate CRUD repository."""
    repo = get_entity_repository(entity_type)
    if not repo:
        return None
    
    return await repo.get(db=db, id=entity_id)

async def get_neighbor_ids(
    entity_id: UUID,
    entity_type: schemas.MapNodeTypeEnum,
    db: AsyncSession
) -> Dict[str, Set[UUID]]:
    """
    Get IDs of entities connected to the given entity.
    
    Returns a dictionary with keys 'user', 'team', 'project', 'goal' and set values of IDs.
    """
    # Initialize result structure - maps entity type to set of entity IDs
    result = {
        "user": set(),
        "team": set(),
        "project": set(),
        "goal": set()
    }
    
    # Try to get from cache first
    entity = await get_entity_internal(entity_id, entity_type, db)
    if not entity:
        return result  # Entity not found
        
    tenant_id = getattr(entity, "tenant_id", None)
    if not tenant_id:
        return result  # Entity has no tenant
        
    # Check cache
    cached = await get_neighbors(tenant_id, entity_id, 1)
    if cached:
        return cached
    
    # Handle different entity types
    if entity_type == schemas.MapNodeTypeEnum.USER:
        # User's manager
        if entity.manager_id:
            result["user"].add(entity.manager_id)
        
        # User's team
        if entity.team_id:
            result["team"].add(entity.team_id)
        
        # User's direct reports
        reports_query = select(models.User.id).where(
            and_(
                models.User.manager_id == entity_id,
                models.User.tenant_id == tenant_id
            )
        )
        direct_reports = await db.execute(reports_query)
        report_ids = direct_reports.scalars().all()
        result["user"].update(report_ids)
        
        # Projects the user participates in
        project_ids = await crud.user.get_participating_project_ids(db, entity)
        result["project"].update(project_ids)
        
    elif entity_type == schemas.MapNodeTypeEnum.TEAM:
        # Team lead
        if entity.lead_id:
            result["user"].add(entity.lead_id)
        
        # Team members
        member_ids = await crud.team.get_member_ids(db, entity)
        result["user"].update(member_ids)
        
        # Projects owned by the team
        project_ids = await crud.project.get_ids_by_owning_team(db, entity_id)
        result["project"].update(project_ids)
        
    elif entity_type == schemas.MapNodeTypeEnum.PROJECT:
        # Owning team
        if entity.owning_team_id:
            result["team"].add(entity.owning_team_id)
        
        # Project participants
        participant_ids = await crud.project.get_participant_ids(db, entity)
        result["user"].update(participant_ids)
        
        # Related goals
        goal_ids = await crud.project.get_goal_ids(db, entity)
        result["goal"].update(goal_ids)
        
    elif entity_type == schemas.MapNodeTypeEnum.GOAL:
        # Projects aligned with this goal
        project_ids = await crud.goal.get_aligned_project_ids(db, entity)
        result["project"].update(project_ids)
        
        # Parent goals
        if entity.parent_id:
            result["goal"].add(entity.parent_id)
            
        # Child goals
        child_query = select(models.Goal.id).where(
            and_(
                models.Goal.parent_id == entity_id,
                models.Goal.tenant_id == tenant_id
            )
        )
        children = await db.execute(child_query)
        child_ids = children.scalars().all()
        result["goal"].update(child_ids)
    
    # Cache the result for future use
    await set_neighbors(tenant_id, entity_id, 1, result)
    
    return result
    
# Additional helper functions for graph.py
def _add_node_if_allowed_simplified(
    nodes_map: Dict[str, Any],
    entity: Any,
    entity_type: schemas.MapNodeTypeEnum,
    included_types: Optional[Set[schemas.MapNodeTypeEnum]] = None,
    included_statuses: Optional[Set[str]] = None
) -> None:
    """Add a node to the node map if it passes filters."""
    # Check if the entity passes filters
    if not passes_filters(entity, entity_type, included_types, included_statuses):
        return
    
    # Entity ID as string
    entity_id_str = str(entity.id)
    
    # Skip if already in the map
    if entity_id_str in nodes_map:
        return
    
    # Create the node
    node = schemas.MapNode(
        id=entity_id_str,
        label=entity.name if hasattr(entity, "name") else "Unnamed",
        type=entity_type,
        data={},
    )
    
    # Add position if available
    if hasattr(entity, "x") and hasattr(entity, "y"):
        node.position = schemas.MapNodePosition(
            x=float(entity.x) if entity.x is not None else 0.0,
            y=float(entity.y) if entity.y is not None else 0.0,
        )
    
    # Add entity-specific data
    if entity_type == schemas.MapNodeTypeEnum.USER:
        node.data["title"] = entity.title if hasattr(entity, "title") else None
        node.data["email"] = entity.email if hasattr(entity, "email") else None
    elif entity_type == schemas.MapNodeTypeEnum.PROJECT:
        node.data["status"] = entity.status if hasattr(entity, "status") else None
        node.data["description"] = entity.description if hasattr(entity, "description") else None
    elif entity_type == schemas.MapNodeTypeEnum.GOAL:
        node.data["status"] = entity.status if hasattr(entity, "status") else None
        node.data["progress"] = entity.progress if hasattr(entity, "progress") else None
    elif entity_type == schemas.MapNodeTypeEnum.TEAM:
        # Get member count (would need DB for this, using placeholder)
        node.data["memberCount"] = 1  # Placeholder
    
    # Add to the map
    nodes_map[entity_id_str] = node.dict()

def _add_edge_if_allowed_simplified(
    edges: List[schemas.MapEdge],
    src_id: UUID,
    dst_id: UUID,
    label: str,
    edge_id: Optional[UUID] = None
) -> None:
    """Add an edge to the edge list."""
    # Generate a UUID if none is provided
    if edge_id is None:
        import uuid
        edge_id = uuid.uuid4()
    
    # Convert label string to proper enum
    try:
        # Try to convert to enum, fallback to RELATED_TO if not valid
        edge_type = schemas.MapEdgeTypeEnum(label) if hasattr(schemas.MapEdgeTypeEnum, label) else schemas.MapEdgeTypeEnum.RELATED_TO
    except (ValueError, KeyError):
        edge_type = schemas.MapEdgeTypeEnum.RELATED_TO
    
    edge = schemas.MapEdge(
        id=str(edge_id),
        source=str(src_id),
        target=str(dst_id),
        type=edge_type
    )
    edges.append(edge)

async def _add_unclustered_edges_for_entity(
    nodes_map: Dict[str, Any],
    edges: List[schemas.MapEdge],
    entity: Any,
    db: AsyncSession
) -> None:
    """Add edges for an entity based on its connected entities."""
    entity_id = entity.id
    entity_type = get_entity_type_from_model(entity)
    
    if not entity_type:
        return
    
    # Get neighbor IDs with error handling
    try:
        neighbor_dict = await get_neighbor_ids(entity_id, entity_type, db)
    except Exception as e:
        print(f"Error getting neighbors for entity {entity_id}: {e}")
        # Use empty fallback in case of error
        neighbor_dict = {"user": set(), "team": set(), "project": set(), "goal": set()}
    
    # Add edges only if both nodes are in the nodes map
    entity_id_str = str(entity_id)
    
    # Process each type of neighbor
    for neighbor_type, neighbor_ids in neighbor_dict.items():
        for neighbor_id in neighbor_ids:
            neighbor_id_str = str(neighbor_id)
            
            # Skip if either node is not in the map
            if entity_id_str not in nodes_map or neighbor_id_str not in nodes_map:
                continue
            
            # Determine edge label based on entity and neighbor types
            edge_label = "RELATED_TO"  # Default
            
            if entity_type == schemas.MapNodeTypeEnum.USER:
                if neighbor_type == "team":
                    edge_label = "MEMBER_OF"
                elif neighbor_type == "user":
                    # Check if this is a manager relationship
                    if hasattr(entity, "manager_id") and entity.manager_id == neighbor_id:
                        edge_label = "REPORTS_TO"
                    else:
                        edge_label = "MANAGES"  # Assumes the opposite relationship
                elif neighbor_type == "project":
                    edge_label = "PARTICIPATES_IN"
                    
            elif entity_type == schemas.MapNodeTypeEnum.TEAM:
                if neighbor_type == "user":
                    if hasattr(entity, "lead_id") and entity.lead_id == neighbor_id:
                        edge_label = "LED_BY"
                    else:
                        edge_label = "HAS_MEMBER"
                elif neighbor_type == "project":
                    edge_label = "OWNS"
                    
            elif entity_type == schemas.MapNodeTypeEnum.PROJECT:
                if neighbor_type == "team":
                    edge_label = "OWNED_BY"
                elif neighbor_type == "user":
                    edge_label = "HAS_PARTICIPANT"
                elif neighbor_type == "goal":
                    edge_label = "ALIGNED_TO"
                    
            elif entity_type == schemas.MapNodeTypeEnum.GOAL:
                if neighbor_type == "project":
                    edge_label = "ALIGNED_WITH"
                elif neighbor_type == "goal":
                    if hasattr(entity, "parent_id") and entity.parent_id == neighbor_id:
                        edge_label = "CHILD_OF"
                    else:
                        edge_label = "PARENT_OF"
            
            # Add the edge
            _add_edge_if_allowed_simplified(
                edges,
                entity_id,
                neighbor_id,
                edge_label
            )

@router.get("/path", response_model=Dict[str, Any])
async def get_hierarchy_path(
    db: AsyncSession = Depends(get_db_session),
    current_user: Any = Depends(get_current_user),
):
    """
    Get the organizational hierarchy path for the current user.
    
    Returns a path from the user up through teams, departments, and the organization,
    along with information about each entity in the path.
    """
    # This is where we would fetch the actual hierarchy data from the database
    # For now, we'll return a structured response with the user's position in the hierarchy
    
    # Get IDs from current user for hierarchy
    user_id = str(current_user.id)
    team_id = str(current_user.team_id) if current_user.team_id else None
    
    # Build the path
    path = []
    units = {}
    
    # Initialize with organization level
    organization_id = "org-1"
    path.append(organization_id)
    units[organization_id] = {
        "id": organization_id,
        "type": "organization",
        "name": "Biosphere Corporation",
        "level": 0,
        "path": [organization_id]
    }
    
    # Add division level if applicable
    if team_id:
        division_id = "div-1"
        path.append(division_id)
        units[division_id] = {
            "id": division_id,
            "type": "division", 
            "name": "Research & Development",
            "parentId": organization_id,
            "level": 1,
            "path": [organization_id, division_id]
        }
        
        # Add department level if applicable
        department_id = "dept-1"
        path.append(department_id)
        units[department_id] = {
            "id": department_id,
            "type": "department",
            "name": "AI Department",
            "parentId": division_id,
            "level": 2,
            "path": [organization_id, division_id, department_id]
        }
        
        # Add team level
        path.append(team_id)
        units[team_id] = {
            "id": team_id,
            "type": "team",
            "name": "Knowledge Engine Team",
            "parentId": department_id,
            "level": 3,
            "path": [organization_id, division_id, department_id, team_id]
        }
    
    # Add user level
    path.append(user_id)
    units[user_id] = {
        "id": user_id,
        "type": "user",
        "name": current_user.name,
        "parentId": team_id,
        "level": 4,
        "path": [organization_id, division_id, department_id, team_id, user_id] if team_id else [organization_id, user_id]
    }
    
    return {
        "path": path,
        "units": units
    }

@router.get("/unit/{unit_id}", response_model=Dict[str, Any])
async def get_hierarchy_unit(
    unit_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: Any = Depends(get_current_user),
):
    """
    Get details about a specific unit in the hierarchy with its children.
    
    Parameters:
    - unit_id: ID of the unit to fetch details for
    
    Returns:
    - Details about the unit and its immediate children
    """
    # Mock data - in a real implementation, this would fetch from database
    
    # Organization level
    if unit_id == "org-1":
        return {
            "unit": {
                "id": "org-1",
                "type": "organization",
                "name": "Biosphere Corporation",
                "level": 0,
                "path": ["org-1"]
            },
            "children": [
                {
                    "id": "div-1",
                    "type": "division",
                    "name": "Research & Development",
                    "parentId": "org-1",
                    "level": 1,
                    "path": ["org-1", "div-1"]
                },
                {
                    "id": "div-2",
                    "type": "division",
                    "name": "Operations",
                    "parentId": "org-1", 
                    "level": 1,
                    "path": ["org-1", "div-2"]
                }
            ]
        }
    
    # Division level
    elif unit_id == "div-1":
        return {
            "unit": {
                "id": "div-1", 
                "type": "division",
                "name": "Research & Development",
                "parentId": "org-1",
                "level": 1,
                "path": ["org-1", "div-1"]
            },
            "children": [
                {
                    "id": "dept-1",
                    "type": "department",
                    "name": "AI Department", 
                    "parentId": "div-1",
                    "level": 2,
                    "path": ["org-1", "div-1", "dept-1"]
                },
                {
                    "id": "dept-2", 
                    "type": "department",
                    "name": "Data Science",
                    "parentId": "div-1",
                    "level": 2,
                    "path": ["org-1", "div-1", "dept-2"]
                }
            ]
        }
    
    # Department level
    elif unit_id == "dept-1":
        return {
            "unit": {
                "id": "dept-1",
                "type": "department",
                "name": "AI Department",
                "parentId": "div-1", 
                "level": 2,
                "path": ["org-1", "div-1", "dept-1"]
            },
            "children": [
                {
                    "id": str(current_user.team_id) if current_user.team_id else "team-1",
                    "type": "team",
                    "name": "Knowledge Engine Team",
                    "parentId": "dept-1",
                    "level": 3,
                    "path": ["org-1", "div-1", "dept-1", str(current_user.team_id) if current_user.team_id else "team-1"]
                }
            ]
        }
    
    # Team level
    elif unit_id == str(current_user.team_id):
        return {
            "unit": {
                "id": str(current_user.team_id),
                "type": "team", 
                "name": "Knowledge Engine Team",
                "parentId": "dept-1",
                "level": 3,
                "path": ["org-1", "div-1", "dept-1", str(current_user.team_id)]
            },
            "children": [
                {
                    "id": str(current_user.id),
                    "type": "user",
                    "name": current_user.name,
                    "parentId": str(current_user.team_id),
                    "level": 4,
                    "path": ["org-1", "div-1", "dept-1", str(current_user.team_id), str(current_user.id)]
                }
            ]
        }
    
    # User level
    elif unit_id == str(current_user.id):
        return {
            "unit": {
                "id": str(current_user.id),
                "type": "user",
                "name": current_user.name,
                "title": current_user.title,
                "parentId": str(current_user.team_id) if current_user.team_id else None,
                "level": 4,
                "path": ["org-1", "div-1", "dept-1", str(current_user.team_id), str(current_user.id)] if current_user.team_id else ["org-1", str(current_user.id)]
            },
            "children": []
        }
    
    # Unit not found
    raise HTTPException(status_code=404, detail="Hierarchy unit not found")

@router.get("/search", response_model=List[Dict[str, Any]])
async def search_hierarchy(
    query: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: Any = Depends(get_current_user),
    type: Optional[str] = None,
):
    """
    Search for units in the hierarchy by name.
    
    Parameters:
    - query: Search query string
    - type: Optional filter for unit type (organization, division, department, team, user)
    
    Returns:
    - List of matching units
    """
    # Mock implementation - in a real system this would query the database
    results = []
    
    # Add mock results based on query
    if "ai" in query.lower():
        results.append({
            "id": "dept-1",
            "type": "department",
            "name": "AI Department",
            "level": 2,
            "parentId": "div-1",
            "path": ["org-1", "div-1", "dept-1"]
        })
    
    if "knowledge" in query.lower():
        results.append({
            "id": str(current_user.team_id) if current_user.team_id else "team-1",
            "type": "team", 
            "name": "Knowledge Engine Team",
            "level": 3,
            "parentId": "dept-1",
            "path": ["org-1", "div-1", "dept-1", str(current_user.team_id) if current_user.team_id else "team-1"]
        })
    
    if "research" in query.lower():
        results.append({
            "id": "div-1",
            "type": "division",
            "name": "Research & Development",
            "level": 1,
            "parentId": "org-1",
            "path": ["org-1", "div-1"]
        })
    
    # Add current user if query matches
    if query.lower() in current_user.name.lower():
        results.append({
            "id": str(current_user.id),
            "type": "user",
            "name": current_user.name,
            "level": 4,
            "parentId": str(current_user.team_id) if current_user.team_id else None,
            "path": ["org-1", "div-1", "dept-1", str(current_user.team_id), str(current_user.id)] if current_user.team_id else ["org-1", str(current_user.id)]
        })
    
    # Filter by type if specified
    if type:
        results = [r for r in results if r["type"] == type]
    
    return results
    
@router.get("/graph", response_model=Dict[str, Any])
async def get_graph_data(
    limit: Optional[int] = 1000,
    db: AsyncSession = Depends(get_db_session),
    current_user: Any = Depends(get_current_user),
):
    """
    Get graph data for the Living Map visualization.
    
    Parameters:
    - limit: Optional limit on the number of nodes to return
    
    Returns:
    - Dictionary with nodes and edges for the graph visualization
    """
    tenant_id = current_user.tenant_id
    
    try:
        print(f"Processing graph data request for tenant: {tenant_id}")
        
        # Query nodes - select specific columns to avoid position column issues
        node_query = select(
            Node.id,
            Node.tenant_id,
            Node.type,
            Node.props,
            Node.x,
            Node.y
        ).where(Node.tenant_id == tenant_id).limit(limit)
        
        node_result = await db.execute(node_query)
        nodes = node_result.all()
        
        print(f"Found {len(nodes)} nodes for tenant: {tenant_id}")
        
        # Get node IDs for edge query
        node_ids = [node.id for node in nodes]
        
        # Query edges where both source and target are in the selected nodes
        edge_query = select(Edge).where(
            and_(
                Edge.tenant_id == tenant_id,
                Edge.src.in_(node_ids),
                Edge.dst.in_(node_ids)
            )
        )
        edge_result = await db.execute(edge_query)
        edges = edge_result.scalars().all()
        
        print(f"Found {len(edges)} edges for tenant: {tenant_id}")
        
        # Format nodes for response
        formatted_nodes = []
        for node in nodes:
            # Extract the name and entity_id from props
            props = node.props or {}
            if isinstance(props, str):
                # Parse JSON if needed
                import json
                try:
                    props = json.loads(props)
                except:
                    props = {}
                    
            name = props.get("name", "Unnamed")
            entity_id = props.get("entity_id", str(node.id))
            
            # Create position object for compatibility
            position = {
                "x": float(node.x) if node.x is not None else 0,
                "y": float(node.y) if node.y is not None else 0
            }
            
            formatted_nodes.append({
                "id": str(node.id),
                "label": name,
                "type": node.type,
                "x": position["x"],  # Add x directly for some visualization libraries
                "y": position["y"],  # Add y directly for some visualization libraries
                "position": position, # Add position object for others
                "data": {
                    "entity_id": entity_id,
                    "name": name,
                    **(props if isinstance(props, dict) else {})
                }
            })
        
        # Format edges for response
        formatted_edges = []
        for edge in edges:
            formatted_edges.append({
                "id": str(edge.id),
                "source": str(edge.src),
                "target": str(edge.dst),
                "type": edge.label,  # Add type for compatibility
                "label": edge.label,
                "data": edge.props or {}
            })
        
        response_data = {
            "nodes": formatted_nodes,
            "edges": formatted_edges
        }
        
        print(f"Returning {len(formatted_nodes)} formatted nodes and {len(formatted_edges)} formatted edges")
        return response_data
    except Exception as e:
        import traceback
        print(f"Error processing graph data: {str(e)}")
        print(traceback.format_exc())
        raise