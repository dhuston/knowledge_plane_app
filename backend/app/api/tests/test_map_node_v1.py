"""
Tests for the node endpoint in the v1 map router.
"""
import json
from uuid import uuid4, UUID
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import get_db_session
from app.core.security import get_current_user
from app import models, schemas, crud
from app.schemas import map as map_schemas

# Use the same test database as other map tests
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
async def setup_test_entities():
    """Setup test entities for node endpoint tests"""
    async with TestingSessionLocal() as session:
        # Create a tenant
        tenant = models.Tenant(
            id=UUID("00000000-0000-0000-0000-000000000001"),
            name="Test Tenant"
        )
        session.add(tenant)
        
        # Create a test user
        user = models.User(
            id=UUID("00000000-0000-0000-0000-000000000002"),
            tenant_id=tenant.id,
            email="node-test@example.com",
            name="Node Test User",
            is_active=True
        )
        session.add(user)
        
        # Create a test team
        team = models.Team(
            id=UUID("00000000-0000-0000-0000-000000000003"),
            tenant_id=tenant.id,
            name="Test Team"
        )
        session.add(team)
        
        # Create a test project
        project = models.Project(
            id=UUID("00000000-0000-0000-0000-000000000004"),
            tenant_id=tenant.id,
            name="Test Project",
            status="active"
        )
        session.add(project)
        
        # Create a test goal
        goal = models.Goal(
            id=UUID("00000000-0000-0000-0000-000000000005"),
            tenant_id=tenant.id,
            title="Test Goal",
            status="active"
        )
        session.add(goal)
        
        # Create a test department
        department = models.Department(
            id=UUID("00000000-0000-0000-0000-000000000006"),
            tenant_id=tenant.id,
            name="Test Department"
        )
        session.add(department)
        
        await session.commit()
        
        yield {
            "user_id": user.id,
            "team_id": team.id,
            "project_id": project.id,
            "goal_id": goal.id,
            "department_id": department.id
        }
        
        # Cleanup - delete all test entities
        await session.execute(f"DELETE FROM users WHERE id = '{user.id}'")
        await session.execute(f"DELETE FROM teams WHERE id = '{team.id}'")
        await session.execute(f"DELETE FROM projects WHERE id = '{project.id}'")
        await session.execute(f"DELETE FROM goals WHERE id = '{goal.id}'")
        await session.execute(f"DELETE FROM departments WHERE id = '{department.id}'")
        await session.execute(f"DELETE FROM tenants WHERE id = '{tenant.id}'")
        await session.commit()

@pytest.mark.asyncio
async def test_get_map_node_user(client, setup_test_entities):
    """Test getting a user node"""
    user_id = setup_test_entities["user_id"]
    
    response = client.get(
        f"/api/v1/map/node/USER/{user_id}"
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["id"] == str(user_id)
    assert data["type"] == "USER"
    assert data["label"] == "Node Test User"
    assert "data" in data
    assert data["data"]["name"] == "Node Test User"
    assert data["data"]["email"] == "node-test@example.com"

@pytest.mark.asyncio
async def test_get_map_node_team(client, setup_test_entities):
    """Test getting a team node"""
    team_id = setup_test_entities["team_id"]
    
    response = client.get(
        f"/api/v1/map/node/TEAM/{team_id}"
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["id"] == str(team_id)
    assert data["type"] == "TEAM"
    assert data["label"] == "Test Team"
    assert "data" in data
    assert data["data"]["name"] == "Test Team"

@pytest.mark.asyncio
async def test_get_map_node_project(client, setup_test_entities):
    """Test getting a project node"""
    project_id = setup_test_entities["project_id"]
    
    response = client.get(
        f"/api/v1/map/node/PROJECT/{project_id}"
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["id"] == str(project_id)
    assert data["type"] == "PROJECT"
    assert data["label"] == "Test Project"
    assert "data" in data
    assert data["data"]["name"] == "Test Project"
    assert data["data"]["status"] == "active"

@pytest.mark.asyncio
async def test_get_map_node_goal(client, setup_test_entities):
    """Test getting a goal node"""
    goal_id = setup_test_entities["goal_id"]
    
    response = client.get(
        f"/api/v1/map/node/GOAL/{goal_id}"
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["id"] == str(goal_id)
    assert data["type"] == "GOAL"
    assert data["label"] == "Test Goal"
    assert "data" in data
    assert data["data"]["title"] == "Test Goal"
    assert data["data"]["status"] == "active"

@pytest.mark.asyncio
async def test_get_map_node_department(client, setup_test_entities):
    """Test getting a department node"""
    department_id = setup_test_entities["department_id"]
    
    response = client.get(
        f"/api/v1/map/node/DEPARTMENT/{department_id}"
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["id"] == str(department_id)
    assert data["type"] == "DEPARTMENT"
    assert data["label"] == "Test Department"
    assert "data" in data
    assert data["data"]["name"] == "Test Department"

@pytest.mark.asyncio
async def test_get_map_node_not_found(client):
    """Test getting a node that doesn't exist"""
    non_existent_id = uuid4()
    
    response = client.get(
        f"/api/v1/map/node/USER/{non_existent_id}"
    )
    
    assert response.status_code == 404
    assert "detail" in response.json()
    assert "not found" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_map_node_invalid_type(client, setup_test_entities):
    """Test getting a node with invalid type"""
    user_id = setup_test_entities["user_id"]
    
    response = client.get(
        f"/api/v1/map/node/INVALID_TYPE/{user_id}"
    )
    
    assert response.status_code == 422  # Validation error

@pytest.mark.asyncio
async def test_get_map_node_unauthorized_tenant(client, setup_test_entities):
    """Test access is prevented for entities from other tenants"""
    # Mock override_get_current_user to return a user from a different tenant
    async def different_tenant_user():
        return models.User(
            id=UUID("00000000-0000-0000-0000-000000000009"),
            tenant_id=UUID("00000000-0000-0000-0000-000000000099"),  # Different tenant
            email="different@example.com",
            name="Different Tenant User",
            is_active=True
        )
    
    # Apply the mock
    app.dependency_overrides[get_current_user] = different_tenant_user
    
    # Try to access a node from the original tenant
    user_id = setup_test_entities["user_id"]
    response = client.get(
        f"/api/v1/map/node/USER/{user_id}"
    )
    
    # Restore the original override
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    assert response.status_code == 404  # Should return not found instead of unauthorized
    assert "detail" in response.json()
    assert "not found" in response.json()["detail"]