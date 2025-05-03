"""
Tests for the Map API endpoints in the v1 router.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import FastAPI, status
from httpx import AsyncClient
from uuid import UUID, uuid4
from typing import Dict, List, Optional, Set

from app import models, schemas
from app.api.v1.endpoints.map import (
    get_entity_repository, 
    get_entity_type_from_model,
    passes_filters,
    get_neighbor_ids,
    get_entity_internal
)


@pytest.fixture
def mock_user():
    """Create a mock user for testing."""
    return models.User(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        team_id=uuid4(),
        manager_id=uuid4(),
        tenant_id=uuid4(),
        is_active=True,
    )


@pytest.fixture
def mock_team(mock_user):
    """Create a mock team for testing."""
    return models.Team(
        id=uuid4(),
        name="Test Team",
        lead_id=mock_user.id,
        tenant_id=mock_user.tenant_id,
    )


@pytest.fixture
def mock_project(mock_team):
    """Create a mock project for testing."""
    return models.Project(
        id=uuid4(),
        name="Test Project",
        status="active",
        owning_team_id=mock_team.id,
        tenant_id=mock_team.tenant_id,
    )


@pytest.fixture
def mock_goal():
    """Create a mock goal for testing."""
    return models.Goal(
        id=uuid4(),
        name="Test Goal",
        status="in_progress",
        tenant_id=uuid4(),
    )


@pytest.fixture
def mock_db():
    """Create a mocked database session."""
    async_mock = AsyncMock()
    
    # Mock database execute
    async_mock.execute = AsyncMock()
    
    # For chaining in query results
    async_mock.execute.return_value.scalars = MagicMock()
    async_mock.execute.return_value.scalars.return_value.all = MagicMock(return_value=[])
    
    # Return the mocked session
    return async_mock


@pytest.mark.asyncio
async def test_get_entity_repository():
    """Test the get_entity_repository function."""
    from app.crud.crud_user import user as crud_user
    from app.crud.crud_team import team as crud_team
    from app.crud.crud_project import project as crud_project
    from app.crud.crud_goal import goal as crud_goal
    
    # Test valid entity types
    assert get_entity_repository(schemas.MapNodeTypeEnum.USER) == crud_user
    assert get_entity_repository(schemas.MapNodeTypeEnum.TEAM) == crud_team
    assert get_entity_repository(schemas.MapNodeTypeEnum.PROJECT) == crud_project
    assert get_entity_repository(schemas.MapNodeTypeEnum.GOAL) == crud_goal
    
    # Test unsupported entity type
    assert get_entity_repository(schemas.MapNodeTypeEnum.KNOWLEDGE_ASSET) is None


@pytest.mark.asyncio
async def test_get_entity_type_from_model(mock_user, mock_team, mock_project, mock_goal):
    """Test the get_entity_type_from_model function."""
    # Test valid entity models
    assert get_entity_type_from_model(mock_user) == schemas.MapNodeTypeEnum.USER
    assert get_entity_type_from_model(mock_team) == schemas.MapNodeTypeEnum.TEAM
    assert get_entity_type_from_model(mock_project) == schemas.MapNodeTypeEnum.PROJECT
    assert get_entity_type_from_model(mock_goal) == schemas.MapNodeTypeEnum.GOAL
    
    # Test unsupported model type
    class UnsupportedModel:
        pass
    
    assert get_entity_type_from_model(UnsupportedModel()) is None


@pytest.mark.asyncio
async def test_passes_filters(mock_user, mock_project, mock_goal):
    """Test the passes_filters function."""
    # Test no filters
    assert passes_filters(mock_user, schemas.MapNodeTypeEnum.USER) is True
    
    # Test type filter
    included_types = {schemas.MapNodeTypeEnum.USER, schemas.MapNodeTypeEnum.TEAM}
    assert passes_filters(mock_user, schemas.MapNodeTypeEnum.USER, included_types=included_types) is True
    assert passes_filters(mock_project, schemas.MapNodeTypeEnum.PROJECT, included_types=included_types) is False
    
    # Test status filter for Project
    included_statuses = {"active", "planning"}
    assert passes_filters(mock_project, schemas.MapNodeTypeEnum.PROJECT, included_statuses=included_statuses) is True
    
    # Modify status and test again
    mock_project.status = "completed"
    assert passes_filters(mock_project, schemas.MapNodeTypeEnum.PROJECT, included_statuses=included_statuses) is False
    
    # Test status filter for Goal
    assert passes_filters(mock_goal, schemas.MapNodeTypeEnum.GOAL, included_statuses={"in_progress"}) is True
    mock_goal.status = "completed"
    assert passes_filters(mock_goal, schemas.MapNodeTypeEnum.GOAL, included_statuses={"in_progress"}) is False
    
    # Test combined filters
    mock_goal.status = "in_progress"
    included_types = {schemas.MapNodeTypeEnum.GOAL, schemas.MapNodeTypeEnum.PROJECT}
    included_statuses = {"in_progress", "active"}
    assert passes_filters(mock_goal, schemas.MapNodeTypeEnum.GOAL, included_types, included_statuses) is True
    mock_goal.status = "completed"
    assert passes_filters(mock_goal, schemas.MapNodeTypeEnum.GOAL, included_types, included_statuses) is False


@pytest.mark.asyncio
async def test_get_entity_internal(mock_db, mock_user):
    """Test the get_entity_internal function."""
    # Setup mock repo get method
    mock_repo = AsyncMock()
    mock_repo.get = AsyncMock(return_value=mock_user)
    
    with patch('app.api.v1.endpoints.map.get_entity_repository', return_value=mock_repo):
        # Test successful entity retrieval
        result = await get_entity_internal(mock_user.id, schemas.MapNodeTypeEnum.USER, mock_db)
        assert result == mock_user
        mock_repo.get.assert_called_once_with(db=mock_db, id=mock_user.id)
        
        # Test non-existent entity
        mock_repo.get.reset_mock()
        mock_repo.get.return_value = None
        result = await get_entity_internal(uuid4(), schemas.MapNodeTypeEnum.USER, mock_db)
        assert result is None
        
        # Test invalid entity type
        with patch('app.api.v1.endpoints.map.get_entity_repository', return_value=None):
            result = await get_entity_internal(mock_user.id, schemas.MapNodeTypeEnum.KNOWLEDGE_ASSET, mock_db)
            assert result is None


@pytest.mark.asyncio
async def test_get_neighbor_ids_user(mock_db, mock_user):
    """Test get_neighbor_ids for a user node."""
    # Setup mocks
    user_id = mock_user.id
    manager_id = mock_user.manager_id
    team_id = mock_user.team_id
    
    # Mock direct reports
    report_ids = [uuid4(), uuid4()]
    mock_db.execute.return_value.scalars.return_value.all.return_value = report_ids
    
    # Mock project participation
    project_ids = [uuid4(), uuid4()]
    
    # Setup return values
    mock_get_entity = AsyncMock(return_value=mock_user)
    mock_get_neighbors = AsyncMock(return_value=None)
    mock_set_neighbors = AsyncMock()
    mock_get_participating_project_ids = AsyncMock(return_value=project_ids)
    
    with patch('app.api.v1.endpoints.map.get_entity_internal', mock_get_entity), \
         patch('app.api.v1.endpoints.map.get_neighbors', mock_get_neighbors), \
         patch('app.api.v1.endpoints.map.set_neighbors', mock_set_neighbors), \
         patch('app.crud.user.get_participating_project_ids', mock_get_participating_project_ids):
        
        # Call function
        result = await get_neighbor_ids(user_id, schemas.MapNodeTypeEnum.USER, mock_db)
        
        # Verify results
        assert manager_id in result["user"]
        assert team_id in result["team"]
        for report_id in report_ids:
            assert report_id in result["user"]
        for project_id in project_ids:
            assert project_id in result["project"]


@pytest.mark.asyncio
async def test_get_neighbor_ids_team(mock_db, mock_team):
    """Test get_neighbor_ids for a team node."""
    # Setup mocks
    team_id = mock_team.id
    lead_id = mock_team.lead_id
    
    # Mock team members
    member_ids = [uuid4(), uuid4()]
    
    # Mock owned projects
    project_ids = [uuid4(), uuid4()]
    
    # Setup return values
    mock_get_entity = AsyncMock(return_value=mock_team)
    mock_get_neighbors = AsyncMock(return_value=None)
    mock_set_neighbors = AsyncMock()
    mock_get_member_ids = AsyncMock(return_value=member_ids)
    mock_get_ids_by_owning_team = AsyncMock(return_value=project_ids)
    
    with patch('app.api.v1.endpoints.map.get_entity_internal', mock_get_entity), \
         patch('app.api.v1.endpoints.map.get_neighbors', mock_get_neighbors), \
         patch('app.api.v1.endpoints.map.set_neighbors', mock_set_neighbors), \
         patch('app.crud.team.get_member_ids', mock_get_member_ids), \
         patch('app.crud.project.get_ids_by_owning_team', mock_get_ids_by_owning_team):
        
        # Call function
        result = await get_neighbor_ids(team_id, schemas.MapNodeTypeEnum.TEAM, mock_db)
        
        # Verify results
        assert lead_id in result["user"]
        for member_id in member_ids:
            assert member_id in result["user"]
        for project_id in project_ids:
            assert project_id in result["project"]


@pytest.mark.asyncio
async def test_get_map_data_unauthorized(client: AsyncClient):
    """Test that unauthorized requests are rejected."""
    response = await client.get("/api/v1/map/data")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_get_map_data_basic(authenticated_client: AsyncClient, mock_user):
    """Test basic map data retrieval."""
    # Mock the database responses
    with patch('app.api.v1.endpoints.map.get_entity') as mock_get_entity, \
         patch('app.crud.user.get_participating_project_ids') as mock_get_proj_ids, \
         patch('app.crud.team.get_member_ids') as mock_get_members, \
         patch('app.crud.team.get') as mock_get_team, \
         patch('app.crud.project.get_ids_by_owning_team') as mock_owned_projects, \
         patch('app.crud.project.get_goal_ids_for_projects') as mock_goal_ids:
         
        # Configure mocks
        mock_get_entity.return_value = mock_user
        mock_get_proj_ids.return_value = []
        mock_get_members.return_value = []
        mock_get_team.return_value = None
        mock_owned_projects.return_value = []
        mock_goal_ids.return_value = []
        
        # Make request
        response = await authenticated_client.get("/api/v1/map/data")
        
        # Verify response
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "nodes" in data
        assert "edges" in data
        
        # The map should at least contain the current user
        user_nodes = [node for node in data["nodes"] if node["type"] == "USER"]
        assert len(user_nodes) > 0


@pytest.mark.asyncio
async def test_get_map_data_with_filters(authenticated_client: AsyncClient):
    """Test map data retrieval with type and status filters."""
    # Make request with filters
    response = await authenticated_client.get(
        "/api/v1/map/data?types=USER,TEAM&statuses=active,planning"
    )
    
    # Verify response
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Check that only USER and TEAM nodes are returned
    node_types = {node["type"] for node in data["nodes"]}
    assert node_types.issubset({"USER", "TEAM"})
    
    # Status filter would be applied in the backend, so we'd need to check
    # that projects and goals with non-matching statuses are filtered out


@pytest.mark.asyncio
async def test_get_map_data_invalid_type(authenticated_client: AsyncClient):
    """Test map data retrieval with invalid type filter."""
    response = await authenticated_client.get("/api/v1/map/data?types=USER,INVALID_TYPE")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Invalid node type" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_map_data_centered_view(authenticated_client: AsyncClient, mock_user, mock_team):
    """Test map data retrieval with centered view."""
    center_node_id = str(mock_user.id)
    
    # Mock the necessary functions
    with patch('app.api.v1.endpoints.map.get_entity') as mock_get_entity, \
         patch('app.api.v1.endpoints.map.get_neighbor_ids') as mock_get_neighbors:
        
        # Configure mocks
        mock_get_entity.return_value = mock_user
        mock_get_neighbors.return_value = {
            "user": {mock_user.manager_id},
            "team": {mock_team.id},
            "project": set(),
            "goal": set()
        }
        
        # Make request
        response = await authenticated_client.get(f"/api/v1/map/data?center_node_id={center_node_id}")
        
        # Verify response
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "nodes" in data
        assert "edges" in data
        
        # Verify that the center node and its neighbors are included
        node_ids = {node["id"] for node in data["nodes"]}
        assert center_node_id in node_ids
        assert str(mock_user.manager_id) in node_ids
        assert str(mock_team.id) in node_ids


@pytest.mark.asyncio
async def test_get_map_data_depth_two(authenticated_client: AsyncClient, mock_user, mock_team):
    """Test map data retrieval with depth=2."""
    center_node_id = str(mock_user.id)
    
    # Create some depth-2 neighbors
    depth2_user_id = uuid4()
    depth2_project_id = uuid4()
    
    # Mock the necessary functions
    with patch('app.api.v1.endpoints.map.get_entity') as mock_get_entity, \
         patch('app.api.v1.endpoints.map.get_neighbor_ids') as mock_get_neighbors:
        
        # Configure mocks
        mock_get_entity.return_value = mock_user
        
        # Setup depth-1 neighbors
        depth1_neighbors = {
            "user": {mock_user.manager_id},
            "team": {mock_team.id},
            "project": set(),
            "goal": set()
        }
        
        # Setup depth-2 neighbors
        depth2_neighbors = {
            "user": {depth2_user_id},
            "team": set(),
            "project": {depth2_project_id},
            "goal": set()
        }
        
        # Configure mock_get_neighbors to return different values based on inputs
        def get_neighbors_side_effect(*args, **kwargs):
            if args[0] == mock_user.id:
                return depth1_neighbors
            elif args[0] == mock_user.manager_id:
                return depth2_neighbors
            else:
                return {"user": set(), "team": set(), "project": set(), "goal": set()}
                
        mock_get_neighbors.side_effect = get_neighbors_side_effect
        
        # Make request
        response = await authenticated_client.get(f"/api/v1/map/data?center_node_id={center_node_id}&depth=2")
        
        # Verify response
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Verify that depth-1 and depth-2 neighbors are included
        node_ids = {node["id"] for node in data["nodes"]}
        assert center_node_id in node_ids
        assert str(mock_user.manager_id) in node_ids
        assert str(mock_team.id) in node_ids
        assert str(depth2_user_id) in node_ids
        assert str(depth2_project_id) in node_ids


@pytest.mark.asyncio
async def test_get_map_data_clustering(authenticated_client: AsyncClient, mock_user, mock_team):
    """Test map data retrieval with user clustering."""
    # Create team members to be clustered
    team_members = [
        models.User(id=uuid4(), name=f"Team Member {i}", team_id=mock_team.id) 
        for i in range(5)  # Create enough members to trigger clustering
    ]
    
    # Mock the necessary functions
    with patch('app.api.v1.endpoints.map.get_entity') as mock_get_entity, \
         patch('app.crud.team.get_member_ids') as mock_get_members:
        
        # Configure mocks
        def get_entity_side_effect(entity_id, crud_repo):
            if entity_id == mock_user.id:
                return mock_user
            elif entity_id == mock_team.id:
                return mock_team
            for member in team_members:
                if entity_id == member.id:
                    return member
            return None
            
        mock_get_entity.side_effect = get_entity_side_effect
        mock_get_members.return_value = [member.id for member in team_members]
        
        # Make request with clustering enabled
        response = await authenticated_client.get("/api/v1/map/data?cluster_teams=true")
        
        # Verify response
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Check if team cluster is created
        clusters = [node for node in data["nodes"] if node["type"] == "TEAM_CLUSTER"]
        assert len(clusters) > 0
        
        # Check member count in cluster data
        for cluster in clusters:
            if cluster["id"] == str(mock_team.id):
                assert cluster["data"]["memberCount"] >= 4  # MIN_MEMBERS_FOR_CLUSTER
        
        # Individual team members should not be present
        member_ids = {str(member.id) for member in team_members}
        node_ids = {node["id"] for node in data["nodes"]}
        assert not member_ids.intersection(node_ids)


@pytest.mark.asyncio
async def test_get_map_data_pagination(authenticated_client: AsyncClient):
    """Test map data retrieval with pagination."""
    # Make requests with different pagination parameters
    response1 = await authenticated_client.get("/api/v1/map/data?limit=10&page=1")
    response2 = await authenticated_client.get("/api/v1/map/data?limit=10&page=2")
    
    # Verify responses
    assert response1.status_code == status.HTTP_200_OK
    assert response2.status_code == status.HTTP_200_OK
    
    data1 = response1.json()
    data2 = response2.json()
    
    # Different pages should return different nodes
    # This is a basic check; in a real test we'd verify the exact pagination
    assert len(data1["nodes"]) <= 10
    assert len(data2["nodes"]) <= 10
    
    node_ids_page1 = {node["id"] for node in data1["nodes"]}
    node_ids_page2 = {node["id"] for node in data2["nodes"]}
    
    # Pages should not overlap in most cases
    # Note: This might not always be true if there aren't enough nodes
    overlap = node_ids_page1.intersection(node_ids_page2)
    assert len(overlap) < min(len(node_ids_page1), len(node_ids_page2))


@pytest.mark.asyncio
async def test_get_map_data_with_spatial_query(authenticated_client: AsyncClient):
    """Test map data retrieval with spatial query parameters."""
    # Mock the necessary functions
    with patch('app.crud.node.get_nodes_in_radius') as mock_get_nodes_in_radius:
        # Configure mock
        mock_get_nodes_in_radius.return_value = [
            MagicMock(id=uuid4(), type="user"),
            MagicMock(id=uuid4(), type="project")
        ]
        
        # Make request with spatial parameters
        response = await authenticated_client.get(
            "/api/v1/map/data?use_spatial=true&view_x=100&view_y=100&radius=50"
        )
        
        # Verify response
        assert response.status_code == status.HTTP_200_OK
        
        # Verify that spatial query was called
        mock_get_nodes_in_radius.assert_called_once()
        args, kwargs = mock_get_nodes_in_radius.call_args
        assert kwargs["center_x"] == 100
        assert kwargs["center_y"] == 100
        assert kwargs["radius"] == 50


@pytest.mark.asyncio
async def test_get_map_data_with_viewport(authenticated_client: AsyncClient):
    """Test map data retrieval with viewport parameters."""
    # Mock the necessary functions
    with patch('app.crud.node.get_nodes_in_viewport') as mock_get_nodes_in_viewport:
        # Configure mock
        mock_get_nodes_in_viewport.return_value = [
            MagicMock(id=uuid4(), type="user"),
            MagicMock(id=uuid4(), type="team")
        ]
        
        # Make request with viewport parameters
        response = await authenticated_client.get(
            "/api/v1/map/data?use_spatial=true&view_x=100&view_y=100&view_width=200&view_height=150"
        )
        
        # Verify response
        assert response.status_code == status.HTTP_200_OK
        
        # Verify that viewport query was called
        mock_get_nodes_in_viewport.assert_called_once()
        args, kwargs = mock_get_nodes_in_viewport.call_args
        assert kwargs["min_x"] == 0  # 100 - 200/2
        assert kwargs["min_y"] == 25  # 100 - 150/2
        assert kwargs["max_x"] == 200  # 100 + 200/2
        assert kwargs["max_y"] == 175  # 100 + 150/2