from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app.crud.crud_team import team as crud_team
from app.crud.crud_user import user as crud_user
from app.crud.crud_project import project as crud_project
from app.crud.crud_goal import goal as crud_goal
from app import models, schemas
from app.core import security
from app.core.permissions import user_can_view_team
from app.db.session import get_db_session

router = APIRouter()

@router.get("/{team_id}", response_model=schemas.TeamRead)
async def read_team(
    team_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user), # Ensure requester is authenticated
) -> models.Team:
    """Gets a specific team's details by its ID."""
    # TODO: Add authorization logic - should user be in the same tenant?
    team = await crud_team.get(db, id=team_id)
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    if not user_can_view_team(current_user, team):
        raise HTTPException(status_code=403, detail="User does not have permission to view this team")
    return team

# --- New Endpoint for Cluster Expansion --- 

@router.get("/{team_id}/expand", response_model=schemas.MapData)
async def expand_team_cluster(
    team_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user),
):
    """
    Fetches the Team node and its User member nodes for map expansion.
    Returns MapData containing only the team, its members, and MEMBER_OF edges.
    """
    team = await crud_team.get(db, id=team_id)
    if not team or not user_can_view_team(current_user, team):
        raise HTTPException(status_code=404, detail="Team not found or not authorized")

    members = await crud_user.get_multi_by_team_id(db=db, team_id=team_id, tenant_id=current_user.tenant_id)

    nodes: List[schemas.MapNode] = []
    edges: List[schemas.MapEdge] = []

    # Add Team node
    team_node_id_str = str(team.id)
    team_node_data = {
        "name": getattr(team, 'name', None), "title": getattr(team, 'title', None),
        "status": getattr(team, 'status', None), "type": getattr(team, 'type', None),
    }
    filtered_team_data = {k: v for k, v in team_node_data.items() if v is not None}
    nodes.append(schemas.MapNode(
        id=team_node_id_str,
        type=schemas.MapNodeTypeEnum.TEAM,
        label=getattr(team, 'name', team_node_id_str),
        data=filtered_team_data
    ))

    # Add User member nodes and MEMBER_OF edges
    for member in members:
        member_node_id_str = str(member.id)
        user_node_data = {
            "name": getattr(member, 'name', None), "title": getattr(member, 'title', None),
            "status": getattr(member, 'status', None), "type": getattr(member, 'type', None),
            "avatar_url": getattr(member, 'avatar_url', None),
            "team_id": getattr(member, 'team_id', None),
            "due_date": None, # Users don't have due dates
        }
        filtered_user_data = {k: v for k, v in user_node_data.items() if v is not None}
        nodes.append(schemas.MapNode(
            id=member_node_id_str,
            type=schemas.MapNodeTypeEnum.USER,
            label=getattr(member, 'name', member_node_id_str),
            data=filtered_user_data
        ))
        
        # Add edge from member to team
        edge_id = f"{member_node_id_str}_{schemas.MapEdgeTypeEnum.MEMBER_OF.value}_{team_node_id_str}"
        edges.append(schemas.MapEdge(
            id=edge_id,
            source=member_node_id_str,
            target=team_node_id_str,
            type=schemas.MapEdgeTypeEnum.MEMBER_OF
        ))

    return schemas.MapData(nodes=nodes, edges=edges)

# --- New Endpoints for Related Items --- 

@router.get("/{team_id}/projects", response_model=List[schemas.ProjectRead])
async def read_team_projects(
    team_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user),
):
    """Retrieve projects owned by a specific team."""
    # Verify team exists and is in the same tenant (optional but good practice)
    team = await crud_team.get(db, id=team_id)
    if not team or not user_can_view_team(current_user, team):
        raise HTTPException(status_code=404, detail="Team not found or not authorized")

    # Fetch projects using the CRUD function from crud_project
    projects = await crud_project.get_projects_by_team(
        db=db, team_id=team_id, tenant_id=current_user.tenant_id
    )
    return projects

@router.get("/{team_id}/goals", response_model=List[schemas.GoalReadMinimal])
async def read_team_goals(
    team_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user),
):
    """Retrieve goals linked to projects owned by a specific team."""
    # Verify team exists and is in the same tenant
    team = await crud_team.get(db, id=team_id)
    if not team or not user_can_view_team(current_user, team):
        raise HTTPException(status_code=404, detail="Team not found or not authorized")

    # Fetch goals using the CRUD function from crud_goal
    goals = await crud_goal.get_multi_by_owning_team(
        db=db, team_id=team_id, tenant_id=current_user.tenant_id
    )
    return goals # Pydantic will validate Row objects against GoalReadMinimal

# Add POST endpoint for creating teams later if needed 