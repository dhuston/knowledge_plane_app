from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload

from app.core.security import get_current_user
from app.db.session import get_db_session
from app.models import User, Team, Project, Goal, Department
# Import specific CRUD functions needed for fetching individual entities
from app.crud import crud_user, crud_project, crud_goal
from app.crud import crud_team as team_crud_module
# Assuming crud_department exists or will be added
from app.crud import crud_department

from app.schemas.map import MapData, MapNode, MapEdge, MapNodeTypeEnum, MapEdgeTypeEnum
# Import Read schemas for embedding data
from app.schemas.user import UserRead
from app.schemas.team import TeamRead
from app.schemas.project import ProjectRead
from app.schemas.goal import GoalRead
# Uncomment DepartmentRead import
from app.schemas.department import DepartmentRead

router = APIRouter()

# Helper function to transform entity to MapNode
async def _entity_to_map_node(entity: User | Team | Project | Goal | Department | None, node_type: MapNodeTypeEnum) -> Optional[MapNode]:
    if not entity:
        return None

    label = "Unknown"
    data_schema = None

    if node_type == MapNodeTypeEnum.USER and isinstance(entity, User):
        label = entity.name or entity.email
        data_schema = UserRead.from_orm(entity)
    elif node_type == MapNodeTypeEnum.TEAM and isinstance(entity, Team):
        label = entity.name
        data_schema = TeamRead.from_orm(entity)
    elif node_type == MapNodeTypeEnum.PROJECT and isinstance(entity, Project):
        label = entity.name
        data_schema = ProjectRead.from_orm(entity)
    elif node_type == MapNodeTypeEnum.GOAL and isinstance(entity, Goal):
        label = entity.title # Goal uses title
        data_schema = GoalRead.from_orm(entity)
    # Uncomment Department case
    elif node_type == MapNodeTypeEnum.DEPARTMENT and isinstance(entity, Department):
        label = entity.name
        data_schema = DepartmentRead.from_orm(entity)
    else:
        # Handle KNOWLEDGE_ASSET or unexpected types later
        return None # Or raise error?

    return MapNode(
        id=str(entity.id),
        type=node_type,
        label=label,
        data=data_schema.dict() if data_schema else {}
    )


async def fetch_map_data(
    db: AsyncSession,
    current_user: User
) -> MapData:
    nodes = []
    edges = []
    node_ids = set() # Keep track of added nodes to avoid duplicates

    tenant_id = current_user.tenant_id

    # --- Fetch Data --- 
    user_result = await db.execute(
        select(User)
        .options(joinedload(User.team).joinedload(Team.department), joinedload(User.manager))
        .where(User.id == current_user.id, User.tenant_id == tenant_id)
    )
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Add User Node
    user_node = await _entity_to_map_node(user, MapNodeTypeEnum.USER)
    if user_node and user_node.id not in node_ids:
        nodes.append(user_node)
        node_ids.add(user_node.id)

    # Add Manager Node and Edge
    if user.manager:
         manager_node = await _entity_to_map_node(user.manager, MapNodeTypeEnum.USER)
         if manager_node and manager_node.id not in node_ids:
            nodes.append(manager_node)
            node_ids.add(manager_node.id)
         # Edge always added if manager exists
         edges.append(MapEdge(
             id=f"{str(user.id)}_REPORTS_TO_{str(user.manager.id)}",
             source=str(user.id),
             target=str(user.manager.id),
             type=MapEdgeTypeEnum.REPORTS_TO
         ))

    # Add Team Node and Edge
    if user.team:
        team_node = await _entity_to_map_node(user.team, MapNodeTypeEnum.TEAM)
        if team_node and team_node.id not in node_ids:
            nodes.append(team_node)
            node_ids.add(team_node.id)
        edges.append(MapEdge(
            id=f"{str(user.id)}_MEMBER_OF_{str(user.team.id)}",
            source=str(user.id),
            target=str(user.team.id),
            type=MapEdgeTypeEnum.MEMBER_OF
        ))

        # Add Department Node and Edge (if team belongs to one)
        if user.team.department:
            dept_node = await _entity_to_map_node(user.team.department, MapNodeTypeEnum.DEPARTMENT)
            if dept_node and dept_node.id not in node_ids:
                nodes.append(dept_node)
                node_ids.add(dept_node.id)
            edges.append(MapEdge(
                id=f"{str(user.team.id)}_MEMBER_OF_{str(user.team.department.id)}",
                source=str(user.team.id),
                target=str(user.team.department.id),
                type=MapEdgeTypeEnum.MEMBER_OF
            ))

    # --- Fetch Projects (Example: owned by user or user's team) --- 
    # Fetch ALL projects for the tenant for now
    project_query = select(Project).options(joinedload(Project.goal)).where(Project.tenant_id == tenant_id)
    # Original logic filtering by team:
    # if user.team:
    #      project_query = project_query.where(
    #          Project.owning_team_id == user.team_id,
    #          Project.tenant_id == tenant_id
    #     )
    # else:
    #      project_query = project_query.where(False)

    project_result = await db.execute(project_query)
    projects = project_result.scalars().all()

    for proj in projects:
        proj_node = await _entity_to_map_node(proj, MapNodeTypeEnum.PROJECT)
        if proj_node and proj_node.id not in node_ids:
            nodes.append(proj_node)
            node_ids.add(proj_node.id)

        # Add Project Ownership Edge (Team)
        if proj.owning_team_id: # Only check owning_team_id
            # Ensure team node exists (might not if not user's team)
             if proj.owning_team_id not in node_ids:
                 team = await team_crud_module.team.get(db=db, id=proj.owning_team_id) 
                 team_node_proj = await _entity_to_map_node(team, MapNodeTypeEnum.TEAM)
                 if team_node_proj:
                     nodes.append(team_node_proj)
                     node_ids.add(team_node_proj.id)
                     
             if proj.owning_team_id in node_ids: # Add edge only if team node is present
                 edges.append(MapEdge(
                    id=f"{str(proj.owning_team_id)}_OWNS_{str(proj.id)}",
                    source=str(proj.owning_team_id),
                    target=str(proj.id),
                    type=MapEdgeTypeEnum.OWNS
                ))

        # Add Goal Node and Project Alignment Edge
        if proj.goal:
            goal_node = await _entity_to_map_node(proj.goal, MapNodeTypeEnum.GOAL)
            if goal_node and goal_node.id not in node_ids:
                nodes.append(goal_node)
                node_ids.add(goal_node.id)
            edges.append(MapEdge(
                id=f"{str(proj.id)}_ALIGNED_TO_{str(proj.goal.id)}",
                source=str(proj.id),
                target=str(proj.goal.id),
                type=MapEdgeTypeEnum.ALIGNED_TO
            ))
        elif proj.goal_id: # Goal might exist but wasn't fetched via project join
            if proj.goal_id not in node_ids:
                 goal = await crud_goal.get_goal(db=db, goal_id=proj.goal_id, tenant_id=tenant_id)
                 goal_node_proj = await _entity_to_map_node(goal, MapNodeTypeEnum.GOAL)
                 if goal_node_proj:
                     nodes.append(goal_node_proj)
                     node_ids.add(goal_node_proj.id)
                     
            if proj.goal_id in node_ids: # Add edge only if goal node is present
                 edges.append(MapEdge(
                    id=f"{str(proj.id)}_ALIGNED_TO_{str(proj.goal_id)}",
                    source=str(proj.id),
                    target=str(proj.goal_id),
                    type=MapEdgeTypeEnum.ALIGNED_TO
                ))

    # --- TODO: Fetch relevant Knowledge Assets --- 
    # --- TODO: Fetch other relevant Users (Team members, Project Participants) --- 
    # --- TODO: Fetch parent Goals if needed --- 

    return MapData(nodes=nodes, edges=edges)


@router.get("/data", response_model=MapData)
async def get_map_data_endpoint(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> MapData:
    """
    Retrieve nodes and edges representing the user's context for the Living Map.
    """
    map_data = await fetch_map_data(db, current_user)
    return map_data

# --- New Endpoint for Specific Node --- 

@router.get("/node/{node_type}/{node_id}", response_model=Optional[MapNode])
async def get_map_node(
    node_type: MapNodeTypeEnum, # Use the enum for validation
    node_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve the basic MapNode representation for a single entity by type and ID.
    Ensures the entity belongs to the user's tenant.
    """
    # Add Department back to type hint
    entity: User | Team | Project | Goal | Department | None = None
    tenant_id = current_user.tenant_id

    # Fetch the specific entity based on type
    if node_type == MapNodeTypeEnum.USER:
        entity = await crud_user.get(db=db, id=node_id)
        # Extra check: Ensure fetched user is in the same tenant
        if entity and entity.tenant_id != tenant_id:
             entity = None 
    elif node_type == MapNodeTypeEnum.TEAM:
        entity = await team_crud_module.team.get(db=db, id=node_id)
        if entity and entity.tenant_id != tenant_id:
             entity = None
    elif node_type == MapNodeTypeEnum.PROJECT:
        entity = await crud_project.get_project(db=db, project_id=node_id, tenant_id=tenant_id)
    elif node_type == MapNodeTypeEnum.GOAL:
        entity = await crud_goal.get_goal(db=db, goal_id=node_id, tenant_id=tenant_id)
    # Uncomment Department case
    elif node_type == MapNodeTypeEnum.DEPARTMENT:
        entity = await crud_department.get(db=db, id=node_id)
        # Add tenant check if crud_department.get doesn't handle it
        if entity and entity.tenant_id != tenant_id:
             entity = None
    else:
        # Handle KNOWLEDGE_ASSET or unknown types
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported node type: {node_type}")

    if not entity:
        # Return 404 if entity not found or tenant mismatch
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{node_type.value} node not found.")

    # Transform the fetched entity into a MapNode
    map_node = await _entity_to_map_node(entity, node_type)

    if not map_node:
         # Should not happen if entity was found, but safeguard
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to transform entity to map node.")

    return map_node 