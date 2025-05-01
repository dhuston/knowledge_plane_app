import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from uuid import UUID
import json
import os

# Mock the environment variables before importing app
with patch.dict(os.environ, {
    "OPENAI_API_KEY": "mock-api-key",
    "JWT_SECRET_KEY": "mock-jwt-secret-key",
    "JWT_ALGORITHM": "HS256",
    "JWT_ACCESS_TOKEN_EXPIRE_MINUTES": "60",
    "DATABASE_URL": "sqlite://"  # Use in-memory SQLite
}):
    from app.main import app
    from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture
def test_user_token():
    # Create a test user token
    return create_access_token(
        data={"sub": "test@example.com", "user_id": "user-123", "tenant_id": "tenant-456"}
    )

@pytest.fixture
def sample_map_data():
    return {
        "nodes": [
            {"id": "node-1", "type": "PERSON", "label": "John Smith", "tenant_id": "tenant-456"},
            {"id": "node-2", "type": "TEAM", "label": "Data Science", "tenant_id": "tenant-456"},
            {"id": "node-3", "type": "PROJECT", "label": "AI Integration", "tenant_id": "tenant-456"},
        ],
        "edges": [
            {"id": "edge-1", "source": "node-1", "target": "node-2", "label": "MEMBER_OF", "tenant_id": "tenant-456"},
            {"id": "edge-2", "source": "node-2", "target": "node-3", "label": "OWNS", "tenant_id": "tenant-456"},
        ]
    }

def test_get_map_data_endpoint(test_user_token, sample_map_data):
    with patch("app.api.deps.get_db") as mock_get_db:
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        
        with patch("app.api.map.get_map_data") as mock_get_map_data:
            mock_get_map_data.return_value = sample_map_data
            
            # Make API request
            response = client.get(
                "/api/map/data",
                headers={"Authorization": f"Bearer {test_user_token}"}
            )
            
            # Assert response
            assert response.status_code == 200
            data = response.json()
            assert "nodes" in data
            assert "edges" in data
            assert len(data["nodes"]) == 3
            assert len(data["edges"]) == 2
            
            # Verify the function was called with the right parameters
            mock_get_map_data.assert_called_once()
            args, kwargs = mock_get_map_data.call_args
            assert "tenant_id" in kwargs
            assert kwargs["tenant_id"] == "tenant-456"

def test_get_map_data_with_filters(test_user_token, sample_map_data):
    with patch("app.api.deps.get_db") as mock_get_db:
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        
        with patch("app.api.map.get_map_data") as mock_get_map_data:
            # Return filtered results
            filtered_data = {
                "nodes": [sample_map_data["nodes"][0], sample_map_data["nodes"][1]],  # Only PERSON and TEAM
                "edges": [sample_map_data["edges"][0]]  # Only MEMBER_OF edge
            }
            mock_get_map_data.return_value = filtered_data
            
            # Make API request with filters
            response = client.get(
                "/api/map/data?node_types=PERSON,TEAM&relationship_types=MEMBER_OF",
                headers={"Authorization": f"Bearer {test_user_token}"}
            )
            
            # Assert response
            assert response.status_code == 200
            data = response.json()
            assert len(data["nodes"]) == 2
            assert len(data["edges"]) == 1
            
            # Verify function called with correct filters
            mock_get_map_data.assert_called_once()
            args, kwargs = mock_get_map_data.call_args
            assert "node_types" in kwargs
            assert set(kwargs["node_types"]) == {"PERSON", "TEAM"}
            assert "relationship_types" in kwargs
            assert set(kwargs["relationship_types"]) == {"MEMBER_OF"}

def test_get_node_neighbors_endpoint(test_user_token):
    with patch("app.api.deps.get_db") as mock_get_db:
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        
        with patch("app.api.map.get_neighbor_ids") as mock_get_neighbor_ids:
            mock_get_neighbor_ids.return_value = ["node-2", "node-3"]
            
            # Make API request
            response = client.get(
                "/api/map/neighbors/node-1",
                headers={"Authorization": f"Bearer {test_user_token}"}
            )
            
            # Assert response
            assert response.status_code == 200
            data = response.json()
            assert "neighbor_ids" in data
            assert data["neighbor_ids"] == ["node-2", "node-3"]
            
            # Verify function called with correct parameters
            mock_get_neighbor_ids.assert_called_once()
            args, kwargs = mock_get_neighbor_ids.call_args
            assert args[1] == "node-1"  # Node ID
            assert kwargs["tenant_id"] == "tenant-456"

def test_unauthorized_access():
    # Make API request without token
    response = client.get("/api/map/data")
    
    # Assert unauthorized
    assert response.status_code == 401
    assert "detail" in response.json()
    assert "Not authenticated" in response.json()["detail"]