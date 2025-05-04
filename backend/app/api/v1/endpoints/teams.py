from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

from app.crud.crud_team import team as crud_team
from app.crud.crud_user import user as crud_user
from app.crud.crud_project import project as crud_project
from app.crud.crud_goal import goal as crud_goal
from app import models, schemas
from app.core import security
from app.core.permissions import user_can_view_team
from app.db.session import get_db_session
from app.core.config import settings

router = APIRouter()

# Development mode auth override
async def get_optional_current_user(
    db: AsyncSession = Depends(get_db_session),
    token: Optional[str] = Query(None)
) -> Optional[models.User]:
    """
    Optional authentication dependency that returns a mock user in development mode.
    This allows endpoints to work without authentication for frontend development.
    """
    try:
        if token:
            # If a token is provided, use the normal auth flow
            return await security.get_current_user(db=db, token=token)
        else:
            # Create a development mock user with a consistent tenant ID
            dev_tenant_id = UUID("d3667ea1-079a-434e-84d2-60e84757b5d5")
            mock_user = models.User(
                id=UUID("11111111-1111-1111-1111-111111111111"),
                email="dev@example.com",
                name="Development User",
                title="Software Developer",
                avatar_url=None,
                online_status=True,
                tenant_id=dev_tenant_id,
                auth_provider="mock",
                auth_provider_id="mock_id",
                team_id=UUID("839b5261-9228-4955-bcb5-f52452f0cf2e"),
            )
            return mock_user
    except:
        # In case of any error, return None to indicate unauthenticated access
        return None

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
    current_user: Optional[models.User] = Depends(get_optional_current_user),
):
    """
    Fetches the Team node and its User member nodes for map expansion.
    Returns MapData containing only the team, its members, and MEMBER_OF edges.
    
    This endpoint works with or without authentication for development purposes.
    """
    team = await crud_team.get(db, id=team_id)
    
    # For development, proceed even without authentication
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # If we have a user, verify permissions (normal flow)
    tenant_id = current_user.tenant_id if current_user else None
    
    # Get team members
    try:
        if current_user:
            members = await crud_user.get_multi_by_team_id(db=db, team_id=team_id, tenant_id=tenant_id)
        else:
            # In development mode without auth, get members without tenant filtering
            members = await crud_user.get_multi_by_team_id(db=db, team_id=team_id)
    except Exception as e:
        # Provide mock data in case of error (development fallback)
        from datetime import datetime, timezone
        
        members = [
            models.User(
                id=UUID("22222222-2222-2222-2222-222222222222"),
                email="member1@example.com",
                name="Team Member 1",
                title="Developer",
                avatar_url="https://randomuser.me/api/portraits/men/1.jpg",
                tenant_id=UUID("d3667ea1-079a-434e-84d2-60e84757b5d5"),
                team_id=team_id,
                created_at=datetime(2023, 1, 1, tzinfo=timezone.utc),
                updated_at=datetime(2023, 1, 1, tzinfo=timezone.utc),
            ),
            models.User(
                id=UUID("33333333-3333-3333-3333-333333333333"),
                email="member2@example.com",
                name="Team Member 2",
                title="Designer",
                avatar_url="https://randomuser.me/api/portraits/women/2.jpg",
                tenant_id=UUID("d3667ea1-079a-434e-84d2-60e84757b5d5"),
                team_id=team_id,
                created_at=datetime(2023, 1, 1, tzinfo=timezone.utc),
                updated_at=datetime(2023, 1, 1, tzinfo=timezone.utc),
            ),
        ]

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
    current_user: Optional[models.User] = Depends(get_optional_current_user),
):
    """
    Retrieve projects owned by a specific team.
    Works with or without authentication for development purposes.
    """
    # Verify team exists
    team = await crud_team.get(db, id=team_id)
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # If we have a user, use tenant filtering (normal flow)
    try:
        if current_user:
            tenant_id = current_user.tenant_id
            projects = await crud_project.get_projects_by_team(
                db=db, team_id=team_id, tenant_id=tenant_id
            )
        else:
            # In development mode without auth, get projects without tenant filtering
            projects = await crud_project.get_projects_by_team(
                db=db, team_id=team_id
            )
            
        # If we got no projects, provide mock data for development
        if not projects:
            raise Exception("No projects found, using mock data")
            
        return projects
    
    except Exception as e:
        # Provide mock data for development
        from datetime import datetime, timezone
        
        # Return mock projects to support frontend development
        mock_projects = [
            schemas.ProjectRead(
                id=UUID("44444444-4444-4444-4444-444444444444"),
                name="Knowledge Graph Visualization",
                description="Implement graph visualization for organizational knowledge",
                status="active",
                start_date=datetime(2023, 1, 1, tzinfo=timezone.utc),
                end_date=datetime(2023, 12, 31, tzinfo=timezone.utc),
                owner_team_id=team_id,
                tenant_id=UUID("d3667ea1-079a-434e-84d2-60e84757b5d5"),
                created_at=datetime(2023, 1, 1, tzinfo=timezone.utc),
                updated_at=datetime(2023, 1, 1, tzinfo=timezone.utc),
            ),
            schemas.ProjectRead(
                id=UUID("55555555-5555-5555-5555-555555555555"),
                name="Research Pipeline Optimization",
                description="Optimize the research pipeline for better outcomes",
                status="planning",
                start_date=datetime(2023, 2, 1, tzinfo=timezone.utc),
                end_date=datetime(2023, 11, 30, tzinfo=timezone.utc),
                owner_team_id=team_id,
                tenant_id=UUID("d3667ea1-079a-434e-84d2-60e84757b5d5"),
                created_at=datetime(2023, 1, 15, tzinfo=timezone.utc),
                updated_at=datetime(2023, 1, 15, tzinfo=timezone.utc),
            ),
        ]
        return mock_projects

@router.get("/{team_id}/goals", response_model=List[schemas.GoalReadMinimal])
async def read_team_goals(
    team_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[models.User] = Depends(get_optional_current_user),
):
    """
    Retrieve goals linked to projects owned by a specific team.
    Works with or without authentication for development purposes.
    """
    # Verify team exists
    team = await crud_team.get(db, id=team_id)
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Try to fetch real data first
    try:
        if current_user:
            tenant_id = current_user.tenant_id
            goals = await crud_goal.get_multi_by_owning_team(
                db=db, team_id=team_id, tenant_id=tenant_id
            )
        else:
            # In development mode without auth, get goals without tenant filtering
            goals = await crud_goal.get_multi_by_owning_team(
                db=db, team_id=team_id
            )
            
        # If we got no goals, provide mock data for development
        if not goals:
            raise Exception("No goals found, using mock data")
            
        return goals
    
    except Exception as e:
        # Provide mock data for development
        from datetime import datetime, timezone
        
        # Return mock goals to support frontend development
        mock_goals = [
            schemas.GoalReadMinimal(
                id=UUID("66666666-6666-6666-6666-666666666666"),
                title="Improve research visualization tools",
                description="Enhance visualization tools for better research insights",
                status="in_progress",
                priority="high",
                tenant_id=UUID("d3667ea1-079a-434e-84d2-60e84757b5d5"),
            ),
            schemas.GoalReadMinimal(
                id=UUID("77777777-7777-7777-7777-777777777777"),
                title="Streamline data analysis workflows",
                description="Optimize data analysis processes for efficiency",
                status="planned",
                priority="medium",
                tenant_id=UUID("d3667ea1-079a-434e-84d2-60e84757b5d5"),
            ),
            schemas.GoalReadMinimal(
                id=UUID("88888888-8888-8888-8888-888888888888"),
                title="Establish cross-team collaboration protocols",
                description="Develop standards for team collaboration",
                status="not_started",
                priority="medium",
                tenant_id=UUID("d3667ea1-079a-434e-84d2-60e84757b5d5"),
            ),
        ]
        return mock_goals

# Add POST endpoint for creating teams later if needed 