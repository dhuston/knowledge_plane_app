from fastapi.testclient import TestClient
import pytest
from unittest.mock import patch, MagicMock
import uuid
from app.main import app

client = TestClient(app)

# Mock user for authentication
mock_user_id = str(uuid.uuid4())
mock_tenant_id = str(uuid.uuid4())

# Mock authentication for protected endpoints
@pytest.fixture
def mock_auth():
    with patch("app.core.security.get_current_user") as mock_get_current_user:
        mock_user = MagicMock()
        mock_user.id = mock_user_id
        mock_user.tenant_id = mock_tenant_id
        mock_get_current_user.return_value = mock_user
        yield

# Mock database session for testing
@pytest.fixture
def mock_db():
    with patch("app.db.session.get_db_session") as mock_session:
        yield mock_session

def test_map_data_redirect():
    """Test that old map data endpoint correctly redirects to v1."""
    response = client.get("/map/data", allow_redirects=False)
    assert response.status_code == 307  # Temporary redirect for GET
    assert response.headers["location"].endswith("/api/v1/map/data")

def test_api_map_data_redirect():
    """Test that old API map data endpoint correctly redirects to v1."""
    response = client.get("/api/map/data", allow_redirects=False)
    assert response.status_code == 307  # Temporary redirect for GET
    assert response.headers["location"].endswith("/api/v1/map/data")

def test_map_node_redirect():
    """Test that old map node endpoint correctly redirects to v1."""
    node_type = "user"
    node_id = str(uuid.uuid4())
    response = client.get(f"/map/node/{node_type}/{node_id}", allow_redirects=False)
    assert response.status_code == 307  # Temporary redirect for GET
    assert response.headers["location"].endswith(f"/api/v1/map/node/{node_type}/{node_id}")

def test_api_map_node_redirect():
    """Test that old API map node endpoint correctly redirects to v1."""
    node_type = "user"
    node_id = str(uuid.uuid4())
    response = client.get(f"/api/map/node/{node_type}/{node_id}", allow_redirects=False)
    assert response.status_code == 307  # Temporary redirect for GET
    assert response.headers["location"].endswith(f"/api/v1/map/node/{node_type}/{node_id}")

def test_query_params_preserved_in_redirects():
    """Test that query parameters are preserved in redirects."""
    response = client.get("/map/data?types=user,team&depth=2", allow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"].endswith("/api/v1/map/data?types=user,team&depth=2")

@patch("app.api.v1.endpoints.map.get_current_user")
@patch("app.api.v1.endpoints.map.crud_node.get_nodes_in_viewport")
def test_v1_map_data_endpoint(mock_get_nodes, mock_get_current_user, mock_db):
    """Test that the v1 map data endpoint works correctly."""
    # Mock data to be returned
    mock_user = MagicMock()
    mock_user.id = mock_user_id
    mock_user.tenant_id = mock_tenant_id
    mock_user.manager_id = None
    mock_user.team_id = None
    mock_get_current_user.return_value = mock_user

    # Mock nodes returned from database
    mock_get_nodes.return_value = []
    
    # Call the endpoint
    response = client.get("/api/v1/map/data?use_spatial=true&view_x=0&view_y=0&view_width=100&view_height=100")
    
    # Check response
    assert response.status_code == 200
    assert "nodes" in response.json()
    assert "edges" in response.json()

@patch("app.api.v1.endpoints.map.get_current_user")
@patch("app.api.v1.endpoints.map.get_entity_repository")
def test_v1_map_node_endpoint(mock_get_repo, mock_get_current_user, mock_db):
    """Test that the v1 map node endpoint works correctly."""
    # Mock user for authentication
    mock_user = MagicMock()
    mock_user.id = mock_user_id
    mock_user.tenant_id = mock_tenant_id
    mock_get_current_user.return_value = mock_user
    
    # Mock repository and entity
    mock_repo = MagicMock()
    mock_entity = MagicMock()
    mock_entity.id = uuid.uuid4()
    mock_entity.name = "Test Node"
    mock_repo.get.return_value = mock_entity
    mock_get_repo.return_value = mock_repo
    
    # Call the endpoint
    node_type = "user"
    node_id = str(uuid.uuid4())
    response = client.get(f"/api/v1/map/node/{node_type}/{node_id}")
    
    # Check response
    assert response.status_code == 200
    assert response.json()["id"] == str(mock_entity.id)
    assert response.json()["type"] == node_type
    assert response.json()["label"] == mock_entity.name