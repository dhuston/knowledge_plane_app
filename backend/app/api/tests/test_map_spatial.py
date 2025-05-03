"""
Tests for the map endpoint with spatial features.
"""
import json
import base64
from uuid import uuid4, UUID
import pytest
from fastapi.testclient import TestClient

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import event

from app.main import app
from app.db.session import get_db_session
from app.core.security import get_current_user
from app import models, schemas, crud
from app.schemas import map as map_schemas
from app.models.node import Node


# Test database setup
TEST_SQLALCHEMY_DATABASE_URL = "postgresql+asyncpg://postgres:password@localhost:5433/test_db"

engine = create_async_engine(TEST_SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)


# Test dependencies
async def override_get_db_session():
    """Dependency override for database session"""
    async with TestingSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def override_get_current_user():
    """Dependency override for current user"""
    return models.User(
        id=UUID("00000000-0000-0000-0000-000000000001"),
        tenant_id=UUID("00000000-0000-0000-0000-000000000001"),
        email="test@example.com",
        name="Test User",
        is_active=True
    )


app.dependency_overrides[get_db_session] = override_get_db_session
app.dependency_overrides[get_current_user] = override_get_current_user


@pytest.fixture(scope="module")
def client():
    """Create a test client"""
    with TestClient(app) as c:
        yield c


@pytest.fixture
async def setup_test_data():
    """Setup test data for map spatial tests"""
    async with TestingSessionLocal() as session:
        # Create a tenant
        tenant = models.Tenant(
            id=UUID("00000000-0000-0000-0000-000000000001"),
            name="Test Tenant"
        )
        session.add(tenant)
        
        # Create test nodes with spatial coordinates in different locations
        # Center node - coordinates (0, 0)
        center_node = Node(
            id=UUID("00000000-0000-0000-0000-000000000010"),
            tenant_id=tenant.id,
            type="center",
            x=0, 
            y=0
        )
        session.add(center_node)
        
        # Nodes within radius 100
        for i in range(5):
            node = Node(
                id=uuid4(),
                tenant_id=tenant.id,
                type="near",
                x=i*10, 
                y=i*10,
                props={"name": f"Near Node {i}"}
            )
            session.add(node)
        
        # Nodes outside radius 100 but within 500
        for i in range(5):
            node = Node(
                id=uuid4(),
                tenant_id=tenant.id,
                type="medium",
                x=i*50 + 150, 
                y=i*50 + 150,
                props={"name": f"Medium Node {i}"}
            )
            session.add(node)
        
        # Nodes far away (outside radius 500)
        for i in range(5):
            node = Node(
                id=uuid4(),
                tenant_id=tenant.id,
                type="far",
                x=i*200 + 800, 
                y=i*200 + 800,
                props={"name": f"Far Node {i}"}
            )
            session.add(node)
            
        await session.commit()
        
        yield
        
        # Cleanup - delete all test nodes
        await session.execute("DELETE FROM nodes WHERE tenant_id = '00000000-0000-0000-0000-000000000001'")
        await session.execute("DELETE FROM tenants WHERE id = '00000000-0000-0000-0000-000000000001'")
        await session.commit()


@pytest.mark.asyncio
async def test_map_spatial_query_with_radius(client, setup_test_data):
    """Test map endpoint with spatial query using radius"""
    response = client.get(
        "/api/v1/map/data",
        params={
            "use_spatial": "true",
            "view_x": 0,
            "view_y": 0,
            "radius": 100,
            "limit": 10
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check that we have nodes and they include position data
    assert "nodes" in data
    assert len(data["nodes"]) > 0
    
    # Check position data is included
    for node in data["nodes"]:
        if node["type"] == "center" or node["type"] == "near":
            assert "position" in node
            assert "x" in node["position"]
            assert "y" in node["position"]
    
    # Check that only nodes within radius 100 are returned
    node_count = len(data["nodes"])
    assert 1 <= node_count <= 6  # Center node + up to 5 near nodes


@pytest.mark.asyncio
async def test_map_spatial_query_with_viewport_bounds(client, setup_test_data):
    """Test map endpoint with spatial query using viewport bounds"""
    response = client.get(
        "/api/v1/map/data",
        params={
            "use_spatial": "true",
            "view_x": 200,
            "view_y": 200,
            "view_width": 400,
            "view_height": 400,
            "limit": 10
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check that nodes within viewport are returned
    node_types = [node["type"] for node in data["nodes"]]
    assert "medium" in node_types  # Medium distance nodes should be in this viewport


@pytest.mark.asyncio
async def test_map_spatial_query_with_pagination(client, setup_test_data):
    """Test map endpoint with spatial query and pagination"""
    # First page
    response = client.get(
        "/api/v1/map/data",
        params={
            "use_spatial": "true",
            "view_x": 0,
            "view_y": 0,
            "radius": 1000,
            "limit": 5
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check pagination metadata
    assert "pagination" in data
    assert data["pagination"]["has_more"] == True
    assert data["pagination"]["next_cursor"] is not None
    
    # Use cursor for next page
    next_cursor = data["pagination"]["next_cursor"]
    response2 = client.get(
        "/api/v1/map/data",
        params={
            "use_spatial": "true",
            "cursor": next_cursor,
        }
    )
    
    assert response2.status_code == 200
    data2 = response2.json()
    
    # Ensure we got different nodes in second page
    first_page_ids = {node["id"] for node in data["nodes"]}
    second_page_ids = {node["id"] for node in data2["nodes"]}
    assert len(first_page_ids.intersection(second_page_ids)) == 0


@pytest.mark.asyncio
async def test_map_data_with_spatial_caching(client, setup_test_data):
    """Test that spatial data is properly cached and retrieved"""
    # First request to populate cache
    response = client.get(
        "/api/v1/map/data",
        params={
            "use_spatial": "true",
            "view_x": 0,
            "view_y": 0,
            "radius": 100,
        }
    )
    
    assert response.status_code == 200
    
    # Second request should use cache
    response2 = client.get(
        "/api/v1/map/data",
        params={
            "use_spatial": "true",
            "view_x": 0,
            "view_y": 0,
            "radius": 100,
        }
    )
    
    assert response2.status_code == 200
    
    # Results should be consistent
    data1 = response.json()
    data2 = response2.json()
    
    assert len(data1["nodes"]) == len(data2["nodes"])
    
    # Node IDs should match
    ids1 = {node["id"] for node in data1["nodes"]}
    ids2 = {node["id"] for node in data2["nodes"]}
    assert ids1 == ids2